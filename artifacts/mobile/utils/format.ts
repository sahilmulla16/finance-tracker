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
  const separator = symbol.length > 2 ? ' ' : '';
  return `${symbol}${separator}${formatted}`;
}

/**
 * Format total balance with exactly two decimal places (e.g. ₹24,777.00).
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
  const prefix = amount < 0 ? '-' : '';
  const separator = symbol.length > 2 ? ' ' : '';
  return `${prefix}${symbol}${separator}${formatted}`;
}

/**
 * Format amount with sign prefix for display.
 */
export function signedMoney(amount: number, currency: Currency = 'INR'): string {
  const prefix = amount >= 0 ? '+' : '-';
  return `${prefix}${money(Math.abs(amount), currency)}`;
}

/**
 * Format a compact number (e.g., 125000 → "1.25L" in INR, "125K" in USD).
 */
export function compactMoney(amount: number, currency: Currency = 'INR'): string {
  const code = (currency || 'INR').toUpperCase();
  const symbol = CURRENCY_SYMBOLS[code] || code;
  const abs = Math.abs(amount);
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

  return `${symbol}${separator}${formatted}`;
}

/**
 * Format a date string to a readable format.
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return date.toLocaleDateString('en-US', { weekday: 'long' });
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
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

/**
 * Converts a 12-hour formatted time ("02:30 PM") to 24-hour ("14:30").
 */
export function convertTo24Hour(time12Str?: string): string {
  if (!time12Str) return '12:00';
  const match = time12Str.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return time12Str;
  let h = parseInt(match[1], 10);
  const m = match[2];
  const period = match[3]?.toUpperCase();
  if (period === 'PM' && h < 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return `${h.toString().padStart(2, '0')}:${m}`;
}

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
