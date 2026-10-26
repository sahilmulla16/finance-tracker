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
 * Normalizes card suffixes strictly to 4-digit strings.
 */
export function extractSuffix(text: string): ExtractedSuffix | undefined {
  if (!text) return undefined;

  // 1. Strict Card pattern matches
  // Matches: "card ending 3458", "Card ending 3458", "Credit Card ending 3458", "Debit Card XX3458",
  // "Card No. XXXX XXXX XXXX 3458", "card ending in 3458", "card ending with 3458", "card **3458", etc.
  const cardMatch =
    text.match(
      /\b(?:credit\s+card|debit\s+card|card)\s*(?:no\.?|number)?\s*(?:ending\s+(?:with|in)?\s*)?[x*#\s.]*([0-9]{3,6})\b/i,
    ) ||
    text.match(/\b(?:credit\s+card|debit\s+card|card)\s+[x*#]{2,}([0-9]{3,6})\b/i) ||
    text.match(
      /\b(?:spent\s+on|charged\s+to|used)\s+(?:your\s+)?card\s*(?:ending\s+(?:with|in)?\s*)?[x*#\s.]*([0-9]{3,6})\b/i,
    );

  if (cardMatch) {
    const rawVal = cardMatch[1];
    const value = rawVal.length > 4 ? rawVal.slice(-4) : rawVal;
    return {
      value,
      type: "card",
      rawMatch: cardMatch[0],
    };
  }

  // 2. Strict Bank Account pattern matches
  // e.g., "a/c ending 4821", "account ending with 4821", "a/c no. ending in 4821", "A/c *4821", "A/c XX4821"
  const accMatch =
    text.match(
      /\b(?:a\/c|acct?|account)\s*(?:no\.?|number)?\s*(?:ending\s+(?:with|in)?\s*)?[x*#\s.]*([0-9]{3,6})\b/i,
    ) ||
    text.match(/\b(?:in|from|to)\s+a\/?c\s+[x*#\s.]*([0-9]{3,6})\b/i);

  if (accMatch) {
    const rawVal = accMatch[1];
    const value = rawVal.length > 4 ? rawVal.slice(-4) : rawVal;
    return {
      value,
      type: "bank_account",
      rawMatch: accMatch[0],
    };
  }

  // 3. Masked digits pattern where context is unspecified
  // e.g. "XX4821" or "**9136"
  const genericMaskMatch = text.match(/\b[x*#]{2,}([0-9]{3,6})\b/i);
  if (genericMaskMatch) {
    const rawVal = genericMaskMatch[1];
    const value = rawVal.length > 4 ? rawVal.slice(-4) : rawVal;
    return {
      value,
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
/**
 * Infers an expense category from merchant name and SMS context.
 */
export function inferExpenseCategory(merchant: string, text: string): string | undefined {
  const combined = `${merchant} ${text}`.toLowerCase();
  if (/\b(?:swiggy|zomato|starbucks|mcdonalds|kfc|dominos|pizza|burger|cafe|restaurant|food|dining|eatclub|eats)\b/i.test(combined)) {
    return "Food & Dining";
  }
  if (/\b(?:amazon|flipkart|myntra|zara|h&m|croma|reliance\s+digital|shopping|retail|mall|store)\b/i.test(combined)) {
    return "Shopping";
  }
  if (/\b(?:uber|ola|rapido|metro|fuel|petrol|diesel|shell|hpcl|bpcl|iocl)\b/i.test(combined)) {
    return "Transportation";
  }
  if (/\b(?:netflix|spotify|hotstar|prime|cinema|pvr|inox|movie|entertainment)\b/i.test(combined)) {
    return "Entertainment";
  }
  if (/\b(?:electricity|water|gas|broadband|wifi|airtel|jio|vi|bill|recharge)\b/i.test(combined)) {
    return "Bills & Utilities";
  }
  if (/\b(?:pharmacy|apollo|medplus|netmeds|hospital|clinic|doctor|health|medical)\b/i.test(combined)) {
    return "Health";
  }
  if (/\b(?:blinkit|zepto|instamart|bigbasket|grofers|supermarket|grocery|groceries)\b/i.test(combined)) {
    return "Groceries";
  }
  return undefined;
}

export function cleanMerchantName(raw: string): string {
  let cleaned = raw
    .replace(/\b(?:on|dated)\s+\d{1,2}[-/][A-Za-z0-9]+[-/]\d{2,4}\b.*$/i, "")
    .replace(/\b(?:on|dated)\s+\d{1,2}\s+[A-Za-z]{3}\b.*$/i, "")
    .replace(/\b(?:ref|rrn|utr|upi\s*ref|id)\s*[:#-]?\s*[A-Za-z0-9]+.*$/i, "")
    .replace(/\b(?:avl|avail|bal|balance|a\/c|account)\b.*$/i, "")
    .replace(/\b(?:via\s+upi|using\s+upi|through\s+upi)\b.*$/i, "")
    .replace(/\b(?:for|towards)\s+[A-Za-z0-9\s]+$/i, "")
    .replace(/[.,;:]+$/, "")
    .trim();

  // If starts with "VPA ", strip it
  cleaned = cleaned.replace(/^vpa\s+/i, "");

  return cleaned.length > 0 ? cleaned : "Expense";
}

/**
 * Cleans and formats extracted counterparty / sender name.
 */
export function cleanCounterpartyName(raw: string, isIncoming = false): string {
  if (!raw) return isIncoming ? "Unknown Sender" : "Unknown Merchant";

  let cleaned = raw
    .replace(/\b(?:on|dated)\s+\d{1,2}[-/][A-Za-z0-9]+[-/]\d{2,4}\b.*$/i, "")
    .replace(/\b(?:on|dated)\s+\d{1,2}\s+[A-Za-z]{3}\b.*$/i, "")
    .replace(/\b(?:ref|rrn|utr|upi\s*ref|id)\s*[:#-]?\s*[A-Za-z0-9]+.*$/i, "")
    .replace(/\b(?:avl|avail|bal|balance|a\/c|account)\b.*$/i, "")
    .replace(/\b(?:via\s+upi|using\s+upi|through\s+upi)\b.*$/i, "")
    .replace(/\b(?:for|towards)\s+[A-Za-z0-9\s]+$/i, "")
    .replace(/[.,;:]+$/, "")
    .trim();

  // Strip VPA prefix if present
  cleaned = cleaned.replace(/^vpa\s+/i, "");

  // If handle contains @, extract the name portion
  if (cleaned.includes("@")) {
    const handleParts = cleaned.split("@");
    if (handleParts[0] && handleParts[0].length >= 2) {
      cleaned = handleParts[0].trim();
    }
  }

  // Never use generic bank or channel names as person name
  const isGeneric = /^(?:bank|upi|imps|neft|rtgs|hdfc|sbi|icici|axis|kotak|paytm|phonepe|gpay|google pay)$/i.test(
    cleaned,
  );
  if (isGeneric || cleaned.length === 0) {
    return isIncoming ? "Unknown Sender" : "Unknown Merchant";
  }

  return cleaned;
}

/**
 * Universal Transaction Parser
 * Parses any Indian bank SMS, extracts all core attributes, validates safety,
 * identifies institutions, classifies channels, extracts senders/recipients,
 * and produces a NormalizedTransaction.
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
      const rawVal = fromSuffixMatch[1];
      extractedSuffix = {
        value: rawVal.length > 4 ? rawVal.slice(-4) : rawVal,
        type: "bank_account",
        rawMatch: fromSuffixMatch[0],
      };
    }
  }

  // Populate explicit cardLast4 and accountNumberLast4
  let cardLast4: string | undefined;
  let accountNumberLast4: string | undefined;
  if (extractedSuffix) {
    if (extractedSuffix.type === "card") {
      cardLast4 = extractedSuffix.value.slice(-4);
    } else if (extractedSuffix.type === "bank_account") {
      accountNumberLast4 = extractedSuffix.value.slice(-4);
    } else {
      accountNumberLast4 = extractedSuffix.value.slice(-4);
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
      const cand = toBankMatch[1].trim();
      const inst = identifyBank(cand);
      if (inst.institution) {
        toBankName = inst.institution.name;
      }
    }
    const toSuffixMatch = ctx.cleanedText.match(
      /\bto\s+.*?\b(?:a\/c|account)[x*#\s.]*([0-9]{3,6})\b/i,
    );
    if (toSuffixMatch) {
      const rawVal = toSuffixMatch[1];
      toAccountSuffix = rawVal.length > 4 ? rawVal.slice(-4) : rawVal;
    }

    // Safety downgrade: If toBankName was NOT a recognized bank and not explicit self-transfer,
    // this is a payment to a third party (EXPENSE), NOT an internal transfer!
    if (!toBankName && !/\b(?:self|own|between)\b/i.test(ctx.cleanedText)) {
      classification.direction = "EXPENSE";
    }
  }

  // 10. Extract Merchant / Sender / Counterparty
  let rawMerchant = "Bank Transaction";
  let counterparty: string | undefined;
  let payerName: string | undefined;
  let payeeName: string | undefined;
  let merchantCategory: string | undefined;

  if (classification.direction === "TRANSFER") {
    rawMerchant = toBankName ? `Transfer to ${toBankName}` : "Account Transfer";
    merchantCategory = "Transfer";
    counterparty = toBankName || "Self Account";
  } else if (classification.direction === "REFUND") {
    const refundMatch = ctx.cleanedText.match(
      /\b(?:from|for|at)\s+([A-Za-z0-9\s&'@._-]{2,30}?)(?:\s+order|\s+txn|\s+dated|\s+via|\s+a\/c|\.|\,|$)/i,
    );
    rawMerchant = refundMatch ? `${refundMatch[1].trim()} Refund` : "Refund";
    merchantCategory = "Refund";
    counterparty = refundMatch ? refundMatch[1].trim() : "Merchant Refund";
  } else if (classification.direction === "INCOME") {
    // Incoming money: Extract payer / sender
    // E.g. "Rs. 2,000 credited to your account from Raeesa Mulla."
    // E.g. "You have received Rs. 750 from Raeesa Mulla via UPI."
    // E.g. "Sent by Raeesa Mulla: Rs. 2,000 credited to your account."
    const senderMatch =
      ctx.cleanedText.match(
        /\b(?:from|received\s+from|by\s+transfer\s+from|transfer\s+from)\s+([A-Za-z0-9\s&'@._-]{2,40}?)(?:\s+via|\s+through|\s+using|\s+on|\s+dated|\s+a\/c|\s+account|\.|\,|$|credited)/i,
      ) ||
      ctx.cleanedText.match(
        /\b(?:sent\s+by)\s+([A-Za-z0-9\s&'@._-]{2,40}?)(?:\s*:|\s+to|\s+on|\s+dated|\s+a\/c|\.|\,|$|credited)/i,
      );

    const extractedSender = senderMatch
      ? cleanCounterpartyName(senderMatch[1].trim(), true)
      : "Unknown Sender";

    // Determine merchant and category:
    // IMPORTANT: A person's name must NEVER be the category!
    if (ctx.cleanedText.toLowerCase().includes("salary")) {
      rawMerchant = "Salary";
      merchantCategory = "Salary";
      payerName = extractedSender !== "Unknown Sender" ? extractedSender : "Salary";
      counterparty = extractedSender !== "Unknown Sender" ? extractedSender : "Salary";
    } else if (/\b(?:dividend|interest|bonus)\b/i.test(ctx.cleanedText)) {
      rawMerchant = extractedSender !== "Unknown Sender" ? extractedSender : "Investments";
      merchantCategory = "Investments";
      payerName = extractedSender;
      counterparty = extractedSender;
    } else {
      rawMerchant = extractedSender !== "Unknown Sender" ? extractedSender : "Income";
      merchantCategory = "Other Income";
      payerName = extractedSender;
      counterparty = extractedSender;
    }
  } else {
    // EXPENSE: look for payee / merchant
    const payeeMatch =
      ctx.cleanedText.match(
        /\b(?:transfer(?:red)?\s+(?:of\s+(?:rs\.?|inr|₹)?\s*[\d,]+.*?\s+)?to\s+|sent\s+(?:(?:rs\.?|inr|₹)?\s*[\d,]+.*?\s+)?to\s+|to\s+(?:VPA\s+)?|paid\s+to\s+|for\s+UPI\s+payment\s+to\s+|spent\s+at\s+|used\s+at\s+|at\s+)([A-Za-z0-9\s&'@._-]{2,35}?)(?:\s+on|\s+dated|\s+via|\s+using|\.|\,|$)/i,
      ) ||
      ctx.cleanedText.match(
        /\b(?:towards)\s+([A-Za-z0-9\s&'@._-]{2,30}?)(?:\s+on|\s+dated|\.|\,|$)/i,
      );

    if (payeeMatch) {
      const extractedPayee = cleanMerchantName(payeeMatch[1].trim());
      payeeName = extractedPayee;
      counterparty = extractedPayee;
      rawMerchant = extractedPayee;
      merchantCategory = inferExpenseCategory(extractedPayee, ctx.cleanedText);
    } else {
      const fallbackDesc = bankResult.institution?.name
        ? `${bankResult.institution.name} Transaction`
        : (extractedSuffix?.type === "card" ? "Card Transaction" : "Expense");
      payeeName = fallbackDesc;
      counterparty = fallbackDesc;
      rawMerchant = fallbackDesc;
      merchantCategory = inferExpenseCategory("", ctx.cleanedText);
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
    isDirectionAmbiguous: classification.isDirectionAmbiguous,
    paymentChannel: classification.paymentChannel,
    lifecycleStatus: classification.lifecycleStatus,
    merchant: rawMerchant,
    cleanMerchant,
    merchantCategory,
    counterparty,
    payerName,
    payeeName,
    cardLast4,
    accountNumberLast4,
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
