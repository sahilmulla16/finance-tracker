import React, { useMemo, useState, useCallback } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, G } from "react-native-svg";

import { useFinance, type Transaction } from "@/context/FinanceContext";
import { useColors } from "@/hooks/useColors";
import { fontSize, fontWeight, radius, spacing } from "@/constants/tokens";
import { money, formatTime, getLocalDateString } from "@/utils/format";
import { haptics } from "@/utils/haptics";
import { CategoryVisual } from "@/components/ui/CategoryVisual";
import { DateTimePickerModal } from "@/components/DateTimePickerModal";
import { QuickAddModal } from "@/components/QuickAddModal";
import { SpendingChart } from "@/components/SpendingChart";
import {
  calculateSpendingAnalytics,
  getPreviousPeriodAnchor,
  getNextPeriodAnchor,
  filterTransactionsForBucket,
  computeBucketDetails,
  buildSpendingDateParams,
  type SpendingPeriod,
} from "@/utils/dailySpend";

const PERIOD_OPTIONS: { key: SpendingPeriod; label: string }[] = [
  { key: "DAILY", label: "Daily" },
  { key: "WEEKLY", label: "Weekly" },
  { key: "MONTHLY", label: "Monthly" },
  { key: "YEARLY", label: "Yearly" },
];

export default function SpendingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { transactions, accounts, settings } = useFinance();

  const todayStr = useMemo(() => getLocalDateString(new Date()), []);
  const [period, setPeriod] = useState<SpendingPeriod>("DAILY");
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedBucketIndex, setSelectedBucketIndex] = useState<number | null>(null);
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Compute multi-period spending analytics
  const summary = useMemo(() => {
    return calculateSpendingAnalytics({
      transactions,
      accounts,
      selectedDate,
      period,
      todayDate: todayStr,
    });
  }, [transactions, accounts, selectedDate, period, todayStr]);

  // Handle switching periods
  const handlePeriodChange = useCallback((newPeriod: SpendingPeriod) => {
    void haptics.selection();
    setPeriod(newPeriod);
    setSelectedBucketIndex(null);
  }, []);

  // Navigation handlers
  const handlePrevPeriod = useCallback(() => {
    void haptics.selection();
    setSelectedDate((prev) => getPreviousPeriodAnchor(prev, period));
    setSelectedBucketIndex(null);
  }, [period]);

  const handleNextPeriod = useCallback(() => {
    if (!summary.canNavigateForward) return;
    void haptics.selection();
    setSelectedDate((prev) => getNextPeriodAnchor(prev, period, todayStr));
    setSelectedBucketIndex(null);
  }, [period, summary.canNavigateForward, todayStr]);

  const handleJumpToCurrent = useCallback(() => {
    void haptics.selection();
    setSelectedDate(todayStr);
    setSelectedBucketIndex(null);
  }, [todayStr]);

  const handleDateConfirm = useCallback((newDate: string) => {
    setIsDatePickerVisible(false);
    if (newDate) {
      void haptics.selection();
      setSelectedDate(newDate);
      setSelectedBucketIndex(null);
    }
  }, []);

  // Currently selected bucket info
  const selectedBucket =
    selectedBucketIndex !== null && selectedBucketIndex >= 0 && selectedBucketIndex < summary.chartBuckets.length
      ? summary.chartBuckets[selectedBucketIndex]
      : null;

  // Derive active display data: when a chart bucket is selected, filter the ENTIRE page to that interval
  const activeDisplay = useMemo(() => {
    if (selectedBucketIndex !== null && selectedBucket) {
      const bucketTxns = filterTransactionsForBucket(
        summary.periodTransactions,
        period,
        selectedBucket,
        selectedDate,
      );
      const details = computeBucketDetails(bucketTxns, accounts);
      return {
        isBucketSelected: true,
        bucketLabel: selectedBucket.fullLabel,
        totalSpent: details.totalSpent,
        transactionCount: details.transactionCount,
        averageSpend: details.averageSpend,
        categories: details.categories,
        paymentMethods: details.paymentMethods,
        topMerchant: details.topMerchant,
        transactions: details.transactions,
        statSubtext: `in ${selectedBucket.fullLabel}`,
      };
    }

    return {
      isBucketSelected: false,
      bucketLabel: null,
      totalSpent: summary.totalSpent,
      transactionCount: summary.transactionCount,
      averageSpend: summary.averageSpend,
      categories: summary.categories,
      paymentMethods: summary.paymentMethods,
      topMerchant: summary.topMerchant,
      transactions: summary.periodTransactions,
      statSubtext:
        summary.prevTransactionCount > 0
          ? `${
              summary.transactionCount - summary.prevTransactionCount >= 0
                ? "+"
                : ""
            }${
              summary.transactionCount - summary.prevTransactionCount
            } vs ${summary.prevPeriodLabel}`
          : summary.transactionCount > 0
          ? "First spend of cycle"
          : `0 ${summary.prevPeriodLabel}`,
    };
  }, [selectedBucketIndex, selectedBucket, summary, period, selectedDate, accounts]);

  // Donut chart parameters for payment methods
  const donutData = useMemo(() => {
    if (activeDisplay.totalSpent <= 0 || activeDisplay.paymentMethods.length === 0) {
      return [];
    }
    const size = 100;
    const strokeWidth = 14;
    const radiusVal = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radiusVal;

    let accumulatedPct = 0;
    return activeDisplay.paymentMethods.map((m) => {
      const pct = m.amount / activeDisplay.totalSpent;
      const strokeDashoffset = circumference * (1 - pct);
      const rotation = accumulatedPct * 360;
      accumulatedPct += pct;
      return {
        ...m,
        circumference,
        strokeDashoffset,
        rotation,
        radiusVal,
        strokeWidth,
      };
    });
  }, [activeDisplay.totalSpent, activeDisplay.paymentMethods]);

  const visibleCategories = showAllCategories
    ? activeDisplay.categories
    : activeDisplay.categories.slice(0, 4);

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      {/* ─── Top Header Bar ────────────────────────────────────────── */}
      <View
        style={[
          styles.headerBar,
          {
            paddingTop: Math.max(insets.top, 14),
            backgroundColor: colors.canvas,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={12}
          onPress={() => {
            void haptics.selection();
            router.back();
          }}
          style={[
            styles.iconButton,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Feather name="arrow-left" size={20} color={colors.fg} />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.fg }]}>
            Spending
          </Text>
        </View>

        {!summary.isCurrentPeriod ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Jump to current period"
            onPress={handleJumpToCurrent}
            style={[
              styles.todayPill,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.todayPillText, { color: colors.primary }]}>
              Current
            </Text>
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Period Selector (Daily | Weekly | Monthly | Yearly) ──── */}
        <View
          style={[
            styles.periodSelectorWrapper,
            { backgroundColor: colors.surfaceRecessed, borderColor: colors.border },
          ]}
        >
          {PERIOD_OPTIONS.map((opt) => {
            const isActive = period === opt.key;
            return (
              <Pressable
                key={opt.key}
                accessibilityRole="button"
                accessibilityLabel={`${opt.label} view`}
                onPress={() => handlePeriodChange(opt.key)}
                style={[
                  styles.periodOption,
                  isActive && {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderWidth: 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.periodOptionText,
                    {
                      color: isActive ? colors.fg : colors.fgMuted,
                      fontWeight: isActive ? fontWeight.bold : fontWeight.medium,
                    },
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ─── Date / Range Navigation Carousel ────────────────────── */}
        <View style={styles.dateSelectorRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Previous period"
            hitSlop={8}
            onPress={handlePrevPeriod}
            style={[
              styles.dateNavBtn,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Feather name="chevron-left" size={20} color={colors.fg} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Select period, currently ${summary.periodRangeLabel}`}
            disabled={period !== "DAILY"}
            onPress={() => {
              if (period === "DAILY") {
                void haptics.selection();
                setIsDatePickerVisible(true);
              }
            }}
            style={[
              styles.dateDisplayPill,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Feather
              name="calendar"
              size={15}
              color={colors.primary}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.dateDisplayText, { color: colors.fg }]}>
              {summary.periodRangeLabel}
            </Text>
            {period === "DAILY" && (
              <Feather
                name="chevron-down"
                size={14}
                color={colors.fgMuted}
                style={{ marginLeft: 6 }}
              />
            )}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Next period"
            disabled={!summary.canNavigateForward}
            hitSlop={8}
            onPress={handleNextPeriod}
            style={[
              styles.dateNavBtn,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                opacity: summary.canNavigateForward ? 1 : 0.35,
              },
            ]}
          >
            <Feather
              name="chevron-right"
              size={20}
              color={summary.canNavigateForward ? colors.fg : colors.fgSubtle}
            />
          </Pressable>
        </View>

        {/* ─── Section A: Hero Spending Card ───────────────────────── */}
        <View
          style={[
            styles.heroCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {/* Top Label & Period-over-Period Pill */}
          <View style={styles.heroHeaderRow}>
            <Text style={[styles.heroCardLabel, { color: colors.fgMuted }]}>
              {summary.heroTitle}
            </Text>

            {summary.changeLabel ? (
              <View
                style={[
                  styles.changePill,
                  summary.changeDirection === "increase"
                    ? {
                        backgroundColor: colors.isDark
                          ? "rgba(240, 68, 56, 0.16)"
                          : "rgba(240, 68, 56, 0.10)",
                        borderColor: colors.isDark
                          ? "rgba(240, 68, 56, 0.3)"
                          : "rgba(240, 68, 56, 0.2)",
                      }
                    : summary.changeDirection === "decrease"
                    ? {
                        backgroundColor: colors.isDark
                          ? "rgba(18, 183, 106, 0.16)"
                          : "rgba(18, 183, 106, 0.10)",
                        borderColor: colors.isDark
                          ? "rgba(18, 183, 106, 0.3)"
                          : "rgba(18, 183, 106, 0.2)",
                      }
                    : {
                        backgroundColor: colors.surfaceElevated,
                        borderColor: colors.border,
                      },
                ]}
              >
                {summary.changeDirection === "increase" ? (
                  <Feather
                    name="arrow-up-right"
                    size={12}
                    color={colors.expense}
                    style={{ marginRight: 3 }}
                  />
                ) : summary.changeDirection === "decrease" ? (
                  <Feather
                    name="arrow-down-right"
                    size={12}
                    color={colors.income}
                    style={{ marginRight: 3 }}
                  />
                ) : null}
                <Text
                  style={[
                    styles.changePillText,
                    {
                      color:
                        summary.changeDirection === "increase"
                          ? colors.expense
                          : summary.changeDirection === "decrease"
                          ? colors.income
                          : colors.fgMuted,
                    },
                  ]}
                >
                  {summary.changeLabel}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Large Hero Amount */}
          <Text style={[styles.heroAmount, { color: colors.fg }]}>
            {money(summary.totalSpent, settings.currency)}
          </Text>

          <Text style={[styles.heroSubtitle, { color: colors.fgMuted }]}>
            {summary.transactionCount > 0
              ? `Across ${summary.transactionCount} ${
                  summary.transactionCount === 1 ? "transaction" : "transactions"
                }`
              : "No expenses logged for this period"}
          </Text>

          {/* Interactive Mini Bar Chart matching reference */}
          <SpendingChart
            buckets={summary.chartBuckets}
            selectedBucketIndex={selectedBucketIndex}
            onSelectBucket={setSelectedBucketIndex}
            period={period}
            currency={settings.currency}
            xAxisLabels={summary.xAxisLabels}
          />

          {/* Selected Bucket Details Banner */}
          <View
            style={[
              styles.bucketDetailsBanner,
              {
                backgroundColor: colors.isDark ? "#1C201E" : "#F4F6F9",
                borderColor: colors.border,
              },
            ]}
          >
            {selectedBucket ? (
              <View style={styles.bucketDetailsInner}>
                <View style={styles.bucketDetailsLeft}>
                  <View
                    style={[
                      styles.bucketDot,
                      { backgroundColor: colors.primary },
                    ]}
                  />
                  <Text style={[styles.bucketFullLabel, { color: colors.fg }]}>
                    {selectedBucket.fullLabel}
                  </Text>
                </View>
                <View style={styles.bucketDetailsRight}>
                  <Text
                    style={[styles.bucketDetailsAmount, { color: colors.fg }]}
                  >
                    {money(selectedBucket.amount, settings.currency)}
                  </Text>
                  <Text
                    style={[styles.bucketDetailsCount, { color: colors.fgMuted }]}
                  >
                    ({selectedBucket.count} txns)
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Clear bar selection"
                    hitSlop={10}
                    onPress={() => {
                      void haptics.selection();
                      setSelectedBucketIndex(null);
                    }}
                    style={styles.clearBucketBtn}
                  >
                    <Feather name="x" size={14} color={colors.fgMuted} />
                  </Pressable>
                </View>
              </View>
            ) : (
              <Text style={[styles.bucketBannerEmpty, { color: colors.fgMuted }]}>
                {summary.totalSpent > 0
                  ? "Tap any bar to inspect amount and details"
                  : "No spending recorded in this period"}
              </Text>
            )}
          </View>
        </View>

        {/* ─── Section B: Two Compact Statistic Cards ──────────────── */}
        <View style={styles.statsRow}>
          {/* Card 1: Transactions */}
          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.statCardHeader}>
              <View
                style={[
                  styles.statIconBadge,
                  { backgroundColor: colors.surfaceElevated },
                ]}
              >
                <Feather name="activity" size={16} color={colors.primary} />
              </View>
              <Text style={[styles.statCardTitle, { color: colors.fgMuted }]}>
                Transactions
              </Text>
            </View>
            <Text style={[styles.statCardValue, { color: colors.fg }]}>
              {activeDisplay.transactionCount}
            </Text>
            <Text style={[styles.statCardSub, { color: colors.fgMuted }]}>
              {activeDisplay.statSubtext}
            </Text>
          </View>

          {/* Card 2: Average Spend */}
          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.statCardHeader}>
              <View
                style={[
                  styles.statIconBadge,
                  { backgroundColor: colors.surfaceElevated },
                ]}
              >
                <Feather name="trending-up" size={16} color={colors.primary} />
              </View>
              <Text style={[styles.statCardTitle, { color: colors.fgMuted }]}>
                Average Spend
              </Text>
            </View>
            <Text style={[styles.statCardValue, { color: colors.fg }]}>
              {money(activeDisplay.averageSpend, settings.currency)}
            </Text>
            <Text style={[styles.statCardSub, { color: colors.fgMuted }]}>
              per transaction
            </Text>
          </View>
        </View>

        {/* ─── Section C: Top Categories ──────────────────────────── */}
        <View
          style={[
            styles.cardBlock,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open categories in Expenses"
            onPress={() => {
              void haptics.selection();
              router.push({
                pathname: "/category-expenses",
                params: {
                  category: "All",
                  ...buildSpendingDateParams(period, selectedDate, selectedBucket),
                },
              });
            }}
            style={styles.cardBlockHeader}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={[styles.sectionHeading, { color: colors.fg }]}>
                Top Categories
              </Text>
              <Feather name="chevron-right" size={16} color={colors.fgMuted} />
            </View>
            {activeDisplay.categories.length > 0 && (
              <View
                style={[
                  styles.badgePill,
                  { backgroundColor: colors.surfaceElevated },
                ]}
              >
                <Text style={[styles.badgeText, { color: colors.fgMuted }]}>
                  {activeDisplay.categories.length}{" "}
                  {activeDisplay.categories.length === 1 ? "category" : "categories"}
                </Text>
              </View>
            )}
          </Pressable>

          {activeDisplay.categories.length > 0 ? (
            <View style={styles.categoriesList}>
              {visibleCategories.map((cat, idx) => (
                <Pressable
                  key={cat.id || cat.name || idx}
                  onPress={() => {
                    void haptics.selection();
                    router.push({
                      pathname: "/category-expenses",
                      params: {
                        category: cat.name,
                        ...buildSpendingDateParams(period, selectedDate, selectedBucket),
                      },
                    });
                  }}
                  style={[
                    styles.categoryRow,
                    idx < visibleCategories.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                    },
                  ]}
                >
                  <CategoryVisual
                    categoryName={cat.name}
                    size="medium"
                    style={{ marginRight: spacing[3] }}
                  />

                  <View style={styles.categoryInfo}>
                    <View style={styles.categoryTextRow}>
                      <Text
                        style={[styles.categoryName, { color: colors.fg }]}
                        numberOfLines={1}
                      >
                        {cat.name}
                      </Text>
                      <Text
                        style={[styles.categoryAmount, { color: colors.fg }]}
                      >
                        {money(cat.amount, settings.currency)}
                      </Text>
                    </View>

                    {/* Horizontal Progress Bar */}
                    <View
                      style={[
                        styles.progressBarBg,
                        {
                          backgroundColor: colors.isDark
                            ? "#1F2320"
                            : "#F0F2F5",
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            width: `${Math.min(Math.max(cat.percentage, 2), 100)}%`,
                            backgroundColor: colors.primary,
                          },
                        ]}
                      />
                    </View>

                    <View style={styles.categoryMetaRow}>
                      <Text
                        style={[styles.categoryMetaText, { color: colors.fgMuted }]}
                      >
                        {cat.count} {cat.count === 1 ? "txn" : "txns"}
                      </Text>
                      <Text
                        style={[styles.categoryMetaText, { color: colors.fgMuted }]}
                      >
                        {cat.percentage}% of {activeDisplay.isBucketSelected ? "interval" : "period"}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              ))}

              {activeDisplay.categories.length > 4 && (
                <Pressable
                  onPress={() => {
                    void haptics.selection();
                    setShowAllCategories((prev) => !prev);
                  }}
                  style={[
                    styles.seeAllBtn,
                    { borderTopWidth: 1, borderTopColor: colors.border },
                  ]}
                >
                  <Text style={[styles.seeAllText, { color: colors.primary }]}>
                    {showAllCategories
                      ? "Show less"
                      : `See all (${activeDisplay.categories.length})`}
                  </Text>
                  <Feather
                    name={showAllCategories ? "chevron-up" : "chevron-down"}
                    size={16}
                    color={colors.primary}
                    style={{ marginLeft: 4 }}
                  />
                </Pressable>
              )}
            </View>
          ) : (
            <View style={styles.emptyCardContent}>
              <Feather
                name="pie-chart"
                size={28}
                color={colors.fgSubtle}
                style={{ marginBottom: 6 }}
              />
              <Text style={[styles.emptyCardText, { color: colors.fgMuted }]}>
                {activeDisplay.isBucketSelected
                  ? `No category spend in ${activeDisplay.bucketLabel}`
                  : "No category data for this period"}
              </Text>
            </View>
          )}
        </View>

        {/* ─── Section D: Payment Methods ─────────────────────────── */}
        <View
          style={[
            styles.cardBlock,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.cardBlockHeader}>
            <Text style={[styles.sectionHeading, { color: colors.fg }]}>
              Payment Methods
            </Text>
          </View>

          {donutData.length > 0 ? (
            <View style={styles.paymentMethodContainer}>
              {/* Donut Chart */}
              <View style={styles.donutWrapper}>
                <Svg width={100} height={100} viewBox="0 0 100 100">
                  <G rotation="-90" origin="50, 50">
                    <Circle
                      cx="50"
                      cy="50"
                      r="42"
                      stroke={colors.isDark ? "#222724" : "#EEF2F6"}
                      strokeWidth="14"
                      fill="none"
                    />
                    {donutData.map((seg, idx) => (
                      <Circle
                        key={seg.method || idx}
                        cx="50"
                        cy="50"
                        r={seg.radiusVal}
                        stroke={seg.color}
                        strokeWidth={seg.strokeWidth}
                        strokeDasharray={`${seg.circumference} ${seg.circumference}`}
                        strokeDashoffset={seg.strokeDashoffset}
                        rotation={seg.rotation}
                        origin="50, 50"
                        strokeLinecap="round"
                        fill="none"
                      />
                    ))}
                  </G>
                </Svg>
              </View>

              {/* Legend & Breakdown */}
              <View style={styles.methodList}>
                {activeDisplay.paymentMethods.map((m) => (
                  <View key={m.method} style={styles.methodRow}>
                    <View style={styles.methodLeft}>
                      <View
                        style={[
                          styles.methodColorDot,
                          { backgroundColor: m.color },
                        ]}
                      />
                      <Text
                        style={[styles.methodName, { color: colors.fg }]}
                        numberOfLines={1}
                      >
                        {m.method}
                      </Text>
                    </View>
                    <View style={styles.methodRight}>
                      <Text style={[styles.methodAmount, { color: colors.fg }]}>
                        {money(m.amount, settings.currency)}
                      </Text>
                      <Text
                        style={[styles.methodPct, { color: colors.fgMuted }]}
                      >
                        {m.percentage}%
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.emptyCardContent}>
              <Feather
                name="credit-card"
                size={28}
                color={colors.fgSubtle}
                style={{ marginBottom: 6 }}
              />
              <Text style={[styles.emptyCardText, { color: colors.fgMuted }]}>
                {activeDisplay.isBucketSelected
                  ? `No payment records for ${activeDisplay.bucketLabel}`
                  : "No payment method records for this period"}
              </Text>
            </View>
          )}
        </View>

        {/* ─── Section E: Top Merchant ────────────────────────────── */}
        <View
          style={[
            styles.cardBlock,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.cardBlockHeader}>
            <Text style={[styles.sectionHeading, { color: colors.fg }]}>
              Top Merchant
            </Text>
          </View>

          {activeDisplay.topMerchant ? (
            <View style={styles.merchantCardContent}>
              <View
                style={[
                  styles.merchantIconWrapper,
                  { backgroundColor: colors.surfaceElevated },
                ]}
              >
                <Feather name="shopping-bag" size={22} color={colors.primary} />
              </View>
              <View style={styles.merchantDetails}>
                <View style={styles.merchantTitleRow}>
                  <Text
                    style={[styles.merchantName, { color: colors.fg }]}
                    numberOfLines={1}
                  >
                    {activeDisplay.topMerchant.name}
                  </Text>
                  <Text style={[styles.merchantAmount, { color: colors.fg }]}>
                    {money(activeDisplay.topMerchant.amount, settings.currency)}
                  </Text>
                </View>
                <View style={styles.merchantMetaRow}>
                  <Text
                    style={[styles.merchantMetaText, { color: colors.fgMuted }]}
                  >
                    {activeDisplay.topMerchant.count}{" "}
                    {activeDisplay.topMerchant.count === 1
                      ? "transaction"
                      : "transactions"}
                  </Text>
                  <View
                    style={[
                      styles.merchantPctBadge,
                      { backgroundColor: colors.surfaceElevated },
                    ]}
                  >
                    <Text
                      style={[
                        styles.merchantPctText,
                        { color: colors.primary },
                      ]}
                    >
                      {activeDisplay.topMerchant.percentage}% of {activeDisplay.isBucketSelected ? "interval" : "period"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.emptyCardContent}>
              <Feather
                name="shopping-bag"
                size={28}
                color={colors.fgSubtle}
                style={{ marginBottom: 6 }}
              />
              <Text style={[styles.emptyCardText, { color: colors.fgMuted }]}>
                {activeDisplay.isBucketSelected
                  ? `No merchant spending in ${activeDisplay.bucketLabel}`
                  : "No merchant spending logged for this period"}
              </Text>
            </View>
          )}
        </View>

        {/* ─── Section F: Verified Period Transactions List ───────── */}
        <View
          style={[
            styles.cardBlock,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.cardBlockHeader}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={[styles.sectionHeading, { color: colors.fg }]}>
                Transactions
              </Text>
              {activeDisplay.isBucketSelected && (
                <Text style={{ fontSize: fontSize.xs, color: colors.primary, fontWeight: fontWeight.medium }}>
                  • {activeDisplay.bucketLabel}
                </Text>
              )}
            </View>
            <View
              style={[
                styles.badgePill,
                { backgroundColor: colors.surfaceElevated },
              ]}
            >
              <Text style={[styles.badgeText, { color: colors.fgMuted }]}>
                {activeDisplay.transactions.length}
              </Text>
            </View>
          </View>

          {activeDisplay.transactions.length > 0 ? (
            <View style={styles.txList}>
              {activeDisplay.transactions.map((tx, idx) => (
                <Pressable
                  key={tx.id || idx}
                  onPress={() => {
                    void haptics.selection();
                    setEditingTransaction(tx);
                  }}
                  style={[
                    styles.txRow,
                    idx < activeDisplay.transactions.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                    },
                  ]}
                >
                  <CategoryVisual
                    categoryName={tx.category}
                    size="medium"
                    style={{ marginRight: spacing[3] }}
                  />

                  <View style={styles.txInfo}>
                    <Text
                      style={[styles.txDescription, { color: colors.fg }]}
                      numberOfLines={1}
                    >
                      {tx.description || tx.category || "Expense"}
                    </Text>
                    <Text
                      style={[styles.txTime, { color: colors.fgMuted }]}
                    >
                      {tx.date} {tx.time ? `• ${formatTime(tx.time)}` : ""} • {tx.category || "General"}
                    </Text>
                  </View>

                  <Text style={[styles.txAmount, { color: colors.fg }]}>
                    -{money(tx.amount, settings.currency)}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <View style={styles.emptyCardContent}>
              <Feather
                name="inbox"
                size={28}
                color={colors.fgSubtle}
                style={{ marginBottom: 6 }}
              />
              <Text style={[styles.emptyCardText, { color: colors.fgMuted }]}>
                {activeDisplay.isBucketSelected
                  ? `No transactions in ${activeDisplay.bucketLabel}`
                  : "No transactions recorded for this period"}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Date Picker Modal (for Daily mode) */}
      <DateTimePickerModal
        visible={isDatePickerVisible}
        currentDate={selectedDate}
        onConfirm={handleDateConfirm}
        onClose={() => setIsDatePickerVisible(false)}
      />

      {/* Edit Transaction Modal */}
      {editingTransaction && (
        <QuickAddModal
          visible={!!editingTransaction}
          onClose={() => setEditingTransaction(null)}
          editingTransaction={editingTransaction}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  todayPill: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radius.full,
    borderWidth: 1,
  },
  todayPillText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  scrollContent: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
  },
  periodSelectorWrapper: {
    flexDirection: "row",
    borderRadius: radius.full,
    padding: 3,
    marginBottom: spacing[3],
    borderWidth: 1,
  },
  periodOption: {
    flex: 1,
    paddingVertical: spacing[2],
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  periodOptionText: {
    fontSize: fontSize.xs,
  },
  dateSelectorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing[4],
  },
  dateNavBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dateDisplayPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
    borderWidth: 1,
  },
  dateDisplayText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  heroCard: {
    borderRadius: radius.xl,
    padding: spacing[5],
    borderWidth: 1,
    marginBottom: spacing[4],
  },
  heroHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing[1],
  },
  heroCardLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.8,
  },
  changePill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  changePillText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  heroAmount: {
    fontSize: 34,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.5,
    marginVertical: spacing[1],
  },
  heroSubtitle: {
    fontSize: fontSize.sm,
    marginBottom: spacing[2],
  },
  bucketDetailsBanner: {
    marginTop: spacing[3],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: radius.md,
    borderWidth: 1,
  },
  bucketDetailsInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bucketDetailsLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  bucketDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  bucketFullLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  bucketDetailsRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  bucketDetailsAmount: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    marginRight: 4,
  },
  bucketDetailsCount: {
    fontSize: 10,
  },
  clearBucketBtn: {
    marginLeft: 6,
    padding: 2,
    borderRadius: radius.full,
  },
  bucketBannerEmpty: {
    fontSize: fontSize.xs,
    textAlign: "center",
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  statCard: {
    flex: 1,
    borderRadius: radius.lg,
    padding: spacing[4],
    borderWidth: 1,
  },
  statCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing[2],
  },
  statIconBadge: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing[2],
  },
  statCardTitle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  statCardValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    marginBottom: 2,
  },
  statCardSub: {
    fontSize: 11,
  },
  cardBlock: {
    borderRadius: radius.xl,
    padding: spacing[4],
    borderWidth: 1,
    marginBottom: spacing[4],
  },
  cardBlockHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing[3],
  },
  sectionHeading: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  badgePill: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: fontWeight.medium,
  },
  categoriesList: {
    marginTop: spacing[1],
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing[3],
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  categoryName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  categoryAmount: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  progressBarBg: {
    height: 5,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 4,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  categoryMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryMetaText: {
    fontSize: 11,
  },
  seeAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: spacing[3],
    marginTop: spacing[1],
  },
  seeAllText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  paymentMethodContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing[1],
  },
  donutWrapper: {
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing[4],
  },
  methodList: {
    flex: 1,
  },
  methodRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 5,
  },
  methodLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  methodColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing[2],
  },
  methodName: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  methodRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  methodAmount: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    marginRight: 6,
  },
  methodPct: {
    fontSize: 11,
    width: 32,
    textAlign: "right",
  },
  merchantCardContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing[1],
  },
  merchantIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing[3],
  },
  merchantDetails: {
    flex: 1,
  },
  merchantTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  merchantName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    flex: 1,
    marginRight: spacing[2],
  },
  merchantAmount: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  merchantMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  merchantMetaText: {
    fontSize: fontSize.xs,
  },
  merchantPctBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  merchantPctText: {
    fontSize: 11,
    fontWeight: fontWeight.semibold,
  },
  emptyCardContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[5],
  },
  emptyCardText: {
    fontSize: fontSize.sm,
  },
  txList: {
    marginTop: spacing[1],
  },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing[3],
  },
  txInfo: {
    flex: 1,
  },
  txDescription: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    marginBottom: 2,
  },
  txTime: {
    fontSize: 11,
  },
  txAmount: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
});

