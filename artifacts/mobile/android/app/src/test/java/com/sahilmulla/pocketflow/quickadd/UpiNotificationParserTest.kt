package com.sahilmulla.pocketflow.quickadd

import org.junit.Assert.*
import org.junit.Test

class UpiNotificationParserTest {

    private val now = 1710000000000L

    // BANK SMS NOTIFICATION TESTS (Android Messages & Supported SMS apps)

    @Test
    fun testBankOfMaharashtra_ExactDebitSms() {
        val result = UpiNotificationParser.parse(
            packageName = "com.google.android.apps.messaging",
            title = "VK-MAHABK",
            text = "A/c X8572 debited by Rs. 1.00 for UPI payment to RAEESA MULLA on 11-Oct-26. RRN: 628547285912 -Bank of Maharashtra",
            bigText = null,
            postTime = now
        )
        assertNotNull(result)
        assertEquals(1.0, result!!.amount, 0.001)
        assertEquals("RAEESA MULLA", result.merchant)
        assertEquals("628547285912", result.reference)
        assertEquals("com.google.android.apps.messaging", result.packageName)
        assertEquals("Bank of Maharashtra", result.bankName)
        assertEquals("8572", result.accountSuffix)
        assertEquals("EXPENSE", result.direction)
        assertEquals("11-Oct-26", result.dateText)
    }

    @Test
    fun testBankOfMaharashtra_PromptExample_RvTraders() {
        val result = UpiNotificationParser.parse(
            packageName = "com.google.android.apps.messaging",
            title = "VK-MAHABK",
            text = "A/c X8572 debited by Rs. 1.00 for UPI payment to RV TRADERS on 11-Oct-26. - Bank of Maharashtra",
            bigText = null,
            postTime = now
        )
        assertNotNull(result)
        assertEquals(1.0, result!!.amount, 0.001)
        assertEquals("RV TRADERS", result.merchant)
        assertEquals("Bank of Maharashtra", result.bankName)
        assertEquals("8572", result.accountSuffix)
        assertEquals("EXPENSE", result.direction)
    }

    @Test
    fun testBankOfMaharashtra_WithoutDate() {
        val result = UpiNotificationParser.parse(
            packageName = "com.google.android.apps.messaging",
            title = "JM-MAHABK",
            text = "A/c X8572 debited by Rs. 1.00 for UPI payment to RAEESA MULLA. RRN: 628547285912 -Bank of Maharashtra",
            bigText = null,
            postTime = now
        )
        assertNotNull(result)
        assertEquals(1.0, result!!.amount, 0.001)
        assertEquals("RAEESA MULLA", result.merchant)
        assertEquals("628547285912", result.reference)
    }

    @Test
    fun testBankOfMaharashtra_WithDifferentMerchantAndDecimal() {
        val result = UpiNotificationParser.parse(
            packageName = "com.google.android.apps.messaging",
            title = "VK-MAHABK",
            text = "A/c X8572 debited by Rs. 249.50 for UPI payment to SWIGGY on 11-Oct-26. RRN: 987654321012 -Bank of Maharashtra",
            bigText = null,
            postTime = now
        )
        assertNotNull(result)
        assertEquals(249.50, result!!.amount, 0.001)
        assertEquals("SWIGGY", result.merchant)
        assertEquals("987654321012", result.reference)
    }

    @Test
    fun testSbi_DualDebitAndCreditedToRecipient() {
        val result = UpiNotificationParser.parse(
            packageName = "com.google.android.apps.messaging",
            title = "BP-SBIINB",
            text = "Your a/c no. XXXXXXXX1234 is debited for Rs.1,500.00 on 11-10-2026 and credited to Ramesh Kumar (UPI Ref no 123456789012) -SBI",
            bigText = null,
            postTime = now
        )
        assertNotNull(result)
        assertEquals(1500.0, result!!.amount, 0.001)
        assertEquals("Ramesh Kumar", result.merchant)
        assertEquals("123456789012", result.reference)
    }

    @Test
    fun testHdfc_BankSmsDebit() {
        val result = UpiNotificationParser.parse(
            packageName = "com.google.android.apps.messaging",
            title = "AD-HDFCBK",
            text = "Dear Customer, Rs. 450.00 has been debited from account **1234 to SWIGGY on 11-OCT-26 via UPI txn# 123456789012. Avl bal: Rs 5,432.10 - HDFC Bank",
            bigText = null,
            postTime = now
        )
        assertNotNull(result)
        assertEquals(450.0, result!!.amount, 0.001)
        assertEquals("SWIGGY", result.merchant)
        assertEquals("123456789012", result.reference)
    }

