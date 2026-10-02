import { type Transaction } from "@/context/FinanceContext";
import { type ParsedTransaction } from "./transactionParser";

/**
 * Calculates string similarity between two words/phrases (0.0 to 1.0).
 * Uses token overlap and Levenshtein distance for robustness.
 */
function calculateTextSimilarity(a: string, b: string): number {
  const s1 = a.toLowerCase().trim();
  const s2 = b.toLowerCase().trim();
  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1;

  // Generic tokens to ignore during matching
  const generic = new Set(["transaction", "scanned", "receipt", "payment", "bill", "invoice"]);
  const tokens1 = s1.split(/\s+/).filter((t) => t.length > 2 && !generic.has(t));
  const tokens2 = s2.split(/\s+/).filter((t) => t.length > 2 && !generic.has(t));

  if (tokens1.length > 0 && tokens2.length > 0) {
    const common = tokens1.filter((t) => tokens2.includes(t));
    if (common.length > 0) {
      return common.length / Math.max(tokens1.length, tokens2.length);
    }
  }

  // Substring check for significant names (length >= 4)
  if (s1.length >= 4 && s2.length >= 4) {
    if (s1.includes(s2) || s2.includes(s1)) {
      return 0.85;
    }
  }

  return 0;
}

/**
 * Calculates absolute difference in days between two ISO date strings (YYYY-MM-DD).
 */
function getDayDifference(dateA: string, dateB: string): number {
  try {
    const dA = new Date(dateA).getTime();
    const dB = new Date(dateB).getTime();
    if (isNaN(dA) || isNaN(dB)) return 999;
    return Math.abs(Math.round((dA - dB) / (1000 * 60 * 60 * 24)));
  } catch {
    return 999;
  }
}

/**
 * Compares parsed transactions against both existing local transactions
 * and other transactions in the same scan batch to flag duplicates accurately.
 */
export function flagDuplicates(
  scannedTransactions: ParsedTransaction[],
  existingTransactions: Transaction[],
): ParsedTransaction[] {
  if (!scannedTransactions || scannedTransactions.length === 0) {
    return [];
  }

  const result: ParsedTransaction[] = [];

  for (let i = 0; i < scannedTransactions.length; i++) {
    const scanned = scannedTransactions[i];
    let isDuplicate = false;
    let reason = "";

    // 1. Check against existing transactions in FinanceContext
    if (existingTransactions && existingTransactions.length > 0) {
      for (const existing of existingTransactions) {
        const amountsMatch = Math.abs(existing.amount - scanned.amount) < 0.01;
        if (!amountsMatch) continue;

        const dayDiff = getDayDifference(existing.date, scanned.date);
        const textSimilarity = calculateTextSimilarity(
          existing.description || "",
          scanned.merchant || "",
        );

        // Exact date and close/exact merchant match
        if (dayDiff === 0 && (textSimilarity >= 0.6 || existing.category?.toLowerCase() === scanned.category?.toLowerCase())) {
          isDuplicate = true;
          reason = `Matches existing ${scanned.currency} ${scanned.amount} from "${existing.description || existing.category}" on ${existing.date}`;
          break;
        }

        // Within 1 day tolerance with high merchant similarity
        if (dayDiff <= 1 && textSimilarity >= 0.8) {
          isDuplicate = true;
          reason = `Likely duplicate of ${scanned.currency} ${scanned.amount} ("${existing.description}") from ${existing.date}`;
          break;
        }
      }
    }

    // 2. Check for intra-batch duplicates (same receipt scanned twice or identical statement row)
    if (!isDuplicate) {
      for (let j = 0; j < i; j++) {
        const prev = scannedTransactions[j];
        const amountsMatch = Math.abs(prev.amount - scanned.amount) < 0.01;
        if (amountsMatch && prev.date === scanned.date) {
          const sim = calculateTextSimilarity(prev.merchant, scanned.merchant);
          if (sim >= 0.7 || prev.merchant.toLowerCase() === scanned.merchant.toLowerCase()) {
            isDuplicate = true;
            reason = `Duplicate of item #${j + 1} (${scanned.merchant}) in this scan batch`;
            break;
          }
        }
      }
    }

    result.push({
      ...scanned,
      isPossibleDuplicate: isDuplicate,
      duplicateReason: isDuplicate ? reason : undefined,
    });
  }

  return result;
}
