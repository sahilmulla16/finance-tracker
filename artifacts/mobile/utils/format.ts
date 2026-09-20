import { Currency } from '@/context/FinanceContext';

const currencySymbols: Record<Currency, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  AED: 'د.إ',
};

const currencyLocales: Record<Currency, string> = {
  INR: 'en-IN',
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
  AED: 'ar-AE',
};

/**
 * Get the symbol for a currency code.
 */
export function currencySymbol(currency: Currency = 'INR'): string {
  return currencySymbols[currency] || '₹';
}

/**
 * Format a number as currency string.
 * Uses the user's currency setting from FinanceContext.
 */
export function money(amount: number, currency: Currency = 'INR'): string {
  const symbol = currencySymbols[currency] || '₹';
  const locale = currencyLocales[currency] || 'en-IN';
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: abs >= 100000 ? 0 : abs >= 1000 ? 0 : 2,
  });
  return `${symbol}${formatted}`;
}

/**
 * Format total balance with exactly two decimal places (e.g. ₹24,777.00).
 */
export function formatTotalBalance(amount: number, currency: Currency = 'INR'): string {
  const symbol = currencySymbols[currency] || '₹';
  const locale = currencyLocales[currency] || 'en-IN';
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const prefix = amount < 0 ? '-' : '';
  return `${prefix}${symbol}${formatted}`;
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
  const symbol = currencySymbols[currency] || '₹';
  const abs = Math.abs(amount);

  let formatted: string;
  if (abs >= 10000000) {
    formatted = (abs / 10000000).toFixed(2) + 'Cr';
  } else if (abs >= 100000) {
    formatted = (abs / 100000).toFixed(1) + 'L';
  } else if (abs >= 1000) {
    formatted = (abs / 1000).toFixed(1) + 'K';
  } else {
    formatted = abs.toFixed(0);
  }

  return `${symbol}${formatted}`;
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
 * Format time string (HH:mm) to readable format.
 */
export function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
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
