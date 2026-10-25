package com.sahilmulla.pocketflow.quickadd

import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import kotlin.random.Random

data class QuickTransaction(
    val id: String,
    val type: String,
    val amount: Double,
    val description: String,
    val category: String? = null,
    val categoryId: String? = null,
    val accountId: String? = null,
    val fromAccountId: String? = null,
    val toAccountId: String? = null,
    val date: String,
    val time: String,
    val createdAt: String,
    val updatedAt: String
) {
    fun toJson(): JSONObject = JSONObject().apply {
        put("id", id)
        put("type", type)
        put("amount", amount)
        put("description", description)
        put("category", category ?: JSONObject.NULL)
        put("categoryId", categoryId ?: JSONObject.NULL)
        put("accountId", accountId ?: JSONObject.NULL)
        put("fromAccountId", fromAccountId ?: JSONObject.NULL)
        put("toAccountId", toAccountId ?: JSONObject.NULL)
        put("date", date)
        put("time", time)
        put("createdAt", createdAt)
        put("updatedAt", updatedAt)
    }

    companion object {
        fun generateId(): String {
            val timestamp = System.currentTimeMillis()
            val random = buildString {
                repeat(6) { append(('a'..'z').random()) }
            }
            return "txn-$timestamp$random"
        }

        fun now(): String = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).format(Date())
        fun todayDate(): String = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
        fun currentTime(): String = SimpleDateFormat("HH:mm", Locale.US).format(Date())
    }
}

data class QuickAccount(
    val id: String,
    val name: String,
    val type: String,
    val currency: String,
    val openingBalance: Double,
    val isDefault: Boolean,
    val isActive: Boolean,
    val accountNumberLast4: String? = null,
    val cardLast4: String? = null,
    val accountSuffix: String? = null
) {
    companion object {
        fun fromJson(json: JSONObject): QuickAccount = QuickAccount(
            id = json.optString("id", ""),
            name = json.optString("name", ""),
            type = json.optString("type", "CASH"),
            currency = json.optString("currency", "INR"),
            openingBalance = json.optDouble("openingBalance", 0.0),
            isDefault = json.optBoolean("isDefault", false),
            isActive = json.optBoolean("isActive", true),
            accountNumberLast4 = if (json.has("accountNumberLast4") && !json.isNull("accountNumberLast4")) json.getString("accountNumberLast4") else null,
            cardLast4 = if (json.has("cardLast4") && !json.isNull("cardLast4")) json.getString("cardLast4") else null,
            accountSuffix = if (json.has("accountSuffix") && !json.isNull("accountSuffix")) json.getString("accountSuffix") else null
        )
    }
}

data class QuickCategory(
    val id: String,
    val name: String,
    val icon: String,
    val color: String,
    val type: String? = null
) {
    companion object {
        fun fromJson(json: JSONObject): QuickCategory = QuickCategory(
            id = json.optString("id", ""),
            name = json.optString("name", ""),
            icon = json.optString("icon", "more-horizontal"),
            color = json.optString("color", "#8E9AAF"),
            type = if (json.has("type") && !json.isNull("type")) json.getString("type") else null
        )
    }
}

data class QuickMerchantRule(
    val normalizedKey: String,
    val displayMerchant: String,
    val categoryId: String,
    val categoryName: String,
    val preferredAccountId: String? = null,
    val scope: String = "GLOBAL",
    val createdAt: String = "",
    val updatedAt: String = "",
    val source: String = "user-confirmed",
    val enabled: Boolean = true,
    val userConfirmed: Boolean = true
) {
    fun toJson(): JSONObject = JSONObject().apply {
        put("normalizedKey", normalizedKey)
        put("displayMerchant", displayMerchant)
        put("categoryId", categoryId)
        put("categoryName", categoryName)
        if (preferredAccountId != null) put("preferredAccountId", preferredAccountId)
        put("scope", scope)
        put("createdAt", createdAt)
        put("updatedAt", updatedAt)
        put("source", source)
        put("enabled", enabled)
        put("userConfirmed", userConfirmed)
    }

    companion object {
        fun fromJson(json: JSONObject): QuickMerchantRule = QuickMerchantRule(
            normalizedKey = json.optString("normalizedKey", ""),
            displayMerchant = json.optString("displayMerchant", ""),
            categoryId = json.optString("categoryId", ""),
            categoryName = json.optString("categoryName", ""),
            preferredAccountId = if (json.has("preferredAccountId") && !json.isNull("preferredAccountId")) json.getString("preferredAccountId") else null,
            scope = json.optString("scope", "GLOBAL"),
            createdAt = json.optString("createdAt", ""),
            updatedAt = json.optString("updatedAt", ""),
            source = json.optString("source", "user-confirmed"),
            enabled = json.optBoolean("enabled", true),
            userConfirmed = json.optBoolean("userConfirmed", true)
        )

        fun normalize(raw: String?): String {
            if (raw.isNullOrBlank()) return ""
            var text = raw.trim()
            text = text.replace(Regex("[/-]\\d{5,18}$"), "").trim()
            text = text.replace(Regex("^(?:upi/|upi-|upi\\s+|pos/|pos-|pos\\s+|paid\\s+to\\s+|pay\\s+to\\s+|payment\\s+to\\s+|transfer\\s+to\\s+|purchase\\s+at\\s+|spent\\s+at\\s+|vpa/|vpa\\s+|imps/|neft/|rtgs/)", RegexOption.IGNORE_CASE), "").trim()
            text = text.replace(Regex("@[a-zA-Z0-9.\\-_]+$"), "").trim()
            text = text.replace(Regex("\\s+(?:pvt\\.?\\s*ltd\\.?|private\\s+limited|ltd\\.?|limited|llp|inc\\.?|india|enterprises|retail|store|stores)$", RegexOption.IGNORE_CASE), "").trim()
            val cleaned = text.replace(Regex("[.,\\-_'/*&\\\\#@:;!~]"), " ").replace(Regex("\\s+"), " ").trim()
            return cleaned.lowercase(Locale.US)
        }
    }
}
