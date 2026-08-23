import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type Category = { id: string; name: string; icon: string; color: string };
export type Expense = { id: string; amount: number; description: string; category: string; icon: string; color: string; date: string; payment: string };

type FinanceContextValue = {
  expenses: Expense[];
  categories: Category[];
  loading: boolean;
  addExpense: (amount: number, description: string, category: Category, payment?: string) => Promise<void>;
  deleteExpense: (id: string) => void;
  updateExpense: (expense: Expense) => void;
};

const categories: Category[] = [
  { id: 'food', name: 'Food & Drinks', icon: 'coffee', color: '#FF8C69' },
  { id: 'transport', name: 'Transport', icon: 'navigation', color: '#5B8DEF' },
  { id: 'shopping', name: 'Shopping', icon: 'shopping-bag', color: '#9B7BEB' },
  { id: 'bills', name: 'Bills', icon: 'file-text', color: '#48B49B' },
  { id: 'health', name: 'Health', icon: 'heart', color: '#EC6A8E' },
  { id: 'entertainment', name: 'Fun', icon: 'music', color: '#E6B85C' },
  { id: 'other', name: 'Other', icon: 'more-horizontal', color: '#8E9AAF' },
];

const seed: Expense[] = [
  { id: 'seed-1', amount: 120, description: 'Coffee', category: 'Food & Drinks', icon: 'coffee', color: '#FF8C69', date: new Date().toISOString(), payment: 'UPI' },
  { id: 'seed-2', amount: 340, description: 'Uber', category: 'Transport', icon: 'navigation', color: '#5B8DEF', date: new Date(Date.now() - 3600000).toISOString(), payment: 'UPI' },
  { id: 'seed-3', amount: 1240, description: 'Groceries', category: 'Shopping', icon: 'shopping-bag', color: '#9B7BEB', date: new Date(Date.now() - 86400000).toISOString(), payment: 'Card' },
];

const FinanceContext = createContext<FinanceContextValue | null>(null);
const STORAGE_KEY = '@pocketflow/expenses';

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      setExpenses(stored ? JSON.parse(stored) as Expense[] : seed);
      setLoading(false);
    }).catch(() => { setExpenses(seed); setLoading(false); });
  }, []);

  const persist = useCallback((next: Expense[]) => {
    setExpenses(next);
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const addExpense = useCallback(async (amount: number, description: string, category: Category, payment = 'UPI') => {
    const expense: Expense = { id: Date.now().toString() + Math.random().toString(36).slice(2, 8), amount, description: description.trim() || category.name, category: category.name, icon: category.icon, color: category.color, date: new Date().toISOString(), payment };
    setExpenses((current) => { const next = [expense, ...current]; void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)); return next; });
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const deleteExpense = useCallback((id: string) => persist(expenses.filter((item) => item.id !== id)), [expenses, persist]);
  const updateExpense = useCallback((expense: Expense) => persist(expenses.map((item) => item.id === expense.id ? expense : item)), [expenses, persist]);
  const value = useMemo(() => ({ expenses, categories, loading, addExpense, deleteExpense, updateExpense }), [expenses, loading, addExpense, deleteExpense, updateExpense]);
  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const value = useContext(FinanceContext);
  if (!value) throw new Error('useFinance must be used inside FinanceProvider');
  return value;
}
