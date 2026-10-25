import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  parseUniversalSms,
  resolveAccountForTransaction,
  validateTransactionSafety,
  isDuplicateTransaction,
  resolveTransferAccounts,
  findOriginalTransactionForRefund,
  identifyBank,
  getUniversalBankAliases,
  extractSuffix,
  INSTITUTION_REGISTRY,
  NormalizedTransaction,
  AccountMatchCandidate,
} from "../services/autoTrack";

describe("Universal Smart Auto Track — Institution Identification & Sender DLT Normalization", () => {
  test("Normalizes TRAI DLT sender IDs and matches Public Sector Banks", () => {
    // SBI
    const sbiRes = identifyBank("Your A/c was debited", "VM-SBIINB-S");
    assert.equal(sbiRes.institution?.code, "SBI");
    assert.equal(sbiRes.institution?.category, "PUBLIC_SECTOR");

    // PNB
    const pnbRes = identifyBank("Rs 500 debited from a/c", "AD-PNBSMS");
    assert.equal(pnbRes.institution?.code, "PNB");

    // Bank of Baroda
    const bobRes = identifyBank("Txn alert", "VK-BOBTXN");
    assert.equal(bobRes.institution?.code, "BOB");

    // Canara Bank
    const canRes = identifyBank("Debited from Canara", "BZ-CANBNK");
    assert.equal(canRes.institution?.code, "CANARA");

    // Union Bank of India
    const ubiRes = identifyBank("Union Bank alert", "CP-UBION");
    assert.equal(ubiRes.institution?.code, "UNION");

    // Bank of Maharashtra
    const bomRes = identifyBank("Alert from MahaBank", "VM-MAHABK");
    assert.equal(bomRes.institution?.code, "BOM");
  });

  test("Identifies Private Sector Banks accurately", () => {
    // HDFC
    const hdfcRes = identifyBank("HDFC Bank Alert", "AD-HDFCBK");
    assert.equal(hdfcRes.institution?.code, "HDFC");
    assert.equal(hdfcRes.institution?.category, "PRIVATE_SECTOR");

    // ICICI
    const iciciRes = identifyBank("ICICI Bank Alert", "VM-ICICIB");
    assert.equal(iciciRes.institution?.code, "ICICI");

    // Axis
    const axisRes = identifyBank("Axis Bank Alert", "VK-AXISBK");
    assert.equal(axisRes.institution?.code, "AXIS");

    // Kotak
    const kotakRes = identifyBank("Kotak Bank Alert", "BZ-KOTAKB");
    assert.equal(kotakRes.institution?.code, "KOTAK");

    // IndusInd
    const indusRes = identifyBank("IndusInd Bank Alert", "CP-INDUSB");
    assert.equal(indusRes.institution?.code, "INDUSIND");

    // IDFC FIRST
    const idfcRes = identifyBank("IDFC FIRST Alert", "AD-IDFCFB");
    assert.equal(idfcRes.institution?.code, "IDFC");

    // Federal Bank
    const fedRes = identifyBank("Federal Bank Alert", "VK-FEDBNK");
    assert.equal(fedRes.institution?.code, "FEDERAL");

    // YES Bank
    const yesRes = identifyBank("YES Bank Alert", "VM-YESBNK");
    assert.equal(yesRes.institution?.code, "YES");
  });

  test("Identifies Small Finance Banks and Payments Banks", () => {
    // AU Small Finance Bank
    const auRes = identifyBank("AU 0101 alert", "VK-AUSMAL");
    assert.equal(auRes.institution?.code, "AU_SFB");
    assert.equal(auRes.institution?.category, "SMALL_FINANCE");

    // Equitas Small Finance Bank
    const eqRes = identifyBank("Equitas alert", "AD-EQUTAS");
    assert.equal(eqRes.institution?.code, "EQUITAS_SFB");

    // Ujjivan Small Finance Bank
    const ujjRes = identifyBank("Ujjivan alert", "BZ-UJJIVN");
    assert.equal(ujjRes.institution?.code, "UJJIVAN_SFB");

    // Paytm Payments Bank
    const pyRes = identifyBank("Paytm Payments Bank alert", "AD-PYTMBK");
    assert.equal(pyRes.institution?.code, "PAYTM_PB");
    assert.equal(pyRes.institution?.category, "PAYMENTS_BANK");

    // Airtel Payments Bank
    const airRes = identifyBank("Airtel Payments Bank alert", "VM-AIRTEL");
    assert.equal(airRes.institution?.code, "AIRTEL_PB");

    // India Post Payments Bank
    const ippbRes = identifyBank("IPPB alert", "VK-IPPBMS");
    assert.equal(ippbRes.institution?.code, "IPPB");
  });

  test("Identifies Cooperative, Regional Rural, and Foreign Banks", () => {
    // Saraswat Cooperative Bank
    const sarRes = identifyBank("Saraswat Bank alert", "AD-SRSWAT");
    assert.equal(sarRes.institution?.code, "SARASWAT");
    assert.equal(sarRes.institution?.category, "COOPERATIVE");

    // Kerala Gramin Bank
    const kgbRes = identifyBank("Kerala Gramin Bank alert", "VM-KRGBNK");
    assert.equal(kgbRes.institution?.code, "KERALA_GRAMIN");
    assert.equal(kgbRes.institution?.category, "REGIONAL_RURAL");

    // Standard Chartered Bank
    const scbRes = identifyBank("Standard Chartered alert", "AD-SCBLIN");
    assert.equal(scbRes.institution?.code, "SCB");
    assert.equal(scbRes.institution?.category, "FOREIGN");

    // DBS Bank
    const dbsRes = identifyBank("DBS Digibank alert", "VK-DBSTXN");
    assert.equal(dbsRes.institution?.code, "DBS");
  });

  test("Identifies Standalone Credit Card Issuers vs Parent Banks", () => {
    // SBI Card (separate entity from SBI Savings Bank)
    const sbiCardRes = identifyBank("Spent on SBI Credit Card", "AD-SBICRD");
    assert.equal(sbiCardRes.institution?.code, "SBI_CARD");
    assert.equal(sbiCardRes.institution?.category, "CREDIT_CARD_ISSUER");

    // OneCard
    const oneCardRes = identifyBank("Transaction of Rs 500 on OneCard metal card", "VK-ONECRD");
    assert.equal(oneCardRes.institution?.code, "ONECARD");

    // Slice
    const sliceRes = identifyBank("Spent using your Slice Card", "AD-SLICET");
    assert.equal(sliceRes.institution?.code, "SLICE");
  });
});

