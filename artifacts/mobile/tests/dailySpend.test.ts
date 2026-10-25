import test from "node:test";
import assert from "node:assert/strict";
import {
  getPreviousDateString,
  getNextDateString,
  formatDailySpendHeaderDate,
  extractHourFromTransaction,
  formatHourShort,
  formatHourRange,
  resolvePaymentMethod,
  isEligibleExpense,
  calculateDailySpendSummary,
} from "../utils/dailySpend";
import type { Transaction, Account } from "../context/FinanceContext";

test("Daily Spend — Date Calculations & Header Labelling", async (t) => {
  await t.test("1. Computes previous day correctly across month and year boundaries", () => {
    assert.equal(getPreviousDateString("2026-10-22"), "2026-10-21");
    assert.equal(getPreviousDateString("2026-10-01"), "2026-09-30");
    assert.equal(getPreviousDateString("2026-01-01"), "2025-12-31");
    assert.equal(getPreviousDateString("2024-03-01"), "2024-02-29"); // leap year
  });

  await t.test("2. Computes next day correctly across month and year boundaries", () => {
    assert.equal(getNextDateString("2026-10-21"), "2026-10-22");
    assert.equal(getNextDateString("2026-09-30"), "2026-10-01");
    assert.equal(getNextDateString("2025-12-31"), "2026-01-01");
  });

  await t.test("3. Formats header display dates correctly", () => {
    const today = "2026-10-22";
    assert.equal(formatDailySpendHeaderDate("2026-10-22", today), "Today, Oct 22");
    assert.equal(formatDailySpendHeaderDate("2026-10-21", today), "Yesterday, Oct 21");
    assert.ok(formatDailySpendHeaderDate("2026-10-15", today).includes("15 Oct"));
  });
});

test("Daily Spend — Time & Hour Parsing", async (t) => {
  await t.test("1. Parses 12-hour format strings correctly", () => {
    const tx1 = { time: "02:30 PM" } as Transaction;
    assert.equal(extractHourFromTransaction(tx1), 14);

    const tx2 = { time: "12:00 AM" } as Transaction;
    assert.equal(extractHourFromTransaction(tx2), 0);

    const tx3 = { time: "12:45 PM" } as Transaction;
    assert.equal(extractHourFromTransaction(tx3), 12);

    const tx4 = { time: "09:15 AM" } as Transaction;
    assert.equal(extractHourFromTransaction(tx4), 9);
  });

  await t.test("2. Parses 24-hour format strings correctly", () => {
    const tx1 = { time: "16:45" } as Transaction;
    assert.equal(extractHourFromTransaction(tx1), 16);

    const tx2 = { time: "00:10" } as Transaction;
    assert.equal(extractHourFromTransaction(tx2), 0);

    const tx3 = { time: "23:59:00" } as Transaction;
    assert.equal(extractHourFromTransaction(tx3), 23);
  });

  await t.test("3. Formats hour short and range strings", () => {
    assert.equal(formatHourShort(0), "12 AM");
    assert.equal(formatHourShort(12), "12 PM");
    assert.equal(formatHourShort(14), "2 PM");
    assert.equal(formatHourShort(23), "11 PM");
    assert.equal(formatHourRange(14), "2 PM – 3 PM");
  });
});

test("Daily Spend — Expense Eligibility & Non-Expense Exclusion", async (t) => {
  await t.test("1. Only includes positive EXPENSE transactions for the matching date", () => {
    const targetDate = "2026-10-22";
    const expenseTx = { type: "EXPENSE", amount: 250, date: "2026-10-22" } as Transaction;
    const incomeTx = { type: "INCOME", amount: 1000, date: "2026-10-22" } as Transaction;
    const transferTx = { type: "TRANSFER", amount: 500, date: "2026-10-22" } as Transaction;
    const otherDateTx = { type: "EXPENSE", amount: 200, date: "2026-10-21" } as Transaction;
    const zeroTx = { type: "EXPENSE", amount: 0, date: "2026-10-22" } as Transaction;
    const negTx = { type: "EXPENSE", amount: -50, date: "2026-10-22" } as Transaction;

    assert.equal(isEligibleExpense(expenseTx, targetDate), true);
    assert.equal(isEligibleExpense(incomeTx, targetDate), false);
    assert.equal(isEligibleExpense(transferTx, targetDate), false);
    assert.equal(isEligibleExpense(otherDateTx, targetDate), false);
    assert.equal(isEligibleExpense(zeroTx, targetDate), false);
    assert.equal(isEligibleExpense(negTx, targetDate), false);
  });
});

