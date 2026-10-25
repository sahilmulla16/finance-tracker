/**
 * Local Merchant Normalization Utility for Zeno
 *
 * Normalizes transaction descriptions / merchant names into consistent canonical keys
 * for accurate merchant memory without broad substring matching or false positives.
 */

export interface NormalizedMerchantResult {
  /** Canonical matching key, e.g. "rf petrol" */
  normalizedKey: string;
  /** Cleaned display name preserving meaningful casing if present, e.g. "RF PETROL" */
  displayName: string;
  /** True if the merchant name is too short or generic to safely form an automatic rule */
  isAmbiguous: boolean;
}

// Known bank-generated transaction prefixes
const BANK_PREFIXES = [
  /^(?:upi\/|upi-|upi\s+)/i,
  /^(?:pos\/|pos-|pos\s+)/i,
  /^(?:paid\s+to\s+|pay\s+to\s+|payment\s+to\s+|transfer\s+to\s+)/i,
  /^(?:purchase\s+at\s+|spent\s+at\s+)/i,
  /^(?:vpa\/|vpa\s+)/i,
  /^(?:imps\/|neft\/|rtgs\/)/i,
];

// Corporate / Legal entity suffixes
const ENTITY_SUFFIXES = [
  /\s+(?:pvt\.?\s*ltd\.?|private\s+limited|ltd\.?|limited|llp|inc\.?)$/i,
  /\s+(?:india|enterprises|retail|store|stores)$/i,
];

// UPI VPA handles (e.g., user@okaxis, merchant@paytm)
const UPI_HANDLE_REGEX = /@[a-zA-Z0-9.\-_]+$/i;

// Trailing bank reference numbers / terminal codes (e.g., /123456789012 or -98765)
const TRAILING_REF_REGEX = /[\/-]\d{5,18}$/;

// Generic / ambiguous terms that should never trigger automatic merchant rules
const GENERIC_MERCHANT_TERMS = new Set([
  "payment",
  "paid",
  "transfer",
  "expense",
  "income",
  "upi",
  "pos",
  "cash",
  "bank",
  "unknown",
  "other",
  "others",
  "self",
  "user",
  "account",
  "money",
  "debit",
  "credit",
  "bill",
  "purchase",
  "general",
]);

/**
 * Normalizes a raw merchant name or transaction description.
 *
 * Examples:
 * - "RF PETROL" -> normalizedKey: "rf petrol"
 * - "rf petrol" -> normalizedKey: "rf petrol"
 * - "RF  PETROL" -> normalizedKey: "rf petrol"
 * - "UPI/RF PETROL/91827364" -> normalizedKey: "rf petrol"
 * - "Paid to RF PETROL" -> normalizedKey: "rf petrol"
 * - "RF" -> isAmbiguous: true (too short, prevents false matches)
 */
export function normalizeMerchant(
  raw: string | undefined | null,
): NormalizedMerchantResult {
  if (!raw || typeof raw !== "string") {
    return { normalizedKey: "", displayName: "", isAmbiguous: true };
  }

  let text = raw.trim();
  if (!text) {
    return { normalizedKey: "", displayName: "", isAmbiguous: true };
  }

  // 1. Strip trailing bank reference / RRN numbers first if appended
  text = text.replace(TRAILING_REF_REGEX, "").trim();

  // 2. Strip known bank/payment prefixes
  for (const prefix of BANK_PREFIXES) {
    text = text.replace(prefix, "").trim();
  }

  // 3. Strip UPI VPA handles if appended to a merchant name
  text = text.replace(UPI_HANDLE_REGEX, "").trim();

  // 4. Strip corporate/legal entity suffixes
  for (const suffix of ENTITY_SUFFIXES) {
    text = text.replace(suffix, "").trim();
  }

  // 5. Clean punctuation differences: replace punctuation (.,-_'/*&) with spaces
  const cleanedPunctuation = text
    .replace(/[.,\-_'/*&\\#@:;!~]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleanedPunctuation) {
    return { normalizedKey: "", displayName: raw.trim(), isAmbiguous: true };
  }

  const normalizedKey = cleanedPunctuation.toLowerCase();

  // 6. Check for ambiguity
  // - Length < 3 (e.g. "RF", "AB", "12") is ambiguous to avoid overbroad matching
  // - Generic transaction words
  const isTooShort = normalizedKey.length < 3;
  const isGeneric = GENERIC_MERCHANT_TERMS.has(normalizedKey);
  const isNumericOnly = /^\d+$/.test(normalizedKey);
  const isAmbiguous = isTooShort || isGeneric || isNumericOnly;

  return {
    normalizedKey,
    displayName: cleanedPunctuation,
    isAmbiguous,
  };
}

/**
 * Checks if a candidate transaction merchant matches a normalized rule key.
 * Strictly uses exact canonical key matching — NO broad substring or regex fuzziness.
 */
export function isMerchantMatch(
  candidateMerchant: string | undefined | null,
  ruleKey: string,
): boolean {
  if (!candidateMerchant || !ruleKey) return false;
  const { normalizedKey, isAmbiguous } = normalizeMerchant(candidateMerchant);
  if (isAmbiguous) return false;
  return normalizedKey === ruleKey.trim().toLowerCase();
}

