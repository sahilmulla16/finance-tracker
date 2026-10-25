package com.sahilmulla.pocketflow.quickadd

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log
import androidx.core.app.NotificationCompat
import com.sahilmulla.pocketflow.R
import java.util.concurrent.ConcurrentHashMap

class UpiNotificationListenerService : NotificationListenerService() {

    companion object {
        private const val TAG = "UpiNotifListener"
        const val NOTIF_CHANNEL_ID = "zeno_upi_detection"
        private const val PREFS_DEDUP = "pocketflow_upi_dedup"
        private const val DEDUP_WINDOW_MS = 90 * 1000L // 90 seconds cross-app window
        private const val REF_RETENTION_MS = 10 * 60 * 1000L // 10 minutes for unique transaction IDs

        // In-memory cache fallback
        private val recentPayments = ConcurrentHashMap<String, Long>()

        // Listener for foreground React Native event dispatch
        var onPaymentDetectedListener: ((UpiPaymentInfo) -> Unit)? = null

        fun isDuplicate(context: Context, payment: UpiPaymentInfo, now: Long): Boolean {
            val prefs = try {
                context.getSharedPreferences(PREFS_DEDUP, Context.MODE_PRIVATE)
            } catch (e: Exception) {
                null
            }

            // 1. Stable reference check (RRN / UPI transaction ID)
            if (!payment.reference.isNullOrBlank()) {
                val refKey = "ref_${payment.reference}"
                val memRefTime = recentPayments[refKey]
                if (memRefTime != null && now - memRefTime < REF_RETENTION_MS) {
                    return true
                }

                val prefRefTime = prefs?.getLong(refKey, 0L) ?: 0L
                if (prefRefTime > 0L && now - prefRefTime < REF_RETENTION_MS) {
                    recentPayments[refKey] = prefRefTime
                    return true
                }
            }

            // 2. Normalized transaction fingerprint (Amount + Merchant + Direction) within short time window
            val normalizedMerchant = payment.merchant.lowercase().trim().replace(Regex("\\s+"), "_")
            val amountKey = "amt_merch_${payment.direction}_${"%.2f".format(payment.amount)}_$normalizedMerchant"

            val storedVal = prefs?.getString(amountKey, null)
            if (storedVal != null) {
                val parts = storedVal.split("|")
                val lastTime = parts.getOrNull(0)?.toLongOrNull() ?: 0L
                val lastRef = parts.getOrNull(1)?.ifBlank { null }

                if (now - lastTime < DEDUP_WINDOW_MS) {
                    // If both notifications have distinct, non-empty references, they are 2 separate payments
                    if (!lastRef.isNullOrBlank() && !payment.reference.isNullOrBlank() && lastRef != payment.reference) {
                        return false
                    }
                    // Otherwise (one or both have no reference, e.g. GPay app alert + Bank SMS), treat as duplicate
                    return true
                }
            }

            val memTime = recentPayments[amountKey]
            if (memTime != null && now - memTime < DEDUP_WINDOW_MS) {
                return true
            }

            // 3. Fast indexed check against saved transactions in SQLite (0.002ms)
            if (StorageHelper.isDuplicateInDatabase(context, payment.amount, QuickTransaction.todayDate(), payment.merchant)) {
                return true
            }

            return false
        }

        fun recordPayment(context: Context, payment: UpiPaymentInfo, now: Long) {
            val normalizedMerchant = payment.merchant.lowercase().trim().replace(Regex("\\s+"), "_")
            val amountKey = "amt_merch_${payment.direction}_${"%.2f".format(payment.amount)}_$normalizedMerchant"
            recentPayments[amountKey] = now

            if (!payment.reference.isNullOrBlank()) {
                val refKey = "ref_${payment.reference}"
                recentPayments[refKey] = now
            }

            try {
                val prefs = context.getSharedPreferences(PREFS_DEDUP, Context.MODE_PRIVATE)
                val editor = prefs.edit()

                editor.putString(amountKey, "$now|${payment.reference ?: ""}")
                if (!payment.reference.isNullOrBlank()) {
                    editor.putLong("ref_${payment.reference}", now)
                }

                // Prune expired entries
                val allEntries = prefs.all
                for ((key, value) in allEntries) {
                    if (key.startsWith("ref_") && value is Long && now - value > REF_RETENTION_MS) {
                        editor.remove(key)
                    } else if (key.startsWith("amt_merch_") && value is String) {
                        val t = value.split("|").firstOrNull()?.toLongOrNull() ?: 0L
                        if (now - t > DEDUP_WINDOW_MS * 2) {
                            editor.remove(key)
                        }
                    }
                }
                editor.apply()
            } catch (e: Exception) {
                Log.w(TAG, "Error writing persistent dedup cache", e)
            }
        }

        fun clearOldDeduplicationCache() {
            val now = System.currentTimeMillis()
            recentPayments.entries.removeIf { now - it.value > REF_RETENTION_MS }
        }
    }

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        super.onNotificationPosted(sbn)
        if (sbn == null || sbn.notification == null) return