describe("Universal Smart Auto Track — Suffix Extraction (Card vs Account Strict Distinction)", () => {
  test("Extracts Card suffix when 'Card' keyword is present", () => {
    // Credit card ending
    const s1 = extractSuffix("Spent Rs 1,450 on your Credit Card ending 9136 at Amazon");
    assert.ok(s1);
    assert.equal(s1?.type, "card");
    assert.equal(s1?.value, "9136");

    // Card **9136
    const s2 = extractSuffix("Dear Customer, Card **9136 was used for Rs. 350 at STARBUCKS");
    assert.ok(s2);
    assert.equal(s2?.type, "card");
    assert.equal(s2?.value, "9136");

    // Debit card ending
    const s3 = extractSuffix("Rs 890 debited via Debit Card ending 4821 on 24-Oct-26");
    assert.ok(s3);
    assert.equal(s3?.type, "card");
    assert.equal(s3?.value, "4821");

    // Card no. ending
    const s4 = extractSuffix("Alert: Card no. ending with 7720 charged Rs 120");
    assert.ok(s4);
    assert.equal(s4?.type, "card");
    assert.equal(s4?.value, "7720");
  });

  test("Extracts Bank Account suffix when 'A/c' or 'Account' keyword is present", () => {
    // A/c XX4821
    const s1 = extractSuffix("A/c XX4821 debited by Rs. 500 for UPI txn to Swiggy");
    assert.ok(s1);
    assert.equal(s1?.type, "bank_account");
    assert.equal(s1?.value, "4821");

    // Account ending 4821
    const s2 = extractSuffix("Rs 10,000 credited to Account ending 4821 as salary");
    assert.ok(s2);
    assert.equal(s2?.type, "bank_account");
    assert.equal(s2?.value, "4821");

    // A/c *8572
    const s3 = extractSuffix("Your A/c *8572 is debited for Rs 120.00");
    assert.ok(s3);
    assert.equal(s3?.type, "bank_account");
    assert.equal(s3?.value, "8572");

    // in a/c
    const s4 = extractSuffix("Refund credited in A/c 3341. Avail bal Rs 5400");
    assert.ok(s4);
    assert.equal(s4?.type, "bank_account");
    assert.equal(s4?.value, "3341");
  });

  test("Classifies generic mask XX1234 without prefix as 'unknown'", () => {
    const s1 = extractSuffix("Txn of Rs 500 done on XX1234. Avail bal: Rs 4000");
    assert.ok(s1);
    assert.equal(s1?.type, "unknown");
    assert.equal(s1?.value, "1234");
  });
});

