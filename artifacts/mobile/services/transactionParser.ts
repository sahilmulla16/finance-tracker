import { suggestCategory } from "@/utils/categorySuggestions";
import { type Category } from "@/context/FinanceContext";
import { type DocumentType } from "./scanTypes";

export type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW";

export interface ParsedTransaction {
  id: string;
  merchant: string;
  amount: number;
  date: string; // YYYY-MM-DD
  time?: string;
  category: string;
  categoryId?: string;
  accountId?: string;
  type: "EXPENSE" | "INCOME" | "TRANSFER";
  currency: string;
  paymentMethod?: string;
  notes?: string;
  confidence: ConfidenceLevel;
  confidenceLabel: string;
  requiresReview?: boolean;
  documentType?: DocumentType;
  isPossibleDuplicate?: boolean;
  duplicateReason?: string;
  sourceType: "RECEIPT" | "STATEMENT_ROW" | "PAYMENT_RECEIPT" | "INVOICE";
  sourceImageUri?: string;
}

// Common merchant aliases and brand keywords
const KNOWN_MERCHANTS: Record<string, { name: string; categoryHint?: string }> = {
  // Food & Drinks
  starbucks: { name: "Starbucks", categoryHint: "Food & Drinks" },
  mcdonald: { name: "McDonald's", categoryHint: "Food & Drinks" },
  swiggy: { name: "Swiggy", categoryHint: "Food & Drinks" },
  zomato: { name: "Zomato", categoryHint: "Food & Drinks" },
  blinkit: { name: "Blinkit", categoryHint: "Groceries" },
  zepto: { name: "Zepto", categoryHint: "Groceries" },
  instamart: { name: "Instamart", categoryHint: "Groceries" },
  dunkin: { name: "Dunkin' Donuts", categoryHint: "Food & Drinks" },
  domino: { name: "Domino's", categoryHint: "Food & Drinks" },
  kfc: { name: "KFC", categoryHint: "Food & Drinks" },
  "burger king": { name: "Burger King", categoryHint: "Food & Drinks" },
  "pizza hut": { name: "Pizza Hut", categoryHint: "Food & Drinks" },
  subway: { name: "Subway", categoryHint: "Food & Drinks" },
  chai: { name: "Chai Point", categoryHint: "Food & Drinks" },
  chaayos: { name: "Chaayos", categoryHint: "Food & Drinks" },
  haldiram: { name: "Haldiram's", categoryHint: "Food & Drinks" },
  // Groceries & Retail
  dmart: { name: "DMart", categoryHint: "Groceries" },
  "d-mart": { name: "DMart", categoryHint: "Groceries" },
  bigbasket: { name: "BigBasket", categoryHint: "Groceries" },
  "big bazaar": { name: "Big Bazaar", categoryHint: "Groceries" },
  "reliance fresh": { name: "Reliance Fresh", categoryHint: "Groceries" },
  "reliance smart": { name: "Reliance Smart", categoryHint: "Groceries" },
  "more supermarket": { name: "More Supermarket", categoryHint: "Groceries" },
  "star bazaar": { name: "Star Bazaar", categoryHint: "Groceries" },
  "nature basket": { name: "Nature's Basket", categoryHint: "Groceries" },
  spencer: { name: "Spencer's", categoryHint: "Groceries" },
  // Transportation & Fuel
  uber: { name: "Uber", categoryHint: "Transport" },
  ola: { name: "Ola", categoryHint: "Transport" },
  rapido: { name: "Rapido", categoryHint: "Transport" },
  shell: { name: "Shell", categoryHint: "Transport" },
  "indian oil": { name: "Indian Oil", categoryHint: "Transport" },
  "hp petrol": { name: "HP Petrol", categoryHint: "Transport" },
  bharat: { name: "Bharat Petroleum", categoryHint: "Transport" },
  irctc: { name: "IRCTC", categoryHint: "Travel" },
  redbus: { name: "RedBus", categoryHint: "Travel" },
  makemytrip: { name: "MakeMyTrip", categoryHint: "Travel" },
  indigo: { name: "IndiGo", categoryHint: "Travel" },
  // Shopping
  amazon: { name: "Amazon", categoryHint: "Shopping" },
  flipkart: { name: "Flipkart", categoryHint: "Shopping" },
  myntra: { name: "Myntra", categoryHint: "Shopping" },
  apple: { name: "Apple", categoryHint: "Shopping" },
  decathlon: { name: "Decathlon", categoryHint: "Shopping" },
  ikea: { name: "IKEA", categoryHint: "Shopping" },
  ajio: { name: "Ajio", categoryHint: "Shopping" },
  nykaa: { name: "Nykaa", categoryHint: "Shopping" },
  meesho: { name: "Meesho", categoryHint: "Shopping" },
  croma: { name: "Croma", categoryHint: "Shopping" },
  zara: { name: "Zara", categoryHint: "Shopping" },
  "h&m": { name: "H&M", categoryHint: "Shopping" },
  // Entertainment & Streaming
  netflix: { name: "Netflix", categoryHint: "Entertainment" },
  spotify: { name: "Spotify", categoryHint: "Entertainment" },
  hotstar: { name: "Hotstar", categoryHint: "Entertainment" },
  "disney+": { name: "Disney+", categoryHint: "Entertainment" },
  "prime video": { name: "Prime Video", categoryHint: "Entertainment" },
  bookmyshow: { name: "BookMyShow", categoryHint: "Entertainment" },
  pvr: { name: "PVR Cinemas", categoryHint: "Entertainment" },
  inox: { name: "INOX", categoryHint: "Entertainment" },
  // Bills & Utilities
  google: { name: "Google", categoryHint: "Bills & Utilities" },
  jio: { name: "Jio", categoryHint: "Bills & Utilities" },
  airtel: { name: "Airtel", categoryHint: "Bills & Utilities" },
  vodafone: { name: "Vodafone", categoryHint: "Bills & Utilities" },
  "tata play": { name: "Tata Play", categoryHint: "Bills & Utilities" },
  bescom: { name: "BESCOM", categoryHint: "Bills & Utilities" },
  mahadiscom: { name: "MSEDCL", categoryHint: "Bills & Utilities" },
  // Health & Medicine
  "apollo pharmacy": { name: "Apollo Pharmacy", categoryHint: "Health" },
  "apollo hospital": { name: "Apollo Hospital", categoryHint: "Health" },
  medplus: { name: "MedPlus", categoryHint: "Health" },
  netmeds: { name: "Netmeds", categoryHint: "Health" },
  pharmeasy: { name: "PharmEasy", categoryHint: "Health" },
  "1mg": { name: "1mg", categoryHint: "Health" },
};

