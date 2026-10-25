export type RecurrenceFrequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

export type RecurringPaymentStatus = "ACTIVE" | "PAUSED" | "COMPLETED";

export interface RecurringPayment {
  id: string;
  name: string;
  amount: number;
  currency: string;
  category: string;
  categoryId?: string;
  accountId?: string;
  frequency: RecurrenceFrequency;
  startDate: string; // YYYY-MM-DD
  nextDueDate: string; // YYYY-MM-DD
  endDate?: string; // optional YYYY-MM-DD
  status: RecurringPaymentStatus;
  notes?: string;
  autoLog?: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Format Date to YYYY-MM-DD string in local time
 */
export function formatToDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Parse YYYY-MM-DD string to Date at local midnight
 */
export function parseDateString(dateStr: string): Date {
  const parts = dateStr.split("-").map(Number);
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
  }
  const fallback = new Date(dateStr);
  fallback.setHours(0, 0, 0, 0);
  return fallback;
}

/**
 * Safely adds months to a date preserving the intended day of the month where possible,
 * clamping to the last valid day of shorter months (e.g. Jan 31 -> Feb 28 in non-leap year).
 */
export function addMonthsClamped(date: Date, months: number, originalDayOfMonth?: number): Date {
  const targetDay = originalDayOfMonth ?? date.getDate();
  const result = new Date(date.getTime());

  // Set to day 1 first to prevent automatic overflow when month changes
  result.setDate(1);
  result.setMonth(result.getMonth() + months);

  const year = result.getFullYear();
  const month = result.getMonth();
  // Day 0 of next month is the last day of target month
  const daysInTargetMonth = new Date(year, month + 1, 0).getDate();

  result.setDate(Math.min(targetDay, daysInTargetMonth));
  return result;
}

/**
 * Calculates the next due date based on recurrence frequency.
 * Handles month-end date clamping (31st -> 28/30th) and leap years.
 */
export function computeNextDueDate(
  currentDueDateStr: string,
  frequency: RecurrenceFrequency,
  referenceDate: Date = new Date(),
  advanceUntilFuture: boolean = false
): string {
  const start = parseDateString(currentDueDateStr);
  const originalDay = start.getDate();
  let next = new Date(start.getTime());

  const stepForward = (d: Date): Date => {
    switch (frequency) {
      case "DAILY": {
        const res = new Date(d.getTime());
        res.setDate(res.getDate() + 1);
        return res;
      }
      case "WEEKLY": {
        const res = new Date(d.getTime());
        res.setDate(res.getDate() + 7);
        return res;
      }
      case "MONTHLY": {
        return addMonthsClamped(d, 1, originalDay);
      }
      case "YEARLY": {
        const res = new Date(d.getTime());
        const isLeapDay = res.getMonth() === 1 && res.getDate() === 29;
        const targetYear = res.getFullYear() + 1;
        if (isLeapDay) {
          const isTargetLeap = (targetYear % 4 === 0 && targetYear % 100 !== 0) || (targetYear % 400 === 0);
          res.setFullYear(targetYear, 1, isTargetLeap ? 29 : 28);
        } else {
          res.setFullYear(targetYear);
        }
        return res;
      }
    }
  };

  next = stepForward(next);

  if (advanceUntilFuture) {
    const today = new Date(referenceDate.getTime());
    today.setHours(0, 0, 0, 0);
    let iterations = 0;
    while (next < today && iterations < 500) {
      next = stepForward(next);
      iterations++;
    }
  }

  return formatToDateString(next);
}
