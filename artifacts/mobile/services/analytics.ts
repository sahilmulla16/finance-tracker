import { posthog } from "@/config/posthog";

/**
 * Zeno Analytics Event Names (Strict Allowlist)
 */
export type AnalyticsEventName =
  | "transaction_added"
  | "transactions_imported"
  | "transaction_deleted"
  | "account_created"
  | "category_created"
  | "savings_goal_created"
  | "savings_goal_funded"
  | "recurring_payment_created"
  | "recurring_payment_recorded"
  | "data_exported"
  | "onboarding_completed";

/**
 * Event-specific property schemas (Strict Allowlist)
 * ABSOLUTELY NO financial amounts, balances, merchant names,
 * account numbers, card numbers, UPI VPAs, personal notes, or PII.
 */
export interface EventPayloads {
  transaction_added: {
    transaction_type: string;
    has_category: boolean;
    has_account: boolean;
  };
  transactions_imported: {
    transaction_count: number;
    expense_count: number;
  };
  transaction_deleted: Record<string, never>;
  account_created: {
    account_type: string;
    is_first_account: boolean;
  };
  category_created: {
    category_type: string;
  };
  savings_goal_created: {
    has_initial_funding: boolean;
    has_target_date: boolean;
  };
  savings_goal_funded: {
    has_source_account: boolean;
  };
  recurring_payment_created: {
    frequency: string;
    auto_log_enabled: boolean;
  };
  recurring_payment_recorded: {
    frequency: string;
    has_source_account: boolean;
  };
  data_exported: {
    export_format: string;
  };
  onboarding_completed: {
    has_currency_selection: boolean;
    has_default_account: boolean;
  };
}

/**
 * Sensitive fields that must NEVER be sent to analytics under any circumstances.
 */
export const SENSITIVE_PROPERTY_BLACKLIST = [
  "amount",
  "balance",
  "totalBalance",
  "currentAmount",
  "targetAmount",
  "merchant",
  "merchantName",
  "description",
  "notes",
  "accountNumber",
  "cardLast4",
  "vpa",
  "upi",
  "sms",
  "body",
  "password",
  "token",
  "otp",
  "email",
  "name",
  "phone",
  "address",
] as const;

/**
 * Allowed event property keys per event.
 */
const EVENT_ALLOWED_KEYS: Record<AnalyticsEventName, string[]> = {
  transaction_added: ["transaction_type", "has_category", "has_account"],
  transactions_imported: ["transaction_count", "expense_count"],
  transaction_deleted: [],
  account_created: ["account_type", "is_first_account"],
  category_created: ["category_type"],
  savings_goal_created: ["has_initial_funding", "has_target_date"],
  savings_goal_funded: ["has_source_account"],
  recurring_payment_created: ["frequency", "auto_log_enabled"],
  recurring_payment_recorded: ["frequency", "has_source_account"],
  data_exported: ["export_format"],
  onboarding_completed: ["has_currency_selection", "has_default_account"],
};

/**
 * Sanitizes event properties against the strict allowlist and rejects all sensitive fields.
 */
export function sanitizeEventProperties<E extends AnalyticsEventName>(
  event: E,
  properties?: Record<string, unknown>,
): Record<string, unknown> {
  if (!properties) return {};

  const allowedKeys = EVENT_ALLOWED_KEYS[event] || [];
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(properties)) {
    // 1. Must be in the explicit allowlist for this event
    if (!allowedKeys.includes(key)) {
      continue;
    }

    // 2. Must not be in the blacklist (defense in depth)
    const lowerKey = key.toLowerCase();
    if (
      SENSITIVE_PROPERTY_BLACKLIST.some((blacklisted) =>
        lowerKey.includes(blacklisted.toLowerCase()),
      )
    ) {
      continue;
    }

    // 3. Reject null or undefined
    if (value === undefined || value === null) {
      continue;
    }

    sanitized[key] = value;
  }

  return sanitized;
}

/**
 * Allowed operational log messages and their allowlisted attributes.
 */
const ALLOWED_OPERATIONAL_LOGS: Record<string, string[]> = {
  "transaction import completed": ["transaction_count", "expense_count"],
  "backup export completed": ["export_format", "transaction_count"],
  "backup restore completed": ["restored_section_count", "has_transactions"],
};

/**
 * Sanitizes operational log attributes.
 */
export function sanitizeLogAttributes(
  message: string,
  attributes?: Record<string, unknown>,
): Record<string, unknown> {
  if (!attributes) return {};

  const allowedKeys = ALLOWED_OPERATIONAL_LOGS[message] || [];
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(attributes)) {
    if (!allowedKeys.includes(key)) continue;

    const lowerKey = key.toLowerCase();
    if (
      SENSITIVE_PROPERTY_BLACKLIST.some((b) =>
        lowerKey.includes(b.toLowerCase()),
      )
    ) {
      continue;
    }

    if (value !== undefined && value !== null) {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

// Simple in-memory deduplication cache (last event + timestamp)
let lastEventKey = "";
let lastEventTime = 0;
const DEDUP_WINDOW_MS = 300;

/**
 * Safely captures an allowlisted analytics event if and only if consent is granted.
 * Analytics failures will never throw or disrupt application functionality.
 */
export function captureAnalyticsEvent<E extends AnalyticsEventName>(
  event: E,
  properties?: EventPayloads[E],
  hasConsent = false,
): void {
  try {
    if (!hasConsent || !posthog) {
      return;
    }

    // Debounce duplicate events within the dedup window
    const now = Date.now();
    const eventKey = `${event}:${JSON.stringify(properties || {})}`;
    if (eventKey === lastEventKey && now - lastEventTime < DEDUP_WINDOW_MS) {
      return;
    }
    lastEventKey = eventKey;
    lastEventTime = now;

    const sanitizedProps = sanitizeEventProperties(event, properties);
    posthog.capture(event, sanitizedProps as any);
  } catch (error) {
    // Fail silently so core financial operations are completely shielded
    const isDev = typeof __DEV__ !== "undefined" ? __DEV__ : process.env.NODE_ENV !== "production";
    if (isDev) {
      console.warn(`[Analytics] Safe capture caught error for "${event}":`, error);
    }
  }
}

/**
 * Safely logs an operational log event if and only if consent is granted.
 */
export function logAnalyticsOperational(
  message: "transaction import completed" | "backup export completed" | "backup restore completed",
  attributes?: Record<string, unknown>,
  hasConsent = false,
): void {
  try {
    if (!hasConsent || !posthog?.logger) {
      return;
    }

    const sanitized = sanitizeLogAttributes(message, attributes);
    posthog.logger.info(message, sanitized as Record<string, string | number | boolean>);
  } catch (error) {
    const isDev = typeof __DEV__ !== "undefined" ? __DEV__ : process.env.NODE_ENV !== "production";
    if (isDev) {
      console.warn(`[Analytics] Safe operational log error for "${message}":`, error);
    }
  }
}
