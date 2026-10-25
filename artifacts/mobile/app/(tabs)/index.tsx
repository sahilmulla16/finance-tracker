import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import {
  Alert,
  AppState,
  AppStateStatus,
  Image,
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";

import Svg, {
  Path,
  Defs,
  Stop,
  LinearGradient as SvgLinearGradient,
} from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useFinance,
  type Category,
  type Account,
  type SavingsGoal,
  type Transaction,
} from "@/context/FinanceContext";
import { useColors } from "@/hooks/useColors";
import {
  money,
  signedMoney,
  currencySymbol,
  getGreeting,
  formatDate,
  formatTime,
  compareTransactionsByLatest,
} from "@/utils/format";
import {
  spacing,
  radius,
  fontSize,
  fontWeight,
  lineHeight,
} from "@/constants/tokens";
import { registerQuickAddListener } from "@/utils/quickAddEvent";
import { getMerchantLogo, getBankLogo } from "@/utils/merchantLogos";
import { suggestCategory } from "@/utils/categorySuggestions";
import {
  BankLogo,
  CategoryVisual,
  CategoryProgressCard,
  DeleteConfirmationModal,
} from "@/components/ui";
import {
  AnimatedCardDeck,
  getDeterministicCardDigits,
} from "@/components/AnimatedCardDeck";
import { AnimatedPressable } from "@/components/motion/AnimatedPressable";
import { QuickAddModal } from "@/components/QuickAddModal";
import { AccessibilityDisclosureModal } from "@/components/AccessibilityDisclosureModal";
import { HomeScreenSkeleton } from "@/components/skeletons";
import { getValidProfileImageUri } from "@/services/profileImageService";
import { haptics } from "@/utils/haptics";

function MerchantLogo({
  description,
  category,
}: {
  description: string;
  category?: string;
}) {
  return (
    <CategoryVisual categoryName={category || description} size="medium" />
  );
}

function BankLogoIcon({ name }: { name: string }) {
  return <BankLogo accountName={name} size={42} showBorder />;
}

function AccountCard({
  account,
  isFirst,
  accountsVisible,
  currency,
  balance,
  onPress,
}: {
  account?: Account;
  isFirst?: boolean;
  accountsVisible: boolean;
  currency: string;
  balance: number;
  onPress: () => void;
}) {
  const colors = useColors();
  const isDark = colors.canvas === "#090B0A";

  return (
    <Pressable style={styles.accountCardWrapper} onPress={onPress}>
      <LinearGradient
        colors={
          isDark
            ? ["#102B24", "#164A3A", "#236B4F", "#102B24"]
            : ["#0B1E38", "#122E54", "#1A3F74", "#0B1E38"]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* SVG Wave layers */}
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 280 180"
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          <SvgLinearGradient id="cardWaveMain" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor={isDark ? "#102B24" : "#0B1E38"} />
            <Stop offset="55%" stopColor={isDark ? "#236B4F" : "#1A3F74"} />
            <Stop
              offset="100%"
              stopColor={isDark ? "#B8F36B" : "#4C86E4"}
              stopOpacity={isDark ? "0.55" : "0.45"}
            />
          </SvgLinearGradient>
          <SvgLinearGradient id="cardWaveDeep" x1="0" y1="0" x2="1" y2="0.5">
            <Stop
              offset="0%"
              stopColor={isDark ? "#164A3A" : "#122E54"}
              stopOpacity={isDark ? "0.7" : "0.5"}
            />
            <Stop
              offset="100%"
              stopColor={isDark ? "#236B4F" : "#1A3F74"}
              stopOpacity={isDark ? "0.3" : "0.25"}
            />
          </SvgLinearGradient>
        </Defs>
        {/* Main flowing wave */}
        <Path
          d="M0 65 C70 70 110 25 190 22 C240 20 270 30 280 15 L280 0 L0 0 Z"
          fill="url(#cardWaveMain)"
        />
        {/* Secondary deep layer */}
        <Path
          d="M0 95 C80 100 120 55 210 48 C255 44 275 52 280 38 L280 0 L0 0 Z"
          fill="url(#cardWaveDeep)"
        />
        {/* Soft highlight wave */}
        <Path
          d="M0 125 C80 118 130 80 215 74 C260 70 275 78 280 62 L280 0 L0 0 Z"
          fill={isDark ? "#B8F36B" : "#FFFFFF"}
          opacity={isDark ? "0.1" : "0.08"}
        />
      </Svg>

      {/* Ambient glow */}
      <View
        style={[
          styles.limeGlow,
          {
            backgroundColor: isDark ? "#B8F36B" : "#4C86E4",
            opacity: isDark ? 0.18 : 0.15,
          },
        ]}
      />

      <View style={styles.accountCardContent}>
        <BankLogo
          accountName={account?.name || "Cash Wallet"}
          accountType={account?.type}
          size={44}
          showBorder
        />
        <View style={styles.accountInfo}>
          <Text
            style={[styles.accountNameOnPrimary, { color: "#FFFFFF" }]}
            numberOfLines={1}
          >
            {account?.name || "Cash Wallet"}
          </Text>
          <Text
            style={[
              styles.accountTypeOnPrimary,
              {
                color: isDark ? "#C6D8CF" : "rgba(255,255,255,0.72)",
              },
            ]}
          >
            {account
              ? account.type === "BANK"
                ? "Bank Account"
                : account.type
              : "Cash"}
          </Text>
        </View>
        <View
          style={[
            styles.accountAddBtn,
            {
              backgroundColor: isDark
                ? "rgba(184,243,107,0.15)"
                : "rgba(255,255,255,0.18)",
            },
          ]}
        >
          <Feather
            name="plus"
            size={14}
            color={isDark ? "#B8F36B" : "#FFFFFF"}
          />
        </View>
      </View>
      <Text style={styles.accountBalanceOnPrimary}>
        {accountsVisible ? money(balance, currency as any) : "••••••"}
      </Text>
      <Text
        style={[
          styles.accountMaskOnPrimary,
          {
            color: isDark ? "#C6D8CF" : "rgba(255,255,255,0.6)",
          },
        ]}
      >
        {accountsVisible
          ? account
            ? `•••• •••• ${getDeterministicCardDigits(account.id).last4}`
            : "•••• •••• 0000"
          : "•••• •••• ••••"}
      </Text>
    </Pressable>
  );
}