describe("Universal Smart Auto Track — Conservative Account Resolution", () => {
  const userAccounts: AccountMatchCandidate[] = [
    {
      id: "acc-hdfc-savings",
      name: "HDFC Salary Savings",
      type: "BANK",
      accountNumberLast4: "4821",
      cardLast4: "1199",
      isActive: true,
    },
    {
      id: "acc-hdfc-credit",
      name: "HDFC Regalia Credit Card",
      type: "CREDIT",
      cardLast4: "9136",
      isActive: true,
    },
    {
      id: "acc-sbi-primary",
      name: "SBI Savings - 7720",
      type: "BANK",
      accountNumberLast4: "7720",
      isActive: true,
    },
    {
      id: "acc-sbi-secondary",
      name: "SBI Savings - 8830",
      type: "BANK",
      accountNumberLast4: "8830",
      isActive: true,
    },
    {
      id: "acc-onecard",
      name: "OneCard Metal",
      type: "CREDIT",
      cardLast4: "5544",
      isActive: true,
    },
    {
      id: "acc-cash",
      name: "Cash Wallet",
      type: "CASH",
      isActive: true,
    },
  ];

  test("Strict Card vs Bank Account distinction: Card 9136 matches Credit Card, never Savings", () => {
    const sms = "Spent Rs 2,500 on your HDFC Bank Credit Card ending 9136 at Croma. Avl Limit: Rs 1,45,000";
    const txn = parseUniversalSms(sms, "AD-HDFCBK");
    assert.ok(txn);
    assert.equal(txn?.extractedSuffix?.type, "card");
    assert.equal(txn?.extractedSuffix?.value, "9136");
    assert.equal(txn?.paymentChannel, "CREDIT_CARD");

    const res = resolveAccountForTransaction(txn!, userAccounts);
    assert.equal(res.status, "matched");
    assert.equal(res.matchedAccount?.id, "acc-hdfc-credit");
    assert.equal(res.isCardMatch, true);
  });

  test("Strict Card vs Bank Account distinction: A/c 4821 matches Savings Account, never Credit Card", () => {
    const sms = "A/c XX4821 debited by Rs. 350 on 24-Oct-26 for UPI payment to Zepto. Avail Bal: Rs 42,100. - HDFC Bank";
    const txn = parseUniversalSms(sms, "AD-HDFCBK");
    assert.ok(txn);
    assert.equal(txn?.extractedSuffix?.type, "bank_account");
    assert.equal(txn?.extractedSuffix?.value, "4821");

    const res = resolveAccountForTransaction(txn!, userAccounts);
    assert.equal(res.status, "matched");
    assert.equal(res.matchedAccount?.id, "acc-hdfc-savings");
    assert.equal(res.isAccountSuffixMatch, true);
  });

  test("Debit card charge with Card 1199 matches the linked HDFC Savings Account", () => {
    const sms = "Rs 1,200 spent on HDFC Bank Debit Card ending 1199 at Shell Fuel. Avail Bal in A/c is Rs 40,900";
    const txn = parseUniversalSms(sms, "AD-HDFCBK");
    assert.ok(txn);
    assert.equal(txn?.extractedSuffix?.type, "card");
    assert.equal(txn?.extractedSuffix?.value, "1199");

    const res = resolveAccountForTransaction(txn!, userAccounts);
    assert.equal(res.status, "matched");
    assert.equal(res.matchedAccount?.id, "acc-hdfc-savings");
  });

  test("Ambiguity Handling: Multiple SBI accounts without suffix does NOT guess", () => {
    const sms = "Rs 500 debited from your State Bank of India account for UPI payment to Uber";
    const txn = parseUniversalSms(sms, "VK-SBIINB");
    assert.ok(txn);

    const res = resolveAccountForTransaction(txn!, userAccounts);
    assert.equal(res.status, "ambiguous");
    assert.equal(res.matchedAccount, null);
    assert.equal(res.suggestedAccounts?.length, 2);
  });

  test("Safety: Never matches Cash accounts to bank SMS", () => {
    const sms = "Rs 200 debited from Cash account";
    const txn = parseUniversalSms(sms);
    if (txn) {
      const res = resolveAccountForTransaction(txn, userAccounts);
      assert.notEqual(res.matchedAccount?.type, "CASH");
    }
  });

  test("Standalone card issuer: OneCard matches directly by card suffix", () => {
    const sms = "Transaction of Rs 850 approved on your OneCard ending 5544 at Starbucks";
    const txn = parseUniversalSms(sms, "AD-ONECRD");
    assert.ok(txn);

    const res = resolveAccountForTransaction(txn!, userAccounts);
    assert.equal(res.status, "matched");
    assert.equal(res.matchedAccount?.id, "acc-onecard");
  });
});

