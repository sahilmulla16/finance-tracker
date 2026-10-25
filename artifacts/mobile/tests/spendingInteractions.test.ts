import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateChartTooltipPosition,
  filterTransactionsForBucket,
  computeBucketDetails,
  buildSpendingDateParams,
  calculateSpendingAnalytics,
} from "../utils/dailySpend";
import type { Transaction, Account } from "../context/FinanceContext";

test("Chart Tooltip Positioning & Dynamic Clamping", async (t) => {
  const containerWidth = 336;
  const tooltipWidth = 76;
  const chartBarsHeight = 120;

  await t.test("1. First bar of the day (12 AM, index 0) clamps to left without jumping or clipping", () => {
    const result = calculateChartTooltipPosition({
      barIndex: 0,
      totalBars: 24,
      containerWidth,
      tooltipWidth,
      chartBarsHeight,
      barAmount: 250,
      maxAmount: 1000,
    });

    // Desired left would be 0.5 * (336/24) - 38 = 7 - 38 = -31, clamped to 4
    assert.equal(result.isClampedLeft, true);
    assert.equal(result.left, 4);
    // Arrow stays inside tooltip bounds and points towards the first bar
    assert.ok(result.arrowLeft >= 6);
    assert.ok(result.arrowLeft <= tooltipWidth - 14);
    // Top coordinate remains within container
    assert.ok(result.top >= 2);
  });

  await t.test("2. Last bar of the day (11 PM, index 23) clamps to right edge without clipping", () => {
    const result = calculateChartTooltipPosition({
      barIndex: 23,
      totalBars: 24,
      containerWidth,
      tooltipWidth,
      chartBarsHeight,
      barAmount: 500,
      maxAmount: 1000,
    });

    const maxExpectedLeft = containerWidth - tooltipWidth - 4; // 336 - 76 - 4 = 256
    assert.equal(result.isClampedRight, true);
    assert.equal(result.left, maxExpectedLeft);
    // Tooltip right boundary does not exceed chart
    assert.ok(result.left + tooltipWidth <= containerWidth);
    // Arrow is placed near the right side of the tooltip pointing at the 11 PM bar
    assert.ok(result.arrowLeft > tooltipWidth / 2);
  });

  await t.test("3. A bar near the left edge (index 1) and right edge (index 22)", () => {
    const leftResult = calculateChartTooltipPosition({
      barIndex: 1,
      totalBars: 24,
      containerWidth,
      tooltipWidth,
      chartBarsHeight,
      barAmount: 100,
      maxAmount: 1000,
    });
    assert.ok(leftResult.left >= 4);

    const rightResult = calculateChartTooltipPosition({
      barIndex: 22,
      totalBars: 24,
      containerWidth,
      tooltipWidth,
      chartBarsHeight,
      barAmount: 300,
      maxAmount: 1000,
    });
    assert.ok(rightResult.left + tooltipWidth <= containerWidth);
  });

  await t.test("4. A bar near the chart's top boundary (peak amount) leaves headroom and does not clip top", () => {
    const peakResult = calculateChartTooltipPosition({
      barIndex: 12,
      totalBars: 24,
      containerWidth,
      tooltipWidth,
      chartBarsHeight,
      barAmount: 5000,
      maxAmount: 5000, // Peak
    });

    // Top must be >= 2 and never negative
    assert.ok(peakResult.top >= 2);
    assert.ok(peakResult.top < 40);
  });

  await t.test("5. Chart resizing (e.g. 320px to 420px) recomputes positions smoothly", () => {
    const pos320 = calculateChartTooltipPosition({
      barIndex: 12,
      totalBars: 24,
      containerWidth: 320,
      tooltipWidth: 76,
      chartBarsHeight: 120,
      barAmount: 500,
      maxAmount: 1000,
    });

    const pos420 = calculateChartTooltipPosition({
      barIndex: 12,
      totalBars: 24,
      containerWidth: 420,
      tooltipWidth: 76,
      chartBarsHeight: 120,
      barAmount: 500,
      maxAmount: 1000,
    });

    // Centered bar on wider screen shifts further right
    assert.ok(pos420.left > pos320.left);
  });

  await t.test("6. Switching periods adjusts geometry for 7, 12, and 31 bars", () => {
    // Weekly (7 bars)
    const weeklyPos = calculateChartTooltipPosition({
      barIndex: 3, // Thursday (middle)
      totalBars: 7,
      containerWidth: 350,
      tooltipWidth: 76,
      barAmount: 400,
      maxAmount: 1000,
    });
    assert.equal(weeklyPos.isClampedLeft, false);
    assert.equal(weeklyPos.isClampedRight, false);

    // Monthly (31 bars)
    const monthlyPos = calculateChartTooltipPosition({
      barIndex: 0,
      totalBars: 31,
      containerWidth: 350,
      tooltipWidth: 76,
      barAmount: 200,
      maxAmount: 1000,
    });
    assert.equal(monthlyPos.isClampedLeft, true);
    assert.equal(monthlyPos.left, 4);

    // Yearly (12 bars)
    const yearlyPos = calculateChartTooltipPosition({
      barIndex: 11, // December
      totalBars: 12,
      containerWidth: 350,
      tooltipWidth: 76,
      barAmount: 1200,
      maxAmount: 2000,
    });
    assert.equal(yearlyPos.isClampedRight, true);
  });
});

