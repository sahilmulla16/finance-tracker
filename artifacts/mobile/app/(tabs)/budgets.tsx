import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFinance } from "@/context/FinanceContext";
import { useColors } from "@/hooks/useColors";
import { money } from "@/utils/format";
import { spacing, radius, fontSize, fontWeight } from "@/constants/tokens";
import { CategoryVisual, CategoryProgressCard } from "@/components/ui";
import { haptics } from "@/utils/haptics";
import {
  SegmentedCategoryRing,
  CategorySegmentData,
} from "@/components/SegmentedCategoryRing";
import {
  CategoryBudgetModal,
  CategoryBudgets,
} from "@/components/CategoryBudgetModal";

const BUDGET_STORAGE_KEY = "@pocketflow/monthly_budget";
const CATEGORY_BUDGETS_STORAGE_KEY = "@pocketflow/category_budgets";

type WidgetViewOption = "all" | "pace" | "safe" | "spikes";

function ProgressRing({
  percentage,
  size = 140,
  strokeWidth = 12,
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}) {
  const colors = useColors();
  const radiusVal = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radiusVal;
  const clampedPct = Math.max(0, Math.min(percentage, 100));
  const strokeDashoffset = circumference - (clampedPct / 100) * circumference;

  const ringColor =
    percentage > 90
      ? colors.error || "#EF4444"
      : percentage > 75
        ? colors.warning || "#F59E0B"
        : colors.primary;

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Svg
        width={size}
        height={size}
        style={{ transform: [{ rotate: "-90deg" }] }}
      >
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radiusVal}
          stroke={colors.surfaceRecessed}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radiusVal}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
      <View
        style={[
          StyleSheet.absoluteFillObject,
          { alignItems: "center", justifyContent: "center" },
        ]}
      >
        <Text style={[styles.ringPercent, { color: colors.fg }]}>
          {Math.round(percentage)}%
        </Text>
        <Text style={[styles.ringSubText, { color: colors.fgMuted }]}>
          Used
        </Text>
      </View>
    </View>
  );
}

