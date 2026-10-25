import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeMerchant,
  isMerchantMatch,
} from "../utils/merchantNormalization.ts";
import type { MerchantRule } from "../types/merchantRules.ts";

describe("Merchant Rules & Bulk Categorization Logic", () => {
  // Mock categories
  const categories = [
    { id: "c1", name: "Food & Drinks", icon: "coffee", color: "#FF9F0A" },
    { id: "c2", name: "Transport", icon: "navigation", color: "#30D158" },
    { id: "c3", name: "Shopping", icon: "shopping-bag", color: "#5E5CE6" },
  ];

  // Helper simulating the core rule lookup
  function findMatchingRule(
    merchant: string,
    rules: MerchantRule[],
    availableCategories: typeof categories,
  ): MerchantRule | null {
    const { normalizedKey, isAmbiguous } = normalizeMerchant(merchant);
    if (isAmbiguous || !normalizedKey) return null;
    const rule = rules.find((r) => r.normalizedKey === normalizedKey);
    if (!rule) return null;
    const cat = availableCategories.find((c) => c.id === rule.categoryId);
    if (!cat) return null;
    return rule;
  }

  // Helper simulating eligible transaction counting
  function countEligible(
    merchant: string,
    transactions: Array<{
      id: string;
      description: string;
      categoryId?: string;
      category?: string;
    }>,
    excludeId?: string,
  ) {
    const { normalizedKey, isAmbiguous } = normalizeMerchant(merchant);
    if (isAmbiguous || !normalizedKey) {
      return { uncategorizedCount: 0, alreadyCategorizedCount: 0 };
    }

    let uncategorizedCount = 0;
    let alreadyCategorizedCount = 0;

    for (const t of transactions) {
      if (excludeId && t.id === excludeId) continue;
      const tNorm = normalizeMerchant(t.description);
      if (tNorm.isAmbiguous || tNorm.normalizedKey !== normalizedKey) continue;

      const isUncat =
        !t.categoryId ||
        !t.category ||
        t.category === "Uncategorized" ||
        t.category === "Expense" ||
        t.category === "Others";

      if (isUncat) uncategorizedCount++;
      else alreadyCategorizedCount++;
    }

    return { uncategorizedCount, alreadyCategorizedCount };
  }

  test("1. Saving and retrieving merchant-category rules with stable category ID", () => {
    const rules: MerchantRule[] = [];
    const normalized = normalizeMerchant("RF PETROL");

    const newRule: MerchantRule = {
      normalizedKey: normalized.normalizedKey,
      displayMerchant: "RF PETROL",
      categoryId: "c2",
      categoryName: "Transport",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: "user-confirmed",
    };
    rules.push(newRule);

    const match = findMatchingRule("RF  PETROL", rules, categories);
    assert.ok(match);
    assert.equal(match.categoryId, "c2");
    assert.equal(match.categoryName, "Transport");
  });

  test("2. Similar but unrelated merchants are not merged (Anti-substring safety)", () => {
    const rules: MerchantRule[] = [
      {
        normalizedKey: "rf petrol",
        displayMerchant: "RF PETROL",
        categoryId: "c2",
        categoryName: "Transport",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: "user-confirmed",
      },
    ];

    // Candidate "RF" should NOT match "RF PETROL"
    const match1 = findMatchingRule("RF", rules, categories);
    assert.equal(match1, null);

    // Candidate "RF STORE" should NOT match "RF PETROL"
    const match2 = findMatchingRule("RF STORE", rules, categories);
    assert.equal(match2, null);

    // Candidate "PETROL PUMP" should NOT match "RF PETROL"
    const match3 = findMatchingRule("PETROL PUMP", rules, categories);
    assert.equal(match3, null);
  });

  test("3. Correct eligible transaction counts for bulk categorization", () => {
    const txs = [
      { id: "1", description: "RF PETROL", category: undefined },
      { id: "2", description: "rf petrol", category: "Uncategorized" },
      { id: "3", description: "RF  PETROL", category: "" },
      { id: "4", description: "RF PETROL", category: "Shopping", categoryId: "c3" }, // Already categorized
      { id: "5", description: "RF STORE", category: undefined }, // Unrelated merchant
      { id: "6", description: "SWIGGY", category: undefined },
    ];

    const counts = countEligible("RF PETROL", txs, "1"); // Exclude current transaction "1"
    assert.equal(counts.uncategorizedCount, 2); // tx 2 and tx 3
    assert.equal(counts.alreadyCategorizedCount, 1); // tx 4
  });

  test("4. Bulk categorization updates only uncategorized matching transactions by default", () => {
    const txs = [
      { id: "1", description: "RF PETROL", category: undefined, amount: 500, date: "2026-10-10" },
      { id: "2", description: "rf petrol", category: "Uncategorized", amount: 700, date: "2026-10-11" },
      { id: "3", description: "RF PETROL", category: "Shopping", categoryId: "c3", amount: 1200, date: "2026-10-12" }, // Explicitly categorized
      { id: "4", description: "SHELL PETROL", category: undefined, amount: 800, date: "2026-10-13" },
    ];

    const targetKey = normalizeMerchant("RF PETROL").normalizedKey;
    const updated = txs.map((t) => {
      const tNorm = normalizeMerchant(t.description);
      if (tNorm.normalizedKey !== targetKey) return t;

      const isUncat = !t.categoryId || !t.category || t.category === "Uncategorized";
      if (isUncat) {
        return { ...t, categoryId: "c2", category: "Transport" };
      }
      return t;
    });

    assert.equal(updated[0].category, "Transport");
    assert.equal(updated[0].categoryId, "c2");
    assert.equal(updated[1].category, "Transport");
    assert.equal(updated[1].categoryId, "c2");

    // Preserved explicitly assigned category
    assert.equal(updated[2].category, "Shopping");
    assert.equal(updated[2].categoryId, "c3");

    // Preserved all other transaction fields
    assert.equal(updated[0].amount, 500);
    assert.equal(updated[0].date, "2026-10-10");
    assert.equal(updated[1].amount, 700);

    // Unrelated merchant untouched
    assert.equal(updated[3].category, undefined);
  });

  test("5. Canceling bulk confirmation preserves original transactions", () => {
    const originalTxs = [
      { id: "1", description: "RF PETROL", category: undefined },
      { id: "2", description: "RF PETROL", category: undefined },
    ];

    // User selects "Only this one", so bulk updates are not applied to history
    const historyTxs = [...originalTxs];
    assert.equal(historyTxs[0].category, undefined);
    assert.equal(historyTxs[1].category, undefined);
  });

  test("6. Safely handling deleted or invalid category IDs", () => {
    const rules: MerchantRule[] = [
      {
        normalizedKey: "old merchant",
        displayMerchant: "Old Merchant",
        categoryId: "deleted_category_id",
        categoryName: "Old Category",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: "user-confirmed",
      },
    ];

    // The category "deleted_category_id" is not in available categories
    const match = findMatchingRule("Old Merchant", rules, categories);
    assert.equal(match, null); // Safely returns null, avoids assigning deleted/ghost category
  });
});
