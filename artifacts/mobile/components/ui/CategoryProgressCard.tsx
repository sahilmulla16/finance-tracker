import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
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

  // Icon renderer
  const renderIcon = () => {
    const nameLower = (iconName || title).toLowerCase();

    // Emergency fund
    if (nameLower.includes("emergency") || nameLower.includes("shield")) {
      return <Feather name="shield" size={17} color="#FFFFFF" />;
    }
    // Laptop / Tech
    if (
      nameLower.includes("laptop") ||
      nameLower.includes("gadget") ||
      nameLower.includes("tech")
    ) {
      return <Feather name="monitor" size={17} color="#FFFFFF" />;
    }
    // Vacation / Travel
    if (
      nameLower.includes("vacation") ||
      nameLower.includes("trip") ||
      nameLower.includes("travel")
    ) {
      return <Feather name="compass" size={17} color="#FFFFFF" />;
    }
    // Restaurants / Food
    if (
      nameLower.includes("restaurant") ||
      nameLower.includes("food") ||
      nameLower.includes("dining")
    ) {
      return (
        <MaterialCommunityIcons
          name="silverware-fork-knife"
          size={17}
          color="#FFFFFF"
        />
      );
    }
    // Groceries
    if (nameLower.includes("grocer") || nameLower.includes("cart")) {
      return <Feather name="shopping-cart" size={17} color="#FFFFFF" />;
    }
    // Shopping
    if (nameLower.includes("shop") || nameLower.includes("bag")) {
      return <Feather name="shopping-bag" size={17} color="#FFFFFF" />;
    }
    // Transport
    if (
      nameLower.includes("transport") ||
      nameLower.includes("commute") ||
      nameLower.includes("car")
    ) {
      return <Feather name="navigation" size={17} color="#FFFFFF" />;
    }
    // Health
    if (nameLower.includes("health") || nameLower.includes("med")) {
      return <Feather name="heart" size={17} color="#FFFFFF" />;
    }
    // Entertainment
    if (
      nameLower.includes("entertain") ||
      nameLower.includes("music") ||
      nameLower.includes("movie")
    ) {
      return <Feather name="film" size={17} color="#FFFFFF" />;
    }

    // Feather fallback
    return <Feather name="target" size={17} color="#FFFFFF" />;
  };

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
      {/* Top Row: Progress Arc with Glowing Badge + Optional Days Left & Quick Add Button */}
      <View style={styles.topRow}>
        <View style={styles.ringWrapper}>
          {/* Luminous Glow Behind the Arc */}
          <View
            style={[
              styles.glowAura,
              {
                backgroundColor: color,
                shadowColor: color,
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
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth={strokeWidth}
              fill="none"
            />
            <Circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radiusVal}
              stroke={color}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="none"
            />
          </Svg>

          {/* Concentric Inner Circular Icon Tile or Custom Image */}
          {isGoal ? (
            <View
              style={[
                styles.innerBadge,
                { backgroundColor: color, overflow: "hidden" },
              ]}
            >
              {imageUrl ? (
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.innerBadgeImage}
                  resizeMode="cover"
                />
              ) : (
                renderIcon()
              )}
            </View>
          ) : (
            <View style={styles.innerBadge}>
              <CategoryVisual
                categoryName={title}
                iconName={iconName}
                size={30}
                style={{ borderRadius: 15, overflow: "hidden" }}
              />
            </View>
          )}
        </View>

        {/* Top Right: Plus Button on top, Clock badge with "99 days" directly below it */}
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
                  backgroundColor: `${color}24`,
                  borderColor: `${color}40`,
                },
              ]}
            >
              <Feather name="plus" size={15} color={color} />
            </Pressable>
          )}

          {daysLeftInfo && (
            <View
              style={[
                styles.daysBadge,
                {
                  backgroundColor: daysLeftInfo.isPast
                    ? "rgba(239, 68, 68, 0.15)"
                    : colors.surfaceRecessed,
                  borderColor: daysLeftInfo.isPast
                    ? "rgba(239, 68, 68, 0.3)"
                    : colors.border,
                },
              ]}
            >
              <Feather
                name="clock"
                size={9}
                color={daysLeftInfo.isPast ? "#EF4444" : colors.fgMuted}
              />
              <Text
                style={[
                  styles.daysBadgeText,
                  { color: daysLeftInfo.isPast ? "#EF4444" : colors.fgMuted },
                ]}
              >
                {daysLeftInfo.text}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Name / Category Title */}
      <Text style={[styles.title, { color: colors.fg }]} numberOfLines={1}>
        {title}
      </Text>

      {/* Bottom Section: Primary Amount on Left */}
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
  daysBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  daysBadgeText: {
    fontSize: 10,
    fontWeight: fontWeight.semibold,
  },
  innerBadgeImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
