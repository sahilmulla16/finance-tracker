import { Feather } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFinance, type Transaction } from '@/context/FinanceContext';
import { useColors } from '@/hooks/useColors';
import { money, daysInMonth } from '@/utils/format';
import { spacing, radius, fontSize, fontWeight, lineHeight } from '@/constants/tokens';
import { Card, SectionHeader, StatTile } from '@/components/ui';

export default function InsightsScreen() {
  const { transactions, categories, settings } = useFinance();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState<'Week' | 'Month' | 'Year'>('Month');

  const expenseTransactions = useMemo(() => transactions.filter(t => t.type === 'EXPENSE'), [transactions]);
  const incomeTransactions = useMemo(() => transactions.filter(t => t.type === 'INCOME'), [transactions]);

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const thisMonthExpenses = expenseTransactions.filter(t => new Date(t.date) >= thisMonthStart);
  const lastMonthExpenses = expenseTransactions.filter(t => new Date(t.date) >= lastMonthStart && new Date(t.date) <= lastMonthEnd);
  const thisMonthIncome = incomeTransactions.filter(t => new Date(t.date) >= thisMonthStart);

  const totalExpense = thisMonthExpenses.reduce((sum, item) => sum + item.amount, 0);
  const totalIncome = thisMonthIncome.reduce((sum, item) => sum + item.amount, 0);
  const netFlow = totalIncome - totalExpense;

  const lastMonthTotal = lastMonthExpenses.reduce((sum, t) => sum + t.amount, 0);
  const monthChange = lastMonthTotal > 0 ? Math.round(((totalExpense - lastMonthTotal) / lastMonthTotal) * 100) : 0;

  const days = daysInMonth();
  const currentDay = now.getDate();
  const average = currentDay > 0 ? Math.round(totalExpense / currentDay) : 0;
  const budgetLeft = totalIncome - totalExpense;

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const thisMonthName = monthNames[now.getMonth()];

  // Category breakdown
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

  // Simple bar chart data (last 7 days)
  const weeklyData = useMemo(() => {
    const data: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayStr = date.toISOString().split('T')[0];
      const dayTotal = expenseTransactions
        .filter(t => t.date === dayStr)
        .reduce((sum, t) => sum + t.amount, 0);
      data.push(dayTotal);
    }
    return data;
  }, [expenseTransactions]);

  const maxWeekly = Math.max(...weeklyData, 1);

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.canvas }]}
      contentContainerStyle={{ paddingTop: insets.top + spacing[5], paddingBottom: spacing[24] }}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.headerIcon, { backgroundColor: colors.surfaceRecessed }]}>
            <Feather name="bar-chart" size={20} color={colors.fg} />
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.headerSub, { color: colors.fgMuted }]}>{thisMonthName} {now.getFullYear()}</Text>
            <Text style={[styles.headerTitle, { color: colors.fg }]}>Insights</Text>
          </View>
        </View>
        <Pressable style={[styles.iconBtn, { backgroundColor: colors.surface }]}>
          <Feather name="sliders" size={20} color={colors.primary} />
        </Pressable>
      </View>

      {/* Hero Card */}
      <Card variant="hero" style={styles.heroCard}>
        <View style={styles.heroTop}>
          <Text style={[styles.heroLabel, { color: colors.heroMuted }]}>Net flow</Text>
          <View style={styles.periodSelector}>
            {(['Week', 'Month', 'Year'] as const).map((p) => (
              <Pressable
                key={p}
                onPress={() => setPeriod(p)}
                style={[
                  styles.periodBtn,
                  period === p && { backgroundColor: 'rgba(255,255,255,0.10)' },
                ]}
              >
                <Text
                  style={[
                    styles.periodText,
                    { color: period === p ? '#ffffff' : colors.heroMuted },
                  ]}
                >
                  {p}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Text style={[styles.heroValue, { color: colors.heroText }]}>
          {netFlow >= 0 ? '+' : ''}{money(netFlow, settings.currency)}
        </Text>
        <Text style={[styles.heroSub, { color: colors.heroMuted }]}>
          <Text style={{ color: colors.income }}>
            {monthChange >= 0 ? '↗' : '↘'} {Math.abs(monthChange)}%
          </Text>
          {' '}vs last month
        </Text>

        {/* Simple Bar Chart */}
        <View style={styles.chartContainer}>
          {weeklyData.map((value, index) => (
            <View key={index} style={styles.barWrapper}>
              <View
                style={[
                  styles.bar,
                  {
                    height: `${Math.max((value / maxWeekly) * 100, 8)}%`,
                    backgroundColor: index === weeklyData.length - 1 ? colors.secondary : 'rgba(255,255,255,0.28)',
                  },
                ]}
              />
            </View>
          ))}
        </View>

        <View style={styles.heroLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.secondary }]} />
            <Text style={[styles.legendText, { color: colors.heroMuted }]}>Income</Text>
            <Text style={[styles.legendValue, { color: colors.heroText }]}>{money(totalIncome, settings.currency)}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: 'rgba(255,255,255,0.28)' }]} />
            <Text style={[styles.legendText, { color: colors.heroMuted }]}>Spending</Text>
            <Text style={[styles.legendValue, { color: colors.heroText }]}>{money(totalExpense, settings.currency)}</Text>
          </View>
        </View>
      </Card>

      {/* Pace Stats */}
      <View style={styles.section}>
        <SectionHeader title="Pace" action="Compare" />
        <View style={styles.statsGrid}>
          <StatTile label="Daily average" value={money(average, settings.currency)} style={{ flex: 1 }} />
          <StatTile label="Budget left" value={money(budgetLeft, settings.currency)} style={{ flex: 1 }} />
        </View>
      </View>

      {/* Category Ledger */}
      {categoryTotals.length > 0 && (
        <View style={styles.section}>
          <SectionHeader title="Where it went" action={`All ${categoryTotals.length}`} />
          <Card style={styles.categoryCard}>
            {categoryTotals.slice(0, 5).map((item, index) => (
              <Pressable key={item.name} style={styles.categoryRow}>
                <View style={[styles.categoryIcon, { backgroundColor: colors.surfaceRecessed }]}>
                  <Feather
                    name={(item.category?.icon || 'more-horizontal') as any}
                    size={18}
                    color={colors.fgMuted}
                  />
                </View>
                <View style={styles.categoryInfo}>
                  <Text style={[styles.categoryName, { color: colors.fg }]}>{item.name}</Text>
                  <View style={[styles.meterTrack, { backgroundColor: colors.surfaceRecessed }]}>
                    <View
                      style={[
                        styles.meterFill,
                        {
                          width: `${Math.max(item.percentage, 8)}%`,
                          backgroundColor: colors.fg,
                        },
                      ]}
                    />
                  </View>
                </View>
                <Text style={[styles.categoryAmount, { color: colors.fg }]}>
                  {money(item.amount, settings.currency)}
                </Text>
                <Feather name="chevron-right" size={18} color={colors.fgMuted} />
              </Pressable>
            ))}
          </Card>
        </View>
      )}

      {/* Empty state */}
      {expenseTransactions.length === 0 && (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.surfaceRecessed }]}>
            <Feather name="bar-chart" size={32} color={colors.fgSubtle} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.fg }]}>No insights yet</Text>
          <Text style={[styles.emptyMessage, { color: colors.fgMuted }]}>
            Add some transactions to see your spending patterns and insights.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    gap: 2,
  },
  headerSub: {
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * lineHeight.normal,
  },
  headerTitle: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
    lineHeight: fontSize.lg * lineHeight.snug,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    marginHorizontal: spacing[4],
    marginTop: spacing[6],
    padding: spacing[6],
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroLabel: {
    fontSize: fontSize.xs,
    letterSpacing: 0.08,
    textTransform: 'uppercase',
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radius.full,
    padding: 3,
  },
  periodBtn: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radius.full,
    minHeight: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  heroValue: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 44,
    fontWeight: fontWeight.medium,
    letterSpacing: -0.02,
    marginTop: spacing[4],
    fontVariant: ['tabular-nums'],
  },
  heroSub: {
    fontSize: fontSize.xs,
    marginTop: 4,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing[2],
    marginTop: spacing[5],
    height: 80,
  },
  barWrapper: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: radius.sm,
    minHeight: 4,
  },
  heroLegend: {
    marginTop: spacing[4],
    gap: spacing[2],
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: fontSize.xs,
    flex: 1,
  },
  legendValue: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    fontVariant: ['tabular-nums'],
  },
  section: {
    paddingHorizontal: spacing[5],
    marginTop: spacing[6],
    gap: spacing[3],
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  categoryCard: {
    padding: spacing[2],
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[3],
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryInfo: {
    flex: 1,
    gap: spacing[2],
  },
  categoryName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  meterTrack: {
    height: 4,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  meterFill: {
    height: 4,
    borderRadius: radius.full,
  },
  categoryAmount: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    fontVariant: ['tabular-nums'],
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing[12],
    paddingHorizontal: spacing[8],
    gap: spacing[4],
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: fontSize.base,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: fontSize.base * lineHeight.normal,
  },
});
