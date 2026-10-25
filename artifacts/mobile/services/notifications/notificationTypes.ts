export type NotificationChannelId =
  | 'budget_alerts'
  | 'spending_summaries'
  | 'financial_insights';

export interface NotificationPreferences {
  enabled: boolean;
  budget80Alerts: boolean;
  budget100Alerts: boolean;
  dailySpendingLimitEnabled: boolean;
  dailySpendingLimitAmount: number;
  dailySummaryEnabled: boolean;
  dailySummaryTime: string; // "HH:mm", e.g. "21:00"
  monthlySummaryEnabled: boolean;
  monthlySummaryTime: string; // "HH:mm", e.g. "20:00"
  weeklyInsightsEnabled: boolean;
  weeklyInsightsDay: number; // 1 = Sunday, 2 = Monday, ..., 7 = Saturday
  weeklyInsightsTime: string; // "HH:mm", e.g. "20:00"
  quietHoursEnabled: boolean;
  quietHoursStart: string; // "HH:mm", e.g. "22:00"
  quietHoursEnd: string; // "HH:mm", e.g. "07:00"
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  enabled: true,
  budget80Alerts: true,
  budget100Alerts: true,
  dailySpendingLimitEnabled: false,
  dailySpendingLimitAmount: 1500,
  dailySummaryEnabled: true,
  dailySummaryTime: "21:00",
  monthlySummaryEnabled: true,
  monthlySummaryTime: "20:00",
  weeklyInsightsEnabled: true,
  weeklyInsightsDay: 1, // Sunday
  weeklyInsightsTime: "20:00",
  quietHoursEnabled: false,
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00",
};

export type NotificationType =
  | 'budget_80'
  | 'budget_100'
  | 'daily_limit'
  | 'daily_summary'
  | 'monthly_summary'
  | 'weekly_insights';

export interface NotificationPayload {
  type: NotificationType;
  route: string;
  id?: string;
  budgetId?: string;
  category?: string;
  amount?: number;
  limit?: number;
  percentage?: number;
  timestamp?: number;
  [key: string]: any;
}

export interface NotificationDeduplicationState {
  /**
   * Records alerts that have already fired for a specific entity & period.
   * Key pattern:
   *   Budget: `budget_${budgetId}_${year}_${month}_${threshold}`
   *   Daily limit: `daily_limit_${dateStr}_${limit}`
   *   Daily summary: `daily_summary_${dateStr}`
   *   Monthly summary: `monthly_summary_${year}_${month}`
   *   Weekly insight: `weekly_insight_${year}_${weekNumber}`
   */
  sentEvents: Record<
    string,
    {
      timestamp: number;
      threshold?: number;
      spending?: number;
      limit?: number;
    }
  >;
  /**
   * Tracks previous spending levels to detect genuine threshold crossings.
   * Key pattern: `spending_state_${budgetId}_${year}_${month}`
   */
  lastRecordedSpending: Record<string, number>;
}

export const NOTIFICATION_STORAGE_KEYS = {
  preferences: '@pocketflow/notification_preferences',
  dedupState: '@pocketflow/notification_dedup_state',
  scheduledIds: '@pocketflow/notification_scheduled_ids',
};

