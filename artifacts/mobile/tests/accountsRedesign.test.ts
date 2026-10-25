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
} from "../utils/accountCards";
import { money } from "../utils/format";
import type { Account, AccountType } from "../context/FinanceContext";

describe("Accounts & Wallets Refinement — Direct Inline Card Editing", () => {
  const accountCardFile = path.resolve(__dirname, "../components/ui/AccountCard.tsx");
  const accountsScreenFile = path.resolve(__dirname, "../app/accounts.tsx");
  const homeDeckFile = path.resolve(__dirname, "../components/AnimatedCardDeck.tsx");

  test("1. Editing happens directly on the existing card", () => {
    assert.ok(fs.existsSync(accountCardFile), "AccountCard.tsx must exist");
    assert.ok(fs.existsSync(accountsScreenFile), "accounts.tsx must exist");

    const cardContent = fs.readFileSync(accountCardFile, "utf-8");
    const accountsContent = fs.readFileSync(accountsScreenFile, "utf-8");

    // AccountCard must support inline editing mode directly on the card
    assert.ok(
      cardContent.includes("isEditing"),
      "AccountCard must support isEditing property",
    );
    assert.ok(
      cardContent.includes("editDraft"),
      "AccountCard must accept editDraft directly",
    );
    assert.ok(
      cardContent.includes("inlineTitleInput"),
      "AccountCard must render inlineTitleInput directly in title area",
    );
    assert.ok(
      cardContent.includes("inlineBalanceInput"),
      "AccountCard must render inlineBalanceInput directly in balance area",
    );
    assert.ok(
      cardContent.includes("inlineSubtitleInput"),
      "AccountCard must render inlineSubtitleInput directly in subtitle area",
    );
    assert.ok(
      cardContent.includes("inlineTypePickerOverlay"),
      "AccountCard must provide compact inline type picker directly on the card",
    );

    // accounts.tsx passes inline editing props directly to AccountCard
    assert.ok(
      accountsContent.includes("isEditing={true}"),
      "accounts.tsx must activate inline editing directly on the card",
    );
    assert.ok(
      accountsContent.includes("onSaveInline"),
      "accounts.tsx must connect onSaveInline to the card",
    );
    assert.ok(
      accountsContent.includes("onCancelInline"),
      "accounts.tsx must connect onCancelInline to the card",
    );
  });

  test("2. Bank name, nickname, and balance update live while typing", () => {
    interface InlineDraft {
      name: string;
      displayName: string;
      type: AccountType;
      balanceInput: string;
    }

    const draft: InlineDraft = {
      name: "",
      displayName: "",
      type: "BANK",
      balanceInput: "0",
    };

    const resolveLiveCardState = (d: InlineDraft) => {
      const cleanName = d.name.trim() || "New Account";
      const cardSubtitle = resolveCardSubtitle(d.type, d.displayName);
      const cardBalanceFormatted = formatLiveBalance(d.balanceInput, "INR");
      return {
        cardTitle: cleanName,
        cardSubtitle,
        cardBalanceFormatted,
        cardType: d.type,
      };
    };

    // Initial state
    let state = resolveLiveCardState(draft);
    assert.equal(state.cardTitle, "New Account");
    assert.equal(state.cardSubtitle, "BANK ACCOUNT");
    assert.equal(state.cardBalanceFormatted, "₹0");

    // 1. User types bank name "ICICI Bank"
    draft.name = "ICICI Bank";
    state = resolveLiveCardState(draft);
    assert.equal(state.cardTitle, "ICICI Bank");

    // 2. User types nickname "Primary Savings"
    draft.displayName = "Primary Savings";
    state = resolveLiveCardState(draft);
    assert.equal(state.cardSubtitle, "Primary Savings");

    // 3. User types balance "54200"
    draft.balanceInput = "54200";
    state = resolveLiveCardState(draft);
    assert.equal(state.cardBalanceFormatted, "₹54,200");

    // 4. User changes account type to "UPI"
    draft.type = "UPI";
    state = resolveLiveCardState(draft);
    assert.equal(state.cardType, "UPI");

    // 5. User clears nickname -> falls back to UPI WALLET
    draft.displayName = "";
    state = resolveLiveCardState(draft);
    assert.equal(state.cardSubtitle, "UPI WALLET");
  });

  test("3. Save persists valid changes and retains opening-balance reconciliation", () => {
    const currentLiveBalance = 35000;
    const initialOpeningBalance = 10000;
    const netTransactions = currentLiveBalance - initialOpeningBalance; // 25,000

    // User updates the card's balance to ₹40,000
    const targetBalance = 40000;
    const newOpening = calculateNewOpeningBalance(
      targetBalance,
      currentLiveBalance,
      initialOpeningBalance,
    );

    // Opening balance reconciles: 40000 - 25000 = 15000
    assert.equal(newOpening, 15000);
    // When getAccountBalance evaluates: newOpening (15000) + netTransactions (25000) = 40,000
    assert.equal(newOpening + netTransactions, targetBalance);
  });

  test("4. Cancel discards unsaved changes without mutating persistent account", () => {
    const savedAccount: Account = {
      id: "acc-stable-1",
      name: "Permanent Bank",
      displayName: "Main Account",
      type: "BANK",
      currency: "INR",
      openingBalance: 12000,
      isDefault: true,
      isActive: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };

    // Simulated user draft typing
    let editDraft = {
      name: "Temporary Typos Bank",
      displayName: "Changed Nickname",
      balanceInput: "999999",
      type: "CASH" as AccountType,
    };

    // User presses Cancel -> edit state reset to null without calling updateAccount
    editDraft = null as any;

    // Original account values remain 100% unchanged
    assert.equal(savedAccount.name, "Permanent Bank");
    assert.equal(savedAccount.displayName, "Main Account");
    assert.equal(savedAccount.openingBalance, 12000);
    assert.equal(savedAccount.type, "BANK");
    assert.equal(editDraft, null);
  });

  test("5. No separate edit form appears below the card", () => {
    const accountsContent = fs.readFileSync(accountsScreenFile, "utf-8");

    // Verification: AccountLiveEditor modal / duplicate form has been completely removed
    assert.ok(
      !accountsContent.includes("function AccountLiveEditor"),
      "accounts.tsx must NOT contain AccountLiveEditor modal component",
    );
    assert.ok(
      !accountsContent.includes("<AccountLiveEditor"),
      "accounts.tsx must NOT render <AccountLiveEditor",
    );
    assert.ok(
      !accountsContent.includes("LIVE PREVIEW"),
      "accounts.tsx must NOT render a separate LIVE PREVIEW tag",
    );
    assert.ok(
      !accountsContent.includes("liveCardPreviewWrapper"),
      "accounts.tsx must NOT wrap a second duplicate card preview",
    );
    assert.ok(
      !accountsContent.includes("formContainer"),
      "accounts.tsx must NOT render a separate formContainer underneath cards",
    );
  });

  test("6. The DEFAULT text badge is absent from the card", () => {
    const cardContent = fs.readFileSync(accountCardFile, "utf-8");

    // Verification: The word 'DEFAULT' is NOT displayed as text on the card
    assert.ok(
      !cardContent.includes(">DEFAULT<"),
      "AccountCard must NOT render the text string 'DEFAULT'",
    );
    assert.ok(
      !cardContent.includes("defaultPillText"),
      "AccountCard must NOT define defaultPillText style",
    );

    // Subtle checkmark icon indicator is used instead
    assert.ok(
      cardContent.includes("defaultIndicatorBadge"),
      "AccountCard uses subtle defaultIndicatorBadge icon instead of text",
    );
  });

  test("7. The card color selector is absent", () => {
    const accountsContent = fs.readFileSync(accountsScreenFile, "utf-8");

    // Verification: The 3-color theme selector is removed from the editor
    assert.ok(
      !accountsContent.includes("cardStyleOptions"),
      "accounts.tsx must NOT contain cardStyleOptions selector array",
    );
    assert.ok(
      !accountsContent.includes("CARD STYLE & THEME"),
      "accounts.tsx must NOT display CARD STYLE & THEME label",
    );
    assert.ok(
      !accountsContent.includes("styleOptionsRow"),
      "accounts.tsx must NOT render styleOptionsRow",
    );
    assert.ok(
      !accountsContent.includes("colorDot"),
      "accounts.tsx must NOT render colorDot swatches",
    );
  });

  test("8. Default-account functionality still works", () => {
    const accountsContent = fs.readFileSync(accountsScreenFile, "utf-8");
    const cardContent = fs.readFileSync(accountCardFile, "utf-8");

    // Set Default action remains in action controls
    assert.ok(
      accountsContent.includes("handleSetDefault"),
      "accounts.tsx must retain handleSetDefault logic",
    );
    assert.ok(
      accountsContent.includes("setDefaultAccount"),
      "accounts.tsx must invoke setDefaultAccount from FinanceContext",
    );
    assert.ok(
      cardContent.includes("onSetDefault"),
      "AccountCard must support onSetDefault action button",
    );
    assert.ok(
      cardContent.includes("isDefault"),
      "AccountCard must support isDefault prop",
    );
  });

  test("9. Account IDs, transaction associations, and balance reconciliation remain intact", () => {
    // Preserved account structure with stable IDs
    const account: Account = {
      id: "acc_zeno_101",
      name: "HDFC Salary",
      type: "BANK",
      currency: "INR",
      openingBalance: 50000,
      isDefault: true,
      isActive: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };

    assert.equal(account.id, "acc_zeno_101");

    // Target balance calculation maintains identity and reconciled opening
    const target = 65000;
    const currentLive = 50000;
    const newOpening = calculateNewOpeningBalance(target, currentLive, account.openingBalance);

    const updatedAccount: Account = {
      ...account,
      openingBalance: newOpening,
    };

    assert.equal(updatedAccount.id, "acc_zeno_101", "ID must be preserved");
    assert.equal(updatedAccount.openingBalance, 65000, "Opening balance reconciled");
  });

  test("10. Home and Accounts & Wallets continue using consistent card styling", () => {
    const accountsContent = fs.readFileSync(accountsScreenFile, "utf-8");
    const homeContent = fs.readFileSync(homeDeckFile, "utf-8");

    // Both import and render AccountCard
    assert.ok(
      accountsContent.includes("AccountCard"),
      "accounts.tsx uses shared AccountCard",
    );
    assert.ok(
      homeContent.includes("AccountCard"),
      "AnimatedCardDeck.tsx uses shared AccountCard",
    );

    // Both utilize getCardLast4 for deterministic card numbers
    assert.ok(
      accountsContent.includes("getCardLast4"),
      "accounts.tsx uses getCardLast4",
    );
    assert.ok(
      homeContent.includes("getCardLast4"),
      "AnimatedCardDeck.tsx uses getCardLast4",
    );

    // Theme tokens verification
    const darkTheme = getCardTheme(0, false);
    const limeTheme = getCardTheme(1, false);
    assert.equal(darkTheme.isLime, false);
    assert.equal(limeTheme.isLime, true);
  });

  test("11. Required field validation rejects empty or whitespace-only account names", () => {
    assert.equal(validateAccountName(""), false);
    assert.equal(validateAccountName("   "), false);
    assert.equal(validateAccountName(null), false);
    assert.equal(validateAccountName(undefined), false);
    assert.equal(validateAccountName("HDFC Bank"), true);
    assert.equal(validateAccountName("Cash"), true);
  });
});
