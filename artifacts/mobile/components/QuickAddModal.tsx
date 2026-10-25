import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
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
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import {
  useFinance,
  type Category,
  type Account,
  type Transaction,
} from "@/context/FinanceContext";
import { useColors } from "@/hooks/useColors";
import {
  money,
  currencySymbol,
  formatDate,
  formatTime,
  convertTo24Hour,
  getLocalDateString,
  getLocalTimeString,
} from "@/utils/format";
import { spacing, radius, fontSize, fontWeight } from "@/constants/tokens";
import { suggestCategory } from "@/utils/categorySuggestions";
import { BankLogo, CategoryVisual, DeleteConfirmationModal } from "@/components/ui";
import { DateTimePickerModal } from "@/components/DateTimePickerModal";
import { normalizeMerchant } from "@/utils/merchantNormalization";
import { haptics } from "@/utils/haptics";

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
  onSelect: (cat: Category | null) => void;
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
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
        >
          {/* Explicit "No Category" option */}
          <Pressable
            onPress={() => {
              onSelect(null);
              onClose();
            }}
            style={[
              styles.pickerItem,
              {
                backgroundColor:
                  selected === null ? `${colors.primary}15` : "transparent",
              },
            ]}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: colors.surfaceElevated,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Feather name="slash" size={16} color={colors.fgMuted} />
            </View>
            <Text style={[styles.pickerItemText, { color: colors.fgMuted }]}>
              No Category
            </Text>
            {selected === null && (
              <Feather name="check" size={18} color={colors.primary} />
            )}
          </Pressable>

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
  getAccountBalance,
}: {
  visible: boolean;
  accounts: Account[];
  selected: Account | null;
  onSelect: (acc: Account) => void;
  onClose: () => void;
  currency: string;
  getAccountBalance?: (accountId: string) => number;
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
            activeAccounts.map((acc) => {
              const liveBalance = getAccountBalance
                ? getAccountBalance(acc.id)
                : acc.openingBalance;
              return (
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
                      style={[
                        styles.pickerItemSub,
                        { color: colors.fgMuted },
                      ]}
                    >
                      {acc.type} · {money(liveBalance, acc.currency)}
                    </Text>
                  </View>
                  {selected?.id === acc.id && (
                    <Feather name="check" size={18} color={colors.primary} />
                  )}
                </Pressable>
              );
            })
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

export interface QuickAddModalProps {
  visible: boolean;
  onClose: () => void;
  initialType?: "EXPENSE" | "INCOME" | "TRANSFER";
  editingTransaction?: Transaction | null;
}

export function QuickAddModal({
  visible,
  onClose,
  initialType = "EXPENSE",
  editingTransaction,
}: QuickAddModalProps) {
  const {
    categories,
    accounts,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getAccountBalance,
    settings,
    saveMerchantRule,
    getMerchantRule,
    bulkCategorizeTransactions,
    countEligibleTransactions,
    queueMerchantMemory,
  } = useFinance();
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
    getLocalDateString(new Date()),
  );
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);
  const [accountPickerVisible, setAccountPickerVisible] = useState(false);
  const [toAccountPickerVisible, setToAccountPickerVisible] = useState(false);

  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(
    null,
  );
  const [categoryManuallySelected, setCategoryManuallySelected] =
    useState(false);

  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);

  useEffect(() => {
    if (description.trim().length >= 2 && !categoryManuallySelected) {
      const suggested = suggestCategory(description, categories);
      setSuggestedCategory(suggested);
    } else {
      setSuggestedCategory(null);
    }
  }, [description, categoryManuallySelected, categories]);

  const suggestedCategoryObj = useMemo(() => {
    if (!suggestedCategory) return null;
    return (
      categories.find(
        (c) => c.name.toLowerCase() === suggestedCategory.toLowerCase(),
      ) || null
    );
  }, [categories, suggestedCategory]);

  useEffect(() => {
    if (visible) {
      if (editingTransaction) {
        setType(editingTransaction.type);
        setAmount(String(editingTransaction.amount));
        setDescription(editingTransaction.description || "");
        setSelectedCategory(
          categories.find(
            (c) =>
              c.id === editingTransaction.categoryId ||
              c.name === editingTransaction.category,
          ) || null,
        );
        setSelectedAccount(
          accounts.find(
            (a) =>
              a.id === editingTransaction.accountId ||
              a.id === editingTransaction.fromAccountId,
          ) || null,
        );
        setSelectedToAccount(
          accounts.find((a) => a.id === editingTransaction.toAccountId) || null,
        );
        setSelectedDate(
          editingTransaction.date || getLocalDateString(new Date()),
        );
        setSuggestedCategory(null);
        setCategoryManuallySelected(true);
      } else {
        setType(initialType);
        setAmount("");
        setDescription("");
        setSelectedCategory(null);
        setSelectedAccount(
          accounts.find((a) => a.isDefault) || accounts[0] || null,
        );
        setSelectedToAccount(null);
        setSelectedDate(getLocalDateString(new Date()));
        setSuggestedCategory(null);
        setCategoryManuallySelected(false);
      }
      setCategoryPickerVisible(false);
      setAccountPickerVisible(false);
      setToAccountPickerVisible(false);
      setDatePickerVisible(false);
    }
  }, [visible, initialType, accounts, editingTransaction, categories]);

  const handleCategorySelect = (cat: Category | null) => {
    setSelectedCategory(cat);
    setCategoryManuallySelected(cat !== null);
    setSuggestedCategory(null);
  };

  const handleSuggestedCategoryTap = () => {
    if (suggestedCategory) {
      const cat = categories.find(
        (c) => c.name.toLowerCase() === suggestedCategory.toLowerCase(),
      );
      if (cat) handleCategorySelect(cat);
    }
  };

  const handleDeleteTransaction = () => {
    if (!editingTransaction) return;
    setDeleteConfirmVisible(true);
  };

  const save = async () => {
    const parsed = Number(amount.replace(/,/g, ""));
    if (!parsed || parsed <= 0) return;

    const now = new Date();
    const date = selectedDate || getLocalDateString(now);
    // Automatically capture relevant time of logging, or preserve existing time if editing
    const time = editingTransaction?.time
      ? formatTime(editingTransaction.time)
      : getLocalTimeString(now);

    let createdAt = now.toISOString();
    try {
      const time24 = convertTo24Hour(time);
      const [h, m] = time24.split(":").map(Number);
      const parts = date.split("-").map(Number);
      if (parts.length === 3) {
        const [year, month, day] = parts;
        const d = new Date(
          year,
          month - 1,
          day,
          h || 0,
          m || 0,
          now.getSeconds(),
          now.getMilliseconds(),
        );
        createdAt = d.toISOString();
      }
    } catch {
      createdAt = now.toISOString();
    }

    const finalCategory = selectedCategory;
    const finalAccount = selectedAccount || accounts[0];

    if (editingTransaction) {
      const toAccount =
        selectedToAccount ||
        accounts.find((a) => a.id !== finalAccount?.id) ||
        accounts[0];

      await updateTransaction({
        ...editingTransaction,
        type,
        amount: parsed,
        description:
          description.trim() ||
          (type === "EXPENSE"
            ? finalCategory
              ? finalCategory.name
              : "Expense"
            : type === "INCOME"
              ? finalCategory
                ? finalCategory.name
                : "Income"
              : "Transfer"),
        category:
          type === "EXPENSE"
            ? finalCategory
              ? finalCategory.name
              : undefined
            : type === "INCOME"
              ? finalCategory
                ? finalCategory.name
                : undefined
              : undefined,
        categoryId:
          type === "TRANSFER"
            ? undefined
            : finalCategory
              ? finalCategory.id
              : undefined,
        accountId: finalAccount?.id,
        fromAccountId: type === "TRANSFER" ? finalAccount?.id : undefined,
        toAccountId: type === "TRANSFER" ? toAccount?.id : undefined,
        date,
        time,
        createdAt,
      });
      void haptics.low();
    } else if (type === "EXPENSE") {
      await addTransaction({
        type: "EXPENSE",
        amount: parsed,
        description:
          description.trim() ||
          (finalCategory ? finalCategory.name : "Expense"),
        category: finalCategory ? finalCategory.name : undefined,
        categoryId: finalCategory ? finalCategory.id : undefined,
        accountId: finalAccount?.id,
        date,
        time,
        createdAt,
      });
      void haptics.low();
    } else if (type === "INCOME") {
      await addTransaction({
        type: "INCOME",
        amount: parsed,
        description:
          description.trim() || (finalCategory ? finalCategory.name : "Income"),
        category: finalCategory ? finalCategory.name : undefined,
        categoryId: finalCategory ? finalCategory.id : undefined,
        accountId: finalAccount?.id,
        date,
        time,
        createdAt,
      });
      void haptics.low();
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
        createdAt,
      });
      void haptics.low();
    }

    // Check Merchant Memory for expenses with an assigned category
    if (type === "EXPENSE" && finalCategory) {
      const merchantRaw = description.trim();
      const norm = normalizeMerchant(merchantRaw);
      if (!norm.isAmbiguous && norm.normalizedKey) {
        const existingRule = getMerchantRule(merchantRaw);
        if (!existingRule) {
          const eligible = countEligibleTransactions(
            merchantRaw,
            editingTransaction?.id,
          );
          queueMerchantMemory({
            merchant: norm.displayName || merchantRaw,
            category: finalCategory,
            count: eligible.uncategorizedCount,
            alreadyCategorizedCount: eligible.alreadyCategorizedCount,
          });
        }
      }
    }

    setAmount("");
    setDescription("");
    setSelectedCategory(null);
    setSuggestedCategory(null);
    setCategoryManuallySelected(false);
    setSelectedToAccount(null);
    setType("EXPENSE");
    onClose();
  };

  const showSaveButton = amount.trim() && Number(amount.replace(/,/g, "")) > 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onShow={() => {
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
              {editingTransaction ? "Edit Transaction" : "Quick Track"}
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
              <Text style={[styles.currencySymbol, { color: colors.fgMuted }]}>
                {currencySymbol(settings.currency)}
              </Text>
              <TextInput
                ref={amountInputRef}
                style={[styles.amountInput, { color: colors.fg }]}
                value={amount}
                onChangeText={(val) => setAmount(val.replace(/[^0-9.]/g, ""))}
                placeholder="0"
                placeholderTextColor={colors.fgSubtle}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={[styles.formRow, { backgroundColor: colors.surface }]}>
              <Feather name="file-text" size={18} color={colors.fgMuted} />
              <TextInput
                style={[styles.formInput, { color: colors.fg }]}
                value={description}
                onChangeText={setDescription}
                placeholder="Description"
                placeholderTextColor={colors.fgSubtle}
              />
            </View>

            {suggestedCategory && !selectedCategory && (
              <Pressable
                onPress={handleSuggestedCategoryTap}
                style={[
                  styles.suggestionRow,
                  {
                    backgroundColor: suggestedCategoryObj?.color
                      ? `${suggestedCategoryObj.color}15`
                      : `${colors.primary}10`,
                    borderColor: suggestedCategoryObj?.color
                      ? `${suggestedCategoryObj.color}35`
                      : `${colors.primary}25`,
                    borderWidth: 1,
                  },
                ]}
              >
                <Feather
                  name="zap"
                  size={14}
                  color={suggestedCategoryObj?.color || colors.primary}
                />
                <Text
                  style={[styles.suggestionLabel, { color: colors.fgMuted }]}
                >
                  Suggested:
                </Text>
                <Text
                  style={[
                    styles.suggestionCategory,
                    { color: suggestedCategoryObj?.color || colors.primary },
                  ]}
                >
                  {suggestedCategory}
                </Text>
                <Feather
                  name="arrow-right"
                  size={14}
                  color={suggestedCategoryObj?.color || colors.primary}
                />
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
                {selectedCategory?.name || "Select Category"}
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
                {selectedAccount?.name || "Select Account"}
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

            <Pressable
              onPress={() => {
                Keyboard.dismiss();
                setDatePickerVisible(true);
              }}
              style={[styles.formRow, { backgroundColor: colors.surface }]}
            >
              <Feather name="calendar" size={18} color={colors.primary} />
              <Text style={[styles.formValue, { color: colors.fg }]}>
                {formatDate(selectedDate)}
              </Text>
              <View
                style={[
                  styles.changeDateChip,
                  { backgroundColor: `${colors.primary}18` },
                ]}
              >
                <Feather name="edit-2" size={12} color={colors.primary} />
                <Text
                  style={[styles.changeDateText, { color: colors.primary }]}
                >
                  Change
                </Text>
              </View>
            </Pressable>

            {showSaveButton && (
              <View style={styles.actionButtonsContainer}>
                <Pressable
                  onPress={() => void save()}
                  style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                >
                  <Text
                    style={[styles.saveBtnText, { color: colors.onPrimary }]}
                  >
                    {editingTransaction ? "Save Changes" : "Save Transaction"}
                  </Text>
                </Pressable>

                {editingTransaction && (
                  <Pressable
                    onPress={handleDeleteTransaction}
                    style={[
                      styles.deleteBtn,
                      {
                        backgroundColor: `${colors.error}15`,
                        borderColor: `${colors.error}35`,
                      },
                    ]}
                  >
                    <Feather name="trash-2" size={16} color={colors.error} />
                    <Text
                      style={[styles.deleteBtnText, { color: colors.error }]}
                    >
                      Delete Transaction
                    </Text>
                  </Pressable>
                )}
              </View>
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
        getAccountBalance={getAccountBalance}
      />

      <AccountPicker
        visible={toAccountPickerVisible}
        accounts={accounts.filter((a) => a.id !== selectedAccount?.id)}
        selected={selectedToAccount}
        onSelect={setSelectedToAccount}
        onClose={() => setToAccountPickerVisible(false)}
        currency={settings.currency}
        getAccountBalance={getAccountBalance}
      />

      <DateTimePickerModal
        visible={datePickerVisible}
        currentDate={selectedDate}
        onConfirm={(newDate) => {
          setSelectedDate(newDate);
        }}
        onClose={() => setDatePickerVisible(false)}
      />

      {/* Matching Design Delete Confirmation Modal */}
      <DeleteConfirmationModal
        visible={deleteConfirmVisible}
        title="Delete Transaction"
        message={
          editingTransaction
            ? `Are you sure you want to delete "${editingTransaction.description}" (${money(editingTransaction.amount, settings.currency)})?`
            : "Are you sure you want to delete this transaction?"
        }
        confirmText="Delete"
        onConfirm={async () => {
          if (editingTransaction) {
            await deleteTransaction(editingTransaction.id);
            setDeleteConfirmVisible(false);
            onClose();
          }
        }}
        onCancel={() => setDeleteConfirmVisible(false)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheetBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.45)",
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
    maxHeight: 312, // Exactly caps at 6 items visible (6 * 52px)
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
  actionButtonsContainer: {
    marginTop: spacing[3],
    gap: spacing[2],
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    paddingVertical: spacing[3],
    borderRadius: radius.md,
    borderWidth: 1,
  },
  deleteBtnText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  changeDateChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  changeDateText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
});