test("Daily Spend — Summary Aggregations & Accounting Reconciliation", async (t) => {
  const accounts: Account[] = [
    { id: "acc-upi", name: "GPay UPI", type: "UPI", currency: "INR", openingBalance: 0, isDefault: true, isActive: true, createdAt: "", updatedAt: "" },
    { id: "acc-cash", name: "Wallet Cash", type: "CASH", currency: "INR", openingBalance: 0, isDefault: false, isActive: true, createdAt: "", updatedAt: "" },
    { id: "acc-bank", name: "HDFC Debit Card", type: "BANK", currency: "INR", openingBalance: 0, isDefault: false, isActive: true, createdAt: "", updatedAt: "" },
  ];

  const transactions: Transaction[] = [
    // Today: 2026-10-22
    {
      id: "tx-1",
      type: "EXPENSE",
      amount: 400,
      description: "Starbucks Coffee",
      category: "Food & Dining",
      accountId: "acc-upi",
      date: "2026-10-22",
      time: "09:30 AM",
      createdAt: "2026-10-22T09:30:00Z",
      updatedAt: "2026-10-22T09:30:00Z",
    },
    {
      id: "tx-2",
      type: "EXPENSE",
      amount: 600,
      description: "UPI/Starbucks Coffee/987654",
      category: "Food & Dining",
      accountId: "acc-upi",
      date: "2026-10-22",
      time: "02:15 PM",
      createdAt: "2026-10-22T14:15:00Z",
      updatedAt: "2026-10-22T14:15:00Z",
    },
    {
      id: "tx-3",
      type: "EXPENSE",
      amount: 1000,
      description: "Uber Ride",
      category: "Transport",
      accountId: "acc-bank",
      date: "2026-10-22",
      time: "06:45 PM",
      createdAt: "2026-10-22T18:45:00Z",
      updatedAt: "2026-10-22T18:45:00Z",
    },
    // Excluded income on today
    {
      id: "tx-4",
      type: "INCOME",
      amount: 50000,
      description: "Salary",
      date: "2026-10-22",
      time: "10:00 AM",
      createdAt: "2026-10-22T10:00:00Z",
      updatedAt: "2026-10-22T10:00:00Z",
    },
    // Yesterday: 2026-10-21 (total 1500)
    {
      id: "tx-5",
      type: "EXPENSE",
      amount: 1500,
      description: "Grocery Store",
      category: "Groceries",
      accountId: "acc-cash",
      date: "2026-10-21",
      time: "11:00 AM",
      createdAt: "2026-10-21T11:00:00Z",
      updatedAt: "2026-10-21T11:00:00Z",
    },
  ];

  await t.test("1. Aggregates day total, transaction count, and average spend", () => {
    const summary = calculateDailySpendSummary({
      transactions,
      accounts,
      selectedDate: "2026-10-22",
      todayDate: "2026-10-22",
    });

    assert.equal(summary.totalSpent, 2000); // 400 + 600 + 1000
    assert.equal(summary.transactionCount, 3);
    assert.equal(summary.averageSpend, 2000 / 3);
  });

  await t.test("2. Reconciles day-over-day increase (+33% vs yesterday)", () => {
    const summary = calculateDailySpendSummary({
      transactions,
      accounts,
      selectedDate: "2026-10-22",
      todayDate: "2026-10-22",
    });

    // Yesterday was 1500, today is 2000. Diff = +500. Pct = (500 / 1500) * 100 = +33%
    assert.equal(summary.prevTotalSpent, 1500);
    assert.equal(summary.diffAmount, 500);
    assert.equal(summary.percentageChange, 33);
    assert.equal(summary.changeDirection, "increase");
    assert.equal(summary.changeLabel, "+33% vs yesterday");
  });

  await t.test("3. Reconciles categories to exact day total", () => {
    const summary = calculateDailySpendSummary({
      transactions,
      accounts,
      selectedDate: "2026-10-22",
      todayDate: "2026-10-22",
    });

    const categorySum = summary.categories.reduce((acc, c) => acc + c.amount, 0);
    assert.equal(categorySum, summary.totalSpent);
    assert.equal(summary.categories[0].name, "Food & Dining");
    assert.equal(summary.categories[0].amount, 1000);
    assert.equal(summary.categories[0].count, 2);
    assert.equal(summary.categories[1].name, "Transport");
    assert.equal(summary.categories[1].amount, 1000);
  });

  await t.test("4. Normalizes and groups merchants accurately", () => {
    const summary = calculateDailySpendSummary({
      transactions,
      accounts,
      selectedDate: "2026-10-22",
      todayDate: "2026-10-22",
    });

    // Starbucks was split across 2 txns: "Starbucks Coffee" and "UPI/Starbucks Coffee/987654"
    // Normalization should combine them under "Starbucks Coffee" with total 1000
    assert.ok(summary.topMerchant !== null);
    assert.equal(summary.topMerchant?.name, "Starbucks Coffee");
    assert.equal(summary.topMerchant?.amount, 1000);
    assert.equal(summary.topMerchant?.count, 2);
    assert.equal(summary.topMerchant?.percentage, 50); // 1000 / 2000 = 50%
  });

  await t.test("5. Reconciles payment methods breakdown", () => {
    const summary = calculateDailySpendSummary({
      transactions,
      accounts,
      selectedDate: "2026-10-22",
      todayDate: "2026-10-22",
    });

    const methodSum = summary.paymentMethods.reduce((acc, m) => acc + m.amount, 0);
    assert.equal(methodSum, summary.totalSpent);

    const upi = summary.paymentMethods.find((m) => m.method === "UPI");
    assert.equal(upi?.amount, 1000); // 400 + 600

    const card = summary.paymentMethods.find((m) => m.method === "Card");
    assert.equal(card?.amount, 1000); // HDFC Debit Card
  });

  await t.test("6. Hourly distribution correctly captures active hours and max slot", () => {
    const summary = calculateDailySpendSummary({
      transactions,
      accounts,
      selectedDate: "2026-10-22",
      todayDate: "2026-10-22",
    });

    // Slot 9 (9:30 AM): 400
    assert.equal(summary.hourlySlots[9].amount, 400);
    // Slot 14 (2:15 PM): 600
    assert.equal(summary.hourlySlots[14].amount, 600);
    // Slot 18 (6:45 PM): 1000 (Max)
    assert.equal(summary.hourlySlots[18].amount, 1000);
    assert.equal(summary.maxHourlySlot?.hour, 18);
  });
});

