package com.sahilmulla.pocketflow.quickadd

import java.util.regex.Pattern

data class UpiPaymentInfo(
    val amount: Double,
    val merchant: String,
    val reference: String?,
    val timestamp: Long,
    val packageName: String,
    val bankName: String? = null,
    val accountSuffix: String? = null,
    val direction: String = "EXPENSE", // "EXPENSE", "INCOME", "REFUND", "TRANSFER"
    val dateText: String? = null,
    val status: String = "POSTED",
    val availableBalance: Double? = null,
    val toBankName: String? = null,
    val toAccountSuffix: String? = null
)

object UpiNotificationParser {

    // Supported UPI, Payment, App Store, and Banking applications
    val SUPPORTED_PACKAGES = setOf(
        "com.google.android.apps.nbu.paisa.user", // Google Pay (India)
        "com.google.android.apps.walletnfcrel",  // Google Wallet / Pay
        "com.android.vending",                   // Google Play Store
        "com.phonepe.app",                       // PhonePe
        "net.one97.paytm",                       // Paytm
        "in.org.npci.upiapp",                    // BHIM
        "com.dreamplug.androidapp",              // CRED
        "in.amazon.mShop.android.shopping",      // Amazon Pay (India)
        "com.amazon.mShop.android.shopping",     // Amazon Pay (Global)
        "com.navi.finance",                      // Navi UPI
        "money.super",                           // Super.money
        "com.fampay.in",                         // FamPay
        "com.snapwork.hdfc",                     // HDFC Bank Mobile
        "com.csam.icici.bank.imobile",           // ICICI iMobile
        "com.sbi.lotusintouch",                  // SBI Yono
        "com.sbi.upi",                           // SBI BHIM Pay
        "com.axis.mobile",                       // Axis Mobile
        "com.axis.open",                         // Axis Open
        "com.msf.kbank.mobile",                  // Kotak Mobile
        "com.kotak.kotakbank",                   // Kotak 811
        "com.bankofbaroda.mconnect",             // bob World
        "com.canarabank.mobility",               // Canara ai1
        "com.pnb.one",                           // PNB One
        "com.indusind.indusmobile",              // IndusMobile
        "com.fedmobile",                         // FedMobile
        "com.infrasofttech.uboi",                // Union Bank of India (Vyom)
        "com.boimobile",                         // Bank of India
        "com.infrasoft.indianbank",              // Indian Bank IndOASIS
        "com.yesbank",                           // YES Bank iris
        "com.idfcfirstbank.optimus",             // IDFC FIRST Bank
        "com.myairtelapp",                       // Airtel Payments Bank
        "com.jio.myjio",                         // Jio Payments Bank
        "com.mobikwik_new",                      // MobiKwik
        "money.jupiter",                         // Jupiter
        "money.fi"                               // Fi Money
    )

    // Supported SMS notification applications (Google Messages, Samsung Messages, OEM MMS apps)
    val SUPPORTED_SMS_PACKAGES = setOf(
        "com.google.android.apps.messaging", // Google Messages / Android Messages
        "com.samsung.android.messaging",    // Samsung Messages
        "com.android.mms",                  // AOSP / Xiaomi MIUI MMS
        "com.xiaomi.mms",                   // Xiaomi Messages
        "com.oneplus.mms",                  // OnePlus Messages
        "com.coloros.mms",                  // ColorOS Messages
        "com.oppo.mms",                     // OPPO Messages
        "com.vivo.mms",                     // Vivo Messages
        "com.nothing.mms",                  // Nothing OS Messages
        "com.microsoft.android.smsorganizer",// Microsoft SMS Organizer
        "com.truecaller"                    // Truecaller
    )

    // Rejection keywords: Failed / Cancelled
    private val FAILED_PATTERNS = listOf(
        Pattern.compile("\\b(failed|decline|declined|unsuccessful|cancelled|canceled|timed?\\s*out)\\b", Pattern.CASE_INSENSITIVE)
    )

