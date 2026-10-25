import { Transaction, Category, Account, UserSettings } from '@/context/FinanceContext';
import { currencySymbol } from '@/utils/format';
import { FinancialAggregates } from './financialDataAggregator';
import {
  AIStructuredResponse,
  AIStructuredCard,
  AIMascotState,
  AIStatCardData,
  AICategoryBreakdownData,
  AIComparisonData,
  AIBudgetHealthData,
  AITransactionListData,
  AIAffordabilityData,
  AIAccountBalanceData,
  AIAccountItem,
} from './aiTypes';

export interface LocalZenoContext {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  settings: UserSettings;
  aggregates: FinancialAggregates;
  monthlyBudget?: number;
}

/**
 * 1. FINANCE SCOPE CHECK
 * Deterministically checks whether a user's prompt is within personal finance scope.
 * 100% on-device filter with 0ms latency.
 */
const OUT_OF_SCOPE_REGEX =
  /\b(python|javascript|typescript|java|c\+\+|html|css|sql|react|code|coding|script|debug|compile|algorithm|programming|hack|terminal|github|weather|recipe|cook|cooking|joke|poem|story|song|essay|movie|actor|actress|politics|election|president|prime minister|elon musk|trump|biden|who is|what is (the capital|a mammal|photosynthesis|gravity|quantum|speed of light))\b/i;

const FINANCE_KEYWORDS =
  /\b(spend|spent|spending|expense|expenses|income|earn|earning|salary|transaction|transactions|balance|balances|account|accounts|budget|budgets|money|cash|save|saving|savings|afford|cost|price|buy|purchase|rupee|dollar|inr|usd|eur|₹|\$|pay|paid|payment|bill|bills|rent|emi|swiggy|zomato|uber|ola|amazon|flipkart|blinkit|zepto|groceries|food|shopping|invest|investment|net worth|worth|wallet)\b/i;

export interface FinanceScopeResult {
  inScope: boolean;
  redirectText?: string;
  suggestedFollowUps?: Array<{ label: string; query: string }>;
}

export function checkFinanceScope(query: string): FinanceScopeResult {
  const trimmed = query.trim();

  // If contains out-of-scope triggers and no finance keywords
  if (OUT_OF_SCOPE_REGEX.test(trimmed) && !FINANCE_KEYWORDS.test(trimmed)) {
    return {
      inScope: false,
      redirectText:
        "I'm Zeno, your private on-device financial companion! I can only help with your personal finances. Ask me about your spending, recent transactions, budgets, account balances, or whether you can afford a purchase.",
      suggestedFollowUps: [
        { label: 'How much did I spend?', query: 'How much did I spend this month?' },
        { label: 'Where is my money going?', query: 'Where am I spending the most?' },
        { label: 'Check my budget', query: 'How healthy is my budget?' },
      ],
    };
  }

  return { inScope: true };
}

/**
 * Helper to extract numeric amount from query (e.g. "Can I afford ₹5,000", "expenses above 2000", "5k")
 */
function extractAmountFromQuery(query: string): number | null {
  const match = query.match(/(?:₹|rs\.?|inr|\$)?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?|[0-9]+(?:\.[0-9]+)?)\s*(?:k|lakh)?\b/i);
  if (!match) return null;

  const rawNum = match[1].replace(/,/g, '');
  let val = parseFloat(rawNum);
  if (isNaN(val)) return null;

  if (/k\b/i.test(match[0])) {
    val *= 1000;
  } else if (/lakh\b/i.test(match[0])) {
    val *= 100000;
  }

  return val;
}

/**
 * Detect merchant in query from known merchants and user transactions
 */
function detectMerchantInQuery(query: string, transactions: Transaction[]): string | null {
  const qLower = query.toLowerCase();
  const commonMerchants = [
    'swiggy', 'zomato', 'uber', 'ola', 'amazon', 'flipkart', 'blinkit',
    'zepto', 'starbucks', 'mcdonalds', 'kfc', 'netflix', 'spotify',
    'apple', 'google', 'airtel', 'jio', 'dunzo', 'myntra', 'nykaa',
    'bigbasket', 'instamart', 'rapido', 'dominos', 'eatclub',
  ];

  for (const m of commonMerchants) {
    if (qLower.includes(m)) return m;
  }

  // Scan user's transaction descriptions
  for (const tx of transactions) {
    const desc = (tx.description || '').trim().toLowerCase();
    if (desc.length >= 3 && qLower.includes(desc)) {
      return tx.description;
    }
  }

  return null;
}

/**
 * Detect category in query
 */
function detectCategoryInQuery(query: string, categories: Category[]): Category | null {
  const qLower = query.toLowerCase().trim();

  // Guard: Never hijack budget health, pacing, net worth, or transaction list queries as category queries!
  if (
    /\b(budget|budgets|healthy|pacing|burn rate|balance|balances|transfer|transfers|recent|biggest|largest|highest|expensive)\b/i.test(qLower)
  ) {
    return null;
  }

  // Direct match against category names using whole word boundaries (prevents 'healthy' matching 'Health')
  for (const cat of categories) {
    const catNameLower = cat.name.toLowerCase();
    const escaped = catNameLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`\\b${escaped}\\b`, 'i').test(qLower)) {
      return cat;
    }
  }

  // Common aliases with whole word boundaries
  const aliases: Record<string, string> = {
    'food': 'Food & Drinks',
    'dining': 'Food & Drinks',
    'eating out': 'Food & Drinks',
    'groceries': 'Groceries',
    'grocery': 'Groceries',
    'cabs': 'Transport',
    'cab': 'Transport',
    'commute': 'Transport',
    'travel': 'Travel',
    'shopping': 'Shopping',
    'clothes': 'Shopping',
    'entertainment': 'Entertainment',
    'movies': 'Entertainment',
    'bills': 'Bills',
    'utilities': 'Bills',
    'rent': 'Housing',
    'health': 'Health',
    'medical': 'Health',
    'medicine': 'Health',
  };

  for (const [alias, targetName] of Object.entries(aliases)) {
    if (new RegExp(`\\b${alias}\\b`, 'i').test(qLower)) {
      const match = categories.find((c) =>
        c.name.toLowerCase() === targetName.toLowerCase() ||
        c.name.toLowerCase().includes(targetName.toLowerCase())
      );
      if (match) return match;
    }
  }

  return null;
}

/**
 * Item & Merchant Synonym Dictionary & Category Grounding
 */
const ITEM_SYNONYMS: Record<
  string,
  { synonyms: string[]; categoryHint?: string; display?: string }
