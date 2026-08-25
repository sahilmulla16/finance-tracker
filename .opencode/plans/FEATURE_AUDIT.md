# Pocketflow Finance — Feature & Architecture Audit

**Date:** 2026-08-25
**App Location:** `artifacts/mobile/`
**Status:** Plan Mode - Read Only

---

## 1. Current Screens & Navigation

| Screen | Route | Status |
|--------|-------|--------|
| Home (Dashboard) | `/(tabs)/index` | ✅ Working |
| Expenses List | `/(tabs)/expenses` | ✅ Working |
| Insights | `/(tabs)/insights` | ✅ Working |
| Settings | `/settings` | ✅ Working (but many placeholders) |
| Not Found | `+not-found` | ✅ Exists |

**Navigation:** Expo Router with tabs + stack for settings. Bottom tabs: Home, Expenses, Insights.

---

## 2. Current Data Models (FinanceContext.tsx)

### Category
```typescript
{ id: string; name: string; icon: string; color: string; isDefault?: boolean }
```

### Expense (ONLY transaction type)
```typescript
{ id: string; amount: number; description: string; category: string; icon: string; color: string; date: string; payment: string }
```

### UserSettings
```typescript
{ currency: 'INR'|'USD'|'EUR'|'GBP'|'AED'; appearance: 'system'|'light'|'dark'; defaultPayment: string; notificationsEnabled: boolean; biometricEnabled: boolean }
```

**Critical Gaps:**
- ❌ No **Income** transaction type
- ❌ No **Transfer** transaction type
- ❌ No **Adjustment** transaction type
- ❌ No **Wallet/Account** model
- ❌ No **Savings Goal** model
- ❌ No **Budget** model
- ❌ No **Opening Balance** concept
- ❌ No **Credit Card Liability** tracking

---

## 3. Current Storage (AsyncStorage)

| Key | Content |
|-----|---------|
| `@pocketflow/expenses` | Expense[] |
| `@pocketflow/categories` | Category[] |
| `@pocketflow/settings` | UserSettings |

**No migration strategy exists.** Any schema change will break existing user data.

---

## 4. Settings Screen — Functional vs Placeholder Audit

### GENERAL
| Item | Current Behavior | Status |
|------|------------------|--------|
| Profile | Shows "Sahil Mulla" hardcoded | 🟡 Placeholder |
| Currency | Alert with 5 options → updates settings.currency | ✅ Works |
| Appearance | Alert with 3 options → updates settings.appearance | ✅ Works |

### FINANCE
| Item | Current Behavior | Status |
|------|------------------|--------|
| Categories | Expandable list with edit/delete/add | ✅ Works (but no income categories) |
| **Wallets & accounts** | **Alert: "will be available in next native build"** | ❌ **DEAD BUTTON** |
| **Payment methods** | **Alert placeholder** | ❌ **DEAD BUTTON** |
| **Budgets** | **Alert placeholder** | ❌ **DEAD BUTTON** |
| **Savings goals** | **Alert placeholder** | ❌ **DEAD BUTTON** |

### QUICK ACCESS
| Item | Current Behavior | Status |
|------|------------------|--------|
| **Quick Add** | **Alert placeholder** | ❌ **DEAD BUTTON** |
| **Notification preference** | Toggles `settings.notificationsEnabled` | 🟡 UI only (no push implementation) |

### SECURITY
| Item | Current Behavior | Status |
|------|------------------|--------|
| **App Lock** | Toggles `settings.biometricEnabled` | 🟡 **FAKE SWITCH** - no actual lock screen |

### DATA
| Item | Current Behavior | Status |
|------|------------------|--------|
| **Export data (JSON)** | Shares JSON via Share sheet | ✅ Works |
| **Export data (CSV)** | Shares CSV via Share sheet | ✅ Works |
| **Import/Restore** | ❌ Does not exist | ❌ **MISSING** |
| **Backup to cloud** | ❌ Does not exist | ❌ **MISSING** |

### ABOUT
| Item | Current Behavior | Status |
|------|------------------|--------|
| **Version** | Alert with hardcoded "1.0.0" | 🟡 Placeholder |
| **Privacy** | Alert placeholder | ❌ **DEAD BUTTON** |
| **Terms** | Alert placeholder | ❌ **DEAD BUTTON** |