    // Rejection keywords: Collect requests / Reminders / Promos
    private val REQUEST_PATTERNS = listOf(
        Pattern.compile("\\b(collect\\s+request|payment\\s+requested|money\\s+requested|request\\s+from|mandate\\s+created|reminder\\s*:|reminder\\b)", Pattern.CASE_INSENSITIVE),
        Pattern.compile("\\b(apply\\s+now|pre[- ]approved|personal\\s+loan|low\\s+emi|interest\\s+rate)\\b", Pattern.CASE_INSENSITIVE)
    )

    // Rejection keywords: Authentication / OTP messages
    private val OTP_PATTERNS = listOf(
        Pattern.compile("\\b(?:is\\s+(?:your\\s+)?otp|otp\\s+(?:for|is)|use\\s+otp|enter\\s+otp|otp\\s*[:#-]?\\s*\\d+|your\\s+otp\\s+for|verification\\s+code|login\\s+code|one\\s*time\\s*password)\\b", Pattern.CASE_INSENSITIVE)
    )

    // Refund / Reversal / Cashback keywords
    private val REFUND_PATTERNS = listOf(
        Pattern.compile("\\b(?:refund(?:ed)?|cashback|reversal|reversed|credited\\s+back|returned|credited\\s+as\\s+refund|money\\s+refunded)\\b", Pattern.CASE_INSENSITIVE)
    )

    // Transfer between own accounts keywords
    private val TRANSFER_PATTERNS = listOf(
        Pattern.compile("\\b(?:transfer(?:red)?\\s+(?:from\\s+([A-Za-z0-9\\s&.-]+?)\\s+to\\s+([A-Za-z0-9\\s&.-]+?)|to\\s+own\\s+a/?c|between\\s+accounts))", Pattern.CASE_INSENSITIVE),
        Pattern.compile("\\b(?:self\\s+transfer|own\\s+a/?c\\s+transfer|transfer\\s+to\\s+own\\s+account|transferred\\s+to\\s+own\\s+account)\\b", Pattern.CASE_INSENSITIVE),
        Pattern.compile("\\b(?:sent\\s+(?:rs\\.?|inr|₹)?\\s*[\\d,]+(?:\\.\\d{1,2})?\\s+from\\s+([A-Za-z0-9\\s&.-]+?)\\s+to\\s+([A-Za-z0-9\\s&.-]+?)(?:\\s+on|\\s+via|\\s+dated|\\s+ref|\\.|,|$))", Pattern.CASE_INSENSITIVE)
    )

    // Incoming credit keywords (used when not a refund or debit)
    private val CREDIT_PATTERNS = listOf(
        Pattern.compile("\\b(?:credited\\s+to|credited\\s+with|credited\\s+in|has\\s+been\\s+credited|is\\s+credited|credited|amount\\s+credited|money\\s+received|received\\s+₹|received\\s+rs|received\\s+in|received\\s+into|received\\s+from|deposited\\s+(?:in|into|to)|deposited|salary\\s+credited|salary|added\\s+to\\s+(?:your\\s+)?(?:account|wallet))\\b", Pattern.CASE_INSENSITIVE)
    )

    // Confirmation of outgoing debit
    private val DEBIT_PATTERNS = listOf(
        Pattern.compile("\\b(debited\\s+by|debited\\s+for|debited\\s+with|debited\\s+from|debited|has\\s+been\\s+debited|is\\s+debited|a/c\\s+.*debited|acct?\\s+.*debited|account\\s+.*debited|paid|spent|sent|transferred|transfer\\s+to|payment\\s+of|purchase|purchased|order\\s+of|order\\s+successful|was\\s+successful|UPI\\s+payment\\s+to|withdrawn|withdrew|charged|billed|deducted)\\b", Pattern.CASE_INSENSITIVE)
    )

