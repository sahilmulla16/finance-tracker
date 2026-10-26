package com.sahilmulla.pocketflow.quickadd

import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.util.Log
import org.json.JSONArray
import org.json.JSONObject
import java.io.File

data class QuickAddConfig(
    val volumeDownTrigger: Boolean = true,
    val homeShortcutTrigger: Boolean = true,
    val quickSettingsTrigger: Boolean = true,
    val lockScreenTrigger: Boolean = true,
    val upiDetectionTrigger: Boolean = true,
    val defaultAccountId: String? = null,
    val defaultCategoryId: String? = null
)

object StorageHelper {
    private const val TAG = "StorageHelper"
    private const val KEY_TRANSACTIONS = "@pocketflow/transactions"
    private const val KEY_EXPENSES = "@pocketflow/expenses"
    private const val KEY_ACCOUNTS = "@pocketflow/accounts"
    private const val KEY_CATEGORIES = "@pocketflow/categories"
    private const val KEY_SETTINGS = "@pocketflow/settings"
    private const val KEY_QUICK_ADD_SETTINGS = "@pocketflow/quickAddSettings"
    private const val KEY_NOTIFICATIONS = "@pocketflow/notifications"
    private const val KEY_MERCHANT_RULES = "@pocketflow/merchant_rules"

    val DEFAULT_ACCOUNTS = listOf(
        QuickAccount(
            id = "1",
            name = "Cash",
            type = "CASH",
            currency = "INR",
            openingBalance = 5000.0,
            isDefault = true,
            isActive = true
        ),
        QuickAccount(
            id = "2",
            name = "Main Bank",
            type = "BANK",
            currency = "INR",
            openingBalance = 25000.0,
            isDefault = false,
            isActive = true
        )
    )

    val DEFAULT_CATEGORIES = listOf(
        QuickCategory(id = "c1", name = "Food & Drinks", icon = "coffee", color = "#FF9F0A", type = "expense"),
        QuickCategory(id = "c2", name = "Shopping", icon = "shopping-bag", color = "#5E5CE6", type = "expense"),
        QuickCategory(id = "c3", name = "Transport", icon = "navigation", color = "#30D158", type = "expense"),
        QuickCategory(id = "c4", name = "Entertainment", icon = "music", color = "#FF375F", type = "expense"),
        QuickCategory(id = "c5", name = "Bills & Utilities", icon = "file-text", color = "#64D2FF", type = "expense"),
        QuickCategory(id = "c6", name = "Healthcare", icon = "heart", color = "#FF453A", type = "expense"),
        QuickCategory(id = "c8", name = "Travel", icon = "map", color = "#FFD60A", type = "expense"),
        QuickCategory(id = "c9", name = "Groceries", icon = "shopping-cart", color = "#34C759", type = "expense"),
        QuickCategory(id = "c11", name = "Others", icon = "more-horizontal", color = "#8E8E93", type = "expense")
    )

    data class StorageTarget(
        val db: SQLiteDatabase,
        val tableName: String
    )

    private fun openStorage(context: Context, createIfMissing: Boolean = false): StorageTarget? {
        // 1. Prioritize RKStorage (catalystLocalStorage) - standard React Native AsyncStorage on Android
        val rkDbFile = context.getDatabasePath("RKStorage")
        if (rkDbFile.exists()) {
            try {
                val db = SQLiteDatabase.openDatabase(rkDbFile.absolutePath, null, SQLiteDatabase.OPEN_READWRITE)
                val hasTable = db.rawQuery(
                    "SELECT name FROM sqlite_master WHERE type='table' AND name='catalystLocalStorage'", null
                ).use { it.moveToFirst() }
                if (hasTable) {
                    return StorageTarget(db, "catalystLocalStorage")
                }
                db.close()
            } catch (e: Exception) {
                Log.w(TAG, "Failed to open RKStorage db", e)
            }
        }

        // 2. Try databases dir for RKStorage
        val databasesDir = File(context.filesDir.parentFile, "databases")
        if (databasesDir.exists()) {
            val candidateRk = File(databasesDir, "RKStorage")
            if (candidateRk.exists()) {
                try {
                    val db = SQLiteDatabase.openDatabase(candidateRk.absolutePath, null, SQLiteDatabase.OPEN_READWRITE)
                    val hasTable = db.rawQuery(
                        "SELECT name FROM sqlite_master WHERE type='table' AND name='catalystLocalStorage'", null
                    ).use { it.moveToFirst() }
                    if (hasTable) {
                        return StorageTarget(db, "catalystLocalStorage")
                    }
                    db.close()
                } catch (e: Exception) {}
            }
        }

        // 3. Fallback to AsyncStorage db with Storage table
        val asyncDbFile = context.getDatabasePath("AsyncStorage")
        if (asyncDbFile.exists()) {
            try {
                val db = SQLiteDatabase.openDatabase(asyncDbFile.absolutePath, null, SQLiteDatabase.OPEN_READWRITE)
                val hasTable = db.rawQuery(
                    "SELECT name FROM sqlite_master WHERE type='table' AND name='Storage'", null
                ).use { it.moveToFirst() }
                if (hasTable) {
                    return StorageTarget(db, "Storage")
                }
                db.close()
            } catch (e: Exception) {
                Log.w(TAG, "Failed to open AsyncStorage db", e)
            }
        }

        // 4. Create new RKStorage database if requested (matching React Native)
        if (createIfMissing) {
            try {
                val db = context.openOrCreateDatabase("RKStorage", Context.MODE_PRIVATE, null)
                db.execSQL("CREATE TABLE IF NOT EXISTS catalystLocalStorage (key TEXT PRIMARY KEY, value TEXT)")
                return StorageTarget(db, "catalystLocalStorage")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to create RKStorage db", e)
            }
        }

        return null
    }

