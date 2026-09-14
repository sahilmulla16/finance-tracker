// Smart category suggestion utility
// Maps transaction descriptions to recommended categories

type CategoryMapping = {
  category: string;
  keywords: string[];
};

const categoryMappings: CategoryMapping[] = [
  {
    category: 'Food & Drinks',
    keywords: [
      'sandwich', 'food', 'restaurant', 'lunch', 'dinner', 'breakfast',
      'coffee', 'tea', 'pizza', 'burger', 'swiggy', 'zomato', 'cafe',
      'grocery', 'groceries', 'meal', 'snack', 'drink', 'water',
      'juice', 'milk', 'bread', 'egg', 'chicken', 'rice', 'dal',
      'vegetable', 'fruit', 'restaurant', 'hotel', 'mess', 'canteen',
      'tiffin', 'dabba', 'parcel', 'takeaway', 'order', 'food',
    ],
  },
  {
    category: 'Entertainment',
    keywords: [
      'netflix', 'spotify', 'hotstar', 'disney', 'prime video', 'youtube',
      'movie', 'cinema', 'instagram', 'gaming', 'music', 'game',
      'concert', 'show', 'theater', 'theatre', 'movie ticket',
      'streaming', 'subscription', 'premium', 'hulu', 'hbo',
      'apple tv', 'playstation', 'xbox', 'nintendo', 'steam',
    ],
  },
  {
    category: 'Bills & Utilities',
    keywords: [
      'jio', 'airtel', 'vi', 'recharge', 'electricity', 'water bill',
      'internet', 'wifi', 'mobile bill', 'phone bill', 'bill',
      'gas', 'maintenance', 'society', 'association', 'tax',
      'insurance', 'premium', 'emi', 'loan', 'credit card',
      'broadband', 'dth', 'cable', 'postpaid', 'prepaid',
    ],
  },
  {
    category: 'Transportation',
    keywords: [
      'uber', 'ola', 'rapido', 'petrol', 'fuel', 'metro', 'bus',
      'train', 'taxi', 'parking', 'auto', 'rickshaw', 'cab',
      'ride', 'travel', 'flight', 'airline', 'airport', 'railway',
      'ticket', 'pass', 'commute', 'car', 'bike', 'scooter',
      'toll', 'highway', 'expressway', 'green channel',
    ],
  },
  {
    category: 'Shopping',
    keywords: [
      'amazon', 'flipkart', 'clothes', 'shoes', 'shopping', 'myntra',
      'electronics', 'purchase', 'store', 'mall', 'shop', 'buy',
      'order', 'delivery', 'courier', 'package', 'parcel',
      'ajio', 'nykaa', 'meesho', 'snapdeal', 'paytm mall',
      'fashion', 'apparel', 'accessories', 'gadget', 'device',
    ],
  },
  {
    category: 'Housing',
    keywords: [
      'rent', 'house rent', 'maintenance', 'property', 'flat',
      'apartment', 'home', 'housing', 'society maintenance',
      'water tank', 'security', 'guard', 'watchman', 'compounder',
    ],
  },
  {
    category: 'Health',
    keywords: [
      'medicine', 'doctor', 'hospital', 'pharmacy', 'medical',
      'health', 'clinic', 'diagnostic', 'lab', 'test', 'checkup',
      'consultation', 'treatment', 'surgery', 'dental', 'eye',
      'gym', 'fitness', 'yoga', 'exercise', 'workout', 'protein',
      'supplement', 'vitamin', 'health insurance', 'cashless',
    ],
  },
  {
    category: 'Income',
    keywords: [
      'salary', 'freelance', 'payment received', 'bonus', 'income',
      'wages', 'stipend', 'allowance', 'commission', 'profit',
      'dividend', 'interest', 'refund', 'cashback', 'reward',
      'reimbursement', 'settlement', 'credit', 'credit note',
    ],
  },
  {
    category: 'Transfer',
    keywords: [
      'transfer', 'upi transfer', 'bank transfer', 'sent money',
      'received money', 'neft', 'rtgs', 'imps', 'wire',
      'self transfer', 'between accounts', 'savings transfer',
    ],
  },
  {
    category: 'Education',
    keywords: [
      'school', 'college', 'university', 'tuition', 'course',
      'class', 'lecture', 'seminar', 'workshop', 'training',
      'book', 'stationery', 'exam', 'fee', ' admission',
      'scholarship', 'education', 'learning', 'study',
    ],
  },
  {
    category: 'Travel',
    keywords: [
      'hotel', 'resort', 'airbnb', 'booking', 'vacation',
      'trip', 'tour', 'holiday', 'travel', 'visa', 'passport',
      'sightseeing', 'adventure', 'cruise', 'hostel',
    ],
  },
  {
    category: 'Gifts & Donations',
    keywords: [
      'gift', 'donation', 'charity', 'donate', 'present',
      'birthday', 'wedding', 'anniversary', 'festival',
      'temple', 'church', 'mosque', 'religious', 'offering',
    ],
  },
];

/**
 * Suggest a category based on transaction description.
 * Returns the best matching category name, or null if no match.
 */
export function suggestCategory(description: string): string | null {
  const text = description.toLowerCase().trim();
  if (!text) return null;

  let bestMatch: { category: string; score: number } | null = null;

  for (const mapping of categoryMappings) {
    for (const keyword of mapping.keywords) {
      // Exact match
      if (text === keyword) {
        return mapping.category;
      }

      // Contains match
      if (text.includes(keyword)) {
        const score = keyword.length / text.length;
        if (!bestMatch || score > bestMatch.score) {
          bestMatch = { category: mapping.category, score };
        }
      }

      // Keyword contains text (partial match)
      if (keyword.includes(text) && text.length >= 3) {
        const score = text.length / keyword.length;
        if (!bestMatch || score > bestMatch.score) {
          bestMatch = { category: mapping.category, score };
        }
      }
    }
  }

  return bestMatch?.category || null;
}

/**
 * Get all category names for display.
 */
export function getAllCategoryNames(): string[] {
  return categoryMappings.map((m) => m.category);
}
