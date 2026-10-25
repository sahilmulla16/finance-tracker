import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { processLocalZenoQuery } from '../services/ai/localZenoEngine';
import { computeFinancialAggregates } from '../services/ai/financialDataAggregator';
import type { Transaction, Category, Account } from '../context/FinanceContext';
import type { AITransactionListData } from '../services/ai/aiTypes';

describe('Zeno AI — Relevant Transactions Filter on "See all transactions"', () => {
  const mockCategories: Category[] = [
    { id: 'cat-health', name: 'Health', icon: 'activity', color: '#10B981', isCustom: false },
    { id: 'cat-food', name: 'Food', icon: 'coffee', color: '#F59E0B', isCustom: false },
    { id: 'cat-shopping', name: 'Shopping', icon: 'shopping-bag', color: '#EC4899', isCustom: false },
  ];

  const mockAccounts: Account[] = [
    { id: 'acc-1', name: 'Main Checking', type: 'CHECKING', balance: 50000, color: '#3B82F6', isDefault: true },
  ];

  const mockTransactions: Transaction[] = [
    {
      id: 'tx-health-1',
      description: 'Pharmacy Apollo Meds',
      amount: 1200,
      date: '2026-10-20',
      category: 'Health',
      categoryId: 'cat-health',
      accountId: 'acc-1',
      type: 'EXPENSE',
      createdAt: '2026-10-20T10:00:00.000Z',
    },
    {
      id: 'tx-health-2',
      description: 'Dental Clinic Consultation',
      amount: 2500,
      date: '2026-10-18',
      category: 'Health',
      categoryId: 'cat-health',
      accountId: 'acc-1',
      type: 'EXPENSE',
      createdAt: '2026-10-18T14:30:00.000Z',
    },
    {
      id: 'tx-food-1',
      description: 'Swiggy Dinner',
      amount: 450,
      date: '2026-10-21',
      category: 'Food',
      categoryId: 'cat-food',
      accountId: 'acc-1',
      type: 'EXPENSE',
      createdAt: '2026-10-21T20:15:00.000Z',
    },
    {
      id: 'tx-shopping-1',
      description: 'Zara Jacket',
      amount: 3999,
      date: '2026-10-19',
      category: 'Shopping',
      categoryId: 'cat-shopping',
      accountId: 'acc-1',
      type: 'EXPENSE',
      createdAt: '2026-10-19T16:00:00.000Z',
    },
    {
      id: 'tx-transfer-1',
      description: 'Transfer to Savings',
      amount: 10000,
      date: '2026-10-15',
      category: 'Transfer',
      fromAccountId: 'acc-1',
      toAccountId: 'acc-2',
      type: 'TRANSFER',
      createdAt: '2026-10-15T09:00:00.000Z',
    },
  ];

  const mockSettings = { currency: '₹' } as any;

  it('1. Generates category-specific transaction_list card with category="Health" for "Show my spending in health"', () => {
    const aggregates = computeFinancialAggregates(mockTransactions, mockCategories, mockAccounts, 50000);
    const response = processLocalZenoQuery('Show my spending in health', {
      transactions: mockTransactions,
      categories: mockCategories,
      accounts: mockAccounts,
      settings: mockSettings,
      aggregates,
      monthlyBudget: 50000,
    });

    assert.ok(response.cards, 'Response must have structured cards');
    const txListCard = response.cards.find(
      (c): c is AITransactionListData => c.type === 'transaction_list',
    );

    assert.ok(txListCard, 'Must contain a transaction_list card');
    assert.equal(txListCard.category, 'Health', 'Card must have category metadata set to "Health"');
    assert.equal(txListCard.filterType, 'EXPENSE', 'Card filterType must be EXPENSE');
    assert.equal(txListCard.transactions.length, 2, 'Should only contain the 2 Health transactions');
    assert.ok(
      txListCard.transactions.every((t) => t.category === 'Health'),
      'All transactions in the card must belong to Health',
    );
  });

  it('2. Filtering logic strictly isolates only Health transactions and rejects non-health', () => {
    const selectedCategory = 'Health';
    const catLower = selectedCategory.toLowerCase().trim();

    const filtered = mockTransactions.filter((item) => {
      const itemCat = (item.category || '').toLowerCase().trim();
      return itemCat === catLower;
    });

    assert.equal(filtered.length, 2, 'Only 2 transactions must match Health');
    assert.deepEqual(
      filtered.map((t) => t.id),
      ['tx-health-1', 'tx-health-2'],
      'Must contain only Apollo Meds and Dental Clinic',
    );
    assert.ok(
      !filtered.some((t) => t.category === 'Food' || t.category === 'Shopping' || t.type === 'TRANSFER'),
      'Must not include Food, Shopping, or Transfer transactions',
    );
  });

  it('3. Generates merchant-filtered transaction_list for merchant queries (e.g. Swiggy)', () => {
    const aggregates = computeFinancialAggregates(mockTransactions, mockCategories, mockAccounts, 50000);
    const response = processLocalZenoQuery('Show spending on Swiggy', {
      transactions: mockTransactions,
      categories: mockCategories,
      accounts: mockAccounts,
      settings: mockSettings,
      aggregates,
    });

    assert.ok(response.cards, 'Response must have cards');
    const txCard = response.cards.find(
      (c): c is AITransactionListData => c.type === 'transaction_list',
    );
    assert.ok(txCard, 'Must include transaction_list card');
    assert.equal(txCard.filterQuery?.toLowerCase(), 'swiggy', 'filterQuery must be swiggy');
    assert.equal(txCard.filterType, 'EXPENSE');
  });

  it('4. Generates transfer-filtered transaction_list for transfer queries', () => {
    const aggregates = computeFinancialAggregates(mockTransactions, mockCategories, mockAccounts, 50000);
    const response = processLocalZenoQuery('Show my account transfers', {
      transactions: mockTransactions,
      categories: mockCategories,
      accounts: mockAccounts,
      settings: mockSettings,
      aggregates,
    });

    assert.ok(response.cards, 'Response must have cards');
    const txCard = response.cards.find(
      (c): c is AITransactionListData => c.type === 'transaction_list',
    );
    assert.ok(txCard, 'Must include transaction_list card');
    assert.equal(txCard.filterType, 'TRANSFER', 'filterType must be TRANSFER');
  });

  it('5. Fallback category inference when category field is absent', () => {
    // Card with uniform category across transactions but missing explicit category property
    const rawCard: AITransactionListData = {
      type: 'transaction_list',
      title: 'Recent Expenses',
      transactions: [
        { id: '1', description: 'Clinic', amount: '₹500', date: '2026-10-20', category: 'Health', type: 'EXPENSE' },
        { id: '2', description: 'Medicine', amount: '₹300', date: '2026-10-18', category: 'Health', type: 'EXPENSE' },
      ],
    };

    const targetCategory =
      rawCard.category ||
      (rawCard.transactions.length > 0 &&
      rawCard.transactions.every(
        (t) => t.category && t.category.toLowerCase() === rawCard.transactions[0].category.toLowerCase(),
      )
        ? rawCard.transactions[0].category
        : undefined);

    assert.equal(targetCategory, 'Health', 'Fallback must accurately detect Health as uniform category');
  });
});

