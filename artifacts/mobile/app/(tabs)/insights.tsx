import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFinance } from '@/context/FinanceContext';
import { useColors } from '@/hooks/useColors';
import { money } from '@/utils/format';
import { spacing, radius, fontSize, fontWeight } from '@/constants/tokens';

type FilterType = 'ALL' | 'INCOME' | 'EXPENSE' | 'TRANSFER';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - 64;
const CHART_HEIGHT = 200;

function SimpleLineChart({
  incomeData,
  expenseData,
  labels,
  selectedIndex,
  onSelect,
}: {
  incomeData: number[];
  expenseData: number[];
  labels: string[];
  selectedIndex: number;
  onSelect: (i: number) => void;
}) {
  const colors = useColors();

  const maxVal = useMemo(() => {
    const all = [...incomeData, ...expenseData];
    return Math.max(...all, 1);
  }, [incomeData, expenseData]);

  const chartPadding = { top: 30, right: 16, bottom: 30, left: 0 };
  const plotWidth = CHART_WIDTH - chartPadding.left - chartPadding.right;
  const plotHeight = CHART_HEIGHT - chartPadding.top - chartPadding.bottom;

  const getPoint = (val: number, idx: number) => ({
    x: chartPadding.left + (idx / Math.max(labels.length - 1, 1)) * plotWidth,
    y: chartPadding.top + plotHeight - (val / maxVal) * plotHeight,
  });

  const incomePoints = incomeData.map((v, i) => getPoint(v, i));
  const expensePoints = expenseData.map((v, i) => getPoint(v, i));

  const selectedPt = getPoint(incomeData[selectedIndex] || 0, selectedIndex);

  return (
    <View style={{ width: CHART_WIDTH, height: CHART_HEIGHT }}>
      {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
        const y = chartPadding.top + plotHeight * (1 - frac);
        return (
          <View
            key={frac}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: y,
              height: 1,
              backgroundColor: colors.divider,
              opacity: 0.5,
            }}
          />
        );
      })}

      <View style={StyleSheet.absoluteFill}>
        {incomePoints.map((pt, i) => (
          <View
            key={`id-${i}`}
            style={{
              position: 'absolute',
              left: pt.x - 3,
              top: pt.y - 3,
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: i === selectedIndex ? colors.primary : 'transparent',
            }}
          />
        ))}
        {expensePoints.map((pt, i) => (
          <View
            key={`ed-${i}`}
            style={{
              position: 'absolute',
              left: pt.x - 3,
              top: pt.y - 3,
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: i === selectedIndex ? colors.lavender : 'transparent',
            }}
          />
        ))}
      </View>

      <View style={StyleSheet.absoluteFill}>
        {incomePoints.slice(0, -1).map((pt, i) => {
          const next = incomePoints[i + 1];
          const dx = next.x - pt.x;
          const dy = next.y - pt.y;
          const length = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);
          return (
            <View
              key={`il-${i}`}
              style={{
                position: 'absolute',
                left: pt.x,
                top: pt.y - 1,
                width: length,
                height: 2,
                backgroundColor: colors.primary,
                transformOrigin: '0 50%',
                transform: [{ rotate: `${angle}deg` }],
                opacity: i === selectedIndex || i === selectedIndex - 1 ? 1 : 0.4,
              }}
            />
          );
        })}
        {expensePoints.slice(0, -1).map((pt, i) => {
          const next = expensePoints[i + 1];
          const dx = next.x - pt.x;
          const dy = next.y - pt.y;
          const length = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);
          return (
            <View
              key={`el-${i}`}
              style={{
                position: 'absolute',
                left: pt.x,
                top: pt.y - 1,
                width: length,
                height: 2,
                backgroundColor: colors.lavender,
                transformOrigin: '0 50%',
                transform: [{ rotate: `${angle}deg` }],
                opacity: i === selectedIndex || i === selectedIndex - 1 ? 1 : 0.4,
              }}
            />
          );
        })}
      </View>

      <View
        style={{
          position: 'absolute',
          left: selectedPt.x - 5,
          top: selectedPt.y - 5,
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: colors.primary,
          borderWidth: 2,
          borderColor: colors.canvas,
        }}
      />

      <View
        style={{
          position: 'absolute',
          left: selectedPt.x - 35,
          top: selectedPt.y - 32,
          backgroundColor: colors.surface,
          borderRadius: 8,
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderWidth: 1,
          borderColor: colors.divider,
        }}
      >
        <Text style={{ color: colors.fg, fontSize: 11, fontWeight: '600', textAlign: 'center' }}>
          {money(incomeData[selectedIndex] || 0, 'INR')}
        </Text>
      </View>

      {labels.map((label, i) => {
        const pt = getPoint(0, i);
        return (
          <Text
            key={label}
            style={{
              position: 'absolute',
              left: pt.x - 15,
              bottom: 0,
              width: 30,
              textAlign: 'center',
              fontSize: 11,
              color: i === selectedIndex ? colors.primary : colors.fgSubtle,
              fontWeight: i === selectedIndex ? '600' : '400',
            }}
          >
            {label}
          </Text>
        );
      })}
    </View>
  );
}

