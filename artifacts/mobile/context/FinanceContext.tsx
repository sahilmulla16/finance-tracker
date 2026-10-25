import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { z } from "zod";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Share } from "react-native";
import {
  ConsentRecord,
  PrivacyRequest,
  PrivacyRequestType,
  NomineeRecord,
  PrivacyAuditEvent,
  PrivacyAction,
  CURRENT_POLICY_VERSION,
  PRIVACY_CONTACT,
} from "@/types/privacy";
import {
  LocalAuthState,
  OnboardingState,
  GoogleUserProfile,
  CURRENT_ONBOARDING_VERSION,
  DEFAULT_ONBOARDING_STATE,
} from "@/types/auth";
import { MerchantRule, BulkCategorizeResult } from "@/types/merchantRules";
import {
  normalizeMerchant,
  isMerchantMatch,
} from "@/utils/merchantNormalization";
import {
  convertTo24Hour,
  currencySymbol,
  compareTransactionsByLatest,
  getLocalDateString,
  getLocalTimeString,
} from "@/utils/format";
import {
  CATEGORY_VISUALS,
  type CategoryVisualId,
} from "@/constants/categoryVisuals";
import { saveProfileImage } from "@/services/profileImageService";
import {
  posthog,
  optInPostHog,
  optOutPostHog,
  resetPostHog,
  identifyPostHog,
} from "@/config/posthog";
import {
  captureAnalyticsEvent,
  logAnalyticsOperational,
} from "@/services/analytics";
import {
  DEFAULT_EXPENSE_NOTIF_TITLE,
  formatExpenseNotificationBody,
} from "@/utils/notificationFormatter";
import {
  type RecurringPayment,
  type RecurrenceFrequency,
  type RecurringPaymentStatus,
  computeNextDueDate,
  formatToDateString,
} from "@/utils/recurringPayments";

export type { RecurringPayment, RecurrenceFrequency, RecurringPaymentStatus };

export type CategoryType = "expense" | "income" | "both";

export type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  type?: CategoryType;
  imageUrl?: string;
  isDefault?: boolean;
};
export type Expense = {
  id: string;
  amount: number;
  description: string;
  category: string;
  icon: string;
  color: string;
  date: string;
  payment: string;
};
export type Appearance = "system" | "light" | "dark";
export type Currency = string;
export type PaymentMethod = { id: string; name: string; isDefault: boolean };
export type UserSettings = {
  currency: Currency;
  appearance: Appearance;
  defaultPayment: string;
  notificationsEnabled: boolean;
  profileName: string;
  profileImage: string | null;
};

export type AccountType = "CASH" | "BANK" | "UPI" | "SAVINGS" | "CARD" | "CREDIT" | "OTHER";

export type Account = {
  id: string;
  name: string;
  displayName?: string;
  type: AccountType;
  currency: Currency;
  openingBalance: number;
  isDefault: boolean;
  isActive: boolean;
  colorThemeIndex?: number;
  customColor?: string;
  accountNumberLast4?: string;
  cardLast4?: string;
  accountSuffix?: string;
  createdAt: string;
  updatedAt: string;
};

export type TransactionType = "INCOME" | "EXPENSE" | "TRANSFER";

export type Transaction = {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  category?: string;
  categoryId?: string;
  accountId?: string;
  fromAccountId?: string;
  toAccountId?: string;
  date: string;
  time: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  counterparty?: string;
  cardLast4?: string;
};

export type SavingsGoal = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  category?: string;
  color?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
};

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type?: "alert" | "success" | "info" | "goal";
  route?: string;
};

type FinanceContextValue = {
  expenses: Expense[];
  categories: Category[];
  settings: UserSettings;
  paymentMethods: PaymentMethod[];
  accounts: Account[];
  transactions: Transaction[];
  savingsGoals: SavingsGoal[];
  notifications: NotificationItem[];
  unreadNotificationsCount: number;
  loading: boolean;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  addExpense: (
    amount: number,
    description: string,
    category: Category,
    payment?: string,
  ) => Promise<void>;
  deleteExpense: (id: string) => void;
  updateExpense: (expense: Expense) => void;
  addCategory: (
    name: string,
    icon: string,
    color: string,
    type?: CategoryType,
    imageUrl?: string,
  ) => Promise<void>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (
    id: string,
    replacementCategoryId?: string,
  ) => Promise<boolean>;
  updateSettings: (patch: Partial<UserSettings>) => Promise<void>;
  exportData: (format: "json" | "csv") => Promise<void>;
  importData: (json: string) => Promise<void>;
  addPaymentMethod: (name: string) => Promise<void>;
  updatePaymentMethod: (method: PaymentMethod) => Promise<void>;
  deletePaymentMethod: (id: string) => Promise<void>;
  addAccount: (
    account: Omit<Account, "id" | "createdAt" | "updatedAt">,
  ) => Promise<void>;
  updateAccount: (account: Account) => Promise<void>;
  syncAccountCardLast4: (
    accountId: string,
    cardLast4: string,
  ) => Promise<Account | null>;
  deleteAccount: (
    id: string,
    replacementAccountId?: string,
  ) => Promise<boolean>;
  setDefaultAccount: (id: string) => Promise<void>;
  addTransaction: (
    transaction: Omit<Transaction, "id" | "createdAt" | "updatedAt"> & {
      createdAt?: string;
    },
  ) => Promise<void>;
  addTransactionsBatch: (
    transactions: Array<
      Omit<Transaction, "id" | "createdAt" | "updatedAt"> & {
        createdAt?: string;
      }
    >,
  ) => Promise<number>;
  deleteTransaction: (id: string) => Promise<void>;
  deleteAllTransactions: () => Promise<void>;
  updateTransaction: (transaction: Transaction) => Promise<void>;
  merchantRules: MerchantRule[];
  saveMerchantRule: (
    displayMerchant: string,
    categoryId: string,
    categoryName: string,
    options?: {
      preferredAccountId?: string;
      scope?: "GLOBAL" | "ACCOUNT";
      enabled?: boolean;
    },
  ) => Promise<MerchantRule | null>;
  getMerchantRule: (merchant: string) => MerchantRule | null;
  toggleMerchantRule: (normalizedKey: string, enabled: boolean) => Promise<void>;
  updateMerchantRuleCategory: (
    normalizedKey: string,
    categoryId: string,
    categoryName: string,
    updateHistorical?: boolean,
  ) => Promise<void>;
  deleteMerchantRule: (normalizedKey: string) => Promise<void>;
  bulkCategorizeTransactions: (
    merchant: string,
    categoryId: string,
    categoryName: string,
    overwriteExisting?: boolean,
  ) => Promise<number>;
  countEligibleTransactions: (
    merchant: string,
    excludeTransactionId?: string,
  ) => {
    uncategorizedCount: number;
    alreadyCategorizedCount: number;
    matchingTransactions: Transaction[];
  };
  addSavingsGoal: (
    name: string,
    targetAmount: number,
    currentAmount?: number,
    targetDate?: string,
    category?: string,
    color?: string,
    imageUrl?: string,
  ) => Promise<SavingsGoal>;
  updateSavingsGoal: (goal: SavingsGoal) => Promise<void>;
  deleteSavingsGoal: (id: string) => Promise<void>;
  addFundsToGoal: (id: string, amount: number, accountId?: string) => Promise<void>;
  recurringPayments: RecurringPayment[];
  addRecurringPayment: (
    payment: Omit<RecurringPayment, "id" | "createdAt" | "updatedAt">,
  ) => Promise<RecurringPayment>;
  updateRecurringPayment: (
    id: string,
    updates: Partial<Omit<RecurringPayment, "id" | "createdAt">>,
  ) => Promise<void>;
  deleteRecurringPayment: (id: string) => Promise<void>;
  toggleRecurringPaymentStatus: (id: string) => Promise<void>;
  recordRecurringPayment: (id: string, accountId?: string) => Promise<void>;
  getAccountBalance: (accountId: string) => number;
  getTotalBalance: () => number;
  migrateIfNeeded: () => Promise<void>;
  quickAddSettings: QuickAddSettings;
  updateQuickAddSettings: (patch: Partial<QuickAddSettings>) => Promise<void>;
  consents: Record<string, ConsentRecord>;
  privacyRequests: PrivacyRequest[];
  nominee: NomineeRecord | null;
  privacyAuditEvents: PrivacyAuditEvent[];
  policyVersion: string;
  updateConsent: (purpose: string, granted: boolean) => Promise<void>;
  submitPrivacyRequest: (
    type: PrivacyRequestType,
    subject: string,
    description: string,
  ) => Promise<PrivacyRequest>;
  saveNominee: (nominee: NomineeRecord | null) => Promise<void>;
  downloadPersonalDataArchive: () => Promise<string>;
  purgeAllUserData: () => Promise<void>;
  logPrivacyEvent: (
    action: PrivacyAction,
    details?: Record<string, string | number | boolean>,
  ) => Promise<void>;
  authState: LocalAuthState | null;
  onboardingState: OnboardingState;
  signInWithGoogle: (profile: GoogleUserProfile) => Promise<void>;
  signOut: () => Promise<void>;
  completeOnboarding: (setup?: {
    currency?: Currency;
    defaultAccountType?: AccountType;
  }) => Promise<void>;
  resetOnboarding: () => Promise<void>;
  voiceLoggingVisible: boolean;
  setVoiceLoggingVisible: (visible: boolean) => void;
  celebrationExpense: {
    amount: number;
    category?: string;
    description?: string;
  } | null;
  celebrateExpense: (details: {
    amount: number;
    category?: string;
    description?: string;
  }) => void;
  dismissCelebration: () => void;
  merchantMemoryPrompt: MerchantMemoryPrompt | null;
  queueMerchantMemory: (prompt: MerchantMemoryPrompt) => void;
  dismissMerchantMemory: () => void;
};

export interface MerchantMemoryPrompt {
  merchant: string;
  category: Category;
  count: number;
  alreadyCategorizedCount: number;
}

export type QuickAddSettings = {
  volumeDownTrigger: boolean;
  homeShortcutTrigger: boolean;
  quickSettingsTrigger: boolean;
  lockScreenTrigger: boolean;
  upiDetectionTrigger?: boolean;
  defaultAccountId: string;
  defaultCategoryId: string | null;
};

export const DEFAULT_CATEGORIES: Category[] = [
  // Expense categories
  {
    id: "food",
    name: "Food & Drinks",
    icon: "logo:food",
    color: "#FF6B35",
    type: "expense",
    isDefault: true,
  },
  {
    id: "groceries",
    name: "Groceries",
    icon: "logo:groceries",
    color: "#F59E0B",
    type: "expense",
    isDefault: true,
  },
  {
    id: "transport",
    name: "Transport",
    icon: "logo:transport",
    color: "#2563EB",
    type: "expense",
    isDefault: true,
  },
  {
    id: "shopping",
    name: "Shopping",
    icon: "logo:shopping",
    color: "#7C3AED",
    type: "expense",
    isDefault: true,
  },
  {
    id: "bills",
    name: "Bills & Utilities",
    icon: "logo:bills",
    color: "#0D9488",
    type: "expense",
    isDefault: true,
  },
  {
    id: "health",
    name: "Health",
    icon: "logo:health",
    color: "#E11D48",
    type: "expense",
    isDefault: true,
  },
  {
    id: "entertainment",
    name: "Entertainment",
    icon: "logo:entertainment",
    color: "#D97706",
    type: "expense",
    isDefault: true,
  },
  {
    id: "education",
    name: "Education",
    icon: "logo:education",
    color: "#0284C7",
    type: "expense",
    isDefault: true,
  },
  {
    id: "travel",
    name: "Travel",
    icon: "logo:travel",
    color: "#6D28D9",
    type: "expense",
    isDefault: true,
  },
  {
    id: "deen",
    name: "Deen & Sadqa",
    icon: "logo:deen",
    color: "#059669",
    type: "expense",
    isDefault: true,
  },
  {
    id: "other",
    name: "Other",
    icon: "logo:other",
    color: "#475569",
    type: "both",
    isDefault: true,
  },
  // Income categories
  {
    id: "salary",
    name: "Salary",
    icon: "logo:salary",
    color: "#16A34A",
    type: "income",
    isDefault: true,
  },
  {
    id: "freelance",
    name: "Freelance",
    icon: "logo:freelance",
    color: "#0891B2",
    type: "income",
    isDefault: true,
  },
  {
    id: "investment",
    name: "Investment",
    icon: "logo:investment",
    color: "#EA580C",
    type: "income",
    isDefault: true,
  },
  {
    id: "other-income",
    name: "Other Income",
    icon: "logo:salary",
    color: "#059669",
    type: "income",
    isDefault: true,
  },
];

const DEFAULT_PAYMENT_METHODS: PaymentMethod[] = [
  { id: "upi", name: "UPI", isDefault: true },
  { id: "cash", name: "Cash", isDefault: false },
  { id: "card", name: "Card", isDefault: false },
];

const seed: Expense[] = [
  {
    id: "seed-1",
    amount: 120,
    description: "Coffee",
    category: "Food & Drinks",
    icon: "coffee",
    color: "#FF8C69",
    date: new Date().toISOString(),
    payment: "UPI",
  },
  {
    id: "seed-2",
    amount: 340,
    description: "Uber",
    category: "Transport",
    icon: "navigation",
    color: "#5B8DEF",
    date: new Date(Date.now() - 3600000).toISOString(),
    payment: "UPI",
  },
  {
    id: "seed-3",
    amount: 1240,
    description: "Groceries",
    category: "Groceries",
    icon: "shopping-cart",
    color: "#F2A65A",
    date: new Date(Date.now() - 86400000).toISOString(),
    payment: "Card",
  },
];

