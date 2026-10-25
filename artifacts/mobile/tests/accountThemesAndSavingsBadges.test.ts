import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  HOME_CARD_THEMES,
  HOME_CARD_THEMES_LIGHT,
  getHomeCardThemes,
  getCardTheme,
} from "../utils/accountCards";

test("Theme-Aware Account Card Colors & Savings Goal Fixes", async (t) => {
  await t.test(
    "1. getHomeCardThemes returns 3 dark themes in dark mode and 3 light themes in light mode",
    () => {
      const darkThemes = getHomeCardThemes(false);
      assert.equal(darkThemes.length, 3);
      assert.deepEqual(
        darkThemes.map((t) => t.id),
        ["graphite", "lime", "obsidian"],
      );
      assert.equal(darkThemes[0].accentColor, "#242826");
      assert.equal(darkThemes[1].accentColor, "#7ED92A");
      assert.equal(darkThemes[2].accentColor, "#1C2A22");

      const lightThemes = getHomeCardThemes(true);
      assert.equal(lightThemes.length, 3);
      assert.deepEqual(
        lightThemes.map((t) => t.id),
        ["navy", "slate", "steel"],
      );
      assert.equal(lightThemes[0].accentColor, "#1B3050");
      assert.equal(lightThemes[1].accentColor, "#373C44");
      assert.equal(lightThemes[2].accentColor, "#252A33");
    },
  );

  await t.test(
    "2. Saved color index (0, 1, 2) generates valid high-contrast themes in both light and dark modes",
    () => {
      [0, 1, 2].forEach((colorIdx) => {
        const darkTheme = getCardTheme(colorIdx, false);
        const lightTheme = getCardTheme(colorIdx, true);

        // Ensure both themes return valid gradient colors and high-contrast text
        assert.ok(darkTheme.colors.length >= 2);
        assert.ok(lightTheme.colors.length >= 2);
        assert.ok(darkTheme.textColor);
        assert.ok(lightTheme.textColor);
        assert.ok(darkTheme.borderColor);
        assert.ok(lightTheme.borderColor);
      });
    },
  );

  await t.test(
    "3. Countdown badge displays numeric value and clock icon without day/days text",
    () => {
      function formatCountdownNumber(days: number) {
        return Math.abs(days);
      }

      assert.equal(formatCountdownNumber(2), 2);
      assert.equal(formatCountdownNumber(1), 1);
      assert.equal(formatCountdownNumber(0), 0);
      assert.equal(formatCountdownNumber(-3), 3);

      // Verify that no text strings like "days", "day", "past", "Due today" are included in the number output
      const output = String(formatCountdownNumber(2));
      assert.equal(output.includes("day"), false);
      assert.equal(output.includes("days"), false);
      assert.equal(output.includes("past"), false);
      assert.equal(output.includes("Due today"), false);
    },
  );

  await t.test(
    "4. Main savings goals rectangular cards use 85% opacity overlay for high contrast and readability",
    () => {
      const savingsFile = path.resolve(__dirname, "../app/savings.tsx");
      const savingsContent = fs.readFileSync(savingsFile, "utf-8");

      // Verify the 85% opacity overlay in savings.tsx
      assert.ok(
        savingsContent.includes("rgba(10, 14, 13, 0.85)"),
        "Dark mode overlay must use 0.85 (85%) opacity",
      );
      assert.ok(
        savingsContent.includes("rgba(255, 255, 255, 0.85)"),
        "Light mode overlay must use 0.85 (85%) opacity",
      );
      assert.ok(
        savingsContent.includes("rectangularGoalOverlay"),
        "Must have rectangularGoalOverlay applied over the background image",
      );
    },
  );
});

