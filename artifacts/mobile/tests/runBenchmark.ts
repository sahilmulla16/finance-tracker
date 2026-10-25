import { generateSyntheticTransactions, type Transaction } from "./performanceBenchmark.ts";
import { normalizeMerchant } from "../utils/merchantNormalization.ts";

const mockAccounts = [
  { id: "acc-1", name: "HDFC Bank", type: "BANK", openingBalance: 25000, isDefault: true, isActive: true },
  { id: "acc-2", name: "SBI Savings", type: "BANK", openingBalance: 50000, isDefault: false, isActive: true },
  { id: "acc-cash", name: "Cash in Hand", type: "CASH", openingBalance: 5000, isDefault: false, isActive: true },
];

function baselineGetAccountBalance(accountId: string, accounts: typeof mockAccounts, transactions: Transaction[]): number {
  const account = accounts.find((a) => a.id === accountId);
  if (!account) return 0;
  let balance = Number(account.openingBalance) || 0;
  const isCashAccount = account.type === "CASH" || account.name.toLowerCase().includes("cash");

  for (const txn of transactions) {
    const amount = Math.abs(Number(txn.amount)) || 0;
    if (amount === 0) continue;
    const type = (txn.type || "EXPENSE").trim().toUpperCase();

    let matchesAccount = txn.accountId === accountId;
    if (!txn.accountId) {
      if (isCashAccount) matchesAccount = true;
    }

    if (type === "INCOME" && matchesAccount) balance += amount;
    else if (type === "EXPENSE" && matchesAccount) balance -= amount;
    else if (type === "TRANSFER") {
      if (txn.toAccountId === accountId) balance += amount;
      if (txn.fromAccountId === accountId) balance -= amount;
    }
  }
  return balance;
}

function baselineGetTotalBalance(accounts: typeof mockAccounts, transactions: Transaction[]): number {
  return accounts.reduce((sum, a) => sum + baselineGetAccountBalance(a.id, accounts, transactions), 0);
}

function baselineSearch(query: string, transactions: Transaction[]): Transaction[] {
  const q = query.toLowerCase();
  return transactions.filter((t) => (t.description + (t.category || "")).toLowerCase().includes(q));
}

function baselineMonthlyBudgetAggregate(transactions: Transaction[], year: number, month: number) {
  const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
  const monthTx = transactions.filter((t) => (t.date || "").startsWith(monthStr));
  let expense = 0;
  let income = 0;
  const categoryTotals: Record<string, number> = {};

  for (const t of monthTx) {
    if (t.type === "EXPENSE") {
      expense += t.amount;
      const cat = t.category || "Other";
      categoryTotals[cat] = (categoryTotals[cat] || 0) + t.amount;
    } else if (t.type === "INCOME") {
      income += t.amount;
    }
  }
  return { expense, income, categoryTotals };
}

function baselineMerchantMemoryCount(merchant: string, transactions: Transaction[]) {
  const normKey = normalizeMerchant(merchant).normalizedKey;
  let uncategorizedCount = 0;
  let alreadyCategorizedCount = 0;

  for (const t of transactions) {
    if (t.type !== "EXPENSE") continue;
    const tNorm = normalizeMerchant(t.description).normalizedKey;
    if (tNorm === normKey) {
      if (!t.categoryId || t.category === "Uncategorized" || t.category === "Expense") {
        uncategorizedCount++;
      } else {
        alreadyCategorizedCount++;
      }
    }
  }
  return { uncategorizedCount, alreadyCategorizedCount };
}

// Baseline linear scan duplicate detection matching duplicateDetector.ts
function baselineDuplicateDetection(candidates: Array<{ amount: number; merchant: string; date: string }>, transactions: Transaction[]) {
  const duplicates: any[] = [];
  for (const scanned of candidates) {
    for (const existing of transactions) {
      if (Math.abs(existing.amount - scanned.amount) < 0.01) {
        if (existing.date === scanned.date && existing.description.toLowerCase().includes(scanned.merchant.toLowerCase())) {
          duplicates.push(scanned);
          break;
        }
      }
    }
  }
  return duplicates;
}

