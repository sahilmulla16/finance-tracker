import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import {
  useFinance,
  type Appearance,
  type Category,
  type Currency,
  type PaymentMethod,
  type Account,
  type AccountType,
} from "@/context/FinanceContext";
import { useColors } from "@/hooks/useColors";
import {
  spacing,
  radius,
  fontSize,
  fontWeight,
  lineHeight,
} from "@/constants/tokens";
import { Card } from "@/components/ui/Card";
import { ListItem } from "@/components/ui/ListItem";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Toggle } from "@/components/ui/Toggle";
import { BankLogo, CategoryVisual } from "@/components/ui";

const palette = [
  "#2868E8",
  "#FF8C69",
  "#9B7BEB",
  "#48B49B",
  "#EC6A8E",
  "#E6B85C",
];
const icons = [
  "briefcase",
  "home",
  "book-open",
  "film",
  "navigation",
  "star",
  "tag",
];
const accountTypeIcons: Record<AccountType, string> = {
  CASH: "dollar-sign",
  BANK: "credit-card",
  UPI: "smartphone",
  SAVINGS: "target",
  OTHER: "more-horizontal",
};
const accountTypeLabels: Record<AccountType, string> = {
  CASH: "Cash",
  BANK: "Bank Account",
  UPI: "UPI",
  SAVINGS: "Savings",
  OTHER: "Other",
};

const APP_VERSION = "0.0.0";
const PRIVACY_URL = "https://pocketflow.app/privacy";
const TERMS_URL = "https://pocketflow.app/terms";

