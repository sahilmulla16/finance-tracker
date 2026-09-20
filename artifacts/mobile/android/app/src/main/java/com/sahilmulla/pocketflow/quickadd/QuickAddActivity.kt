package com.sahilmulla.pocketflow.quickadd

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.res.Configuration
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.text.Editable
import android.text.TextWatcher
import android.util.Log
import android.util.TypedValue
import android.view.Gravity
import android.view.HapticFeedbackConstants
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.view.inputmethod.EditorInfo
import android.view.inputmethod.InputMethodManager
import android.widget.EditText
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.sahilmulla.pocketflow.R
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class QuickAddActivity : AppCompatActivity() {

    companion object {
        private const val TAG = "QuickAddActivity"
        private const val NOTIF_CHANNEL_ID = "pocketflow_expenses"
    }

    private enum class PopupState {
        AMOUNT, DESCRIPTION, CATEGORY, SAVING, SUCCESS, ERROR_SAVE
    }

    private var currentState = PopupState.AMOUNT
    private var enteredAmount = ""
    private var enteredDescription = ""
    private var accounts: List<QuickAccount> = emptyList()
    private var categories: List<QuickCategory> = emptyList()
    private var defaultAccount: QuickAccount? = null
    private var currencySymbol = "₹"
    private val handler = Handler(Looper.getMainLooper())

    // Containers
    private lateinit var amountContainer: LinearLayout
    private lateinit var descriptionContainer: LinearLayout
    private lateinit var categoryContainer: LinearLayout

    // Amount Views
    private lateinit var amountInput: EditText
    private lateinit var amountErrorText: TextView
    private lateinit var amountClearBtn: TextView
    private lateinit var amountDoneBtn: TextView
    private lateinit var amountCancelBtn: TextView

    // Description Views
    private lateinit var descriptionInput: EditText
    private lateinit var descClearBtn: TextView
    private lateinit var descDoneBtn: TextView
    private lateinit var descCancelBtn: TextView

    // Category Views
    private lateinit var categoryList: LinearLayout
    private lateinit var categoryLoading: TextView
    private lateinit var categoryError: TextView

    private val isDarkMode: Boolean
        get() {
            val appPref = StorageHelper.getAppearance(this)
            return when (appPref) {
                "dark" -> true
                "light" -> false
                else -> (resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES
            }
        }

    private fun dpToPx(dp: Int): Int {
        return TypedValue.applyDimension(
            TypedValue.COMPLEX_UNIT_DIP,
            dp.toFloat(),
            resources.displayMetrics
        ).toInt()
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Show over lock screen
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
        } else {
            @Suppress("DEPRECATION")
            window.addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
            )
        }

        // Transparent background
        window.setBackgroundDrawableResource(android.R.color.transparent)
        window.setLayout(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
        window.setGravity(Gravity.TOP)

        // Root layout
        val rootLayout = FrameLayout(this).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            setBackgroundColor(Color.TRANSPARENT)
        }

        // Soft blurred/dimmed backdrop
        val dimView = View(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            setBackgroundColor(if (isDarkMode) Color.parseColor("#88000000") else Color.parseColor("#44000000"))
            setOnClickListener { dismissWithError() }
        }
        rootLayout.addView(dimView)

        val inflater = LayoutInflater.from(this)

        // 1. Amount Container
        amountContainer = inflater.inflate(R.layout.popup_quick_add_amount, rootLayout, false) as LinearLayout
        amountContainer.visibility = View.VISIBLE
        amountContainer.isClickable = true
        amountContainer.isFocusable = true

        // 2. Description Container
        descriptionContainer = inflater.inflate(R.layout.popup_quick_add_description, rootLayout, false) as LinearLayout
        descriptionContainer.visibility = View.GONE
        descriptionContainer.isClickable = true
        descriptionContainer.isFocusable = true

        // 3. Category Container
        categoryContainer = inflater.inflate(R.layout.popup_quick_add_category, rootLayout, false) as LinearLayout
        categoryContainer.visibility = View.GONE
        categoryContainer.isClickable = true
        categoryContainer.isFocusable = true

        // Proportional iOS floating sheet width (90% width, max 390dp)
        val screenWidth = resources.displayMetrics.widthPixels
        val cardWidth = (screenWidth - dpToPx(28)).coerceAtMost(dpToPx(390))
        val topMarginPx = dpToPx(52)

        val layoutParamsGenerator = {
            FrameLayout.LayoutParams(cardWidth, FrameLayout.LayoutParams.WRAP_CONTENT).apply {
                gravity = Gravity.TOP or Gravity.CENTER_HORIZONTAL
                topMargin = topMarginPx
            }
        }

        rootLayout.addView(amountContainer, layoutParamsGenerator())
        rootLayout.addView(descriptionContainer, layoutParamsGenerator())
        rootLayout.addView(categoryContainer, layoutParamsGenerator())

        setContentView(rootLayout)

        // Initialize view references
        initAmountViews()
        initDescriptionViews()
        initCategoryViews()

        // Apply theme (Light / Dark)
        applyIosTheme()

        // Load data in background
        loadData()

        // Auto-focus amount input
        amountInput.requestFocus()
        handler.postDelayed({
            val imm = getSystemService(Context.INPUT_METHOD_SERVICE) as? InputMethodManager
            imm?.showSoftInput(amountInput, InputMethodManager.SHOW_IMPLICIT)
        }, 150)
    }

    private fun initAmountViews() {
        amountInput = amountContainer.findViewById(R.id.amountInput)
        amountErrorText = amountContainer.findViewById(R.id.amountError)
        amountClearBtn = amountContainer.findViewById(R.id.amountClearBtn)
        amountDoneBtn = amountContainer.findViewById(R.id.doneButton)
        amountCancelBtn = amountContainer.findViewById(R.id.cancelButton)

        amountClearBtn.setOnClickListener {
            amountInput.setText("")
        }

        amountCancelBtn.setOnClickListener {
            dismissWithError()
        }

        amountDoneBtn.setOnClickListener {
            onAmountDone()
        }

        amountInput.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
            override fun afterTextChanged(s: Editable?) {
                enteredAmount = s?.toString() ?: ""
                amountErrorText.visibility = View.GONE
                amountClearBtn.visibility = if (enteredAmount.isNotEmpty()) View.VISIBLE else View.GONE
            }
        })

        amountInput.setOnEditorActionListener { _, actionId, _ ->
            if (actionId == EditorInfo.IME_ACTION_NEXT || actionId == EditorInfo.IME_ACTION_DONE) {
                onAmountDone()
                true
            } else {
                false
            }
        }
    }

    private fun initDescriptionViews() {
        descriptionInput = descriptionContainer.findViewById(R.id.descriptionInput)
        descClearBtn = descriptionContainer.findViewById(R.id.descClearBtn)
        descDoneBtn = descriptionContainer.findViewById(R.id.doneButton)
        descCancelBtn = descriptionContainer.findViewById(R.id.cancelButton)

        descClearBtn.setOnClickListener {
            descriptionInput.setText("")
        }

        descCancelBtn.setOnClickListener {
            dismissWithError()
        }

        descDoneBtn.setOnClickListener {
            onDescriptionDone()
        }

        descriptionInput.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
            override fun afterTextChanged(s: Editable?) {
                enteredDescription = s?.toString() ?: ""
                descClearBtn.visibility = if (enteredDescription.isNotEmpty()) View.VISIBLE else View.GONE
            }
        })

        descriptionInput.setOnEditorActionListener { _, actionId, _ ->
            if (actionId == EditorInfo.IME_ACTION_DONE) {
                onDescriptionDone()
                true
            } else {
                false
            }
        }
    }

    private fun initCategoryViews() {
        categoryList = categoryContainer.findViewById(R.id.categoryList)
        categoryLoading = categoryContainer.findViewById(R.id.loadingText)
        categoryError = categoryContainer.findViewById(R.id.categoryError)
    }

    private fun onAmountDone() {
        val amountStr = enteredAmount.trim()
        if (amountStr.isEmpty()) {
            amountErrorText.text = "Please enter an amount"
            amountErrorText.visibility = View.VISIBLE
            return
        }

        val amount = amountStr.toDoubleOrNull()
        if (amount == null || amount <= 0) {
            amountErrorText.text = "Please enter a valid amount"
            amountErrorText.visibility = View.VISIBLE
            return
        }

        window.decorView.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)

        // Transition from Amount -> Description
        currentState = PopupState.DESCRIPTION
        transitionViews(amountContainer, descriptionContainer) {
            descriptionInput.requestFocus()
            val imm = getSystemService(Context.INPUT_METHOD_SERVICE) as? InputMethodManager
            imm?.showSoftInput(descriptionInput, InputMethodManager.SHOW_IMPLICIT)
        }
    }

    private fun onDescriptionDone() {
        window.decorView.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)

        // Hide keyboard when transitioning to category list
        val imm = getSystemService(Context.INPUT_METHOD_SERVICE) as? InputMethodManager
        imm?.hideSoftInputFromWindow(descriptionInput.windowToken, 0)

        // Transition from Description -> Category
        currentState = PopupState.CATEGORY
        transitionViews(descriptionContainer, categoryContainer) {
            renderCategoryList()
        }
    }

    private fun transitionViews(fromView: View, toView: View, onComplete: (() -> Unit)? = null) {
        fromView.animate()
            .alpha(0f)
            .scaleX(0.96f)
            .scaleY(0.96f)
            .setDuration(120)
            .withEndAction {
                fromView.visibility = View.GONE
                toView.alpha = 0f
                toView.scaleX = 0.96f
                toView.scaleY = 0.96f
                toView.visibility = View.VISIBLE
                toView.animate()
                    .alpha(1f)
                    .scaleX(1f)
                    .scaleY(1f)
                    .setDuration(160)
                    .withEndAction {
                        onComplete?.invoke()
                    }
                    .start()
            }
            .start()
    }

    private fun loadData() {
        categoryLoading.visibility = View.VISIBLE
        categoryList.visibility = View.GONE
        categoryError.visibility = View.GONE

        CoroutineScope(Dispatchers.IO).launch {
            val config = StorageHelper.getQuickAddConfig(this@QuickAddActivity)
            val loadedAccounts = StorageHelper.getAccounts(this@QuickAddActivity)
            val loadedCategories = StorageHelper.getExpenseCategories(this@QuickAddActivity)
            val safeCategories = if (loadedCategories.isNotEmpty()) loadedCategories else StorageHelper.DEFAULT_CATEGORIES
            val loadedDefault = if (!config.defaultAccountId.isNullOrEmpty()) {
                loadedAccounts.find { it.id == config.defaultAccountId } ?: StorageHelper.getDefaultAccount(this@QuickAddActivity)
            } else {
                StorageHelper.getDefaultAccount(this@QuickAddActivity)
            }
            val symbol = StorageHelper.getCurrencySymbol(this@QuickAddActivity)

            withContext(Dispatchers.Main) {
                accounts = loadedAccounts
                categories = safeCategories
                defaultAccount = loadedDefault
                currencySymbol = symbol

                val currView = amountContainer.findViewById<TextView>(R.id.currencySymbol)
                currView?.text = currencySymbol

                categoryLoading.visibility = View.GONE
                categoryList.visibility = View.VISIBLE
                renderCategoryList()
            }
        }
    }

    private fun renderCategoryList() {
        categoryList.removeAllViews()

        val listToRender = if (categories.isNotEmpty()) categories else StorageHelper.DEFAULT_CATEGORIES
        categories = listToRender

        categoryLoading.visibility = View.GONE
        categoryList.visibility = View.VISIBLE
        categoryError.visibility = View.GONE

        val textColor = if (isDarkMode) Color.parseColor("#FFFFFF") else Color.parseColor("#000000")
        val dividerColor = if (isDarkMode) Color.parseColor("#38383A") else Color.parseColor("#E5E5EA")

        for ((index, category) in listToRender.withIndex()) {
            val itemView = LayoutInflater.from(this).inflate(R.layout.item_category, categoryList, false)
            val nameView = itemView.findViewById<TextView>(R.id.categoryName)
            val dividerView = itemView.findViewById<View>(R.id.itemDivider)

            nameView.text = category.name
            nameView.setTextColor(textColor)
            dividerView.setBackgroundColor(dividerColor)

            // Hide divider on last item
            if (index == listToRender.size - 1) {
                dividerView.visibility = View.GONE
            }

            itemView.setOnClickListener {
                onCategorySelected(category)
            }

            categoryList.addView(itemView)
        }
    }

    private fun onCategorySelected(category: QuickCategory) {
        window.decorView.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
        currentState = PopupState.SAVING

        val amount = enteredAmount.trim().toDoubleOrNull() ?: return
        val account = defaultAccount ?: StorageHelper.DEFAULT_ACCOUNTS.first()
        val desc = enteredDescription.trim()

        val now = QuickTransaction.now()
        val transaction = QuickTransaction(
            id = QuickTransaction.generateId(),
            type = "EXPENSE",
            amount = amount,
            description = desc,
            category = category.name,
            categoryId = category.id,
            accountId = account.id,
            date = QuickTransaction.todayDate(),
            time = QuickTransaction.currentTime(),
            createdAt = now,
            updatedAt = now
        )

        CoroutineScope(Dispatchers.IO).launch {
            val success = StorageHelper.saveTransaction(this@QuickAddActivity, transaction)

            // Record notification for in-app display
            val amountFormatted = "$currencySymbol${"%.2f".format(amount).replace(".00", "")}"
            val notifMessage = if (desc.isNotEmpty()) {
                "$amountFormatted spent on ${category.name} ($desc)"
            } else {
                "$amountFormatted spent on ${category.name}"
            }
            StorageHelper.saveNotification(
                this@QuickAddActivity,
                "Your expenses have been tracked!",
                notifMessage
            )

            withContext(Dispatchers.Main) {
                if (success) {
                    // Dispatch Android system banner notification
                    dispatchSystemNotification(amount, category.name, desc)
                    showSuccess()
                } else {
                    showSaveError()
                }
            }
        }
    }

    private fun dispatchSystemNotification(amount: Double, categoryName: String, description: String) {
        try {
            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val channel = NotificationChannel(
                    NOTIF_CHANNEL_ID,
                    "Expense Tracking",
                    NotificationManager.IMPORTANCE_HIGH
                ).apply {
                    this.description = "Notifications for tracked expenses"
                    enableLights(true)
                }
                notificationManager.createNotificationChannel(channel)
            }

            val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
            val pendingIntent = if (launchIntent != null) {
                PendingIntent.getActivity(
                    this,
                    0,
                    launchIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT or (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
                )
            } else null

            val amountFormatted = "$currencySymbol${"%.2f".format(amount).replace(".00", "")}"
            val subText = if (description.isNotBlank()) {
                "$amountFormatted for $categoryName • $description"
            } else {
                "$amountFormatted for $categoryName"
            }

            val notification = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                Notification.Builder(this, NOTIF_CHANNEL_ID)
            } else {
                @Suppress("DEPRECATION")
                Notification.Builder(this)
            }.apply {
                setContentTitle("Your expenses have been tracked!")
                setContentText(subText)
                setSmallIcon(R.mipmap.ic_launcher)
                setAutoCancel(true)
                if (pendingIntent != null) {
                    setContentIntent(pendingIntent)
                }
            }.build()

            notificationManager.notify(System.currentTimeMillis().toInt(), notification)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to dispatch system notification", e)
        }
    }

    private fun showSuccess() {
        currentState = PopupState.SUCCESS
        categoryContainer.animate()
            .alpha(0f)
            .scaleX(0.96f)
            .scaleY(0.96f)
            .setDuration(150)
            .withEndAction {
                categoryContainer.visibility = View.GONE
                finish()
            }
            .start()
    }

    private fun showSaveError() {
        currentState = PopupState.ERROR_SAVE
        categoryError.text = "Could not save expense. Please retry."
        categoryError.visibility = View.VISIBLE
    }

    private fun dismissWithError() {
        val imm = getSystemService(Context.INPUT_METHOD_SERVICE) as? InputMethodManager
        imm?.hideSoftInputFromWindow(window.decorView.windowToken, 0)

        window.decorView.animate()
            .alpha(0f)
            .translationY(-dpToPx(24).toFloat())
            .setDuration(150)
            .withEndAction { finish() }
            .start()
    }

    private fun applyIosTheme() {
        // Color palette based on Light vs Dark
        val sheetBgColor: Int
        val sheetBorderColor: Int
        val inputBoxColor: Int
        val primaryTextColor: Int
        val secondaryTextColor: Int
        val placeholderColor: Int
        val cancelBtnBgColor: Int
        val cancelBtnTextColor: Int
        val doneBtnBgColor: Int
        val dividerColor: Int
        val clearBtnBgColor: Int

        if (isDarkMode) {
            // iOS Dark Glass / Black & Gray
            sheetBgColor = Color.parseColor("#1C1C1E")
            sheetBorderColor = Color.parseColor("#38383A")
            inputBoxColor = Color.parseColor("#2C2C2E")
            primaryTextColor = Color.parseColor("#FFFFFF")
            secondaryTextColor = Color.parseColor("#8E8E93")
            placeholderColor = Color.parseColor("#636366")
            cancelBtnBgColor = Color.parseColor("#2C2C2E")
            cancelBtnTextColor = Color.parseColor("#FFFFFF")
            doneBtnBgColor = Color.parseColor("#0A84FF")
            dividerColor = Color.parseColor("#38383A")
            clearBtnBgColor = Color.parseColor("#636366")
        } else {
            // iOS Light Translucent Sheet (matching Screenshots 1, 2, 3)
            sheetBgColor = Color.parseColor("#F2F2F7")
            sheetBorderColor = Color.parseColor("#D1D1D6")
            inputBoxColor = Color.parseColor("#FFFFFF")
            primaryTextColor = Color.parseColor("#000000")
            secondaryTextColor = Color.parseColor("#6C6C70")
            placeholderColor = Color.parseColor("#C7C7CC")
            cancelBtnBgColor = Color.parseColor("#E5E5EA")
            cancelBtnTextColor = Color.parseColor("#000000")
            doneBtnBgColor = Color.parseColor("#007AFF")
            dividerColor = Color.parseColor("#D1D1D6")
            clearBtnBgColor = Color.parseColor("#8E8E93")
        }

        // Apply to Amount Container
        styleContainer(amountContainer, sheetBgColor, sheetBorderColor)
        amountContainer.findViewById<View>(R.id.inputContainer)?.let { box ->
            (box.background?.mutate() as? GradientDrawable)?.setColor(inputBoxColor)
        }
        amountContainer.findViewById<TextView>(R.id.stepLabel)?.setTextColor(secondaryTextColor)
        amountContainer.findViewById<TextView>(R.id.currencySymbol)?.setTextColor(secondaryTextColor)
        amountInput.setTextColor(primaryTextColor)
        amountInput.setHintTextColor(placeholderColor)
        amountClearBtn.let { btn ->
            (btn.background?.mutate() as? GradientDrawable)?.setColor(clearBtnBgColor)
        }
        amountCancelBtn.let { btn ->
            (btn.background?.mutate() as? GradientDrawable)?.setColor(cancelBtnBgColor)
            btn.setTextColor(cancelBtnTextColor)
        }
        amountDoneBtn.let { btn ->
            (btn.background?.mutate() as? GradientDrawable)?.setColor(doneBtnBgColor)
        }

        // Apply to Description Container
        styleContainer(descriptionContainer, sheetBgColor, sheetBorderColor)
        descriptionContainer.findViewById<View>(R.id.inputContainer)?.let { box ->
            (box.background?.mutate() as? GradientDrawable)?.setColor(inputBoxColor)
        }
        descriptionContainer.findViewById<TextView>(R.id.stepLabel)?.setTextColor(secondaryTextColor)
        descriptionInput.setTextColor(primaryTextColor)
        descriptionInput.setHintTextColor(placeholderColor)
        descClearBtn.let { btn ->
            (btn.background?.mutate() as? GradientDrawable)?.setColor(clearBtnBgColor)
        }
        descCancelBtn.let { btn ->
            (btn.background?.mutate() as? GradientDrawable)?.setColor(cancelBtnBgColor)
            btn.setTextColor(cancelBtnTextColor)
        }
        descDoneBtn.let { btn ->
            (btn.background?.mutate() as? GradientDrawable)?.setColor(doneBtnBgColor)
        }

        // Apply to Category Container
        styleContainer(categoryContainer, sheetBgColor, sheetBorderColor)
        categoryContainer.findViewById<TextView>(R.id.stepLabel)?.setTextColor(secondaryTextColor)
        categoryContainer.findViewById<View>(R.id.topDivider)?.setBackgroundColor(dividerColor)
    }

    private fun styleContainer(container: LinearLayout, bgColor: Int, borderColor: Int) {
        (container.background?.mutate() as? GradientDrawable)?.let { gd ->
            gd.setColor(bgColor)
            gd.setStroke(dpToPx(1), borderColor)
        }
    }

    @Suppress("DEPRECATION")
    override fun onBackPressed() {
        when (currentState) {
            PopupState.DESCRIPTION -> {
                currentState = PopupState.AMOUNT
                transitionViews(descriptionContainer, amountContainer) {
                    amountInput.requestFocus()
                }
            }
            PopupState.CATEGORY -> {
                currentState = PopupState.DESCRIPTION
                transitionViews(categoryContainer, descriptionContainer) {
                    descriptionInput.requestFocus()
                }
            }
            else -> {
                dismissWithError()
            }
        }
    }
}
