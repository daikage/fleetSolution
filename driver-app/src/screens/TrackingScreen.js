import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Dimensions, Animated, AppState } from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LOCATION_TASK_NAME } from '../tasks/LocationTask';
import MapView, { Marker, Polyline } from 'react-native-maps';
import axios from 'axios';

const { width, height } = Dimensions.get('window');

export default function TrackingScreen({ navigation }) {
  const [isTracking, setIsTracking] = useState(false);
  const [vehicleId, setVehicleId] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationHistory, setLocationHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serverUrl, setServerUrl] = useState('');
  const [driverName, setDriverName] = useState('');
  const [vehicleInfo, setVehicleInfo] = useState('');
  const [hasActiveTrip, setHasActiveTrip] = useState(false);

  const locationSubscription = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const watchSubscription = useRef(null);
  const [lastSentLocation, setLastSentLocation] = useState(null);
  const enforceTimerRef = useRef(null);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    initializeApp();

    // Subscribe to app state changes to re-check tracking
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground - check if we should be tracking
        checkAndEnforceTracking();
      }
      appState.current = nextAppState;
    });

    // Set up periodic enforcement checks (every 30 seconds)
    enforceTimerRef.current = setInterval(() => {
      checkAndEnforceTracking();
    }, 30000);

    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
      if (watchSubscription.current) {
        watchSubscription.current.remove();
      }
      if (enforceTimerRef.current) {
        clearInterval(enforceTimerRef.current);
      }
      subscription.remove();
    };
  }, []);

  const initializeApp = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const vId = await AsyncStorage.getItem('vehicleId');
      const baseUrl = await AsyncStorage.getItem('API_BASE_URL');

      setServerUrl(baseUrl || '');
      if (vId) setVehicleId(vId);

      if (token && baseUrl) {
        // Fetch driver info
        const userResponse = await axios.get(`${baseUrl}/api/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDriverName(userResponse.data.name);

        // Check vehicle assignment
        const tripResponse = await axios.get(`${baseUrl}/api/driver/active-trip`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (tripResponse.data.vehicle_id) {
          setVehicleId(tripResponse.data.vehicle_id.toString());
          setHasActiveTrip(true);
          await AsyncStorage.setItem('vehicleId', tripResponse.data.vehicle_id.toString());

          // Auto-start tracking if not already tracking
          setTimeout(() => {
            autoStartTracking();
          }, 1000);
        }
      }
    } catch (error) {
      console.warn('Initialization error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check server if driver should be tracking and enforce it
  const checkAndEnforceTracking = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const baseUrl = await AsyncStorage.getItem('API_BASE_URL');
      if (!token || !baseUrl) return;

      const response = await axios.get(`${baseUrl}/api/driver/should-track`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.should_track) {
        setHasActiveTrip(true);

        if (response.data.vehicle_id) {
          setVehicleId(response.data.vehicle_id.toString());
          await AsyncStorage.setItem('vehicleId', response.data.vehicle_id.toString());
        }

        // If tracking is not active on server side, force-start it
        if (!response.data.is_tracking_active && !isTracking) {
          console.log('Server reports no recent pings - auto-starting tracking...');
          await autoStartTracking();
        }
      } else {
        setHasActiveTrip(false);
      }
    } catch (err) {
      console.warn('Enforcement check failed:', err);
    }
  };

  // Auto-start tracking silently (no alert on success)
  const autoStartTracking = async () => {
    if (isTracking) return; // Already tracking
    if (!vehicleId) return;

    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== 'granted') return;

    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    if (backgroundStatus !== 'granted') return;

    try {
      // Start background location task
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 5000,
        distanceInterval: 0,
        deferredUpdatesInterval: 0,
        deferredUpdatesDistance: 0,
        activityType: Location.ActivityType.AutomotiveNavigation,
        pausesUpdatesAutomatically: false,
        showsBackgroundLocationIndicator: true,
        foregroundService: {
          notificationTitle: 'FKG.Fleet Tracking',
          notificationBody: 'Live location tracking is active.',
          notificationColor: '#3B82F6',
        },
      });

      // Start foreground watch to update the map in real-time
      watchSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 3000,
          distanceInterval: 5,
        },
        (newLocation) => {
          const coords = newLocation.coords;
          setCurrentLocation(coords);

          // Append to location history for trail
          setLocationHistory((prev) => {
            const updated = [...prev, { latitude: coords.latitude, longitude: coords.longitude }];
            return updated.length > 200 ? updated.slice(-200) : updated;
          });

          // Send to server every 5 seconds (avoid flooding)
          const now = Date.now();
          setLastSentLocation((prev) => {
            if (!prev || now - prev.timestamp > 5000) {
              syncLocation(coords);
              return { timestamp: now };
            }
            return prev;
          });
        }
      );

      setIsTracking(true);
      startPulseAnimation();

      // Report status to server
      reportTrackingStatus(true);

      console.log('Auto-tracking started successfully');
    } catch (e) {
      console.warn("Could not auto-start tracking:", e);
    }
  };

  const syncLocation = async (coords) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const vId = await AsyncStorage.getItem('vehicleId');
      const baseUrl = await AsyncStorage.getItem('API_BASE_URL');

      if (!token || !vId || !baseUrl) return;

      const speedKmh = coords.speed && coords.speed > 0 ? coords.speed * 3.6 : 0;

      await axios.post(
        `${baseUrl}/api/telematics/location`,
        {
          vehicle_id: vId,
          latitude: coords.latitude,
          longitude: coords.longitude,
          speed: speedKmh,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        }
      );
    } catch (err) {
      console.warn('Failed to sync location:', err.message);
    }
  };

  const reportTrackingStatus = async (isActive) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const baseUrl = await AsyncStorage.getItem('API_BASE_URL');
      if (!token || !baseUrl) return;

      await axios.post(`${baseUrl}/api/driver/report-status`, {
        is_tracking: isActive,
        location_enabled: true,
        battery_optimization_disabled: true,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.warn('Failed to report status:', err);
    }
  };

  const startTracking = async () => {
    if (!vehicleId) {
      Alert.alert('No Vehicle', 'You are not assigned to an active trip. Ask your manager to assign you a vehicle.');
      return;
    }

    await autoStartTracking();
  };

  const stopTracking = async () => {
    try {
      // Stop the background task
      const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
      if (hasStarted) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      }

      // Stop the foreground watch
      if (watchSubscription.current) {
        watchSubscription.current.remove();
        watchSubscription.current = null;
      }

      setIsTracking(false);
      stopPulseAnimation();

      // Report status to server
      reportTrackingStatus(false);
    } catch (e) {
      console.warn('Error stopping tracking:', e);
    }
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopPulseAnimation = () => {
    pulseAnim.setValue(1);
  };

  const handleLogout = async () => {
    if (isTracking) {
      await stopTracking();
    }
    await AsyncStorage.multiRemove(['userToken', 'vehicleId', 'API_BASE_URL']);
    navigation.replace('Login');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Initializing...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        style={styles.map}
        initialRegion={currentLocation ? {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        } : {
          latitude: 6.5244,
          longitude: 3.3792,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={true}
        showsMyLocationButton={true}
        mapType="standard"
      >
        {currentLocation && (
          <Marker
            coordinate={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            }}
            title="Your Location"
            description={isTracking ? 'Tracking Active' : 'Tracking Inactive'}
          >
            <Animated.View style={[
              styles.markerContainer,
              { transform: [{ scale: pulseAnim }] }
            ]}>
              <View style={styles.markerOuter}>
                <View style={styles.markerInner} />
              </View>
            </Animated.View>
          </Marker>
        )}

        {/* Location History Trail */}
        {locationHistory.length > 1 && (
          <Polyline
            coordinates={locationHistory}
            strokeColor="#3B82F6"
            strokeWidth={3}
            lineDashPattern={[1, 0]}
          />
        )}
      </MapView>

      {/* Top Info Card */}
      <View style={styles.topCard}>
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, isTracking && styles.statusDotActive]} />
          <Text style={styles.statusText}>
            {isTracking ? 'LIVE TRACKING' : 'INACTIVE'}
          </Text>
        </View>
        {hasActiveTrip && (
          <View style={styles.tripBadge}>
            <Text style={styles.tripBadgeText}>TRIP ASSIGNED</Text>
          </View>
        )}
        <TouchableOpacity onPress={() => navigation.navigate('ChatList')} style={styles.chatButton}>
          <Text style={styles.chatText}>Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Info Panel */}
      <View style={styles.bottomPanel}>
        {/* Driver Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Driver</Text>
          <Text style={styles.infoValue}>{driverName || 'Unknown'}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Vehicle ID</Text>
          <Text style={styles.infoValue}>{vehicleId || 'Not Assigned'}</Text>
        </View>

        {/* Location Points Count */}
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Trail Points</Text>
          <Text style={styles.infoValue}>{locationHistory.length}</Text>
        </View>

        {/* Speed Display */}
        {currentLocation && (
          <View style={styles.speedCard}>
            <Text style={styles.speedLabel}>Current Speed</Text>
            <Text style={styles.speedValue}>
              {currentLocation.speed ? Math.round(currentLocation.speed * 3.6) : 0}
            </Text>
            <Text style={styles.speedUnit}>km/h</Text>
          </View>
        )}

        {/* Action Button */}
        <TouchableOpacity
          style={[styles.actionButton, isTracking ? styles.actionButtonStop : styles.actionButtonStart]}
          onPress={isTracking ? stopTracking : startTracking}
          activeOpacity={0.8}
        >
          <Text style={styles.actionButtonText}>
            {isTracking ? 'Stop Tracking' : 'Start Tracking'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  loadingText: {
    color: '#9CA3AF',
    marginTop: 16,
    fontSize: 14,
  },
  map: {
    width: width,
    height: height,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerOuter: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#3B82F6',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  topCard: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6B7280',
    marginRight: 8,
  },
  statusDotActive: {
    backgroundColor: '#10B981',
  },
  statusText: {
    color: '#F9FAFB',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  tripBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tripBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  logoutButton: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
  },
  chatButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginLeft: 10,
    marginRight: 10,
  },
  chatText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  bottomPanel: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  infoCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 14,
    color: '#F9FAFB',
    fontWeight: '600',
  },
  speedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  speedLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginRight: 8,
  },
  speedValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#3B82F6',
    marginHorizontal: 8,
  },
  speedUnit: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  actionButton: {
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  actionButtonStart: {
    backgroundColor: '#10B981',
  },
  actionButtonStop: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});