        val pkgName = sbn.packageName ?: return

        // 1. Filter: only supported payment, banking, and SMS apps
        if (!UpiNotificationParser.isSupportedPackage(pkgName)) return

        // 2. Check if UPI/Bank detection is enabled in user settings
        val config = StorageHelper.getQuickAddConfig(this)
        if (!config.upiDetectionTrigger) return

        val extras = sbn.notification.extras ?: return
        val title = extras.getCharSequence("android.title")?.toString() ?: ""
        val text = extras.getCharSequence("android.text")?.toString() ?: ""
        val bigText = extras.getCharSequence("android.bigText")?.toString()
        val subText = extras.getCharSequence("android.subText")?.toString()
        val ticker = sbn.notification.tickerText?.toString()

        // 3. Parse payment details on-device (Zero external API / network calls)
        val payment = UpiNotificationParser.parse(
            packageName = pkgName,
            title = title,
            text = text,
            bigText = bigText,
            subText = subText,
            ticker = ticker,
            postTime = sbn.postTime
        ) ?: return

        // 4. Deduplication Check (persistent across service restarts and payment apps vs bank SMS)
        val now = System.currentTimeMillis()
        clearOldDeduplicationCache()

        if (isDuplicate(this, payment, now)) {
            Log.d(TAG, "Duplicate transaction notification suppressed: ${payment.amount} to ${payment.merchant}")
            return
        }
        recordPayment(this, payment, now)

        Log.i(TAG, "Valid transaction detected: ${payment.amount} to ${payment.merchant} via $pkgName (Bank: ${payment.bankName}, Suffix: ${payment.accountSuffix})")

        // 5. Account Matching & Merchant Memory Lookup
        val isCardTxn = !payment.cardLast4.isNullOrBlank()
        val matchedAccount = if (isCardTxn) {
            StorageHelper.matchAccount(this, payment.bankName, payment.cardLast4, isCard = true) ?:
            StorageHelper.matchAccount(this, payment.bankName, payment.accountSuffix, isCard = false)
        } else {
            StorageHelper.matchAccount(this, payment.bankName, payment.accountSuffix, isCard = false)
        }
        if (matchedAccount != null && isCardTxn) {
            StorageHelper.syncAccountCardLast4(this, matchedAccount.id, payment.cardLast4!)
        }
        val merchantRule = StorageHelper.findMerchantRule(this, payment.merchant)
        val isRuleValid = merchantRule != null && merchantRule.enabled && merchantRule.categoryId.isNotBlank()

        // 6. Bank Available Balance Reconciliation (if stated in SMS/notification)
        if (payment.availableBalance != null && matchedAccount != null) {
            StorageHelper.reconcileAccountBalance(this, matchedAccount.id, payment.availableBalance)
        }

        // 7. Auto-Track: Refund detected for matched bank account
        if (matchedAccount != null && payment.direction == "REFUND") {
            val nowStr = QuickTransaction.now()
            val refundTxn = QuickTransaction(
                id = QuickTransaction.generateId(),
                type = "INCOME",
                amount = payment.amount,
                description = if (payment.merchant.isNotBlank()) payment.merchant else "Refund",
                category = "Refund",
                categoryId = "c_refund",
                accountId = matchedAccount.id,
                date = QuickTransaction.todayDate(),
                time = QuickTransaction.currentTime(),
                createdAt = nowStr,
                updatedAt = nowStr
            )

            val saved = StorageHelper.saveTransaction(this, refundTxn)
            if (saved) {
                val currencySymbol = StorageHelper.getCurrencySymbol(this)
                val formattedAmount = "$currencySymbol${"%.2f".format(payment.amount).replace(".00", "")}"

                dispatchAutoTrackSuccessNotification(
                    payment = payment,
                    amountFormatted = formattedAmount,
                    categoryName = "Refund",
                    accountName = matchedAccount.name
                )

                StorageHelper.saveNotification(
                    this,
                    "Refund tracked!",
                    "$formattedAmount refunded to ${matchedAccount.name} (${payment.merchant})"
                )

                onPaymentDetectedListener?.invoke(payment)
                Log.i(TAG, "Auto-tracked refund of ${payment.amount} for ${payment.merchant} -> ${matchedAccount.name}")
                return
            }
        }