    // Available balance extraction: e.g. "Avail Bal: Rs 15,400.50", "Avl Bal Rs 25,000", "Available balance in A/c ... is Rs 15,400"
    private val BALANCE_PATTERNS = listOf(
        Pattern.compile("\\b(?:bal(?:ance)?|avl(?:\\.?)?\\s*bal(?:ance)?|avail(?:able)?\\s*bal(?:ance)?)\\s*(?:is|:)?\\s*(?:rs\\.?|inr|₹)?\\s*([\\d,]+(?:\\.\\d{1,2})?)", Pattern.CASE_INSENSITIVE),
        Pattern.compile("(?:avail(?:able)?|avl\\.?)?\\s*balance\\s+(?:in\\s+a/?c\\s+[^\\s]+\\s+)?is\\s*(?:rs\\.?|inr|₹)?\\s*([\\d,]+(?:\\.\\d{1,2})?)", Pattern.CASE_INSENSITIVE),
        Pattern.compile("\\b(?:total\\s+bal(?:ance)?)\\s*(?:is|:)?\\s*(?:rs\\.?|inr|₹)?\\s*([\\d,]+(?:\\.\\d{1,2})?)", Pattern.CASE_INSENSITIVE)
    )

    // Amount extraction: e.g. "Rs. 1.00", "Rs 1,250", "₹1,200.50", "INR 350", "debited by Rs. 1.00", "debited by 500"
    private val AMOUNT_PATTERNS = listOf(
        Pattern.compile("(?:rs\\.?|inr|₹)\\s*([\\d,]+(?:\\.\\d{1,2})?)(?:\\s*\\/\\-)?", Pattern.CASE_INSENSITIVE),
        Pattern.compile("([\\d,]+(?:\\.\\d{1,2})?)\\s*(?:rs\\.?|inr|₹)(?:\\s*\\/\\-)?", Pattern.CASE_INSENSITIVE),
        Pattern.compile("\\b(?:debited|paid|spent|sent|transferred)(?:\\s+(?:by|for|with|of))?\\s*(?:rs\\.?|inr|₹)?\\s*([\\d,]+(?:\\.\\d{1,2})?)", Pattern.CASE_INSENSITIVE),
        Pattern.compile("\\b(?:order\\s+of|payment\\s+of)\\s*(?:rs\\.?|inr|₹)?\\s*([\\d,]+(?:\\.\\d{1,2})?)", Pattern.CASE_INSENSITIVE)
    )

    // Stop words that terminate merchant/recipient extraction
    private const val STOP_WORDS = "rrn|ref|no\\.?|reference|upi|on|dated|dt\\.?|via|using|through|towards|from|at|with|txn|txnid|txn#|transaction|bal|avl\\.?|avail\\.?|available|balance|limit|call|help|if\\s+not|not\\s+you|forward|toll\\s*free|-bank|-sbi|-hdfc|-icici|-axis|-kotak|bank\\s+of|was\\s+successful|is\\s+successful|successful|completed|using\\s+upi|using\\s+bank|debited|credited|\\.|\\n|\\$|;|-"

    // Terminal boundary for merchant names: stop words, parentheses, or period+space
    private const val MERCHANT_BOUNDARY = "(?:[(.,;]?\\s+(?:$STOP_WORDS)|\\s*\\(|\\.\\s+|[.,;]?$)"