---

## 5. Dashboard (Home) — Calculation Audit

**Current calculations in `index.tsx`:**
```typescript
const monthTotal = expenses.reduce((sum, item) => sum + item.amount, 0);
const todayTotal = expenses.filter(...).reduce((sum, item) => sum + item.amount, 0);
const categoryTotals = categories.map(c => ({
  ...c,
  total: expenses.filter(e => e.category === c.name).reduce((sum, e) => sum + e.amount, 0)
})).filter(t => t.total > 0);
```

**Issues:**
- ❌ **All transactions treated as expenses** — no income deduction
- ❌ **No account balances** — only expense totals
- ❌ **Hardcoded "8.4% vs last month"** — fake trend
- ❌ **No "Total Balance", "Available Balance", "Savings", "Credit Card Liability"**
- ❌ **Transfers would be counted as spending** (if they existed)
- ❌ **No monthly comparison logic** — just current month expenses

---

## 6. Insights — Calculation Audit

**Current calculations in `insights.tsx`:**
```typescript
const total = expenses.reduce((sum, item) => sum + item.amount, 0);
const average = expenses.length ? Math.round(total / Math.max(new Date().getDate(), 1)) : 0;
const groups = expenses.reduce((acc, item) => { acc[item.category] = (acc[item.category] || 0) + item.amount; return acc; }, {});
const top = Object.entries(groups).sort((a, b) => b[1] - a[1]);
const largest = [...expenses].sort((a, b) => b.amount - a.amount)[0];
```

**Issues:**
- ❌ Same as dashboard — all transactions = expenses
- ❌ "Daily average" divides by day of month, not actual days with data
- ❌ No income tracking
- ❌ Transfers would inflate spending
- ❌ Credit card purchases counted once (correct) but payments would be double-counted
- ❌ Hardcoded "8.4% compared with July"

---

## 7. Expenses Screen

**Current behavior:** Lists all expenses with search/filter. Shows "ALL TIME" total = sum of all expense amounts.

**Issues:**
- ❌ No filtering by account/wallet
- ❌ No income/transfer tabs
- ❌ No date range filter
- ❌ No category filter (only search text)

---

## 8. Quick Add (Modal in Home)

**Current behavior:** Adds expense with amount, description, category, payment method.

**Issues:**
- ❌ Only creates `Expense` type
- ❌ No account/wallet selection
- ❌ No income/transfer toggle
- ❌ Uses `settings.defaultPayment` only

---

## 9. Category Management

**Current behavior:** Add/edit/delete categories with icon/color picker. Default categories cannot be deleted.

**Issues:**
- ❌ Deletion blocked if category has expenses — **no re-categorization flow**
- ❌ No category hierarchy (parent/child)
- ❌ Categories tied to expense `category` string name — not ID (fragile)
- ❌ No income-specific categories

---

## 10. Export/Backup

**Current:** JSON and CSV export via Share sheet.

**Issues:**
- ❌ **No import/restore**
- ❌ No automatic backup
- ❌ CSV format is basic (no account, no transaction type)

---

## 11. Hardcoded Values & Fake Data

| Location | Hardcoded Value |
|----------|-----------------|
| `index.tsx:146` | "8.4% vs last month" |
| `insights.tsx:12` | "8.4% compared with July" |
| `insights.tsx:12` | "Your August" (hardcoded month) |
| `settings.tsx:41` | "Sahil Mulla" profile name |
| `settings.tsx:41` | "Main Wallet · UPI" subtitle |
| `FinanceContext.tsx:37-41` | Seed expenses (3 items) |

---

## 12. Duplicate Calculations

| Calculation | Locations |
|-------------|-----------|
| Total expenses this month | `index.tsx`, `insights.tsx` |
| Category totals | `index.tsx`, `insights.tsx` |
| Largest expense | `insights.tsx` only |
| All-time total | `expenses.tsx`, could be elsewhere |

**No centralized financial engine exists.**

---

## 13. Missing Features (Per Requirements)