        // 8. Auto-Track: Inter-Account Transfer (e.g. Bank of Maharashtra to Kotak)
        if (payment.direction == "TRANSFER") {
            val matchedToAccount = StorageHelper.matchAccount(this, payment.toBankName, payment.toAccountSuffix)
            if (matchedAccount != null && matchedToAccount != null && matchedAccount.id != matchedToAccount.id) {
                val nowStr = QuickTransaction.now()
                val transferTxn = QuickTransaction(
                    id = QuickTransaction.generateId(),
                    type = "TRANSFER",
                    amount = payment.amount,
                    description = "Transfer from ${matchedAccount.name} to ${matchedToAccount.name}",
                    category = "Transfer",
                    categoryId = "c_transfer",
                    accountId = matchedAccount.id,
                    fromAccountId = matchedAccount.id,
                    toAccountId = matchedToAccount.id,
                    date = QuickTransaction.todayDate(),
                    time = QuickTransaction.currentTime(),
                    createdAt = nowStr,
                    updatedAt = nowStr
                )

                val saved = StorageHelper.saveTransaction(this, transferTxn)
                if (saved) {
                    val currencySymbol = StorageHelper.getCurrencySymbol(this)
                    val formattedAmount = "$currencySymbol${"%.2f".format(payment.amount).replace(".00", "")}"

                    dispatchAutoTrackSuccessNotification(
                        payment = payment,
                        amountFormatted = formattedAmount,
                        categoryName = "Transfer",
                        accountName = "${matchedAccount.name} → ${matchedToAccount.name}"
                    )

                    StorageHelper.saveNotification(
                        this,
                        "Account transfer tracked!",
                        "$formattedAmount transferred from ${matchedAccount.name} to ${matchedToAccount.name}"
                    )

                    onPaymentDetectedListener?.invoke(payment)
                    Log.i(TAG, "Auto-tracked transfer of ${payment.amount} from ${matchedAccount.name} to ${matchedToAccount.name}")
                    return
                }
            }
        }

        // 9. Zero-Touch Auto-Track: Known merchant + valid rule + known account
        if (matchedAccount != null && isRuleValid && payment.direction == "EXPENSE") {
            val nowStr = QuickTransaction.now()
            val autoTxn = QuickTransaction(
                id = QuickTransaction.generateId(),
                type = "EXPENSE",
                amount = payment.amount,
                description = payment.merchant,
                category = merchantRule.categoryName,
                categoryId = merchantRule.categoryId,
                accountId = matchedAccount.id,
                date = QuickTransaction.todayDate(),
                time = QuickTransaction.currentTime(),
                createdAt = nowStr,
                updatedAt = nowStr
            )

            val saved = StorageHelper.saveTransaction(this, autoTxn)
            if (saved) {
                val currencySymbol = StorageHelper.getCurrencySymbol(this)
                val formattedAmount = "$currencySymbol${"%.2f".format(payment.amount).replace(".00", "")}"

                // Dispatch auto-track success notification (category popup suppressed)
                dispatchAutoTrackSuccessNotification(
                    payment = payment,
                    amountFormatted = formattedAmount,
                    categoryName = merchantRule.categoryName,
                    accountName = matchedAccount.name
                )

                // Save in-app notification using clean format
                val profileName = StorageHelper.getProfileName(this)
                val autoNotifBody = NotificationTextFormatter.formatNotificationBody(
                    amount = payment.amount,
                    currencySymbol = currencySymbol,
                    categoryName = merchantRule.categoryName,
                    descriptionOrMerchant = payment.merchant,
                    profileName = profileName,
                    accountNames = listOf(matchedAccount.name)
                )
                StorageHelper.saveNotification(
                    this,
                    NotificationTextFormatter.DEFAULT_TITLE,
                    autoNotifBody
                )

                // Notify foreground listener (React Native UI sync)
                onPaymentDetectedListener?.invoke(payment)

                Log.i(TAG, "Zero-touch auto-tracked ${payment.amount} for ${payment.merchant} -> ${merchantRule.categoryName} (${matchedAccount.name})")
                return
            }
        }

        // 10. Unknown merchant, ambiguous match, or manual review: prompt user via QuickAddActivity
        onPaymentDetectedListener?.invoke(payment)