    // Merchant / Recipient extraction patterns (ordered by specificity)
    private val MERCHANT_PATTERNS = listOf(
        // 1. Bank of Maharashtra & UPI explicit: "for UPI payment to RAEESA MULLA on..."
        Pattern.compile("\\b(?:for\\s+)?UPI\\s+payment\\s+to\\s+([A-Za-z0-9\\s&'@._-]{2,40}?)$MERCHANT_BOUNDARY", Pattern.CASE_INSENSITIVE),
        // 2. Beneficiary / Info tag / Bank slash path: "Beneficiary: AMAZON", "Info: UPI/Apollo Pharmacy", "towards UPI/P2M/Zepto/HDFC"
        Pattern.compile("\\bbeneficiary\\s*[:#-]?\\s*([A-Za-z0-9\\s&'@._-]{2,40}?)$MERCHANT_BOUNDARY", Pattern.CASE_INSENSITIVE),
        Pattern.compile("\\b(?:Info\\s*:\\s*|(?:towards|for)\\s+)?UPI[-/](?:P2M[-/]|P2P[-/])?([A-Za-z0-9\\s&'@._-]{2,30}?)(?:[-/][A-Za-z0-9@._-]+)*$MERCHANT_BOUNDARY", Pattern.CASE_INSENSITIVE),
        // 3. Paid to / sent to / transfer to / credited to
        Pattern.compile("\\b(?:paid\\s+to|sent\\s+to|transfer(?:red)?\\s+to|by\\s+transfer\\s+to|credited\\s+to)\\s+([A-Za-z0-9\\s&'@._-]{2,40}?)$MERCHANT_BOUNDARY", Pattern.CASE_INSENSITIVE),
        // 4. "for UPI to CHAI POINT" or "towards UPI to SWIGGY"
        Pattern.compile("\\b(?:for|towards)\\s+UPI\\s+(?:payment\\s+)?to\\s+([A-Za-z0-9\\s&'@._-]{2,40}?)$MERCHANT_BOUNDARY", Pattern.CASE_INSENSITIVE),
        // 5. "at <Merchant>"
        Pattern.compile("\\b(?:at|in)\\s+([A-Za-z0-9\\s&'@._-]{2,40}?)$MERCHANT_BOUNDARY", Pattern.CASE_INSENSITIVE),
        // 6. "to VPA <handle>" or generic "to <Merchant>"
        Pattern.compile("\\bto\\s+(?:VPA\\s+)?([A-Za-z0-9\\s&'@._-]{2,40}?)$MERCHANT_BOUNDARY", Pattern.CASE_INSENSITIVE)
    )

    // Reference ID extraction: e.g. RRN: 628547285912, UTR: 432109876543, or UPI transaction ID: 412345678901
    private val REF_PATTERNS = listOf(
        Pattern.compile("(?:UPI\\s*(?:transaction\\s*id|txn\\s*id|ref\\s*no|reference|ref|rrn|id)|txn\\s*#|ref\\s*(?:no\\.?)?|rrn|utr)\\s*[:#-]?\\s*([A-Za-z0-9]{8,18})", Pattern.CASE_INSENSITIVE)
    )

    // Account suffix extraction: e.g. "A/c X8572", "account **1234", "a/c no. XXXXXXXX1234", "ending 1234", "XX4321"
    private val ACCOUNT_SUFFIX_PATTERNS = listOf(
        Pattern.compile("\\b(?:a/c(?:\\s+no\\.?)?|acct?(?:\\s+no\\.?)?|account(?:\\s+no\\.?)?)\\s*(?:ending\\s+(?:with|in)?\\s*)?[x*#\\s.]*([0-9]{3,6})\\b", Pattern.CASE_INSENSITIVE),
        Pattern.compile("\\b(?:ending\\s+(?:with|in)?\\s*)[x*#\\s.]*([0-9]{3,6})\\b", Pattern.CASE_INSENSITIVE),
        Pattern.compile("\\b[x*#]{2,}([0-9]{3,6})\\b", Pattern.CASE_INSENSITIVE)
    )

    // Bank signature / text patterns: e.g. "-Bank of Maharashtra", "- HDFC Bank", "-SBI", "Axis Bank A/c"
    private val BANK_SIGNATURE_PATTERNS = listOf(
        Pattern.compile("-\\s*(Bank of [A-Za-z]+|[A-Za-z]+(?:\\s+FIRST)?\\s+Bank|State Bank of India|SBI|HDFC|ICICI|Axis|Kotak|PNB|BOB|Canara|Union Bank|IndusInd|Federal Bank|IDFC|Yes Bank)\\b", Pattern.CASE_INSENSITIVE),
        Pattern.compile("\\b(Bank of Maharashtra|State Bank of India|HDFC Bank|ICICI Bank|Axis Bank|Kotak Mahindra Bank|Punjab National Bank|Bank of Baroda|Canara Bank|Union Bank of India|IDFC FIRST Bank|IndusInd Bank|Federal Bank|Yes Bank)\\b", Pattern.CASE_INSENSITIVE)
    )

