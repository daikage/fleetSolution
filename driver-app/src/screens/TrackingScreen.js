import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LOCATION_TASK_NAME } from '../tasks/LocationTask';

export default function TrackingScreen({ navigation }) {
  const [isTracking, setIsTracking] = useState(false);
  const [vehicleId, setVehicleId] = useState(null);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    const id = await AsyncStorage.getItem('vehicleId');
    if (id) setVehicleId(id);

    const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    setIsTracking(hasStarted);
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
    if (!vehicleId) {
      Alert.alert('No Vehicle', 'You are not assigned to an active trip. Cannot track location.');
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
  };

  const stopTracking = async () => {
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    if (hasStarted) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      setIsTracking(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Live Tracker</Text>
      
      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>Vehicle ID:</Text>
        <Text style={styles.statusValue}>{vehicleId || 'None (No Active Trip)'}</Text>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  statusCard: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusLabel: {
    fontSize: 16,
    color: '#6c757d',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  button: {
    width: '100%',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
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
    marginTop: 30,
    padding: 10,
  },
  logoutText: {
    color: '#dc3545',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
