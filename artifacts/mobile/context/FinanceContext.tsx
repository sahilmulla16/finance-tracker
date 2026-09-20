import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
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

export type CategoryType = "expense" | "income" | "both";

export type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  type?: CategoryType;
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
export type Currency = "INR" | "USD" | "EUR" | "GBP" | "AED";
export type PaymentMethod = { id: string; name: string; isDefault: boolean };
export type UserSettings = {
  currency: Currency;
  appearance: Appearance;
  defaultPayment: string;
  notificationsEnabled: boolean;
  profileName: string;
  profileImage: string | null;
};

export type AccountType = "CASH" | "BANK" | "UPI" | "SAVINGS" | "OTHER";

export type Account = {
  id: string;
  name: string;
  type: AccountType;
  currency: Currency;
  openingBalance: number;
  isDefault: boolean;
  isActive: boolean;
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
};

export type SavingsGoal = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  category?: string;
  color?: string;
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
  addCategory: (name: string, icon: string, color: string) => Promise<void>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<boolean>;
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
  deleteAccount: (
    id: string,
    replacementAccountId?: string,
  ) => Promise<boolean>;
  setDefaultAccount: (id: string) => Promise<void>;
  addTransaction: (
    transaction: Omit<Transaction, "id" | "createdAt" | "updatedAt">,
  ) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  updateTransaction: (transaction: Transaction) => Promise<void>;
  addSavingsGoal: (
    name: string,
    targetAmount: number,
    currentAmount?: number,
    targetDate?: string,
    category?: string,
    color?: string,
  ) => Promise<SavingsGoal>;
  updateSavingsGoal: (goal: SavingsGoal) => Promise<void>;
  deleteSavingsGoal: (id: string) => Promise<void>;
  addFundsToGoal: (id: string, amount: number) => Promise<void>;
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
};

export type QuickAddSettings = {
  volumeDownTrigger: boolean;
  homeShortcutTrigger: boolean;
  quickSettingsTrigger: boolean;
  lockScreenTrigger: boolean;
  defaultAccountId: string;
  defaultCategoryId: string | null;
};