// Payment method patterns
const PAYMENT_KEYWORDS = [
  { method: "UPI", regex: /\b(upi|gpay|google pay|phonepe|paytm|bhim|cred)\b/i },
  { method: "Card", regex: /\b(visa|mastercard|rupay|amex|credit card|debit card|pos|swipe)\b/i },
  { method: "Cash", regex: /\b(cash|tendered|change)\b/i },
  { method: "Net Banking", regex: /\b(netbanking|neft|rtgs|imps|bank transfer)\b/i },
];

/**
 * Classifies document type from OCR lines.
 */
export function classifyDocumentType(lines: string[]): DocumentType {
  const fullText = lines.join(" ").toLowerCase();

  // Bank Statement
  if (
    /statement of account|account statement|bank statement|transaction history|opening balance|closing balance|available balance/i.test(fullText) ||
    (/\b(debit|cr|dr)\b/i.test(fullText) && /\b(balance|val date|chq\/?ref|particulars)\b/i.test(fullText))
  ) {
    return "BANK_STATEMENT";
  }

  // Payment Confirmation / UPI screenshot
  if (
    /\b(paid to|payment to|transferred to|payment successful|paid successfully|upi transaction id|google pay|phonepe|paytm|bhim|utr:?|cred)\b/i.test(fullText)
  ) {
    return "PAYMENT_RECEIPT";
  }

  // Tax Invoice / B2B Invoice
  if (
    /\b(tax invoice|bill of supply|invoice no|gstin|gst no|cin:?|hsn|sac code)\b/i.test(fullText)
  ) {
    return "INVOICE";
  }

  // Regular Receipt
  if (
    /\b(receipt|bill no|order no|table no|subtotal|grand total|cashier|pos|token no|welcome)\b/i.test(fullText)
  ) {
    return "RECEIPT";
  }

  return "UNKNOWN";
}

