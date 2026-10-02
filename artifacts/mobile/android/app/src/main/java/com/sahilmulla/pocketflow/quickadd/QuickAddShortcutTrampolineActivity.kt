package com.sahilmulla.pocketflow.quickadd

import android.app.Activity
import android.content.Intent
import android.os.Bundle

/**
 * Minimal, hardened trampoline entry activity specifically for launcher static shortcuts.
 *
 * Security Architecture:
 * - Exported so the Android Launcher can trigger the static shortcut without signature permission crashes.
 * - Performs ZERO financial writes and contains no sensitive data.
 * - Accepts and parses NO external transaction parameters (amounts, accounts, categories).
 * - Enforces user configuration check (homeShortcutTrigger).
 * - Launches the strictly non-exported QuickAddActivity via an explicit internal Intent.
 * - Immediately finishes itself without displaying any window.
 */
class QuickAddShortcutTrampolineActivity : Activity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        try {
            // Verify if home shortcut trigger is enabled by the user
            val config = StorageHelper.getQuickAddConfig(this)
            if (config.homeShortcutTrigger) {
                val internalIntent = Intent(this, QuickAddActivity::class.java).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK or
                            Intent.FLAG_ACTIVITY_CLEAR_TOP or
                            Intent.FLAG_ACTIVITY_SINGLE_TOP
                    putExtra("source", "home_shortcut")
                }
                startActivity(internalIntent)
            }
        } finally {
            finish()
        }
    }
}

