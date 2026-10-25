import { Currency } from '@/context/FinanceContext';
import { CURRENCY_SYMBOLS, CURRENCY_LOCALES } from '@/constants/currencies';

/**
 * Get the symbol for a currency code.
 */
export function currencySymbol(currency: Currency = 'INR'): string {
  if (!currency) return '₹';
  const code = currency.toUpperCase();
  return CURRENCY_SYMBOLS[code] || code;
}

/**
 * Format a number as currency string.
 * Uses the user's currency setting from FinanceContext.
 */
export function money(amount: number, currency: Currency = 'INR'): string {
  const code = (currency || 'INR').toUpperCase();
  const symbol = CURRENCY_SYMBOLS[code] || code;
  const locale = CURRENCY_LOCALES[code] || (code === 'INR' ? 'en-IN' : 'en-US');
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: abs >= 100000 ? 0 : abs >= 1000 ? 0 : 2,
  });
  const sign = amount < 0 ? '-' : '';
  const separator = symbol.length > 2 ? ' ' : '';
  return `${symbol}${separator}${sign}${formatted}`;
}

/**
 * Format total balance with exactly two decimal places (e.g. ₹-24,777.00).
 */
export function formatTotalBalance(amount: number, currency: Currency = 'INR'): string {
  const code = (currency || 'INR').toUpperCase();
  const symbol = CURRENCY_SYMBOLS[code] || code;
  const locale = CURRENCY_LOCALES[code] || (code === 'INR' ? 'en-IN' : 'en-US');
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const sign = amount < 0 ? '-' : '';
  const separator = symbol.length > 2 ? ' ' : '';
  return `${symbol}${separator}${sign}${formatted}`;
}

/**
 * Format amount with sign prefix for display.
 */
export function signedMoney(amount: number, currency: Currency = 'INR'): string {
  const code = (currency || 'INR').toUpperCase();
  const symbol = CURRENCY_SYMBOLS[code] || code;
  const separator = symbol.length > 2 ? ' ' : '';
  const sign = amount >= 0 ? '+' : '-';
  const abs = Math.abs(amount);
  const locale = CURRENCY_LOCALES[code] || (code === 'INR' ? 'en-IN' : 'en-US');
  const formatted = abs.toLocaleString(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: abs >= 100000 ? 0 : abs >= 1000 ? 0 : 2,
  });
  return `${symbol}${separator}${sign}${formatted}`;
}

/**
 * Format a compact number (e.g., 125000 → "1.25L" in INR, "125K" in USD).
 */
export function compactMoney(amount: number, currency: Currency = 'INR'): string {
  const code = (currency || 'INR').toUpperCase();
  const symbol = CURRENCY_SYMBOLS[code] || code;
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  const separator = symbol.length > 2 ? ' ' : '';

  let formatted: string;
  if (code === 'INR') {
    if (abs >= 10000000) {
      formatted = (abs / 10000000).toFixed(2) + 'Cr';
    } else if (abs >= 100000) {
      formatted = (abs / 100000).toFixed(1) + 'L';
    } else if (abs >= 1000) {
      formatted = (abs / 1000).toFixed(1) + 'K';
    } else {
      formatted = abs.toFixed(0);
    }
  } else {
    if (abs >= 1000000000) {
      formatted = (abs / 1000000000).toFixed(1) + 'B';
    } else if (abs >= 1000000) {
      formatted = (abs / 1000000).toFixed(1) + 'M';
    } else if (abs >= 1000) {
      formatted = (abs / 1000).toFixed(1) + 'K';
    } else {
      formatted = abs.toFixed(0);
    }
  }

  return `${symbol}${separator}${sign}${formatted}`;
}

/**
 * Returns YYYY-MM-DD in local time
 */
export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns 12-hour formatted time in local time (e.g. "02:30 PM", "10:15 AM")
 */
