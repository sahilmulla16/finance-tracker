import { suggestCategory } from "@/utils/categorySuggestions";
import { getMerchantLogo } from "@/utils/merchantLogos";
import { type Account, type Category, type Transaction } from "@/context/FinanceContext";
import { classifyVoiceTransactionType } from "@/utils/transactionSorting";

export type VoiceTransactionCandidate = {
  id: string;
  selected: boolean;
  type: "EXPENSE" | "INCOME" | "TRANSFER";
  amount: number;
  merchant: string;
  category: string;
  description: string;
  date: string;
  time: string;
  paymentMethod?: string;
  accountId?: string;
  fromAccountId?: string;
  toAccountId?: string;
  confidence: number;
  requiresReview: boolean;
  reviewReason?: string;
  rawPhrase: string;
  isPossibleDuplicate?: boolean;
  duplicateReason?: string;
};

// Known common merchants dictionary for high-precision recognition
const KNOWN_MERCHANTS: Record<string, { name: string; defaultCategory: string }> = {
  swiggy: { name: "Swiggy", defaultCategory: "Food & Drinks" },
  zomato: { name: "Zomato", defaultCategory: "Food & Drinks" },
  mcdonalds: { name: "McDonald's", defaultCategory: "Food & Drinks" },
  "mcdonald's": { name: "McDonald's", defaultCategory: "Food & Drinks" },
  starbucks: { name: "Starbucks", defaultCategory: "Food & Drinks" },
  dominos: { name: "Domino's", defaultCategory: "Food & Drinks" },
  "domino's": { name: "Domino's", defaultCategory: "Food & Drinks" },
  subway: { name: "Subway", defaultCategory: "Food & Drinks" },
  kfc: { name: "KFC", defaultCategory: "Food & Drinks" },
  burgerking: { name: "Burger King", defaultCategory: "Food & Drinks" },
  "burger king": { name: "Burger King", defaultCategory: "Food & Drinks" },
  uber: { name: "Uber", defaultCategory: "Transport" },
  ola: { name: "Ola", defaultCategory: "Transport" },
  rapido: { name: "Rapido", defaultCategory: "Transport" },
  amazon: { name: "Amazon", defaultCategory: "Shopping" },
  flipkart: { name: "Flipkart", defaultCategory: "Shopping" },
  myntra: { name: "Myntra", defaultCategory: "Shopping" },
  ajio: { name: "Ajio", defaultCategory: "Shopping" },
  nykaa: { name: "Nykaa", defaultCategory: "Shopping" },
  meesho: { name: "Meesho", defaultCategory: "Shopping" },
  blinkit: { name: "Blinkit", defaultCategory: "Groceries" },
  zepto: { name: "Zepto", defaultCategory: "Groceries" },
  instamart: { name: "Instamart", defaultCategory: "Groceries" },
  bigbasket: { name: "BigBasket", defaultCategory: "Groceries" },
  netflix: { name: "Netflix", defaultCategory: "Entertainment" },
  spotify: { name: "Spotify", defaultCategory: "Entertainment" },
  hotstar: { name: "Hotstar", defaultCategory: "Entertainment" },
  jio: { name: "Jio", defaultCategory: "Bills & Utilities" },
  airtel: { name: "Airtel", defaultCategory: "Bills & Utilities" },
  vi: { name: "Vi", defaultCategory: "Bills & Utilities" },
  apple: { name: "Apple", defaultCategory: "Shopping" },
  google: { name: "Google", defaultCategory: "Bills & Utilities" },
};

// Word-to-number mapping for spoken English numbers
const NUMBER_WORDS: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
  hundred: 100,
  thousand: 1000,
  k: 1000,
  lakh: 100000,
  lac: 100000,
  lacs: 100000,
  lakhs: 100000,
};

function cleanNumberCommas(text: string): string {
  let res = text;
  while (/(\d),(\d)/.test(res)) {
    res = res.replace(/(\d),(\d)/g, "$1$2");
  }
  // Fast speech normalization: split concatenated word + number tokens (e.g., "swiggy450" -> "swiggy 450", "uber200" -> "uber 200")
  res = res.replace(/([a-zA-Z]+)(\d+)/g, "$1 $2");
  // Fast speech normalization: split concatenated number + word tokens (e.g., "450rs" -> "450 rs", "50rupees" -> "50 rupees")
  res = res.replace(/(\d+)([a-zA-Z]+)/g, "$1 $2");
  return res;
}