export const DEFAULT_CATEGORIES: Category[] = [
  // Expense categories
  {
    id: "food",
    name: "Food & Drinks",
    icon: "coffee",
    color: "#FF8C69",
    type: "expense",
    isDefault: true,
  },
  {
    id: "groceries",
    name: "Groceries",
    icon: "shopping-cart",
    color: "#F2A65A",
    type: "expense",
    isDefault: true,
  },
  {
    id: "transport",
    name: "Transport",
    icon: "navigation",
    color: "#5B8DEF",
    type: "expense",
    isDefault: true,
  },
  {
    id: "shopping",
    name: "Shopping",
    icon: "shopping-bag",
    color: "#9B7BEB",
    type: "expense",
    isDefault: true,
  },
  {
    id: "bills",
    name: "Bills & Utilities",
    icon: "file-text",
    color: "#48B49B",
    type: "expense",
    isDefault: true,
  },
  {
    id: "health",
    name: "Health",
    icon: "heart",
    color: "#EC6A8E",
    type: "expense",
    isDefault: true,
  },
  {
    id: "entertainment",
    name: "Entertainment",
    icon: "music",
    color: "#E6B85C",
    type: "expense",
    isDefault: true,
  },
  {
    id: "education",
    name: "Education",
    icon: "book-open",
    color: "#2E90FA",
    type: "expense",
    isDefault: true,
  },
  {
    id: "travel",
    name: "Travel",
    icon: "map",
    color: "#7A5AF8",
    type: "expense",
    isDefault: true,
  },
  {
    id: "other",
    name: "Other",
    icon: "more-horizontal",
    color: "#8E9AAF",
    type: "both",
    isDefault: true,
  },
  // Income categories
  {
    id: "salary",
    name: "Salary",
    icon: "briefcase",
    color: "#4CAF50",
    type: "income",
    isDefault: true,
  },
  {
    id: "freelance",
    name: "Freelance",
    icon: "layers",
    color: "#2196F3",
    type: "income",
    isDefault: true,
  },
  {
    id: "investment",
    name: "Investment",
    icon: "trending-up",
    color: "#FF9800",
    type: "income",
    isDefault: true,
  },
  {
    id: "other-income",
    name: "Other Income",
    icon: "dollar-sign",
    color: "#8BC34A",
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
  profileName: "Sahil Mulla",
  profileImage: null,
};

export const defaultQuickAddSettings: QuickAddSettings = {
  volumeDownTrigger: true,
  homeShortcutTrigger: true,
  quickSettingsTrigger: true,
  lockScreenTrigger: true,
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
};

const CURRENT_MIGRATION_VERSION = 3;

const FinanceContext = createContext<FinanceContextValue | null>(null);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
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
  const [quickAddSettings, setQuickAddSettings] = useState<QuickAddSettings>(
    defaultQuickAddSettings,
  );
  const [notifications, setNotifications] = useState<NotificationItem[]>(
    DEFAULT_NOTIFICATIONS,
  );
  const [consents, setConsents] =
    useState<Record<string, ConsentRecord>>(DEFAULT_CONSENTS);
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

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
      ]);

      const currentMigrationVersion = migrationVersion
        ? parseInt(migrationVersion, 10)
        : 0;

      setExpenses(
        storedExpenses ? (JSON.parse(storedExpenses) as Expense[]) : seed,
      );
      setCategories(
        storedCategories
          ? (JSON.parse(storedCategories) as Category[])
          : DEFAULT_CATEGORIES,
      );
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
      setAccounts(
        storedAccounts ? (JSON.parse(storedAccounts) as Account[]) : [],
      );
      setTransactions(
        storedTransactions
          ? (JSON.parse(storedTransactions) as Transaction[])
          : [],
      );
      setSavingsGoals(
        storedSavingsGoals
          ? (JSON.parse(storedSavingsGoals) as SavingsGoal[])
          : DEFAULT_SAVINGS_GOALS,
      );
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
          setConsents({ ...DEFAULT_CONSENTS, ...parsed });
        } catch {
          setConsents(DEFAULT_CONSENTS);
        }
      } else {
        setConsents(DEFAULT_CONSENTS);
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
      const expense: Expense = {
        id: Date.now().toString() + Math.random().toString(36).slice(2, 8),
        amount,
        description: description.trim() || category.name,
        category: category.name,
        icon: category.icon,
        color: category.color,
        date: new Date().toISOString(),
        payment,
      };
      setExpenses((current) => {
        const next = [expense, ...current];
        void AsyncStorage.setItem(KEYS.expenses, JSON.stringify(next));
        return next;
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    [settings.defaultPayment],
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
    async (name: string, icon: string, color: string) => {
      const category: Category = {
        id: "custom-" + Date.now().toString(),
        name: name.trim(),
        icon,
        color,
        isDefault: false,
      };
      const next = [...categories, category];
      setCategories(next);
      await AsyncStorage.setItem(KEYS.categories, JSON.stringify(next));
    },
    [categories],
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
    async (id: string) => {
      const target = categories.find((item) => item.id === id);
      if (
        !target ||
        target.isDefault ||
        expenses.some((item) => item.category === target.name)
      )
        return false;
      const next = categories.filter((item) => item.id !== id);
      setCategories(next);
      await AsyncStorage.setItem(KEYS.categories, JSON.stringify(next));
      return true;
    },
    [categories, expenses],
  );

  const updateSettings = useCallback(
    async (patch: Partial<UserSettings>) => {
      const next = { ...settings, ...patch };
      setSettings(next);
      await AsyncStorage.setItem(KEYS.settings, JSON.stringify(next));
    },
    [settings],
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
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    [accounts],
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

  const setDefaultAccount = useCallback(
    async (id: string) => {
      const next = accounts.map((a) => ({
        ...a,
        isDefault: a.id === id,
        updatedAt: a.id === id ? new Date().toISOString() : a.updatedAt,
      }));
      setAccounts(next);
      await AsyncStorage.setItem(KEYS.accounts, JSON.stringify(next));
    },
    [accounts],
  );

  const deleteAccount = useCallback(
    async (id: string, replacementAccountId?: string) => {
      const target = accounts.find((a) => a.id === id);
      if (!target) return false;

      const hasTransactions = transactions.some(
        (t) =>
          t.accountId === id || t.fromAccountId === id || t.toAccountId === id,
      );

      if (hasTransactions && !replacementAccountId) {
        return false;
      }

      if (hasTransactions && replacementAccountId) {
        const replacement = accounts.find((a) => a.id === replacementAccountId);
        if (!replacement) return false;

        setTransactions((prev) =>
          prev.map((t) => {
            if (t.accountId === id)
              return {
                ...t,
                accountId: replacementAccountId,
                updatedAt: new Date().toISOString(),
              };
            if (t.fromAccountId === id)
              return {
                ...t,
                fromAccountId: replacementAccountId,
                updatedAt: new Date().toISOString(),
              };
            if (t.toAccountId === id)
              return {
                ...t,
                toAccountId: replacementAccountId,
                updatedAt: new Date().toISOString(),
              };
            return t;
          }),
        );
      }

      const next = accounts.filter((a) => a.id !== id);
      const wasDefault = target.isDefault;
      setAccounts(next);
      await AsyncStorage.setItem(KEYS.accounts, JSON.stringify(next));

      if (wasDefault && next.length > 0) {
        const newDefault = next[0];
        await setDefaultAccount(newDefault.id);
      }

      return true;
    },
    [accounts, transactions, setDefaultAccount],
  );

  const addTransaction = useCallback(
    async (
      transactionData: Omit<Transaction, "id" | "createdAt" | "updatedAt">,
    ) => {
      const now = new Date().toISOString();
      const transaction: Transaction = {
        ...transactionData,
        amount: Math.abs(Number(transactionData.amount)) || 0,
        type: (
          transactionData.type || "EXPENSE"
        ).toUpperCase() as TransactionType,
        id:
          "txn-" +
          Date.now().toString() +
          Math.random().toString(36).slice(2, 8),
        createdAt: now,
        updatedAt: now,
      };
      setTransactions((prev) => {
        const next = [transaction, ...prev];
        void AsyncStorage.setItem(KEYS.transactions, JSON.stringify(next));
        return next;
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    [],
  );

  const deleteTransaction = useCallback(async (id: string) => {
    setTransactions((prev) => {
      const next = prev.filter((t) => t.id !== id);
      void AsyncStorage.setItem(KEYS.transactions, JSON.stringify(next));
      return next;
    });
  }, []);

  const updateTransaction = useCallback(async (transaction: Transaction) => {
    setTransactions((prev) => {
      const next = prev.map((t) =>
        t.id === transaction.id
          ? { ...transaction, updatedAt: new Date().toISOString() }
          : t,
      );
      void AsyncStorage.setItem(KEYS.transactions, JSON.stringify(next));
      return next;
    });
  }, []);

  const getAccountBalance = useCallback(
    (accountId: string) => {
      const account = accounts.find((a) => a.id === accountId);
      if (!account) return 0;

      let balance = Number(account.openingBalance) || 0;

      for (const txn of transactions) {
        const amount = Number(txn.amount) || 0;
        if (amount === 0) continue;
        const type = (txn.type || "").toUpperCase();

        if (type === "INCOME" && txn.accountId === accountId) {
          balance += amount;
        } else if (type === "EXPENSE" && txn.accountId === accountId) {
          balance -= amount;
        } else if (type === "TRANSFER") {
          if (txn.toAccountId === accountId) {
            balance += amount;
          }
          if (txn.fromAccountId === accountId) {
            balance -= amount;
          }
        }
      }

      return balance;
    },
    [accounts, transactions],
  );

  const getTotalBalance = useCallback(() => {
    return accounts.reduce(
      (sum, account) => sum + getAccountBalance(account.id),
      0,
    );
  }, [accounts, getAccountBalance]);

  const exportData = useCallback(
    async (format: "json" | "csv") => {
      const { Share } = await import("react-native");
      const content =
        format === "json"
          ? JSON.stringify(
              {
                expenses,
                categories,
                settings,
                paymentMethods,
                accounts,
                transactions,
              },
              null,
              2,
            )
          : [
              "Date,Description,Amount,Category,Payment Method",
              ...expenses.map((item) =>
                [
                  new Date(item.date).toISOString().slice(0, 10),
                  item.description.replace(/,/g, " "),
                  item.amount,
                  item.category,
                  item.payment,
                ].join(","),
              ),
            ].join("\n");
      await Share.share({
        title: "Pocketflow " + format.toUpperCase() + " backup",
        message: content,
      });
    },
    [expenses, categories, settings, paymentMethods, accounts, transactions],
  );

  const importData = useCallback(async (json: string) => {
    try {
      const data = JSON.parse(json);
      if (data.expenses) {
        setExpenses(data.expenses);
        await AsyncStorage.setItem(
          KEYS.expenses,
          JSON.stringify(data.expenses),
        );
      }
      if (data.categories) {
        setCategories(data.categories);
        await AsyncStorage.setItem(
          KEYS.categories,
          JSON.stringify(data.categories),
        );
      }
      if (data.settings) {
        const next = { ...defaults, ...data.settings };
        setSettings(next);
        await AsyncStorage.setItem(KEYS.settings, JSON.stringify(next));
      }
      if (data.paymentMethods) {
        setPaymentMethods(data.paymentMethods);
        await AsyncStorage.setItem(
          KEYS.paymentMethods,
          JSON.stringify(data.paymentMethods),
        );
      }
      if (data.accounts) {
        setAccounts(data.accounts);
        await AsyncStorage.setItem(
          KEYS.accounts,
          JSON.stringify(data.accounts),
        );
      }
      if (data.transactions) {
        setTransactions(data.transactions);
        await AsyncStorage.setItem(
          KEYS.transactions,
          JSON.stringify(data.transactions),
        );
      }
      if (data.quickAddSettings) {
        const next = { ...defaultQuickAddSettings, ...data.quickAddSettings };
        setQuickAddSettings(next);
        await AsyncStorage.setItem(KEYS.quickAddSettings, JSON.stringify(next));
      }
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      throw new Error("Invalid backup file");
    }
  }, []);

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
    ) => {
      const newGoal: SavingsGoal = {
        id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        name,
        targetAmount,
        currentAmount,
        targetDate,
        category: category || "Savings",
        color: color || "#2868E8",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updated = [newGoal, ...savingsGoals];
      setSavingsGoals(updated);
      await AsyncStorage.setItem(KEYS.savingsGoals, JSON.stringify(updated));
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return newGoal;
    },
    [savingsGoals],
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
    async (id: string, amount: number) => {
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
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    [savingsGoals],
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

      void Haptics.selectionAsync();
    },
    [consents, logPrivacyEvent, updateSettings, updateQuickAddSettings],
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
      exportMetadata: {
        exportedAt: new Date().toISOString(),
        formatVersion: "1.0",
        application: "Pocketflow Finance",
        policyVersion: CURRENT_POLICY_VERSION.version,
        notice:
          "This personal data archive was generated under your DPDP Privacy & Data Protection controls. Pocketflow operates completely on-device without external tracking servers. No passwords, tokens, or credentials are included in this export.",
      },
    };

    const jsonString = JSON.stringify(payload, null, 2);

    await logPrivacyEvent("data_export_completed", {
      recordCount: transactions.length + accounts.length,
    });

    await Share.share({
      title: "Pocketflow Personal Data Archive",
      message: jsonString,
    });

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
    logPrivacyEvent,
  ]);

  const purgeAllUserData = useCallback(async () => {
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

      // Mirror display name and picture into user settings
      await updateSettings({
        profileName: profile.name,
        profileImage: profile.picture || null,
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
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    [
      accounts.length,
      settings.currency,
      updateSettings,
      addAccount,
      logPrivacyEvent,
    ],
  );

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
      deleteAccount,
      setDefaultAccount,
      addTransaction,
      deleteTransaction,
      updateTransaction,
      addSavingsGoal,
      updateSavingsGoal,
      deleteSavingsGoal,
      addFundsToGoal,
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
      deleteAccount,
      setDefaultAccount,
      addTransaction,
      deleteTransaction,
      updateTransaction,
      addSavingsGoal,
      updateSavingsGoal,
      deleteSavingsGoal,
      addFundsToGoal,
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