describe("Universal Smart Auto Track — Transaction Safety & Rejection Filters", () => {
  test("Rejects OTP messages from being parsed as transactions", () => {
    const otp1 = "482910 is your OTP for transaction of Rs 1,500 at Flipkart on HDFC Bank Card ending 9136. Valid for 10 mins. Do not share.";
    const res1 = validateTransactionSafety(otp1);
    assert.equal(res1.isTransaction, false);
    assert.equal(res1.isOtp, true);
    assert.equal(parseUniversalSms(otp1), null);

    const otp2 = "Use OTP 193847 to authenticate login on your SBI account. Never share your OTP with anyone.";
    const res2 = validateTransactionSafety(otp2);
    assert.equal(res2.isTransaction, false);
    assert.equal(res2.isOtp, true);
    assert.equal(parseUniversalSms(otp2), null);
  });

  test("Rejects Promotional and Loan offers from being parsed as transactions", () => {
    const promo1 = "Congratulations! You are eligible for a pre-approved personal loan of Rs 5,00,000 from ICICI Bank with zero processing fee. Apply now!";
    const res1 = validateTransactionSafety(promo1);
    assert.equal(res1.isTransaction, false);
    assert.equal(res1.isPromotional, true);
    assert.equal(parseUniversalSms(promo1), null);

    const promo2 = "Special Festive Offer: Get flat 10% off on cards when you spend Rs 2,000 or more.";
    const res2 = validateTransactionSafety(promo2);
    assert.equal(res2.isTransaction, false);
    assert.equal(res2.isPromotional, true);
    assert.equal(parseUniversalSms(promo2), null);
  });

  test("Rejects Failed and Declined payments from being recorded as expenses", () => {
    const failed1 = "Your payment of Rs 450 to Zomato using Axis Bank A/c XX1234 has DECLINED due to insufficient funds.";
    const res1 = validateTransactionSafety(failed1);
    assert.equal(res1.isTransaction, false);
    assert.equal(res1.isFailedOrCancelled, true);
    assert.equal(parseUniversalSms(failed1), null);

    const failed2 = "Transaction of Rs 1,200 on card ending 9136 failed. Please retry after some time.";
    const res2 = validateTransactionSafety(failed2);
    assert.equal(res2.isTransaction, false);
    assert.equal(res2.isFailedOrCancelled, true);
    assert.equal(parseUniversalSms(failed2), null);
  });

  test("Rejects Balance Inquiries from being recorded as transactions", () => {
    const balOnly = "Your available balance for A/c XX4821 is Rs 45,210.35 as of 24-Oct-26. - HDFC Bank";
    const res = validateTransactionSafety(balOnly);
    assert.equal(res.isTransaction, false);
    assert.equal(res.isBalanceInquiryOnly, true);
    assert.equal(parseUniversalSms(balOnly), null);
  });

  test("Rejects Mandate / AutoPay registration notifications (non-financial events)", () => {
    const mandate = "e-mandate of Rs 500 created on account ending 4821 for Netflix. SI registered successfully.";
    const res = validateTransactionSafety(mandate);
    assert.equal(res.isTransaction, false);
    assert.equal(res.isMandateSetupOnly, true);
    assert.equal(parseUniversalSms(mandate), null);
  });
});

