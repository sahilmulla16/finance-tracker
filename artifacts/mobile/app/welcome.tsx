import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Animated,
  AppState,
  AppStateStatus,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Modal,
  NativeModules,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFinance, Currency, AccountType } from "@/context/FinanceContext";
import { useColors } from "@/hooks/useColors";
import { spacing, radius, fontSize, fontWeight } from "@/constants/tokens";
import { MascotGuide } from "@/components/MascotGuide";
import { preloadMascots } from "@/utils/mascotPreloader";
import { OnboardingProgress } from "@/components/OnboardingProgress";
import { AccessibilityDisclosureModal } from "@/components/AccessibilityDisclosureModal";
import { NotificationOnboardingStep } from "@/components/onboarding/NotificationOnboardingStep";
import { QuickAddOnboardingStep } from "@/components/onboarding/QuickAddOnboardingStep";
import { SmartAutoTrackOnboardingStep } from "@/components/onboarding/SmartAutoTrackOnboardingStep";
import {
  TutorialVideoModal,
  TutorialFeature,
} from "@/components/onboarding/TutorialVideoModal";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const CURRENCY_LIST: { code: Currency; symbol: string; label: string }[] = [
  { code: "INR", symbol: "₹", label: "₹ INR (Indian Rupee)" },
  { code: "USD", symbol: "$", label: "$ USD (US Dollar)" },
  { code: "EUR", symbol: "€", label: "€ EUR (Euro)" },
  { code: "GBP", symbol: "£", label: "£ GBP (British Pound)" },
  { code: "AED", symbol: "د.إ", label: "د.إ AED (UAE Dirham)" },
  { code: "CAD", symbol: "$", label: "$ CAD (Canadian Dollar)" },
  { code: "AUD", symbol: "$", label: "$ AUD (Australian Dollar)" },
  { code: "JPY", symbol: "¥", label: "¥ JPY (Japanese Yen)" },
];

