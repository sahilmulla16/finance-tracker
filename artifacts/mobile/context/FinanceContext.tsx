import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

export type CategoryType = 'expense' | 'income' | 'both';

export type Category = { id: string; name: string; icon: string; color: string; type?: CategoryType; isDefault?: boolean };
export type Expense = { id: string; amount: number; description: string; category: string; icon: string; color: string; date: string; payment: string };
export type Appearance = 'system' | 'light' | 'dark';
export type Currency = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED';
export type PaymentMethod = { id: string; name: string; isDefault: boolean };
export type UserSettings = {
  currency: Currency;
  appearance: Appearance;
  defaultPayment: string;
  notificationsEnabled: boolean;
  profileName: string;
  profileImage: string | null;
};

export type AccountType = 'CASH' | 'BANK' | 'UPI' | 'SAVINGS' | 'OTHER';

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

export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

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

type FinanceContextValue = {
  expenses: Expense[];
  categories: Category[];
  settings: UserSettings;
  paymentMethods: PaymentMethod[];
  accounts: Account[];
  transactions: Transaction[];
  loading: boolean;
  addExpense: (amount: number, description: string, category: Category, payment?: string) => Promise<void>;
  deleteExpense: (id: string) => void;
  updateExpense: (expense: Expense) => void;
  addCategory: (name: string, icon: string, color: string) => Promise<void>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<boolean>;
  updateSettings: (patch: Partial<UserSettings>) => Promise<void>;
  exportData: (format: 'json' | 'csv') => Promise<void>;
  importData: (json: string) => Promise<void>;
  addPaymentMethod: (name: string) => Promise<void>;
  updatePaymentMethod: (method: PaymentMethod) => Promise<void>;
  deletePaymentMethod: (id: string) => Promise<void>;
  addAccount: (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateAccount: (account: Account) => Promise<void>;
  deleteAccount: (id: string, replacementAccountId?: string) => Promise<boolean>;
  setDefaultAccount: (id: string) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  updateTransaction: (transaction: Transaction) => Promise<void>;
  getAccountBalance: (accountId: string) => number;
  getTotalBalance: () => number;
  migrateIfNeeded: () => Promise<void>;
};

export const DEFAULT_CATEGORIES: Category[] = [
  // Expense categories
  { id: 'food', name: 'Food & Drinks', icon: 'coffee', color: '#FF8C69', type: 'expense', isDefault: true },
  { id: 'groceries', name: 'Groceries', icon: 'shopping-cart', color: '#F2A65A', type: 'expense', isDefault: true },
  { id: 'transport', name: 'Transport', icon: 'navigation', color: '#5B8DEF', type: 'expense', isDefault: true },
  { id: 'shopping', name: 'Shopping', icon: 'shopping-bag', color: '#9B7BEB', type: 'expense', isDefault: true },
  { id: 'bills', name: 'Bills & Utilities', icon: 'file-text', color: '#48B49B', type: 'expense', isDefault: true },
  { id: 'health', name: 'Health', icon: 'heart', color: '#EC6A8E', type: 'expense', isDefault: true },
  { id: 'entertainment', name: 'Entertainment', icon: 'music', color: '#E6B85C', type: 'expense', isDefault: true },
  { id: 'education', name: 'Education', icon: 'book-open', color: '#2E90FA', type: 'expense', isDefault: true },
  { id: 'travel', name: 'Travel', icon: 'map', color: '#7A5AF8', type: 'expense', isDefault: true },
  { id: 'other', name: 'Other', icon: 'more-horizontal', color: '#8E9AAF', type: 'both', isDefault: true },
  // Income categories
  { id: 'salary', name: 'Salary', icon: 'briefcase', color: '#4CAF50', type: 'income', isDefault: true },
  { id: 'freelance', name: 'Freelance', icon: 'layers', color: '#2196F3', type: 'income', isDefault: true },
  { id: 'investment', name: 'Investment', icon: 'trending-up', color: '#FF9800', type: 'income', isDefault: true },
  { id: 'other-income', name: 'Other Income', icon: 'dollar-sign', color: '#8BC34A', type: 'income', isDefault: true },
];

const DEFAULT_PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'upi', name: 'UPI', isDefault: true },
  { id: 'cash', name: 'Cash', isDefault: false },
  { id: 'card', name: 'Card', isDefault: false },
];

