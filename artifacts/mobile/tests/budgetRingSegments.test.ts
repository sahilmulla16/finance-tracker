import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { calculateRingSegments, type CategorySegmentData } from "../utils/budgetRingSegments.ts";

describe("Budget Ring — Zero Overlap & 100% Visual Capping Test Suite", () => {
  test("1. When Shopping is 155% of limit, it does NOT overlap Bills & Utilities", () => {
    const testCategories: CategorySegmentData[] = [
      {
        name: "Shopping",
        amount: 15500,
        budget: 10000, // 155% of limit
        percentageOfTotal: 65,
        percentageOfBudget: 155,
        color: "#EC4899",
      },
      {
        name: "Food & Drinks",
        amount: 4000,
        budget: 5000, // 80% of limit
        percentageOfTotal: 17,
        percentageOfBudget: 80,
        color: "#FF8A00",
      },
      {
        name: "Transport",
        amount: 2000,
        budget: 3000, // 67% of limit
        percentageOfTotal: 8,
        percentageOfBudget: 67,
        color: "#3B82F6",
      },
      {
        name: "Entertainment",
        amount: 1350,
        budget: 1000, // 135% of limit
        percentageOfTotal: 6,
        percentageOfBudget: 135,
        color: "#A855F7",
      },
      {
        name: "Bills and Utilities",
        amount: 1000,
        budget: 4000, // 25% of limit
        percentageOfTotal: 4,
        percentageOfBudget: 25,
        color: "#10D078",
      },
    ];

    const segments = calculateRingSegments(testCategories, 280, 24, null);
    assert.equal(segments.length, 5);

    const shopping = segments.find((s) => s.name === "Shopping");
    const bills = segments.find((s) => s.name === "Bills and Utilities");
    const entertainment = segments.find((s) => s.name === "Entertainment");

    assert.ok(shopping);
    assert.ok(bills);
    assert.ok(entertainment);

    // Verify true percentage is preserved and over-budget flag is set
    assert.equal(shopping?.pctOfBudget, 155);
    assert.equal(shopping?.isOverBudget, true);
    assert.equal(entertainment?.pctOfBudget, 135);
    assert.equal(entertainment?.isOverBudget, true);

    // Bills is well within limit
    assert.equal(bills?.pctOfBudget, 25);
    assert.equal(bills?.isOverBudget, false);

    // Sum of all segment degree spans + total gaps MUST equal 360 degrees
    const totalDegSpans = segments.reduce((sum, s) => sum + s.degSpan, 0);
    const count = segments.length;
    const gapDeg = count <= 3 ? 12 : count <= 5 ? 10 : 8;
    const totalGaps = count * gapDeg;
    assert.equal(Math.round(totalDegSpans + totalGaps), 360);

    // Verify segments do not overlap each other
    for (let i = 0; i < segments.length; i++) {
      const current = segments[i];
      const next = segments[(i + 1) % segments.length];

      // End angle of current + gap must equal start angle of next (modulo 360)
      if (i < segments.length - 1) {
        assert.equal(Math.round(current.endAngle + gapDeg), Math.round(next.startAngle));
        assert.ok(current.endAngle < next.startAngle, `Segment ${current.name} overlaps next segment ${next.name}`);
      } else {
        // Last segment (Bills and Utilities) must end at -90 + 360 - gapDeg = 260
        assert.ok(current.endAngle <= 270 - gapDeg, "Last segment must not overlap first segment Shopping");
      }
    }

    // Verify floating badges have ample clearance and never collide
    for (let i = 0; i < segments.length; i++) {
      for (let j = i + 1; j < segments.length; j++) {
        const dx = segments[i].badgeX - segments[j].badgeX;
        const dy = segments[i].badgeY - segments[j].badgeY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        // Badges are 28x28, minimum center distance must be > 28
        assert.ok(
          dist >= 28,
          `Badges for ${segments[i].name} and ${segments[j].name} collide! Distance was ${dist.toFixed(1)}px`,
        );
      }
    }
  });

  test("2. When multiple categories are 135%, 150%, and 200%, the ring stays at 100% without clutter", () => {
    const extremeCategories: CategorySegmentData[] = [
      { name: "Shopping", amount: 20000, budget: 10000, percentageOfTotal: 50, percentageOfBudget: 200, color: "#EC4899" },
      { name: "Dining", amount: 7500, budget: 5000, percentageOfTotal: 25, percentageOfBudget: 150, color: "#FF8A00" },
      { name: "Groceries", amount: 5400, budget: 4000, percentageOfTotal: 15, percentageOfBudget: 135, color: "#10D078" },
      { name: "Bills", amount: 2000, budget: 5000, percentageOfTotal: 10, percentageOfBudget: 40, color: "#3B82F6" },
    ];

    const segments = calculateRingSegments(extremeCategories, 280, 24, null);
    assert.equal(segments.length, 4);

    const totalDegSpans = segments.reduce((sum, s) => sum + s.degSpan, 0);
    const gapDeg = 4 <= 3 ? 12 : 4 <= 5 ? 10 : 8; // 10
    assert.equal(Math.round(totalDegSpans + 4 * gapDeg), 360);

    // Each segment has guaranteed minimum visibility
    segments.forEach((s) => {
      assert.ok(s.degSpan >= 18, `Segment ${s.name} span is too small: ${s.degSpan}`);
    });
  });

  test("3. Handles single category without gaps or overlap", () => {
    const singleCat: CategorySegmentData[] = [
      { name: "All Spending", amount: 15000, budget: 10000, percentageOfTotal: 100, percentageOfBudget: 150, color: "#EC4899" },
    ];

    const segments = calculateRingSegments(singleCat, 280, 24, null);
    assert.equal(segments.length, 1);
    assert.equal(segments[0].degSpan, 360);
    assert.equal(segments[0].isOverBudget, true);
    assert.equal(segments[0].pctOfBudget, 150);
  });
});