    @Test
    fun testAxis_BankSmsDebit() {
        val result = UpiNotificationParser.parse(
            packageName = "com.google.android.apps.messaging",
            title = "VM-AXISBK",
            text = "Rs. 200.00 debited from Axis Bank A/c no. XX1234 on 11-10-26 to ZOMATO. UPI ref 123456789012. Call 1800... if not you.",
            bigText = null,
            postTime = now
        )
        assertNotNull(result)
        assertEquals(200.0, result!!.amount, 0.001)
        assertEquals("ZOMATO", result.merchant)
        assertEquals("123456789012", result.reference)
    }

    @Test
    fun testCanara_BankSmsDebit() {
        val result = UpiNotificationParser.parse(
            packageName = "com.google.android.apps.messaging",
            title = "CANBNK",
            text = "Your A/C ending 1234 is debited by Rs. 80.00 on 11-10-2026 for UPI to CHAI POINT Ref 123456789012.",
            bigText = null,
            postTime = now
        )
        assertNotNull(result)
        assertEquals(80.0, result!!.amount, 0.001)
        assertEquals("CHAI POINT", result.merchant)
        assertEquals("123456789012", result.reference)
    }

    @Test
    fun testUnionBank_BeneficiaryTag() {
        val result = UpiNotificationParser.parse(
            packageName = "com.google.android.apps.messaging",
            title = "UBIOIN",
            text = "Dear Customer, A/c XX4321 debited for Rs.100.00 on 11/10/26 through UPI. Beneficiary: AMAZON. Bal: Rs 1500.",
            bigText = null,
            postTime = now
        )
        assertNotNull(result)
        assertEquals(100.0, result!!.amount, 0.001)
        assertEquals("AMAZON", result.merchant)
    }

    @Test
    fun testSmsOrganizer_SupportedApp() {
        val result = UpiNotificationParser.parse(
            packageName = "com.microsoft.android.smsorganizer",
            title = "Bank of Maharashtra",
            text = "A/c X8572 debited by Rs. 50.00 for UPI payment to RAEESA MULLA on 11-Oct-26. RRN: 628547285912 -Bank of Maharashtra",
            bigText = null,
            postTime = now
        )
        assertNotNull(result)
        assertEquals(50.0, result!!.amount, 0.001)
        assertEquals("RAEESA MULLA", result.merchant)
    }

    // DIRECT UPI APP TESTS

    @Test
    fun testGooglePay_PaidExpense() {
        val result = UpiNotificationParser.parse(
            packageName = "com.google.android.apps.nbu.paisa.user",
            title = "Google Pay",
            text = "Paid ₹450.00 to Starbucks Coffee",
            bigText = null,
            postTime = now
        )
        assertNotNull(result)
        assertEquals(450.0, result!!.amount, 0.001)
        assertEquals("Starbucks Coffee", result.merchant)
    }

    @Test
    fun testGooglePay_WithVpaHandleAndRef() {
        val result = UpiNotificationParser.parse(
            packageName = "com.google.android.apps.nbu.paisa.user",
            title = "Google Pay",
            text = "You paid ₹1,250.50 to swiggy.orders@icici. UPI transaction ID: 412345678901",
            bigText = null,
            postTime = now
        )
        assertNotNull(result)
        assertEquals(1250.50, result!!.amount, 0.001)
        assertEquals("Swiggy Orders", result.merchant)
        assertEquals("412345678901", result.reference)
    }

    @Test
    fun testGooglePay_GooglePlayPurchase() {
        val result = UpiNotificationParser.parse(
            packageName = "com.google.android.apps.nbu.paisa.user",
            title = "Google Pay",
            text = "Paid ₹29.00 to Google Play using State Bank of India",
            bigText = null,
            postTime = now
        )
        assertNotNull(result)
        assertEquals(29.0, result!!.amount, 0.001)
        assertEquals("Google Play", result.merchant)
    }

    @Test
    fun testGooglePay_WithRuPayCreditCard() {
        val result = UpiNotificationParser.parse(
            packageName = "com.google.android.apps.nbu.paisa.user",
            title = "Google Pay",
            text = "Paid ₹120.00 to Chai Point using RuPay Credit Card",
            bigText = null,
            postTime = now
        )
        assertNotNull(result)
        assertEquals(120.0, result!!.amount, 0.001)
        assertEquals("Chai Point", result.merchant)
    }

    @Test
    fun testGooglePlayStore_OrderReceipt() {
        val result = UpiNotificationParser.parse(
            packageName = "com.android.vending",
            title = "Google Play",
            text = "Your order of ₹29.00 was successful",
            bigText = null,
            postTime = now
        )
        assertNotNull(result)
        assertEquals(29.0, result!!.amount, 0.001)
        assertEquals("Google Play", result.merchant)
    }