test("Selected-Interval Filtering & Derived Widgets", async (t) => {
  const accounts: Account[] = [
    { id: "acc-1", name: "UPI", type: "UPI", currency: "INR", openingBalance: 0, isDefault: true, isActive: true, createdAt: "", updatedAt: "" },
    { id: "acc-2", name: "Credit Card", type: "BANK", currency: "INR", openingBalance: 0, isDefault: false, isActive: true, createdAt: "", updatedAt: "" },
  ];

  const transactions: Transaction[] = [
    // Daily test: Oct 22, 2026
    { id: "tx-11am", type: "EXPENSE", amount: 450, description: "Brunch Cafe", category: "Food & Dining", accountId: "acc-1", date: "2026-10-22", time: "11:30 AM", createdAt: "", updatedAt: "" },
    { id: "tx-12pm", type: "EXPENSE", amount: 900, description: "Bookstore", category: "Shopping", accountId: "acc-2", date: "2026-10-22", time: "12:00 PM", createdAt: "", updatedAt: "" },
    { id: "tx-1215pm", type: "EXPENSE", amount: 150, description: "Coffee", category: "Food & Dining", accountId: "acc-1", date: "2026-10-22", time: "12:15 PM", createdAt: "", updatedAt: "" },

    // Weekly test: Oct 19 - 25, 2026
    { id: "tx-tue", type: "EXPENSE", amount: 300, description: "Metro", category: "Transport", accountId: "acc-1", date: "2026-10-20", time: "09:00 AM", createdAt: "", updatedAt: "" }, // Tue
    { id: "tx-wed", type: "EXPENSE", amount: 1200, description: "Doctor", category: "Healthcare", accountId: "acc-2", date: "2026-10-21", time: "04:00 PM", createdAt: "", updatedAt: "" }, // Wed
    { id: "tx-thu", type: "EXPENSE", amount: 600, description: "Groceries", category: "Groceries", accountId: "acc-1", date: "2026-10-22", time: "07:00 PM", createdAt: "", updatedAt: "" }, // Thu

    // Monthly test: September vs October 2026
    { id: "tx-sep15", type: "EXPENSE", amount: 2500, description: "Hotel", category: "Travel", accountId: "acc-2", date: "2026-09-15", time: "02:00 PM", createdAt: "", updatedAt: "" },
    { id: "tx-sep16", type: "EXPENSE", amount: 800, description: "Dinner", category: "Food & Dining", accountId: "acc-1", date: "2026-09-16", time: "08:30 PM", createdAt: "", updatedAt: "" },

    // Yearly test: 2025 vs 2026
    { id: "tx-mar2025", type: "EXPENSE", amount: 3200, description: "Flight", category: "Travel", accountId: "acc-2", date: "2025-03-12", time: "10:00 AM", createdAt: "", updatedAt: "" },
    { id: "tx-mar2026", type: "EXPENSE", amount: 1800, description: "Train", category: "Travel", accountId: "acc-1", date: "2026-03-15", time: "11:00 AM", createdAt: "", updatedAt: "" },
  ];

  await t.test("1. Daily: 11 AM–12 PM bar excludes transaction at exactly 12:00 PM", () => {
    const bucket11 = { index: 11, id: "hour-11", label: "11 AM", fullLabel: "11:00 AM – 12:00 PM", amount: 450, count: 1, percentage: 100 };
    const filtered11 = filterTransactionsForBucket(transactions, "DAILY", bucket11, "2026-10-22");

    assert.equal(filtered11.length, 1);
    assert.equal(filtered11[0].id, "tx-11am");
    assert.equal(filtered11[0].amount, 450);

    // 12:00 PM belongs to hour 12
    const bucket12 = { index: 12, id: "hour-12", label: "12 PM", fullLabel: "12:00 PM – 01:00 PM", amount: 1050, count: 2, percentage: 100 };
    const filtered12 = filterTransactionsForBucket(transactions, "DAILY", bucket12, "2026-10-22");
    assert.equal(filtered12.length, 2);
    assert.ok(filtered12.some((t) => t.id === "tx-12pm"));
    assert.ok(filtered12.some((t) => t.id === "tx-1215pm"));
  });

  await t.test("2. Weekly: selecting Wednesday excludes other days (Tuesday and Thursday)", () => {
    const wedBucket = { index: 2, id: "week-2026-10-21", label: "Wed", fullLabel: "Wed, 21 Oct", amount: 1200, count: 1, percentage: 100, dateKey: "2026-10-21" };
    const filtered = filterTransactionsForBucket(transactions, "WEEKLY", wedBucket, "2026-10-22");

    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].id, "tx-wed");
    assert.equal(filtered[0].category, "Healthcare");
  });

  await t.test("3. Monthly: selecting Sep 15 excludes Sep 16 and other months", () => {
    const sep15Bucket = { index: 14, id: "month-day-15", label: "15", fullLabel: "15 Sep 2026", amount: 2500, count: 1, percentage: 100, dateKey: "2026-09-15" };
    const filtered = filterTransactionsForBucket(transactions, "MONTHLY", sep15Bucket, "2026-09-15");

    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].id, "tx-sep15");
    assert.equal(filtered[0].amount, 2500);
  });

  await t.test("4. Yearly: selecting March 2025 excludes March 2026", () => {
    const mar2025Bucket = { index: 2, id: "year-month-3", label: "Mar", fullLabel: "Mar 2025", amount: 3200, count: 1, percentage: 100, dateKey: "2025-03" };
    const filtered = filterTransactionsForBucket(transactions, "YEARLY", mar2025Bucket, "2025-01-01");

    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].id, "tx-mar2025");
    assert.equal(filtered[0].amount, 3200);
  });

  await t.test("5. Empty buckets display zero count and no unrelated transactions", () => {
    const emptyHourBucket = { index: 3, id: "hour-3", label: "3 AM", fullLabel: "03:00 AM – 04:00 AM", amount: 0, count: 0, percentage: 0 };
    const filtered = filterTransactionsForBucket(transactions, "DAILY", emptyHourBucket, "2026-10-22");

    assert.equal(filtered.length, 0);
    const details = computeBucketDetails(filtered, accounts);
    assert.equal(details.totalSpent, 0);
    assert.equal(details.transactionCount, 0);
    assert.equal(details.averageSpend, 0);
    assert.equal(details.categories.length, 0);
    assert.equal(details.paymentMethods.length, 0);
    assert.equal(details.topMerchant, null);
  });

  await t.test("6. computeBucketDetails derives reconciled categories, payment methods, and merchants", () => {
    const bucket12 = { index: 12, id: "hour-12", label: "12 PM", fullLabel: "12:00 PM – 01:00 PM", amount: 1050, count: 2, percentage: 100 };
    const filtered = filterTransactionsForBucket(transactions, "DAILY", bucket12, "2026-10-22");
    const details = computeBucketDetails(filtered, accounts);

    assert.equal(details.totalSpent, 1050); // 900 + 150
    assert.equal(details.transactionCount, 2);
    assert.equal(details.averageSpend, 525);
    // Categories: Shopping (900) + Food & Dining (150)
    assert.equal(details.categories.length, 2);
    assert.equal(details.categories[0].name, "Shopping");
    assert.equal(details.categories[0].amount, 900);
    // Payment methods: Card (900) + UPI (150)
    assert.equal(details.paymentMethods.length, 2);
  });
});

