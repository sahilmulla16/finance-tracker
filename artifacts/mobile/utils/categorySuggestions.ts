// Smart category suggestion utility
// Maps transaction descriptions to recommended categories strictly aligned with the user's categories

export type CategoryInput = { name: string; [key: string]: any } | string;

type CategoryMapping = {
  category: string;
  keywords: string[];
};

const categoryMappings: CategoryMapping[] = [
  {
    category: 'Travel',
    keywords: [
      'travel', 'trip', 'flight', 'airline', 'airport', 'railway', 'irctc',
      'hotel', 'resort', 'airbnb', 'booking', 'vacation', 'tour', 'holiday',
      'visa', 'passport', 'sightseeing', 'adventure', 'cruise', 'hostel',
      'makemytrip', 'agoda', 'goibibo', 'expedia', 'boarding', 'luggage',
      'trips', 'journey', 'tourism', 'staycation', 'lodging',
    ],
  },
  {
    category: 'Transport',
    keywords: [
      'transport', 'commute', 'uber', 'ola', 'rapido', 'petrol', 'fuel',
      'diesel', 'cng', 'metro', 'bus', 'train', 'taxi', 'parking', 'auto',
      'rickshaw', 'cab', 'ride', 'commute', 'car', 'bike', 'scooter',
      'toll', 'fastag', 'transit', 'highway', 'expressway',
      'subway', 'ferry', 'driver', 'gas station',
    ],
  },
  {
    category: 'Food & Drinks',
    keywords: [
      'food', 'restaurant', 'lunch', 'dinner', 'breakfast', 'sandwich',
      'coffee', 'tea', 'pizza', 'burger', 'swiggy', 'zomato', 'cafe',
      'meal', 'snack', 'drink', 'drinks', 'water', 'juice', 'canteen',
      'tiffin', 'dabba', 'parcel', 'takeaway', 'fast food', 'dining',
      'starbucks', 'mcdonald', 'dominos', 'kfc', 'biryani', 'bakery',
      'pastry', 'bar', 'pub', 'dessert', 'ice cream', 'chai', 'thali',
      'sweets', 'dosa', 'roti',
    ],
  },
  {
    category: 'Groceries',
    keywords: [
      'grocery', 'groceries', 'supermarket', 'market', 'vegetables', 'fruits',
      'vegetable', 'fruit', 'milk', 'bread', 'egg', 'eggs', 'chicken', 'meat',
      'fish', 'rice', 'dal', 'provisions', 'kirana', 'bigbasket', 'blinkit',
      'zepto', 'instamart', 'dmart', 'nature basket', 'reliance fresh',
      'flour', 'atta', 'oil', 'spices', 'curd', 'paneer', 'veggies',
    ],
  },
  {
    category: 'Bills & Utilities',
    keywords: [
      'bills', 'utilities', 'utility', 'electricity', 'power', 'water bill',
      'internet', 'wifi', 'mobile bill', 'phone bill', 'bill', 'gas',
      'cylinder', 'piped gas', 'maintenance', 'society', 'association',
      'tax', 'insurance', 'premium', 'emi', 'loan', 'credit card',
      'broadband', 'dth', 'cable', 'postpaid', 'prepaid', 'airtel',
      'jio', 'vi', 'bsnl', 'bescom', 'tata power', 'recharge',
    ],
  },
  {
    category: 'Shopping',
    keywords: [
      'shopping', 'clothes', 'clothing', 'shoes', 'footwear', 'myntra',
      'amazon', 'flipkart', 'ajio', 'nykaa', 'meesho', 'snapdeal',
      'fashion', 'apparel', 'accessories', 'gadget', 'electronics',
      'device', 'mall', 'store', 'retail', 'zara', 'h&m', 'uniqlo',
      'purchase', 'buy', 'shop', 'order', 'delivery', 'courier',
    ],
  },
  {
    category: 'Health',
    keywords: [
      'health', 'medicine', 'doctor', 'hospital', 'pharmacy', 'medical',
      'clinic', 'diagnostic', 'lab', 'test', 'checkup', 'consultation',
      'treatment', 'surgery', 'dental', 'eye', 'gym', 'fitness', 'yoga',
      'exercise', 'workout', 'protein', 'supplement', 'vitamin',
      'health insurance', 'apollo', '1mg', 'pharmeasy', 'netmeds',
      'pills', 'prescription', 'meds', 'therapy',
    ],
  },
  {
    category: 'Entertainment',
    keywords: [
      'entertainment', 'netflix', 'spotify', 'hotstar', 'disney',
      'prime video', 'youtube', 'movie', 'cinema', 'gaming', 'music',
      'game', 'games', 'concert', 'show', 'theater', 'theatre',
      'movie ticket', 'bookmyshow', 'pvr', 'inox', 'streaming',
      'subscription', 'premium', 'playstation', 'xbox', 'nintendo',
      'steam', 'twitch', 'ott', 'amusement',
    ],
  },
  {
    category: 'Education',
    keywords: [
      'education', 'school', 'college', 'university', 'tuition', 'course',
      'courses', 'class', 'classes', 'lecture', 'seminar', 'workshop',
      'training', 'book', 'books', 'stationery', 'exam', 'fee', 'fees',
      'admission', 'scholarship', 'learning', 'study', 'udemy', 'coursera',
      'library', 'pen', 'pencil', 'notebook',
    ],
  },
  {
    category: 'Deen & Sadqa',
    keywords: [
      'sadqa', 'sadaqah', 'zakat', 'zakaat', 'deen', 'masjid', 'mosque',
      'madrasa', 'khairat', 'fitra', 'fitrah', 'ramadan', 'qurbani',
      'hajj', 'umrah', 'islamic', 'charity', 'donation', 'poor', 'needy',
    ],
  },
  {
    category: 'Salary',
    keywords: [
      'salary', 'wages', 'stipend', 'bonus', 'payroll', 'paycheck',
      'compensation', 'allowance', 'earnings',
    ],
  },
  {
    category: 'Freelance',
    keywords: [
      'freelance', 'consulting', 'upwork', 'fiverr', 'gig', 'contract',
      'client payment', 'project fee',
    ],
  },
  {
    category: 'Investment',
    keywords: [
      'investment', 'stocks', 'mutual funds', 'crypto', 'trading',
      'shares', 'equity', 'gold', 'zerodha', 'groww', 'dividend',
      'returns', 'sip', 'fixed deposit',
    ],
  },
  {
    category: 'Other',
    keywords: [
      'misc', 'miscellaneous', 'general', 'other', 'cash', 'expense',
    ],
  },
];

