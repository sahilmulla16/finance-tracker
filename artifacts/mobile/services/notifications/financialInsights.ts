export interface TransactionLike {
  id: string;
  amount: number;
  type: string;
  category?: string;
  date?: string;
  createdAt?: string;
  [key: string]: any;
}

export type Transaction = TransactionLike;

export function isTxInMonth(
  txOrDate: { date?: string; createdAt?: string } | string | undefined | null,
  paramA: number,
  paramB: number,
): boolean {
  if (!txOrDate) return false;
  const dateStr =
    typeof txOrDate === "string"
      ? txOrDate
      : txOrDate.date || txOrDate.createdAt;
  if (!dateStr) return false;

  let targetMonth: number;
  let targetYear: number;
  if (paramA > 1000) {
    targetYear = paramA;
    targetMonth = paramB;
  } else {
    targetMonth = paramA;
    targetYear = paramB;
  }

  const match = dateStr.match(/^(\d{4})-(\d{1,2})/);
  if (match) {
    const y = parseInt(match[1], 10);
    const m = parseInt(match[2], 10) - 1;
    return y === targetYear && m === targetMonth;
  }

  const d = new Date(dateStr);
  return (
    !isNaN(d.getTime()) &&
    d.getFullYear() === targetYear &&
    d.getMonth() === targetMonth
  );
}

export interface BudgetStatus {
  id: string; // "overall" or category name
  name: string;
  limit: number;
  spent: number;
  percentage: number;
  remaining: number;
}

export interface ThresholdCrossingEvent {
  budgetId: string;
  budgetName: string;
  threshold: 80 | 100;
  limit: number;
  spent: number;
  remaining: number;
  percentage: number;
  periodKey: string; // e.g. "2026-10"
  eventKey: string; // e.g. "budget_Food & Drinks_2026-10_80"
}

export interface DailySpendingResult {
  date: string; // "YYYY-MM-DD"
  totalSpent: number;
  transactionCount: number;
  topCategory?: { name: string; amount: number };
  yesterdaySpent?: number;
  hasYesterdayData: boolean;
  differenceFromYesterday?: number;
}

export interface MonthlySpendingResult {
  year: number;
  month: number; // 0-indexed (0 = Jan)
  monthName: string;
  totalSpent: number;
  transactionCount: number;
  topCategory?: { name: string; amount: number };
  previousMonthSpent?: number;
  hasPreviousMonthData: boolean;
  differenceFromPreviousMonth?: number;
  percentageChange?: number;
}