/**
 * Normalizes input text and parses spoken number phrases like "fifteen hundred" or "two thousand five hundred".
 */
export function parseSpokenNumber(text: string): number | null {
  const clean = cleanNumberCommas(text.toLowerCase().trim());

  // 1. Direct digits with optional multiplier suffix
  const directMatch = clean.match(
    /(?:(?:rs\.?|inr|₹)\s*)?(\b\d+(?:\.\d+)?)\s*(k|thousand|lakh|lac|lacs|lakhs|rupees|rs|bucks)?\b/i,
  );

  if (directMatch) {
    const numStr = directMatch[1];
    const multiplierStr = directMatch[2] ? directMatch[2].toLowerCase() : "";
    let val = parseFloat(numStr);
    if (!isNaN(val)) {
      if (
        multiplierStr === "k" ||
        multiplierStr === "thousand" ||
        /\b(?:k|thousand)\b/i.test(clean) ||
        /\d+k\b/i.test(clean)
      ) {
        val *= 1000;
      } else if (
        multiplierStr.startsWith("la") ||
        /\b(?:lakh|lac|lacs|lakhs)\b/i.test(clean)
      ) {
        val *= 100000;
      }
      return val;
    }
  }

  // 2. Word numbers parsing
  const words = clean.split(/\s+/);
  let total = 0;
  let current = 0;
  let foundWord = false;

  for (const w of words) {
    if (NUMBER_WORDS[w] !== undefined) {
      foundWord = true;
      const num = NUMBER_WORDS[w];
      if (num === 100) {
        current = (current || 1) * 100;
      } else if (num === 1000 || num === 100000) {
        current = (current || 1) * num;
        total += current;
        current = 0;
      } else {
        current += num;
      }
    }
  }
  total += current;

  return foundWord && total > 0 ? total : null;
}

/**
 * Detects whether the user utterance is an informational question rather than transaction logging.
 */
export function isInformationalQuery(text: string): boolean {
  const clean = text.toLowerCase().trim();
  const queryPatterns = [
    /^(?:what|how much|when|where|who|why|can you tell me|show me)\b/i,
    /\b(?:what did i spend|my total spend|how much did i spend|balance|how much money)\b/i,
    /\?$/,
  ];
  return queryPatterns.some((pattern) => pattern.test(clean));
}

/**
 * Splits raw transcript into individual transaction candidate phrases.
 */
export function splitTransactionPhrases(transcript: string): string[] {
  let cleaned = cleanNumberCommas(transcript.trim());
  if (!cleaned) return [];

  // Multi-transaction boundaries:
  // "and also", "and then", "and another", "and", "then", "plus", "also", "as well as", "aur", "phir", "fir", ",", ";", "."
  const boundaryRegex =
    /(?:\s+(?:and\s+also|and\s+then|and\s+another|and\s+another\s+one|as\s+well\s+as|and|then|also|plus|aur|phir|fir)\s+|[;,\n]+|\.(?!\d))/gi;

  const rawSegments = cleaned
    .split(boundaryRegex)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);

  // If boundary splitting returned 0 or 1, check for verb-based chaining:
  // e.g. "I spent 500 on Swiggy received 5000 salary"
  const finalSegments: string[] = [];
  for (const seg of rawSegments) {
    // If segment contains multiple distinct action verbs with amounts, split further
    const verbMatches = Array.from(
      seg.matchAll(
        /\b(?:i\s+spent|spent|paid|bought|got|received|transferred|transfer|kharch\s+kiye|diye)\b/gi,
      ),
    );

    if (verbMatches.length > 1) {
      let lastIdx = 0;
      for (let i = 1; i < verbMatches.length; i++) {
        const nextIdx = verbMatches[i].index!;
        const piece = seg.substring(lastIdx, nextIdx).trim();
        if (piece) finalSegments.push(piece);
        lastIdx = nextIdx;
      }
      const lastPiece = seg.substring(lastIdx).trim();
      if (lastPiece) finalSegments.push(lastPiece);
    } else {
      finalSegments.push(seg);
    }
  }

  return finalSegments.filter((s) => s.trim().length > 2);
}

/**
 * Extracts structured transaction details from a single phrase segment.
 */
