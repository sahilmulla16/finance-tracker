import {
  parseUniversalSms,
  resolveAccountForTransaction,
  getUniversalBankAliases,
  NormalizedTransaction,
  AccountMatchCandidate as UniversalAccountCandidate,
  ExtractedSuffix,
} from "../services/autoTrack";

export interface AccountMatchCandidate extends UniversalAccountCandidate {
  id: string;
  name: string;
  type?: string;
  isActive?: boolean;
  accountNumberLast4?: string;
  cardLast4?: string;
  accountSuffix?: string;
}

/**
 * Returns bank aliases/tokens for fuzzy matching account names against bank names.
 * Supports all Indian institutions via the Universal Financial Institution Registry.
 */
export function getBankAliases(bankName: string): string[] {
  if (!bankName) return [];
  const universal = getUniversalBankAliases(bankName);
  if (universal.length > 0) return universal;

  const lower = bankName.trim().toLowerCase();
  const words = lower
    .split(/\s+/)
    .filter((w) => w.length >= 3 && w !== "bank");
  return words.length > 0 ? words : [lower];
}

/**
 * Account matching priority:
 * 1. Match the bank and account suffix to an existing Zeno account.
 * 2. If the suffix is unavailable, use the bank name only when exactly one eligible account matches.
 * 3. If several accounts match the same bank, do not guess -> return null (user must select).
 * 4. If no matching account exists -> return null (send through review/selection).
 *
 * Never creates an account automatically.
 * Distinguishes UPI apps from banks (never assumes UPI app is the bank).
 * Supports explicit accountNumberLast4, cardLast4, and accountSuffix fields.
 */
export function matchAccount<T extends AccountMatchCandidate>(
  accounts: T[],
  bankName?: string | null,
  accountSuffix?: string | null,
  isCard?: boolean,
): T | null {
  if (!accounts || accounts.length === 0) return null;

  // Only consider active, non-cash accounts
  const eligibleAccounts = accounts.filter(
    (a) => a.isActive !== false && a.type?.toUpperCase() !== "CASH",
  );
  if (eligibleAccounts.length === 0) return null;

  const cleanSuffix = accountSuffix ? accountSuffix.trim() : null;
  const cleanBank = bankName ? bankName.trim() : null;

  // Priority 1: Match bank AND suffix
  if (cleanSuffix) {
    const suffixMatches = eligibleAccounts.filter((acc) => {
      const accNum = acc.accountNumberLast4?.trim();
      const cardNum = acc.cardLast4?.trim();
      const legSuffix = acc.accountSuffix?.trim();
      const isCardAcc =
        (acc.type || "").toUpperCase() === "CREDIT" ||
        (acc.type || "").toUpperCase() === "CARD";

      if (isCard === true) {
        return (
          cardNum === cleanSuffix ||
          (isCardAcc && legSuffix === cleanSuffix) ||
          (isCardAcc && acc.name.toLowerCase().includes(cleanSuffix.toLowerCase()))
        );
      } else if (isCard === false) {
        return (
          accNum === cleanSuffix ||
          (!isCardAcc && legSuffix === cleanSuffix) ||
          (!isCardAcc && acc.name.toLowerCase().includes(cleanSuffix.toLowerCase()))
        );
      }
      return (
        accNum === cleanSuffix ||
        cardNum === cleanSuffix ||
        legSuffix === cleanSuffix ||
        acc.name.toLowerCase().includes(cleanSuffix.toLowerCase())
      );
    });

    if (cleanBank) {
      const bankTokens = getBankAliases(cleanBank);
      const bankAndSuffixMatches = suffixMatches.filter((acc) => {
        const accLower = acc.name.toLowerCase();
        return bankTokens.some((token) => accLower.includes(token));
      });

      if (bankAndSuffixMatches.length === 1) {
        return bankAndSuffixMatches[0];
      }
      if (bankAndSuffixMatches.length > 1) {
        // Ambiguous match across multiple accounts of the same bank & suffix -> do not guess
        return null;
      }
    } else if (suffixMatches.length === 1) {
      // Suffix uniquely matches exactly one account
      return suffixMatches[0];
    }
  }

  // Priority 2: Suffix is unavailable, match bank name ONLY when exactly one eligible account matches
  if (cleanBank) {
    const bankTokens = getBankAliases(cleanBank);
    let bankMatches = eligibleAccounts.filter((acc) => {
      const accLower = acc.name.toLowerCase();
      return bankTokens.some((token) => accLower.includes(token));
    });

    if (isCard === true) {
      const creditMatches = bankMatches.filter((a) => {
        const t = (a.type || "").toUpperCase();
        return (
          t === "CREDIT" ||
          t === "CARD" ||
          a.name.toLowerCase().includes("card")
        );
      });
      if (creditMatches.length > 0) {
        bankMatches = creditMatches;
      }
    }

    if (bankMatches.length === 1) {
      return bankMatches[0];
    }

    // Priority 3: Multiple accounts match same bank -> do not guess, ask user to select
    if (bankMatches.length > 1) {
      return null;
    }
  }

  // Priority 4: No matching account exists -> return null
  return null;
}

