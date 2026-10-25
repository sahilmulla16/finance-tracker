import type { Transaction, Account, Currency } from "@/context/FinanceContext";
import { normalizeMerchant } from "./merchantNormalization";

export type SpendingPeriod = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

export interface HourlySpendSlot {
  /** 0-23 hour index */
  hour: number;
  /** Short label for axis, e.g. "12 AM", "1 AM", "12 PM" */
  label: string;
  /** Full range label, e.g. "02:00 PM – 03:00 PM" */
  rangeLabel: string;
  /** Total expense amount in this hour */
  amount: number;
  /** Number of expense transactions in this hour */
  count: number;
  /** Percentage of the day's total spend (0-100) */
  percentage: number;
}

export interface SpendingChartBucket {
  index: number;
  id: string;
  label: string;
  fullLabel: string;
  amount: number;
  count: number;
  percentage: number;
  dateKey?: string;
}

export interface DailyCategorySpend {
  id: string;
  name: string;
  amount: number;
  count: number;
  percentage: number;
  color?: string;
  icon?: string;
}

export interface DailyPaymentMethodSpend {
  method: string;
  amount: number;
  count: number;
  percentage: number;
  color: string;
}

export interface DailyTopMerchant {
  name: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface DailySpendSummary {
  selectedDate: string;
  displayDate: string;
  isToday: boolean;
  isYesterday: boolean;
  totalSpent: number;
  transactionCount: number;
  averageSpend: number;

  // Previous day comparison
  prevDate: string;
  prevTotalSpent: number;
  prevTransactionCount: number;
  diffAmount: number;
  percentageChange: number | null; // null if previous day was 0
  changeDirection: "increase" | "decrease" | "neutral";
  changeLabel: string;

  // Hourly distribution (24 slots)
  hourlySlots: HourlySpendSlot[];
  maxHourlySlot: HourlySpendSlot | null;

  // Breakdown
  categories: DailyCategorySpend[];
  paymentMethods: DailyPaymentMethodSpend[];
  topMerchant: DailyTopMerchant | null;

  // Raw eligible transactions for that day
  dayTransactions: Transaction[];
}

export interface SpendingAnalyticsSummary {
  period: SpendingPeriod;
  selectedDate: string;
  periodRangeLabel: string;
  heroTitle: string;
  isCurrentPeriod: boolean;
  canNavigateForward: boolean;

  totalSpent: number;
  transactionCount: number;
  averageSpend: number;

  prevPeriodLabel: string;
  prevTotalSpent: number;
  prevTransactionCount: number;
  diffAmount: number;
  percentageChange: number | null;
  changeDirection: "increase" | "decrease" | "neutral";
  changeLabel: string;

  chartBuckets: SpendingChartBucket[];
  maxBucket: SpendingChartBucket | null;
  xAxisLabels: { index: number; label: string }[];

  categories: DailyCategorySpend[];
  paymentMethods: DailyPaymentMethodSpend[];
  topMerchant: DailyTopMerchant | null;

  periodTransactions: Transaction[];
}

const METHOD_COLORS: Record<string, string> = {
  UPI: "#60A5FA",          // Periwinkle / Sky Blue
  Cash: "#34D399",         // Mint Green
  Card: "#A78BFA",         // Soft Violet
  "Bank Transfer": "#F59E0B", // Amber Gold
  "Net Banking": "#F59E0B",   // Amber Gold
  Other: "#94A3B8",        // Slate Gray
};

const DEFAULT_PALETTE = [
  "#60A5FA",
  "#34D399",
  "#A78BFA",
  "#F59E0B",
  "#F472B6",
  "#38BDF8",
  "#FB923C",
  "#818CF8",
  "#94A3B8",
];

export const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const WEEKDAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/**
 * Format a Date object as local YYYY-MM-DD
 */
export function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Parse YYYY-MM-DD to local Date object
 */
export function parseLocalDate(dateStr: string): Date {
  const parts = dateStr.split("-").map(Number);
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  return new Date();
}

/**
 * Returns previous day in YYYY-MM-DD
 */
export function getPreviousDateString(dateStr: string): string {
  const d = parseLocalDate(dateStr);
  d.setDate(d.getDate() - 1);
  return formatLocalDate(d);
}

/**
 * Returns next day in YYYY-MM-DD
 */
export function getNextDateString(dateStr: string): string {
  const d = parseLocalDate(dateStr);
  d.setDate(d.getDate() + 1);
  return formatLocalDate(d);
}

/**
 * Friendly display date label (e.g. "Today, Oct 22", "Yesterday, Oct 21", "Thu, 15 Oct 2026")
 */
export function formatDailySpendHeaderDate(dateStr: string, todayStr: string = formatLocalDate(new Date())): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-").map(Number);
  if (parts.length !== 3) return dateStr;

  const [y, m, d] = parts;
  const dateObj = new Date(y, m - 1, d);
  if (isNaN(dateObj.getTime())) return dateStr;

  const monthShort = dateObj.toLocaleDateString("en-US", { month: "short" });
  const dayNum = dateObj.getDate();

  if (dateStr === todayStr) {
    return `Today, ${monthShort} ${dayNum}`;
  }