| Feature | Status |
|---------|--------|
| Income transactions | ❌ Missing |
| Transfer transactions | ❌ Missing |
| Adjustment transactions | ❌ Missing |
| Wallet/Account architecture | ❌ Missing |
| Account types (Cash, Bank, UPI, Credit Card, Savings) | ❌ Missing |
| Opening balances | ❌ Missing |
| Credit card liability tracking | ❌ Missing |
| Account adjustments/reconciliation | ❌ Missing |
| Savings Goals | ❌ Missing (UI placeholder only) |
| Budgets | ❌ Missing (UI placeholder only) |
| Data import/restore | ❌ Missing |
| App lock (biometric) | 🟡 Setting exists, no implementation |
| Push notifications | 🟡 Setting exists, no implementation |

---

## 14. Required Schema Changes (Migration Needed)

### New Models Needed

```typescript
// Transaction (replaces Expense)
type TransactionType = 'EXPENSE' | 'INCOME' | 'TRANSFER' | 'ADJUSTMENT';
type Transaction = {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  categoryId: string;  // FK to Category
  categoryName: string; // denormalized for display
  categoryIcon: string;
  categoryColor: string;
  date: string; // ISO
  accountId: string; // FK to Account
  accountName: string;
  // For transfers:
  toAccountId?: string;
  toAccountName?: string;
  // For adjustments:
  adjustmentNote?: string;
  createdAt: string;
  updatedAt: string;
};

// Account/Wallet
type AccountType = 'CASH' | 'BANK' | 'UPI' | 'SAVINGS' | 'CREDIT_CARD' | 'OTHER';
type Account = {
  id: string;
  name: string;
  type: AccountType;
  currency: Currency;
  openingBalance: number;
  currentBalance: number; // derived or stored
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

// Category (extended)
type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  isDefault: boolean;
  type: 'EXPENSE' | 'INCOME' | 'BOTH'; // for filtering
  parentId?: string; // for hierarchy
  createdAt: string;
  updatedAt: string;
};

// Savings Goal
type SavingsGoal = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  currency: Currency;
  deadline?: string; // ISO date
  icon: string;
  color: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Optional: associated account for "real" transfers
  accountId?: string;
};

// Budget
type Budget = {
  id: string;
  name: string;
  amount: number;
  currency: Currency;
  period: 'MONTHLY' | 'WEEKLY' | 'YEARLY';
  categoryId?: string; // null = overall budget
  startDate: string;
  endDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
```

### Migration Strategy

1. **Add version to storage** — `@pocketflow/schemaVersion`
2. **On app load:** Check version, run migrations sequentially
3. **Migration 1 → 2:**
   - Convert `Expense[]` → `Transaction[]` with `type: 'EXPENSE'`
   - Add `categoryId` by matching name to Category
   - Create default "Cash" account, assign all expenses to it
   - Create default "Income" category
   - Preserve all existing data exactly
4. **Migration 2 → 3:**
   - Add Account model
   - Add SavingsGoal model
   - Add Budget model
   - Add schemaVersion = 3

---

## 15. Implementation Sequence (Milestones)

### Milestone 1: Settings Completion (Week 1)
- [ ] Make "Wallets & accounts" screen functional (list, add, edit, delete, set default)
- [ ] Make "Payment methods" functional (manage list, set default)
- [ ] Make "Budgets" functional (create, edit, delete, progress tracking)
- [ ] Make "Savings goals" functional (create, edit, delete, add money, progress)
- [ ] Make "Quick Add" setting functional (configure default account, category, etc.)
- [ ] Implement **App Lock** with expo-local-authentication (real biometric lock screen)
- [ ] Implement **Import/Restore** (JSON/CSV)
- [ ] Make "Version" read from package.json
- [ ] Make "Privacy" and "Terms" open web URLs
- [ ] Make "Profile" editable (name, avatar)

### Milestone 2: Wallet/Account Architecture (Week 2)
- [ ] Create Account model + storage
- [ ] Create Account management screens (list, add, edit, delete, set default)
- [ ] Implement account types: Cash, Bank, UPI, Savings, Credit Card, Other
- [ ] Implement opening balance (stored as ADJUSTMENT transaction)
- [ ] Implement current balance derivation (opening + income - expenses + transfers in - transfers out + adjustments)
- [ ] Add account selector to Quick Add
- [ ] Add account filter to Expenses screen

