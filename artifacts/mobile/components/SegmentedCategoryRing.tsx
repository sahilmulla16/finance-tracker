import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { fontSize, fontWeight, radius, spacing } from "@/constants/tokens";
import { money } from "@/utils/format";
import { CategoryVisual } from "@/components/ui/CategoryVisual";
import { haptics } from "@/utils/haptics";
import { Currency } from "@/context/FinanceContext";

import {
  calculateRingSegments,
  CategorySegmentData,
  RingSegment,
} from "@/utils/budgetRingSegments";

export type { CategorySegmentData, RingSegment };
export { calculateRingSegments };

export type SegmentedCategoryRingProps = {
  categories: CategorySegmentData[];
  totalSpent: number;
  totalBudget: number;
  currency: Currency;
  selectedCategoryName: string | null;
  onSelectCategory: (categoryName: string | null) => void;
  size?: number;
  strokeWidth?: number;
};

// Curated pastel & vibrant palette matching reference design
export const PALETTE = [
  "#FBBF24", // Warm Yellow
  "#84CC16", // Olive Green
  "#F472B6", // Soft Pink
  "#60A5FA", // Periwinkle Blue
  "#34D399", // Fresh Mint
  "#F59E0B", // Amber Gold
  "#A78BFA", // Lavender Purple
  "#FB7185", // Coral Rose
];

