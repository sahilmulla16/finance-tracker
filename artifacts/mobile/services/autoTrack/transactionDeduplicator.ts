import { NormalizedTransaction } from "./types";

export interface ExistingTxnLike {
  id: string;
  amount: number;
  description: string;
  type?: string;
  accountId?: string;
  date?: string;
  time?: string;
  createdAt?: string;
  referenceId?: string;
}

/**
 * Checks if an incoming normalized transaction is a duplicate of an existing transaction.
 */
export function isDuplicateTransaction(
  candidate: NormalizedTransaction,
  existingTransactions: ExistingTxnLike[],
  windowMs: number = 90_000,
): { isDuplicate: boolean; duplicateOf?: ExistingTxnLike; reason?: string } {
  if (!existingTransactions || existingTransactions.length === 0) {
    return { isDuplicate: false };
  }

  // 1. Strict Reference ID match (UPI Ref, UTR, RRN)
  if (candidate.referenceId) {
    const refMatch = existingTransactions.find(
      (tx) => tx.referenceId && tx.referenceId.toLowerCase() === candidate.referenceId?.toLowerCase(),
    );
    if (refMatch) {
      return {
        isDuplicate: true,
        duplicateOf: refMatch,
        reason: `Matched exact reference ID: ${candidate.referenceId}`,
      };
    }
  }

  // 2. Near-time duplicate check (amount + time + merchant similarity)
  const candidateAmount = Math.abs(candidate.amount);
  const candidateTime = candidate.timestamp || Date.now();
  const candMerchantClean = candidate.cleanMerchant.toLowerCase().replace(/[^a-z0-9]/g, "");

  for (const tx of existingTransactions) {
    const txAmount = Math.abs(tx.amount);
    if (Math.abs(candidateAmount - txAmount) > 0.01) continue;

    const txTime = tx.createdAt ? new Date(tx.createdAt).getTime() : 0;
    const timeDiff = Math.abs(candidateTime - txTime);

    // If within window (e.g. 90 seconds)
    if (timeDiff <= windowMs) {
      const txDescClean = (tx.description || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      // If merchant names share significant overlap or both contain the merchant token
      const descMatch =
        txDescClean.includes(candMerchantClean) ||
        candMerchantClean.includes(txDescClean) ||
        candMerchantClean === "" ||
        txDescClean === "";

      if (descMatch) {
        return {
          isDuplicate: true,
          duplicateOf: tx,
          reason: `Duplicate transaction detected within ${Math.round(timeDiff / 1000)}s with same amount ${candidateAmount}`,
        };
      }
    }
  }

  return { isDuplicate: false };
}