/**
 * Parses OCR lines into one or more structured transactions.
 */
export function parseOcrText(
  lines: string[],
  defaultCurrency = "INR",
  categories: Category[] = [],
  imageUri?: string,
): ParsedTransaction[] {
  if (!lines || lines.length === 0) {
    return [];
  }

  const cleanLines = lines.map((l) => l.trim()).filter((l) => l.length > 0);
  const docType = classifyDocumentType(cleanLines);

  // 1. Bank statement / multi-transaction table
  if (docType === "BANK_STATEMENT") {
    const statementTxns = tryParseStatementTable(cleanLines, defaultCurrency, categories, imageUri);
    if (statementTxns.length > 0) {
      return statementTxns;
    }
  }

  // Check if multiple statement rows can be found regardless of docType
  const potentialStatement = tryParseStatementTable(cleanLines, defaultCurrency, categories, imageUri);
  if (potentialStatement.length >= 2) {
    return potentialStatement;
  }

  // 2. UPI / Mobile Payment screenshot
  if (docType === "PAYMENT_RECEIPT") {
    const paymentTxn = parsePaymentReceipt(cleanLines, defaultCurrency, categories, imageUri);
    if (paymentTxn) {
      return [paymentTxn];
    }
  }

  // 3. Single receipt or invoice
  const receiptTxn = parseSingleReceipt(cleanLines, defaultCurrency, categories, imageUri, docType);
  return receiptTxn ? [receiptTxn] : [];
}

/**
 * Payment confirmation parser (Google Pay, PhonePe, Paytm, CRED).
 */