/**
 * Suggest a category based on transaction description and available user categories.
 *
 * Rules:
 * 1. If availableCategories is provided, the result strictly aligns with an actual category
 *    in the user's category list.
 * 2. Directly matches if the description equals or contains an existing category name.
 * 3. Otherwise uses intelligent keyword matching mapped directly into user's categories.
 * 4. Never suggests nonexistent categories like "Transportation" when the user has "Transport" or "Travel".
 */
export function suggestCategory(
  description: string,
  availableCategories?: CategoryInput[],
): string | null {
  const text = description.toLowerCase().trim();
  if (!text) return null;

  // Extract category names if availableCategories was supplied
  const availableNames: string[] = availableCategories
    ? availableCategories
        .map((c) => (typeof c === 'string' ? c : c?.name))
        .filter((name): name is string => typeof name === 'string' && name.trim().length > 0)
    : [];

  // Helper to resolve a target canonical name against availableNames
  const resolveAgainstUserCategories = (targetName: string): string | null => {
    if (availableNames.length === 0) return targetName;

    const targetLower = targetName.toLowerCase();

    // 1. Direct exact match (case-insensitive)
    const exact = availableNames.find((n) => n.toLowerCase() === targetLower);
    if (exact) return exact;

    // 2. Specific domain aliases:
    // "Transport" -> match "Transport", "Transportation", "Commute"
    if (targetLower === 'transport') {
      const match = availableNames.find((n) => {
        const nl = n.toLowerCase();
        return nl === 'transport' || nl === 'commute';
      });
      if (match) return match;
    }

    // "Travel" -> match "Travel", "Trips", "Tourism"
    if (targetLower === 'travel') {
      const match = availableNames.find((n) => {
        const nl = n.toLowerCase();
        return nl === 'travel' || nl === 'travels' || nl === 'trips' || nl === 'vacation';
      });
      if (match) return match;
    }

    // "Bills & Utilities" -> match "Bills", "Utilities", "Bills & Utilities"
    if (targetLower === 'bills & utilities') {
      const match = availableNames.find((n) => {
        const nl = n.toLowerCase();
        return nl.includes('bill') || nl.includes('util');
      });
      if (match) return match;
    }

    // "Food & Drinks" -> match "Food", "Dining", "Food & Drinks", "Drinks"
    if (targetLower === 'food & drinks') {
      const match = availableNames.find((n) => {
        const nl = n.toLowerCase();
        return nl.includes('food') || nl.includes('dining') || nl.includes('drink');
      });
      if (match) return match;
    }

    // 3. Containment / Substring match in available categories
    const sub = availableNames.find((n) => {
      const nl = n.toLowerCase();
      return (
        (targetLower.length >= 4 && nl.includes(targetLower)) ||
        (nl.length >= 4 && targetLower.includes(nl))
      );
    });
    if (sub) return sub;

    // Target does not exist in user categories -> do not suggest a nonexistent category!
    return null;
  };

  // STEP 1: Direct match against user's categories
  if (availableNames.length > 0) {
    // 1a. User typed exact category name
    const exactCat = availableNames.find((n) => n.toLowerCase() === text);
    if (exactCat) return exactCat;

    // 1b. Check if individual word tokens match a user category
    const textTokens = text.split(/[\s,._\-/+&]+/).filter(Boolean);
    for (const token of textTokens) {
      if (token.length >= 3) {
        // Direct category name match for token (e.g. text="office travel" -> matches "Travel")
        const match = availableNames.find((n) => n.toLowerCase() === token);
        if (match) return match;

        // "bills" / "bill" -> "Bills & Utilities"
        if (token === 'bills' || token === 'bill') {
          const billsCat = availableNames.find((n) => n.toLowerCase().includes('bill'));
          if (billsCat) return billsCat;
        }
        // "food" -> "Food & Drinks"
        if (token === 'food') {
          const foodCat = availableNames.find((n) => n.toLowerCase().includes('food'));
          if (foodCat) return foodCat;
        }
        // "grocery" -> "Groceries"
        if (token === 'grocery' || token === 'groceries') {
          const grocCat = availableNames.find((n) => n.toLowerCase().includes('grocer'));
          if (grocCat) return grocCat;
        }
      }
    }
  }

  // STEP 2: Intelligent Keyword Matching
  const GENERIC_MODIFIERS = new Set([
    'purchase', 'buy', 'order', 'delivery', 'expense', 'item', 'items', 'paid', 'payment', 'fee', 'charge'
  ]);

  let bestMatch: { category: string; score: number } | null = null;

  for (const mapping of categoryMappings) {
    for (const keyword of mapping.keywords) {
      // Exact keyword match
      if (text === keyword) {
        const resolved = resolveAgainstUserCategories(mapping.category);
        if (resolved) return resolved;
      }

      const isGeneric = GENERIC_MODIFIERS.has(keyword);
      const modifierWeight = isGeneric ? 0.35 : 1.0;

      // Description contains keyword as a distinct word or substring
      if (text.includes(keyword)) {
        const score = (keyword.length / text.length) * 1.5 * modifierWeight;
        if (!bestMatch || score > bestMatch.score) {
          bestMatch = { category: mapping.category, score };
        }
      }

      // Keyword contains description (prefix/partial match, min 3 chars)
      if (keyword.includes(text) && text.length >= 3) {
        const score = (text.length / keyword.length) * modifierWeight;
        if (!bestMatch || score > bestMatch.score) {
          bestMatch = { category: mapping.category, score };
        }
      }
    }
  }

  if (bestMatch) {
    const resolved = resolveAgainstUserCategories(bestMatch.category);
    if (resolved) return resolved;
  }

  return null;
}

/**
 * Get all category names for display.
 */
export function getAllCategoryNames(): string[] {
  return categoryMappings.map((m) => m.category);
}
