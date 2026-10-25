import { SafetyClassification } from "./types";

/**
 * Validates whether an incoming SMS is a legitimate financial transaction
 * or an OTP, promotional spam, balance inquiry only, failed payment, or mandate registration.
 */
export function validateTransactionSafety(text: string): SafetyClassification {
  if (!text || text.trim().length === 0) {
    return {
      isTransaction: false,
      isOtp: false,
      isPromotional: false,
      isBalanceInquiryOnly: false,
      isFailedOrCancelled: false,
      isMandateSetupOnly: false,
      rejectionReason: "Empty text",
    };
  }

  const lower = text.toLowerCase();

  // 1. Check for OTP / Security verification codes
  const isOtp =
    /\b(?:is\s+(?:your\s+)?otp|otp\s+(?:for|is)|use\s+otp|enter\s+otp|otp\s*[:#-]?\s*\d+|your\s+otp\s+for|verification\s+code|login\s+code|one\s*time\s*password|secret\s+otp|auth\s+code|do\s+not\s+share\s+(?:your\s+)?otp)\b/i.test(
      lower,
    ) ||
    (/\b(?:otp|code)\b/i.test(lower) && /\b(?:valid\s+for|expire|mins?|seconds?|confidential)\b/i.test(lower));

  if (isOtp) {
    return {
      isTransaction: false,
      isOtp: true,
      isPromotional: false,
      isBalanceInquiryOnly: false,
      isFailedOrCancelled: false,
      isMandateSetupOnly: false,
      rejectionReason: "One-Time Password (OTP) or authentication code",
    };
  }

  // 2. Check for Promotional / Loan / Offer messages
  const isPromotional =
    /\b(?:pre[- ]?approved|personal\s+loan|apply\s+now|credit\s+limit\s+increase|instant\s+loan|special\s+offer|festive\s+offer|zero\s+processing\s+fee|interest\s+rate\s+starting|congratulations!\s*you\s+are\s+eligible|flat\s+\d+%\s+off\s+on\s+cards?|reward\s+points?\s+expiring)\b/i.test(
      lower,
    );

  if (isPromotional) {
    return {
      isTransaction: false,
      isOtp: false,
      isPromotional: true,
      isBalanceInquiryOnly: false,
      isFailedOrCancelled: false,
      isMandateSetupOnly: false,
      rejectionReason: "Promotional or marketing offer",
    };
  }

  // 3. Check for Failed / Declined / Cancelled transactions
  const isFailedOrCancelled =
    /\b(?:failed|decline|declined|unsuccessful|cancelled|canceled|timed?\s*out|insufficient\s+funds?|transaction\s+not\s+permitted|payment\s+declined|txn\s+declined)\b/i.test(
      lower,
    );

  if (isFailedOrCancelled) {
    return {
      isTransaction: false,
      isOtp: false,
      isPromotional: false,
      isBalanceInquiryOnly: false,
      isFailedOrCancelled: true,
      isMandateSetupOnly: false,
      rejectionReason: "Transaction failed, declined, or cancelled",
    };
  }

  // 4. Check for Mandate / Standing Instruction Registration Only (not debit)
  const isMandateSetupOnly =
    (/\b(?:e-mandate|mandate|autopay|standing\s+instruction|si)\s+(?:of\s+(?:rs\.?|inr|₹)?\s*[\d,]+\s+)?(?:created|registered|setup|initiated|active|enabled)\b/i.test(
      lower,
    ) ||
      /\b(?:si|standing\s+instruction|mandate|e-mandate)\s+(?:registered|created|setup|initiated)\b/i.test(
        lower,
      )) &&
    !/\b(?:debited|paid|charged|deducted)\b/i.test(lower);

  if (isMandateSetupOnly) {
    return {
      isTransaction: false,
      isOtp: false,
      isPromotional: false,
      isBalanceInquiryOnly: false,
      isFailedOrCancelled: false,
      isMandateSetupOnly: true,
      rejectionReason: "Mandate or AutoPay registration notification (no financial debit)",
    };
  }

  // 5. Check for Balance Inquiry Only
  // Message mentions balance or inquiry, but has no debit/credit/paid/spent/transferred words
  const hasDebitCredit =
    /\b(?:debited|credited|paid|spent|sent|transferred|withdrawn|refunded|charged|deducted|received|deposited|deposited\s+in|approved|authorized|transacted|utilized)\b/i.test(
      lower,
    );
  const isBalanceInquiryOnly =
    !hasDebitCredit &&
    /\b(?:avail(?:able)?\s*bal(?:ance)?|clear\s*bal(?:ance)?|ledger\s*bal(?:ance)?|current\s*bal(?:ance)?|bal\s+in\s+a\/?c)\b/i.test(
      lower,
    );

  if (isBalanceInquiryOnly) {
    return {
      isTransaction: false,
      isOtp: false,
      isPromotional: false,
      isBalanceInquiryOnly: true,
      isFailedOrCancelled: false,
      isMandateSetupOnly: false,
      rejectionReason: "Balance inquiry or balance notification without transaction debit/credit",
    };
  }

  // If it passed all safety rejection filters and has debit/credit, it is a valid transaction candidate
  return {
    isTransaction: hasDebitCredit,
    isOtp: false,
    isPromotional: false,
    isBalanceInquiryOnly: false,
    isFailedOrCancelled: false,
    isMandateSetupOnly: false,
    rejectionReason: hasDebitCredit ? undefined : "No transaction action detected in text",
  };
}