function runBenchmarkForCount(count: number) {
  console.log(`\n========================================`);
  console.log(`BENCHMARKING WITH ${count.toLocaleString()} TRANSACTIONS`);
  console.log(`========================================`);

  const t0 = performance.now();
  const transactions = generateSyntheticTransactions(count);
  const genTime = performance.now() - t0;
  console.log(`Generated ${count} synthetic transactions in ${genTime.toFixed(1)}ms`);

  // 1. JSON Serialization / Deserialization
  const tSerializeStart = performance.now();
  const serialized = JSON.stringify(transactions);
  const serializeTime = performance.now() - tSerializeStart;
  const sizeMb = (Buffer.byteLength(serialized, "utf8") / (1024 * 1024)).toFixed(2);

  const tDeserializeStart = performance.now();
  const deserialized = JSON.parse(serialized);
  const deserializeTime = performance.now() - tDeserializeStart;
  console.log(`[Storage/JSON] Size: ${sizeMb} MB | Stringify: ${serializeTime.toFixed(1)}ms | Parse: ${deserializeTime.toFixed(1)}ms`);

  // 2. Baseline Dashboard Balances
  const tBalStart = performance.now();
  const totalBalance = baselineGetTotalBalance(mockAccounts, transactions);
  const balTime = performance.now() - tBalStart;
  console.log(`[Dashboard Balance] Baseline: ${balTime.toFixed(1)}ms (Total: ${totalBalance})`);

  // 3. Baseline Search
  const tSearchStart = performance.now();
  const searchResults = baselineSearch("Starbucks", transactions);
  const searchTime = performance.now() - tSearchStart;
  console.log(`[Search "Starbucks"] Baseline: ${searchTime.toFixed(1)}ms (Found: ${searchResults.length})`);

  // 4. Baseline Monthly Aggregation
  const tMonthStart = performance.now();
  const monthAgg = baselineMonthlyBudgetAggregate(transactions, 2026, 9);
  const monthTime = performance.now() - tMonthStart;
  console.log(`[Monthly Budget Aggregation] Baseline: ${monthTime.toFixed(1)}ms (Expenses: ${monthAgg.expense})`);

  // 5. Baseline Merchant Memory Scan
  const tMerchantStart = performance.now();
  const merchantEligible = baselineMerchantMemoryCount("Starbucks Coffee", transactions);
  const merchantTime = performance.now() - tMerchantStart;
  console.log(`[Merchant Memory Scan] Baseline: ${merchantTime.toFixed(1)}ms (Matches: ${merchantEligible.uncategorizedCount + merchantEligible.alreadyCategorizedCount})`);

  // 6. Duplicate Detection (5 scanned transactions against history)
  const scannedCandidates = [
    { amount: 50, merchant: "Starbucks Coffee #0", date: "2026-10-17" },
    { amount: 150, merchant: "Swiggy Food #10", date: "2026-10-17" },
    { amount: 99999, merchant: "Brand New Merchant", date: "2026-10-17" },
  ];

  const tDupStart = performance.now();
  const dupResults = baselineDuplicateDetection(scannedCandidates, transactions);
  const dupTime = performance.now() - tDupStart;
  console.log(`[Duplicate Detection] Baseline: ${dupTime.toFixed(1)}ms (Duplicates flagged: ${dupResults.length})`);

  return {
    count,
    sizeMb: `${sizeMb} MB`,
    serializeMs: Number(serializeTime.toFixed(1)),
    deserializeMs: Number(deserializeTime.toFixed(1)),
    balanceMs: Number(balTime.toFixed(1)),
    searchMs: Number(searchTime.toFixed(1)),
    monthlyAggMs: Number(monthTime.toFixed(1)),
    merchantScanMs: Number(merchantTime.toFixed(1)),
    duplicateDetectMs: Number(dupTime.toFixed(1)),
  };
}

const res1k = runBenchmarkForCount(1000);
const res10k = runBenchmarkForCount(10000);
const res50k = runBenchmarkForCount(50000);

console.log("\n=======================================================");
console.log("            BASELINE UNOPTIMIZED BENCHMARKS            ");
console.log("=======================================================");
console.table([res1k, res10k, res50k]);
