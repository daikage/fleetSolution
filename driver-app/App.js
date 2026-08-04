import React, { useEffect, useState, useRef } from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';
import * as Notifications from 'expo-notifications';

import LoginScreen from './src/screens/LoginScreen';
import TrackingScreen from './src/screens/TrackingScreen';
import ChatListScreen from './src/screens/ChatListScreen';
import ChatScreen from './src/screens/ChatScreen';

// Ensure TaskManager task is registered early
import './src/tasks/LocationTask';

const Stack = createNativeStackNavigator();
export const navigationRef = createNavigationContainerRef();

// Configure notifications to show when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const responseListener = useRef();

  useEffect(() => {
    // Check if user is already logged in
    const checkLoginStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        setUserToken(token);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    checkLoginStatus();

    // Listen for notification taps
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      if (data?.type === 'chat_message' && data?.sender_id) {
        // Wait for navigation container to be ready
        if (navigationRef.isReady()) {
          navigationRef.navigate('Chat', {
            user: {
              id: data.sender_id,
              name: data.sender_name || 'User',
            }
          });
        }
      }
    });

    return () => {
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator initialRouteName={userToken ? 'Tracking' : 'Login'}>
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Tracking" 
          component={TrackingScreen} 
          options={{ title: 'Fleet Driver', headerBackVisible: false }} 
        />
        <Stack.Screen 
          name="ChatList" 
          component={ChatListScreen} 
          options={{ title: 'Messages' }} 
        />
        <Stack.Screen 
          name="Chat" 
          component={ChatScreen} 
          options={({ route }) => ({ title: route.params.user.name })} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
