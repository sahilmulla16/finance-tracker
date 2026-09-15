import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Path, Circle, Defs, Stop, LinearGradient as SvgGradient } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFinance, type Transaction, type Currency } from '@/context/FinanceContext';
import { useColors } from '@/hooks/useColors';
import { money } from '@/utils/format';
import { spacing, radius, fontSize, fontWeight } from '@/constants/tokens';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - 64;
const CHART_HEIGHT = 200;

type RangeKey = '1M' | '3M' | '6M' | '1Y';

const RANGES: { key: RangeKey; label: string }[] = [
  { key: '1M', label: '1 Month' },
  { key: '3M', label: '3 Months' },
  { key: '6M', label: '6 Months' },
  { key: '1Y', label: '1 Year' },
];

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function getMonthKey(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function getRangeMonths(range: RangeKey): { key: string; label: string; year: number; month: number }[] {
  const now = new Date();
  const result: { key: string; label: string; year: number; month: number }[] = [];
  let monthsBack = 1;
  if (range === '3M') monthsBack = 3;
  else if (range === '6M') monthsBack = 6;
  else if (range === '1Y') monthsBack = 12;

  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = MONTH_SHORT[d.getMonth()];
    result.push({ key, label, year: d.getFullYear(), month: d.getMonth() });
  }
  return result;
}

function filterTransactionsByRange(transactions: Transaction[], range: RangeKey): Transaction[] {
  const months = getRangeMonths(range);
  if (months.length === 0) return [];
  const firstMonth = months[0];
  const startDate = new Date(firstMonth.year, firstMonth.month, 1);
  const now = new Date();
  return transactions.filter((t) => {
    const d = new Date(t.date);
    return d >= startDate && d <= now;
  });
}

function cubicBezierPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M${points[0].x},${points[0].y}`;

  let path = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  return path;
}

function Chart({
  incomeData,
  expenseData,
  labels,
  selectedIndex,
  onSelect,
  currency,
}: {
  incomeData: number[];
  expenseData: number[];
  labels: string[];
  selectedIndex: number;
  onSelect: (i: number) => void;
  currency: string;
}) {
  const colors = useColors();
  const isDark = colors.canvas === '#090B0A';

  const maxVal = useMemo(() => {
    const all = [...incomeData, ...expenseData];
    return Math.max(...all, 100);
  }, [incomeData, expenseData]);

  const pad = { top: 35, right: 16, bottom: 30, left: 0 };
  const plotW = CHART_WIDTH - pad.left - pad.right;
  const plotH = CHART_HEIGHT - pad.top - pad.bottom;

  const getPoint = (val: number, idx: number) => ({
    x: pad.left + (idx / Math.max(labels.length - 1, 1)) * plotW,
    y: pad.top + plotH - (val / maxVal) * plotH,
  });

  const incomePoints = incomeData.map((v, i) => getPoint(v, i));
  const expensePoints = expenseData.map((v, i) => getPoint(v, i));

  const incomePath = cubicBezierPath(incomePoints);
  const expensePath = cubicBezierPath(expensePoints);

  const selInc = incomeData[selectedIndex] || 0;
  const selExp = expenseData[selectedIndex] || 0;
  const selLabel = labels[selectedIndex] || '';
  const selPtInc = getPoint(selInc, selectedIndex);
  const selPtExp = getPoint(selExp, selectedIndex);
  const avgY = (selPtInc.y + selPtExp.y) / 2;

  return (
    <View style={{ width: CHART_WIDTH, height: CHART_HEIGHT + 20 }}>
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT + 20}>
        <Defs>
          <SvgGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={isDark ? '#B8F36B' : '#236B4F'} stopOpacity="0.25" />
            <Stop offset="100%" stopColor={isDark ? '#B8F36B' : '#236B4F'} stopOpacity="0" />
          </SvgGradient>
          <SvgGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={isDark ? '#AC9AD0' : '#7A5AF8'} stopOpacity="0.25" />
            <Stop offset="100%" stopColor={isDark ? '#AC9AD0' : '#7A5AF8'} stopOpacity="0" />
          </SvgGradient>
        </Defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
          const y = pad.top + plotH * (1 - frac);
          return (
            <Path
              key={frac}
              d={`M${pad.left},${y} L${CHART_WIDTH - pad.right},${y}`}
              stroke={colors.divider}
              strokeWidth={0.5}
              opacity={0.5}
            />
          );
        })}

        {/* Vertical guide */}
        <Path
          d={`M${selPtInc.x},${pad.top} L${selPtInc.x},${pad.top + plotH}`}
          stroke={colors.fgSubtle}
          strokeWidth={1}
          opacity={0.4}
          strokeDasharray="4 4"
        />

        {/* Income area */}
        {incomePoints.length > 0 && (
          <Path
            d={`${incomePath} L${incomePoints[incomePoints.length - 1].x},${pad.top + plotH} L${incomePoints[0].x},${pad.top + plotH} Z`}
            fill="url(#incGrad)"
          />
        )}

        {/* Expense area */}
        {expensePoints.length > 0 && (
          <Path
            d={`${expensePath} L${expensePoints[expensePoints.length - 1].x},${pad.top + plotH} L${expensePoints[0].x},${pad.top + plotH} Z`}
            fill="url(#expGrad)"
          />
        )}

        {/* Income line */}
        <Path d={incomePath} stroke={isDark ? '#B8F36B' : '#236B4F'} strokeWidth={2.5} fill="none" />

        {/* Expense line */}
        <Path d={expensePath} stroke={isDark ? '#AC9AD0' : '#7A5AF8'} strokeWidth={2.5} fill="none" />

        {/* Selected dots */}
        <Circle cx={selPtInc.x} cy={selPtInc.y} r={5} fill={isDark ? '#B8F36B' : '#236B4F'} />
        <Circle cx={selPtInc.x} cy={selPtInc.y} r={3} fill={colors.canvas} />
        <Circle cx={selPtExp.x} cy={selPtExp.y} r={5} fill={isDark ? '#AC9AD0' : '#7A5AF8'} />
        <Circle cx={selPtExp.x} cy={selPtExp.y} r={3} fill={colors.canvas} />
      </Svg>

      {/* Tooltip */}
      <View
        style={[
          styles.tooltip,
          {
            left: Math.max(8, Math.min(selPtInc.x - 60, CHART_WIDTH - 140)),
            top: avgY - 70,
            backgroundColor: isDark ? '#11151A' : '#FFFFFF',
            borderColor: isDark ? '#2B3238' : '#E5E7EB',
          },
        ]}
      >
        <Text style={[styles.tooltipMonth, { color: isDark ? '#FFFFFF' : '#111312' }]}>{selLabel}</Text>
        <View style={styles.tooltipRow}>
          <View style={[styles.tooltipDot, { backgroundColor: isDark ? '#B8F36B' : '#236B4F' }]} />
          <Text style={[styles.tooltipText, { color: isDark ? '#8D969F' : '#6B7280' }]}>Income</Text>
          <Text style={[styles.tooltipVal, { color: isDark ? '#B8F36B' : '#236B4F' }]}>{money(selInc, currency as Currency)}</Text>
        </View>
        <View style={styles.tooltipRow}>
          <View style={[styles.tooltipDot, { backgroundColor: isDark ? '#AC9AD0' : '#7A5AF8' }]} />
          <Text style={[styles.tooltipText, { color: isDark ? '#8D969F' : '#6B7280' }]}>Expenses</Text>
          <Text style={[styles.tooltipVal, { color: isDark ? '#AC9AD0' : '#7A5AF8' }]}>{money(selExp, currency as Currency)}</Text>
        </View>
      </View>

      {/* Month labels */}
      {labels.map((label, i) => {
        const pt = getPoint(0, i);
        return (
          <Text
            key={`${label}-${i}`}
            style={{
              position: 'absolute',
              left: pt.x - 15,
              bottom: 0,
              width: 30,
              textAlign: 'center',
              fontSize: 11,
              color: i === selectedIndex ? (isDark ? '#B8F36B' : '#236B4F') : colors.fgSubtle,
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
  const { transactions, accounts, categories, settings, getAccountBalance } = useFinance();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [range, setRange] = useState<RangeKey>('6M');
  const [selectedIdx, setSelectedIdx] = useState(0);

  const isDark = colors.canvas === '#090B0A';

  const rangeMonths = useMemo(() => getRangeMonths(range), [range]);
  const monthLabels = useMemo(() => rangeMonths.map((m) => m.label), [rangeMonths]);

  const filteredTxns = useMemo(() => filterTransactionsByRange(transactions, range), [transactions, range]);

  const { monthlyIncome, monthlyExpense, totalIncome, totalExpense } = useMemo(() => {
    const incMap: Record<string, number> = {};
    const expMap: Record<string, number> = {};
    let tInc = 0;
    let tExp = 0;

    for (const m of rangeMonths) {
      incMap[m.key] = 0;
      expMap[m.key] = 0;
    }

    for (const txn of filteredTxns) {
      const key = getMonthKey(txn.date);
      const amt = Math.abs(Number(txn.amount)) || 0;
      const type = (txn.type || '').toUpperCase();
      if (type === 'INCOME' && incMap[key] !== undefined) {
        incMap[key] += amt;
        tInc += amt;
      } else if (type === 'EXPENSE' && expMap[key] !== undefined) {
        expMap[key] += amt;
        tExp += amt;
      }
    }

    return {
      monthlyIncome: rangeMonths.map((m) => incMap[m.key] || 0),
      monthlyExpense: rangeMonths.map((m) => expMap[m.key] || 0),
      totalIncome: tInc,
      totalExpense: tExp,
    };
  }, [filteredTxns, rangeMonths]);

  const totalBalance = useMemo(
    () => accounts.reduce((sum, a) => sum + getAccountBalance(a.id), 0),
    [accounts, getAccountBalance],
  );

  const categoryBreakdown = useMemo(() => {
    const catMap: Record<string, { name: string; icon: string; color: string; amount: number }> = {};
    for (const txn of filteredTxns) {
      const type = (txn.type || '').toUpperCase();
      if (type !== 'EXPENSE') continue;
      const catId = txn.categoryId || txn.category || 'other';
      const cat = categories.find((c) => c.id === catId);
      const name = cat?.name || txn.category || 'Other';
      const icon = cat?.icon || 'more-horizontal';
      const color = cat?.color || '#8E9AAF';
      const amt = Math.abs(Number(txn.amount)) || 0;
      if (!catMap[catId]) catMap[catId] = { name, icon, color, amount: 0 };
      catMap[catId].amount += amt;
    }
    return Object.values(catMap)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);
  }, [filteredTxns, categories]);

  const netCashFlow = totalIncome - totalExpense;

  const empty = filteredTxns.length === 0;

  return (
    <View style={[styles.screen, { backgroundColor: colors.canvas }]}>
      <View style={[styles.header, { paddingTop: insets.top + spacing[3] }]}>
        <Pressable onPress={() => router.back()} style={[styles.headerBtn, { backgroundColor: colors.surface }]}>
          <Feather name="arrow-left" size={20} color={colors.fg} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.fg }]}>Analytics</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Range selector */}
        <View style={styles.rangeRow}>
          {RANGES.map((r) => (
            <Pressable
              key={r.key}
              onPress={() => { setRange(r.key); setSelectedIdx(0); }}
              style={[
                styles.rangePill,
                {
                  backgroundColor: range === r.key ? colors.primary : colors.surfaceRecessed,
                },
              ]}
            >
              <Text
                style={{
                  fontSize: fontSize.xs,
                  fontWeight: fontWeight.medium,
                  color: range === r.key ? colors.onPrimary : colors.fgMuted,
                }}
              >
                {r.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Summary cards */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.summaryIcon, { backgroundColor: `${colors.income}20` }]}>
              <Feather name="arrow-down-left" size={16} color={colors.income} />
            </View>
            <Text style={[styles.summaryLabel, { color: colors.fgMuted }]}>Income</Text>
            <Text style={[styles.summaryValue, { color: colors.income }]}>
              {money(totalIncome, settings.currency)}
            </Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.summaryIcon, { backgroundColor: `${colors.expense}20` }]}>
              <Feather name="arrow-up-right" size={16} color={colors.expense} />
            </View>
            <Text style={[styles.summaryLabel, { color: colors.fgMuted }]}>Expenses</Text>
            <Text style={[styles.summaryValue, { color: colors.expense }]}>
              {money(totalExpense, settings.currency)}
            </Text>
          </View>
        </View>

        <View style={[styles.netCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.netLabel, { color: colors.fgMuted }]}>Net Cash Flow</Text>
          <Text style={[styles.netValue, { color: netCashFlow >= 0 ? colors.income : colors.expense }]}>
            {netCashFlow >= 0 ? '+' : ''}{money(netCashFlow, settings.currency)}
          </Text>
        </View>

        {/* Chart */}
        {empty ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
            <Feather name="bar-chart-2" size={40} color={colors.fgSubtle} />
            <Text style={[styles.emptyTitle, { color: colors.fg }]}>No spending data yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.fgMuted }]}>
              Add your first transaction to see your insights.
            </Text>
          </View>
        ) : (
          <View style={[styles.chartCard, { backgroundColor: colors.surface }]}>
            <Chart
              incomeData={monthlyIncome}
              expenseData={monthlyExpense}
              labels={monthLabels}
              selectedIndex={Math.min(selectedIdx, monthLabels.length - 1)}
              onSelect={setSelectedIdx}
              currency={settings.currency}
            />
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: isDark ? '#B8F36B' : '#236B4F' }]} />
                <Text style={[styles.legendText, { color: colors.fgMuted }]}>Income</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: isDark ? '#AC9AD0' : '#7A5AF8' }]} />
                <Text style={[styles.legendText, { color: colors.fgMuted }]}>Expenses</Text>
              </View>
            </View>
          </View>
        )}

        {/* Category breakdown */}
        {categoryBreakdown.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.fg }]}>Spending by Category</Text>
            {categoryBreakdown.map((cat) => {
              const pct = totalExpense > 0 ? Math.round((cat.amount / totalExpense) * 100) : 0;
              return (
                <View key={cat.name} style={[styles.catRow, { backgroundColor: colors.surface }]}>
                  <View style={[styles.catIcon, { backgroundColor: cat.color + '20' }]}>
                    <Feather name={cat.icon as never} size={16} color={cat.color} />
                  </View>
                  <View style={styles.catInfo}>
                    <Text style={[styles.catName, { color: colors.fg }]}>{cat.name}</Text>
                    <View style={styles.catBarBg}>
                      <View style={[styles.catBarFill, { width: `${pct}%`, backgroundColor: cat.color }]} />
                    </View>
                  </View>
                  <View style={styles.catRight}>
                    <Text style={[styles.catAmount, { color: colors.fg }]}>{money(cat.amount, settings.currency)}</Text>
                    <Text style={[styles.catPct, { color: colors.fgMuted }]}>{pct}%</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

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

  // Range
  rangeRow: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  rangePill: {
    flex: 1,
    paddingVertical: spacing[2],
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 34,
  },

  // Summary
  summaryRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  summaryCard: {
    flex: 1,
    borderRadius: radius.lg,
    padding: spacing[4],
  },
  summaryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  summaryLabel: {
    fontSize: fontSize.xs,
    marginBottom: spacing[1],
  },
  summaryValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    fontVariant: ['tabular-nums'],
  },

  // Net
  netCard: {
    borderRadius: radius.lg,
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  netLabel: {
    fontSize: fontSize.xs,
    marginBottom: spacing[1],
  },
  netValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
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
    marginTop: spacing[3],
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

  // Empty
  emptyCard: {
    borderRadius: radius.lg,
    padding: spacing[8],
    marginBottom: spacing[4],
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    marginTop: spacing[3],
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    marginTop: spacing[2],
    textAlign: 'center',
  },

  // Tooltip
  tooltip: {
    position: 'absolute',
    width: 140,
    borderRadius: 10,
    borderWidth: 1,
    padding: 8,
    zIndex: 10,
  },
  tooltipMonth: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  tooltipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  tooltipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tooltipText: {
    fontSize: 10,
    flex: 1,
  },
  tooltipVal: {
    fontSize: 10,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },

  // Category breakdown
  section: {
    marginTop: spacing[2],
    marginBottom: spacing[4],
  },
  sectionTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing[3],
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    borderRadius: radius.lg,
    marginBottom: spacing[2],
    gap: spacing[3],
  },
  catIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catInfo: {
    flex: 1,
  },
  catName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginBottom: 4,
  },
  catBarBg: {
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  catBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  catRight: {
    alignItems: 'flex-end',
  },
  catAmount: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    fontVariant: ['tabular-nums'],
  },
  catPct: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
});