function parsePaymentReceipt(
  lines: string[],
  defaultCurrency: string,
  categories: Category[],
  imageUri?: string,
): ParsedTransaction | null {
  const fullText = lines.join(" ");
  let detectedAmount: number | null = null;
  let merchantName = "";
  let isIncome = /\b(received from|payment received|credited to)\b/i.test(fullText);

  // Look for "Paid to <Merchant>" or "To <Merchant>"
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const paidToMatch = line.match(/\b(?:paid to|to:?|paying)\s+([A-Za-z0-9\s&'.-]{2,30})/i);
    if (paidToMatch && paidToMatch[1]) {
      merchantName = paidToMatch[1].trim();
      break;
    }
  }

  // If not found, look for known merchant in text
  if (!merchantName) {
    for (const [key, val] of Object.entries(KNOWN_MERCHANTS)) {
      if (new RegExp(`\\b${key}\\b`, "i").test(fullText)) {
        merchantName = val.name;
        break;
      }
    }
  }

  // Find the primary amount (often on a line with ₹ or standalone currency)
  for (const line of lines) {
    // Avoid lines with UTR, Transaction ID, Phone numbers
    if (/upi\s*id|utr|transaction\s*id|google\s*transaction|bank\s*ref|phone/i.test(line)) {
      continue;
    }
    const amounts = extractAmountsFromLine(line);
    if (amounts.length > 0) {
      // Prioritize line with currency symbol
      if (/[₹$€£]|inr|rs\.?/i.test(line)) {
        detectedAmount = amounts[0];
        break;
      }
      if (!detectedAmount) {
        detectedAmount = amounts[0];
      }
    }
  }

  if (!detectedAmount || detectedAmount <= 0) {
    return null;
  }

  // Extract date
  let detectedDate: { isoDate: string; raw: string; inferred: boolean } | null = null;
  for (const line of lines) {
    const d = extractDateFromText(line);
    if (d) {
      detectedDate = { ...d, inferred: false };
      break;
    }
  }

  if (!detectedDate) {
    detectedDate = {
      isoDate: new Date().toISOString().split("T")[0],
      raw: "Today",
      inferred: true,
    };
  }

  if (!merchantName) {
    merchantName = isIncome ? "Payment Received" : "UPI Payment";
  }

  const { matchedCategory } = resolveMerchantAndCategory(merchantName + " " + fullText, categories);
  const detectedType = detectTransactionType(fullText);
  const resolvedCategory =
    matchedCategory ||
    (detectedType === "INCOME" ? "Income" : detectedType === "TRANSFER" ? "Transfer" : "Shopping");
  const catObj = categories.find((c) => c.name.toLowerCase() === resolvedCategory.toLowerCase());

  return {
    id: "scan-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
    merchant: merchantName,
    amount: Math.round(detectedAmount * 100) / 100,
    date: detectedDate.isoDate,
    category: resolvedCategory,
    categoryId: catObj?.id,
    type: detectedType,
    currency: detectCurrency(fullText) || defaultCurrency,
    paymentMethod: "UPI",
    notes: `Scanned from payment receipt`,
    confidence: "HIGH",
    confidenceLabel: "✓ Looks good",
    requiresReview: false,
    documentType: "PAYMENT_RECEIPT",
    sourceType: "PAYMENT_RECEIPT",
    sourceImageUri: imageUri,
  };
}

/**
 * Statement parser: Detects multiple transaction rows (e.g. Date + Merchant + Amount)
 */
function tryParseStatementTable(
  lines: string[],
  defaultCurrency: string,
  categories: Category[],
  imageUri?: string,
): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];

  // Exclude header or balance rows
  const isHeaderOrBalanceRow = (text: string): boolean => {
    return /\b(opening balance|closing balance|available balance|statement period|total debit|total credit|page \d+)\b/i.test(text);
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (isHeaderOrBalanceRow(line)) continue;

    const dateMatch = extractDateFromText(line);
    if (!dateMatch) continue;

    // Strip date string before extracting amounts so day digits (e.g. "02 Sep") aren't treated as money
    const lineWithoutDate = line.replace(dateMatch.raw, " ");
    const amountMatches = extractAmountsFromLine(lineWithoutDate);
    if (amountMatches.length === 0) continue;

    // In bank statements, rows typically contain: [Date] [Description] [Transaction Amount] [Running Balance]
    // If there are multiple amounts, the first is the transaction debit/credit, and the last is running balance.
    let amount = amountMatches[0];
    if (amountMatches.length >= 2) {
      // If the first amount is 0 and second is positive (e.g. Debit=0, Credit=500), pick second
      if (amountMatches[0] === 0 && amountMatches[1] > 0) {
        amount = amountMatches[1];
      } else {
        amount = amountMatches[0];
      }
    }

    if (amount <= 0 || amount > 10000000) continue;

    // Clean description: remove the date string, amount string, and noise
    let desc = line
      .replace(dateMatch.raw, " ")
      .replace(/[₹$€£]\s*[\d,]+(\.\d{1,2})?/gi, " ")
      .replace(/\b(inr|usd|eur|gbp)\b/gi, " ")
      .replace(/\b(dr|cr|debit|credit)\b/gi, " ")
      .replace(/\b\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (desc.length < 2) {
      desc = "Transaction";
    }

    const { merchantName, matchedCategory } = resolveMerchantAndCategory(desc, categories);
    const resolvedCategory = matchedCategory || "General";
    const catObj = categories.find((c) => c.name.toLowerCase() === resolvedCategory.toLowerCase());

    transactions.push({
      id: "scan-" + Date.now() + "-" + i + "-" + Math.random().toString(36).slice(2, 6),
      merchant: merchantName || desc,
      amount,
      date: dateMatch.isoDate,
      category: resolvedCategory,
      categoryId: catObj?.id,
      type: detectTransactionType(line),
      currency: detectCurrency(line) || defaultCurrency,
      paymentMethod: detectPaymentMethod(line) || "UPI",
      notes: `Extracted from statement row: "${line}"`,
      confidence: "HIGH",
      confidenceLabel: "✓ Looks good",
      requiresReview: false,
      documentType: "BANK_STATEMENT",
      sourceType: "STATEMENT_ROW",
      sourceImageUri: imageUri,
    });
  }

  return transactions;
}

/**
 * Receipt parser: Prioritizes Total / Grand Total / Amount Paid over subtotal/tax/discount
 */
function parseSingleReceipt(
  lines: string[],
  defaultCurrency: string,
  categories: Category[],
  imageUri?: string,
  docType: DocumentType = "RECEIPT",
): ParsedTransaction | null {
  let detectedAmount: number | null = null;
  let amountConfidence: ConfidenceLevel = "LOW";
  let detectedDate: { isoDate: string; raw: string; inferred: boolean } | null = null;
  let merchantName = "";
  let paymentMethod = "";

  // 1. Amount Extraction with Keyword Prioritization
  const totalKeywords = [
    /\b(grand\s*total|total\s*amount|amount\s*paid|net\s*amount|total\s*payable|final\s*total|bill\s*total)\b/i,
    /\b(total|paid|balance\s*due)\b/i,
  ];

  const subtotalKeywords = /\b(sub\s*total|subtotal|gst|tax|cgst|sgst|vat|discount|round\s*off|cash\s*tendered|change|saving)\b/i;

  let bestScore = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const amounts = extractAmountsFromLine(line);
    if (amounts.length === 0) continue;

    const highestAmountOnLine = Math.max(...amounts);

    // Highest priority total phrases
    if (totalKeywords[0].test(line)) {
      detectedAmount = amounts[amounts.length - 1];
      bestScore = 100;
      amountConfidence = "HIGH";
      break;
    }

    // General total
    if (totalKeywords[1].test(line) && !subtotalKeywords.test(line)) {
      if (bestScore < 80) {
        detectedAmount = amounts[amounts.length - 1];
        bestScore = 80;
        amountConfidence = "HIGH";
      }
    }

    // Fallback: largest reasonable amount seen without subtotal keywords
    if (bestScore < 30 && !subtotalKeywords.test(line)) {
      if (!detectedAmount || highestAmountOnLine > detectedAmount) {
        detectedAmount = highestAmountOnLine;
        bestScore = 30;
        amountConfidence = "MEDIUM";
      }
    }
  }

  // If still no amount found, take the largest non-tax amount
  if (!detectedAmount) {
    const allAmounts: number[] = [];
    for (const line of lines) {
      if (!subtotalKeywords.test(line)) {
        allAmounts.push(...extractAmountsFromLine(line));
      }
    }
    if (allAmounts.length > 0) {
      detectedAmount = Math.max(...allAmounts);
      amountConfidence = "LOW";
    }
  }

  if (!detectedAmount || detectedAmount <= 0) {
    return null;
  }

  // 2. Date Extraction
  for (const line of lines) {
    const d = extractDateFromText(line);
    if (d) {
      detectedDate = { ...d, inferred: false };
      break;
    }
  }

  if (!detectedDate) {
    detectedDate = {
      isoDate: new Date().toISOString().split("T")[0],
      raw: "Today",
      inferred: true,
    };
  }

  // 3. Merchant Detection
  const fullText = lines.join(" ");
  for (const [key, val] of Object.entries(KNOWN_MERCHANTS)) {
    if (new RegExp(`\\b${key}\\b`, "i").test(fullText)) {
      merchantName = val.name;
      break;
    }
  }

  // If not matched, look at top lines (receipt header)
  if (!merchantName) {
    for (let i = 0; i < Math.min(4, lines.length); i++) {
      const line = lines[i].trim();
      if (
        !/^\d+$/.test(line) &&
        !/tax|invoice|receipt|welcome|gstin|bill\s*no|date|time|phone|tel/i.test(line) &&
        line.length > 2
      ) {
        merchantName = line.replace(/[^a-zA-Z0-9\s&'.-]/g, "").trim();
        if (merchantName.length > 2) break;
      }
    }
  }

  if (!merchantName) {
    merchantName = "Scanned Receipt";
  }

  // 4. Category Suggestion
  const { matchedCategory } = resolveMerchantAndCategory(merchantName + " " + fullText, categories);
  const resolvedCategory = matchedCategory || "Shopping";
  const catObj = categories.find((c) => c.name.toLowerCase() === resolvedCategory.toLowerCase());

  // 5. Payment Method
  paymentMethod = detectPaymentMethod(fullText) || "Card";

  // 6. Confidence Scoring
  let overallConfidence: ConfidenceLevel = "MEDIUM";
  let confidenceLabel = "✓ Looks good";
  let requiresReview = false;

  if (amountConfidence === "HIGH" && !detectedDate.inferred && merchantName !== "Scanned Receipt") {
    overallConfidence = "HIGH";
    confidenceLabel = "✓ High accuracy";
    requiresReview = false;
  } else if (amountConfidence === "LOW" || detectedDate.inferred || merchantName === "Scanned Receipt") {
    overallConfidence = "LOW";
    confidenceLabel = "⚠️ Review details";
    requiresReview = true;
  } else {
    confidenceLabel = "✓ Looks good";
  }

  return {
    id: "scan-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
    merchant: merchantName,
    amount: Math.round(detectedAmount * 100) / 100,
    date: detectedDate.isoDate,
    category: resolvedCategory,
    categoryId: catObj?.id,
    type: detectTransactionType(fullText),
    currency: detectCurrency(fullText) || defaultCurrency,
    paymentMethod,
    notes: `Scanned from ${docType === "INVOICE" ? "invoice" : "receipt"}${detectedDate.inferred ? " (Date inferred)" : ""}`,
    confidence: overallConfidence,
    confidenceLabel,
    requiresReview,
    documentType: docType,
    sourceType: docType === "INVOICE" ? "INVOICE" : "RECEIPT",
    sourceImageUri: imageUri,
  };
}

/**
 * Extracts valid numeric amounts from a line of text, discarding phone numbers,
 * GSTINs, postal codes, and years.
 */
function extractAmountsFromLine(line: string): number[] {
  const amounts: number[] = [];

  // Ignore lines that are exclusively serial numbers, phone numbers, or barcode strings
  if (/^(ph|tel|mob|phone|gstin|pan|cin|fssai|hsn|pin|tin)[\s:]+/i.test(line)) {
    return [];
  }

  const regex = /(?:[₹$€£]|inr|rs\.?|eur|usd|gbp)?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/gi;

  let match: RegExpExecArray | null;
  while ((match = regex.exec(line)) !== null) {
    const rawVal = match[1];
    if (!rawVal) continue;

    const num = parseFloat(rawVal.replace(/,/g, ""));
    if (isNaN(num) || num <= 0) continue;

    // Filter out obvious years (2020..2035) without decimal places
    const isYear = num >= 2020 && num <= 2035 && !rawVal.includes(".");
    if (isYear) continue;

    // Filter out 10-digit phone numbers (starts with 6..9 and has 10 digits)
    if (/^[6-9]\d{9}$/.test(rawVal)) continue;

    // Filter out 6-digit Indian PIN codes (100000..899999 without decimals)
    if (/^[1-8]\d{5}$/.test(rawVal) && !rawVal.includes(".")) continue;

    // Filter out 12-digit Aadhaar / UTR numbers
    if (/^\d{12}$/.test(rawVal)) continue;

    // Filter out unreasonably huge amounts (> 100 million)
    if (num > 100000000) continue;

    amounts.push(num);
  }

  return amounts;
}

/**
 * Extracts a date from a text string and converts it to ISO YYYY-MM-DD.
 */
function extractDateFromText(text: string): { isoDate: string; raw: string } | null {
  // Pattern 1: DD/MM/YYYY or DD-MM-YYYY or YYYY-MM-DD
  const numDateRegex = /\b(\d{1,4})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})\b/;
  const numMatch = text.match(numDateRegex);
  if (numMatch) {
    const part1 = parseInt(numMatch[1], 10);
    const part2 = parseInt(numMatch[2], 10);
    const part3 = parseInt(numMatch[3], 10);

    let year = part3;
    let month = part2;
    let day = part1;

    // YYYY-MM-DD format
    if (part1 > 1000) {
      year = part1;
      month = part2;
      day = part3;
    } else if (year < 100) {
      year += 2000;
    }

    if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 2000 && year <= 2035) {
      const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      return { isoDate: iso, raw: numMatch[0] };
    }
  }

  // Pattern 2: DD Mon YYYY or Mon DD, YYYY (e.g. 12 Sep 2026, Sep 12 2026)
  const monthNames =
    "jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december";
  const textDateRegex = new RegExp(
    `\\b(\\d{1,2})\\s+(${monthNames})\\s*(\\d{2,4})?\\b|\\b(${monthNames})\\s+(\\d{1,2}),?\\s*(\\d{2,4})?\\b`,
    "i",
  );
  const textMatch = text.match(textDateRegex);

  if (textMatch) {
    const monthMap: Record<string, number> = {
      jan: 1,
      january: 1,
      feb: 2,
      february: 2,
      mar: 3,
      march: 3,
      apr: 4,
      april: 4,
      may: 5,
      jun: 6,
      june: 6,
      jul: 7,
      july: 7,
      aug: 8,
      august: 8,
      sep: 9,
      september: 9,
      oct: 10,
      october: 10,
      nov: 11,
      november: 11,
      dec: 12,
      december: 12,
    };

    let day = 1;
    let month = 1;
    let year = new Date().getFullYear();

    if (textMatch[1] && textMatch[2]) {
      // DD Mon YYYY
      day = parseInt(textMatch[1], 10);
      month = monthMap[textMatch[2].toLowerCase()] || 1;
      if (textMatch[3]) year = parseInt(textMatch[3], 10);
    } else if (textMatch[4] && textMatch[5]) {
      // Mon DD YYYY
      month = monthMap[textMatch[4].toLowerCase()] || 1;
      day = parseInt(textMatch[5], 10);
      if (textMatch[6]) year = parseInt(textMatch[6], 10);
    }

    if (year < 100) year += 2000;
    if (day >= 1 && day <= 31) {
      const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      return { isoDate: iso, raw: textMatch[0] };
    }
  }

  return null;
}

