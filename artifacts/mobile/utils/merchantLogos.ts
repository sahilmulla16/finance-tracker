// Merchant logo mapping for transaction icons
// Each merchant gets a background color and a display letter/icon

export type MerchantLogo = {
  bg: string;
  letter: string;
  color: string; // text color on the bg
};

const merchantLogos: Record<string, MerchantLogo> = {
  // Transaction merchants
  netflix: { bg: '#E50914', letter: 'N', color: '#FFFFFF' },
  jio: { bg: '#0A3A8A', letter: 'J', color: '#FFFFFF' },
  hotstar: { bg: '#0C2340', letter: 'H', color: '#FFFFFF' },
  instagram: { bg: '#E1306C', letter: 'I', color: '#FFFFFF' },
  spotify: { bg: '#1DB954', letter: 'S', color: '#000000' },
  zomato: { bg: '#E23744', letter: 'Z', color: '#FFFFFF' },
  amazon: { bg: '#FF9900', letter: 'A', color: '#000000' },
  google: { bg: '#4285F4', letter: 'G', color: '#FFFFFF' },
  gpay: { bg: '#4285F4', letter: 'G', color: '#FFFFFF' },
  phonepe: { bg: '#5F259F', letter: 'P', color: '#FFFFFF' },
  paytm: { bg: '#00BAF2', letter: 'P', color: '#FFFFFF' },
  salary: { bg: '#34C759', letter: 'S', color: '#FFFFFF' },
  upi: { bg: '#5F259F', letter: 'U', color: '#FFFFFF' },
  transfer: { bg: '#86BFFF', letter: 'T', color: '#000000' },
  food: { bg: '#FF6B35', letter: 'F', color: '#FFFFFF' },
  shopping: { bg: '#EC6A8E', letter: 'S', color: '#FFFFFF' },
  transport: { bg: '#F7D66A', letter: 'T', color: '#000000' },
  entertainment: { bg: '#9B7BEB', letter: 'E', color: '#FFFFFF' },
  bills: { bg: '#FF8B9A', letter: 'B', color: '#FFFFFF' },
  health: { bg: '#48B49B', letter: 'H', color: '#FFFFFF' },
};

// Default logo for unknown merchants
const defaultLogo: MerchantLogo = { bg: '#E5E5EA', letter: '?', color: '#8E8E93' };

/**
 * Get the merchant logo for a given description/category.
 * Searches for known merchant names in the description.
 */
export function getMerchantLogo(description: string, category?: string): MerchantLogo {
  const text = (description + ' ' + (category || '')).toLowerCase();

  // Check each known merchant
  for (const [key, logo] of Object.entries(merchantLogos)) {
    if (text.includes(key)) return logo;
  }

  // Fallback: use first letter of description
  const firstLetter = (description || '?')[0].toUpperCase();
  return {
    bg: '#E5E5EA',
    letter: firstLetter,
    color: '#3A3A3C',
  };
}

// ─── Bank Logo Mapping ────────────────────────────────────
// Bank logos for account cards

export type BankLogo = {
  bg: string;
  letter: string;
  color: string;
};

const bankLogos: Record<string, BankLogo> = {
  hdfc: { bg: '#004B8D', letter: 'H', color: '#FFFFFF' },
  kotak: { bg: '#ED1C24', letter: 'K', color: '#FFFFFF' },
  sbi: { bg: '#1C4587', letter: 'S', color: '#FFFFFF' },
  icici: { bg: '#F37A20', letter: 'I', color: '#FFFFFF' },
  axis: { bg: '#97144D', letter: 'A', color: '#FFFFFF' },
  cash: { bg: '#34C759', letter: 'C', color: '#FFFFFF' },
  wallet: { bg: '#34C759', letter: 'W', color: '#FFFFFF' },
  upi: { bg: '#5F259F', letter: 'U', color: '#FFFFFF' },
  gpay: { bg: '#4285F4', letter: 'G', color: '#FFFFFF' },
  google: { bg: '#4285F4', letter: 'G', color: '#FFFFFF' },
  phonepe: { bg: '#5F259F', letter: 'P', color: '#FFFFFF' },
  paytm: { bg: '#00BAF2', letter: 'P', color: '#FFFFFF' },
};

const defaultBankLogo: BankLogo = { bg: '#202320', letter: '?', color: '#A5AAA3' };

/**
 * Get the bank logo for an account name.
 * Searches for known bank names in the account name.
 */
export function getBankLogo(accountName: string): BankLogo {
  const name = accountName.toLowerCase();

  for (const [key, logo] of Object.entries(bankLogos)) {
    if (name.includes(key)) return logo;
  }

  const firstLetter = (accountName || '?')[0].toUpperCase();
  return {
    bg: '#202320',
    letter: firstLetter,
    color: '#A5AAA3',
  };
}
