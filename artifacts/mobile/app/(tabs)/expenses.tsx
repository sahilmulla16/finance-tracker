import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
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
import { useFinance, type Transaction } from "@/context/FinanceContext";
import { useColors } from "@/hooks/useColors";
import { money, signedMoney, formatDate, compareTransactionsByLatest } from "@/utils/format";
import {
  spacing,
  radius,
  fontSize,
  fontWeight,
  lineHeight,
} from "@/constants/tokens";
import { BankLogo, CategoryVisual, DeleteConfirmationModal } from "@/components/ui";
import { QuickAddModal } from "@/components/QuickAddModal";
import { ExpensesScreenSkeleton } from "@/components/skeletons";
import { haptics } from "@/utils/haptics";

type TabType = "ALL" | "EXPENSE" | "INCOME" | "TRANSFER";

function groupByDate(
  transactions: Transaction[],
): { date: string; label: string; items: Transaction[] }[] {
  const groups: Record<string, Transaction[]> = {};

  for (const tx of transactions) {
    if (!groups[tx.date]) groups[tx.date] = [];
    groups[tx.date].push(tx);
  }

  const sorted = Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, items]) => ({
      date,
      label: formatDate(date),
      items: [...items].sort(compareTransactionsByLatest),
    }));

  return sorted;
}