function CategoryEditor({
  visible,
  initial,
  onClose,
}: {
  visible: boolean;
  initial?: Category;
  onClose: () => void;
}) {
  const { addCategory, updateCategory } = useFinance();
  const colors = useColors();
  const [name, setName] = useState(initial?.name || "");
  const [icon, setIcon] = useState(initial?.icon || icons[0]);
  const [color, setColor] = useState(initial?.color || palette[0]);
  const save = async () => {
    if (!name.trim()) return;
    if (initial)
      await updateCategory({ ...initial, name: name.trim(), icon, color });
    else await addCategory(name, icon, color);
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
              {initial ? "Edit category" : "Add category"}
            </Text>
            <Pressable onPress={onClose}>
              <Feather name="x" size={20} color={colors.fgMuted} />
            </Pressable>
          </View>
          <View style={{ alignItems: "center", marginVertical: spacing[3] }}>
            <CategoryVisual
              categoryName={name || "Category"}
              iconName={icon}
              size="large"
              showBorder
            />
          </View>
          <Text style={[styles.label, { color: colors.fgMuted }]}>
            CATEGORY NAME
          </Text>
          <TextInput
            autoFocus
            value={name}
            onChangeText={setName}
            placeholder="e.g. Freelancing"
            placeholderTextColor={colors.fgSubtle}
            style={[
              styles.textInput,
              { backgroundColor: colors.surfaceRecessed, color: colors.fg },
            ]}
          />
          <Text style={[styles.label, { color: colors.fgMuted }]}>
            CHOOSE ICON
          </Text>
          <View style={styles.optionRow}>
            {icons.map((item) => (
              <Pressable
                key={item}
                onPress={() => setIcon(item)}
                style={[
                  styles.iconOption,
                  { backgroundColor: `${colors.primary}20` },
                  icon === item && { backgroundColor: colors.primary },
                ]}
              >
                <Feather
                  name={item as never}
                  size={18}
                  color={icon === item ? colors.onPrimary : colors.primary}
                />
              </Pressable>
            ))}
          </View>
          <Text style={[styles.label, { color: colors.fgMuted }]}>
            CHOOSE COLOR
          </Text>
          <View style={styles.optionRow}>
            {palette.map((item) => (
              <Pressable
                key={item}
                onPress={() => setColor(item)}
                style={[
                  styles.colorOption,
                  { backgroundColor: item },
                  color === item && styles.colorSelected,
                ]}
              />
            ))}
          </View>
          <Pressable
            onPress={() => void save()}
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          >
            <Text
              style={[styles.primaryButtonText, { color: colors.onPrimary }]}
            >
              {initial ? "Save changes" : "Save category"}
            </Text>
            <Feather name="check" size={18} color={colors.onPrimary} />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function ProfileEditor({
  visible,
  name,
  onClose,
  onSave,
}: {
  visible: boolean;
  name: string;
  onClose: () => void;
  onSave: (name: string) => void;
}) {
  const colors = useColors();
  const [editName, setEditName] = useState(name);
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
              Edit Profile
            </Text>
            <Pressable onPress={onClose}>
              <Feather name="x" size={20} color={colors.fgMuted} />
            </Pressable>
          </View>
          <Text style={[styles.label, { color: colors.fgMuted }]}>
            DISPLAY NAME
          </Text>
          <TextInput
            autoFocus
            value={editName}
            onChangeText={setEditName}
            placeholder="Your name"
            placeholderTextColor={colors.fgSubtle}
            style={[
              styles.textInput,
              { backgroundColor: colors.surfaceRecessed, color: colors.fg },
            ]}
          />
          <Pressable
            onPress={() => {
              onSave(editName.trim());
              onClose();
            }}
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          >
            <Text
              style={[styles.primaryButtonText, { color: colors.onPrimary }]}
            >
              Save
            </Text>
            <Feather name="check" size={18} color={colors.onPrimary} />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function PaymentMethodEditor({
  visible,
  initial,
  onClose,
}: {
  visible: boolean;
  initial?: PaymentMethod;
  onClose: () => void;
}) {
  const { addPaymentMethod, updatePaymentMethod, paymentMethods } =
    useFinance();
  const colors = useColors();
  const [name, setName] = useState(initial?.name || "");
  const [isDefault, setIsDefault] = useState(initial?.isDefault || false);
  const save = async () => {
    if (!name.trim()) return;
    if (isDefault) {
      const updated = paymentMethods.map((m) => ({
        ...m,
        isDefault: m.id === initial?.id,
      }));
      for (const m of updated) {
        await updatePaymentMethod(m);
      }
    }
    if (initial)
      await updatePaymentMethod({ ...initial, name: name.trim(), isDefault });
    else await addPaymentMethod(name.trim());
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
              {initial ? "Edit payment method" : "Add payment method"}
            </Text>
            <Pressable onPress={onClose}>
              <Feather name="x" size={20} color={colors.fgMuted} />
            </Pressable>
          </View>
          <Text style={[styles.label, { color: colors.fgMuted }]}>NAME</Text>
          <TextInput
            autoFocus
            value={name}
            onChangeText={setName}
            placeholder="e.g. Credit Card"
            placeholderTextColor={colors.fgSubtle}
            style={[
              styles.textInput,
              { backgroundColor: colors.surfaceRecessed, color: colors.fg },
            ]}
          />
          <View style={styles.switchRow}>
            <Text style={[styles.switchLabel, { color: colors.fg }]}>
              Set as default
            </Text>
            <Toggle value={isDefault} onValueChange={setIsDefault} />
          </View>
          <Pressable
            onPress={() => void save()}
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          >
            <Text
              style={[styles.primaryButtonText, { color: colors.onPrimary }]}
            >
              {initial ? "Save changes" : "Add payment method"}
            </Text>
            <Feather name="check" size={18} color={colors.onPrimary} />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function ImportModal({
  visible,
  onClose,
  onImport,
}: {
  visible: boolean;
  onClose: () => void;
  onImport: (json: string) => void;
}) {
  const colors = useColors();
  const [importing, setImporting] = useState(false);
  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const fileUri = result.assets[0].uri;
      const content = await FileSystem.readAsStringAsync(fileUri);
      setImporting(true);
      onImport(content);
      onClose();
    } catch (e) {
      Alert.alert("Import failed", "Could not read the selected file.");
    } finally {
      setImporting(false);
    }
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
              Restore Backup
            </Text>
            <Pressable onPress={onClose}>
              <Feather name="x" size={20} color={colors.fgMuted} />
            </Pressable>
          </View>
          <Text style={[styles.importText, { color: colors.fgMuted }]}>
            Select a Pocketflow JSON backup file to restore your data.
          </Text>
          <Pressable
            onPress={pickFile}
            disabled={importing}
            style={[
              styles.primaryButton,
              { backgroundColor: colors.primary },
              importing && { opacity: 0.7 },
            ]}
          >
            <Text
              style={[styles.primaryButtonText, { color: colors.onPrimary }]}
            >
              {importing ? "Importing..." : "Choose JSON file"}
            </Text>
            <Feather
              name={importing ? "loader" : "folder"}
              size={18}
              color={colors.onPrimary}
            />
          </Pressable>
          <Text style={[styles.importWarning, { color: colors.warning }]}>
            ⚠ This will replace all current data. Export a backup first if
            needed.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

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

function AccountEditor({
  visible,
  initial,
  onClose,
}: {
  visible: boolean;
  initial?: Account;
  onClose: () => void;
}) {
  const { addAccount, updateAccount, accounts } = useFinance();
  const colors = useColors();
  const [name, setName] = useState(initial?.name || "");
  const [type, setType] = useState<AccountType>(initial?.type || "CASH");
  const [currency, setCurrency] = useState(initial?.currency || "INR");
  const [openingBalance, setOpeningBalance] = useState(
    initial?.openingBalance?.toString() || "0",
  );
  const [isDefault, setIsDefault] = useState(initial?.isDefault || false);
  const [isActive, setIsActive] = useState(initial?.isActive !== false);
  const [showReplaceAlert, setShowReplaceAlert] = useState(false);

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
        isActive,
      });
    } else {
      await addAccount({
        name: name.trim(),
        type,
        currency,
        openingBalance: balance,
        isDefault,
        isActive,
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
            style={[
              styles.textInput,
              { backgroundColor: colors.surfaceRecessed, color: colors.fg },
            ]}
            keyboardType="decimal-pad"
          />
          <View style={styles.switchRow}>
            <Text style={[styles.switchLabel, { color: colors.fg }]}>
              Set as default account
            </Text>
            <Toggle value={isDefault} onValueChange={setIsDefault} />
          </View>
          <View style={styles.switchRow}>
            <Text style={[styles.switchLabel, { color: colors.fg }]}>
              Account is active
            </Text>
            <Toggle value={isActive} onValueChange={setIsActive} />
          </View>
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

export default function SettingsScreen() {
  const {
    categories,
    settings,
    paymentMethods,
    accounts,
    updateSettings,
    deleteCategory,
    exportData,
    importData,
    addPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    addAccount,
    updateAccount,
    deleteAccount,
    setDefaultAccount,
  } = useFinance();
  const colors = useColors();
  const params = useLocalSearchParams<{ section?: string }>();
  const [editorVisible, setEditorVisible] = useState(false);
  const [editing, setEditing] = useState<Category | undefined>();
  const [showCategories, setShowCategories] = useState(false);
  const [profileEditorVisible, setProfileEditorVisible] = useState(false);
  const [paymentEditorVisible, setPaymentEditorVisible] = useState(false);
  const [editingPayment, setEditingPayment] = useState<
    PaymentMethod | undefined
  >();
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [accountEditorVisible, setAccountEditorVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | undefined>();
  const [showAccounts, setShowAccounts] = useState(false);
  const insets = useSafeAreaInsets();

  // Handle route params to open specific sections
  useEffect(() => {
    if (params.section) {
      switch (params.section) {
        case "accounts":
        case "wallets":
          setAccountEditorVisible(true);
          break;
        case "currency":
          chooseCurrency();
          break;
        case "categories":
          setEditorVisible(true);
          break;
        case "savings":
          router.push("/savings");
          break;
        case "appearance":
          chooseAppearance();
          break;
        case "restore":
          setImportModalVisible(true);
          break;
        case "privacy":
          openPrivacy();
          break;
        case "terms":
          openTerms();
          break;
      }
    }
  }, [params.section]);

  const openNew = () => {
    setEditing(undefined);
    setEditorVisible(true);
  };
  const openEdit = (category: Category) => {
    setEditing(category);
    setEditorVisible(true);
  };
  const remove = async (category: Category) => {
    const removed = await deleteCategory(category.id);
    if (!removed)
      Alert.alert(
        "Category is in use",
        "Move existing expenses to another category before deleting this one.",
      );
  };

  const chooseCurrency = () =>
    Alert.alert(
      "Currency",
      "Choose your default currency",
      ["INR", "USD", "EUR", "GBP", "AED"].map((value) => ({
        text: value,
        onPress: () => void updateSettings({ currency: value as Currency }),
      })),
    );
  const chooseAppearance = () =>
    Alert.alert(
      "Appearance",
      "Choose how Pocketflow should look",
      ["System", "Light", "Dark"].map((value) => ({
        text: value,
        onPress: () =>
          void updateSettings({
            appearance: value.toLowerCase() as Appearance,
          }),
      })),
    );

  const openProfileEditor = () => setProfileEditorVisible(true);
  const saveProfile = async (name: string) => {
    if (name.trim()) await updateSettings({ profileName: name.trim() });
  };

  const openPaymentEditor = (method?: PaymentMethod) => {
    setEditingPayment(method);
    setPaymentEditorVisible(true);
  };
  const removePayment = async (method: PaymentMethod) => {
    if (method.isDefault) {
      Alert.alert(
        "Cannot delete",
        "Set another payment method as default first.",
      );
      return;
    }
    Alert.alert("Delete payment method", `Remove "${method.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => void deletePaymentMethod(method.id),
      },
    ]);
  };

  const openAccountEditor = (account?: Account) => {
    setEditingAccount(account);
    setAccountEditorVisible(true);
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
                "This account has transactions. Choose a replacement account:",
                [
                  { text: "Cancel", style: "cancel" },
                  ...otherAccounts.map((a) => ({
                    text: a.name,
                    onPress: () => void deleteAccount(account.id, a.id),
                  })),
                ],
              );
            } else {
              Alert.alert(
                "Cannot delete",
                "No other account available to move transactions to.",
              );
            }
          }
        },
      },
    ]);
  };
  const setDefault = async (account: Account) => {
    if (!account.isDefault) await setDefaultAccount(account.id);
  };

  const handleExport = async () => {
    try {
      await exportData("json");
    } catch {
      Alert.alert("Export failed", "Could not export your data.");
    }
  };

  const handleImport = async (json: string) => {
    try {
      await importData(json);
      Alert.alert(
        "Success",
        "Backup restored successfully. The app will reload.",
      );
    } catch {
      Alert.alert(
        "Import failed",
        "The selected file is not a valid Pocketflow backup.",
      );
    }
  };

  const openPrivacy = () => Linking.openURL(PRIVACY_URL);
  const openTerms = () => Linking.openURL(TERMS_URL);

  const defaultPayment =
    paymentMethods.find((m) => m.isDefault)?.name || settings.defaultPayment;
  const defaultAccount = accounts.find((a) => a.isDefault);

  return (
    <View style={[styles.screen, { backgroundColor: colors.canvas }]}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + spacing[4],
          paddingBottom: spacing[10],
        }}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={[
              styles.back,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Feather name="arrow-left" size={20} color={colors.fg} />
          </Pressable>
          <View>
            <Text style={[styles.kicker, { color: colors.primary }]}>
              POCKETFLOW
            </Text>
            <Text style={[styles.title, { color: colors.fg }]}>Settings</Text>
          </View>
          <View style={{ width: spacing[8] }} />
        </View>

        <View style={styles.sectionContainer}>
          <SectionHeader title="Account" />
          <Card style={styles.card}>
            <ListItem
              icon="user"
              title="Profile"
              subtitle={settings.profileName}
              onPress={openProfileEditor}
            />
            <ListItem
              icon="globe"
              title="Currency"
              subtitle={settings.currency}
              onPress={chooseCurrency}
            />
            <ListItem
              icon="credit-card"
              title="Wallets & accounts"
              subtitle={
                accounts.length > 0
                  ? `${accounts.length} accounts · Default: ${defaultAccount?.name || "—"}`
                  : "No accounts yet"
              }
              onPress={() => setShowAccounts(!showAccounts)}
            />
            {showAccounts && (
              <View
                style={[
                  styles.categoryList,
                  { borderTopColor: colors.divider },
                ]}
              >
                {accounts.map((account) => (
                  <View key={account.id} style={styles.categoryRow}>
                    <BankLogo
                      accountName={account.name}
                      accountType={account.type}
                      size="small"
                    />
                    <View style={styles.categoryInfo}>
                      <Text style={[styles.categoryName, { color: colors.fg }]}>
                        {account.name}
                      </Text>
                      <Text
                        style={[styles.categoryType, { color: colors.fgMuted }]}
                      >
                        {accountTypeLabels[account.type]} · {account.currency} ·{" "}
                        {account.isDefault ? "Default" : ""}
                      </Text>
                    </View>
                    <View style={styles.accountActions}>
                      <Pressable
                        onPress={() => setDefault(account)}
                        style={[
                          styles.action,
                          account.isDefault && { opacity: 0.5 },
                        ]}
                      >
                        <Feather
                          name={account.isDefault ? "check-circle" : "circle"}
                          size={18}
                          color={colors.primary}
                        />
                      </Pressable>
                      <Pressable
                        onPress={() => openAccountEditor(account)}
                        style={styles.action}
                      >
                        <Feather
                          name="edit-2"
                          size={15}
                          color={colors.primary}
                        />
                      </Pressable>
                      <Pressable
                        onPress={() => void removeAccount(account)}
                        style={styles.action}
                      >
                        <Feather
                          name="trash-2"
                          size={15}
                          color={colors.error}
                        />
                      </Pressable>
                    </View>
                  </View>
                ))}
                <Pressable
                  onPress={() => openAccountEditor()}
                  style={styles.addCategory}
                >
                  <Feather
                    name="plus-circle"
                    size={15}
                    color={colors.primary}
                  />
                  <Text
                    style={[styles.addCategoryText, { color: colors.primary }]}
                  >
                    Add account
                  </Text>
                </Pressable>
              </View>
            )}
          </Card>
        </View>

        <View style={styles.sectionContainer}>
          <SectionHeader title="Manage" />
          <Card style={styles.card}>
            <ListItem
              icon="grid"
              title="Categories"
              subtitle={`${categories.length} categories`}
              onPress={() => setShowCategories(!showCategories)}
            />
            {showCategories && (
              <View
                style={[
                  styles.categoryList,
                  { borderTopColor: colors.divider },
                ]}
              >
                {categories.map((cat) => (
                  <View key={cat.id} style={styles.categoryRow}>
                    <CategoryVisual
                      categoryName={cat.name}
                      iconName={cat.icon}
                      size="small"
                    />
                    <View style={styles.categoryInfo}>
                      <Text style={[styles.categoryName, { color: colors.fg }]}>
                        {cat.name}
                      </Text>
                      <Text
                        style={[styles.categoryType, { color: colors.fgMuted }]}
                      >
                        Custom
                      </Text>
                    </View>
                    <View style={styles.accountActions}>
                      <Pressable
                        onPress={() => openEdit(cat)}
                        style={styles.action}
                      >
                        <Feather
                          name="edit-2"
                          size={15}
                          color={colors.primary}
                        />
                      </Pressable>
                      <Pressable
                        onPress={() => void remove(cat)}
                        style={styles.action}
                      >
                        <Feather
                          name="trash-2"
                          size={15}
                          color={colors.error}
                        />
                      </Pressable>
                    </View>
                  </View>
                ))}
                <Pressable onPress={openNew} style={styles.addCategory}>
                  <Feather
                    name="plus-circle"
                    size={15}
                    color={colors.primary}
                  />
                  <Text
                    style={[styles.addCategoryText, { color: colors.primary }]}
                  >
                    Add category
                  </Text>
                </Pressable>
              </View>
            )}
          </Card>
        </View>

        <View style={styles.sectionContainer}>
          <SectionHeader title="Preferences" />
          <Card style={styles.card}>
            <ListItem
              icon="zap"
              title="Quick Add"
              subtitle="2× Volume Down & Triggers"
              onPress={() => router.push("/quick-add-settings")}
            />
            <ListItem
              icon="smartphone"
              title="Appearance"
              subtitle={
                settings.appearance.charAt(0).toUpperCase() +
                settings.appearance.slice(1)
              }
              onPress={chooseAppearance}
            />
            <ListItem
              icon="credit-card"
              title="Default payment"
              subtitle={defaultPayment || "Not set"}
              onPress={() => openPaymentEditor()}
            />
            {paymentMethods.map((method) => (
              <View key={method.id} style={styles.categoryRow}>
                <View
                  style={[
                    styles.categoryIcon,
                    { backgroundColor: `${colors.primary}20` },
                  ]}
                >
                  <Feather
                    name="credit-card"
                    size={16}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.categoryInfo}>
                  <Text style={[styles.categoryName, { color: colors.fg }]}>
                    {method.name}
                  </Text>
                  <Text
                    style={[styles.categoryType, { color: colors.fgMuted }]}
                  >
                    {method.isDefault ? "Default" : ""}
                  </Text>
                </View>
                <View style={styles.accountActions}>
                  <Pressable
                    onPress={() => openPaymentEditor(method)}
                    style={styles.action}
                  >
                    <Feather name="edit-2" size={15} color={colors.primary} />
                  </Pressable>
                  <Pressable
                    onPress={() => void removePayment(method)}
                    style={styles.action}
                  >
                    <Feather name="trash-2" size={15} color={colors.error} />
                  </Pressable>
                </View>
              </View>
            ))}
          </Card>
        </View>

        <View style={styles.sectionContainer}>
          <SectionHeader title="Data & Privacy" />
          <Card style={styles.card}>
            <ListItem
              icon="lock"
              title="Privacy & Data"
              subtitle="Consents, Export, Erasure & DPDP Rights"
              onPress={() => router.push("/privacy-and-data" as never)}
            />
            <ListItem
              icon="download"
              title="Export data"
              subtitle="Share your data as JSON"
              onPress={handleExport}
            />
            <ListItem
              icon="upload"
              title="Restore backup"
              subtitle="Import from a JSON file"
              onPress={() => setImportModalVisible(true)}
            />
          </Card>
        </View>

        <View style={styles.sectionContainer}>
          <SectionHeader title="About" />
          <Card style={styles.card}>
            <ListItem
              icon="shield"
              title="Privacy notice"
              onPress={() => router.push("/privacy")}
            />
            <ListItem
              icon="file-text"
              title="Terms of service"
              onPress={openTerms}
            />
            <ListItem
              icon="info"
              title="Version"
              subtitle={APP_VERSION}
              onPress={() => {}}
              showChevron={false}
            />
          </Card>
        </View>

        <Text style={[styles.note, { color: colors.fgSubtle }]}>
          Made with ♥ by Pocketflow
        </Text>

        <CategoryEditor
          visible={editorVisible}
          initial={editing}
          onClose={() => setEditorVisible(false)}
        />
        <ProfileEditor
          visible={profileEditorVisible}
          name={settings.profileName}
          onClose={() => setProfileEditorVisible(false)}
          onSave={saveProfile}
        />
        <PaymentMethodEditor
          visible={paymentEditorVisible}
          initial={editingPayment}
          onClose={() => setPaymentEditorVisible(false)}
        />
        <ImportModal
          visible={importModalVisible}
          onClose={() => setImportModalVisible(false)}
          onImport={handleImport}
        />
        <AccountEditor
          visible={accountEditorVisible}
          initial={editingAccount}
          onClose={() => setAccountEditorVisible(false)}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingHorizontal: spacing[5],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing[6],
  },
  back: {
    width: spacing[8],
    height: spacing[8],
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  kicker: {
    textAlign: "center",
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    letterSpacing: 1.2,
  },
  title: {
    fontSize: fontSize["3xl"],
    fontWeight: fontWeight.bold,
    letterSpacing: -0.8,
    marginTop: spacing[1],
  },
  sectionContainer: { marginBottom: spacing[5], paddingHorizontal: spacing[5] },
  card: { marginTop: spacing[2] },
  categoryList: { borderTopWidth: 1, padding: spacing[3] },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingVertical: spacing[2],
  },
  categoryIcon: {
    width: spacing[6] + spacing[1],
    height: spacing[6] + spacing[1],
    borderRadius: radius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryInfo: { flex: 1 },
  categoryName: { fontSize: fontSize.sm },
  categoryType: { fontSize: fontSize.xs, marginTop: 2 },
  accountActions: { flexDirection: "row", gap: spacing[2] },
  action: {
    width: spacing[6] + spacing[1],
    height: spacing[6] + spacing[1],
    alignItems: "center",
    justifyContent: "center",
  },
  addCategory: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    paddingTop: spacing[3],
    paddingBottom: spacing[1],
  },
  addCategoryText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  note: {
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * lineHeight.normal,
    textAlign: "center",
    marginTop: spacing[6],
    marginBottom: spacing[10],
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
    height: spacing[1],
    borderRadius: radius.full,
    alignSelf: "center",
    marginBottom: spacing[4],
  },
  editorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[5],
  },
  editorTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  label: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
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
  colorOption: {
    width: spacing[8],
    height: spacing[8],
    borderRadius: radius.full,
  },
  colorSelected: { borderWidth: 3, borderColor: "#FFF", elevation: 4 },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    borderRadius: radius.md,
    padding: spacing[3],
    marginTop: spacing[5],
  },
  primaryButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing[3],
  },
  switchLabel: { fontSize: fontSize.base },
  importText: {
    fontSize: fontSize.base,
    lineHeight: fontSize.base * lineHeight.normal,
    marginBottom: spacing[4],
  },
  importWarning: {
    fontSize: fontSize.xs,
    marginTop: spacing[3],
    lineHeight: fontSize.xs * lineHeight.normal,
  },
  currencyOptionText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
});
