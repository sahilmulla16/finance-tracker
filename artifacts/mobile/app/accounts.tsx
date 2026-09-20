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

const accountTypeOptions: {
  value: AccountType;
  label: string;
  icon: string;
}[] = [
  { value: "CASH", label: "Cash", icon: "dollar-sign" },
  { value: "BANK", label: "Bank Account", icon: "credit-card" },
  { value: "UPI", label: "UPI", icon: "smartphone" },
  { value: "SAVINGS", label: "Savings", icon: "target" },
  { value: "OTHER", label: "Other", icon: "more-horizontal" },
];

const accountTypeLabels: Record<AccountType, string> = {
  CASH: "Cash",
  BANK: "Bank Account",
  UPI: "UPI",
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
  const { addAccount, updateAccount } = useFinance();
  const colors = useColors();
  const [name, setName] = useState(initial?.name || "");
  const [type, setType] = useState<AccountType>(initial?.type || "CASH");
  const [currency, setCurrency] = useState(initial?.currency || "INR");
  const [openingBalance, setOpeningBalance] = useState(
    initial?.openingBalance?.toString() || "0",
  );
  const [isDefault, setIsDefault] = useState(initial?.isDefault || false);

  const save = async () => {
    if (!name.trim()) return;
    const balance = parseFloat(openingBalance) || 0;
    if (initial) {
      await updateAccount({
        ...initial,
        name: name.trim(),
        type,
        currency,
        openingBalance: balance,
        isDefault,
      });
    } else {
      await addAccount({
        name: name.trim(),
        type,
        currency,
        openingBalance: balance,
        isDefault,
        isActive: true,
      });
    }
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
              {initial ? "Edit account" : "Add account"}
            </Text>
            <Pressable onPress={onClose}>
              <Feather name="x" size={20} color={colors.fgMuted} />
            </Pressable>
          </View>

          <View style={{ alignItems: "center", marginVertical: spacing[3] }}>
            <BankLogo
              accountName={name}
              accountType={type}
              size="large"
              showBorder
            />
          </View>

          <Text style={[styles.label, { color: colors.fgMuted }]}>
            ACCOUNT NAME
          </Text>
          <TextInput
            autoFocus
            value={name}
            onChangeText={setName}
            placeholder="e.g. HDFC Bank"
            placeholderTextColor={colors.fgSubtle}
            style={[
              styles.textInput,
              { backgroundColor: colors.surfaceRecessed, color: colors.fg },
            ]}
          />

          <Text style={[styles.label, { color: colors.fgMuted }]}>
            ACCOUNT TYPE
          </Text>
          <View style={styles.optionRow}>
            {accountTypeOptions.map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => setType(opt.value)}
                style={[
                  styles.iconOption,
                  { backgroundColor: `${colors.primary}20` },
                  type === opt.value && { backgroundColor: colors.primary },
                ]}
              >
                <Feather
                  name={opt.icon as never}
                  size={18}
                  color={type === opt.value ? colors.onPrimary : colors.primary}
                />
              </Pressable>
            ))}
          </View>

          <Text style={[styles.label, { color: colors.fgMuted }]}>
            CURRENCY
          </Text>
          <View style={styles.optionRow}>
            {["INR", "USD", "EUR", "GBP", "AED"].map((c) => (
              <Pressable
                key={c}
                onPress={() => setCurrency(c as Currency)}
                style={[
                  styles.iconOption,
                  { backgroundColor: `${colors.primary}20` },
                  currency === c && { backgroundColor: colors.primary },
                ]}
              >
                <Text
                  style={[
                    styles.currencyOptionText,
                    { color: colors.primary },
                    currency === c && { color: colors.onPrimary },
                  ]}
                >
                  {c}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.label, { color: colors.fgMuted }]}>
            OPENING BALANCE
          </Text>
          <TextInput
            value={openingBalance}
            onChangeText={(v) => setOpeningBalance(v.replace(/[^0-9.-]/g, ""))}
            placeholder="0"
            placeholderTextColor={colors.fgSubtle}
            keyboardType="decimal-pad"
            style={[
              styles.textInput,
              { backgroundColor: colors.surfaceRecessed, color: colors.fg },
            ]}
          />

          <Pressable
            onPress={() => void save()}
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          >
            <Text
              style={[styles.primaryButtonText, { color: colors.onPrimary }]}
            >
              {initial ? "Save changes" : "Add account"}
            </Text>
            <Feather name="check" size={18} color={colors.onPrimary} />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default function AccountsScreen() {
  const { accounts, deleteAccount, setDefaultAccount } = useFinance();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [editorVisible, setEditorVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | undefined>();

  const openEditor = (account?: Account) => {
    setEditingAccount(account);
    setEditorVisible(true);
  };

  const removeAccount = async (account: Account) => {
    Alert.alert("Delete account", `Remove "${account.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const success = await deleteAccount(account.id);
          if (!success) {
            const otherAccounts = accounts.filter(
              (a) => a.id !== account.id && a.isActive,
            );
            if (otherAccounts.length > 0) {
              Alert.alert(
                "Account has transactions",
                "Choose a replacement account:",
                [
                  { text: "Cancel", style: "cancel" },
                  ...otherAccounts.map((a) => ({
                    text: a.name,
                    onPress: () => void deleteAccount(account.id, a.id),
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
      <View style={[styles.header, { paddingTop: insets.top + spacing[4] }]}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.surface }]}
        >
          <Feather name="arrow-left" size={20} color={colors.fg} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.fg }]}>Accounts</Text>
        <Pressable
          onPress={() => openEditor()}
          style={[styles.backBtn, { backgroundColor: colors.primary }]}
        >
          <Feather name="plus" size={20} color={colors.onPrimary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {accounts.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="credit-card" size={48} color={colors.fgSubtle} />
            <Text style={[styles.emptyTitle, { color: colors.fgMuted }]}>
              No accounts yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.fgSubtle }]}>
              Add your first account to get started
            </Text>
          </View>
        ) : (
          accounts.map((account) => {
            return (
              <View
                key={account.id}
                style={[
                  styles.accountCard,
                  { backgroundColor: colors.surface },
                ]}
              >
                <BankLogo
                  accountName={account.name}
                  accountType={account.type}
                  size="medium"
                />
                <View style={styles.accountInfo}>
                  <Text style={[styles.accountName, { color: colors.fg }]}>
                    {account.name}
                  </Text>
                  <Text style={[styles.accountType, { color: colors.fgMuted }]}>
                    {accountTypeLabels[account.type]} · {account.currency}
                  </Text>
                </View>
                <View style={styles.accountBalance}>
                  <Text style={[styles.balanceText, { color: colors.fg }]}>
                    {money(account.openingBalance, account.currency)}
                  </Text>
                  {account.isDefault && (
                    <Text
                      style={[styles.defaultBadge, { color: colors.primary }]}
                    >
                      Default
                    </Text>
                  )}
                </View>
                <View style={styles.accountActions}>
                  <Pressable
                    onPress={() => openEditor(account)}
                    style={[
                      styles.actionBtn,
                      { backgroundColor: colors.surfaceRecessed },
                    ]}
                  >
                    <Feather name="edit-2" size={16} color={colors.primary} />
                  </Pressable>
                  <Pressable
                    onPress={() => void removeAccount(account)}
                    style={[
                      styles.actionBtn,
                      { backgroundColor: colors.surfaceRecessed },
                    ]}
                  >
                    <Feather name="trash-2" size={16} color={colors.error} />
                  </Pressable>
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
    paddingBottom: spacing[4],
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  content: {
    padding: spacing[4],
    gap: spacing[3],
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing[12],
    gap: spacing[3],
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
  },
  accountCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing[4],
    borderRadius: radius.lg,
    gap: spacing[3],
  },
  accountLogo: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  accountLogoText: {
    fontSize: 18,
    fontWeight: fontWeight.semibold,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  accountType: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  accountBalance: {
    alignItems: "flex-end",
  },
  balanceText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    fontVariant: ["tabular-nums"],
  },
  defaultBadge: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    marginTop: 2,
  },
  accountActions: {
    flexDirection: "row",
    gap: spacing[2],
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  editor: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing[5],
    paddingBottom: spacing[8],
  },
  handle: {
    width: spacing[8],
    height: 1,
    borderRadius: radius.full,
    alignSelf: "center",
    marginBottom: spacing[4],
  },
  editorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[4],
  },
  editorTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold },
  label: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    letterSpacing: 1,
    marginBottom: spacing[2],
    marginTop: spacing[3],
  },
  textInput: {
    borderRadius: radius.sm,
    padding: spacing[3],
    fontSize: fontSize.base,
  },
  optionRow: { flexDirection: "row", gap: spacing[2], flexWrap: "wrap" },
  iconOption: {
    width: spacing[8],
    height: spacing[8],
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
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
  currencyOptionText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
});
