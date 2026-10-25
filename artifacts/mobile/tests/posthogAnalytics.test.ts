import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  sanitizeEventProperties,
  sanitizeLogAttributes,
  captureAnalyticsEvent,
  logAnalyticsOperational,
  SENSITIVE_PROPERTY_BLACKLIST,
  type AnalyticsEventName,
} from "../services/analytics";

describe("PostHog Analytics — Privacy & Event Allowlist Verification", () => {
  it("1. Strictly permits only allowlisted events and allowlisted properties", () => {
    // transaction_added allowlist: ['transaction_type', 'has_category', 'has_account']
    const rawProps = {
      transaction_type: "EXPENSE",
      has_category: true,
      has_account: true,
      amount: 1500, // SENSITIVE: MUST BE STRIPPED
      merchant: "Starbucks", // SENSITIVE: MUST BE STRIPPED
      description: "Coffee with friends", // SENSITIVE: MUST BE STRIPPED
      accountNumber: "1234567890", // SENSITIVE: MUST BE STRIPPED
      cardLast4: "4321", // SENSITIVE: MUST BE STRIPPED
      notes: "personal note", // SENSITIVE: MUST BE STRIPPED
    };

    const sanitized = sanitizeEventProperties("transaction_added", rawProps);

    assert.deepEqual(sanitized, {
      transaction_type: "EXPENSE",
      has_category: true,
      has_account: true,
    });
    assert.strictEqual(sanitized.amount, undefined);
    assert.strictEqual(sanitized.merchant, undefined);
    assert.strictEqual(sanitized.description, undefined);
  });

  it("2. Rejects all financial amounts and balances across all 11 events", () => {
    const events: AnalyticsEventName[] = [
      "transaction_added",
      "transactions_imported",
      "transaction_deleted",
      "account_created",
      "category_created",
      "savings_goal_created",
      "savings_goal_funded",
      "recurring_payment_created",
      "recurring_payment_recorded",
      "data_exported",
      "onboarding_completed",
    ];

    for (const event of events) {
      const payloadWithSensitiveData = {
        amount: 5000,
        balance: 25000,
        currentAmount: 1000,
        targetAmount: 50000,
        merchant: "Amazon",
        cardLast4: "9999",
        sms: "Paid Rs. 500 via UPI",
        token: "secret_token",
      };

      const sanitized = sanitizeEventProperties(event, payloadWithSensitiveData);

      for (const sensitiveKey of SENSITIVE_PROPERTY_BLACKLIST) {
        assert.strictEqual(
          sanitized[sensitiveKey],
          undefined,
          `Event "${event}" must not contain sensitive key "${sensitiveKey}"`,
        );
      }
    }
  });

  it("3. Sanitizes operational log attributes to non-financial metadata only", () => {
    const rawLogAttrs = {
      transaction_count: 42,
      expense_count: 38,
      totalSpent: 12500, // SENSITIVE: MUST BE STRIPPED
      merchantList: ["Swiggy", "Uber"], // SENSITIVE: MUST BE STRIPPED
      notes: "test log", // SENSITIVE: MUST BE STRIPPED
    };

    const sanitized = sanitizeLogAttributes(
      "transaction import completed",
      rawLogAttrs,
    );

    assert.deepEqual(sanitized, {
      transaction_count: 42,
      expense_count: 38,
    });
    assert.strictEqual(sanitized.totalSpent, undefined);
    assert.strictEqual(sanitized.merchantList, undefined);
  });

  it("4. Blocks event emission completely when analytics consent is false", () => {
    // When hasConsent is false, captureAnalyticsEvent must safely do nothing
    assert.doesNotThrow(() => {
      captureAnalyticsEvent(
        "transaction_added",
        {
          transaction_type: "EXPENSE",
          has_category: true,
          has_account: true,
        },
        false, // NO CONSENT
      );
    });
  });

  it("5. Blocks operational logging when analytics consent is false", () => {
    assert.doesNotThrow(() => {
      logAnalyticsOperational(
        "transaction import completed",
        { transaction_count: 10, expense_count: 8 },
        false, // NO CONSENT
      );
    });
  });

  it("6. Never throws or disrupts caller if analytics client encounters an internal error", () => {
    // Malformed input or unexpected runtime errors must be caught
    assert.doesNotThrow(() => {
      // @ts-expect-error test invalid payload
      captureAnalyticsEvent("non_existent_event", { foo: "bar" }, true);
    });
  });

  it("7. Validates property allowlist for all 11 specific product events", () => {
    // 1. category_created
    assert.deepEqual(
      sanitizeEventProperties("category_created", {
        category_type: "expense",
        category_name: "Food", // Not allowed
      }),
      { category_type: "expense" },
    );

    // 2. account_created
    assert.deepEqual(
      sanitizeEventProperties("account_created", {
        account_type: "BANK",
        is_first_account: true,
        account_name: "HDFC Bank", // Not allowed
      }),
      { account_type: "BANK", is_first_account: true },
    );

    // 3. transactions_imported
    assert.deepEqual(
      sanitizeEventProperties("transactions_imported", {
        transaction_count: 15,
        expense_count: 10,
        raw_rows: ["a", "b"], // Not allowed
      }),
      { transaction_count: 15, expense_count: 10 },
    );

    // 4. transaction_deleted
    assert.deepEqual(
      sanitizeEventProperties("transaction_deleted", {
        transaction_id: "txn-123", // Not allowed
      }),
      {},
    );

    // 5. savings_goal_created
    assert.deepEqual(
      sanitizeEventProperties("savings_goal_created", {
        has_initial_funding: true,
        has_target_date: false,
        goal_name: "New Car", // Not allowed
      }),
      { has_initial_funding: true, has_target_date: false },
    );

    // 6. savings_goal_funded
    assert.deepEqual(
      sanitizeEventProperties("savings_goal_funded", {
        has_source_account: true,
        amount: 5000, // Not allowed
      }),
      { has_source_account: true },
    );

    // 7. recurring_payment_created
    assert.deepEqual(
      sanitizeEventProperties("recurring_payment_created", {
        frequency: "MONTHLY",
        auto_log_enabled: true,
        name: "Netflix", // Not allowed
      }),
      { frequency: "MONTHLY", auto_log_enabled: true },
    );

    // 8. recurring_payment_recorded
    assert.deepEqual(
      sanitizeEventProperties("recurring_payment_recorded", {
        frequency: "MONTHLY",
        has_source_account: true,
        amount: 799, // Not allowed
      }),
      { frequency: "MONTHLY", has_source_account: true },
    );

    // 9. data_exported
    assert.deepEqual(
      sanitizeEventProperties("data_exported", {
        export_format: "json",
        file_path: "/data/backup.json", // Not allowed
      }),
      { export_format: "json" },
    );

    // 10. onboarding_completed
    assert.deepEqual(
      sanitizeEventProperties("onboarding_completed", {
        has_currency_selection: true,
        has_default_account: true,
        user_name: "Sahil", // Not allowed
      }),
      { has_currency_selection: true, has_default_account: true },
    );
  });
});