  const yesterdayStr = getPreviousDateString(todayStr);
  if (dateStr === yesterdayStr) {
    return `Yesterday, ${monthShort} ${dayNum}`;
  }

  const weekdayShort = dateObj.toLocaleDateString("en-US", { weekday: "short" });
  const thisYear = new Date().getFullYear();
  if (y === thisYear) {
    return `${weekdayShort}, ${dayNum} ${monthShort}`;
  }
  return `${weekdayShort}, ${dayNum} ${monthShort} ${y}`;
}

/**
 * Parse hour from transaction time string or createdAt ISO string.
 * Returns 0 to 23.
 */
export function extractHourFromTransaction(tx: Transaction): number {
  if (tx.time && typeof tx.time === "string") {
    const trimmed = tx.time.trim();
    // 12-hour format: "02:30 PM", "10:15 am"
    const match12 = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (match12) {
      let h = parseInt(match12[1], 10);
      const period = match12[3].toUpperCase();
      if (period === "PM" && h < 12) h += 12;
      if (period === "AM" && h === 12) h = 0;
      if (h >= 0 && h <= 23) return h;
    }

    // 24-hour format: "14:30" or "09:15:00"
    const parts = trimmed.split(":").map(Number);
    if (parts.length >= 2 && !isNaN(parts[0]) && parts[0] >= 0 && parts[0] <= 23) {
      return parts[0];
    }
  }

  // Fallback to createdAt or date
  if (tx.createdAt) {
    const d = new Date(tx.createdAt);
    if (!isNaN(d.getTime())) {
      return d.getHours();
    }
  }

  return 12; // Default to midday if untimed
}

/**
 * Format hour number (0-23) to short string, e.g. "12 AM", "6 AM", "12 PM", "9 PM"
 */