test("Daily Spend — Edge Cases & Zero Handlers", async (t) => {
  await t.test("1. Handles empty day gracefully without NaN or Infinity", () => {
    const summary = calculateDailySpendSummary({
      transactions: [],
      accounts: [],
      selectedDate: "2026-10-20",
      todayDate: "2026-10-22",
    });

    assert.equal(summary.totalSpent, 0);
    assert.equal(summary.transactionCount, 0);
    assert.equal(summary.averageSpend, 0);
    assert.equal(summary.percentageChange, 0);
    assert.equal(summary.changeDirection, "neutral");
    assert.equal(summary.changeLabel, "Same as yesterday (₹0)");
    assert.equal(summary.topMerchant, null);
    assert.equal(summary.categories.length, 0);
    assert.equal(summary.paymentMethods.length, 0);
  });

  await t.test("2. Handles previous day zero spending with non-zero today spend", () => {
    const txToday: Transaction = {
      id: "tx-today",
      type: "EXPENSE",
      amount: 500,
      description: "Snack",
      date: "2026-10-22",
      time: "03:00 PM",
      createdAt: "",
      updatedAt: "",
    };

    const summary = calculateDailySpendSummary({
      transactions: [txToday],
      accounts: [],
      selectedDate: "2026-10-22",
      todayDate: "2026-10-22",
    });

    assert.equal(summary.totalSpent, 500);
    assert.equal(summary.prevTotalSpent, 0);
    assert.equal(summary.percentageChange, null);
    assert.equal(summary.changeDirection, "increase");
    assert.equal(summary.changeLabel, "No spend previous day");
  });
});