    private fun readValue(target: StorageTarget, key: String): String? {
        return try {
            val cursor = target.db.query(
                target.tableName,
                arrayOf("value"),
                "key = ?",
                arrayOf(key),
                null, null, null
            )
            cursor.use {
                if (it.moveToFirst()) it.getString(0) else null
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to read key: $key", e)
            null
        }
    }

    private fun writeValue(target: StorageTarget, key: String, value: String): Boolean {
        return try {
            val cursor = target.db.query(
                target.tableName,
                arrayOf("key"),
                "key = ?",
                arrayOf(key),
                null, null, null
            )
            val exists = cursor.use { it.moveToFirst() }

            if (exists) {
                target.db.execSQL(
                    "UPDATE ${target.tableName} SET value = ? WHERE key = ?",
                    arrayOf(value, key)
                )
            } else {
                target.db.execSQL(
                    "INSERT INTO ${target.tableName} (key, value) VALUES (?, ?)",
                    arrayOf(key, value)
                )
            }
            true
        } catch (e: Exception) {
            Log.e(TAG, "Failed to write key: $key", e)
            false
        }
    }

    fun getAccounts(context: Context): List<QuickAccount> {
        val target = openStorage(context) ?: return DEFAULT_ACCOUNTS
        return try {
            val json = readValue(target, KEY_ACCOUNTS) ?: return DEFAULT_ACCOUNTS
            val arr = JSONArray(json)
            val list = mutableListOf<QuickAccount>()
            for (i in 0 until arr.length()) {
                val obj = arr.optJSONObject(i) ?: continue
                list.add(QuickAccount.fromJson(obj))
            }
            if (list.isEmpty()) DEFAULT_ACCOUNTS else list
        } catch (e: Exception) {
            Log.e(TAG, "Failed to parse accounts", e)
            DEFAULT_ACCOUNTS
        } finally {
            target.db.close()
        }
    }

    fun getDefaultAccount(context: Context): QuickAccount? {
        val accounts = getAccounts(context)
        return accounts.find { it.isDefault } ?: accounts.firstOrNull() ?: DEFAULT_ACCOUNTS.first()
    }

    fun getCategories(context: Context): List<QuickCategory> {
        val target = openStorage(context) ?: return DEFAULT_CATEGORIES
        return try {
            val json = readValue(target, KEY_CATEGORIES) ?: return DEFAULT_CATEGORIES
            val arr = JSONArray(json)
            val list = mutableListOf<QuickCategory>()
            for (i in 0 until arr.length()) {
                val obj = arr.optJSONObject(i) ?: continue
                list.add(QuickCategory.fromJson(obj))
            }
            if (list.isEmpty()) DEFAULT_CATEGORIES else list
        } catch (e: Exception) {
            Log.e(TAG, "Failed to parse categories", e)
            DEFAULT_CATEGORIES
        } finally {
            target.db.close()
        }
    }

    val DEFAULT_INCOME_CATEGORIES = listOf(
        QuickCategory(id = "salary", name = "Salary", icon = "briefcase", color = "#16A34A", type = "income"),
        QuickCategory(id = "freelance", name = "Freelance", icon = "laptop", color = "#0891B2", type = "income"),
        QuickCategory(id = "investments", name = "Investments", icon = "trending-up", color = "#8B5CF6", type = "income"),
        QuickCategory(id = "other-income", name = "Other Income", icon = "dollar-sign", color = "#059669", type = "income")
    )

    fun getIncomeCategories(context: Context): List<QuickCategory> {
        val list = getCategories(context).filter { cat ->
            cat.type == "income" || cat.type == "both"
        }
        return if (list.isEmpty()) DEFAULT_INCOME_CATEGORIES else list
    }

    fun getExpenseCategories(context: Context): List<QuickCategory> {
        val list = getCategories(context).filter { cat ->
            cat.type == "expense" || cat.type == "both" || cat.type == null
        }
        return if (list.isEmpty()) DEFAULT_CATEGORIES else list
    }

    fun getQuickAddConfig(context: Context): QuickAddConfig {
        val target = openStorage(context) ?: return QuickAddConfig()
        return try {
            val json = readValue(target, KEY_QUICK_ADD_SETTINGS) ?: return QuickAddConfig()
            val obj = JSONObject(json)
            QuickAddConfig(
                volumeDownTrigger = obj.optBoolean("volumeDownTrigger", true),
                homeShortcutTrigger = obj.optBoolean("homeShortcutTrigger", true),
                quickSettingsTrigger = obj.optBoolean("quickSettingsTrigger", true),
                lockScreenTrigger = obj.optBoolean("lockScreenTrigger", true),
                upiDetectionTrigger = obj.optBoolean("upiDetectionTrigger", true),
                defaultAccountId = if (obj.has("defaultAccountId") && !obj.isNull("defaultAccountId")) obj.optString("defaultAccountId") else null,
                defaultCategoryId = if (obj.has("defaultCategoryId") && !obj.isNull("defaultCategoryId")) obj.optString("defaultCategoryId") else null
            )
        } catch (e: Exception) {
            Log.e(TAG, "Failed to parse quickAddConfig", e)
            QuickAddConfig()
        } finally {
            target.db.close()
        }
    }

    fun getCurrencySymbol(context: Context): String {
        val target = openStorage(context) ?: return "₹"
        return try {
            val json = readValue(target, KEY_SETTINGS) ?: return "₹"
            val obj = JSONObject(json)
            when (obj.optString("currency", "INR")) {
                "USD" -> "$"
                "EUR" -> "€"
                "GBP" -> "£"
                "AED" -> "د.إ"
                else -> "₹"
            }
        } catch (e: Exception) {
            "₹"
        } finally {
            target.db.close()
        }
    }

    fun getProfileName(context: Context): String? {
        val target = openStorage(context) ?: return null
        return try {
            val json = readValue(target, KEY_SETTINGS) ?: return null
            val obj = JSONObject(json)
            obj.optString("profileName", "").ifBlank { null }
        } catch (e: Exception) {
            null
        } finally {
            target.db.close()
        }
    }

    fun getAppearance(context: Context): String {
        val target = openStorage(context) ?: return "dark"
        return try {
            val json = readValue(target, KEY_SETTINGS) ?: return "dark"
            val obj = JSONObject(json)
            obj.optString("appearance", "dark")
        } catch (e: Exception) {
            "dark"
        } finally {
            target.db.close()
        }
    }

    fun saveTransaction(context: Context, transaction: QuickTransaction): Boolean {
        val target = openStorage(context, createIfMissing = true) ?: return false
        return try {
            // Read current transactions
            val currentJson = readValue(target, KEY_TRANSACTIONS)
            val transactionsArr = if (currentJson.isNullOrBlank()) {
                JSONArray()
            } else {
                try {
                    JSONArray(currentJson)
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to parse current transactions JSON", e)
                    JSONArray()
                }
            }

            // Prepend new transaction (matching FinanceContext behavior)
            val newArr = JSONArray()
            newArr.put(transaction.toJson())
            for (i in 0 until transactionsArr.length()) {
                newArr.put(transactionsArr.opt(i))
            }

            // Also update KEY_EXPENSES for backward compatibility (expenses only)
            if (transaction.type.equals("EXPENSE", ignoreCase = true)) {
                val currentExpensesJson = readValue(target, KEY_EXPENSES)
            val expensesArr = if (currentExpensesJson.isNullOrBlank()) {
                JSONArray()
            } else {
                try {
                    JSONArray(currentExpensesJson)
                } catch (e: Exception) {
                    JSONArray()
                }
            }

            val newExpense = JSONObject().apply {
                put("id", transaction.id)
                put("amount", transaction.amount)
                put("description", if (transaction.description.isNotBlank()) transaction.description else transaction.category)
                put("category", transaction.category)
                put("date", transaction.createdAt)
                put("payment", "Cash")
            }

            val newExpensesArr = JSONArray()
            newExpensesArr.put(newExpense)
            for (i in 0 until expensesArr.length()) {
                newExpensesArr.put(expensesArr.opt(i))
            }

            // Write back inside a SQLite transaction
            target.db.beginTransaction()
            try {
                val successTxn = writeValue(target, KEY_TRANSACTIONS, newArr.toString())
                val successExp = writeValue(target, KEY_EXPENSES, newExpensesArr.toString())
                val success = successTxn && successExp
                if (success) {
                    target.db.setTransactionSuccessful()
                }
                success
            } finally {
                target.db.endTransaction()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to save transaction", e)
            false
        } finally {
            target.db.close()
        }
    }

    fun purgeAllStorage(context: Context): Boolean {
        val target = openStorage(context) ?: return true
        return try {
            target.db.beginTransaction()
            try {
                target.db.execSQL("DELETE FROM ${target.tableName}")
                target.db.setTransactionSuccessful()
                true
            } finally {
                target.db.endTransaction()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to purge storage", e)
            false
        } finally {
            target.db.close()
        }
    }

    fun saveNotification(context: Context, title: String, message: String): Boolean {
        val target = openStorage(context, createIfMissing = true) ?: return false
        return try {
            val currentJson = readValue(target, KEY_NOTIFICATIONS)
            val notifsArr = if (currentJson.isNullOrBlank()) {
                JSONArray()
            } else {
                try {
                    JSONArray(currentJson)
                } catch (e: Exception) {
                    JSONArray()
                }
            }

            val newNotif = JSONObject().apply {
                put("id", "notif-${System.currentTimeMillis()}")
                put("title", title)
                put("message", message)
                put("time", System.currentTimeMillis().toString())
                put("read", false)
                put("type", "success")
                put("route", "/(tabs)/expenses")
            }

            val newArr = JSONArray()
            newArr.put(newNotif)
            for (i in 0 until notifsArr.length()) {
                newArr.put(notifsArr.opt(i))
            }

            target.db.beginTransaction()
            try {
                val success = writeValue(target, KEY_NOTIFICATIONS, newArr.toString())
                if (success) {
                    target.db.setTransactionSuccessful()
                }
                success
            } finally {
                target.db.endTransaction()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to save notification", e)
            false
        } finally {
            target.db.close()
        }
    }


    fun getBankAliases(bankName: String?): List<String> {
        if (bankName.isNullOrBlank()) return emptyList()
        val lower = bankName.trim().lowercase()
        return when {
            lower.contains("kotak") || lower.contains("kmbl") || lower.contains("811") ->
                listOf("kotak", "kmbl", "811")
            lower.contains("maharashtra") || lower.contains("mahabk") || lower.contains("bom") ->
                listOf("maharashtra", "mahabk", "bom")
            lower.contains("sbi") || lower.contains("state bank") ->
                listOf("sbi", "state bank")
            lower.contains("hdfc") ->
                listOf("hdfc")
            lower.contains("icici") ->
                listOf("icici")
            lower.contains("axis") ->
                listOf("axis")
            lower.contains("baroda") || lower.contains("bob") ->
                listOf("baroda", "bob")
            lower.contains("punjab") || lower.contains("pnb") ->
                listOf("punjab", "pnb")
            lower.contains("canara") ->
                listOf("canara")
            lower.contains("union") || lower.contains("uboi") ->
                listOf("union", "uboi")
            lower.contains("idfc") ->
                listOf("idfc")
            lower.contains("indusind") ->
                listOf("indusind")
            lower.contains("federal") ->
                listOf("federal")
            lower.contains("yes") ->
                listOf("yes")
            else -> {
                val words = lower.split(Regex("\\s+")).filter { it.length >= 3 && it != "bank" }
                if (words.isNotEmpty()) words else listOf(lower)
            }
        }
    }

    fun matchAccount(context: Context, bankName: String?, suffix: String?, isCard: Boolean? = null): QuickAccount? {
        val accounts = getAccounts(context).filter { it.isActive && !it.type.equals("CASH", ignoreCase = true) }
        if (accounts.isEmpty()) return null

        val cleanSuffix = suffix?.trim()
        val cleanBank = bankName?.trim()

        // 1. Bank + Suffix match
        if (!cleanSuffix.isNullOrBlank() && !cleanBank.isNullOrBlank()) {
            val aliases = getBankAliases(cleanBank)
            val bankAccounts = accounts.filter { acc ->
                val accLower = acc.name.lowercase()
                aliases.any { accLower.contains(it) }
            }
            val bankAndSuffix = bankAccounts.filter { acc ->
                val isCardAcc = acc.type.equals("CREDIT", ignoreCase = true) || acc.type.equals("CARD", ignoreCase = true)
                if (isCard == true) {
                    acc.cardLast4 == cleanSuffix || (isCardAcc && acc.accountSuffix == cleanSuffix) || (isCardAcc && acc.name.contains(cleanSuffix, ignoreCase = true))
                } else if (isCard == false) {
                    acc.accountNumberLast4 == cleanSuffix || (!isCardAcc && acc.accountSuffix == cleanSuffix) || (!isCardAcc && acc.name.contains(cleanSuffix, ignoreCase = true))
                } else {
                    acc.accountNumberLast4 == cleanSuffix || acc.cardLast4 == cleanSuffix || acc.accountSuffix == cleanSuffix || acc.name.contains(cleanSuffix, ignoreCase = true)
                }
            }
            if (bankAndSuffix.size == 1) return bankAndSuffix[0]
            if (bankAndSuffix.size > 1) return null // Ambiguous: do not guess across multiple accounts
        }

        // 2. Suffix only match
        if (!cleanSuffix.isNullOrBlank()) {
            val matchedBySuffix = accounts.filter { acc ->
                val isCardAcc = acc.type.equals("CREDIT", ignoreCase = true) || acc.type.equals("CARD", ignoreCase = true)
                if (isCard == true) {
                    acc.cardLast4 == cleanSuffix || (isCardAcc && acc.accountSuffix == cleanSuffix) || (isCardAcc && acc.name.contains(cleanSuffix, ignoreCase = true))
                } else if (isCard == false) {
                    acc.accountNumberLast4 == cleanSuffix || (!isCardAcc && acc.accountSuffix == cleanSuffix) || (!isCardAcc && acc.name.contains(cleanSuffix, ignoreCase = true))
                } else {
                    acc.accountNumberLast4 == cleanSuffix || acc.cardLast4 == cleanSuffix || acc.accountSuffix == cleanSuffix || acc.name.contains(cleanSuffix, ignoreCase = true)
                }
            }
            if (matchedBySuffix.size == 1) return matchedBySuffix[0]
            if (matchedBySuffix.size > 1) return null
        }

        // 3. Bank only match
        if (!cleanBank.isNullOrBlank()) {
            val aliases = getBankAliases(cleanBank)
            var bankMatches = accounts.filter { acc ->
                val accLower = acc.name.lowercase()
                aliases.any { accLower.contains(it) }
            }
            if (isCard == true) {
                val cardBankMatches = bankMatches.filter {
                    it.type.equals("CREDIT", ignoreCase = true) || it.type.equals("CARD", ignoreCase = true) || it.name.contains("card", ignoreCase = true)
                }
                if (cardBankMatches.isNotEmpty()) {
                    bankMatches = cardBankMatches
                }
            }
            if (bankMatches.size == 1) return bankMatches[0]
            if (bankMatches.size > 1) return null // Ambiguous: do not guess
        }

        return null
    }

    fun syncAccountCardLast4(context: Context, accountId: String, cardLast4: String): Boolean {
        if (accountId.isBlank() || cardLast4.isBlank()) return false
        val cleanDigits = cardLast4.replace(Regex("\\D"), "")
        val card4 = if (cleanDigits.length > 4) cleanDigits.takeLast(4) else cleanDigits
        if (card4.length != 4) return false

        val target = openStorage(context) ?: return false
        return try {
            val currentJson = readValue(target, KEY_ACCOUNTS) ?: return false
            val arr = JSONArray(currentJson)
            var updated = false
            for (i in 0 until arr.length()) {
                val obj = arr.optJSONObject(i) ?: continue
                if (obj.optString("id") == accountId) {
                    if (obj.optString("cardLast4") != card4) {
                        obj.put("cardLast4", card4)
                        obj.put("updatedAt", QuickTransaction.now())
                        updated = true
                    }
                    break
                }
            }
            if (updated) {
                target.db.beginTransaction()
                try {
                    val success = writeValue(target, KEY_ACCOUNTS, arr.toString())
                    if (success) {
                        target.db.setTransactionSuccessful()
                    }
                    success
                } finally {
                    target.db.endTransaction()
                }
            } else {
                true
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to sync account cardLast4", e)
            false
        } finally {
            target.db.close()
        }
    }

    fun findMerchantRule(context: Context, merchant: String?): QuickMerchantRule? {
        if (merchant.isNullOrBlank()) return null
        val normalized = QuickMerchantRule.normalize(merchant)
        if (normalized.isBlank()) return null

        val target = openStorage(context) ?: return null
        return try {
            val json = readValue(target, KEY_MERCHANT_RULES) ?: return null
            val arr = JSONArray(json)
            for (i in 0 until arr.length()) {
                val obj = arr.optJSONObject(i) ?: continue
                val rule = QuickMerchantRule.fromJson(obj)
                if (rule.enabled && rule.normalizedKey == normalized) {
                    return rule
                }
            }
            null
        } catch (e: Exception) {
            Log.e(TAG, "Failed to find merchant rule", e)
            null
        } finally {
            target.db.close()
        }
    }

    fun saveMerchantRule(context: Context, merchant: String, categoryId: String, categoryName: String): Boolean {
        if (merchant.isBlank()) return false
        val normalized = QuickMerchantRule.normalize(merchant)
        if (normalized.isBlank()) return false

        val target = openStorage(context, createIfMissing = true) ?: return false
        return try {
            val currentJson = readValue(target, KEY_MERCHANT_RULES)
            val rulesArr = if (currentJson.isNullOrBlank()) JSONArray() else {
                try { JSONArray(currentJson) } catch (e: Exception) { JSONArray() }
            }

            val newRule = QuickMerchantRule(
                normalizedKey = normalized,
                displayMerchant = merchant.trim(),
                categoryId = categoryId,
                categoryName = categoryName,
                createdAt = QuickTransaction.now(),
                updatedAt = QuickTransaction.now(),
                source = "user-confirmed",
                enabled = true,
                userConfirmed = true
            )

            val updatedArr = JSONArray()
            var replaced = false
            for (i in 0 until rulesArr.length()) {
                val obj = rulesArr.optJSONObject(i) ?: continue
                val existing = QuickMerchantRule.fromJson(obj)
                if (existing.normalizedKey == normalized) {
                    updatedArr.put(newRule.toJson())
                    replaced = true
                } else {
                    updatedArr.put(obj)
                }
            }
            if (!replaced) {
                updatedArr.put(newRule.toJson())
            }

            target.db.beginTransaction()
            try {
                val success = writeValue(target, KEY_MERCHANT_RULES, updatedArr.toString())
                if (success) {
                    target.db.setTransactionSuccessful()
                }
                success
            } finally {
                target.db.endTransaction()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to save merchant rule", e)
            false
        } finally {
            target.db.close()
        }
    }

    fun isDuplicateInDatabase(context: Context, amount: Double, date: String, merchant: String): Boolean {
        val target = openStorage(context) ?: return false
        return try {
            val currentJson = readValue(target, KEY_TRANSACTIONS) ?: return false
            val arr = JSONArray(currentJson)
            val normMerchant = merchant.trim().lowercase()
            for (i in 0 until arr.length()) {
                val obj = arr.optJSONObject(i) ?: continue
                val txnAmount = obj.optDouble("amount", -1.0)
                val txnDate = obj.optString("date", "")
                val txnDesc = obj.optString("description", "").trim().lowercase()

                if (Math.abs(txnAmount - amount) < 0.01 && txnDate == date && (txnDesc == normMerchant || txnDesc.contains(normMerchant) || normMerchant.contains(txnDesc))) {
                    return true
                }
            }
            false
        } catch (e: Exception) {
            false
        } finally {
            target.db.close()
        }
    }

    fun reconcileAccountBalance(context: Context, accountId: String, availableBalance: Double): Boolean {
        Log.i(TAG, "Reconciling account $accountId with balance $availableBalance")
        return true
    }

    fun verifyStorage(context: Context): StorageStatus {
        val target = openStorage(context) ?: return StorageStatus.OK // Defaults exist
        target.db.close()
        return StorageStatus.OK
    }
}

enum class StorageStatus {
    OK,
    DB_NOT_FOUND,
    DB_OPEN_FAILED,
    TABLE_NOT_FOUND,
    KEYS_NOT_FOUND
}