export function formatHourShort(hour: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12} ${period}`;
}

/**
 * Format full hour range, e.g. "02:00 PM – 03:00 PM"
 */
export function formatHourRange(hour: number): string {
  const start = formatHourShort(hour);
  const nextHour = (hour + 1) % 24;
  const end = formatHourShort(nextHour);
  return `${start} – ${end}`;
}

/**
 * Resolves the payment method label from an account and transaction
 */
export function resolvePaymentMethod(tx: Transaction, accounts: Account[]): string {
  if (tx.accountId) {
    const acct = accounts.find((a) => a.id === tx.accountId);
    if (acct) {
      if (acct.type === "UPI") return "UPI";
      if (acct.type === "CASH") return "Cash";
      if (acct.type === "BANK") {
        const nameLower = acct.name.toLowerCase();
        if (nameLower.includes("card") || nameLower.includes("credit") || nameLower.includes("debit")) {
          return "Card";
        }
        return "Bank Transfer";
      }
      if (acct.type === "SAVINGS") return "Bank Transfer";
      if (acct.name) {
        const nameLower = acct.name.toLowerCase();
        if (nameLower.includes("upi")) return "UPI";
        if (nameLower.includes("cash")) return "Cash";
        if (nameLower.includes("card")) return "Card";
        return acct.name;
      }
    }
  }

  // Check notes or description
  const text = `${tx.description || ""} ${tx.notes || ""}`.toLowerCase();
  if (text.includes("upi") || text.includes("@ok") || text.includes("@paytm")) return "UPI";
  if (text.includes("cash")) return "Cash";
  if (text.includes("card") || text.includes("pos")) return "Card";
  if (text.includes("net banking") || text.includes("neft") || text.includes("imps")) return "Net Banking";

  return "Other";
}

/**
 * Checks if a transaction is a valid expense on targetDate
 */
export function isEligibleExpense(tx: Transaction, targetDate: string): boolean {
  if (tx.type !== "EXPENSE") return false;
  if (!tx.amount || tx.amount <= 0) return false;

  const txDate = tx.date ? tx.date.split("T")[0] : "";
  if (txDate === targetDate) return true;

  if (!txDate && tx.createdAt) {
    const createdDate = tx.createdAt.split("T")[0];
    if (createdDate === targetDate) return true;
  }

  return false;
}

/**
 * Checks if a transaction is a valid expense within [startDate, endDate] inclusive
 */
export function isEligibleExpenseInRange(tx: Transaction, startDate: string, endDate: string): boolean {
  if (tx.type !== "EXPENSE") return false;
  if (!tx.amount || tx.amount <= 0) return false;

  const txDate = tx.date ? tx.date.split("T")[0] : tx.createdAt ? tx.createdAt.split("T")[0] : "";
  if (!txDate) return false;

  return txDate >= startDate && txDate <= endDate;
}

// ─── Period Navigation & Date Helpers ──────────────────────────────

/**
 * Get Monday and Sunday for the week containing dateStr
 */
export function getWeekBoundaries(dateStr: string): { start: string; end: string; mondayDate: Date; sundayDate: Date } {
  const d = parseLocalDate(dateStr);
  const day = d.getDay(); // 0 is Sunday, 1 is Monday
  const diffToMonday = (day + 6) % 7; // Monday = 0, Sun = 6
  const monday = new Date(d);
  monday.setDate(d.getDate() - diffToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return {
    start: formatLocalDate(monday),
    end: formatLocalDate(sunday),
    mondayDate: monday,
    sundayDate: sunday,
  };
}

/**
 * Get Month boundaries for the month containing dateStr
 */
export function getMonthBoundaries(dateStr: string): { start: string; end: string; year: number; month: number; daysInMonth: number } {
  const d = parseLocalDate(dateStr);
  const year = d.getFullYear();
  const month = d.getMonth() + 1; // 1-indexed
  const daysInMonth = new Date(year, month, 0).getDate();

  return {
    start: `${year}-${String(month).padStart(2, "0")}-01`,
    end: `${year}-${String(month).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`,
    year,
    month,
    daysInMonth,
  };
}

/**
 * Get Year boundaries for the year containing dateStr
 */
export function getYearBoundaries(dateStr: string): { start: string; end: string; year: number } {
  const d = parseLocalDate(dateStr);
  const year = d.getFullYear();
  return {
    start: `${year}-01-01`,
    end: `${year}-12-31`,
    year,
  };
}

/**
 * Step backwards by 1 period
 */
export function getPreviousPeriodAnchor(dateStr: string, period: SpendingPeriod): string {
  const d = parseLocalDate(dateStr);
  switch (period) {
    case "DAILY":
      d.setDate(d.getDate() - 1);
      return formatLocalDate(d);
    case "WEEKLY":
      d.setDate(d.getDate() - 7);
      return formatLocalDate(d);
    case "MONTHLY": {
      // 1st of previous month
      const prevMonth = new Date(d.getFullYear(), d.getMonth() - 1, 1);
      return formatLocalDate(prevMonth);
    }
    case "YEARLY": {
      const prevYear = new Date(d.getFullYear() - 1, 0, 1);
      return formatLocalDate(prevYear);
    }
  }
}

/**
 * Step forward by 1 period, clamped to today
 */
export function getNextPeriodAnchor(dateStr: string, period: SpendingPeriod, todayStr: string = formatLocalDate(new Date())): string {
  const d = parseLocalDate(dateStr);
  const today = parseLocalDate(todayStr);

  switch (period) {
    case "DAILY": {
      d.setDate(d.getDate() + 1);
      const nextStr = formatLocalDate(d);
      return nextStr > todayStr ? todayStr : nextStr;
    }
    case "WEEKLY": {
      d.setDate(d.getDate() + 7);
      const nextStr = formatLocalDate(d);
      const currentWeek = getWeekBoundaries(todayStr);
      return nextStr > currentWeek.end ? currentWeek.start : nextStr;
    }
    case "MONTHLY": {
      const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const nextStr = formatLocalDate(nextMonth);
      const thisMonthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
      return nextStr > thisMonthStart ? thisMonthStart : nextStr;
    }
    case "YEARLY": {
      const nextYear = new Date(d.getFullYear() + 1, 0, 1);
      const nextStr = formatLocalDate(nextYear);
      const thisYearStart = `${today.getFullYear()}-01-01`;
      return nextStr > thisYearStart ? thisYearStart : nextStr;
    }
  }
}

/**
 * Check if the given anchor is in the current ongoing period
 */
export function isCurrentPeriodActive(dateStr: string, period: SpendingPeriod, todayStr: string = formatLocalDate(new Date())): boolean {
  switch (period) {
    case "DAILY":
      return dateStr === todayStr;
    case "WEEKLY": {
      const targetWeek = getWeekBoundaries(dateStr);
      const currentWeek = getWeekBoundaries(todayStr);
      return targetWeek.start === currentWeek.start;
    }
    case "MONTHLY": {
      const targetMonth = getMonthBoundaries(dateStr);
      const currentMonth = getMonthBoundaries(todayStr);
      return targetMonth.year === currentMonth.year && targetMonth.month === currentMonth.month;
    }
    case "YEARLY": {
      const targetYear = getYearBoundaries(dateStr);
      const currentYear = getYearBoundaries(todayStr);
      return targetYear.year === currentYear.year;
    }
  }
}

// ─── Multi-Period Analytics Core ───────────────────────────────────

export function calculateSpendingAnalytics(params: {
  transactions: Transaction[];
  accounts: Account[];
  selectedDate: string;
  period: SpendingPeriod;
  todayDate?: string;
}): SpendingAnalyticsSummary {
  const { transactions, accounts, selectedDate, period } = params;
  const todayDate = params.todayDate || formatLocalDate(new Date());

  const isCurrent = isCurrentPeriodActive(selectedDate, period, todayDate);
  const canNavigateForward = !isCurrent;

  let currentStart = "";
  let currentEnd = "";
  let prevStart = "";
  let prevEnd = "";
  let periodRangeLabel = "";
  let heroTitle = "";
  let prevPeriodLabel = "";

  let chartBuckets: SpendingChartBucket[] = [];
  let xAxisLabels: { index: number; label: string }[] = [];

  if (period === "DAILY") {
    currentStart = selectedDate;
    currentEnd = selectedDate;
    prevStart = getPreviousDateString(selectedDate);
    prevEnd = prevStart;

    periodRangeLabel = formatDailySpendHeaderDate(selectedDate, todayDate);
    heroTitle = selectedDate === todayDate ? "TODAY'S SPENDING" : "DAILY SPENDING";
    prevPeriodLabel = "yesterday";

    // 24 Hourly Buckets
    chartBuckets = Array.from({ length: 24 }, (_, hour) => ({
      index: hour,
      id: `hour-${hour}`,
      label: formatHourShort(hour),
      fullLabel: formatHourRange(hour),
      amount: 0,
      count: 0,
      percentage: 0,
    }));

    xAxisLabels = [
      { index: 0, label: "12 AM" },
      { index: 6, label: "6 AM" },
      { index: 12, label: "12 PM" },
      { index: 18, label: "6 PM" },
      { index: 23, label: "11 PM" },
    ];
  } else if (period === "WEEKLY") {
    const curWeek = getWeekBoundaries(selectedDate);
    currentStart = curWeek.start;
    currentEnd = curWeek.end;

    const prevWeekMonday = new Date(curWeek.mondayDate);
    prevWeekMonday.setDate(curWeek.mondayDate.getDate() - 7);
    const prevWeek = getWeekBoundaries(formatLocalDate(prevWeekMonday));
    prevStart = prevWeek.start;
    prevEnd = prevWeek.end;

    const mShort = curWeek.mondayDate.toLocaleDateString("en-US", { month: "short" });
    const sShort = curWeek.sundayDate.toLocaleDateString("en-US", { month: "short" });
    const mDay = curWeek.mondayDate.getDate();
    const sDay = curWeek.sundayDate.getDate();

    periodRangeLabel = isCurrent
      ? `This Week (${mDay} – ${sDay} ${sShort})`
      : `${mDay} ${mShort} – ${sDay} ${sShort}`;
    heroTitle = isCurrent ? "THIS WEEK'S SPENDING" : "WEEKLY SPENDING";
    prevPeriodLabel = "last week";

    // 7 Day Buckets (Mon to Sun)
    chartBuckets = Array.from({ length: 7 }, (_, i) => {
      const dayDate = new Date(curWeek.mondayDate);
      dayDate.setDate(curWeek.mondayDate.getDate() + i);
      const dateKey = formatLocalDate(dayDate);
      const dayName = WEEKDAY_SHORT[i];
      const monthStr = dayDate.toLocaleDateString("en-US", { month: "short" });
      return {
        index: i,
        id: `week-${dateKey}`,
        label: dayName,
        fullLabel: `${dayName}, ${dayDate.getDate()} ${monthStr}`,
        amount: 0,
        count: 0,
        percentage: 0,
        dateKey,
      };
    });

    xAxisLabels = chartBuckets.map((b) => ({ index: b.index, label: b.label }));
  } else if (period === "MONTHLY") {
    const curMonth = getMonthBoundaries(selectedDate);
    currentStart = curMonth.start;
    currentEnd = curMonth.end;

    const prevMonthDate = new Date(curMonth.year, curMonth.month - 2, 1);
    const prevMonth = getMonthBoundaries(formatLocalDate(prevMonthDate));
    prevStart = prevMonth.start;
    prevEnd = prevMonth.end;

    const monthName = MONTH_SHORT[curMonth.month - 1];
    periodRangeLabel = isCurrent
      ? `This Month (${monthName} ${curMonth.year})`
      : `${monthName} ${curMonth.year}`;
    heroTitle = isCurrent ? "THIS MONTH'S SPENDING" : "MONTHLY SPENDING";
    prevPeriodLabel = "last month";

    // One bucket per day of the month
    chartBuckets = Array.from({ length: curMonth.daysInMonth }, (_, i) => {
      const dayNum = i + 1;
      const dateKey = `${curMonth.year}-${String(curMonth.month).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
      return {
        index: i,
        id: `month-day-${dayNum}`,
        label: String(dayNum),
        fullLabel: `${dayNum} ${monthName} ${curMonth.year}`,
        amount: 0,
        count: 0,
        percentage: 0,
        dateKey,
      };
    });

    // Sub-sample x-axis labels so they don't crowd
    const sampleDays = [1, 5, 10, 15, 20, 25, curMonth.daysInMonth];
    xAxisLabels = sampleDays.map((d) => ({
      index: d - 1,
      label: String(d),
    }));
  } else {
    // YEARLY
    const curYear = getYearBoundaries(selectedDate);
    currentStart = curYear.start;
    currentEnd = curYear.end;

    const prevYear = getYearBoundaries(`${curYear.year - 1}-01-01`);
    prevStart = prevYear.start;
    prevEnd = prevYear.end;

    periodRangeLabel = isCurrent ? `This Year (${curYear.year})` : `Year ${curYear.year}`;
    heroTitle = isCurrent ? "THIS YEAR'S SPENDING" : "YEARLY SPENDING";
    prevPeriodLabel = "last year";

    // 12 Monthly Buckets
    chartBuckets = Array.from({ length: 12 }, (_, i) => {
      const mNum = i + 1;
      const mName = MONTH_SHORT[i];
      const monthPrefix = `${curYear.year}-${String(mNum).padStart(2, "0")}`;
      return {
        index: i,
        id: `year-month-${mNum}`,
        label: mName,
        fullLabel: `${mName} ${curYear.year}`,
        amount: 0,
        count: 0,
        percentage: 0,
        dateKey: monthPrefix,
      };
    });

    xAxisLabels = [
      { index: 0, label: "Jan" },
      { index: 2, label: "Mar" },
      { index: 4, label: "May" },
      { index: 6, label: "Jul" },
      { index: 8, label: "Sep" },
      { index: 11, label: "Dec" },
    ];
  }

  // 1. Filter current period transactions
  const periodTransactions = transactions
    .filter((tx) => isEligibleExpenseInRange(tx, currentStart, currentEnd))
    .sort((a, b) => {
      const dateA = `${a.date || ""} ${a.time || ""}`;
      const dateB = `${b.date || ""} ${b.time || ""}`;
      return dateB.localeCompare(dateA);
    });

  const totalSpent = periodTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  const transactionCount = periodTransactions.length;
  const averageSpend = transactionCount > 0 ? totalSpent / transactionCount : 0;

  // 2. Previous period transactions
  const prevPeriodTransactions = transactions.filter((tx) =>
    isEligibleExpenseInRange(tx, prevStart, prevEnd),
  );
  const prevTotalSpent = prevPeriodTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  const prevTransactionCount = prevPeriodTransactions.length;

  // 3. Comparison metrics
  const diffAmount = totalSpent - prevTotalSpent;
  let percentageChange: number | null = null;
  let changeDirection: "increase" | "decrease" | "neutral" = "neutral";
  let changeLabel = "";

  if (prevTotalSpent > 0) {
    const rawPct = ((totalSpent - prevTotalSpent) / prevTotalSpent) * 100;
    percentageChange = Math.round(rawPct);
    if (percentageChange > 0) {
      changeDirection = "increase";
      changeLabel = `+${percentageChange}% vs ${prevPeriodLabel}`;
    } else if (percentageChange < 0) {
      changeDirection = "decrease";
      changeLabel = `${percentageChange}% vs ${prevPeriodLabel}`;
    } else {
      changeDirection = "neutral";
      changeLabel = `0% vs ${prevPeriodLabel}`;
    }
  } else {
    if (totalSpent > 0) {
      changeDirection = "increase";
      changeLabel = period === "DAILY" ? "No spend previous day" : `No spend ${prevPeriodLabel}`;
    } else {
      percentageChange = 0;
      changeDirection = "neutral";
      changeLabel = `Same as ${prevPeriodLabel} (₹0)`;
    }
  }

  // 4. Fill chart buckets
  for (const tx of periodTransactions) {
    const txDate = tx.date ? tx.date.split("T")[0] : tx.createdAt ? tx.createdAt.split("T")[0] : "";
    if (period === "DAILY") {
      const hour = extractHourFromTransaction(tx);
      if (hour >= 0 && hour < 24) {
        chartBuckets[hour].amount += tx.amount;
        chartBuckets[hour].count += 1;
      }
    } else if (period === "WEEKLY") {
      const bucket = chartBuckets.find((b) => b.dateKey === txDate);
      if (bucket) {
        bucket.amount += tx.amount;
        bucket.count += 1;
      }
    } else if (period === "MONTHLY") {
      const parts = txDate.split("-").map(Number);
      if (parts.length === 3) {
        const dayIdx = parts[2] - 1;
        if (dayIdx >= 0 && dayIdx < chartBuckets.length) {
          chartBuckets[dayIdx].amount += tx.amount;
          chartBuckets[dayIdx].count += 1;
        }
      }
    } else {
      // YEARLY
      const parts = txDate.split("-").map(Number);
      if (parts.length >= 2) {
        const monthIdx = parts[1] - 1;
        if (monthIdx >= 0 && monthIdx < 12) {
          chartBuckets[monthIdx].amount += tx.amount;
          chartBuckets[monthIdx].count += 1;
        }
      }
    }
  }

  let maxBucket: SpendingChartBucket | null = null;
  let maxAmount = 0;

  for (const bucket of chartBuckets) {
    bucket.percentage = totalSpent > 0 ? (bucket.amount / totalSpent) * 100 : 0;
    if (bucket.amount > maxAmount) {
      maxAmount = bucket.amount;
      maxBucket = bucket;
    }
  }

  // 5. Category Breakdown
  const categoryMap = new Map<string, { amount: number; count: number; id: string; name: string }>();

  for (const tx of periodTransactions) {
    const catName = tx.category || "General";
    const existing = categoryMap.get(catName) || {
      id: tx.categoryId || catName,
      name: catName,
      amount: 0,
      count: 0,
    };
    existing.amount += tx.amount;
    existing.count += 1;
    categoryMap.set(catName, existing);
  }

  const categories: DailyCategorySpend[] = Array.from(categoryMap.values())
    .map((c) => ({
      ...c,
      percentage: totalSpent > 0 ? Math.round((c.amount / totalSpent) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // 6. Payment Methods Breakdown
  const methodMap = new Map<string, { amount: number; count: number }>();

  for (const tx of periodTransactions) {
    const method = resolvePaymentMethod(tx, accounts);
    const existing = methodMap.get(method) || { amount: 0, count: 0 };
    existing.amount += tx.amount;
    existing.count += 1;
    methodMap.set(method, existing);
  }

  const paymentMethods: DailyPaymentMethodSpend[] = Array.from(methodMap.entries())
    .map(([method, data], index) => ({
      method,
      amount: data.amount,
      count: data.count,
      percentage: totalSpent > 0 ? Math.round((data.amount / totalSpent) * 1000) / 10 : 0,
      color: METHOD_COLORS[method] || DEFAULT_PALETTE[index % DEFAULT_PALETTE.length],
    }))
    .sort((a, b) => b.amount - a.amount);

  // 7. Top Merchant
  const merchantMap = new Map<string, { amount: number; count: number; displayName: string }>();

  for (const tx of periodTransactions) {
    const normalized = normalizeMerchant(tx.description);
    const displayName = normalized.displayName || tx.description || "General Merchant";
    const key = normalized.normalizedKey || displayName.toLowerCase();

    const existing = merchantMap.get(key) || {
      amount: 0,
      count: 0,
      displayName,
    };
    existing.amount += tx.amount;
    existing.count += 1;
    merchantMap.set(key, existing);
  }

  let topMerchant: DailyTopMerchant | null = null;
  let topMerchantAmount = 0;

  for (const item of merchantMap.values()) {
    if (item.amount > topMerchantAmount) {
      topMerchantAmount = item.amount;
      topMerchant = {
        name: item.displayName,
        amount: item.amount,
        count: item.count,
        percentage: totalSpent > 0 ? Math.round((item.amount / totalSpent) * 100) : 0,
      };
    }
  }

  return {
    period,
    selectedDate,
    periodRangeLabel,
    heroTitle,
    isCurrentPeriod: isCurrent,
    canNavigateForward,
    totalSpent,
    transactionCount,
    averageSpend,
    prevPeriodLabel,
    prevTotalSpent,
    prevTransactionCount,
    diffAmount,
    percentageChange,
    changeDirection,
    changeLabel,
    chartBuckets,
    maxBucket,
    xAxisLabels,
    categories,
    paymentMethods,
    topMerchant,
    periodTransactions,
  };
}

/**
 * Backwards-compatible daily summary function
 */
export function calculateDailySpendSummary(params: {
  transactions: Transaction[];
  accounts: Account[];
  selectedDate: string;
  todayDate?: string;
}): DailySpendSummary {
  const analytics = calculateSpendingAnalytics({
    ...params,
    period: "DAILY",
  });

  const hourlySlots: HourlySpendSlot[] = analytics.chartBuckets.map((b) => ({
    hour: b.index,
    label: b.label,
    rangeLabel: b.fullLabel,
    amount: b.amount,
    count: b.count,
    percentage: b.percentage,
  }));

  const maxHourlySlot = analytics.maxBucket
    ? {
        hour: analytics.maxBucket.index,
        label: analytics.maxBucket.label,
        rangeLabel: analytics.maxBucket.fullLabel,
        amount: analytics.maxBucket.amount,
        count: analytics.maxBucket.count,
        percentage: analytics.maxBucket.percentage,
      }
    : null;

  return {
    selectedDate: analytics.selectedDate,
    displayDate: analytics.periodRangeLabel,
    isToday: analytics.isCurrentPeriod,
    isYesterday: analytics.selectedDate === getPreviousDateString(params.todayDate || formatLocalDate(new Date())),
    totalSpent: analytics.totalSpent,
    transactionCount: analytics.transactionCount,
    averageSpend: analytics.averageSpend,
    prevDate: getPreviousDateString(analytics.selectedDate),
    prevTotalSpent: analytics.prevTotalSpent,
    prevTransactionCount: analytics.prevTransactionCount,
    diffAmount: analytics.diffAmount,
    percentageChange: analytics.percentageChange,
    changeDirection: analytics.changeDirection,
    changeLabel: analytics.changeLabel,
    hourlySlots,
    maxHourlySlot,
    categories: analytics.categories,
    paymentMethods: analytics.paymentMethods,
    topMerchant: analytics.topMerchant,
    dayTransactions: analytics.periodTransactions,
  };
}

// ─── Chart Tooltip Geometry & Clamping ─────────────────────────────

export interface TooltipPositionResult {
  left: number;
  top: number;
  arrowLeft: number;
  isClampedLeft: boolean;
  isClampedRight: boolean;
  isClampedTop: boolean;
}

export function calculateChartTooltipPosition(params: {
  barIndex: number;
  totalBars: number;
  containerWidth: number;
  tooltipWidth: number;
  tooltipHeight?: number;
  tooltipGap?: number;
  chartBarsHeight?: number;
  barAmount: number;
  maxAmount: number;
}): TooltipPositionResult {
  const {
    barIndex,
    totalBars,
    containerWidth,
    tooltipWidth,
    tooltipHeight = 28,
    tooltipGap = 6,
    chartBarsHeight = 120,
    barAmount,
    maxAmount,
  } = params;

  const validTotal = Math.max(totalBars, 1);
  const slotWidth = containerWidth > 0 ? containerWidth / validTotal : 1;
  const clampedIndex = Math.max(0, Math.min(barIndex, validTotal - 1));
  const barCenterX = (clampedIndex + 0.5) * slotWidth;

  // Bar height scaling (leaving headroom for tooltip at peak amount)
  const maxBarH = Math.max(chartBarsHeight - tooltipHeight - tooltipGap - 4, 30);
  const effectiveMax = maxAmount > 0 ? maxAmount : 1;
  const barHeight =
    barAmount > 0
      ? Math.max(Math.round((barAmount / effectiveMax) * maxBarH), 10)
      : 4;

  const barTopY = chartBarsHeight - barHeight;
  const desiredTop = barTopY - tooltipHeight - tooltipGap;
  const top = Math.max(2, desiredTop);
  const isClampedTop = desiredTop < 2;

  // Horizontal clamping within container
  const desiredLeft = barCenterX - tooltipWidth / 2;
  const maxLeft = Math.max(4, containerWidth - tooltipWidth - 4);
  const left = Math.max(4, Math.min(desiredLeft, maxLeft));

  const isClampedLeft = desiredLeft < 4;
  const isClampedRight = desiredLeft > maxLeft;

  // Arrow / Caret alignment pointing directly to bar center
  const arrowOffset = barCenterX - left - 4; // 4px is half the 8px caret width
  const arrowLeft = Math.max(6, Math.min(arrowOffset, Math.max(6, tooltipWidth - 14)));

  return {
    left: Math.round(left * 10) / 10,
    top: Math.round(top * 10) / 10,
    arrowLeft: Math.round(arrowLeft * 10) / 10,
    isClampedLeft,
    isClampedRight,
    isClampedTop,
  };
}

// ─── Chart Bucket Transaction Filtering & Re-aggregation ───────────

export function filterTransactionsForBucket(
  transactions: Transaction[],
  period: SpendingPeriod,
  bucket: SpendingChartBucket,
  selectedDate: string,
): Transaction[] {
  return transactions.filter((tx) => {
    if (tx.type !== "EXPENSE" || !tx.amount || tx.amount <= 0) return false;
    const txDate = tx.date ? tx.date.split("T")[0] : tx.createdAt ? tx.createdAt.split("T")[0] : "";
    if (!txDate) return false;

    if (period === "DAILY") {
      // Must match selected date AND the hour (half-open range [hour, hour + 1))
      if (txDate !== selectedDate) return false;
      const hour = extractHourFromTransaction(tx);
      return hour === bucket.index;
    }

    if (period === "WEEKLY") {
      // Must match the calendar date within the selected week
      return bucket.dateKey ? txDate === bucket.dateKey : false;
    }

    if (period === "MONTHLY") {
      // Must match the calendar day within the selected month
      return bucket.dateKey ? txDate === bucket.dateKey : false;
    }

    if (period === "YEARLY") {
      // Must match the year-month prefix e.g. "2025-03"
      return bucket.dateKey ? txDate.startsWith(bucket.dateKey) : false;
    }

    return false;
  });
}

export interface SpendingBucketDetails {
  totalSpent: number;
  transactionCount: number;
  averageSpend: number;
  categories: DailyCategorySpend[];
  paymentMethods: DailyPaymentMethodSpend[];
  topMerchant: DailyTopMerchant | null;
  transactions: Transaction[];
}

export function computeBucketDetails(
  bucketTransactions: Transaction[],
  accounts: Account[],
): SpendingBucketDetails {
  const totalSpent = bucketTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  const transactionCount = bucketTransactions.length;
  const averageSpend = transactionCount > 0 ? totalSpent / transactionCount : 0;

  // Categories
  const categoryMap = new Map<string, { amount: number; count: number; id: string; name: string }>();
  for (const tx of bucketTransactions) {
    const catName = tx.category || "General";
    const existing = categoryMap.get(catName) || {
      id: tx.categoryId || catName,
      name: catName,
      amount: 0,
      count: 0,
    };
    existing.amount += tx.amount;
    existing.count += 1;
    categoryMap.set(catName, existing);
  }
  const categories: DailyCategorySpend[] = Array.from(categoryMap.values())
    .map((c) => ({
      ...c,
      percentage: totalSpent > 0 ? Math.round((c.amount / totalSpent) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Payment Methods
  const methodMap = new Map<string, { amount: number; count: number }>();
  for (const tx of bucketTransactions) {
    const method = resolvePaymentMethod(tx, accounts);
    const existing = methodMap.get(method) || { amount: 0, count: 0 };
    existing.amount += tx.amount;
    existing.count += 1;
    methodMap.set(method, existing);
  }
  const paymentMethods: DailyPaymentMethodSpend[] = Array.from(methodMap.entries())
    .map(([method, data], index) => ({
      method,
      amount: data.amount,
      count: data.count,
      percentage: totalSpent > 0 ? Math.round((data.amount / totalSpent) * 1000) / 10 : 0,
      color: METHOD_COLORS[method] || DEFAULT_PALETTE[index % DEFAULT_PALETTE.length],
    }))
    .sort((a, b) => b.amount - a.amount);

  // Top Merchant
  const merchantMap = new Map<string, { amount: number; count: number; displayName: string }>();
  for (const tx of bucketTransactions) {
    const normalized = normalizeMerchant(tx.description);
    const displayName = normalized.displayName || tx.description || "General Merchant";
    const key = normalized.normalizedKey || displayName.toLowerCase();
    const existing = merchantMap.get(key) || { amount: 0, count: 0, displayName };
    existing.amount += tx.amount;
    existing.count += 1;
    merchantMap.set(key, existing);
  }
  let topMerchant: DailyTopMerchant | null = null;
  let maxMerchantAmount = 0;
  for (const [, item] of merchantMap) {
    if (item.amount > maxMerchantAmount) {
      maxMerchantAmount = item.amount;
      topMerchant = {
        name: item.displayName,
        amount: item.amount,
        count: item.count,
        percentage: totalSpent > 0 ? Math.round((item.amount / totalSpent) * 1000) / 10 : 0,
      };
    }
  }

  const transactions = [...bucketTransactions].sort((a, b) => {
    const dateA = `${a.date || ""} ${a.time || ""}`;
    const dateB = `${b.date || ""} ${b.time || ""}`;
    return dateB.localeCompare(dateA);
  });

  return {
    totalSpent,
    transactionCount,
    averageSpend,
    categories,
    paymentMethods,
    topMerchant,
    transactions,
  };
}

// ─── Date Navigation Parameter Builder ─────────────────────────────

export interface SpendingNavigationParams {
  period: SpendingPeriod;
  month?: string;
  year?: string;
  monthName?: string;
  startDate?: string;
  endDate?: string;
  date?: string;
  hour?: string;
  dateLabel: string;
}

export function buildSpendingDateParams(
  period: SpendingPeriod,
  selectedDate: string,
  selectedBucket: SpendingChartBucket | null,
): SpendingNavigationParams {
  if (period === "DAILY") {
    const dObj = parseLocalDate(selectedDate);
    const dayLabel = formatDailySpendHeaderDate(selectedDate);
    if (selectedBucket) {
      return {
        period: "DAILY",
        date: selectedDate,
        hour: String(selectedBucket.index),
        dateLabel: `${dayLabel} • ${selectedBucket.fullLabel}`,
        startDate: selectedDate,
        endDate: selectedDate,
        year: String(dObj.getFullYear()),
        month: String(dObj.getMonth()),
        monthName: MONTH_NAMES[dObj.getMonth()],
      };
    }
    return {
      period: "DAILY",
      date: selectedDate,
      dateLabel: dayLabel,
      startDate: selectedDate,
      endDate: selectedDate,
      year: String(dObj.getFullYear()),
      month: String(dObj.getMonth()),
      monthName: MONTH_NAMES[dObj.getMonth()],
    };
  }

  if (period === "WEEKLY") {
    const curWeek = getWeekBoundaries(selectedDate);
    if (selectedBucket && selectedBucket.dateKey) {
      const dObj = parseLocalDate(selectedBucket.dateKey);
      return {
        period: "DAILY",
        date: selectedBucket.dateKey,
        dateLabel: selectedBucket.fullLabel,
        startDate: selectedBucket.dateKey,
        endDate: selectedBucket.dateKey,
        year: String(dObj.getFullYear()),
        month: String(dObj.getMonth()),
        monthName: MONTH_NAMES[dObj.getMonth()],
      };
    }
    return {
      period: "WEEKLY",
      startDate: curWeek.start,
      endDate: curWeek.end,
      dateLabel: `${curWeek.mondayDate.getDate()} ${MONTH_SHORT[curWeek.mondayDate.getMonth()]} – ${curWeek.sundayDate.getDate()} ${MONTH_SHORT[curWeek.sundayDate.getMonth()]}`,
      year: String(curWeek.mondayDate.getFullYear()),
      month: String(curWeek.mondayDate.getMonth()),
      monthName: MONTH_NAMES[curWeek.mondayDate.getMonth()],
    };
  }

  if (period === "MONTHLY") {
    const curMonth = getMonthBoundaries(selectedDate);
    if (selectedBucket && selectedBucket.dateKey) {
      const dObj = parseLocalDate(selectedBucket.dateKey);
      return {
        period: "DAILY",
        date: selectedBucket.dateKey,
        dateLabel: selectedBucket.fullLabel,
        startDate: selectedBucket.dateKey,
        endDate: selectedBucket.dateKey,
        year: String(dObj.getFullYear()),
        month: String(dObj.getMonth()),
        monthName: MONTH_NAMES[dObj.getMonth()],
      };
    }
    const mIdx = curMonth.month - 1;
    return {
      period: "MONTHLY",
      month: String(mIdx),
      year: String(curMonth.year),
      monthName: MONTH_NAMES[mIdx],
      startDate: curMonth.start,
      endDate: curMonth.end,
      dateLabel: `${MONTH_NAMES[mIdx]} ${curMonth.year}`,
    };
  }

  // YEARLY
  const curYear = getYearBoundaries(selectedDate);
  if (selectedBucket) {
    const mIdx = selectedBucket.index;
    return {
      period: "MONTHLY",
      month: String(mIdx),
      year: String(curYear.year),
      monthName: MONTH_NAMES[mIdx],
      dateLabel: `${MONTH_NAMES[mIdx]} ${curYear.year}`,
    };
  }
  return {
    period: "YEARLY",
    year: String(curYear.year),
    startDate: curYear.start,
    endDate: curYear.end,
    dateLabel: `Year ${curYear.year}`,
  };
}
