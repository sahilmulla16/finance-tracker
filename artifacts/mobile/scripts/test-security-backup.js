// Automated Security Regression Test for Pocketflow Backup Schema
const { z } = require('zod');

const BackupCategorySchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().min(1).max(100),
  icon: z.string().min(1).max(100),
  color: z.string().min(1).max(50),
  type: z.enum(["expense", "income", "both"]).optional(),
  isDefault: z.boolean().optional(),
});

const BackupExpenseSchema = z.object({
  id: z.string().min(1).max(100),
  amount: z.number().finite().positive().max(1_000_000_000),
  description: z.string().max(500),
  category: z.string().max(100),
  icon: z.string().max(100),
  color: z.string().max(50),
  date: z.string().max(100),
  payment: z.string().max(100),
});

const BackupAccountSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().min(1).max(100),
  type: z.enum(["CASH", "BANK", "UPI", "SAVINGS", "OTHER"]),
  currency: z.string().max(20),
  openingBalance: z.number().finite().min(-1_000_000_000).max(1_000_000_000),
  isDefault: z.boolean(),
  isActive: z.boolean(),
  createdAt: z.string().max(100).optional(),
  updatedAt: z.string().max(100).optional(),
});

const BackupTransactionSchema = z.object({
  id: z.string().min(1).max(100),
  type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
  amount: z.number().finite().positive().max(1_000_000_000),
  description: z.string().max(500),
  category: z.string().max(100).optional(),
  categoryId: z.string().max(100).optional(),
  accountId: z.string().max(100).optional(),
  fromAccountId: z.string().max(100).optional(),
  toAccountId: z.string().max(100).optional(),
  date: z.string().max(100),
  time: z.string().max(50).optional(),
  createdAt: z.string().max(100).optional(),
  updatedAt: z.string().max(100).optional(),
});

const BackupPayloadSchema = z.object({
  version: z.string().optional(),
  exportedAt: z.string().optional(),
  expenses: z.array(BackupExpenseSchema).max(50_000).optional(),
  categories: z.array(BackupCategorySchema).max(500).optional(),
  accounts: z.array(BackupAccountSchema).max(500).optional(),
  transactions: z.array(BackupTransactionSchema).max(100_000).optional(),
});

console.log("=== RUNNING BACKUP SECURITY REGRESSION TESTS ===");

// Test 1: Valid backup
const validData = {
  version: "1.0",
  accounts: [{ id: "acc-1", name: "Main Bank", type: "BANK", currency: "INR", openingBalance: 1000, isDefault: true, isActive: true }],
  transactions: [{ id: "tx-1", type: "EXPENSE", amount: 150, description: "Coffee", date: "2026-09-26", time: "10:00" }]
};
const res1 = BackupPayloadSchema.safeParse(validData);
console.log("Test 1 (Valid Payload):", res1.success ? "PASS" : "FAIL");
if (!res1.success) console.error(res1.error);

// Test 2: Negative amount injection
const negativeAmountData = {
  transactions: [{ id: "tx-bad", type: "EXPENSE", amount: -500, description: "Hack", date: "2026-09-26", time: "10:00" }]
};
const res2 = BackupPayloadSchema.safeParse(negativeAmountData);
console.log("Test 2 (Negative Amount Rejection):", !res2.success ? "PASS (Properly Rejected)" : "FAIL");

// Test 3: Invalid account type enum injection
const invalidEnumData = {
  accounts: [{ id: "acc-bad", name: "Bad", type: "CRYPTO_EXCHANGE", currency: "BTC", openingBalance: 10, isDefault: false, isActive: true }]
};
const res3 = BackupPayloadSchema.safeParse(invalidEnumData);
console.log("Test 3 (Invalid Enum Rejection):", !res3.success ? "PASS (Properly Rejected)" : "FAIL");

// Test 4: Array limit overload
const hugeArray = new Array(501).fill({ id: "acc", name: "Spam", type: "CASH", currency: "INR", openingBalance: 0, isDefault: false, isActive: true });
const res4 = BackupPayloadSchema.safeParse({ accounts: hugeArray });
console.log("Test 4 (Exceed Max Accounts Limit Rejection):", !res4.success ? "PASS (Properly Rejected)" : "FAIL");

console.log("=== ALL BACKUP TESTS COMPLETED ===");