export default function HomeScreen() {
  const {
    loading,
    transactions,
    accounts,
    settings,
    getAccountBalance,
    savingsGoals,
    addFundsToGoal,
    unreadNotificationsCount,
    deleteTransaction,
    voiceLoggingVisible,
    setVoiceLoggingVisible,
    quickAddSettings,
  } = useFinance();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [quickAdd, setQuickAdd] = useState(false);
  const [quickAddType, setQuickAddType] = useState<
    "EXPENSE" | "INCOME" | "TRANSFER"
  >("EXPENSE");
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [balanceVisible, setBalanceVisible] = useState(false);
  const [accountsVisible, setAccountsVisible] = useState(false);
  const [depositGoal, setDepositGoal] = useState<SavingsGoal | null>(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositAccountId, setDepositAccountId] = useState<string>("");

  // Accessibility Quick Add state for natural user flow prompt
  const [a11yStatus, setA11yStatus] = useState<
    "enabled" | "disabled" | "checking"
  >("checking");
  const [a11yDisclosureVisible, setA11yDisclosureVisible] = useState(false);
  const [a11yBannerDismissed, setA11yBannerDismissed] = useState(false);
  const [deletingTx, setDeletingTx] = useState<Transaction | null>(null);
  const [profileImageError, setProfileImageError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (settings.profileImage) {
      void getValidProfileImageUri(settings.profileImage).then((validUri) => {
        if (isMounted) setProfileImageError(!validUri);
      });
    } else {
      setProfileImageError(false);
    }
    return () => {
      isMounted = false;
    };
  }, [settings.profileImage]);

  // Load persistent dismissal and configuration states so the banner never nags
  useEffect(() => {
    void Promise.all([
      AsyncStorage.getItem("@pocketflow/quick_add_home_dismissed"),
      AsyncStorage.getItem("@pocketflow/accessibility_consent_granted"),
    ]).then(([dismissed, consented]) => {
      if (dismissed === "true" || consented === "true") {
        setA11yBannerDismissed(true);
      }
    });
  }, []);

  const checkA11yEnabled = useCallback(async () => {
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
    void checkA11yEnabled();
    const sub = AppState.addEventListener("change", (state: AppStateStatus) => {
      if (state === "active") {
        void checkA11yEnabled();
      }
    });
    return () => sub.remove();
  }, [checkA11yEnabled]);

  const handleA11yAgree = async () => {
    setA11yDisclosureVisible(false);
    setA11yBannerDismissed(true);
    await AsyncStorage.setItem(
      "@pocketflow/accessibility_consent_granted",
      "true",
    );
    await AsyncStorage.setItem("@pocketflow/quick_add_home_dismissed", "true");
    void haptics.success();
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

  useEffect(() => {
    const unsub = registerQuickAddListener((type) => {
      if (type) setQuickAddType(type);
      setQuickAdd(true);
    });
    return unsub;
  }, []);

  const totalBalance = useMemo(() => {
    if (accounts.length === 0) {
      let net = 0;
      for (const txn of transactions) {
        const amount = Math.abs(Number(txn.amount)) || 0;
        const type = (txn.type || "EXPENSE").trim().toUpperCase();
        if (type === "INCOME") net += amount;
        else if (type === "EXPENSE") net -= amount;
      }
      return net;
    }
    return accounts.reduce((sum, a) => sum + getAccountBalance(a.id), 0);
  }, [accounts, getAccountBalance, transactions]);

  const latestTransactions = useMemo(() => {
    return [...transactions]
      .sort(compareTransactionsByLatest)
      .slice(0, 5);
  }, [transactions]);

  const handleDeleteTransaction = (tx: Transaction) => {
    void haptics.selection();
    setDeletingTx(tx);
  };

  const greeting = getGreeting();
  const rawName = settings.profileName?.trim() || "";
  const firstName = rawName.split(" ")[0] || "Friend";

  const initials = rawName
    ? rawName
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "PF";

  const formatAmount = (tx: { type?: string; amount: number }) => {
    const t = (tx.type || "EXPENSE").trim().toUpperCase();
    const abs = Math.abs(Number(tx.amount)) || 0;
    if (t === "INCOME") return signedMoney(abs, settings.currency);
    if (t === "EXPENSE") return signedMoney(-abs, settings.currency);
    return money(abs, settings.currency);
  };

  const getTxDateLabel = (dateStr: string) => {
    return formatDate(dateStr);
  };

  const isDark = colors.canvas === "#090B0A";

  if (loading) {
    return <HomeScreenSkeleton />;
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.canvas }]}>
      <LinearGradient
        colors={
          isDark
            ? ["#18251A", "#0D120E", "#090B0A"]
            : ["#E2E8F4", "#F0F4FA", "#FFFFFF"]
        }
        locations={[0, 0.35, 0.75]}
        style={styles.bgGlow}
        start={{ x: 0.85, y: 0.05 }}
        end={{ x: 0.3, y: 0.6 }}
      />

      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + spacing[4],
          paddingBottom: 120,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greetSmall, { color: colors.fgMuted }]}>
              {greeting},
            </Text>
            <Text style={[styles.greetName, { color: colors.fg }]}>
              {firstName} 👋
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Pressable
              onPress={() => {
                void Haptics.selectionAsync();
                router.push("/notifications");
              }}
              style={[styles.notifBtn, { backgroundColor: colors.surface }]}
              accessibilityLabel="Notifications"
            >
              <Feather name="bell" size={20} color={colors.fg} />
              {unreadNotificationsCount > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>
                    {unreadNotificationsCount}
                  </Text>
                </View>
              )}
            </Pressable>
            <Pressable
              onPress={() => router.push("/(tabs)/profile")}
              style={styles.profileImageContainer}
            >
              {settings.profileImage && !profileImageError ? (
                <Image
                  source={{ uri: settings.profileImage }}
                  style={styles.profileImage}
                  onError={() => setProfileImageError(true)}
                />
              ) : (
                <View
                  style={[
                    styles.profileImageFallback,
                    { backgroundColor: colors.surfaceRecessed },
                  ]}
                >
                  <Text
                    style={[
                      styles.profileImageInitials,
                      { color: colors.primary },
                    ]}
                  >
                    {initials}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>

        {/* Balance */}
        <View style={styles.balanceSection}>
          <Text style={[styles.balanceLabel, { color: colors.fgMuted }]}>
            Total Balance
          </Text>
          <View style={styles.balanceRow}>
            <Text
              style={[
                styles.balanceValue,
                { color: colors.fg },
              ]}
            >
              {balanceVisible
                ? money(totalBalance, settings.currency)
                : `${currencySymbol(settings.currency)}••••••`}
            </Text>
            <Pressable
              onPress={() => setBalanceVisible(!balanceVisible)}
              style={[styles.eyeBtn, { backgroundColor: colors.surface }]}
            >
              <Feather
                name={balanceVisible ? "eye" : "eye-off"}
                size={18}
                color={colors.fgMuted}
              />
            </Pressable>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <AnimatedPressable
            style={styles.quickAction}
            hapticFeedback="medium"
            onPress={() => {
              void haptics.selection();
              setVoiceLoggingVisible(true);
            }}
          >
            <View
              style={[
                styles.quickActionCircle,
                { backgroundColor: colors.primary },
              ]}
            >
              <Feather name="mic" size={22} color={colors.onPrimary} />
            </View>
            <Text style={[styles.quickActionLabel, { color: colors.fgMuted }]}>
              Voice
            </Text>
          </AnimatedPressable>
          <AnimatedPressable
            style={styles.quickAction}
            hapticFeedback="medium"
            onPress={() => {
              setQuickAddType("TRANSFER");
              setQuickAdd(true);
            }}
          >
            <View
              style={[
                styles.quickActionCircle,
                { backgroundColor: colors.surface },
              ]}
            >
              <Feather name="arrow-right" size={20} color={colors.fg} />
            </View>
            <Text style={[styles.quickActionLabel, { color: colors.fgMuted }]}>
              Transfer
            </Text>
          </AnimatedPressable>
          <AnimatedPressable
            style={styles.quickAction}
            hapticFeedback="medium"
            accessibilityRole="button"
            accessibilityLabel="Spending"
            onPress={() => {
              void haptics.selection();
              router.push("/spending");
            }}
          >
            <View
              style={[
                styles.quickActionCircle,
                { backgroundColor: colors.surface },
              ]}
            >
              <Feather name="bar-chart-2" size={20} color={colors.fg} />
            </View>
            <Text
              style={[styles.quickActionLabel, { color: colors.fgMuted }]}
              numberOfLines={1}
            >
              Spending
            </Text>
          </AnimatedPressable>
        </View>

        {/* Android Quick Add Setup Banner in Natural Home Flow */}
        {Platform.OS === "android" &&
          a11yStatus === "disabled" &&
          !quickAddSettings?.volumeDownTrigger &&
          !a11yBannerDismissed && (
            <View
              style={[
                styles.a11yBannerCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: `${colors.primary}30`,
                },
              ]}
            >
              <View style={styles.a11yBannerHeader}>
                <View
                  style={[
                    styles.a11yBannerBadge,
                    { backgroundColor: `${colors.primary}18` },
                  ]}
                >
                  <Feather name="zap" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.a11yBannerTitle, { color: colors.fg }]}>
                    Instant Quick Add via Volume Down
                  </Text>
                  <Text
                    style={[
                      styles.a11yBannerSubtitle,
                      { color: colors.fgMuted },
                    ]}
                  >
                    Double-press Volume Down from anywhere to log expenses in 2
                    seconds without opening the app.
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    setA11yBannerDismissed(true);
                    void AsyncStorage.setItem(
                      "@pocketflow/quick_add_home_dismissed",
                      "true",
                    );
                  }}
                  hitSlop={8}
                  style={styles.a11yBannerClose}
                  accessibilityLabel="Dismiss Quick Add Banner"
                >
                  <Feather name="x" size={16} color={colors.fgMuted} />
                </Pressable>
              </View>

              <Pressable
                style={[
                  styles.a11yBannerBtn,
                  { backgroundColor: colors.primary },
                ]}
                onPress={() => setA11yDisclosureVisible(true)}
                accessibilityRole="button"
                accessibilityLabel="Setup Volume Down Hardware Shortcut"
              >
                <Feather name="shield" size={14} color={colors.onPrimary} />
                <Text
                  style={[
                    styles.a11yBannerBtnText,
                    { color: colors.onPrimary },
                  ]}
                >
                  Setup Hardware Shortcut
                </Text>
              </Pressable>
            </View>
          )}

        {/* My Wallet / Accounts Deck */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.fg }]}>
              My Wallet
            </Text>
            <View style={styles.sectionActions}>
              <AnimatedPressable
                onPress={() => setAccountsVisible(!accountsVisible)}
                style={[styles.eyeBtn, { backgroundColor: colors.surface }]}
                hitSlop={8}
                hapticFeedback="light"
              >
                <Feather
                  name={accountsVisible ? "eye" : "eye-off"}
                  size={16}
                  color={colors.fgMuted}
                />
              </AnimatedPressable>
              <AnimatedPressable
                onPress={() => router.push("/accounts")}
                style={[styles.moreBtn, { backgroundColor: colors.surface }]}
                hitSlop={8}
                hapticFeedback="light"
              >
                <Feather name="more-horizontal" size={18} color={colors.fg} />
              </AnimatedPressable>
            </View>
          </View>
          <AnimatedCardDeck
            accounts={accounts.filter((a) => a.isActive)}
            accountsVisible={accountsVisible}
            onPressAccount={() => router.push("/accounts")}
          />
        </View>

        {/* Latest Transactions — WHITE CARD (header inside) */}
        <View
          style={[
            styles.txWhiteCard,
            { backgroundColor: isDark ? "#FFFFFF" : colors.surfaceElevated },
          ]}
        >
          <View style={styles.txSectionHeader}>
            <Text
              style={[
                styles.txSectionTitle,
                { color: isDark ? "#111312" : colors.fg },
              ]}
            >
              Latest Transactions
            </Text>
            <Pressable onPress={() => router.push("/(tabs)/expenses")}>
              <Text
                style={[
                  styles.txSectionAction,
                  { color: isDark ? "#6B706B" : colors.fgMuted },
                ]}
              >
                See all
              </Text>
            </Pressable>
          </View>

          {latestTransactions.length > 0 ? (
            latestTransactions.map((tx, index) => {
              const isIncome = (tx.type || "").trim().toUpperCase() === "INCOME";
              return (
                <View key={tx.id}>
                  <Pressable
                    onPress={() => setEditingTransaction(tx)}
                    onLongPress={() => handleDeleteTransaction(tx)}
                    style={({ pressed }) => [
                      styles.txRow,
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    {tx.type === "TRANSFER" ? (
                      <BankLogo
                        accountName={
                          accounts.find((a) => a.id === tx.accountId)?.name
                        }
                        size="medium"
                      />
                    ) : (
                      <CategoryVisual
                        categoryName={tx.category || tx.description}
                        size="medium"
                      />
                    )}
                    <View style={styles.txContent}>
                      <Text
                        style={[
                          styles.txTitle,
                          { color: isDark ? "#111312" : colors.fg },
                        ]}
                        numberOfLines={1}
                      >
                        {tx.description}
                      </Text>
                      <Text
                        style={[
                          styles.txSubtitle,
                          { color: isDark ? "#6B706B" : colors.fgMuted },
                        ]}
                        numberOfLines={1}
                      >
                        {tx.category ||
                          (tx.type === "TRANSFER"
                            ? "Transfer"
                            : tx.type === "INCOME"
                              ? "Income"
                              : "Uncategorized")}{" "}
                        · {getTxDateLabel(tx.date)}
                        {tx.time ? ` · ${formatTime(tx.time)}` : ""}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.txAmount,
                        {
                          color: isIncome
                            ? colors.income
                            : isDark
                              ? "#111312"
                              : colors.fg,
                        },
                      ]}
                    >
                      {formatAmount(tx)}
                    </Text>
                  </Pressable>
                  {index < latestTransactions.length - 1 && (
                    <View
                      style={[
                        styles.txDivider,
                        {
                          backgroundColor: isDark ? "#E5E5EA" : colors.divider,
                        },
                      ]}
                    />
                  )}
                </View>
              );
            })
          ) : (
            <View style={styles.emptyTxCard}>
              <Feather name="inbox" size={28} color={colors.fgSubtle} />
              <Text style={[styles.emptyTxText, { color: colors.fgMuted }]}>
                No transactions yet
              </Text>
            </View>
          )}
        </View>

        {/* Savings Goals Section */}
        <View style={styles.homeSavingsSection}>
          <View style={styles.sectionHeader}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: spacing[2],
              }}
            >
              <Text style={[styles.sectionTitle, { color: colors.fg }]}>
                Savings Goals
              </Text>
              <View
                style={[
                  styles.savingsBadge,
                  { backgroundColor: `${colors.primary}18` },
                ]}
              >
                <Text
                  style={[styles.savingsBadgeText, { color: colors.primary }]}
                >
                  {savingsGoals.length}
                </Text>
              </View>
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: spacing[3],
              }}
            >
              <Pressable
                onPress={() => router.push("/savings")}
                hitSlop={8}
                style={[
                  styles.homePlusAction,
                  { backgroundColor: `${colors.primary}18` },
                ]}
              >
                <Feather name="plus" size={16} color={colors.primary} />
              </Pressable>
              <Pressable
                onPress={() => router.push("/savings")}
                style={{ flexDirection: "row", alignItems: "center", gap: 2 }}
              >
                <Text
                  style={[styles.txSectionAction, { color: colors.primary }]}
                >
                  View all
                </Text>
                <Feather
                  name="chevron-right"
                  size={14}
                  color={colors.primary}
                />
              </Pressable>
            </View>
          </View>

          {savingsGoals.length === 0 ? (
            <Pressable
              onPress={() => router.push("/savings")}
              style={[
                styles.emptySavingsCard,
                { backgroundColor: colors.surface },
              ]}
            >
              <Feather name="target" size={24} color={colors.primary} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[styles.emptySavingsTitle, { color: colors.fg }]}>
                  Start a Savings Goal
                </Text>
                <Text
                  style={[styles.emptySavingsSub, { color: colors.fgMuted }]}
                >
                  Set targets for travel, gadgets, emergency & more
                </Text>
              </View>
              <Feather name="plus-circle" size={20} color={colors.primary} />
            </Pressable>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                gap: spacing[3],
                paddingRight: spacing[4],
              }}
            >
              {savingsGoals.map((goal) => (
                <CategoryProgressCard
                  key={goal.id}
                  title={goal.name}
                  amount={goal.currentAmount}
                  targetOrLimit={goal.targetAmount}
                  color={colors.primary}
                  iconName={goal.category || goal.name}
                  imageUrl={goal.imageUrl}
                  targetDate={goal.targetDate}
                  isGoal={true}
                  currency={settings.currency}
                  onPress={() => router.push("/savings")}
                  onAddPress={() => {
                    void Haptics.selectionAsync();
                    setDepositGoal(goal);
                    setDepositAmount("");
                    const def = accounts.find((a) => a.isDefault) || accounts[0];
                    setDepositAccountId(def?.id || "");
                  }}
                />
              ))}
            </ScrollView>
          )}
        </View>
      </ScrollView>

      {/* Centered Deposit Funds Modal with Account Deduction */}
      <Modal
        visible={!!depositGoal}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setDepositGoal(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalOverlayCenter}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setDepositGoal(null)}
          />
          <View
            style={[
              styles.modalCardCenter,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            {/* Modal Header */}
            <View style={styles.modalHeaderRow}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  flex: 1,
                }}
              >
                <View
                  style={[
                    styles.goalHeaderIconWrap,
                    {
                      backgroundColor: `${colors.primary}20`,
                    },
                  ]}
                >
                  <Feather
                    name="target"
                    size={18}
                    color={colors.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.modalCardTitle, { color: colors.fg }]}
                    numberOfLines={1}
                  >
                    Add Funds
                  </Text>
                  <Text
                    style={[styles.modalCardSub, { color: colors.fgMuted }]}
                    numberOfLines={1}
                  >
                    {depositGoal?.name}
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={() => setDepositGoal(null)}
                hitSlop={8}
                style={[
                  styles.modalCloseBtn,
                  { backgroundColor: colors.surfaceRecessed },
                ]}
              >
                <Feather name="x" size={16} color={colors.fgMuted} />
              </Pressable>
            </View>

            {/* Deposit Amount Input */}
            <Text style={[styles.inputLabel, { color: colors.fgMuted }]}>
              DEPOSIT AMOUNT ({currencySymbol(settings.currency)})
            </Text>
            <TextInput
              value={depositAmount}
              onChangeText={(v) => setDepositAmount(v.replace(/[^0-9.]/g, ""))}
              placeholder="1000"
              placeholderTextColor={colors.fgSubtle}
              keyboardType="decimal-pad"
              autoFocus
              style={[
                styles.textInput,
                { backgroundColor: colors.surfaceRecessed, color: colors.fg },
              ]}
            />

            {/* Quick chips */}
            <View style={styles.quickChipsRow}>
              {[500, 1000, 2500, 5000].map((amt) => (
                <Pressable
                  key={amt}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    setDepositAmount(String(amt));
                  }}
                  style={[
                    styles.chip,
                    { backgroundColor: colors.surfaceRecessed },
                  ]}
                >
                  <Text style={[styles.chipText, { color: colors.fg }]}>
                    +{amt}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Account Selector Section to Deduct From */}
            {accounts.length > 0 && (
              <View style={{ marginBottom: spacing[4] }}>
                <Text style={[styles.inputLabel, { color: colors.fgMuted }]}>
                  DEDUCT FROM ACCOUNT
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.accountSelectorScroll}
                >
                  {accounts.map((acc) => {
                    const isSelected = depositAccountId === acc.id;
                    const bal = getAccountBalance(acc.id);
                    return (
                      <Pressable
                        key={acc.id}
                        onPress={() => {
                          void Haptics.selectionAsync();
                          setDepositAccountId(acc.id);
                        }}
                        style={[
                          styles.accountSelectorCard,
                          {
                            backgroundColor: isSelected
                              ? `${colors.primary}18`
                              : colors.surfaceRecessed,
                            borderColor: isSelected
                              ? colors.primary
                              : colors.border,
                          },
                        ]}
                      >
                        <BankLogo
                          accountName={acc.name}
                          size={22}
                          showBorder={false}
                        />
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.accountSelectorName,
                              {
                                color: isSelected ? colors.primary : colors.fg,
                                fontWeight: isSelected
                                  ? fontWeight.bold
                                  : fontWeight.medium,
                              },
                            ]}
                            numberOfLines={1}
                          >
                            {acc.name}
                          </Text>
                          <Text
                            style={[
                              styles.accountSelectorBal,
                              { color: colors.fgMuted },
                            ]}
                          >
                            {money(bal, settings.currency)}
                          </Text>
                        </View>
                        {isSelected && (
                          <Feather
                            name="check-circle"
                            size={14}
                            color={colors.primary}
                          />
                        )}
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Submit Button */}
            <Pressable
              onPress={async () => {
                const num = parseFloat(depositAmount.replace(/,/g, "").trim());
                if (depositGoal && !isNaN(num) && num > 0) {
                  void Haptics.notificationAsync(
                    Haptics.NotificationFeedbackType.Success,
                  );
                  await addFundsToGoal(
                    depositGoal.id,
                    num,
                    depositAccountId || undefined,
                  );
                  setDepositGoal(null);
                  setDepositAmount("");
                }
              }}
              style={[styles.submitBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.submitBtnText, { color: colors.onPrimary }]}>
                Confirm & Add Funds
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <QuickAddModal
        visible={quickAdd || !!editingTransaction}
        editingTransaction={editingTransaction}
        onClose={() => {
          setQuickAdd(false);
          setEditingTransaction(null);
          setQuickAddType("EXPENSE");
        }}
        initialType={quickAddType}
      />

      <AccessibilityDisclosureModal
        visible={a11yDisclosureVisible}
        onAgree={handleA11yAgree}
        onDecline={() => setA11yDisclosureVisible(false)}
      />

      {/* Matching Design Delete Confirmation Modal */}
      <DeleteConfirmationModal
        visible={!!deletingTx}
        title="Delete Transaction"
        message={
          deletingTx
            ? `Are you sure you want to delete "${deletingTx.description}" (${money(deletingTx.amount, settings.currency)})?`
            : ""
        }
        confirmText="Delete"
        onConfirm={async () => {
          if (deletingTx) {
            await deleteTransaction(deletingTx.id);
            setDeletingTx(null);
          }
        }}
        onCancel={() => setDeletingTx(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  bgGlow: {
    ...StyleSheet.absoluteFillObject,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing[5],
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  greetSmall: {
    fontSize: 15,
    lineHeight: 20,
  },
  greetName: {
    fontSize: 22,
    fontWeight: fontWeight.semibold,
    lineHeight: 28,
    marginTop: 2,
  },
  notifBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  notifBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#FF3B30",
    alignItems: "center",
    justifyContent: "center",
  },
  notifBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: fontWeight.bold,
  },
  profileImageContainer: {
    marginLeft: spacing[1],
  },
  profileImage: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  profileImageFallback: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  profileImageInitials: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },

  // Balance
  balanceSection: {
    paddingHorizontal: spacing[5],
    marginTop: spacing[4],
  },
  balanceLabel: {
    fontSize: 14,
    lineHeight: 20,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    marginTop: spacing[1],
  },
  balanceValue: {
    fontSize: 42,
    fontWeight: fontWeight.semibold,
    lineHeight: 48,
    fontVariant: ["tabular-nums"],
    letterSpacing: -0.5,
  },
  eyeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  moreBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  // Quick actions
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginTop: spacing[6],
    paddingHorizontal: spacing[4],
  },
  quickAction: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
  },
  quickActionCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: fontWeight.medium,
  },

  // Sections
  section: {
    marginTop: spacing[4],
    paddingHorizontal: spacing[4],
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[2],
  },
  sectionActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: fontWeight.semibold,
    lineHeight: 22,
  },
  sectionAction: {
    fontSize: 13,
    fontWeight: fontWeight.semibold,
  },

  // Account cards — premium wave design
  accountsScroll: {
    gap: spacing[3],
    paddingRight: spacing[4],
  },
  accountCardWrapper: {
    width: 280,
    height: 180,
    padding: 18,
    borderRadius: 22,
    justifyContent: "space-between",
    overflow: "hidden",
    shadowColor: "#102B24",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  limeGlow: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    top: -50,
    right: -40,
    transform: [{ scale: 1.3 }],
  },
  accountCardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  bankLogoContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  bankLogoLetter: {
    fontSize: 18,
    fontWeight: fontWeight.semibold,
  },
  accountInfo: {
    flex: 1,
  },
  accountAddBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  accountNameOnPrimary: {
    fontSize: 15,
    fontWeight: fontWeight.semibold,
  },
  accountTypeOnPrimary: {
    fontSize: 11,
    fontWeight: fontWeight.medium,
    marginTop: 2,
  },
  accountBalanceOnPrimary: {
    fontSize: 22,
    fontWeight: fontWeight.bold,
    fontVariant: ["tabular-nums"],
  },
  accountMaskOnPrimary: {
    fontSize: 11,
  },

  // Latest Transactions — WHITE CARD (header inside)
  txWhiteCard: {
    marginTop: spacing[6],
    marginHorizontal: spacing[4],
    borderRadius: 22,
    minHeight: 160,
  },
  txSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingBottom: 0,
  },
  txSectionTitle: {
    fontSize: 17,
    fontWeight: fontWeight.semibold,
    lineHeight: 22,
  },
  txSectionAction: {
    fontSize: 13,
    fontWeight: fontWeight.medium,
  },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  merchantLogo: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  merchantLetter: {
    fontSize: 18,
    fontWeight: fontWeight.semibold,
  },
  txContent: {
    flex: 1,
    gap: 2,
  },
  txTitle: {
    fontSize: 15,
    fontWeight: fontWeight.medium,
  },
  txSubtitle: {
    fontSize: 12,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: fontWeight.semibold,
    fontVariant: ["tabular-nums"],
  },
  txDivider: {
    height: 1,
    marginLeft: 72,
  },
  emptyTxCard: {
    alignItems: "center",
    justifyContent: "center",
    height: 140,
    gap: spacing[2],
  },
  emptyTxText: {
    fontSize: 14,
    fontWeight: fontWeight.medium,
  },

  // QuickAdd sheet
  sheetBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  sheetKeyboard: {
    width: "100%",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing[5],
    paddingTop: spacing[3],
    maxHeight: "88%",
  },
  handle: {
    width: 42,
    height: 4,
    borderRadius: radius.full,
    alignSelf: "center",
    marginBottom: spacing[4],
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[4],
  },
  sheetTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
  },
  sheetCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  typeSelector: {
    flexDirection: "row",
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  typeBtn: {
    flex: 1,
    paddingVertical: spacing[3],
    borderRadius: radius.md,
    alignItems: "center",
  },
  typeBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing[5],
    gap: spacing[2],
  },
  currencySymbol: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.semibold,
  },
  amountInput: {
    fontSize: fontSize.hero,
    fontWeight: fontWeight.semibold,
    fontVariant: ["tabular-nums"],
    minWidth: 100,
    textAlign: "center",
  },
  formRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    padding: spacing[4],
    borderRadius: radius.md,
    marginBottom: spacing[3],
  },
  formInput: {
    flex: 1,
    fontSize: fontSize.base,
  },
  formValue: {
    flex: 1,
    fontSize: fontSize.base,
  },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    padding: spacing[3],
    borderRadius: radius.md,
    marginBottom: spacing[3],
  },
  suggestionLabel: {
    fontSize: fontSize.sm,
  },
  suggestionCategory: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    flex: 1,
  },
  saveBtn: {
    paddingVertical: spacing[4],
    borderRadius: radius.full,
    alignItems: "center",
    marginTop: spacing[3],
  },
  saveBtnText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },

  // Picker styles
  pickerBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  pickerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.6)",
    zIndex: 999,
    elevation: 20,
  },
  pickerEmpty: {
    textAlign: "center",
    paddingVertical: spacing[6],
    fontSize: fontSize.sm,
  },
  pickerSheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing[5],
    paddingTop: spacing[3],
    maxHeight: "75%",
    minHeight: 300,
  },
  pickerHandle: {
    width: 42,
    height: 4,
    borderRadius: radius.full,
    alignSelf: "center",
    marginBottom: spacing[4],
  },
  pickerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing[4],
  },
  pickerList: {
    maxHeight: 380,
    flexGrow: 0,
  },
  pickerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    padding: spacing[3],
    borderRadius: radius.md,
    marginBottom: spacing[1],
  },
  pickerIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  pickerItemInfo: {
    flex: 1,
  },
  pickerItemText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  pickerItemSub: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  pickerClose: {
    paddingVertical: spacing[3],
    borderRadius: radius.md,
    alignItems: "center",
    marginTop: spacing[3],
    marginBottom: spacing[2],
  },
  pickerCloseText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  homeSavingsSection: {
    marginTop: spacing[6],
    paddingHorizontal: spacing[4],
  },
  savingsBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  savingsBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  emptySavingsCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    padding: spacing[4],
    borderRadius: radius.lg,
    marginTop: spacing[2],
  },
  emptySavingsTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  emptySavingsSub: {
    fontSize: fontSize.xs,
  },
  homeGoalCard: {
    width: 200,
    padding: spacing[4],
    borderRadius: radius.lg,
  },
  homeGoalTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  homeGoalPill: {
    width: 8,
    height: 16,
    borderRadius: radius.full,
  },
  homeGoalName: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  homeGoalPct: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  homeGoalSaved: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  homeGoalTarget: {
    fontSize: fontSize.xs,
    marginBottom: spacing[2],
  },
  homeGoalTrack: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  homeGoalFill: {
    height: "100%",
    borderRadius: 2,
  },
  homePlusAction: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  // Centered Savings Goal Deposit Modal
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing[4],
  },
  modalCardCenter: {
    width: "100%",
    maxWidth: 380,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing[5],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing[4],
  },
  goalHeaderIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCardTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  modalCardSub: {
    fontSize: fontSize.xs,
    marginTop: 1,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  accountSelectorScroll: {
    gap: spacing[2],
    paddingVertical: 4,
  },
  accountSelectorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.lg,
    borderWidth: 1,
    minWidth: 140,
  },
  accountSelectorName: {
    fontSize: fontSize.xs,
  },
  accountSelectorBal: {
    fontSize: 10,
    marginTop: 1,
  },
  inputLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    marginBottom: spacing[2],
  },
  textInput: {
    borderRadius: radius.md,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    fontSize: fontSize.base,
    marginBottom: spacing[4],
  },
  quickChipsRow: {
    flexDirection: "row",
    gap: spacing[2],
    marginBottom: spacing[5],
  },
  chip: {
    flex: 1,
    paddingVertical: spacing[2],
    borderRadius: radius.full,
    alignItems: "center",
  },
  chipText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  submitBtn: {
    borderRadius: radius.md,
    paddingVertical: spacing[4],
    alignItems: "center",
    marginBottom: spacing[2],
  },
  submitBtnText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },

  // Accessibility Banner (Natural Flow)
  a11yBannerCard: {
    marginHorizontal: spacing[4],
    marginTop: spacing[4],
    marginBottom: spacing[2],
    borderRadius: radius.lg,
    padding: spacing[4],
    borderWidth: 1,
  },
  a11yBannerHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing[3],
  },
  a11yBannerBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  a11yBannerTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    marginBottom: 4,
  },
  a11yBannerSubtitle: {
    fontSize: fontSize.xs,
    lineHeight: 16,
  },
  a11yBannerClose: {
    padding: 2,
  },
  a11yBannerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    height: 40,
    borderRadius: radius.md,
    marginTop: spacing[3],
  },
  a11yBannerBtnText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
});
