import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, {
  useMemo,
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";
import {
  Dimensions,
  GestureResponderEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, {
  Path,
  Circle,
  Defs,
  Stop,
  LinearGradient as SvgGradient,
} from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useFinance,
  type Transaction,
  type Currency,
} from "@/context/FinanceContext";
import { useColors } from "@/hooks/useColors";
import { money } from "@/utils/format";
import { spacing, radius, fontSize, fontWeight } from "@/constants/tokens";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CHART_WIDTH = SCREEN_WIDTH - 56;
const CHART_HEIGHT = 220;

type FilterType = "ALL" | "INCOME" | "EXPENSE" | "TRANSFER";

const FILTERS: { key: FilterType; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "INCOME", label: "Income" },
  { key: "EXPENSE", label: "Expense" },
  { key: "TRANSFER", label: "Transfer" },
];

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function getMonthKey(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function getRecentMonths(
  count: number,
): { key: string; label: string; year: number; month: number }[] {
  const now = new Date();
  const result: { key: string; label: string; year: number; month: number }[] =
    [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = MONTH_SHORT[d.getMonth()];
    result.push({ key, label, year: d.getFullYear(), month: d.getMonth() });
  }
  return result;
}

function cubicBezierPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
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

function findNearestIndex(
  x: number,
  points: { x: number; y: number }[],
): number {
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
  currency,
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
  currency: string;
}) {
  const touchAreaRef = useRef<View>(null);

  const maxVal = useMemo(() => {
    const all: number[] = [];
    if (showIncome) all.push(...incomeData);
    if (showExpense) all.push(...expenseData);
    return Math.max(...all, 100);
  }, [incomeData, expenseData, showIncome, showExpense]);

  const pad = { top: 30, right: 18, bottom: 30, left: 18 };
  const plotW = CHART_WIDTH - pad.left - pad.right;
  const plotH = CHART_HEIGHT - pad.top - pad.bottom;

  const getPoint = useCallback(
    (val: number, idx: number) => ({
      x: pad.left + (idx / Math.max(labels.length - 1, 1)) * plotW,
      y: pad.top + plotH - (val / maxVal) * plotH,
    }),
    [labels.length, maxVal, plotW, plotH, pad.left, pad.top],
  );

  const incomePoints = useMemo(
    () => incomeData.map((v, i) => getPoint(v, i)),
    [incomeData, getPoint],
  );
  const expensePoints = useMemo(
    () => expenseData.map((v, i) => getPoint(v, i)),
    [expenseData, getPoint],
  );

  const incomePath = useMemo(
    () => cubicBezierPath(incomePoints),
    [incomePoints],
  );
  const expensePath = useMemo(
    () => cubicBezierPath(expensePoints),
    [expensePoints],
  );

  const selInc = incomeData[selectedIndex] || 0;
  const selExp = expenseData[selectedIndex] || 0;
  const selLabel = labels[selectedIndex] || "";
  const selPtInc = getPoint(selInc, selectedIndex);
  const selPtExp = getPoint(selExp, selectedIndex);

  const tooltipW = 130;
  const tooltipH = 80;
  const spaceAbove = selPtInc.y;
  const showBelow = spaceAbove < tooltipH + 10;
  const tooltipX = Math.max(
    4,
    Math.min(selPtInc.x - tooltipW / 2, CHART_WIDTH - tooltipW - 4),
  );
  const tooltipY = showBelow
    ? Math.max(selPtInc.y + 14, 4)
    : selPtInc.y - tooltipH - 14;

  const handleTouch = useCallback(
    (evt: GestureResponderEvent) => {
      touchAreaRef.current?.measure((fx, fy, w, h, px, py) => {
        const touchX = evt.nativeEvent.pageX - px;
        const nearest = findNearestIndex(touchX, incomePoints);
        onSelect(nearest);
      });
    },
    [incomePoints, onSelect],
  );

  return (
    <View style={styles.chartOuter}>
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
              <Stop
                offset="0%"
                stopColor={isDark ? "#B8F36B" : "#236B4F"}
                stopOpacity="0.3"
              />
              <Stop
                offset="100%"
                stopColor={isDark ? "#B8F36B" : "#236B4F"}
                stopOpacity="0"
              />
            </SvgGradient>
            <SvgGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop
                offset="0%"
                stopColor={isDark ? "#AC9AD0" : "#7A5AF8"}
                stopOpacity="0.3"
              />
              <Stop
                offset="100%"
                stopColor={isDark ? "#AC9AD0" : "#7A5AF8"}
                stopOpacity="0"
              />
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

          {showIncome && (
            <Path
              d={incomePath}
              stroke={isDark ? "#B8F36B" : "#236B4F"}
              strokeWidth={2}
              fill="none"
            />
          )}
          {showExpense && (
            <Path
              d={expensePath}
              stroke={isDark ? "#AC9AD0" : "#7A5AF8"}
              strokeWidth={2}
              fill="none"
            />
          )}

          {showIncome && (
            <>
              <Circle
                cx={selPtInc.x}
                cy={selPtInc.y}
                r={5}
                fill={isDark ? "#B8F36B" : "#236B4F"}
              />
              <Circle
                cx={selPtInc.x}
                cy={selPtInc.y}
                r={2.5}
                fill={colors.canvas}
              />
            </>
          )}
          {showExpense && (
            <>
              <Circle
                cx={selPtExp.x}
                cy={selPtExp.y}
                r={5}
                fill={isDark ? "#AC9AD0" : "#7A5AF8"}
              />
              <Circle
                cx={selPtExp.x}
                cy={selPtExp.y}
                r={2.5}
                fill={colors.canvas}
              />
            </>
          )}
        </Svg>

        {/* Tooltip inside chart */}
        <View
          pointerEvents="none"
          style={[
            styles.chartTooltip,
            {
              left: tooltipX,
              top: tooltipY,
              backgroundColor: isDark ? "#11151A" : "#1E2128",
              borderColor: isDark ? "#2B3238" : "#3A3F47",
            },
          ]}
        >
          <Text style={styles.tooltipMonth}>{selLabel}</Text>
          <View style={styles.tooltipRow}>
            <View
              style={[
                styles.tooltipDot,
                { backgroundColor: isDark ? "#B8F36B" : "#236B4F" },
              ]}
            />
            <Text style={styles.tooltipLabel}>Income</Text>
            <Text
              style={[
                styles.tooltipVal,
                { color: isDark ? "#B8F36B" : "#4ADE80" },
              ]}
            >
              {money(selInc, currency as Currency)}
            </Text>
          </View>
          <View style={styles.tooltipRow}>
            <View
              style={[
                styles.tooltipDot,
                { backgroundColor: isDark ? "#AC9AD0" : "#7A5AF8" },
              ]}
            />
            <Text style={styles.tooltipLabel}>Expenses</Text>
            <Text
              style={[
                styles.tooltipVal,
                { color: isDark ? "#AC9AD0" : "#A78BFA" },
              ]}
            >
              {money(selExp, currency as Currency)}
            </Text>
          </View>
        </View>

        {labels.map((label, i) => {
          const pt = getPoint(0, i);
          return (
            <Text
              key={`${label}-${i}`}
              style={{
                position: "absolute",
                left: pt.x - 18,
                bottom: 0,
                width: 36,
                textAlign: "center",
                fontSize: 10,
                color:
                  i === selectedIndex
                    ? isDark
                      ? "#B8F36B"
                      : "#236B4F"
                    : colors.fgSubtle,
                fontWeight: i === selectedIndex ? "600" : "400",
              }}
            >
              {label}
            </Text>
          );
        })}
      </View>
    </View>
  );
}

