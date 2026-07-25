import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Dimensions, Animated } from 'react-native';
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

  const locationSubscription = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    initializeApp();
    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
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
          await AsyncStorage.setItem('vehicleId', tripResponse.data.vehicle_id.toString());
        }
      }
    } catch (error) {
      console.warn('Initialization error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitialLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Foreground location permission is required.');
        return;
      }

      let loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });
      setCurrentLocation(loc.coords);

      // Sync initial location
      await syncLocation(loc.coords);
    } catch (e) {
      console.warn('getInitialLocation error:', e.message);
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

  const startTracking = async () => {
    if (!vehicleId) {
      Alert.alert('No Vehicle', 'You are not assigned to an active trip. Ask your manager to assign you a vehicle.');
      return;
    }

    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== 'granted') {
      Alert.alert('Permission Denied', 'Foreground location permission is required.');
      return;
    }

    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    if (backgroundStatus !== 'granted') {
      Alert.alert('Permission Denied', 'Background location permission is required for live tracking.');
      return;
    }

    try {
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

      // Get initial location
      await getInitialLocation();
      setIsTracking(true);
      startPulseAnimation();
    } catch (e) {
      console.warn("Could not start tracking:", e);
      Alert.alert('Error', 'Failed to start tracking. Please try again.');
    }
  };

  const stopTracking = async () => {
    try {
      const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
      if (hasStarted) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
        setIsTracking(false);
        stopPulseAnimation();
      }
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
            coordinates={locationHistory.map(loc => ({
              latitude: loc.latitude,
              longitude: loc.longitude,
            }))}
            strokeColor="#3B82F6"
            strokeWidth={3}
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