    @Test
    fun testGooglePay_PaymentWasSuccessful() {
        val result = UpiNotificationParser.parse(
            packageName = "com.google.android.apps.nbu.paisa.user",
            title = "Google Pay",
            text = "Payment of ₹150 to Zomato was successful",
            bigText = null,
            postTime = now
        )
        assertNotNull(result)
        assertEquals(150.0, result!!.amount, 0.001)
        assertEquals("Zomato", result.merchant)
    }

    @Test
    fun testPhonePe_PaidWithUtr() {
        val result = UpiNotificationParser.parse(
            packageName = "com.phonepe.app",
            title = "PhonePe",
            text = "Paid ₹85 to Chai Point. Debited from A/c XX1234. UTR: 432109876543",
            bigText = null,
            postTime = now
        )
        assertNotNull(result)
        assertEquals(85.0, result!!.amount, 0.001)
        assertEquals("Chai Point", result.merchant)
        assertEquals("432109876543", result.reference)
    }

    @Test
    fun testPaytm_PaidExpense() {
        val result = UpiNotificationParser.parse(
            packageName = "net.one97.paytm",
            title = "Paytm",
            text = "Paid ₹2,500 successfully to Decathlon Sports",
            bigText = null,
            postTime = now
        )
        assertNotNull(result)
        assertEquals(2500.0, result!!.amount, 0.001)
        assertEquals("Decathlon Sports", result.merchant)
    }

    @Test
    fun testCred_PaidExpense() {
        val result = UpiNotificationParser.parse(
            packageName = "com.dreamplug.androidapp",
            title = "CRED",
            text = "₹3,400 paid to Zomato using CRED UPI",
            bigText = null,
            postTime = now
        )
        assertNotNull(result)
        assertEquals(3400.0, result!!.amount, 0.001)
        assertEquals("Zomato", result.merchant)
    }

    @Test
    fun testHdfc_BankDebit() {
        val result = UpiNotificationParser.parse(
            packageName = "com.snapwork.hdfc",
            title = "HDFC Bank Alert",
            text = "A/c *1234 debited for Rs 780.00 on 11-Oct-26 towards UPI/P2M/Zepto/HDFC.",
            bigText = null,
            postTime = now
        )
        assertNotNull(result)
        assertEquals(780.0, result!!.amount, 0.001)
        assertEquals("Zepto", result.merchant)
    }

    @Test
    fun testIcici_BankDebit() {
        val result = UpiNotificationParser.parse(
            packageName = "com.csam.icici.bank.imobile",
            title = "iMobile Pay",
            text = "Dear Customer, Acct XX5678 is debited for Rs 320.00 on 11-Oct-26. Info: UPI/Apollo Pharmacy.",
            bigText = null,
            postTime = now
        )
        assertNotNull(result)
        assertEquals(320.0, result!!.amount, 0.001)
        assertEquals("Apollo Pharmacy", result.merchant)
    }

    @Test
    fun testSbi_BankDebit() {
        val result = UpiNotificationParser.parse(
            packageName = "com.sbi.lotusintouch",
            title = "SBI Alert",
            text = "Dear Customer, your A/c XX4321 has been debited by Rs 150.00 on 11Oct26 by transfer to BookMyShow. Ref 987654321012.",
            bigText = null,
            postTime = now
        )
        assertNotNull(result)
        assertEquals(150.0, result!!.amount, 0.001)
        assertEquals("BookMyShow", result.merchant)
        assertEquals("987654321012", result.reference)
    }

    // STRICT REJECTION TESTS (Must return null)

    @Test
    fun testReject_IncomingBankCreditSms() {
        val result = UpiNotificationParser.parse(
            packageName = "com.google.android.apps.messaging",
            title = "VK-MAHABK",
            text = "A/c X8572 credited with Rs. 100.00 on 11-Oct-26 by RAEESA MULLA. Avl Bal: Rs 10,000 -Bank of Maharashtra",
            bigText = null,
            postTime = now
        )
        assertNull("Incoming bank credit must never be recorded as expense", result)
    }

    @Test
    fun testReject_IncomingPaymentReceivedGPay() {
        val result = UpiNotificationParser.parse(
            packageName = "com.google.android.apps.nbu.paisa.user",
            title = "Google Pay",
            text = "Received ₹500 from Ramesh Kumar",
            bigText = null,
            postTime = now
        )
        assertNull("Incoming payment must never be recorded as expense", result)
    }

    @Test
    fun testReject_OtpSecurityCode() {
        val result = UpiNotificationParser.parse(
            packageName = "com.google.android.apps.messaging",
            title = "VK-MAHABK",
            text = "123456 is your OTP for UPI payment of Rs. 1.00 to RAEESA MULLA. Do not share OTP with anyone.",
            bigText = null,
            postTime = now
        )
        assertNull("OTP code must never be parsed as an expense", result)
    }