### Milestone 3: Central Financial Engine (Week 2-3)
- [ ] Create `FinancialEngine` class/module with pure functions
- [ ] Implement:
  - `calculateAccountBalance(accountId, transactions)`
  - `calculateTotalBalance(accounts, transactions)`
  - `calculateAvailableBalance(accounts, transactions)` — excludes credit card liability
  - `calculateCreditCardLiability(accounts, transactions)`
  - `calculateNetWorth(accounts, transactions)`
  - `calculateIncome(transactions, period)`
  - `calculateExpenses(transactions, period)`
  - `calculateTransfers(transactions, period)`
  - `calculateSavings(savingsGoals)`
  - `calculateCategoryTotals(transactions, categories, period, type)`
  - `calculateBudgetProgress(budget, transactions)`
- [ ] Replace all inline calculations in Dashboard, Insights, Expenses with engine calls
- [ ] Add unit tests for engine

### Milestone 4: Transaction Model Overhaul (Week 3)
- [ ] Migrate `Expense` → `Transaction` with types
- [ ] Add Income flow (Quick Add toggle or separate screen)
- [ ] Add Transfer flow (from account → to account)
- [ ] Add Adjustment flow (reconcile account)
- [ ] Update Quick Add to support type selection
- [ ] Update Expenses screen with tabs: All / Expenses / Income / Transfers

### Milestone 5: Credit Card Logic (Week 3)
- [ ] Implement credit card purchase = EXPENSE + liability increase
- [ ] Implement credit card payment = TRANSFER (bank → credit card) reducing liability
- [ ] Ensure payments don't count as expenses
- [ ] Show credit card liability in Dashboard/Accounts

### Milestone 6: Savings Goals (Week 4)
- [ ] Complete Savings Goal model + CRUD screens
- [ ] Implement "Add Money" — virtual allocation OR real transfer (configurable)
- [ ] Dashboard savings section (preserve existing visual design)
- [ ] Progress calculations (%, remaining, monthly suggestion if deadline)

### Milestone 7: Budgets (Week 4)
- [ ] Complete Budget model + CRUD screens
- [ ] Monthly + category budgets
- [ ] Progress tracking (expenses only, not income/transfers)
- [ ] Alerts/notifications when nearing limit

### Milestone 8: Dashboard & Insights Correction (Week 4-5)
- [ ] Dashboard: Show Total Balance, Available Balance, Savings, Credit Card Liability
- [ ] Dashboard: Income vs Expenses vs Transfers breakdown
- [ ] Insights: Use financial engine for all calculations
- [ ] Insights: Monthly comparison (real, not hardcoded)
- [ ] Insights: Income/Expense/Transfer breakdown
- [ ] Insights: Net worth trend

### Milestone 9: Migration & Regression Testing (Week 5)
- [ ] Implement migration system
- [ ] Test with existing user data
- [ ] Test scenarios from Phase 23 (HDFC, Cash, Savings, Credit Card)
- [ ] Verify no double-counting
- [ ] Settings persistence test (Phase 24)

---

## 16. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Data loss during migration | Critical | Run migration on copy first, backup before migrate, extensive test cases |
| Breaking existing expense display | High | Keep `category` string denormalized, map old expenses to new model |
| Credit card logic complexity | Medium | Isolate in financial engine, test thoroughly with scenarios |
| Settings that need native modules (biometric) | Medium | Use `expo-local-authentication`, fallback to PIN if unavailable |
| Performance with large transaction lists | Low | Use `useMemo`, virtualized lists, pagination |
| iOS/Android biometric differences | Low | Test on both platforms, graceful degradation |

---

## 17. Testing Plan

### Unit Tests (Financial Engine)
- Account balance calculations
- Transfer between accounts (net worth unchanged)
- Credit card purchase + payment flow
- Opening balance handling
- Adjustment handling
- Savings goal progress
- Budget progress

### Integration Tests
- Full migration from v1 → v2 → v3
- Quick Add → Dashboard update
- Settings change → persistence → restart → verify
- Category delete with re-categorization