        // Explicit intent launching the existing QuickAddActivity floating HUD
        val quickAddIntent = Intent(this, QuickAddActivity::class.java).apply {
            action = Intent.ACTION_VIEW
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or
                    Intent.FLAG_ACTIVITY_CLEAR_TOP or
                    Intent.FLAG_ACTIVITY_SINGLE_TOP
            putExtra("source", "upi_detected")
            putExtra("amount", "%.2f".format(payment.amount).replace(".00", ""))
            putExtra("merchant", payment.merchant)
            putExtra("reference", payment.reference ?: "")
            putExtra("timestamp", payment.timestamp)
            putExtra("packageName", payment.packageName)
            putExtra("direction", payment.direction)
            if (!payment.cardLast4.isNullOrBlank()) {
                putExtra("cardLast4", payment.cardLast4)
            }
            if (payment.availableBalance != null) {
                putExtra("availableBalance", payment.availableBalance)
            }
            if (matchedAccount != null) {
                putExtra("accountId", matchedAccount.id)
            }
            if (!payment.bankName.isNullOrBlank()) {
                putExtra("bankName", payment.bankName)
            }
            if (!payment.accountSuffix.isNullOrBlank()) {
                putExtra("accountSuffix", payment.accountSuffix)
            }
            if (!payment.toBankName.isNullOrBlank()) {
                putExtra("toBankName", payment.toBankName)
            }
            if (!payment.toAccountSuffix.isNullOrBlank()) {
                putExtra("toAccountSuffix", payment.toAccountSuffix)
            }
            if (merchantRule != null) {
                putExtra("categoryId", merchantRule.categoryId)
            }
        }

        // 11. Directly launch QuickAddActivity HUD if permitted (e.g. via accessibility service)
        launchCategoryPopupDirectly(quickAddIntent)

        // 12. Post system heads-up notification directing user into QuickAddActivity category popup
        dispatchUpiDetectionNotification(payment, quickAddIntent)
    }

    private fun dispatchAutoTrackSuccessNotification(
        payment: UpiPaymentInfo,
        amountFormatted: String,
        categoryName: String,
        accountName: String
    ) {
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager ?: return

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                NOTIF_CHANNEL_ID,
                "Payment Detection",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Notifies you when an expense is auto-tracked or detected"
                enableLights(true)
                enableVibration(true)
            }
            notificationManager.createNotificationChannel(channel)
        }

        val launchIntent = packageManager.getLaunchIntentForPackage(packageName)?.apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pendingIntent = if (launchIntent != null) {
            PendingIntent.getActivity(
                this,
                (payment.timestamp % 1000).toInt(),
                launchIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
            )
        } else null

        val profileName = StorageHelper.getProfileName(this)
        val notifTitle = NotificationTextFormatter.DEFAULT_TITLE
        val notifBody = NotificationTextFormatter.formatNotificationBody(
            amount = payment.amount,
            currencySymbol = StorageHelper.getCurrencySymbol(this),
            categoryName = categoryName,
            descriptionOrMerchant = payment.merchant,
            profileName = profileName,
            accountNames = listOf(accountName)
        )

        val notification = NotificationCompat.Builder(this, NOTIF_CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(notifTitle)
            .setContentText(notifBody)
            .setStyle(NotificationCompat.BigTextStyle().bigText("$notifTitle\n$notifBody"))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true).apply {
                if (pendingIntent != null) setContentIntent(pendingIntent)
            }
            .build()

        val notifId = (payment.timestamp % 100000).toInt()
        notificationManager.notify(notifId, notification)
    }

    private fun launchCategoryPopupDirectly(intent: Intent) {
        val launchedViaA11y = QuickAddAccessibilityService.launchIntent(intent)
        if (!launchedViaA11y) {
            try {
                startActivity(intent)
            } catch (e: Exception) {
                Log.d(TAG, "Direct background startActivity prevented by OS; user can tap notification to open popup", e)
            }
        }
    }

    private fun dispatchUpiDetectionNotification(payment: UpiPaymentInfo, quickAddIntent: Intent) {
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager ?: return
        val currencySymbol = StorageHelper.getCurrencySymbol(this)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                NOTIF_CHANNEL_ID,
                "Payment Detection",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Notifies you when an outgoing payment or bank debit is detected so you can categorize it"
                enableLights(true)
                enableVibration(true)
            }
            notificationManager.createNotificationChannel(channel)
        }

        val requestCode = (payment.amount.toInt() * 31) + (payment.timestamp % 1000).toInt()
        val pendingIntent = PendingIntent.getActivity(
            this,
            requestCode,
            quickAddIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
        )

        val formattedAmount = "$currencySymbol${"%.2f".format(payment.amount).replace(".00", "")}"
        val notifTitle = when (payment.direction) {
            "REFUND" -> "$formattedAmount refund from ${payment.merchant}"
            "TRANSFER" -> "$formattedAmount transfer: ${payment.merchant}"
            "INCOME" -> "$formattedAmount received: ${payment.merchant}"
            else -> "$formattedAmount paid to ${payment.merchant}"
        }
        val notifBody = "Tap to review in Quick Add"

        val notification = NotificationCompat.Builder(this, NOTIF_CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(notifTitle)
            .setContentText(notifBody)
            .setStyle(NotificationCompat.BigTextStyle().bigText("$notifTitle\n$notifBody"))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .build()

        val notifId = (payment.timestamp % 100000).toInt()
        notificationManager.notify(notifId, notification)
    }
}
