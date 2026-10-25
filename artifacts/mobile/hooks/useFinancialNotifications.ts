import { useEffect, useRef, useState, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFinance, NotificationItem } from '@/context/FinanceContext';
import {
  NotificationPreferences,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from '@/services/notifications/notificationTypes';
import {
  initNotificationHandler,
  setupAndroidNotificationChannels,
  getNotificationPermissionStatus,
  requestNotificationPermission,
  sendImmediateNotification,
  setupNotificationResponseListener,
} from '@/services/notifications/notificationService';
import {
  getNotificationPreferences,
  saveNotificationPreferences,
  getDeduplicationState,
  saveDeduplicationState,
  isCurrentlyInQuietHours,
  reconcileNotificationSchedules,
} from '@/services/notifications/notificationScheduler';
import {
  calculateBudgetStatuses,
  evaluateThresholdCrossings,
  evaluateDailyLimitCrossing,
} from '@/services/notifications/financialInsights';
import { money, getLocalDateString } from '@/utils/format';

const BUDGET_STORAGE_KEY = '@pocketflow/monthly_budget';
const CATEGORY_BUDGETS_STORAGE_KEY = '@pocketflow/category_budgets';

export function useFinancialNotifications() {
  const { transactions, settings } = useFinance();
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    DEFAULT_NOTIFICATION_PREFERENCES
  );
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [canAskAgain, setCanAskAgain] = useState(true);

  const prevTransactionsLengthRef = useRef(transactions.length);
  const isInitializedRef = useRef(false);

  // Refresh system permissions
  const refreshPermissionStatus = useCallback(async () => {
    const status = await getNotificationPermissionStatus();
    setPermissionGranted(status.granted);
    setCanAskAgain(status.canAskAgain);
    return status.granted;
  }, []);

  // Request system permissions
  const requestPermission = useCallback(async () => {
    const granted = await requestNotificationPermission();
    await refreshPermissionStatus();
    if (granted) {
      await setupAndroidNotificationChannels();
    }
    return granted;
  }, [refreshPermissionStatus]);

  // Update user preferences
  const updatePreferences = useCallback(
    async (partial: Partial<NotificationPreferences>) => {
      setPreferences((prev) => {
        const updated = { ...prev, ...partial };
        void saveNotificationPreferences(updated);
        void reconcileNotificationSchedules(updated, transactions, settings.currency);
        return updated;
      });
    },
    [transactions, settings.currency]
  );

  // Initialize once on mount
  useEffect(() => {
    initNotificationHandler();
    void setupAndroidNotificationChannels();

    // Load preferences and initial permissions
    void getNotificationPreferences().then((loaded) => {
      setPreferences(loaded);
      void refreshPermissionStatus().then((granted) => {
        if (granted && loaded.enabled) {
          void reconcileNotificationSchedules(loaded, transactions, settings.currency);
        }
      });
    });

    // Tap deep-linking response listener
    const unsubscribe = setupNotificationResponseListener((payload) => {
      if (payload && payload.route) {
        try {
          router.push(payload.route as any);
        } catch (err) {
          console.warn('[useFinancialNotifications] Navigation error:', err);
        }
      }
    });

    // AppState change listener for resume checks
    const appStateSub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        void refreshPermissionStatus();
      }
    });

    isInitializedRef.current = true;

    return () => {
      unsubscribe();
      appStateSub.remove();
    };
  }, []);

  // Monitor transactions for Budget threshold crossings and Daily Spending Limit alerts
  useEffect(() => {
    if (!permissionGranted || !preferences.enabled) return;
    if (isCurrentlyInQuietHours(preferences)) return;

    let isMounted = true;

    const checkAlerts = async () => {
      try {
        // Load custom budgets
        const rawMonthly = await AsyncStorage.getItem(BUDGET_STORAGE_KEY);
        const totalMonthlyBudget = rawMonthly ? parseFloat(rawMonthly) : null;

        const rawCat = await AsyncStorage.getItem(CATEGORY_BUDGETS_STORAGE_KEY);
        let categoryBudgets: Record<string, number> = {};
        if (rawCat) {
          try {
            categoryBudgets = JSON.parse(rawCat);
          } catch {}
        }

        const dedupState = await getDeduplicationState();
        const sentKeys = new Set(Object.keys(dedupState.sentEvents));
        let stateChanged = false;

        const now = new Date();
        const periodKey = `${now.getFullYear()}-${now.getMonth() + 1}`;
        const todayStr = getLocalDateString(now);

        // 1. Evaluate Budget Threshold Crossings (80% and 100%)
        if (preferences.budget80Alerts || preferences.budget100Alerts) {
          const statuses = calculateBudgetStatuses(
            transactions,
            categoryBudgets,
            totalMonthlyBudget,
            now.getFullYear(),
            now.getMonth()
          );

          for (const status of statuses) {
            const spendingKey = `spending_state_${status.id}_${periodKey}`;
            const prevSpending = dedupState.lastRecordedSpending[spendingKey] ?? 0;

            const events = evaluateThresholdCrossings(status, prevSpending, sentKeys, periodKey);

            for (const ev of events) {
              if (ev.threshold === 80 && !preferences.budget80Alerts) continue;
              if (ev.threshold === 100 && !preferences.budget100Alerts) continue;

              const title =
                ev.threshold === 80
                  ? `Budget Warning`
                  : `Budget Limit Reached`;

              const body =
                ev.threshold === 80
                  ? `You've used 80% of your ${ev.budgetName}. ${money(ev.remaining, settings.currency)} remaining.`
                  : `You've reached your ${ev.budgetName} limit of ${money(ev.limit, settings.currency)}.`;

              // Send system notification
              await sendImmediateNotification({
                title,
                body,
                channelId: 'budget_alerts',
                payload: {
                  type: ev.threshold === 80 ? 'budget_80' : 'budget_100',
                  route: '/(tabs)/budgets',
                  budgetId: ev.budgetId,
                  amount: ev.spent,
                  limit: ev.limit,
                  percentage: ev.percentage,
                },
              });

              // Mark event as sent
              dedupState.sentEvents[ev.eventKey] = {
                timestamp: Date.now(),
                threshold: ev.threshold,
                spending: ev.spent,
                limit: ev.limit,
              };
              sentKeys.add(ev.eventKey);
              stateChanged = true;
            }

            // Update recorded spending for re-arming logic
            if (dedupState.lastRecordedSpending[spendingKey] !== status.spent) {
              dedupState.lastRecordedSpending[spendingKey] = status.spent;
              stateChanged = true;
            }
          }
        }

        // 2. Evaluate Daily Spending Limit Crossing
        if (preferences.dailySpendingLimitEnabled && preferences.dailySpendingLimitAmount > 0) {
          const dailySpendingKey = `daily_spending_state_${todayStr}`;
          const prevDailySpending = dedupState.lastRecordedSpending[dailySpendingKey] ?? 0;

          const limitCrossing = evaluateDailyLimitCrossing(
            transactions,
            preferences.dailySpendingLimitAmount,
            todayStr,
            prevDailySpending,
            sentKeys
          );

          if (limitCrossing && limitCrossing.isCrossed) {
            const title = `Daily Spending Limit Reached`;
            const body = `You've spent ${money(limitCrossing.spent, settings.currency)} today, ${money(limitCrossing.overAmount, settings.currency)} over your daily limit.`;

            await sendImmediateNotification({
              title,
              body,
              channelId: 'spending_summaries',
              payload: {
                type: 'daily_limit',
                route: '/(tabs)/expenses',
                amount: limitCrossing.spent,
                limit: preferences.dailySpendingLimitAmount,
              },
            });

            dedupState.sentEvents[limitCrossing.eventKey] = {
              timestamp: Date.now(),
              spending: limitCrossing.spent,
              limit: preferences.dailySpendingLimitAmount,
            };
            sentKeys.add(limitCrossing.eventKey);
            stateChanged = true;
          }

          // Record current daily spending
          const currentDailyTotal = transactions
            .filter((t) => t.type === 'EXPENSE' && (t.date === todayStr || t.createdAt?.startsWith(todayStr)))
            .reduce((sum, t) => sum + t.amount, 0);

          if (dedupState.lastRecordedSpending[dailySpendingKey] !== currentDailyTotal) {
            dedupState.lastRecordedSpending[dailySpendingKey] = currentDailyTotal;
            stateChanged = true;
          }
        }

        if (stateChanged && isMounted) {
          await saveDeduplicationState(dedupState);
        }

        // 3. Keep scheduled daily summary up to date with latest transactions
        if (preferences.enabled && preferences.dailySummaryEnabled && isMounted) {
          void reconcileNotificationSchedules(preferences, transactions, settings.currency);
        }
      } catch (err) {
        console.warn('[useFinancialNotifications] Error checking alerts:', err);
      }
    };

    void checkAlerts();

    return () => {
      isMounted = false;
    };
  }, [transactions, permissionGranted, preferences, settings.currency]);

  return {
    preferences,
    updatePreferences,
    permissionGranted,
    canAskAgain,
    refreshPermissionStatus,
    requestPermission,
  };
}

