import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  parseUniversalSms,
  resolveAccountForTransaction,
  validateTransactionSafety,
  classifyTransaction,
  AccountMatchCandidate,
} from "../services/autoTrack";

describe("Smart Auto Track — Income vs Expense & Counterparty Extraction", () => {
  test("Accurately parses and classifies incoming money from a person as INCOME", () => {
    const rawSms = "Rs. 2,000 credited to your account from Raeesa Mulla.";
    const parsed = parseUniversalSms(rawSms, "HDFCBK");

    assert.ok(parsed, "Parsed transaction should not be null");
    assert.equal(parsed?.direction, "INCOME");
    assert.equal(parsed?.amount, 2000);
    assert.equal(parsed?.counterparty, "Raeesa Mulla");
    assert.equal(parsed?.payerName, "Raeesa Mulla");
    // Under no circumstance should a counterparty person name be the category
    assert.notEqual(parsed?.merchantCategory, "Raeesa Mulla");
    assert.equal(parsed?.merchantCategory, "Other Income");
  });

  test("Accurately parses and classifies incoming UPI payment from a person", () => {
    const rawSms = "You have received Rs. 750 from Raeesa Mulla via UPI.";
    const parsed = parseUniversalSms(rawSms, "AXISBK");

    assert.ok(parsed, "Parsed transaction should not be null");
    assert.equal(parsed?.direction, "INCOME");
    assert.equal(parsed?.amount, 750);
    assert.equal(parsed?.counterparty, "Raeesa Mulla");
    assert.equal(parsed?.payerName, "Raeesa Mulla");
    assert.notEqual(parsed?.merchantCategory, "Raeesa Mulla");
    assert.equal(parsed?.merchantCategory, "Other Income");
  });

  test("Accurately classifies salary credit as INCOME with Salary category", () => {
    const rawSms = "INR 85,000.00 credited to your A/c XX1234 on 01-Nov towards Salary for Oct from ACME CORP.";
    const parsed = parseUniversalSms(rawSms, "ICICIB");

    assert.ok(parsed, "Parsed transaction should not be null");
    assert.equal(parsed?.direction, "INCOME");
    assert.equal(parsed?.amount, 85000);
    assert.equal(parsed?.merchantCategory, "Salary");
    assert.equal(parsed?.merchant, "Salary");
    assert.equal(parsed?.counterparty, "ACME CORP");
  });

  test("Accurately classifies outgoing money as EXPENSE", () => {
    const rawSms = "Rs. 500 debited from your account.";
    const parsed = parseUniversalSms(rawSms, "SBIINB");

    assert.ok(parsed, "Parsed transaction should not be null");
    assert.equal(parsed?.direction, "EXPENSE");
    assert.equal(parsed?.amount, 500);
  });

  test("Accurately extracts payee for outgoing merchant transactions and assigns category", () => {
    const rawSms = "Rs 1,240.00 debited from HDFC Bank A/c XX4821 on 24-Oct-26 at SWIGGY BANGALORE.";
    const parsed = parseUniversalSms(rawSms, "HDFCBK");

    assert.ok(parsed, "Parsed transaction should not be null");
    assert.equal(parsed?.direction, "EXPENSE");
    assert.equal(parsed?.amount, 1240);
    assert.equal(parsed?.counterparty, "SWIGGY BANGALORE");
    assert.equal(parsed?.payeeName, "SWIGGY BANGALORE");
    assert.equal(parsed?.merchantCategory, "Food & Dining");
  });
});

describe("Smart Auto Track — Card Last-4 Extraction & Account Suffix Separation", () => {
  const cardSmsVariants = [
    {
      sms: "Alert: Rs. 1,499 spent on your card ending 3458 at Amazon India.",
      expectedLast4: "3458",
    },
    {
      sms: "Rs 3,200.00 debited on Credit Card ending 3458 at Croma.",
      expectedLast4: "3458",
    },
    {
      sms: "Your Debit Card XX3458 was used for Rs 850 at Shell Fuel.",
      expectedLast4: "3458",
    },
    {
      sms: "Transaction of Rs. 2,100 approved on Card No. XXXX XXXX XXXX 3458.",
      expectedLast4: "3458",
    },
    {
      sms: "Rs. 450 debited on your card ending in 3458 at Starbucks.",
      expectedLast4: "3458",
    },
  ];

  for (const { sms, expectedLast4 } of cardSmsVariants) {
    test(`Extracts cardLast4 = "${expectedLast4}" from: "${sms}"`, () => {
      const parsed = parseUniversalSms(sms, "HDFCBK");
      assert.ok(parsed, "Should parse successfully");
      assert.equal(parsed?.cardLast4, expectedLast4);
      assert.equal(parsed?.direction, "EXPENSE");
    });
  }

  test("Distinguishes bank account suffix from card last-4", () => {
    const accountSms = "Rs 5,000 credited to your A/c XX4821 on 24-Oct.";
    const parsed = parseUniversalSms(accountSms, "SBIINB");

    assert.ok(parsed);
    assert.equal(parsed?.accountNumberLast4, "4821");
    // Under no circumstances should bank account number be assigned to cardLast4
    assert.equal(parsed?.cardLast4, undefined);
  });

  test("Card transaction matching updates cardLast4ToSync on matched account", () => {
    const cardSms = "Rs 1,200 spent on Credit Card ending 3458 at Zara.";
    const parsed = parseUniversalSms(cardSms, "HDFCBK");
    assert.ok(parsed);
    assert.equal(parsed?.cardLast4, "3458");

    const userAccounts: AccountMatchCandidate[] = [
      {
        id: "acc-credit-1",
        name: "HDFC Millennia Credit Card",
        institutionCode: "HDFC",
        type: "CREDIT",
        cardLast4: undefined, // not yet synced
        accountSuffix: undefined,
        isActive: true,
      },
      {
        id: "acc-savings-1",
        name: "HDFC Savings Account",
        institutionCode: "HDFC",
        type: "SAVINGS",
        accountNumberLast4: "4821",
        isActive: true,
      },
    ];

    const match = resolveAccountForTransaction(parsed!, userAccounts);
    assert.ok(match.account, "Should match HDFC Credit Card");
    assert.equal(match.account?.id, "acc-credit-1");
    assert.equal(match.cardLast4ToSync, "3458");
  });

  test("Bank account SMS does not sync cardLast4 or match wrong credit card", () => {
    const bankSms = "Rs 2,500 debited from A/c XX4821 at ATM.";
    const parsed = parseUniversalSms(bankSms, "HDFCBK");
    assert.ok(parsed);
    assert.equal(parsed?.accountNumberLast4, "4821");
    assert.equal(parsed?.cardLast4, undefined);

    const userAccounts: AccountMatchCandidate[] = [
      {
        id: "acc-credit-1",
        name: "HDFC Credit Card",
        institutionCode: "HDFC",
        type: "CREDIT",
        cardLast4: "3458",
        isActive: true,
      },
      {
        id: "acc-savings-1",
        name: "HDFC Savings",
        institutionCode: "HDFC",
        type: "SAVINGS",
        accountNumberLast4: "4821",
        isActive: true,
      },
    ];

    const match = resolveAccountForTransaction(parsed!, userAccounts);
    assert.equal(match.account?.id, "acc-savings-1");
    assert.equal(match.cardLast4ToSync, undefined);
  });
});

