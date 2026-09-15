import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import {
  Dimensions,
  GestureResponderEvent,
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
const CHART_WIDTH = SCREEN_WIDTH - 48;
const CHART_HEIGHT = 220;

type FilterType = 'ALL' | 'INCOME' | 'EXPENSE' | 'TRANSFER';

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'INCOME', label: 'Income' },
  { key: 'EXPENSE', label: 'Expense' },
  { key: 'TRANSFER', label: 'Transfer' },
];

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function getMonthKey(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function getRecentMonths(count: number): { key: string; label: string; year: number; month: number }[] {
  const now = new Date();
  const result: { key: string; label: string; year: number; month: number }[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = MONTH_SHORT[d.getMonth()];
    result.push({ key, label, year: d.getFullYear(), month: d.getMonth() });
  }
  return result;
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

function findNearestIndex(x: number, points: { x: number; y: number }[]): number {
  let closest = 0;
  let minDist = Infinity;
  for (let i = 0; i < points.length; i++) {
    const dist = Math.abs(points[i].x - x);
    if (dist < minDist) {
      minDist = dist;
      closest = i;
    }
  }
  return closest;
}

function Chart({
  incomeData,
  expenseData,
  labels,
  selectedIndex,
  onSelect,
  isDark,
  colors,
  showIncome,
  showExpense,
}: {
  incomeData: number[];
  expenseData: number[];
  labels: string[];
  selectedIndex: number;
  onSelect: (i: number) => void;
  isDark: boolean;
  colors: ReturnType<typeof useColors>;
  showIncome: boolean;
  showExpense: boolean;
}) {
  const touchAreaRef = useRef<View>(null);

  const maxVal = useMemo(() => {
    const all: number[] = [];
    if (showIncome) all.push(...incomeData);
    if (showExpense) all.push(...expenseData);
    return Math.max(...all, 100);
  }, [incomeData, expenseData, showIncome, showExpense]);

  const pad = { top: 20, right: 12, bottom: 30, left: 0 };
  const plotW = CHART_WIDTH - pad.left - pad.right;
  const plotH = CHART_HEIGHT - pad.top - pad.bottom;

  const getPoint = useCallback((val: number, idx: number) => ({
    x: pad.left + (idx / Math.max(labels.length - 1, 1)) * plotW,
    y: pad.top + plotH - (val / maxVal) * plotH,
  }), [labels.length, maxVal, plotW, plotH, pad.left, pad.top]);

  const incomePoints = useMemo(() => incomeData.map((v, i) => getPoint(v, i)), [incomeData, getPoint]);
  const expensePoints = useMemo(() => expenseData.map((v, i) => getPoint(v, i)), [expenseData, getPoint]);

  const incomePath = useMemo(() => cubicBezierPath(incomePoints), [incomePoints]);
  const expensePath = useMemo(() => cubicBezierPath(expensePoints), [expensePoints]);

  const selPtInc = getPoint(incomeData[selectedIndex] || 0, selectedIndex);
  const selPtExp = getPoint(expenseData[selectedIndex] || 0, selectedIndex);

  const handleTouch = useCallback((evt: GestureResponderEvent) => {
    touchAreaRef.current?.measure((fx, fy, w, h, px, py) => {
      const touchX = evt.nativeEvent.pageX - px;
      const nearest = findNearestIndex(touchX, incomePoints);
      onSelect(nearest);
    });
  }, [incomePoints, onSelect]);

  return (
    <View
      ref={touchAreaRef}
      style={{ width: CHART_WIDTH, height: CHART_HEIGHT + 20 }}
      onStartShouldSetResponder={() => true}
      onResponderGrant={handleTouch}
      onResponderMove={handleTouch}
    >
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT + 20}>
        <Defs>
          <SvgGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={isDark ? '#B8F36B' : '#236B4F'} stopOpacity="0.3" />
            <Stop offset="100%" stopColor={isDark ? '#B8F36B' : '#236B4F'} stopOpacity="0" />
          </SvgGradient>
          <SvgGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={isDark ? '#AC9AD0' : '#7A5AF8'} stopOpacity="0.3" />
            <Stop offset="100%" stopColor={isDark ? '#AC9AD0' : '#7A5AF8'} stopOpacity="0" />
          </SvgGradient>
        </Defs>

        {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
          const y = pad.top + plotH * (1 - frac);
          return (
            <Path
              key={frac}
              d={`M${pad.left},${y} L${CHART_WIDTH - pad.right},${y}`}
              stroke={colors.divider}
              strokeWidth={0.5}
              opacity={0.3}
            />
          );
        })}

        <Path
          d={`M${selPtInc.x},${pad.top} L${selPtInc.x},${pad.top + plotH}`}
          stroke={colors.fgSubtle}
          strokeWidth={1}
          opacity={0.3}
          strokeDasharray="4 4"
        />

        {showIncome && incomePoints.length > 0 && (
          <Path
            d={`${incomePath} L${incomePoints[incomePoints.length - 1].x},${pad.top + plotH} L${incomePoints[0].x},${pad.top + plotH} Z`}
            fill="url(#incGrad)"
          />
        )}

        {showExpense && expensePoints.length > 0 && (
          <Path
            d={`${expensePath} L${expensePoints[expensePoints.length - 1].x},${pad.top + plotH} L${expensePoints[0].x},${pad.top + plotH} Z`}
            fill="url(#expGrad)"
          />
        )}

        {showIncome && <Path d={incomePath} stroke={isDark ? '#B8F36B' : '#236B4F'} strokeWidth={2} fill="none" />}
        {showExpense && <Path d={expensePath} stroke={isDark ? '#AC9AD0' : '#7A5AF8'} strokeWidth={2} fill="none" />}

        {showIncome && (
          <>
            <Circle cx={selPtInc.x} cy={selPtInc.y} r={5} fill={isDark ? '#B8F36B' : '#236B4F'} />
            <Circle cx={selPtInc.x} cy={selPtInc.y} r={2.5} fill={colors.canvas} />
          </>
        )}
        {showExpense && (
          <>
            <Circle cx={selPtExp.x} cy={selPtExp.y} r={5} fill={isDark ? '#AC9AD0' : '#7A5AF8'} />
            <Circle cx={selPtExp.x} cy={selPtExp.y} r={2.5} fill={colors.canvas} />
          </>
        )}
      </Svg>

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
              fontSize: 10,
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
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [selectedIdx, setSelectedIdx] = useState(0);

  const isDark = colors.canvas === '#090B0A';

  const rangeMonths = useMemo(() => getRecentMonths(6), []);
  const monthLabels = useMemo(() => rangeMonths.map((m) => m.label), [rangeMonths]);

  const filteredTxns = useMemo(() => {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    return transactions.filter((t) => {
      const d = new Date(t.date);
      return d >= startDate && d <= now;
    });
  }, [transactions]);

  const { monthlyIncome, monthlyExpense, totalIncome, totalExpense, totalTransfer } = useMemo(() => {
    const incMap: Record<string, number> = {};
    const expMap: Record<string, number> = {};
    const txfrMap: Record<string, number> = {};
    let tInc = 0;
    let tExp = 0;
    let tTxfr = 0;

    for (const m of rangeMonths) {
      incMap[m.key] = 0;
      expMap[m.key] = 0;
      txfrMap[m.key] = 0;
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
      } else if (type === 'TRANSFER' && txfrMap[key] !== undefined) {
        txfrMap[key] += amt;
        tTxfr += amt;
      }
    }

    return {
      monthlyIncome: rangeMonths.map((m) => incMap[m.key] || 0),
      monthlyExpense: rangeMonths.map((m) => expMap[m.key] || 0),
      monthlyTransfer: rangeMonths.map((m) => txfrMap[m.key] || 0),
      totalIncome: tInc,
      totalExpense: tExp,
      totalTransfer: tTxfr,
    };
  }, [filteredTxns, rangeMonths]);

  const totalBalance = useMemo(
    () => accounts.reduce((sum, a) => sum + getAccountBalance(a.id), 0),
    [accounts, getAccountBalance],
  );

  useEffect(() => {
    setSelectedIdx(monthLabels.length - 1);
  }, [monthLabels.length]);

  const safeIdx = Math.min(selectedIdx, monthLabels.length - 1);
  const selMonthLabel = monthLabels[safeIdx] || '';
  const selInc = monthlyIncome[safeIdx] || 0;
  const selExp = monthlyExpense[safeIdx] || 0;
  const selProfitPct = selInc > 0 ? ((selInc - selExp) / selInc) * 100 : 0;

  const showIncome = filter === 'ALL' || filter === 'INCOME';
  const showExpense = filter === 'ALL' || filter === 'EXPENSE';

  const netCashFlow = totalIncome - totalExpense;
  const empty = filteredTxns.length === 0;

  const prevMonthIdx = Math.max(0, safeIdx - 1);
  const prevExp = monthlyExpense[prevMonthIdx] || 0;
  const savingsPct = prevExp > 0 ? Math.round(((prevExp - (selExp || 0)) / prevExp) * 100) : 0;

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
        {/* Filter pills */}
        <View style={styles.filterRow}>
          {FILTERS.map((f) => (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[
                styles.filterPill,
                { backgroundColor: filter === f.key ? colors.primary : colors.surfaceRecessed },
              ]}
            >
              <Text style={{
                fontSize: fontSize.xs,
                fontWeight: fontWeight.medium,
                color: filter === f.key ? colors.onPrimary : colors.fgMuted,
              }}>
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

        {/* Selected month tooltip */}
        <View style={[styles.selectedTooltip, {
          backgroundColor: isDark ? '#11151A' : '#FFFFFF',
          borderColor: isDark ? '#2B3238' : '#E5E7EB',
        }]}>
          <Text style={[styles.selectedMonth, { color: isDark ? '#FFFFFF' : '#111312' }]}>{selMonthLabel}</Text>
          <View style={styles.selectedRow}>
            <View style={[styles.selectedDot, { backgroundColor: isDark ? '#B8F36B' : '#236B4F' }]} />
            <Text style={[styles.selectedLabel, { color: isDark ? '#8D969F' : '#6B7280' }]}>income</Text>
            <Text style={[styles.selectedVal, { color: isDark ? '#B8F36B' : '#236B4F' }]}>
              {money(selInc, settings.currency as Currency)}
            </Text>
          </View>
          <View style={styles.selectedRow}>
            <View style={[styles.selectedDot, { backgroundColor: isDark ? '#AC9AD0' : '#7A5AF8' }]} />
            <Text style={[styles.selectedLabel, { color: isDark ? '#8D969F' : '#6B7280' }]}>expense</Text>
            <Text style={[styles.selectedVal, { color: isDark ? '#AC9AD0' : '#7A5AF8' }]}>
              {money(selExp, settings.currency as Currency)}
            </Text>
          </View>
          <View style={[styles.selectedRow, { marginTop: 4, paddingTop: 4, borderTopWidth: 1, borderTopColor: isDark ? '#2B3238' : '#E5E7EB' }]}>
            <Text style={[styles.selectedLabel, { color: isDark ? '#8D969F' : '#6B7280' }]}>profit</Text>
            <Text style={[styles.selectedVal, { color: colors.primary }]}>{selProfitPct.toFixed(1)}%</Text>
          </View>
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
              selectedIndex={safeIdx}
              onSelect={setSelectedIdx}
              isDark={isDark}
              colors={colors}
              showIncome={showIncome}
              showExpense={showExpense}
            />
            <View style={styles.chartLegend}>
              {showIncome && (
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: isDark ? '#B8F36B' : '#236B4F' }]} />
                  <Text style={[styles.legendText, { color: colors.fgMuted }]}>Income</Text>
                </View>
              )}
              {showExpense && (
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: isDark ? '#AC9AD0' : '#7A5AF8' }]} />
                  <Text style={[styles.legendText, { color: colors.fgMuted }]}>Expenses</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Income & Expense cards */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.summaryIcon, { backgroundColor: isDark ? '#1A3328' : '#E8F5E9' }]}>
              <Feather name="arrow-up-right" size={16} color={isDark ? '#B8F36B' : '#236B4F'} />
            </View>
            <Text style={[styles.summaryLabel, { color: colors.fgMuted }]}>Income</Text>
            <Text style={[styles.summaryValue, { color: isDark ? '#B8F36B' : '#236B4F' }]}>
              {money(totalIncome, settings.currency)}
            </Text>
            {prevExp > 0 && (
              <Text style={[styles.summaryPct, { color: isDark ? '#B8F36B' : '#236B4F' }]}>
                {totalIncome >= totalExpense ? '+' : ''}{Math.round(((totalIncome - totalExpense) / Math.max(totalExpense, 1)) * 100)}%
              </Text>
            )}
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.summaryIcon, { backgroundColor: isDark ? '#2A1F30' : '#F3E8FF' }]}>
              <Feather name="arrow-down-left" size={16} color={isDark ? '#AC9AD0' : '#7A5AF8'} />
            </View>
            <Text style={[styles.summaryLabel, { color: colors.fgMuted }]}>Expense</Text>
            <Text style={[styles.summaryValue, { color: isDark ? '#AC9AD0' : '#7A5AF8' }]}>
              {money(totalExpense, settings.currency)}
            </Text>
            {totalIncome > 0 && (
              <Text style={[styles.summaryPct, { color: isDark ? '#AC9AD0' : '#7A5AF8' }]}>
                {Math.round((totalExpense / totalIncome) * 100)}%
              </Text>
            )}
          </View>
        </View>

        {/* Savings message */}
        {savingsPct > 0 && (
          <Pressable style={[styles.savingsCard, { backgroundColor: isDark ? '#1E1A2E' : '#F3E8FF' }]}>
            <View style={styles.savingsContent}>
              <Text style={[styles.savingsIcon]}>🎉</Text>
              <Text style={[styles.savingsText, { color: isDark ? '#D4C4F0' : '#4A3580' }]}>
                You saved {savingsPct}% more than last month
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color={isDark ? '#AC9AD0' : '#7A5AF8'} />
          </Pressable>
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

  // Filter pills
  filterRow: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  filterPill: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Balance
  balanceSection: {
    marginBottom: spacing[4],
  },
  balanceLabel: {
    fontSize: 13,
    lineHeight: 18,
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: fontWeight.semibold,
    lineHeight: 38,
    marginTop: spacing[1],
    fontVariant: ['tabular-nums'],
  },

  // Selected month tooltip
  selectedTooltip: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: spacing[3],
  },
  selectedMonth: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    marginBottom: 4,
  },
  selectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  selectedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  selectedLabel: {
    fontSize: fontSize.xs,
    flex: 1,
  },
  selectedVal: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    fontVariant: ['tabular-nums'],
  },

  // Chart
  chartCard: {
    borderRadius: radius.lg,
    padding: spacing[3],
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
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    fontVariant: ['tabular-nums'],
    marginBottom: 2,
  },
  summaryPct: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },

  // Savings
  savingsCard: {
    borderRadius: radius.lg,
    padding: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  savingsContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  savingsIcon: {
    fontSize: 18,
  },
  savingsText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    flex: 1,
  },
});
