import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  NotificationDeduplicationState,
  NotificationPreferences,
  NOTIFICATION_STORAGE_KEYS,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from './notificationTypes';
import {
  scheduleLocalNotification,
  cancelNotification,
  cancelAllScheduledNotifications,
  getNotificationPermissionStatus,
} from './notificationService';
import {
  calculateDailySpending,
  calculateMonthlySpending,
  calculateWeeklySpending,
  isCurrentlyInQuietHours,
} from './financialInsights';
import { Transaction, Currency } from '@/context/FinanceContext';
import { money } from '@/utils/format';

const SCHEDULED_ID_DAILY = 'zeno_scheduled_daily_summary';
const SCHEDULED_ID_MONTHLY = 'zeno_scheduled_monthly_summary';
const SCHEDULED_ID_WEEKLY = 'zeno_scheduled_weekly_insights';

/**
 * Load user notification preferences from AsyncStorage.
 */
export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  try {
    const raw = await AsyncStorage.getItem(NOTIFICATION_STORAGE_KEYS.preferences);
    if (!raw) return DEFAULT_NOTIFICATION_PREFERENCES;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_NOTIFICATION_PREFERENCES, ...parsed };
  } catch {
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }
}

/**
 * Save user notification preferences to AsyncStorage.
 */
export async function saveNotificationPreferences(
  prefs: NotificationPreferences
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      NOTIFICATION_STORAGE_KEYS.preferences,
      JSON.stringify(prefs)
    );
  } catch (error) {
    console.warn('[NotificationScheduler] Failed to save preferences:', error);
  }
}

/**
 * Load deduplication state.
 */
export async function getDeduplicationState(): Promise<NotificationDeduplicationState> {
  try {
    const raw = await AsyncStorage.getItem(NOTIFICATION_STORAGE_KEYS.dedupState);
    if (!raw) {
      return { sentEvents: {}, lastRecordedSpending: {} };
    }
    const parsed = JSON.parse(raw);
    return {
      sentEvents: parsed.sentEvents || {},
      lastRecordedSpending: parsed.lastRecordedSpending || {},
    };
  } catch {
    return { sentEvents: {}, lastRecordedSpending: {} };
  }
}

/**
 * Save deduplication state.
 */
export async function saveDeduplicationState(
  state: NotificationDeduplicationState
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      NOTIFICATION_STORAGE_KEYS.dedupState,
      JSON.stringify(state)
    );
  } catch (error) {
    console.warn('[NotificationScheduler] Failed to save dedup state:', error);
  }
}

export { isCurrentlyInQuietHours };

/**
 * Parse "HH:mm" into hour and minute.
 */
function parseTime(timeStr: string, defaultHour: number, defaultMinute: number = 0) {
  if (!timeStr || !timeStr.includes(':')) {
    return { hour: defaultHour, minute: defaultMinute };
  }
  const [h, m] = timeStr.split(':').map(Number);
  return {
    hour: isNaN(h) ? defaultHour : Math.max(0, Math.min(23, h)),
    minute: isNaN(m) ? defaultMinute : Math.max(0, Math.min(59, m)),
  };
}

/**
 * Reconcile scheduled recurring reminders based on user preferences and current data snapshot.
 */
export async function reconcileNotificationSchedules(
  prefs: NotificationPreferences,
  transactions: Transaction[],
  currency: Currency = 'INR'
): Promise<void> {
  const perm = await getNotificationPermissionStatus();
  if (!perm.granted || !prefs.enabled) {
    // Cancel all scheduled notifications if permission denied or master toggle off
    await cancelAllScheduledNotifications();
    return;
  }

  // 1. Daily Summary
  if (prefs.dailySummaryEnabled) {
    const { hour, minute } = parseTime(prefs.dailySummaryTime, 21, 0);
    const today = calculateDailySpending(transactions);
    const bodyText = today.totalSpent > 0
      ? `You spent ${money(today.totalSpent, currency)} today across ${today.transactionCount} transaction${today.transactionCount === 1 ? '' : 's'}.`
      : `No expenses logged today. Tap to check your balances.`;

    await cancelNotification(SCHEDULED_ID_DAILY);
    await scheduleLocalNotification({
      identifier: SCHEDULED_ID_DAILY,
      title: 'Your Daily Summary',
      body: bodyText,
      channelId: 'spending_summaries',
      payload: {
        type: 'daily_summary',
        route: '/(tabs)/expenses',
        amount: today.totalSpent,
      },
      trigger: {
        type: 'daily' as any,
        hour,
        minute,
      },
    });
  } else {
    await cancelNotification(SCHEDULED_ID_DAILY);
  }

  // 2. Weekly Insights (e.g. Sunday evening)
  if (prefs.weeklyInsightsEnabled) {
    const { hour, minute } = parseTime(prefs.weeklyInsightsTime, 20, 0);
    const weekly = calculateWeeklySpending(transactions);
    let bodyText = `You spent ${money(weekly.totalSpent, currency)} this week.`;
    if (weekly.hasPreviousWeekData && typeof weekly.percentageChange === 'number') {
      const changeWord = weekly.percentageChange <= 0 ? 'less' : 'more';
      bodyText = `You spent ${money(weekly.totalSpent, currency)} this week, ${Math.abs(weekly.percentageChange)}% ${changeWord} than last week.`;
    }

    await cancelNotification(SCHEDULED_ID_WEEKLY);
    await scheduleLocalNotification({
      identifier: SCHEDULED_ID_WEEKLY,
      title: 'Your Weekly Money Recap',
      body: bodyText,
      channelId: 'financial_insights',
      payload: {
        type: 'weekly_insights',
        route: '/(tabs)/budgets',
        amount: weekly.totalSpent,
      },
      trigger: {
        type: 'weekly' as any,
        weekday: prefs.weeklyInsightsDay || 1, // 1 = Sunday
        hour,
        minute,
      },
    });
  } else {
    await cancelNotification(SCHEDULED_ID_WEEKLY);
  }

  // 3. Monthly Summary
  if (prefs.monthlySummaryEnabled) {
    const { hour, minute } = parseTime(prefs.monthlySummaryTime, 20, 0);
    const now = new Date();
    const monthly = calculateMonthlySpending(transactions, now.getFullYear(), now.getMonth());

    let bodyText = `You've spent ${money(monthly.totalSpent, currency)} this month.`;
    if (monthly.topCategory) {
      bodyText += ` ${monthly.topCategory.name} is your highest spending category.`;
    }

    await cancelNotification(SCHEDULED_ID_MONTHLY);
    await scheduleLocalNotification({
      identifier: SCHEDULED_ID_MONTHLY,
      title: 'Your Monthly Spending',
      body: bodyText,
      channelId: 'spending_summaries',
      payload: {
        type: 'monthly_summary',
        route: '/(tabs)/budgets',
        amount: monthly.totalSpent,
      },
      trigger: {
        type: 'monthly' as any,
        day: 28, // Safe monthly trigger for all months
        hour,
        minute,
      },
    });
  } else {
    await cancelNotification(SCHEDULED_ID_MONTHLY);
  }
}
