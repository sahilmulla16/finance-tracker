import {
  TransactionDirection,
  PaymentChannel,
  TransactionLifecycleStatus,
} from "./types";

export interface ClassificationResult {
  direction: TransactionDirection;
  paymentChannel: PaymentChannel;
  lifecycleStatus: TransactionLifecycleStatus;
  isDirectionAmbiguous?: boolean;
}

/**
 * Classifies the direction, payment channel, and lifecycle status of a normalized transaction.
 * Context-aware: strictly distinguishes credits, debits, transfers, refunds, and ambiguity.
 */
export function classifyTransaction(text: string): ClassificationResult {
  const lower = text.toLowerCase();

  // 1. Lifecycle status & Negation handling
  let lifecycleStatus: TransactionLifecycleStatus = "COMPLETED";
  const hasNegation =
    /\b(?:not\s+debited|not\s+credited|has\s+not\s+been\s+debited|has\s+not\s+been\s+credited|was\s+not\s+debited|was\s+not\s+credited|could\s+not\s+be\s+processed)\b/i.test(
      lower,
    );

  if (
    hasNegation ||
    /\b(?:failed|decline|declined|unsuccessful|cancelled|canceled|timed?\s*out|payment\s+declined|txn\s+declined)\b/i.test(
      lower,
    )
  ) {
    lifecycleStatus = "FAILED";
  } else if (/\b(?:reversed|reversal)\b/i.test(lower)) {
    lifecycleStatus = "REVERSED";
  } else if (
    /\b(?:auth\s+hold|hold\s+placed|pending|processing|initiated|in-process)\b/i.test(
      lower,
    )
  ) {
    lifecycleStatus = "PENDING";
  }

  // 2. Transaction Direction Detection
  let direction: TransactionDirection = "UNKNOWN";
  let isDirectionAmbiguous = false;

  const isRefund = /\b(?:refund(?:ed)?|cashback|reversal|reversed|credited\s+back|returned|credited\s+as\s+refund|money\s+refunded)\b/i.test(
    lower,
  );

  const isTransfer =
    /\b(?:transfer(?:red)?\s+(?:from\s+([a-zA-Z0-9\s&.-]+?)\s+to\s+([a-zA-Z0-9\s&.-]+?)|to\s+own\s+a\/?c|between\s+accounts)|self\s+transfer|own\s+a\/?c\s+transfer|transfer\s+to\s+own\s+account)\b/i.test(
      lower,
    ) ||
    /\b(?:from|in)\s+([a-zA-Z\s]{3,25}?(?:bank)?)\s+.*?\bto\s+([a-zA-Z\s]{3,25}?(?:bank)?)\b/i.test(
      lower,
    );

  // Credit signals: explicit money arriving into user's account
  const isCredit =
    /\b(?:credited\s+(?:to|in|with|back)?|has\s+been\s+credited|is\s+credited|amount\s+credited|cr\s+to)\b/i.test(
      lower,
    ) ||
    /\b(?:received\s+(?:rs\.?|inr|₹|from|in|into)|you\s+have\s+received|money\s+received|received\s+from)\b/i.test(
      lower,
    ) ||
    /\b(?:deposited\s+(?:in|into|to)?|salary\s+credited|salary\s+deposited|interest\s+credited|dividend\s+credited|bonus\s+credited)\b/i.test(
      lower,
    ) ||
    /\b(?:added\s+to\s+(?:your\s+)?(?:account|wallet))\b/i.test(lower);

  // Debit signals: explicit money leaving user's account
  // Note: "txn of" is an amount qualifier, NOT a debit indicator.
  // Note: "sent to" is debit, while "sent by" indicates the sender of an incoming credit!
  const isDebit =
    /\b(?:debited\s+(?:by|for|with|from)?|has\s+been\s+debited|is\s+debited|dr\s+from)\b/i.test(
      lower,
    ) ||
    /\b(?:paid\s+(?:to|for|via|using)?|spent\s+(?:at|on|for)?|withdrawn\s+(?:at|from)?|withdrew)\b/i.test(
      lower,
    ) ||
    /\b(?:charged\s+(?:to|on)?|billed\s+to|billed|deducted\s+(?:from)?|purchase\s+(?:at|of)|purchased\s+(?:at|on)?)\b/i.test(
      lower,
    ) ||
    /\b(?:used\s+(?:at|for|on)|authorized\s+(?:for|at|on)?|approved\s+(?:on|for|at)?|utilized)\b/i.test(
      lower,
    ) ||
    /\b(?:sent\s+to\b|sent\s+(?:rs\.?|inr|₹)?\s*[\d,]+.*?\bto\b)\b/i.test(lower) ||
    (/\b(?:spent|paid|withdrawn|charged|purchase|purchased|billed|deducted|used|authorized|approved)\b/i.test(
      lower,
    ) &&
      !isCredit);

  if (isRefund) {
    direction = "REFUND";
  } else if (isTransfer) {
    direction = "TRANSFER";
  } else if (isCredit && !isDebit) {
    direction = "INCOME";
  } else if (isDebit && !isCredit) {
    direction = "EXPENSE";
  } else if (isCredit && isDebit) {
    // Both matched — check dominant context
    const hasDominantCredit =
      /\b(?:credited\s+to\s+your\s+account|received\s+.*?\bfrom|salary\s+credited)\b/i.test(
        lower,
      );
    const hasDominantDebit =
      /\b(?:debited\s+from\s+your\s+account|spent\s+at|paid\s+to)\b/i.test(
        lower,
      );

    if (hasDominantCredit && !hasDominantDebit) {
      direction = "INCOME";
    } else if (hasDominantDebit && !hasDominantCredit) {
      direction = "EXPENSE";
    } else {
      // Conflicting signals cannot be safely resolved -> mark ambiguous
      direction = "UNKNOWN";
      isDirectionAmbiguous = true;
    }
  } else {
    // Neither explicit credit nor debit signal
    direction = "UNKNOWN";
    isDirectionAmbiguous = true;
  }

  // 3. Payment Channel Detection
  let paymentChannel: PaymentChannel = "OTHER";

  if (
    /\b(?:upi|vpa|@ok[a-z]+|@okhdfcbank|@oksbi|@icici|@ybl|@axl|@paytm|upi\s*ref|upi\s*rrn|upi\/p2[am]|bhim)\b/i.test(
      lower,
    )
  ) {
    paymentChannel = "UPI";
  } else if (
    /\b(?:atm\s+(?:wdl|cash|withdrawal)|cash\s+wdl|withdrawn\s+(?:at|from)\s+atm|nfs\/atm)\b/i.test(
      lower,
    )
  ) {
    paymentChannel = "ATM";
  } else if (
    /\b(?:credit\s+card|credit\s*card\s+ending|spent\s+on\s+(?:your\s+)?credit\s+card|cc\s+ending|available\s+credit\s+limit|total\s+due)\b/i.test(
      lower,
    )
  ) {
    paymentChannel = "CREDIT_CARD";
  } else if (
    /\b(?:debit\s+card|debit\s*card\s+ending|dc\s+ending|used\s+debit\s+card)\b/i.test(
      lower,
    )
  ) {
    paymentChannel = "DEBIT_CARD";
  } else if (
    // General "card ending XXXX" without explicitly saying "debit card"
    /\b(?:card\s+(?:ending|no\.?|number|x{2,})?\s*([0-9]{4}))\b/i.test(lower)
  ) {
    // If it mentions credit limit or credit card in context -> CREDIT_CARD
    if (/\b(?:credit|limit|sbicard|onecard)\b/i.test(lower)) {
      paymentChannel = "CREDIT_CARD";
    } else {
      paymentChannel = "DEBIT_CARD";
    }
  } else if (
    /\b(?:nach|ecs|autopay|standing\s+instruction|mandate\s+debit|e-mandate\s+debited)\b/i.test(
      lower,
    )
  ) {
    paymentChannel = "AUTOPAY";
  } else if (/\b(?:emi\s+debited|loan\s+installment|home\s+loan|car\s+loan)\b/i.test(lower)) {
    paymentChannel = "LOAN_EMI";
  } else if (/\b(?:imps|imps\s+ref|p2a)\b/i.test(lower)) {
    paymentChannel = "IMPS";
  } else if (/\b(?:neft|neft\s+txn|neft\s+cr|neft\s+dr)\b/i.test(lower)) {
    paymentChannel = "NEFT";
  } else if (/\b(?:rtgs)\b/i.test(lower)) {
    paymentChannel = "RTGS";
  } else if (/\b(?:netbanking|internet\s+banking|inb)\b/i.test(lower)) {
    paymentChannel = "NET_BANKING";
  } else if (/\b(?:wallet|paytm\s+wallet|amazon\s+pay\s+balance)\b/i.test(lower)) {
    paymentChannel = "WALLET";
  }

  return {
    direction,
    paymentChannel,
    lifecycleStatus,
    isDirectionAmbiguous,
  };
}
