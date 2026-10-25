import React from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  Platform,
  useColorScheme,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import Svg, {
  Path,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
} from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { radius, spacing, fontSize, fontWeight } from "@/constants/tokens";
import { haptics } from "@/utils/haptics";
import { resolveCategoryVisual } from "@/utils/categoryResolver";
import { CategoryVisual } from "@/components/ui/CategoryVisual";
import {
  AIStatCardData,
  AICategoryBreakdownData,
  AIComparisonData,
  AIBudgetHealthData,
  AITransactionListData,
  AIAffordabilityData,
  AIAccountBalanceData,
  AIFollowUp,
  AIStructuredCard,
} from "@/services/ai/aiTypes";

// ─── Helper: Split Currency Amount (Large Integer + Micro Decimal Cents) ──────
// Replicates the typography from the reference image: "$27 935.78" & "$859.21"
function SplitAmount({
  value,
  color,
  size = "large",
  style,
}: {
  value: string;
  color?: string;
  size?: "medium" | "large" | "hero";
  style?: any;
}) {
  const colors = useColors();
  const textColor = color || colors.fg;

  // Clean any duplicate minus signs (e.g. "--₹50" -> "-₹50", "- -50" -> "-50")
  const sanitizedValue = (value || "").replace(/[-–—]{2,}/g, "-");

  // Extract currency symbol, integer part, and decimal part
  // e.g. "₹27,935.78" or "-$859.21" or "₹4,250"
  const match = sanitizedValue.match(/^(.*?)(\d[\d,\s]*)(?:\.(\d+))?(.*)$/);

  if (!match) {
    return (
      <Text
        style={[
          size === "hero"
            ? styles.amountHero
            : size === "large"
              ? styles.amountLarge
              : styles.amountMedium,
          { color: textColor },
          style,
        ]}
      >
        {value}
      </Text>
    );
  }

  const prefix = match[1] || "";
  const integer = match[2] || "";
  const decimal = match[3] ? `.${match[3]}` : "";
  const suffix = match[4] || "";

  const intStyle =
    size === "hero"
      ? styles.amountHero
      : size === "large"
        ? styles.amountLarge
        : styles.amountMedium;

  const decStyle =
    size === "hero"
      ? styles.amountHeroDecimal
      : size === "large"
        ? styles.amountLargeDecimal
        : styles.amountMediumDecimal;

  return (
    <View style={[styles.splitAmountRow, style]}>
      <Text style={[intStyle, { color: textColor }]}>
        {prefix}
        {integer}
      </Text>
      {decimal ? (
        <Text
          style={[decStyle, { color: color ? `${color}B8` : colors.fgMuted }]}
        >
          {decimal}
        </Text>
      ) : null}
      {suffix ? (
        <Text
          style={[decStyle, { color: color ? `${color}B8` : colors.fgMuted }]}
        >
          {suffix}
        </Text>
      ) : null}
    </View>
  );
}

