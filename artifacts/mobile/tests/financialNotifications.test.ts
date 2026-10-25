import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  calculateBudgetStatuses,
  evaluateThresholdCrossings,
  calculateDailySpending,
  evaluateDailyLimitCrossing,
  calculateMonthlySpending,
  calculateWeeklySpending,
  getWeekBounds,
  getEligibleExpenses,
  isTxInMonth,
  isCurrentlyInQuietHours,
  type TransactionLike,
  type BudgetStatus,
} from "../services/notifications/financialInsights.ts";

describe("Financial Notifications & Insights Test Suite", () => {
  // Mock transaction builder helper
  const makeTx = (
    id: string,
    amount: number,
    type: "EXPENSE" | "INCOME" | "TRANSFER",
    category: string = "Food & Drinks",
    date: string = "2026-10-15"
  ): TransactionLike => ({
    id,
    amount,
    type,
    category,
    date,
    createdAt: `${date}T12:00:00.000Z`,
  });

  /* ========================================================================== */
  /* 1. Transaction Filtering & Eligibility                                      */
  /* ========================================================================== */
  describe("1. Transaction Filtering & Eligibility", () => {
    test("Excludes INCOME and TRANSFER types from eligible expenses", () => {
      const txs = [
        makeTx("tx1", 500, "EXPENSE", "Food"),
        makeTx("tx2", 5000, "INCOME", "Salary"),
        makeTx("tx3", 1000, "TRANSFER", "Account"),
        makeTx("tx4", -200, "EXPENSE", "Invalid"),
        makeTx("tx5", 0, "EXPENSE", "Zero"),
      ];

      const eligible = getEligibleExpenses(txs);
      assert.equal(eligible.length, 1);
      assert.equal(eligible[0].id, "tx1");
      assert.equal(eligible[0].amount, 500);
    });

    test("Safely handles null, undefined, or empty arrays", () => {
      assert.deepEqual(getEligibleExpenses([]), []);
      assert.deepEqual(getEligibleExpenses(null as any), []);
      assert.deepEqual(getEligibleExpenses(undefined as any), []);
    });
  });

  /* ========================================================================== */
  /* 2. Budget Statuses & Calculations                                         */
  /* ========================================================================== */
  describe("2. Budget Status Calculations", () => {
    test("Calculates overall monthly budget correctly", () => {
      const txs = [
        makeTx("tx1", 2000, "EXPENSE", "Food", "2026-10-05"),
        makeTx("tx2", 3000, "EXPENSE", "Rent", "2026-10-10"),
        makeTx("tx3", 1000, "EXPENSE", "Food", "2026-09-20"), // Different month
      ];

      const statuses = calculateBudgetStatuses(txs, {}, 10000, 2026, 9); // Oct is month index 9
      const overall = statuses.find((s) => s.id === "overall");

      assert.ok(overall, "Overall budget should be present");
      assert.equal(overall?.limit, 10000);
      assert.equal(overall?.spent, 5000);
      assert.equal(overall?.percentage, 50);
      assert.equal(overall?.remaining, 5000);
    });

    test("Calculates individual category budgets", () => {
      const txs = [
        makeTx("tx1", 1500, "EXPENSE", "Food", "2026-10-05"),
        makeTx("tx2", 800, "EXPENSE", "Transport", "2026-10-06"),
      ];

      const categoryBudgets = { Food: 2000, Transport: 1000, Shopping: 5000 };
      const statuses = calculateBudgetStatuses(txs, categoryBudgets, null, 2026, 9);

      const food = statuses.find((s) => s.id === "Food");
      const transport = statuses.find((s) => s.id === "Transport");
      const shopping = statuses.find((s) => s.id === "Shopping");

      assert.equal(food?.spent, 1500);
      assert.equal(food?.percentage, 75);
      assert.equal(food?.remaining, 500);

      assert.equal(transport?.spent, 800);
      assert.equal(transport?.percentage, 80);

      assert.equal(shopping?.spent, 0);
      assert.equal(shopping?.remaining, 5000);
    });

    test("Ignores non-positive and invalid budget limits", () => {
      const txs = [makeTx("tx1", 500, "EXPENSE", "Food", "2026-10-05")];
      const categoryBudgets = { Food: 0, Rent: -500, Misc: NaN };
      const statuses = calculateBudgetStatuses(txs, categoryBudgets, 0, 2026, 9);

      assert.equal(statuses.length, 0);
    });
  });

  /* ========================================================================== */
  /* 3. Budget Threshold Crossing Detection (80% & 100%)                       */
  /* ========================================================================== */
  describe("3. Threshold Crossing Detection & Re-arming", () => {
    const budgetStatus: BudgetStatus = {
      id: "Food",
      name: "Food",
      limit: 10000,
      spent: 8500,
      percentage: 85,
      remaining: 1500,
    };

    test("Triggers 80% alert when spending crosses 80% boundary", () => {
      // Previous spending was 7500 (< 8000), now 8500 (>= 8000)
      const events = evaluateThresholdCrossings(budgetStatus, 7500, new Set(), "2026-10");

      assert.equal(events.length, 1);
      assert.equal(events[0].threshold, 80);
      assert.equal(events[0].percentage, 85);
      assert.equal(events[0].eventKey, "budget_Food_2026-10_80");
    });

    test("Does NOT trigger 80% alert if previous spending was already >= 80%", () => {
      // Already above threshold (e.g. was 8200, now 8500)
      const events = evaluateThresholdCrossings(budgetStatus, 8200, new Set(), "2026-10");
      assert.equal(events.length, 0, "Should not spam duplicate alert while remaining above 80%");
    });

    test("Does NOT trigger if already sent key exists in deduplication cache", () => {
      const alreadySent = new Set(["budget_Food_2026-10_80"]);
      const events = evaluateThresholdCrossings(budgetStatus, 7500, alreadySent, "2026-10");
      assert.equal(events.length, 0, "Deduplication key prevents duplicate event");
    });

    test("Single transaction crossing both 80% and 100% emits both events", () => {
      const overStatus: BudgetStatus = {
        id: "Food",
        name: "Food",
        limit: 10000,
        spent: 10500,
        percentage: 105,
        remaining: 0,
      };

      // Previous spending was 7000 (< 80%), jumped to 10500 (>= 100%)
      const events = evaluateThresholdCrossings(overStatus, 7000, new Set(), "2026-10");

      assert.equal(events.length, 2);
      assert.equal(events[0].threshold, 80);
      assert.equal(events[1].threshold, 100);
      assert.equal(events[1].remaining, 0);
    });

    test("Re-arms properly after refund/deletion drops spending below 80%", () => {
      // Step 1: User crosses 80%
      const sentKeys = new Set<string>();
      const ev1 = evaluateThresholdCrossings(budgetStatus, 7500, sentKeys, "2026-10");
      assert.equal(ev1.length, 1);
      sentKeys.add(ev1[0].eventKey);

      // Step 2: Refund occurs - spending drops to 6000.
      // Re-arming logic resets the sent key when recorded spending falls below threshold:
      sentKeys.delete("budget_Food_2026-10_80");

      // Step 3: New transaction pushes spending back to 8200
      const newStatus: BudgetStatus = {
        ...budgetStatus,
        spent: 8200,
        percentage: 82,
        remaining: 1800,
      };
      const ev2 = evaluateThresholdCrossings(newStatus, 6000, sentKeys, "2026-10");
      assert.equal(ev2.length, 1, "Should re-fire 80% alert after legitimate drop and re-crossing");
    });

    test("New month period key has its own distinct event key", () => {
      const sentKeys = new Set(["budget_Food_2026-10_80"]);
      // In November 2026:
      const ev = evaluateThresholdCrossings(budgetStatus, 7000, sentKeys, "2026-11");
      assert.equal(ev.length, 1);
      assert.equal(ev[0].eventKey, "budget_Food_2026-11_80");
    });
  });

  /* ========================================================================== */
  /* 4. Daily Spending Calculations & Daily Limit Crossings                     */
  /* ========================================================================== */
  describe("4. Daily Spending & Daily Limit Crossings", () => {
    const txs = [
      makeTx("d1", 400, "EXPENSE", "Coffee", "2026-10-15"),
      makeTx("d2", 1200, "EXPENSE", "Groceries", "2026-10-15"),
      makeTx("d3", 600, "EXPENSE", "Coffee", "2026-10-15"),
      makeTx("d4", 800, "EXPENSE", "Transport", "2026-10-14"), // Yesterday
      makeTx("d5", 10000, "INCOME", "Salary", "2026-10-15"),   // Ignored
    ];

    test("Aggregates daily total and identifies top category", () => {
      const daily = calculateDailySpending(txs, "2026-10-15");

      assert.equal(daily.totalSpent, 2200);
      assert.equal(daily.transactionCount, 3);
      assert.equal(daily.topCategory?.name, "Groceries");
      assert.equal(daily.topCategory?.amount, 1200);
      assert.equal(daily.hasYesterdayData, true);
      assert.equal(daily.yesterdaySpent, 800);
      assert.equal(daily.differenceFromYesterday, 1400);
    });

    test("Handles day with zero spending gracefully", () => {
      const daily = calculateDailySpending(txs, "2026-10-10");

      assert.equal(daily.totalSpent, 0);
      assert.equal(daily.transactionCount, 0);
      assert.equal(daily.topCategory, undefined);
      assert.equal(daily.hasYesterdayData, false);
      assert.equal(daily.differenceFromYesterday, undefined);
    });

    test("Detects daily spending limit crossing", () => {
      // Limit is 2000. Spent is 2200. Previous day spending was 1500 (< 2000).
      const result = evaluateDailyLimitCrossing(txs, 2000, "2026-10-15", 1500, new Set());

      assert.ok(result, "Daily limit crossing should be detected");
      assert.equal(result?.isCrossed, true);
      assert.equal(result?.spent, 2200);
      assert.equal(result?.overAmount, 200);
      assert.equal(result?.eventKey, "daily_limit_2026-10-15_2000");
    });

    test("Does NOT re-trigger daily limit if already spent above limit", () => {
      // Previous spending was 2100 (already exceeded 2000)
      const result = evaluateDailyLimitCrossing(txs, 2000, "2026-10-15", 2100, new Set());
      assert.equal(result, null, "Should not trigger if already above limit");
    });

    test("Changing daily limit creates new distinct event key", () => {
      const alreadySent = new Set(["daily_limit_2026-10-15_2000"]);
      // If user lowers limit to 1500, event key is daily_limit_2026-10-15_1500
      const result = evaluateDailyLimitCrossing(txs, 1500, "2026-10-15", 1000, alreadySent);
      assert.ok(result);
      assert.equal(result?.eventKey, "daily_limit_2026-10-15_1500");
    });
  });

  /* ========================================================================== */
  /* 5. Monthly Spending Summaries                                              */
  /* ========================================================================== */
  describe("5. Monthly Spending Summaries", () => {
    const txs = [
      makeTx("m1", 2000, "EXPENSE", "Groceries", "2026-10-02"),
      makeTx("m2", 5000, "EXPENSE", "Shopping", "2026-10-14"),
      makeTx("m3", 3000, "EXPENSE", "Groceries", "2026-10-28"),
      // September (previous month)
      makeTx("m4", 8000, "EXPENSE", "Groceries", "2026-09-15"),
    ];

    test("Calculates total spent and top category for month", () => {
      const summary = calculateMonthlySpending(txs, 2026, 9); // October = index 9

      assert.equal(summary.year, 2026);
      assert.equal(summary.month, 9);
      assert.equal(summary.monthName, "October");
      assert.equal(summary.totalSpent, 10000);
      assert.equal(summary.transactionCount, 3);
      assert.equal(summary.topCategory?.name, "Groceries");
      assert.equal(summary.topCategory?.amount, 5000);
    });

    test("Computes accurate month-over-month difference and percentage change", () => {
      const summary = calculateMonthlySpending(txs, 2026, 9);

      assert.equal(summary.hasPreviousMonthData, true);
      assert.equal(summary.previousMonthSpent, 8000);
      assert.equal(summary.differenceFromPreviousMonth, 2000); // 10000 - 8000
      // (2000 / 8000) * 100 = 25% increase
      assert.equal(summary.percentageChange, 25);
    });

    test("Handles first month without previous data safely", () => {
      const onlyCurrent = [makeTx("m1", 2000, "EXPENSE", "Food", "2026-10-02")];
      const summary = calculateMonthlySpending(onlyCurrent, 2026, 9);

      assert.equal(summary.hasPreviousMonthData, false);
      assert.equal(summary.previousMonthSpent, undefined);
      assert.equal(summary.percentageChange, undefined);
    });
  });

  /* ========================================================================== */
  /* 6. ISO Weekly Spending Insights                                           */
  /* ========================================================================== */
  describe("6. ISO Weekly Spending Insights", () => {
    test("Calculates correct Monday to Sunday ISO week bounds", () => {
      // Wednesday, October 14, 2026
      const date = new Date(Date.UTC(2026, 9, 14));
      const bounds = getWeekBounds(date);

      // October 12 is Monday, October 18 is Sunday
      assert.equal(bounds.startDate, "2026-10-12");
      assert.equal(bounds.endDate, "2026-10-18");
    });

    test("Compares current week with previous week", () => {
      const txs = [
        // Current week (Oct 12 to Oct 18)
        makeTx("w1", 1500, "EXPENSE", "Dining", "2026-10-13"),
        makeTx("w2", 1500, "EXPENSE", "Dining", "2026-10-15"),
        // Previous week (Oct 5 to Oct 11)
        makeTx("w3", 4000, "EXPENSE", "Dining", "2026-10-07"),
      ];

      const refDate = new Date(Date.UTC(2026, 9, 14));
      const weekly = calculateWeeklySpending(txs, refDate);

      assert.equal(weekly.totalSpent, 3000);
      assert.equal(weekly.transactionCount, 2);
      assert.equal(weekly.hasPreviousWeekData, true);
      assert.equal(weekly.previousWeekSpent, 4000);
      assert.equal(weekly.differenceFromPreviousWeek, -1000); // 3000 - 4000 = -1000
      // (-1000 / 4000) * 100 = -25%
      assert.equal(weekly.percentageChange, -25);
    });
  });

  /* ========================================================================== */
  /* 7. Quiet Hours Logic                                                      */
  /* ========================================================================== */
  describe("7. Quiet Hours Window Logic", () => {
    test("Correctly detects daytime quiet hours window (e.g. 13:00 to 15:00)", () => {
      const config = {
        quietHoursEnabled: true,
        quietHoursStart: "13:00",
        quietHoursEnd: "15:00",
      };

      const insideTime = new Date();
      insideTime.setHours(14, 30, 0, 0);
      assert.equal(isCurrentlyInQuietHours(config, insideTime), true);

      const outsideBefore = new Date();
      outsideBefore.setHours(12, 59, 0, 0);
      assert.equal(isCurrentlyInQuietHours(config, outsideBefore), false);

      const outsideAfter = new Date();
      outsideAfter.setHours(15, 0, 0, 0);
      assert.equal(isCurrentlyInQuietHours(config, outsideAfter), false);
    });

    test("Correctly detects overnight quiet hours window (e.g. 22:00 to 07:00)", () => {
      const config = {
        quietHoursEnabled: true,
        quietHoursStart: "22:00",
        quietHoursEnd: "07:00",
      };

      // 23:30 is inside
      const lateNight = new Date();
      lateNight.setHours(23, 30, 0, 0);
      assert.equal(isCurrentlyInQuietHours(config, lateNight), true);

      // 05:15 is inside
      const earlyMorning = new Date();
      earlyMorning.setHours(5, 15, 0, 0);
      assert.equal(isCurrentlyInQuietHours(config, earlyMorning), true);

      // 14:00 is outside
      const afternoon = new Date();
      afternoon.setHours(14, 0, 0, 0);
      assert.equal(isCurrentlyInQuietHours(config, afternoon), false);
    });

    test("Returns false when quiet hours is disabled", () => {
      const config = {
        quietHoursEnabled: false,
        quietHoursStart: "22:00",
        quietHoursEnd: "07:00",
      };

      const midnight = new Date();
      midnight.setHours(0, 30, 0, 0);
      assert.equal(isCurrentlyInQuietHours(config, midnight), false);
    });

    test("Returns false when start or end is missing", () => {
      assert.equal(isCurrentlyInQuietHours({ quietHoursEnabled: true } as any), false);
    });
  });
});

