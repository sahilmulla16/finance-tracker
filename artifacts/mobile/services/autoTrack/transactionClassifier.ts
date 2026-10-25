import {
  TransactionDirection,
  PaymentChannel,
  TransactionLifecycleStatus,
} from "./types";

export interface ClassificationResult {
  direction: TransactionDirection;
  paymentChannel: PaymentChannel;
  lifecycleStatus: TransactionLifecycleStatus;
}

/**
 * Classifies the direction, payment channel, and lifecycle status of a normalized transaction.
 */
export function classifyTransaction(text: string): ClassificationResult {
  const lower = text.toLowerCase();

  // 1. Lifecycle status
  let lifecycleStatus: TransactionLifecycleStatus = "COMPLETED";
  if (
    /\b(?:failed|decline|declined|unsuccessful|cancelled|canceled|timed?\s*out)\b/i.test(
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

  // 2. Transaction Direction
  let direction: TransactionDirection = "EXPENSE";

  const isRefund = /\b(?:refund(?:ed)?|cashback|reversal|reversed|credited\s+back|returned|credited\s+as\s+refund|money\s+refunded)\b/i.test(
    lower,
  );

  const isTransfer =
    /\b(?:transfer(?:red)?\s+(?:from\s+([a-zA-Z\s&.-]+?)\s+to\s+([a-zA-Z\s&.-]+?)|to\s+own\s+a\/?c|between\s+accounts)|self\s+transfer|own\s+a\/?c\s+transfer|transfer\s+to\s+own\s+account)\b/i.test(
      lower,
    ) ||
    /\b(?:from|in)\s+([a-zA-Z\s]{3,25}?(?:bank)?)\s+.*?\bto\s+([a-zA-Z\s]{3,25}?(?:bank)?)\b/i.test(
      lower,
    );

  const isDebit = /\b(?:debited|paid|spent|sent|purchase|purchased|order|withdrawn|withdrew|charged|billed|deducted|utilized|txn\s+of|approved|authorized|transacted)\b/i.test(
    lower,
  );

  const isCredit = /\b(?:credited|received|deposited|salary|bonus|interest\s+credited|dividend)\b/i.test(
    lower,
  );

  if (isRefund) {
    direction = "REFUND";
  } else if (isTransfer) {
    direction = "TRANSFER";
  } else if (isDebit) {
    direction = "EXPENSE";
  } else if (isCredit) {
    direction = "INCOME";
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
  };
}