    // Date extraction: e.g. "11-Oct-26", "11-10-2026", "11/10/26"
    private val DATE_PATTERNS = listOf(
        Pattern.compile("\\b(?:on\\s+|dated\\s+|dt\\.?\\s*)?(\\d{1,2}[-/](?:[A-Za-z]{3}|\\d{1,2})[-/]\\d{2,4})\\b", Pattern.CASE_INSENSITIVE)
    )

    val BANK_PACKAGE_MAP = mapOf(
        "com.snapwork.hdfc" to "HDFC Bank",
        "com.csam.icici.bank.imobile" to "ICICI Bank",
        "com.sbi.lotusintouch" to "SBI",
        "com.sbi.upi" to "SBI",
        "com.axis.mobile" to "Axis Bank",
        "com.axis.open" to "Axis Bank",
        "com.msf.kbank.mobile" to "Kotak Mahindra Bank",
        "com.kotak.kotakbank" to "Kotak Mahindra Bank",
        "com.bankofbaroda.mconnect" to "Bank of Baroda",
        "com.canarabank.mobility" to "Canara Bank",
        "com.pnb.one" to "Punjab National Bank",
        "com.indusind.indusmobile" to "IndusInd Bank",
        "com.fedmobile" to "Federal Bank",
        "com.infrasofttech.uboi" to "Union Bank of India",
        "com.boimobile" to "Bank of India",
        "com.infrasoft.indianbank" to "Indian Bank",
        "com.yesbank" to "Yes Bank",
        "com.idfcfirstbank.optimus" to "IDFC FIRST Bank"
    )

    fun canonicalBankName(raw: String?): String? {
        if (raw.isNullOrBlank()) return null
        val trimmed = raw.trim()
        val lower = trimmed.lowercase()
        return when {
            lower.contains("maharashtra") || lower.contains("mahabk") || lower.contains("bom") -> "Bank of Maharashtra"
            lower.contains("sbi") || lower.contains("state bank") -> "SBI"
            lower.contains("hdfc") -> "HDFC Bank"
            lower.contains("icici") -> "ICICI Bank"
            lower.contains("axis") -> "Axis Bank"
            lower.contains("kotak") -> "Kotak Mahindra Bank"
            lower.contains("pnb") || lower.contains("punjab national") -> "Punjab National Bank"
            lower.contains("baroda") || lower.contains("bob") -> "Bank of Baroda"
            lower.contains("canara") -> "Canara Bank"
            lower.contains("union") || lower.contains("uboi") -> "Union Bank of India"
            lower.contains("idfc") -> "IDFC FIRST Bank"
            lower.contains("indusind") -> "IndusInd Bank"
            lower.contains("federal") -> "Federal Bank"
            lower.contains("yes") -> "Yes Bank"
            lower.contains("boi") || lower.contains("bank of india") -> "Bank of India"
            lower.contains("indian bank") -> "Indian Bank"
            else -> trimmed
        }
    }

    fun isSupportedPackage(packageName: String): Boolean {
        return SUPPORTED_PACKAGES.contains(packageName) ||
                isSmsPackage(packageName)
    }

    fun isSmsPackage(packageName: String): Boolean {
        return SUPPORTED_SMS_PACKAGES.contains(packageName) ||
                packageName.endsWith(".mms") ||
                packageName.endsWith(".messaging") ||
                packageName.endsWith(".message")
    }