export function getLocalTimeString(d: Date = new Date()): string {
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 || 12;
  return `${String(h12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
}

/**
 * Format a date string to a readable format (Today, Yesterday, weekday, or MMM d, yyyy).
 * Accurately aligns with local timezone.
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const cleanDate = dateStr.split('T')[0];
  const todayStr = getLocalDateString(new Date());

  if (cleanDate === todayStr) return 'Today';

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterday);
  if (cleanDate === yesterdayStr) return 'Yesterday';

  const parts = cleanDate.split('-').map(Number);
  if (parts.length === 3) {
    const [y, m, d] = parts;
    const dateObj = new Date(y, m - 1, d);
    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const targetMidnight = dateObj.getTime();
    const diffDays = Math.round((todayMidnight - targetMidnight) / 86400000);
    if (diffDays >= 0 && diffDays < 7) {
      return dateObj.toLocaleDateString('en-US', { weekday: 'long' });
    }
    return dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  return cleanDate;
}

/**
 * Format time string to 12-hour format (e.g. "02:30 PM", "10:15 AM").
 */
export function formatTime(timeStr?: string): string {
  if (!timeStr) return '';
  const trimmed = timeStr.trim();
  // Already in 12-hour format with AM/PM
  const match12 = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match12) {
    const h = parseInt(match12[1], 10);
    const m = match12[2];
    const period = match12[3].toUpperCase();
    return `${h.toString().padStart(2, '0')}:${m} ${period}`;
  }
  // 24-hour format HH:mm or HH:mm:ss
  const parts = trimmed.split(':').map(Number);
  if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    const [h, m] = parts;
    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${period}`;
  }
  return trimmed;
}

export {
  convertTo24Hour,
  getTransactionTimestamp,
  compareTransactionsByLatest,
} from './transactionSorting';

/**
 * Format timestamp or ISO string to relative human-readable time
 * (e.g. "Just now", "1 minute ago", "15 minutes ago", "12 hours ago", "Yesterday", "3 days ago").
 */
export function formatRelativeTime(timeStr?: string, fallbackId?: string): string {
  let ms: number | null = null;

  if (timeStr && timeStr !== 'Just now') {
    const parsed = Date.parse(timeStr);
    if (!isNaN(parsed)) {
      ms = parsed;
    } else {
      const num = Number(timeStr);
      if (!isNaN(num) && num > 1000000000000) {
        ms = num;
      }
    }
  }

  // If timeStr was "Just now" or unparseable, extract timestamp from notification id (e.g. notif-exp-1727110000000)
  if (ms === null && fallbackId) {
    const match = fallbackId.match(/\d{12,14}/);
    if (match) {
      const extracted = Number(match[0]);
      if (!isNaN(extracted) && extracted > 1000000000000) {
        ms = extracted;
      }
    }
  }

  if (ms === null) {
    return timeStr || 'Just now';
  }

  const now = Date.now();
  const diffMs = now - ms;
  if (diffMs < 0) return 'Just now';

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 45) return 'Just now';
  if (diffMin === 1) return '1 minute ago';
  if (diffMin < 60) return `${diffMin} minutes ago`;
  if (diffHour === 1) return '1 hour ago';
  if (diffHour < 24) return `${diffHour} hours ago`;
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay} days ago`;

  const d = new Date(ms);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Get greeting based on time of day.
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Calculate percentage.
 */
export function percentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

/**
 * Get days in month.
 */
export function daysInMonth(date: Date = new Date()): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

/**
 * Get current day of month.
 */
export function currentDayOfMonth(): number {
  return new Date().getDate();
}

/**
 * Timezone-safe check whether a transaction or date string falls in target month and year.
 * Handles both (txOrDate, targetMonth, targetYear) and (txOrDate, targetYear, targetMonth).
 * targetMonth is 0-indexed (0 = Jan, 8 = Sep, 11 = Dec).
 */
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

  // Parse YYYY-MM directly from string without regex overhead to avoid timezone shifts
  if (dateStr.length >= 7 && dateStr.charCodeAt(4) === 45 /* '-' */) {
    const y = Number(dateStr.slice(0, 4));
    const m = Number(dateStr.slice(5, 7)) - 1; // 0-indexed
    if (!isNaN(y) && !isNaN(m)) {
      return y === targetYear && m === targetMonth;
    }
  }

  const d = new Date(dateStr);
  return (
    !isNaN(d.getTime()) &&
    d.getFullYear() === targetYear &&
    d.getMonth() === targetMonth
  );
}

/**
 * Check if a transaction is an eligible expense in target month and year.
 */
export function isEligibleExpenseInMonth(
  tx: { type?: string; date?: string; createdAt?: string } | undefined | null,
  targetMonth: number,
  targetYear: number,
): boolean {
  if (!tx) return false;
  if (tx.type !== "EXPENSE") return false;
  return isTxInMonth(tx, targetMonth, targetYear);
}

