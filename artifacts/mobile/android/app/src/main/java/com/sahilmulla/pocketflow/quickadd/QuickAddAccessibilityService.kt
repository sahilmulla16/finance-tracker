package com.sahilmulla.pocketflow.quickadd

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.os.SystemClock
import android.util.Log
import android.view.KeyEvent
import android.view.accessibility.AccessibilityEvent

/**
 * Listens for hardware key events to trigger Pocketflow Quick Add.
 * Detects double-press of Volume Down within 400ms threshold.
 */
class QuickAddAccessibilityService : AccessibilityService() {

    companion object {
        private const val TAG = "QuickAddA11y"
        private const val DOUBLE_PRESS_THRESHOLD_MS = 400L

        var instance: QuickAddAccessibilityService? = null

        fun launchIntent(intent: Intent): Boolean {
            val a11y = instance ?: return false
            return try {
                a11y.startActivity(intent)
                true
            } catch (e: Exception) {
                Log.w(TAG, "Failed to launch intent via a11y service", e)
                false
            }
        }
    }

    private var lastVolumeDownTime: Long = 0

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        Log.d(TAG, "QuickAddAccessibilityService connected")
    }

    override fun onDestroy() {
        super.onDestroy()
        if (instance == this) {
            instance = null
        }
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        // Not used - only key events are filtered
    }

    override fun onInterrupt() {
        // No-op
    }

    override fun onKeyEvent(event: KeyEvent): Boolean {
        if (event.keyCode == KeyEvent.KEYCODE_VOLUME_DOWN) {
            if (event.action == KeyEvent.ACTION_DOWN) {
                // Check if volumeDownTrigger is enabled in settings
                val config = StorageHelper.getQuickAddConfig(this)
                if (!config.volumeDownTrigger) {
                    return super.onKeyEvent(event)
                }

                val now = SystemClock.uptimeMillis()
                if (now - lastVolumeDownTime in 50..DOUBLE_PRESS_THRESHOLD_MS) {
                    lastVolumeDownTime = 0
                    Log.d(TAG, "2× Volume Down detected! Launching QuickAdd HUD")
                    launchQuickAdd()
                    // Return true to consume the second click so the volume slider is suppressed
                    return true
                } else {
                    lastVolumeDownTime = now
                }
            }
        }
        return super.onKeyEvent(event)
    }

    private fun launchQuickAdd() {
        try {
            val intent = Intent(this, QuickAddActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or
                        Intent.FLAG_ACTIVITY_CLEAR_TOP or
                        Intent.FLAG_ACTIVITY_SINGLE_TOP
                putExtra("source", "volume_down")
            }
            startActivity(intent)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to launch QuickAddActivity", e)
        }
    }
}

