import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type Category = { id: string; name: string; icon: string; color: string; isDefault?: boolean };
export type Expense = { id: string; amount: number; description: string; category: string; icon: string; color: string; date: string; payment: string };
export type Appearance = 'system' | 'light' | 'dark';
export type Currency = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED';
export type UserSettings = { currency: Currency; appearance: Appearance; defaultPayment: string; notificationsEnabled: boolean; biometricEnabled: boolean };

type FinanceContextValue = {
  expenses: Expense[];
  categories: Category[];
  settings: UserSettings;
  loading: boolean;
  addExpense: (amount: number, description: string, category: Category, payment?: string) => Promise<void>;
  deleteExpense: (id: string) => void;
  updateExpense: (expense: Expense) => void;
  addCategory: (name: string, icon: string, color: string) => Promise<void>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<boolean>;
  updateSettings: (patch: Partial<UserSettings>) => Promise<void>;
  exportData: (format: 'json' | 'csv') => Promise<void>;
};

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'food', name: 'Food & Drinks', icon: 'coffee', color: '#FF8C69', isDefault: true },
  { id: 'groceries', name: 'Groceries', icon: 'shopping-cart', color: '#F2A65A', isDefault: true },
  { id: 'transport', name: 'Transport', icon: 'navigation', color: '#5B8DEF', isDefault: true },
  { id: 'shopping', name: 'Shopping', icon: 'shopping-bag', color: '#9B7BEB', isDefault: true },
  { id: 'bills', name: 'Bills', icon: 'file-text', color: '#48B49B', isDefault: true },
  { id: 'health', name: 'Health', icon: 'heart', color: '#EC6A8E', isDefault: true },
  { id: 'entertainment', name: 'Fun', icon: 'music', color: '#E6B85C', isDefault: true },
  { id: 'other', name: 'Other', icon: 'more-horizontal', color: '#8E9AAF', isDefault: true },
];

const seed: Expense[] = [
  { id: 'seed-1', amount: 120, description: 'Coffee', category: 'Food & Drinks', icon: 'coffee', color: '#FF8C69', date: new Date().toISOString(), payment: 'UPI' },
  { id: 'seed-2', amount: 340, description: 'Uber', category: 'Transport', icon: 'navigation', color: '#5B8DEF', date: new Date(Date.now() - 3600000).toISOString(), payment: 'UPI' },
  { id: 'seed-3', amount: 1240, description: 'Groceries', category: 'Groceries', icon: 'shopping-cart', color: '#F2A65A', date: new Date(Date.now() - 86400000).toISOString(), payment: 'Card' },
];

const defaults: UserSettings = { currency: 'INR', appearance: 'system', defaultPayment: 'UPI', notificationsEnabled: false, biometricEnabled: false };
const KEYS = { expenses: '@pocketflow/expenses', categories: '@pocketflow/categories', settings: '@pocketflow/settings' };
const FinanceContext = createContext<FinanceContextValue | null>(null);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [settings, setSettings] = useState<UserSettings>(defaults);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(KEYS.expenses),
      AsyncStorage.getItem(KEYS.categories),
      AsyncStorage.getItem(KEYS.settings),
    ]).then(([storedExpenses, storedCategories, storedSettings]) => {
      setExpenses(storedExpenses ? JSON.parse(storedExpenses) as Expense[] : seed);
      setCategories(storedCategories ? JSON.parse(storedCategories) as Category[] : DEFAULT_CATEGORIES);
      setSettings(storedSettings ? { ...defaults, ...JSON.parse(storedSettings) as Partial<UserSettings> } : defaults);
      setLoading(false);
    }).catch(() => { setExpenses(seed); setLoading(false); });
  }, []);

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

  const exportData = useCallback(async (format: 'json' | 'csv') => {
    const { Share } = await import('react-native');
    const content = format === 'json'
      ? JSON.stringify({ expenses, categories, settings }, null, 2)
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
  }, [expenses, categories, settings]);

  const value = useMemo(() => ({
    expenses, categories, settings, loading, addExpense, deleteExpense, updateExpense,
    addCategory, updateCategory, deleteCategory, updateSettings, exportData,
  }), [expenses, categories, settings, loading, addExpense, deleteExpense, updateExpense, addCategory, updateCategory, deleteCategory, updateSettings, exportData]);

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const value = useContext(FinanceContext);
  if (!value) throw new Error('useFinance must be used inside FinanceProvider');
  return value;
}