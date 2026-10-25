import React, { useState, useMemo, useCallback } from "react";
import {
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { fontSize, fontWeight, radius, spacing } from "@/constants/tokens";
import { money } from "@/utils/format";
import { haptics } from "@/utils/haptics";
import {
  calculateChartTooltipPosition,
  type SpendingChartBucket,
  type SpendingPeriod,
} from "@/utils/dailySpend";
import { Currency } from "@/context/FinanceContext";

export interface SpendingChartProps {
  buckets: SpendingChartBucket[];
  selectedBucketIndex: number | null;
  onSelectBucket: (index: number | null) => void;
  period: SpendingPeriod;
  currency?: Currency;
  xAxisLabels: { index: number; label: string }[];
  onHoverBucket?: (index: number | null) => void;
}

const CHART_BARS_HEIGHT = 118; // Height of the vertical bar area with headroom for floating tooltip
const BAR_MAX_HEIGHT = 80;
const TOOLTIP_HEIGHT = 28;
const ESTIMATED_TOOLTIP_WIDTH = 76;

export function SpendingChart({
  buckets,
  selectedBucketIndex,
  onSelectBucket,
  period,
  currency = "INR",
  xAxisLabels,
  onHoverBucket,
}: SpendingChartProps) {
  const colors = useColors();
  const [containerWidth, setContainerWidth] = useState<number>(320);
  const [tooltipWidth, setTooltipWidth] = useState<number>(ESTIMATED_TOOLTIP_WIDTH);
  const [hoveredBucketIndex, setHoveredBucketIndex] = useState<number | null>(null);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    if (width > 0) {
      setContainerWidth(width);
    }
  }, []);

  const onTooltipLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && Math.abs(w - tooltipWidth) > 1) {
      setTooltipWidth(w);
    }
  }, [tooltipWidth]);

  const count = buckets.length;
  const slotWidth = count > 0 ? containerWidth / count : 1;

  // Max amount across buckets for proportional scaling
  const maxAmount = useMemo(() => {
    const maxVal = buckets.reduce((max, b) => Math.max(max, b.amount), 0);
    return maxVal > 0 ? maxVal : 1;
  }, [buckets]);

  // Compute bar width based on bucket density
  const barWidth = useMemo(() => {
    if (period === "WEEKLY") {
      return Math.min(Math.max(slotWidth * 0.42, 14), 22);
    }
    if (period === "YEARLY") {
      return Math.min(Math.max(slotWidth * 0.42, 10), 16);
    }
    if (period === "MONTHLY") {
      return Math.min(Math.max(slotWidth * 0.65, 3.5), 7);
    }
    // DAILY (24 bars)
    return Math.min(Math.max(slotWidth * 0.55, 4), 9);
  }, [period, slotWidth]);

  // Active bucket is either hovered or selected
  const activeBucketIndex = hoveredBucketIndex !== null ? hoveredBucketIndex : selectedBucketIndex;
  const activeBucket =
    activeBucketIndex !== null && activeBucketIndex >= 0 && activeBucketIndex < count
      ? buckets[activeBucketIndex]
      : null;

  // Compute dynamic tooltip position anchored above selected/hovered bar
  const tooltipStyle = useMemo(() => {
    if (activeBucketIndex === null || !activeBucket) return null;

    return calculateChartTooltipPosition({
      barIndex: activeBucketIndex,
      totalBars: count,
      containerWidth,
      tooltipWidth,
      tooltipHeight: TOOLTIP_HEIGHT,
      tooltipGap: 6,
      chartBarsHeight: CHART_BARS_HEIGHT,
      barAmount: activeBucket.amount,
      maxAmount,
    });
  }, [activeBucketIndex, activeBucket, count, containerWidth, tooltipWidth, maxAmount]);

  return (
    <View style={styles.chartWrapper} onLayout={onLayout}>
      {/* ─── Bars Area ────────────────────────────────────────────── */}
      <View style={[styles.barsContainer, { height: CHART_BARS_HEIGHT }]}>
        {/* Floating Tooltip anchored above selected bar */}
        {activeBucket && tooltipStyle && (
          <View
            pointerEvents="none"
            onLayout={onTooltipLayout}
            style={[
              styles.tooltipContainer,
              {
                left: tooltipStyle.left,
                top: tooltipStyle.top,
                backgroundColor: colors.isDark ? "#222723" : "#101C3D",
                borderColor: colors.isDark ? "#3A453C" : "#2B374E",
              },
            ]}
          >
            <Text
              style={[
                styles.tooltipText,
                { color: colors.isDark ? "#F5F7F3" : "#FFFFFF" },
              ]}
              numberOfLines={1}
            >
              {money(activeBucket.amount, currency)}
            </Text>
            {/* Tooltip Downward Caret */}
            <View
              style={[
                styles.tooltipArrow,
                {
                  left: tooltipStyle.arrowLeft,
                  borderTopColor: colors.isDark ? "#222723" : "#101C3D",
                },
              ]}
            />
          </View>
        )}

        {/* Bars Row */}
        <View style={styles.barsRow}>
          {buckets.map((bucket) => {
            const isSelected = selectedBucketIndex === bucket.index;
            const isHovered = hoveredBucketIndex === bucket.index;
            const isActive = isSelected || isHovered;
            const isPeak = bucket.amount === maxAmount && bucket.amount > 0;

            const height =
              bucket.amount > 0
                ? Math.max(
                    Math.round((bucket.amount / maxAmount) * BAR_MAX_HEIGHT),
                    10,
                  )
                : 4;

            // Muted green tones for active bars, bright lime highlight for selected
            const fillColor = isActive
              ? colors.primary // Bright lime green (#B7FF63 in dark, #101C3D in light)
              : bucket.amount > 0
              ? isPeak
                ? colors.isDark
                  ? "#7CD529"
                  : "#1B2A4E"
                : colors.isDark
                ? "rgba(183, 255, 99, 0.42)"
                : "rgba(16, 28, 61, 0.32)"
              : colors.isDark
              ? "#232824" // Subtle dark baseline bar for 0 spending
              : "#E2E8F0";

            return (
              <Pressable
                key={bucket.id || bucket.index}
                hitSlop={{ top: 12, bottom: 8, left: 2, right: 2 }}
                onHoverIn={() => {
                  setHoveredBucketIndex(bucket.index);
                  onHoverBucket?.(bucket.index);
                }}
                onHoverOut={() => {
                  setHoveredBucketIndex(null);
                  onHoverBucket?.(null);
                }}
                onPress={() => {
                  void haptics.selection();
                  onSelectBucket(isSelected ? null : bucket.index);
                }}
                style={[styles.barSlot, { width: slotWidth }]}
                accessibilityRole="button"
                accessibilityLabel={`${bucket.fullLabel}: ${money(bucket.amount, currency)}`}
                accessibilityState={{ selected: isSelected }}
              >
                <View
                  style={[
                    styles.bar,
                    {
                      width: barWidth,
                      height,
                      backgroundColor: fillColor,
                      borderTopLeftRadius: 3,
                      borderTopRightRadius: 3,
                      borderBottomLeftRadius: bucket.amount === 0 ? 2 : 0,
                      borderBottomRightRadius: bucket.amount === 0 ? 2 : 0,
                    },
                  ]}
                />
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ─── X-Axis Time / Period Labels ──────────────────────────── */}
      <View style={styles.labelsContainer}>
        {period === "WEEKLY" ? (
          // Center label under each of the 7 days
          <View style={styles.weeklyLabelsRow}>
            {xAxisLabels.map((item) => (
              <View key={item.index} style={[styles.weeklyLabelCol, { width: slotWidth }]}>
                <Text
                  style={[
                    styles.axisText,
                    {
                      color:
                        selectedBucketIndex === item.index
                          ? colors.primary
                          : colors.fgSubtle,
                      fontWeight:
                        selectedBucketIndex === item.index
                          ? fontWeight.bold
                          : fontWeight.medium,
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          // Positioned labels at key intervals
          <View style={styles.spacedLabelsRow}>
            {xAxisLabels.map((item) => {
              const labelLeft = (item.index + 0.5) * slotWidth;
              return (
                <View
                  key={item.index}
                  style={[
                    styles.labelPositionWrapper,
                    { left: labelLeft },
                  ]}
                >
                  <Text
                    style={[
                      styles.axisText,
                      {
                        color:
                          selectedBucketIndex === item.index
                            ? colors.primary
                            : colors.fgSubtle,
                        fontWeight:
                          selectedBucketIndex === item.index
                            ? fontWeight.bold
                            : fontWeight.medium,
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chartWrapper: {
    width: "100%",
    marginTop: spacing[3],
  },
  barsContainer: {
    width: "100%",
    position: "relative",
    justifyContent: "flex-end",
  },
  barsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: "100%",
    width: "100%",
  },
  barSlot: {
    height: "100%",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  bar: {
    // Top corners rounded, sharing exact baseline
  },
  tooltipContainer: {
    position: "absolute",
    minWidth: ESTIMATED_TOOLTIP_WIDTH,
    height: TOOLTIP_HEIGHT,
    paddingHorizontal: spacing[2],
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 3,
  },
  tooltipText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    textAlign: "center",
  },
  tooltipArrow: {
    position: "absolute",
    bottom: -5,
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 5,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  labelsContainer: {
    marginTop: spacing[2],
    height: 18,
    width: "100%",
  },
  weeklyLabelsRow: {
    flexDirection: "row",
    width: "100%",
  },
  weeklyLabelCol: {
    alignItems: "center",
    justifyContent: "center",
  },
  spacedLabelsRow: {
    position: "relative",
    width: "100%",
    height: 18,
  },
  labelPositionWrapper: {
    position: "absolute",
    transform: [{ translateX: -16 }],
    width: 32,
    alignItems: "center",
  },
  axisText: {
    fontSize: 10,
    textAlign: "center",
  },
});

