import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Image,
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useFinance,
  type Category,
  type Account,
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

function MerchantLogo({
  description,
  category,
}: {
  description: string;
  category?: string;
}) {
  const logo = getMerchantLogo(description, category);
  return (
    <View style={[styles.merchantLogo, { backgroundColor: logo.bg }]}>
      <Text style={[styles.merchantLetter, { color: logo.color }]}>
        {logo.letter}
      </Text>
    </View>
  );
}

function BankLogoIcon({ name }: { name: string }) {
  const logo = getBankLogo(name);
  return (
    <View style={[styles.bankLogoContainer, { backgroundColor: logo.bg }]}>
      <Text style={[styles.bankLogoLetter, { color: logo.color }]}>
        {logo.letter}
      </Text>
    </View>
  );
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
            ? ["#171B2B", "#273344", "#3B4055"]
            : ["#E8EAF0", "#D5D9E4", "#C2C8D6"]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          styles.purpleGlow,
          {
            backgroundColor: "#AC9AD0",
            opacity: isDark ? 0.22 : 0.12,
          },
        ]}
      />

      <View style={styles.accountCardContent}>
        <BankLogoIcon name={account?.name || "Cash Wallet"} />
        <View style={styles.accountInfo}>
          <Text
            style={[
              styles.accountNameOnPrimary,
              { color: isDark ? "#FFFFFF" : "#101C3D" },
            ]}
            numberOfLines={1}
          >
            {account?.name || "Cash Wallet"}
          </Text>
          <Text
            style={[
              styles.accountTypeOnPrimary,
              {
                color: isDark
                  ? "rgba(255,255,255,0.6)"
                  : "rgba(16,28,61,0.6)",
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
                ? "rgba(255,255,255,0.1)"
                : "rgba(16,28,61,0.08)",
            },
          ]}
        >
          <Feather
            name="plus"
            size={14}
            color={
              isDark ? "rgba(255,255,255,0.6)" : "rgba(16,28,61,0.5)"
            }
          />
        </View>
      </View>
      <Text
        style={[
          styles.accountBalanceOnPrimary,
          { color: isDark ? "#FFFFFF" : "#101C3D" },
        ]}
      >
        {accountsVisible
          ? money(balance, currency as any)
          : "••••••"}
      </Text>
      <Text
        style={[
          styles.accountMaskOnPrimary,
          {
            color: isDark
              ? "rgba(255,255,255,0.5)"
              : "rgba(16,28,61,0.5)",
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
}: {
  visible: boolean;
  categories: Category[];
  selected: Category | null;
  onSelect: (cat: Category) => void;
  onClose: () => void;
}) {
  const colors = useColors();
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.pickerBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.pickerSheet, { backgroundColor: colors.canvas }]}>
          <View
            style={[styles.pickerHandle, { backgroundColor: colors.fgSubtle }]}
          />
          <Text style={[styles.pickerTitle, { color: colors.fg }]}>
            Select Category
          </Text>
          <ScrollView
            style={styles.pickerList}
            showsVerticalScrollIndicator={false}
          >
            {categories.map((cat) => (
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
                <View
                  style={[
                    styles.pickerIcon,
                    { backgroundColor: cat.color + "20" },
                  ]}
                >
                  <Feather
                    name={cat.icon as never}
                    size={18}
                    color={cat.color}
                  />
                </View>
                <Text style={[styles.pickerItemText, { color: colors.fg }]}>
                  {cat.name}
                </Text>
                {selected?.id === cat.id && (
                  <Feather name="check" size={18} color={colors.primary} />
                )}
              </Pressable>
            ))}
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
    </Modal>
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
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.pickerBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.pickerSheet, { backgroundColor: colors.canvas }]}>
          <View
            style={[styles.pickerHandle, { backgroundColor: colors.fgSubtle }]}
          />
          <Text style={[styles.pickerTitle, { color: colors.fg }]}>
            Select Account
          </Text>
          <ScrollView
            style={styles.pickerList}
            showsVerticalScrollIndicator={false}
          >
            {accounts
              .filter((a) => a.isActive)
              .map((acc) => (
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
                  <BankLogoIcon name={acc.name} />
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
              ))}
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
    </Modal>
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
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);
  const [accountPickerVisible, setAccountPickerVisible] = useState(false);

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
      setSelectedDate(new Date().toISOString().split("T")[0]);
      setSuggestedCategory(null);
      setCategoryManuallySelected(false);
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
      await addTransaction({
        type: "TRANSFER",
        amount: parsed,
        description: description.trim() || "Transfer",
        accountId: finalAccount?.id,
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
      onRequestClose={onClose}
    >
      <View style={styles.sheetBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.sheetKeyboard}
        >
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: colors.canvas,
                paddingBottom: Math.max(insets.bottom, 18),
              },
            ]}
          >
            <View
              style={[styles.handle, { backgroundColor: colors.fgSubtle }]}
            />
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
                <Text
                  style={[styles.currencySymbol, { color: colors.primary }]}
                >
                  {currencySymbol(settings.currency)}
                </Text>
                <TextInput
                  autoFocus
                  value={amount}
                  onChangeText={(v) => setAmount(v.replace(/[^0-9.]/g, ""))}
                  placeholder="0.00"
                  placeholderTextColor={colors.fgSubtle}
                  keyboardType="decimal-pad"
                  style={[styles.amountInput, { color: colors.fg }]}
                />
              </View>

              <View
                style={[styles.formRow, { backgroundColor: colors.surface }]}
              >
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
                    style={[
                      styles.suggestionCategory,
                      { color: colors.primary },
                    ]}
                  >
                    {suggestedCategory}
                  </Text>
                  <Feather
                    name="arrow-right"
                    size={14}
                    color={colors.primary}
                  />
                </Pressable>
              )}

              <Pressable
                onPress={() => setCategoryPickerVisible(true)}
                style={[styles.formRow, { backgroundColor: colors.surface }]}
              >
                <Feather name="tag" size={18} color={colors.fgMuted} />
                <Text
                  style={[
                    styles.formValue,
                    { color: selectedCategory ? colors.fg : colors.fgSubtle },
                  ]}
                >
                  {selectedCategory?.name || "Select category"}
                </Text>
                <Feather
                  name="chevron-right"
                  size={18}
                  color={colors.fgSubtle}
                />
              </Pressable>

              <Pressable
                onPress={() => setAccountPickerVisible(true)}
                style={[styles.formRow, { backgroundColor: colors.surface }]}
              >
                <Feather name="credit-card" size={18} color={colors.fgMuted} />
                <Text
                  style={[
                    styles.formValue,
                    { color: selectedAccount ? colors.fg : colors.fgSubtle },
                  ]}
                >
                  {selectedAccount?.name || "Select account"}
                </Text>
                <Feather
                  name="chevron-right"
                  size={18}
                  color={colors.fgSubtle}
                />
              </Pressable>

              <View
                style={[styles.formRow, { backgroundColor: colors.surface }]}
              >
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
                  <Text
                    style={[styles.saveBtnText, { color: colors.onPrimary }]}
                  >
                    Save Transaction
                  </Text>
                </Pressable>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>

      <CategoryPicker
        visible={categoryPickerVisible}
        categories={categories}
        selected={selectedCategory}
        onSelect={handleCategorySelect}
        onClose={() => setCategoryPickerVisible(false)}
      />

      <AccountPicker
        visible={accountPickerVisible}
        accounts={accounts}
        selected={selectedAccount}
        onSelect={setSelectedAccount}
        onClose={() => setAccountPickerVisible(false)}
        currency={settings.currency}
      />
    </Modal>
  );
}

