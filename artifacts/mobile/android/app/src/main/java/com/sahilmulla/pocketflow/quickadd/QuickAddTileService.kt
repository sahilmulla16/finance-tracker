package com.sahilmulla.pocketflow.quickadd

import android.app.PendingIntent
import android.content.Intent
import android.os.Build
import android.service.quicksettings.TileService
import android.util.Log

/**
 * Quick Settings Tile to launch Pocketflow Quick Add directly from the notification shade.
 */
class QuickAddTileService : TileService() {

    companion object {
        private const val TAG = "QuickAddTile"
    }

    override fun onClick() {
        super.onClick()

        // Check if quick settings trigger is enabled
        val config = StorageHelper.getQuickAddConfig(this)
        if (!config.quickSettingsTrigger) {
            Log.d(TAG, "Quick Settings trigger is disabled in Pocketflow settings")
            return
        }

        val intent = Intent(this, QuickAddActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or
                    Intent.FLAG_ACTIVITY_CLEAR_TOP or
                    Intent.FLAG_ACTIVITY_SINGLE_TOP
            putExtra("source", "quick_settings_tile")
        }

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                val pendingIntent = PendingIntent.getActivity(
                    this,
                    0,
                    intent,
                    PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
                )
                startActivityAndCollapse(pendingIntent)
            } else {
                @Suppress("DEPRECATION")
                startActivityAndCollapse(intent)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start QuickAddActivity from tile", e)
        }
    }
}

