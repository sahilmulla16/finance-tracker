package com.sahilmulla.pocketflow.quickadd

import java.util.Locale
import kotlin.math.abs

object NotificationTextFormatter {

    const val BULLET = " \u2022 "
    const val DEFAULT_TITLE = "Expense tracked successfully"

    /**
     * Formats an amount with the currency symbol and 2 decimal places.
     * E.g. 1.0 -> "₹1.00", 150.5 -> "₹150.50"
     */
    fun formatAmount(amount: Double, currencySymbol: String?): String {
        val safeSymbol = sanitizeCurrencySymbol(currencySymbol)
        val absAmount = abs(amount)
        val formattedNumber = String.format(Locale.ENGLISH, "%.2f", absAmount)
        return "$safeSymbol$formattedNumber"
    }

    /**
     * Sanitizes currency symbol against encoding corruption (e.g. â‚¹ -> ₹).
     */
    fun sanitizeCurrencySymbol(raw: String?): String {
        if (raw.isNullOrBlank()) return "\u20B9" // ₹
        val trimmed = raw.trim()
        if (trimmed.contains("\u00E2") || trimmed.contains("\u00C3") || trimmed.contains("\uFFFD")) {
            return "\u20B9"
        }
        return trimmed
    }

    /**
     * Determines whether candidate text is an internal account identifier,
     * username, phone number, or placeholder rather than a genuine third-party merchant.
     */
    fun isUserOrAccountIdentifier(
        candidate: String?,
        profileName: String? = null,
        userEmail: String? = null,
        accountNames: List<String> = emptyList(),
        categoryName: String? = null
    ): Boolean {
        if (candidate.isNullOrBlank()) return true
        val trimmed = candidate.trim()
        val lower = trimmed.lowercase(Locale.ROOT)

        // Generic placeholders or payment rails
        val genericWords = setOf(
            "self", "personal", "user", "expense", "null", "undefined",
            "transfer", "others", "other", "cash", "upi", "upi merchant",
            "vpa", "payment", "bank", "account", "a/c", "debit"
        )
        if (genericWords.contains(lower)) return true

        // Redundant if it simply repeats the category name
        if (!categoryName.isNullOrBlank() && lower == categoryName.trim().lowercase(Locale.ROOT)) {
            return true
        }

        // Check if candidate matches the user's profile name
        if (!profileName.isNullOrBlank()) {
            val userLower = profileName.trim().lowercase(Locale.ROOT)
            val alphaUser = userLower.replace(Regex("[^a-z0-9]"), "")
            val alphaCandidate = lower.replace(Regex("[^a-z0-9]"), "")
            if (lower == userLower || (alphaUser.isNotEmpty() && alphaCandidate == alphaUser)) {
                return true
            }
        }

        // Check if candidate matches the user's email or username handle
        if (!userEmail.isNullOrBlank()) {
            val emailHandle = userEmail.substringBefore("@").trim().lowercase(Locale.ROOT)
            val alphaHandle = emailHandle.replace(Regex("[^a-z0-9]"), "")
            val alphaCandidate = lower.replace(Regex("[^a-z0-9]"), "")
            if (lower == emailHandle || (alphaHandle.isNotEmpty() && alphaCandidate == alphaHandle)) {
                return true
            }
        }

        // Check if candidate matches any user account (e.g. "Main Wallet", "HDFC Savings")
        for (acc in accountNames) {
            if (lower == acc.trim().lowercase(Locale.ROOT)) {
                return true
            }
        }

        // Check if candidate is purely digits (phone number, card number, or account suffix)
        if (trimmed.matches(Regex("^[0-9+() -]{5,20}$"))) {
            return true
        }

        return false
    }

    /**
     * Sanitizes raw text removing encoding artifacts such as â€¢ or Ã.
     */
    fun sanitizeText(text: String?): String {
        if (text.isNullOrBlank()) return ""
        return text
            .replace("\u00E2\u20AC\u00A2", "\u2022") // â€¢ -> •
            .replace("\u00E2\u201A\u00B9", "\u20B9") // â‚¹ -> ₹
            .replace("â€¢", "•")
            .replace("â‚¹", "₹")
            .replace("Ã¢â‚¬Â¢", "•")
            .replace("Ã", "")
            .replace("\uFFFD", "")
            .trim()
    }

    /**
     * Formats the clean notification body string.
     * E.g. "₹1.00 • Others" or "₹1.00 • Others • Starbucks"
     */
    fun formatNotificationBody(
        amount: Double,
        currencySymbol: String?,
        categoryName: String?,
        descriptionOrMerchant: String?,
        profileName: String? = null,
        userEmail: String? = null,
        accountNames: List<String> = emptyList()
    ): String {
        val amountStr = formatAmount(amount, currencySymbol)
        val cat = if (!categoryName.isNullOrBlank()) sanitizeText(categoryName) else "Others"

        val cleanDesc = sanitizeText(descriptionOrMerchant)
        val includeMerchant = cleanDesc.isNotBlank() && !isUserOrAccountIdentifier(
            candidate = cleanDesc,
            profileName = profileName,
            userEmail = userEmail,
            accountNames = accountNames,
            categoryName = cat
        )

        return if (includeMerchant) {
            "$amountStr$BULLET$cat$BULLET$cleanDesc"
        } else {
            "$amountStr$BULLET$cat"
        }
    }
}

