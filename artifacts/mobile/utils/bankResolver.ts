import { BANK_BRANDS, type BankBrandDefinition, type BankBrandId } from '@/constants/bankLogos';
import type { AccountType } from '@/context/FinanceContext';

type BankAliasEntry = {
  id: BankBrandId;
  patterns: string[];
};

const BANK_ALIASES: BankAliasEntry[] = [
  {
    id: 'hdfc',
    patterns: ['hdfc', 'hdfc bank', 'hdfcbank', 'hdfc direct'],
  },
  {
    id: 'sbi',
    patterns: ['sbi', 'state bank of india', 'state bank', 'sbionline', 'sbi bank', 'state bank india'],
  },
  {
    id: 'icici',
    patterns: ['icici', 'icici bank', 'icicibank', 'icici direct'],
  },
  {
    id: 'axis',
    patterns: ['axis', 'axis bank', 'axisbank', 'uti bank'],
  },
  {
    id: 'idfc',
    patterns: ['idfc', 'idfc first', 'idfc first bank', 'idfc bank', 'idfcfirst', 'idfc first bank ltd'],
  },
  {
    id: 'kotak',
    patterns: ['kotak', 'kotak mahindra', 'kotak bank', 'kotak mahindra bank', 'kotak811', '811'],
  },
  {
    id: 'indusind',
    patterns: ['indusind', 'indusind bank', 'indus ind'],
  },
  {
    id: 'yes',
    patterns: ['yes bank', 'yesbank', 'yes'],
  },
  {
    id: 'baroda',
    patterns: ['bank of baroda', 'baroda', 'bob', 'bob bank'],
  },
  {
    id: 'pnb',
    patterns: ['punjab national bank', 'pnb', 'punjab national'],
  },
  {
    id: 'canara',
    patterns: ['canara', 'canara bank'],
  },
  {
    id: 'union',
    patterns: ['union bank of india', 'union bank', 'ubi'],
  },
  {
    id: 'boi',
    patterns: ['bank of india', 'boi'],
  },
  {
    id: 'federal',
    patterns: ['federal bank', 'federal'],
  },
  {
    id: 'rbl',
    patterns: ['rbl bank', 'rbl', 'ratnakar bank', 'ratnakar'],
  },
  {
    id: 'au',
    patterns: ['au small finance bank', 'au small finance', 'au bank', 'aubank'],
  },
  {
    id: 'dbs',
    patterns: ['dbs bank', 'dbs', 'digibank'],
  },
  {
    id: 'hsbc',
    patterns: ['hsbc bank', 'hsbc'],
  },
  {
    id: 'sc',
    patterns: ['standard chartered', 'scb', 'stan chart', 'stanchart'],
  },
  {
    id: 'citi',
    patterns: ['citibank', 'citi bank', 'citi', 'citicorp'],
  },
  {
    id: 'cash',
    patterns: ['cash', 'petty cash', 'physical cash', 'pocket cash', 'wallet cash', 'main wallet'],
  },
  {
    id: 'upi',
    patterns: ['upi', 'gpay', 'google pay', 'phonepe', 'paytm', 'bhim', 'cred'],
  },
];

/**
 * Normalizes an account/bank string by removing punctuation, corporate suffixes,
 * and excess spacing for robust matching.
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')
    .replace(/\b(ltd|limited|pvt|private|inc|incorporated|corp|corporation|branch|india)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Resolves an account name and optional type to an authentic bank brand definition.
 * If no known bank is identified, gracefully falls back to account-type based or
 * generic financial institution visual.
 */
export function resolveBankBrand(
  accountName?: string,
  accountType?: AccountType
): BankBrandDefinition {
  const raw = accountName || '';
  const normalized = normalizeName(raw);

  // 1. Direct pattern matching on normalized name
  if (normalized) {
    for (const entry of BANK_ALIASES) {
      for (const pattern of entry.patterns) {
        // Check exact match or word-boundary containment
        if (
          normalized === pattern ||
          normalized.startsWith(pattern + ' ') ||
          normalized.endsWith(' ' + pattern) ||
          normalized.includes(' ' + pattern + ' ')
        ) {
          return BANK_BRANDS[entry.id];
        }
      }
    }

    // Secondary pass: loose substring match for distinct brands
    for (const entry of BANK_ALIASES) {
      // Exclude generic words like 'yes' or 'au' from loose substring to avoid false positives
      if (entry.id === 'yes' || entry.id === 'au') continue;
      for (const pattern of entry.patterns) {
        if (normalized.includes(pattern)) {
          return BANK_BRANDS[entry.id];
        }
      }
    }
  }

  // 2. Fallback based on AccountType
  if (accountType === 'CASH') {
    return BANK_BRANDS.cash;
  }
  if (accountType === 'UPI') {
    return BANK_BRANDS.upi;
  }
  if (accountType === 'SAVINGS') {
    return BANK_BRANDS.cash;
  }

  // 3. Clean generic bank fallback
  return BANK_BRANDS.generic;
}