test("Top Categories Navigation Parameter Preservation", async (t) => {
  await t.test("1. Previously selected month (September 2026) produces September route params", () => {
    const params = buildSpendingDateParams("MONTHLY", "2026-09-01", null);

    assert.equal(params.period, "MONTHLY");
    assert.equal(params.month, "8"); // 0-indexed for September
    assert.equal(params.year, "2026");
    assert.equal(params.monthName, "September");
    assert.equal(params.startDate, "2026-09-01");
    assert.equal(params.endDate, "2026-09-30");
  });

  await t.test("2. Previously selected year (2025) produces 2025 route params", () => {
    const params = buildSpendingDateParams("YEARLY", "2025-01-01", null);

    assert.equal(params.period, "YEARLY");
    assert.equal(params.year, "2025");
    assert.equal(params.dateLabel, "Year 2025");
  });

  await t.test("3. Weekly mode preserves exact week date range", () => {
    const params = buildSpendingDateParams("WEEKLY", "2026-10-22", null);

    assert.equal(params.period, "WEEKLY");
    assert.equal(params.startDate, "2026-10-19");
    assert.equal(params.endDate, "2026-10-25");
  });

  await t.test("4. Daily mode with hourly bucket preserves both day and hour", () => {
    const bucket = { index: 14, id: "hour-14", label: "2 PM", fullLabel: "02:00 PM – 03:00 PM", amount: 500, count: 1, percentage: 100 };
    const params = buildSpendingDateParams("DAILY", "2026-09-15", bucket);

    assert.equal(params.period, "DAILY");
    assert.equal(params.date, "2026-09-15");
    assert.equal(params.hour, "14");
    assert.ok(params.dateLabel.includes("02:00 PM – 03:00 PM"));
  });

  await t.test("5. Category navigation preserves both category and date context", () => {
    const dateParams = buildSpendingDateParams("MONTHLY", "2026-09-01", null);
    const navPayload = {
      category: "Food & Dining",
      ...dateParams,
    };

    assert.equal(navPayload.category, "Food & Dining");
    assert.equal(navPayload.month, "8");
    assert.equal(navPayload.year, "2026");
  });
});

