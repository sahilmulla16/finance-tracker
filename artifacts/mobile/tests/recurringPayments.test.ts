import test from "node:test";
import assert from "node:assert/strict";
import {
  computeNextDueDate,
  addMonthsClamped,
} from "../utils/recurringPayments.ts";

test("Recurring Payments — Recurrence Math & Month-End Clamping", async (t) => {
  await t.test("1. Weekly recurrence advances exactly 7 days", () => {
    const next = computeNextDueDate("2026-10-01", "WEEKLY");
    assert.equal(next, "2026-10-08");
  });

  await t.test("2. Monthly recurrence preserves day for regular months", () => {
    const next = computeNextDueDate("2026-03-15", "MONTHLY");
    assert.equal(next, "2026-04-15");
  });

  await t.test("3. Monthly recurrence scheduled on 31st clamps to 28th for February (non-leap)", () => {
    const next = computeNextDueDate("2026-01-31", "MONTHLY");
    assert.equal(next, "2026-02-28");
  });

  await t.test("4. Monthly recurrence scheduled on 31st clamps to 30th for April", () => {
    const next = computeNextDueDate("2026-03-31", "MONTHLY");
    assert.equal(next, "2026-04-30");
  });

  await t.test("5. Yearly recurrence in leap year handles Feb 29 gracefully", () => {
    // 2024 was leap year, 2025 is not leap year
    const next = computeNextDueDate("2024-02-29", "YEARLY");
    assert.equal(next, "2025-02-28");
  });

  await t.test("6. Advance until future advances overdue payment to current cycle", () => {
    const ref = new Date(2026, 9, 21); // 2026-10-21
    const next = computeNextDueDate("2026-07-21", "MONTHLY", ref, true);
    assert.ok(next >= "2026-10-21");
  });
});
