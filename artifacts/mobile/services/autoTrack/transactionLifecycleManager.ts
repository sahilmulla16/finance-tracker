import {
  NormalizedTransaction,
  AccountMatchCandidate,
  AccountMatchResult,
} from "./types";
import { resolveAccountForTransaction } from "./accountResolver";
import { ExistingTxnLike } from "./transactionDeduplicator";

export interface TransferResolutionResult<T extends AccountMatchCandidate> {
  fromAccount: T | null;
  toAccount: T | null;
  status: "complete" | "partial" | "unmatched";
}

/**
 * Resolves source and destination accounts for an inter-account transfer transaction.
 */
export function resolveTransferAccounts<T extends AccountMatchCandidate>(
  transaction: NormalizedTransaction,
  accounts: T[],
): TransferResolutionResult<T> {
  // Resolve source account (fromAccount)
  const fromResult = resolveAccountForTransaction(transaction, accounts);

  // Prepare a pseudo-transaction for the destination account
  let toResult: AccountMatchResult<T> | null = null;
  if (transaction.toBankName || transaction.toAccountSuffix) {
    const toTxn: NormalizedTransaction = {
      ...transaction,
      bankName: transaction.toBankName,
      institutionCode: undefined,
      extractedSuffix: transaction.toAccountSuffix
        ? { value: transaction.toAccountSuffix, type: "bank_account" }
        : undefined,
    };
    toResult = resolveAccountForTransaction(toTxn, accounts);
  }

  const fromAcc = fromResult.matchedAccount;
  const toAcc = toResult?.matchedAccount || null;

  if (fromAcc && toAcc) {
    return { fromAccount: fromAcc, toAccount: toAcc, status: "complete" };
  }
  if (fromAcc || toAcc) {
    return { fromAccount: fromAcc, toAccount: toAcc, status: "partial" };
  }
  return { fromAccount: null, toAccount: null, status: "unmatched" };
}

/**
 * Finds the original transaction for a refund or reversal.
 */
export function findOriginalTransactionForRefund(
  refundTxn: NormalizedTransaction,
  existingTransactions: ExistingTxnLike[],
): ExistingTxnLike | null {
  if (!existingTransactions || existingTransactions.length === 0) return null;

  const refundAmt = Math.abs(refundTxn.amount);
  const cleanMerchant = refundTxn.cleanMerchant.toLowerCase().replace(/[^a-z0-9]/g, "");

  // 1. If reference matches
  if (refundTxn.referenceId) {
    const match = existingTransactions.find(
      (tx) => tx.referenceId && tx.referenceId.toLowerCase() === refundTxn.referenceId?.toLowerCase(),
    );
    if (match) return match;
  }

  // 2. Match by exact amount and merchant keyword within 30 days
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const refundTime = refundTxn.timestamp || Date.now();

  for (const tx of existingTransactions) {
    if (Math.abs(Math.abs(tx.amount) - refundAmt) < 0.01) {
      const txTime = tx.createdAt ? new Date(tx.createdAt).getTime() : 0;
      if (Math.abs(refundTime - txTime) <= thirtyDaysMs) {
        const txDesc = (tx.description || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        if (txDesc.includes(cleanMerchant) || cleanMerchant.includes(txDesc)) {
          return tx;
        }
      }
    }
  }

  return null;
}

