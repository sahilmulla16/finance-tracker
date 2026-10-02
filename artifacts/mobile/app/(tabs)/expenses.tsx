import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
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
import { money, formatDate, formatTime } from "@/utils/format";
import {
  spacing,
  radius,
  fontSize,
  fontWeight,
  lineHeight,
} from "@/constants/tokens";
import { BankLogo, CategoryVisual, DeleteConfirmationModal } from "@/components/ui";
import { QuickAddModal } from "@/components/QuickAddModal";
import { haptics } from "@/utils/haptics";

type TabType = "ALL" | "EXPENSE" | "INCOME" | "TRANSFER";

function groupByDate(
  transactions: Transaction[],
): { date: string; label: string; items: Transaction[] }[] {
  const groups: Record<string, Transaction[]> = {};
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const yesterday = new Date(now.setDate(now.getDate() - 1))
    .toISOString()
    .split("T")[0];

  for (const tx of transactions) {
    if (!groups[tx.date]) groups[tx.date] = [];
    groups[tx.date].push(tx);
  }

  const sorted = Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, items]) => ({
      date,
      label:
        date === today
          ? "Today"
          : date === yesterday
            ? "Yesterday"
            : formatDate(date),
      items,
    }));

  return sorted;
}

export default function TransactionsScreen() {
  const { transactions, accounts, settings, deleteTransaction, deleteAllTransactions } =
    useFinance();
  const colors = useColors();
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("ALL");
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"DATE_DESC" | "AMOUNT_DESC" | "AMOUNT_ASC">("DATE_DESC");
  const insets = useSafeAreaInsets();

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
    if (query.trim()) {
      const q = query.toLowerCase();
      items = items.filter((item) =>
        (item.description + (item.category || ""))
          .toLowerCase()
          .includes(q),
      );
    }
    if (sortBy === "AMOUNT_DESC") {
      return [...items].sort((a, b) => b.amount - a.amount);
    }
    if (sortBy === "AMOUNT_ASC") {
      return [...items].sort((a, b) => a.amount - b.amount);
    }
    return items;
  }, [transactions, query, activeTab, selectedAccountId, sortBy]);

  const groups = useMemo(() => groupByDate(filtered), [filtered]);

  const tabs: { key: TabType; label: string }[] = [
    { key: "ALL", label: "All" },
    { key: "INCOME", label: "Income" },
    { key: "EXPENSE", label: "Expense" },
    { key: "TRANSFER", label: "Transfer" },
  ];

  const [deletingTx, setDeletingTx] = useState<Transaction | null>(null);
  const [confirmDeleteAllVisible, setConfirmDeleteAllVisible] = useState(false);

  const handleDeleteTransaction = (tx: Transaction) => {
    void haptics.selection();
    setDeletingTx(tx);
  };

  const handleDeleteAll = () => {
    void haptics.selection();
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
          const isExpense = tx.type === "EXPENSE";
          const isIncome = tx.type === "INCOME";
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
                    {tx.category || "Transfer"}{tx.time ? ` · ${formatTime(tx.time)}` : ""}
                  </Text>
                </View>
                <View style={styles.amountActionRow}>
                  <Text
                    style={[
                      styles.txAmount,
                      { color: isIncome ? colors.income : colors.fg },
                    ]}
                  >
                    {isExpense ? "-" : isIncome ? "+" : ""}
                    {money(tx.amount, settings.currency)}
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

  const hasActiveFilters = selectedAccountId !== null || sortBy !== "DATE_DESC";

  return (
    <View style={[styles.screen, { backgroundColor: colors.canvas }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing[4] }]}>
        <Text style={[styles.headerTitle, { color: colors.fg }]}>
          Transactions
        </Text>
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

      {/* Transaction groups */}
      <FlatList
        data={groups}
        keyExtractor={(item) => item.date}
        renderItem={renderGroup}
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
              <Text style={[styles.filterSectionTitle, { color: colors.fgMuted }]}>
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
                    setSortBy("DATE_DESC");
                  }}
                  style={styles.resetBtn}
                >
                  <Text style={[styles.resetBtnText, { color: colors.primary }]}>
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
                  <Feather name="alert-triangle" size={16} color={colors.error} />
                  <Text style={[styles.dangerTitle, { color: colors.error }]}>
                    Danger Zone
                  </Text>
                </View>
                <Text style={[styles.dangerDesc, { color: colors.fgMuted }]}>
                  Permanently remove all {transactions.length} recorded transactions from your storage.
                </Text>
                <Pressable
                  onPress={handleDeleteAll}
                  style={[
                    styles.deleteAllBtn,
                    { backgroundColor: `${colors.error}18`, borderColor: `${colors.error}40` },
                  ]}
                >
                  <Feather name="trash-2" size={16} color={colors.error} />
                  <Text style={[styles.deleteAllBtnText, { color: colors.error }]}>
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

      {/* Delete Single Transaction Modal */}
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
        onConfirm={async () => {
          if (deletingTx) {
            await deleteTransaction(deletingTx.id);
            setDeletingTx(null);
          }
        }}
        onCancel={() => setDeletingTx(null)}
      />

      {/* Delete All Transactions Modal */}
      <DeleteConfirmationModal
        visible={confirmDeleteAllVisible}
        title="Delete All Transactions"
        message="Are you sure you want to permanently delete ALL transactions? This action cannot be undone."
        confirmText="Delete All"
        cancelText="Cancel"
        onConfirm={async () => {
          await deleteAllTransactions();
          setConfirmDeleteAllVisible(false);
          setFilterModalVisible(false);
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
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
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
    borderTopLeftRadius: radius.hero,
    borderTopRightRadius: radius.hero,
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