export interface WeeklySpendingResult {
  startDate: string; // "YYYY-MM-DD"
  endDate: string; // "YYYY-MM-DD"
  weekNumber: number;
  year: number;
  totalSpent: number;
  transactionCount: number;
  topCategory?: { name: string; amount: number };
  previousWeekSpent?: number;
  hasPreviousWeekData: boolean;
  differenceFromPreviousWeek?: number;
  percentageChange?: number;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

/**
 * Filter transactions for valid eligible expenses in the target period.
 * Strictly excludes INCOME, TRANSFER, and negative/zero amounts.
 */
export function getEligibleExpenses(transactions: Transaction[]): Transaction[] {
  if (!Array.isArray(transactions)) return [];
  return transactions.filter(
    (t) => t && t.type === "EXPENSE" && typeof t.amount === "number" && t.amount > 0
  );
}

function toLocalYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Extract YYYY-MM-DD date string from transaction safely in local timezone.
 */
export function getTxDateString(tx: Transaction): string {
  if (tx.date && /^\d{4}-\d{2}-\d{2}$/.test(tx.date)) {
    return tx.date;
  }
  if (tx.createdAt) {
    try {
      const d = new Date(tx.createdAt);
      if (!isNaN(d.getTime())) {
        return toLocalYMD(d);
      }
    } catch {
      // Fallback
    }
  }
  return toLocalYMD(new Date());
}

/**
 * Calculate active budget statuses for overall monthly budget and per-category budgets.
 */
export function calculateBudgetStatuses(
  transactions: Transaction[],
  categoryBudgets: Record<string, number> = {},
  totalMonthlyBudget: number | null = null,
  year: number = new Date().getFullYear(),
  month: number = new Date().getMonth() // 0-indexed
): BudgetStatus[] {
  const eligible = getEligibleExpenses(transactions).filter((t) =>
    isTxInMonth(t.date || t.createdAt, year, month)
  );

  const statuses: BudgetStatus[] = [];

  // 1. Overall Monthly Budget
  if (typeof totalMonthlyBudget === "number" && totalMonthlyBudget > 0 && isFinite(totalMonthlyBudget)) {
    const totalSpent = eligible.reduce((sum, t) => sum + t.amount, 0);
    const pct = (totalSpent / totalMonthlyBudget) * 100;
    statuses.push({
      id: "overall",
      name: "Monthly Budget",
      limit: totalMonthlyBudget,
      spent: totalSpent,
      percentage: pct,
      remaining: Math.max(0, totalMonthlyBudget - totalSpent),
    });
  }

  // 2. Category Budgets
  if (categoryBudgets && typeof categoryBudgets === "object") {
    // Group spending by category
    const categorySpending: Record<string, number> = {};
    for (const tx of eligible) {
      const cat = tx.category || "Others";
      categorySpending[cat] = (categorySpending[cat] || 0) + tx.amount;
    }

    for (const [catName, limit] of Object.entries(categoryBudgets)) {
      if (typeof limit === "number" && limit > 0 && isFinite(limit)) {
        const spent = categorySpending[catName] || 0;
        const pct = (spent / limit) * 100;
        statuses.push({
          id: catName,
          name: catName,
          limit,
          spent,
          percentage: pct,
          remaining: Math.max(0, limit - spent),
        });
      }
    }
  }

  return statuses;
}

/**
 * Detect genuine threshold crossings for a budget status.
 *
 * Crossing rules:
 * - 80% crossed if: previousSpending < 80% limit AND currentSpending >= 80% limit.
 * - 100% crossed if: previousSpending < 100% limit AND currentSpending >= 100% limit.
 * - Single transaction crossing both (< 80% to >= 100%): triggers both or limit reached.
 * - If currentSpending drops below threshold, caller's recorded spending is updated,
 *   which re-arms the threshold for future crossings.
 */
export function evaluateThresholdCrossings(
  status: BudgetStatus,
  previousSpending: number = 0,
  alreadySentKeys: Set<string> = new Set(),
  periodKey: string = `${new Date().getFullYear()}-${new Date().getMonth() + 1}`
): ThresholdCrossingEvent[] {
  if (status.limit <= 0 || !isFinite(status.limit)) return [];

  const events: ThresholdCrossingEvent[] = [];
  const limit = status.limit;
  const currentSpending = status.spent;

  const threshold80Amount = limit * 0.8;
  const threshold100Amount = limit * 1.0;

  const key80 = `budget_${status.id}_${periodKey}_80`;
  const key100 = `budget_${status.id}_${periodKey}_100`;

  // 80% Crossing check
  const crossed80 = previousSpending < threshold80Amount && currentSpending >= threshold80Amount;
  if (crossed80 && !alreadySentKeys.has(key80)) {
    events.push({
      budgetId: status.id,
      budgetName: status.name,
      threshold: 80,
      limit,
      spent: currentSpending,
      remaining: Math.max(0, limit - currentSpending),
      percentage: Math.round(status.percentage),
      periodKey,
      eventKey: key80,
    });
  }

  // 100% Crossing check
  const crossed100 = previousSpending < threshold100Amount && currentSpending >= threshold100Amount;
  if (crossed100 && !alreadySentKeys.has(key100)) {
    events.push({
      budgetId: status.id,
      budgetName: status.name,
      threshold: 100,
      limit,
      spent: currentSpending,
      remaining: 0,
      percentage: Math.round(status.percentage),
      periodKey,
      eventKey: key100,
    });
  }

  return events;
}

/**
 * Calculate daily spending metrics for a specific day.
 */
export function calculateDailySpending(
  transactions: Transaction[],
  targetDate: string = toLocalYMD(new Date())
): DailySpendingResult {
  const eligible = getEligibleExpenses(transactions);

  const dayExpenses = eligible.filter((t) => getTxDateString(t) === targetDate);
  const totalSpent = dayExpenses.reduce((sum, t) => sum + t.amount, 0);

  // Top category
  const catTotals: Record<string, number> = {};
  for (const t of dayExpenses) {
    const cat = t.category || "Others";
    catTotals[cat] = (catTotals[cat] || 0) + t.amount;
  }
  let topCategory: { name: string; amount: number } | undefined;
  for (const [name, amount] of Object.entries(catTotals)) {
    if (!topCategory || amount > topCategory.amount) {
      topCategory = { name, amount };
    }
  }

  // Compute yesterday
  const targetObj = new Date(targetDate + "T12:00:00Z");
  targetObj.setDate(targetObj.getDate() - 1);
  const yesterdayStr = targetObj.toISOString().split("T")[0];

  const yesterdayExpenses = eligible.filter((t) => getTxDateString(t) === yesterdayStr);
  const hasYesterdayData = yesterdayExpenses.length > 0;
  const yesterdaySpent = hasYesterdayData
    ? yesterdayExpenses.reduce((sum, t) => sum + t.amount, 0)
    : undefined;

  const differenceFromYesterday = hasYesterdayData && yesterdaySpent !== undefined
    ? totalSpent - yesterdaySpent
    : undefined;

  return {
    date: targetDate,
    totalSpent,
    transactionCount: dayExpenses.length,
    topCategory,
    yesterdaySpent,
    hasYesterdayData,
    differenceFromYesterday,
  };
}

/**
 * Check if daily spending crossed the user's daily spending limit.
 */
export function evaluateDailyLimitCrossing(
  transactions: Transaction[],
  limit: number,
  targetDate: string = new Date().toISOString().split("T")[0],
  previousDaySpending: number = 0,
  alreadySentKeys: Set<string> = new Set()
): {
  isCrossed: boolean;
  spent: number;
  overAmount: number;
  eventKey: string;
} | null {
  if (typeof limit !== "number" || limit <= 0 || !isFinite(limit)) return null;

  const daily = calculateDailySpending(transactions, targetDate);
  const spent = daily.totalSpent;
  const eventKey = `daily_limit_${targetDate}_${Math.round(limit)}`;

  const crossed = previousDaySpending < limit && spent >= limit;

  if (crossed && !alreadySentKeys.has(eventKey)) {
    return {
      isCrossed: true,
      spent,
      overAmount: Math.max(0, spent - limit),
      eventKey,
    };
  }

  return null;
}

/**
 * Calculate monthly spending metrics for a given month and year.
 */
export function calculateMonthlySpending(
  transactions: Transaction[],
  year: number = new Date().getFullYear(),
  month: number = new Date().getMonth() // 0-indexed
): MonthlySpendingResult {
  const eligible = getEligibleExpenses(transactions);

  const monthExpenses = eligible.filter((t) => isTxInMonth(t.date || t.createdAt, year, month));
  const totalSpent = monthExpenses.reduce((sum, t) => sum + t.amount, 0);

  // Top category
  const catTotals: Record<string, number> = {};
  for (const t of monthExpenses) {
    const cat = t.category || "Others";
    catTotals[cat] = (catTotals[cat] || 0) + t.amount;
  }
  let topCategory: { name: string; amount: number } | undefined;
  for (const [name, amount] of Object.entries(catTotals)) {
    if (!topCategory || amount > topCategory.amount) {
      topCategory = { name, amount };
    }
  }

  // Previous month calculation
  const prevMonthDate = new Date(year, month - 1, 1);
  const prevYear = prevMonthDate.getFullYear();
  const prevMonth = prevMonthDate.getMonth();

  const prevMonthExpenses = eligible.filter((t) => isTxInMonth(t.date || t.createdAt, prevYear, prevMonth));
  const hasPreviousMonthData = prevMonthExpenses.length > 0;
  const previousMonthSpent = hasPreviousMonthData
    ? prevMonthExpenses.reduce((sum, t) => sum + t.amount, 0)
    : undefined;

  let differenceFromPreviousMonth: number | undefined;
  let percentageChange: number | undefined;

  if (hasPreviousMonthData && previousMonthSpent !== undefined && previousMonthSpent > 0) {
    differenceFromPreviousMonth = totalSpent - previousMonthSpent;
    percentageChange = Math.round(((totalSpent - previousMonthSpent) / previousMonthSpent) * 100);
  }

  return {
    year,
    month,
    monthName: MONTH_NAMES[month] || "Month",
    totalSpent,
    transactionCount: monthExpenses.length,
    topCategory,
    previousMonthSpent,
    hasPreviousMonthData,
    differenceFromPreviousMonth,
    percentageChange,
  };
}

/**
 * Helper to get ISO week number and start/end dates.
 * Week starts on Monday and ends on Sunday.
 */
export function getWeekBounds(targetDate: Date = new Date()): {
  startDate: string;
  endDate: string;
  weekNumber: number;
  year: number;
} {
  const d = new Date(Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()));
  const day = d.getUTCDay();
  // In JS: 0 = Sun, 1 = Mon, ..., 6 = Sat
  // Distance back to Monday:
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() + diffToMonday);

  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);

  // ISO Week number
  const thursday = new Date(monday);
  thursday.setUTCDate(monday.getUTCDate() + 3);
  const yearStart = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil((((thursday.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

  return {
    startDate: monday.toISOString().split("T")[0],
    endDate: sunday.toISOString().split("T")[0],
    weekNumber,
    year: thursday.getUTCFullYear(),
  };
}

/**
 * Calculate weekly spending metrics.
 */
export function calculateWeeklySpending(
  transactions: Transaction[],
  targetDate: Date = new Date()
): WeeklySpendingResult {
  const eligible = getEligibleExpenses(transactions);
  const bounds = getWeekBounds(targetDate);

  const weekExpenses = eligible.filter((t) => {
    const dStr = getTxDateString(t);
    return dStr >= bounds.startDate && dStr <= bounds.endDate;
  });

  const totalSpent = weekExpenses.reduce((sum, t) => sum + t.amount, 0);

  // Top category
  const catTotals: Record<string, number> = {};
  for (const t of weekExpenses) {
    const cat = t.category || "Others";
    catTotals[cat] = (catTotals[cat] || 0) + t.amount;
  }
  let topCategory: { name: string; amount: number } | undefined;
  for (const [name, amount] of Object.entries(catTotals)) {
    if (!topCategory || amount > topCategory.amount) {
      topCategory = { name, amount };
    }
  }

  // Previous week
  const prevWeekDate = new Date(targetDate);
  prevWeekDate.setDate(prevWeekDate.getDate() - 7);
  const prevBounds = getWeekBounds(prevWeekDate);

  const prevWeekExpenses = eligible.filter((t) => {
    const dStr = getTxDateString(t);
    return dStr >= prevBounds.startDate && dStr <= prevBounds.endDate;
  });

  const hasPreviousWeekData = prevWeekExpenses.length > 0;
  const previousWeekSpent = hasPreviousWeekData
    ? prevWeekExpenses.reduce((sum, t) => sum + t.amount, 0)
    : undefined;

  let differenceFromPreviousWeek: number | undefined;
  let percentageChange: number | undefined;

  if (hasPreviousWeekData && previousWeekSpent !== undefined && previousWeekSpent > 0) {
    differenceFromPreviousWeek = totalSpent - previousWeekSpent;
    percentageChange = Math.round(((totalSpent - previousWeekSpent) / previousWeekSpent) * 100);
  }

  return {
    startDate: bounds.startDate,
    endDate: bounds.endDate,
    weekNumber: bounds.weekNumber,
    year: bounds.year,
    totalSpent,
    transactionCount: weekExpenses.length,
    topCategory,
    previousWeekSpent,
    hasPreviousWeekData,
    differenceFromPreviousWeek,
    percentageChange,
  };
}

export interface QuietHoursConfig {
  quietHoursEnabled?: boolean;
  quietHoursStart?: string; // "HH:mm"
  quietHoursEnd?: string;   // "HH:mm"
}

/**
 * Check if a given time falls within the configured quiet hours window.
 * Supports both daytime windows (e.g. 13:00 - 15:00) and overnight windows (e.g. 22:00 - 07:00).
 */
export function isCurrentlyInQuietHours(
  prefs: QuietHoursConfig,
  currentDate: Date = new Date()
): boolean {
  if (!prefs.quietHoursEnabled) return false;
  if (!prefs.quietHoursStart || !prefs.quietHoursEnd) return false;

  const currentMinutes = currentDate.getHours() * 60 + currentDate.getMinutes();

  const [startH, startM] = prefs.quietHoursStart.split(':').map(Number);
  const [endH, endM] = prefs.quietHoursEnd.split(':').map(Number);

  const startMinutes = (startH || 0) * 60 + (startM || 0);
  const endMinutes = (endH || 0) * 60 + (endM || 0);

  if (startMinutes <= endMinutes) {
    // Normal window e.g. 13:00 to 15:00
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  } else {
    // Overnight window e.g. 22:00 to 07:00
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
}

