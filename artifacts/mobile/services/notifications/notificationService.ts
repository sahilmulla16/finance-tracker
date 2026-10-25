import { Platform } from 'react-native';
import { setNotificationHandler } from 'expo-notifications/build/NotificationsHandler';
import setNotificationChannelAsync from 'expo-notifications/build/setNotificationChannelAsync';
import { AndroidImportance } from 'expo-notifications/build/NotificationChannelManager.types';
import {
  getPermissionsAsync,
  requestPermissionsAsync,
} from 'expo-notifications/build/NotificationPermissions';
import { PermissionStatus } from 'expo-modules-core';
import scheduleNotificationAsync from 'expo-notifications/build/scheduleNotificationAsync';
import {
  AndroidNotificationPriority,
  NotificationTriggerInput,
} from 'expo-notifications/build/Notifications.types';
import cancelScheduledNotificationAsync from 'expo-notifications/build/cancelScheduledNotificationAsync';
import cancelAllScheduledNotificationsAsync from 'expo-notifications/build/cancelAllScheduledNotificationsAsync';
import { addNotificationResponseReceivedListener } from 'expo-notifications/build/NotificationsEmitter';
import {
  NotificationChannelId,
  NotificationPayload,
} from './notificationTypes';

let isHandlerConfigured = false;

/**
 * Configure foreground notification behavior.
 * Safe to call multiple times.
 */
export function initNotificationHandler(): void {
  if (isHandlerConfigured) return;
  try {
    setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    isHandlerConfigured = true;
  } catch (error) {
    console.warn('[NotificationService] Failed to set notification handler:', error);
  }
}

/**
 * Configure Android notification channels for Zeno.
 */
export async function setupAndroidNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;

  try {
    await setNotificationChannelAsync('budget_alerts', {
      name: 'Budget Alerts',
      description: 'Alerts when your spending reaches 80% or 100% of a budget limit.',
      importance: AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#B7FF63',
      sound: 'default',
      showBadge: true,
    });

    await setNotificationChannelAsync('spending_summaries', {
      name: 'Spending Summaries',
      description: 'Daily and monthly expense summaries and daily spending limit warnings.',
      importance: AndroidImportance.DEFAULT,
      lightColor: '#B7FF63',
      sound: 'default',
      showBadge: true,
    });

    await setNotificationChannelAsync('financial_insights', {
      name: 'Financial Insights',
      description: 'Weekly financial trends, money recaps, and spending observations.',
      importance: AndroidImportance.DEFAULT,
      lightColor: '#B7FF63',
      sound: 'default',
      showBadge: false,
    });
  } catch (error) {
    console.warn('[NotificationService] Failed to setup Android channels:', error);
  }
}

/**
 * Get current system notification permission status.
 */
export async function getNotificationPermissionStatus(): Promise<{
  granted: boolean;
  canAskAgain: boolean;
  status: PermissionStatus;
}> {
  try {
    const settings = await getPermissionsAsync();
    return {
      granted: settings.granted || settings.status === PermissionStatus.GRANTED,
      canAskAgain: settings.canAskAgain,
      status: settings.status,
    };
  } catch {
    return {
      granted: false,
      canAskAgain: true,
      status: PermissionStatus.UNDETERMINED,
    };
  }
}

/**
 * Request system notification permission honestly.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const { status: existingStatus } = await getPermissionsAsync();
    if (existingStatus === PermissionStatus.GRANTED) {
      return true;
    }

    const { status } = await requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });

    return status === PermissionStatus.GRANTED;
  } catch (error) {
    console.warn('[NotificationService] Error requesting notification permissions:', error);
    return false;
  }
}

/**
 * Send an immediate local notification.
 */
export async function sendImmediateNotification(options: {
  title: string;
  body: string;
  channelId: NotificationChannelId;
  payload: NotificationPayload;
}): Promise<string | null> {
  try {
    initNotificationHandler();
    const id = await scheduleNotificationAsync({
      content: {
        title: options.title,
        body: options.body,
        data: options.payload,
        sound: true,
        priority: AndroidNotificationPriority.HIGH,
        color: '#B7FF63',
      },
      trigger: {
        channelId: options.channelId,
      },
    });
    return id;
  } catch (error) {
    console.warn('[NotificationService] Failed to send immediate notification:', error);
    return null;
  }
}

/**
 * Schedule a local notification (e.g. daily, weekly, or specific future time).
 */
export async function scheduleLocalNotification(options: {
  identifier?: string;
  title: string;
  body: string;
  channelId: NotificationChannelId;
  payload: NotificationPayload;
  trigger: NotificationTriggerInput;
}): Promise<string | null> {
  try {
    initNotificationHandler();
    const id = await scheduleNotificationAsync({
      identifier: options.identifier,
      content: {
        title: options.title,
        body: options.body,
        data: options.payload,
        sound: true,
        color: '#B7FF63',
      },
      trigger: {
        ...options.trigger,
        channelId: options.channelId,
      } as any,
    });
    return id;
  } catch (error) {
    console.warn('[NotificationService] Failed to schedule notification:', error);
    return null;
  }
}

/**
 * Cancel a scheduled notification by identifier.
 */
export async function cancelNotification(identifier: string): Promise<void> {
  try {
    await cancelScheduledNotificationAsync(identifier);
  } catch (error) {
    console.warn(`[NotificationService] Failed to cancel notification ${identifier}:`, error);
  }
}

/**
 * Cancel all pending scheduled notifications.
 */
export async function cancelAllScheduledNotifications(): Promise<void> {
  try {
    await cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.warn('[NotificationService] Failed to cancel all notifications:', error);
  }
}

/**
 * Setup notification response listener to handle taps.
 * Returns an unsubscribe cleanup function.
 */
export function setupNotificationResponseListener(
  onResponse: (payload: NotificationPayload) => void
): () => void {
  const subscription = addNotificationResponseReceivedListener(
    (response) => {
      try {
        const data = response.notification.request.content.data as NotificationPayload;
        if (data && data.route) {
          onResponse(data);
        }
      } catch (err) {
        console.warn('[NotificationService] Error handling notification response:', err);
      }
    }
  );

  return () => {
    subscription.remove();
  };
}
