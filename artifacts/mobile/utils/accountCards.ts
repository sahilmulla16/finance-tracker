import type { AccountType, Currency } from "../context/FinanceContext";
import { money } from "./format";

export interface CardTheme {
  isLime: boolean;
  colors: [string, string, ...string[]];
  specular: [string, string, ...string[]];
  textColor: string;
  subTextColor: string;
  borderColor: string;
  shadowColor: string;
}

export interface HomeCardThemeInfo {
  index: number;
  id: string;
  name: string;
  accentColor: string;
}

/**
 * The 3 canonical card themes displayed on the Home page of the UI.
 * 0: Dark Metallic Graphite (Dark) / Midnight Navy (Light)
 * 1: Electric Lime Green (Dark) / Deep Black (Light)
 * 2: Deep Obsidian Emerald (Dark) / Slate Charcoal (Light)
 */
export const HOME_CARD_THEMES: HomeCardThemeInfo[] = [
  { index: 0, id: "graphite", name: "Metallic Graphite", accentColor: "#242826" },
  { index: 1, id: "lime", name: "Electric Lime", accentColor: "#7ED92A" },
  { index: 2, id: "obsidian", name: "Deep Obsidian", accentColor: "#1C2A22" },
];

/**
 * The 3 canonical card themes tailored for the Light Theme.
 * Uses rich, high-contrast Navy, Slate, and Steel tones consistent with Zeno design tokens.
 */
export const HOME_CARD_THEMES_LIGHT: HomeCardThemeInfo[] = [
  { index: 0, id: "navy", name: "Midnight Navy", accentColor: "#1B3050" },
  { index: 1, id: "slate", name: "Charcoal Slate", accentColor: "#373C44" },
  { index: 2, id: "steel", name: "Deep Steel", accentColor: "#252A33" },
];

/**
 * Returns the card theme choices for the active UI theme.
 */
export function getHomeCardThemes(isLight: boolean = false): HomeCardThemeInfo[] {
  return isLight ? HOME_CARD_THEMES_LIGHT : HOME_CARD_THEMES;
}

export function getCardTheme(
  index: number = 0,
  isLight: boolean = false,
  customThemeIndex?: number,
  _ignoredCustomColor?: string,
): CardTheme {
  // Theme 0: Dark Metallic Graphite (Dark) or Navy Blue (Light)
  const themeBlack: CardTheme = isLight
    ? {
        isLime: false,
        colors: ["#1B3050", "#122037", "#0A1322"],
        specular: [
          "rgba(220, 235, 255, 0.38)",
          "rgba(220, 235, 255, 0.1)",
          "transparent",
        ],
        textColor: "#FFFFFF",
        subTextColor: "rgba(220, 235, 255, 0.78)",
        borderColor: "rgba(100, 150, 220, 0.28)",
        shadowColor: "#000000",
      }
    : {
        isLime: false,
        colors: ["#242826", "#171A18", "#0E100F"],
        specular: ["rgba(255, 255, 255, 0.14)", "transparent"],
        textColor: "#FFFFFF",
        subTextColor: "rgba(255, 255, 255, 0.65)",
        borderColor: "rgba(255, 255, 255, 0.1)",
        shadowColor: "#000000",
      };

  // Theme 1: Rich Electric Lime Green (Dark) or Deep Black (Light)
  const themeGreen: CardTheme = isLight
    ? {
        isLime: false,
        colors: ["#373C44", "#20242B", "#111418"],
        specular: [
          "rgba(255, 255, 255, 0.35)",
          "rgba(255, 255, 255, 0.08)",
          "transparent",
        ],
        textColor: "#FFFFFF",
        subTextColor: "rgba(255, 255, 255, 0.72)",
        borderColor: "rgba(255, 255, 255, 0.16)",
        shadowColor: "#000000",
      }
    : {
        isLime: true,
        colors: ["#7ED92A", "#5EB516", "#3D7D09"],
        specular: ["rgba(255, 255, 255, 0.28)", "transparent"],
        textColor: "#070B06",
        subTextColor: "rgba(7, 11, 6, 0.74)",
        borderColor: "rgba(126, 217, 42, 0.45)",
        shadowColor: "rgba(126, 217, 42, 0.3)",
      };

  // Theme 2: Deep Obsidian Emerald (Dark) or Slate Charcoal (Light)
  const themeObsidian: CardTheme = isLight
    ? {
        isLime: false,
        colors: ["#252A33", "#191D24", "#0D0F13"],
        specular: ["rgba(255, 255, 255, 0.16)", "transparent"],
        textColor: "#FFFFFF",
        subTextColor: "rgba(255, 255, 255, 0.65)",
        borderColor: "rgba(255, 255, 255, 0.1)",
        shadowColor: "#000000",
      }
    : {
        isLime: false,
        colors: ["#1C2A22", "#121C16", "#0A100D"],
        specular: ["rgba(255, 255, 255, 0.09)", "transparent"],
        textColor: "#FFFFFF",
        subTextColor: "rgba(255, 255, 255, 0.62)",
        borderColor: "rgba(183, 255, 99, 0.16)",
        shadowColor: "#000000",
      };

  const themePalette = [themeBlack, themeGreen, themeObsidian];
  const rawIdx = customThemeIndex !== undefined ? customThemeIndex : index;
  const safeIdx = ((rawIdx % 3) + 3) % 3;
  return themePalette[safeIdx];
}

export function getCardLast4(accId: string = "", index: number = 0): string {
  const digits = (accId || "").replace(/\D/g, "");
  if (digits.length >= 4) {
    return digits.slice(-4);
  }
  return "";
}

export function resolveCardSubtitle(
  type: AccountType | string = "BANK",
  displayName?: string | null,
): string {
  if (displayName && displayName.trim()) {
    return displayName.trim();
  }
  const normalized = (type || "BANK").toString().trim().toUpperCase();
  if (normalized === "UPI") return "UPI WALLET";
  if (normalized === "CASH") return "CASH WALLET";
  if (normalized === "SAVINGS") return "SAVINGS ACCOUNT";
  if (normalized === "CARD" || normalized === "CREDIT") return "CARD";
  return `${normalized} ACCOUNT`;
}

export function formatLiveBalance(input: string = "", currency: Currency = "INR"): string {
  const num = parseFloat(input);
  if (isNaN(num)) return money(0, currency);
  return money(num, currency);
}

export function validateAccountName(name?: string | null): boolean {
  if (!name) return false;
  return name.trim().length > 0;
}

export function calculateNewOpeningBalance(
  targetBalance: number,
  currentLiveBalance: number,
  existingOpeningBalance: number,
): number {
  const netTransactions = currentLiveBalance - existingOpeningBalance;
  return targetBalance - netTransactions;
}
