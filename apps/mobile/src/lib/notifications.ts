import { Platform } from 'react-native';
import { api } from './api';

// Push notification setup for Expo
// expo-notifications is optional — works without it on web

let Notifications: any = null;
let Device: any = null;

async function loadModules() {
  try {
    Notifications = require('expo-notifications');
    Device = require('expo-device');
  } catch {
    // Modules not installed — skip push setup
  }
}

export async function registerForPushNotifications(): Promise<string | null> {
  await loadModules();

  // Skip on web or if modules not available
  if (Platform.OS === 'web' || !Notifications || !Device) {
    return null;
  }

  // Must be on a physical device
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  try {
    // Check permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission denied');
      return null;
    }

    // Get Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;

    // Register with backend
    try {
      await api('/notifications/push-token', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });
    } catch (err) {
      console.error('Failed to register push token:', err);
    }

    // Configure notification behavior
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    return token;
  } catch (err) {
    console.error('Push notification setup failed:', err);
    return null;
  }
}

export function addNotificationResponseListener(
  handler: (bookingId?: string) => void,
) {
  if (!Notifications) return { remove: () => {} };

  return Notifications.addNotificationResponseReceivedListener(
    (response: any) => {
      const data = response.notification?.request?.content?.data;
      if (data?.bookingId) {
        handler(data.bookingId);
      }
    },
  );
}
