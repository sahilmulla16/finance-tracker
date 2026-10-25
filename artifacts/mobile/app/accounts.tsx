import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState, useMemo } from "react";
import {
  Alert,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useFinance,
  type Account,
} from "@/context/FinanceContext";
import { useColors } from "@/hooks/useColors";
import { spacing, radius, fontWeight } from "@/constants/tokens";
import { money } from "@/utils/format";
import {
  AccountCard,
  DeleteConfirmationModal,
  getCardLast4,
  type InlineAccountDraft,
} from "@/components/ui";
import { calculateNewOpeningBalance } from "@/utils/accountCards";
import { haptics } from "@/utils/haptics";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function AccountsScreen() {
  const {
    accounts,
    transactions,
    addAccount,
    updateAccount,
    deleteAccount,
    setDefaultAccount,
    getAccountBalance,
    getTotalBalance,
    settings,
  } = useFinance();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  // Direct Inline Card Editing State for existing accounts
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<InlineAccountDraft | null>(null);
  const [editNameError, setEditNameError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Direct Inline Card Editing State for creating a new account
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newDraft, setNewDraft] = useState<InlineAccountDraft>({
    name: "",
    displayName: "",
    type: "BANK",
    balanceInput: "0",
    colorThemeIndex: 0,
    accountNumberLast4: "",
    cardLast4: "",
  });
  const [newNameError, setNewNameError] = useState(false);

  // Deletion modals state
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [reassignModalVisible, setReassignModalVisible] = useState(false);
  const [reassignTargetId, setReassignTargetId] = useState<string | null>(null);

  // Safe total liquidity using existing app calculation engine
  const totalBalance = useMemo(() => {
    return getTotalBalance();
  }, [getTotalBalance]);

  // Active accounts breakdown
  const activeAccounts = useMemo(() => {
    return accounts.filter((a) => a.isActive !== false);
  }, [accounts]);

  const linkedTxnCount = useMemo(() => {
    if (!accountToDelete) return 0;
    return transactions.filter(
      (t) =>
        t.accountId === accountToDelete.id ||
        t.fromAccountId === accountToDelete.id ||
        t.toAccountId === accountToDelete.id,
    ).length;
  }, [accountToDelete, transactions]);

  const eligibleDestinationAccounts = useMemo(() => {
    if (!accountToDelete) return [];
    return accounts.filter(
      (a) => a.id !== accountToDelete.id && a.isActive !== false,
    );
  }, [accountToDelete, accounts]);

  const accountCounts = useMemo(() => {
    let banks = 0;
    let cash = 0;
    let upi = 0;
    let savings = 0;
    let cards = 0;

    for (const acc of activeAccounts) {
      if (acc.type === "BANK") banks++;
      else if (acc.type === "CASH") cash++;
      else if (acc.type === "UPI") upi++;
      else if (acc.type === "SAVINGS") savings++;
      else if (acc.type === "CARD" || acc.type === "CREDIT" || !!acc.cardLast4) cards++;
    }
    return { banks, cash, upi, savings, cards };
  }, [activeAccounts]);

  // Start creating new account directly inline on a draft card
  const handleStartNew = () => {
    void haptics.selection();
    setEditingAccountId(null);
    setEditDraft(null);
    setEditNameError(false);
    setNewDraft({
      name: "",
      displayName: "",
      type: "BANK",
      balanceInput: "0",
      colorThemeIndex: activeAccounts.length % 3,
      accountNumberLast4: "",
      cardLast4: "",
    });
    setNewNameError(false);
    setIsCreatingNew(true);
  };

  const handleCancelNew = () => {
    void haptics.selection();
    setIsCreatingNew(false);
    setNewNameError(false);
  };

  const handleSaveNew = async () => {
    if (isSubmitting) return;
    const trimmedName = newDraft.name.trim();
    if (!trimmedName) {
      setNewNameError(true);
      void haptics.warning();
      return;
    }

    setIsSubmitting(true);
    const targetBalance = parseFloat(newDraft.balanceInput) || 0;

    try {
      await addAccount({
        name: trimmedName,
        displayName: newDraft.displayName.trim() || undefined,
        type: newDraft.type,
        currency: settings.currency || "INR",
        openingBalance: targetBalance,
        isDefault: accounts.length === 0,
        isActive: true,
        colorThemeIndex: ((newDraft.colorThemeIndex ?? (accounts.length % 3)) % 3 + 3) % 3,
        customColor: undefined,
        accountNumberLast4: newDraft.accountNumberLast4?.trim() || undefined,
        cardLast4: newDraft.cardLast4?.trim() || undefined,
      });
      void haptics.success();
      setIsCreatingNew(false);
      setNewNameError(false);
    } catch (err) {
      Alert.alert("Error", "Failed to create account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Start inline editing of an existing card
  const handleStartEdit = (account: Account) => {
    void haptics.selection();
    setIsCreatingNew(false);
    setNewNameError(false);
    setEditingAccountId(account.id);
    setEditDraft({
      name: account.name || "",
      displayName: account.displayName || "",
      type: account.type || "BANK",
      balanceInput: getAccountBalance(account.id).toString(),
      colorThemeIndex:
        account.colorThemeIndex !== undefined
          ? ((account.colorThemeIndex % 3) + 3) % 3
          : 0,
      accountNumberLast4: account.accountNumberLast4 || "",
      cardLast4: account.cardLast4 || "",
    });
    setEditNameError(false);
  };

  const handleCancelEdit = () => {
    void haptics.selection();
    setEditingAccountId(null);
    setEditDraft(null);
    setEditNameError(false);
  };

  const handleSaveEdit = async (account: Account) => {
    if (!editDraft || isSubmitting) return;
    const trimmedName = editDraft.name.trim();
    if (!trimmedName) {
      setEditNameError(true);
      void haptics.warning();
      return;
    }

    setIsSubmitting(true);
    const targetBalance = parseFloat(editDraft.balanceInput) || 0;

    try {
      // Accounting reconciliation: preserves historical transaction integrity
      const currentLive = getAccountBalance(account.id);
      const newOpening = calculateNewOpeningBalance(
        targetBalance,
        currentLive,
        account.openingBalance || 0,
      );

      await updateAccount({
        ...account,
        name: trimmedName,
        displayName: editDraft.displayName.trim() || undefined,
        type: editDraft.type,
        currency: account.currency || settings.currency || "INR",
        openingBalance: newOpening,
        colorThemeIndex:
          editDraft.colorThemeIndex !== undefined
            ? ((editDraft.colorThemeIndex % 3) + 3) % 3
            : ((account.colorThemeIndex ?? 0) % 3 + 3) % 3,
        customColor: undefined,
        accountNumberLast4: editDraft.accountNumberLast4?.trim() || undefined,
        cardLast4: editDraft.cardLast4?.trim() || undefined,
      });
      void haptics.success();
      setEditingAccountId(null);
      setEditDraft(null);
      setEditNameError(false);
    } catch (err) {
      Alert.alert("Error", "Failed to save account changes. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetDefault = async (accountId: string) => {
    void haptics.selection();
    await setDefaultAccount(accountId);
  };

  const promptDeleteAccount = (account: Account) => {
    void haptics.warning();
    setAccountToDelete(account);

    const linkedCount = transactions.filter(
      (t) =>
        t.accountId === account.id ||
        t.fromAccountId === account.id ||
        t.toAccountId === account.id,
    ).length;

    if (linkedCount === 0) {
      setDeleteModalVisible(true);
    } else {
      const eligible = accounts.filter(
        (a) => a.id !== account.id && a.isActive !== false,
      );
      if (eligible.length === 0) {
        Alert.alert(
          "Cannot Delete Account",
          `"${account.name}" has ${linkedCount} linked transaction${linkedCount === 1 ? "" : "s"}, and there are no other active accounts to receive them. Please create another account first or delete its transactions.`,
        );
        setAccountToDelete(null);
        return;
      }
      setReassignTargetId(eligible[0].id);
      setReassignModalVisible(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!accountToDelete || isSubmitting) return;
    setIsSubmitting(true);
    try {
      void haptics.strong();
      const success = await deleteAccount(accountToDelete.id);
      if (success) {
        setDeleteModalVisible(false);
        setAccountToDelete(null);
      }
    } catch {
      Alert.alert("Error", "Failed to delete account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmReassign = async () => {
    if (!accountToDelete || !reassignTargetId || isSubmitting) return;
    setIsSubmitting(true);
    try {
      void haptics.strong();
      const success = await deleteAccount(accountToDelete.id, reassignTargetId);
      if (success) {
        setReassignModalVisible(false);
        setAccountToDelete(null);
        setReassignTargetId(null);
      }
    } catch {
      Alert.alert("Error", "Failed to reassign transactions and delete account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.canvas }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing[3] }]}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.surface }]}
          hitSlop={8}
          accessibilityLabel="Back to previous screen"
        >
          <Feather name="arrow-left" size={20} color={colors.fg} />
        </Pressable>

        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.fg }]}>
            Accounts & Wallets
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.fgMuted }]}>
            Manage your money in one place
          </Text>
        </View>

        <Pressable
          onPress={handleStartNew}
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          hitSlop={8}
          accessibilityLabel="Add new account"
        >
          <Feather name="plus" size={16} color={colors.onPrimary} />
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
        keyboardShouldPersistTaps="handled"
      >
        {/* Total Liquidity Overview Card */}
        <View
          style={[
            styles.totalOverviewCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.totalHeaderRow}>
            <Text style={[styles.totalOverviewLabel, { color: colors.fgMuted }]}>
              TOTAL PORTFOLIO LIQUIDITY
            </Text>
            <Feather name="credit-card" size={14} color={colors.primary} />
          </View>

          <Text style={[styles.totalOverviewAmount, { color: colors.fg }]}>
            {money(totalBalance, settings.currency || "INR")}
          </Text>

          <View style={styles.breakdownRow}>
            <View
              style={[
                styles.statPill,
                { backgroundColor: colors.surfaceElevated },
              ]}
            >
              <Text style={[styles.statPillText, { color: colors.fg }]}>
                {activeAccounts.length}{" "}
                {activeAccounts.length === 1 ? "Account" : "Accounts"}
              </Text>
            </View>

            {accountCounts.cards > 0 && (
              <View
                style={[
                  styles.statPill,
                  { backgroundColor: colors.surfaceElevated },
                ]}
              >
                <Text style={[styles.statPillText, { color: colors.fgMuted }]}>
                  {accountCounts.cards} {accountCounts.cards === 1 ? "Card" : "Cards"}
                </Text>
              </View>
            )}

            {accountCounts.banks > 0 && (
              <View
                style={[
                  styles.statPill,
                  { backgroundColor: colors.surfaceElevated },
                ]}
              >
                <Text style={[styles.statPillText, { color: colors.fgMuted }]}>
                  {accountCounts.banks} Bank
                </Text>
              </View>
            )}

            {accountCounts.cash > 0 && (
              <View
                style={[
                  styles.statPill,
                  { backgroundColor: colors.surfaceElevated },
                ]}
              >
                <Text style={[styles.statPillText, { color: colors.fgMuted }]}>
                  {accountCounts.cash} Cash
                </Text>
              </View>
            )}

            {accountCounts.upi > 0 && (
              <View
                style={[
                  styles.statPill,
                  { backgroundColor: colors.surfaceElevated },
                ]}
              >
                <Text style={[styles.statPillText, { color: colors.fgMuted }]}>
                  {accountCounts.upi} UPI
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Section Title */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionHeading, { color: colors.fg }]}>
            Your Accounts & Wallets
          </Text>
          <Text style={[styles.sectionCountText, { color: colors.fgSubtle }]}>
            {activeAccounts.length}
          </Text>
        </View>

        {/* Draft Card for Creating New Account Directly Inline */}
        {isCreatingNew && (
          <View style={styles.accountCardWrapper}>
            <AccountCard
              name={newDraft.name}
              displayName={newDraft.displayName}
              type={newDraft.type}
              balance={parseFloat(newDraft.balanceInput) || 0}
              currency={settings.currency || "INR"}
              colorThemeIndex={newDraft.colorThemeIndex ?? (activeAccounts.length % 3)}
              width={Math.min(SCREEN_WIDTH - 36, 350)}
              height={192}
              isEditing={true}
              editDraft={newDraft}
              onDraftChange={(field, val) => {
                setNewDraft((d) => ({ ...d, [field]: val }));
                if (field === "name" && newNameError && val.trim()) {
                  setNewNameError(false);
                }
              }}
              hasNameError={newNameError}
              isSaving={isSubmitting}
              onSaveInline={handleSaveNew}
              onCancelInline={handleCancelNew}
              showActions={true}
              testID="new-account-inline-card"
            />
          </View>
        )}

        {/* Account Cards List or Empty State */}
        {activeAccounts.length === 0 && !isCreatingNew ? (
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
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
              Add your bank accounts, cash wallets, or UPI to track your net
              worth and live card balances.
            </Text>
            <Pressable
              onPress={handleStartNew}
              style={[
                styles.emptyCreateBtn,
                { backgroundColor: colors.primary },
              ]}
            >
              <Feather name="plus" size={16} color={colors.onPrimary} />
              <Text
                style={[styles.emptyCreateBtnText, { color: colors.onPrimary }]}
              >
                Add Your First Account
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.cardsListContainer}>
            {activeAccounts.map((account, index) => {
              const isCardEditing = editingAccountId === account.id && editDraft !== null;
              const liveBalance = getAccountBalance(account.id);

              return (
                <View key={account.id} style={styles.accountCardWrapper}>
                  {isCardEditing && editDraft ? (
                    <AccountCard
                      name={editDraft.name}
                      displayName={editDraft.displayName}
                      type={editDraft.type}
                      balance={parseFloat(editDraft.balanceInput) || 0}
                      currency={account.currency || settings.currency || "INR"}
                      last4={account.cardLast4 || account.accountNumberLast4 || getCardLast4(account.id, index)}
                      network={index % 2 === 0 ? "mastercard" : "visa"}
                      colorThemeIndex={
                        editDraft.colorThemeIndex !== undefined
                          ? editDraft.colorThemeIndex
                          : (account.colorThemeIndex !== undefined
                          ? account.colorThemeIndex
                          : index % 3)
                      }
                      isDefault={account.isDefault}
                      width={Math.min(SCREEN_WIDTH - 36, 350)}
                      height={192}
                      isEditing={true}
                      editDraft={editDraft}
                      onDraftChange={(field, val) => {
                        setEditDraft((d) => (d ? { ...d, [field]: val } : null));
                        if (field === "name" && editNameError && val.trim()) {
                          setEditNameError(false);
                        }
                      }}
                      hasNameError={editNameError}
                      isSaving={isSubmitting}
                      onSaveInline={() => void handleSaveEdit(account)}
                      onCancelInline={handleCancelEdit}
                      showActions={true}
                      testID={`account-inline-card-${account.id}`}
                    />
                  ) : (
                    <AccountCard
                      name={account.name}
                      displayName={account.displayName}
                      type={account.type}
                      balance={liveBalance}
                      currency={account.currency || settings.currency || "INR"}
                      last4={account.cardLast4 || account.accountNumberLast4 || getCardLast4(account.id, index)}
                      network={index % 2 === 0 ? "mastercard" : "visa"}
                      colorThemeIndex={
                        account.colorThemeIndex !== undefined
                          ? account.colorThemeIndex
                          : index % 3
                      }
                      isDefault={account.isDefault}
                      width={Math.min(SCREEN_WIDTH - 36, 350)}
                      height={186}
                      interactive={true}
                      onPress={() => handleStartEdit(account)}
                      showActions={true}
                      onEdit={() => handleStartEdit(account)}
                      onSetDefault={() => void handleSetDefault(account.id)}
                      onViewTransactions={() =>
                        router.push({
                          pathname: "/(tabs)/expenses",
                          params: { accountId: account.id },
                        })
                      }
                      onDelete={() => promptDeleteAccount(account)}
                      testID={`account-card-${account.id}`}
                    />
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Delete Confirmation Modal (for accounts with 0 transactions) */}
      <DeleteConfirmationModal
        visible={deleteModalVisible}
        title="Delete Account"
        message={
          accountToDelete
            ? `Are you sure you want to delete "${accountToDelete.name}"? This account has no linked transactions and will be removed permanently.`
            : "Are you sure you want to delete this account?"
        }
        confirmText={isSubmitting ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteModalVisible(false);
          setAccountToDelete(null);
        }}
      />

      {/* Reassign Transactions & Delete Modal (for accounts with linked transactions) */}
      <DeleteConfirmationModal
        visible={reassignModalVisible}
        title="Reassign & Delete"
        message={
          accountToDelete
            ? `"${accountToDelete.name}" has ${linkedTxnCount} linked transaction${linkedTxnCount === 1 ? "" : "s"}. Select a destination account to preserve your financial records:`
            : "Select a destination account."
        }
        confirmText={isSubmitting ? "Reassigning..." : "Reassign & Delete"}
        cancelText="Cancel"
        isDestructive={true}
        onConfirm={handleConfirmReassign}
        onCancel={() => {
          setReassignModalVisible(false);
          setAccountToDelete(null);
          setReassignTargetId(null);
        }}
      >
        <View style={styles.reassignPickerContainer}>
          <Text style={[styles.reassignPickerLabel, { color: colors.fgMuted }]}>
            REASSIGN TO DESTINATION ACCOUNT
          </Text>
          <ScrollView
            style={styles.reassignAccountsList}
            contentContainerStyle={styles.reassignAccountsListContent}
            nestedScrollEnabled
          >
            {eligibleDestinationAccounts.map((dest) => {
              const isSelected = reassignTargetId === dest.id;
              const destBalance = getAccountBalance(dest.id);
              return (
                <Pressable
                  key={dest.id}
                  onPress={() => {
                    void haptics.selection();
                    setReassignTargetId(dest.id);
                  }}
                  style={[
                    styles.reassignAccountRow,
                    {
                      backgroundColor: isSelected
                        ? `${colors.primary}15`
                        : colors.surfaceRecessed,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${dest.name} as destination`}
                  accessibilityState={{ selected: isSelected }}
                >
                  <View style={styles.reassignAccountInfo}>
                    <Text
                      style={[styles.reassignAccountName, { color: colors.fg }]}
                      numberOfLines={1}
                    >
                      {dest.name}
                    </Text>
                    <Text
                      style={[
                        styles.reassignAccountBalance,
                        { color: colors.fgMuted },
                      ]}
                    >
                      {money(destBalance, dest.currency || settings.currency || "INR")}{" "}
                      • {dest.type}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.reassignRadioCircle,
                      {
                        borderColor: isSelected ? colors.primary : colors.border,
                        backgroundColor: isSelected ? colors.primary : "transparent",
                      },
                    ]}
                  >
                    {isSelected && (
                      <Feather name="check" size={11} color={colors.onPrimary} />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>

          {Boolean(reassignTargetId) && (
            <Text style={[styles.reassignSummaryHint, { color: colors.fgSubtle }]}>
              {linkedTxnCount} transaction{linkedTxnCount === 1 ? "" : "s"} will be safely moved to{" "}
              <Text style={{ fontWeight: fontWeight.bold, color: colors.fg }}>
                {accounts.find((a) => a.id === reassignTargetId)?.name}
              </Text>.
            </Text>
          )}
        </View>
      </DeleteConfirmationModal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
    gap: spacing[3],
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: fontWeight.semibold,
  },
  content: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
  },

  // Total Overview Card
  totalOverviewCard: {
    borderRadius: radius.xl,
    padding: spacing[4],
    borderWidth: 1,
    marginBottom: spacing[5],
  },
  totalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalOverviewLabel: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.8,
  },
  totalOverviewAmount: {
    fontSize: 30,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.8,
    marginVertical: spacing[2],
  },
  breakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    flexWrap: "wrap",
    marginTop: 2,
  },
  statPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  statPillText: {
    fontSize: 11.5,
    fontWeight: fontWeight.medium,
  },

  // Section
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing[4],
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: fontWeight.semibold,
  },
  sectionCountText: {
    fontSize: 13,
    fontWeight: fontWeight.medium,
  },

  // Cards List
  cardsListContainer: {
    gap: spacing[4],
  },
  accountCardWrapper: {
    alignItems: "center",
    marginBottom: spacing[2],
  },

  // Empty State
  emptyCard: {
    borderRadius: radius.xl,
    padding: spacing[6],
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing[2],
  },
  emptyIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing[3],
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: fontWeight.bold,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 280,
    marginBottom: spacing[4],
  },
  emptyCreateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.full,
  },
  emptyCreateBtnText: {
    fontSize: 13,
    fontWeight: fontWeight.semibold,
  },
  // Reassign Modal
  reassignPickerContainer: {
    width: "100%",
    paddingTop: 6,
    gap: 8,
  },
  reassignPickerLabel: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  reassignAccountsList: {
    maxHeight: 180,
  },
  reassignAccountsListContent: {
    gap: 8,
  },
  reassignAccountRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  reassignAccountInfo: {
    flex: 1,
    gap: 2,
  },
  reassignAccountName: {
    fontSize: 14,
    fontWeight: fontWeight.bold,
  },
  reassignAccountBalance: {
    fontSize: 12,
  },
  reassignRadioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  reassignSummaryHint: {
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 4,
    textAlign: "center",
  },
});