export function extractTransactionFromPhrase(
  phrase: string,
  userAccounts: Account[] = [],
  userCategories: Category[] = [],
): VoiceTransactionCandidate | null {
  const clean = cleanNumberCommas(phrase.trim());
  const lower = clean.toLowerCase();

  // 1. Transaction Type Detection
  const isCashOut = /\b(?:cash\s*out|cashout|cash\s+withdrawal|atm|withdraw(?:al)?|withdrew|withdrawn|bank\s+cash)\b/i.test(lower);
  const type: "EXPENSE" | "INCOME" | "TRANSFER" = classifyVoiceTransactionType(phrase);
  const isDeen = /\b(?:sadqa|sadaqah|zakat|zakaat|deen|masjid|mosque|madrasa|khairat|fitra|fitrah)\b/i.test(lower);

  // 2. Amount Extraction
  let amount = 0;
  let amountFound = false;

  // Look for currency symbols or digits
  const digitRegex =
    /(?:(?:rs\.?|inr|₹)\s*)?(\b\d+(?:\.\d+)?)\s*(k|thousand|lakh|lac|lacs|lakhs|rupees|rs|bucks)?\b/gi;
  const matches = Array.from(lower.matchAll(digitRegex));

  for (const m of matches) {
    const rawMatch = m[0];
    const numPart = m[1];
    // Exclude if it looks like a time (e.g. 8 in "8 pm" or "2026")
    if (/\b(?:am|pm|o'clock)\b/i.test(lower.substring(m.index!))) continue;
    if (parseInt(numPart, 10) >= 2024 && parseInt(numPart, 10) <= 2030) continue; // Skip current years

    const parsed = parseSpokenNumber(rawMatch);
    if (parsed !== null && parsed > 0) {
      amount = parsed;
      amountFound = true;
      break;
    }
  }

  // If no direct digits, try word numbers in phrase
  if (!amountFound) {
    const wordNum = parseSpokenNumber(lower);
    if (wordNum !== null && wordNum > 0) {
      amount = wordNum;
      amountFound = true;
    }
  }

  // 3. Date & Time Parsing
  const now = new Date();
  let dateObj = new Date();
  let timeStr = now.toTimeString().substring(0, 5); // "HH:mm"

  if (/\b(?:yesterday|kal(?:\s+raat)?)\b/i.test(lower)) {
    dateObj.setDate(dateObj.getDate() - 1);
  } else if (/\b(?:two\s+days\s+ago|2\s+days\s+ago)\b/i.test(lower)) {
    dateObj.setDate(dateObj.getDate() - 2);
  } else if (/\blast\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i.test(lower)) {
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const match = lower.match(/\blast\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i);
    if (match) {
      const targetDay = days.indexOf(match[1].toLowerCase());
      const currentDay = dateObj.getDay();
      let diff = (currentDay - targetDay + 7) % 7;
      if (diff === 0) diff = 7;
      dateObj.setDate(dateObj.getDate() - diff);
    }
  }

  if (/\b(?:last\s+night|tonight|evening|raat)\b/i.test(lower)) {
    timeStr = "20:00";
  } else if (/\b(?:this\s+morning|morning|subah)\b/i.test(lower)) {
    timeStr = "09:30";
  } else if (/\b(?:afternoon|lunch\s+time)\b/i.test(lower)) {
    timeStr = "13:30";
  } else {
    const timeMatch = lower.match(/\bat\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
    if (timeMatch) {
      let h = parseInt(timeMatch[1], 10);
      const m = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      const meridiem = timeMatch[3].toLowerCase();
      if (meridiem === "pm" && h < 12) h += 12;
      if (meridiem === "am" && h === 12) h = 0;
      timeStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }
  }

  const dateStr = dateObj.toISOString().split("T")[0];

  // 4. Payment Method Detection
  let paymentMethod: string | undefined = undefined;
  if (/\b(?:upi|gpay|google\s+pay|phonepe|paytm)\b/i.test(lower)) {
    paymentMethod = "UPI";
  } else if (/\b(?:cash|nakad)\b/i.test(lower)) {
    paymentMethod = "Cash";
  } else if (/\b(?:credit\s+card|debit\s+card|card)\b/i.test(lower)) {
    paymentMethod = "Card";
  } else if (/\b(?:net\s*banking|wire|neft|imps)\b/i.test(lower)) {
    paymentMethod = "Net Banking";
  }

  // 5. Account Identification (Matching against user accounts)
  let accountId: string | undefined = undefined;
  let fromAccountId: string | undefined = undefined;
  let toAccountId: string | undefined = undefined;

  if (userAccounts.length > 0) {
    if (type === "TRANSFER") {
      if (isCashOut) {
        const bankNames = ["hdfc", "sbi", "icici", "axis", "kotak", "pnb", "bob", "canara", "bank"];
        const foundBank = userAccounts.find((a) => {
          const nameLow = a.name.toLowerCase();
          return (
            lower.includes(nameLow) ||
            bankNames.some((bn) => lower.includes(bn) && nameLow.includes(bn))
          );
        });
        const foundCash = userAccounts.find(
          (a) =>
            a.type === "CASH" ||
            a.name.toLowerCase().includes("cash") ||
            a.name.toLowerCase().includes("wallet"),
        );
        if (foundBank) fromAccountId = foundBank.id;
        if (foundCash) toAccountId = foundCash.id;
      } else {
        const transferMatch = lower.match(/from\s+([a-z0-9\s]+?)\s+to\s+([a-z0-9\s]+?)(?:$|\s+using|\s+for|\s+and)/i);
        if (transferMatch) {
          const fromName = transferMatch[1].trim();
          const toName = transferMatch[2].trim();
          const fromAcc = userAccounts.find(
            (a) => a.name.toLowerCase().includes(fromName) || fromName.includes(a.name.toLowerCase()),
          );
          const toAcc = userAccounts.find(
            (a) => a.name.toLowerCase().includes(toName) || toName.includes(a.name.toLowerCase()),
          );
          if (fromAcc) fromAccountId = fromAcc.id;
          if (toAcc) toAccountId = toAcc.id;
        }
      }
    } else {
      for (const acc of userAccounts) {
        const accLower = acc.name.toLowerCase();
        if (lower.includes(`from ${accLower}`) || lower.includes(`using ${accLower}`) || lower.includes(accLower)) {
          accountId = acc.id;
          break;
        }
      }
    }
  }

  // 6. Merchant / Payee & Item Detection
  let merchant = "";
  let itemOrAction = "";

  if (isCashOut) {
    const bankWord = lower.includes("hdfc")
      ? "HDFC"
      : lower.includes("sbi")
        ? "SBI"
        : lower.includes("icici")
          ? "ICICI"
          : lower.includes("axis")
            ? "Axis"
            : lower.includes("kotak")
              ? "Kotak"
              : "Bank";
    merchant = `${bankWord} ATM`;
    itemOrAction = "Cash withdrawal";
  } else if (isDeen) {
    itemOrAction = lower.includes("zakat") ? "Zakat" : "Sadqa";
    merchant =
      lower.includes("masjid") || lower.includes("mosque")
        ? "Masjid"
        : lower.includes("madrasa")
          ? "Madrasa"
          : "Sadqa / Donation";
  }

  // Check known merchants first
  if (!merchant) {
    for (const [key, info] of Object.entries(KNOWN_MERCHANTS)) {
      const reg = new RegExp(`\\b${key}\\b`, "i");
      if (reg.test(lower)) {
        merchant = info.name;
        break;
      }
    }
  }

  // Check preposition patterns if merchant not found
  if (!merchant) {
    // "bought a [item] from [merchant]"
    const boughtFromMatch = lower.match(/bought\s+(?:a|an)?\s*(.*?)\s+(?:from|at)\s+([a-z0-9\s'\-]+?)(?:\s+for|\s+costing|\s+worth|\s*$)/i);
    if (boughtFromMatch) {
      itemOrAction = boughtFromMatch[1].trim();
      merchant = capitalizeWord(boughtFromMatch[2].trim());
    } else {
      // "paid [merchant] [amount]" or "paid [amount] to [merchant]"
      const paidMatch = lower.match(/(?:paid|give|gave|transferred)\s+(?:to\s+)?([a-z0-9'\s\-]+?)(?:\s+(?:rs|inr|₹|\d|bucks)|$)/i);
      if (paidMatch && !["for", "using", "by", "on", "yesterday"].includes(paidMatch[1].trim())) {
        merchant = capitalizeWord(paidMatch[1].trim());
      } else {
        // "[amount] on [merchant/category]"
        const onMatch = lower.match(/(?:spent|spent\s+\d+|for|\d+)\s+on\s+([a-z0-9'\s\-]+?)(?:\s+using|\s+and|\s+yesterday|\s*$)/i);
        if (onMatch) {
          const candidate = onMatch[1].trim();
          merchant = capitalizeWord(candidate);
        } else {
          // Hinglish: "[merchant] pe [amount] spend kiye"
          const peMatch = lower.match(/([a-z0-9'\s\-]+?)\s+(?:pe|ko)\s+/i);
          if (peMatch) {
            merchant = capitalizeWord(peMatch[1].trim());
          } else {
            // Rapid speech direct pattern: "[merchant] [amount]" (e.g. "Chai 20", "Burger 150", "Petrol 1000", "Dmart 1200")
            const directRapid1 = lower.match(/^([a-z\s'\-]+?)\s+(?:rs\.?|inr|₹)?\s*\d+\b/i);
            // Rapid speech inverted: "[amount] [merchant]" (e.g. "20 Chai", "500 Petrol")
            const directRapid2 = lower.match(/^(?:rs\.?|inr|₹)?\s*\d+\s+([a-z\s'\-]+?)$/i);

            const rapidCandidate = directRapid1 ? directRapid1[1].trim() : directRapid2 ? directRapid2[1].trim() : "";
            if (
              rapidCandidate &&
              rapidCandidate.length >= 2 &&
              !["spent", "paid", "rupees", "rs", "inr", "bucks", "for", "on", "i", "a", "an", "the"].includes(rapidCandidate.toLowerCase())
            ) {
              merchant = capitalizeWord(rapidCandidate);
            }
          }
        }
      }
    }
  }

  // Specific items / common keywords
  if (!itemOrAction) {
    if (lower.includes("lunch")) itemOrAction = "Lunch";
    else if (lower.includes("dinner")) itemOrAction = "Dinner";
    else if (lower.includes("breakfast")) itemOrAction = "Breakfast";
    else if (lower.includes("coffee") || lower.includes("chai") || lower.includes("tea")) itemOrAction = "Coffee & Tea";
    else if (lower.includes("groceries") || lower.includes("grocery")) itemOrAction = "Groceries";
    else if (lower.includes("shirt") || lower.includes("clothes") || lower.includes("dress")) itemOrAction = "Clothing";
    else if (lower.includes("movie") || lower.includes("cinema")) itemOrAction = "Movie ticket";
    else if (lower.includes("ride") || lower.includes("cab") || lower.includes("auto")) itemOrAction = "Cab ride";
  }

  // Fallback merchant if none detected
  if (!merchant) {
    if (type === "INCOME") {
      merchant = lower.includes("salary") ? "Salary" : "Client Payment";
    } else if (type === "TRANSFER") {
      merchant = isCashOut ? "ATM Cash Out" : "Transfer";
    } else if (itemOrAction) {
      merchant = itemOrAction;
    } else {
      merchant = "General Expense";
    }
  }

  // 7. Category Suggestions
  let category = "Other";
  if (isDeen) {
    category = "Deen & Sadqa";
  } else if (type === "INCOME") {
    category = "Income";
  } else if (type === "TRANSFER") {
    category = "Transfer";
  } else {
    // Check known merchants
    const known = Object.entries(KNOWN_MERCHANTS).find(([k]) =>
      merchant.toLowerCase().includes(k) || k.includes(merchant.toLowerCase()),
    );
    if (known) {
      category = known[1].defaultCategory;
    } else {
      // Use existing smart category suggestions
      const suggested = suggestCategory(
        `${merchant} ${itemOrAction} ${phrase}`,
        userCategories,
      );
      if (suggested) {
        category = suggested;
      } else {
        // Check if any user category name is mentioned in the phrase
        const matchedUserCat = userCategories.find((c) =>
          lower.includes(c.name.toLowerCase()),
        );
        if (matchedUserCat) {
          category = matchedUserCat.name;
        } else {
          // Never default to userCategories[0].name (Food & Drinks)! Default to Other.
          category = "Other";
        }
      }
    }
  }

  // 8. Concise Description Generation (1-4 words)
  let description = "";
  if (type === "INCOME") {
    description = lower.includes("salary")
      ? "Salary credit"
      : lower.includes("freelance")
        ? "Freelance payment"
        : `Payment from ${merchant}`;
  } else if (type === "TRANSFER") {
    if (isCashOut) {
      description = `${merchant} withdrawal`;
    } else {
      description = "Transfer between accounts";
    }
  } else if (isDeen) {
    description = `${itemOrAction} donation`;
  } else {
    if (itemOrAction && merchant && itemOrAction.toLowerCase() !== merchant.toLowerCase()) {
      description = `${merchant} ${itemOrAction.toLowerCase()}`;
    } else if (merchant.toLowerCase() === "uber" || merchant.toLowerCase() === "ola" || merchant.toLowerCase() === "rapido") {
      description = `${merchant} ride`;
    } else if (merchant.toLowerCase() === "swiggy" || merchant.toLowerCase() === "zomato") {
      description = `${merchant} food order`;
    } else if (merchant.toLowerCase() === "amazon" || merchant.toLowerCase() === "myntra" || merchant.toLowerCase() === "flipkart") {
      description = `${merchant} purchase`;
    } else if (itemOrAction) {
      description = itemOrAction;
    } else {
      description = `${merchant} expense`;
    }
  }

  // Capitalize first letter
  description = description.charAt(0).toUpperCase() + description.slice(1);

  // 9. Confidence Calculation
  let confidence = 0.5;
  const reasons: string[] = [];

  if (amountFound && amount > 0) {
    confidence += 0.35;
  } else {
    reasons.push("Amount could not be detected accurately");
  }

  if (merchant && merchant !== "General Expense") {
    confidence += 0.15;
  } else {
    reasons.push("Payee / Merchant is generic");
  }

  if (category && category !== "Other" && category !== "Unknown") {
    confidence += 0.05;
  }

  confidence = Math.min(Math.max(confidence, 0.1), 0.98);
  const requiresReview = confidence < 0.85 || !amountFound || amount <= 0;

  return {
    id: `vtxn-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    selected: !requiresReview, // auto-select high-confidence candidates
    type,
    amount,
    merchant,
    category,
    description,
    date: dateStr,
    time: timeStr,
    paymentMethod,
    accountId,
    fromAccountId,
    toAccountId,
    confidence: Math.round(confidence * 100) / 100,
    requiresReview,
    reviewReason: reasons.join("; ") || undefined,
    rawPhrase: clean,
  };
}

/**
 * Parses full user voice transcript into a list of structured transaction candidates.
 */
export function parseVoiceTranscript(
  transcript: string,
  userAccounts: Account[] = [],
  userCategories: Category[] = [],
  existingTransactions: Transaction[] = [],
): { candidates: VoiceTransactionCandidate[]; isQuery: boolean } {
  if (!transcript || transcript.trim().length === 0) {
    return { candidates: [], isQuery: false };
  }

  if (isInformationalQuery(transcript)) {
    return { candidates: [], isQuery: true };
  }

  const phrases = splitTransactionPhrases(transcript);
  const candidates: VoiceTransactionCandidate[] = [];

  for (const phrase of phrases) {
    const parsed = extractTransactionFromPhrase(phrase, userAccounts, userCategories);
    if (parsed) {
      // Validate candidate has at least an amount OR a recognizable merchant
      if (parsed.amount > 0 || (parsed.merchant && parsed.merchant !== "General Expense")) {
        candidates.push(parsed);
      }
    }
  }

  // Duplicate detection against existing local transactions
  const enrichedCandidates = candidates.map((cand) => {
    for (const existing of existingTransactions) {
      const sameAmount = Math.abs(existing.amount - cand.amount) < 0.01;
      const sameDate = existing.date === cand.date;
      const sameMerchant =
        (existing.description || "").toLowerCase().includes(cand.merchant.toLowerCase()) ||
        cand.merchant.toLowerCase().includes((existing.description || "").toLowerCase());

      if (sameAmount && sameDate && (sameMerchant || existing.category === cand.category)) {
        return {
          ...cand,
          isPossibleDuplicate: true,
          duplicateReason: `Similar transaction (${cand.amount}) on ${cand.date} already exists`,
          selected: false, // uncheck potential duplicates by default for safety
          requiresReview: true,
        };
      }
    }
    return cand;
  });

  return { candidates: enrichedCandidates, isQuery: false };
}

function capitalizeWord(str: string): string {
  if (!str) return "";
  return str
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