const defaults: UserSettings = {
  currency: "INR",
  appearance: "system",
  defaultPayment: "UPI",
  notificationsEnabled: false,
  profileName: "User",
  profileImage: null,
};

export const defaultQuickAddSettings: QuickAddSettings = {
  volumeDownTrigger: true,
  homeShortcutTrigger: true,
  quickSettingsTrigger: true,
  lockScreenTrigger: true,
  upiDetectionTrigger: true,
  defaultAccountId: "main-wallet",
  defaultCategoryId: null,
};

export const DEFAULT_SAVINGS_GOALS: SavingsGoal[] = [
  {
    id: "goal-1",
    name: "Emergency Fund",
    targetAmount: 100000,
    currentAmount: 45000,
    targetDate: "2026-12-31",
    category: "Savings",
    color: "#10D078",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "goal-2",
    name: "New Laptop",
    targetAmount: 150000,
    currentAmount: 85000,
    targetDate: "2026-10-31",
    category: "Gadgets",
    color: "#3B82F6",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "goal-3",
    name: "Vacation Trip",
    targetAmount: 60000,
    currentAmount: 32000,
    targetDate: "2026-11-15",
    category: "Travel",
    color: "#FF8A00",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    title: "Budget Alert",
    message:
      "You have spent 85% of your Dining Out budget for this month. 3 days remaining.",
    time: "10m ago",
    read: false,
    type: "alert",
    route: "/(tabs)/budgets",
  },
  {
    id: "notif-2",
    title: "Salary Deposited",
    message:
      "₹45,000 has been credited to your HDFC Salary account. Total balance updated.",
    time: "2h ago",
    read: false,
    type: "success",
  },
  {
    id: "notif-3",
    title: "Savings Goal Milestone",
    message:
      "Congratulations! You reached 75% of your Emergency Fund goal ($10,000).",
    time: "1d ago",
    read: true,
    type: "goal",
    route: "/savings",
  },
  {
    id: "notif-4",
    title: "Quick Add Enabled",
    message:
      "Double-press Volume Down on Android anytime to log an expense in under 2 seconds.",
    time: "2d ago",
    read: true,
    type: "info",
    route: "/quick-add-settings",
  },
];

export const DEFAULT_CONSENTS: Record<string, ConsentRecord> = {
  core_storage: {
    purpose: "core_storage",
    title: "Core Local Finance Management",
    description:
      "Store accounts, transactions, and categories locally on your device to calculate balances and manage budgets.",
    category: "required",
    status: "granted",
    grantedAt: new Date().toISOString(),
    policyVersion: CURRENT_POLICY_VERSION.version,
    source: "onboarding_default",
  },
  quick_add_triggers: {
    purpose: "quick_add_triggers",
    title: "Quick Add Hardware Triggers",
    description:
      "Detect physical volume-down double-press and notification tile clicks to open the fast transaction logger.",
    category: "optional",
    status: "granted",
    grantedAt: new Date().toISOString(),
    policyVersion: CURRENT_POLICY_VERSION.version,
    source: "user_settings",
  },
  local_notifications: {
    purpose: "local_notifications",
    title: "Local Milestone Notifications",
    description:
      "Receive on-device alerts when expenses are recorded, budgets near limits, or savings goals hit milestones.",
    category: "optional",
    status: "withdrawn",
    policyVersion: CURRENT_POLICY_VERSION.version,
    source: "user_settings",
  },
  diagnostics: {
    purpose: "diagnostics",
    title: "Anonymous Diagnostics & Error Logs",
    description:
      "Capture anonymized local error diagnostics to troubleshoot bugs. No transaction amounts or names are included.",
    category: "optional",
    status: "withdrawn",
    policyVersion: CURRENT_POLICY_VERSION.version,
    source: "privacy_center",
  },
  product_analytics: {
    purpose: "product_analytics",
    title: "Product Improvement Analytics",
    description:
      "Opt-in anonymous metrics to identify useful features. Completely disabled by default.",
    category: "optional",
    status: "withdrawn",
    policyVersion: CURRENT_POLICY_VERSION.version,
    source: "privacy_center",
  },
};

const KEYS = {
  expenses: "@pocketflow/expenses",
  categories: "@pocketflow/categories",
  settings: "@pocketflow/settings",
  paymentMethods: "@pocketflow/paymentMethods",
  accounts: "@pocketflow/accounts",
  transactions: "@pocketflow/transactions",
  savingsGoals: "@pocketflow/savingsGoals",
  recurringPayments: "@pocketflow/recurring_payments",
  migrationVersion: "@pocketflow/migrationVersion",
  quickAddSettings: "@pocketflow/quickAddSettings",
  notifications: "@pocketflow/notifications",
  privacyConsents: "@pocketflow/privacy_consents",
  privacyRequests: "@pocketflow/privacy_requests",
  nominee: "@pocketflow/nominee",
  privacyAuditEvents: "@pocketflow/privacy_audit_events",
  policyVersion: "@pocketflow/policy_version",
  authState: "@pocketflow/auth_state",
  onboardingState: "@pocketflow/onboarding_state",
  merchantRules: "@pocketflow/merchant_rules",
};

const CURRENT_MIGRATION_VERSION = 3;