### Manual Test Scenarios (Phase 23)
1. HDFC Bank: ₹50,000 opening
2. Cash: ₹5,000 opening
3. Savings: ₹20,000 opening
4. Credit Card: ₹5,000 liability
5. Salary: +₹50,000 → HDFC (INCOME)
6. Lunch: ₹500 → HDFC (EXPENSE)
7. Uber: ₹300 → Cash (EXPENSE)
8. Transfer: ₹5,000 → HDFC → Savings (TRANSFER)
9. Credit Card purchase: ₹2,000 (EXPENSE + liability)
10. Credit Card payment: ₹1,000 → HDFC → Credit Card (TRANSFER)

**Expected:**
- HDFC: 50,000 + 50,000 - 500 - 5,000 - 1,000 = 93,500
- Cash: 5,000 - 300 = 4,700
- Savings: 20,000 + 5,000 = 25,000
- Credit Card: 5,000 + 2,000 - 1,000 = 6,000 liability
- Total Balance: 93,500 + 4,700 + 25,000 = 123,200
- Credit Card Liability: 6,000
- Available Balance: 123,200 - 6,000 = 117,200
- Income: 50,000
- Expenses: 500 + 300 + 2,000 = 2,800
- Transfers: 5,000 + 1,000 = 6,000 (net 0 across owned accounts)

---

## 18. Clarifying Questions

1. **Savings Goal Model:** Should "Add Money" be a virtual allocation (just increments goal.currentAmount) or a real transfer from an account? (Recommendation: configurable per goal)

2. **Credit Card Payment:** Should paying a credit card from a bank account be a TRANSFER type, or a special SETTLEMENT type?

3. **Budget Period:** Support only monthly, or also weekly/custom?

4. **Category Hierarchy:** Need parent/child categories (e.g., "Transport → Uber", "Transport → Fuel")?

5. **Multi-currency:** Current code supports 5 currencies in settings. Do we need per-account currency with conversion?

6. **App Lock:** Should it lock the entire app on background, or only sensitive screens?

7. **Notifications:** Local notifications only, or push via server?

8. **Data Export Format:** Should JSON export include all new models (accounts, savings, budgets)?

---

## 19. Dependencies to Add

| Package | Purpose |
|---------|---------|
| `expo-local-authentication` | Biometric app lock |
| `expo-file-system` | Import/export file handling |
| `expo-document-picker` | Pick backup files for restore |
| `date-fns` or `dayjs` | Date manipulation (replace manual Date math) |
| `zod` | Schema validation for migrations |

---

## 20. Files to Modify (High-Level)

| File | Changes |
|------|---------|
| `context/FinanceContext.tsx` | Complete rewrite with new models, migrations, financial engine |
| `app/(tabs)/index.tsx` | Use financial engine for all calculations |
| `app/(tabs)/insights.tsx` | Use financial engine for all calculations |
| `app/(tabs)/expenses.tsx` | Add tabs for income/transfers, account filter |
| `app/settings.tsx` | Implement all placeholder functionality |
| `components/` | New components for Account, Savings, Budget management |
| New: `utils/financialEngine.ts` | Centralized calculation layer |
| New: `utils/migrations.ts` | Migration system |
| New: `types/` | All new TypeScript types |

---

## 21. Success Criteria Checklist

- [ ] Every Settings item functional (tap → action → save → persist → restart → verify)
- [ ] Custom categories work in Quick Add, History, Search, Filters, Dashboard, Insights, Budgets
- [ ] Category delete → re-categorize flow works
- [ ] Wallets/Accounts: create, edit, delete, types, opening balance, default, active
- [ ] Transaction types: EXPENSE, INCOME, TRANSFER, ADJUSTMENT all work
- [ ] Credit cards: purchase = expense + liability, payment = transfer (not expense)
- [ ] Opening balances stored as adjustments, not fake income
- [ ] Account adjustments work for reconciliation
- [ ] Total Balance, Available Balance, Savings, Credit Card Liability defined and distinct
- [ ] Savings Goals: create, edit, delete, add money, progress, dashboard display
- [ ] Budgets: create, edit, delete, monthly/category, progress, alerts
- [ ] Dashboard uses financial engine, shows correct numbers
- [ ] Insights uses financial engine, correct spending/income/transfers
- [ ] History reflects all changes immediately
- [ ] Quick Add writes to new architecture
- [ ] Existing user data preserved through migration
- [ ] No placeholder buttons remain
- [ ] No hardcoded financial totals
- [ ] No duplicate calculations across screens