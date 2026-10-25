package com.sahilmulla.pocketflow.quickadd

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.text.TextUtils
import androidx.core.app.NotificationManagerCompat
import com.facebook.react.bridge.*

class PocketflowQuickAddModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        private var instance: PocketflowQuickAddModule? = null

        fun emitPipModeChanged(isInPip: Boolean) {
            try {
                instance?.reactApplicationContext
                    ?.getJSModule(com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    ?.emit("onPictureInPictureModeChanged", isInPip)
            } catch (e: Exception) {
                // ignore
            }
        }
    }

    init {
        instance = this
    }

    override fun getName(): String = "PocketflowQuickAdd"

    @ReactMethod
    fun isAccessibilityServiceEnabled(promise: Promise) {
        try {
            val context = reactApplicationContext
            val enabledServices = Settings.Secure.getString(
                context.contentResolver,
                Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
            )

            if (enabledServices.isNullOrEmpty()) {
                promise.resolve(false)
                return
            }

            val colonSplitter = TextUtils.SimpleStringSplitter(':')
            colonSplitter.setString(enabledServices)
            val expectedFullName = "${context.packageName}/${QuickAddAccessibilityService::class.java.name}"
            val expectedShortName = "${context.packageName}/.quickadd.QuickAddAccessibilityService"

            var isEnabled = false
            while (colonSplitter.hasNext()) {
                val componentName = colonSplitter.next()
                if (componentName.equals(expectedFullName, ignoreCase = true) ||
                    componentName.equals(expectedShortName, ignoreCase = true)) {
                    isEnabled = true
                    break
                }
            }
            promise.resolve(isEnabled)
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun openAccessibilitySettings(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            reactApplicationContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("A11Y_SETTINGS_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun isNotificationListenerEnabled(promise: Promise) {
        try {
            val context = reactApplicationContext
            val isEnabled = NotificationManagerCompat.getEnabledListenerPackages(context)
                .contains(context.packageName)
            promise.resolve(isEnabled)
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun openNotificationListenerSettings(promise: Promise) {
        try {
            val context = reactApplicationContext
            val intent = Intent("android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS").apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            if (intent.resolveActivity(context.packageManager) != null) {
                context.startActivity(intent)
                promise.resolve(true)
            } else {
                val appSettingsIntent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                    data = Uri.fromParts("package", context.packageName, null)
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                context.startActivity(appSettingsIntent)
                promise.resolve(true)
            }
        } catch (e: Exception) {
            try {
                val fallbackIntent = Intent(Settings.ACTION_SETTINGS).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                reactApplicationContext.startActivity(fallbackIntent)
                promise.resolve(true)
            } catch (ex: Exception) {
                promise.reject("NOTIFICATION_LISTENER_SETTINGS_ERROR", ex.message, ex)
            }
        }
    }

    @ReactMethod
    fun openAppDetailsSettings(promise: Promise) {
        try {
            val context = reactApplicationContext
            val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                data = Uri.fromParts("package", context.packageName, null)
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("APP_DETAILS_SETTINGS_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun openQuickAddForDetectedPayment(
        amount: String,
        merchant: String,
        reference: String,
        promise: Promise
    ) {
        try {
            val intent = Intent(reactApplicationContext, QuickAddActivity::class.java).apply {
                action = Intent.ACTION_VIEW
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                putExtra("source", "upi_detected")
                putExtra("amount", amount)
                putExtra("merchant", merchant)
                putExtra("reference", reference)
            }
            reactApplicationContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("QUICK_ADD_LAUNCH_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun isPictureInPictureSupported(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val hasPip = reactApplicationContext.packageManager.hasSystemFeature(
                    android.content.pm.PackageManager.FEATURE_PICTURE_IN_PICTURE
                )
                promise.resolve(hasPip)
            } else {
                promise.resolve(false)
            }
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun isInPictureInPictureMode(promise: Promise) {
        try {
            val activity = reactApplicationContext.currentActivity
            if (activity != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                promise.resolve(activity.isInPictureInPictureMode)
            } else {
                promise.resolve(false)
            }
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun enterPictureInPicture(aspectRatioNum: Int, aspectRatioDen: Int, promise: Promise) {
        try {
            val activity = reactApplicationContext.currentActivity
            if (activity == null) {
                promise.reject("PIP_NO_ACTIVITY", "Current activity is null")
                return
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val rational = android.util.Rational(
                    if (aspectRatioNum > 0) aspectRatioNum else 9,
                    if (aspectRatioDen > 0) aspectRatioDen else 16
                )
                val params = android.app.PictureInPictureParams.Builder()
                    .setAspectRatio(rational)
                    .build()
                val entered = activity.enterPictureInPictureMode(params)
                promise.resolve(entered)
            } else {
                promise.reject("PIP_UNSUPPORTED", "Picture in Picture requires Android 8.0+")
            }
        } catch (e: Exception) {
            promise.reject("PIP_ERROR", e.message, e)
        }
    }
}