    @Test
    fun testReject_FailedBankDebitSms() {
        val result = UpiNotificationParser.parse(
            packageName = "com.google.android.apps.messaging",
            title = "VK-MAHABK",
            text = "UPI payment of Rs. 1.00 to RAEESA MULLA failed due to technical error. A/c not debited -Bank of Maharashtra",
            bigText = null,
            postTime = now
        )
        assertNull("Failed transaction must never be recorded as expense", result)
    }

    @Test
    fun testReject_NonFinancialPersonalSms() {
        val result = UpiNotificationParser.parse(
            packageName = "com.google.android.apps.messaging",
            title = "+919876543210",
            text = "Hey bro, let's catch up tomorrow at 5pm.",
            bigText = null,
            postTime = now
        )
        assertNull("Personal SMS must never be parsed as expense", result)
    }

    @Test
    fun testReject_AmbiguousSmsWithoutRecipient() {
        val result = UpiNotificationParser.parse(
            packageName = "com.google.android.apps.messaging",
            title = "+919876543210",
            text = "I debited Rs 100 from my wallet",
            bigText = null,
            postTime = now
        )
        assertNull("Ambiguous SMS without verified recipient must be rejected", result)
    }

    @Test
    fun testReject_PromotionalLoanSms() {
        val result = UpiNotificationParser.parse(
            packageName = "com.google.android.apps.messaging",
            title = "VK-MAHABK",
            text = "Get personal loan up to Rs. 5,00,000 at low EMI. Apply now on Mahamobile app -Bank of Maharashtra",
            bigText = null,
            postTime = now
        )
        assertNull("Promotional SMS must never be parsed as expense", result)
    }

    @Test
    fun testReject_Refund() {
        val result = UpiNotificationParser.parse(
            packageName = "com.phonepe.app",
            title = "PhonePe",
            text = "Refund of ₹249 from Swiggy credited to your bank account",
            bigText = null,
            postTime = now
        )
        assertNull("Refund must never be recorded as expense", result)
    }

    @Test
    fun testReject_FailedPayment() {
        val result = UpiNotificationParser.parse(
            packageName = "com.google.android.apps.nbu.paisa.user",
            title = "Google Pay",
            text = "Payment of ₹650 to Uber failed. Any amount debited will be refunded.",
            bigText = null,
            postTime = now
        )
        assertNull("Failed payment must never be recorded as expense", result)
    }

    @Test
    fun testReject_OtpSecurityCodeBank() {
        val result = UpiNotificationParser.parse(
            packageName = "com.snapwork.hdfc",
            title = "HDFC Bank",
            text = "Your OTP for transaction of Rs 500 at Amazon is 492810. Do not share OTP with anyone.",
            bigText = null,
            postTime = now
        )
        assertNull("OTP code must never be parsed as an expense", result)
    }

    @Test
    fun testReject_BillReminder() {
        val result = UpiNotificationParser.parse(
            packageName = "com.phonepe.app",
            title = "PhonePe",
            text = "Reminder: Your electricity bill of ₹1,420 is due tomorrow.",
            bigText = null,
            postTime = now
        )
        assertNull("Payment reminders must never be parsed as completed expenses", result)
    }

    @Test
    fun testPackageSupport() {
        // SMS Packages
        assertTrue(UpiNotificationParser.isSupportedPackage("com.google.android.apps.messaging"))
        assertTrue(UpiNotificationParser.isSupportedPackage("com.samsung.android.messaging"))
        assertTrue(UpiNotificationParser.isSupportedPackage("com.android.mms"))
        assertTrue(UpiNotificationParser.isSupportedPackage("com.microsoft.android.smsorganizer"))
        assertTrue(UpiNotificationParser.isSupportedPackage("com.custom.messaging"))
        assertTrue(UpiNotificationParser.isSmsPackage("com.google.android.apps.messaging"))

        // Payment Packages
        assertTrue(UpiNotificationParser.isSupportedPackage("com.google.android.apps.nbu.paisa.user"))
        assertTrue(UpiNotificationParser.isSupportedPackage("com.phonepe.app"))
        assertTrue(UpiNotificationParser.isSupportedPackage("net.one97.paytm"))
        assertTrue(UpiNotificationParser.isSupportedPackage("com.dreamplug.androidapp"))
        assertTrue(UpiNotificationParser.isSupportedPackage("in.amazon.mShop.android.shopping"))
        assertTrue(UpiNotificationParser.isSupportedPackage("com.android.vending"))

        // Unsupported Packages
        assertFalse(UpiNotificationParser.isSupportedPackage("com.whatsapp"))
        assertFalse(UpiNotificationParser.isSupportedPackage("com.instagram.android"))
    }
}
