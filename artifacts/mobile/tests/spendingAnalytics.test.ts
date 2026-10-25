import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateSpendingAnalytics,
  getPreviousPeriodAnchor,
  getNextPeriodAnchor,
  isCurrentPeriodActive,
  getWeekBoundaries,
  getMonthBoundaries,
  getYearBoundaries,
} from "../utils/dailySpend";
import type { Transaction, Account } from "../context/FinanceContext";

test("Spending Analytics — Period Boundaries & Navigation", async (t) => {
  await t.test("1. Weekly boundaries resolve Monday to Sunday correctly", () => {
    // 2026-10-22 is a Thursday
    const week = getWeekBoundaries("2026-10-22");
    assert.equal(week.start, "2026-10-19"); // Monday
    assert.equal(week.end, "2026-10-25"); // Sunday
  });

  await t.test("2. Monthly boundaries resolve 1st to last day with leap year support", () => {
    const oct = getMonthBoundaries("2026-10-15");
    assert.equal(oct.start, "2026-10-01");
    assert.equal(oct.end, "2026-10-31");
    assert.equal(oct.daysInMonth, 31);

    const feb2024 = getMonthBoundaries("2024-02-10");
    assert.equal(feb2024.daysInMonth, 29); // Leap year 2024

    const feb2026 = getMonthBoundaries("2026-02-10");
    assert.equal(feb2026.daysInMonth, 28); // Non-leap year 2026
  });

  await t.test("3. Year boundaries resolve Jan 1 to Dec 31", () => {
    const yr = getYearBoundaries("2026-06-15");
    assert.equal(yr.start, "2026-01-01");
    assert.equal(yr.end, "2026-12-31");
    assert.equal(yr.year, 2026);
  });

  await t.test("4. Navigation steps correctly backward and forward", () => {
    const today = "2026-10-22";

    // Weekly: 19 Oct -> prev is 12 Oct
    const prevWeek = getPreviousPeriodAnchor("2026-10-22", "WEEKLY");
    assert.equal(prevWeek, "2026-10-15");

    // Monthly: Oct 2026 -> prev is Sep 2026
    const prevMonth = getPreviousPeriodAnchor("2026-10-22", "MONTHLY");
    assert.equal(prevMonth, "2026-09-01");

    // Yearly: 2026 -> prev is 2025
    const prevYear = getPreviousPeriodAnchor("2026-10-22", "YEARLY");
    assert.equal(prevYear, "2025-01-01");

    // Forward clamped to today
    const nextWeek = getNextPeriodAnchor("2026-10-22", "WEEKLY", today);
    assert.equal(isCurrentPeriodActive(nextWeek, "WEEKLY", today), true);
  });
});