const ACCOUNT_CHOICES: {
  type: AccountType;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  description: string;
}[] = [
  {
    type: "CASH",
    label: "Cash Wallet",
    icon: "dollar-sign",
    description: "Everyday physical cash spending",
  },
  {
    type: "BANK",
    label: "Bank Account",
    icon: "credit-card",
    description: "Primary savings or checking account",
  },
  {
    type: "UPI",
    label: "UPI Wallet",
    icon: "smartphone",
    description: "Digital wallet & instant UPI payments",
  },
];

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const isDark = colors.isDark;
  const { completeOnboarding, updateSettings, updateQuickAddSettings, settings } =
    useFinance();

  // Master onboarding step state (0 to 6):
  // 0 (Screen 1 of 7): Welcome hero ("Take control of your money.")
  // 1 (Screen 2 of 7): User name setup ("What can we call you?")
  // 2 (Screen 3 of 7): Notifications ("Stay on top of your money.")
  // 3 (Screen 4 of 7): Quick Add ("Add an expense in seconds.")
  // 4 (Screen 5 of 7): Smart Auto-Track ("Your expenses, tracked smarter.")
  // 5 (Screen 6 of 7): Your basic setup (Currency & Account)
  // 6 (Screen 7 of 7): You're all set! (Launch Zeno)
  const [currentStep, setCurrentStep] = useState(0);

  // Form states
  const [name, setName] = useState(settings.profileName || "");
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(
    settings.currency || "INR",
  );
  const [selectedAccountType, setSelectedAccountType] =
    useState<AccountType>("CASH");
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [accountModalVisible, setAccountModalVisible] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  // Keyboard state for Step 1
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const nameInputRef = useRef<TextInput>(null);

  // Quick Add state for Step 3
  const [a11yStatus, setA11yStatus] = useState<
    "checking" | "enabled" | "disabled"
  >("checking");
  const [disclosureVisible, setDisclosureVisible] = useState(false);
  const [tutorialFeature, setTutorialFeature] = useState<TutorialFeature | null>(
    null,
  );

  // Preload step mascots so transitions are instantaneous with zero flicker
  useEffect(() => {
    void preloadMascots([
      "welcome",
      "thinking",
      "joyful",
      "peeking",
      "winking",
      "checklist",
      "completed",
    ]);
  }, []);

  // Butter-smooth hardware-accelerated carousel track animation
  const scrollAnim = useRef(new Animated.Value(0)).current;

  const animateToStep = (newStep: number) => {
    setCurrentStep(newStep);
    Animated.spring(scrollAnim, {
      toValue: -newStep * SCREEN_WIDTH,
      velocity: 0,
      tension: 65,
      friction: 12,
      useNativeDriver: true,
    }).start();
  };

  // Keyboard listener
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setKeyboardVisible(true),
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardVisible(false),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Quick Add accessibility service detection
  const checkA11yStatus = useCallback(async () => {
    if (Platform.OS !== "android") {
      setA11yStatus("disabled");
      return;
    }
    try {
      const isEnabled =
        await NativeModules.PocketflowQuickAdd?.isAccessibilityServiceEnabled();
      setA11yStatus(isEnabled ? "enabled" : "disabled");
    } catch {
      setA11yStatus("disabled");
    }
  }, []);

  useEffect(() => {
    void checkA11yStatus();
    const sub = AppState.addEventListener("change", (state: AppStateStatus) => {
      if (state === "active") {
        void checkA11yStatus();
      }
    });
    return () => sub.remove();
  }, [checkA11yStatus]);

  // Back button handler
  const handleBack = () => {
    if (currentStep > 0) {
      void Haptics.selectionAsync();
      animateToStep(currentStep - 1);
    }
  };

  // Step 1: Name submit
  const handleNameContinue = async () => {
    void Haptics.selectionAsync();
    const trimmed = name.trim();
    if (trimmed) {
      await updateSettings({ profileName: trimmed });
    }
    Keyboard.dismiss();
    animateToStep(2);
  };

  // Step 3: Quick Add Trigger
  const handleEnableQuickAdd = async () => {
    if (a11yStatus === "enabled") {
      animateToStep(4);
      return;
    }
    try {
      const consentGranted = await AsyncStorage.getItem(
        "@pocketflow/accessibility_consent_granted",
      );
      if (consentGranted === "true") {
        setTutorialFeature("quick_add");
      } else {
        setDisclosureVisible(true);
      }
    } catch {
      setDisclosureVisible(true);
    }
  };

  // Top-Right Skip > handler (Screens 2 through 6)
  const handleTopSkip = () => {
    void Haptics.selectionAsync();
    if (currentStep < 6) {
      animateToStep(currentStep + 1);
    }
  };

  const handleA11yAgree = async () => {
    setDisclosureVisible(false);
    await AsyncStorage.setItem(
      "@pocketflow/accessibility_consent_granted",
      "true",
    );
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTutorialFeature("quick_add");
  };

  // Step 5: Final Complete
  const handleFinishOnboarding = async () => {
    if (isCompleting) return;
    setIsCompleting(true);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      await completeOnboarding({
        currency: selectedCurrency,
        defaultAccountType: selectedAccountType,
      });
      router.replace("/(tabs)");
    } catch {
      router.replace("/(tabs)");
    } finally {
      setIsCompleting(false);
    }
  };

  const selectedCurrencyObj =
    CURRENCY_LIST.find((c) => c.code === selectedCurrency) || CURRENCY_LIST[0];
  const selectedAccountObj =
    ACCOUNT_CHOICES.find((a) => a.type === selectedAccountType) ||
    ACCOUNT_CHOICES[0];

  return (
    <View style={[styles.screen, { backgroundColor: colors.canvas }]}>
      {/* Top Header Bar */}
      <View
        style={[
          styles.topBar,
          {
            paddingTop: insets.top + spacing[3],
            paddingHorizontal: spacing[5],
          },
        ]}
      >
        {/* Left Slot: Back Button (screens > 0) */}
        <View style={styles.topSlotLeft}>
          {currentStep > 0 ? (
            <Pressable
              onPress={handleBack}
              style={({ pressed }) => [
                styles.navBtn,
                {
                  backgroundColor: isDark ? "#141715" : "#FFFFFF",
                  borderColor: isDark ? "#202422" : "#E5E9E4",
                },
                pressed && { opacity: 0.6 },
              ]}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Feather name="arrow-left" size={20} color={colors.fg} />
            </Pressable>
          ) : null}
        </View>

        {/* Minimal Progress Dots */}
        <OnboardingProgress currentStep={currentStep} totalSteps={7} />

        {/* Right Slot: Skip > (visible on screens 2 through 6, hidden on 1 and 7) */}
        <View style={styles.topSlotRight}>
          {currentStep > 0 && currentStep < 6 ? (
            <Pressable
              onPress={handleTopSkip}
              style={({ pressed }) => [
                styles.topSkipBtn,
                pressed && { opacity: 0.6 },
              ]}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Skip onboarding"
            >
              <Text
                style={[
                  styles.topSkipBtnText,
                  { color: isDark ? "#FFFFFF" : "#0E1633" },
                ]}
              >
                Skip
              </Text>
              <Feather
                name="chevron-right"
                size={15}
                color={isDark ? "#FFFFFF" : "#0E1633"}
              />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Main Step Carousel Viewport — Zero-glitch Native Hardware-Accelerated Track */}
      <View style={styles.carouselViewport}>
        <Animated.View
          style={[
            styles.carouselTrack,
            {
              transform: [{ translateX: scrollAnim }],
            },
          ]}
        >
          {/* ------------------------------------------- */}
          {/* STEP 0: WELCOME & HERO INTRO (NO BACK BTN)   */}
          {/* ------------------------------------------- */}
          <View
            style={[
              styles.carouselPage,
              { paddingBottom: insets.bottom + spacing[4] },
            ]}
          >
            <View style={styles.stepContent}>
              {/* Mascot Container */}
              <View style={styles.mascotArea}>
                <MascotGuide mascot="welcome" size={200} floating />
              </View>

              {/* Typography */}
              <View style={styles.textArea}>
                <Text style={[styles.headline, { color: colors.fg }]}>
                  Take control of your money.
                </Text>
                <Text style={[styles.supportingText, { color: colors.fgMuted }]}>
                  A private, offline-first personal finance tracker that works
                  instantly without syncing accounts to the cloud.
                </Text>
              </View>

              {/* Bottom Actions */}
              <View style={styles.bottomCtaArea}>
                <Pressable
                  onPress={() => {
                    void Haptics.selectionAsync();
                    animateToStep(1);
                  }}
                  style={({ pressed }) => [
                    styles.primaryPillBtn,
                    { backgroundColor: colors.primary },
                    pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Get Started"
                >
                  <Text
                    style={[
                      styles.primaryPillBtnText,
                      { color: colors.onPrimary },
                    ]}
                  >
                    Get Started
                  </Text>
                  <Feather
                    name="arrow-right"
                    size={18}
                    color={colors.onPrimary}
                  />
                </Pressable>

                <Text style={[styles.legalNoticeText, { color: colors.fgMuted }]}>
                  By continuing, you agree to our{" "}
                  <Text
                    style={[styles.legalLink, { color: colors.primary }]}
                    onPress={() => router.push("/terms")}
                  >
                    Terms
                  </Text>{" "}
                  and{" "}
                  <Text
                    style={[styles.legalLink, { color: colors.primary }]}
                    onPress={() => router.push("/privacy")}
                  >
                    Privacy Policy
                  </Text>
                  .
                </Text>
              </View>
            </View>
          </View>

          {/* ------------------------------------------- */}
          {/* STEP 1: USER NAME (CLEAN KEYBOARD AWARE)    */}
          {/* ------------------------------------------- */}
          <View
            style={[
              styles.carouselPage,
              { paddingBottom: insets.bottom + spacing[4] },
            ]}
          >
            <View style={styles.stepContent}>
              <View style={styles.mascotArea}>
                <MascotGuide mascot="thinking" size={180} floating glow />
              </View>

              {/* Name text field positioned below mascot and above headline text */}
              <View style={styles.inputSection}>
                <View
                  style={[
                    styles.nameInputContainer,
                    {
                      backgroundColor: isDark ? "#141715" : "#FFFFFF",
                      borderColor: name
                        ? colors.primary
                        : isDark
                          ? "#262C28"
                          : "#E2E8E0",
                      boxShadow: isDark
                        ? undefined
                        : "0px 2px 8px rgba(0,0,0,0.04)",
                    },
                  ]}
                >
                  <Feather
                    name="user"
                    size={20}
                    color={name ? colors.primary : colors.fgMuted}
                    style={{ marginRight: 10 }}
                  />
                  <TextInput
                    ref={nameInputRef}
                    value={name}
                    onChangeText={setName}
                    placeholder="Your Name (e.g. Alex)"
                    placeholderTextColor={colors.fgMuted}
                    underlineColorAndroid="transparent"
                    style={[styles.nameTextInput, { color: colors.fg }]}
                    autoCapitalize="words"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleNameContinue}
                    maxLength={32}
                  />
                </View>
              </View>

              <View style={styles.textArea}>
                <Text style={[styles.headline, { color: colors.fg }]}>
                  What can we call you?
                </Text>
                <Text style={[styles.supportingText, { color: colors.fgMuted }]}>
                  We'll personalize your greeting and financial reports. You can
                  always change this later.
                </Text>
              </View>

              <View style={styles.bottomCtaArea}>
                <Pressable
                  onPress={handleNameContinue}
                  style={({ pressed }) => [
                    styles.primaryPillBtn,
                    { backgroundColor: colors.primary },
                    pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Continue"
                >
                  <Text
                    style={[
                      styles.primaryPillBtnText,
                      { color: colors.onPrimary },
                    ]}
                  >
                    Continue
                  </Text>
                  <Feather
                    name="arrow-right"
                    size={18}
                    color={colors.onPrimary}
                  />
                </Pressable>

                <Pressable
                  onPress={() => animateToStep(2)}
                  style={styles.secondaryTextBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Skip for now"
                >
                  <Text
                    style={[
                      styles.secondaryTextBtnText,
                      { color: colors.fgMuted },
                    ]}
                  >
                    Skip for now
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* ------------------------------------------- */}
          {/* STEP 2: NOTIFICATIONS (3 OF 7)              */}
          {/* ------------------------------------------- */}
          <View
            style={[
              styles.carouselPage,
              { paddingBottom: insets.bottom + spacing[4] },
            ]}
          >
            <NotificationOnboardingStep
              onContinue={() => animateToStep(3)}
              onSkip={() => animateToStep(3)}
            />
          </View>

          {/* ------------------------------------------- */}
          {/* STEP 3: QUICK ADD (4 OF 7)                  */}
          {/* ------------------------------------------- */}
          <View
            style={[
              styles.carouselPage,
              { paddingBottom: insets.bottom + spacing[4] },
            ]}
          >
            <QuickAddOnboardingStep
              onContinue={() => animateToStep(4)}
              onSkip={() => animateToStep(4)}
              onOpenAccessibilityDisclosure={handleEnableQuickAdd}
              onOpenTutorial={() => setTutorialFeature("quick_add")}
              a11yEnabled={a11yStatus === "enabled"}
            />
          </View>

          {/* ------------------------------------------- */}
          {/* STEP 4: SMART AUTO-TRACK (5 OF 7)           */}
          {/* ------------------------------------------- */}
          <View
            style={[
              styles.carouselPage,
              { paddingBottom: insets.bottom + spacing[4] },
            ]}
          >
            <SmartAutoTrackOnboardingStep
              onContinue={() => animateToStep(5)}
              onSkip={() => animateToStep(5)}
              onOpenTutorial={() => setTutorialFeature("smart_track")}
            />
          </View>

          {/* ------------------------------------------- */}
          {/* STEP 5: YOUR BASIC SETUP (CURRENCY & ACCT)  */}
          {/* ------------------------------------------- */}
          <View
            style={[
              styles.carouselPage,
              { paddingBottom: insets.bottom + spacing[4] },
            ]}
          >
            <View style={styles.stepContent}>
              <View style={styles.mascotArea}>
                <MascotGuide mascot="checklist" size={170} floating />
              </View>

              <View style={styles.textArea}>
                <Text style={[styles.headline, { color: colors.fg }]}>
                  Your basic setup.
                </Text>
                <Text style={[styles.supportingText, { color: colors.fgMuted }]}>
                  Pick your primary currency and default payment account. You can
                  add more anytime.
                </Text>
              </View>

              {/* Premium Configuration Cards */}
              <View style={styles.setupCardContainer}>
                {/* Currency Picker Card */}
                <Pressable
                  onPress={() => setCurrencyModalVisible(true)}
                  style={({ pressed }) => [
                    styles.selectorCard,
                    {
                      backgroundColor: isDark ? "#141715" : "#FFFFFF",
                      borderColor: isDark ? "#262C28" : "#E2E8E0",
                      boxShadow: isDark
                        ? undefined
                        : "0px 3px 10px rgba(0,0,0,0.04)",
                    },
                    pressed && { opacity: 0.88 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Select Primary Currency"
                >
                  <View
                    style={[
                      styles.selectorIconWrap,
                      {
                        backgroundColor: isDark ? "#1F2621" : "#EDF5ED",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.selectorSymbolText,
                        { color: colors.primary },
                      ]}
                    >
                      {selectedCurrencyObj.symbol}
                    </Text>
                  </View>
                  <View style={styles.selectorContent}>
                    <Text
                      style={[styles.selectorLabel, { color: colors.fgMuted }]}
                    >
                      PRIMARY CURRENCY
                    </Text>
                    <Text style={[styles.selectorValue, { color: colors.fg }]}>
                      {selectedCurrencyObj.label}
                    </Text>
                    <Text
                      style={[styles.selectorSubtext, { color: colors.fgMuted }]}
                    >
                      Used for transactions & budget limits
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.selectorChevronBadge,
                      {
                        backgroundColor: isDark ? "#1B221D" : "#F3F7F3",
                      },
                    ]}
                  >
                    <Feather
                      name="chevron-down"
                      size={16}
                      color={colors.fgMuted}
                    />
                  </View>
                </Pressable>

                {/* Account Type Card */}
                <Pressable
                  onPress={() => setAccountModalVisible(true)}
                  style={({ pressed }) => [
                    styles.selectorCard,
                    {
                      backgroundColor: isDark ? "#141715" : "#FFFFFF",
                      borderColor: isDark ? "#262C28" : "#E2E8E0",
                      boxShadow: isDark
                        ? undefined
                        : "0px 3px 10px rgba(0,0,0,0.04)",
                    },
                    pressed && { opacity: 0.88 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Select Default Account"
                >
                  <View
                    style={[
                      styles.selectorIconWrap,
                      {
                        backgroundColor: isDark ? "#1F2621" : "#EDF5ED",
                      },
                    ]}
                  >
                    <Feather
                      name={selectedAccountObj.icon}
                      size={18}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.selectorContent}>
                    <Text
                      style={[styles.selectorLabel, { color: colors.fgMuted }]}
                    >
                      DEFAULT ACCOUNT
                    </Text>
                    <Text style={[styles.selectorValue, { color: colors.fg }]}>
                      {selectedAccountObj.label}
                    </Text>
                    <Text
                      style={[styles.selectorSubtext, { color: colors.fgMuted }]}
                    >
                      {selectedAccountObj.description}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.selectorChevronBadge,
                      {
                        backgroundColor: isDark ? "#1B221D" : "#F3F7F3",
                      },
                    ]}
                  >
                    <Feather
                      name="chevron-down"
                      size={16}
                      color={colors.fgMuted}
                    />
                  </View>
                </Pressable>
              </View>

              <View style={styles.bottomCtaArea}>
                <Pressable
                  onPress={() => {
                    void Haptics.selectionAsync();
                    animateToStep(6);
                  }}
                  style={({ pressed }) => [
                    styles.primaryPillBtn,
                    { backgroundColor: colors.primary },
                    pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Save and Continue"
                >
                  <Text
                    style={[
                      styles.primaryPillBtnText,
                      { color: colors.onPrimary },
                    ]}
                  >
                    Continue
                  </Text>
                  <Feather
                    name="arrow-right"
                    size={18}
                    color={colors.onPrimary}
                  />
                </Pressable>
              </View>
            </View>
          </View>

          {/* ------------------------------------------- */}
          {/* STEP 6: ALL SET & LAUNCH ZENO               */}
          {/* ------------------------------------------- */}
          <View
            style={[
              styles.carouselPage,
              { paddingBottom: insets.bottom + spacing[4] },
            ]}
          >
            <View style={styles.stepContent}>
              <View style={[styles.mascotArea, styles.mascotAreaLowered]}>
                <MascotGuide mascot="completed" size={200} floating />
              </View>

              <View style={styles.textArea}>
                <Text style={[styles.headline, { color: colors.fg }]}>
                  You're all set!
                </Text>
                <Text style={[styles.supportingText, { color: colors.fgMuted }]}>
                  Your offline vault is ready. Let's start tracking your financial
                  freedom with Zeno.
                </Text>
              </View>

              {/* Launch CTA */}
              <View style={styles.bottomCtaArea}>
                <Pressable
                  onPress={handleFinishOnboarding}
                  disabled={isCompleting}
                  style={({ pressed }) => [
                    styles.primaryPillBtn,
                    { backgroundColor: colors.primary },
                    pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Launch Zeno"
                >
                  <Text
                    style={[
                      styles.primaryPillBtnText,
                      { color: colors.onPrimary },
                    ]}
                  >
                    {isCompleting ? "Setting Up..." : "Launch Zeno"}
                  </Text>
                  <Feather
                    name="arrow-right"
                    size={18}
                    color={colors.onPrimary}
                  />
                </Pressable>
              </View>
            </View>
          </View>
        </Animated.View>
      </View>

      {/* Accessibility Disclosure Modal (Zeno branded) */}
      <AccessibilityDisclosureModal
        visible={disclosureVisible}
        onAgree={handleA11yAgree}
        onDecline={() => setDisclosureVisible(false)}
      />

      {/* Tutorial Video Modal with PiP for Quick Add and Smart Track */}
      {tutorialFeature && (
        <TutorialVideoModal
          visible={tutorialFeature !== null}
          feature={tutorialFeature}
          onClose={() => setTutorialFeature(null)}
          onSuccess={async () => {
            const feat = tutorialFeature;
            setTutorialFeature(null);
            if (feat === "quick_add") {
              setA11yStatus("enabled");
              animateToStep(4);
            } else if (feat === "smart_track") {
              if (updateQuickAddSettings) {
                await updateQuickAddSettings({ upiDetectionTrigger: true });
              }
              animateToStep(5);
            }
          }}
        />
      )}

      {/* Currency Selection Sheet */}
      <Modal
        visible={currencyModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCurrencyModalVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setCurrencyModalVisible(false)}
        >
          <View
            style={[
              styles.pickerModalCard,
              {
                backgroundColor: isDark ? "#141715" : "#FFFFFF",
                borderColor: isDark ? "#262C28" : "#E2E8E0",
              },
            ]}
          >
            <View
              style={[
                styles.pickerHeader,
                { borderBottomColor: isDark ? "#202422" : "#F0F3F0" },
              ]}
            >
              <Text style={[styles.pickerTitle, { color: colors.fg }]}>
                Select Currency
              </Text>
              <Pressable
                onPress={() => setCurrencyModalVisible(false)}
                hitSlop={8}
              >
                <Feather name="x" size={20} color={colors.fg} />
              </Pressable>
            </View>
            <ScrollView style={{ maxHeight: 300 }}>
              {CURRENCY_LIST.map((item) => {
                const isSelected = selectedCurrency === item.code;
                return (
                  <Pressable
                    key={item.code}
                    onPress={() => {
                      setSelectedCurrency(item.code);
                      setCurrencyModalVisible(false);
                    }}
                    style={[
                      styles.pickerOptionRow,
                      isSelected && {
                        backgroundColor: isDark ? "#1F2621" : "#EEF5EE",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.pickerOptionText,
                        { color: colors.fg },
                        isSelected && {
                          color: colors.primary,
                          fontWeight: "700",
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                    {isSelected && (
                      <Feather name="check" size={18} color={colors.primary} />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* Account Type Selection Sheet */}
      <Modal
        visible={accountModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAccountModalVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setAccountModalVisible(false)}
        >
          <View
            style={[
              styles.pickerModalCard,
              {
                backgroundColor: isDark ? "#141715" : "#FFFFFF",
                borderColor: isDark ? "#262C28" : "#E2E8E0",
              },
            ]}
          >
            <View
              style={[
                styles.pickerHeader,
                { borderBottomColor: isDark ? "#202422" : "#F0F3F0" },
              ]}
            >
              <Text style={[styles.pickerTitle, { color: colors.fg }]}>
                Select Default Account
              </Text>
              <Pressable
                onPress={() => setAccountModalVisible(false)}
                hitSlop={8}
              >
                <Feather name="x" size={20} color={colors.fg} />
              </Pressable>
            </View>
            {ACCOUNT_CHOICES.map((item) => {
              const isSelected = selectedAccountType === item.type;
              return (
                <Pressable
                  key={item.type}
                  onPress={() => {
                    setSelectedAccountType(item.type);
                    setAccountModalVisible(false);
                  }}
                  style={[
                    styles.pickerOptionRow,
                    isSelected && {
                      backgroundColor: isDark ? "#1F2621" : "#EEF5EE",
                    },
                  ]}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View
                      style={[
                        styles.accountChoiceIconWrap,
                        {
                          backgroundColor: isDark ? "#1F2621" : "#EDF5ED",
                        },
                      ]}
                    >
                      <Feather
                        name={item.icon}
                        size={16}
                        color={colors.primary}
                      />
                    </View>
                    <View>
                      <Text
                        style={[
                          styles.pickerOptionText,
                          { color: colors.fg },
                          isSelected && {
                            color: colors.primary,
                            fontWeight: "700",
                          },
                        ]}
                      >
                        {item.label}
                      </Text>
                      <Text
                        style={[
                          styles.pickerOptionSub,
                          { color: colors.fgMuted },
                        ]}
                      >
                        {item.description}
                      </Text>
                    </View>
                  </View>
                  {isSelected && (
                    <Feather name="check" size={18} color={colors.primary} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: spacing[2],
  },
  topSlotLeft: {
    width: 56,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  topSlotRight: {
    width: 56,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  topSkipBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingVertical: 6,
    paddingHorizontal: 2,
    gap: 2,
  },
  topSkipBtnText: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  navPlaceholder: {
    width: 40,
    height: 40,
  },
  carouselViewport: {
    flex: 1,
    overflow: "hidden",
    width: SCREEN_WIDTH,
  },
  carouselTrack: {
    flexDirection: "row",
    width: SCREEN_WIDTH * 7,
    flex: 1,
  },
  carouselPage: {
    width: SCREEN_WIDTH,
    flex: 1,
    paddingHorizontal: spacing[5],
  },
  stepContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing[1],
    marginBottom: spacing[2],
    paddingVertical: spacing[3],
  },
  mascotArea: {
    width: "100%",
    height: 210,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: spacing[1],
  },
  mascotAreaLowered: {
    height: 220,
    marginTop: 36,
    marginBottom: spacing[1],
    justifyContent: "flex-end",
  },
  textArea: {
    alignItems: "center",
    paddingHorizontal: spacing[3],
    marginBottom: spacing[3],
  },
  headline: {
    fontSize: 32,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.6,
    lineHeight: 38,
    marginBottom: spacing[2],
  },
  supportingText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    paddingHorizontal: spacing[4],
    maxWidth: 320,
  },
  inputSection: {
    width: "100%",
    maxWidth: 360,
    marginBottom: spacing[4],
  },
  nameInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    height: 56,
    borderRadius: radius.full,
    borderWidth: 1.5,
    paddingHorizontal: spacing[4],
  },
  nameTextInput: {
    flex: 1,
    fontSize: 17,
    fontWeight: "600",
  },

  /* Quick Add Step 2 Graphic Container */
  quickAddVisualContainer: {
    width: "100%",
    maxWidth: 350,
    borderRadius: 24,
    borderWidth: 1,
    padding: spacing[4],
    marginVertical: spacing[2],
  },
  hardwareBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing[3],
  },
  hardwarePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  hardwarePillText: {
    fontSize: 13,
    fontWeight: "700",
  },
  multiplierCircle: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  multiplierCircleText: {
    fontSize: 11,
    fontWeight: "800",
  },
  orBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  hudCardPreview: {
    borderRadius: 16,
    borderWidth: 1,
    padding: spacing[3],
    gap: spacing[2],
  },
  hudHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  hudTagBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  hudTagText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  hudTimerBadge: {
    fontSize: 11,
    fontWeight: "600",
  },
  hudMainRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  hudAmount: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  hudChipsGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  hudChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  hudChipText: {
    fontSize: 11,
    fontWeight: "700",
  },
  hudFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingTop: 2,
  },
  hudFooterText: {
    fontSize: 11,
    fontWeight: "600",
  },

  enabledBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: spacing[2],
  },
  enabledBannerText: {
    fontSize: 13,
    fontWeight: "600",
  },

  /* Step 4: Basic Setup Cards */
  setupCardContainer: {
    width: "100%",
    maxWidth: 360,
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  selectorCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 20,
    padding: spacing[3] + 2,
  },
  selectorIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing[3],
  },
  selectorSymbolText: {
    fontSize: 20,
    fontWeight: "800",
  },
  selectorContent: {
    flex: 1,
  },
  selectorLabel: {
    fontSize: 10.5,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  selectorValue: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 1,
  },
  selectorSubtext: {
    fontSize: 11.5,
    lineHeight: 15,
  },
  selectorChevronBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing[2],
  },

  bottomCtaArea: {
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
    gap: spacing[2] + 2,
  },
  primaryPillBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: 54,
    borderRadius: radius.full,
    gap: spacing[2],
  },
  primaryPillBtnText: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  secondaryTextBtn: {
    paddingVertical: spacing[1],
  },
  secondaryTextBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  legalNoticeText: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: spacing[4],
  },
  legalLink: {
    fontWeight: "600",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing[4],
  },
  pickerModalCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing[4],
    maxHeight: 460,
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    marginBottom: spacing[2],
  },
  pickerTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  pickerOptionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
    borderRadius: radius.md,
  },
  pickerOptionText: {
    fontSize: 15,
    fontWeight: "600",
  },
  pickerOptionSub: {
    fontSize: 12,
    marginTop: 2,
  },
  accountChoiceIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing[3],
  },
});