export function SegmentedCategoryRing({
  categories,
  totalSpent,
  totalBudget,
  currency,
  selectedCategoryName,
  onSelectCategory,

  size = 280,
  strokeWidth = 24,
}: SegmentedCategoryRingProps) {
  const colors = useColors();

  const budgetUsedPct =
    totalBudget > 0
      ? Math.min(Math.round((totalSpent / totalBudget) * 100), 999)
      : 0;

  // Selected category object
  const selectedCategory = useMemo(
    () =>
      categories.find(
        (c: CategorySegmentData) => c.name === selectedCategoryName,
      ) || null,
    [categories, selectedCategoryName],
  );

  // If no expenses yet, provide a gentle empty state segment
  const displayCategories = useMemo<CategorySegmentData[]>(() => {
    if (categories.length === 0) {
      return [
        {
          name: "Budget",
          amount: 0,
          budget: totalBudget,
          percentageOfTotal: 100,
          percentageOfBudget: 0,
          color: colors.primary,
          icon: "pie-chart",
          transactionCount: 0,
        },
      ];
    }
    // Limit to top 6-7 categories for visual clarity
    return categories.slice(0, 7).map((c: CategorySegmentData, i: number) => ({
      ...c,
      color: c.color || PALETTE[i % PALETTE.length],
    }));
  }, [categories, totalBudget, colors.primary]);

  // Center and geometry
  const center = size / 2;
  const radiusVal = (size - strokeWidth - 40) / 2;
  const badgeSize = 28;

  // Non-overlapping segments calculation
  const segments = useMemo(
    () =>
      calculateRingSegments(
        displayCategories,
        size,
        strokeWidth,
        selectedCategoryName,
      ),
    [displayCategories, size, strokeWidth, selectedCategoryName],
  );

  const overLimitCategories = useMemo(
    () =>
      displayCategories.filter(
        (c: CategorySegmentData) => c.budget > 0 && c.amount > c.budget,
      ),
    [displayCategories],
  );

  const handleSelect = (categoryName: string) => {
    void haptics.selection();
    if (selectedCategoryName === categoryName) {
      onSelectCategory(null); // Toggle off if already selected
    } else {
      onSelectCategory(categoryName);
    }
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* SVG Arc Segments */}
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        {/* Background track circle */}
        <Path
          d={`M ${center + radiusVal} ${center} A ${radiusVal} ${radiusVal} 0 1 1 ${
            center - radiusVal
          } ${center} A ${radiusVal} ${radiusVal} 0 1 1 ${
            center + radiusVal
          } ${center}`}
          stroke={colors.surfaceRecessed}
          strokeWidth={strokeWidth - 6}
          fill="none"
          strokeOpacity={0.6}
        />

        {/* Distinct Category Arcs — Guaranteed Never Overlapping */}
        {segments.map((seg) => {
          const isAnySelected = selectedCategoryName !== null;
          const arcStrokeWidth = seg.isSelected
            ? strokeWidth + 4
            : isAnySelected
              ? strokeWidth - 2
              : strokeWidth;
          const arcOpacity = seg.isSelected ? 1.0 : isAnySelected ? 0.35 : 0.95;

          return (
            <Path
              key={`arc-${seg.name}-${seg.index}`}
              d={seg.pathD}
              stroke={seg.color}
              strokeWidth={arcStrokeWidth}
              strokeLinecap="round"
              fill="none"
              opacity={arcOpacity}
              onPress={() => handleSelect(seg.name)}
            />
          );
        })}
      </Svg>

      {/* Floating Category Icon Badges with Over-Budget Alert Indicator */}
      {segments.map((seg) => {
        const isAnySelected = selectedCategoryName !== null;
        const badgeOpacity = seg.isSelected ? 1.0 : isAnySelected ? 0.5 : 1.0;
        const badgeScale = seg.isSelected ? 1.18 : 1.0;

        return (
          <Pressable
            key={`badge-${seg.name}-${seg.index}`}
            onPress={() => handleSelect(seg.name)}
            hitSlop={8}
            style={[
              styles.floatingBadge,
              {
                left: seg.badgeX,
                top: seg.badgeY,
                width: badgeSize,
                height: badgeSize,
                borderRadius: badgeSize / 2,
                backgroundColor: colors.surface,
                borderColor: seg.isSelected
                  ? seg.isOverBudget
                    ? colors.error || "#EF4444"
                    : seg.color
                  : seg.isOverBudget
                    ? `${colors.error || "#EF4444"}99`
                    : `${seg.color}60`,
                borderWidth: seg.isSelected ? 2.5 : 1.5,
                transform: [{ scale: badgeScale }],
                opacity: badgeOpacity,
                shadowColor: seg.isOverBudget
                  ? colors.error || "#EF4444"
                  : seg.color,
                shadowOpacity: seg.isSelected ? 0.4 : 0.15,
                shadowRadius: seg.isSelected ? 6 : 3,
                elevation: seg.isSelected ? 5 : 2,
              },
            ]}
          >
            <CategoryVisual
              categoryName={seg.name}
              iconName={seg.icon}
              size={16}
            />

            {/* Over-Limit Pip on Category Badge */}
            {seg.isOverBudget && (
              <View
                style={[
                  styles.overBudgetPip,
                  {
                    backgroundColor: colors.error || "#EF4444",
                    borderColor: colors.surface,
                  },
                ]}
              >
                <Text style={styles.overBudgetPipText}>!</Text>
              </View>
            )}
          </Pressable>
        );
      })}

      {/* Center Display: Shows exact % (e.g. 135%, 155%) when selected */}
      <Pressable
        onPress={() => {
          if (selectedCategoryName) {
            void haptics.selection();
            onSelectCategory(null);
          }
        }}
        style={[
          styles.centerContainer,
          {
            width: radiusVal * 2 - strokeWidth - 10,
            height: radiusVal * 2 - strokeWidth - 10,
            borderRadius: radiusVal,
          },
        ]}
      >
        {selectedCategory ? (
          // Category-Specific Center View
          <View style={styles.centerContent}>
            <View
              style={[
                styles.categoryDotPill,
                {
                  backgroundColor:
                    selectedCategory.budget > 0 &&
                    selectedCategory.amount > selectedCategory.budget
                      ? `${colors.error || "#EF4444"}20`
                      : `${selectedCategory.color}25`,
                },
              ]}
            >
              <View
                style={[
                  styles.categoryDot,
                  {
                    backgroundColor:
                      selectedCategory.budget > 0 &&
                      selectedCategory.amount > selectedCategory.budget
                        ? colors.error || "#EF4444"
                        : selectedCategory.color,
                  },
                ]}
              />
              <Text
                style={[
                  styles.categoryPillText,
                  {
                    color:
                      selectedCategory.budget > 0 &&
                      selectedCategory.amount > selectedCategory.budget
                        ? colors.error || "#EF4444"
                        : selectedCategory.color,
                  },
                ]}
                numberOfLines={1}
              >
                {selectedCategory.name}
              </Text>
            </View>

            <Text
              style={[
                styles.mainScoreText,
                { color: colors.fg, fontSize: fontSize["3xl"] },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {money(selectedCategory.amount, currency)}
            </Text>

            <View style={styles.subScoreRow}>
              <Text
                style={[
                  styles.subScoreText,
                  {
                    color:
                      selectedCategory.budget > 0 &&
                      selectedCategory.amount > selectedCategory.budget
                        ? colors.error || "#EF4444"
                        : colors.fgMuted,
                    fontWeight:
                      selectedCategory.budget > 0 &&
                      selectedCategory.amount > selectedCategory.budget
                        ? fontWeight.bold
                        : fontWeight.medium,
                  },
                ]}
              >
                {selectedCategory.budget > 0
                  ? `${Math.round(
                      (selectedCategory.amount / selectedCategory.budget) * 100,
                    )}% of limit`
                  : `${selectedCategory.percentageOfTotal}% of total`}
              </Text>
              <Feather
                name="info"
                size={13}
                color={
                  selectedCategory.budget > 0 &&
                  selectedCategory.amount > selectedCategory.budget
                    ? colors.error || "#EF4444"
                    : colors.fgSubtle
                }
              />
            </View>
          </View>
        ) : (
          // Overall Budget Center View
          <View style={styles.centerContent}>
            <Text style={[styles.mainScoreText, { color: colors.fg }]}>
              {budgetUsedPct}%
            </Text>
            <View style={styles.subScoreRow}>
              <Text style={[styles.subScoreText, { color: colors.fgMuted }]}>
                budget spent
              </Text>
              <Feather name="info" size={13} color={colors.fgSubtle} />
            </View>
            {overLimitCategories.length > 0 && (
              <View
                style={[
                  styles.overLimitCountPill,
                  { backgroundColor: `${colors.error || "#EF4444"}16` },
                ]}
              >
                <Text
                  style={[
                    styles.overLimitCountText,
                    { color: colors.error || "#EF4444" },
                  ]}
                >
                  {overLimitCategories.length}{" "}
                  {overLimitCategories.length === 1 ? "category" : "categories"}{" "}
                  over limit
                </Text>
              </View>
            )}
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginVertical: spacing[3],
  },
  floatingBadge: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  overBudgetPip: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  overBudgetPipText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: fontWeight.bold,
    lineHeight: 11,
  },
  centerContainer: {
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
  },
  centerContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing[2],
  },
  mainScoreText: {
    fontSize: 44,
    fontWeight: fontWeight.bold,
    letterSpacing: -1,
    textAlign: "center",
    includeFontPadding: false,
  },
  subScoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  subScoreText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    textAlign: "center",
  },
  overLimitCountPill: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radius.full,
    marginTop: 4,
  },
  overLimitCountText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
  },
  categoryDotPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radius.full,
    gap: 5,
    marginBottom: 4,
  },
  categoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  categoryPillText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
});