test("Spending Analytics — Multi-Period Aggregations & Reconciliation", async (t) => {
  const accounts: Account[] = [
    { id: "acc-upi", name: "UPI", type: "UPI", currency: "INR", openingBalance: 0, isDefault: true, isActive: true, createdAt: "", updatedAt: "" },
    { id: "acc-card", name: "Credit Card", type: "BANK", currency: "INR", openingBalance: 0, isDefault: false, isActive: true, createdAt: "", updatedAt: "" },
  ];

  const transactions: Transaction[] = [
    // Week of Oct 19 - 25, 2026
    { id: "t1", type: "EXPENSE", amount: 500, description: "Swiggy", category: "Food & Dining", accountId: "acc-upi", date: "2026-10-19", time: "01:00 PM", createdAt: "", updatedAt: "" },
    { id: "t2", type: "EXPENSE", amount: 1200, description: "Fuel", category: "Transport", accountId: "acc-card", date: "2026-10-20", time: "05:30 PM", createdAt: "", updatedAt: "" },
    { id: "t3", type: "EXPENSE", amount: 800, description: "UPI/Swiggy/987654", category: "Food & Dining", accountId: "acc-upi", date: "2026-10-22", time: "08:15 PM", createdAt: "", updatedAt: "" },
    // Earlier in October (Week of Oct 12 - 18, 2026) -> Previous week
    { id: "t4", type: "EXPENSE", amount: 1500, description: "Supermarket", category: "Groceries", accountId: "acc-card", date: "2026-10-14", time: "11:00 AM", createdAt: "", updatedAt: "" },
    // September 2026 -> Previous month
    { id: "t5", type: "EXPENSE", amount: 4000, description: "Rent Advance", category: "Housing", accountId: "acc-upi", date: "2026-09-15", time: "10:00 AM", createdAt: "", updatedAt: "" },
    // Income transaction (must be ignored)
    { id: "t6", type: "INCOME", amount: 75000, description: "Salary", date: "2026-10-01", time: "09:00 AM", createdAt: "", updatedAt: "" },
  ];

  await t.test("1. Weekly analytics correctly aggregates 7 days and compares to previous week", () => {
    const weekly = calculateSpendingAnalytics({
      transactions,
      accounts,
      selectedDate: "2026-10-22",
      period: "WEEKLY",
      todayDate: "2026-10-22",
    });

    // Current week: t1 (500) + t2 (1200) + t3 (800) = 2500
    assert.equal(weekly.totalSpent, 2500);
    assert.equal(weekly.transactionCount, 3);
    assert.equal(weekly.chartBuckets.length, 7); // Mon to Sun

    // Monday (Oct 19): 500
    assert.equal(weekly.chartBuckets[0].amount, 500);
    // Tuesday (Oct 20): 1200 (Peak)
    assert.equal(weekly.chartBuckets[1].amount, 1200);
    assert.equal(weekly.maxBucket?.index, 1);
    // Thursday (Oct 22): 800
    assert.equal(weekly.chartBuckets[3].amount, 800);

    // Prev week: t4 (1500) -> Diff = +1000 -> (+1000/1500)*100 = +67%
    assert.equal(weekly.prevTotalSpent, 1500);
    assert.equal(weekly.diffAmount, 1000);
    assert.equal(weekly.percentageChange, 67);
    assert.equal(weekly.changeDirection, "increase");

    // Top merchant: Swiggy (500 + 800 = 1300)
    assert.equal(weekly.topMerchant?.name, "Swiggy");
    assert.equal(weekly.topMerchant?.amount, 1300);
  });

  await t.test("2. Monthly analytics aggregates all days in month and compares to previous month", () => {
    const monthly = calculateSpendingAnalytics({
      transactions,
      accounts,
      selectedDate: "2026-10-22",
      period: "MONTHLY",
      todayDate: "2026-10-22",
    });

    // October: t1 (500) + t2 (1200) + t3 (800) + t4 (1500) = 4000
    assert.equal(monthly.totalSpent, 4000);
    assert.equal(monthly.transactionCount, 4);
    assert.equal(monthly.chartBuckets.length, 31); // 31 days in October

    // Prev month (September): t5 (4000) -> Diff = 0 -> 0%
    assert.equal(monthly.prevTotalSpent, 4000);
    assert.equal(monthly.diffAmount, 0);
    assert.equal(monthly.percentageChange, 0);
    assert.equal(monthly.changeDirection, "neutral");
  });

  await t.test("3. Yearly analytics aggregates 12 months", () => {
    const yearly = calculateSpendingAnalytics({
      transactions,
      accounts,
      selectedDate: "2026-10-22",
      period: "YEARLY",
      todayDate: "2026-10-22",
    });

    // 2026: t1+t2+t3+t4 (4000) + t5 (4000) = 8000
    assert.equal(yearly.totalSpent, 8000);
    assert.equal(yearly.chartBuckets.length, 12);

    // Sep (index 8): 4000
    assert.equal(yearly.chartBuckets[8].amount, 4000);
    // Oct (index 9): 4000
    assert.equal(yearly.chartBuckets[9].amount, 4000);
  });
});
