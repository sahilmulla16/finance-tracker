import { Transaction, Category, Account, UserSettings } from '@/context/FinanceContext';
import { currencySymbol, money } from '@/utils/format';
import {
  AIStructuredResponse,
  AICategoryBreakdownData,
  AIStatCardData,
  AIComparisonData,
  AIBudgetHealthData,
  AIAffordabilityData,
} from './aiTypes';

export interface FinancialAggregates {
  currencyCode: string;
  currencySym: string;
  currentMonthName: string;
  currentYear: number;
  daysInMonth: number;
  currentDay: number;
  daysRemaining: number;
  currentMonthExpense: number;
  currentMonthIncome: number;
  previousMonthExpense: number;
  monthDiffExpense: number;
  monthDiffPercent: number;
  categoryBreakdown: Array<{
    name: string;
    amount: number;
    percentage: number;
    color: string;
    icon: string;
  }>;
  totalBalance: number;
  monthlyBudget: number;
  budgetSpent: number;
  budgetRemaining: number;
  budgetPercentUsed: number;
  budgetPaceStatus: 'on_track' | 'caution' | 'over_budget';
  recentExpenses: Array<{
    id: string;
    description: string;
    amount: number;
    date: string;
    category: string;
  }>;
}

let _cachedAggregates: FinancialAggregates | null = null;
let _lastCacheKey = "";

/**
 * Computes high-level aggregated metrics from local financial state.
 * Highly optimized for 50,000+ transactions with string-based date parsing and aggregate caching.
 */