const seed: Expense[] = [
  { id: 'seed-1', amount: 120, description: 'Coffee', category: 'Food & Drinks', icon: 'coffee', color: '#FF8C69', date: new Date().toISOString(), payment: 'UPI' },
  { id: 'seed-2', amount: 340, description: 'Uber', category: 'Transport', icon: 'navigation', color: '#5B8DEF', date: new Date(Date.now() - 3600000).toISOString(), payment: 'UPI' },
  { id: 'seed-3', amount: 1240, description: 'Groceries', category: 'Groceries', icon: 'shopping-cart', color: '#F2A65A', date: new Date(Date.now() - 86400000).toISOString(), payment: 'Card' },
];

const defaults: UserSettings = {
  currency: 'INR',
  appearance: 'system',
  defaultPayment: 'UPI',
  notificationsEnabled: false,
  profileName: 'Sahil Mulla',
  profileImage: null,
};

const KEYS = {
  expenses: '@pocketflow/expenses',
  categories: '@pocketflow/categories',
  settings: '@pocketflow/settings',
  paymentMethods: '@pocketflow/paymentMethods',
  accounts: '@pocketflow/accounts',
  transactions: '@pocketflow/transactions',
  migrationVersion: '@pocketflow/migrationVersion',
};

const CURRENT_MIGRATION_VERSION = 3;