    fun parse(
        packageName: String,
        title: String,
        text: String,
        bigText: String?,
        subText: String? = null,
        ticker: String? = null,
        postTime: Long
    ): UpiPaymentInfo? {
        val pieces = mutableListOf<String>()
        if (title.isNotBlank()) pieces.add(title)
        if (text.isNotBlank()) pieces.add(text)
        if (!bigText.isNullOrBlank() && bigText != text) pieces.add(bigText)
        if (!subText.isNullOrBlank() && subText != title && subText != text) pieces.add(subText)
        if (!ticker.isNullOrBlank() && ticker != text && ticker != bigText) pieces.add(ticker)
        val combined = pieces.joinToString(" ").trim()
        if (combined.isEmpty()) return null

        // 1. Rejection: Failed / Cancelled
        for (pattern in FAILED_PATTERNS) {
            if (pattern.matcher(combined).find()) {
                return null
            }
        }

        // 2. Rejection: Collect requests / Reminders / Loans
        for (pattern in REQUEST_PATTERNS) {
            if (pattern.matcher(combined).find()) {
                return null
            }
        }

        // 3. Rejection: Authentication OTPs
        for (pattern in OTP_PATTERNS) {
            if (pattern.matcher(combined).find()) {
                return null
            }
        }

        // 4. Direction Classification: REFUND, TRANSFER, EXPENSE, INCOME
        var direction = "EXPENSE"
        var isRefund = false
        for (pattern in REFUND_PATTERNS) {
            if (pattern.matcher(combined).find()) {
                isRefund = true
                break
            }
        }

        var isTransfer = false
        var transferFromBank: String? = null
        var transferToBank: String? = null
        var transferFromSuffix: String? = null
        var transferToSuffix: String? = null

        if (!isRefund) {
            for (pattern in TRANSFER_PATTERNS) {
                val matcher = pattern.matcher(combined)
                if (matcher.find()) {
                    isTransfer = true
                    if (matcher.groupCount() >= 2) {
                        val g1 = matcher.group(1)?.trim()
                        val g2 = matcher.group(2)?.trim()
                        if (!g1.isNullOrBlank()) transferFromBank = canonicalBankName(g1)
                        if (!g2.isNullOrBlank()) transferToBank = canonicalBankName(g2)
                    }
                    break
                }
            }

            // Also detect transfer if message contains "from <Bank> ... to <Bank>"
            val fromToRegex = Regex("(?i)\\b(?:from|in)\\s+([a-zA-Z\\s]{3,25}?(?:bank)?)\\s+.*\\bto\\s+([a-zA-Z\\s]{3,25}?(?:bank)?)\\b")
            val ftMatch = fromToRegex.find(combined)
            if (ftMatch != null) {
                val b1 = canonicalBankName(ftMatch.groupValues[1])
                val b2 = canonicalBankName(ftMatch.groupValues[2])
                if (b1 != null && b2 != null && b1 != b2) {
                    isTransfer = true
                    transferFromBank = b1
                    transferToBank = b2
                }
            }
        }

        var isDebit = false
        for (pattern in DEBIT_PATTERNS) {
            if (pattern.matcher(combined).find()) {
                isDebit = true
                break
            }
        }

        var isCredit = false
        for (pattern in CREDIT_PATTERNS) {
            if (pattern.matcher(combined).find()) {
                isCredit = true
                break
            }
        }

        if (isRefund) {
            direction = "REFUND"
        } else if (isTransfer) {
            direction = "TRANSFER"
        } else if (isDebit || packageName == "com.android.vending") {
            direction = "EXPENSE"
        } else if (isCredit) {
            direction = "INCOME"
        } else {
            // Neither debit, credit, refund, nor transfer
            return null
        }

        // 5. Extract Amount
        var amount: Double? = null
        for (pattern in AMOUNT_PATTERNS) {
            val matcher = pattern.matcher(combined)
            if (matcher.find()) {
                val raw = matcher.group(1)?.replace(",", "")?.trim()
                val parsed = raw?.toDoubleOrNull()
                if (parsed != null && parsed > 0.0) {
                    amount = parsed
                    break
                }
            }
        }
        if (amount == null) return null

        // 6. Extract Available Balance (if present in bank SMS)
        var availableBalance: Double? = null
        for (pattern in BALANCE_PATTERNS) {
            val matcher = pattern.matcher(combined)
            if (matcher.find()) {
                val raw = matcher.group(1)?.replace(",", "")?.trim()
                val parsed = raw?.toDoubleOrNull()
                if (parsed != null && parsed >= 0.0) {
                    availableBalance = parsed
                    break
                }
            }
        }

        // 7. Extract Merchant / Recipient
        var merchant = ""
        val isSms = isSmsPackage(packageName)

        if (direction == "TRANSFER") {
            merchant = if (!transferToBank.isNullOrBlank()) "Transfer to $transferToBank" else "Account Transfer"
        } else if (direction == "REFUND") {
            // Try to identify which service refunded (Swiggy, Amazon, Zomato, Uber, etc.)
            val refundMerchantRegex = Regex("(?i)\\b(?:from|for|at)\\s+([A-Za-z0-9\\s&'@._-]{2,30}?)(?:\\s+order|\\s+txn|\\s+dated|\\s+via|\\s+a/c|\\s+account|\\.|,|$MERCHANT_BOUNDARY)")
            val refMatch = refundMerchantRegex.find(combined)
            val cand = refMatch?.groupValues?.getOrNull(1)?.trim() ?: ""
            val cleaned = sanitizeMerchantName(cand)
            if (cleaned.isNotBlank() && cleaned.length >= 2 && !cleaned.contains("bank", ignoreCase = true)) {
                merchant = "$cleaned Refund"
            } else {
                merchant = "Refund"
            }
        } else if (direction == "INCOME") {
            if (combined.contains("salary", ignoreCase = true)) {
                merchant = "Salary"
            } else {
                for (pattern in MERCHANT_PATTERNS) {
                    val matcher = pattern.matcher(combined)
                    if (matcher.find()) {
                        val cand = matcher.group(1)?.trim() ?: ""
                        val cleaned = sanitizeMerchantName(cand)
                        if (cleaned.isNotEmpty() && cleaned.length >= 2) {
                            merchant = cleaned
                            break
                        }
                    }
                }
                if (merchant.isBlank()) merchant = "Income"
            }
        } else {
            // EXPENSE
            for (pattern in MERCHANT_PATTERNS) {
                val matcher = pattern.matcher(combined)
                if (matcher.find()) {
                    val cand = matcher.group(1)?.trim() ?: ""
                    val cleaned = sanitizeMerchantName(cand)
                    if (cleaned.isNotEmpty() && cleaned.length >= 2) {
                        merchant = cleaned
                        break
                    }
                }
            }

            if (merchant.isEmpty()) {
                if (packageName == "com.android.vending") {
                    merchant = "Google Play"
                } else if (!isSms) {
                    val cleanedTitle = sanitizeMerchantName(title)
                    if (cleanedTitle.isNotEmpty() && cleanedTitle.length >= 2 &&
                        !cleanedTitle.equals("Google Pay", true) &&
                        !cleanedTitle.equals("PhonePe", true) &&
                        !cleanedTitle.equals("Paytm", true) &&
                        !cleanedTitle.equals("CRED", true)
                    ) {
                        merchant = cleanedTitle
                    } else {
                        merchant = "UPI Merchant"
                    }
                } else {
                    return null
                }
            }
        }

        // 8. Extract Reference ID / RRN / UTR (optional, for persistent deduplication)
        var reference: String? = null
        for (pattern in REF_PATTERNS) {
            val matcher = pattern.matcher(combined)
            if (matcher.find()) {
                reference = matcher.group(1)?.trim()
                break
            }
        }

        // 9. Extract Account Suffix (e.g. 8572 from "A/c X8572")
        var accountSuffix: String? = transferFromSuffix
        if (accountSuffix.isNullOrBlank()) {
            for (pattern in ACCOUNT_SUFFIX_PATTERNS) {
                val matcher = pattern.matcher(combined)
                if (matcher.find()) {
                    accountSuffix = matcher.group(1)?.trim()
                    if (!accountSuffix.isNullOrEmpty()) break
                }
            }
        }

        // 10. Extract Bank Name
        var bankName: String? = transferFromBank
        if (bankName.isNullOrBlank()) {
            // (a) From explicit bank signature / text in message
            for (pattern in BANK_SIGNATURE_PATTERNS) {
                val matcher = pattern.matcher(combined)
                if (matcher.find()) {
                    val matched = matcher.group(1)?.trim()
                    bankName = canonicalBankName(matched)
                    if (bankName != null) break
                }
            }

            // (b) From SMS sender header / title (e.g. VK-MAHABK, BP-SBIINB)
            if (bankName == null && isSms) {
                val senderBank = canonicalBankName(title)
                if (senderBank != null && senderBank != title.trim()) {
                    bankName = senderBank
                }
            }

            // (c) From dedicated banking package name (NOT UPI apps like GPay/PhonePe)
            if (bankName == null && !isSms) {
                bankName = BANK_PACKAGE_MAP[packageName]
            }
        }

        // 11. Extract Date when available
        var dateText: String? = null
        for (pattern in DATE_PATTERNS) {
            val matcher = pattern.matcher(combined)
            if (matcher.find()) {
                dateText = matcher.group(1)?.trim()
                break
            }
        }

        val status = if (Regex("(?i)\\b(pending|processing)\\b").containsMatchIn(combined)) "PENDING" else "POSTED"

        return UpiPaymentInfo(
            amount = amount,
            merchant = merchant,
            reference = reference,
            timestamp = postTime,
            packageName = packageName,
            bankName = bankName,
            accountSuffix = accountSuffix,
            direction = direction,
            dateText = dateText,
            status = status,
            availableBalance = availableBalance,
            toBankName = transferToBank,
            toAccountSuffix = transferToSuffix
        )
    }