> = {
  petrol: {
    synonyms: [
      'petrol',
      'fuel',
      'diesel',
      'gas',
      'cng',
      'hpcl',
      'bpcl',
      'iocl',
      'shell',
      'pump',
      'bunk',
      'indian oil',
      'bharat petroleum',
      'hindustan petroleum',
    ],
    categoryHint: 'Transport',
    display: 'Petrol',
  },
  diesel: {
    synonyms: ['diesel', 'petrol', 'fuel', 'gas', 'hpcl', 'bpcl', 'iocl', 'shell'],
    categoryHint: 'Transport',
    display: 'Diesel',
  },
  fuel: {
    synonyms: ['fuel', 'petrol', 'diesel', 'gas', 'cng', 'shell', 'hpcl', 'bpcl', 'iocl'],
    categoryHint: 'Transport',
    display: 'Fuel',
  },
  coffee: {
    synonyms: ['coffee', 'starbucks', 'blue tokai', 'ccd', 'cafe', 'espresso', 'latte', 'third wave', 'costa'],
    categoryHint: 'Food',
    display: 'Coffee',
  },
  tea: {
    synonyms: ['tea', 'chai', 'chaayos', 'chai point'],
    categoryHint: 'Food',
    display: 'Tea & Chai',
  },
  chai: {
    synonyms: ['chai', 'tea', 'chaayos', 'chai point'],
    categoryHint: 'Food',
    display: 'Chai',
  },
  cabs: {
    synonyms: ['uber', 'ola', 'rapido', 'cab', 'taxi'],
    categoryHint: 'Transport',
    display: 'Cabs & Rides',
  },
  cab: {
    synonyms: ['uber', 'ola', 'rapido', 'cab', 'taxi'],
    categoryHint: 'Transport',
    display: 'Cabs & Rides',
  },
  taxi: {
    synonyms: ['taxi', 'uber', 'ola', 'rapido', 'cab'],
    categoryHint: 'Transport',
    display: 'Taxi & Rides',
  },
  groceries: {
    synonyms: ['groceries', 'grocery', 'blinkit', 'zepto', 'instamart', 'bigbasket', 'supermarket', 'dmart'],
    categoryHint: 'Groceries',
    display: 'Groceries',
  },
  grocery: {
    synonyms: ['grocery', 'groceries', 'blinkit', 'zepto', 'instamart', 'bigbasket', 'supermarket', 'dmart'],
    categoryHint: 'Groceries',
    display: 'Groceries',
  },
  flight: {
    synonyms: ['flight', 'flights', 'indigo', 'air india', 'vistara', 'cleartrip', 'makemytrip', 'airline', 'airfare'],
    categoryHint: 'Travel',
    display: 'Flights',
  },
  flights: {
    synonyms: ['flights', 'flight', 'indigo', 'air india', 'vistara', 'cleartrip', 'makemytrip', 'airline', 'airfare'],
    categoryHint: 'Travel',
    display: 'Flights',
  },
  movie: {
    synonyms: ['movie', 'movies', 'cinema', 'pvr', 'inox', 'cinepolis', 'bookmyshow', 'theatre'],
    categoryHint: 'Entertainment',
    display: 'Movies',
  },
  movies: {
    synonyms: ['movies', 'movie', 'cinema', 'pvr', 'inox', 'cinepolis', 'bookmyshow', 'theatre'],
    categoryHint: 'Entertainment',
    display: 'Movies',
  },
  gym: {
    synonyms: ['gym', 'fitness', 'cult', 'cult.fit', 'workout', 'anytime fitness'],
    categoryHint: 'Health',
    display: 'Gym & Fitness',
  },
  medicine: {
    synonyms: ['medicine', 'medical', 'pharmacy', 'apollo', 'medplus', '1mg', 'doctor', 'chemist', 'pharma'],
    categoryHint: 'Health',
    display: 'Medicine & Pharmacy',
  },
  recharge: {
    synonyms: ['recharge', 'airtel', 'jio', 'vi', 'vodafone', 'wifi', 'broadband', 'act fibernet'],
    categoryHint: 'Bills',
    display: 'Recharge & Mobile',
  },
  rent: {
    synonyms: ['rent', 'house rent', 'flat rent', 'maintenance', 'society rent'],
    categoryHint: 'Housing',
    display: 'Rent',
  },
  shopping: {
    synonyms: ['shopping', 'amazon', 'flipkart', 'myntra', 'zara', 'h&m', 'ajio', 'nykaa'],
    categoryHint: 'Shopping',
    display: 'Shopping',
  },
};

