import {
  AccountMatchCandidate,
  AccountMatchResult,
  NormalizedTransaction,
  ExtractedSuffix,
} from "./types";
import { getUniversalBankAliases } from "./bankIdentifier";

/**
 * Checks if an account matches the bank institution name or code.
 */
function accountMatchesBank(
  acc: AccountMatchCandidate,
  bankNameOrCode?: string,
): boolean {
  if (!bankNameOrCode) return false;
  const aliases = getUniversalBankAliases(bankNameOrCode);
  const nameLower = (acc.name || "").toLowerCase();
  const displayLower = (acc.displayName || "").toLowerCase();
  return aliases.some(
    (alias) => nameLower.includes(alias) || displayLower.includes(alias),
  );
}

/**
 * Checks if an account matches an extracted suffix with strict card vs account distinction.
 */
function accountMatchesSuffix(
  acc: AccountMatchCandidate,
  extractedSuffix: ExtractedSuffix,
): { matches: boolean; isCardMatch: boolean; isAccountSuffixMatch: boolean } {
  const val = extractedSuffix.value.trim();
  const accNum = acc.accountNumberLast4?.trim();
  const cardNum = acc.cardLast4?.trim();
  const legacySuffix = acc.accountSuffix?.trim();
  const nameLower = (acc.name || "").toLowerCase();
  const isCreditType = (acc.type || "").toUpperCase() === "CREDIT";

  // 1. If extracted as CARD
  if (extractedSuffix.type === "card") {
    // Exact cardLast4 match
    if (cardNum && cardNum === val) {
      return { matches: true, isCardMatch: true, isAccountSuffixMatch: false };
    }
    // If it's a CREDIT account and legacy suffix matches
    if (isCreditType && legacySuffix && legacySuffix === val) {
      return { matches: true, isCardMatch: true, isAccountSuffixMatch: false };
    }
    // If account name mentions card and ending digits
    if (nameLower.includes("card") && nameLower.includes(val)) {
      return { matches: true, isCardMatch: true, isAccountSuffixMatch: false };
    }
    // Strictly do NOT match pure bank account number when card was extracted!
    return { matches: false, isCardMatch: false, isAccountSuffixMatch: false };
  }

  // 2. If extracted as BANK ACCOUNT
  if (extractedSuffix.type === "bank_account") {
    // Exact accountNumberLast4 match
    if (accNum && accNum === val) {
      return { matches: true, isCardMatch: false, isAccountSuffixMatch: true };
    }
    // Legacy suffix match on non-credit account
    if (!isCreditType && legacySuffix && legacySuffix === val) {
      return { matches: true, isCardMatch: false, isAccountSuffixMatch: true };
    }
    // Account name contains suffix
    if (nameLower.includes(val) && !isCreditType) {
      return { matches: true, isCardMatch: false, isAccountSuffixMatch: true };
    }
    // Strictly do NOT match credit card cardLast4 when bank account was extracted!
    return { matches: false, isCardMatch: false, isAccountSuffixMatch: false };
  }

  // 3. If extracted as UNKNOWN (generic mask e.g. XX1234)
  if (cardNum && cardNum === val) {
    return { matches: true, isCardMatch: true, isAccountSuffixMatch: false };
  }
  if (accNum && accNum === val) {
    return { matches: true, isCardMatch: false, isAccountSuffixMatch: true };
  }
  if (legacySuffix && legacySuffix === val) {
    return {
      matches: true,
      isCardMatch: isCreditType,
      isAccountSuffixMatch: !isCreditType,
    };
  }
  if (nameLower.includes(val)) {
    return {
      matches: true,
      isCardMatch: isCreditType || nameLower.includes("card"),
      isAccountSuffixMatch: !isCreditType,
    };
  }

  return { matches: false, isCardMatch: false, isAccountSuffixMatch: false };
}

/**
 * Universal Conservative Account Resolver
 * Matches a NormalizedTransaction against user accounts with zero guessing.
 */
export function resolveAccountForTransaction<
  T extends AccountMatchCandidate = AccountMatchCandidate,
