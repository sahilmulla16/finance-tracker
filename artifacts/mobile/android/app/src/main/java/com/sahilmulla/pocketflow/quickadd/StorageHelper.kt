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
    val defaultAccountId: String? = null,
    val defaultCategoryId: String? = null
)

object StorageHelper {
    private const val TAG = "StorageHelper"
    private const val KEY_TRANSACTIONS = "@pocketflow/transactions"
    private const val KEY_ACCOUNTS = "@pocketflow/accounts"
    private const val KEY_CATEGORIES = "@pocketflow/categories"
    private const val KEY_SETTINGS = "@pocketflow/settings"
    private const val KEY_QUICK_ADD_SETTINGS = "@pocketflow/quickAddSettings"
    private const val KEY_NOTIFICATIONS = "@pocketflow/notifications"

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
        // 1. Try modern Room-backed AsyncStorage (AsyncStorage 2.x)
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

        // 2. Try legacy RKStorage (catalystLocalStorage)
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

        // 3. Alternate path check in databases dir
        val databasesDir = File(context.filesDir.parentFile, "databases")
        if (databasesDir.exists()) {
            val candidateAsync = File(databasesDir, "AsyncStorage")
            if (candidateAsync.exists()) {
                try {
                    val db = SQLiteDatabase.openDatabase(candidateAsync.absolutePath, null, SQLiteDatabase.OPEN_READWRITE)
                    return StorageTarget(db, "Storage")
                } catch (e: Exception) {}
            }
            val candidateRk = File(databasesDir, "RKStorage")
            if (candidateRk.exists()) {
                try {
                    val db = SQLiteDatabase.openDatabase(candidateRk.absolutePath, null, SQLiteDatabase.OPEN_READWRITE)
                    return StorageTarget(db, "catalystLocalStorage")
                } catch (e: Exception) {}
            }
        }

        // 4. Create new AsyncStorage database if requested
        if (createIfMissing) {
            try {
                val db = context.openOrCreateDatabase("AsyncStorage", Context.MODE_PRIVATE, null)
                db.execSQL("CREATE TABLE IF NOT EXISTS Storage (key TEXT PRIMARY KEY, value TEXT)")
                return StorageTarget(db, "Storage")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to create AsyncStorage db", e)
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

            // Write back inside a SQLite transaction
            target.db.beginTransaction()
            try {
                val success = writeValue(target, KEY_TRANSACTIONS, newArr.toString())
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
                put("time", "Just now")
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