/**
 * Resolves merchant name and category suggestion from text.
 */
function resolveMerchantAndCategory(
  text: string,
  categories: Category[],
): { merchantName: string; matchedCategory: string } {
  const lower = text.toLowerCase();
  let merchantName = "";
  let matchedCategory = "";

  // 1. Check known merchants dictionary
  for (const [key, val] of Object.entries(KNOWN_MERCHANTS)) {
    if (lower.includes(key)) {
      merchantName = val.name;
      if (val.categoryHint) {
        matchedCategory = val.categoryHint;
      }
      break;
    }
  }

  // 2. Query suggestCategory utility
  if (!matchedCategory) {
    matchedCategory = suggestCategory(text, categories) || "";
  }

  // 3. Align matched category name with user's categories
  if (matchedCategory && categories.length > 0) {
    const directMatch = categories.find(
      (c) => c.name.toLowerCase() === matchedCategory.toLowerCase(),
    );
    if (directMatch) {
      matchedCategory = directMatch.name;
    }
  }

  return { merchantName, matchedCategory };
}

/**
 * Detects currency symbol or code from text.
 */
function detectCurrency(text: string): string | null {
  if (/[₹]|inr|rs\.?/i.test(text)) return "INR";
  if (/[$]|usd/i.test(text)) return "USD";
  if (/[€]|eur/i.test(text)) return "EUR";
  if (/[£]|gbp/i.test(text)) return "GBP";
  return null;
}

/**
 * Detects payment method from text clues.
 */
function detectPaymentMethod(text: string): string | null {
  for (const p of PAYMENT_KEYWORDS) {
    if (p.regex.test(text)) return p.method;
  }
  return null;
}

/**
 * Detects transaction type (EXPENSE, INCOME, TRANSFER). Defaults to EXPENSE.
 */
function detectTransactionType(text: string): "EXPENSE" | "INCOME" | "TRANSFER" {
  if (/\b(credited|salary|refund|received|deposit|income)\b/i.test(text)) {
    return "INCOME";
  }
  if (/\b(transfer|transferred to|sent to account|wire)\b/i.test(text)) {
    return "TRANSFER";
  }
  return "EXPENSE";
}