    fun sanitizeMerchantName(raw: String): String {
        var clean = raw.trim()
        clean = clean.replace(Regex("(?i)\\bupi\\b"), "").trim()
        // Strip trailing and leading punctuation
        clean = clean.replace(Regex("^[.,:;!?(]+"), "").trim()
        clean = clean.replace(Regex("[.,:;!?(]+$"), "").trim()

        // If it's a VPA (e.g. swiggy@icici, netflix.india@hdfcbank), extract the handle before @
        if (clean.contains("@") && !clean.contains(" ")) {
            val handle = clean.substringBefore("@")
            val parts = handle.split(".", "_", "-").filter { it.isNotBlank() && !it.matches(Regex("\\d+")) }
            if (parts.isNotEmpty()) {
                clean = parts.joinToString(" ")
            } else {
                clean = handle
            }
        }

        // Strip trailing sentence continuations like ". Debited from" or "credited to"
        clean = clean.replace(Regex("(?i)\\.?\\s*(?:debited|credited|paid).*$"), "").trim()
        // Strip generic prefixes/suffixes
        clean = clean.replace(Regex("(?i)^(vpa|upi|to|at)\\s+"), "").trim()
        clean = clean.replace(Regex("(?i)\\s+(vpa|upi|bank|account|a/c|was\\s+successful|is\\s+successful|successful)$"), "").trim()
        // Strip trailing bank signatures e.g. "-Bank of Maharashtra" or "-SBI"
        clean = clean.replace(Regex("(?i)\\s*-\\s*(?:bank\\s+of\\s+[a-z]+|sbi|hdfc|icici|axis|kotak|pnb|bob|canara|union).*$"), "").trim()
        clean = clean.replace(Regex("[.,:;!?(]+$"), "").trim()
        clean = clean.replace(Regex("\\s+"), " ").trim()

        if (clean.equals("Google India Digital Services", ignoreCase = true)) {
            clean = "Google Play"
        }

        // Capitalize words for clean presentation if all lowercase or mixed, but preserve already uppercase words like "RAEESA MULLA"
        if (clean.isNotEmpty()) {
            clean = clean.split(" ").filter { it.isNotBlank() }.joinToString(" ") { word ->
                word.replaceFirstChar { if (it.isLowerCase()) it.titlecase() else it.toString() }
            }
        }

        return clean
    }
}
