/**
 * Universal Smart Auto Track Engine — Core Type Definitions
 * Covers all Indian banks, payment channels, transaction scenarios, and account resolutions.
 */

export type TransactionDirection =
  | "EXPENSE"
  | "INCOME"
  | "TRANSFER"
  | "REFUND"
  | "UNKNOWN";

export type PaymentChannel =
  | "UPI"
  | "DEBIT_CARD"
  | "CREDIT_CARD"
  | "ATM"
  | "NET_BANKING"
  | "IMPS"
  | "NEFT"
  | "RTGS"
  | "AUTOPAY"
  | "WALLET"
  | "LOAN_EMI"
  | "OTHER";

export type TransactionLifecycleStatus =
  | "COMPLETED"
  | "PENDING"
  | "FAILED"
  | "REVERSED";

export type SuffixType = "card" | "bank_account" | "unknown";

export interface ExtractedSuffix {
  value: string;
  type: SuffixType;
  rawMatch?: string;
}

export type InstitutionCategory =
  | "PUBLIC_SECTOR"
  | "PRIVATE_SECTOR"
  | "SMALL_FINANCE"
  | "PAYMENTS_BANK"
  | "REGIONAL_RURAL"
  | "COOPERATIVE"
  | "FOREIGN"
  | "CREDIT_CARD_ISSUER"
  | "UPI_PSP";

export interface BankInstitution {
  code: string;
  name: string;
  aliases: string[];
  category: InstitutionCategory;
  senderPrefixes: string[];
  bodyKeywords: string[];
  supportedProducts?: ("SAVINGS" | "CURRENT" | "CREDIT_CARD" | "DEBIT_CARD" | "WALLET")[];
}

export interface NormalizedTransaction {
  id: string;
  amount: number;
  currency: string;
  direction: TransactionDirection;
  isDirectionAmbiguous?: boolean;
  paymentChannel: PaymentChannel;
  lifecycleStatus: TransactionLifecycleStatus;
  merchant: string;
  cleanMerchant: string;
  merchantCategory?: string;
  counterparty?: string;
  payerName?: string;
  payeeName?: string;
  cardLast4?: string;
  accountNumberLast4?: string;
  bankName?: string;
  institutionCode?: string;
  extractedSuffix?: ExtractedSuffix;
  toBankName?: string;
  toAccountSuffix?: string;
  availableBalance?: number;
  referenceId?: string;
  timestamp: number;
  dateText?: string;
  rawSenderId?: string;
  rawText: string;
  confidence: number;
}

export type ResolutionStatus =
  | "matched"
  | "ambiguous"
  | "unmatched"
  | "needs_confirmation";

export interface AccountMatchCandidate {
  id: string;
  name: string;
  type?: string;
  isActive?: boolean;
  accountNumberLast4?: string;
  cardLast4?: string;
  accountSuffix?: string;
  displayName?: string;
}

export interface AccountMatchResult<T extends AccountMatchCandidate = AccountMatchCandidate> {
  status: ResolutionStatus;
  matchedAccount: T | null;
  account?: T | null;
  confidence: number;
  reason: string;
  suggestedAccounts?: T[];
  isCardMatch?: boolean;
  isAccountSuffixMatch?: boolean;
  cardLast4ToSync?: string;
}

export interface SafetyClassification {
  isTransaction: boolean;
  isOtp: boolean;
  isPromotional: boolean;
  isBalanceInquiryOnly: boolean;
  isFailedOrCancelled: boolean;
  isMandateSetupOnly: boolean;
  rejectionReason?: string;
}

