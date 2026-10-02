import * as ExpoHaptics from "expo-haptics";

/**
 * Zeno Centralized Contextual Haptic System
 * Standardizes LOW and STRONG tactile feedback levels while
 * strictly respecting existing specialized haptics across the app.
 */
export const haptics = {
  /**
   * LOW intensity haptic feedback
   * Used for: non-destructive confirmations, lightweight success,
   * reaching edit threshold, successful saves/updates.
   */
  low: () => {
    try {
      void ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light);
    } catch {}
  },

  /**
   * STRONG intensity haptic feedback
   * Used for: destructive actions (deletion), reaching delete threshold,
   * data resets, major warnings.
   */
  strong: () => {
    try {
      void ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Heavy);
    } catch {}
  },

  /**
   * Selection / tick feedback for threshold crossing and dials
   */
  selection: () => {
    try {
      void ExpoHaptics.selectionAsync();
    } catch {}
  },

  /**
   * Success notification pulse
   */
  success: () => {
    try {
      void ExpoHaptics.notificationAsync(
        ExpoHaptics.NotificationFeedbackType.Success,
      );
    } catch {}
  },

  /**
   * Warning notification pulse
   */
  warning: () => {
    try {
      void ExpoHaptics.notificationAsync(
        ExpoHaptics.NotificationFeedbackType.Warning,
      );
    } catch {}
  },

  /**
   * Error notification pulse
   */
  error: () => {
    try {
      void ExpoHaptics.notificationAsync(
        ExpoHaptics.NotificationFeedbackType.Error,
      );
    } catch {}
  },
};

