import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
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
import { CategoryVisual, BankLogo, DeleteConfirmationModal } from "@/components/ui";
import { QuickAddModal } from "@/components/QuickAddModal";
import { money, formatDate, formatTime } from "@/utils/format";
import { haptics } from "@/utils/haptics";

export default function CategoryExpensesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const params = useLocalSearchParams<{ category?: string }>();
  const categoryName = params.category || "General";

  const {
    transactions,
    categories,
    accounts,
    settings,
    deleteTransaction,
  } = useFinance();

  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, number>>({});
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTx, setDeletingTx] = useState<Transaction | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("@pocketflow/category_budgets").then((saved) => {
      if (saved) {
        try {
          setCategoryBudgets(JSON.parse(saved));
        } catch {}
      }
    });
  }, []);

  // Find category object with alias/substring support (e.g. Bills -> Bills & Utilities, Utility -> Bills & Utilities)
  const categoryObj = useMemo(() => {
    const raw = categoryName.trim().toLowerCase();
    return (
      categories.find((c) => c.name.toLowerCase() === raw) ||
      categories.find((c) => {
        const cLower = c.name.toLowerCase();
        return (
          cLower.includes(raw) ||
          raw.includes(cLower) ||
          (raw === "bills" && (cLower.includes("bill") || cLower.includes("util"))) ||
          (raw === "utility" && (cLower.includes("util") || cLower.includes("bill"))) ||
          (raw === "transport" && (cLower.includes("transport") || cLower.includes("travel")))
        );
      })
    );
  }, [categories, categoryName]);

  // Filter transactions for this category (EXPENSE or all matching)
  const categoryTransactions = useMemo(() => {
    const raw = categoryName.trim().toLowerCase();
    const resolvedName = categoryObj?.name.toLowerCase();

    return transactions
      .filter((t) => {
        if (t.type !== "EXPENSE") return false;
        const tCat = (t.category || "").toLowerCase().trim();
        const matchesDirect = tCat === raw;
        const matchesResolved = resolvedName ? tCat === resolvedName : false;
        const matchesId = categoryObj && t.categoryId === categoryObj.id;
        const matchesFuzzy =
          (raw.length >= 3 && tCat.includes(raw)) ||
          (tCat.length >= 3 && raw.includes(tCat)) ||
          (raw === "bills" && (tCat.includes("bill") || tCat.includes("util"))) ||
          (raw === "utility" && (tCat.includes("util") || tCat.includes("bill"))) ||
          (raw === "transport" && (tCat.includes("transport") || tCat.includes("travel")));

        return matchesDirect || matchesResolved || matchesId || matchesFuzzy;
      })
      .sort((a, b) => {
        const dateA = new Date(a.date + (a.time ? `T${a.time}` : "T00:00:00")).getTime();
        const dateB = new Date(b.date + (b.time ? `T${b.time}` : "T00:00:00")).getTime();
        return dateB - dateA;
      });
  }, [transactions, categoryName, categoryObj]);

  // Total spent
  const totalSpent = useMemo(() => {
    return categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
  }, [categoryTransactions]);

  // Category budget with flexible fallback
  const categoryBudget = useMemo(() => {
    if (categoryBudgets[categoryName] && categoryBudgets[categoryName] > 0) {
      return categoryBudgets[categoryName];
    }
    if (categoryObj && categoryBudgets[categoryObj.name] && categoryBudgets[categoryObj.name] > 0) {
      return categoryBudgets[categoryObj.name];
    }
    const foundKey = Object.keys(categoryBudgets).find(
      (k) =>
        k.toLowerCase() === categoryName.toLowerCase() ||
        (categoryObj && k.toLowerCase() === categoryObj.name.toLowerCase()),
    );
    return foundKey ? categoryBudgets[foundKey] || 0 : 0;
  }, [categoryBudgets, categoryName, categoryObj]);
  const budgetPct =
    categoryBudget > 0 ? Math.round((totalSpent / categoryBudget) * 100) : 0;
  const isOverBudget = categoryBudget > 0 && totalSpent > categoryBudget;

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

        <Text style={[styles.headerTitle, { color: colors.fg }]} numberOfLines={1}>
          {categoryName}
        </Text>

        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={categoryTransactions}
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
                <CategoryVisual
                  categoryName={categoryName}
                  iconName={categoryObj?.icon}
                  color={categoryObj?.color}
                  size="large"
                />
                <View style={styles.bannerInfo}>
                  <Text style={[styles.bannerCategory, { color: colors.fg }]}>
                    {categoryName}
                  </Text>
                  <Text style={[styles.bannerCount, { color: colors.fgMuted }]}>
                    {categoryTransactions.length}{" "}
                    {categoryTransactions.length === 1 ? "expense" : "expenses"} tracked
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
                    <Text style={[styles.totalLabel, { color: colors.fgMuted }]}>
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
                    <Text style={[styles.progressPct, { color: isOverBudget ? colors.error : colors.fgMuted }]}>
                      {budgetPct}% spent
                    </Text>
                    <Text style={[styles.progressRemaining, { color: colors.fgSubtle }]}>
                      {isOverBudget
                        ? `${money(totalSpent - categoryBudget, settings.currency)} over limit`
                        : `${money(categoryBudget - totalSpent, settings.currency)} remaining`}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.fg }]}>
                Category Expenses
              </Text>
              <Text style={[styles.sectionSubtitle, { color: colors.fgMuted }]}>
                Where & When
              </Text>
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
                  <Text style={[styles.txnTitle, { color: colors.fg }]} numberOfLines={1}>
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
                    <Feather name="credit-card" size={12} color={colors.fgSubtle} />
                    <Text style={[styles.metaText, { color: colors.fgMuted }]} numberOfLines={1}>
                      {account?.name || "Default Account"}
                      {item.notes ? ` · ${item.notes}` : ""}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.txnRight}>
                <Text style={[styles.txnAmount, { color: colors.fg }]}>
                  -{money(item.amount, settings.currency)}
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
              No expenses tracked yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.fgMuted }]}>
              Any expense tracked under "{categoryName}" will appear here with date, time, and account details.
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

      {/* Matching Design Delete Confirmation Modal */}
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
    paddingBottom: spacing[3],
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "baseline",
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
