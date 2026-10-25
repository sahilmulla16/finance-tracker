// Zeno AI Financial Agent — Type Definitions
// Zeno Local Financial Intelligence — Type Definitions

export type AIMascotState =
  | 'IDLE'
  | 'LISTENING'
  | 'THINKING'
  | 'SUCCESS'
  | 'WARNING'
  | 'ERROR';

export type AIStatCardData = {
  type: 'stat';
  title: string;
  value: string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  changeText?: string;
  tag?: string;
};

export type AICategoryItem = {
  name: string;
  amount: number;
  formattedAmount: string;
  percentage: number;
  icon?: string;
  color?: string;
};

export type AICategoryBreakdownData = {
  type: 'category_breakdown';
  title: string;
  totalAmount: string;
  period: string;
  categories: AICategoryItem[];
};

export type AIComparisonData = {
  type: 'comparison';
  title: string;
  currentLabel: string;
  currentAmount: string;
  previousLabel: string;
  previousAmount: string;
  diffAmount: string;
  diffPercentage: number;
  direction: 'higher' | 'lower' | 'same';
  verdict: string;
};

export type AIBudgetHealthData = {
  type: 'budget_health';
  title: string;
  totalBudget: string;
  spentAmount: string;
  remainingAmount: string;
  percentageUsed: number;
  daysRemainingInMonth: number;
  paceStatus: 'on_track' | 'caution' | 'over_budget';
  verdict: string;
};

export type AITransactionItem = {
  id: string;
  description: string;
  amount: string;
  date: string;
  category: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
};

export type AITransactionListData = {
  type: 'transaction_list';
  title: string;
  subtitle?: string;
  category?: string;
  filterQuery?: string;
  filterType?: 'ALL' | 'EXPENSE' | 'INCOME' | 'TRANSFER';
  transactions: AITransactionItem[];
};

export type AIAffordabilityData = {
  type: 'affordability';
  item: string;
  cost: string;
  canAfford: boolean;
  status?: 'SAFE' | 'CAUTION' | 'NOT_RECOMMENDED';
  currentBalance: string;
  postPurchaseBalance: string;
  impactOnBudget: string;
  advice: string;
};

export type AIAccountItem = {
  id: string;
  name: string;
  type: string;
  balance: string;
  rawBalance: number;
  percentage: number;
  icon?: string;
  color?: string;
};

export type AIAccountBalanceData = {
  type: 'account_balance';
  title: string;
  totalBalance: string;
  accounts: AIAccountItem[];
};

export type AIStructuredCard =
  | AIStatCardData
  | AICategoryBreakdownData
  | AIComparisonData
  | AIBudgetHealthData
  | AITransactionListData
  | AIAffordabilityData
  | AIAccountBalanceData;

export type AIFollowUp = {
  label: string;
  query: string;
};

export type AIStructuredResponse = {
  text: string;
  cards?: AIStructuredCard[];
  followUps?: AIFollowUp[];
  mascotReaction?: AIMascotState;
};

export type AIMessage = {
  id: string;
  sender: 'user' | 'zeno';
  timestamp: string;
  text: string;
  structured?: AIStructuredResponse;
  status?: 'sending' | 'thinking' | 'done' | 'error';
  isLocalInsight?: boolean;
};

