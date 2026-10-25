import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeMerchant,
  isMerchantMatch,
} from "../utils/merchantNormalization.ts";

describe("Merchant Normalization Utility", () => {
  test("Case-insensitive and whitespace-insensitive matching", () => {
    const r1 = normalizeMerchant("RF PETROL");
    const r2 = normalizeMerchant("rf petrol");
    const r3 = normalizeMerchant("RF   PETROL");

    assert.equal(r1.normalizedKey, "rf petrol");
    assert.equal(r2.normalizedKey, "rf petrol");
    assert.equal(r3.normalizedKey, "rf petrol");
    assert.equal(r1.isAmbiguous, false);
  });

  test("Safe handling of punctuation differences", () => {
    const r1 = normalizeMerchant("RF-PETROL");
    const r2 = normalizeMerchant("RF.PETROL");
    const r3 = normalizeMerchant("RF_PETROL");

    assert.equal(r1.normalizedKey, "rf petrol");
    assert.equal(r2.normalizedKey, "rf petrol");
    assert.equal(r3.normalizedKey, "rf petrol");
  });

  test("Safe handling of bank-generated prefixes and suffixes", () => {
    const r1 = normalizeMerchant("UPI/RF PETROL/1029384756");
    const r2 = normalizeMerchant("Paid to RF PETROL");
    const r3 = normalizeMerchant("POS/RF PETROL");
    const r4 = normalizeMerchant("RF PETROL PVT LTD");
    const r5 = normalizeMerchant("RF PETROL@okaxis");

    assert.equal(r1.normalizedKey, "rf petrol");
    assert.equal(r2.normalizedKey, "rf petrol");
    assert.equal(r3.normalizedKey, "rf petrol");
    assert.equal(r4.normalizedKey, "rf petrol");
    assert.equal(r5.normalizedKey, "rf petrol");
  });

  test("Anti-substring protection: RF PETROL must NOT match RF", () => {
    const rFull = normalizeMerchant("RF PETROL");
    const rShort = normalizeMerchant("RF");

    assert.equal(rFull.normalizedKey, "rf petrol");
    // "RF" is <= 2 chars, flagged as ambiguous
    assert.equal(rShort.isAmbiguous, true);

    // Matching check
    assert.equal(isMerchantMatch("RF", "rf petrol"), false);
    assert.equal(isMerchantMatch("RF PETROL", "rf"), false);
    assert.equal(isMerchantMatch("RF STORE", "rf petrol"), false);
    assert.equal(isMerchantMatch("PETROL PUMP", "rf petrol"), false);
  });

  test("Ambiguous and generic merchant handling", () => {
    assert.equal(normalizeMerchant("Payment").isAmbiguous, true);
    assert.equal(normalizeMerchant("Transfer").isAmbiguous, true);
    assert.equal(normalizeMerchant("UPI").isAmbiguous, true);
    assert.equal(normalizeMerchant("12345").isAmbiguous, true);
    assert.equal(normalizeMerchant("").isAmbiguous, true);
    assert.equal(normalizeMerchant("  ").isAmbiguous, true);
    assert.equal(normalizeMerchant(null).isAmbiguous, true);
  });

  test("Reliable matching with isMerchantMatch", () => {
    assert.equal(isMerchantMatch("RF PETROL", "rf petrol"), true);
    assert.equal(isMerchantMatch("Paid to RF PETROL", "rf petrol"), true);
    assert.equal(isMerchantMatch("rf petrol", "rf petrol"), true);
    assert.equal(isMerchantMatch("Other Shop", "rf petrol"), false);
  });
});