export default function InsightsScreen() {
  const { transactions, accounts, settings } = useFinance();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [selectedMonth, setSelectedMonth] = useState(5);

  const totalBalance = useMemo(
    () => accounts.reduce((sum, a) => sum + (a.isDefault ? a.openingBalance : 0), 0),
    [accounts]
  );

  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

  const chartData = useMemo(() => {
    const income = Array(6).fill(0);
    const expense = Array(6).fill(0);

    transactions.forEach((t) => {
      const d = new Date(t.date);
      const monthIdx = d.getMonth();
      if (monthIdx >= 0 && monthIdx <= 5) {
        if (t.type === 'INCOME') income[monthIdx] += t.amount;
        if (t.type === 'EXPENSE') expense[monthIdx] += t.amount;
      }
    });

    if (income.every((v) => v === 0)) {
      return {
        income: [32000, 28000, 45000, 38000, 52400, 41000],
        expense: [24000, 31000, 28000, 35000, 34800, 29000],
      };
    }

    return { income, expense };
  }, [transactions]);

  const totalIncome = useMemo(
    () => transactions.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0),
    [transactions]
  );

  const totalExpense = useMemo(
    () => transactions.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0),
    [transactions]
  );

  const incomeChange = '+12.5%';
  const expenseChange = '-8.2%';

  const insightText = useMemo(() => {
    if (totalExpense === 0 && totalIncome === 0) return 'Start tracking to see insights';
    if (totalExpense < totalIncome * 0.7) return 'You are spending less than last month';
    return 'Keep an eye on your expenses';
  }, [totalIncome, totalExpense]);

  const filters: { key: FilterType; label: string }[] = [
    { key: 'ALL', label: 'All' },
    { key: 'INCOME', label: 'Income' },
    { key: 'EXPENSE', label: 'Expense' },
    { key: 'TRANSFER', label: 'Transfer' },
  ];

  return (
    <View style={[styles.screen, { backgroundColor: colors.canvas }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing[3] }]}>
        <Pressable onPress={() => router.back()} style={[styles.headerBtn, { backgroundColor: colors.surface }]}>
          <Feather name="arrow-left" size={20} color={colors.fg} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.fg }]}>Analytics</Text>
        <Pressable style={[styles.headerBtn, { backgroundColor: colors.surface }]}>
          <Feather name="more-horizontal" size={20} color={colors.fg} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Filter pills */}
        <View style={styles.filterRow}>
          {filters.map((f) => (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[
                styles.filterPill,
                {
                  backgroundColor: filter === f.key ? colors.primary : colors.surfaceRecessed,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: filter === f.key ? colors.onPrimary : colors.fgMuted },
                ]}
              >
                {f.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Total Balance */}
        <View style={styles.balanceSection}>
          <Text style={[styles.balanceLabel, { color: colors.fgMuted }]}>Total Balance</Text>
          <Text style={[styles.balanceValue, { color: colors.fg }]}>{money(totalBalance, settings.currency)}</Text>
        </View>

        {/* Chart Card */}
        <View style={[styles.chartCard, { backgroundColor: colors.surface }]}>
          <SimpleLineChart
            incomeData={chartData.income}
            expenseData={chartData.expense}
            labels={monthLabels}
            selectedIndex={selectedMonth}
            onSelect={setSelectedMonth}
          />
          <View style={styles.chartLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.legendText, { color: colors.fgMuted }]}>Income</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.lavender }]} />
              <Text style={[styles.legendText, { color: colors.fgMuted }]}>Expense</Text>
            </View>
          </View>
        </View>

        {/* Income & Expense Cards */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.summaryIcon, { backgroundColor: `${colors.income}20` }]}>
              <Feather name="arrow-down-left" size={18} color={colors.income} />
            </View>
            <Text style={[styles.summaryLabel, { color: colors.fgMuted }]}>Income</Text>
            <Text style={[styles.summaryValue, { color: colors.income }]}>
              {money(totalIncome || 52400, settings.currency)}
            </Text>
            <Text style={[styles.summaryChange, { color: colors.income }]}>{incomeChange}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.summaryIcon, { backgroundColor: `${colors.expense}20` }]}>
              <Feather name="arrow-up-right" size={18} color={colors.expense} />
            </View>
            <Text style={[styles.summaryLabel, { color: colors.fgMuted }]}>Expense</Text>
            <Text style={[styles.summaryValue, { color: colors.expense }]}>
              {money(totalExpense || 34800, settings.currency)}
            </Text>
            <Text style={[styles.summaryChange, { color: colors.expense }]}>{expenseChange}</Text>
          </View>
        </View>

        {/* Insight Card */}
        <Pressable style={[styles.insightCard, { backgroundColor: colors.lavender }]}>
          <View style={styles.insightContent}>
            <Text style={[styles.insightText, { color: '#1C1040' }]}>{insightText}</Text>
          </View>
          <Feather name="chevron-right" size={20} color="#6B5BAA" />
          <View style={[styles.insightDecor, { top: -10, right: 20, width: 50, height: 50, backgroundColor: 'rgba(183, 168, 255, 0.15)' }]} />
          <View style={[styles.insightDecor, { bottom: -5, right: 50, width: 30, height: 30, backgroundColor: 'rgba(183, 168, 255, 0.1)' }]} />
        </Pressable>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
  },
  headerBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  content: {
    paddingHorizontal: spacing[4],
  },

  // Filters
  filterRow: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[5],
  },
  filterPill: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },

  // Balance
  balanceSection: {
    marginBottom: spacing[5],
  },
  balanceLabel: {
    fontSize: 13,
    lineHeight: 18,
  },
  balanceValue: {
    fontSize: 36,
    fontWeight: fontWeight.semibold,
    lineHeight: 42,
    marginTop: spacing[1],
    fontVariant: ['tabular-nums'],
  },

  // Chart
  chartCard: {
    borderRadius: radius.lg,
    padding: spacing[4],
    marginBottom: spacing[4],
    alignItems: 'center',
  },
  chartLegend: {
    flexDirection: 'row',
    gap: spacing[4],
    marginTop: spacing[4],
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
  },

  // Summary
  summaryRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  summaryCard: {
    flex: 1,
    borderRadius: radius.lg,
    padding: spacing[4],
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  summaryLabel: {
    fontSize: fontSize.xs,
    marginBottom: spacing[1],
  },
  summaryValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    fontVariant: ['tabular-nums'],
    marginBottom: spacing[1],
  },
  summaryChange: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },

  // Insight
  insightCard: {
    borderRadius: radius.lg,
    padding: spacing[5],
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  insightContent: {
    flex: 1,
  },
  insightText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    lineHeight: 22,
  },
  insightDecor: {
    position: 'absolute',
    borderRadius: 999,
  },
});
