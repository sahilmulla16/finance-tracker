/**
 * Transaction Sorting & Chronological Ordering Utilities
 *
 * Deterministic, jitter-free sorting for transactions across all screens.
 * Ensures the latest tracked transaction is strictly at the top.
 */

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
 * Extracts a high-precision epoch millisecond timestamp from a transaction
 * combining date, time (12h/24h), createdAt ISO string, and ID timestamp.
 */
export function getTransactionTimestamp(tx?: {
  date?: string;
  time?: string;
  createdAt?: string;
  id?: string;
} | null): number {
  if (!tx) return 0;

  // 1. If explicit date and time exist, parse exact date + time
  if (tx.date) {
    try {
      const timeStr = tx.time ? convertTo24Hour(tx.time) : '';
      if (timeStr && timeStr.includes(':')) {
        const [h, m] = timeStr.split(':').map(Number);
        const parts = tx.date.split('-').map(Number);
        if (parts.length === 3) {
          const [year, month, day] = parts;
          let sec = 0;
          let ms = 0;
          if (tx.createdAt) {
            const cDate = new Date(tx.createdAt);
            if (!isNaN(cDate.getTime())) {
              sec = cDate.getSeconds();
              ms = cDate.getMilliseconds();
            }
          }
          const dt = new Date(year, month - 1, day, h || 0, m || 0, sec, ms);
          const t = dt.getTime();
          if (!isNaN(t) && t > 0) return t;
        }
      }
    } catch {
      // Fallback
    }
  }

  // 2. Parse tx.createdAt
  if (tx.createdAt) {
    const t = new Date(tx.createdAt).getTime();
    if (!isNaN(t) && t > 0) return t;
  }

  // 3. Fallback to tx.date at midday (local time)
  if (tx.date) {
    const parts = tx.date.split('-').map(Number);
    if (parts.length === 3) {
      const [year, month, day] = parts;
      const dt = new Date(year, month - 1, day, 12, 0, 0, 0);
      const t = dt.getTime();
      if (!isNaN(t) && t > 0) return t;
    }
  }

  // 4. Fallback to ID timestamp if available (e.g. txn-1729158392123-...)
  if (tx.id) {
    const match = tx.id.match(/\b(?:txn|scan)-(\d{10,13})\b/);
    if (match) {
      const parsedIdTime = Number(match[1]);
      if (!isNaN(parsedIdTime) && parsedIdTime > 0) return parsedIdTime;
    }
  }

  return 0;
}

/**
 * Deterministic comparator sorting transactions strictly by latest time first (descending).
 * Guaranteed stable with zero jitter/glitching across re-renders.
 */
export function compareTransactionsByLatest<
  T extends {
    id?: string;
    date?: string;
    time?: string;
    createdAt?: string;
    updatedAt?: string;
  },
>(a: T, b: T): number {
  // Primary comparison: latest timestamp first
  const timeA = getTransactionTimestamp(a);
  const timeB = getTransactionTimestamp(b);
  const diff = timeB - timeA;
  if (diff !== 0) return diff;

  // Secondary tie-breaker: createdAt string
  if (a.createdAt && b.createdAt && a.createdAt !== b.createdAt) {
    return b.createdAt.localeCompare(a.createdAt);
  }

  // Tertiary tie-breaker: updatedAt string
  if (a.updatedAt && b.updatedAt && a.updatedAt !== b.updatedAt) {
    return b.updatedAt.localeCompare(a.updatedAt);
  }

  // Deterministic final tie-breaker: transaction ID
  return (b.id || '').localeCompare(a.id || '');
}

/**
 * Determines transaction type from voice command or text description.
 * Categorizes expenses vs income vs transfers safely without false positives.
 */
export function classifyVoiceTransactionType(rawText: string): 'EXPENSE' | 'INCOME' | 'TRANSFER' {
  const lower = rawText.toLowerCase().trim();

  const isCashOut = /\b(?:cash\s*out|cashout|cash\s+withdrawal|atm|withdraw(?:al)?|withdrew|withdrawn|bank\s+cash)\b/i.test(lower);
  const isExplicitExpense =
    /\b(?:spent|spend|paid|pay|buying|bought|cost|costing|kharcha|kharch|diye|diya|de\s*diya|expense|bill|fees?|fine)\b/i.test(
      lower,
    );

  const isExplicitIncome =
    /\b(?:salary|freelance|earned|dividend|stipend|wages|bonus|credited|cashback|refund|got\s+(?:paid|salary|bonus|refund|cashback|money|stipend)|received\s+(?:money|payment|salary|rent))\b/i.test(
      lower,
    );

  if (
    !isExplicitExpense &&
    (isCashOut ||
      /\b(?:transfer|transferred|transferring|between\s+accounts|send\s+to\s+savings|transfer\s+to)\b/i.test(
        lower,
      ))
  ) {
    return 'TRANSFER';
  } else if (!isExplicitExpense && isExplicitIncome) {
    return 'INCOME';
  } else {
    return 'EXPENSE';
  }
}

