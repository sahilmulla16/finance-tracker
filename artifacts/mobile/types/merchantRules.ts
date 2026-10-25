export interface MerchantRule {
  normalizedKey: string;
  displayMerchant: string;
  categoryId: string;
  categoryName: string;
  preferredAccountId?: string;
  scope?: "GLOBAL" | "ACCOUNT";
  createdAt: string;
  updatedAt: string;
  source: "user-confirmed";
  enabled?: boolean;
  userConfirmed?: boolean;
  metadata?: Record<string, any>;
}

export interface BulkCategorizeResult {
  updatedCount: number;
  categoryName: string;
  displayMerchant: string;
}
