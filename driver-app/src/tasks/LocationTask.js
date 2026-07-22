import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export const LOCATION_TASK_NAME = 'background-location-task';

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('Task Manager Error:', error);
    return;
  }

  if (data) {
    const { locations } = data;
    if (!locations || locations.length === 0) return;

    try {
      const token = await AsyncStorage.getItem('userToken');
      const vehicleId = await AsyncStorage.getItem('vehicleId');
      const baseUrl = await AsyncStorage.getItem('API_BASE_URL');

      if (!token || !vehicleId || !baseUrl) return;

      const latestLocation = locations[locations.length - 1];
      const { latitude, longitude, speed } = latestLocation.coords;

      // Ensure speed is in km/h if it's provided in m/s by Expo
      const speedKmh = speed && speed > 0 ? speed * 3.6 : 0;

      await axios.post(
        `${baseUrl}/api/telematics/location`,
        {
          vehicle_id: vehicleId,
          latitude: latitude,
          longitude: longitude,
          speed: speedKmh,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      console.log(`Sent location for vehicle ${vehicleId}: ${latitude}, ${longitude}`);
    } catch (err) {
      console.error('Failed to post location to backend:', err.response?.data || err.message);
    }
  }
});