export default function TransactionsScreen() {
  const {
    loading,
    transactions,
    accounts,
    categories,
    settings,
    deleteTransaction,
    deleteAllTransactions,
  } = useFinance();
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{
    accountId?: string;
    category?: string;
    query?: string;
    type?: string;
  }>();

  const [query, setQuery] = useState(params.query || "");
  const [debouncedQuery, setDebouncedQuery] = useState(params.query || "");
  const [activeTab, setActiveTab] = useState<TabType>(
    params.type &&
      (params.type === "ALL" ||
        params.type === "EXPENSE" ||
        params.type === "INCOME" ||
        params.type === "TRANSFER")
      ? (params.type as TabType)
      : "ALL",
  );
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    params.accountId || null,
  );
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    params.category || null,
  );

  useEffect(() => {
    if (params.accountId !== undefined) {
      setSelectedAccountId(params.accountId || null);
    }
  }, [params.accountId]);

  useEffect(() => {
    if (params.category !== undefined) {
      setSelectedCategory(params.category || null);
    }
  }, [params.category]);

  useEffect(() => {
    if (params.query !== undefined) {
      setQuery(params.query || "");
      setDebouncedQuery(params.query || "");
    }
  }, [params.query]);

  useEffect(() => {
    if (
      params.type &&
      (params.type === "ALL" ||
        params.type === "EXPENSE" ||
        params.type === "INCOME" ||
        params.type === "TRANSFER")
    ) {
      setActiveTab(params.type as TabType);
    }
  }, [params.type]);

  const [sortBy, setSortBy] = useState<
    "DATE_DESC" | "AMOUNT_DESC" | "AMOUNT_ASC"
  >("DATE_DESC");
  const [deletingTx, setDeletingTx] = useState<Transaction | null>(null);
  const [confirmDeleteAllVisible, setConfirmDeleteAllVisible] = useState(false);
  const insets = useSafeAreaInsets();

  // Debounce search query by 200ms to avoid freezing UI during fast typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  const filtered = useMemo(() => {
    let items = transactions;
    if (activeTab !== "ALL") items = items.filter((t) => t.type === activeTab);
    if (selectedAccountId) {
      items = items.filter(
        (t) =>
          t.accountId === selectedAccountId ||
          t.fromAccountId === selectedAccountId ||
          t.toAccountId === selectedAccountId,
      );
    }
    if (selectedCategory) {
      const catLower = selectedCategory.toLowerCase().trim();
      const matchedCat = categories?.find(
        (c) =>
          c.name.toLowerCase().trim() === catLower ||
          c.id.toLowerCase() === catLower,
      );
      items = items.filter((item) => {
        const itemCat = (item.category || "").toLowerCase().trim();
        if (itemCat === catLower) return true;
        if (matchedCat) {
          if (item.categoryId === matchedCat.id) return true;
          if (itemCat === matchedCat.name.toLowerCase().trim()) return true;
        }
        return false;
      });
    }
    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase();
      items = items.filter((item) =>
        (item.description + (item.category || "")).toLowerCase().includes(q),
      );
    }
    if (sortBy === "AMOUNT_DESC") {
      return [...items].sort((a, b) => b.amount - a.amount);
    }
    if (sortBy === "AMOUNT_ASC") {
      return [...items].sort((a, b) => a.amount - b.amount);
    }
    return [...items].sort(compareTransactionsByLatest);
  }, [
    transactions,
    debouncedQuery,
    activeTab,
    selectedAccountId,
    selectedCategory,
    categories,
    sortBy,
  ]);

  const groups = useMemo(() => groupByDate(filtered), [filtered]);

  // Windowed pagination: render 30 date groups initially, load 20 more on scroll
  const [pageLimit, setPageLimit] = useState(30);

  useEffect(() => {
    setPageLimit(30);
  }, [
    debouncedQuery,
    activeTab,
    selectedAccountId,
    selectedCategory,
    sortBy,
  ]);

  const visibleGroups = useMemo(() => {
    return groups.slice(0, pageLimit);
  }, [groups, pageLimit]);

  const handleEndReached = useCallback(() => {
    if (pageLimit < groups.length) {
      setPageLimit((prev) => prev + 20);
    }
  }, [pageLimit, groups.length]);

  const tabs: { key: TabType; label: string }[] = [
    { key: "ALL", label: "All" },
    { key: "INCOME", label: "Income" },
    { key: "EXPENSE", label: "Expense" },
    { key: "TRANSFER", label: "Transfer" },
  ];

  const handleDeleteTransaction = (tx: Transaction) => {
    setDeletingTx(tx);
  };

  const handleDeleteAll = () => {
    setFilterModalVisible(false);
    setConfirmDeleteAllVisible(true);
  };

  const renderGroup = ({
    item: group,
  }: {
    item: { date: string; label: string; items: Transaction[] };
  }) => (
    <View style={styles.group}>
      <Text style={[styles.groupLabel, { color: colors.fg }]}>
        {group.label}
      </Text>
      <View style={[styles.txCard, { backgroundColor: colors.surface }]}>
        {group.items.map((tx, index) => {
          const t = (tx.type || "EXPENSE").trim().toUpperCase();
          const isExpense = t === "EXPENSE";
          const isIncome = t === "INCOME";
          const absAmount = Math.abs(Number(tx.amount)) || 0;
          return (
            <View key={tx.id}>
              <Pressable
                onPress={() => setEditingTransaction(tx)}
                onLongPress={() => handleDeleteTransaction(tx)}
                style={({ pressed }) => [
                  styles.txRow,
                  pressed && { opacity: 0.7 },
                ]}
              >
                {tx.type === "TRANSFER" ? (
                  <BankLogo
                    accountName={
                      accounts.find((a) => a.id === tx.accountId)?.name
                    }
                    size="medium"
                  />
                ) : (
                  <CategoryVisual
                    categoryName={tx.category || tx.description}
                    size="medium"
                  />
                )}
                <View style={styles.txContent}>
                  <Text
                    style={[styles.txTitle, { color: colors.fg }]}
                    numberOfLines={1}
                  >
                    {tx.description}
                  </Text>
                  <Text
                    style={[styles.txSubtitle, { color: colors.fgMuted }]}
                    numberOfLines={1}
                  >
                    {tx.category || "Transfer"} · {tx.time || ""}
                  </Text>
                </View>
                <View style={styles.amountActionRow}>
                  <Text
                    style={[
                      styles.txAmount,
                      { color: isIncome ? colors.income : colors.fg },
                    ]}
                  >
                    {isExpense
                      ? signedMoney(-absAmount, settings.currency)
                      : isIncome
                        ? signedMoney(absAmount, settings.currency)
                        : money(absAmount, settings.currency)}
                  </Text>
                  <Pressable
                    hitSlop={10}
                    onPress={() => handleDeleteTransaction(tx)}
                    style={styles.inlineDeleteBtn}
                  >
                    <Feather name="trash-2" size={15} color={colors.fgSubtle} />
                  </Pressable>
                </View>
              </Pressable>
              {index < group.items.length - 1 && (
                <View
                  style={[styles.divider, { backgroundColor: colors.divider }]}
                />
              )}
            </View>
          );
        })}
      </View>
    </View>
  );

  const hasActiveFilters =
    selectedAccountId !== null ||
    selectedCategory !== null ||
    sortBy !== "DATE_DESC";

  if (loading) {
    return <ExpensesScreenSkeleton />;
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.canvas }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing[4] }]}>
        <View style={styles.headerLeft}>
          {router.canGoBack() && (
            <Pressable
              onPress={() => {
                void haptics.selection();
                router.back();
              }}
              style={[
                styles.headerBtn,
                { backgroundColor: colors.surface, marginRight: spacing[2] },
              ]}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Feather name="arrow-left" size={20} color={colors.fg} />
            </Pressable>
          )}
          <Text
            style={[styles.headerTitle, { color: colors.fg }]}
            numberOfLines={1}
          >
            {selectedCategory
              ? `${selectedCategory} Transactions`
              : "Transactions"}
          </Text>
        </View>
        <Pressable
          onPress={() => {
            void haptics.selection();
            setFilterModalVisible(true);
          }}
          style={[
            styles.headerBtn,
            {
              backgroundColor: hasActiveFilters
                ? `${colors.primary}20`
                : colors.surface,
            },
          ]}
        >
          <Feather
            name="sliders"
            size={18}
            color={hasActiveFilters ? colors.primary : colors.fg}
          />
        </Pressable>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchBar,
            { backgroundColor: colors.surfaceRecessed },
          ]}
        >
          <Feather name="search" size={18} color={colors.fgMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search transactions..."
            placeholderTextColor={colors.fgSubtle}
            style={[styles.searchInput, { color: colors.fg }]}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")}>
              <Feather name="x" size={16} color={colors.fgMuted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Filter tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[
              styles.tab,
              {
                backgroundColor:
                  activeTab === tab.key
                    ? colors.primary
                    : colors.surfaceRecessed,
              },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === tab.key ? colors.onPrimary : colors.fgMuted,
                },
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Active Filter Badges */}
      {(selectedCategory || selectedAccountId) && (
        <View style={styles.activeFiltersRow}>
          {selectedCategory && (
            <View
              style={[
                styles.activeFilterPill,
                {
                  backgroundColor: `${colors.primary}15`,
                  borderColor: `${colors.primary}35`,
                },
              ]}
            >
              <Feather name="tag" size={11} color={colors.primary} />
              <Text
                style={[styles.activeFilterText, { color: colors.primary }]}
              >
                Category: {selectedCategory}
              </Text>
              <Pressable
                hitSlop={8}
                onPress={() => {
                  void haptics.selection();
                  setSelectedCategory(null);
                }}
                accessibilityRole="button"
                accessibilityLabel="Clear category filter"
              >
                <Feather name="x" size={12} color={colors.primary} />
              </Pressable>
            </View>
          )}
          {selectedAccountId && (
            <View
              style={[
                styles.activeFilterPill,
                {
                  backgroundColor: `${colors.primary}15`,
                  borderColor: `${colors.primary}35`,
                },
              ]}
            >
              <Feather name="credit-card" size={11} color={colors.primary} />
              <Text
                style={[styles.activeFilterText, { color: colors.primary }]}
              >
                {accounts.find((a) => a.id === selectedAccountId)?.name ||
                  "Account"}
              </Text>
              <Pressable
                hitSlop={8}
                onPress={() => {
                  void haptics.selection();
                  setSelectedAccountId(null);
                }}
                accessibilityRole="button"
                accessibilityLabel="Clear account filter"
              >
                <Feather name="x" size={12} color={colors.primary} />
              </Pressable>
            </View>
          )}
        </View>
      )}

      {/* Transaction groups with windowed lazy loading */}
      <FlatList
        data={visibleGroups}
        keyExtractor={(item) => item.date}
        renderItem={renderGroup}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={Platform.OS === "android"}
        contentContainerStyle={{
          paddingTop: spacing[3],
          paddingBottom: 120,
          paddingHorizontal: spacing[4],
        }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="inbox" size={40} color={colors.fgSubtle} />
            <Text style={[styles.emptyTitle, { color: colors.fgMuted }]}>
              No transactions found
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.fgSubtle }]}>
              Try adjusting your filters
            </Text>
          </View>
        }
      />

      {/* Filter & Settings Modal */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.sheetOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setFilterModalVisible(false)}
          />
          <View
            style={[
              styles.sheetContent,
              {
                backgroundColor: colors.surface,
                paddingBottom: Math.max(insets.bottom, 24),
              },
            ]}
          >
            <View
              style={[styles.sheetHandle, { backgroundColor: colors.fgSubtle }]}
            />
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.fg }]}>
                Transaction Controls
              </Text>
              <Pressable onPress={() => setFilterModalVisible(false)}>
                <Feather name="x" size={20} color={colors.fgMuted} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Account Filter */}
              <Text
                style={[styles.filterSectionTitle, { color: colors.fgMuted }]}
              >
                FILTER BY ACCOUNT
              </Text>
              <View style={styles.chipsRow}>
                <Pressable
                  onPress={() => setSelectedAccountId(null)}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor:
                        selectedAccountId === null
                          ? colors.primary
                          : colors.surfaceRecessed,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      {
                        color:
                          selectedAccountId === null
                            ? colors.onPrimary
                            : colors.fg,
                      },
                    ]}
                  >
                    All Accounts
                  </Text>
                </Pressable>
                {accounts.map((acc) => (
                  <Pressable
                    key={acc.id}
                    onPress={() => setSelectedAccountId(acc.id)}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor:
                          selectedAccountId === acc.id
                            ? colors.primary
                            : colors.surfaceRecessed,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        {
                          color:
                            selectedAccountId === acc.id
                              ? colors.onPrimary
                              : colors.fg,
                        },
                      ]}
                    >
                      {acc.name}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Category Filter */}
              {categories && categories.length > 0 && (
                <>
                  <Text
                    style={[
                      styles.filterSectionTitle,
                      { color: colors.fgMuted, marginTop: spacing[4] },
                    ]}
                  >
                    FILTER BY CATEGORY
                  </Text>
                  <View style={styles.chipsRow}>
                    <Pressable
                      onPress={() => setSelectedCategory(null)}
                      style={[
                        styles.filterChip,
                        {
                          backgroundColor:
                            selectedCategory === null
                              ? colors.primary
                              : colors.surfaceRecessed,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          {
                            color:
                              selectedCategory === null
                                ? colors.onPrimary
                                : colors.fg,
                          },
                        ]}
                      >
                        All Categories
                      </Text>
                    </Pressable>
                    {categories.map((cat) => (
                      <Pressable
                        key={cat.id}
                        onPress={() =>
                          setSelectedCategory(
                            selectedCategory === cat.name ? null : cat.name,
                          )
                        }
                        style={[
                          styles.filterChip,
                          {
                            backgroundColor:
                              selectedCategory === cat.name
                                ? colors.primary
                                : colors.surfaceRecessed,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            {
                              color:
                                selectedCategory === cat.name
                                  ? colors.onPrimary
                                  : colors.fg,
                            },
                          ]}
                        >
                          {cat.name}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              )}

              {/* Sort Order */}
              <Text
                style={[
                  styles.filterSectionTitle,
                  { color: colors.fgMuted, marginTop: spacing[4] },
                ]}
              >
                SORT BY
              </Text>
              <View style={styles.chipsRow}>
                {[
                  { key: "DATE_DESC", label: "Newest First" },
                  { key: "AMOUNT_DESC", label: "Amount: High → Low" },
                  { key: "AMOUNT_ASC", label: "Amount: Low → High" },
                ].map((s) => (
                  <Pressable
                    key={s.key}
                    onPress={() => setSortBy(s.key as any)}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor:
                          sortBy === s.key
                            ? colors.primary
                            : colors.surfaceRecessed,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        {
                          color:
                            sortBy === s.key ? colors.onPrimary : colors.fg,
                        },
                      ]}
                    >
                      {s.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Reset Filters */}
              {hasActiveFilters && (
                <Pressable
                  onPress={() => {
                    setSelectedAccountId(null);
                    setSelectedCategory(null);
                    setSortBy("DATE_DESC");
                  }}
                  style={styles.resetBtn}
                >
                  <Text
                    style={[styles.resetBtnText, { color: colors.primary }]}
                  >
                    Reset Filters
                  </Text>
                </Pressable>
              )}

              {/* Danger Zone: Delete All Transactions */}
              <View
                style={[
                  styles.dangerZone,
                  {
                    borderColor: `${colors.error}30`,
                    backgroundColor: `${colors.error}08`,
                  },
                ]}
              >
                <View style={styles.dangerHeader}>
                  <Feather
                    name="alert-triangle"
                    size={16}
                    color={colors.error}
                  />
                  <Text style={[styles.dangerTitle, { color: colors.error }]}>
                    Danger Zone
                  </Text>
                </View>
                <Text style={[styles.dangerDesc, { color: colors.fgMuted }]}>
                  Permanently remove all {transactions.length} recorded
                  transactions from your storage.
                </Text>
                <Pressable
                  onPress={handleDeleteAll}
                  style={[
                    styles.deleteAllBtn,
                    {
                      backgroundColor: `${colors.error}18`,
                      borderColor: `${colors.error}40`,
                    },
                  ]}
                >
                  <Feather name="trash-2" size={16} color={colors.error} />
                  <Text
                    style={[styles.deleteAllBtnText, { color: colors.error }]}
                  >
                    Delete All Transactions
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <QuickAddModal
        visible={!!editingTransaction}
        editingTransaction={editingTransaction}
        onClose={() => setEditingTransaction(null)}
      />

      {/* Custom Delete Transaction Confirmation Modal */}
      <DeleteConfirmationModal
        visible={!!deletingTx}
        title="Delete Transaction"
        message={
          deletingTx
            ? `Are you sure you want to delete "${deletingTx.description}" (${money(deletingTx.amount, settings.currency)})?`
            : ""
        }
        confirmText="Delete"
        onConfirm={async () => {
          if (deletingTx) {
            await deleteTransaction(deletingTx.id);
            setDeletingTx(null);
          }
        }}
        onCancel={() => setDeletingTx(null)}
      />

      {/* Custom Delete All Confirmation Modal */}
      <DeleteConfirmationModal
        visible={confirmDeleteAllVisible}
        title="Delete All Transactions"
        message="Are you sure you want to permanently delete ALL transactions? This action cannot be undone."
        confirmText="Delete All"
        onConfirm={async () => {
          await deleteAllTransactions();
          setConfirmDeleteAllVisible(false);
        }}
        onCancel={() => setConfirmDeleteAllVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: spacing[2],
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    flex: 1,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  activeFiltersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  activeFilterPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing[3],
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  activeFilterText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  searchContainer: {
    paddingHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    height: 44,
    borderRadius: radius.md,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.base,
  },
  tabsContainer: {
    flexDirection: "row",
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  tab: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
    minHeight: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  tabText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  group: {
    marginBottom: spacing[4],
  },
  groupLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing[2],
  },
  txCard: {
    borderRadius: radius.lg,
    padding: spacing[1],
  },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing[4],
    gap: spacing[3],
  },
  txIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  txContent: {
    flex: 1,
    gap: 2,
  },
  txTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  txSubtitle: {
    fontSize: fontSize.xs,
  },
  txAmount: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    fontVariant: ["tabular-nums"],
  },
  amountActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  inlineDeleteBtn: {
    padding: spacing[1],
    borderRadius: radius.sm,
  },
  divider: {
    height: 1,
    marginHorizontal: spacing[4],
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing[12],
    gap: spacing[2],
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
  },
  sheetOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  sheetContent: {
    borderTopLeftRadius: radius["2xl"],
    borderTopRightRadius: radius["2xl"],
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    maxHeight: "85%",
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: radius.full,
    alignSelf: "center",
    marginBottom: spacing[3],
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[4],
  },
  sheetTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  filterSectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    letterSpacing: 1,
    marginBottom: spacing[2],
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  filterChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
  },
  filterChipText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  resetBtn: {
    paddingVertical: spacing[2],
    alignSelf: "flex-start",
    marginTop: spacing[2],
  },
  resetBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  dangerZone: {
    marginTop: spacing[5],
    padding: spacing[4],
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing[2],
  },
  dangerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  dangerTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  dangerDesc: {
    fontSize: fontSize.xs,
    lineHeight: 18,
  },
  deleteAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    paddingVertical: spacing[3],
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing[2],
  },
  deleteAllBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
});