// ─── Micro Component: Smooth Sparkline Curve (as seen on Reference Card 5) ────
function SparklineWave({
  color,
  width = 160,
  height = 36,
}: {
  color: string;
  width?: number;
  height?: number;
}) {
  return (
    <Svg width={width} height={height} viewBox="0 0 160 36">
      <Defs>
        <SvgLinearGradient id="waveGlow" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity="0.25" />
          <Stop offset="1" stopColor={color} stopOpacity="0.0" />
        </SvgLinearGradient>
      </Defs>
      <Path
        d="M 0 28 C 30 10, 45 32, 75 14 C 105 -4, 125 24, 160 8 L 160 36 L 0 36 Z"
        fill="url(#waveGlow)"
      />
      <Path
        d="M 0 28 C 30 10, 45 32, 75 14 C 105 -4, 125 24, 160 8"
        fill="none"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ─── Micro Component: Segmented Bar (Uber Eats / Dash Tracker Style) ──────────
function SegmentedBar({
  totalSegments = 5,
  activeSegments = 3,
  activeColor,
  inactiveColor,
  height = 5,
}: {
  totalSegments?: number;
  activeSegments?: number;
  activeColor: string;
  inactiveColor: string;
  height?: number;
}) {
  return (
    <View style={styles.segmentedBarRow}>
      {Array.from({ length: totalSegments }).map((_, idx) => {
        const isActive = idx < activeSegments;
        return (
          <View
            key={`seg-${idx}`}
            style={[
              styles.segmentedBarPill,
              {
                height,
                backgroundColor: isActive ? activeColor : inactiveColor,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

// ─── 1. Stat Card (Clean Glassmorphism Widget with Split Amount & Trend) ──────
export function StatCard({ data }: { data: AIStatCardData }) {
  const colors = useColors();
  const isUp = data.trend === "up";
  const isDown = data.trend === "down";
  const trendColor = isUp
    ? colors.error
    : isDown
      ? colors.income
      : colors.fgMuted;

  return (
    <View
      style={[
        styles.widgetCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      {/* Top Header Row with Title & Date/Pill */}
      <View style={styles.widgetHeaderRow}>
        <Text style={[styles.widgetSubLabel, { color: colors.fgMuted }]}>
          {data.title}
        </Text>
        {data.tag ? (
          <View
            style={[
              styles.widgetTagPill,
              {
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.widgetTagText, { color: colors.fgSubtle }]}>
              {data.tag}
            </Text>
          </View>
        ) : (
          <Text style={[styles.headerDateLabel, { color: colors.fgSubtle }]}>
            {new Date().toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </Text>
        )}
      </View>

      {/* Hero Tabular Split Amount with Micro Ring Badge */}
      <View style={styles.statMetricRow}>
        <SplitAmount value={data.value} size="large" />

        <View
          style={[
            styles.miniCircleIndicator,
            {
              backgroundColor: `${trendColor}16`,
              borderColor: `${trendColor}25`,
            },
          ]}
        >
          <Feather
            name={
              isUp ? "arrow-up-right" : isDown ? "arrow-down-right" : "activity"
            }
            size={14}
            color={trendColor}
          />
        </View>
      </View>

      {/* Subtitle / Sub-card Detail if available */}
      {data.subtitle && (
        <Text
          style={[
            styles.statSubtitleText,
            { color: colors.fgMuted, marginBottom: spacing[2] },
          ]}
          numberOfLines={2}
        >
          {data.subtitle}
        </Text>
      )}

      {/* Trend Row & Micro Wave Sparkline */}
      <View style={styles.statFooterRow}>
        {data.changeText && (
          <View
            style={[
              styles.trendBadgePill,
              {
                backgroundColor: `${trendColor}15`,
                borderColor: `${trendColor}25`,
              },
            ]}
          >
            <Feather
              name={
                isUp ? "arrow-up-right" : isDown ? "arrow-down-right" : "minus"
              }
              size={11}
              color={trendColor}
            />
            <Text style={[styles.trendBadgeText, { color: trendColor }]}>
              {data.changeText}
            </Text>
          </View>
        )}

        {/* Decorative Wave Sparkline */}
        <View style={styles.sparklineContainer}>
          <SparklineWave color={trendColor} width={100} height={24} />
        </View>
      </View>

      {/* Decorative Segmented Track at bottom */}
      <SegmentedBar
        totalSegments={5}
        activeSegments={isUp ? 4 : isDown ? 2 : 3}
        activeColor={trendColor}
        inactiveColor={colors.surfaceElevated}
        height={4}
      />
    </View>
  );
}

// ─── 2. Category Breakdown Card (Spending by Category — Emil Kowalski Design Eng) ────
export function CategoryBreakdownCard({
  data,
  onPressCategory,
}: {
  data: AICategoryBreakdownData;
  onPressCategory?: (categoryName: string) => void;
}) {
  const colors = useColors();
  const isDark = colors.isDark;
  const topCategory = data.categories[0];
  const otherCategories = data.categories.slice(1, 4);
  const topVisual = topCategory ? resolveCategoryVisual(topCategory.name) : null;
  const topColor = topCategory?.color || topVisual?.palette.primary || colors.primary;

  return (
    <View
      style={[
        styles.widgetCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      {/* Header with icon title & period tag pill */}
      <View style={styles.widgetHeaderRow}>
        <View style={styles.categoryHeaderTitleGroup}>
          <Feather name="pie-chart" size={13} color={colors.primary} style={{ marginRight: 6 }} />
          <Text style={[styles.widgetSubLabel, { color: colors.fgMuted }]}>
            {data.title || "Spending by Category"}
          </Text>
        </View>
        <View
          style={[
            styles.widgetTagPill,
            {
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.05)",
              borderColor: isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)",
            },
          ]}
        >
          <Text style={[styles.widgetTagText, { color: colors.fg }]}>
            {data.period || "This Month"}
          </Text>
        </View>
      </View>

      {/* Hero Category Total with Split Amount */}
      <View style={{ marginBottom: spacing[3] }}>
        <SplitAmount value={data.totalAmount} size="large" />
      </View>

      {/* Multi-Colored Segmented Distribution Bar (8px capsule track with 3px gaps) */}
      {data.categories.length > 0 && (
        <View style={styles.proportionalSegmentBar}>
          {data.categories.map((c, i) => {
            const cVisual = resolveCategoryVisual(c.name);
            const segColor = c.color || cVisual.palette.primary || (i === 0 ? colors.primary : colors.fgSubtle);
            return (
              <View
                key={`${c.name}-${i}`}
                style={[
                  styles.proportionalSegmentChunk,
                  {
                    flex: Math.max(c.percentage, 6),
                    backgroundColor: segColor,
                  },
                ]}
              />
            );
          })}
        </View>
      )}

      {/* Top Primary Category Spotlight Card (Tactile scale(0.98), elevated glass, tabular numbers) */}
      {topCategory && topVisual && (
        <Pressable
          onPress={() => {
            void haptics.selection();
            onPressCategory?.(topCategory.name);
          }}
          disabled={!onPressCategory}
          style={({ pressed }) => [
            styles.spotlightCard,
            {
              backgroundColor: colors.surfaceElevated,
              borderColor: isDark ? `${topColor}35` : `${topColor}25`,
            },
            pressed && { transform: [{ scale: 0.98 }], opacity: 0.92 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Top category: ${topCategory.name}, ${topCategory.percentage}%`}
        >
          <View style={styles.spotlightHeader}>
            <View style={styles.spotlightLeft}>
              <CategoryVisual
                categoryName={topCategory.name}
                color={topColor}
                size={32}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.spotlightTitle, { color: colors.fg }]}
                  numberOfLines={1}
                >
                  {topCategory.name}
                </Text>
                <Text style={[styles.spotlightSub, { color: colors.fgMuted }]}>
                  Largest expense driver
                </Text>
              </View>
            </View>

            {/* Percentage pill with tabular-nums */}
            <View
              style={[
                styles.percentPill,
                {
                  backgroundColor: `${topColor}18`,
                  borderColor: `${topColor}30`,
                },
              ]}
            >
              <Text
                style={[
                  styles.percentPillText,
                  { color: topColor, fontVariant: ["tabular-nums"] },
                ]}
              >
                {topCategory.percentage}%
              </Text>
            </View>
          </View>

          <View style={styles.spotlightValueRow}>
            <SplitAmount value={topCategory.formattedAmount} size="medium" />
            {onPressCategory && (
              <View
                style={[
                  styles.spotlightArrowPill,
                  { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" },
                ]}
              >
                <Feather
                  name="arrow-up-right"
                  size={13}
                  color={topColor}
                />
              </View>
            )}
          </View>

          {/* Smooth fill track with rounded ends */}
          <View
            style={[
              styles.progressBarTrack,
              { backgroundColor: colors.surfaceRecessed },
            ]}
          >
            <View
              style={[
                styles.progressBarFill,
                {
                  backgroundColor: topColor,
                  width: `${Math.min(Math.max(topCategory.percentage, 8), 100)}%`,
                },
              ]}
            />
          </View>
        </Pressable>
      )}

      {/* Secondary Categories List with Inset Dividers & Tactile Row Selection */}
      {otherCategories.length > 0 && (
        <View style={styles.modularItemList}>
          {otherCategories.map((cat, idx) => {
            const catVisual = resolveCategoryVisual(cat.name);
            const catColor = cat.color || catVisual.palette.primary || colors.fgMuted;
            return (
              <Pressable
                key={`${cat.name}-${idx}`}
                onPress={() => {
                  void haptics.selection();
                  onPressCategory?.(cat.name);
                }}
                disabled={!onPressCategory}
                style={({ pressed }) => [
                  styles.modularItemRow,
                  { borderBottomColor: colors.border },
                  idx === otherCategories.length - 1 && { borderBottomWidth: 0 },
                  pressed && {
                    transform: [{ scale: 0.985 }],
                    opacity: 0.85,
                    backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${cat.name}: ${cat.formattedAmount}`}
              >
                <View style={styles.modularItemLeft}>
                  <CategoryVisual
                    categoryName={cat.name}
                    color={catColor}
                    size={28}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.modularItemName, { color: colors.fg }]}
                      numberOfLines={1}
                    >
                      {cat.name}
                    </Text>
                    <Text
                      style={[styles.accountMetaText, { color: colors.fgMuted }]}
                    >
                      {cat.percentage}% of total
                    </Text>
                  </View>
                </View>
                <View style={styles.modularItemRight}>
                  <SplitAmount value={cat.formattedAmount} size="medium" />
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

// ─── 3. Comparison Card (Split 2-Column Minimal & Clean Layout) ───────────────
export function ComparisonCard({ data }: { data: AIComparisonData }) {
  const colors = useColors();
  const isLower = data.direction === "lower";
  const isHigher = data.direction === "higher";
  const diffColor = isLower
    ? colors.income
    : isHigher
      ? colors.error
      : colors.fgMuted;

  return (
    <View
      style={[
        styles.widgetCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.widgetHeaderRow}>
        <Text style={[styles.widgetSubLabel, { color: colors.fgMuted }]}>
          {data.title || "Month-over-Month Comparison"}
        </Text>
        <View
          style={[
            styles.trendBadgePill,
            {
              backgroundColor: `${diffColor}18`,
              borderColor: `${diffColor}25`,
            },
          ]}
        >
          <Feather
            name={
              isLower
                ? "arrow-down-right"
                : isHigher
                  ? "arrow-up-right"
                  : "minus"
            }
            size={12}
            color={diffColor}
          />
          <Text style={[styles.trendBadgeText, { color: diffColor }]}>
            {data.diffAmount} ({data.diffPercentage}%)
          </Text>
        </View>
      </View>

      {/* Split Comparison Columns Row */}
      <View style={styles.splitCompareRow}>
        {/* Left Side: Current Period */}
        <View
          style={[
            styles.splitCompareCol,
            {
              backgroundColor: colors.surfaceElevated,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.splitColLabel, { color: colors.fgSubtle }]}>
            {data.currentLabel}
          </Text>
          <SplitAmount value={data.currentAmount} size="medium" />
        </View>

        {/* Center Divider Icon */}
        <View
          style={[
            styles.splitCenterIcon,
            {
              backgroundColor: `${diffColor}18`,
              borderColor: `${diffColor}25`,
            },
          ]}
        >
          <Feather
            name={
              isLower ? "trending-down" : isHigher ? "trending-up" : "activity"
            }
            size={14}
            color={diffColor}
          />
        </View>

        {/* Right Side: Previous Period */}
        <View
          style={[
            styles.splitCompareCol,
            {
              backgroundColor: colors.surfaceElevated,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.splitColLabel, { color: colors.fgSubtle }]}>
            {data.previousLabel}
          </Text>
          <SplitAmount
            value={data.previousAmount}
            color={colors.fgMuted}
            size="medium"
          />
        </View>
      </View>

      {/* Comparative Progress Indicator */}
      <SegmentedBar
        totalSegments={5}
        activeSegments={isLower ? 2 : 4}
        activeColor={diffColor}
        inactiveColor={colors.surfaceElevated}
        height={4}
      />

      {/* Bottom Verdict Banner */}
      <View
        style={[
          styles.verdictBanner,
          {
            backgroundColor: `${diffColor}10`,
            borderColor: `${diffColor}25`,
          },
        ]}
      >
        <Feather
          name={isLower ? "check-circle" : "alert-circle"}
          size={14}
          color={diffColor}
        />
        <Text style={[styles.verdictBannerText, { color: diffColor }]}>
          {data.verdict}
        </Text>
      </View>
    </View>
  );
}

// ─── 4. Budget Health Card (Minimal Pacing with 3-Column Metrics) ─────────────
export function BudgetHealthCard({
  data,
  onPressBudget,
}: {
  data: AIBudgetHealthData;
  onPressBudget?: () => void;
}) {
  const colors = useColors();
  const statusColor =
    data.paceStatus === "on_track"
      ? colors.income
      : data.paceStatus === "caution"
        ? colors.warning
        : colors.error;

  const statusLabel =
    data.paceStatus === "on_track"
      ? "On Track"
      : data.paceStatus === "caution"
        ? "Caution"
        : "Over Budget";

  const numSegments = 6;
  const activeSegments = Math.min(
    Math.round((data.percentageUsed / 100) * numSegments),
    numSegments,
  );

  return (
    <Pressable
      onPress={() => {
        if (onPressBudget) {
          void haptics.selection();
          onPressBudget();
        }
      }}
      disabled={!onPressBudget}
      style={({ pressed }) => [
        styles.widgetCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        pressed && { opacity: 0.8 },
      ]}
    >
      {/* Header */}
      <View style={styles.widgetHeaderRow}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={[styles.widgetSubLabel, { color: colors.fgMuted }]}>
            {data.title || "Monthly Budget Health"}
          </Text>
          {onPressBudget && (
            <Feather name="arrow-up-right" size={13} color={colors.fgSubtle} />
          )}
        </View>
        <View
          style={[
            styles.statusPill,
            {
              backgroundColor: `${statusColor}18`,
              borderColor: `${statusColor}25`,
            },
          ]}
        >
          <Text style={[styles.statusPillText, { color: statusColor }]}>
            {statusLabel}
          </Text>
        </View>
      </View>

      {/* Spent Amount vs Total Cap with Split Amount */}
      <View style={styles.budgetAmountGroup}>
        <SplitAmount value={data.spentAmount} size="large" />
        <Text style={[styles.budgetTotalCap, { color: colors.fgMuted }]}>
          of {data.totalBudget} limit
        </Text>
      </View>

      {/* Segmented Dash Tracker */}
      <View style={{ marginVertical: spacing[3] }}>
        <SegmentedBar
          totalSegments={numSegments}
          activeSegments={activeSegments}
          activeColor={statusColor}
          inactiveColor={colors.surfaceElevated}
          height={6}
        />
      </View>

      {/* 3-Column Metrics Row */}
      <View
        style={[
          styles.modularStatsRow,
          {
            backgroundColor: colors.surfaceElevated,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.modularStatCol}>
          <Text style={[styles.modularStatLabel, { color: colors.fgSubtle }]}>
            Remaining
          </Text>
          <Text
            style={[
              styles.modularStatValue,
              { color: statusColor },
              Platform.OS === "ios" ? { fontVariant: ["tabular-nums"] } : null,
            ]}
          >
            {data.remainingAmount}
          </Text>
        </View>
        <View
          style={[
            styles.modularStatDivider,
            { backgroundColor: colors.border },
          ]}
        />
        <View style={styles.modularStatCol}>
          <Text style={[styles.modularStatLabel, { color: colors.fgSubtle }]}>
            Days Left
          </Text>
          <Text style={[styles.modularStatValue, { color: colors.fg }]}>
            {data.daysRemainingInMonth} days
          </Text>
        </View>
        <View
          style={[
            styles.modularStatDivider,
            { backgroundColor: colors.border },
          ]}
        />
        <View style={styles.modularStatCol}>
          <Text style={[styles.modularStatLabel, { color: colors.fgSubtle }]}>
            Pace Used
          </Text>
          <Text style={[styles.modularStatValue, { color: colors.fg }]}>
            {data.percentageUsed}%
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

// ─── 5. Affordability Card (Clean Decision Engine) ───────────────────────────
export function AffordabilityCard({ data }: { data: AIAffordabilityData }) {
  const colors = useColors();
  const isDark = useColorScheme() === "dark";
  const status = data.status || (data.canAfford ? "SAFE" : "NOT_RECOMMENDED");
  const isSafe = status === "SAFE";
  const isCaution = status === "CAUTION";

  const statusColor = isSafe
    ? colors.income
    : isCaution
      ? colors.warning
      : colors.expense;

  const statusLabel = isSafe
    ? "Safe to Buy"
    : isCaution
      ? "Caution"
      : "Exceeds Margin";

  // Parse numeric values to calculate remaining liquidity cushion percentage
  const currentNum =
    parseFloat(String(data.currentBalance).replace(/[^0-9.-]+/g, "")) || 0;
  const postNum =
    parseFloat(String(data.postPurchaseBalance).replace(/[^0-9.-]+/g, "")) || 0;
  const cushionPercent =
    currentNum > 0
      ? Math.min(Math.max(Math.round((postNum / currentNum) * 100), 0), 100)
      : null;

  return (
    <View
      style={[
        styles.widgetCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      {/* Header with Evaluation Title and Status Pill */}
      <View style={styles.widgetHeaderRow}>
        <View style={styles.categoryHeaderTitleGroup}>
          <Feather name="shield" size={14} color={colors.fgMuted} />
          <Text style={[styles.widgetSubLabel, { color: colors.fgMuted }]}>
            Affordability Evaluation
          </Text>
        </View>
        <View
          style={[
            styles.statusPill,
            {
              backgroundColor: `${statusColor}18`,
              borderColor: `${statusColor}35`,
            },
          ]}
        >
          <Feather
            name={
              isSafe ? "check-circle" : isCaution ? "alert-triangle" : "x-circle"
            }
            size={12}
            color={statusColor}
            style={{ marginRight: 4 }}
          />
          <Text style={[styles.statusPillText, { color: statusColor }]}>
            {statusLabel}
          </Text>
        </View>
      </View>

      {/* Hero Cost & Target Item Chip */}
      <View style={{ marginTop: spacing[1], marginBottom: spacing[3] }}>
        <SplitAmount value={data.cost} size="large" style={{ marginBottom: spacing[2] }} />
        {data.item ? (
          <View
            style={[
              styles.targetItemTag,
              {
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.06)"
                  : "rgba(0, 0, 0, 0.04)",
                borderColor: colors.border,
              },
            ]}
          >
            <Feather name="tag" size={11} color={colors.fgMuted} />
            <Text
              style={[styles.targetItemText, { color: colors.fg }]}
              numberOfLines={1}
            >
              Target item: {data.item}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Liquidity Cushion Micro-Bar (if computable) */}
      {cushionPercent !== null && (
        <View style={[styles.cushionBarContainer, { marginBottom: spacing[3] }]}>
          <View style={styles.cushionBarHeader}>
            <Text style={[styles.cushionBarLabel, { color: colors.fgSubtle }]}>
              Retained Liquidity Cushion
            </Text>
            <Text
              style={[
                styles.cushionBarPercent,
                { color: statusColor },
                Platform.OS === "ios" ? { fontVariant: ["tabular-nums"] } : null,
              ]}
            >
              {cushionPercent}%
            </Text>
          </View>
          <View
            style={[
              styles.cushionTrack,
              { backgroundColor: colors.surfaceRecessed },
            ]}
          >
            <View
              style={[
                styles.cushionFill,
                {
                  backgroundColor: statusColor,
                  width: `${cushionPercent}%`,
                },
              ]}
            />
          </View>
        </View>
      )}

      {/* 2-Column Split Metric Card */}
      <View
        style={[
          styles.modularStatsRow,
          {
            backgroundColor: colors.surfaceElevated,
            borderColor: colors.border,
            marginBottom: spacing[3],
          },
        ]}
      >
        <View style={styles.modularStatCol}>
          <Text style={[styles.modularStatLabel, { color: colors.fgSubtle }]}>
            Current Balance
          </Text>
          <Text
            style={[
              styles.modularStatValue,
              { color: colors.fg },
              Platform.OS === "ios" ? { fontVariant: ["tabular-nums"] } : null,
            ]}
          >
            {data.currentBalance}
          </Text>
        </View>
        <View
          style={[
            styles.modularStatDivider,
            { backgroundColor: colors.border },
          ]}
        />
        <View style={styles.modularStatCol}>
          <Text style={[styles.modularStatLabel, { color: colors.fgSubtle }]}>
            Buffer Remaining
          </Text>
          <Text
            style={[
              styles.modularStatValue,
              { color: statusColor },
              Platform.OS === "ios" ? { fontVariant: ["tabular-nums"] } : null,
            ]}
          >
            {data.postPurchaseBalance}
          </Text>
        </View>
      </View>

      {/* High-Craft Advice Strip with Left Accent Edge */}
      <View
        style={[
          styles.adviceBox,
          {
            backgroundColor: `${statusColor}0C`,
            borderColor: `${statusColor}22`,
            borderLeftColor: statusColor,
            borderLeftWidth: 3.5,
          },
        ]}
      >
        <View
          style={[
            styles.adviceIconTile,
            { backgroundColor: `${statusColor}18` },
          ]}
        >
          <Feather
            name={isSafe ? "shield" : isCaution ? "info" : "alert-circle"}
            size={13}
            color={statusColor}
          />
        </View>
        <Text style={[styles.adviceText, { color: colors.fg }]}>
          {data.advice}
        </Text>
      </View>
    </View>
  );
}

// ─── 6. Account Balance Card (Clean Cobalt Blue Glassmorphic Aesthetic) ──────
export function AccountBalanceCard({
  data,
  onPressAccount,
}: {
  data: AIAccountBalanceData;
  onPressAccount?: (account: any) => void;
}) {
  const colors = useColors();

  return (
    <LinearGradient
      colors={["#2952E3", "#1B3BBB"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.widgetCard, styles.cobaltCard]}
    >
      {/* Header matching Reference Card 5 */}
      <View style={styles.widgetHeaderRow}>
        <View style={styles.cobaltAddressPill}>
          <Feather name="credit-card" size={12} color="#FFFFFF" />
          <Text style={styles.cobaltAddressText}>
            {data.title || "Total Net Worth"}
          </Text>
        </View>

        <View style={styles.cobaltTagPill}>
          <Text style={styles.cobaltTagText}>
            {data.accounts.length}{" "}
            {data.accounts.length === 1 ? "Account" : "Accounts"}
          </Text>
        </View>
      </View>

      {/* Sparkline curve glowing across the card */}
      <View style={styles.cobaltWaveRow}>
        <SparklineWave color="#60A5FA" width={180} height={34} />
      </View>

      {/* Hero Net Worth Amount with Split Decimal Cents */}
      <View style={{ marginBottom: spacing[3] }}>
        <SplitAmount value={data.totalBalance} color="#FFFFFF" size="hero" />
      </View>

      {/* Proportional Segment Bar (Translucent glass segments) */}
      {data.accounts.length > 0 && (
        <View style={styles.proportionalSegmentBar}>
          {data.accounts.map((acc, idx) => (
            <View
              key={acc.id || idx}
              style={[
                styles.proportionalSegmentChunk,
                {
                  flex: Math.max(acc.percentage, 5),
                  backgroundColor:
                    idx === 0
                      ? "#FFFFFF"
                      : idx === 1
                        ? "#93C5FD"
                        : idx === 2
                          ? "#60A5FA"
                          : "rgba(255, 255, 255, 0.4)",
                },
              ]}
            />
          ))}
        </View>
      )}

      {/* Account Items List with Glass Rows */}
      <View style={styles.modularItemList}>
        {data.accounts.map((acc) => (
          <Pressable
            key={acc.id}
            onPress={() => onPressAccount && onPressAccount(acc)}
            disabled={!onPressAccount}
            style={({ pressed }) => [
              styles.cobaltAccountRow,
              pressed && { opacity: 0.75 },
            ]}
          >
            <View style={styles.modularItemLeft}>
              <View
                style={[
                  styles.verticalIndicatorBar,
                  { backgroundColor: acc.color || "#93C5FD" },
                ]}
              />
              <View>
                <Text style={styles.cobaltAccountName}>{acc.name}</Text>
                <Text style={styles.cobaltAccountMeta}>
                  {acc.type} • {acc.percentage}%
                </Text>
              </View>
            </View>

            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <SplitAmount value={acc.balance} color="#FFFFFF" size="medium" />
              {onPressAccount && (
                <Feather
                  name="chevron-right"
                  size={14}
                  color="rgba(255, 255, 255, 0.6)"
                />
              )}
            </View>
          </Pressable>
        ))}
      </View>
    </LinearGradient>
  );
}

// ─── 7. Transaction List Card (Clean Minimal Layout matching Reference Cards 2 & 4) ───
export function TransactionListCard({
  data,
  onPressTransaction,
  onViewAllTransactions,
}: {
  data: AITransactionListData;
  onPressTransaction?: (tx: any) => void;
  onViewAllTransactions?: (data: AITransactionListData) => void;
}) {
  const colors = useColors();

  return (
    <View
      style={[
        styles.widgetCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      {/* Header with Title & Date on Right */}
      <View style={styles.widgetHeaderRow}>
        <Text style={[styles.widgetSubLabel, { color: colors.fgMuted }]}>
          {data.title}
        </Text>
        <Text style={[styles.headerDateLabel, { color: colors.fgSubtle }]}>
          {new Date().toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </Text>
      </View>

      {/* Subtitle if available */}
      {data.subtitle && (
        <Text
          style={[
            styles.statSubtitleText,
            { color: colors.fgMuted, marginBottom: spacing[3] },
          ]}
        >
          {data.subtitle}
        </Text>
      )}

      {/* Itemized Transactions with Colored Vertical Indicators (from Reference Card 4) */}
      <View style={styles.modularItemList}>
        {data.transactions.slice(0, 6).map((tx, idx) => {
          // Palette for vertical indicator bars
          const indicatorColors = [
            "#3B82F6", // blue
            "#F59E0B", // amber
            "#10B981", // emerald
            "#8B5CF6", // purple
            "#EC4899", // pink
            "#06B6D4", // cyan
          ];
          const barColor = indicatorColors[idx % indicatorColors.length];

          return (
            <Pressable
              key={tx.id}
              onPress={() => {
                if (onPressTransaction) {
                  void haptics.selection();
                  onPressTransaction(tx);
                }
              }}
              disabled={!onPressTransaction}
              style={({ pressed }) => [
                styles.transactionItemRow,
                { borderBottomColor: colors.surfaceElevated },
                pressed && { opacity: 0.65 },
              ]}
            >
              <View style={styles.modularItemLeft}>
                {/* Vertical colored indicator bar from reference */}
                <View
                  style={[
                    styles.verticalIndicatorBar,
                    { backgroundColor: barColor },
                  ]}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.modularItemName, { color: colors.fg }]}
                    numberOfLines={1}
                  >
                    {tx.description}
                  </Text>
                  <Text
                    style={[styles.accountMetaText, { color: colors.fgSubtle }]}
                  >
                    {tx.category} • {tx.date}
                  </Text>
                </View>
              </View>

              <View style={styles.txRowRight}>
                {(() => {
                  const raw = String(tx.amount || "").trim();
                  // Clean any existing leading dashes/pluses and embedded currency dashes (e.g. "--₹50", "₹-50", "-50")
                  const clean = raw
                    .replace(/^[\s\-–—+]+/, "")
                    .replace(/(\D)[\s\-–—+]+/g, "$1")
                    .trim();
                  const isIncome = tx.type === "INCOME";
                  const displayValue = isIncome ? `+${clean}` : `-${clean}`;
                  return (
                    <SplitAmount
                      value={displayValue}
                      size="medium"
                      color={isIncome ? colors.income : undefined}
                    />
                  );
                })()}
                {onPressTransaction && (
                  <View
                    style={[
                      styles.openActionPill,
                      {
                        backgroundColor: colors.surfaceElevated,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.openActionText, { color: colors.primary }]}
                    >
                      Open
                    </Text>
                    <Feather
                      name="chevron-right"
                      size={12}
                      color={colors.primary}
                    />
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Full-Width "See All" Action Pill Button (from Reference Card 2) */}
      {data.transactions.length > 0 && (
        <Pressable
          onPress={() => {
            void haptics.selection();
            if (onViewAllTransactions) {
              onViewAllTransactions(data);
            } else {
              const targetCategory =
                data.category ||
                (data.transactions.length > 0 &&
                data.transactions.every(
                  (t) =>
                    t.category &&
                    t.category.toLowerCase() ===
                      data.transactions[0].category.toLowerCase(),
                )
                  ? data.transactions[0].category
                  : undefined);

              router.push({
                pathname: "/(tabs)/expenses",
                params: {
                  ...(targetCategory ? { category: targetCategory } : {}),
                  ...(data.filterQuery ? { query: data.filterQuery } : {}),
                  ...(data.filterType ? { type: data.filterType } : {}),
                },
              });
            }
          }}
          style={({ pressed }) => [
            styles.seeAllFullButton,
            {
              backgroundColor: colors.surfaceElevated,
              borderColor: colors.border,
            },
            pressed && { opacity: 0.75, transform: [{ scale: 0.98 }] },
          ]}
        >
          <Text style={[styles.seeAllButtonText, { color: colors.primary }]}>
            {data.category
              ? `See all ${data.category} transactions`
              : "See all transactions"}
          </Text>
          <Feather name="arrow-right" size={14} color={colors.primary} />
        </Pressable>
      )}
    </View>
  );
}

// ─── 8. Follow-Up Prompt Chips ───────────────────────────────────────────────
export function FollowUpChips({
  followUps,
  onSelect,
}: {
  followUps: AIFollowUp[];
  onSelect: (query: string) => void;
}) {
  const colors = useColors();

  if (!followUps || followUps.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipsScroll}
    >
      {followUps.map((chip, idx) => (
        <Pressable
          key={`chip-${chip.label}-${idx}`}
          onPress={() => {
            void haptics.selection();
            onSelect(chip.query);
          }}
          style={({ pressed }) => [
            styles.chipPill,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
            pressed && { opacity: 0.7 },
          ]}
        >
          <Text style={[styles.chipText, { color: colors.fg }]}>
            {chip.label}
          </Text>
          <Feather
            name="arrow-up-right"
            size={12}
            color={colors.primary}
            style={{ marginLeft: 4 }}
          />
        </Pressable>
      ))}
    </ScrollView>
  );
}

// ─── Dynamic Card Switcher ───────────────────────────────────────────────────
export function AIResponseCardRenderer({
  card,
  onPressCategory,
  onPressBudget,
  onPressTransaction,
  onViewAllTransactions,
}: {
  card: AIStructuredCard;
  onPressCategory?: (categoryName: string) => void;
  onPressBudget?: () => void;
  onPressTransaction?: (tx: any) => void;
  onViewAllTransactions?: (data: AITransactionListData) => void;
}) {
  switch (card.type) {
    case "stat":
      return <StatCard data={card} />;
    case "category_breakdown":
      return (
        <CategoryBreakdownCard data={card} onPressCategory={onPressCategory} />
      );
    case "comparison":
      return <ComparisonCard data={card} />;
    case "budget_health":
      return <BudgetHealthCard data={card} onPressBudget={onPressBudget} />;
    case "affordability":
      return <AffordabilityCard data={card} />;
    case "account_balance":
      return <AccountBalanceCard data={card} />;
    case "transaction_list":
      return (
        <TransactionListCard
          data={card}
          onPressTransaction={onPressTransaction}
          onViewAllTransactions={onViewAllTransactions}
        />
      );
    default:
      return null;
  }
}

export const AIStructuredCardRenderer = AIResponseCardRenderer;

// ─── STYLES: Apple HIG, Glassmorphism, Minimal & Clean Layout ────────────────
const styles = StyleSheet.create({
  widgetCard: {
    padding: spacing[4],
    borderRadius: 26,
    borderWidth: 1,
    borderCurve: "continuous",
    marginTop: spacing[2],
    // Diffused ambient elevation shadow (as seen in reference)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
  cobaltCard: {
    borderWidth: 0,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 6,
  },
  widgetHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[2],
  },
  widgetSubLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    letterSpacing: 0.3,
  },
  headerDateLabel: {
    fontSize: 11,
    fontWeight: fontWeight.medium,
  },
  widgetTagPill: {
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    borderRadius: radius.full,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
  },
  widgetTagText: {
    fontSize: 11,
    fontWeight: fontWeight.semibold,
  },

  // Split Amount Typography
  splitAmountRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  amountHero: {
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -0.8,
    fontVariant: ["tabular-nums"],
  },
  amountHeroDecimal: {
    fontSize: 20,
    fontWeight: "600",
    letterSpacing: -0.4,
    fontVariant: ["tabular-nums"],
  },
  amountLarge: {
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.6,
    fontVariant: ["tabular-nums"],
  },
  amountLargeDecimal: {
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: -0.3,
    fontVariant: ["tabular-nums"],
  },
  amountMedium: {
    fontSize: 17,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  amountMediumDecimal: {
    fontSize: 13,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },

  statMetricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[2],
  },
  miniCircleIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  statFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing[3],
  },
  sparklineContainer: {
    alignItems: "flex-end",
  },
  trendBadgePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  trendBadgeText: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
  },
  statSubtitleText: {
    fontSize: fontSize.xs,
  },
  segmentedBarRow: {
    flexDirection: "row",
    gap: 4,
    width: "100%",
  },
  segmentedBarPill: {
    flex: 1,
    borderRadius: 3,
  },
  proportionalSegmentBar: {
    flexDirection: "row",
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    gap: 3,
    marginBottom: spacing[3],
  },
  proportionalSegmentChunk: {
    height: "100%",
    borderRadius: 3,
  },

  // Vertical Indicator Bar (from Reference Card 4)
  verticalIndicatorBar: {
    width: 3.5,
    height: 28,
    borderRadius: 2,
    marginRight: spacing[2],
  },

  categoryHeaderTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  spotlightCard: {
    padding: spacing[3],
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: spacing[3],
    gap: spacing[2],
  },
  spotlightHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  spotlightLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: spacing[2],
  },
  spotlightIconTile: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  spotlightSub: {
    fontSize: 11,
    marginTop: 1,
  },
  spotlightArrowPill: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryMiniIconTile: {
    width: 28,
    height: 28,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  spotlightTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  percentPill: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  percentPillText: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
  },
  spotlightValueRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  modularItemList: {
    gap: spacing[1],
  },
  modularItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing[2],
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 46,
  },
  transactionItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing[2],
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 48,
  },
  modularItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  modularItemName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  modularItemRight: {
    alignItems: "flex-end",
  },
  accountMetaText: {
    fontSize: 11,
    marginTop: 2,
  },
  splitCompareRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    marginVertical: spacing[3],
  },
  splitCompareCol: {
    flex: 1,
    padding: spacing[3],
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 3,
  },
  splitColLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  splitCenterIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  verdictBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    padding: spacing[3],
    borderRadius: 16,
    borderWidth: 1,
    marginTop: spacing[3],
  },
  verdictBannerText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    flex: 1,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
  },
  budgetAmountGroup: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: spacing[2],
    marginTop: spacing[1],
  },
  budgetTotalCap: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  modularStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing[3],
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
  },
  modularStatCol: {
    flex: 1,
    alignItems: "center",
  },
  modularStatLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  modularStatValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  modularStatDivider: {
    width: 1,
    height: 24,
  },
  targetItemTag: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing[2],
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  targetItemText: {
    fontSize: 11,
    fontWeight: fontWeight.medium,
  },
  cushionBarContainer: {
    gap: 5,
  },
  cushionBarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cushionBarLabel: {
    fontSize: 11,
    fontWeight: fontWeight.medium,
  },
  cushionBarPercent: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
  },
  cushionTrack: {
    height: 5,
    borderRadius: radius.full,
    overflow: "hidden",
  },
  cushionFill: {
    height: "100%",
    borderRadius: radius.full,
  },
  adviceBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    padding: spacing[3],
    borderRadius: 16,
    borderWidth: 1,
  },
  adviceIconTile: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  adviceText: {
    fontSize: fontSize.xs,
    flex: 1,
    lineHeight: 18,
  },

  // Cobalt Blue Card Styles (Reference Card 5)
  cobaltAddressPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing[2],
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
  },
  cobaltAddressText: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: "#FFFFFF",
  },
  cobaltTagPill: {
    paddingHorizontal: spacing[2],
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: "rgba(255, 255, 255, 0.14)",
  },
  cobaltTagText: {
    fontSize: 11,
    fontWeight: fontWeight.medium,
    color: "rgba(255, 255, 255, 0.9)",
  },
  cobaltWaveRow: {
    marginVertical: spacing[1],
    alignItems: "flex-end",
  },
  cobaltAccountRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing[2],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255, 255, 255, 0.15)",
    minHeight: 46,
  },
  cobaltAccountName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: "#FFFFFF",
  },
  cobaltAccountMeta: {
    fontSize: 11,
    marginTop: 2,
    color: "rgba(255, 255, 255, 0.75)",
  },

  txRowRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  openActionPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  openActionText: {
    fontSize: 11,
    fontWeight: fontWeight.semibold,
  },

  // "See all" Full Width Button (Reference Card 2)
  seeAllFullButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 40,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: spacing[3],
  },
  seeAllButtonText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },

  chipsScroll: {
    gap: spacing[2],
    paddingVertical: spacing[1],
  },
  chipPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
    borderWidth: 1,
  },
  chipText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
});
