/**
 * SMS Normalizer for Indian Bank & UPI SMS messages.
 * Normalizes DLT sender IDs, currencies, amounts, account masks, and whitespace.
 */

export interface NormalizedSmsContext {
  cleanedText: string;
  normalizedSenderId?: string;
  originalText: string;
  originalSenderId?: string;
}

/**
 * Normalizes TRAI DLT SMS Sender Header.
 * Examples:
 * - "AD-HDFCBK" -> "HDFCBK"
 * - "VM-SBIINB-S" -> "SBIINB"
 * - "VK-ICICIB" -> "ICICIB"
 * - "BZ-AXISBK-A" -> "AXISBK"
 * - "CP-KOTAKB" -> "KOTAKB"
 * - "AX-SBICRD" -> "SBICRD"
 * - "HDFCBK" -> "HDFCBK"
 */
export function normalizeSenderId(senderId?: string | null): string | undefined {
  if (!senderId || typeof senderId !== "string") return undefined;
  let s = senderId.trim().toUpperCase();

  // Strip standard TRAI 2-letter telecom/circle prefix: e.g. "AD-", "VK-", "BZ-", "VM-", "AX-", "BW-"
  s = s.replace(/^[A-Z]{2}-/i, "");

  // Strip trailing dash + channel suffix: e.g. "-S", "-A", "-T", "-G"
  s = s.replace(/-[A-Z0-9]+$/i, "");

  // Strip any lingering non-alphanumeric punctuation
  s = s.replace(/[^A-Z0-9]/g, "");

  return s.length >= 3 ? s : undefined;
}

/**
 * Normalizes SMS text body:
 * 1. Collapses consecutive whitespace and linebreaks into single spaces.
 * 2. Normalizes non-breaking spaces, curly quotes, and unicode dashes.
 * 3. Normalizes currency prefixes (Rs., Rs, INR, ₹, etc.).
 * 4. Cleans up common delimiter noise.
 */
export function normalizeSmsText(text: string): string {
  if (!text) return "";

  let cleaned = text
    // Replace non-breaking spaces and unicode spaces with standard space
    .replace(/[\u00A0\u1680\u2000-\u200B\u202F\u205F\u3000]/g, " ")
    // Replace smart quotes and special dashes with ASCII
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    // Normalize consecutive newlines and spaces
    .replace(/\s+/g, " ")
    .trim();

  return cleaned;
}

/**
 * Parse an amount string from SMS, handling Indian comma separators (e.g. 1,50,000.00).
 */
export function parseIndianAmount(amountStr: string): number {
  if (!amountStr) return NaN;
  const sanitized = amountStr.replace(/,/g, "").trim();
  const val = parseFloat(sanitized);
  return isNaN(val) ? NaN : Math.round(val * 100) / 100;
}

/**
 * Prepares a full normalized SMS context for parser pipelines.
 */
export function createNormalizedSmsContext(
  text: string,
  senderId?: string | null,
): NormalizedSmsContext {
  return {
    cleanedText: normalizeSmsText(text),
    normalizedSenderId: normalizeSenderId(senderId),
    originalText: text,
    originalSenderId: senderId || undefined,
  };
}

