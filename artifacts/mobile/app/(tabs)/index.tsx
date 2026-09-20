import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
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
} from "@/context/FinanceContext";
import { useColors } from "@/hooks/useColors";
import { money, currencySymbol, getGreeting, formatDate } from "@/utils/format";
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
} from "@/components/ui";

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
      <Text style={[styles.accountBalanceOnPrimary, { color: "#FFFFFF" }]}>
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
            ? `•••• •••• ${account.id.slice(-4)}`
            : "•••• •••• 0000"
          : "•••• •••• ••••"}
      </Text>
    </Pressable>
  );
}

function CategoryPicker({
  visible,
  categories,
  selected,
  onSelect,
  onClose,
  transactionType,
}: {
  visible: boolean;
  categories: Category[];
  selected: Category | null;
  onSelect: (cat: Category) => void;
  onClose: () => void;
  transactionType?: "EXPENSE" | "INCOME" | "TRANSFER";
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  const filteredCategories = categories.filter((cat) => {
    if (!transactionType || transactionType === "TRANSFER") return true;
    const t = transactionType.toLowerCase();
    return cat.type === t || cat.type === "both" || !cat.type;
  });

  return (
    <View style={styles.pickerOverlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View
        style={[
          styles.pickerSheet,
          {
            backgroundColor: colors.canvas,
            paddingBottom: Math.max(insets.bottom, 20),
          },
        ]}
      >
        <View
          style={[styles.pickerHandle, { backgroundColor: colors.fgSubtle }]}
        />
        <Text style={[styles.pickerTitle, { color: colors.fg }]}>
          Select Category
        </Text>
        <ScrollView
          style={styles.pickerList}
          contentContainerStyle={{ paddingBottom: spacing[4] }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {filteredCategories.length === 0 ? (
            <Text style={[styles.pickerEmpty, { color: colors.fgMuted }]}>
              No categories yet.{"\n"}Create one in Profile → Categories
            </Text>
          ) : (
            filteredCategories.map((cat) => (
              <Pressable
                key={cat.id}
                onPress={() => {
                  onSelect(cat);
                  onClose();
                }}
                style={[
                  styles.pickerItem,
                  {
                    backgroundColor:
                      selected?.id === cat.id
                        ? `${colors.primary}15`
                        : "transparent",
                  },
                ]}
              >
                <CategoryVisual
                  categoryName={cat.name}
                  iconName={cat.icon}
                  size="small"
                />
                <Text style={[styles.pickerItemText, { color: colors.fg }]}>
                  {cat.name}
                </Text>
                {selected?.id === cat.id && (
                  <Feather name="check" size={18} color={colors.primary} />
                )}
              </Pressable>
            ))
          )}
        </ScrollView>
        <Pressable
          onPress={onClose}
          style={[styles.pickerClose, { backgroundColor: colors.surface }]}
        >
          <Text style={[styles.pickerCloseText, { color: colors.fgMuted }]}>
            Cancel
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function AccountPicker({
  visible,
  accounts,
  selected,
  onSelect,
  onClose,
  currency,
}: {
  visible: boolean;
  accounts: Account[];
  selected: Account | null;
  onSelect: (acc: Account) => void;
  onClose: () => void;
  currency: string;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  const activeAccounts = accounts.filter((a) => a.isActive !== false);

  return (
    <View style={styles.pickerOverlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View
        style={[
          styles.pickerSheet,
          {
            backgroundColor: colors.canvas,
            paddingBottom: Math.max(insets.bottom, 20),
          },
        ]}
      >
        <View
          style={[styles.pickerHandle, { backgroundColor: colors.fgSubtle }]}
        />
        <Text style={[styles.pickerTitle, { color: colors.fg }]}>
          Select Account
        </Text>
        <ScrollView
          style={styles.pickerList}
          contentContainerStyle={{ paddingBottom: spacing[4] }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {activeAccounts.length === 0 ? (
            <Text style={[styles.pickerEmpty, { color: colors.fgMuted }]}>
              No accounts yet.{"\n"}Create one in Profile → Accounts
            </Text>
          ) : (
            activeAccounts.map((acc) => (
              <Pressable
                key={acc.id}
                onPress={() => {
                  onSelect(acc);
                  onClose();
                }}
                style={[
                  styles.pickerItem,
                  {
                    backgroundColor:
                      selected?.id === acc.id
                        ? `${colors.primary}15`
                        : "transparent",
                  },
                ]}
              >
                <BankLogo
                  accountName={acc.name}
                  accountType={acc.type}
                  size="medium"
                />
                <View style={styles.pickerItemInfo}>
                  <Text style={[styles.pickerItemText, { color: colors.fg }]}>
                    {acc.name}
                  </Text>
                  <Text
                    style={[styles.pickerItemSub, { color: colors.fgMuted }]}
                  >
                    {acc.type} · {money(acc.openingBalance, acc.currency)}
                  </Text>
                </View>
                {selected?.id === acc.id && (
                  <Feather name="check" size={18} color={colors.primary} />
                )}
              </Pressable>
            ))
          )}
        </ScrollView>
        <Pressable
          onPress={onClose}
          style={[styles.pickerClose, { backgroundColor: colors.surface }]}
        >
          <Text style={[styles.pickerCloseText, { color: colors.fgMuted }]}>
            Cancel
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function QuickAdd({
  visible,
  onClose,
  initialType = "EXPENSE",
}: {
  visible: boolean;
  onClose: () => void;
  initialType?: "EXPENSE" | "INCOME" | "TRANSFER";
}) {
  const { categories, accounts, addTransaction, addExpense, settings } =
    useFinance();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const amountInputRef = useRef<TextInput>(null);

  const [type, setType] = useState<"EXPENSE" | "INCOME" | "TRANSFER">(
    initialType,
  );
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(
    accounts.find((a) => a.isDefault) || accounts[0] || null,
  );
  const [selectedToAccount, setSelectedToAccount] = useState<Account | null>(
    null,
  );
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);
  const [accountPickerVisible, setAccountPickerVisible] = useState(false);
  const [toAccountPickerVisible, setToAccountPickerVisible] = useState(false);

  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(
    null,
  );
  const [categoryManuallySelected, setCategoryManuallySelected] =
    useState(false);

  useEffect(() => {
    if (description.trim().length >= 2 && !categoryManuallySelected) {
      const suggested = suggestCategory(description);
      setSuggestedCategory(suggested);
    } else {
      setSuggestedCategory(null);
    }
  }, [description, categoryManuallySelected]);

  useEffect(() => {
    if (visible) {
      setType(initialType);
      setAmount("");
      setDescription("");
      setSelectedCategory(null);
      setSelectedAccount(
        accounts.find((a) => a.isDefault) || accounts[0] || null,
      );
      setSelectedToAccount(null);
      setSelectedDate(new Date().toISOString().split("T")[0]);
      setSuggestedCategory(null);
      setCategoryManuallySelected(false);
      setCategoryPickerVisible(false);
      setAccountPickerVisible(false);
      setToAccountPickerVisible(false);
    }
  }, [visible, initialType, accounts]);

  const handleCategorySelect = (cat: Category) => {
    setSelectedCategory(cat);
    setCategoryManuallySelected(true);
    setSuggestedCategory(null);
  };

  const handleSuggestedCategoryTap = () => {
    if (suggestedCategory) {
      const cat = categories.find((c) => c.name === suggestedCategory);
      if (cat) handleCategorySelect(cat);
    }
  };

  const save = async () => {
    const parsed = Number(amount.replace(/,/g, ""));
    if (!parsed || parsed <= 0) return;

    const now = new Date();
    const date = selectedDate || now.toISOString().split("T")[0];
    const time = now.toTimeString().slice(0, 5);

    const finalCategory = selectedCategory || categories[0];
    const finalAccount = selectedAccount || accounts[0];

    if (type === "EXPENSE") {
      await addTransaction({
        type: "EXPENSE",
        amount: parsed,
        description: description.trim() || finalCategory.name,
        category: finalCategory.name,
        categoryId: finalCategory.id,
        accountId: finalAccount?.id,
        date,
        time,
      });
      await addExpense(
        parsed,
        description.trim() || finalCategory.name,
        finalCategory,
        finalAccount?.name,
      );
    } else if (type === "INCOME") {
      await addTransaction({
        type: "INCOME",
        amount: parsed,
        description: description.trim() || "Income",
        category: finalCategory.name,
        categoryId: finalCategory.id,
        accountId: finalAccount?.id,
        date,
        time,
      });
    } else {
      const fromAccount = finalAccount;
      const toAccount =
        selectedToAccount ||
        accounts.find((a) => a.id !== fromAccount?.id) ||
        accounts[0];
      await addTransaction({
        type: "TRANSFER",
        amount: parsed,
        description: description.trim() || "Transfer",
        accountId: fromAccount?.id,
        fromAccountId: fromAccount?.id,
        toAccountId: toAccount?.id,
        date,
        time,
      });
    }

    setAmount("");
    setDescription("");
    setSelectedCategory(null);
    setSuggestedCategory(null);
    setCategoryManuallySelected(false);
    onClose();
  };

  const showSaveButton = amount.trim() && Number(amount.replace(/,/g, "")) > 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onShow={() => {
        // Focus only after the modal slide animation has fully finished docking
        amountInputRef.current?.focus();
      }}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.sheetBackdrop}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.canvas,
              paddingBottom: Math.max(insets.bottom, 18),
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: colors.fgSubtle }]} />
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: colors.fg }]}>
              Quick Track
            </Text>
            <Pressable
              onPress={onClose}
              style={[
                styles.sheetCloseBtn,
                { backgroundColor: colors.surface },
              ]}
            >
              <Feather name="x" size={18} color={colors.fgMuted} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 24 }}
          >
            <View style={styles.typeSelector}>
              {(["EXPENSE", "INCOME", "TRANSFER"] as const).map((t) => (
                <Pressable
                  key={t}
                  onPress={() => {
                    setType(t);
                    void Haptics.selectionAsync();
                  }}
                  style={[
                    styles.typeBtn,
                    {
                      backgroundColor:
                        type === t ? colors.primary : colors.surface,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.typeBtnText,
                      {
                        color: type === t ? colors.onPrimary : colors.fgMuted,
                      },
                    ]}
                  >
                    {t}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.amountContainer}>
              <Text style={[styles.currencySymbol, { color: colors.primary }]}>
                {currencySymbol(settings.currency)}
              </Text>
              <TextInput
                ref={amountInputRef}
                value={amount}
                onChangeText={(v) => setAmount(v.replace(/[^0-9.]/g, ""))}
                placeholder="0.00"
                placeholderTextColor={colors.fgSubtle}
                keyboardType="decimal-pad"
                inputMode="decimal"
                returnKeyType="done"
                style={[styles.amountInput, { color: colors.fg }]}
              />
            </View>

            <View style={[styles.formRow, { backgroundColor: colors.surface }]}>
              <Feather name="file-text" size={18} color={colors.fgMuted} />
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="What did you spend on?"
                placeholderTextColor={colors.fgSubtle}
                style={[styles.formInput, { color: colors.fg }]}
              />
            </View>

            {suggestedCategory && !selectedCategory && (
              <Pressable
                onPress={handleSuggestedCategoryTap}
                style={[
                  styles.suggestionRow,
                  { backgroundColor: `${colors.primary}10` },
                ]}
              >
                <Feather name="zap" size={14} color={colors.primary} />
                <Text
                  style={[styles.suggestionLabel, { color: colors.fgMuted }]}
                >
                  Suggested:
                </Text>
                <Text
                  style={[styles.suggestionCategory, { color: colors.primary }]}
                >
                  {suggestedCategory}
                </Text>
                <Feather name="arrow-right" size={14} color={colors.primary} />
              </Pressable>
            )}

            <Pressable
              onPress={() => {
                Keyboard.dismiss();
                setCategoryPickerVisible(true);
              }}
              style={[styles.formRow, { backgroundColor: colors.surface }]}
            >
              {selectedCategory ? (
                <CategoryVisual
                  categoryName={selectedCategory.name}
                  iconName={selectedCategory.icon}
                  size="small"
                />
              ) : (
                <Feather name="tag" size={18} color={colors.fgMuted} />
              )}
              <Text
                style={[
                  styles.formValue,
                  { color: selectedCategory ? colors.fg : colors.fgSubtle },
                ]}
              >
                {selectedCategory?.name || "Select category"}
              </Text>
              <Feather name="chevron-right" size={18} color={colors.fgSubtle} />
            </Pressable>

            <Pressable
              onPress={() => {
                Keyboard.dismiss();
                setAccountPickerVisible(true);
              }}
              style={[styles.formRow, { backgroundColor: colors.surface }]}
            >
              {selectedAccount ? (
                <BankLogo
                  accountName={selectedAccount.name}
                  accountType={selectedAccount.type}
                  size="small"
                />
              ) : (
                <Feather name="credit-card" size={18} color={colors.fgMuted} />
              )}
              <Text
                style={[
                  styles.formValue,
                  { color: selectedAccount ? colors.fg : colors.fgSubtle },
                ]}
              >
                {type === "TRANSFER" ? "From: " : ""}
                {selectedAccount?.name || "Select account"}
              </Text>
              <Feather name="chevron-right" size={18} color={colors.fgSubtle} />
            </Pressable>

            {type === "TRANSFER" && (
              <Pressable
                onPress={() => {
                  Keyboard.dismiss();
                  setToAccountPickerVisible(true);
                }}
                style={[styles.formRow, { backgroundColor: colors.surface }]}
              >
                {selectedToAccount ? (
                  <BankLogo
                    accountName={selectedToAccount.name}
                    accountType={selectedToAccount.type}
                    size="small"
                  />
                ) : (
                  <Feather
                    name="arrow-right-circle"
                    size={18}
                    color={colors.fgMuted}
                  />
                )}
                <Text
                  style={[
                    styles.formValue,
                    {
                      color: selectedToAccount ? colors.fg : colors.fgSubtle,
                    },
                  ]}
                >
                  To: {selectedToAccount?.name || "Select destination"}
                </Text>
                <Feather
                  name="chevron-right"
                  size={18}
                  color={colors.fgSubtle}
                />
              </Pressable>
            )}

            <View style={[styles.formRow, { backgroundColor: colors.surface }]}>
              <Feather name="calendar" size={18} color={colors.fgMuted} />
              <Text style={[styles.formValue, { color: colors.fg }]}>
                {selectedDate}
              </Text>
            </View>

            {showSaveButton && (
              <Pressable
                onPress={() => void save()}
                style={[styles.saveBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.saveBtnText, { color: colors.onPrimary }]}>
                  Save Transaction
                </Text>
              </Pressable>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      <CategoryPicker
        visible={categoryPickerVisible}
        categories={categories}
        selected={selectedCategory}
        onSelect={handleCategorySelect}
        onClose={() => setCategoryPickerVisible(false)}
        transactionType={type}
      />

      <AccountPicker
        visible={accountPickerVisible}
        accounts={accounts}
        selected={selectedAccount}
        onSelect={setSelectedAccount}
        onClose={() => setAccountPickerVisible(false)}
        currency={settings.currency}
      />

      <AccountPicker
        visible={toAccountPickerVisible}
        accounts={accounts.filter((a) => a.id !== selectedAccount?.id)}
        selected={selectedToAccount}
        onSelect={setSelectedToAccount}
        onClose={() => setToAccountPickerVisible(false)}
        currency={settings.currency}
      />
    </Modal>
  );
}

export default function HomeScreen() {
  const {
    transactions,
    accounts,
    settings,
    getAccountBalance,
    savingsGoals,
    addFundsToGoal,
    unreadNotificationsCount,
  } = useFinance();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [quickAdd, setQuickAdd] = useState(false);
  const [quickAddType, setQuickAddType] = useState<
    "EXPENSE" | "INCOME" | "TRANSFER"
  >("EXPENSE");
  const [balanceVisible, setBalanceVisible] = useState(false);
  const [accountsVisible, setAccountsVisible] = useState(false);
  const [depositGoal, setDepositGoal] = useState<SavingsGoal | null>(null);
  const [depositAmount, setDepositAmount] = useState("");

  useEffect(() => {
    const unsub = registerQuickAddListener((type) => {
      if (type) setQuickAddType(type);
      setQuickAdd(true);
    });
    return unsub;
  }, []);

  const totalBalance = useMemo(
    () => accounts.reduce((sum, a) => sum + getAccountBalance(a.id), 0),
    [accounts, getAccountBalance],
  );

  const latestTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [transactions]);

  const greeting = getGreeting();
  const firstName = settings.profileName.split(" ")[0] || "there";

  const initials = settings.profileName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const formatAmount = (tx: { type: string; amount: number }) => {
    const prefix =
      tx.type === "INCOME" ? "+" : tx.type === "EXPENSE" ? "-" : "";
    return `${prefix}${money(tx.amount, settings.currency)}`;
  };

  const getTxDateLabel = (dateStr: string) => {
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000)
      .toISOString()
      .split("T")[0];
    if (dateStr === today) return "Today";
    if (dateStr === yesterday) return "Yesterday";
    return formatDate(dateStr);
  };

  const isDark = colors.canvas === "#090B0A";

  return (
    <View style={[styles.screen, { backgroundColor: colors.canvas }]}>
      {isDark ? (
        <LinearGradient
          colors={["#18251A", "#0D120E", "#090B0A"]}
          locations={[0, 0.35, 0.75]}
          style={styles.bgGlow}
          start={{ x: 0.85, y: 0.05 }}
          end={{ x: 0.3, y: 0.6 }}
        />
      ) : null}

      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + spacing[5],
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
              {settings.profileImage ? (
                <Image
                  source={{ uri: settings.profileImage }}
                  style={styles.profileImage}
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
            <Text style={[styles.balanceValue, { color: colors.fg }]}>
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
          <Pressable
            style={styles.quickAction}
            onPress={() => {
              setQuickAddType("EXPENSE");
              setQuickAdd(true);
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }}
          >
            <View
              style={[
                styles.quickActionCircle,
                { backgroundColor: colors.primary },
              ]}
            >
              <Feather name="plus" size={22} color={colors.onPrimary} />
            </View>
            <Text style={[styles.quickActionLabel, { color: colors.fgMuted }]}>
              Add
            </Text>
          </Pressable>
          <Pressable
            style={styles.quickAction}
            onPress={() => {
              setQuickAddType("TRANSFER");
              setQuickAdd(true);
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
          </Pressable>
          <Pressable
            style={styles.quickAction}
            onPress={() => {
              setQuickAddType("INCOME");
              setQuickAdd(true);
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }}
          >
            <View
              style={[
                styles.quickActionCircle,
                { backgroundColor: colors.surface },
              ]}
            >
              <Feather name="arrow-down-left" size={20} color={colors.fg} />
            </View>
            <Text style={[styles.quickActionLabel, { color: colors.fgMuted }]}>
              Request
            </Text>
          </Pressable>
        </View>

        {/* My Accounts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.fg }]}>
              My Accounts
            </Text>
            <View style={styles.sectionActions}>
              <Pressable
                onPress={() => setAccountsVisible(!accountsVisible)}
                style={[styles.eyeBtn, { backgroundColor: colors.surface }]}
              >
                <Feather
                  name={accountsVisible ? "eye" : "eye-off"}
                  size={16}
                  color={colors.fgMuted}
                />
              </Pressable>
              <Pressable onPress={() => router.push("/accounts")}>
                <Text style={[styles.sectionAction, { color: colors.primary }]}>
                  See all
                </Text>
              </Pressable>
            </View>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.accountsScroll}
          >
            {accounts.filter((a) => a.isActive).length === 0 ? (
              <AccountCard
                accountsVisible={accountsVisible}
                currency={settings.currency}
                balance={0}
                onPress={() => router.push("/accounts")}
              />
            ) : (
              accounts
                .filter((a) => a.isActive)
                .map((account, index) => {
                  const isFirst = index === 0;
                  return (
                    <AccountCard
                      key={account.id}
                      account={account}
                      isFirst={isFirst}
                      accountsVisible={accountsVisible}
                      currency={account.currency}
                      balance={getAccountBalance(account.id)}
                      onPress={() => router.push("/accounts")}
                    />
                  );
                })
            )}
          </ScrollView>
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
              const isIncome = tx.type === "INCOME";
              return (
                <View key={tx.id}>
                  <View style={styles.txRow}>
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
                        {tx.category || "Transfer"} · {getTxDateLabel(tx.date)}
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
                  </View>
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
                  color={goal.color || colors.primary}
                  iconName={goal.category || goal.name}
                  isGoal={true}
                  currency={settings.currency}
                  onPress={() => router.push("/savings")}
                  onAddPress={() => {
                    void Haptics.selectionAsync();
                    setDepositGoal(goal);
                    setDepositAmount("");
                  }}
                />
              ))}
            </ScrollView>
          )}
        </View>
      </ScrollView>

      {/* Deposit Funds Bottom Sheet — exactly matching savings.tsx */}
      <Modal
        visible={!!depositGoal}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setDepositGoal(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setDepositGoal(null)}
          />
          <View
            style={[
              styles.modalSheet,
              {
                backgroundColor: colors.canvas,
                paddingBottom: Math.max(insets.bottom, 20),
              },
            ]}
          >
            <View
              style={[styles.modalHandle, { backgroundColor: colors.fgSubtle }]}
            />
            <Text style={[styles.modalTitle, { color: colors.fg }]}>
              Add Funds to {depositGoal?.name}
            </Text>

            <Text style={[styles.inputLabel, { color: colors.fgMuted }]}>
              Deposit Amount ({currencySymbol(settings.currency)})
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
                { backgroundColor: colors.surface, color: colors.fg },
              ]}
            />

            {/* Quick chips matching savings.tsx */}
            <View style={styles.quickChipsRow}>
              {[500, 1000, 2500, 5000].map((amt) => (
                <Pressable
                  key={amt}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    setDepositAmount(String(amt));
                  }}
                  style={[styles.chip, { backgroundColor: colors.surface }]}
                >
                  <Text style={[styles.chipText, { color: colors.fg }]}>
                    +{amt}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              onPress={async () => {
                const num = parseFloat(depositAmount.replace(/,/g, "").trim());
                if (depositGoal && !isNaN(num) && num > 0) {
                  void Haptics.notificationAsync(
                    Haptics.NotificationFeedbackType.Success,
                  );
                  await addFundsToGoal(depositGoal.id, num);
                  setDepositGoal(null);
                  setDepositAmount("");
                }
              }}
              style={[styles.submitBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.submitBtnText, { color: colors.onPrimary }]}>
                Confirm Deposit
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <QuickAdd
        visible={quickAdd}
        onClose={() => setQuickAdd(false)}
        initialType={quickAddType}
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
    paddingHorizontal: spacing[4],
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
    paddingHorizontal: spacing[4],
    marginTop: spacing[8],
  },
  balanceLabel: {
    fontSize: 14,
    lineHeight: 20,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    marginTop: spacing[2],
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

  // Quick actions
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginTop: spacing[8],
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
    marginTop: spacing[6],
    paddingHorizontal: spacing[4],
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[3],
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
  // Modals — matching savings.tsx bottom sheet
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing[5],
    paddingTop: spacing[3],
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: radius.full,
    alignSelf: "center",
    marginBottom: spacing[4],
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    marginBottom: spacing[4],
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
});
