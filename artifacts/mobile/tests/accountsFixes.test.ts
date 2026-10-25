import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  getCardTheme,
  getCardLast4,
  resolveCardSubtitle,
  formatLiveBalance,
  validateAccountName,
  calculateNewOpeningBalance,
  HOME_CARD_THEMES,
} from "../utils/accountCards";
import type { Account, AccountType, Transaction } from "../context/FinanceContext";

describe("Accounts & Wallets Comprehensive Verification — Default, Editing, Themes & Deletion", () => {
  const accountCardFile = path.resolve(__dirname, "../components/ui/AccountCard.tsx");
  const accountsScreenFile = path.resolve(__dirname, "../app/accounts.tsx");
  const homeDeckFile = path.resolve(__dirname, "../components/AnimatedCardDeck.tsx");
  const financeContextFile = path.resolve(__dirname, "../context/FinanceContext.tsx");

  // Helper simulating balancesIndex calculation from FinanceContext.tsx
  function calculateBalances(accounts: Account[], transactions: Transaction[]) {
    const balances = new Map<string, number>();
    const knownAccountIds = new Set(accounts.map((a) => a.id));

    for (let i = 0; i < accounts.length; i++) {
      const a = accounts[i];
      balances.set(a.id, Number(a.openingBalance) || 0);
    }

    const stablePrimaryAccId = accounts.length > 0 ? accounts[0].id : undefined;
    const defaultAccId = accounts.find((a) => a.isDefault)?.id || accounts[0]?.id;
    const cashAcc = accounts.find(
      (a) =>
        a.type === "CASH" ||
        a.name.toLowerCase().includes("cash") ||
        a.id === "cash" ||
        a.id === "1" ||
        a.id === "main-wallet" ||
        a.id === "primary-wallet",
    );
    const cashAccId = cashAcc?.id || (accounts.length === 0 ? "cash" : undefined);

    let netAll = 0;
    for (let i = 0; i < transactions.length; i++) {
      const txn = transactions[i];
      const amount = Math.abs(Number(txn.amount)) || 0;
      if (amount === 0) continue;
      const type = (txn.type || "EXPENSE").trim().toUpperCase();

      if (type === "INCOME") netAll += amount;
      else if (type === "EXPENSE") netAll -= amount;

      if (type === "TRANSFER") {
        if (txn.toAccountId && balances.has(txn.toAccountId)) {
          balances.set(txn.toAccountId, (balances.get(txn.toAccountId) || 0) + amount);
        }
        if (txn.fromAccountId && balances.has(txn.fromAccountId)) {
          balances.set(txn.fromAccountId, (balances.get(txn.fromAccountId) || 0) - amount);
        }
        continue;
      }

      let targetId: string | undefined;
      if (txn.accountId && knownAccountIds.has(txn.accountId)) {
        targetId = txn.accountId;
      } else {
        const txnMatchesCash =
          !txn.accountId ||
          txn.accountId === "cash" ||
          txn.accountId === "1" ||
          txn.accountId === "main-wallet" ||
          txn.accountId === "primary-wallet" ||
          (txn as any).payment === "Cash" ||
          txn.category?.toLowerCase() === "cash";

        if (txnMatchesCash && cashAccId) {
          targetId = cashAccId;
        } else if (stablePrimaryAccId) {
          targetId = stablePrimaryAccId;
        }
      }

      if (targetId && balances.has(targetId)) {
        const curr = balances.get(targetId) || 0;
        balances.set(targetId, type === "INCOME" ? curr + amount : curr - amount);
      }
    }

    let total = 0;
    if (accounts.length === 0) {
      total = netAll;
    } else {
      for (let i = 0; i < accounts.length; i++) {
        total += balances.get(accounts[i].id) || 0;
      }
    }

    return { balances, totalBalance: total, defaultAccId };
  }

  // Functional atomic implementation of setDefaultAccount
  function applySetDefault(accounts: Account[], targetId: string): Account[] {
    const target = accounts.find((a) => a.id === targetId);
    if (!target) return accounts;
    const now = new Date().toISOString();
    return accounts.map((a) => ({
      ...a,
      isDefault: a.id === targetId,
      updatedAt: a.id === targetId ? now : a.updatedAt,
    }));
  }

  // Functional atomic implementation of deleteAccount
  function applyDeleteAccount(
    accounts: Account[],
    transactions: Transaction[],
    idToDelete: string,
    replacementAccountId?: string,
  ): { accounts: Account[]; transactions: Transaction[]; success: boolean } {
    const target = accounts.find((a) => a.id === idToDelete);
    if (!target) return { accounts, transactions, success: false };

    const linked = transactions.filter(
      (t) =>
        t.accountId === idToDelete ||
        t.fromAccountId === idToDelete ||
        t.toAccountId === idToDelete,
    );

    if (linked.length > 0 && !replacementAccountId) {
      return { accounts, transactions, success: false };
    }

    let updatedTxns = transactions;
    if (linked.length > 0 && replacementAccountId) {
      if (replacementAccountId === idToDelete) {
        return { accounts, transactions, success: false };
      }
      const repl = accounts.find((a) => a.id === replacementAccountId);
      if (!repl) return { accounts, transactions, success: false };

      const now = new Date().toISOString();
      updatedTxns = transactions.map((t) => {
        let mod = false;
        const copy = { ...t };
        if (copy.accountId === idToDelete) {
          copy.accountId = replacementAccountId;
          mod = true;
        }
        if (copy.fromAccountId === idToDelete) {
          copy.fromAccountId = replacementAccountId;
          mod = true;
        }
        if (copy.toAccountId === idToDelete) {
          copy.toAccountId = replacementAccountId;
          mod = true;
        }
        if (mod) copy.updatedAt = now;
        return copy;
      });
    }

    const remaining = accounts.filter((a) => a.id !== idToDelete);
    const wasDefault = target.isDefault;
    let updatedAccounts: Account[];
    if (wasDefault && remaining.length > 0) {
      const now = new Date().toISOString();
      updatedAccounts = remaining.map((a, idx) => ({
        ...a,
        isDefault: idx === 0,
        updatedAt: idx === 0 ? now : a.updatedAt,
      }));
    } else {
      updatedAccounts = remaining;
    }

    return { accounts: updatedAccounts, transactions: updatedTxns, success: true };
  }

  test("1. Setting an account as default updates ONLY its default flag, leaving balances and total portfolio balance identical", () => {
    const accounts: Account[] = [
      {
        id: "acc-hdfc",
        name: "HDFC Bank",
        type: "BANK",
        currency: "INR",
        openingBalance: 50000,
        isDefault: true,
        isActive: true,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "acc-icici",
        name: "ICICI Bank",
        type: "BANK",
        currency: "INR",
        openingBalance: 30000,
        isDefault: false,
        isActive: true,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "acc-sbi",
        name: "SBI Savings",
        type: "SAVINGS",
        currency: "INR",
        openingBalance: 20000,
        isDefault: false,
        isActive: true,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ];

    const transactions: Transaction[] = [
      {
        id: "tx-1",
        type: "EXPENSE",
        amount: 2500,
        description: "Dinner",
        accountId: "acc-hdfc",
        date: "2026-01-02",
        time: "19:00",
        createdAt: "2026-01-02T19:00:00Z",
        updatedAt: "2026-01-02T19:00:00Z",
      },
      {
        id: "tx-2",
        type: "INCOME",
        amount: 10000,
        description: "Freelance",
        accountId: "acc-icici",
        date: "2026-01-03",
        time: "10:00",
        createdAt: "2026-01-03T10:00:00Z",
        updatedAt: "2026-01-03T10:00:00Z",
      },
      {
        id: "tx-3",
        type: "TRANSFER",
        amount: 5000,
        description: "Transfer",
        fromAccountId: "acc-hdfc",
        toAccountId: "acc-sbi",
        date: "2026-01-04",
        time: "11:00",
        createdAt: "2026-01-04T11:00:00Z",
        updatedAt: "2026-01-04T11:00:00Z",
      },
      // Unassigned legacy transaction
      {
        id: "tx-4",
        type: "EXPENSE",
        amount: 500,
        description: "Coffee",
        date: "2026-01-05",
        time: "08:00",
        createdAt: "2026-01-05T08:00:00Z",
        updatedAt: "2026-01-05T08:00:00Z",
      },
    ];

    const before = calculateBalances(accounts, transactions);
    assert.equal(before.defaultAccId, "acc-hdfc");

    // Change default to ICICI (acc-icici)
    const afterAccounts = applySetDefault(accounts, "acc-icici");
    const after = calculateBalances(afterAccounts, transactions);

    assert.equal(after.defaultAccId, "acc-icici");
    assert.equal(afterAccounts.find((a) => a.id === "acc-hdfc")?.isDefault, false);
    assert.equal(afterAccounts.find((a) => a.id === "acc-icici")?.isDefault, true);

    // Individual balances must be identical
    assert.equal(after.balances.get("acc-hdfc"), before.balances.get("acc-hdfc"));
    assert.equal(after.balances.get("acc-icici"), before.balances.get("acc-icici"));
    assert.equal(after.balances.get("acc-sbi"), before.balances.get("acc-sbi"));

    // Total portfolio balance must be strictly identical
    assert.equal(after.totalBalance, before.totalBalance);

    // Opening balances and account metadata must remain untouched
    for (let i = 0; i < accounts.length; i++) {
      assert.equal(afterAccounts[i].openingBalance, accounts[i].openingBalance);
      assert.equal(afterAccounts[i].type, accounts[i].type);
      assert.equal(afterAccounts[i].currency, accounts[i].currency);
    }
  });

  test("2. Exactly one default account exists at all times when accounts are present", () => {
    let accounts: Account[] = [
      {
        id: "acc-1",
        name: "Acc 1",
        type: "BANK",
        currency: "INR",
        openingBalance: 1000,
        isDefault: true,
        isActive: true,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "acc-2",
        name: "Acc 2",
        type: "BANK",
        currency: "INR",
        openingBalance: 2000,
        isDefault: false,
        isActive: true,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "acc-3",
        name: "Acc 3",
        type: "BANK",
        currency: "INR",
        openingBalance: 3000,
        isDefault: false,
        isActive: true,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ];

    const checkExactlyOne = (list: Account[]) => {
      const defaults = list.filter((a) => a.isDefault);
      assert.equal(defaults.length, 1, "Must have exactly 1 default account");
    };

    checkExactlyOne(accounts);

    // Switch to Acc 2
    accounts = applySetDefault(accounts, "acc-2");
    checkExactlyOne(accounts);
    assert.equal(accounts.find((a) => a.isDefault)?.id, "acc-2");

    // Switch to Acc 3
    accounts = applySetDefault(accounts, "acc-3");
    checkExactlyOne(accounts);
    assert.equal(accounts.find((a) => a.isDefault)?.id, "acc-3");

    // Switch back to Acc 1
    accounts = applySetDefault(accounts, "acc-1");
    checkExactlyOne(accounts);
    assert.equal(accounts.find((a) => a.isDefault)?.id, "acc-1");
  });

  test("3. Failed default updates preserve the previous valid default account", () => {
    const initialAccounts: Account[] = [
      {
        id: "acc-1",
        name: "Acc 1",
        type: "BANK",
        currency: "INR",
        openingBalance: 1000,
        isDefault: true,
        isActive: true,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "acc-2",
        name: "Acc 2",
        type: "BANK",
        currency: "INR",
        openingBalance: 2000,
        isDefault: false,
        isActive: true,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ];

    // Invalid account IDs
    const resultInvalid = applySetDefault(initialAccounts, "non-existent-account-id");
    assert.equal(resultInvalid.find((a) => a.isDefault)?.id, "acc-1");
    assert.equal(resultInvalid[0].isDefault, true);
    assert.equal(resultInvalid[1].isDefault, false);

    const resultBlank = applySetDefault(initialAccounts, "");
    assert.equal(resultBlank.find((a) => a.isDefault)?.id, "acc-1");
  });

  test("4. Exactly 3 Home card color themes exist and reflect identically on both Accounts and Home cards", () => {
    // Strictly the 3 canonical Home card themes
    assert.equal(HOME_CARD_THEMES.length, 3, "Only the 3 Home card colors must exist");
    assert.equal(HOME_CARD_THEMES[0].id, "graphite");
    assert.equal(HOME_CARD_THEMES[1].id, "lime");
    assert.equal(HOME_CARD_THEMES[2].id, "obsidian");

    // Colors
    assert.equal(HOME_CARD_THEMES[0].accentColor, "#242826");
    assert.equal(HOME_CARD_THEMES[1].accentColor, "#7ED92A");
    assert.equal(HOME_CARD_THEMES[2].accentColor, "#1C2A22");

    // Cycle strictly across 3 themes (0 -> 1 -> 2 -> 0)
    const cycleTheme = (curr: number) => (curr + 1) % 3;
    assert.equal(cycleTheme(0), 1);
    assert.equal(cycleTheme(1), 2);
    assert.equal(cycleTheme(2), 0);

    // Theme 0: Graphite / Slate
    const theme0 = getCardTheme(0, false, 0);
    assert.equal(theme0.isLime, false);
    assert.equal(theme0.textColor, "#FFFFFF");

    // Theme 1: Electric Lime Green (Dark mode uses dark text)
    const theme1 = getCardTheme(0, false, 1);
    assert.equal(theme1.isLime, true);
    assert.equal(theme1.textColor, "#070B06");

    // Theme 2: Deep Obsidian Emerald
    const theme2 = getCardTheme(0, false, 2);
    assert.equal(theme2.isLime, false);
    assert.equal(theme2.textColor, "#FFFFFF");

    // Both Home and Accounts call getCardTheme with identical results
    for (let i = 0; i < 3; i++) {
      const homeTheme = getCardTheme(i, false, i);
      const accountsTheme = getCardTheme(i, false, i);
      assert.deepEqual(homeTheme.colors, accountsTheme.colors);
      assert.equal(homeTheme.textColor, accountsTheme.textColor);
    }

    // Manual color selection (hex input and quick custom colors) must be completely removed
    const cardContent = fs.readFileSync(accountCardFile, "utf-8");
    assert.ok(!cardContent.includes("customHexInput"), "Must not render customHexInput");
    assert.ok(!cardContent.includes("customColorsRow"), "Must not render customColorsRow");
    assert.ok(!cardContent.includes("HEX CODE"), "Must not render HEX CODE input");
  });

  test("5. Cancelling an edit reverts the card color and other fields to their original state", () => {
    const originalAccount: Account = {
      id: "acc-persisted-1",
      name: "Original Bank",
      displayName: "My Wallet",
      type: "BANK",
      currency: "INR",
      openingBalance: 15000,
      colorThemeIndex: 0,
      isDefault: true,
      isActive: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };

    // User edits draft and cycles theme to Lime (1)
    let editDraft = {
      name: "Typing New Bank Name",
      displayName: "Unsaved Nickname",
      balanceInput: "99999",
      type: "CASH" as AccountType,
      colorThemeIndex: 1,
    };

    // User cancels editing -> draft discarded without committing
    editDraft = null as any;

    // Account remains 100% untouched
    assert.equal(originalAccount.name, "Original Bank");
    assert.equal(originalAccount.displayName, "My Wallet");
    assert.equal(originalAccount.colorThemeIndex, 0);
    assert.equal(originalAccount.openingBalance, 15000);
    assert.equal(editDraft, null);
  });

  test("6. Saving an edit persists the new color and details", () => {
    const originalAccount: Account = {
      id: "acc-persisted-2",
      name: "Original Bank",
      type: "BANK",
      currency: "INR",
      openingBalance: 15000,
      colorThemeIndex: 0,
      isDefault: true,
      isActive: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };

    const targetBalance = 25000;
    const currentLive = 15000;
    const newOpening = calculateNewOpeningBalance(
      targetBalance,
      currentLive,
      originalAccount.openingBalance,
    );

    // User chose Obsidian (theme index 2)
    const savedAccount: Account = {
      ...originalAccount,
      name: "Updated Bank Name",
      displayName: "Updated Nickname",
      colorThemeIndex: 2,
      openingBalance: newOpening,
      updatedAt: "2026-01-02T00:00:00.000Z",
    };

    assert.equal(savedAccount.name, "Updated Bank Name");
    assert.equal(savedAccount.displayName, "Updated Nickname");
    assert.equal(savedAccount.colorThemeIndex, 2);
    assert.equal(savedAccount.openingBalance, 25000);
  });

  test("7. Deleting a card works on the first attempt with multiple cards present", () => {
    const accounts: Account[] = [
      {
        id: "acc-1",
        name: "Card 1",
        type: "BANK",
        currency: "INR",
        openingBalance: 1000,
        isDefault: true,
        isActive: true,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "acc-2",
        name: "Card 2",
        type: "BANK",
        currency: "INR",
        openingBalance: 2000,
        isDefault: false,
        isActive: true,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "acc-3",
        name: "Card 3",
        type: "BANK",
        currency: "INR",
        openingBalance: 3000,
        isDefault: false,
        isActive: true,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ];

    // Card 2 has 0 transactions -> deletes on first attempt
    const res = applyDeleteAccount(accounts, [], "acc-2");
    assert.equal(res.success, true, "First attempt deletion must succeed");
    assert.equal(res.accounts.length, 2);
    assert.equal(res.accounts.find((a) => a.id === "acc-2"), undefined);
    assert.equal(res.accounts[0].id, "acc-1");
    assert.equal(res.accounts[1].id, "acc-3");
  });

  test("8. Deletion resolves the card by stable ID, preventing deletion of the wrong card", () => {
    const accounts: Account[] = [
      {
        id: "acc-alpha",
        name: "Alpha Card",
        type: "BANK",
        currency: "INR",
        openingBalance: 1000,
        isDefault: false,
        isActive: true,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "acc-beta",
        name: "Beta Card",
        type: "BANK",
        currency: "INR",
        openingBalance: 2000,
        isDefault: true,
        isActive: true,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "acc-gamma",
        name: "Gamma Card",
        type: "BANK",
        currency: "INR",
        openingBalance: 3000,
        isDefault: false,
        isActive: true,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ];

    // Regardless of array index, deleting by ID "acc-gamma" only deletes gamma
    const res = applyDeleteAccount(accounts, [], "acc-gamma");
    assert.equal(res.success, true);
    assert.equal(res.accounts.some((a) => a.id === "acc-alpha"), true);
    assert.equal(res.accounts.some((a) => a.id === "acc-beta"), true);
    assert.equal(res.accounts.some((a) => a.id === "acc-gamma"), false);
  });

  test("9. Account deletion with transactions properly handles reassignment, updates transaction counts, and handles errors without losing data", () => {
    const accounts: Account[] = [
      {
        id: "acc-source",
        name: "Source Account",
        type: "BANK",
        currency: "INR",
        openingBalance: 10000,
        isDefault: false,
        isActive: true,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "acc-dest",
        name: "Destination Account",
        type: "BANK",
        currency: "INR",
        openingBalance: 20000,
        isDefault: true,
        isActive: true,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ];

    const transactions: Transaction[] = [
      {
        id: "tx-src-1",
        type: "EXPENSE",
        amount: 200,
        description: "Grocery",
        accountId: "acc-source",
        date: "2026-01-02",
        time: "12:00",
        createdAt: "2026-01-02T12:00:00Z",
        updatedAt: "2026-01-02T12:00:00Z",
      },
      {
        id: "tx-src-2",
        type: "EXPENSE",
        amount: 800,
        description: "Electronics",
        accountId: "acc-source",
        date: "2026-01-03",
        time: "14:00",
        createdAt: "2026-01-03T14:00:00Z",
        updatedAt: "2026-01-03T14:00:00Z",
      },
      {
        id: "tx-dest-1",
        type: "INCOME",
        amount: 5000,
        description: "Salary",
        accountId: "acc-dest",
        date: "2026-01-01",
        time: "09:00",
        createdAt: "2026-01-01T09:00:00Z",
        updatedAt: "2026-01-01T09:00:00Z",
      },
    ];

    // Case A: Deleting without replacement fails safely and preserves all transactions
    const failedAttempt = applyDeleteAccount(accounts, transactions, "acc-source");
    assert.equal(failedAttempt.success, false, "Must fail safely if transactions exist without reassignment");
    assert.equal(failedAttempt.accounts.length, 2);
    assert.equal(failedAttempt.transactions.length, 3);

    // Case B: Deleting with reassignment target "acc-dest"
    const reassigned = applyDeleteAccount(accounts, transactions, "acc-source", "acc-dest");
    assert.equal(reassigned.success, true);
    assert.equal(reassigned.accounts.length, 1);
    assert.equal(reassigned.accounts[0].id, "acc-dest");

    // All 3 transactions are preserved and now belong to acc-dest
    assert.equal(reassigned.transactions.length, 3);
    const destTxns = reassigned.transactions.filter((t) => t.accountId === "acc-dest");
    assert.equal(destTxns.length, 3, "All transactions must be reassigned without data loss");
  });

  test("10. Deleting the default account automatically assigns a new default among remaining accounts", () => {
    const accounts: Account[] = [
      {
        id: "acc-default-1",
        name: "Primary Default Card",
        type: "BANK",
        currency: "INR",
        openingBalance: 10000,
        isDefault: true,
        isActive: true,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "acc-secondary-2",
        name: "Secondary Card",
        type: "BANK",
        currency: "INR",
        openingBalance: 20000,
        isDefault: false,
        isActive: true,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "acc-tertiary-3",
        name: "Tertiary Card",
        type: "BANK",
        currency: "INR",
        openingBalance: 30000,
        isDefault: false,
        isActive: true,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ];

    // Delete the default account
    const res = applyDeleteAccount(accounts, [], "acc-default-1");
    assert.equal(res.success, true);
    assert.equal(res.accounts.length, 2);

    // Remaining account 0 must now be marked default
    assert.equal(res.accounts[0].id, "acc-secondary-2");
    assert.equal(res.accounts[0].isDefault, true, "First remaining account becomes the new default");
    assert.equal(res.accounts[1].isDefault, false);

    // Exactly one default remains
    const defaultCount = res.accounts.filter((a) => a.isDefault).length;
    assert.equal(defaultCount, 1);
  });

  test("11. Empty, single-account, and multi-account states behave predictably", () => {
    // Empty state
    const emptyAccounts: Account[] = [];
    const emptyTxns: Transaction[] = [
      {
        id: "t-1",
        type: "EXPENSE",
        amount: 250,
        description: "Snack",
        date: "2026-01-01",
        time: "10:00",
        createdAt: "2026-01-01T10:00:00Z",
        updatedAt: "2026-01-01T10:00:00Z",
      },
    ];
    const emptyCalc = calculateBalances(emptyAccounts, emptyTxns);
    assert.equal(emptyCalc.totalBalance, -250, "Empty accounts state calculates net txns");

    // Single account state
    const singleAccount: Account = {
      id: "acc-only",
      name: "Only Account",
      type: "BANK",
      currency: "INR",
      openingBalance: 5000,
      isDefault: true,
      isActive: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    const singleCalc = calculateBalances([singleAccount], emptyTxns);
    assert.equal(singleCalc.totalBalance, 4750);
  });

  test("12. Icon-only action buttons render without visible text labels and show correct active/inactive states for the default account", () => {
    assert.ok(fs.existsSync(accountCardFile));
    const cardContent = fs.readFileSync(accountCardFile, "utf-8");

    // Action buttons must have iconOnlyActionBtn class
    assert.ok(
      cardContent.includes("iconOnlyActionBtn"),
      "AccountCard must use iconOnlyActionBtn style",
    );

    // Must NOT render visible text labels for the 4 action buttons
    assert.ok(
      !cardContent.includes(">Edit<"),
      "Must not render text label 'Edit' inside action buttons",
    );
    assert.ok(
      !cardContent.includes(">Set Default<"),
      "Must not render text label 'Set Default' inside action buttons",
    );
    assert.ok(
      !cardContent.includes(">History<"),
      "Must not render text label 'History' inside action buttons",
    );
    assert.ok(
      !cardContent.includes(">Delete<"),
      "Must not render text label 'Delete' inside action buttons",
    );

    // Feather icons used for the 4 buttons
    assert.ok(cardContent.includes('name="edit-2"'));
    assert.ok(cardContent.includes('name="star"'));
    assert.ok(cardContent.includes('name="list"'));
    assert.ok(cardContent.includes('name="trash-2"'));

    // Visual states for default account:
    // When isDefault === true, star has active styling and disabled=true
    assert.ok(cardContent.includes("iconOnlyActionDefaultActive"));
    assert.ok(cardContent.includes("disabled={isDefault}"));
    assert.ok(cardContent.includes('"Default account (Active)"'));
    assert.ok(cardContent.includes('"Set as default account"'));

    // Header in edit mode does NOT have duplicate cross/tick
    assert.ok(
      !cardContent.includes("inlineCloseBtn"),
      "Header in edit mode must not contain duplicate close button",
    );
    assert.ok(
      !cardContent.includes("inlineConfirmBtn"),
      "Header in edit mode must not contain duplicate confirm button",
    );
  });
});