export default function HomeScreen() {
  const { transactions, accounts, settings, getAccountBalance } = useFinance();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [quickAdd, setQuickAdd] = useState(false);
  const [quickAddType, setQuickAddType] = useState<
    "EXPENSE" | "INCOME" | "TRANSFER"
  >("EXPENSE");
  const [balanceVisible, setBalanceVisible] = useState(false);
  const [accountsVisible, setAccountsVisible] = useState(false);

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
              style={[styles.notifBtn, { backgroundColor: colors.surface }]}
            >
              <Feather name="bell" size={20} color={colors.fg} />
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>3</Text>
              </View>
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
                    <MerchantLogo
                      description={tx.description}
                      category={tx.category}
                    />
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
      </ScrollView>

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
    justifyContent: "center",
    gap: spacing[8],
    marginTop: spacing[8],
    paddingHorizontal: spacing[4],
  },
  quickAction: {
    alignItems: "center",
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

  // Account cards — premium gradient
  accountsScroll: {
    gap: spacing[3],
    paddingRight: spacing[4],
  },
  accountCardWrapper: {
    width: 260,
    height: 165,
    padding: 18,
    borderRadius: 22,
    justifyContent: "space-between",
    overflow: "hidden",
  },
  purpleGlow: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    top: -75,
    right: -55,
    transform: [{ scale: 1.2 }],
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
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  sheetKeyboard: {
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing[5],
    paddingTop: spacing[3],
    maxHeight: "85%",
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
  pickerSheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing[5],
    paddingTop: spacing[3],
    maxHeight: "60%",
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
    flex: 1,
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
});
