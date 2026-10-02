import React, { useEffect, useRef } from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useFinance } from "@/context/FinanceContext";
import { MascotGuide } from "@/components/MascotGuide";
import { spacing, radius, fontSize, fontWeight } from "@/constants/tokens";
import { currencySymbol } from "@/utils/format";

const ENLIGHTENMENT_QUOTES = [
  "Every expense tracked brings clarity to your wealth.",
  "Small mindful habits compound into true financial freedom.",
  "Awareness is the first step toward lasting abundance.",
  "Tracked in seconds. You are in complete command of your money.",
  "Clarity creates confidence. Keep building your financial future.",
];

export function ExpenseCelebrationModal() {
  const { celebrationExpense, dismissCelebration, settings } = useFinance();
  const colors = useColors();

  const scaleAnim = useRef(new Animated.Value(0.82)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(24)).current;

  const quoteIndexRef = useRef(0);

  useEffect(() => {
    if (celebrationExpense) {
      quoteIndexRef.current = Math.floor(
        Math.random() * ENLIGHTENMENT_QUOTES.length,
      );

      // Trigger crisp celebration haptic
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Spring entrance
      scaleAnim.setValue(0.82);
      opacityAnim.setValue(0);
      translateYAnim.setValue(24);

      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(translateYAnim, {
          toValue: 0,
          friction: 7,
          tension: 70,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-dismiss after 3.8s of delightful display
      const timer = setTimeout(() => {
        handleDismiss();
      }, 3800);

      return () => clearTimeout(timer);
    }
  }, [celebrationExpense]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start(() => {
      dismissCelebration();
    });
  };

  if (!celebrationExpense) return null;

  const sym = currencySymbol(settings.currency || "INR");
  const formattedAmount = `${sym}${celebrationExpense.amount.toLocaleString()}`;
  const categoryLabel = celebrationExpense.category || "Expense";
  const quote = ENLIGHTENMENT_QUOTES[quoteIndexRef.current];

  return (
    <Modal
      visible={Boolean(celebrationExpense)}
      transparent
      animationType="none"
      onRequestClose={handleDismiss}
    >
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={handleDismiss}
          accessibilityLabel="Dismiss celebration"
        />

        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: `${colors.primary}35`,
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }, { translateY: translateYAnim }],
            },
          ]}
        >
          {/* Close mini cross */}
          <Pressable
            onPress={handleDismiss}
            style={[
              styles.closeBtn,
              { backgroundColor: colors.surfaceRecessed },
            ]}
            hitSlop={10}
            accessibilityLabel="Close"
          >
            <Feather name="x" size={16} color={colors.fgMuted} />
          </Pressable>

          {/* Mascot with gentle float and aura */}
          <View style={styles.mascotWrap}>
            <View
              style={[
                styles.glowAura,
                { backgroundColor: `${colors.primary}20` },
              ]}
            />
            <MascotGuide mascot="completed" size={140} floating glow />
          </View>

          {/* Heading */}
          <View style={styles.contentWrap}>
            <View style={styles.badgeRow}>
              <View
                style={[
                  styles.sparkleBadge,
                  { backgroundColor: `${colors.primary}18` },
                ]}
              >
                <Feather name="check" size={13} color={colors.primary} />
                <Text
                  style={[styles.sparkleBadgeText, { color: colors.primary }]}
                >
                  TRACKED IN 2 SECONDS
                </Text>
              </View>
            </View>

            <Text style={[styles.title, { color: colors.fg }]}>
              Expense Logged! ✨
            </Text>

            {/* Amount & Category Pill */}
            <View
              style={[
                styles.amountPill,
                {
                  backgroundColor: colors.surfaceRecessed,
                  borderColor: colors.divider,
                },
              ]}
            >
              <Text style={[styles.amountText, { color: colors.fg }]}>
                {formattedAmount}
              </Text>
              <View
                style={[
                  styles.pillDivider,
                  { backgroundColor: colors.divider },
                ]}
              />
              <Text
                style={[styles.categoryText, { color: colors.primary }]}
                numberOfLines={1}
              >
                {categoryLabel}
              </Text>
            </View>

            {/* Enlightenment Microcopy */}
            <Text style={[styles.quoteText, { color: colors.fgMuted }]}>
              "{quote}"
            </Text>
          </View>

          {/* Action button */}
          <Pressable
            onPress={handleDismiss}
            style={({ pressed }) => [
              styles.doneBtn,
              { backgroundColor: colors.primary },
              pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Done"
          >
            <Text style={[styles.doneBtnText, { color: colors.onPrimary }]}>
              Great, keep going
            </Text>
            <Feather name="arrow-right" size={16} color={colors.onPrimary} />
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.72)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing[5],
  },
  card: {
    width: "100%",
    maxWidth: 340,
    borderRadius: radius.hero,
    borderWidth: 1.5,
    paddingTop: spacing[5],
    paddingBottom: spacing[5],
    paddingHorizontal: spacing[5],
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 12,
    position: "relative",
  },
  closeBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  mascotWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: spacing[1],
    position: "relative",
  },
  glowAura: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  contentWrap: {
    alignItems: "center",
    width: "100%",
    marginTop: spacing[2],
    marginBottom: spacing[4],
  },
  badgeRow: {
    marginBottom: spacing[2],
  },
  sparkleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  sparkleBadgeText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.8,
  },
  title: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.bold,
    letterSpacing: -0.4,
    marginBottom: spacing[3],
    textAlign: "center",
  },
  amountPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[3] + 2,
    paddingVertical: spacing[2],
    borderRadius: radius.full,
    borderWidth: 1,
    marginBottom: spacing[3],
    maxWidth: "92%",
  },
  amountText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.2,
  },
  pillDivider: {
    width: 1,
    height: 14,
    marginHorizontal: spacing[2],
  },
  categoryText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  quoteText: {
    fontSize: fontSize.xs,
    lineHeight: 18,
    textAlign: "center",
    paddingHorizontal: spacing[2],
    fontStyle: "italic",
  },
  doneBtn: {
    width: "100%",
    height: 48,
    borderRadius: radius.full,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
  },
  doneBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.2,
  },
});
