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
import { OnboardingProgress } from "@/components/OnboardingProgress";
import { AccessibilityDisclosureModal } from "@/components/AccessibilityDisclosureModal";

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
  const { completeOnboarding, updateSettings, settings } = useFinance();

  // Master onboarding step state (0 to 4)
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

  // Quick Add state for Step 2
  const [a11yStatus, setA11yStatus] = useState<
    "checking" | "enabled" | "disabled"
  >("checking");
  const [disclosureVisible, setDisclosureVisible] = useState(false);

  // Step transition animation
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const animateToStep = (newStep: number, direction: 1 | -1 = 1) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: direction * -20,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentStep(newStep);
      slideAnim.setValue(direction * 20);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    });
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
      animateToStep(currentStep - 1, -1);
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
    animateToStep(2, 1);
  };

  // Step 2: Quick Add
  const handleEnableQuickAdd = () => {
    if (a11yStatus === "enabled") {
      animateToStep(3, 1);
      return;
    }
    setDisclosureVisible(true);
  };

  const handleA11yAgree = async () => {
    setDisclosureVisible(false);
    await AsyncStorage.setItem(
      "@pocketflow/accessibility_consent_granted",
      "true",
    );
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (NativeModules.PocketflowQuickAdd?.openAccessibilitySettings) {
      void NativeModules.PocketflowQuickAdd.openAccessibilitySettings().catch(
        () => {
          void Linking.sendIntent(
            "android.settings.ACCESSIBILITY_SETTINGS",
          ).catch(() => {
            void Linking.openSettings();
          });
        },
      );
    } else {
      void Linking.sendIntent("android.settings.ACCESSIBILITY_SETTINGS").catch(
        () => {
          void Linking.openSettings();
        },
      );
    }
  };

  // Step 4: Final Complete
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
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      style={[styles.screen, { backgroundColor: "#090B0A" }]}
    >
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
        {/* FIRST SCREEN HAS NO BACK BUTTON */}
        {currentStep > 0 ? (
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [
              styles.navBtn,
              pressed && { opacity: 0.6 },
            ]}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Feather name="arrow-left" size={20} color="#FFFFFF" />
          </Pressable>
        ) : (
          <View style={styles.navPlaceholder} />
        )}

        {/* Reference 1 Progress Dots */}
        <OnboardingProgress currentStep={currentStep} totalSteps={5} />

        <View style={styles.navPlaceholder} />
      </View>

      {/* Main Step Content Area */}
      <Animated.View
        style={[
          styles.animatedStepWrapper,
          {
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }],
            paddingBottom: insets.bottom + spacing[4],
            paddingHorizontal: spacing[5],
          },
        ]}
      >
        {/* ------------------------------------------- */}
        {/* STEP 0: WELCOME & HERO INTRO (NO BACK BUTTON) */}
        {/* ------------------------------------------- */}
        {currentStep === 0 && (
          <View style={styles.stepContent}>
            {/* Mascot Container */}
            <View style={styles.mascotArea}>
              <MascotGuide mascot="welcome" size={200} floating />
            </View>

            {/* Typography */}
            <View style={styles.textArea}>
              <Text style={styles.headline}>Take control of your money.</Text>
              <Text style={styles.supportingText}>
                Track expenses in seconds. Stay on top of your budgets.
                Completely private, stored only on your device.
              </Text>
            </View>

            {/* Dominant CTA */}
            <View style={styles.bottomCtaArea}>
              <Pressable
                onPress={() => {
                  void Haptics.selectionAsync();
                  animateToStep(1, 1);
                }}
                style={({ pressed }) => [
                  styles.primaryPillBtn,
                  pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Get Started"
              >
                <Text style={styles.primaryPillBtnText}>Get Started</Text>
                <Feather name="arrow-right" size={18} color="#090B0A" />
              </Pressable>

              <Text style={styles.legalNoticeText}>
                By continuing, you agree to our{" "}
                <Text
                  style={styles.legalLink}
                  onPress={() => router.push("/terms")}
                >
                  Terms
                </Text>{" "}
                and{" "}
                <Text
                  style={styles.legalLink}
                  onPress={() => router.push("/privacy")}
                >
                  Privacy Policy
                </Text>
                .
              </Text>
            </View>
          </View>
        )}

        {/* ------------------------------------------- */}
        {/* STEP 1: USER NAME (MOVED UP WHEN TYPING)    */}
        {/* ------------------------------------------- */}
        {currentStep === 1 && (
          <View
            style={[
              styles.stepContent,
              keyboardVisible && {
                justifyContent: "flex-start",
                paddingTop: spacing[2],
              },
            ]}
          >
            {!keyboardVisible ? (
              <View style={styles.mascotArea}>
                <MascotGuide mascot="thinking" size={180} floating glow />
              </View>
            ) : (
              <View style={{ height: 12 }} />
            )}

            <View
              style={[
                styles.textArea,
                keyboardVisible && { marginBottom: spacing[3] },
              ]}
            >
              <Text style={styles.headline}>What can we call you?</Text>
              <Text style={styles.supportingText}>
                We'll personalize your greeting and financial reports. You can
                always change this later.
              </Text>
            </View>

            <View
              style={[
                styles.inputSection,
                keyboardVisible && { marginBottom: spacing[3] },
              ]}
            >
              <View style={styles.nameInputContainer}>
                <Feather
                  name="user"
                  size={20}
                  color={name ? "#B7FF63" : "#6E746F"}
                  style={{ marginRight: 10 }}
                />
                <TextInput
                  ref={nameInputRef}
                  value={name}
                  onChangeText={setName}
                  placeholder="Your Name (e.g. Alex)"
                  placeholderTextColor="#6E746F"
                  style={styles.nameTextInput}
                  autoCapitalize="words"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleNameContinue}
                  maxLength={32}
                />
              </View>
            </View>

            <View
              style={[
                styles.bottomCtaArea,
                keyboardVisible && { marginTop: spacing[1] },
              ]}
            >
              <Pressable
                onPress={handleNameContinue}
                style={({ pressed }) => [
                  styles.primaryPillBtn,
                  pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Continue"
              >
                <Text style={styles.primaryPillBtnText}>Continue</Text>
                <Feather name="arrow-right" size={18} color="#090B0A" />
              </Pressable>

              <Pressable
                onPress={() => animateToStep(2, 1)}
                style={styles.secondaryTextBtn}
              >
                <Text style={styles.secondaryTextBtnText}>Skip for now</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* ------------------------------------------- */}
        {/* STEP 2: QUICK ADD DISCLOSURE & SHORTCUT      */}
        {/* ------------------------------------------- */}
        {currentStep === 2 && (
          <View style={styles.stepContent}>
            <View style={styles.mascotArea}>
              <MascotGuide mascot="okay" size={190} floating />
            </View>

            <View style={styles.textArea}>
              <Text style={styles.headline}>Log expenses in 2 seconds.</Text>
              <Text style={styles.supportingText}>
                Double-press Volume Down from anywhere on your phone to open
                Quick Add instantly.
              </Text>
            </View>

            {/* Hardware Key Visual Demonstration */}
            <View style={styles.shortcutVisualCard}>
              <View style={styles.shortcutStepPill}>
                <Feather name="volume-2" size={16} color="#B7FF63" />
                <Text style={styles.shortcutStepText}>Volume Down</Text>
              </View>
              <Text style={styles.shortcutMultiplier}>×</Text>
              <View style={styles.shortcutBadge2}>
                <Text style={styles.shortcutBadge2Text}>2</Text>
              </View>
              <Feather name="arrow-right" size={16} color="#777D76" />
              <View style={styles.shortcutResultPill}>
                <Feather name="zap" size={14} color="#090B0A" />
                <Text style={styles.shortcutResultText}>Quick Add</Text>
              </View>
            </View>

            {a11yStatus === "enabled" && (
              <View style={styles.enabledBanner}>
                <Feather name="check-circle" size={16} color="#B7FF63" />
                <Text style={styles.enabledBannerText}>
                  Quick Add is enabled and ready
                </Text>
              </View>
            )}

            <View style={styles.bottomCtaArea}>
              <Pressable
                onPress={handleEnableQuickAdd}
                style={({ pressed }) => [
                  styles.primaryPillBtn,
                  pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Enable Quick Add"
              >
                <Text style={styles.primaryPillBtnText}>
                  {a11yStatus === "enabled"
                    ? "Continue"
                    : "Enable Hardware Shortcut"}
                </Text>
                <Feather name="arrow-right" size={18} color="#090B0A" />
              </Pressable>

              {a11yStatus !== "enabled" && (
                <Pressable
                  onPress={() => animateToStep(3, 1)}
                  style={styles.secondaryTextBtn}
                >
                  <Text style={styles.secondaryTextBtnText}>Set up later</Text>
                </Pressable>
              )}
            </View>
          </View>
        )}

        {/* ------------------------------------------- */}
        {/* STEP 3: BASIC SETUP (CURRENCY & ACCOUNT)    */}
        {/* ------------------------------------------- */}
        {currentStep === 3 && (
          <View style={styles.stepContent}>
            <View style={styles.mascotArea}>
              <MascotGuide mascot="checklist" size={180} floating />
            </View>

            <View style={styles.textArea}>
              <Text style={styles.headline}>Your basic setup.</Text>
              <Text style={styles.supportingText}>
                Pick your primary currency and default wallet account. You can
                add more anytime.
              </Text>
            </View>

            {/* Configuration Selectors */}
            <View style={styles.setupCardContainer}>
              {/* Currency Picker Card */}
              <Pressable
                onPress={() => setCurrencyModalVisible(true)}
                style={styles.selectorCard}
              >
                <View style={styles.selectorIconWrap}>
                  <Text style={styles.selectorSymbolText}>
                    {selectedCurrencyObj.symbol}
                  </Text>
                </View>
                <View style={styles.selectorContent}>
                  <Text style={styles.selectorLabel}>PRIMARY CURRENCY</Text>
                  <Text style={styles.selectorValue}>
                    {selectedCurrencyObj.label}
                  </Text>
                </View>
                <Feather name="chevron-down" size={18} color="#777D76" />
              </Pressable>

              {/* Account Type Card */}
              <Pressable
                onPress={() => setAccountModalVisible(true)}
                style={styles.selectorCard}
              >
                <View style={styles.selectorIconWrap}>
                  <Feather
                    name={selectedAccountObj.icon}
                    size={18}
                    color="#B7FF63"
                  />
                </View>
                <View style={styles.selectorContent}>
                  <Text style={styles.selectorLabel}>DEFAULT ACCOUNT</Text>
                  <Text style={styles.selectorValue}>
                    {selectedAccountObj.label}
                  </Text>
                </View>
                <Feather name="chevron-down" size={18} color="#777D76" />
              </Pressable>
            </View>

            <View style={styles.bottomCtaArea}>
              <Pressable
                onPress={() => {
                  void Haptics.selectionAsync();
                  animateToStep(4, 1);
                }}
                style={({ pressed }) => [
                  styles.primaryPillBtn,
                  pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Save and Continue"
              >
                <Text style={styles.primaryPillBtnText}>Continue</Text>
                <Feather name="arrow-right" size={18} color="#090B0A" />
              </Pressable>
            </View>
          </View>
        )}

        {/* ------------------------------------------- */}
        {/* STEP 4: ALL SET & LAUNCH                     */}
        {/* ------------------------------------------- */}
        {currentStep === 4 && (
          <View style={styles.stepContent}>
            <View style={styles.mascotArea}>
              <MascotGuide mascot="completed" size={200} floating />
            </View>

            <View style={styles.textArea}>
              <Text style={styles.headline}>You're all set!</Text>
              <Text style={styles.supportingText}>
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
                  pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Launch Zeno"
              >
                <Text style={styles.primaryPillBtnText}>
                  {isCompleting ? "Setting Up..." : "Launch Zeno"}
                </Text>
                <Feather name="arrow-right" size={18} color="#090B0A" />
              </Pressable>
            </View>
          </View>
        )}
      </Animated.View>

      {/* Accessibility Disclosure Modal (Google Play compliant) */}
      <AccessibilityDisclosureModal
        visible={disclosureVisible}
        onAgree={handleA11yAgree}
        onDecline={() => setDisclosureVisible(false)}
      />

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
          <View style={styles.pickerModalCard}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Currency</Text>
              <Pressable onPress={() => setCurrencyModalVisible(false)}>
                <Feather name="x" size={20} color="#FFFFFF" />
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
                      isSelected && styles.pickerOptionSelected,
                    ]}
                  >
                    <Text style={styles.pickerOptionText}>{item.label}</Text>
                    {isSelected && (
                      <Feather name="check" size={18} color="#B7FF63" />
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
          <View style={styles.pickerModalCard}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Default Account</Text>
              <Pressable onPress={() => setAccountModalVisible(false)}>
                <Feather name="x" size={20} color="#FFFFFF" />
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
                    isSelected && styles.pickerOptionSelected,
                  ]}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View style={styles.accountChoiceIconWrap}>
                      <Feather name={item.icon} size={16} color="#B7FF63" />
                    </View>
                    <View>
                      <Text style={styles.pickerOptionText}>{item.label}</Text>
                      <Text style={styles.pickerOptionSub}>
                        {item.description}
                      </Text>
                    </View>
                  </View>
                  {isSelected && (
                    <Feather name="check" size={18} color="#B7FF63" />
                  )}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#090B0A",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: spacing[2],
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#141715",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#202422",
  },
  navPlaceholder: {
    width: 40,
    height: 40,
  },
  animatedStepWrapper: {
    flex: 1,
    justifyContent: "space-between",
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
    height: 220,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: spacing[2],
  },
  textArea: {
    alignItems: "center",
    paddingHorizontal: spacing[3],
    marginBottom: spacing[4],
  },
  headline: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: -0.6,
    lineHeight: 38,
    marginBottom: spacing[2],
  },
  supportingText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#A5AAA3",
    textAlign: "center",
    paddingHorizontal: spacing[4],
    maxWidth: 320,
  },
  inputSection: {
    width: "100%",
    maxWidth: 360,
    marginBottom: spacing[5],
  },
  nameInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    height: 56,
    backgroundColor: "#141715",
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: "#262C28",
    paddingHorizontal: spacing[4],
  },
  nameTextInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  shortcutVisualCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    backgroundColor: "#141715",
    borderWidth: 1,
    borderColor: "#262C28",
    borderRadius: radius.xl,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    marginBottom: spacing[4],
  },
  shortcutStepPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#1F2621",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  shortcutStepText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  shortcutMultiplier: {
    fontSize: 14,
    fontWeight: "700",
    color: "#777D76",
  },
  shortcutBadge2: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#B7FF63",
    alignItems: "center",
    justifyContent: "center",
  },
  shortcutBadge2Text: {
    fontSize: 13,
    fontWeight: "800",
    color: "#090B0A",
  },
  shortcutResultPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#B7FF63",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  shortcutResultText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#090B0A",
  },
  enabledBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: spacing[3],
  },
  enabledBannerText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#B7FF63",
  },
  setupCardContainer: {
    width: "100%",
    maxWidth: 360,
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  selectorCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#141715",
    borderWidth: 1,
    borderColor: "#262C28",
    borderRadius: radius.xl,
    padding: spacing[4],
  },
  selectorIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1F2621",
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing[3],
  },
  selectorSymbolText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#B7FF63",
  },
  selectorContent: {
    flex: 1,
  },
  selectorLabel: {
    fontSize: 11,
    color: "#777D76",
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  selectorValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  bottomCtaArea: {
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
    gap: spacing[3],
  },
  primaryPillBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: 54,
    borderRadius: radius.full,
    backgroundColor: "#B7FF63",
    gap: spacing[2],
  },
  primaryPillBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#090B0A",
    letterSpacing: -0.2,
  },
  secondaryTextBtn: {
    paddingVertical: spacing[1],
  },
  secondaryTextBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#A5AAA3",
  },
  legalNoticeText: {
    fontSize: 12,
    color: "#777D76",
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: spacing[4],
  },
  legalLink: {
    color: "#B7FF63",
    fontWeight: "500",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing[4],
  },
  pickerModalCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#141715",
    borderWidth: 1,
    borderColor: "#262C28",
    borderRadius: radius.xl,
    padding: spacing[4],
  },
  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing[3],
    paddingBottom: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: "#202422",
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  pickerOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: radius.md,
  },
  pickerOptionSelected: {
    backgroundColor: "rgba(183, 255, 99, 0.08)",
  },
  pickerOptionText: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  pickerOptionSub: {
    fontSize: 12,
    color: "#777D76",
    marginTop: 2,
  },
  accountChoiceIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1F2621",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
});