describe("Universal Smart Auto Track — Payment Channels & Real-World Indian Bank SMS", () => {
  test("UPI Payment via VPA / P2M", () => {
    const sms = "Dear SBI User, A/c 7720 debited by Rs. 240.00 on 24Oct26 transfer to chai@okaxis Ref No 429810482019. Bal: Rs 14,200.00";
    const txn = parseUniversalSms(sms, "VM-SBIINB");
    assert.ok(txn);
    assert.equal(txn?.amount, 240);
    assert.equal(txn?.direction, "EXPENSE");
    assert.equal(txn?.paymentChannel, "UPI");
    assert.equal(txn?.extractedSuffix?.value, "7720");
    assert.equal(txn?.referenceId, "429810482019");
    assert.equal(txn?.availableBalance, 14200);
  });

  test("ATM Cash Withdrawal", () => {
    const sms = "Rs. 2,000.00 withdrawn from ATM using card ending 4821 on 24-Oct-26. Avail Bal Rs. 38,100.00. - Bank of Baroda";
    const txn = parseUniversalSms(sms, "VK-BOBTXN");
    assert.ok(txn);
    assert.equal(txn?.amount, 2000);
    assert.equal(txn?.direction, "EXPENSE");
    assert.equal(txn?.paymentChannel, "ATM");
    assert.equal(txn?.availableBalance, 38100);
  });

  test("AutoPay / NACH Debit", () => {
    const sms = "A/c XX4821 debited by Rs. 649 for AutoPay mandate towards Netflix on 24-Oct-26. Avl Bal: Rs 37,451. - Kotak Bank";
    const txn = parseUniversalSms(sms, "BZ-KOTAKB");
    assert.ok(txn);
    assert.equal(txn?.amount, 649);
    assert.equal(txn?.paymentChannel, "AUTOPAY");
    assert.ok(txn?.merchant.toLowerCase().includes("netflix"));
  });

  test("Loan EMI Debit", () => {
    const sms = "Your Home Loan EMI of Rs 18,500 debited from A/c XX4821 on 10-Oct-26. Avail Bal: Rs 22,000. - ICICI Bank";
    const txn = parseUniversalSms(sms, "VM-ICICIB");
    assert.ok(txn);
    assert.equal(txn?.amount, 18500);
    assert.equal(txn?.paymentChannel, "LOAN_EMI");
    assert.equal(txn?.direction, "EXPENSE");
  });

  test("IMPS / NEFT Transfer", () => {
    const sms = "Rs 15,000 debited from A/c XX4821 on 24-Oct-26 via IMPS Ref: 429810129482. Avail Bal Rs 12,000. - Axis Bank";
    const txn = parseUniversalSms(sms, "VK-AXISBK");
    assert.ok(txn);
    assert.equal(txn?.amount, 15000);
    assert.equal(txn?.paymentChannel, "IMPS");
    assert.equal(txn?.referenceId, "429810129482");
  });

  test("Salary Credit (Income)", () => {
    const sms = "Your A/c XX4821 is credited with Rs 85,000.00 on 24-Oct-26 as Salary from TECH CORP. Avl Bal: Rs 97,000. - HDFC Bank";
    const txn = parseUniversalSms(sms, "AD-HDFCBK");
    assert.ok(txn);
    assert.equal(txn?.amount, 85000);
    assert.equal(txn?.direction, "INCOME");
    assert.equal(txn?.merchant, "Salary");
    assert.equal(txn?.availableBalance, 97000);
  });
});