function extractItemOrMerchantQuery(
  rawQuery: string,
  transactions: Transaction[],
  categories: Category[],
): {
  target: string;
  display: string;
  categoryHint: string;
  matchedTxs: Transaction[];
} | null {
  const qLower = rawQuery.toLowerCase().trim();

  // Strip natural question prefixes (e.g. "how much did I spend on", "spent on")
  let cleaned = qLower
    .replace(
      /^(how much(?: did i| have i| was|'s)?\s*(?:spend|spent)?\s*(?:on|for|in)?|what did i spend on|spent\s*(?:on|for|in)?|spending\s*(?:on|for|in)?|expenses?\s*(?:on|for|in)?|cost\s*(?:of)?|money\s*(?:spent\s*)?(?:on|for)?|show\s*(?:me\s*)?(?:expenses?\s*(?:for|on)?|transactions?\s*(?:for|on)?|all)?)\s+/i,
      '',
    )
    .trim();

  // Strip trailing fillers
  cleaned = cleaned
    .replace(
      /\s+(?:this month|last month|today|yesterday|recently|in total|total|expenses?|transactions?)$/i,
      '',
    )
    .trim();

  // Guard: If cleaned is a general financial concept or system query (not a specific merchant/item), do not treat as an item!
  const isFinanceConcept =
    /\b(budget|budgets|healthy|pacing|burn rate|balance|balances|account|accounts|transfer|transfers|income|salary|save|saving|savings|net worth|overview|summary|today'?s?|yesterday|this week|last week|this month|last month|biggest|largest|highest|expensive|recent|latest|transactions?|expenses?)\b/i.test(cleaned);

  const candidates: string[] = [];
  if (cleaned && cleaned.length >= 2 && !isFinanceConcept) candidates.push(cleaned);

  // Check known item synonym keys
  for (const key of Object.keys(ITEM_SYNONYMS)) {
    if (new RegExp(`\\b${key}\\b`, 'i').test(qLower) && !candidates.includes(key)) {
      candidates.push(key);
    }
  }

  // Check common merchants
  const commonMerchants = [
    'swiggy', 'zomato', 'uber', 'ola', 'amazon', 'flipkart', 'blinkit',
    'zepto', 'starbucks', 'mcdonalds', 'kfc', 'netflix', 'spotify',
    'apple', 'google', 'airtel', 'jio', 'dunzo', 'myntra', 'nykaa',
    'bigbasket', 'instamart', 'rapido', 'dominos', 'eatclub',
  ];
  for (const m of commonMerchants) {
    if (new RegExp(`\\b${m}\\b`, 'i').test(qLower) && !candidates.includes(m)) {
      candidates.push(m);
    }
  }

  // Scan user's transaction descriptions
  for (const tx of transactions) {
    const desc = (tx.description || '').trim().toLowerCase();
    if (
      desc.length >= 3 &&
      new RegExp(`\\b${desc}\\b`, 'i').test(qLower) &&
      !candidates.includes(desc)
    ) {
      candidates.push(desc);
    }
  }

  // Evaluate candidates
  for (const cand of candidates) {
    const candLower = cand.toLowerCase();
    const synData = ITEM_SYNONYMS[candLower];
    const searchTerms = Array.from(
      new Set([candLower, ...(synData?.synonyms || [])]),
    );
    const categoryHint = synData?.categoryHint;

    const matchedTxs = transactions.filter((t) => {
      if (t.type && t.type !== 'EXPENSE') return false;
      const desc = (t.description || '').toLowerCase();
      const notes = (t.notes || '').toLowerCase();
      const cat = (t.category || '').toLowerCase();

      return searchTerms.some(
        (term) => desc.includes(term) || notes.includes(term) || cat.includes(term),
      );
    });

    if (matchedTxs.length > 0 || synData) {
      const catCounts: Record<string, number> = {};
      for (const t of matchedTxs) {
        const c = t.category || categoryHint || 'Expenses';
        catCounts[c] = (catCounts[c] || 0) + 1;
      }
      const topCat =
        Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ||
        categoryHint ||
        'Expenses';

      return {
        target: candLower,
        display: synData?.display || cand.charAt(0).toUpperCase() + cand.slice(1),
        categoryHint: topCat,
        matchedTxs,
      };
    }
  }

  return null;
}

/**
 * Main 100% Local Query Processing Engine
 * Deterministic, fast, private, and grounded in real user financial data.
 */
export function processLocalZenoQuery(
  rawQuery: string,
  context: LocalZenoContext,
): AIStructuredResponse {
  const query = rawQuery.trim();
  const qLower = query.toLowerCase();
  const { transactions, categories, accounts, aggregates, monthlyBudget = 0 } = context;
  const sym = aggregates.currencySym;

  // ── 1. AFFORDABILITY CHECK ──────────────────────────────────────────────────
  if (
    qLower.includes('can i afford') ||
    qLower.includes('can i buy') ||
    qLower.includes('can i spend') ||
    qLower.startsWith('afford')
  ) {
    const cost = extractAmountFromQuery(query);
    const itemMatch = query.match(/can i afford\s*(?:a|an)?\s*([^\d₹$]*?)(?:for|worth|costing)?\s*(?:₹|\$|rs\.?|inr)?\s*(\d[\d,]*)/i);
    const item = (itemMatch?.[1] || '').trim() || 'this purchase';

    if (cost && cost > 0) {
      const currentBalance = aggregates.totalBalance;
      const budgetRemaining = aggregates.monthlyBudget > 0 ? aggregates.budgetRemaining : currentBalance;
      const safeBuffer = Math.max(0, Math.min(currentBalance, budgetRemaining));
      const postBalance = Math.max(0, currentBalance - cost);
      const postBudget = budgetRemaining - cost;

      let canAfford = false;
      let status: 'SAFE' | 'CAUTION' | 'NOT_RECOMMENDED' = 'NOT_RECOMMENDED';
      let verdict = '';
      let advice = '';

      if (cost <= safeBuffer * 0.75) {
        canAfford = true;
        status = 'SAFE';
        verdict = `Safe purchase! You can comfortably afford ${sym}${cost.toLocaleString()}.`;
        advice = `You have ample buffer. Your balance after purchase will be ${sym}${postBalance.toLocaleString()}.`;
      } else if (cost <= safeBuffer) {
        canAfford = true;
        status = 'CAUTION';
        verdict = `Feasible, but tight: ${sym}${cost.toLocaleString()} consumes most of your current margin.`;
        advice = `Remaining cushion will be ${sym}${Math.max(0, postBudget).toLocaleString()}. Consider postponing if non-essential.`;
      } else {
        canAfford = false;
        status = 'NOT_RECOMMENDED';
        verdict = `Not recommended: ${sym}${cost.toLocaleString()} exceeds your safe spending allowance.`;
        advice = `This purchase would exceed your budget margin by ${sym}${Math.abs(postBudget).toLocaleString()}.`;
      }

      const card: AIAffordabilityData = {
        type: 'affordability',
        item,
        cost: `${sym}${cost.toLocaleString()}`,
        canAfford,
        status,
        currentBalance: `${sym}${currentBalance.toLocaleString()}`,
        postPurchaseBalance: `${sym}${postBalance.toLocaleString()}`,
        impactOnBudget: aggregates.monthlyBudget > 0
          ? `${Math.round((cost / aggregates.monthlyBudget) * 100)}% of monthly budget`
          : `${Math.round((cost / (currentBalance || 1)) * 100)}% of liquid balance`,
        advice,
      };

      return {
        text: verdict,
        cards: [card],
        followUps: [
          { label: 'Check my budget', query: 'How healthy is my budget?' },
          { label: 'Where is my money going?', query: 'Where am I spending the most?' },
        ],
        mascotReaction: status === 'SAFE' ? 'SUCCESS' : status === 'CAUTION' ? 'WARNING' : 'ERROR',
      };
    }
  }

  // ── 1B. ANNUAL SAVINGS CALCULATOR ("If I save ₹3,000 every month...") ──────────
  if (
    (qLower.includes('if i save') || qLower.includes('save') || qLower.includes('saving')) &&
    (qLower.includes('in a year') || qLower.includes('every month') || qLower.includes('per month') || qLower.includes('yearly') || qLower.includes('annual'))
  ) {
    const rawSavings = extractAmountFromQuery(query) || 3000;
    const monthlySavings = Math.max(100, rawSavings);
    const yearlyTotal = monthlySavings * 12;

    // Compounded 7% benchmark investment growth
    const r = 0.07 / 12;
    const fv = monthlySavings * ((Math.pow(1 + r, 12) - 1) / r) * (1 + r);
    const investedReturn = Math.round(fv);
    const gain = Math.max(0, investedReturn - yearlyTotal);

    const card: AIComparisonData = {
      type: 'comparison',
      title: '1-Year Savings Projection',
      currentLabel: 'Direct Cash Savings',
      currentAmount: `${sym}${yearlyTotal.toLocaleString()}`,
      previousLabel: 'Invested at 7% p.a.',
      previousAmount: `${sym}${investedReturn.toLocaleString()}`,
      diffAmount: `+${sym}${gain.toLocaleString()}`,
      diffPercentage: Math.round((gain / yearlyTotal) * 100),
      direction: 'higher',
      verdict: `Saving ${sym}${monthlySavings.toLocaleString()}/mo accumulates ${sym}${yearlyTotal.toLocaleString()} cash in 1 year (${sym}${investedReturn.toLocaleString()} with 7% growth).`,
    };

    return {
      text: `If you save **${sym}${monthlySavings.toLocaleString()} every month**, you will build **${sym}${yearlyTotal.toLocaleString()}** in pure cash savings by year-end. If invested in a diversified 7% annual yield portfolio, it grows to **${sym}${investedReturn.toLocaleString()}** (+**${sym}${gain.toLocaleString()}** returns).`,
      cards: [card],
      followUps: [
        { label: 'What is my net cash flow?', query: 'What is my net cash flow?' },
        { label: 'Which category has savings opportunity?', query: 'Which category has the biggest opportunity for savings?' },
        { label: 'How healthy is my budget?', query: 'How healthy is my budget?' },
      ],
      mascotReaction: 'SUCCESS',
    };
  }

  // ── 1C. WEEKEND VS WEEKDAY BREAKDOWN ─────────────────────────────────────────
  if (
    qLower.includes('weekend') ||
    qLower.includes('weekends') ||
    (qLower.includes('weekday') && qLower.includes('spend'))
  ) {
    const now = new Date();
    let weekendSpend = 0;
    let weekendCount = 0;
    let weekdaySpend = 0;
    let weekdayCount = 0;

    for (const t of transactions) {
      if (t.type && t.type !== 'EXPENSE') continue;
      const d = new Date(t.date || t.createdAt);
      if (isNaN(d.getTime())) continue;
      if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
        const amt = Number(t.amount) || 0;
        const day = d.getDay();
        if (day === 0 || day === 6) {
          weekendSpend += amt;
          weekendCount++;
        } else {
          weekdaySpend += amt;
          weekdayCount++;
        }
      }
    }

    const totalSplit = weekendSpend + weekdaySpend;
    const weekendPct = totalSplit > 0 ? Math.round((weekendSpend / totalSplit) * 100) : 0;
    const weekdayPct = totalSplit > 0 ? Math.round((weekdaySpend / totalSplit) * 100) : 0;
    const isWeekendHigher = weekendSpend > weekdaySpend;

    const card: AIComparisonData = {
      type: 'comparison',
      title: 'Weekend vs Weekday Spend',
      currentLabel: 'Weekdays (Mon–Fri)',
      currentAmount: `${sym}${weekdaySpend.toLocaleString()}`,
      previousLabel: 'Weekends (Sat–Sun)',
      previousAmount: `${sym}${weekendSpend.toLocaleString()}`,
      diffAmount: `${isWeekendHigher ? '+' : '-'}${sym}${Math.abs(weekendSpend - weekdaySpend).toLocaleString()}`,
      diffPercentage: weekendPct,
      direction: isWeekendHigher ? 'higher' : 'lower',
      verdict: totalSplit > 0
        ? `Weekends account for ${weekendPct}% of spending (${weekendCount} txns), while weekdays represent ${weekdayPct}% (${weekdayCount} txns).`
        : 'No expense transactions recorded yet this month.',
    };

    return {
      text: `In ${aggregates.currentMonthName}, you spent **${sym}${weekendSpend.toLocaleString()}** on weekends (${weekendPct}%, ${weekendCount} txns) compared to **${sym}${weekdaySpend.toLocaleString()}** on weekdays (${weekdayPct}%, ${weekdayCount} txns).`,
      cards: [card],
      followUps: [
        { label: 'Which category has savings opportunity?', query: 'Which category has the biggest opportunity for savings?' },
        { label: 'Where is my money going?', query: 'Where am I spending the most?' },
        { label: 'Show biggest expenses', query: 'Show my biggest expenses' },
      ],
      mascotReaction: weekendPct > 45 ? 'WARNING' : 'SUCCESS',
    };
  }

  // ── 1D. MONTH-END PROJECTION / BURN RATE ─────────────────────────────────────
  if (
    qLower.includes('continue spending') ||
    qLower.includes('by month-end') ||
    qLower.includes('month end') ||
    qLower.includes('projected spend') ||
    qLower.includes('projected total') ||
    qLower.includes('burn rate') ||
    qLower.includes('at this rate') ||
    (qLower.includes('continue') && qLower.includes('spend'))
  ) {
    const daysElapsed = Math.max(1, aggregates.currentDay);
    const dailyBurnRate = Math.round(aggregates.currentMonthExpense / daysElapsed);
    const projectedTotal = Math.round(dailyBurnRate * aggregates.daysInMonth);
    const effectiveBudget = aggregates.monthlyBudget > 0 ? aggregates.monthlyBudget : (monthlyBudget > 0 ? monthlyBudget : 0);

    const isOver = effectiveBudget > 0 && projectedTotal > effectiveBudget;
    const diff = effectiveBudget > 0 ? Math.abs(projectedTotal - effectiveBudget) : 0;

    const card: AIStatCardData = {
      type: 'stat',
      title: 'Projected Month-End Spend',
      value: `${sym}${projectedTotal.toLocaleString()}`,
      subtitle: `Burn rate: ${sym}${dailyBurnRate.toLocaleString()}/day across ${aggregates.daysInMonth} days`,
      trend: isOver ? 'up' : 'down',
      changeText: effectiveBudget > 0
        ? (isOver ? `Over budget by ${sym}${diff.toLocaleString()}` : `Under budget by ${sym}${diff.toLocaleString()}`)
        : `Avg ${sym}${dailyBurnRate.toLocaleString()}/day`,
      tag: 'Projection',
    };

    const textVerdict = effectiveBudget > 0
      ? `At your current pace of **${sym}${dailyBurnRate.toLocaleString()}/day**, you are projected to spend **${sym}${projectedTotal.toLocaleString()}** by month-end. ${isOver ? `That would exceed your monthly budget by **${sym}${diff.toLocaleString()}**.` : `You will finish safely within your budget.`}`
      : `At your current pace of **${sym}${dailyBurnRate.toLocaleString()}/day**, you are on track to spend **${sym}${projectedTotal.toLocaleString()}** by the end of ${aggregates.currentMonthName}.`;

    return {
      text: textVerdict,
      cards: [card],
      followUps: [
        { label: 'How much should I limit daily spend?', query: 'How much should I limit my daily spending to stay within budget?' },
        { label: 'What is my average daily spend?', query: 'What is my average daily spending this month?' },
        { label: 'How healthy is my budget?', query: 'How healthy is my budget?' },
        { label: 'Which category has savings opportunity?', query: 'Which category has the biggest opportunity for savings?' },
      ],
      mascotReaction: isOver ? 'WARNING' : 'SUCCESS',
    };
  }

  // ── 1E. SAFE DAILY SPENDING LIMIT ───────────────────────────────────────────
  if (
    qLower.includes('limit my daily spending') ||
    qLower.includes('limit daily') ||
    qLower.includes('stay within budget') ||
    qLower.includes('safe daily limit') ||
    (qLower.includes('daily') && qLower.includes('limit')) ||
    (qLower.includes('limit') && qLower.includes('spend'))
  ) {
    const effectiveBudget = aggregates.monthlyBudget > 0
      ? aggregates.monthlyBudget
      : (monthlyBudget > 0 ? monthlyBudget : Math.round(aggregates.currentMonthExpense * 1.25));

    const remainingBudget = Math.max(0, effectiveBudget - aggregates.currentMonthExpense);
    const daysRemaining = Math.max(1, aggregates.daysRemaining);
    const safeDailyLimit = Math.round(remainingBudget / daysRemaining);

    const card: AIStatCardData = {
      type: 'stat',
      title: 'Safe Daily Spending Limit',
      value: `${sym}${safeDailyLimit.toLocaleString()}/day`,
      subtitle: `${sym}${remainingBudget.toLocaleString()} remaining allowance for ${daysRemaining} days`,
      trend: safeDailyLimit > 0 ? 'neutral' : 'down',
      tag: 'Daily Target',
    };

    return {
      text: `To stay within your **${sym}${effectiveBudget.toLocaleString()}** budget, cap your spending at **${sym}${safeDailyLimit.toLocaleString()} per day** for the remaining **${daysRemaining} days** of ${aggregates.currentMonthName}.`,
      cards: [card],
      followUps: [
        { label: 'How much can I spend today?', query: 'How much can I spend today based on my remaining budget?' },
        { label: 'Projected month-end spend', query: 'If I continue spending like this, how much will I spend by month-end?' },
        { label: 'Which category has savings opportunity?', query: 'Which category has the biggest opportunity for savings?' },
      ],
      mascotReaction: safeDailyLimit > 0 ? 'SUCCESS' : 'WARNING',
    };
  }

  // ── 1F. TODAY'S SAFE ALLOWANCE ──────────────────────────────────────────────
  if (
    qLower.includes('spend today based on') ||
    qLower.includes('spend today') ||
    qLower.includes('can i spend today') ||
    qLower.includes("today's safe allowance") ||
    qLower.includes("today's allowance") ||
    qLower.includes('today safe limit')
  ) {
    const effectiveBudget = aggregates.monthlyBudget > 0
      ? aggregates.monthlyBudget
      : (monthlyBudget > 0 ? monthlyBudget : Math.round(aggregates.currentMonthExpense * 1.25));

    const remaining = Math.max(0, effectiveBudget - aggregates.currentMonthExpense);
    const daysRemaining = Math.max(1, aggregates.daysRemaining);
    const safeToday = Math.round(remaining / daysRemaining);

    const todayStr = new Date().toISOString().split('T')[0];
    const todaySpent = transactions
      .filter((t) => (t.type === 'EXPENSE' || !t.type) && (t.date === todayStr || t.createdAt?.startsWith(todayStr)))
      .reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const leftToday = Math.max(0, safeToday - todaySpent);

    const card: AIStatCardData = {
      type: 'stat',
      title: "Today's Safe Allowance",
      value: `${sym}${safeToday.toLocaleString()}`,
      subtitle: todaySpent > 0
        ? `Spent ${sym}${todaySpent.toLocaleString()} today • ${sym}${leftToday.toLocaleString()} safe margin remaining`
        : `Full allowance available (${daysRemaining} days remaining in month)`,
      trend: leftToday > 0 ? 'up' : 'down',
      tag: 'Today',
    };

    return {
      text: `Based on your remaining monthly cushion of **${sym}${remaining.toLocaleString()}**, your safe allowance for today is **${sym}${safeToday.toLocaleString()}**${todaySpent > 0 ? ` (you have logged **${sym}${todaySpent.toLocaleString()}** today, leaving **${sym}${leftToday.toLocaleString()}**)` : ''}.`,
      cards: [card],
      followUps: [
        { label: 'How healthy is my budget?', query: 'How healthy is my budget?' },
        { label: 'Projected month-end spend', query: 'If I continue spending like this, how much will I spend by month-end?' },
        { label: 'Where is my money going?', query: 'Where am I spending the most?' },
      ],
      mascotReaction: leftToday > 0 ? 'SUCCESS' : 'WARNING',
    };
  }

  // ── 1G. AVERAGE DAILY SPENDING THIS MONTH ───────────────────────────────────
  if (
    qLower.includes('average daily spending') ||
    qLower.includes('average daily spend') ||
    qLower.includes('daily average') ||
    qLower.includes('average per day') ||
    (qLower.includes('average') && qLower.includes('day') && !qLower.includes('limit'))
  ) {
    const daysElapsed = Math.max(1, aggregates.currentDay);
    const dailyAvg = Math.round(aggregates.currentMonthExpense / daysElapsed);
    const targetDaily = aggregates.monthlyBudget > 0
      ? Math.round(aggregates.monthlyBudget / aggregates.daysInMonth)
      : (monthlyBudget > 0 ? Math.round(monthlyBudget / aggregates.daysInMonth) : null);

    const card: AIStatCardData = {
      type: 'stat',
      title: 'Average Daily Spending',
      value: `${sym}${dailyAvg.toLocaleString()}/day`,
      subtitle: targetDaily
        ? `Target pace: ${sym}${targetDaily.toLocaleString()}/day • Day ${aggregates.currentDay} of ${aggregates.daysInMonth}`
        : `Logged across ${aggregates.currentDay} days in ${aggregates.currentMonthName}`,
      trend: targetDaily ? (dailyAvg > targetDaily ? 'up' : 'down') : 'neutral',
      changeText: targetDaily
        ? (dailyAvg > targetDaily ? 'Pacing above target' : 'Within target pace')
        : undefined,
      tag: 'Daily Pace',
    };

    return {
      text: `You are spending an average of **${sym}${dailyAvg.toLocaleString()} per day** in ${aggregates.currentMonthName}${targetDaily ? ` against a target daily allowance of **${sym}${targetDaily.toLocaleString()}/day**` : ''}.`,
      cards: [card],
      followUps: [
        { label: 'If I continue like this, month-end?', query: 'If I continue spending like this, how much will I spend by month-end?' },
        { label: 'How much should I limit daily spend?', query: 'How much should I limit my daily spending to stay within budget?' },
        { label: 'Weekend vs weekday spending', query: 'How much did I spend on weekends compared with weekdays?' },
      ],
      mascotReaction: targetDaily && dailyAvg > targetDaily ? 'WARNING' : 'SUCCESS',
    };
  }

  // ── 1H. DISCRETIONARY SAVINGS OPPORTUNITY ───────────────────────────────────
  if (
    qLower.includes('opportunity for savings') ||
    qLower.includes('biggest opportunity') ||
    qLower.includes('where can i save') ||
    qLower.includes('cut back') ||
    qLower.includes('reduce spending') ||
    qLower.includes('save more money')
  ) {
    const discretionaryKeywords = [
      'food', 'dining', 'eating', 'shopping', 'entertainment', 'coffee',
      'drinks', 'subscriptions', 'leisure', 'travel', 'clothing',
    ];

    const discretionaryCat = aggregates.categoryBreakdown.find((c) =>
      discretionaryKeywords.some((k) => c.name.toLowerCase().includes(k)),
    ) || aggregates.categoryBreakdown[0];

    if (!discretionaryCat || discretionaryCat.amount <= 0) {
      const zeroCard: AIStatCardData = {
        type: 'stat',
        title: 'Savings Opportunity',
        value: `${sym}0`,
        subtitle: 'Log categorized expenses to unlock savings insights',
        tag: 'Optimization',
      };
      return {
        text: `You don't have enough categorized expenses logged in ${aggregates.currentMonthName} to identify savings opportunities yet. Tap **+** to log your expenses!`,
        cards: [zeroCard],
        followUps: [
          { label: 'How much did I spend this month?', query: 'How much did I spend this month?' },
          { label: 'How healthy is my budget?', query: 'How healthy is my budget?' },
        ],
        mascotReaction: 'IDLE',
      };
    }

    const monthlyCut = Math.round(discretionaryCat.amount * 0.2);
    const annualPotential = monthlyCut * 12;

    const card: AIStatCardData = {
      type: 'stat',
      title: 'Monthly Savings Potential',
      value: `+${sym}${monthlyCut.toLocaleString()}/mo`,
      subtitle: `Trim 20% in ${discretionaryCat.name} • Saves ${sym}${annualPotential.toLocaleString()} yearly`,
      trend: 'down',
      changeText: `${discretionaryCat.percentage}% of total spend`,
      tag: discretionaryCat.name,
    };

    return {
      text: `Your biggest savings opportunity is in **${discretionaryCat.name}**, where you spent **${sym}${discretionaryCat.amount.toLocaleString()}** (${discretionaryCat.percentage}% of your expenses). Trimming this by **20%** frees up **${sym}${monthlyCut.toLocaleString()}** every month (**${sym}${annualPotential.toLocaleString()}** per year).`,
      cards: [card],
      followUps: [
        { label: `Show ${discretionaryCat.name} expenses`, query: `Show my spending in ${discretionaryCat.name}` },
        { label: 'How much should I limit daily spend?', query: 'How much should I limit my daily spending to stay within budget?' },
        { label: 'Save ₹3,000 every month calculator', query: 'If I save ₹3,000 every month, how much will I save in a year?' },
      ],
      mascotReaction: 'SUCCESS',
    };
  }

  // ── 1I. ACCOUNT TRANSFERS BREAKDOWN ─────────────────────────────────────────
  if (
    qLower.includes('transferred between') ||
    qLower.includes('transfer between') ||
    qLower.includes('between my accounts') ||
    qLower.includes('account transfers') ||
    (qLower.includes('transfer') && !qLower.includes('wire'))
  ) {
    const transferTxs = transactions.filter((t) => t.type === 'TRANSFER');
    const totalTransferred = transferTxs.reduce(
      (sum, t) => sum + (Number(t.amount) || 0),
      0,
    );

    const cards: AIStructuredCard[] = [];

    if (transferTxs.length > 0) {
      cards.push({
        type: 'transaction_list',
        title: 'Account Transfers',
        subtitle: `Total: ${sym}${totalTransferred.toLocaleString()} across ${transferTxs.length} transfer${transferTxs.length === 1 ? '' : 's'}`,
        filterType: 'TRANSFER',
        transactions: transferTxs.slice(0, 5).map((t) => ({
          id: t.id,
          description: t.description || 'Account Transfer',
          amount: `${sym}${Number(t.amount).toLocaleString()}`,
          date: t.date || (t.createdAt ? t.createdAt.split('T')[0] : 'Recent'),
          category: 'Transfer',
          type: 'TRANSFER',
        })),
      });

      return {
        text: `You have moved **${sym}${totalTransferred.toLocaleString()}** across **${transferTxs.length} transfer${transferTxs.length === 1 ? '' : 's'}** between your accounts. Internal transfers don't change your overall net worth.`,
        cards,
        followUps: [
          { label: 'What is my total account balance?', query: 'What is my total account balance?' },
          { label: 'Show recent transactions', query: 'Show my recent transactions' },
          { label: 'What is my net cash flow?', query: 'What is my net cash flow?' },
        ],
        mascotReaction: 'SUCCESS',
      };
    } else {
      cards.push({
        type: 'stat',
        title: 'Account Transfers',
        value: `${sym}0`,
        subtitle: 'No inter-account transfers logged',
        tag: 'Transfers',
      });

      return {
        text: `You haven't logged any transfers between accounts yet. Internal transfers help track money moving between banks without affecting your expenses.`,
        cards,
        followUps: [
          { label: 'What is my total account balance?', query: 'What is my total account balance?' },
          { label: 'Show recent transactions', query: 'Show my recent transactions' },
        ],
        mascotReaction: 'IDLE',
      };
    }
  }

  // ── 2. MULTI-WIDGET COMPREHENSIVE OVERVIEW ("How am I doing?") ──────────────
  if (
    qLower.includes('how am i doing') ||
    qLower.includes('financial health') ||
    qLower.includes('monthly overview') ||
    qLower.includes('give me a summary') ||
    qLower.includes('financial summary')
  ) {
    const cards: AIStructuredCard[] = [];

    // Widget 1: Spend Stat
    cards.push({
      type: 'stat',
      title: `${aggregates.currentMonthName} Spending`,
      value: `${sym}${aggregates.currentMonthExpense.toLocaleString()}`,
      subtitle: `${aggregates.categoryBreakdown.length} active spending categories`,
      trend: aggregates.monthDiffExpense > 0 ? 'up' : 'down',
      changeText: aggregates.previousMonthExpense > 0
        ? `${aggregates.monthDiffExpense > 0 ? '+' : ''}${aggregates.monthDiffPercent}% vs last month`
        : undefined,
      tag: 'This Month',
    });

    // Widget 2: Category Breakdown
    if (aggregates.categoryBreakdown.length > 0) {
      cards.push({
        type: 'category_breakdown',
        title: 'Where Your Money Went',
        totalAmount: `${sym}${aggregates.currentMonthExpense.toLocaleString()}`,
        period: aggregates.currentMonthName,
        categories: aggregates.categoryBreakdown.slice(0, 4).map((c) => ({
          name: c.name,
          amount: c.amount,
          formattedAmount: `${sym}${c.amount.toLocaleString()}`,
          percentage: c.percentage,
          color: c.color,
          icon: c.icon,
        })),
      });
    }

    // Widget 3: Budget Health (if configured)
    if (aggregates.monthlyBudget > 0) {
      cards.push({
        type: 'budget_health',
        title: 'Monthly Budget Pace',
        totalBudget: `${sym}${aggregates.monthlyBudget.toLocaleString()}`,
        spentAmount: `${sym}${aggregates.budgetSpent.toLocaleString()}`,
        remainingAmount: `${sym}${aggregates.budgetRemaining.toLocaleString()}`,
        percentageUsed: aggregates.budgetPercentUsed,
        daysRemainingInMonth: aggregates.daysRemaining,
        paceStatus: aggregates.budgetPaceStatus,
        verdict: aggregates.budgetPaceStatus === 'on_track'
          ? 'On track to stay within budget'
          : aggregates.budgetPaceStatus === 'caution'
            ? 'Pace is slightly elevated'
            : 'Over monthly budget allowance',
      });
    }

    return {
      text: `Here is your financial snapshot for ${aggregates.currentMonthName}: you've spent ${sym}${aggregates.currentMonthExpense.toLocaleString()} so far.`,
      cards,
      followUps: [
        { label: 'Compare with last month', query: 'Compare my spending to last month' },
        { label: 'Show biggest expenses', query: 'Show my biggest expenses' },
      ],
      mascotReaction: aggregates.budgetPaceStatus === 'over_budget' ? 'WARNING' : 'SUCCESS',
    };
  }

  // ── 3. MONTH-OVER-MONTH COMPARISON ──────────────────────────────────────────
  if (
    qLower.includes('compare') ||
    qLower.includes('last month') ||
    qLower.includes('vs last month') ||
    qLower.includes('previous month') ||
    qLower.includes('what changed')
  ) {
    const direction = aggregates.monthDiffExpense > 0 ? 'higher' : aggregates.monthDiffExpense < 0 ? 'lower' : 'same';
    const verdict =
      direction === 'lower'
        ? `Great job! You are spending ${Math.abs(aggregates.monthDiffPercent)}% less than last month.`
        : direction === 'higher'
          ? `You have spent ${aggregates.monthDiffPercent}% more than this time last month.`
          : 'Your spending is roughly even with last month.';

    const comparisonCard: AIComparisonData = {
      type: 'comparison',
      title: 'Spending vs Last Month',
      currentLabel: aggregates.currentMonthName,
      currentAmount: `${sym}${aggregates.currentMonthExpense.toLocaleString()}`,
      previousLabel: 'Previous Month',
      previousAmount: `${sym}${aggregates.previousMonthExpense.toLocaleString()}`,
      diffAmount: `${direction === 'higher' ? '+' : '-'}${sym}${Math.abs(aggregates.monthDiffExpense).toLocaleString()}`,
      diffPercentage: Math.abs(aggregates.monthDiffPercent),
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

  // ── 4. CATEGORY BREAKDOWN / "WHERE DID I SPEND THE MOST" ────────────────────
  if (
    qLower.includes('where did i spend') ||
    qLower.includes('where is my money going') ||
    qLower.includes('category breakdown') ||
    qLower.includes('top category') ||
    qLower.includes('top categories') ||
    qLower.includes('cost me the most') ||
    qLower.includes('spending breakdown')
  ) {
    if (aggregates.categoryBreakdown.length === 0) {
      return {
        text: `You haven't logged any category expenses for ${aggregates.currentMonthName} yet. Tap the **+** button to log your first expense!`,
        mascotReaction: 'IDLE',
      };
    }

    const topCat = aggregates.categoryBreakdown[0];
    const card: AICategoryBreakdownData = {
      type: 'category_breakdown',
      title: 'Spending by Category',
      totalAmount: `${sym}${aggregates.currentMonthExpense.toLocaleString()}`,
      period: aggregates.currentMonthName,
      categories: aggregates.categoryBreakdown.slice(0, 5).map((c) => ({
        name: c.name,
        amount: c.amount,
        formattedAmount: `${sym}${c.amount.toLocaleString()}`,
        percentage: c.percentage,
        color: c.color,
        icon: c.icon,
      })),
    };

    return {
      text: `Your biggest category is ${topCat.name} (${sym}${topCat.amount.toLocaleString()}), accounting for ${topCat.percentage}% of your expenses.`,
      cards: [card],
      followUps: [
        { label: 'Compare with last month', query: 'Compare my spending to last month' },
        { label: 'Show recent transactions', query: 'Show my recent expenses' },
      ],
      mascotReaction: 'SUCCESS',
    };
  }

  // ── 5. SPECIFIC ITEM, MERCHANT, OR EXPENSE DEEP-DIVE (e.g. "Spent on petrol") ──
  const itemMatch = extractItemOrMerchantQuery(query, transactions, categories);
  if (itemMatch) {
    const { display, categoryHint = 'Expenses', matchedTxs } = itemMatch;
    const count = matchedTxs.length;

    if (count > 0) {
      const totalAmount = matchedTxs.reduce(
        (sum, t) => sum + (Number(t.amount) || 0),
        0,
      );

      const cards: AIStructuredCard[] = [
        {
          type: 'stat',
          title: `Spent on ${display}`,
          value: `${sym}${totalAmount.toLocaleString()}`,
          subtitle: `${count} transaction${count === 1 ? '' : 's'} • Categorized under ${categoryHint}`,
          tag: categoryHint,
        },
        {
          type: 'transaction_list',
          title: `${display} Expenses`,
          subtitle: `Total ${sym}${totalAmount.toLocaleString()} • ${count} logged`,
          category: categoryHint,
          filterQuery: display.toLowerCase() !== categoryHint.toLowerCase() ? display : undefined,
          filterType: 'EXPENSE',
          transactions: matchedTxs.slice(0, 6).map((t) => ({
            id: t.id,
            description: t.description || display,
            amount: `${sym}${Number(t.amount).toLocaleString()}`,
            date: t.date || (t.createdAt ? t.createdAt.split('T')[0] : 'Recent'),
            category: t.category || categoryHint,
            type: (t.type || 'EXPENSE') as 'INCOME' | 'EXPENSE' | 'TRANSFER',
          })),
        },
      ];

      return {
        text: `You have spent **${sym}${totalAmount.toLocaleString()}** on **${display}** across ${count} transaction${count === 1 ? '' : 's'}, categorized under **${categoryHint}**.`,
        cards,
        followUps: [
          {
            label: `Show all ${categoryHint} expenses`,
            query: `Show my spending in ${categoryHint}`,
          },
          {
            label: 'Where is my money going?',
            query: 'Where am I spending the most?',
          },
          {
            label: 'Compare to last month',
            query: 'Compare my spending to last month',
          },
        ],
        mascotReaction: 'SUCCESS',
      };
    } else if (
      qLower.includes('spend') ||
      qLower.includes('spent') ||
      qLower.includes('cost') ||
      qLower.includes('how much') ||
      qLower.includes('expense') ||
      qLower.includes(itemMatch.target)
    ) {
      const zeroCard: AIStatCardData = {
        type: 'stat',
        title: `${display} Spending`,
        value: `${sym}0`,
        subtitle: `No expenses logged yet • Typically under ${categoryHint}`,
        tag: 'Zero Spent',
      };

      return {
        text: `You haven't logged any expenses for **${display}** yet. If you recently bought **${display}**, tap the **+** button to log it under **${categoryHint}**.`,
        cards: [zeroCard],
        followUps: [
          {
            label: `Show all ${categoryHint} expenses`,
            query: `Show my spending in ${categoryHint}`,
          },
          {
            label: 'Where is my money going?',
            query: 'Where am I spending the most?',
          },
          {
            label: 'How much did I spend this month?',
            query: 'How much did I spend this month?',
          },
        ],
        mascotReaction: 'IDLE',
      };
    }
  }

  // ── 6. BUDGET HEALTH & PACING ───────────────────────────────────────────────
  if (
    qLower.includes('budget') ||
    qLower.includes('pace') ||
    qLower.includes('on track') ||
    qLower.includes('how much can i spend') ||
    qLower.includes('remaining') ||
    qLower.includes('check my budget') ||
    qLower.includes('how healthy is my budget') ||
    qLower.includes('healthy is my budget')
  ) {
    const effectiveBudget = aggregates.monthlyBudget > 0
      ? aggregates.monthlyBudget
      : (monthlyBudget > 0 ? monthlyBudget : 0);

    if (effectiveBudget > 0) {
      const spent = aggregates.budgetSpent;
      const remaining = Math.max(0, effectiveBudget - spent);
      const percentUsed = Math.round((spent / effectiveBudget) * 100);
      const daysInMonth = aggregates.daysInMonth || 30;
      const monthProgressPct = Math.round((aggregates.currentDay / daysInMonth) * 100);

      let paceStatus: 'on_track' | 'caution' | 'over_budget' = 'on_track';
      if (spent > effectiveBudget) {
        paceStatus = 'over_budget';
      } else if (percentUsed > monthProgressPct + 15) {
        paceStatus = 'caution';
      }

      const card: AIBudgetHealthData = {
        type: 'budget_health',
        title: 'Monthly Budget Health',
        totalBudget: `${sym}${effectiveBudget.toLocaleString()}`,
        spentAmount: `${sym}${spent.toLocaleString()}`,
        remainingAmount: `${sym}${remaining.toLocaleString()}`,
        percentageUsed: percentUsed,
        daysRemainingInMonth: aggregates.daysRemaining,
        paceStatus,
        verdict: paceStatus === 'on_track'
          ? `On track! You have ${sym}${remaining.toLocaleString()} remaining for the next ${aggregates.daysRemaining} days.`
          : paceStatus === 'caution'
            ? `Pace is elevated: You have used ${percentUsed}% of your budget with ${aggregates.daysRemaining} days left.`
            : `Over budget: You have exceeded your allowance by ${sym}${(spent - effectiveBudget).toLocaleString()}!`,
      };

      return {
        text: `You have spent **${sym}${spent.toLocaleString()}** of your **${sym}${effectiveBudget.toLocaleString()}** budget (**${percentUsed}%** used, with **${aggregates.daysRemaining} days** left in ${aggregates.currentMonthName}).`,
        cards: [card],
        followUps: [
          { label: 'How much can I spend today?', query: 'How much can I spend today based on my remaining budget?' },
          { label: 'Projected month-end spend', query: 'If I continue spending like this, how much will I spend by month-end?' },
          { label: 'Which category has savings opportunity?', query: 'Which category has the biggest opportunity for savings?' },
        ],
        mascotReaction: paceStatus === 'on_track' ? 'SUCCESS' : 'WARNING',
      };
    } else {
      // Benchmark guidance when no explicit budget configured
      const benchmark = aggregates.currentMonthIncome > 0
        ? Math.round(aggregates.currentMonthIncome * 0.8)
        : Math.round(aggregates.currentMonthExpense * 1.25);

      const remaining = Math.max(0, benchmark - aggregates.currentMonthExpense);
      const pct = benchmark > 0 ? Math.min(100, Math.round((aggregates.currentMonthExpense / benchmark) * 100)) : 100;

      const card: AIBudgetHealthData = {
        type: 'budget_health',
        title: 'Monthly Budget Health',
        totalBudget: benchmark > 0 ? `Target: ~${sym}${benchmark.toLocaleString()}` : 'Uncapped',
        spentAmount: `${sym}${aggregates.currentMonthExpense.toLocaleString()}`,
        remainingAmount: `${sym}${remaining.toLocaleString()}`,
        percentageUsed: pct,
        daysRemainingInMonth: aggregates.daysRemaining,
        paceStatus: 'caution',
        verdict: `You haven't set a monthly budget in Zeno. Set one in the Budgets tab to unlock automated burn-rate alerts!`,
      };

      return {
        text: `You haven't set a monthly budget cap yet. You have spent **${sym}${aggregates.currentMonthExpense.toLocaleString()}** so far in ${aggregates.currentMonthName}. Tap the **Budgets** tab to set your monthly limit!`,
        cards: [card],
        followUps: [
          { label: 'How much did I spend this month?', query: 'How much did I spend this month?' },
          { label: 'Where is my money going?', query: 'Where am I spending the most?' },
          { label: 'If I continue spending like this', query: 'If I continue spending like this, how much will I spend by month-end?' },
        ],
        mascotReaction: 'IDLE',
      };
    }
  }

  // ── 7. SPECIFIC CATEGORY DEEP-DIVE (Food, Shopping, etc.) ───────────────────
  const detectedCat = detectCategoryInQuery(query, categories);
  if (detectedCat) {
    const catName = detectedCat.name;
    const catTxs = transactions.filter(
      (t) => (t.type === 'EXPENSE' || !t.type) && t.category?.toLowerCase() === catName.toLowerCase(),
    );
    const catTotal = catTxs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const catPct = aggregates.currentMonthExpense > 0
      ? Math.round((catTotal / aggregates.currentMonthExpense) * 100)
      : 0;

    const cards: AIStructuredCard[] = [];

    // Main Stat Card
    cards.push({
      type: 'stat',
      title: `${catName} Spending`,
      value: `${sym}${catTotal.toLocaleString()}`,
      subtitle: `${catPct}% of your total spending (${catTxs.length} transactions)`,
      tag: 'Category',
    });

    // If transactions exist, show top/recent transactions in that category
    if (catTxs.length > 0) {
      cards.push({
        type: 'transaction_list',
        title: `Recent ${catName} Expenses`,
        category: catName,
        filterType: 'EXPENSE',
        transactions: catTxs.slice(0, 4).map((t) => ({
          id: t.id,
          description: t.description || catName,
          amount: `${sym}${Number(t.amount).toLocaleString()}`,
          date: t.date || (t.createdAt ? t.createdAt.split('T')[0] : 'Recent'),
          category: catName,
          type: 'EXPENSE',
        })),
      });
    }

    return {
      text: `You have spent ${sym}${catTotal.toLocaleString()} in ${catName} across ${catTxs.length} transaction${catTxs.length === 1 ? '' : 's'}.`,
      cards,
      followUps: [
        { label: 'Where is my money going?', query: 'Where am I spending the most?' },
        { label: 'Compare to last month', query: 'Compare my spending to last month' },
      ],
      mascotReaction: 'SUCCESS',
    };
  }

  // ── 8. MERCHANT SEARCH & FILTER ─────────────────────────────────────────────
  const detectedMerchant = detectMerchantInQuery(query, transactions);
  if (detectedMerchant) {
    const merchantTxs = transactions.filter((t) =>
      (t.description || '').toLowerCase().includes(detectedMerchant.toLowerCase()),
    );
    const totalSpent = merchantTxs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const card: AITransactionListData = {
      type: 'transaction_list',
      title: `${detectedMerchant.toUpperCase()} Purchases`,
      subtitle: `Total spent: ${sym}${totalSpent.toLocaleString()} (${merchantTxs.length} transaction${merchantTxs.length === 1 ? '' : 's'})`,
      filterQuery: detectedMerchant,
      filterType: 'EXPENSE',
      transactions: merchantTxs.slice(0, 5).map((t) => ({
        id: t.id,
        description: t.description || detectedMerchant,
        amount: `${sym}${Number(t.amount).toLocaleString()}`,
        date: t.date || (t.createdAt ? t.createdAt.split('T')[0] : 'Recent'),
        category: t.category || 'General',
        type: (t.type || 'EXPENSE') as 'INCOME' | 'EXPENSE' | 'TRANSFER',
      })),
    };

    return {
      text: `You have spent ${sym}${totalSpent.toLocaleString()} at ${detectedMerchant} across ${merchantTxs.length} transaction${merchantTxs.length === 1 ? '' : 's'}.`,
      cards: [card],
      followUps: [
        { label: 'Where is my money going?', query: 'Where am I spending the most?' },
        { label: 'Show biggest expenses', query: 'Show my biggest expenses' },
      ],
      mascotReaction: 'SUCCESS',
    };
  }

  // ── 8. ACCOUNT BALANCES & NET WORTH ─────────────────────────────────────────
  if (
    qLower.includes('balance') ||
    qLower.includes('account') ||
    qLower.includes('how much money do i have') ||
    qLower.includes('net worth') ||
    qLower.includes('which account') ||
    qLower.includes('total money')
  ) {
    const totalBalance = aggregates.totalBalance;
    const palette = ['#00D09E', '#3266FF', '#FF8C69', '#FFD166', '#A066FF'];
    const accountItems: AIAccountItem[] = accounts.map((acc, idx) => {
      let b = Number(acc.openingBalance) || 0;
      for (const tx of transactions) {
        if (tx.accountId === acc.id) {
          if (tx.type === 'INCOME') b += Number(tx.amount) || 0;
          else if (tx.type === 'EXPENSE') b -= Number(tx.amount) || 0;
        } else if (tx.toAccountId === acc.id && tx.type === 'TRANSFER') {
          b += Number(tx.amount) || 0;
        } else if (tx.fromAccountId === acc.id && tx.type === 'TRANSFER') {
          b -= Number(tx.amount) || 0;
        }
      }
      const pct = totalBalance > 0 ? Math.round((Math.max(0, b) / totalBalance) * 100) : 0;
      return {
        id: acc.id,
        name: acc.name,
        type: acc.type || 'Bank',
        balance: `${sym}${b.toLocaleString()}`,
        rawBalance: b,
        percentage: pct,
        color: palette[idx % palette.length],
      };
    }).sort((a, b) => b.rawBalance - a.rawBalance);

    const card: AIAccountBalanceData = {
      type: 'account_balance',
      title: 'Accounts & Balances',
      totalBalance: `${sym}${totalBalance.toLocaleString()}`,
      accounts: accountItems,
    };

    const topAcc = accountItems[0];
    return {
      text: `Your total balance across ${accounts.length} account${accounts.length === 1 ? '' : 's'} is ${sym}${totalBalance.toLocaleString()}.${topAcc ? ` Largest: ${topAcc.name} (${topAcc.balance}).` : ''}`,
      cards: [card],
      followUps: [
        { label: 'How much did I spend this month?', query: 'How much did I spend this month?' },
        { label: 'Check budget health', query: 'How healthy is my budget?' },
      ],
      mascotReaction: 'SUCCESS',
    };
  }

  // ── 9. INCOME & SAVINGS ─────────────────────────────────────────────────────
  if (
    qLower.includes('income') ||
    qLower.includes('earn') ||
    qLower.includes('salary') ||
    qLower.includes('saved') ||
    qLower.includes('savings') ||
    qLower.includes('cash flow')
  ) {
    const income = aggregates.currentMonthIncome;
    const expense = aggregates.currentMonthExpense;
    const savings = income - expense;
    const savingsRate = income > 0 ? Math.round((savings / income) * 100) : 0;

    const statCard: AIStatCardData = {
      type: 'stat',
      title: 'Net Cash Flow',
      value: `${savings >= 0 ? '+' : '-'}${sym}${Math.abs(savings).toLocaleString()}`,
      subtitle: `Income: ${sym}${income.toLocaleString()} • Spent: ${sym}${expense.toLocaleString()}`,
      trend: savings >= 0 ? 'up' : 'down',
      changeText: income > 0 ? `${savingsRate}% savings rate` : undefined,
      tag: 'This Month',
    };

    return {
      text: savings >= 0
        ? `You have saved ${sym}${savings.toLocaleString()} this month (${savingsRate}% savings rate).`
        : `Your expenses exceeded your income by ${sym}${Math.abs(savings).toLocaleString()} this month.`,
      cards: [statCard],
      followUps: [
        { label: 'Where is my money going?', query: 'Where am I spending the most?' },
        { label: 'Compare with last month', query: 'Compare my spending to last month' },
      ],
      mascotReaction: savings >= 0 ? 'SUCCESS' : 'WARNING',
    };
  }

  // ── 10. BIGGEST EXPENSES / EXPENSES ABOVE THRESHOLD ─────────────────────────
  if (
    qLower.includes('biggest') ||
    qLower.includes('largest') ||
    qLower.includes('highest') ||
    qLower.includes('most expensive') ||
    qLower.includes('above') ||
    qLower.includes('greater than')
  ) {
    const threshold = extractAmountFromQuery(query);
    let filteredTxs = transactions.filter((t) => (t.type === 'EXPENSE' || !t.type));

    if (threshold && threshold > 0 && (qLower.includes('above') || qLower.includes('greater than') || qLower.includes('more than'))) {
      filteredTxs = filteredTxs.filter((t) => Number(t.amount) >= threshold);
    }

    filteredTxs.sort((a, b) => Number(b.amount) - Number(a.amount));
    const topTxs = filteredTxs.slice(0, 6);

    if (topTxs.length === 0) {
      const emptyCard: AIStatCardData = {
        type: 'stat',
        title: threshold ? `Expenses Above ${sym}${threshold.toLocaleString()}` : 'Largest Expenses',
        value: `${sym}0`,
        subtitle: threshold ? `No transactions exceeding ${sym}${threshold.toLocaleString()}` : 'No expense records found yet',
        tag: 'Expenses',
      };
      return {
        text: threshold
          ? `No expenses found above ${sym}${threshold.toLocaleString()}.`
          : `No expense records found yet. Tap the **+** button to log your first transaction!`,
        cards: [emptyCard],
        followUps: [
          { label: 'How much did I spend this month?', query: 'How much did I spend this month?' },
          { label: 'Check budget health', query: 'How healthy is my budget?' },
          { label: 'Show recent transactions', query: 'Show my recent transactions' },
        ],
        mascotReaction: 'IDLE',
      };
    }

    const card: AITransactionListData = {
      type: 'transaction_list',
      title: threshold ? `Expenses Above ${sym}${threshold.toLocaleString()}` : 'Largest Expenses',
      subtitle: `Top ${topTxs.length} expense${topTxs.length === 1 ? '' : 's'} sorted by amount`,
      filterType: 'EXPENSE',
      transactions: topTxs.map((t) => ({
        id: t.id,
        description: t.description || 'Expense',
        amount: `${sym}${Number(t.amount).toLocaleString()}`,
        date: t.date || (t.createdAt ? t.createdAt.split('T')[0] : 'Recent'),
        category: t.category || 'General',
        type: 'EXPENSE',
      })),
    };

    const topTx = topTxs[0];
    return {
      text: `Your largest expense is **${topTx.description}** (${sym}${Number(topTx.amount).toLocaleString()}). Here are your highest expenses:`,
      cards: [card],
      followUps: [
        { label: 'Where is my money going?', query: 'Where am I spending the most?' },
        { label: 'Show recent transactions', query: 'Show my recent transactions' },
        { label: 'Check budget health', query: 'How healthy is my budget?' },
      ],
      mascotReaction: 'SUCCESS',
    };
  }

  // ── 11. TIME-BASED SPENDING (Today, This Week, This Month) ───────────────────
  if (
    qLower.includes('today') ||
    qLower.includes('yesterday') ||
    qLower.includes('this week') ||
    qLower.includes('last week') ||
    qLower.includes('how much did i spend') ||
    qLower.includes('total spend') ||
    qLower.includes('total spending')
  ) {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (qLower.includes('today')) {
      const todayTxs = transactions.filter((t) =>
        (t.type === 'EXPENSE' || !t.type) &&
        (t.date === todayStr || (t.createdAt && t.createdAt.startsWith(todayStr))),
      );
      const todayTotal = todayTxs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

      const card: AIStatCardData = {
        type: 'stat',
        title: "Today's Spending",
        value: `${sym}${todayTotal.toLocaleString()}`,
        subtitle: `${todayTxs.length} transaction${todayTxs.length === 1 ? '' : 's'} logged today`,
        tag: 'Today',
      };

      return {
        text: `You have spent ${sym}${todayTotal.toLocaleString()} today across ${todayTxs.length} transaction${todayTxs.length === 1 ? '' : 's'}.`,
        cards: [card],
        followUps: [
          { label: 'How much did I spend this month?', query: 'How much did I spend this month?' },
          { label: 'Where is my money going?', query: 'Where am I spending the most?' },
        ],
        mascotReaction: 'SUCCESS',
      };
    }

    // Default to this month spending
    const topCat = aggregates.categoryBreakdown[0];
    const card: AIStatCardData = {
      type: 'stat',
      title: `${aggregates.currentMonthName} Spending`,
      value: `${sym}${aggregates.currentMonthExpense.toLocaleString()}`,
      subtitle: topCat ? `Top: ${topCat.name} (${sym}${topCat.amount.toLocaleString()})` : 'Across all categories',
      trend: aggregates.monthDiffExpense > 0 ? 'up' : 'down',
      changeText: aggregates.previousMonthExpense > 0
        ? `${aggregates.monthDiffExpense > 0 ? '+' : ''}${aggregates.monthDiffPercent}% vs last month`
        : undefined,
      tag: 'This Month',
    };

    return {
      text: `You have spent ${sym}${aggregates.currentMonthExpense.toLocaleString()} so far in ${aggregates.currentMonthName}.${topCat ? ` Your largest category is ${topCat.name}.` : ''}`,
      cards: [card],
      followUps: [
        { label: 'Where is my money going?', query: 'Where am I spending the most?' },
        { label: 'Compare to last month', query: 'Compare my spending to last month' },
      ],
      mascotReaction: 'SUCCESS',
    };
  }

  // ── 12. RECENT TRANSACTIONS ─────────────────────────────────────────────────
  if (
    qLower.includes('recent') ||
    qLower.includes('latest') ||
    qLower.includes('transactions') ||
    qLower.includes('transaction history')
  ) {
    const sortedTxs = [...transactions].sort((a, b) => {
      const timeA = new Date(a.date || a.createdAt || 0).getTime();
      const timeB = new Date(b.date || b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    const recentTxs = sortedTxs.slice(0, 6);

    if (recentTxs.length === 0) {
      const emptyCard: AIStatCardData = {
        type: 'stat',
        title: 'Recent Transactions',
        value: 'None',
        subtitle: 'No transactions recorded yet in Zeno',
        tag: 'Ledger',
      };
      return {
        text: `No recent transactions found. Tap the **+** button to log your first transaction!`,
        cards: [emptyCard],
        followUps: [
          { label: 'How much did I spend this month?', query: 'How much did I spend this month?' },
          { label: 'Check budget health', query: 'How healthy is my budget?' },
          { label: 'Show biggest expenses', query: 'Show my biggest expenses' },
        ],
        mascotReaction: 'IDLE',
      };
    }

    const card: AITransactionListData = {
      type: 'transaction_list',
      title: 'Recent Transactions',
      subtitle: `Latest ${recentTxs.length} transaction${recentTxs.length === 1 ? '' : 's'} in your ledger`,
      filterType: 'ALL',
      transactions: recentTxs.map((t) => ({
        id: t.id,
        description: t.description || 'Transaction',
        amount: `${t.type === 'INCOME' ? '+' : t.type === 'TRANSFER' ? '⇄' : '-'}${sym}${Number(t.amount).toLocaleString()}`,
        date: t.date || (t.createdAt ? t.createdAt.split('T')[0] : 'Recent'),
        category: t.category || (t.type === 'TRANSFER' ? 'Transfer' : 'General'),
        type: (t.type || 'EXPENSE') as 'INCOME' | 'EXPENSE' | 'TRANSFER',
      })),
    };

    return {
      text: `Here are your recent transactions logged in Zeno:`,
      cards: [card],
      followUps: [
        { label: 'Show biggest expenses', query: 'Show my biggest expenses' },
        { label: 'How much did I spend this month?', query: 'How much did I spend this month?' },
        { label: 'Where is my money going?', query: 'Where am I spending the most?' },
      ],
      mascotReaction: 'SUCCESS',
    };
  }

  // ── 13. GRACEFUL FINANCIAL GUIDANCE (Unknown query fallback) ────────────────
  const topCat = aggregates.categoryBreakdown[0];
  const statCard: AIStatCardData = {
    type: 'stat',
    title: `${aggregates.currentMonthName} Summary`,
    value: `${sym}${aggregates.currentMonthExpense.toLocaleString()}`,
    subtitle: topCat ? `Top: ${topCat.name} (${sym}${topCat.amount.toLocaleString()})` : 'Total spending',
    tag: 'Overview',
  };

  return {
    text: `Here is your current spending summary. Try asking a specific question below:`,
    cards: [statCard],
    followUps: [
      { label: 'How much did I spend this month?', query: 'How much did I spend this month?' },
      { label: 'Where is my money going?', query: 'Where am I spending the most?' },
      { label: 'How healthy is my budget?', query: 'How healthy is my budget?' },
      { label: 'Can I afford ₹5,000?', query: 'Can I afford ₹5,000?' },
    ],
    mascotReaction: 'IDLE',
  };
}