>(transaction: NormalizedTransaction, accounts: T[]): AccountMatchResult<T> {
  if (!accounts || accounts.length === 0) {
    return {
      status: "unmatched",
      matchedAccount: null,
      confidence: 0,
      reason: "No user accounts registered",
    };
  }

  // Filter eligible accounts: must be active, never cash
  const eligibleAccounts = accounts.filter(
    (a) => a.isActive !== false && (a.type || "").toUpperCase() !== "CASH",
  );

  if (eligibleAccounts.length === 0) {
    return {
      status: "unmatched",
      matchedAccount: null,
      confidence: 0,
      reason: "No active non-cash accounts available",
    };
  }

  const { bankName, institutionCode, extractedSuffix, paymentChannel } =
    transaction;
  const bankRef = institutionCode || bankName;

  // PRIORITY 1: Bank Match AND Suffix Match
  if (extractedSuffix && bankRef) {
    const bankAndSuffixMatches = eligibleAccounts.filter((acc) => {
      const bMatch = accountMatchesBank(acc, bankRef);
      const sMatch = accountMatchesSuffix(acc, extractedSuffix);
      return bMatch && sMatch.matches;
    });

    if (bankAndSuffixMatches.length === 1) {
      const match = bankAndSuffixMatches[0];
      const sInfo = accountMatchesSuffix(match, extractedSuffix);
      return {
        status: "matched",
        matchedAccount: match,
        confidence: 0.99,
        reason: "Matched bank and exact ending digits",
        isCardMatch: sInfo.isCardMatch,
        isAccountSuffixMatch: sInfo.isAccountSuffixMatch,
      };
    }

    if (bankAndSuffixMatches.length > 1) {
      return {
        status: "ambiguous",
        matchedAccount: null,
        confidence: 0.5,
        reason: "Multiple accounts share the same bank and ending digits",
        suggestedAccounts: bankAndSuffixMatches,
      };
    }
  }

  // PRIORITY 2: Suffix Match ONLY (e.g., bank name wasn't detected or custom account)
  if (extractedSuffix) {
    const suffixMatches = eligibleAccounts.filter(
      (acc) => accountMatchesSuffix(acc, extractedSuffix).matches,
    );

    if (suffixMatches.length === 1) {
      const match = suffixMatches[0];
      const sInfo = accountMatchesSuffix(match, extractedSuffix);
      return {
        status: "matched",
        matchedAccount: match,
        confidence: 0.88,
        reason: "Uniquely matched ending digits across accounts",
        isCardMatch: sInfo.isCardMatch,
        isAccountSuffixMatch: sInfo.isAccountSuffixMatch,
      };
    }

    if (suffixMatches.length > 1) {
      return {
        status: "ambiguous",
        matchedAccount: null,
        confidence: 0.5,
        reason: "Multiple accounts match ending digits. Please select an account.",
        suggestedAccounts: suffixMatches,
      };
    }
  }

  // PRIORITY 3: Bank Match ONLY (suffix was unavailable in SMS)
  if (bankRef) {
    let bankMatches = eligibleAccounts.filter((acc) =>
      accountMatchesBank(acc, bankRef),
    );

    // If channel is CREDIT_CARD, prioritize credit card accounts
    if (paymentChannel === "CREDIT_CARD") {
      const creditBankMatches = bankMatches.filter(
        (a) => (a.type || "").toUpperCase() === "CREDIT",
      );
      if (creditBankMatches.length > 0) {
        bankMatches = creditBankMatches;
      }
    }

    if (bankMatches.length === 1) {
      return {
        status: "matched",
        matchedAccount: bankMatches[0],
        confidence: 0.75,
        reason: "Uniquely matched single account for this bank",
      };
    }

    if (bankMatches.length > 1) {
      // Do NOT guess across multiple accounts of the same bank!
      return {
        status: "ambiguous",
        matchedAccount: null,
        confidence: 0.4,
        reason: `Multiple accounts found for ${bankName || bankRef}. Please select the account.`,
        suggestedAccounts: bankMatches,
      };
    }
  }

  // PRIORITY 4: No match
  return {
    status: "unmatched",
    matchedAccount: null,
    confidence: 0,
    reason: "No matching account found for this transaction",
  };
}

