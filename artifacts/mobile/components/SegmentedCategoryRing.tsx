import React, { useMemo } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { fontSize, fontWeight, radius, spacing } from "@/constants/tokens";
import { money } from "@/utils/format";
import { CategoryVisual } from "@/components/ui/CategoryVisual";
import { haptics } from "@/utils/haptics";
import { Currency } from "@/context/FinanceContext";

export type CategorySegmentData = {
  name: string;
  amount: number;
  budget: number;
  percentageOfTotal: number;
  percentageOfBudget: number;
  color: string;
  icon?: string;
  transactionCount?: number;
};

type SegmentedCategoryRingProps = {
  categories: CategorySegmentData[];
  totalSpent: number;
  totalBudget: number;
  currency: Currency;
  selectedCategoryName: string | null;
  onSelectCategory: (categoryName: string | null) => void;
  size?: number;
  strokeWidth?: number;
};

// Curated pastel & vibrant palette matching reference design (media_1790166645180.png)
const PALETTE = [
  "#FBBF24", // Warm Yellow (reference top)
  "#84CC16", // Olive Green (reference right)
  "#F472B6", // Soft Pink (reference bottom-right)
  "#60A5FA", // Periwinkle Blue (reference bottom)
  "#34D399", // Fresh Mint (reference bottom-left)
  "#F59E0B", // Amber Gold (reference left)
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
    totalBudget > 0 ? Math.min(Math.round((totalSpent / totalBudget) * 100), 999) : 0;

  // Selected category object
  const selectedCategory = useMemo(
    () => categories.find((c) => c.name === selectedCategoryName) || null,
    [categories, selectedCategoryName],
  );

  // If no expenses yet, provide a gentle empty state segment
  const displayCategories = useMemo(() => {
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
    // Limit to top 6-7 categories for visual clarity and group rest as 'Other' if needed
    const top = categories.slice(0, 7).map((c, i) => ({
      ...c,
      color: c.color || PALETTE[i % PALETTE.length],
    }));
    return top;
  }, [categories, totalBudget, colors.primary]);

  // Center and geometry
  const center = size / 2;
  const radiusVal = (size - strokeWidth - 36) / 2; // Extra inset for floating badges
  const badgeSize = 28;

  // Total amount of display categories to compute arc proportions
  const sumAmount = useMemo(() => {
    const sum = displayCategories.reduce((acc, c) => acc + c.amount, 0);
    return sum > 0 ? sum : 1;
  }, [displayCategories]);

  // Compute angles for each segment with strict normalization to 360 degrees
  const segments = useMemo(() => {
    const count = displayCategories.length;
    if (count === 0) return [];

    if (count === 1) {
      const cat = displayCategories[0];
      const startAngle = -90;
      const endAngle = 269.9;
      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;
      const midRad = (90 * Math.PI) / 180;

      const x1 = center + radiusVal * Math.cos(startRad);
      const y1 = center + radiusVal * Math.sin(startRad);
      const x2 = center + radiusVal * Math.cos(endRad);
      const y2 = center + radiusVal * Math.sin(endRad);
      const pathD = `M ${x1} ${y1} A ${radiusVal} ${radiusVal} 0 1 1 ${x2} ${y2}`;

      const badgeDistance = radiusVal + strokeWidth / 2 + 10;
      const badgeX = center + badgeDistance * Math.cos(midRad) - badgeSize / 2;
      const badgeY = center + badgeDistance * Math.sin(midRad) - badgeSize / 2;

      return [
        {
          ...cat,
          index: 0,
          startAngle,
          endAngle,
          midAngle: 90,
          pathD,
          badgeX,
          badgeY,
          isSelected: selectedCategoryName === cat.name,
        },
      ];
    }

    const gapDeg = count <= 3 ? 10 : count <= 5 ? 8 : 6;
    const totalGapDeg = count * gapDeg;
    const availableDeg = 360 - totalGapDeg;
    const minSpan = count <= 4 ? 14 : 10;

    // First pass: compute shares and assign minimum span
    const shares = displayCategories.map((cat) =>
      cat.amount > 0 ? cat.amount / sumAmount : 1 / count,
    );
    const rawSpans = shares.map((share) =>
      Math.max(minSpan, share * availableDeg),
    );
    const rawSum = rawSpans.reduce((acc, s) => acc + s, 0);

    // Second pass: strictly normalize so sum of spans equals availableDeg exactly
    const normalizedSpans = rawSpans.map(
      (s) => (s / rawSum) * availableDeg,
    );

    let currentAngle = -90; // Start at 12 o'clock

    return displayCategories.map((cat, idx) => {
      const degSpan = normalizedSpans[idx];
      const startAngle = currentAngle;
      const endAngle = currentAngle + degSpan;
      const midAngle = (startAngle + endAngle) / 2;

      // Advance for next segment + gap
      currentAngle = endAngle + gapDeg;

      // Convert angles to radians for SVG path
      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;
      const midRad = (midAngle * Math.PI) / 180;

      const x1 = center + radiusVal * Math.cos(startRad);
      const y1 = center + radiusVal * Math.sin(startRad);
      const x2 = center + radiusVal * Math.cos(endRad);
      const y2 = center + radiusVal * Math.sin(endRad);

      const largeArc = degSpan > 180 ? 1 : 0;
      const pathD = `M ${x1} ${y1} A ${radiusVal} ${radiusVal} 0 ${largeArc} 1 ${x2} ${y2}`;

      // Floating Badge Coordinates
      const badgeDistance = radiusVal + strokeWidth / 2 + 11;
      const badgeX = center + badgeDistance * Math.cos(midRad) - badgeSize / 2;
      const badgeY = center + badgeDistance * Math.sin(midRad) - badgeSize / 2;

      const isSelected = selectedCategoryName === cat.name;

      return {
        ...cat,
        index: idx,
        startAngle,
        endAngle,
        midAngle,
        pathD,
        badgeX,
        badgeY,
        isSelected,
      };
    });
  }, [displayCategories, sumAmount, center, radiusVal, strokeWidth, selectedCategoryName]);

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

        {/* Distinct Category Arcs */}
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

      {/* Floating Category Icon Badges matching reference */}
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
                borderColor: seg.isSelected ? seg.color : `${seg.color}60`,
                borderWidth: seg.isSelected ? 2.5 : 1.5,
                transform: [{ scale: badgeScale }],
                opacity: badgeOpacity,
                shadowColor: seg.color,
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
          </Pressable>
        );
      })}

      {/* Center Display matching reference (8.8 / your health score (i)) */}
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
          // Category Specific Center View
          <View style={styles.centerContent}>
            <View
              style={[
                styles.categoryDotPill,
                { backgroundColor: `${selectedCategory.color}25` },
              ]}
            >
              <View
                style={[
                  styles.categoryDot,
                  { backgroundColor: selectedCategory.color },
                ]}
              />
              <Text
                style={[styles.categoryPillText, { color: selectedCategory.color }]}
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
              <Text style={[styles.subScoreText, { color: colors.fgMuted }]}>
                {selectedCategory.budget > 0
                  ? `${Math.round(
                      (selectedCategory.amount / selectedCategory.budget) * 100,
                    )}% of limit`
                  : `${selectedCategory.percentageOfTotal}% of total`}
              </Text>
              <Feather name="info" size={13} color={colors.fgSubtle} />
            </View>
          </View>
        ) : (
          // Overall Budget Center View (Exact layout of reference 8.8 / your score (i))
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
