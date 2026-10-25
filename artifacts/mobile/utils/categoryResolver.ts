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
    id: 'fuel',
    keywords: [
      'fuel', 'fuel & gas', 'petrol', 'diesel', 'gas', 'cng', 'gas station',
      'shell', 'hpcl', 'bpcl', 'iocl', 'pump',
    ],
  },
  {
    id: 'emi',
    keywords: [
      'emi', 'loans & emi', 'loan', 'loans', 'mortgage', 'car loan', 'home loan',
      'personal loan', 'credit card payment', 'debt', 'repayment', 'installment',
    ],
  },
  {
    id: 'pets',
    keywords: [
      'pets', 'pets & animals', 'pet', 'dog', 'cat', 'vet', 'veterinary',
      'pet care', 'pet food', 'puppy', 'kitten',
    ],
  },
  {
    id: 'family',
    keywords: [
      'family', 'family & kids', 'kids', 'children', 'childcare', 'baby',
      'daycare', 'parents', 'allowance', 'schooling',
    ],
  },
  {
    id: 'savings',
    keywords: [
      'goals', 'goal', 'savings', 'savings & vault', 'saving', 'piggy bank', 'vault',
      'emergency fund', 'deposit', 'fd', 'rd', 'gold', 'savings goal', 'savings goals',
    ],
  },
  {
    id: 'taxes',
    keywords: [
      'taxes', 'taxes & duties', 'tax', 'income tax', 'property tax', 'gst',
      'vat', 'tds', 'duty', 'duties', 'itr', 'cess',
    ],
  },
  {
    id: 'insurance',
    keywords: [
      'insurance', 'insurance & policy', 'life insurance', 'health insurance',
      'car insurance', 'policy', 'lic', 'premium', 'mediclaim',
    ],
  },
  {
    id: 'gaming',
    keywords: [
      'gaming', 'gaming & esports', 'game', 'games', 'playstation', 'xbox',
      'steam', 'nintendo', 'esports', 'pubg', 'epic games', 'riot',
    ],
  },
  {
    id: 'beauty',
    keywords: [
      'beauty', 'beauty & cosmetics', 'cosmetics', 'salon', 'parlour',
      'haircut', 'skincare', 'makeup', 'spa', 'barber', 'grooming', 'nykaa',
    ],
  },
  {
    id: 'cloud',
    keywords: [
      'cloud', 'cloud & saas', 'saas', 'hosting', 'aws', 'google cloud',
      'azure', 'domain', 'server', 'github', 'vercel', 'digitalocean',
    ],
  },
  {
    id: 'transport',
    keywords: [
      'transport', 'commute', 'taxi', 'cab', 'uber', 'ola',
      'rapido', 'metro', 'bus', 'train', 'auto', 'rickshaw',
      'parking', 'toll', 'flight',
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
      'wifi', 'recharge', 'mobile bill', 'phone bill', 'broadband', 'dth',
      'airtel', 'jio', 'power',
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
  // 1. Direct logo: prefix
  if (iconName && iconName.startsWith('logo:')) {
    const visualId = iconName.slice(5) as CategoryVisualId;
    if (CATEGORY_VISUALS[visualId]) {
      return CATEGORY_VISUALS[visualId];
    }
  }

  // 2. Direct visual ID match
  if (iconName && CATEGORY_VISUALS[iconName as CategoryVisualId]) {
    return CATEGORY_VISUALS[iconName as CategoryVisualId];
  }

  const raw = categoryName || '';
  const normalized = normalizeCategoryName(raw);

  if (normalized) {
    // 3. Exact match on aliases
    for (const entry of CATEGORY_ALIASES) {
      if (entry.keywords.includes(normalized)) {
        return CATEGORY_VISUALS[entry.id];
      }
    }

    // 4. Keyword containment match
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

    // 5. Substring match
    for (const entry of CATEGORY_ALIASES) {
      for (const kw of entry.keywords) {
        if (normalized.includes(kw)) {
          return CATEGORY_VISUALS[entry.id];
        }
      }
    }
  }

  // 6. Legacy icon name fallback
  if (iconName && LEGACY_ICON_MAP[iconName]) {
    return CATEGORY_VISUALS[LEGACY_ICON_MAP[iconName]];
  }

  // 7. Generic Category fallback
  return CATEGORY_VISUALS.other;
}

