import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useFinance, type Transaction } from "@/context/FinanceContext";
import { useColors } from "@/hooks/useColors";
import { spacing, radius, fontSize, fontWeight } from "@/constants/tokens";
import { CategoryVisual, DeleteConfirmationModal } from "@/components/ui";
import { QuickAddModal } from "@/components/QuickAddModal";
import { money, formatDate, formatTime, isTxInMonth } from "@/utils/format";
import { extractHourFromTransaction, MONTH_NAMES } from "@/utils/dailySpend";
import { haptics } from "@/utils/haptics";

export default function CategoryExpensesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const params = useLocalSearchParams<{
    category?: string;
    month?: string;
    year?: string;
    monthName?: string;
    startDate?: string;
    endDate?: string;
    date?: string;
    hour?: string;
    dateLabel?: string;
    period?: string;
    allTime?: string;
  }>();

  const isAllCategories =
    !params.category ||
    params.category.toLowerCase() === "all" ||
    params.category.toLowerCase() === "all categories" ||
    params.category.toLowerCase() === "all expenses";

  const categoryName = isAllCategories ? "All Categories" : params.category || "General";

  const { transactions, categories, accounts, settings, deleteTransaction } =
    useFinance();

  const [categoryBudgets, setCategoryBudgets] = useState<
    Record<string, number>
  >({});
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [deletingTx, setDeletingTx] = useState<Transaction | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("@pocketflow/category_budgets").then((saved) => {
      if (saved) {
        try {
          setCategoryBudgets(JSON.parse(saved));
        } catch {}
      }
    });
  }, []);

  // Calendar boundaries fallback
  const now = useMemo(() => new Date(), []);
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  // Active period definition derived from route params (handles Daily, Weekly, Monthly, Yearly)
  const activePeriodInfo = useMemo(() => {
    // 1. Single date filter (with optional hour)
    if (params.date) {
      const dStr = params.date;
      const label = params.dateLabel || formatDate(dStr);
      const targetHour =
        params.hour !== undefined && params.hour !== ""
          ? parseInt(params.hour, 10)
          : undefined;

      return {
        displayName: label,
        isMatch: (t: Transaction) => {
          const txDate = t.date ? t.date.split("T")[0] : t.createdAt ? t.createdAt.split("T")[0] : "";
          if (txDate !== dStr) return false;
          if (targetHour !== undefined && !isNaN(targetHour)) {
            return extractHourFromTransaction(t) === targetHour;
          }
          return true;
        },
      };
    }

    // 2. Date Range filter (e.g. Weekly)
    if (
      params.startDate &&
      params.endDate &&
      (params.period === "WEEKLY" || params.startDate !== params.endDate)
    ) {
      const label =
        params.dateLabel ||
        `${formatDate(params.startDate)} – ${formatDate(params.endDate)}`;
      return {
        displayName: label,
        isMatch: (t: Transaction) => {
          const txDate = t.date ? t.date.split("T")[0] : t.createdAt ? t.createdAt.split("T")[0] : "";
          return !!txDate && txDate >= params.startDate! && txDate <= params.endDate!;
        },
      };
    }

    // 3. Yearly filter
    if (
      params.year !== undefined &&
      (params.period === "YEARLY" || params.month === undefined)
    ) {
      const y = parseInt(params.year, 10);
      if (!isNaN(y)) {
        return {
          displayName: params.dateLabel || `Year ${y}`,
          isMatch: (t: Transaction) => {
            const txDate = t.date ? t.date.split("T")[0] : t.createdAt ? t.createdAt.split("T")[0] : "";
            return !!txDate && txDate.startsWith(`${y}-`);
          },
        };
      }
    }

    // 4. All Time filter
    if (params.period?.toUpperCase() === "ALL" || params.allTime === "true") {
      return {
        displayName: params.dateLabel || "All Time",
        isMatch: () => true,
      };
    }

    // 5. Monthly filter (month 0-indexed, year)
    if (params.month !== undefined && params.year !== undefined) {
      const m = parseInt(params.month, 10);
      const y = parseInt(params.year, 10);
      if (!isNaN(m) && !isNaN(y) && m >= 0 && m <= 11) {
        const name = params.monthName || MONTH_NAMES[m] || `Month ${m + 1}`;
        return {
          displayName: params.dateLabel || `${name} ${y}`,
          isMatch: (t: Transaction) => isTxInMonth(t, m, y),
        };
      }
    }

    // 5. Default fallback to current month & year (for safe backward compatibility)
    return {
      displayName: `${MONTH_NAMES[currentMonth]} ${currentYear}`,
      isMatch: (t: Transaction) => isTxInMonth(t, currentMonth, currentYear),
    };
  }, [params, currentMonth, currentYear]);

  // Find category object in active categories
  const categoryObj = useMemo(() => {
    if (isAllCategories) return null;
    return categories.find(
      (c) => c.name.toLowerCase() === categoryName.toLowerCase(),
    );
  }, [categories, categoryName, isAllCategories]);

  // Filter transactions for this category (EXPENSE only, supporting Transport/Transportation legacy records)
  const allCategoryExpenses = useMemo(() => {
    if (isAllCategories) {
      return transactions.filter(
        (t) => t.type === "EXPENSE" && t.amount && t.amount > 0,
      );
    }

    const targetLower = categoryName.toLowerCase();
    const isTransportCategory =
      targetLower === "transport" || targetLower === "transportation";

    return transactions.filter((t) => {
      if (t.type !== "EXPENSE" || !t.amount || t.amount <= 0) return false;
      const catLower = (t.category || "").toLowerCase();
      const matchesName = catLower === targetLower;
      const matchesId = categoryObj && t.categoryId === categoryObj.id;
      const legacyTransportMatch =
        isTransportCategory &&
        (catLower === "transport" ||
          catLower === "transportation" ||
          t.categoryId === "transport" ||
          t.categoryId === "transportation");

      return matchesName || matchesId || legacyTransportMatch;
    });
  }, [transactions, categoryName, categoryObj, isAllCategories]);

  // Transactions strictly filtered for the selected period
  const monthCategoryTransactions = useMemo(() => {
    return allCategoryExpenses.filter(activePeriodInfo.isMatch);
  }, [allCategoryExpenses, activePeriodInfo]);

  // Total spent strictly reflects the selected month
  const totalSpent = useMemo(() => {
    return monthCategoryTransactions.reduce((sum, t) => sum + t.amount, 0);
  }, [monthCategoryTransactions]);

  // Category budget
  const categoryBudget = categoryBudgets[categoryName] || 0;
  const budgetPct =
    categoryBudget > 0 ? Math.round((totalSpent / categoryBudget) * 100) : 0;
  const isOverBudget = categoryBudget > 0 && totalSpent > categoryBudget;

  // Places Suggested by Month (derived strictly from active month's transactions)
  const placesSuggested = useMemo(() => {
    const map = new Map<
      string,
      { name: string; count: number; total: number }
    >();
    for (const t of monthCategoryTransactions) {
      const placeName = (t.description || "Other").trim();
      if (!placeName) continue;
      const key = placeName.toLowerCase();
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
        existing.total += t.amount;
      } else {
        map.set(key, { name: placeName, count: 1, total: t.amount });
      }
    }
    const places = Array.from(map.values());
    places.sort((a, b) => b.total - a.total);
    return places;
  }, [monthCategoryTransactions]);

  // Filtered transactions for Track Expenses list (optionally filtered by tapped place)
  const displayedTransactions = useMemo(() => {
    let list = monthCategoryTransactions;
    if (selectedPlace) {
      const placeLower = selectedPlace.toLowerCase();
      list = list.filter(
        (t) => (t.description || "").trim().toLowerCase() === placeLower,
      );
    }
    return [...list].sort((a, b) => {
      const dateA = new Date(
        a.date + (a.time ? `T${a.time}` : "T00:00:00"),
      ).getTime();
      const dateB = new Date(
        b.date + (b.time ? `T${b.time}` : "T00:00:00"),
      ).getTime();
      return dateB - dateA;
    });
  }, [monthCategoryTransactions, selectedPlace]);

  const promptDelete = (tx: Transaction) => {
    void haptics.selection();
    setDeletingTx(tx);
  };

  const handleConfirmDelete = async () => {
    if (deletingTx) {
      await deleteTransaction(deletingTx.id);
      setDeletingTx(null);
    }
  };

  const handlePlaceToggle = (placeName: string | null) => {
    void haptics.selection();
    setSelectedPlace((prev) =>
      prev?.toLowerCase() === placeName?.toLowerCase() ? null : placeName,
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.canvas }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing[3] }]}>
        <Pressable
          onPress={() => {
            void haptics.selection();
            router.back();
          }}
          style={[styles.headerBtn, { backgroundColor: colors.surface }]}
          hitSlop={8}
        >
          <Feather name="arrow-left" size={20} color={colors.fg} />
        </Pressable>

        <Text
          style={[styles.headerTitle, { color: colors.fg }]}
          numberOfLines={1}
        >
          {categoryName}
        </Text>

        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={displayedTransactions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.summaryContainer}>
            {/* Category Banner Card */}
            <View
              style={[
                styles.bannerCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.bannerTop}>
                {isAllCategories ? (
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      backgroundColor: colors.surfaceRecessed,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Feather name="layers" size={24} color={colors.primary} />
                  </View>
                ) : (
                  <CategoryVisual
                    categoryName={categoryName}
                    iconName={categoryObj?.icon}
                    color={categoryObj?.color}
                    size="large"
                  />
                )}
                <View style={styles.bannerInfo}>
                  <Text style={[styles.bannerCategory, { color: colors.fg }]}>
                    {categoryName}
                  </Text>
                  <Text style={[styles.bannerCount, { color: colors.fgMuted }]}>
                    {monthCategoryTransactions.length}{" "}
                    {monthCategoryTransactions.length === 1
                      ? "expense"
                      : "expenses"}{" "}
                    in {activePeriodInfo.displayName}
                  </Text>
                </View>
              </View>

              <View style={styles.totalRow}>
                <View>
                  <Text style={[styles.totalLabel, { color: colors.fgMuted }]}>
                    TOTAL SPENT
                  </Text>
                  <Text style={[styles.totalValue, { color: colors.fg }]}>
                    {money(totalSpent, settings.currency)}
                  </Text>
                </View>

                {categoryBudget > 0 && (
                  <View style={{ alignItems: "flex-end" }}>
                    <Text
                      style={[styles.totalLabel, { color: colors.fgMuted }]}
                    >
                      MONTHLY BUDGET
                    </Text>
                    <Text
                      style={[
                        styles.budgetLimitValue,
                        { color: isOverBudget ? colors.error : colors.fg },
                      ]}
                    >
                      {money(categoryBudget, settings.currency)}
                    </Text>
                  </View>
                )}
              </View>

              {/* Progress bar if budget exists */}
              {categoryBudget > 0 && (
                <View style={styles.budgetProgressSection}>
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
                          width: `${Math.min(budgetPct, 100)}%`,
                          backgroundColor: isOverBudget
                            ? colors.error
                            : budgetPct > 80
                              ? colors.warning
                              : colors.primary,
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.progressLabels}>
                    <Text
                      style={[
                        styles.progressPct,
                        { color: isOverBudget ? colors.error : colors.fgMuted },
                      ]}
                    >
                      {budgetPct}% spent
                    </Text>
                    <Text
                      style={[
                        styles.progressRemaining,
                        { color: colors.fgSubtle },
                      ]}
                    >
                      {isOverBudget
                        ? `${money(totalSpent - categoryBudget, settings.currency)} over limit`
                        : `${money(categoryBudget - totalSpent, settings.currency)} remaining`}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Places Suggested by Months Section */}
            {placesSuggested.length > 0 && (
              <View style={styles.placesSection}>
                <View style={styles.placesHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.fg }]}>
                    Places in {activePeriodInfo.displayName}
                  </Text>
                  <Text
                    style={[styles.sectionSubtitle, { color: colors.fgMuted }]}
                  >
                    {placesSuggested.length}{" "}
                    {placesSuggested.length === 1 ? "merchant" : "merchants"}
                  </Text>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.placesScroll}
                >
                  {/* All Places chip */}
                  <Pressable
                    onPress={() => handlePlaceToggle(null)}
                    style={[
                      styles.placeCard,
                      selectedPlace === null
                        ? {
                            backgroundColor: colors.surfaceRecessed,
                            borderColor: colors.primary,
                          }
                        : {
                            backgroundColor: colors.surface,
                            borderColor: colors.border,
                          },
                    ]}
                  >
                    <Text
                      style={[
                        styles.placeName,
                        {
                          color:
                            selectedPlace === null ? colors.primary : colors.fg,
                          fontWeight:
                            selectedPlace === null
                              ? fontWeight.bold
                              : fontWeight.medium,
                        },
                      ]}
                    >
                      All Places
                    </Text>
                    <Text
                      style={[styles.placeVisits, { color: colors.fgMuted }]}
                    >
                      {monthCategoryTransactions.length} items
                    </Text>
                  </Pressable>

                  {/* Individual Place Chips */}
                  {placesSuggested.map((place) => {
                    const isSelected =
                      selectedPlace?.toLowerCase() === place.name.toLowerCase();
                    const pctOfCategory =
                      totalSpent > 0
                        ? Math.round((place.total / totalSpent) * 100)
                        : 0;

                    return (
                      <Pressable
                        key={place.name}
                        onPress={() => handlePlaceToggle(place.name)}
                        style={[
                          styles.placeCard,
                          isSelected
                            ? {
                                backgroundColor: colors.surfaceRecessed,
                                borderColor: colors.primary,
                              }
                            : {
                                backgroundColor: colors.surface,
                                borderColor: colors.border,
                              },
                        ]}
                      >
                        <View style={styles.placeCardTop}>
                          <Text
                            style={[
                              styles.placeName,
                              {
                                color: isSelected ? colors.primary : colors.fg,
                                fontWeight: isSelected
                                  ? fontWeight.bold
                                  : fontWeight.semibold,
                              },
                            ]}
                            numberOfLines={1}
                          >
                            {place.name}
                          </Text>
                          {isSelected && (
                            <Feather
                              name="check-circle"
                              size={13}
                              color={colors.primary}
                            />
                          )}
                        </View>

                        <Text
                          style={[styles.placeAmount, { color: colors.fg }]}
                        >
                          {money(place.total, settings.currency)}
                        </Text>

                        <View style={styles.placeMetaRow}>
                          <Text
                            style={[
                              styles.placeVisits,
                              { color: colors.fgMuted },
                            ]}
                          >
                            {place.count}{" "}
                            {place.count === 1 ? "visit" : "visits"}
                          </Text>
                          {pctOfCategory > 0 && (
                            <Text
                              style={[
                                styles.placePct,
                                { color: colors.fgSubtle },
                              ]}
                            >
                              · {pctOfCategory}%
                            </Text>
                          )}
                        </View>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Track Expenses Section Header */}
            <View style={styles.sectionHeader}>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.fg }]}>
                  Track Expenses
                </Text>
                <Text
                  style={[styles.sectionSubtitle, { color: colors.fgMuted }]}
                >
                  Where & When · {displayedTransactions.length}{" "}
                  {displayedTransactions.length === 1 ? "expense" : "expenses"}
                </Text>
              </View>

              {selectedPlace && (
                <Pressable
                  onPress={() => handlePlaceToggle(null)}
                  style={[
                    styles.filterBadge,
                    {
                      backgroundColor: colors.surfaceRecessed,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[styles.filterBadgeText, { color: colors.primary }]}
                    numberOfLines={1}
                  >
                    {selectedPlace}
                  </Text>
                  <Feather name="x" size={13} color={colors.primary} />
                </Pressable>
              )}
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const account = accounts.find((a) => a.id === item.accountId);
          return (
            <Pressable
              onPress={() => {
                void haptics.selection();
                setEditingTransaction(item);
              }}
              style={({ pressed }) => [
                styles.txnCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
                pressed && { opacity: 0.8 },
              ]}
            >
              <View style={styles.txnLeft}>
                <CategoryVisual
                  categoryName={categoryName}
                  iconName={categoryObj?.icon}
                  color={categoryObj?.color}
                  size="medium"
                />
                <View style={styles.txnDetails}>
                  <Text
                    style={[styles.txnTitle, { color: colors.fg }]}
                    numberOfLines={1}
                  >
                    {item.description}
                  </Text>

                  {/* Where & When details */}
                  <View style={styles.metaRow}>
                    <Feather name="clock" size={12} color={colors.fgSubtle} />
                    <Text style={[styles.metaText, { color: colors.fgMuted }]}>
                      {formatDate(item.date)}
                      {item.time ? ` at ${formatTime(item.time)}` : ""}
                    </Text>
                  </View>

                  {/* Account / Where badge */}
                  <View style={styles.metaRow}>
                    <Feather
                      name="credit-card"
                      size={12}
                      color={colors.fgSubtle}
                    />
                    <Text
                      style={[styles.metaText, { color: colors.fgMuted }]}
                      numberOfLines={1}
                    >
                      {account?.name || "Default Account"}
                      {item.notes ? ` · ${item.notes}` : ""}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.txnRight}>
                <Text style={[styles.txnAmount, { color: colors.fg }]}>
                  {money(-(Math.abs(Number(item.amount)) || 0), settings.currency)}
                </Text>
                <Pressable
                  hitSlop={10}
                  onPress={() => promptDelete(item)}
                  style={styles.deleteBtn}
                >
                  <Feather name="trash-2" size={15} color={colors.fgSubtle} />
                </Pressable>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View
              style={[
                styles.emptyIconCircle,
                { backgroundColor: colors.surfaceRecessed },
              ]}
            >
              <Feather name="tag" size={32} color={colors.fgSubtle} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.fg }]}>
              {selectedPlace
                ? `No expenses at "${selectedPlace}"`
                : `No expenses in ${activePeriodInfo.displayName}`}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.fgMuted }]}>
              {selectedPlace
                ? `No ${categoryName} expenses at ${selectedPlace} in ${activePeriodInfo.displayName}.`
                : `Any ${categoryName} expenses tracked in ${activePeriodInfo.displayName} will appear here.`}
            </Text>
          </View>
        }
      />

      {/* Quick Add Edit Modal */}
      <QuickAddModal
        visible={!!editingTransaction}
        editingTransaction={editingTransaction}
        onClose={() => setEditingTransaction(null)}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        visible={!!deletingTx}
        title="Delete Transaction"
        message={
          deletingTx
            ? `Are you sure you want to delete "${deletingTx.description}" (${money(deletingTx.amount, settings.currency)})?`
            : ""
        }
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingTx(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[2],
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  listContent: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[12],
    gap: spacing[3],
  },
  summaryContainer: {
    marginBottom: spacing[2],
  },
  bannerCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing[4],
    marginBottom: spacing[4],
    gap: spacing[3],
  },
  bannerTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  bannerInfo: {
    flex: 1,
  },
  bannerCategory: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  bannerCount: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingTop: spacing[2],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(128,128,128,0.2)",
  },
  totalLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  totalValue: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.bold,
    fontVariant: ["tabular-nums"],
  },
  budgetLimitValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    fontVariant: ["tabular-nums"],
  },
  budgetProgressSection: {
    marginTop: spacing[1],
    gap: spacing[1],
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressPct: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  progressRemaining: {
    fontSize: fontSize.xs,
  },
  placesSection: {
    marginBottom: spacing[4],
    gap: spacing[2],
  },
  placesHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingHorizontal: spacing[1],
  },
  placesScroll: {
    paddingVertical: spacing[1],
    gap: spacing[2],
  },
  placeCard: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.lg,
    borderWidth: 1,
    minWidth: 110,
    justifyContent: "center",
  },
  placeCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4,
  },
  placeName: {
    fontSize: fontSize.sm,
    maxWidth: 100,
  },
  placeAmount: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    fontVariant: ["tabular-nums"],
    marginTop: 2,
  },
  placeMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  placeVisits: {
    fontSize: fontSize.xs,
  },
  placePct: {
    fontSize: fontSize.xs,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing[2],
    paddingHorizontal: spacing[1],
  },
  sectionTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  sectionSubtitle: {
    fontSize: fontSize.xs,
    marginTop: 1,
  },
  filterBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing[2],
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  filterBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    maxWidth: 100,
  },
  txnCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing[4],
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  txnLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    flex: 1,
  },
  txnDetails: {
    flex: 1,
    gap: 3,
  },
  txnTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metaText: {
    fontSize: fontSize.xs,
  },
  txnRight: {
    alignItems: "flex-end",
    gap: spacing[2],
    marginLeft: spacing[2],
  },
  txnAmount: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    fontVariant: ["tabular-nums"],
  },
  deleteBtn: {
    padding: spacing[1],
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: spacing[10],
    paddingHorizontal: spacing[6],
    gap: spacing[2],
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing[2],
  },
  emptyTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    textAlign: "center",
    lineHeight: 20,
  },
});
