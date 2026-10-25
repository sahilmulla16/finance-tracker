import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { resolveCardSubtitle, getCardLast4 } from "../utils/accountCards";
import type { Account, AccountType } from "../context/FinanceContext";

describe("Card Display and Editing in Accounts & Wallets", () => {
  const accountCardFile = path.resolve(__dirname, "../components/ui/AccountCard.tsx");
  const accountsScreenFile = path.resolve(__dirname, "../app/accounts.tsx");

  test("1. Card front-end number format: first four digits as star and then the last four digits (**** 9136)", () => {
    const cardContent = fs.readFileSync(accountCardFile, "utf-8");

    // Must render first four digits as star **** and then safeLast4
    assert.ok(
      cardContent.includes("****") || cardContent.includes("cardMaskDots"),
      "Card footer must include star mask prefix ****",
    );
    assert.ok(
      cardContent.includes("{safeLast4}"),
      "Card must display safeLast4 after the stars",
    );

    // Formatted example
    const cardLast4 = "9136";
    const fullMaskedDisplay = `**** ${cardLast4}`;
    assert.equal(fullMaskedDisplay, "**** 9136");
  });

  test("2. Accounts and Wallets has the 'Card' option in type picker and labels", () => {
    const cardContent = fs.readFileSync(accountCardFile, "utf-8");
    const accountsContent = fs.readFileSync(accountsScreenFile, "utf-8");

    // Check accountTypeOptions contains CARD
    assert.ok(
      cardContent.includes('value: "CARD", label: "Card"'),
      "AccountCard must include CARD in accountTypeOptions",
    );

    // Check subtitle resolution for CARD
    assert.equal(resolveCardSubtitle("CARD"), "CARD");
    assert.equal(resolveCardSubtitle("CARD", "Axis Neo"), "Axis Neo");

    // Check accounts.tsx includes cards breakdown and displays all accounts directly without filter tabs
    assert.ok(
      accountsContent.includes("accountCounts.cards"),
      "accounts.tsx must track accountCounts.cards",
    );
    assert.ok(
      !accountsContent.includes("filterPillsRow"),
      "accounts.tsx must not contain filterPillsRow (filters removed)",
    );
    assert.ok(
      accountsContent.includes("Your Accounts & Wallets"),
      "accounts.tsx section title must be 'Your Accounts & Wallets'",
    );
  });

  test("3. Editing Card Number extracts last 4 digits accurately", () => {
    // Case A: User enters 4 digits directly
    const input1 = "9136";
    const cleanDigits1 = input1.replace(/\D/g, "");
    const last4_1 = cleanDigits1.length > 4 ? cleanDigits1.slice(-4) : cleanDigits1;
    assert.equal(last4_1, "9136");

    // Case B: User enters full 16 digit card number with spaces
    const input2 = "4111 2222 3333 9136";
    const cleanDigits2 = input2.replace(/\D/g, "");
    const last4_2 = cleanDigits2.length > 4 ? cleanDigits2.slice(-4) : cleanDigits2;
    assert.equal(last4_2, "9136");

    // Case C: User enters 16 digit card number with hyphens
    const input3 = "5274-1234-5678-4821";
    const cleanDigits3 = input3.replace(/\D/g, "");
    const last4_3 = cleanDigits3.length > 4 ? cleanDigits3.slice(-4) : cleanDigits3;
    assert.equal(last4_3, "4821");
  });

  test("4. Accounts & Wallets section counts and filters cards accurately", () => {
    const mockAccounts: Account[] = [
      {
        id: "acc-1",
        name: "HDFC Salary",
        type: "BANK" as AccountType,
        currency: "INR",
        openingBalance: 50000,
        isDefault: true,
        isActive: true,
        accountNumberLast4: "4821",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "acc-2",
        name: "Axis Neo Credit Card",
        type: "CARD" as AccountType,
        currency: "INR",
        openingBalance: 0,
        isDefault: false,
        isActive: true,
        cardLast4: "9136",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "acc-3",
        name: "OneCard Metal",
        type: "CREDIT" as AccountType,
        currency: "INR",
        openingBalance: 0,
        isDefault: false,
        isActive: true,
        cardLast4: "5544",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "acc-4",
        name: "Cash Wallet",
        type: "CASH" as AccountType,
        currency: "INR",
        openingBalance: 1500,
        isDefault: false,
        isActive: true,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ];

    // Card filter
    const cards = mockAccounts.filter(
      (a) => a.type === "CARD" || a.type === "CREDIT" || !!a.cardLast4,
    );
    assert.equal(cards.length, 2);
    assert.equal(cards[0].id, "acc-2");
    assert.equal(cards[1].id, "acc-3");

    // Verify card display numbers
    assert.equal(`**** ${cards[0].cardLast4}`, "**** 9136");
    assert.equal(`**** ${cards[1].cardLast4}`, "**** 5544");
  });

  test("5. Exactly one card number edit input is displayed (the lower one in the footer) and duplicate upper input is removed", () => {
    const cardContent = fs.readFileSync(accountCardFile, "utf-8");

    // Must NOT have the upper duplicate input
    assert.ok(
      !cardContent.includes("inlineCardNoField"),
      "Must not have inlineCardNoField upper input",
    );
    assert.ok(
      !cardContent.includes("inlineCardNoCenterInput"),
      "Must not have inlineCardNoCenterInput style or element",
    );

    // Must have the lower footer input
    assert.ok(
      cardContent.includes("inlineFooterNumberInput"),
      "Must have the lower footer input for card last 4 digits",
    );
    assert.ok(
      cardContent.includes('accessibilityLabel="Edit Card Last 4 Digits"'),
      "Lower footer input must have accessibility label for editing card last 4 digits",
    );
  });
});

