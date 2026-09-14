import { Feather } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFinance } from '@/context/FinanceContext';
import { useColors } from '@/hooks/useColors';
import { money } from '@/utils/format';
import { spacing, radius, fontSize, fontWeight, lineHeight } from '@/constants/tokens';

function ProgressRing({ percentage, size = 120, strokeWidth = 10 }: { percentage: number; size?: number; strokeWidth?: number }) {
  const colors = useColors();
  const circumference = (size - strokeWidth) * Math.PI;
  const offset = circumference * (1 - percentage / 100);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={[styles.ringTrack, { width: size, height: size, borderRadius: size / 2, borderWidth: strokeWidth, borderColor: colors.surfaceRecessed }]}>
        <View
          style={[
            styles.ringFill,
            {
              width: size - strokeWidth,
              height: size - strokeWidth,
              borderRadius: (size - strokeWidth) / 2,
              borderWidth: strokeWidth,
              borderColor: colors.primary,
              borderTopRightRadius: 999,
              borderBottomRightRadius: 999,
              borderLeftColor: 'transparent',
              borderBottomColor: percentage > 50 ? colors.primary : 'transparent',
            },
          ]}
        />
      </View>
      <View style={styles.ringCenter}>
        <Text style={[styles.ringPercent, { color: colors.fg }]}>{Math.round(percentage)}%</Text>
      </View>
    </View>
  );
}

