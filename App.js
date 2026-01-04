import React, { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import WebViewScreen from './src/screens/WebViewScreen';

const Tab = createBottomTabNavigator();

// Notification configuration
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function registerForPushNotificationsAsync() {
  let token;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    
    // Check if projectId is available in constants
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    if (!projectId) {
      console.log('Project ID not found in app.json');
      return;
    }
    
    token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    console.log('Push Token:', token);
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

export default function App() {
  const [expoPushToken, setExpoPushToken] = useState('');
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => setExpoPushToken(token));

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification Received:', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const url = response.notification.request.content.data?.url;
      if (url) {
        // Here you would ideally navigate to a specific screen or update the WebView
        // Since we have multiple tabs, we can't easily jump to a 'Url' tab unless we define one.
        // For now, let's just log it. In a real app, you might use a Linking.openURL or navigation.navigate
        console.log('Notification URL:', url);
      }
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;
              if (route.name === 'Home') {
                iconName = focused ? 'home' : 'home-outline';
              } else if (route.name === 'New') {
                iconName = focused ? 'sparkles' : 'sparkles-outline';
              } else if (route.name === 'Search') {
                iconName = focused ? 'search' : 'search-outline';
              } else if (route.name === 'Cart') {
                iconName = focused ? 'cart' : 'cart-outline';
              } else if (route.name === 'Account') {
                iconName = focused ? 'person' : 'person-outline';
              }
              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#565353',
            tabBarInactiveTintColor: 'gray',
            tabBarStyle: {
              backgroundColor: '#ffffff',
              borderTopWidth: 1,
              borderTopColor: '#f1f1f1',
              paddingBottom: Platform.OS === 'ios' ? 20 : 10,
              height: Platform.OS === 'ios' ? 90 : 65,
            },
            tabBarLabelStyle: {
              fontSize: 12,
              marginBottom: 5,
            }
          })}
        >
          <Tab.Screen 
            name="Home" 
            component={WebViewScreen} 
            initialParams={{ url: 'https://sowears.net/' }} 
          />
          <Tab.Screen 
            name="New" 
            component={WebViewScreen} 
            initialParams={{ url: 'https://sowears.net/collections/new-arrivals' }} 
          />
          <Tab.Screen 
            name="Search" 
            component={WebViewScreen} 
            initialParams={{ url: 'https://sowears.net/search' }} 
          />
          <Tab.Screen 
            name="Cart" 
            component={WebViewScreen} 
            initialParams={{ url: 'https://sowears.net/cart' }} 
          />
          <Tab.Screen 
            name="Account" 
            component={WebViewScreen} 
            initialParams={{ url: 'https://sowears.net/account' }} 
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