describe("Universal Smart Auto Track — Deduplication & Lifecycle Updates", () => {
  test("Detects exact reference duplicate", () => {
    const candidate: NormalizedTransaction = {
      id: "txn-1",
      amount: 450,
      currency: "INR",
      direction: "EXPENSE",
      paymentChannel: "UPI",
      lifecycleStatus: "COMPLETED",
      merchant: "Swiggy",
      cleanMerchant: "Swiggy",
      timestamp: Date.now(),
      rawText: "UPI payment to Swiggy",
      confidence: 1.0,
      referenceId: "UPI482910482019",
    };

    const existing = [
      {
        id: "existing-1",
        amount: 450,
        description: "Swiggy",
        referenceId: "UPI482910482019",
        createdAt: new Date().toISOString(),
      },
    ];

    const dup = isDuplicateTransaction(candidate, existing);
    assert.equal(dup.isDuplicate, true);
    assert.ok(dup.reason?.includes("exact reference ID"));
  });

  test("Detects near-time cross-notification duplicate within 90 seconds", () => {
    const now = Date.now();
    const candidate: NormalizedTransaction = {
      id: "txn-2",
      amount: 120,
      currency: "INR",
      direction: "EXPENSE",
      paymentChannel: "UPI",
      lifecycleStatus: "COMPLETED",
      merchant: "Chai Point",
      cleanMerchant: "Chai Point",
      timestamp: now,
      rawText: "A/c debited by Rs 120 to Chai Point",
      confidence: 0.95,
    };

    // Google Pay notification arrived 15 seconds earlier
    const existing = [
      {
        id: "existing-gpay",
        amount: 120,
        description: "Paid to Chai Point",
        createdAt: new Date(now - 15000).toISOString(),
      },
    ];

    const dup = isDuplicateTransaction(candidate, existing, 90_000);
    assert.equal(dup.isDuplicate, true);
    assert.ok(dup.reason?.includes("within 15s"));
  });

  test("Does NOT flag different amounts or transactions outside the time window", () => {
    const now = Date.now();
    const candidate: NormalizedTransaction = {
      id: "txn-3",
      amount: 120,
      currency: "INR",
      direction: "EXPENSE",
      paymentChannel: "UPI",
      lifecycleStatus: "COMPLETED",
      merchant: "Chai Point",
      cleanMerchant: "Chai Point",
      timestamp: now,
      rawText: "A/c debited by Rs 120 to Chai Point",
      confidence: 0.95,
    };

    // Different amount
    const existingDiffAmt = [
      {
        id: "existing-diff",
        amount: 250,
        description: "Chai Point",
        createdAt: new Date(now - 10000).toISOString(),
      },
    ];
    assert.equal(isDuplicateTransaction(candidate, existingDiffAmt).isDuplicate, false);

    // Old transaction (3 hours ago)
    const existingOld = [
      {
        id: "existing-old",
        amount: 120,
        description: "Chai Point",
        createdAt: new Date(now - 3 * 3600 * 1000).toISOString(),
      },
    ];
    assert.equal(isDuplicateTransaction(candidate, existingOld).isDuplicate, false);
  });

  test("Matches refunds with original transaction within 30 days", () => {
    const refundTxn: NormalizedTransaction = {
      id: "refund-1",
      amount: 450,
      currency: "INR",
      direction: "REFUND",
      paymentChannel: "UPI",
      lifecycleStatus: "REVERSED",
      merchant: "Swiggy Refund",
      cleanMerchant: "Swiggy",
      timestamp: Date.now(),
      rawText: "Refund of Rs 450 for Swiggy",
      confidence: 0.9,
    };

    const existing = [
      {
        id: "orig-swiggy-txn",
        amount: 450,
        description: "Swiggy food order",
        createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      },
      {
        id: "other-txn",
        amount: 1000,
        description: "DMart grocery",
        createdAt: new Date().toISOString(),
      },
    ];

    const matched = findOriginalTransactionForRefund(refundTxn, existing);
    assert.ok(matched);
    assert.equal(matched?.id, "orig-swiggy-txn");
  });

  test("Resolves both fromAccount and toAccount for inter-account transfer", () => {
    const userAccounts: AccountMatchCandidate[] = [
      {
        id: "acc-bom-8572",
        name: "Bank of Maharashtra",
        type: "BANK",
        accountNumberLast4: "8572",
        isActive: true,
      },
      {
        id: "acc-kotak-1234",
        name: "Kotak Mahindra Bank",
        type: "BANK",
        accountNumberLast4: "1234",
        isActive: true,
      },
    ];

    const transferSms = "Rs 5,000 transferred from Bank of Maharashtra a/c X8572 to Kotak Bank a/c X1234. Avail Bal: Rs 5,450.00.";
    const txn = parseUniversalSms(transferSms);
    assert.ok(txn);
    assert.equal(txn?.direction, "TRANSFER");

    const result = resolveTransferAccounts(txn!, userAccounts);
    assert.equal(result.status, "complete");
    assert.equal(result.fromAccount?.id, "acc-bom-8572");
    assert.equal(result.toAccount?.id, "acc-kotak-1234");
  });
});

