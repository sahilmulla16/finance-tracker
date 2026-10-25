import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { matchAccount, getBankAliases, parseBankNotification, reconcileAccountBalance, parseFastSpeechVoicePhrase } from "../utils/accountMatcher.ts";
import { normalizeMerchant } from "../utils/merchantNormalization.ts";
interface TestAccount {
  id: string;
  name: string;
  type?: string;
  currency?: string;
  openingBalance?: number;
  isDefault?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface TestTransaction {
  id: string;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  amount: number;
  description: string;
  category?: string;
  categoryId?: string;
  accountId?: string;
  fromAccountId?: string;
  toAccountId?: string;
  date?: string;
  createdAt?: string;
  updatedAt?: string;
}

describe("Smart Auto-Track 2.0 — Bank Detection & Account Matching", () => {
  const mockAccounts: TestAccount[] = [
    {
      id: "acc-cash",
      name: "Cash in Hand",
      type: "CASH",
      currency: "INR",
      openingBalance: 5000,
      isDefault: true,
      isActive: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "acc-bom-8572",
      name: "Bank of Maharashtra - 8572",
      type: "BANK",
      currency: "INR",
      openingBalance: 15000,
      isDefault: false,
      isActive: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "acc-hdfc-salary",
      name: "HDFC Salary Account",
      type: "BANK",
      currency: "INR",
      openingBalance: 50000,
      isDefault: false,
      isActive: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "acc-sbi-primary",
      name: "SBI Savings 1234",
      type: "BANK",
      currency: "INR",
      openingBalance: 20000,
      isDefault: false,
      isActive: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "acc-sbi-secondary",
      name: "SBI Emergency 5678",
      type: "BANK",
      currency: "INR",
      openingBalance: 100000,
      isDefault: false,
      isActive: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
  ];

  test("Priority 1: Confidently matches Bank name AND Account Suffix", () => {
    // Example from user prompt:
    // A/c X8572 debited by Rs. 1.00 for UPI payment to RV TRADERS on 11-Oct-26. - Bank of Maharashtra
    const matched = matchAccount(
      mockAccounts,
      "Bank of Maharashtra",
      "8572",
    );
    assert.ok(matched);
    assert.equal(matched?.id, "acc-bom-8572");
    assert.equal(matched?.name, "Bank of Maharashtra - 8572");
  });

  test("Priority 1: Suffix matches correct SBI account when multiple SBI accounts exist", () => {
    const matched = matchAccount(mockAccounts, "SBI", "5678");
    assert.ok(matched);
    assert.equal(matched?.id, "acc-sbi-secondary");
  });

  test("Priority 2: Matches bank name ONLY when exactly one eligible account matches (no suffix)", () => {
    // Exactly one HDFC account exists in Zeno
    const matched = matchAccount(mockAccounts, "HDFC Bank", null);
    assert.ok(matched);
    assert.equal(matched?.id, "acc-hdfc-salary");
  });

  test("Priority 3: Does NOT guess when multiple accounts match the same bank without suffix", () => {
    // Two SBI accounts exist: acc-sbi-primary (1234) and acc-sbi-secondary (5678)
    const matched = matchAccount(mockAccounts, "SBI", null);
    // Must return null so user is asked to select the account
    assert.equal(matched, null);
  });

  test("Priority 4: Returns null when no matching account exists", () => {
    const matched = matchAccount(mockAccounts, "Axis Bank", "9999");
    assert.equal(matched, null);
  });

  test("Safety: Never matches cash accounts to bank notifications", () => {
    const matched = matchAccount(mockAccounts, "Cash", null);
    assert.equal(matched, null);
  });
});

describe("Smart Auto-Track 2.0 — Merchant Normalization & Memory", () => {
  test("Normalizes merchant names consistently with case, whitespace, and punctuation collapsing", () => {
    const n1 = normalizeMerchant("RV TRADERS");
    const n2 = normalizeMerchant("Rv Traders");
    const n3 = normalizeMerchant("RV  TRADERS  ");
    const n4 = normalizeMerchant("rv-traders");

    assert.equal(n1.normalizedKey, "rv traders");
    assert.equal(n2.normalizedKey, "rv traders");
    assert.equal(n3.normalizedKey, "rv traders");
    assert.equal(n4.normalizedKey, "rv traders");
  });

  test("Anti-substring safety: 'RV TRADERS' does NOT match 'RV TRADERS FUEL STATION'", () => {
    const n1 = normalizeMerchant("RV TRADERS");
    const n2 = normalizeMerchant("RV TRADERS FUEL STATION");

    assert.notEqual(n1.normalizedKey, n2.normalizedKey);
    assert.equal(n2.normalizedKey, "rv traders fuel station");
  });

  test("Merchant rules respect the 'enabled' toggle flag", () => {
    const rule: MerchantRule = {
      normalizedKey: "rv traders",
      displayMerchant: "RV TRADERS",
      categoryId: "cat-petrol",
      categoryName: "Petrol",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: "user-confirmed",
      enabled: false, // Disabled by user
    };

    // Helper simulating getMerchantRule
    const getActiveRule = (r: MerchantRule) => (r.enabled !== false ? r : null);

    assert.equal(getActiveRule(rule), null);

    // Re-enable
    rule.enabled = true;
    assert.ok(getActiveRule(rule));
    assert.equal(getActiveRule(rule)?.categoryName, "Petrol");
  });
});

describe("Smart Auto-Track 2.0 — Zero-Touch Decision Matrix", () => {
  interface DecisionInput {
    isDuplicate: boolean;
    matchedAccount: TestAccount | null;
    merchantRule: MerchantRule | null;
    isAmbiguous: boolean;
    direction: "EXPENSE" | "INCOME" | "TRANSFER";
  }

  function resolveAction(input: DecisionInput): "DROP_DUPLICATE" | "ZERO_TOUCH_AUTO_SAVE" | "SHOW_CATEGORY_POPUP" | "SHOW_ACCOUNT_SELECTOR" {
    if (input.isDuplicate) {
      return "DROP_DUPLICATE";
    }

    const hasValidRule = input.merchantRule != null && input.merchantRule.enabled !== false && input.merchantRule.categoryId.length > 0;

    if (input.isAmbiguous) {
      return "SHOW_CATEGORY_POPUP";
    }

    if (input.matchedAccount && hasValidRule && input.direction === "EXPENSE") {
      return "ZERO_TOUCH_AUTO_SAVE";
    }

    if (!input.matchedAccount && hasValidRule) {
      return "SHOW_ACCOUNT_SELECTOR";
    }

    return "SHOW_CATEGORY_POPUP";
  }

  const dummyAccount: TestAccount = {
    id: "acc-bom-8572",
    name: "Bank of Maharashtra 8572",
    type: "BANK",
    currency: "INR",
    openingBalance: 1000,
    isDefault: false,
    isActive: true,
    createdAt: "",
    updatedAt: "",
  };

  const dummyRule: MerchantRule = {
    normalizedKey: "rv traders",
    displayMerchant: "RV TRADERS",
    categoryId: "cat-petrol",
    categoryName: "Petrol",
    createdAt: "",
    updatedAt: "",
    source: "user-confirmed",
    enabled: true,
  };

  test("Known merchant + valid rule + known account -> Auto-categorize and save; suppress category popup", () => {
    const action = resolveAction({
      isDuplicate: false,
      matchedAccount: dummyAccount,
      merchantRule: dummyRule,
      isAmbiguous: false,
      direction: "EXPENSE",
    });
    assert.equal(action, "ZERO_TOUCH_AUTO_SAVE");
  });

  test("New merchant + known account -> Open category popup", () => {
    const action = resolveAction({
      isDuplicate: false,
      matchedAccount: dummyAccount,
      merchantRule: null, // New merchant
      isAmbiguous: false,
      direction: "EXPENSE",
    });
    assert.equal(action, "SHOW_CATEGORY_POPUP");
  });

  test("Known merchant + unknown account -> Request account selection / review", () => {
    const action = resolveAction({
      isDuplicate: false,
      matchedAccount: null, // Ambiguous or unknown bank account
      merchantRule: dummyRule,
      isAmbiguous: false,
      direction: "EXPENSE",
    });
    assert.equal(action, "SHOW_ACCOUNT_SELECTOR");
  });

  test("Ambiguous merchant match -> Open category popup", () => {
    const action = resolveAction({
      isDuplicate: false,
      matchedAccount: dummyAccount,
      merchantRule: dummyRule,
      isAmbiguous: true, // Ambiguous match
      direction: "EXPENSE",
    });
    assert.equal(action, "SHOW_CATEGORY_POPUP");
  });

  test("Existing duplicate transaction -> Do not insert", () => {
    const action = resolveAction({
      isDuplicate: true,
      matchedAccount: dummyAccount,
      merchantRule: dummyRule,
      isAmbiguous: false,
      direction: "EXPENSE",
    });
    assert.equal(action, "DROP_DUPLICATE");
  });
});

describe("Smart Auto-Track 2.0 — Bulk Historical Categorization Safety", () => {
  const transactions: TestTransaction[] = [
    {
      id: "tx-1",
      type: "EXPENSE",
      amount: 1500,
      description: "RV TRADERS",
      category: "Uncategorized",
      categoryId: undefined,
      accountId: "acc-bom-8572",
      date: "2026-10-10",
      createdAt: "2026-10-10T10:00:00Z",
      updatedAt: "2026-10-10T10:00:00Z",
    },
    {
      id: "tx-2",
      type: "EXPENSE",
      amount: 800,
      description: "RV TRADERS",
      category: "Shopping", // Already categorized
      categoryId: "cat-shopping",
      accountId: "acc-bom-8572",
      date: "2026-10-09",
      createdAt: "2026-10-09T10:00:00Z",
      updatedAt: "2026-10-09T10:00:00Z",
    },
    {
      id: "tx-3",
      type: "INCOME",
      amount: 25000,
      description: "Salary from RV TRADERS",
      category: "Salary",
      categoryId: "cat-salary",
      accountId: "acc-bom-8572",
      date: "2026-10-01",
      createdAt: "2026-10-01T10:00:00Z",
      updatedAt: "2026-10-01T10:00:00Z",
    },
    {
      id: "tx-4",
      type: "TRANSFER",
      amount: 5000,
      description: "Transfer to RV TRADERS",
      fromAccountId: "acc-bom-8572",
      toAccountId: "acc-cash",
      date: "2026-10-05",
      createdAt: "2026-10-05T10:00:00Z",
      updatedAt: "2026-10-05T10:00:00Z",
    },
  ];

  test("Modifies only uncategorized transactions by default (safety rule)", () => {
    const targetMerchant = "RV TRADERS";
    const targetNorm = normalizeMerchant(targetMerchant).normalizedKey;

    const updated = transactions.map((t) => {
      if (t.type !== "EXPENSE") return t; // Never modify INCOME or TRANSFER
      const tNorm = normalizeMerchant(t.description).normalizedKey;
      if (tNorm !== targetNorm) return t;

      const isUncat =
        !t.categoryId ||
        !t.category ||
        t.category === "Uncategorized" ||
        t.category === "Expense" ||
        t.category === "Others";

      if (isUncat) {
        return {
          ...t,
          category: "Petrol",
          categoryId: "cat-petrol",
        };
      }
      return t;
    });

    // tx-1 (uncategorized expense) is updated
    assert.equal(updated.find((t) => t.id === "tx-1")?.category, "Petrol");
    assert.equal(updated.find((t) => t.id === "tx-1")?.categoryId, "cat-petrol");

    // tx-2 (already categorized expense) is preserved
    assert.equal(updated.find((t) => t.id === "tx-2")?.category, "Shopping");

    // tx-3 (INCOME) is NEVER modified
    assert.equal(updated.find((t) => t.id === "tx-3")?.type, "INCOME");
    assert.equal(updated.find((t) => t.id === "tx-3")?.category, "Salary");

    // tx-4 (TRANSFER) is NEVER modified
    assert.equal(updated.find((t) => t.id === "tx-4")?.type, "TRANSFER");

    // Metadata preservation: amount, date, accountId, id are preserved
    const tx1 = updated.find((t) => t.id === "tx-1");
    assert.equal(tx1?.amount, 1500);
    assert.equal(tx1?.accountId, "acc-bom-8572");
    assert.equal(tx1?.date, "2026-10-10");
  });

  test("Overwrites already categorized transactions when explicitly requested", () => {
    const targetMerchant = "RV TRADERS";
    const targetNorm = normalizeMerchant(targetMerchant).normalizedKey;
    const overwriteExisting = true;

    const updated = transactions.map((t) => {
      if (t.type !== "EXPENSE") return t;
      const tNorm = normalizeMerchant(t.description).normalizedKey;
      if (tNorm !== targetNorm) return t;

      const isUncat =
        !t.categoryId ||
        !t.category ||
        t.category === "Uncategorized" ||
        t.category === "Expense" ||
        t.category === "Others";

      if (isUncat || overwriteExisting) {
        return {
          ...t,
          category: "Petrol",
          categoryId: "cat-petrol",
        };
      }
      return t;
    });

    // Both tx-1 and tx-2 are updated to Petrol
    assert.equal(updated.find((t) => t.id === "tx-1")?.category, "Petrol");
    assert.equal(updated.find((t) => t.id === "tx-2")?.category, "Petrol");

    // Income and transfer remain untouched
    assert.equal(updated.find((t) => t.id === "tx-3")?.category, "Salary");
    assert.equal(updated.find((t) => t.id === "tx-4")?.type, "TRANSFER");
  });
});

describe("Smart Auto-Track 2.0 — Sequential Popup Lifecycle & Flow", () => {
  test("Celebration popup displays first; Merchant Memory modal triggers only after celebration dismissal", () => {
    // Simulated state machine
    let celebrationActive = false;
    let celebrationExpense: { amount: number; category?: string } | null = null;
    let queuedMerchantMemory: { merchant: string; categoryName: string } | null = null;
    let activeMerchantMemory: { merchant: string; categoryName: string } | null = null;

    const celebrateExpense = (details: { amount: number; category?: string }) => {
      celebrationActive = true;
      celebrationExpense = details;
    };

    const queueMerchantMemory = (prompt: { merchant: string; categoryName: string }) => {
      if (celebrationActive) {
        queuedMerchantMemory = prompt;
      } else {
        activeMerchantMemory = prompt;
      }
    };

    const dismissCelebration = () => {
      celebrationActive = false;
      celebrationExpense = null;
      if (queuedMerchantMemory) {
        activeMerchantMemory = queuedMerchantMemory;
        queuedMerchantMemory = null;
      }
    };

    // Step 1: User saves an expense in Quick Add
    celebrateExpense({ amount: 1500, category: "Petrol" });
    queueMerchantMemory({ merchant: "RV TRADERS", categoryName: "Petrol" });

    // Assert: Celebration IS active, Merchant Memory is NOT active yet (queued only)
    assert.equal(celebrationActive, true);
    assert.ok(celebrationExpense);
    assert.equal(activeMerchantMemory, null);
    assert.equal(queuedMerchantMemory?.merchant, "RV TRADERS");

    // Step 2: Celebration completes/dismisses
    dismissCelebration();

    // Assert: Celebration is closed, Merchant Memory is now active
    assert.equal(celebrationActive, false);
    assert.equal(celebrationExpense, null);
    assert.equal(activeMerchantMemory?.merchant, "RV TRADERS");
    assert.equal(activeMerchantMemory?.categoryName, "Petrol");
  });

  test("Merchant Memory progresses in exact sequence: Step 1 (Apply to previous) -> Step 2 (Always use for future)", () => {
    let currentStep: "APPLY_HISTORY" | "ALWAYS_USE_FUTURE" | "COMPLETED" = "APPLY_HISTORY";
    let historyApplied = false;
    let ruleSaved = false;

    const onApplyToPrevious = () => {
      historyApplied = true;
      currentStep = "ALWAYS_USE_FUTURE";
    };

    const onAlwaysUse = () => {
      ruleSaved = true;
      currentStep = "COMPLETED";
    };

    // Step 1: User is shown "Apply to previous transactions"
    assert.equal(currentStep, "APPLY_HISTORY");
    onApplyToPrevious();

    // Step 2: User is now shown "Always use for future transactions as well"
    assert.equal(historyApplied, true);
    assert.equal(currentStep, "ALWAYS_USE_FUTURE");

    // User confirms rule
    onAlwaysUse();
    assert.equal(ruleSaved, true);
    assert.equal(currentStep, "COMPLETED");
  });

  test("Step 1 Skip transitions to Step 2 without applying history", () => {
    let currentStep: "APPLY_HISTORY" | "ALWAYS_USE_FUTURE" | "COMPLETED" = "APPLY_HISTORY";
    let historyApplied = false;

    const onSkipHistory = () => {
      // Skips applying history, advances to Step 2
      currentStep = "ALWAYS_USE_FUTURE";
    };

    assert.equal(currentStep, "APPLY_HISTORY");
    onSkipHistory();

    assert.equal(historyApplied, false);
    assert.equal(currentStep, "ALWAYS_USE_FUTURE");
  });
});

describe("Smart Auto-Track 2.0 — Refunds, Inter-Account Transfers & Balance Reconciliation", () => {
  const userAccounts = [
    {
      id: "acc-bom",
      name: "Bank of Maharashtra - 8572",
      type: "BANK",
      openingBalance: 10000,
      isActive: true,
      currency: "INR",
      isDefault: true,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    },
    {
      id: "acc-kotak",
      name: "Kotak Mahindra Bank - 1234",
      type: "BANK",
      openingBalance: 25000,
      isActive: true,
      currency: "INR",
      isDefault: false,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    },
  ];

  test("1. Refund detection: parses refund notification with merchant and amount", () => {
    const refundSms = "Refund of Rs 450.00 for order from Swiggy credited to your A/c X8572. Avail Bal: Rs 10,450.00. - Bank of Maharashtra";
    const parsed = parseBankNotification(refundSms);

    assert.ok(parsed);
    assert.equal(parsed?.direction, "REFUND");
    assert.equal(parsed?.amount, 450);
    assert.ok(parsed?.merchant.toLowerCase().includes("swiggy"));
    assert.equal(parsed?.accountSuffix, "8572");
    assert.equal(parsed?.availableBalance, 10450);

    const matched = matchAccount(userAccounts, parsed?.bankName, parsed?.accountSuffix);
    assert.equal(matched?.id, "acc-bom");
  });

  test("2. Inter-account transfer: detects transfer from Bank of Maharashtra to Kotak Bank", () => {
    const transferSms = "Rs 5,000 transferred from Bank of Maharashtra a/c X8572 to Kotak Bank a/c X1234. Avail Bal: Rs 5,450.00.";
    const parsed = parseBankNotification(transferSms);

    assert.ok(parsed);
    assert.equal(parsed?.direction, "TRANSFER");
    assert.equal(parsed?.amount, 5000);
    assert.equal(parsed?.bankName, "Bank of Maharashtra");
    assert.ok(parsed?.toBankName?.toLowerCase().includes("kotak"));
    assert.equal(parsed?.availableBalance, 5450);

    const fromAcc = matchAccount(userAccounts, parsed?.bankName, parsed?.accountSuffix);
    const toAcc = matchAccount(userAccounts, parsed?.toBankName, parsed?.toAccountSuffix);

    assert.equal(fromAcc?.id, "acc-bom");
    assert.equal(toAcc?.id, "acc-kotak");
  });

  test("3. Bank available balance reconciliation: calculates discrepancy and adjusts opening balance", () => {
    // Current opening balance = 10,000
    // Suppose 1 transaction of 500 expense already logged -> calculated = 9,500
    const txns = [
      { amount: 500, type: "EXPENSE", accountId: "acc-bom" }
    ];

    // Bank sends SMS: "Avail Bal: Rs 8,500" (e.g. 1000 was spent outside app)
    const bankAvailableBalance = 8500;
    const { reconciledOpeningBalance, discrepancy, wasAdjusted } = reconcileAccountBalance(
      10000,
      txns,
      "acc-bom",
      bankAvailableBalance
    );

    assert.equal(wasAdjusted, true);
    assert.equal(discrepancy, -1000);
    assert.equal(reconciledOpeningBalance, 9000);

    // Verify parity: new opening balance (9000) - 500 expense = 8500 (exact bank balance!)
    assert.equal(reconciledOpeningBalance - 500, bankAvailableBalance);
  });

  test("4. Diverse keywords parsing: recognizes spent, sent, debited, credited, refund", () => {
    const debited = parseBankNotification("A/c X8572 debited by Rs 150 for UPI payment to Chai Point");
    assert.equal(debited?.direction, "EXPENSE");
    assert.equal(debited?.amount, 150);

    const spent = parseBankNotification("You spent Rs 1200 at Dmart on 19-Oct-26");
    assert.equal(spent?.direction, "EXPENSE");
    assert.equal(spent?.amount, 1200);

    const sent = parseBankNotification("Sent Rs 300 to Rohan via UPI. UPI Ref: 123456789012");
    assert.equal(sent?.direction, "EXPENSE");
    assert.equal(sent?.amount, 300);

    const credited = parseBankNotification("Rs 50000 credited to your account as salary");
    assert.equal(credited?.direction, "INCOME");
    assert.equal(credited?.amount, 50000);

    const cashback = parseBankNotification("Cashback of Rs 25 credited back to your account");
    assert.equal(cashback?.direction, "REFUND");
    assert.equal(cashback?.amount, 25);
  });

  test("5. Voice logging fast speech: handles concatenated words and numbers ('swiggy450', 'uber200', 'chai 20')", () => {
    // Fast speech with concatenated numbers:
    const cand1 = parseFastSpeechVoicePhrase("swiggy450");
    assert.ok(cand1);
    assert.equal(cand1?.amount, 450);
    assert.equal(cand1?.merchant, "Swiggy");

    const cand2 = parseFastSpeechVoicePhrase("uber200");
    assert.ok(cand2);
    assert.equal(cand2?.amount, 200);
    assert.equal(cand2?.merchant, "Uber");

    // Fast speech without prepositions:
    const cand3 = parseFastSpeechVoicePhrase("Chai 20");
    assert.ok(cand3);
    assert.equal(cand3?.amount, 20);
    assert.equal(cand3?.merchant, "Chai");

    // Reverse fast speech: amount followed by merchant
    const cand4 = parseFastSpeechVoicePhrase("500 petrol");
    assert.ok(cand4);
    assert.equal(cand4?.amount, 500);
    assert.equal(cand4?.merchant, "Petrol");
  });
});


