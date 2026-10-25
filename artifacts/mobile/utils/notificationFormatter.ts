export const NOTIFICATION_BULLET = " \u2022 ";
export const DEFAULT_EXPENSE_NOTIF_TITLE = "Expense tracked successfully";

/**
 * Formats a financial amount for notification display with 2 decimal places.
 * E.g. 1 -> "₹1.00", 150.5 -> "₹150.50"
 */
export function formatExpenseNotificationAmount(amount: number, currency: string = "INR"): string {
  const abs = Math.abs(amount || 0);
  const code = (currency || "INR").toUpperCase();
  const symbol = code === "USD" ? "$" : code === "EUR" ? "€" : code === "GBP" ? "£" : code === "AED" ? "د.إ " : "₹";
  return `${symbol}${abs.toFixed(2)}`;
}

/**
 * Filters out internal user identifiers, usernames, phone numbers, or account names
 * to prevent accidental leakage into the user-facing notification body.
 */
export function isUserOrAccountIdentifier(
  candidate?: string | null,
  profileName?: string | null,
  userEmail?: string | null,
  accountNames: string[] = [],
  categoryName?: string | null
): boolean {
  if (!candidate || !candidate.trim()) return true;
  const trimmed = candidate.trim();
  const lower = trimmed.toLowerCase();

  const genericWords = new Set([
    "self", "personal", "user", "expense", "null", "undefined",
    "transfer", "others", "other", "cash", "upi", "upi merchant",
    "vpa", "payment", "bank", "account", "a/c", "debit"
  ]);
  if (genericWords.has(lower)) return true;

  if (categoryName && lower === categoryName.trim().toLowerCase()) return true;

  if (profileName) {
    const userLower = profileName.trim().toLowerCase();
    const alphaUser = userLower.replace(/[^a-z0-9]/g, "");
    const alphaCand = lower.replace(/[^a-z0-9]/g, "");
    if (lower === userLower || (alphaUser.length > 0 && alphaCand === alphaUser)) {
      return true;
    }
  }

  if (userEmail) {
    const emailHandle = userEmail.split("@")[0].trim().toLowerCase();
    const alphaHandle = emailHandle.replace(/[^a-z0-9]/g, "");
    const alphaCand = lower.replace(/[^a-z0-9]/g, "");
    if (lower === emailHandle || (alphaHandle.length > 0 && alphaCand === alphaHandle)) {
      return true;
    }
  }

  for (const acc of accountNames) {
    if (lower === acc.trim().toLowerCase()) return true;
  }

  if (/^[0-9+() -]{5,20}$/.test(trimmed)) return true;

  return false;
}

/**
 * Strips out corrupted character encodings like â€¢ or â‚¹.
 */
export function sanitizeNotificationText(text?: string | null): string {
  if (!text) return "";
  return text
    .replace(/\u00E2\u20AC\u00A2/g, "•")
    .replace(/\u00E2\u201A\u00B9/g, "₹")
    .replace(/â€¢/g, "•")
    .replace(/â‚¹/g, "₹")
    .replace(/Ã¢â‚¬Â¢/g, "•")
    .replace(/Ã/g, "")
    .replace(/\uFFFD/g, "")
    .trim();
}

/**
 * Formats a clean, professional notification body.
 * E.g. "₹1.00 • Others" or "₹1.00 • Others • Starbucks"
 */
export function formatExpenseNotificationBody(
  amount: number,
  currency: string = "INR",
  categoryName?: string | null,
  merchantOrDescription?: string | null,
  profileName?: string | null,
  userEmail?: string | null,
  accountNames: string[] = []
): string {
  const amountStr = formatExpenseNotificationAmount(amount, currency);
  const cat = categoryName && categoryName.trim() ? sanitizeNotificationText(categoryName) : "Others";
  const cleanDesc = sanitizeNotificationText(merchantOrDescription);

  const includeMerchant = cleanDesc.length > 0 && !isUserOrAccountIdentifier(
    cleanDesc,
    profileName,
    userEmail,
    accountNames,
    cat
  );

  return includeMerchant
    ? `${amountStr}${NOTIFICATION_BULLET}${cat}${NOTIFICATION_BULLET}${cleanDesc}`
    : `${amountStr}${NOTIFICATION_BULLET}${cat}`;
}

