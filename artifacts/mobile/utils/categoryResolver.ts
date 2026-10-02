import {
  CATEGORY_VISUALS,
  type CategoryVisualDefinition,
  type CategoryVisualId,
} from '@/constants/categoryVisuals';

type CategoryAliasEntry = {
  id: CategoryVisualId;
  keywords: string[];
};

const CATEGORY_ALIASES: CategoryAliasEntry[] = [
  {
    id: 'food',
    keywords: [
      'food', 'food & drinks', 'food and drinks', 'restaurant', 'dining', 'dinner',
      'lunch', 'breakfast', 'cafe', 'coffee', 'tea', 'swiggy', 'zomato', 'snack',
      'meal', 'drinks', 'burger', 'pizza', 'bakery', 'starbucks',
    ],
  },
  {
    id: 'groceries',
    keywords: [
      'groceries', 'grocery', 'supermarket', 'market', 'vegetables', 'fruits',
      'milk', 'bread', 'kirana', 'bigbasket', 'blinkit', 'zepto', 'instamart',
      'provisions', 'organic',
    ],
  },
  {
    id: 'transport',
    keywords: [
      'transport', 'transportation', 'commute', 'taxi', 'cab', 'uber', 'ola',
      'rapido', 'metro', 'bus', 'train', 'petrol', 'fuel', 'auto', 'rickshaw',
      'parking', 'toll', 'flight', 'commute',
    ],
  },
  {
    id: 'shopping',
    keywords: [
      'shopping', 'retail', 'clothes', 'clothing', 'fashion', 'shoes', 'amazon',
      'flipkart', 'myntra', 'electronics', 'apparel', 'store', 'mall', 'purchase',
      'ajio', 'zara', 'h&m',
    ],
  },
  {
    id: 'bills',
    keywords: [
      'bills', 'bills & utilities', 'utilities', 'electricity', 'water', 'internet',
      'wifi', 'recharge', 'mobile bill', 'phone bill', 'gas', 'broadband', 'dth',
      'airtel', 'jio', 'power', 'tax', 'insurance', 'emi',
    ],
  },
  {
    id: 'health',
    keywords: [
      'health', 'healthcare', 'medical', 'medicine', 'hospital', 'doctor',
      'pharmacy', 'clinic', 'dentist', 'apollo', '1mg', 'pharmeasy', 'meds',
      'wellness', 'therapy',
    ],
  },
  {
    id: 'entertainment',
    keywords: [
      'entertainment', 'movies', 'movie', 'cinema', 'netflix', 'spotify',
      'hotstar', 'youtube', 'gaming', 'game', 'music', 'concert', 'show',
      'theater', 'prime video', 'disney',
    ],
  },
  {
    id: 'education',
    keywords: [
      'education', 'books', 'school', 'college', 'tuition', 'course', 'courses',
      'learning', 'university', 'fees', 'exam', 'udemy', 'coursera', 'classes',
    ],
  },
  {
    id: 'travel',
    keywords: [
      'travel', 'trip', 'flight', 'airline', 'hotel', 'airbnb', 'vacation',
      'holiday', 'tourism', 'makemytrip', 'booking', 'resort', 'journey',
    ],
  },
  {
    id: 'fitness',
    keywords: [
      'fitness', 'gym', 'workout', 'sports', 'cult', 'trainer', 'yoga',
      'crossfit', 'exercise', 'athletic',
    ],
  },
  {
    id: 'subscriptions',
    keywords: [
      'subscriptions', 'subscription', 'streaming', 'membership', 'apple one',
      'icloud', 'google one', 'patreon',
    ],
  },
  {
    id: 'salary',
    keywords: [
      'salary', 'paycheck', 'wages', 'stipend', 'bonus', 'payroll', 'income',
      'compensation', 'earnings',
    ],
  },
  {
    id: 'investment',
    keywords: [
      'investment', 'stocks', 'mutual funds', 'crypto', 'trading', 'shares',
      'equity', 'gold', 'zerodha', 'groww', 'dividend', 'returns',
    ],
  },
  {
    id: 'freelance',
    keywords: [
      'freelance', 'consulting', 'project', 'client', 'upwork', 'fiverr',
      'contract', 'gig', 'freelancing',
    ],
  },
  {
    id: 'personal_care',
    keywords: [
      'personal care', 'salon', 'spa', 'haircut', 'beauty', 'cosmetics',
      'grooming', 'skincare',
    ],
  },
  {
    id: 'gifts',
    keywords: [
      'gifts', 'gift', 'donation', 'charity', 'present', 'birthday',
      'wedding', 'offering',
    ],
  },
  {
    id: 'rent',
    keywords: [
      'rent', 'housing', 'lease', 'flat', 'apartment', 'landlord',
      'maintenance', 'hostel',
    ],
  },
  {
    id: 'deen',
    keywords: [
      'deen', 'sadqa', 'sadaqah', 'zakat', 'zakaat', 'charity', 'donation',
      'islamic', 'islam', 'masjid', 'mosque', 'madrasa', 'khairat', 'fitra',
      'fitrah', 'ramadan', 'qurbani', 'hajj', 'umrah',
    ],
  },
];

const LEGACY_ICON_MAP: Record<string, CategoryVisualId> = {
  coffee: 'food',
  'shopping-cart': 'groceries',
  navigation: 'transport',
  'shopping-bag': 'shopping',
  'file-text': 'bills',
  heart: 'health',
  music: 'entertainment',
  'book-open': 'education',
  map: 'travel',
  briefcase: 'salary',
  'trending-up': 'investment',
  layers: 'freelance',
  'dollar-sign': 'salary',
  home: 'rent',
  gift: 'gifts',
  smartphone: 'bills',
  film: 'entertainment',
  tag: 'shopping',
  moon: 'deen',
  star: 'other',
};

/**
 * Normalizes text for matching by lowercasing and removing punctuation.
 */
function normalizeCategoryName(str: string): string {
  return str
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Resolves a category name and optional icon name to a cohesive CategoryVisualDefinition.
 */
export function resolveCategoryVisual(
  categoryName?: string,
  iconName?: string
): CategoryVisualDefinition {
  const raw = categoryName || '';
  const normalized = normalizeCategoryName(raw);

  if (normalized) {
    // 1. Exact match on aliases
    for (const entry of CATEGORY_ALIASES) {
      if (entry.keywords.includes(normalized)) {
        return CATEGORY_VISUALS[entry.id];
      }
    }

    // 2. Keyword containment match
    for (const entry of CATEGORY_ALIASES) {
      for (const kw of entry.keywords) {
        if (
          normalized === kw ||
          normalized.startsWith(kw + ' ') ||
          normalized.endsWith(' ' + kw) ||
          normalized.includes(' ' + kw + ' ')
        ) {
          return CATEGORY_VISUALS[entry.id];
        }
      }
    }

    // 3. Substring match
    for (const entry of CATEGORY_ALIASES) {
      for (const kw of entry.keywords) {
        if (normalized.includes(kw)) {
          return CATEGORY_VISUALS[entry.id];
        }
      }
    }
  }

  // 4. Legacy icon name fallback
  if (iconName && LEGACY_ICON_MAP[iconName]) {
    return CATEGORY_VISUALS[LEGACY_ICON_MAP[iconName]];
  }

  // 5. Generic Category fallback
  return CATEGORY_VISUALS.other;
}