export default function InsightsScreen() {
  const { transactions, categories, settings } = useFinance();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [customBudget, setCustomBudget] = useState<number | null>(null);
  const [budgetModalVisible, setBudgetModalVisible] = useState(false);
  const [budgetInput, setBudgetInput] = useState("");
  const [activeWidget, setActiveWidget] = useState<WidgetViewOption>("all");

  // Per-category budgets and interactive selection state
  const [selectedCategoryName, setSelectedCategoryName] = useState<
    string | null
  >(null);
  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudgets>({});
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);

  // Load custom monthly budget and category budgets from storage
  useEffect(() => {
    AsyncStorage.getItem(BUDGET_STORAGE_KEY).then((val) => {
      if (val) {
        const num = parseFloat(val);
        if (!isNaN(num) && num > 0) {
          setCustomBudget(num);
        }
      }
    });

    AsyncStorage.getItem(CATEGORY_BUDGETS_STORAGE_KEY).then((val) => {
      if (val) {
        try {
          const parsed = JSON.parse(val);
          if (parsed && typeof parsed === "object") {
            setCategoryBudgets(parsed);
          }
        } catch {
          // ignore corrupted data
        }
      }
    });
  }, []);

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const selYear = selectedDate.getFullYear();
  const selMonth = selectedDate.getMonth();
  const now = new Date();
  const isCurrentMonth =
    selYear === now.getFullYear() && selMonth === now.getMonth();

  const handlePrevMonth = () => {
    void Haptics.selectionAsync();
    setSelectedDate(new Date(selYear, selMonth - 1, 1));
  };

  const handleNextMonth = () => {
    void Haptics.selectionAsync();
    setSelectedDate(new Date(selYear, selMonth + 1, 1));
  };

  const handleResetCurrentMonth = () => {
    void Haptics.selectionAsync();
    setSelectedDate(new Date());
  };

  // Month date boundaries
  const monthStart = useMemo(
    () => new Date(selYear, selMonth, 1),
    [selYear, selMonth],
  );
  const monthEnd = useMemo(
    () => new Date(selYear, selMonth + 1, 0, 23, 59, 59, 999),
    [selYear, selMonth],
  );

  const daysInMonth = useMemo(
    () => new Date(selYear, selMonth + 1, 0).getDate(),
    [selYear, selMonth],
  );

  const daysPassed = isCurrentMonth ? Math.max(1, now.getDate()) : daysInMonth;
  const daysRemaining = isCurrentMonth
    ? Math.max(1, daysInMonth - now.getDate())
    : 0;

  // Filtered transactions for selected month
  const monthExpenses = useMemo(
    () =>
      transactions.filter(
        (t) =>
          t.type === "EXPENSE" &&
          new Date(t.date) >= monthStart &&
          new Date(t.date) <= monthEnd,
      ),
    [transactions, monthStart, monthEnd],
  );

  const monthIncome = useMemo(
    () =>
      transactions.filter(
        (t) =>
          t.type === "INCOME" &&
          new Date(t.date) >= monthStart &&
          new Date(t.date) <= monthEnd,
      ),
    [transactions, monthStart, monthEnd],
  );

  const totalExpense = useMemo(
    () => monthExpenses.reduce((sum, t) => sum + t.amount, 0),
    [monthExpenses],
  );

  const totalIncome = useMemo(
    () => monthIncome.reduce((sum, t) => sum + t.amount, 0),
    [monthIncome],
  );

  // Default fallback budget: income, or 1.25x expense, or 50,000
  const totalBudget = useMemo(() => {
    if (customBudget && customBudget > 0) return customBudget;
    if (totalIncome > 0) return totalIncome;
    return Math.max(totalExpense * 1.25, 50000);
  }, [customBudget, totalIncome, totalExpense]);

  const budgetUsed =
    totalBudget > 0 ? Math.min((totalExpense / totalBudget) * 100, 100) : 0;
  const remaining = Math.max(totalBudget - totalExpense, 0);

  // Category totals
  const categoryTotals = useMemo(() => {
    const groups: Record<string, number> = {};
    for (const t of monthExpenses) {
      const cat = t.category || "Other";
      groups[cat] = (groups[cat] || 0) + t.amount;
    }
    // Include any categories that have an active budget set even if 0 spent
    Object.keys(categoryBudgets).forEach((cat) => {
      if (categoryBudgets[cat] > 0 && groups[cat] === undefined) {
        groups[cat] = 0;
      }
    });

    return Object.entries(groups)
      .map(([name, amount]) => {
        const nameLower = name.toLowerCase();
        const matchedCategory =
          categories.find((c) => c.name.toLowerCase() === nameLower) ||
          categories.find((c) => {
            const cLower = c.name.toLowerCase();
            return (
              cLower.includes(nameLower) ||
              nameLower.includes(cLower) ||
              (nameLower === "bills" &&
                (cLower.includes("bill") || cLower.includes("util"))) ||
              (nameLower === "utility" &&
                (cLower.includes("util") || cLower.includes("bill"))) ||
              (nameLower === "transport" &&
                (cLower.includes("transport") || cLower.includes("travel")))
            );
          });

        return {
          name,
          amount,
          percentage:
            totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
          category: matchedCategory,
        };
      })
      .sort((a, b) => {
        if (b.amount !== a.amount) return b.amount - a.amount;
        return a.name.localeCompare(b.name);
      });
  }, [monthExpenses, categories, categoryBudgets, totalExpense]);

  // Dynamic category budget resolver with intelligent fallback
  const getCategoryBudget = useCallback(
    (categoryName: string) => {
      if (categoryBudgets[categoryName] && categoryBudgets[categoryName] > 0) {
        return categoryBudgets[categoryName];
      }
      const foundKey = Object.keys(categoryBudgets).find(
        (k) => k.toLowerCase() === categoryName.toLowerCase(),
      );
      if (foundKey && categoryBudgets[foundKey] > 0) {
        return categoryBudgets[foundKey];
      }
      // Calculate remaining pool among unset categories
      const explicitAllocated = Object.entries(categoryBudgets).reduce(
        (sum, [key, val]) =>
          val > 0 && key !== categoryName ? sum + val : sum,
        0,
      );
      const configuredCount = Object.keys(categoryBudgets).filter(
        (key) => categoryBudgets[key] > 0,
      ).length;
      const totalCount = Math.max(categories.length, categoryTotals.length, 1);
      const remainingCount = Math.max(totalCount - configuredCount, 1);
      const remainingPool = Math.max(totalBudget - explicitAllocated, 0);
      return remainingPool / remainingCount;
    },
    [categoryBudgets, categories.length, categoryTotals.length, totalBudget],
  );

  // Save updated category budgets to storage
  const handleSaveCategoryBudgets = async (newBudgets: CategoryBudgets) => {
    setCategoryBudgets(newBudgets);
    await AsyncStorage.setItem(
      CATEGORY_BUDGETS_STORAGE_KEY,
      JSON.stringify(newBudgets),
    );
    void haptics.success();
  };

  // Map of category expenses for modal
  const categoryExpensesMap = useMemo(() => {
    const map: Record<string, number> = {};
    categoryTotals.forEach((c) => {
      map[c.name] = c.amount;
    });
    return map;
  }, [categoryTotals]);

  // Color palette for category ring
  const PALETTE = useMemo(
    () => [
      "#FBBF24",
      "#84CC16",
      "#F472B6",
      "#60A5FA",
      "#34D399",
      "#F59E0B",
      "#A78BFA",
      "#FB7185",
    ],
    [],
  );

  // Prepare CategorySegmentData for SegmentedCategoryRing
  const ringCategories = useMemo<CategorySegmentData[]>(() => {
    return categoryTotals.map((item, index) => {
      const catBudget = getCategoryBudget(item.name);
      const catPctOfBudget =
        catBudget > 0 ? Math.round((item.amount / catBudget) * 100) : 0;

      const txCount = monthExpenses.filter(
        (t) => (t.category || "Other") === item.name,
      ).length;

      const nameLower = item.name.toLowerCase();
      let color = item.category?.color || PALETTE[index % PALETTE.length];
      if (
        nameLower.includes("food") ||
        nameLower.includes("restaurant") ||
        nameLower.includes("dining")
      ) {
        color = "#FF8A00";
      } else if (nameLower.includes("grocer")) {
        color = "#10D078";
      } else if (
        nameLower.includes("transport") ||
        nameLower.includes("travel")
      ) {
        color = "#3B82F6";
      } else if (nameLower.includes("shop")) {
        color = "#EC4899";
      } else if (nameLower.includes("entertain")) {
        color = "#A855F7";
      } else if (nameLower.includes("health")) {
        color = "#EF4444";
      }

      return {
        name: item.name,
        amount: item.amount,
        budget: catBudget,
        percentageOfTotal: item.percentage,
        percentageOfBudget: catPctOfBudget,
        color,
        icon: item.category?.icon || item.name,
        transactionCount: txCount,
      };
    });
  }, [categoryTotals, getCategoryBudget, monthExpenses, PALETTE]);

  // Currently selected category data
  const selectedCategoryData = useMemo(() => {
    if (!selectedCategoryName) return null;
    return ringCategories.find((c) => c.name === selectedCategoryName) || null;
  }, [ringCategories, selectedCategoryName]);

  // Insight Calculations
  const dailyBurnRate = totalExpense / daysPassed;
  const projectedTotal = dailyBurnRate * daysInMonth;
  const isPacingOver = projectedTotal > totalBudget;
  const safeDailyAllowance =
    isCurrentMonth && daysRemaining > 0 ? remaining / daysRemaining : 0;
  const topSpikeCategory = categoryTotals[0] || null;

  const handleSaveBudget = async () => {
    const val = parseFloat(budgetInput.replace(/,/g, "").trim());
    if (!isNaN(val) && val > 0) {
      void haptics.low();
      setCustomBudget(val);
      await AsyncStorage.setItem(BUDGET_STORAGE_KEY, String(val));
    }
    setBudgetModalVisible(false);
  };

  const openBudgetModal = () => {
    setBudgetInput(totalBudget.toString());
    setBudgetModalVisible(true);
    void Haptics.selectionAsync();
  };

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.canvas }]}
      contentContainerStyle={{
        paddingTop: insets.top + spacing[5],
        paddingBottom: 130,
        paddingHorizontal: spacing[4],
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1, marginRight: spacing[2] }}>
          <Text
            style={[styles.headerTitle, { color: colors.fg }]}
            numberOfLines={1}
          >
            Budgets & Insights
          </Text>
          <Text
            style={[styles.headerSub, { color: colors.fgMuted }]}
            numberOfLines={1}
          >
            Track limits, burn rate & forecasts
          </Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => {
              void haptics.selection();
              setCategoryModalVisible(true);
            }}
            style={[styles.headerBtn, { backgroundColor: colors.surface }]}
            accessibilityLabel="Category Budgets"
          >
            <Feather name="sliders" size={16} color={colors.primary} />
          </Pressable>

          <Pressable
            onPress={openBudgetModal}
            style={[styles.headerBtn, { backgroundColor: colors.surface }]}
            accessibilityLabel="Adjust Budget"
          >
            <Feather name="edit-2" size={16} color={colors.fg} />
          </Pressable>
        </View>
      </View>

      {/* Month Selector */}
      <View style={styles.monthSelectorWrapper}>
        <View
          style={[styles.monthSelector, { backgroundColor: colors.surface }]}
        >
          <Pressable
            onPress={handlePrevMonth}
            style={styles.monthNavBtn}
            hitSlop={8}
          >
            <Feather name="chevron-left" size={20} color={colors.fg} />
          </Pressable>
          <View style={styles.monthLabelContainer}>
            <Text style={[styles.monthText, { color: colors.fg }]}>
              {monthNames[selMonth]} {selYear}
            </Text>
          </View>
          <Pressable
            onPress={handleNextMonth}
            style={styles.monthNavBtn}
            hitSlop={8}
          >
            <Feather name="chevron-right" size={20} color={colors.fg} />
          </Pressable>
        </View>

        {!isCurrentMonth && (
          <Pressable
            onPress={handleResetCurrentMonth}
            style={[
              styles.todayBadge,
              { backgroundColor: `${colors.primary}16` },
            ]}
          >
            <Feather name="rotate-ccw" size={12} color={colors.primary} />
            <Text style={[styles.todayBadgeText, { color: colors.primary }]}>
              Current Month
            </Text>
          </Pressable>
        )}
      </View>

      {/* Segmented Category Ring Chart matching reference design */}
      <View style={[styles.ringCard, { backgroundColor: colors.surface }]}>
        <SegmentedCategoryRing
          categories={ringCategories}
          totalSpent={totalExpense}
          totalBudget={totalBudget}
          currency={settings.currency}
          selectedCategoryName={selectedCategoryName}
          onSelectCategory={(catName) => {
            void haptics.selection();
            setSelectedCategoryName(catName);
          }}
          size={280}
          strokeWidth={24}
        />

        {/* Ring Footer Status & Actions */}
        <View style={styles.ringInfo}>
          <Text style={[styles.ringValue, { color: colors.fg }]}>
            {money(totalExpense, settings.currency)}
          </Text>
          <Pressable
            onPress={openBudgetModal}
            style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
          >
            <Text style={[styles.ringSub, { color: colors.fgMuted }]}>
              of {money(totalBudget, settings.currency)} total budget
            </Text>
            <Feather name="edit-2" size={12} color={colors.primary} />
          </Pressable>
        </View>

        {/* Quick Helper Text */}
        <Text style={[styles.ringHelpHint, { color: colors.fgSubtle }]}>
          {selectedCategoryName
            ? `Selected: ${selectedCategoryName} • Tap again to clear`
            : "Tap any slice or icon to inspect category"}
        </Text>
      </View>

      {/* Dedicated Interactive Category Insight Card (Appears when a category is tapped) */}
      {selectedCategoryData && (
        <View
          style={[
            styles.categoryInsightCard,
            {
              backgroundColor: colors.surface,
              borderColor: `${selectedCategoryData.color}44`,
            },
          ]}
        >
          <View style={styles.categoryInsightHeader}>
            <Pressable
              onPress={() => {
                void haptics.selection();
                router.push({
                  pathname: "/category-expenses",
                  params: { category: selectedCategoryData.name },
                });
              }}
              style={({ pressed }) => [
                {
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing[3],
                  flex: 1,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <CategoryVisual
                categoryName={selectedCategoryData.name}
                iconName={selectedCategoryData.icon}
                size="medium"
              />
              <View style={{ flex: 1 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: spacing[2],
                  }}
                >
                  <Text
                    style={[styles.categoryInsightTitle, { color: colors.fg }]}
                    numberOfLines={1}
                  >
                    {selectedCategoryData.name}
                  </Text>
                  <View
                    style={[
                      styles.categoryInsightTag,
                      { backgroundColor: `${selectedCategoryData.color}20` },
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryInsightTagText,
                        { color: selectedCategoryData.color },
                      ]}
                    >
                      {selectedCategoryData.percentageOfTotal}% of total
                    </Text>
                  </View>
                </View>
                <Text
                  style={[styles.categoryInsightSub, { color: colors.primary }]}
                >
                  Tap to view expenses →
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => {
                void haptics.selection();
                setSelectedCategoryName(null);
              }}
              style={[
                styles.closeCategoryBtn,
                { backgroundColor: colors.surfaceRecessed },
              ]}
              hitSlop={8}
            >
              <Feather name="x" size={16} color={colors.fgMuted} />
            </Pressable>
          </View>

          {/* Progress Bar of Category Spend vs Target */}
          <View style={styles.categoryInsightProgressSection}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 6,
              }}
            >
              <Text
                style={[
                  styles.categoryProgressLabel,
                  { color: colors.fgMuted },
                ]}
              >
                Category Budget Used ({selectedCategoryData.percentageOfBudget}
                %)
              </Text>
              <View
                style={[
                  styles.categoryPaceBadge,
                  {
                    backgroundColor:
                      selectedCategoryData.percentageOfBudget > 100
                        ? `${colors.error || "#EF4444"}20`
                        : selectedCategoryData.percentageOfBudget > 80
                          ? `${colors.warning || "#F59E0B"}20`
                          : `${colors.success || "#10B981"}20`,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.categoryPaceBadgeText,
                    {
                      color:
                        selectedCategoryData.percentageOfBudget > 100
                          ? colors.error || "#EF4444"
                          : selectedCategoryData.percentageOfBudget > 80
                            ? colors.warning || "#F59E0B"
                            : colors.success || "#10B981",
                    },
                  ]}
                >
                  {selectedCategoryData.percentageOfBudget > 100
                    ? "Over Budget"
                    : selectedCategoryData.percentageOfBudget > 80
                      ? "Near Limit"
                      : "On Track"}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.categoryProgressBarTrack,
                { backgroundColor: colors.surfaceRecessed },
              ]}
            >
              <View
                style={[
                  styles.categoryProgressBarFill,
                  {
                    backgroundColor: selectedCategoryData.color,
                    width: `${Math.min(
                      selectedCategoryData.percentageOfBudget,
                      100,
                    )}%`,
                  },
                ]}
              />
            </View>
          </View>

          {/* Metrics 3-Column Box */}
          <View
            style={[
              styles.categoryMetricsRow,
              { backgroundColor: colors.canvas },
            ]}
          >
            <View style={styles.categoryMetricCol}>
              <Text
                style={[styles.categoryMetricLabel, { color: colors.fgMuted }]}
              >
                Spent
              </Text>
              <Text style={[styles.categoryMetricVal, { color: colors.fg }]}>
                {money(selectedCategoryData.amount, settings.currency)}
              </Text>
            </View>
            <View
              style={[
                styles.metricDividerVertical,
                { backgroundColor: colors.divider },
              ]}
            />
            <View style={styles.categoryMetricCol}>
              <Text
                style={[styles.categoryMetricLabel, { color: colors.fgMuted }]}
              >
                Target
              </Text>
              <Text style={[styles.categoryMetricVal, { color: colors.fg }]}>
                {money(selectedCategoryData.budget, settings.currency)}
              </Text>
            </View>
            <View
              style={[
                styles.metricDividerVertical,
                { backgroundColor: colors.divider },
              ]}
            />
            <View style={styles.categoryMetricCol}>
              <Text
                style={[styles.categoryMetricLabel, { color: colors.fgMuted }]}
              >
                Remaining
              </Text>
              <Text
                style={[
                  styles.categoryMetricVal,
                  {
                    color:
                      selectedCategoryData.budget >= selectedCategoryData.amount
                        ? colors.success || "#10B981"
                        : colors.error || "#EF4444",
                  },
                ]}
              >
                {money(
                  Math.abs(
                    selectedCategoryData.budget - selectedCategoryData.amount,
                  ),
                  settings.currency,
                )}
                {selectedCategoryData.budget < selectedCategoryData.amount
                  ? " over"
                  : ""}
              </Text>
            </View>
          </View>

          {/* Action Row */}
          <View style={styles.categoryInsightFooter}>
            <Pressable
              onPress={() => {
                void haptics.selection();
                router.push({
                  pathname: "/category-expenses",
                  params: { category: selectedCategoryData.name },
                });
              }}
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
              hitSlop={6}
            >
              <Text
                style={[
                  styles.categoryTxCountText,
                  { color: colors.primary, fontWeight: fontWeight.semibold },
                ]}
              >
                {selectedCategoryData.transactionCount || 0} transaction
                {selectedCategoryData.transactionCount === 1 ? "" : "s"} logged
                →
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                void haptics.selection();
                setCategoryModalVisible(true);
              }}
              style={[
                styles.adjustCategoryLimitBtn,
                { backgroundColor: `${colors.primary}18` },
              ]}
            >
              <Feather name="sliders" size={13} color={colors.primary} />
              <Text
                style={[
                  styles.adjustCategoryLimitText,
                  { color: colors.primary },
                ]}
              >
                Set Category Budget
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Summary Row */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
          <View
            style={[styles.summaryDot, { backgroundColor: colors.primary }]}
          />
          <View style={styles.summaryInfo}>
            <Text style={[styles.summaryLabel, { color: colors.fgMuted }]}>
              Spent
            </Text>
            <Text style={[styles.summaryValue, { color: colors.fg }]}>
              {money(totalExpense, settings.currency)}
            </Text>
          </View>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
          <View
            style={[
              styles.summaryDot,
              {
                backgroundColor:
                  remaining > 0
                    ? colors.success || "#10B981"
                    : colors.error || "#EF4444",
              },
            ]}
          />
          <View style={styles.summaryInfo}>
            <Text style={[styles.summaryLabel, { color: colors.fgMuted }]}>
              {remaining > 0 ? "Remaining" : "Overspent"}
            </Text>
            <Text
              style={[
                styles.summaryValue,
                {
                  color: remaining > 0 ? colors.fg : colors.error || "#EF4444",
                },
              ]}
            >
              {money(
                remaining > 0 ? remaining : totalExpense - totalBudget,
                settings.currency,
              )}
            </Text>
          </View>
        </View>
      </View>

      {/* Widget Options Selector */}
      <View style={styles.widgetHeaderRow}>
        <Text style={[styles.sectionTitle, { color: colors.fg }]}>
          Smart Insights
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.widgetTabsList}
        >
          {(
            [
              { id: "all", label: "All" },
              { id: "pace", label: "Burn Rate" },
              { id: "safe", label: "Daily Safe" },
              { id: "spikes", label: "Top Spikes" },
            ] as const
          ).map((tab) => {
            const isActive = activeWidget === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => {
                  void Haptics.selectionAsync();
                  setActiveWidget(tab.id);
                }}
                style={[
                  styles.widgetChip,
                  {
                    backgroundColor: isActive ? colors.primary : colors.surface,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.widgetChipText,
                    {
                      color: isActive ? "#FFFFFF" : colors.fgMuted,
                      fontWeight: isActive
                        ? fontWeight.semibold
                        : fontWeight.regular,
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Widget Section */}
      <View style={{ gap: spacing[3], marginBottom: spacing[6] }}>
        {/* Widget: Daily Pace & Burn Rate */}
        {(activeWidget === "all" || activeWidget === "pace") && (
          <View
            style={[styles.insightCard, { backgroundColor: colors.surface }]}
          >
            <View style={styles.insightHeader}>
              <View style={styles.insightTitleRow}>
                <View
                  style={[
                    styles.insightIconWrap,
                    { backgroundColor: `${colors.primary}18` },
                  ]}
                >
                  <Feather name="zap" size={16} color={colors.primary} />
                </View>
                <Text style={[styles.insightTitle, { color: colors.fg }]}>
                  Daily Pace & Projection
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: isPacingOver
                      ? `${colors.error || "#EF4444"}18`
                      : `${colors.success || "#10B981"}18`,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    {
                      color: isPacingOver
                        ? colors.error || "#EF4444"
                        : colors.success || "#10B981",
                    },
                  ]}
                >
                  {isPacingOver ? "Pacing Over" : "On Track"}
                </Text>
              </View>
            </View>

            <View style={styles.insightMetricsRow}>
              <View style={styles.metricItem}>
                <Text style={[styles.metricLabel, { color: colors.fgMuted }]}>
                  Avg. Daily Spend
                </Text>
                <Text style={[styles.metricVal, { color: colors.fg }]}>
                  {money(dailyBurnRate, settings.currency)}
                </Text>
              </View>
              <View
                style={[
                  styles.metricDivider,
                  { backgroundColor: colors.divider },
                ]}
              />
              <View style={styles.metricItem}>
                <Text style={[styles.metricLabel, { color: colors.fgMuted }]}>
                  Projected Total
                </Text>
                <Text
                  style={[
                    styles.metricVal,
                    {
                      color: isPacingOver
                        ? colors.error || "#EF4444"
                        : colors.fg,
                    },
                  ]}
                >
                  {money(projectedTotal, settings.currency)}
                </Text>
              </View>
            </View>

            <Text style={[styles.insightSubtext, { color: colors.fgMuted }]}>
              {isPacingOver
                ? `At this rate, you're projected to exceed your budget by ${money(projectedTotal - totalBudget, settings.currency)}.`
                : `Great job! You're projected to finish ${money(totalBudget - projectedTotal, settings.currency)} under budget.`}
            </Text>
          </View>
        )}

        {/* Widget: Safe Daily Allowance */}
        {(activeWidget === "all" || activeWidget === "safe") && (
          <View
            style={[styles.insightCard, { backgroundColor: colors.surface }]}
          >
            <View style={styles.insightHeader}>
              <View style={styles.insightTitleRow}>
                <View
                  style={[
                    styles.insightIconWrap,
                    { backgroundColor: `${colors.warning || "#F59E0B"}18` },
                  ]}
                >
                  <Feather
                    name="shield"
                    size={16}
                    color={colors.warning || "#F59E0B"}
                  />
                </View>
                <Text style={[styles.insightTitle, { color: colors.fg }]}>
                  Safe Daily Spend
                </Text>
              </View>
              {isCurrentMonth && (
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: `${colors.surfaceRecessed}` },
                  ]}
                >
                  <Text
                    style={[styles.statusBadgeText, { color: colors.fgMuted }]}
                  >
                    {daysRemaining} days left
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.safeNumberWrap}>
              <Text style={[styles.safeNumber, { color: colors.fg }]}>
                {isCurrentMonth
                  ? money(safeDailyAllowance, settings.currency)
                  : money(remaining, settings.currency)}
              </Text>
              <Text style={[styles.safeNumberUnit, { color: colors.fgMuted }]}>
                {isCurrentMonth ? "/ day" : "final surplus"}
              </Text>
            </View>

            <Text style={[styles.insightSubtext, { color: colors.fgMuted }]}>
              {isCurrentMonth
                ? `You can spend up to ${money(safeDailyAllowance, settings.currency)} per day for the next ${daysRemaining} days to stay on target.`
                : `This month has ended with ${money(remaining, settings.currency)} unused budget.`}
            </Text>
          </View>
        )}

        {/* Widget: Top Spikes & Concentration */}
        {(activeWidget === "all" || activeWidget === "spikes") && (
          <Pressable
            disabled={!topSpikeCategory}
            onPress={() => {
              if (topSpikeCategory) {
                void haptics.selection();
                router.push({
                  pathname: "/category-expenses",
                  params: { category: topSpikeCategory.name },
                });
              }
            }}
            style={({ pressed }) => [
              styles.insightCard,
              { backgroundColor: colors.surface },
              pressed && topSpikeCategory && { opacity: 0.85 },
            ]}
          >
            <View style={styles.insightHeader}>
              <View style={styles.insightTitleRow}>
                <View style={styles.insightIconWrap}>
                  {topSpikeCategory ? (
                    <CategoryVisual
                      categoryName={topSpikeCategory.name}
                      iconName={topSpikeCategory.category?.icon}
                      size={26}
                    />
                  ) : (
                    <Feather
                      name="trending-up"
                      size={16}
                      color={colors.error || "#EF4444"}
                    />
                  )}
                </View>
                <Text style={[styles.insightTitle, { color: colors.fg }]}>
                  Top Spending Spike
                </Text>
              </View>
              {topSpikeCategory && (
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: `${colors.primary}18` },
                  ]}
                >
                  <Text
                    style={[styles.statusBadgeText, { color: colors.primary }]}
                  >
                    {topSpikeCategory.percentage}% of Spend
                  </Text>
                </View>
              )}
            </View>

            {topSpikeCategory ? (
              <View style={{ gap: spacing[2], marginTop: spacing[1] }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: spacing[2],
                    }}
                  >
                    <CategoryVisual
                      categoryName={topSpikeCategory.name}
                      iconName={topSpikeCategory.category?.icon}
                      size={24}
                    />
                    <Text
                      style={[
                        styles.metricVal,
                        { color: colors.fg, fontSize: fontSize.base },
                      ]}
                    >
                      {topSpikeCategory.name}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.metricVal,
                      { color: colors.fg, fontSize: fontSize.base },
                    ]}
                  >
                    {money(topSpikeCategory.amount, settings.currency)}
                  </Text>
                </View>

                {/* Progress bar */}
                <View
                  style={[
                    styles.spikeTrack,
                    { backgroundColor: colors.surfaceRecessed },
                  ]}
                >
                  <View
                    style={[
                      styles.spikeFill,
                      {
                        backgroundColor:
                          topSpikeCategory.percentage > 40
                            ? colors.error || "#EF4444"
                            : colors.primary,
                        width: `${Math.min(topSpikeCategory.percentage, 100)}%`,
                      },
                    ]}
                  />
                </View>

                <Text
                  style={[styles.insightSubtext, { color: colors.fgMuted }]}
                >
                  {topSpikeCategory.percentage > 40
                    ? `Warning: ${topSpikeCategory.name} is consuming over 40% of your expenses.`
                    : `${topSpikeCategory.name} represents the largest share of spending this month.`}
                </Text>
              </View>
            ) : (
              <Text
                style={[
                  styles.insightSubtext,
                  { color: colors.fgMuted, marginTop: spacing[2] },
                ]}
              >
                No expense transactions found for this month.
              </Text>
            )}
          </Pressable>
        )}
      </View>

      {/* Category Budgets */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.fg }]}>
            Spending by category
          </Text>
          <Pressable
            onPress={() => {
              void haptics.selection();
              router.push("/categories");
            }}
            style={{ flexDirection: "row", alignItems: "center", gap: 2 }}
          >
            <Text style={[styles.sectionCount, { color: colors.primary }]}>
              View all
            </Text>
            <Feather name="chevron-right" size={14} color={colors.primary} />
          </Pressable>
        </View>

        {/* Glowing Category Progress Ring Cards Carousel matching reference image */}
        {categoryTotals.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              gap: spacing[3],
              paddingRight: spacing[4],
              marginBottom: spacing[4],
            }}
          >
            {categoryTotals.map((item) => {
              const catBudget = getCategoryBudget(item.name);
              const nameLower = item.name.toLowerCase();
              let cardColor = colors.primary;
              if (
                nameLower.includes("food") ||
                nameLower.includes("restaurant") ||
                nameLower.includes("dining")
              ) {
                cardColor = "#FF8A00"; // Vibrant Orange (Restaurants in reference image)
              } else if (nameLower.includes("grocer")) {
                cardColor = "#10D078"; // Vibrant Neon Green (Groceries in reference image)
              } else if (
                nameLower.includes("transport") ||
                nameLower.includes("travel")
              ) {
                cardColor = "#3B82F6"; // Vibrant Electric Blue
              } else if (nameLower.includes("shop")) {
                cardColor = "#EC4899"; // Vibrant Pink
              } else if (nameLower.includes("entertain")) {
                cardColor = "#A855F7"; // Vibrant Purple
              } else if (nameLower.includes("health")) {
                cardColor = "#EF4444"; // Vibrant Red
              } else if (item.category?.color) {
                cardColor = item.category.color;
              }

              return (
                <CategoryProgressCard
                  key={item.name}
                  title={item.name}
                  amount={item.amount}
                  targetOrLimit={catBudget}
                  color={cardColor}
                  iconName={item.category?.icon || item.name}
                  isGoal={false}
                  currency={settings.currency}
                  onPress={() => {
                    void haptics.selection();
                    router.push({
                      pathname: "/category-expenses",
                      params: { category: item.name },
                    });
                  }}
                />
              );
            })}
          </ScrollView>
        )}

        <View
          style={[styles.categoryCard, { backgroundColor: colors.surface }]}
        >
          {categoryTotals.map((item, index) => {
            const catBudget = getCategoryBudget(item.name);
            const catPct =
              catBudget > 0 ? Math.round((item.amount / catBudget) * 100) : 0;

            const catColor =
              catPct > 100
                ? colors.error || "#EF4444"
                : catPct > 80
                  ? colors.warning || "#F59E0B"
                  : colors.primary;

            return (
              <View key={item.name}>
                <Pressable
                  onPress={() => {
                    void haptics.selection();
                    router.push({
                      pathname: "/category-expenses",
                      params: { category: item.name },
                    });
                  }}
                  style={({ pressed }) => [
                    styles.categoryItem,
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  {/* Category Visual */}
                  <CategoryVisual
                    categoryName={item.name}
                    iconName={item.category?.icon}
                    size="small"
                  />

                  {/* Aligned Info Column with Nested Progress Bar */}
                  <View style={styles.categoryInfo}>
                    <View style={styles.categoryHeader}>
                      <Text
                        style={[styles.categoryName, { color: colors.fg }]}
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>
                      <Text
                        style={[styles.categoryPercent, { color: catColor }]}
                      >
                        {catPct}%
                      </Text>
                    </View>

                    {/* Progress bar aligned directly with the text */}
                    <View
                      style={[
                        styles.progressTrack,
                        { backgroundColor: colors.surfaceRecessed },
                      ]}
                    >
                      <View
                        style={[
                          styles.progressFill,
                          {
                            backgroundColor: catColor,
                            width: `${Math.min(catPct, 100)}%`,
                          },
                        ]}
                      />
                    </View>

                    {/* Footer with spent and category allocation */}
                    <View style={styles.categoryFooter}>
                      <Text
                        style={[
                          styles.categoryAmount,
                          { color: colors.fgMuted },
                        ]}
                      >
                        {money(item.amount, settings.currency)} spent
                      </Text>
                      <Text
                        style={[
                          styles.categoryLimit,
                          { color: colors.fgSubtle },
                        ]}
                      >
                        target {money(catBudget, settings.currency)}
                      </Text>
                    </View>
                  </View>
                </Pressable>

                {index < categoryTotals.length - 1 && (
                  <View
                    style={[
                      styles.divider,
                      { backgroundColor: colors.divider },
                    ]}
                  />
                )}
              </View>
            );
          })}

          {categoryTotals.length === 0 && (
            <View style={styles.emptyState}>
              <Feather name="pie-chart" size={32} color={colors.fgSubtle} />
              <Text style={[styles.emptyText, { color: colors.fgMuted }]}>
                No expenses logged for this month
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Adjust Monthly Budget Target Modal */}
      <Modal
        visible={budgetModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setBudgetModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setBudgetModalVisible(false)}
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.modalContent}
          >
            <View
              style={[styles.modalCard, { backgroundColor: colors.surface }]}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.fg }]}>
                  Monthly Budget Target
                </Text>
                <Pressable
                  onPress={() => setBudgetModalVisible(false)}
                  style={styles.modalCloseBtn}
                >
                  <Feather name="x" size={20} color={colors.fgMuted} />
                </Pressable>
              </View>

              <Text style={[styles.modalSub, { color: colors.fgMuted }]}>
                Set your total spending limit for the month. Insights will
                adjust to your goal automatically.
              </Text>

              <TextInput
                value={budgetInput}
                onChangeText={setBudgetInput}
                placeholder="50000"
                placeholderTextColor={colors.fgSubtle}
                keyboardType="numeric"
                style={[
                  styles.budgetTextInput,
                  {
                    color: colors.fg,
                    backgroundColor: colors.canvas,
                    borderColor: colors.border,
                  },
                ]}
                autoFocus
              />

              {/* Quick Presets */}
              <View style={styles.presetRow}>
                {[25000, 50000, 75000, 100000].map((preset) => (
                  <Pressable
                    key={preset}
                    onPress={() => {
                      void Haptics.selectionAsync();
                      setBudgetInput(preset.toString());
                    }}
                    style={[
                      styles.presetChip,
                      { backgroundColor: colors.canvas },
                    ]}
                  >
                    <Text
                      style={[styles.presetChipText, { color: colors.fgMuted }]}
                    >
                      {money(preset, settings.currency)}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Pressable
                onPress={handleSaveBudget}
                style={[styles.saveBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.saveBtnText}>Save Budget</Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Advanced Control - Per Category Budgets Modal */}
      <CategoryBudgetModal
        visible={categoryModalVisible}
        onClose={() => setCategoryModalVisible(false)}
        onSave={handleSaveCategoryBudgets}
        initialBudgets={categoryBudgets}
        categories={categories}
        totalMonthlyBudget={totalBudget}
        currency={settings.currency}
        categoryExpenses={categoryExpensesMap}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[4],
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  headerSub: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  headerBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },

  // Month selector
  monthSelectorWrapper: {
    alignItems: "center",
    marginBottom: spacing[4],
    gap: spacing[2],
  },
  monthSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
    width: 240,
  },
  monthNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  monthLabelContainer: {
    flex: 1,
    alignItems: "center",
  },
  monthText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  todayBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing[3],
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  todayBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },

  // Ring card
  ringCard: {
    borderRadius: radius.xl,
    padding: spacing[6],
    alignItems: "center",
    marginBottom: spacing[4],
  },
  ringPercent: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.bold,
  },
  ringSubText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    marginTop: 2,
  },
  ringInfo: {
    alignItems: "center",
    marginTop: spacing[4],
  },
  ringValue: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.bold,
    fontVariant: ["tabular-nums"],
  },
  ringSub: {
    fontSize: fontSize.sm,
    marginTop: spacing[1],
  },
  ringHelpHint: {
    fontSize: fontSize.xs,
    marginTop: spacing[2],
    textAlign: "center",
  },

  // Dedicated Category Insight Card
  categoryInsightCard: {
    borderRadius: radius.xl,
    padding: spacing[4],
    marginBottom: spacing[4],
    borderWidth: 1.5,
    gap: spacing[3],
  },
  categoryInsightHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  categoryInsightTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  categoryInsightTag: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  categoryInsightTagText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
  },
  categoryInsightSub: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  closeCategoryBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryInsightProgressSection: {
    gap: 4,
  },
  categoryProgressLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  categoryPaceBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  categoryPaceBadgeText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
  },
  categoryProgressBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  categoryProgressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  categoryMetricsRow: {
    flexDirection: "row",
    borderRadius: radius.md,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
    alignItems: "center",
  },
  categoryMetricCol: {
    flex: 1,
    alignItems: "center",
  },
  categoryMetricLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  categoryMetricVal: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    fontVariant: ["tabular-nums"],
  },
  metricDividerVertical: {
    width: 1,
    height: "70%",
  },
  categoryInsightFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 2,
  },
  categoryTxCountText: {
    fontSize: fontSize.xs,
  },
  adjustCategoryLimitBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: spacing[3],
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  adjustCategoryLimitText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  carouselCardWrapper: {
    borderRadius: radius.xl,
    overflow: "hidden",
  },

  // Summary
  summaryRow: {
    flexDirection: "row",
    gap: spacing[3],
    marginBottom: spacing[5],
  },
  summaryCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    padding: spacing[4],
    borderRadius: radius.lg,
  },
  summaryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  summaryInfo: {
    gap: 2,
  },
  summaryLabel: {
    fontSize: fontSize.xs,
  },
  summaryValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    fontVariant: ["tabular-nums"],
  },

  // Widget Option Selector
  widgetHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[3],
  },
  widgetTabsList: {
    gap: spacing[2],
  },
  widgetChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  widgetChipText: {
    fontSize: fontSize.xs,
  },

  // Insight Cards
  insightCard: {
    borderRadius: radius.lg,
    padding: spacing[4],
    gap: spacing[3],
  },
  insightHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  insightTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  insightIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  insightTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  statusBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  statusBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  insightMetricsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing[1],
  },
  metricItem: {
    flex: 1,
    gap: 2,
  },
  metricLabel: {
    fontSize: fontSize.xs,
  },
  metricVal: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    fontVariant: ["tabular-nums"],
  },
  metricDivider: {
    width: 1,
    height: 32,
    marginHorizontal: spacing[3],
  },
  insightSubtext: {
    fontSize: fontSize.xs,
    lineHeight: 16,
  },

  // Safe Number Wrap
  safeNumberWrap: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: spacing[2],
  },
  safeNumber: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.bold,
    fontVariant: ["tabular-nums"],
  },
  safeNumberUnit: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },

  // Top Spike
  spikeTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  spikeFill: {
    height: "100%",
    borderRadius: 3,
  },

  // Section
  section: {
    marginBottom: spacing[4],
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[3],
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  sectionCount: {
    fontSize: fontSize.xs,
  },

  // Category card & alignment
  categoryCard: {
    borderRadius: radius.lg,
    padding: spacing[4],
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingVertical: spacing[3],
  },
  categoryInfo: {
    flex: 1,
    gap: spacing[1],
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    flex: 1,
  },
  categoryPercent: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    marginVertical: 2,
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  categoryFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryAmount: {
    fontSize: fontSize.xs,
  },
  categoryLimit: {
    fontSize: fontSize.xs,
  },

  divider: {
    height: 1,
  },

  emptyState: {
    alignItems: "center",
    paddingVertical: spacing[8],
    gap: spacing[2],
  },
  emptyText: {
    fontSize: fontSize.sm,
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: spacing[4],
  },
  modalContent: {
    width: "100%",
  },
  modalCard: {
    borderRadius: radius.xl,
    padding: spacing[5],
    gap: spacing[3],
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  modalCloseBtn: {
    padding: spacing[1],
  },
  modalSub: {
    fontSize: fontSize.xs,
    lineHeight: 16,
  },
  budgetTextInput: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  presetRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },
  presetChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.sm,
  },
  presetChipText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  saveBtn: {
    borderRadius: radius.md,
    paddingVertical: spacing[3],
    alignItems: "center",
    marginTop: spacing[2],
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
});
