import {
  NormalizedTransaction,
  ExtractedSuffix,
  SuffixType,
} from "./types";
import { parseIndianAmount, createNormalizedSmsContext } from "./smsNormalizer";
import { identifyBank } from "./bankIdentifier";
import { classifyTransaction } from "./transactionClassifier";
import { validateTransactionSafety } from "./transactionSafetyValidator";

/**
 * Extracts card or bank account ending digits with strict type distinction.
 * Never guesses card when account is indicated, and vice versa.
 */
export function extractSuffix(text: string): ExtractedSuffix | undefined {
  if (!text) return undefined;

  // 1. Strict Card pattern matches
  // e.g., "card ending 9136", "credit card ending with 9136", "card no. ending 9136", "card **9136", "card ending in 9136"
  const cardMatch =
    text.match(/\b(?:credit\s+card|debit\s+card|card)\s*(?:no\.?|number)?\s*(?:ending\s+(?:with|in)?\s*)?[x*#\s.]*([0-9]{3,6})\b/i) ||
    text.match(/\b(?:card)\s+[x*#]{2,}([0-9]{3,6})\b/i);

  if (cardMatch) {
    return {
      value: cardMatch[1],
      type: "card",
      rawMatch: cardMatch[0],
    };
  }

  // 2. Strict Bank Account pattern matches
  // e.g., "a/c ending 4821", "account ending with 4821", "a/c no. ending in 4821", "A/c *4821", "A/c XX4821"
  const accMatch =
    text.match(/\b(?:a\/c|acct?|account)\s*(?:no\.?|number)?\s*(?:ending\s+(?:with|in)?\s*)?[x*#\s.]*([0-9]{3,6})\b/i) ||
    text.match(/\b(?:in|from)\s+a\/?c\s+[x*#\s.]*([0-9]{3,6})\b/i);

  if (accMatch) {
    return {
      value: accMatch[1],
      type: "bank_account",
      rawMatch: accMatch[0],
    };
  }

  // 3. Masked digits pattern where context is unspecified
  // e.g. "XX4821" or "**9136"
  const genericMaskMatch = text.match(/\b[x*#]{2,}([0-9]{3,6})\b/i);
  if (genericMaskMatch) {
    return {
      value: genericMaskMatch[1],
      type: "unknown",
      rawMatch: genericMaskMatch[0],
    };
  }

  return undefined;
}

/**
 * Extracts available balance from SMS text, avoiding transaction amount.
 */
export function extractAvailableBalance(text: string): number | undefined {
  const balMatch =
    text.match(
      /\b(?:avail(?:able)?\s*bal(?:ance)?|avl(?:\.?)?\s*bal(?:ance)?|clear\s*bal(?:ance)?|total\s*bal(?:ance)?|bal(?:ance)?)\s*(?:is|:)?\s*(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i,
    ) ||
    text.match(
      /(?:avail(?:able)?|avl\.?)?\s*balance\s+(?:in\s+a\/?c\s+[^\s]+\s+)?is\s*(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i,
    );

  if (balMatch) {
    const val = parseIndianAmount(balMatch[1]);
    if (!isNaN(val)) return val;
  }
  return undefined;
}

/**
 * Extracts transaction amount from SMS text.
 */
export function extractTransactionAmount(text: string): number | null {
  // Explicit action + amount matches
  const actionMatch = text.match(
    /\b(?:debited|paid|spent|sent|transferred|credited|refunded|charged|txn\s+of)\s+(?:by|for|with|of)?\s*(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i,
  );
  if (actionMatch) {
    const val = parseIndianAmount(actionMatch[1]);
    if (!isNaN(val) && val > 0) return val;
  }

  // Standard prefix: "Rs 500" or "Rs. 1,500.00" or "INR 500" or "₹ 250"
  // Exclude balances
  const withoutBalance = text.replace(
    /\b(?:avail(?:able)?\s*bal(?:ance)?|avl(?:\.?)?\s*bal(?:ance)?|bal(?:ance)?)\s*(?:is|:)?\s*(?:rs\.?|inr|₹)?\s*[\d,]+(?:\.\d{1,2})?/gi,
    "",
  );

  const prefixMatch =
    withoutBalance.match(/(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)/i) ||
    withoutBalance.match(/([\d,]+(?:\.\d{1,2})?)\s*(?:rs\.?|inr|₹)/i);

  if (prefixMatch) {
    const val = parseIndianAmount(prefixMatch[1]);
    if (!isNaN(val) && val > 0) return val;
  }

  return null;
}

/**
 * Cleans extracted merchant name, stripping trailing dates, punctuation, and reference tags.
 */
export function cleanMerchantName(raw: string): string {
  let cleaned = raw
    .replace(/\b(?:on|dated)\s+\d{1,2}[-/][A-Za-z0-9]+[-/]\d{2,4}\b.*$/i, "")
    .replace(/\b(?:on|dated)\s+\d{1,2}\s+[A-Za-z]{3}\b.*$/i, "")
    .replace(/\b(?:ref|rrn|utr|upi\s*ref|id)\s*[:#-]?\s*[A-Za-z0-9]+.*$/i, "")
    .replace(/\b(?:avl|avail|bal|balance|a\/c|account)\b.*$/i, "")
    .replace(/[.,;:]+$/, "")
    .trim();

  // If starts with "VPA ", strip it
  cleaned = cleaned.replace(/^vpa\s+/i, "");

  return cleaned.length > 0 ? cleaned : "Expense";
}

/**
 * Universal Transaction Parser
 * Parses any Indian bank SMS, extracts all core attributes, validates safety,
 * identifies institutions, classifies channels, and produces a NormalizedTransaction.
 */
export function parseUniversalSms(
  text: string,
  senderId?: string | null,
): NormalizedTransaction | null {
  if (!text || text.trim().length === 0) return null;

  // 1. Safety check
  const safety = validateTransactionSafety(text);
  if (!safety.isTransaction) {
    return null;
  }

  // 2. Normalize SMS text and sender ID
  const ctx = createNormalizedSmsContext(text, senderId);

  // 3. Extract transaction amount
  const amount = extractTransactionAmount(ctx.cleanedText);
  if (!amount || isNaN(amount) || amount <= 0) {
    return null;
  }

  // 4. Identify Bank / Financial Institution
  let bankResult = identifyBank(ctx.cleanedText, ctx.normalizedSenderId);

  // 5. Classify Direction, Channel, Lifecycle
  const classification = classifyTransaction(ctx.cleanedText);

  // If transfer, check from-bank if bank was not identified from sender
  if (classification.direction === "TRANSFER" && !bankResult.institution) {
    const fromBankMatch = ctx.cleanedText.match(
      /\bfrom\s+([A-Za-z\s&.-]{2,30}?)(?:\s+a\/?c|\s+account|\s+to|\.|\,|$)/i,
    );
    if (fromBankMatch) {
      const fromInst = identifyBank(fromBankMatch[1].trim());
      if (fromInst.institution) {
        bankResult = fromInst;
      }
    }
  }

  // 6. Extract Suffix (strict card vs account)
  let extractedSuffix = extractSuffix(ctx.cleanedText);
  if (classification.direction === "TRANSFER") {
    const fromSuffixMatch = ctx.cleanedText.match(
      /\bfrom\s+.*?\b(?:a\/c|account)[x*#\s.]*([0-9]{3,6})\b/i,
    );
    if (fromSuffixMatch) {
      extractedSuffix = {
        value: fromSuffixMatch[1],
        type: "bank_account",
        rawMatch: fromSuffixMatch[0],
      };
    }
  }

  // 7. Extract Available Balance
  const availableBalance = extractAvailableBalance(ctx.cleanedText);

  // 8. Extract Reference ID (UPI Ref, RRN, UTR, IMPS Ref, Ref No)
  let referenceId: string | undefined;
  const refMatch = ctx.cleanedText.match(
    /(?:UPI\s*(?:ref(?:erence)?|rrn|id)?|IMPS\s*ref|Ref\s*(?:no\.?|reference)?|rrn|utr|txn\s*(?:id|ref))\s*[:#-]?\s*([A-Za-z0-9]{8,22})/i,
  );
  if (refMatch) {
    referenceId = refMatch[1];
  }

  // 9. Extract Destination Bank / Account for Transfers
  let toBankName: string | undefined;
  let toAccountSuffix: string | undefined;
  if (classification.direction === "TRANSFER") {
    const toBankMatch = ctx.cleanedText.match(
      /\bto\s+([A-Za-z\s&.-]{2,30}?)(?:\s+a\/?c|\s+account|\.|\,|$)/i,
    );
    if (toBankMatch) {
      toBankName = toBankMatch[1].trim();
    }
    const toSuffixMatch = ctx.cleanedText.match(
      /\bto\s+.*?\b(?:a\/c|account)[x*#\s.]*([0-9]{3,6})\b/i,
    );
    if (toSuffixMatch) {
      toAccountSuffix = toSuffixMatch[1];
    }
  }

  // 10. Extract Merchant
  let rawMerchant = "Bank Transaction";
  if (classification.direction === "TRANSFER") {
    rawMerchant = toBankName ? `Transfer to ${toBankName}` : "Account Transfer";
  } else if (classification.direction === "REFUND") {
    const refundMatch = ctx.cleanedText.match(
      /\b(?:from|for|at)\s+([A-Za-z0-9\s&'@._-]{2,30}?)(?:\s+order|\s+txn|\s+dated|\s+via|\s+a\/c|\.|\,|$)/i,
    );
    rawMerchant = refundMatch ? `${refundMatch[1].trim()} Refund` : "Refund";
  } else if (classification.direction === "INCOME") {
    rawMerchant = ctx.cleanedText.toLowerCase().includes("salary") ? "Salary" : "Income";
  } else {
    // Expense: look for payee
    const payeeMatch =
      ctx.cleanedText.match(
        /\b(?:to\s+(?:VPA\s+)?|paid\s+to\s+|for\s+UPI\s+payment\s+to\s+|spent\s+at\s+|at\s+)([A-Za-z0-9\s&'@._-]{2,35}?)(?:\s+on|\s+dated|\s+via|\s+using|\.|\,|$)/i,
      ) ||
      ctx.cleanedText.match(
        /\b(?:towards)\s+([A-Za-z0-9\s&'@._-]{2,30}?)(?:\s+on|\s+dated|\.|\,|$)/i,
      );

    if (payeeMatch) {
      rawMerchant = payeeMatch[1].trim();
    } else {
      rawMerchant = "Expense";
    }
  }

  const cleanMerchant = cleanMerchantName(rawMerchant);

  // Confidence calculation
  let confidence = 0.8;
  if (bankResult.institution) confidence += 0.1;
  if (extractedSuffix) confidence += 0.05;
  if (referenceId) confidence += 0.05;

  const txnId = `txn-auto-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  return {
    id: txnId,
    amount,
    currency: "INR",
    direction: classification.direction,
    paymentChannel: classification.paymentChannel,
    lifecycleStatus: classification.lifecycleStatus,
    merchant: rawMerchant,
    cleanMerchant,
    bankName: bankResult.institution?.name,
    institutionCode: bankResult.institution?.code,
    extractedSuffix,
    toBankName,
    toAccountSuffix,
    availableBalance,
    referenceId,
    timestamp: Date.now(),
    rawSenderId: ctx.normalizedSenderId,
    rawText: text,
    confidence: Math.min(1.0, confidence),
  };
}
