import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useFinance,
  type Account,
  type AccountType,
  type Currency,
} from "@/context/FinanceContext";
import { useColors } from "@/hooks/useColors";
import { spacing, radius, fontSize, fontWeight } from "@/constants/tokens";
import { money } from "@/utils/format";
import { BankLogo } from "@/components/ui";
import { haptics } from "@/utils/haptics";

const accountTypeOptions: {
  value: AccountType;
  label: string;
  icon: string;
}[] = [
  { value: "BANK", label: "Bank", icon: "credit-card" },
  { value: "CASH", label: "Cash", icon: "dollar-sign" },
  { value: "UPI", label: "UPI", icon: "smartphone" },
  { value: "SAVINGS", label: "Savings", icon: "target" },
  { value: "OTHER", label: "Other", icon: "more-horizontal" },
];

const accountTypeLabels: Record<AccountType, string> = {
  CASH: "Cash",
  BANK: "Bank Account",
  UPI: "UPI Wallet",
  SAVINGS: "Savings",
  OTHER: "Other",
};

function AccountEditor({
  visible,
  initial,
  onClose,
}: {
  visible: boolean;
  initial?: Account;
  onClose: () => void;
}) {
  const { addAccount, updateAccount, getAccountBalance, settings } =
    useFinance();
  const colors = useColors();
  const [name, setName] = useState(initial?.name || "");
  const [type, setType] = useState<AccountType>(initial?.type || "BANK");
  const [currency, setCurrency] = useState(
    initial?.currency || settings.currency || "INR",
  );
  const [balanceInput, setBalanceInput] = useState(
    initial ? getAccountBalance(initial.id).toString() : "0",
  );
  const [isDefault, setIsDefault] = useState(initial?.isDefault || false);

  React.useEffect(() => {
    if (initial) {
      setName(initial.name);
      setType(initial.type);
      setCurrency(initial.currency);
      setBalanceInput(getAccountBalance(initial.id).toString());
      setIsDefault(initial.isDefault);
    } else {
      setName("");
      setType("BANK");
      setCurrency(settings.currency || "INR");
      setBalanceInput("0");
      setIsDefault(false);
    }
  }, [initial, visible, getAccountBalance, settings.currency]);

  const save = async () => {
    if (!name.trim()) {
      Alert.alert("Required", "Please enter an account name.");
      return;
    }
    const targetBalance = parseFloat(balanceInput) || 0;
    if (initial) {
      const currentLive = getAccountBalance(initial.id);
      const netTxns = currentLive - (initial.openingBalance || 0);
      const newOpening = targetBalance - netTxns;
      await updateAccount({
        ...initial,
        name: name.trim(),
        type,
        currency,
        openingBalance: newOpening,
        isDefault,
      });
    } else {
      await addAccount({
        name: name.trim(),
        type,
        currency,
        openingBalance: targetBalance,
        isDefault,
        isActive: true,
      });
    }
    void haptics.success();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.editor, { backgroundColor: colors.surface }]}>
          <View style={[styles.handle, { backgroundColor: colors.fgSubtle }]} />
          <View style={styles.editorHeader}>
            <Text style={[styles.editorTitle, { color: colors.fg }]}>
              {initial ? "Edit Account" : "Add New Account"}
            </Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Feather name="x" size={20} color={colors.fgMuted} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Visual Logo Preview */}
            <View style={{ alignItems: "center", marginVertical: spacing[3] }}>
              <BankLogo
                accountName={name || "Bank Account"}
                accountType={type}
                size={54}
                showBorder
              />
            </View>

            {/* Account Name */}
            <Text style={[styles.label, { color: colors.fgMuted }]}>
              ACCOUNT NAME
            </Text>
            <TextInput
              autoFocus={!initial}
              value={name}
              onChangeText={setName}
              placeholder="e.g. HDFC Bank, Cash Wallet"
              placeholderTextColor={colors.fgSubtle}
              style={[
                styles.textInput,
                { backgroundColor: colors.surfaceRecessed, color: colors.fg },
              ]}
            />

            {/* Account Type Selector */}
            <Text style={[styles.label, { color: colors.fgMuted }]}>
              ACCOUNT TYPE
            </Text>
            <View style={styles.typeOptionsRow}>
              {accountTypeOptions.map((opt) => {
                const isSelected = type === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setType(opt.value)}
                    style={[
                      styles.typeChip,
                      {
                        backgroundColor: isSelected
                          ? colors.primary
                          : colors.surfaceRecessed,
                      },
                    ]}
                  >
                    <Feather
                      name={opt.icon as never}
                      size={14}
                      color={isSelected ? colors.onPrimary : colors.fgMuted}
                    />
                    <Text
                      style={[
                        styles.typeChipText,
                        {
                          color: isSelected ? colors.onPrimary : colors.fg,
                        },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Currency Selector */}
            <Text style={[styles.label, { color: colors.fgMuted }]}>
              CURRENCY
            </Text>
            <View style={styles.currencyRow}>
              {Array.from(
                new Set([settings.currency || "INR", "INR", "USD", "EUR", "GBP", "AED"])
              ).map((c) => {
                const isSelected = currency === c;
                return (
                  <Pressable
                    key={c}
                    onPress={() => setCurrency(c as Currency)}
                    style={[
                      styles.currencyChip,
                      {
                        backgroundColor: isSelected
                          ? colors.primary
                          : colors.surfaceRecessed,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.currencyChipText,
                        {
                          color: isSelected ? colors.onPrimary : colors.fg,
                        },
                      ]}
                    >
                      {c}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Balance */}
            <Text style={[styles.label, { color: colors.fgMuted }]}>
              {initial ? "CURRENT BALANCE" : "OPENING BALANCE"}
            </Text>
            <TextInput
              value={balanceInput}
              onChangeText={(v) => setBalanceInput(v.replace(/[^0-9.-]/g, ""))}
              placeholder="0"
              placeholderTextColor={colors.fgSubtle}
              keyboardType="decimal-pad"
              style={[
                styles.textInput,
                { backgroundColor: colors.surfaceRecessed, color: colors.fg },
              ]}
            />

            {/* Default Account Check */}
            <Pressable
              onPress={() => setIsDefault(!isDefault)}
              style={styles.defaultToggleRow}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor: isDefault ? colors.primary : colors.border,
                    backgroundColor: isDefault
                      ? colors.primary
                      : "transparent",
                  },
                ]}
              >
                {isDefault && <Feather name="check" size={12} color="#FFF" />}
              </View>
              <Text style={[styles.defaultToggleText, { color: colors.fg }]}>
                Set as default wallet for new expenses
              </Text>
            </Pressable>

            {/* Submit Button */}
            <Pressable
              onPress={() => void save()}
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            >
              <Text
                style={[styles.primaryButtonText, { color: colors.onPrimary }]}
              >
                {initial ? "Save Changes" : "Create Account"}
              </Text>
              <Feather name="check" size={18} color={colors.onPrimary} />
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default function AccountsScreen() {
  const { accounts, deleteAccount, setDefaultAccount, getAccountBalance, settings } =
    useFinance();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [editorVisible, setEditorVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | undefined>();

  const openEditor = (account?: Account) => {
    setEditingAccount(account);
    setEditorVisible(true);
  };

  const totalBalance = accounts.reduce(
    (sum, a) => sum + getAccountBalance(a.id),
    0,
  );

  const removeAccount = async (account: Account) => {
    Alert.alert("Delete Account", `Remove "${account.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          void haptics.strong();
          const success = await deleteAccount(account.id);
          if (!success) {
            const otherAccounts = accounts.filter(
              (a) => a.id !== account.id && a.isActive,
            );
            if (otherAccounts.length > 0) {
              Alert.alert(
                "Account Has Transactions",
                "Choose a replacement account to associate past transactions with:",
                [
                  { text: "Cancel", style: "cancel" },
                  ...otherAccounts.map((a) => ({
                    text: a.name,
                    onPress: () => {
                      void haptics.strong();
                      void deleteAccount(account.id, a.id);
                    },
                  })),
                ],
              );
            }
          }
        },
      },
    ]);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.canvas }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing[3] }]}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.surface }]}
          hitSlop={8}
        >
          <Feather name="arrow-left" size={20} color={colors.fg} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.fg }]}>
          Accounts & Wallets
        </Text>
        <Pressable
          onPress={() => openEditor()}
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          hitSlop={8}
        >
          <Feather name="plus" size={18} color={colors.onPrimary} />
          <Text style={[styles.addBtnText, { color: colors.onPrimary }]}>
            New
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 60 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Total Liquidity Overview Card */}
        <View style={[styles.totalOverviewCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.totalOverviewLabel, { color: colors.fgMuted }]}>
            TOTAL WALLET LIQUIDITY
          </Text>
          <Text style={[styles.totalOverviewAmount, { color: colors.fg }]}>
            {money(totalBalance, settings.currency)}
          </Text>
          <Text style={[styles.totalOverviewCount, { color: colors.fgSubtle }]}>
            {accounts.length} active {accounts.length === 1 ? "account" : "accounts"}
          </Text>
        </View>

        {accounts.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
            <View
              style={[
                styles.emptyIconBg,
                { backgroundColor: `${colors.primary}18` },
              ]}
            >
              <Feather name="credit-card" size={32} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.fg }]}>
              No Accounts Yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.fgMuted }]}>
              Add your bank accounts, cash wallets, or UPI to track your net worth and balances.
            </Text>
            <Pressable
              onPress={() => openEditor()}
              style={[
                styles.emptyCreateBtn,
                { backgroundColor: colors.primary },
              ]}
            >
              <Feather name="plus" size={16} color={colors.onPrimary} />
              <Text
                style={[
                  styles.emptyCreateBtnText,
                  { color: colors.onPrimary },
                ]}
              >
                Add Your First Account
              </Text>
            </Pressable>
          </View>
        ) : (
          accounts.map((account) => {
            const liveBalance = getAccountBalance(account.id);
            return (
              <View
                key={account.id}
                style={[
                  styles.accountCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <BankLogo
                  accountName={account.name}
                  accountType={account.type}
                  size={44}
                  showBorder
                />
                <View style={styles.accountInfo}>
                  <View style={styles.nameRow}>
                    <Text
                      style={[styles.accountName, { color: colors.fg }]}
                      numberOfLines={1}
                    >
                      {account.name}
                    </Text>
                    {account.isDefault && (
                      <View
                        style={[
                          styles.defaultBadge,
                          { backgroundColor: `${colors.primary}18` },
                        ]}
                      >
                        <Text
                          style={[
                            styles.defaultBadgeText,
                            { color: colors.primary },
                          ]}
                        >
                          Default
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.accountType, { color: colors.fgMuted }]}>
                    {accountTypeLabels[account.type]} · {account.currency}
                  </Text>
                </View>

                {/* Right Column: Balance & Actions */}
                <View style={styles.accountRight}>
                  <Text style={[styles.balanceText, { color: colors.fg }]}>
                    {money(liveBalance, account.currency)}
                  </Text>
                  <View style={styles.cardActionsRow}>
                    <Pressable
                      onPress={() => openEditor(account)}
                      hitSlop={8}
                      style={styles.actionIconBtn}
                    >
                      <Feather
                        name="edit-2"
                        size={15}
                        color={colors.fgSubtle}
                      />
                    </Pressable>
                    <Pressable
                      onPress={() => void removeAccount(account)}
                      hitSlop={8}
                      style={styles.actionIconBtn}
                    >
                      <Feather
                        name="trash-2"
                        size={15}
                        color={colors.fgSubtle}
                      />
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <AccountEditor
        visible={editorVisible}
        initial={editingAccount}
        onClose={() => setEditorVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
  },
  addBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  content: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
    gap: spacing[3],
  },
  totalOverviewCard: {
    borderRadius: radius.xl,
    padding: spacing[4],
    marginBottom: spacing[2],
  },
  totalOverviewLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    letterSpacing: 1,
    marginBottom: spacing[1],
  },
  totalOverviewAmount: {
    fontSize: fontSize["3xl"],
    fontWeight: fontWeight.bold,
  },
  totalOverviewCount: {
    fontSize: fontSize.xs,
    marginTop: spacing[1],
  },
  emptyCard: {
    borderRadius: radius.xl,
    padding: spacing[6],
    alignItems: "center",
    gap: spacing[3],
  },
  emptyIconBg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    textAlign: "center",
    lineHeight: 20,
  },
  emptyCreateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: radius.full,
    marginTop: spacing[2],
  },
  emptyCreateBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  accountCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing[4],
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing[3],
  },
  accountInfo: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  accountName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    flexShrink: 1,
  },
  defaultBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 1,
    borderRadius: radius.full,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
  },
  accountType: {
    fontSize: fontSize.xs,
  },
  accountRight: {
    alignItems: "flex-end",
    gap: spacing[1],
  },
  balanceText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    fontVariant: ["tabular-nums"],
  },
  cardActionsRow: {
    flexDirection: "row",
    gap: spacing[1],
  },
  actionIconBtn: {
    padding: spacing[1],
    borderRadius: radius.sm,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  editor: {
    borderTopLeftRadius: radius.hero,
    borderTopRightRadius: radius.hero,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    paddingBottom: spacing[6],
    maxHeight: "85%",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: radius.full,
    alignSelf: "center",
    marginBottom: spacing[3],
  },
  editorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[2],
  },
  editorTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    letterSpacing: 1,
    marginBottom: spacing[1],
    marginTop: spacing[3],
  },
  textInput: {
    borderRadius: radius.md,
    padding: spacing[3],
    fontSize: fontSize.base,
  },
  typeOptionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },
  typeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
  },
  typeChipText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  currencyRow: {
    flexDirection: "row",
    gap: spacing[2],
  },
  currencyChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
  },
  currencyChipText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  defaultToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    marginTop: spacing[4],
    marginBottom: spacing[2],
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  defaultToggleText: {
    fontSize: fontSize.sm,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    borderRadius: radius.md,
    padding: spacing[3],
    marginTop: spacing[4],
  },
  primaryButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
});