const FinanceContext = createContext<FinanceContextValue | null>(null);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [settings, setSettings] = useState<UserSettings>(defaults);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(DEFAULT_PAYMENT_METHODS);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [storedExpenses, storedCategories, storedSettings, storedPaymentMethods, storedAccounts, storedTransactions, migrationVersion] = await Promise.all([
        AsyncStorage.getItem(KEYS.expenses),
        AsyncStorage.getItem(KEYS.categories),
        AsyncStorage.getItem(KEYS.settings),
        AsyncStorage.getItem(KEYS.paymentMethods),
        AsyncStorage.getItem(KEYS.accounts),
        AsyncStorage.getItem(KEYS.transactions),
        AsyncStorage.getItem(KEYS.migrationVersion),
      ]);

      const currentMigrationVersion = migrationVersion ? parseInt(migrationVersion, 10) : 0;

      setExpenses(storedExpenses ? JSON.parse(storedExpenses) as Expense[] : seed);
      setCategories(storedCategories ? JSON.parse(storedCategories) as Category[] : DEFAULT_CATEGORIES);
      setSettings(storedSettings ? { ...defaults, ...JSON.parse(storedSettings) as Partial<UserSettings> } : defaults);
      setPaymentMethods(storedPaymentMethods ? JSON.parse(storedPaymentMethods) as PaymentMethod[] : DEFAULT_PAYMENT_METHODS);
      setAccounts(storedAccounts ? JSON.parse(storedAccounts) as Account[] : []);
      setTransactions(storedTransactions ? JSON.parse(storedTransactions) as Transaction[] : []);

      if (currentMigrationVersion < CURRENT_MIGRATION_VERSION) {
        await migrateData(currentMigrationVersion);
      }

      setLoading(false);
    } catch (error) {
      console.error('Failed to load data:', error);
      setExpenses(seed);
      setLoading(false);
    }
  }, []);

  const migrateData = useCallback(async (fromVersion: number) => {
    if (fromVersion >= CURRENT_MIGRATION_VERSION) return;

    let currentAccounts = accounts;
    let currentTransactions = transactions;
    let currentExpenses = expenses;

    if (fromVersion < 1) {
      const hasExistingAccounts = currentAccounts.length > 0;
      const hasExistingTransactions = currentTransactions.length > 0;

      if (!hasExistingAccounts && !hasExistingTransactions) {
        const defaultAccount: Account = {
          id: 'main-wallet',
          name: 'Main Wallet',
          type: 'CASH',
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
          type: 'EXPENSE' as TransactionType,
          amount: expense.amount,
          description: expense.description,
          category: expense.category,
          categoryId: categories.find(c => c.name === expense.category)?.id,
          accountId: defaultAccount.id,
          date: new Date(expense.date).toISOString().split('T')[0],
          time: new Date(expense.date).toTimeString().slice(0, 5),
          createdAt: expense.date,
          updatedAt: expense.date,
        }));

        await AsyncStorage.setItem(KEYS.accounts, JSON.stringify(currentAccounts));
        await AsyncStorage.setItem(KEYS.transactions, JSON.stringify(currentTransactions));
      }
    }

    if (fromVersion < 2) {
      // Normalize existing transactions: ensure positive amounts, uppercase types
      currentTransactions = currentTransactions.map(txn => ({
        ...txn,
        amount: Math.abs(Number(txn.amount)) || 0,
        type: (txn.type || 'EXPENSE').toUpperCase() as TransactionType,
      }));
      await AsyncStorage.setItem(KEYS.transactions, JSON.stringify(currentTransactions));
    }

    setAccounts(currentAccounts);
    setTransactions(currentTransactions);
    await AsyncStorage.setItem(KEYS.migrationVersion, CURRENT_MIGRATION_VERSION.toString());
  }, [accounts, transactions, expenses, categories, settings.currency]);

  const migrateIfNeeded = useCallback(async () => {
    const migrationVersion = await AsyncStorage.getItem(KEYS.migrationVersion);
    const currentVersion = migrationVersion ? parseInt(migrationVersion, 10) : 0;
    if (currentVersion < CURRENT_MIGRATION_VERSION) {
      await migrateData(currentVersion);
    }
  }, [migrateData]);

  const persistExpenses = useCallback((next: Expense[]) => {
    setExpenses(next);
    void AsyncStorage.setItem(KEYS.expenses, JSON.stringify(next));
  }, []);

  const addExpense = useCallback(async (amount: number, description: string, category: Category, payment = settings.defaultPayment) => {
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
  }, [settings.defaultPayment]);

  const deleteExpense = useCallback((id: string) => persistExpenses(expenses.filter((item) => item.id !== id)), [expenses, persistExpenses]);
  const updateExpense = useCallback((expense: Expense) => persistExpenses(expenses.map((item) => item.id === expense.id ? expense : item)), [expenses, persistExpenses]);

  const addCategory = useCallback(async (name: string, icon: string, color: string) => {
    const category: Category = { id: 'custom-' + Date.now().toString(), name: name.trim(), icon, color, isDefault: false };
    const next = [...categories, category];
    setCategories(next);
    await AsyncStorage.setItem(KEYS.categories, JSON.stringify(next));
  }, [categories]);

  const updateCategory = useCallback(async (category: Category) => {
    const next = categories.map((item) => item.id === category.id ? category : item);
    setCategories(next);
    await AsyncStorage.setItem(KEYS.categories, JSON.stringify(next));
  }, [categories]);

  const deleteCategory = useCallback(async (id: string) => {
    const target = categories.find((item) => item.id === id);
    if (!target || target.isDefault || expenses.some((item) => item.category === target.name)) return false;
    const next = categories.filter((item) => item.id !== id);
    setCategories(next);
    await AsyncStorage.setItem(KEYS.categories, JSON.stringify(next));
    return true;
  }, [categories, expenses]);

  const updateSettings = useCallback(async (patch: Partial<UserSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    await AsyncStorage.setItem(KEYS.settings, JSON.stringify(next));
  }, [settings]);

  const addPaymentMethod = useCallback(async (name: string) => {
    const method: PaymentMethod = { id: 'pm-' + Date.now().toString(), name: name.trim(), isDefault: false };
    const next = [...paymentMethods, method];
    setPaymentMethods(next);
    await AsyncStorage.setItem(KEYS.paymentMethods, JSON.stringify(next));
  }, [paymentMethods]);

  const updatePaymentMethod = useCallback(async (method: PaymentMethod) => {
    const next = paymentMethods.map((item) => item.id === method.id ? method : item);
    setPaymentMethods(next);
    await AsyncStorage.setItem(KEYS.paymentMethods, JSON.stringify(next));
  }, [paymentMethods]);

  const deletePaymentMethod = useCallback(async (id: string) => {
    const target = paymentMethods.find((item) => item.id === id);
    if (target?.isDefault) return;
    const next = paymentMethods.filter((item) => item.id !== id);
    setPaymentMethods(next);
    await AsyncStorage.setItem(KEYS.paymentMethods, JSON.stringify(next));
  }, [paymentMethods]);

  const addAccount = useCallback(async (accountData: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const account: Account = {
      ...accountData,
      isActive: accountData.isActive !== false,
      id: 'acc-' + Date.now().toString(),
      createdAt: now,
      updatedAt: now,
    };
    let nextAccounts = [...accounts, account];
    if (account.isDefault) {
      nextAccounts = nextAccounts.map(a => ({ ...a, isDefault: a.id === account.id }));
    }
    setAccounts(nextAccounts);
    await AsyncStorage.setItem(KEYS.accounts, JSON.stringify(nextAccounts));
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [accounts]);

  const updateAccount = useCallback(async (account: Account) => {
    let next = accounts.map((item) => item.id === account.id ? { ...account, updatedAt: new Date().toISOString() } : item);
    if (account.isDefault) {
      next = next.map(a => ({ ...a, isDefault: a.id === account.id }));
    }
    setAccounts(next);
    await AsyncStorage.setItem(KEYS.accounts, JSON.stringify(next));
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [accounts]);

  const setDefaultAccount = useCallback(async (id: string) => {
    const next = accounts.map(a => ({ ...a, isDefault: a.id === id, updatedAt: a.id === id ? new Date().toISOString() : a.updatedAt }));
    setAccounts(next);
    await AsyncStorage.setItem(KEYS.accounts, JSON.stringify(next));
  }, [accounts]);

  const deleteAccount = useCallback(async (id: string, replacementAccountId?: string) => {
    const target = accounts.find(a => a.id === id);
    if (!target) return false;

    const hasTransactions = transactions.some(t => 
      t.accountId === id || t.fromAccountId === id || t.toAccountId === id
    );

    if (hasTransactions && !replacementAccountId) {
      return false;
    }

    if (hasTransactions && replacementAccountId) {
      const replacement = accounts.find(a => a.id === replacementAccountId);
      if (!replacement) return false;

      setTransactions(prev => prev.map(t => {
        if (t.accountId === id) return { ...t, accountId: replacementAccountId, updatedAt: new Date().toISOString() };
        if (t.fromAccountId === id) return { ...t, fromAccountId: replacementAccountId, updatedAt: new Date().toISOString() };
        if (t.toAccountId === id) return { ...t, toAccountId: replacementAccountId, updatedAt: new Date().toISOString() };
        return t;
      }));
    }

    const next = accounts.filter(a => a.id !== id);
    const wasDefault = target.isDefault;
    setAccounts(next);
    await AsyncStorage.setItem(KEYS.accounts, JSON.stringify(next));

    if (wasDefault && next.length > 0) {
      const newDefault = next[0];
      await setDefaultAccount(newDefault.id);
    }

    return true;
  }, [accounts, transactions, setDefaultAccount]);

  const addTransaction = useCallback(async (transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const transaction: Transaction = {
      ...transactionData,
      amount: Math.abs(Number(transactionData.amount)) || 0,
      type: (transactionData.type || 'EXPENSE').toUpperCase() as TransactionType,
      id: 'txn-' + Date.now().toString() + Math.random().toString(36).slice(2, 8),
      createdAt: now,
      updatedAt: now,
    };
    setTransactions(prev => {
      const next = [transaction, ...prev];
      void AsyncStorage.setItem(KEYS.transactions, JSON.stringify(next));
      return next;
    });
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const deleteTransaction = useCallback(async (id: string) => {
    setTransactions(prev => {
      const next = prev.filter(t => t.id !== id);
      void AsyncStorage.setItem(KEYS.transactions, JSON.stringify(next));
      return next;
    });
  }, []);

  const updateTransaction = useCallback(async (transaction: Transaction) => {
    setTransactions(prev => {
      const next = prev.map(t => t.id === transaction.id ? { ...transaction, updatedAt: new Date().toISOString() } : t);
      void AsyncStorage.setItem(KEYS.transactions, JSON.stringify(next));
      return next;
    });
  }, []);

  const getAccountBalance = useCallback((accountId: string) => {
    const account = accounts.find(a => a.id === accountId);
    if (!account) return 0;

    let balance = Number(account.openingBalance) || 0;

    for (const txn of transactions) {
      const amount = Number(txn.amount) || 0;
      if (amount === 0) continue;
      const type = (txn.type || '').toUpperCase();

      if (type === 'INCOME' && txn.accountId === accountId) {
        balance += amount;
      } else if (type === 'EXPENSE' && txn.accountId === accountId) {
        balance -= amount;
      } else if (type === 'TRANSFER') {
        if (txn.toAccountId === accountId) {
          balance += amount;
        }
        if (txn.fromAccountId === accountId) {
          balance -= amount;
        }
      }
    }

    return balance;
  }, [accounts, transactions]);

  const getTotalBalance = useCallback(() => {
    return accounts.reduce((sum, account) => sum + getAccountBalance(account.id), 0);
  }, [accounts, getAccountBalance]);

  const exportData = useCallback(async (format: 'json' | 'csv') => {
    const { Share } = await import('react-native');
    const content = format === 'json'
      ? JSON.stringify({ expenses, categories, settings, paymentMethods, accounts, transactions }, null, 2)
      : [
          'Date,Description,Amount,Category,Payment Method',
          ...expenses.map((item) => [
            new Date(item.date).toISOString().slice(0, 10),
            item.description.replace(/,/g, ' '),
            item.amount,
            item.category,
            item.payment,
          ].join(',')),
        ].join('\n');
    await Share.share({ title: 'Pocketflow ' + format.toUpperCase() + ' backup', message: content });
  }, [expenses, categories, settings, paymentMethods, accounts, transactions]);

  const importData = useCallback(async (json: string) => {
    try {
      const data = JSON.parse(json);
      if (data.expenses) {
        setExpenses(data.expenses);
        await AsyncStorage.setItem(KEYS.expenses, JSON.stringify(data.expenses));
      }
      if (data.categories) {
        setCategories(data.categories);
        await AsyncStorage.setItem(KEYS.categories, JSON.stringify(data.categories));
      }
      if (data.settings) {
        const next = { ...defaults, ...data.settings };
        setSettings(next);
        await AsyncStorage.setItem(KEYS.settings, JSON.stringify(next));
      }
      if (data.paymentMethods) {
        setPaymentMethods(data.paymentMethods);
        await AsyncStorage.setItem(KEYS.paymentMethods, JSON.stringify(data.paymentMethods));
      }
      if (data.accounts) {
        setAccounts(data.accounts);
        await AsyncStorage.setItem(KEYS.accounts, JSON.stringify(data.accounts));
      }
      if (data.transactions) {
        setTransactions(data.transactions);
        await AsyncStorage.setItem(KEYS.transactions, JSON.stringify(data.transactions));
      }
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      throw new Error('Invalid backup file');
    }
  }, []);

  const value = useMemo(() => ({
    expenses, categories, settings, paymentMethods, accounts, transactions, loading,
    addExpense, deleteExpense, updateExpense,
    addCategory, updateCategory, deleteCategory,
    updateSettings, exportData, importData,
    addPaymentMethod, updatePaymentMethod, deletePaymentMethod,
    addAccount, updateAccount, deleteAccount, setDefaultAccount,
    addTransaction, deleteTransaction, updateTransaction,
    getAccountBalance, getTotalBalance, migrateIfNeeded,
  }), [
    expenses, categories, settings, paymentMethods, accounts, transactions, loading,
    addExpense, deleteExpense, updateExpense,
    addCategory, updateCategory, deleteCategory,
    updateSettings, exportData, importData,
    addPaymentMethod, updatePaymentMethod, deletePaymentMethod,
    addAccount, updateAccount, deleteAccount, setDefaultAccount,
    addTransaction, deleteTransaction, updateTransaction,
    getAccountBalance, getTotalBalance, migrateIfNeeded,
  ]);

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const value = useContext(FinanceContext);
  if (!value) throw new Error('useFinance must be used inside FinanceProvider');
  return value;
}