export interface ParsedBankNotification {
  amount: number;
  merchant: string;
  direction: "EXPENSE" | "INCOME" | "REFUND" | "TRANSFER" | "UNKNOWN";
  bankName?: string;
  accountSuffix?: string;
  cardLast4?: string;
  accountNumberLast4?: string;
  counterparty?: string;
  categoryName?: string;
  isDirectionAmbiguous?: boolean;

  toBankName?: string;
  toAccountSuffix?: string;
  availableBalance?: number;
  reference?: string;
}

/**
 * Parses bank SMS and notification text for transaction details,
 * directions (EXPENSE, INCOME, REFUND, TRANSFER), and available balance.
 * Uses Universal Transaction Parser under the hood.
 */
export function parseBankNotification(text: string): ParsedBankNotification | null {
  const norm = parseUniversalSms(text);
  if (!norm) return null;

  return {
    amount: norm.amount,
    merchant: norm.merchant,
    direction: norm.direction,
    bankName: norm.bankName,
    accountSuffix: norm.extractedSuffix?.value,
    cardLast4: norm.cardLast4,
    accountNumberLast4: norm.accountNumberLast4,
    counterparty: norm.counterparty,
    categoryName: norm.merchantCategory,
    isDirectionAmbiguous: norm.isDirectionAmbiguous,
    toBankName: norm.toBankName,
    toAccountSuffix: norm.toAccountSuffix,
    availableBalance: norm.availableBalance,
    reference: norm.referenceId,
  };
}

/**
 * Reconciles account openingBalance against bank available balance.
 * Returns the adjusted opening balance and discrepancy.
 */
export function reconcileAccountBalance(
  accountOpeningBalance: number,
  accountTransactions: Array<{ amount: number; type: string; accountId?: string; fromAccountId?: string; toAccountId?: string }>,
  targetAccountId: string,
  bankAvailableBalance: number
): { reconciledOpeningBalance: number; discrepancy: number; wasAdjusted: boolean } {
  let netTxns = 0;
  for (const tx of accountTransactions) {
    const amt = Math.abs(tx.amount) || 0;
    const type = (tx.type || "EXPENSE").toUpperCase();
    if (type === "INCOME") {
      if (tx.accountId === targetAccountId) netTxns += amt;
    } else if (type === "EXPENSE") {
      if (tx.accountId === targetAccountId) netTxns -= amt;
    } else if (type === "TRANSFER") {
      if (tx.toAccountId === targetAccountId) netTxns += amt;
      if (tx.fromAccountId === targetAccountId || (!tx.fromAccountId && tx.accountId === targetAccountId)) {
        netTxns -= amt;
      }
    }
  }

  const currentCalculatedBalance = accountOpeningBalance + netTxns;
  const discrepancy = bankAvailableBalance - currentCalculatedBalance;
  const wasAdjusted = Math.abs(discrepancy) > 0.01;
  const reconciledOpeningBalance = wasAdjusted ? accountOpeningBalance + discrepancy : accountOpeningBalance;

  return {
    reconciledOpeningBalance,
    discrepancy,
    wasAdjusted,
  };
}

/**
 * Fast-speech voice phrase parser for rapid merchant + amount detection.
 */
export function parseFastSpeechVoicePhrase(phrase: string): { amount: number; merchant: string } | null {
  let cleaned = phrase.trim();
  // Fast speech normalization: split concatenated words and numbers
  cleaned = cleaned.replace(/([a-zA-Z]+)(\d+)/g, "$1 $2");
  cleaned = cleaned.replace(/(\d+)([a-zA-Z]+)/g, "$1 $2");
  const lower = cleaned.toLowerCase();

  const amtMatch = lower.match(/(?:(?:rs\.?|inr|₹)\s*)?(\b\d+(?:\.\d+)?)\b/);
  if (!amtMatch) return null;
  const amount = parseFloat(amtMatch[1]);
  if (isNaN(amount) || amount <= 0) return null;

  const m1 = lower.match(/^([a-z\s'\-]+?)\s+(?:rs\.?|inr|₹)?\s*\d+\b/);
  const m2 = lower.match(/^(?:rs\.?|inr|₹)?\s*\d+\s+([a-z\s'\-]+?)$/);
  const cand = m1 ? m1[1].trim() : m2 ? m2[1].trim() : "";
  const merchant = cand
    ? cand.split(/\s+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ")
    : "Expense";

  return { amount, merchant };
}

// Re-export all universal auto-track capabilities
export * from "../services/autoTrack";

