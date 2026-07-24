import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LOCATION_TASK_NAME } from '../tasks/LocationTask';
import MapView, { Marker } from 'react-native-maps';
import axios from 'axios';

export default function TrackingScreen({ navigation }) {
  const [isTracking, setIsTracking] = useState(false);
  const [vehicleId, setVehicleId] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationSubscription, setLocationSubscription] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    checkStatus();
    getInitialLocation();
    
    return () => {
       if (locationSubscription) {
           locationSubscription.remove();
       }
    };
  }, []);

  const getInitialLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setCurrentLocation(loc.coords);
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }, 1000);
        }
        
        // Instantly sync the exact initial location to the backend map
        try {
          const token = await AsyncStorage.getItem('userToken');
          const vId = await AsyncStorage.getItem('vehicleId');
          const baseUrl = await AsyncStorage.getItem('API_BASE_URL');
          if (token && vId && baseUrl) {
              await axios.post(`${baseUrl}/api/telematics/location`, {
                  vehicle_id: vId,
                  latitude: loc.coords.latitude,
                  longitude: loc.coords.longitude,
                  speed: 0
              }, {
                  headers: { Authorization: `Bearer ${token}` }
              });
          }
        } catch (err) {
          console.warn("Failed to sync initial location", err);
        }
      }
    } catch (e) {
      console.warn('getInitialLocation error:', e.message);
    }
  };

  const checkStatus = async () => {
    try {
      const id = await AsyncStorage.getItem('vehicleId');
      if (id) setVehicleId(id);

      const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
      setIsTracking(hasStarted);
      
      if (hasStarted) {
        startForegroundTracking();
      }
    } catch (e) {
      // hasStartedLocationUpdatesAsync throws if the task hasn't been registered yet
      // This is expected on first launch - just default to not tracking
      console.warn('checkStatus error (expected on first launch):', e.message);
      setIsTracking(false);
    }
  };

  const startForegroundTracking = async () => {
    if (locationSubscription) return;
    try {
      const sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 2000,
          distanceInterval: 1,
        },
        (newLocation) => {
          setCurrentLocation(newLocation.coords);
          if (mapRef.current && newLocation.coords) {
             mapRef.current.animateToRegion({
                latitude: newLocation.coords.latitude,
                longitude: newLocation.coords.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
             }, 1000);
          }
        }
      );
      setLocationSubscription(sub);
    } catch (e) {
      console.warn("Could not start foreground tracking", e);
    }
  };

  const stopForegroundTracking = () => {
    if (locationSubscription) {
      locationSubscription.remove();
      setLocationSubscription(null);
    }
  };

  const handleLogout = async () => {
    if (isTracking) {
      await stopTracking();
    }
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('vehicleId');
    navigation.replace('Login');
  };

  const startTracking = async () => {
    // Re-fetch vehicle assignment in case a trip was created after login
    let currentVehicleId = vehicleId;
    if (!currentVehicleId) {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const baseUrl = await AsyncStorage.getItem('API_BASE_URL');
        if (token && baseUrl) {
          const response = await axios.get(`${baseUrl}/api/user`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const userId = response.data.id;

          // Check for active trip via a dedicated endpoint
          const tripResponse = await axios.get(`${baseUrl}/api/driver/active-trip`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (tripResponse.data.vehicle_id) {
            currentVehicleId = tripResponse.data.vehicle_id.toString();
            setVehicleId(currentVehicleId);
            await AsyncStorage.setItem('vehicleId', currentVehicleId);
          }
        }
      } catch (err) {
        console.warn('Failed to re-fetch vehicle assignment:', err.message);
      }
    }

    if (!currentVehicleId) {
      Alert.alert('No Vehicle', 'You are not assigned to an active trip. Ask your manager to assign you a vehicle first.');
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
        notificationTitle: 'Fleet Tracking',
        notificationBody: 'Live location tracking is active.',
        notificationColor: '#007bff',
      },
    });

    setIsTracking(true);
    startForegroundTracking();
  };

  const stopTracking = async () => {
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    if (hasStarted) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      setIsTracking(false);
      stopForegroundTracking();
    }
  };

  return (
    <View style={styles.container}>
      <MapView 
        ref={mapRef}
        style={styles.map}
        initialRegion={currentLocation ? {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        } : {
          latitude: 0,
          longitude: 0,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={false} 
      >
        {currentLocation && (
          <Marker 
            coordinate={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude
            }}
            title="You are here"
            pinColor="#007bff"
          />
        )}
      </MapView>

      <View style={styles.overlayPanel}>
        <View style={styles.header}>
          <Text style={styles.title}>Live Tracker</Text>
        </View>
        
        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Vehicle ID:</Text>
          <Text style={styles.statusValue}>{vehicleId || 'None'}</Text>
        </View>

        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Tracking Status:</Text>
          <Text style={[styles.statusValue, { color: isTracking ? '#28a745' : '#dc3545' }]}>
            {isTracking ? 'ACTIVE' : 'INACTIVE'}
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.button, isTracking ? styles.buttonStop : styles.buttonStart]} 
          onPress={isTracking ? stopTracking : startTracking}
        >
          <Text style={styles.buttonText}>
            {isTracking ? 'Stop Tracking' : 'Start Tracking'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  statusCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f1',
  },
  statusLabel: {
    fontSize: 15,
    color: '#6c757d',
  },
  statusValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  button: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonStart: {
    backgroundColor: '#28a745',
  },
  buttonStop: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  logoutButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  logoutText: {
    color: '#dc3545',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
