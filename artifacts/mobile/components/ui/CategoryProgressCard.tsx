import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/useColors";
import { money } from "@/utils/format";
import { Currency } from "@/context/FinanceContext";
import { fontSize, fontWeight, radius, spacing } from "@/constants/tokens";
import { CategoryVisual } from "./CategoryVisual";

function getDaysLeft(
  targetDate?: string,
): { days: number; text: string; isPast: boolean } | null {
  if (!targetDate) return null;
  const target = new Date(targetDate);
  if (isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  const days = Math.round(diffTime / (1000 * 60 * 60 * 24));
  if (days < 0) {
    return {
      days,
      text: `${Math.abs(days)} ${Math.abs(days) === 1 ? "day" : "days"} past`,
      isPast: true,
    };
  }
  if (days === 0) {
    return { days: 0, text: "Due today", isPast: false };
  }
  return {
    days,
    text: `${days} ${days === 1 ? "day" : "days"}`,
    isPast: false,
  };
}

export type CategoryProgressCardProps = {
  title: string;
  amount: number;
  targetOrLimit: number;
  color: string;
  iconName?: string;
  imageUrl?: string;
  targetDate?: string;
  isGoal?: boolean;
  currency?: Currency;
  onPress?: () => void;
  onAddPress?: () => void;
  width?: number;
};

export function CategoryProgressCard({
  title,
  amount,
  targetOrLimit,
  color,
  iconName,
  imageUrl,
  targetDate,
  isGoal = false,
  currency = "INR",
  onPress,
  onAddPress,
  width = 166,
}: CategoryProgressCardProps) {
  const colors = useColors();
  const isDark = colors.isDark;
  const effectiveColor = isGoal ? colors.primary : color;

  // Percentage calculation
  const percentage =
    targetOrLimit > 0
      ? Math.min(100, Math.round((amount / targetOrLimit) * 100))
      : 0;

  // Concentric ring dimensions
  const ringSize = 48;
  const strokeWidth = 3.2;
  const radiusVal = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radiusVal;
  const strokeDashoffset =
    circumference -
    (Math.max(0, Math.min(percentage, 100)) / 100) * circumference;

  // Remaining or left calculation
  const remaining = Math.max(0, targetOrLimit - amount);

  const daysLeftInfo = isGoal ? getDaysLeft(targetDate) : null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          width,
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      {/* Background Cover Photo for Goal */}
      {isGoal && imageUrl && (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <Image
            source={{ uri: imageUrl }}
            style={[
              StyleSheet.absoluteFillObject,
              { opacity: 0.80 },
            ]}
            resizeMode="cover"
          />
          <LinearGradient
            colors={["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0.08)", "rgba(0, 0, 0, 0.23)"]}
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFillObject}
          />
        </View>
      )}

      {/* Top Row */}
      <View style={styles.topRow}>
        {isGoal ? (
          <>
            {/* Top Left placeholder so plus button aligns top-right */}
            <View style={{ flex: 1 }} />

            {/* Top Right: Plus Button with Circular Progress Bar around it */}
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onAddPress?.();
              }}
              hitSlop={8}
              style={styles.ringWrapper}
            >
              {/* Luminous Glow Behind the Arc */}
              <View
                style={[
                  styles.glowAura,
                  {
                    backgroundColor: effectiveColor,
                    shadowColor: effectiveColor,
                  },
                ]}
              />

              {/* SVG Progress Ring */}
              <Svg
                width={ringSize}
                height={ringSize}
                style={{ transform: [{ rotate: "-90deg" }] }}
              >
                <Circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={radiusVal}
                  stroke={
                    isDark
                      ? "rgba(255, 255, 255, 0.12)"
                      : "rgba(0, 0, 0, 0.08)"
                  }
                  strokeWidth={strokeWidth}
                  fill="none"
                />
                <Circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={radiusVal}
                  stroke={effectiveColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="none"
                />
              </Svg>

              {/* Centered Plus Icon inside the Progress Ring */}
              <View
                style={[
                  styles.innerBadge,
                  {
                    backgroundColor: `${effectiveColor}24`,
                    borderColor: `${effectiveColor}45`,
                    borderWidth: 1,
                  },
                ]}
              >
                <Feather name="plus" size={16} color={effectiveColor} />
              </View>
            </Pressable>
          </>
        ) : (
          <>
            {/* Non-Goal Category: Progress Ring with Category Visual on left, Plus button on right */}
            <View style={styles.ringWrapper}>
              <View
                style={[
                  styles.glowAura,
                  {
                    backgroundColor: effectiveColor,
                    shadowColor: effectiveColor,
                  },
                ]}
              />
              <Svg
                width={ringSize}
                height={ringSize}
                style={{ transform: [{ rotate: "-90deg" }] }}
              >
                <Circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={radiusVal}
                  stroke={
                    isDark
                      ? "rgba(255, 255, 255, 0.08)"
                      : "rgba(0, 0, 0, 0.08)"
                  }
                  strokeWidth={strokeWidth}
                  fill="none"
                />
                <Circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={radiusVal}
                  stroke={effectiveColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="none"
                />
              </Svg>
              <View style={styles.innerBadge}>
                <CategoryVisual
                  categoryName={title}
                  iconName={iconName}
                  size={30}
                  style={{ borderRadius: 15, overflow: "hidden" }}
                />
              </View>
            </View>

            <View style={styles.topRightCol}>
              {onAddPress && (
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    onAddPress();
                  }}
                  hitSlop={8}
                  style={[
                    styles.quickAddBtn,
                    {
                      backgroundColor: `${effectiveColor}24`,
                      borderColor: `${effectiveColor}40`,
                    },
                  ]}
                >
                  <Feather name="plus" size={15} color={effectiveColor} />
                </Pressable>
              )}
            </View>
          </>
        )}
      </View>

      {/* Name / Category Title */}
      <Text style={[styles.title, { color: colors.fg }]} numberOfLines={1}>
        {title}
      </Text>

      {/* Bottom Section: Primary Amount on Left, Countdown Badge on Bottom Right */}
      <View style={styles.bottomSection}>
        <View style={styles.amountTextContainer}>
          <Text
            style={[styles.mainAmount, { color: colors.fg }]}
            numberOfLines={1}
          >
            {money(amount, currency)}
          </Text>
          <Text
            style={[styles.subAmount, { color: colors.fgMuted }]}
            numberOfLines={1}
          >
            {isGoal
              ? percentage >= 100
                ? "Goal reached! 🎉"
                : `/ ${money(remaining, currency)} left`
              : amount > targetOrLimit && targetOrLimit > 0
                ? `/ ${money(amount - targetOrLimit, currency)} over`
                : `/ ${money(remaining, currency)} left`}
          </Text>
        </View>

        {/* Bottom Right: Countdown Badge (Icon + Numeric value only) */}
        {isGoal && daysLeftInfo ? (
          <View
            style={[
              styles.countdownBadge,
              {
                backgroundColor: daysLeftInfo.isPast
                  ? "rgba(239, 68, 68, 0.16)"
                  : isDark
                    ? "rgba(0, 0, 0, 0.55)"
                    : "rgba(255, 255, 255, 0.90)",
                borderColor: daysLeftInfo.isPast
                  ? "rgba(239, 68, 68, 0.35)"
                  : isDark
                    ? "rgba(255, 255, 255, 0.14)"
                    : "rgba(0, 0, 0, 0.10)",
              },
            ]}
          >
            <Feather
              name="clock"
              size={10.5}
              color={daysLeftInfo.isPast ? "#EF4444" : colors.fg}
            />
            <Text
              style={[
                styles.countdownBadgeNumber,
                {
                  color: daysLeftInfo.isPast ? "#EF4444" : colors.fg,
                },
              ]}
            >
              {Math.abs(daysLeftInfo.days)}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: spacing[4],
    borderWidth: 1,
    minHeight: 168,
    justifyContent: "space-between",
    overflow: "hidden",
    position: "relative",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  ringWrapper: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  glowAura: {
    position: "absolute",
    width: 32,
    height: 32,
    borderRadius: 16,
    opacity: 0.35,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
  },
  innerBadge: {
    position: "absolute",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  quickAddBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  topRightCol: {
    alignItems: "flex-end",
    gap: 6,
  },
  countdownBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: radius.full,
    borderWidth: 1,
    alignSelf: "flex-end",
  },
  countdownBadgeNumber: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    fontVariant: ["tabular-nums"],
    lineHeight: 14,
  },
  title: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    marginTop: spacing[3],
    marginBottom: spacing[2],
  },
  bottomSection: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: spacing[2],
  },
  amountTextContainer: {
    flex: 1,
    gap: 2,
  },
  mainAmount: {
    fontSize: 17,
    fontWeight: fontWeight.bold,
    fontVariant: ["tabular-nums"],
  },
  subAmount: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
});