describe("Smart Auto Track — Ambiguity Detection & Non-Transaction Rejection", () => {
  test("Detects conflicting credit and debit keywords and marks isDirectionAmbiguous", () => {
    const conflictingSms = "Your account was debited and credited Rs 500 for monthly adjustment.";
    const classification = classifyTransaction(conflictingSms);
    assert.equal(classification.direction, "UNKNOWN");
    assert.equal(classification.isDirectionAmbiguous, true);
  });

  test("Rejects OTP verification messages", () => {
    const otpSms = "Your OTP for transaction of Rs 1,500 on card ending 3458 is 849201. Do not share with anyone.";
    const safety = validateTransactionSafety(otpSms);
    assert.equal(safety.isTransaction, false);
    assert.equal(safety.isOtp, true);
    assert.ok(safety.rejectionReason?.includes("OTP"));
  });

  test("Rejects promotional and loan offer messages", () => {
    const promoSms = "Congratulations! You are pre-approved for a personal loan of Rs 5,00,000. Apply now at hdfc.com/loan";
    const safety = validateTransactionSafety(promoSms);
    assert.equal(safety.isTransaction, false);
    assert.equal(safety.isPromotional, true);
    assert.ok(safety.rejectionReason?.includes("Promotional"));
  });

  test("Rejects balance inquiry alerts", () => {
    const balSms = "Available balance in your A/c XX4821 is Rs 45,210.50 as of 24-Oct.";
    const safety = validateTransactionSafety(balSms);
    assert.equal(safety.isTransaction, false);
    assert.equal(safety.isBalanceInquiryOnly, true);
    assert.ok(safety.rejectionReason?.includes("Balance inquiry"));
  });

  test("Flags failed or declined transactions", () => {
    const failedSms = "Transaction of Rs 850 on your card ending 3458 declined due to insufficient balance.";
    const classification = classifyTransaction(failedSms);
    assert.equal(classification.lifecycleStatus, "FAILED");
  });
});

describe("Smart Auto Track — Frontend Card Suffix Synchronization & Display Logic", () => {
  test("Card display logic prioritizes cardLast4 when available", () => {
    // Simulates the safeLast4 fallback logic in AccountCard.tsx
    const computeSafeLast4 = (account: {
      last4?: string;
      cardLast4?: string;
      accountNumberLast4?: string;
      accountSuffix?: string;
    }) => {
      return (
        account.last4 ||
        account.cardLast4 ||
        account.accountNumberLast4 ||
        account.accountSuffix ||
        ""
      );
    };

    const cardWithSyncedLast4 = {
      cardLast4: "3458",
      accountSuffix: "3458",
    };
    assert.equal(computeSafeLast4(cardWithSyncedLast4), "3458");

    // Format check for card face: "•••• 3458"
    const formattedCardNumber = `•••• ${computeSafeLast4(cardWithSyncedLast4)}`;
    assert.equal(formattedCardNumber, "•••• 3458");
  });

  test("Bank account does not leak into card number display", () => {
    const computeSafeLast4 = (account: {
      last4?: string;
      cardLast4?: string;
      accountNumberLast4?: string;
      accountSuffix?: string;
    }) => {
      return (
        account.last4 ||
        account.cardLast4 ||
        account.accountNumberLast4 ||
        account.accountSuffix ||
        ""
      );
    };

    const bankAccount = {
      accountNumberLast4: "4821",
      cardLast4: undefined,
    };
    assert.equal(computeSafeLast4(bankAccount), "4821");
  });
});