const FinanceContext = createContext<FinanceContextValue | null>(null);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [voiceLoggingVisible, setVoiceLoggingVisible] = useState(false);
  const [celebrationExpense, setCelebrationExpense] = useState<{
    amount: number;
    category?: string;
    description?: string;
  } | null>(null);

  const celebrationActiveRef = useRef(false);
  const queuedMerchantMemoryRef = useRef<MerchantMemoryPrompt | null>(null);
  const [merchantMemoryPrompt, setMerchantMemoryPrompt] =
    useState<MerchantMemoryPrompt | null>(null);

  const celebrateExpense = useCallback(
    (details: { amount: number; category?: string; description?: string }) => {
      celebrationActiveRef.current = true;
      setCelebrationExpense(details);
    },
    [],
  );

  const dismissCelebration = useCallback(() => {
    celebrationActiveRef.current = false;
    setCelebrationExpense(null);
    if (queuedMerchantMemoryRef.current) {
      const nextPrompt = queuedMerchantMemoryRef.current;
      queuedMerchantMemoryRef.current = null;
      setTimeout(() => {
        setMerchantMemoryPrompt(nextPrompt);
      }, 250);
    }
  }, []);

  const queueMerchantMemory = useCallback(
    (prompt: MerchantMemoryPrompt) => {
      if (celebrationActiveRef.current) {
        queuedMerchantMemoryRef.current = prompt;
      } else {
        setTimeout(() => {
          setMerchantMemoryPrompt(prompt);
        }, 200);
      }
    },
    [],
  );

  const dismissMerchantMemory = useCallback(() => {
    queuedMerchantMemoryRef.current = null;
    setMerchantMemoryPrompt(null);
  }, []);

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [settings, setSettings] = useState<UserSettings>(defaults);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(
    DEFAULT_PAYMENT_METHODS,
  );
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(
    DEFAULT_SAVINGS_GOALS,
  );
  const [recurringPayments, setRecurringPayments] = useState<RecurringPayment[]>([]);
  const [quickAddSettings, setQuickAddSettings] = useState<QuickAddSettings>(
    defaultQuickAddSettings,
  );
  const [notifications, setNotifications] = useState<NotificationItem[]>(
    DEFAULT_NOTIFICATIONS,
  );
  const [consents, setConsents] =
    useState<Record<string, ConsentRecord>>(DEFAULT_CONSENTS);
  const hasAnalyticsConsent = consents.product_analytics?.status === "granted";
  const [privacyRequests, setPrivacyRequests] = useState<PrivacyRequest[]>([]);
  const [nominee, setNominee] = useState<NomineeRecord | null>(null);
  const [privacyAuditEvents, setPrivacyAuditEvents] = useState<
    PrivacyAuditEvent[]
  >([]);
  const [policyVersion, setPolicyVersion] = useState<string>(
    CURRENT_POLICY_VERSION.version,
  );
  const [authState, setAuthState] = useState<LocalAuthState | null>(null);
  const [onboardingState, setOnboardingState] = useState<OnboardingState>(
    DEFAULT_ONBOARDING_STATE,
  );
  const [merchantRules, setMerchantRules] = useState<MerchantRule[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [
        storedExpenses,
        storedCategories,
        storedSettings,
        storedPaymentMethods,
        storedAccounts,
        storedTransactions,
        storedSavingsGoals,
        migrationVersion,
        storedQuickAdd,
        storedNotifications,
        storedConsents,
        storedRequests,
        storedNominee,
        storedAuditEvents,
        storedPolicyVersion,
        storedAuthState,
        storedOnboardingState,
        storedMerchantRules,
        storedRecurringPayments,
      ] = await Promise.all([
        AsyncStorage.getItem(KEYS.expenses),
        AsyncStorage.getItem(KEYS.categories),
        AsyncStorage.getItem(KEYS.settings),
        AsyncStorage.getItem(KEYS.paymentMethods),
        AsyncStorage.getItem(KEYS.accounts),
        AsyncStorage.getItem(KEYS.transactions),
        AsyncStorage.getItem(KEYS.savingsGoals),
        AsyncStorage.getItem(KEYS.migrationVersion),
        AsyncStorage.getItem(KEYS.quickAddSettings),
        AsyncStorage.getItem(KEYS.notifications),
        AsyncStorage.getItem(KEYS.privacyConsents),
        AsyncStorage.getItem(KEYS.privacyRequests),
        AsyncStorage.getItem(KEYS.nominee),
        AsyncStorage.getItem(KEYS.privacyAuditEvents),
        AsyncStorage.getItem(KEYS.policyVersion),
        AsyncStorage.getItem(KEYS.authState),
        AsyncStorage.getItem(KEYS.onboardingState),
        AsyncStorage.getItem(KEYS.merchantRules),
        AsyncStorage.getItem(KEYS.recurringPayments),
      ]);

      const currentMigrationVersion = migrationVersion
        ? parseInt(migrationVersion, 10)
        : 0;

      setExpenses(
        storedExpenses ? (JSON.parse(storedExpenses) as Expense[]) : seed,
      );
      let loadedCategories = storedCategories
        ? (JSON.parse(storedCategories) as Category[])
        : DEFAULT_CATEGORIES;

      let hasCatMigration = false;
      loadedCategories = loadedCategories.map((c) => {
        if (c.isDefault && !c.imageUrl && !c.icon?.startsWith("logo:")) {
          const visualKey = (c.id === "other-income" ? "salary" : c.id) as CategoryVisualId;
          if (CATEGORY_VISUALS[visualKey]) {
            hasCatMigration = true;
            return {
              ...c,
              icon: "logo:" + visualKey,
              color: CATEGORY_VISUALS[visualKey].palette.primary,
            };
          }
        }
        return c;
      });

      if (
        !loadedCategories.some(
          (c) => c.id === "deen" || c.name.toLowerCase().includes("deen"),
        )
      ) {
        const deenCat: Category = {
          id: "deen",
          name: "Deen & Sadqa",
          icon: "logo:deen",
          color: "#059669",
          type: "expense",
          isDefault: true,
        };
        loadedCategories = [...loadedCategories, deenCat];
        hasCatMigration = true;
      }

      if (hasCatMigration) {
        void AsyncStorage.setItem(
          KEYS.categories,
          JSON.stringify(loadedCategories),
        );
      }
      setCategories(loadedCategories);
      setSettings(
        storedSettings
          ? {
              ...defaults,
              ...(JSON.parse(storedSettings) as Partial<UserSettings>),
            }
          : defaults,
      );
      setPaymentMethods(
        storedPaymentMethods
          ? (JSON.parse(storedPaymentMethods) as PaymentMethod[])
          : DEFAULT_PAYMENT_METHODS,
      );
      let initialAccounts: Account[] = storedAccounts
        ? (JSON.parse(storedAccounts) as Account[])
        : [];
      if (!initialAccounts || initialAccounts.length === 0) {
        const defaultAccount: Account = {
          id: "main-wallet",
          name: "Main Wallet",
          type: "CASH",
          currency:
            (storedSettings ? JSON.parse(storedSettings).currency : "INR") ||
            "INR",
          openingBalance: 0,
          isDefault: true,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        initialAccounts = [defaultAccount];
        void AsyncStorage.setItem(KEYS.accounts, JSON.stringify(initialAccounts));
      }
      setAccounts(initialAccounts);
      setTransactions(
        storedTransactions
          ? (
              JSON.parse(storedTransactions) as Transaction[]
            ).sort(compareTransactionsByLatest)
          : [],
      );
      setSavingsGoals(
        storedSavingsGoals
          ? (JSON.parse(storedSavingsGoals) as SavingsGoal[])
          : DEFAULT_SAVINGS_GOALS,
      );
      if (storedRecurringPayments) {
        try {
          setRecurringPayments(JSON.parse(storedRecurringPayments) as RecurringPayment[]);
        } catch {
          setRecurringPayments([]);
        }
      }
      setQuickAddSettings(
        storedQuickAdd
          ? {
              ...defaultQuickAddSettings,
              ...(JSON.parse(storedQuickAdd) as Partial<QuickAddSettings>),
            }
          : defaultQuickAddSettings,
      );
      setNotifications(
        storedNotifications
          ? (JSON.parse(storedNotifications) as NotificationItem[])
          : DEFAULT_NOTIFICATIONS,
      );

      if (storedConsents) {
        try {
          const parsed = JSON.parse(storedConsents) as Record<
            string,
            ConsentRecord
          >;
          const merged = { ...DEFAULT_CONSENTS, ...parsed };
          setConsents(merged);
          if (merged.product_analytics?.status === "granted") {
            void optInPostHog();
            if (storedAuthState) {
              try {
                const parsedAuth = JSON.parse(storedAuthState) as LocalAuthState;
                if (parsedAuth?.userId) {
                  identifyPostHog(parsedAuth.userId);
                }
              } catch {}
            }
          } else {
            void optOutPostHog();
          }
        } catch {
          setConsents(DEFAULT_CONSENTS);
          void optOutPostHog();
        }
      } else {
        setConsents(DEFAULT_CONSENTS);
        void optOutPostHog();
      }

      if (storedRequests) {
        try {
          setPrivacyRequests(JSON.parse(storedRequests) as PrivacyRequest[]);
        } catch {
          setPrivacyRequests([]);
        }
      }

      if (storedNominee) {
        try {
          setNominee(JSON.parse(storedNominee) as NomineeRecord);
        } catch {
          setNominee(null);
        }
      }

      if (storedAuditEvents) {
        try {
          setPrivacyAuditEvents(
            JSON.parse(storedAuditEvents) as PrivacyAuditEvent[],
          );
        } catch {
          setPrivacyAuditEvents([]);
        }
      }

      if (storedPolicyVersion) {
        setPolicyVersion(storedPolicyVersion);
      }

      if (storedAuthState) {
        try {
          setAuthState(JSON.parse(storedAuthState) as LocalAuthState);
        } catch {
          setAuthState(null);
        }
      }

      if (storedOnboardingState) {
        try {
          setOnboardingState(
            JSON.parse(storedOnboardingState) as OnboardingState,
          );
        } catch {
          setOnboardingState(DEFAULT_ONBOARDING_STATE);
        }
      } else if (storedAccounts && JSON.parse(storedAccounts).length > 0) {
        const grandfatheredOnboarding: OnboardingState = {
          completed: true,
          version: CURRENT_ONBOARDING_VERSION,
          completedAt: new Date().toISOString(),
        };
        setOnboardingState(grandfatheredOnboarding);
        await AsyncStorage.setItem(
          KEYS.onboardingState,
          JSON.stringify(grandfatheredOnboarding),
        );
      }

      if (storedMerchantRules) {
        try {
          setMerchantRules(JSON.parse(storedMerchantRules) as MerchantRule[]);
        } catch {
          setMerchantRules([]);
        }
      }

      if (currentMigrationVersion < CURRENT_MIGRATION_VERSION) {
        await migrateData(currentMigrationVersion);
      }

      setLoading(false);
    } catch (error) {
      console.error("Failed to load data:", error);
      setExpenses(seed);
      setNotifications(DEFAULT_NOTIFICATIONS);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();

    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        void loadData();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [loadData]);

  const migrateData = useCallback(
    async (fromVersion: number) => {
      if (fromVersion >= CURRENT_MIGRATION_VERSION) return;

      let currentAccounts = accounts;
      let currentTransactions = transactions;
      let currentExpenses = expenses;

      if (fromVersion < 1) {
        const hasExistingAccounts = currentAccounts.length > 0;
        const hasExistingTransactions = currentTransactions.length > 0;

        if (!hasExistingAccounts && !hasExistingTransactions) {
          const defaultAccount: Account = {
            id: "main-wallet",
            name: "Main Wallet",
            type: "CASH",
            currency: settings.currency,
            openingBalance: 0,
            isDefault: true,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          currentAccounts = [defaultAccount];

          currentTransactions = currentExpenses.map((expense) => ({
            id: expense.id,
            type: "EXPENSE" as TransactionType,
            amount: expense.amount,
            description: expense.description,
            category: expense.category,
            categoryId: categories.find((c) => c.name === expense.category)?.id,
            accountId: defaultAccount.id,
            date: new Date(expense.date).toISOString().split("T")[0],
            time: new Date(expense.date).toTimeString().slice(0, 5),
            createdAt: expense.date,
            updatedAt: expense.date,
          }));

          await AsyncStorage.setItem(
            KEYS.accounts,
            JSON.stringify(currentAccounts),
          );
          await AsyncStorage.setItem(
            KEYS.transactions,
            JSON.stringify(currentTransactions),
          );
        }
      }

      if (fromVersion < 2) {
        // Normalize existing transactions: ensure positive amounts, uppercase types
        currentTransactions = currentTransactions.map((txn) => ({
          ...txn,
          amount: Math.abs(Number(txn.amount)) || 0,
          type: (txn.type || "EXPENSE").toUpperCase() as TransactionType,
        }));
        await AsyncStorage.setItem(
          KEYS.transactions,
          JSON.stringify(currentTransactions),
        );
      }

      setAccounts(currentAccounts);
      setTransactions(currentTransactions);
      await AsyncStorage.setItem(
        KEYS.migrationVersion,
        CURRENT_MIGRATION_VERSION.toString(),
      );
    },
    [accounts, transactions, expenses, categories, settings.currency],
  );

  const migrateIfNeeded = useCallback(async () => {
    const migrationVersion = await AsyncStorage.getItem(KEYS.migrationVersion);
    const currentVersion = migrationVersion
      ? parseInt(migrationVersion, 10)
      : 0;
    if (currentVersion < CURRENT_MIGRATION_VERSION) {
      await migrateData(currentVersion);
    }
  }, [migrateData]);

  const persistExpenses = useCallback((next: Expense[]) => {
    setExpenses(next);
    void AsyncStorage.setItem(KEYS.expenses, JSON.stringify(next));
  }, []);

  const addExpense = useCallback(
    async (
      amount: number,
      description: string,
      category: Category,
      payment = settings.defaultPayment,
    ) => {
      const now = new Date();
      const txCreatedAt = now.toISOString();
      const expense: Expense = {
        id: Date.now().toString() + Math.random().toString(36).slice(2, 8),
        amount,
        description: description.trim() || category.name,
        category: category.name,
        icon: category.icon,
        color: category.color,
        date: txCreatedAt,
        payment,
      };
      setExpenses((current) => {
        const next = [expense, ...current];
        void AsyncStorage.setItem(KEYS.expenses, JSON.stringify(next));
        return next;
      });

      const matchedAccount = payment?.toLowerCase().includes("cash")
        ? (accounts.find((a) => a.type === "CASH" || a.name.toLowerCase().includes("cash")) || accounts[0])
        : (accounts.find((a) => a.isDefault) || accounts[0]);

      const transaction: Transaction = {
        id: expense.id,
        amount: Math.abs(amount),
        type: "EXPENSE",
        description: description.trim() || category.name,
        category: category.name,
        categoryId: category.id,
        accountId: matchedAccount?.id || "main-wallet",
        date: txCreatedAt.split("T")[0],
        time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
        createdAt: txCreatedAt,
        updatedAt: txCreatedAt,
      };
      setTransactions((prev) => {
        const next = [transaction, ...prev].sort(compareTransactionsByLatest);
        void AsyncStorage.setItem(KEYS.transactions, JSON.stringify(next));
        return next;
      });

      celebrateExpense({
        amount,
        category: category.name,
        description: description.trim() || undefined,
      });

      const notifBody = formatExpenseNotificationBody(
        amount,
        settings.currency || "INR",
        category.name,
        description,
        settings.profileName,
        authState?.email,
        accounts.map((a) => a.name),
      );
      const notif: NotificationItem = {
        id: "notif-exp-" + Date.now(),
        title: DEFAULT_EXPENSE_NOTIF_TITLE,
        message: notifBody,
        time: new Date().toISOString(),
        read: false,
        type: "success",
        route: "/(tabs)/expenses",
      };
      setNotifications((prev) => {
        const updated = [notif, ...prev];
        void AsyncStorage.setItem(KEYS.notifications, JSON.stringify(updated));
        return updated;
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    [settings.defaultPayment, settings.currency, accounts],
  );

  const deleteExpense = useCallback(
    (id: string) => persistExpenses(expenses.filter((item) => item.id !== id)),
    [expenses, persistExpenses],
  );
  const updateExpense = useCallback(
    (expense: Expense) =>
      persistExpenses(
        expenses.map((item) => (item.id === expense.id ? expense : item)),
      ),
    [expenses, persistExpenses],
  );

  const addCategory = useCallback(
    async (
      name: string,
      icon: string,
      color: string,
      type?: CategoryType,
      imageUrl?: string,
    ) => {
      const category: Category = {
        id: "custom-" + Date.now().toString(),
        name: name.trim(),
        icon,
        color,
        type: type || "expense",
        imageUrl,
        isDefault: false,
      };
      const next = [...categories, category];
      setCategories(next);
      await AsyncStorage.setItem(KEYS.categories, JSON.stringify(next));
      captureAnalyticsEvent(
        "category_created",
        {
          category_type: category.type || "expense",
        },
        hasAnalyticsConsent,
      );
    },
    [categories, hasAnalyticsConsent],
  );

  const updateCategory = useCallback(
    async (category: Category) => {
      const next = categories.map((item) =>
        item.id === category.id ? category : item,
      );
      setCategories(next);
      await AsyncStorage.setItem(KEYS.categories, JSON.stringify(next));
    },
    [categories],
  );

  const deleteCategory = useCallback(
    async (id: string, replacementCategoryId?: string) => {
      const target = categories.find((item) => item.id === id);
      if (!target) return false;

      const hasExpenses =
        expenses.some((item) => item.category === target.name) ||
        transactions.some(
          (t) => t.category === target.name || t.categoryId === target.id,
        );

      const replacement = replacementCategoryId
        ? categories.find((c) => c.id === replacementCategoryId)
        : undefined;

      if (hasExpenses && !replacementCategoryId) {
        return false;
      }

      if (hasExpenses && replacement) {
        if (replacement.id === id) return false;

        // Move existing expenses to replacement category
        setExpenses((prev) => {
          const next = prev.map((exp) =>
            exp.category === target.name
              ? {
                  ...exp,
                  category: replacement.name,
                  icon: replacement.icon,
                  color: replacement.color,
                }
              : exp,
          );
          void AsyncStorage.setItem(KEYS.expenses, JSON.stringify(next));
          return next;
        });

        // Move existing transactions to replacement category
        setTransactions((prev) => {
          const next = prev.map((t) =>
            t.category === target.name || t.categoryId === target.id
              ? {
                  ...t,
                  category: replacement.name,
                  categoryId: replacement.id,
                  updatedAt: new Date().toISOString(),
                }
              : t,
          );
          void AsyncStorage.setItem(KEYS.transactions, JSON.stringify(next));
          return next;
        });
      }

      // Safely update or prune merchant rules referencing deleted category
      setMerchantRules((prev) => {
        const updated = prev
          .map((r) => {
            if (r.categoryId === id) {
              if (replacement) {
                return {
                  ...r,
                  categoryId: replacement.id,
                  categoryName: replacement.name,
                  updatedAt: new Date().toISOString(),
                };
              }
              return null;
            }
            return r;
          })
          .filter((r): r is MerchantRule => r !== null);
        void AsyncStorage.setItem(KEYS.merchantRules, JSON.stringify(updated));
        return updated;
      });

      const next = categories.filter((item) => item.id !== id);
      setCategories(next);
      await AsyncStorage.setItem(KEYS.categories, JSON.stringify(next));
      return true;
    },
    [categories, expenses, transactions],
  );

  const updateSettings = useCallback(
    async (patch: Partial<UserSettings>) => {
      setSettings((prev) => {
        const next = { ...prev };
        for (const [k, v] of Object.entries(patch)) {
          if (v !== undefined) {
            (next as any)[k] = v;
          }
        }
        void AsyncStorage.setItem(KEYS.settings, JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  const addPaymentMethod = useCallback(
    async (name: string) => {
      const method: PaymentMethod = {
        id: "pm-" + Date.now().toString(),
        name: name.trim(),
        isDefault: false,
      };
      const next = [...paymentMethods, method];
      setPaymentMethods(next);
      await AsyncStorage.setItem(KEYS.paymentMethods, JSON.stringify(next));
    },
    [paymentMethods],
  );

  const updatePaymentMethod = useCallback(
    async (method: PaymentMethod) => {
      const next = paymentMethods.map((item) =>
        item.id === method.id ? method : item,
      );
      setPaymentMethods(next);
      await AsyncStorage.setItem(KEYS.paymentMethods, JSON.stringify(next));
    },
    [paymentMethods],
  );

  const deletePaymentMethod = useCallback(
    async (id: string) => {
      const target = paymentMethods.find((item) => item.id === id);
      if (target?.isDefault) return;
      const next = paymentMethods.filter((item) => item.id !== id);
      setPaymentMethods(next);
      await AsyncStorage.setItem(KEYS.paymentMethods, JSON.stringify(next));
    },
    [paymentMethods],
  );

  const addAccount = useCallback(
    async (accountData: Omit<Account, "id" | "createdAt" | "updatedAt">) => {
      const now = new Date().toISOString();
      const account: Account = {
        ...accountData,
        isActive: accountData.isActive !== false,
        id: "acc-" + Date.now().toString(),
        createdAt: now,
        updatedAt: now,
      };
      let nextAccounts = [...accounts, account];
      if (account.isDefault) {
        nextAccounts = nextAccounts.map((a) => ({
          ...a,
          isDefault: a.id === account.id,
        }));
      }
      setAccounts(nextAccounts);
      await AsyncStorage.setItem(KEYS.accounts, JSON.stringify(nextAccounts));
      captureAnalyticsEvent(
        "account_created",
        {
          account_type: account.type,
          is_first_account: accounts.length === 0,
        },
        hasAnalyticsConsent,
      );
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    [accounts, hasAnalyticsConsent],
  );

  const updateAccount = useCallback(
    async (account: Account) => {
      let next = accounts.map((item) =>
        item.id === account.id
          ? { ...account, updatedAt: new Date().toISOString() }
          : item,
      );
      if (account.isDefault) {
        next = next.map((a) => ({ ...a, isDefault: a.id === account.id }));
      }
      setAccounts(next);
      await AsyncStorage.setItem(KEYS.accounts, JSON.stringify(next));
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    [accounts],
  );

  const syncAccountCardLast4 = useCallback(
    async (accountId: string, cardLast4: string): Promise<Account | null> => {
      if (!accountId || !cardLast4) return null;
      const cleanDigits = cardLast4.replace(/\D/g, "");
      const normalized4 =
        cleanDigits.length > 4 ? cleanDigits.slice(-4) : cleanDigits;
      if (normalized4.length !== 4) return null;

      let updatedAcc: Account | null = null;
      setAccounts((prev) => {
        const target = prev.find((a) => a.id === accountId);
        if (!target || target.cardLast4 === normalized4) return prev;
        const now = new Date().toISOString();
        updatedAcc = {
          ...target,
          cardLast4: normalized4,
          updatedAt: now,
        };
        const next = prev.map((a) => (a.id === accountId ? updatedAcc! : a));
        void AsyncStorage.setItem(KEYS.accounts, JSON.stringify(next));
        return next;
      });

      return updatedAcc;
    },
    [],
  );

  const setDefaultAccount = useCallback(
    async (id: string) => {
      let updatedAccounts: Account[] | null = null;
      setAccounts((prev) => {
        const target = prev.find((a) => a.id === id);
        if (!target) return prev; // Preserve previous valid state if account ID is invalid
        const now = new Date().toISOString();
        updatedAccounts = prev.map((a) => ({
          ...a,
          isDefault: a.id === id,
          updatedAt: a.id === id ? now : a.updatedAt,
        }));
        return updatedAccounts;
      });
      if (updatedAccounts) {
        await AsyncStorage.setItem(KEYS.accounts, JSON.stringify(updatedAccounts));
      }
    },
    [],
  );

  const deleteAccount = useCallback(
    async (id: string, replacementAccountId?: string): Promise<boolean> => {
      const target = accounts.find((a) => a.id === id);
      if (!target) return false;

      const linkedTransactions = transactions.filter(
        (t) =>
          t.accountId === id || t.fromAccountId === id || t.toAccountId === id,
      );

      // If transactions exist and no replacement destination is supplied, abort safely
      if (linkedTransactions.length > 0 && !replacementAccountId) {
        return false;
      }

      let updatedTransactions: Transaction[] | null = null;
      if (linkedTransactions.length > 0 && replacementAccountId) {
        if (replacementAccountId === id) return false;
        const replacement = accounts.find((a) => a.id === replacementAccountId);
        if (!replacement) return false;

        const now = new Date().toISOString();
        updatedTransactions = transactions.map((t) => {
          let modified = false;
          let newTx = { ...t };
          if (newTx.accountId === id) {
            newTx.accountId = replacementAccountId;
            modified = true;
          }
          if (newTx.fromAccountId === id) {
            newTx.fromAccountId = replacementAccountId;
            modified = true;
          }
          if (newTx.toAccountId === id) {
            newTx.toAccountId = replacementAccountId;
            modified = true;
          }
          if (modified) {
            newTx.updatedAt = now;
          }
          return newTx;
        });
      }

      const remainingAccounts = accounts.filter((a) => a.id !== id);
      const wasDefault = target.isDefault;
      let updatedAccounts: Account[];

      // If deleted account was default and other accounts remain,
      // assign the first remaining account as default atomically
      if (wasDefault && remainingAccounts.length > 0) {
        const now = new Date().toISOString();
        updatedAccounts = remainingAccounts.map((a, i) => ({
          ...a,
          isDefault: i === 0,
          updatedAt: i === 0 ? now : a.updatedAt,
        }));
      } else {
        updatedAccounts = remainingAccounts;
      }

      // Persist reassigned transactions to AsyncStorage and state
      if (updatedTransactions) {
        setTransactions(updatedTransactions);
        await AsyncStorage.setItem(KEYS.transactions, JSON.stringify(updatedTransactions));
      }

      // Persist remaining accounts to AsyncStorage and state
      setAccounts(updatedAccounts);
      await AsyncStorage.setItem(KEYS.accounts, JSON.stringify(updatedAccounts));

      return true;
    },
    [accounts, transactions],
  );

  // Indexed lookup maps for zero-cost merchant memory queries
  const merchantRuleMap = useMemo(() => {
    const map = new Map<string, MerchantRule>();
    for (let i = 0; i < merchantRules.length; i++) {
      const rule = merchantRules[i];
      if (rule.enabled !== false && rule.normalizedKey) {
        map.set(rule.normalizedKey, rule);
      }
    }
    return map;
  }, [merchantRules]);

  const categoryLookupMap = useMemo(() => {
    const map = new Map<string, Category>();
    for (let i = 0; i < categories.length; i++) {
      const cat = categories[i];
      map.set(cat.id, cat);
      map.set(cat.name.toLowerCase(), cat);
    }
    return map;
  }, [categories]);

  const getMerchantRule = useCallback(
    (merchant: string): MerchantRule | null => {
      const { normalizedKey, isAmbiguous } = normalizeMerchant(merchant);
      if (isAmbiguous || !normalizedKey) return null;
      const rule = merchantRuleMap.get(normalizedKey);
      if (!rule) return null;
      const cat = categoryLookupMap.get(rule.categoryId);
      if (!cat) return null;
      return rule;
    },
    [merchantRuleMap, categoryLookupMap],
  );

  const saveMerchantRule = useCallback(
    async (
      displayMerchant: string,
      categoryId: string,
      categoryName: string,
      options?: {
        preferredAccountId?: string;
        scope?: "GLOBAL" | "ACCOUNT";
        enabled?: boolean;
      },
    ): Promise<MerchantRule | null> => {
      const { normalizedKey, isAmbiguous, displayName } =
        normalizeMerchant(displayMerchant);
      if (isAmbiguous || !normalizedKey) return null;

      const cat = categories.find((c) => c.id === categoryId);
      if (!cat) return null;

      const now = new Date().toISOString();
      let createdRule: MerchantRule | null = null;

      setMerchantRules((prev) => {
        const existing = prev.find((r) => r.normalizedKey === normalizedKey);
        const rule: MerchantRule = {
          normalizedKey,
          displayMerchant:
            existing?.displayMerchant || displayName || displayMerchant.trim(),
          categoryId,
          categoryName: cat.name,
          preferredAccountId:
            options?.preferredAccountId ?? existing?.preferredAccountId,
          scope: options?.scope ?? existing?.scope ?? "GLOBAL",
          createdAt: existing?.createdAt || now,
          updatedAt: now,
          source: "user-confirmed",
          enabled: options?.enabled ?? existing?.enabled ?? true,
          userConfirmed: true,
        };
        createdRule = rule;
        const next = [
          rule,
          ...prev.filter((r) => r.normalizedKey !== normalizedKey),
        ];
        void AsyncStorage.setItem(KEYS.merchantRules, JSON.stringify(next));
        return next;
      });

      return createdRule;
    },
    [categories],
  );

  const toggleMerchantRule = useCallback(
    async (normalizedKey: string, enabled: boolean) => {
      const key = normalizedKey.toLowerCase().trim();
      setMerchantRules((prev) => {
        const next = prev.map((r) =>
          r.normalizedKey === key
            ? { ...r, enabled, updatedAt: new Date().toISOString() }
            : r,
        );
        void AsyncStorage.setItem(KEYS.merchantRules, JSON.stringify(next));
        return next;
      });
      void Haptics.selectionAsync();
    },
    [],
  );

  const deleteMerchantRule = useCallback(async (normalizedKey: string) => {
    setMerchantRules((prev) => {
      const next = prev.filter(
        (r) => r.normalizedKey !== normalizedKey.toLowerCase().trim(),
      );
      void AsyncStorage.setItem(KEYS.merchantRules, JSON.stringify(next));
      return next;
    });
  }, []);

  const countEligibleTransactions = useCallback(
    (merchant: string, excludeTransactionId?: string) => {
      const { normalizedKey, isAmbiguous } = normalizeMerchant(merchant);
      if (isAmbiguous || !normalizedKey) {
        return {
          uncategorizedCount: 0,
          alreadyCategorizedCount: 0,
          matchingTransactions: [],
        };
      }

      const matching = transactions.filter((t) => {
        if (excludeTransactionId && t.id === excludeTransactionId) return false;
        if (t.type !== "EXPENSE") return false;
        const tNorm = normalizeMerchant(t.description);
        return !tNorm.isAmbiguous && tNorm.normalizedKey === normalizedKey;
      });

      let uncategorizedCount = 0;
      let alreadyCategorizedCount = 0;

      for (const tx of matching) {
        const isUncat =
          !tx.categoryId ||
          !tx.category ||
          tx.category === "Uncategorized" ||
          tx.category === "Expense" ||
          tx.category === "Others";
        if (isUncat) {
          uncategorizedCount++;
        } else {
          alreadyCategorizedCount++;
        }
      }

      return {
        uncategorizedCount,
        alreadyCategorizedCount,
        matchingTransactions: matching,
      };
    },
    [transactions],
  );

  const bulkCategorizeTransactions = useCallback(
    async (
      merchant: string,
      categoryId: string,
      categoryName: string,
      overwriteExisting: boolean = false,
    ) => {
      const { normalizedKey, isAmbiguous } = normalizeMerchant(merchant);
      if (isAmbiguous || !normalizedKey) return 0;

      const targetCat = categories.find((c) => c.id === categoryId);
      const finalCatName = targetCat ? targetCat.name : categoryName;
      const finalIcon = targetCat ? targetCat.icon : "coffee";
      const finalColor = targetCat ? targetCat.color : "#FF8C69";

      let updatedCount = 0;
      const updatedTxIds = new Set<string>();

      const nextTransactions = transactions.map((t) => {
        if (t.type !== "EXPENSE") return t;
        const tNorm = normalizeMerchant(t.description);
        if (tNorm.isAmbiguous || tNorm.normalizedKey !== normalizedKey)
          return t;

        const isUncat =
          !t.categoryId ||
          !t.category ||
          t.category === "Uncategorized" ||
          t.category === "Expense" ||
          t.category === "Others";

        if (isUncat || overwriteExisting) {
          updatedCount++;
          updatedTxIds.add(t.id);
          return {
            ...t,
            categoryId,
            category: finalCatName,
            updatedAt: new Date().toISOString(),
          };
        }
        return t;
      });

      if (updatedCount === 0) return 0;

      setTransactions(nextTransactions);
      await AsyncStorage.setItem(
        KEYS.transactions,
        JSON.stringify(nextTransactions),
      );

      setExpenses((prev) => {
        const nextExp = prev.map((e) => {
          if (updatedTxIds.has(e.id)) {
            return {
              ...e,
              category: finalCatName,
              icon: finalIcon,
              color: finalColor,
            };
          }
          return e;
        });
        void AsyncStorage.setItem(KEYS.expenses, JSON.stringify(nextExp));
        return nextExp;
      });

      const notif: NotificationItem = {
        id: "notif-bulk-" + Date.now(),
        title: "Category applied to transactions",
        message: `${finalCatName} applied to ${updatedCount} ${updatedCount === 1 ? "transaction" : "transactions"}.`,
        time: new Date().toISOString(),
        read: false,
        type: "success",
        route: "/(tabs)/expenses",
      };
      setNotifications((prev) => {
        const updated = [notif, ...prev];
        void AsyncStorage.setItem(KEYS.notifications, JSON.stringify(updated));
        return updated;
      });

      return updatedCount;
    },
    [categories, transactions],
  );

  const updateMerchantRuleCategory = useCallback(
    async (
      normalizedKey: string,
      categoryId: string,
      categoryName: string,
      updateHistorical: boolean = true,
    ) => {
      const key = normalizedKey.toLowerCase().trim();
      const cat = categories.find((c) => c.id === categoryId);
      const catName = cat ? cat.name : categoryName;
      const targetRule = merchantRules.find((r) => r.normalizedKey === key);

      setMerchantRules((prev) => {
        const next = prev.map((r) =>
          r.normalizedKey === key
            ? {
                ...r,
                categoryId,
                categoryName: catName,
                updatedAt: new Date().toISOString(),
              }
            : r,
        );
        void AsyncStorage.setItem(KEYS.merchantRules, JSON.stringify(next));
        return next;
      });

      // Automatically update all transactions that were logged with this merchant!
      if (updateHistorical) {
        const merchantToUpdate = targetRule?.displayMerchant || key;
        await bulkCategorizeTransactions(
          merchantToUpdate,
          categoryId,
          catName,
          true,
        );
      }

      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    [categories, merchantRules, bulkCategorizeTransactions],
  );

  const addTransaction = useCallback(
    async (
      transactionData: Omit<Transaction, "id" | "createdAt" | "updatedAt"> & {
        createdAt?: string;
      },
    ) => {
      const nowDate = new Date();
      const now = nowDate.toISOString();
      const localDate = transactionData.date || getLocalDateString(nowDate);
      const localTime = transactionData.time || getLocalTimeString(nowDate);

      let txCreatedAt = (transactionData as any).createdAt || now;
      if (localDate) {
        try {
          const time24 = convertTo24Hour(localTime);
          const [h, m] = time24.split(":").map(Number);
          const parts = localDate.split("-").map(Number);
          if (parts.length === 3) {
            const [year, month, day] = parts;
            const d = new Date(
              year,
              month - 1,
              day,
              h || 0,
              m || 0,
              nowDate.getSeconds(),
              nowDate.getMilliseconds(),
            );
            txCreatedAt = d.toISOString();
          }
        } catch {
          txCreatedAt = now;
        }
      }

      let resolvedCategory = transactionData.category;
      let resolvedCategoryId = transactionData.categoryId;

      if (
        (transactionData.type === "EXPENSE" || !transactionData.type) &&
        (!resolvedCategoryId ||
          !resolvedCategory ||
          resolvedCategory === "Expense" ||
          resolvedCategory === "Uncategorized") &&
        transactionData.description
      ) {
        const remembered = getMerchantRule(transactionData.description);
        if (remembered) {
          resolvedCategory = remembered.categoryName;
          resolvedCategoryId = remembered.categoryId;
        }
      }

      if (
        (transactionData.type || "").toUpperCase() === "INCOME" &&
        (!resolvedCategory ||
          resolvedCategory === "Income" ||
          resolvedCategory === "Uncategorized" ||
          resolvedCategory === transactionData.description)
      ) {
        if (transactionData.description?.toLowerCase().includes("salary")) {
          resolvedCategory = "Salary";
          resolvedCategoryId = "salary";
        } else if (
          /\b(?:dividend|interest|bonus)\b/i.test(
            transactionData.description || "",
          )
        ) {
          resolvedCategory = "Investments";
          resolvedCategoryId = "investments";
        } else {
          resolvedCategory = "Other Income";
          resolvedCategoryId = "other-income";
        }
      }

      // Resolve target account permanently at transaction creation time
      const resolvedAccountId =
        transactionData.accountId ||
        (accounts.find((a) => a.isDefault)?.id || accounts[0]?.id);

      if (transactionData.cardLast4 && resolvedAccountId) {
        const cleanDigits = transactionData.cardLast4.replace(/\D/g, "");
        const card4 =
          cleanDigits.length > 4 ? cleanDigits.slice(-4) : cleanDigits;
        if (card4.length === 4) {
          void syncAccountCardLast4(resolvedAccountId, card4);
        }
      }

      const transaction: Transaction = {
        ...transactionData,
        accountId: resolvedAccountId,
        date: localDate,
        time: localTime,
        category: resolvedCategory,
        categoryId: resolvedCategoryId,
        amount: Math.abs(Number(transactionData.amount)) || 0,
        type: (
          transactionData.type || "EXPENSE"
        ).trim().toUpperCase() as TransactionType,
        id:
          "txn-" +
          Date.now().toString() +
          Math.random().toString(36).slice(2, 8),
        createdAt: txCreatedAt,
        updatedAt: now,
      };
      setTransactions((prev) => {
        const next = [transaction, ...prev].sort(compareTransactionsByLatest);
        void AsyncStorage.setItem(KEYS.transactions, JSON.stringify(next));
        return next;
      });

      if (transaction.type === "EXPENSE") {
        celebrateExpense({
          amount: transaction.amount,
          category: transaction.category || "Other",
          description: transaction.description,
        });
        setExpenses((prev) => {
          const newExp: Expense = {
            id: transaction.id,
            amount: transaction.amount,
            description: transaction.description,
            category: transaction.category || "Other",
            icon: "coffee",
            color: "#FF8C69",
            date: txCreatedAt,
            payment: "Cash",
          };
          const next = [newExp, ...prev];
          void AsyncStorage.setItem(KEYS.expenses, JSON.stringify(next));
          return next;
        });
        const notifBody = formatExpenseNotificationBody(
          transaction.amount,
          settings.currency || "INR",
          transaction.category || "Expense",
          transaction.description,
          settings.profileName,
          authState?.email,
          accounts.map((a) => a.name),
        );
        const notif: NotificationItem = {
          id: "notif-txn-" + Date.now(),
          title: DEFAULT_EXPENSE_NOTIF_TITLE,
          message: notifBody,
          time: new Date().toISOString(),
          read: false,
          type: "success",
          route: "/(tabs)/expenses",
        };
        setNotifications((prev) => {
          const updated = [notif, ...prev];
          void AsyncStorage.setItem(
            KEYS.notifications,
            JSON.stringify(updated),
          );
          return updated;
        });
      }

      captureAnalyticsEvent(
        "transaction_added",
        {
          transaction_type: transaction.type,
          has_category: Boolean(transaction.categoryId),
          has_account: Boolean(transaction.accountId),
        },
        hasAnalyticsConsent,
      );
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    [getMerchantRule, settings.currency, hasAnalyticsConsent],
  );

  const addTransactionsBatch = useCallback(
    async (
      transactionsData: Array<
        Omit<Transaction, "id" | "createdAt" | "updatedAt"> & {
          createdAt?: string;
        }
      >,
    ) => {
      if (!transactionsData || transactionsData.length === 0) return 0;

      const nowDate = new Date();
      const now = nowDate.toISOString();
      const newTransactions: Transaction[] = transactionsData.map((t, idx) => {
        let cat = t.category;
        let catId = t.categoryId;
        if (
          (t.type === "EXPENSE" || !t.type) &&
          (!catId || !cat || cat === "Expense" || cat === "Uncategorized") &&
          t.description
        ) {
          const remembered = getMerchantRule(t.description);
          if (remembered) {
            cat = remembered.categoryName;
            catId = remembered.categoryId;
          }
        }

        let batchCreatedAt = (t as any).createdAt;
        if (!batchCreatedAt && t.date) {
          try {
            const time24 = t.time
              ? convertTo24Hour(t.time)
              : `${String(nowDate.getHours()).padStart(2, "0")}:${String(nowDate.getMinutes()).padStart(2, "0")}`;
            const [h, m] = time24.split(":").map(Number);
            const parts = t.date.split("-").map(Number);
            if (parts.length === 3) {
              const [year, month, day] = parts;
              const d = new Date(
                year,
                month - 1,
                day,
                h || 0,
                m || 0,
                Math.max(0, nowDate.getSeconds() - idx),
                nowDate.getMilliseconds(),
              );
              batchCreatedAt = d.toISOString();
            }
          } catch {
            batchCreatedAt = now;
          }
        }

        const defaultId = accounts.find((a) => a.isDefault)?.id || accounts[0]?.id;

        return {
          ...t,
          accountId: t.accountId || defaultId,
          category: cat,
          categoryId: catId,
          amount: Math.abs(Number(t.amount)) || 0,
          type: (t.type || "EXPENSE").trim().toUpperCase() as TransactionType,
          id:
            "txn-" +
            Date.now().toString() +
            "-" +
            idx +
            "-" +
            Math.random().toString(36).slice(2, 6),
          createdAt: batchCreatedAt || now,
          updatedAt: now,
        };
      });

      setTransactions((prev) => {
        const next = [...newTransactions, ...prev].sort(compareTransactionsByLatest);
        void AsyncStorage.setItem(KEYS.transactions, JSON.stringify(next));
        return next;
      });

      const expenseTransactions = newTransactions.filter(
        (t) => t.type === "EXPENSE",
      );
      if (expenseTransactions.length > 0) {
        const newExpenses: Expense[] = expenseTransactions.map((t) => {
          const cat = categories.find(
            (c) => c.name === (t.category || "Other"),
          );
          return {
            id: t.id,
            amount: t.amount,
            description: t.description,
            category: t.category || "Other",
            icon: cat ? cat.icon : "coffee",
            color: cat ? cat.color : "#FF8C69",
            date: t.createdAt,
            payment: "Cash",
          };
        });
        setExpenses((prev) => {
          const next = [...newExpenses, ...prev];
          void AsyncStorage.setItem(KEYS.expenses, JSON.stringify(next));
          return next;
        });
      }

      const totalSpent = expenseTransactions.reduce(
        (sum, t) => sum + t.amount,
        0,
      );

      const sym = currencySymbol(settings.currency || "INR");

      const notif: NotificationItem = {
        id: "notif-batch-" + Date.now(),
        title: "Transactions added!",
        message: `Successfully added ${newTransactions.length} transaction${newTransactions.length > 1 ? "s" : ""} totaling ${sym}${totalSpent.toLocaleString()}.`,
        time: new Date().toISOString(),
        read: false,
        type: "success",
        route: "/(tabs)/expenses",
      };

      setNotifications((prev) => {
        const updated = [notif, ...prev];
        void AsyncStorage.setItem(KEYS.notifications, JSON.stringify(updated));
        return updated;
      });

      captureAnalyticsEvent(
        "transactions_imported",
        {
          transaction_count: newTransactions.length,
          expense_count: expenseTransactions.length,
        },
        hasAnalyticsConsent,
      );
      logAnalyticsOperational(
        "transaction import completed",
        {
          transaction_count: newTransactions.length,
          expense_count: expenseTransactions.length,
        },
        hasAnalyticsConsent,
      );
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return newTransactions.length;
    },
    [settings.currency, categories, getMerchantRule, hasAnalyticsConsent],
  );

  const deleteTransaction = useCallback(async (id: string) => {
    let nextTransactions: Transaction[] = [];
    let nextExpenses: Expense[] = [];
    setTransactions((prev) => {
      nextTransactions = prev.filter((t) => t.id !== id);
      return nextTransactions;
    });
    setExpenses((prev) => {
      nextExpenses = prev.filter((e) => e.id !== id);
      return nextExpenses;
    });
    await Promise.all([
      AsyncStorage.setItem(KEYS.transactions, JSON.stringify(nextTransactions)),
      AsyncStorage.setItem(KEYS.expenses, JSON.stringify(nextExpenses)),
    ]);
    captureAnalyticsEvent("transaction_deleted", {}, hasAnalyticsConsent);
  }, [hasAnalyticsConsent]);

  const deleteAllTransactions = useCallback(async () => {
    setTransactions([]);
    setExpenses([]);
    await Promise.all([
      AsyncStorage.setItem(KEYS.transactions, JSON.stringify([])),
      AsyncStorage.setItem(KEYS.expenses, JSON.stringify([])),
    ]);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, []);

  const updateTransaction = useCallback(async (transaction: Transaction) => {
    let txCreatedAt = transaction.createdAt;
    if (!txCreatedAt && transaction.date) {
      try {
        const time24 = transaction.time
          ? convertTo24Hour(transaction.time)
          : "12:00";
        const [h, m] = time24.split(":").map(Number);
        const d = new Date(transaction.date);
        d.setHours(h || 12, m || 0, 0, 0);
        txCreatedAt = d.toISOString();
      } catch {
        txCreatedAt = new Date().toISOString();
      }
    }

    setTransactions((prev) => {
      const next = prev.map((t) =>
        t.id === transaction.id
          ? {
              ...transaction,
              amount: Math.abs(Number(transaction.amount)) || 0,
              type: (transaction.type || "EXPENSE")
                .trim()
                .toUpperCase() as TransactionType,
              createdAt: txCreatedAt || t.createdAt,
              updatedAt: new Date().toISOString(),
            }
          : t,
      );
      next.sort(compareTransactionsByLatest);
      void AsyncStorage.setItem(KEYS.transactions, JSON.stringify(next));
      return next;
    });

    if (transaction.type === "EXPENSE") {
      setExpenses((prev) => {
        const expenseDate =
          txCreatedAt ||
          (transaction.date
            ? `${transaction.date}T12:00:00.000Z`
            : new Date().toISOString());
        const exists = prev.some((e) => e.id === transaction.id);
        if (exists) {
          const next = prev.map((e) =>
            e.id === transaction.id
              ? {
                  ...e,
                  amount: Math.abs(Number(transaction.amount)) || 0,
                  description: transaction.description,
                  category: transaction.category || e.category,
                  date: expenseDate,
                }
              : e,
          );
          void AsyncStorage.setItem(KEYS.expenses, JSON.stringify(next));
          return next;
        } else {
          const newExp: Expense = {
            id: transaction.id,
            amount: Math.abs(Number(transaction.amount)) || 0,
            description: transaction.description,
            category: transaction.category || "Other",
            icon: "coffee",
            color: "#FF8C69",
            date: expenseDate,
            payment: "Cash",
          };
          const next = [newExp, ...prev];
          void AsyncStorage.setItem(KEYS.expenses, JSON.stringify(next));
          return next;
        }
      });
    } else {
      setExpenses((prev) => {
        const next = prev.filter((e) => e.id !== transaction.id);
        void AsyncStorage.setItem(KEYS.expenses, JSON.stringify(next));
        return next;
      });
    }
  }, []);

  // High-performance single-pass balance index maintained in memory.
  // Replaces O(Accounts * Transactions) scans with O(1) instantaneous lookups.
  const balancesIndex = useMemo(() => {
    const balances = new Map<string, number>();
    const knownAccountIds = new Set(accounts.map((a) => a.id));

    // Initialize with opening balances
    for (let i = 0; i < accounts.length; i++) {
      const a = accounts[i];
      balances.set(a.id, Number(a.openingBalance) || 0);
    }

    // Stable primary account fallback that never fluctuates when isDefault changes
    const stablePrimaryAccId = accounts.length > 0 ? accounts[0].id : undefined;
    const defaultAccId = accounts.find((a) => a.isDefault)?.id || accounts[0]?.id;
    const cashAcc = accounts.find(
      (a) =>
        a.type === "CASH" ||
        a.name.toLowerCase().includes("cash") ||
        a.id === "cash" ||
        a.id === "1" ||
        a.id === "main-wallet" ||
        a.id === "primary-wallet",
    );
    const cashAccId = cashAcc?.id || (accounts.length === 0 ? "cash" : undefined);

    let netAll = 0;
    const txLen = transactions.length;

    for (let i = 0; i < txLen; i++) {
      const txn = transactions[i];
      const amount = Math.abs(Number(txn.amount)) || 0;
      if (amount === 0) continue;
      const type = (txn.type || "EXPENSE").trim().toUpperCase();

      if (type === "INCOME") netAll += amount;
      else if (type === "EXPENSE") netAll -= amount;

      if (type === "TRANSFER") {
        if (txn.toAccountId && balances.has(txn.toAccountId)) {
          balances.set(txn.toAccountId, (balances.get(txn.toAccountId) || 0) + amount);
        }
        if (txn.fromAccountId && balances.has(txn.fromAccountId)) {
          balances.set(txn.fromAccountId, (balances.get(txn.fromAccountId) || 0) - amount);
        }
        continue;
      }

      let targetId: string | undefined;
      if (txn.accountId && knownAccountIds.has(txn.accountId)) {
        targetId = txn.accountId;
      } else {
        const txnMatchesCash =
          !txn.accountId ||
          txn.accountId === "cash" ||
          txn.accountId === "1" ||
          txn.accountId === "main-wallet" ||
          txn.accountId === "primary-wallet" ||
          (txn as any).payment === "Cash" ||
          txn.category?.toLowerCase() === "cash";

        if (txnMatchesCash && cashAccId) {
          targetId = cashAccId;
        } else if (stablePrimaryAccId) {
          targetId = stablePrimaryAccId;
        }
      }

      if (targetId && balances.has(targetId)) {
        const curr = balances.get(targetId) || 0;
        balances.set(targetId, type === "INCOME" ? curr + amount : curr - amount);
      }
    }

    let calculatedTotal = 0;
    if (accounts.length === 0) {
      calculatedTotal = netAll;
    } else {
      for (let i = 0; i < accounts.length; i++) {
        calculatedTotal += balances.get(accounts[i].id) || 0;
      }
    }

    return {
      balances,
      totalBalance: calculatedTotal,
      cashAccId,
      defaultAccId,
    };
  }, [accounts, transactions]);

  const getAccountBalance = useCallback(
    (accountId: string) => {
      if (balancesIndex.balances.has(accountId)) {
        return balancesIndex.balances.get(accountId)!;
      }
      if (
        (accountId === "main-wallet" ||
          accountId === "primary-wallet" ||
          accountId === "cash" ||
          accountId === "1") &&
        balancesIndex.cashAccId &&
        balancesIndex.balances.has(balancesIndex.cashAccId)
      ) {
        return balancesIndex.balances.get(balancesIndex.cashAccId)!;
      }
      return 0;
    },
    [balancesIndex],
  );

  const getTotalBalance = useCallback(() => {
    return balancesIndex.totalBalance;
  }, [balancesIndex]);

  const exportData = useCallback(
    async (format: "json" | "csv") => {
      try {
        let content = "";
        let fileName = "";
        let mimeType = "";

        if (format === "json") {
          content = JSON.stringify(
            {
              version: "1.0",
              exportedAt: new Date().toISOString(),
              expenses,
              categories,
              settings,
              paymentMethods,
              accounts,
              transactions,
              savingsGoals,
              recurringPayments,
              quickAddSettings,
            },
            null,
            2,
          );
          fileName = `zeno_backup_${new Date().toISOString().slice(0, 10)}.json`;
          mimeType = "application/json";
        } else {
          const headers = "Date,Type,Description,Amount,Category,Account";
          const rows = transactions.map((t) =>
            [
              t.date || new Date().toISOString().slice(0, 10),
              t.type || "EXPENSE",
              `"${(t.description || "").replace(/"/g, '""')}"`,
              t.amount,
              `"${(t.category || "").replace(/"/g, '""')}"`,
              `"${(accounts.find((a) => a.id === t.accountId)?.name || "").replace(/"/g, '""')}"`,
            ].join(","),
          );
          content = [headers, ...rows].join("\n");
          fileName = `zeno_transactions_${new Date().toISOString().slice(0, 10)}.csv`;
          mimeType = "text/csv";
        }

        const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(fileUri, content, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType,
            dialogTitle: `Export Zeno (${format.toUpperCase()})`,
            UTI:
              format === "json"
                ? "public.json"
                : "public.comma-separated-values-text",
          });
        } else {
          await Share.share({
            title: `Zeno ${format.toUpperCase()} Backup`,
            message: content,
          });
        }
        captureAnalyticsEvent(
          "data_exported",
          { export_format: format },
          hasAnalyticsConsent,
        );
        logAnalyticsOperational(
          "backup export completed",
          {
            export_format: format,
            transaction_count: transactions.length,
          },
          hasAnalyticsConsent,
        );
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
      } catch (err) {
        console.error("Export data failed:", err);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        throw err;
      }
    },
    [
      expenses,
      categories,
      settings,
      paymentMethods,
      accounts,
      transactions,
      savingsGoals,
      recurringPayments,
      quickAddSettings,
      hasAnalyticsConsent,
    ],
  );

  const importData = useCallback(
    async (json: string) => {
      let rawObj: unknown;
      try {
        rawObj = JSON.parse(json);
      } catch {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        throw new Error("Corrupted backup file: invalid JSON format.");
      }

      if (!rawObj || typeof rawObj !== "object" || Array.isArray(rawObj)) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        throw new Error(
          "Invalid backup format: root must be a valid JSON object.",
        );
      }

      // Strict schema definitions
      const BackupCategorySchema = z.object({
        id: z.string().min(1).max(100),
        name: z.string().min(1).max(100),
        icon: z.string().min(1).max(100),
        color: z.string().min(1).max(50),
        type: z.enum(["expense", "income", "both"]).optional(),
        isDefault: z.boolean().optional(),
      });

      const BackupExpenseSchema = z.object({
        id: z.string().min(1).max(100),
        amount: z.number().finite().positive().max(1_000_000_000),
        description: z.string().max(500),
        category: z.string().max(100),
        icon: z.string().max(100),
        color: z.string().max(50),
        date: z.string().max(100),
        payment: z.string().max(100),
      });

      const BackupAccountSchema = z.object({
        id: z.string().min(1).max(100),
        name: z.string().min(1).max(100),
        type: z.enum(["CASH", "BANK", "UPI", "SAVINGS", "OTHER"]),
        currency: z.string().max(20),
        openingBalance: z
          .number()
          .finite()
          .min(-1_000_000_000)
          .max(1_000_000_000),
        isDefault: z.boolean(),
        isActive: z.boolean(),
        createdAt: z.string().max(100).optional(),
        updatedAt: z.string().max(100).optional(),
      });

      const BackupTransactionSchema = z.object({
        id: z.string().min(1).max(100),
        type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
        amount: z.number().finite().positive().max(1_000_000_000),
        description: z.string().max(500),
        category: z.string().max(100).optional(),
        categoryId: z.string().max(100).optional(),
        accountId: z.string().max(100).optional(),
        fromAccountId: z.string().max(100).optional(),
        toAccountId: z.string().max(100).optional(),
        date: z.string().max(100),
        time: z.string().max(50).optional(),
        createdAt: z.string().max(100).optional(),
        updatedAt: z.string().max(100).optional(),
      });

      const BackupSavingsGoalSchema = z.object({
        id: z.string().min(1).max(100),
        name: z.string().min(1).max(100),
        targetAmount: z.number().finite().positive().max(1_000_000_000),
        currentAmount: z.number().finite().min(0).max(1_000_000_000),
        targetDate: z.string().max(100).optional(),
        category: z.string().max(100).optional(),
        color: z.string().max(50).optional(),
        imageUrl: z.string().max(500).optional(),
        createdAt: z.string().max(100).optional(),
        updatedAt: z.string().max(100).optional(),
      });

      const BackupSettingsSchema = z.object({
        currency: z.string().max(20).optional(),
        appearance: z.enum(["system", "light", "dark"]).optional(),
        defaultPayment: z.string().max(100).optional(),
        notificationsEnabled: z.boolean().optional(),
        profileName: z.string().max(100).optional(),
        profileImage: z.string().nullable().optional(),
      });

      const BackupPaymentMethodSchema = z.object({
        id: z.string().min(1).max(100),
        name: z.string().min(1).max(100),
        isDefault: z.boolean(),
      });

      const BackupRecurringPaymentSchema = z.object({
        id: z.string().min(1).max(100),
        name: z.string().min(1).max(100),
        amount: z.number().finite().positive(),
        currency: z.string().max(20),
        category: z.string().max(100),
        categoryId: z.string().max(100).optional(),
        accountId: z.string().max(100).optional(),
        frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]),
        startDate: z.string().max(100),
        nextDueDate: z.string().max(100),
        endDate: z.string().max(100).optional(),
        status: z.enum(["ACTIVE", "PAUSED", "COMPLETED"]),
        notes: z.string().max(500).optional(),
        autoLog: z.boolean().optional(),
        createdAt: z.string().max(100).optional(),
        updatedAt: z.string().max(100).optional(),
      });

      const BackupQuickAddSettingsSchema = z.object({
        volumeDownTrigger: z.boolean().optional(),
        homeShortcutTrigger: z.boolean().optional(),
        quickSettingsTrigger: z.boolean().optional(),
        lockScreenTrigger: z.boolean().optional(),
        upiDetectionTrigger: z.boolean().optional(),
        defaultAccountId: z.string().nullable().optional(),
        defaultCategoryId: z.string().nullable().optional(),
      });

      const BackupPayloadSchema = z.object({
        version: z.string().optional(),
        exportedAt: z.string().optional(),
        expenses: z.array(BackupExpenseSchema).max(50_000).optional(),
        categories: z.array(BackupCategorySchema).max(500).optional(),
        settings: BackupSettingsSchema.optional(),
        paymentMethods: z.array(BackupPaymentMethodSchema).max(100).optional(),
        accounts: z.array(BackupAccountSchema).max(500).optional(),
        transactions: z.array(BackupTransactionSchema).max(100_000).optional(),
        savingsGoals: z.array(BackupSavingsGoalSchema).max(500).optional(),
        recurringPayments: z.array(BackupRecurringPaymentSchema).max(500).optional(),
        quickAddSettings: BackupQuickAddSettingsSchema.optional(),
      });

      const validation = BackupPayloadSchema.safeParse(rawObj);
      if (!validation.success) {
        const firstIssue = validation.error.issues[0];
        const issuePath = firstIssue.path.join(".");
        const errorMsg = `Invalid backup structure at '${issuePath}': ${firstIssue.message}`;
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        throw new Error(errorMsg);
      }

      const data = validation.data;

      // Relational consistency: verify referenced account IDs
      const existingOrNewAccounts = data.accounts || accounts;
      const accountIds = new Set(existingOrNewAccounts.map((a) => a.id));
      const fallbackAccountId = existingOrNewAccounts[0]?.id;

      if (data.transactions) {
        for (const t of data.transactions) {
          if (t.accountId && !accountIds.has(t.accountId)) {
            t.accountId = fallbackAccountId;
          }
        }
      }

      // Atomic preparation: build complete key-value batch
      const storageBatch: [string, string][] = [];
      if (data.expenses) {
        storageBatch.push([KEYS.expenses, JSON.stringify(data.expenses)]);
      }
      if (data.categories) {
        storageBatch.push([KEYS.categories, JSON.stringify(data.categories)]);
      }
      if (data.settings) {
        const mergedSettings = { ...defaults, ...data.settings };
        storageBatch.push([KEYS.settings, JSON.stringify(mergedSettings)]);
      }
      if (data.paymentMethods) {
        storageBatch.push([
          KEYS.paymentMethods,
          JSON.stringify(data.paymentMethods),
        ]);
      }
      if (data.accounts) {
        const normalizedAccounts = data.accounts.map((a) => ({
          ...a,
          createdAt: a.createdAt || new Date().toISOString(),
          updatedAt: a.updatedAt || new Date().toISOString(),
        }));
        storageBatch.push([KEYS.accounts, JSON.stringify(normalizedAccounts)]);
      }
      if (data.transactions) {
        const normalizedTxns = data.transactions.map((t) => ({
          ...t,
          time: t.time || "12:00",
          createdAt: t.createdAt || new Date().toISOString(),
          updatedAt: t.updatedAt || new Date().toISOString(),
        }));
        storageBatch.push([KEYS.transactions, JSON.stringify(normalizedTxns)]);
      }
      if (data.savingsGoals) {
        const normalizedGoals = data.savingsGoals.map((g) => ({
          ...g,
          createdAt: g.createdAt || new Date().toISOString(),
          updatedAt: g.updatedAt || new Date().toISOString(),
        }));
        storageBatch.push([KEYS.savingsGoals, JSON.stringify(normalizedGoals)]);
      }
      if (data.recurringPayments) {
        const normalizedRecurring = data.recurringPayments.map((p) => ({
          ...p,
          createdAt: p.createdAt || new Date().toISOString(),
          updatedAt: p.updatedAt || new Date().toISOString(),
        }));
        storageBatch.push([
          KEYS.recurringPayments,
          JSON.stringify(normalizedRecurring),
        ]);
      }
      if (data.quickAddSettings) {
        const mergedQuickAdd: QuickAddSettings = {
          ...defaultQuickAddSettings,
          ...data.quickAddSettings,
          defaultAccountId:
            data.quickAddSettings.defaultAccountId ||
            defaultQuickAddSettings.defaultAccountId,
        };
        storageBatch.push([
          KEYS.quickAddSettings,
          JSON.stringify(mergedQuickAdd),
        ]);
      }

      try {
        // 1. Atomic write to disk FIRST
        await AsyncStorage.multiSet(storageBatch);

        // 2. Only upon successful storage write, commit to React state
        if (data.expenses) setExpenses(data.expenses);
        if (data.categories) setCategories(data.categories);
        if (data.settings) setSettings({ ...defaults, ...data.settings });
        if (data.paymentMethods) setPaymentMethods(data.paymentMethods);
        if (data.accounts) {
          setAccounts(
            data.accounts.map((a) => ({
              ...a,
              createdAt: a.createdAt || new Date().toISOString(),
              updatedAt: a.updatedAt || new Date().toISOString(),
            })),
          );
        }
        if (data.transactions) {
          setTransactions(
            data.transactions.map((t) => ({
              ...t,
              time: t.time || "12:00",
              createdAt: t.createdAt || new Date().toISOString(),
              updatedAt: t.updatedAt || new Date().toISOString(),
            })),
          );
        }
        if (data.savingsGoals) {
          setSavingsGoals(
            data.savingsGoals.map((g) => ({
              ...g,
              createdAt: g.createdAt || new Date().toISOString(),
              updatedAt: g.updatedAt || new Date().toISOString(),
            })),
          );
        }
        if (data.recurringPayments) {
          setRecurringPayments(
            data.recurringPayments.map((p) => ({
              ...p,
              createdAt: p.createdAt || new Date().toISOString(),
              updatedAt: p.updatedAt || new Date().toISOString(),
            })),
          );
        }
        if (data.quickAddSettings) {
          setQuickAddSettings({
            ...defaultQuickAddSettings,
            ...data.quickAddSettings,
            defaultAccountId:
              data.quickAddSettings.defaultAccountId ||
              defaultQuickAddSettings.defaultAccountId,
          });
        }

        logAnalyticsOperational(
          "backup restore completed",
          {
            restored_section_count: storageBatch.length,
            has_transactions: Boolean(data.transactions),
          },
          hasAnalyticsConsent,
        );
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
      } catch (err: any) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        throw new Error(
          `Failed to restore data: ${err?.message || "Storage write error"}`,
        );
      }
    },
    [accounts, hasAnalyticsConsent],
  );

  const updateQuickAddSettings = useCallback(
    async (patch: Partial<QuickAddSettings>) => {
      setQuickAddSettings((current) => {
        const next = { ...current, ...patch };
        void AsyncStorage.setItem(KEYS.quickAddSettings, JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  const addSavingsGoal = useCallback(
    async (
      name: string,
      targetAmount: number,
      currentAmount: number = 0,
      targetDate?: string,
      category?: string,
      color?: string,
      imageUrl?: string,
    ) => {
      const newGoal: SavingsGoal = {
        id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        name,
        targetAmount,
        currentAmount,
        targetDate,
        category: category || "Savings",
        color: color || "#2868E8",
        imageUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updated = [newGoal, ...savingsGoals];
      setSavingsGoals(updated);
      await AsyncStorage.setItem(KEYS.savingsGoals, JSON.stringify(updated));
      captureAnalyticsEvent(
        "savings_goal_created",
        {
          has_initial_funding: currentAmount > 0,
          has_target_date: Boolean(targetDate),
        },
        hasAnalyticsConsent,
      );
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return newGoal;
    },
    [savingsGoals, hasAnalyticsConsent],
  );

  const updateSavingsGoal = useCallback(
    async (updatedGoal: SavingsGoal) => {
      const updated = savingsGoals.map((g) =>
        g.id === updatedGoal.id
          ? { ...updatedGoal, updatedAt: new Date().toISOString() }
          : g,
      );
      setSavingsGoals(updated);
      await AsyncStorage.setItem(KEYS.savingsGoals, JSON.stringify(updated));
      void Haptics.selectionAsync();
    },
    [savingsGoals],
  );

  const deleteSavingsGoal = useCallback(
    async (id: string) => {
      const updated = savingsGoals.filter((g) => g.id !== id);
      setSavingsGoals(updated);
      await AsyncStorage.setItem(KEYS.savingsGoals, JSON.stringify(updated));
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    },
    [savingsGoals],
  );

  const addFundsToGoal = useCallback(
    async (id: string, amount: number, accountId?: string) => {
      const goal = savingsGoals.find((g) => g.id === id);
      if (!goal) return;
      const updated = savingsGoals.map((g) =>
        g.id === id
          ? {
              ...g,
              currentAmount: Math.max(0, g.currentAmount + amount),
              updatedAt: new Date().toISOString(),
            }
          : g,
      );
      setSavingsGoals(updated);
      await AsyncStorage.setItem(KEYS.savingsGoals, JSON.stringify(updated));

      const targetAccountId =
        accountId ||
        accounts.find((a) => a.isDefault)?.id ||
        accounts[0]?.id;

      if (targetAccountId) {
        const now = new Date();
        const dateStr = getLocalDateString(now);
        const timeStr = getLocalTimeString(now);
        await addTransaction({
          amount,
          type: "EXPENSE",
          category: "Goals",
          description: goal.name,
          accountId: targetAccountId,
          date: dateStr,
          time: timeStr,
        });
      }

      captureAnalyticsEvent(
        "savings_goal_funded",
        {
          has_source_account: Boolean(targetAccountId),
        },
        hasAnalyticsConsent,
      );
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    [savingsGoals, accounts, addTransaction, hasAnalyticsConsent],
  );

  const addRecurringPayment = useCallback(
    async (
      payment: Omit<RecurringPayment, "id" | "createdAt" | "updatedAt">,
    ) => {
      const now = new Date().toISOString();
      const newPayment: RecurringPayment = {
        ...payment,
        id:
          "rec-" +
          Date.now().toString() +
          "-" +
          Math.random().toString(36).slice(2, 6),
        amount: Math.abs(Number(payment.amount)) || 0,
        status: payment.status || "ACTIVE",
        createdAt: now,
        updatedAt: now,
      };

      setRecurringPayments((prev) => {
        const next = [newPayment, ...prev];
        void AsyncStorage.setItem(KEYS.recurringPayments, JSON.stringify(next));
        return next;
      });

      captureAnalyticsEvent(
        "recurring_payment_created",
        {
          frequency: newPayment.frequency,
          auto_log_enabled: Boolean(newPayment.autoLog),
        },
        hasAnalyticsConsent,
      );
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return newPayment;
    },
    [hasAnalyticsConsent],
  );

  const updateRecurringPayment = useCallback(
    async (
      id: string,
      updates: Partial<Omit<RecurringPayment, "id" | "createdAt">>,
    ) => {
      setRecurringPayments((prev) => {
        const next = prev.map((p) => {
          if (p.id !== id) return p;
          return {
            ...p,
            ...updates,
            updatedAt: new Date().toISOString(),
          };
        });
        void AsyncStorage.setItem(KEYS.recurringPayments, JSON.stringify(next));
        return next;
      });
      void Haptics.selectionAsync();
    },
    [],
  );

  const deleteRecurringPayment = useCallback(
    async (id: string) => {
      setRecurringPayments((prev) => {
        const next = prev.filter((p) => p.id !== id);
        void AsyncStorage.setItem(KEYS.recurringPayments, JSON.stringify(next));
        return next;
      });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    },
    [],
  );

  const toggleRecurringPaymentStatus = useCallback(
    async (id: string) => {
      setRecurringPayments((prev) => {
        const next = prev.map((p) => {
          if (p.id !== id) return p;
          const nextStatus: RecurringPaymentStatus =
            p.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
          return {
            ...p,
            status: nextStatus,
            updatedAt: new Date().toISOString(),
          };
        });
        void AsyncStorage.setItem(KEYS.recurringPayments, JSON.stringify(next));
        return next;
      });
      void Haptics.selectionAsync();
    },
    [],
  );

  const recordRecurringPayment = useCallback(
    async (id: string, accountId?: string) => {
      const target = recurringPayments.find((p) => p.id === id);
      if (!target) return;

      const targetAccountId =
        accountId ||
        target.accountId ||
        accounts.find((a) => a.isDefault)?.id ||
        accounts[0]?.id;

      const now = new Date();
      const dateStr = getLocalDateString(now);
      const timeStr = getLocalTimeString(now);

      // Record transaction into expense ledger
      await addTransaction({
        type: "EXPENSE",
        amount: target.amount,
        description: target.name,
        category: target.category,
        categoryId: target.categoryId,
        accountId: targetAccountId,
        date: dateStr,
        time: timeStr,
        notes: target.notes
          ? `${target.notes} (Recurring: ${target.frequency})`
          : `Recurring payment (${target.frequency})`,
      });

      // Advance schedule to next period
      const nextDue = computeNextDueDate(
        target.nextDueDate,
        target.frequency,
        now,
        true,
      );

      setRecurringPayments((prev) => {
        const next = prev.map((p) => {
          if (p.id !== id) return p;
          return {
            ...p,
            nextDueDate: nextDue,
            updatedAt: new Date().toISOString(),
          };
        });
        void AsyncStorage.setItem(KEYS.recurringPayments, JSON.stringify(next));
        return next;
      });

      // User notification
      const sym = currencySymbol(settings.currency || "INR");
      const notif: NotificationItem = {
        id: "notif-rec-" + Date.now(),
        title: "Recurring payment recorded",
        message: `Recorded ${sym}${target.amount.toLocaleString()} for ${target.name}. Next due on ${nextDue}.`,
        time: new Date().toISOString(),
        read: false,
        type: "success",
        route: "/spending",
      };
      setNotifications((prev) => {
        const updated = [notif, ...prev];
        void AsyncStorage.setItem(KEYS.notifications, JSON.stringify(updated));
        return updated;
      });

      captureAnalyticsEvent(
        "recurring_payment_recorded",
        {
          frequency: target.frequency,
          has_source_account: Boolean(targetAccountId),
        },
        hasAnalyticsConsent,
      );
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    [recurringPayments, accounts, addTransaction, settings.currency, hasAnalyticsConsent],
  );

  const unreadNotificationsCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const markNotificationRead = useCallback(async (id: string) => {
    setNotifications((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      void AsyncStorage.setItem(KEYS.notifications, JSON.stringify(next));
      return next;
    });
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, read: true }));
      void AsyncStorage.setItem(KEYS.notifications, JSON.stringify(next));
      return next;
    });
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    setNotifications((prev) => {
      const next = prev.filter((n) => n.id !== id);
      void AsyncStorage.setItem(KEYS.notifications, JSON.stringify(next));
      return next;
    });
  }, []);

  const logPrivacyEvent = useCallback(
    async (
      action: PrivacyAction,
      details?: Record<string, string | number | boolean>,
    ) => {
      const event: PrivacyAuditEvent = {
        id:
          "audit-" +
          Date.now() +
          "-" +
          Math.random().toString(36).substring(2, 7),
        action,
        timestamp: new Date().toISOString(),
        details,
      };
      setPrivacyAuditEvents((prev) => {
        const next = [event, ...prev.slice(0, 99)];
        void AsyncStorage.setItem(
          KEYS.privacyAuditEvents,
          JSON.stringify(next),
        );
        return next;
      });
    },
    [],
  );

  const updateConsent = useCallback(
    async (purpose: string, granted: boolean) => {
      const existing = consents[purpose] || {
        purpose,
        title: purpose,
        description: "",
        category: "optional",
        status: "withdrawn",
        policyVersion: CURRENT_POLICY_VERSION.version,
        source: "user_consent_manager",
      };

      const updatedRecord: ConsentRecord = {
        ...existing,
        status: granted ? "granted" : "withdrawn",
        grantedAt: granted ? new Date().toISOString() : existing.grantedAt,
        withdrawnAt: !granted ? new Date().toISOString() : undefined,
        policyVersion: CURRENT_POLICY_VERSION.version,
        source: "user_consent_manager",
      };

      const nextConsents = {
        ...consents,
        [purpose]: updatedRecord,
      };

      setConsents(nextConsents);
      await AsyncStorage.setItem(
        KEYS.privacyConsents,
        JSON.stringify(nextConsents),
      );

      await logPrivacyEvent(granted ? "consent_granted" : "consent_withdrawn", {
        purpose,
        status: granted ? "granted" : "withdrawn",
      });

      if (purpose === "local_notifications" && !granted) {
        await updateSettings({ notificationsEnabled: false });
      }
      if (purpose === "quick_add_triggers" && !granted) {
        await updateQuickAddSettings({
          volumeDownTrigger: false,
          homeShortcutTrigger: false,
          quickSettingsTrigger: false,
          lockScreenTrigger: false,
        });
      }
      if (purpose === "product_analytics") {
        if (granted) {
          await optInPostHog();
          if (authState?.userId) {
            identifyPostHog(authState.userId);
          }
        } else {
          await optOutPostHog();
          resetPostHog();
        }
      }

      void Haptics.selectionAsync();
    },
    [consents, logPrivacyEvent, updateSettings, updateQuickAddSettings, authState],
  );

  const submitPrivacyRequest = useCallback(
    async (
      type: PrivacyRequestType,
      subject: string,
      description: string,
    ): Promise<PrivacyRequest> => {
      const newReq: PrivacyRequest = {
        id:
          "req-" +
          Date.now().toString(36) +
          "-" +
          Math.random().toString(36).substring(2, 6),
        type,
        subject: subject.trim(),
        description: description.trim(),
        status: "submitted",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const next = [newReq, ...privacyRequests];
      setPrivacyRequests(next);
      await AsyncStorage.setItem(KEYS.privacyRequests, JSON.stringify(next));

      await logPrivacyEvent("privacy_request_created", {
        requestId: newReq.id,
        type: newReq.type,
      });

      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return newReq;
    },
    [privacyRequests, logPrivacyEvent],
  );

  const saveNominee = useCallback(
    async (updatedNominee: NomineeRecord | null) => {
      setNominee(updatedNominee);
      if (updatedNominee) {
        await AsyncStorage.setItem(
          KEYS.nominee,
          JSON.stringify(updatedNominee),
        );
        await logPrivacyEvent("nominee_updated", {
          name: updatedNominee.name,
          relationship: updatedNominee.relationship,
        });
      } else {
        await AsyncStorage.removeItem(KEYS.nominee);
      }
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    [logPrivacyEvent],
  );

  const downloadPersonalDataArchive = useCallback(async (): Promise<string> => {
    await logPrivacyEvent("data_export_requested");
    const { Share } = await import("react-native");

    const payload = {
      profile: {
        profileName: settings.profileName,
        profileImageConfigured: !!settings.profileImage,
      },
      accounts,
      transactions,
      categories,
      savingsGoals,
      paymentMethods,
      settings: {
        currency: settings.currency,
        appearance: settings.appearance,
        notificationsEnabled: settings.notificationsEnabled,
        defaultPayment: settings.defaultPayment,
      },
      quickAddSettings,
      consents: Object.values(consents),
      privacyRequests,
      nominee,
      merchantRules,
      exportMetadata: {
        exportedAt: new Date().toISOString(),
        formatVersion: "1.0",
        application: "Zeno",
        policyVersion: CURRENT_POLICY_VERSION.version,
        notice:
          "This personal data archive was generated under your DPDP Privacy & Data Protection controls. Zeno operates completely on-device without external tracking servers. No passwords, tokens, or credentials are included in this export.",
      },
    };

    const jsonString = JSON.stringify(payload, null, 2);

    await logPrivacyEvent("data_export_completed", {
      recordCount: transactions.length + accounts.length,
    });

    await Share.share({
      title: "Zeno Personal Data Archive",
      message: jsonString,
    });

    captureAnalyticsEvent(
      "data_exported",
      { export_format: "personal_archive" },
      hasAnalyticsConsent,
    );

    return jsonString;
  }, [
    settings,
    accounts,
    transactions,
    categories,
    savingsGoals,
    paymentMethods,
    quickAddSettings,
    consents,
    privacyRequests,
    nominee,
    merchantRules,
    logPrivacyEvent,
    hasAnalyticsConsent,
  ]);

  const purgeAllUserData = useCallback(async () => {
    await optOutPostHog();
    resetPostHog();
    await logPrivacyEvent("deletion_requested");

    await AsyncStorage.multiRemove([
      KEYS.expenses,
      KEYS.categories,
      KEYS.settings,
      KEYS.paymentMethods,
      KEYS.accounts,
      KEYS.transactions,
      KEYS.savingsGoals,
      KEYS.quickAddSettings,
      KEYS.notifications,
      KEYS.privacyConsents,
      KEYS.privacyRequests,
      KEYS.nominee,
      KEYS.privacyAuditEvents,
      KEYS.policyVersion,
      KEYS.migrationVersion,
      KEYS.authState,
      KEYS.onboardingState,
      KEYS.merchantRules,
    ]);

    setExpenses([]);
    setCategories(DEFAULT_CATEGORIES);
    setSettings(defaults);
    setPaymentMethods(DEFAULT_PAYMENT_METHODS);
    setAccounts([]);
    setTransactions([]);
    setSavingsGoals([]);
    setQuickAddSettings(defaultQuickAddSettings);
    setNotifications([]);
    setConsents(DEFAULT_CONSENTS);
    setPrivacyRequests([]);
    setNominee(null);
    setAuthState(null);
    setOnboardingState(DEFAULT_ONBOARDING_STATE);
    setMerchantRules([]);

    const postDeleteAudit: PrivacyAuditEvent = {
      id: "audit-post-delete-" + Date.now(),
      action: "deletion_completed",
      timestamp: new Date().toISOString(),
      details: { status: "purged_all_personal_data" },
    };
    setPrivacyAuditEvents([postDeleteAudit]);
    await AsyncStorage.setItem(
      KEYS.privacyAuditEvents,
      JSON.stringify([postDeleteAudit]),
    );

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, [logPrivacyEvent]);

  const signInWithGoogle = useCallback(
    async (profile: GoogleUserProfile) => {
      const newAuth: LocalAuthState = {
        isAuthenticated: true,
        provider: "google",
        userId: profile.id,
        displayName: profile.name,
        email: profile.email,
        avatarUrl: profile.picture || null,
        lastLoginAt: new Date().toISOString(),
      };
      setAuthState(newAuth);
      await AsyncStorage.setItem(KEYS.authState, JSON.stringify(newAuth));

      // Associate session using stable non-PII provider subject only if analytics consent was granted.
      // Do NOT send email or displayName in person properties.
      if (hasAnalyticsConsent && profile.id) {
        identifyPostHog(profile.id);
      }

      // Mirror display name and picture into user settings with durable local persistence
      let durableAvatar = profile.picture || null;
      if (profile.picture) {
        try {
          durableAvatar = await saveProfileImage(profile.picture);
        } catch {
          durableAvatar = profile.picture;
        }
      }

      await updateSettings({
        profileName: profile.name,
        profileImage: durableAvatar,
      });

      await logPrivacyEvent("consent_granted", {
        purpose: "google_profile_sync",
        email: profile.email,
      });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    [updateSettings, logPrivacyEvent],
  );

  const signOut = useCallback(async () => {
    resetPostHog();
    setAuthState(null);
    await AsyncStorage.removeItem(KEYS.authState);
    await logPrivacyEvent("consent_withdrawn", {
      purpose: "user_sign_out",
    });
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [logPrivacyEvent]);

  const completeOnboarding = useCallback(
    async (setup?: {
      currency?: Currency;
      defaultAccountType?: AccountType;
    }) => {
      const newOnboarding: OnboardingState = {
        completed: true,
        version: CURRENT_ONBOARDING_VERSION,
        completedAt: new Date().toISOString(),
      };
      setOnboardingState(newOnboarding);
      await AsyncStorage.setItem(
        KEYS.onboardingState,
        JSON.stringify(newOnboarding),
      );

      if (setup?.currency) {
        await updateSettings({ currency: setup.currency });
      }

      if (setup?.defaultAccountType) {
        if (accounts.length === 0) {
          const type = setup.defaultAccountType;
          const accountName =
            type === "CASH"
              ? "Cash Wallet"
              : type === "BANK"
                ? "Bank Account"
                : type === "CARD"
                  ? "Card Account"
                  : type === "UPI"
                  ? "UPI Wallet"
                  : "Primary Account";
          await addAccount({
            name: accountName,
            type,
            currency: setup.currency || settings.currency || "INR",
            openingBalance: 0,
            isDefault: true,
            isActive: true,
          });
        }
      }

      await logPrivacyEvent("consent_granted", {
        purpose: "onboarding_completed",
      });
      captureAnalyticsEvent(
        "onboarding_completed",
        {
          has_currency_selection: Boolean(setup?.currency),
          has_default_account: Boolean(setup?.defaultAccountType),
        },
        hasAnalyticsConsent,
      );
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    [
      accounts.length,
      settings.currency,
      updateSettings,
      addAccount,
      logPrivacyEvent,
      hasAnalyticsConsent,
    ],
  );

  const resetOnboarding = useCallback(async () => {
    const freshOnboarding: OnboardingState = {
      completed: false,
      version: CURRENT_ONBOARDING_VERSION,
    };
    setOnboardingState(freshOnboarding);
    await AsyncStorage.removeItem(KEYS.onboardingState);
  }, []);

  const value = useMemo(
    () => ({
      expenses,
      categories,
      settings,
      paymentMethods,
      accounts,
      transactions,
      savingsGoals,
      notifications,
      unreadNotificationsCount,
      loading,
      markNotificationRead,
      markAllNotificationsRead,
      deleteNotification,
      quickAddSettings,
      updateQuickAddSettings,
      addExpense,
      deleteExpense,
      updateExpense,
      addCategory,
      updateCategory,
      deleteCategory,
      updateSettings,
      exportData,
      importData,
      addPaymentMethod,
      updatePaymentMethod,
      deletePaymentMethod,
      addAccount,
      updateAccount,
      syncAccountCardLast4,
      deleteAccount,
      setDefaultAccount,
      addTransaction,
      addTransactionsBatch,
      deleteTransaction,
      deleteAllTransactions,
      updateTransaction,
      merchantRules,
      saveMerchantRule,
      getMerchantRule,
      toggleMerchantRule,
      updateMerchantRuleCategory,
      deleteMerchantRule,
      bulkCategorizeTransactions,
      countEligibleTransactions,
      addSavingsGoal,
      updateSavingsGoal,
      deleteSavingsGoal,
      addFundsToGoal,
      recurringPayments,
      addRecurringPayment,
      updateRecurringPayment,
      deleteRecurringPayment,
      toggleRecurringPaymentStatus,
      recordRecurringPayment,
      getAccountBalance,
      getTotalBalance,
      migrateIfNeeded,
      consents,
      privacyRequests,
      nominee,
      privacyAuditEvents,
      policyVersion,
      updateConsent,
      submitPrivacyRequest,
      saveNominee,
      downloadPersonalDataArchive,
      purgeAllUserData,
      logPrivacyEvent,
      authState,
      onboardingState,
      signInWithGoogle,
      signOut,
      completeOnboarding,
      resetOnboarding,
      voiceLoggingVisible,
      setVoiceLoggingVisible,
      celebrationExpense,
      celebrateExpense,
      dismissCelebration,
      merchantMemoryPrompt,
      queueMerchantMemory,
      dismissMerchantMemory,
    }),
    [
      expenses,
      categories,
      settings,
      paymentMethods,
      accounts,
      transactions,
      savingsGoals,
      notifications,
      unreadNotificationsCount,
      loading,
      markNotificationRead,
      markAllNotificationsRead,
      deleteNotification,
      quickAddSettings,
      updateQuickAddSettings,
      addExpense,
      deleteExpense,
      updateExpense,
      addCategory,
      updateCategory,
      deleteCategory,
      updateSettings,
      exportData,
      importData,
      addPaymentMethod,
      updatePaymentMethod,
      deletePaymentMethod,
      addAccount,
      updateAccount,
      syncAccountCardLast4,
      deleteAccount,
      setDefaultAccount,
      addTransaction,
      addTransactionsBatch,
      deleteTransaction,
      deleteAllTransactions,
      updateTransaction,
      merchantRules,
      saveMerchantRule,
      getMerchantRule,
      toggleMerchantRule,
      updateMerchantRuleCategory,
      deleteMerchantRule,
      bulkCategorizeTransactions,
      countEligibleTransactions,
      addSavingsGoal,
      updateSavingsGoal,
      deleteSavingsGoal,
      addFundsToGoal,
      recurringPayments,
      addRecurringPayment,
      updateRecurringPayment,
      deleteRecurringPayment,
      toggleRecurringPaymentStatus,
      recordRecurringPayment,
      getAccountBalance,
      getTotalBalance,
      migrateIfNeeded,
      consents,
      privacyRequests,
      nominee,
      privacyAuditEvents,
      policyVersion,
      updateConsent,
      submitPrivacyRequest,
      saveNominee,
      downloadPersonalDataArchive,
      purgeAllUserData,
      logPrivacyEvent,
      authState,
      onboardingState,
      signInWithGoogle,
      signOut,
      completeOnboarding,
      resetOnboarding,
      voiceLoggingVisible,
      setVoiceLoggingVisible,
      celebrationExpense,
      celebrateExpense,
      dismissCelebration,
      merchantMemoryPrompt,
      queueMerchantMemory,
      dismissMerchantMemory,
    ],
  );

  return (
    <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
  );
}

export function useFinance() {
  const value = useContext(FinanceContext);
  if (!value) throw new Error("useFinance must be used inside FinanceProvider");
  return value;
}