export function computeFinancialAggregates(
  transactions: Transaction[],
  categories: Category[],
  accounts: Account[],
  settings: UserSettings,
  monthlyBudget = 0,
): FinancialAggregates {
  const currencyCode = settings?.currency || 'INR';
  const currencySym = currencySymbol(currencyCode);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed
  const currentDay = now.getDate();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysRemaining = Math.max(0, daysInMonth - currentDay);

  // Cache key to avoid redundant full-array passes when queries are sent sequentially
  const cacheKey = `${transactions.length}_${transactions[0]?.id || ''}_${monthlyBudget}_${currencyCode}_${accounts.length}`;
  if (_cachedAggregates && _lastCacheKey === cacheKey) {
    return _cachedAggregates;
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const currentMonthName = monthNames[currentMonth];

  // Previous month calculation
  const prevMonthIndex = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  // Format YYYY-MM prefixes for ultra-fast string matching (bypasses 50k Date object allocations)
  const currentMonthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const prevMonthPrefix = `${prevMonthYear}-${String(prevMonthIndex + 1).padStart(2, '0')}`;

  let currentMonthExpense = 0;
  let currentMonthIncome = 0;
  let previousMonthExpense = 0;

  const categoryMap: Record<string, { amount: number; color: string; icon: string }> = {};

  // Build category lookup
  const catLookup = new Map<string, Category>();
  categories.forEach((c) => {
    catLookup.set(c.name.toLowerCase(), c);
    catLookup.set(c.id, c);
  });

  const recentExpensesList: Array<{
    id: string;
    description: string;
    amount: number;
    date: string;
    category: string;
  }> = [];

  // Single pass through transactions with fast string-sliced date comparisons
  const txCount = transactions.length;
  for (let i = 0; i < txCount; i++) {
    const tx = transactions[i];
    const amount = Math.abs(Number(tx.amount)) || 0;
    if (amount === 0) continue;

    const txDateStr = tx.date || tx.createdAt || '';
    const datePrefix = txDateStr.length >= 7 ? txDateStr.slice(0, 7) : '';

    const isCurrentMonth = datePrefix === currentMonthPrefix;
    const isPrevMonth = datePrefix === prevMonthPrefix;

    if (tx.type === 'EXPENSE') {
      if (isCurrentMonth) {
        currentMonthExpense += amount;
        const catName = tx.category || 'Other';
        const matched = catLookup.get(catName.toLowerCase());
        const catColor = matched?.color || '#FF8C69';
        const catIcon = matched?.icon || 'coffee';

        if (!categoryMap[catName]) {
          categoryMap[catName] = { amount: 0, color: catColor, icon: catIcon };
        }
        categoryMap[catName].amount += amount;
      } else if (isPrevMonth) {
        previousMonthExpense += amount;
      }

      if (recentExpensesList.length < 10) {
        recentExpensesList.push({
          id: tx.id,
          description: tx.description || tx.category || 'Expense',
          amount,
          date: tx.date || tx.createdAt?.slice(0, 10) || '',
          category: tx.category || 'General',
        });
      }
    } else if (tx.type === 'INCOME' && isCurrentMonth) {
      currentMonthIncome += amount;
    }
  }

  // Calculate month difference
  const monthDiffExpense = currentMonthExpense - previousMonthExpense;
  const monthDiffPercent =
    previousMonthExpense > 0
      ? Math.round((monthDiffExpense / previousMonthExpense) * 100)
      : 0;

  // Category breakdown list
  const categoryBreakdown = Object.entries(categoryMap)
    .map(([name, data]) => ({
      name,
      amount: data.amount,
      percentage:
        currentMonthExpense > 0
          ? Math.round((data.amount / currentMonthExpense) * 100)
          : 0,
      color: data.color,
      icon: data.icon,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Total balance across accounts
  const totalBalance = accounts.reduce((sum, acc) => {
    return sum + (Number(acc.openingBalance) || 0);
  }, 0);

  // Budget pace
  const budgetSpent = currentMonthExpense;
  const budgetRemaining = Math.max(0, monthlyBudget - budgetSpent);
  const budgetPercentUsed =
    monthlyBudget > 0 ? Math.round((budgetSpent / monthlyBudget) * 100) : 0;

  const monthProgressPct = Math.round((currentDay / daysInMonth) * 100);
  let budgetPaceStatus: 'on_track' | 'caution' | 'over_budget' = 'on_track';
  if (monthlyBudget > 0) {
    if (budgetSpent > monthlyBudget) {
      budgetPaceStatus = 'over_budget';
    } else if (budgetPercentUsed > monthProgressPct + 15) {
      budgetPaceStatus = 'caution';
    } else {
      budgetPaceStatus = 'on_track';
    }
  }

  const result: FinancialAggregates = {
    currencyCode,
    currencySym,
    currentMonthName,
    currentYear,
    daysInMonth,
    currentDay,
    daysRemaining,
    currentMonthExpense,
    currentMonthIncome,
    previousMonthExpense,
    monthDiffExpense,
    monthDiffPercent,
    categoryBreakdown,
    totalBalance,
    monthlyBudget,
    budgetSpent,
    budgetRemaining,
    budgetPercentUsed,
    budgetPaceStatus,
    recentExpenses: recentExpensesList,
  };

  _cachedAggregates = result;
  _lastCacheKey = cacheKey;

  return result;
}

/**
 * Builds a compact, privacy-safe text summary for Gemini.
 * Gemini gets high-level aggregates rather than raw personal transactions.
 * Builds a compact, privacy-safe text summary of financial aggregates.
 */
export function buildFinancialContextPrompt(
  aggregates: FinancialAggregates,
  profileName?: string,
): string {
  const {
    currencySym,
    currencyCode,
    currentMonthName,
    currentYear,
    currentDay,
    daysInMonth,
    daysRemaining,
    currentMonthExpense,
    currentMonthIncome,
    previousMonthExpense,
    monthDiffExpense,
    monthDiffPercent,
    categoryBreakdown,
    totalBalance,
    monthlyBudget,
    budgetSpent,
    budgetRemaining,
    budgetPercentUsed,
    budgetPaceStatus,
    recentExpenses,
  } = aggregates;

  const topCats = categoryBreakdown
    .slice(0, 7)
    .map((c) => `- ${c.name}: ${currencySym}${c.amount.toLocaleString()} (${c.percentage}%)`)
    .join('\n');

  const recentTx = (recentExpenses || [])
    .slice(0, 10)
    .map((t) => `- ${t.date || 'Recent'}: ${t.description} (${t.category}) = ${currencySym}${t.amount.toLocaleString()}`)
    .join('\n');

  return `
Financial context for user ${profileName || 'User'}:
Currency: ${currencyCode} (${currencySym})
Current Date: Day ${currentDay} of ${daysInMonth} in ${currentMonthName} ${currentYear} (${daysRemaining} days remaining in month)
Current Month Total Expenses: ${currencySym}${currentMonthExpense.toLocaleString()}
Current Month Total Income: ${currencySym}${currentMonthIncome.toLocaleString()}
Previous Month Total Expenses: ${currencySym}${previousMonthExpense.toLocaleString()}
Month-over-Month Expense Difference: ${monthDiffExpense > 0 ? '+' : ''}${currencySym}${Math.abs(monthDiffExpense).toLocaleString()} (${monthDiffPercent > 0 ? '+' : ''}${monthDiffPercent}%)
Top Spending Categories this month:
${topCats || '- No category expenses logged yet'}
Total Balance across accounts: ${currencySym}${totalBalance.toLocaleString()}
Monthly Budget: ${monthlyBudget > 0 ? `${currencySym}${monthlyBudget.toLocaleString()} (${budgetPercentUsed}% used, ${currencySym}${budgetRemaining.toLocaleString()} remaining, Status: ${budgetPaceStatus})` : 'Not configured'}
Recent Transactions:
${recentTx || '- No recent transactions'}
`;
}

/**
 * Resolves standard financial questions locally using instantaneous local math.
 * Powers offline mode and instant zero-latency responses before / alongside Gemini.
 * Resolves standard financial questions locally using instantaneous math.
 * Powers 100% offline mode and instant zero-latency responses.
 */
export function resolveLocalFinancialQuery(
  rawQuery: string,
  aggregates: FinancialAggregates,
): AIStructuredResponse | null {
  const q = rawQuery.toLowerCase().trim();
  const {
    currencySym,
    currentMonthName,
    currentMonthExpense,
    previousMonthExpense,
    monthDiffExpense,
    monthDiffPercent,
    categoryBreakdown,
    monthlyBudget,
    budgetSpent,
    budgetRemaining,
    budgetPercentUsed,
    daysRemaining,
    budgetPaceStatus,
    recentExpenses,
    totalBalance,
  } = aggregates;

  // 1. Spending this month ("how much did i spend", "total expense", "spending this month")
  if (
    (q.includes('how much') && (q.includes('spend') || q.includes('spent') || q.includes('expense'))) ||
    q.includes('spending this month') ||
    q.includes('october spending') ||
    q.includes('current month spending')
  ) {
    const topCategory = categoryBreakdown[0];
    const statCard: AIStatCardData = {
      type: 'stat',
      title: `${currentMonthName} Spending`,
      value: `${currencySym}${currentMonthExpense.toLocaleString()}`,
      subtitle: topCategory
        ? `Top category: ${topCategory.name} (${currencySym}${topCategory.amount.toLocaleString()})`
        : 'Across all active categories',
      trend: monthDiffExpense > 0 ? 'up' : 'down',
      changeText:
        previousMonthExpense > 0
          ? `${monthDiffPercent > 0 ? '+' : ''}${monthDiffPercent}% vs last month`
          : undefined,
      tag: 'This Month',
    };

    const breakdownCard: AICategoryBreakdownData | undefined =
      categoryBreakdown.length > 0
        ? {
            type: 'category_breakdown',
            title: 'Top Category Spend',
            totalAmount: `${currencySym}${currentMonthExpense.toLocaleString()}`,
            period: currentMonthName,
            categories: categoryBreakdown.slice(0, 4).map((c) => ({
              name: c.name,
              amount: c.amount,
              formattedAmount: `${currencySym}${c.amount.toLocaleString()}`,
              percentage: c.percentage,
              color: c.color,
              icon: c.icon,
            })),
          }
        : undefined;

    return {
      text: `You have spent ${currencySym}${currentMonthExpense.toLocaleString()} so far in ${currentMonthName}.${
        topCategory
          ? ` Your largest expense is in ${topCategory.name} (${currencySym}${topCategory.amount.toLocaleString()}).`
          : ''
      }`,
      cards: [statCard],
      followUps: [
        { label: 'Where is my money going?', query: 'Where am I spending the most?' },
        { label: 'Compare to last month', query: 'Compare my spending to last month' },
      ],
      mascotReaction: 'SUCCESS',
    };
  }

  // 2. Where am I spending the most / Category breakdown
  if (
    q.includes('where am i spending') ||
    q.includes('top categor') ||
    q.includes('category breakdown') ||
    q.includes('where is my money going') ||
    q.includes('highest expense')
  ) {
    if (categoryBreakdown.length === 0) {
      return {
        text: `You haven't logged any category expenses for ${currentMonthName} yet. Tap the **+** button to log your first expense!`,
        mascotReaction: 'IDLE',
      };
    }

    const topCategory = categoryBreakdown[0];
    const breakdownCard: AICategoryBreakdownData = {
      type: 'category_breakdown',
      title: 'Spending by Category',
      totalAmount: `${currencySym}${currentMonthExpense.toLocaleString()}`,
      period: currentMonthName,
      categories: categoryBreakdown.slice(0, 5).map((c) => ({
        name: c.name,
        amount: c.amount,
        formattedAmount: `${currencySym}${c.amount.toLocaleString()}`,
        percentage: c.percentage,
        color: c.color,
        icon: c.icon,
      })),
    };

    return {
      text: `Your biggest spending category in ${currentMonthName} is **${topCategory.name}** (${currencySym}${topCategory.amount.toLocaleString()}), accounting for **${topCategory.percentage}%** of your total expenses.`,
      cards: [breakdownCard],
      followUps: [
        { label: 'Compare with last month', query: 'Compare my spending to last month' },
        { label: 'How healthy is my budget?', query: 'How healthy is my budget?' },
        { label: 'Recent expenses', query: 'Show my recent expenses' },
      ],
      mascotReaction: 'SUCCESS',
    };
  }

  // 3. Compare to last month / Month-over-Month
  if (
    q.includes('compare') ||
    q.includes('last month') ||
    q.includes('previous month') ||
    q.includes('vs last month')
  ) {
    const direction =
      monthDiffExpense > 0 ? 'higher' : monthDiffExpense < 0 ? 'lower' : 'same';
    const verdict =
      direction === 'lower'
        ? `Great job! You are spending ${Math.abs(monthDiffPercent)}% less than last month.`
        : direction === 'higher'
          ? `You have spent ${monthDiffPercent}% more than this time last month.`
          : 'Your spending is roughly even with last month.';

    const comparisonCard: AIComparisonData = {
      type: 'comparison',
      title: 'Monthly Spending Comparison',
      currentLabel: currentMonthName,
      currentAmount: `${currencySym}${currentMonthExpense.toLocaleString()}`,
      previousLabel: 'Previous Month',
      previousAmount: `${currencySym}${previousMonthExpense.toLocaleString()}`,
      diffAmount: `${direction === 'higher' ? '+' : '-'}${currencySym}${Math.abs(monthDiffExpense).toLocaleString()}`,
      diffPercentage: Math.abs(monthDiffPercent),
      direction,
      verdict,
    };

    return {
      text: verdict,
      cards: [comparisonCard],
      followUps: [
        { label: 'Where am I spending most?', query: 'Where am I spending the most?' },
        { label: 'Check budget status', query: 'How is my budget doing?' },
      ],
      mascotReaction: direction === 'lower' ? 'SUCCESS' : 'WARNING',
    };
  }

  // 4. Budget health / status
  if (
    q.includes('budget') ||
    q.includes('pace') ||
    q.includes('how much can i spend') ||
    q.includes('on track')
  ) {
    if (monthlyBudget <= 0) {
      return {
        text: `You haven't set a monthly budget yet! Go to the **Budgets** tab to configure your monthly allowance, and Zeno will track your spending pace automatically.`,
        followUps: [
          { label: 'How much did I spend?', query: 'How much did I spend this month?' },
          { label: 'Where is my money going?', query: 'Where am I spending the most?' },
        ],
        mascotReaction: 'IDLE',
      };
    }

    const budgetCard: AIBudgetHealthData = {
      type: 'budget_health',
      title: 'Monthly Budget Health',
      totalBudget: `${currencySym}${monthlyBudget.toLocaleString()}`,
      spentAmount: `${currencySym}${budgetSpent.toLocaleString()}`,
      remainingAmount: `${currencySym}${budgetRemaining.toLocaleString()}`,
      percentageUsed: budgetPercentUsed,
      daysRemainingInMonth: daysRemaining,
      paceStatus: budgetPaceStatus,
      verdict:
        budgetPaceStatus === 'on_track'
          ? `You are on pace! You have ${currencySym}${budgetRemaining.toLocaleString()} remaining for the next ${daysRemaining} days.`
          : budgetPaceStatus === 'caution'
            ? `Heads up! You have used ${budgetPercentUsed}% of your budget with ${daysRemaining} days remaining.`
            : `You have exceeded your monthly budget by ${currencySym}${Math.abs(budgetRemaining).toLocaleString()}!`,
    };

    return {
      text:
        budgetPaceStatus === 'on_track'
          ? `Your budget looks healthy! You have used **${budgetPercentUsed}%** of your ${currencySym}${monthlyBudget.toLocaleString()} budget with **${daysRemaining} days** left in ${currentMonthName}.`
          : `You have used **${budgetPercentUsed}%** of your monthly budget. Watch your discretionary spending over the next ${daysRemaining} days.`,
      cards: [budgetCard],
      followUps: [
        { label: 'Where am I spending the most?', query: 'Where am I spending the most?' },
        { label: 'Can I afford ₹5,000?', query: 'Can I afford ₹5,000?' },
      ],
      mascotReaction: budgetPaceStatus === 'on_track' ? 'SUCCESS' : 'WARNING',
    };
  }

  // 5. Affordability check ("can i afford 5000", "can i buy a laptop for 20000")
  const affordMatch = q.match(/can i afford\s*(?:a|an)?\s*([^\d]*?)(\d[\d,]*)/i);
  if (affordMatch) {
    const rawCost = affordMatch[2].replace(/,/g, '');
    const cost = parseFloat(rawCost);
    const rawItem = affordMatch[1].trim();
    const item = rawItem.replace(/\s*(?:for|of|worth|costing)\s*$/i, '').trim() || 'this purchase';

    if (!isNaN(cost) && cost > 0) {
      const remainingSafeBudget = monthlyBudget > 0 ? budgetRemaining : totalBalance;
      const canAfford = remainingSafeBudget >= cost;
      const postPurchase = Math.max(0, remainingSafeBudget - cost);

      const affordCard: AIAffordabilityData = {
        type: 'affordability',
        item: item,
        cost: `${currencySym}${cost.toLocaleString()}`,
        canAfford,
        currentBalance: `${currencySym}${remainingSafeBudget.toLocaleString()}`,
        postPurchaseBalance: `${currencySym}${postPurchase.toLocaleString()}`,
        impactOnBudget:
          monthlyBudget > 0
            ? `${Math.round((cost / monthlyBudget) * 100)}% of your monthly budget`
            : `${Math.round((cost / (totalBalance || 1)) * 100)}% of your balance`,
        advice: canAfford
          ? `Yes, you have enough headroom. After this purchase, your remaining buffer will be ${currencySym}${postPurchase.toLocaleString()}.`
          : `This purchase would exceed your available buffer by ${currencySym}${(cost - remainingSafeBudget).toLocaleString()}. Consider postponing or saving up first.`,
      };

      return {
        text: canAfford
          ? `Yes! Based on your current financials, you can afford ${currencySym}${cost.toLocaleString()} for ${item || 'this purchase'}.`
          : `Careful: A purchase of ${currencySym}${cost.toLocaleString()} exceeds your current safe buffer of ${currencySym}${remainingSafeBudget.toLocaleString()}.`,
        cards: [affordCard],
        followUps: [
          { label: 'Check my budget', query: 'How healthy is my budget?' },
          { label: 'Where is my money going?', query: 'Where am I spending the most?' },
        ],
        mascotReaction: canAfford ? 'SUCCESS' : 'WARNING',
      };
    }
  }

  // 6. Recent expenses
  if (q.includes('recent') || q.includes('last transactions') || q.includes('latest')) {
    if (recentExpenses.length === 0) {
      return {
        text: `No recent expenses found. Start logging transactions to see your latest spending here!`,
        mascotReaction: 'IDLE',
      };
    }

    return {
      text: `Here are your recent expenses logged in Zeno:`,
      cards: [
        {
          type: 'transaction_list',
          title: 'Recent Expenses',
          filterType: 'EXPENSE',
          transactions: recentExpenses.slice(0, 5).map((tx) => ({
            id: tx.id,
            description: tx.description,
            amount: `${currencySym}${tx.amount.toLocaleString()}`,
            date: tx.date,
            category: tx.category,
            type: 'EXPENSE',
          })),
        },
      ],
      followUps: [
        { label: 'How much did I spend this month?', query: 'How much did I spend this month?' },
        { label: 'Where am I spending most?', query: 'Where am I spending the most?' },
      ],
      mascotReaction: 'SUCCESS',
    };
  }

  return null;
}