export default function InsightsScreen() {
  const { transactions, settings } = useFinance();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<FilterType>("ALL");
  const [selectedIdx, setSelectedIdx] = useState(0);

  const isDark = colors.canvas === "#090B0A";

  const rangeMonths = useMemo(() => getRecentMonths(6), []);
  const monthLabels = useMemo(
    () => rangeMonths.map((m) => m.label),
    [rangeMonths],
  );

  const filteredTxns = useMemo(() => {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    return transactions.filter((t) => {
      const d = new Date(t.date);
      return d >= startDate && d <= now;
    });
  }, [transactions]);

  const { monthlyIncome, monthlyExpense, totalIncome, totalExpense } =
    useMemo(() => {
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
        const type = (txn.type || "").toUpperCase();
        if (type === "INCOME" && incMap[key] !== undefined) {
          incMap[key] += amt;
          tInc += amt;
        } else if (type === "EXPENSE" && expMap[key] !== undefined) {
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

  useEffect(() => {
    setSelectedIdx(monthLabels.length - 1);
  }, [monthLabels.length]);

  const safeIdx = Math.min(selectedIdx, monthLabels.length - 1);

  const showIncome = filter === "ALL" || filter === "INCOME";
  const showExpense = filter === "ALL" || filter === "EXPENSE";
  const empty = filteredTxns.length === 0;

  const prevMonthIdx = Math.max(0, safeIdx - 1);
  const prevExp = monthlyExpense[prevMonthIdx] || 0;
  const curExp = monthlyExpense[safeIdx] || 0;
  const savingsPct = prevExp > 0 ? ((prevExp - curExp) / prevExp) * 100 : 0;

  const getSavingsMessage = () => {
    if (prevExp === 0 && curExp === 0)
      return "No spending comparison available yet";
    if (prevExp === 0)
      return "Start tracking your spending to see your savings";
    if (curExp < prevExp)
      return `🎉 You saved ${Math.abs(Math.round(savingsPct))}% more than last month`;
    if (curExp > prevExp)
      return `You spent ${Math.abs(Math.round(savingsPct))}% more than last month`;
    return "No spending comparison available yet";
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.canvas }]}>
      <View style={[styles.header, { paddingTop: insets.top + spacing[3] }]}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.headerBtn, { backgroundColor: colors.surface }]}
        >
          <Feather name="arrow-left" size={20} color={colors.fg} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.fg }]}>
          Analytics
        </Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Filter pills */}
        <View style={styles.filterRow}>
          {FILTERS.map((f) => (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[
                styles.filterPill,
                {
                  backgroundColor:
                    filter === f.key ? colors.primary : colors.surfaceRecessed,
                },
              ]}
            >
              <Text
                style={{
                  fontSize: fontSize.xs,
                  fontWeight: fontWeight.medium,
                  color: filter === f.key ? colors.onPrimary : colors.fgMuted,
                }}
              >
                {f.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Chart with inline tooltip */}
        {empty ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
            <Feather name="bar-chart-2" size={40} color={colors.fgSubtle} />
            <Text style={[styles.emptyTitle, { color: colors.fg }]}>
              No spending data yet
            </Text>
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
              currency={settings.currency}
            />
            <View style={styles.chartLegend}>
              {showIncome && (
                <View style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendDot,
                      { backgroundColor: isDark ? "#B8F36B" : "#236B4F" },
                    ]}
                  />
                  <Text style={[styles.legendText, { color: colors.fgMuted }]}>
                    Income
                  </Text>
                </View>
              )}
              {showExpense && (
                <View style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendDot,
                      { backgroundColor: isDark ? "#AC9AD0" : "#7A5AF8" },
                    ]}
                  />
                  <Text style={[styles.legendText, { color: colors.fgMuted }]}>
                    Expenses
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Income & Expense cards */}
        <View style={styles.summaryRow}>
          <View
            style={[styles.summaryCard, { backgroundColor: colors.surface }]}
          >
            <View
              style={[
                styles.summaryIcon,
                { backgroundColor: isDark ? "#1A3328" : "#E8F5E9" },
              ]}
            >
              <Feather
                name="arrow-up-right"
                size={16}
                color={isDark ? "#B8F36B" : "#236B4F"}
              />
            </View>
            <Text style={[styles.summaryLabel, { color: colors.fgMuted }]}>
              Income
            </Text>
            <Text
              style={[
                styles.summaryValue,
                { color: isDark ? "#B8F36B" : "#236B4F" },
              ]}
            >
              {money(totalIncome, settings.currency)}
            </Text>
          </View>
          <View
            style={[styles.summaryCard, { backgroundColor: colors.surface }]}
          >
            <View
              style={[
                styles.summaryIcon,
                { backgroundColor: isDark ? "#2A1F30" : "#F3E8FF" },
              ]}
            >
              <Feather
                name="arrow-down-left"
                size={16}
                color={isDark ? "#AC9AD0" : "#7A5AF8"}
              />
            </View>
            <Text style={[styles.summaryLabel, { color: colors.fgMuted }]}>
              Expense
            </Text>
            <Text
              style={[
                styles.summaryValue,
                { color: isDark ? "#AC9AD0" : "#7A5AF8" },
              ]}
            >
              {money(totalExpense, settings.currency)}
            </Text>
          </View>
        </View>

        {/* Savings message */}
        {filteredTxns.length > 0 && (
          <Pressable
            style={[
              styles.savingsCard,
              { backgroundColor: isDark ? "#1E1A2E" : "#F3E8FF" },
            ]}
          >
            <View style={styles.savingsContent}>
              <Text style={styles.savingsIcon}>🎉</Text>
              <Text
                style={[
                  styles.savingsText,
                  { color: isDark ? "#D4C4F0" : "#4A3580" },
                ]}
              >
                {getSavingsMessage()}
              </Text>
            </View>
            <Feather
              name="chevron-right"
              size={18}
              color={isDark ? "#AC9AD0" : "#7A5AF8"}
            />
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
  },
  headerBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
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
    flexDirection: "row",
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  filterPill: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
    minHeight: 34,
    alignItems: "center",
    justifyContent: "center",
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
    fontVariant: ["tabular-nums"],
  },

  // Chart
  chartOuter: {
    alignItems: "center",
  },
  chartCard: {
    borderRadius: radius.lg,
    padding: spacing[3],
    marginBottom: spacing[4],
    alignItems: "center",
  },
  chartLegend: {
    flexDirection: "row",
    gap: spacing[4],
    marginTop: spacing[3],
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
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

  // Chart tooltip (inside chart)
  chartTooltip: {
    position: "absolute",
    width: 130,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    zIndex: 20,
    elevation: 8,
  },
  tooltipMonth: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  tooltipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
  },
  tooltipDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  tooltipLabel: {
    fontSize: 10,
    color: "#8D969F",
    flex: 1,
  },
  tooltipVal: {
    fontSize: 10,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },

  // Empty
  emptyCard: {
    borderRadius: radius.lg,
    padding: spacing[8],
    marginBottom: spacing[4],
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    marginTop: spacing[3],
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    marginTop: spacing[2],
    textAlign: "center",
  },

  // Summary
  summaryRow: {
    flexDirection: "row",
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
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing[2],
  },
  summaryLabel: {
    fontSize: fontSize.xs,
    marginBottom: spacing[1],
  },
  summaryValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    fontVariant: ["tabular-nums"],
  },

  // Savings
  savingsCard: {
    borderRadius: radius.lg,
    padding: spacing[4],
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing[3],
  },
  savingsContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
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
