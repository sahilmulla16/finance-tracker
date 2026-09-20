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
    val isActive: Boolean
) {
    companion object {
        fun fromJson(json: JSONObject): QuickAccount = QuickAccount(
            id = json.optString("id", ""),
            name = json.optString("name", ""),
            type = json.optString("type", "CASH"),
            currency = json.optString("currency", "INR"),
            openingBalance = json.optDouble("openingBalance", 0.0),
            isDefault = json.optBoolean("isDefault", false),
            isActive = json.optBoolean("isActive", true)
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