export default function InsightsScreen() {
  const { transactions, categories, settings } = useFinance();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const thisMonthExpenses = useMemo(
    () => transactions.filter(t => t.type === 'EXPENSE' && new Date(t.date) >= thisMonthStart),
    [transactions]
  );

  const totalExpense = useMemo(() => thisMonthExpenses.reduce((sum, t) => sum + t.amount, 0), [thisMonthExpenses]);
  const totalIncome = useMemo(
    () => transactions.filter(t => t.type === 'INCOME' && new Date(t.date) >= thisMonthStart).reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );

  const totalBudget = totalIncome * 1.2; // Estimate budget as 120% of income
  const budgetUsed = totalBudget > 0 ? Math.min((totalExpense / totalBudget) * 100, 100) : 0;
  const remaining = Math.max(totalBudget - totalExpense, 0);

  const categoryTotals = useMemo(() => {
    const groups: Record<string, number> = {};
    for (const t of thisMonthExpenses) {
      const cat = t.category || 'Other';
      groups[cat] = (groups[cat] || 0) + t.amount;
    }
    return Object.entries(groups)
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
        category: categories.find(c => c.name === name),
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [thisMonthExpenses, categories, totalExpense]);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const thisMonthName = monthNames[now.getMonth()];

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.canvas }]}
      contentContainerStyle={{ paddingTop: insets.top + spacing[5], paddingBottom: 120, paddingHorizontal: spacing[4] }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.fg }]}>Budgets</Text>
        <Pressable style={[styles.headerBtn, { backgroundColor: colors.surface }]}>
          <Feather name="sliders" size={18} color={colors.fg} />
        </Pressable>
      </View>

      {/* Month selector */}
      <View style={styles.monthSelector}>
        <Pressable style={[styles.monthBtn, { backgroundColor: colors.surface }]}>
          <Feather name="chevron-left" size={18} color={colors.fg} />
        </Pressable>
        <Text style={[styles.monthText, { color: colors.fg }]}>{thisMonthName} {now.getFullYear()}</Text>
        <Pressable style={[styles.monthBtn, { backgroundColor: colors.surface }]}>
          <Feather name="chevron-right" size={18} color={colors.fg} />
        </Pressable>
      </View>

      {/* Budget ring */}
      <View style={[styles.ringCard, { backgroundColor: colors.surface }]}>
        <ProgressRing percentage={budgetUsed} size={140} strokeWidth={12} />
        <View style={styles.ringInfo}>
          <Text style={[styles.ringValue, { color: colors.fg }]}>{money(totalExpense, settings.currency)}</Text>
          <Text style={[styles.ringSub, { color: colors.fgMuted }]}>of {money(totalBudget, settings.currency)}</Text>
        </View>
      </View>

      {/* Summary */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
          <View style={[styles.summaryDot, { backgroundColor: colors.primary }]} />
          <View style={styles.summaryInfo}>
            <Text style={[styles.summaryLabel, { color: colors.fgMuted }]}>Spent</Text>
            <Text style={[styles.summaryValue, { color: colors.fg }]}>{money(totalExpense, settings.currency)}</Text>
          </View>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
          <View style={[styles.summaryDot, { backgroundColor: colors.warning }]} />
          <View style={styles.summaryInfo}>
            <Text style={[styles.summaryLabel, { color: colors.fgMuted }]}>Remaining</Text>
            <Text style={[styles.summaryValue, { color: colors.fg }]}>{money(remaining, settings.currency)}</Text>
          </View>
        </View>
      </View>

      {/* Category budgets */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.fg }]}>Category Budgets</Text>
          <Text style={[styles.sectionAction, { color: colors.primary }]}>See all</Text>
        </View>
        <View style={[styles.categoryCard, { backgroundColor: colors.surface }]}>
          {categoryTotals.slice(0, 5).map((item, index) => (
            <View key={item.name}>
              <View style={styles.categoryRow}>
                <View style={[styles.categoryIcon, { backgroundColor: item.category?.color ? item.category.color + '20' : colors.surfaceRecessed }]}>
                  <Feather name={(item.category?.icon || 'tag') as never} size={16} color={item.category?.color || colors.fgMuted} />
                </View>
                <View style={styles.categoryInfo}>
                  <Text style={[styles.categoryName, { color: colors.fg }]}>{item.name}</Text>
                  <Text style={[styles.categoryAmount, { color: colors.fgMuted }]}>
                    {money(item.amount, settings.currency)} / {money(totalBudget / Math.max(categoryTotals.length, 1), settings.currency)}
                  </Text>
                </View>
                <Text style={[styles.categoryPercent, { color: colors.primary }]}>{item.percentage}%</Text>
              </View>
              {/* Progress bar */}
              <View style={[styles.progressTrack, { backgroundColor: colors.surfaceRecessed }]}>
                <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${Math.min(item.percentage, 100)}%` }]} />
              </View>
              {index < categoryTotals.length - 1 && (
                <View style={[styles.divider, { backgroundColor: colors.divider }]} />
              )}
            </View>
          ))}
          {categoryTotals.length === 0 && (
            <View style={styles.emptyState}>
              <Feather name="pie-chart" size={32} color={colors.fgSubtle} />
              <Text style={[styles.emptyText, { color: colors.fgMuted }]}>No spending this month</Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[5],
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Month selector
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[4],
    marginBottom: spacing[6],
  },
  monthBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },

  // Ring card
  ringCard: {
    borderRadius: radius.xl,
    padding: spacing[6],
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  ringTrack: {
    position: 'absolute',
  },
  ringFill: {
    position: 'absolute',
  },
  ringCenter: {
    alignItems: 'center',
  },
  ringPercent: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.semibold,
  },
  ringInfo: {
    alignItems: 'center',
    marginTop: spacing[3],
  },
  ringValue: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.semibold,
    fontVariant: ['tabular-nums'],
  },
  ringSub: {
    fontSize: fontSize.sm,
    marginTop: spacing[1],
  },

  // Summary
  summaryRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[6],
  },
  summaryCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
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
    fontVariant: ['tabular-nums'],
  },

  // Section
  section: {
    marginBottom: spacing[4],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  sectionAction: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },

  // Category card
  categoryCard: {
    borderRadius: radius.lg,
    padding: spacing[4],
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[3],
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryInfo: {
    flex: 1,
    gap: 2,
  },
  categoryName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  categoryAmount: {
    fontSize: fontSize.xs,
  },
  categoryPercent: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },

  // Progress bar
  progressTrack: {
    height: 6,
    borderRadius: 3,
    marginBottom: spacing[3],
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },

  divider: {
    height: 1,
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing[8],
    gap: spacing[2],
  },
  emptyText: {
    fontSize: fontSize.sm,
  },
});
