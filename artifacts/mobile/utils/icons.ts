import { AccountType, TransactionType } from '@/context/FinanceContext';
import { Feather } from '@expo/vector-icons';

type FeatherIconName = keyof typeof Feather.glyphMap;

export const accountTypeIcons: Record<AccountType, FeatherIconName> = {
  CASH: 'credit-card',
  BANK: 'home',
  UPI: 'smartphone',
  SAVINGS: 'target',
  OTHER: 'credit-card',
};

export const accountTypeLabels: Record<AccountType, string> = {
  CASH: 'Cash',
  BANK: 'Bank Account',
  UPI: 'UPI',
  SAVINGS: 'Savings',
  OTHER: 'Other',
};

export const transactionTypeIcons: Record<TransactionType, FeatherIconName> = {
  INCOME: 'arrow-down-left',
  EXPENSE: 'arrow-up-right',
  TRANSFER: 'arrow-right',
};

export const transactionTypeColors: Record<TransactionType, string> = {
  INCOME: '#149343',
  EXPENSE: '#DC2626',
  TRANSFER: '#5b8def',
};

export const categoryIcons: Record<string, FeatherIconName> = {
  coffee: 'coffee',
  'shopping-cart': 'shopping-cart',
  navigation: 'navigation',
  'shopping-bag': 'shopping-bag',
  'file-text': 'file-text',
  heart: 'heart',
  music: 'music',
  'more-horizontal': 'more-horizontal',
  home: 'home',
  car: 'navigation',
  'trending-up': 'trending-up',
  briefcase: 'briefcase',
  gift: 'gift',
  'package': 'package',
  'bar-chart': 'bar-chart',
  dollar: 'dollar-sign',
  repeat: 'refresh-cw',
};

export const quickActionIcons = {
  income: 'arrow-down-right' as FeatherIconName,
  expense: 'arrow-up-right' as FeatherIconName,
  transfer: 'credit-card' as FeatherIconName,
} as const;
