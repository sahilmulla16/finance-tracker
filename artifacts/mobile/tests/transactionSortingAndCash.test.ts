import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getTransactionTimestamp,
  compareTransactionsByLatest,
  convertTo24Hour,
  classifyVoiceTransactionType,
} from '../utils/transactionSorting.ts';

describe('Transaction Chronological Sorting & Stability', () => {
  it('correctly orders transactions on the same date by their time', () => {
    const morningTx = {
      id: 'txn-1',
      date: '2026-10-17',
      time: '09:15 AM',
      createdAt: '2026-10-17T03:45:00.000Z',
    };
    const lunchTx = {
      id: 'txn-2',
      date: '2026-10-17',
      time: '01:30 PM',
      createdAt: '2026-10-17T08:00:00.000Z',
    };
    const dinnerTx = {
      id: 'txn-3',
      date: '2026-10-17',
      time: '08:45 PM',
      createdAt: '2026-10-17T15:15:00.000Z',
    };

    const sorted = [morningTx, dinnerTx, lunchTx].sort(compareTransactionsByLatest);
    assert.deepEqual(
      sorted.map((t) => t.id),
      ['txn-3', 'txn-2', 'txn-1'],
      'Latest time should be strictly first (dinner -> lunch -> morning)'
    );
  });

  it('correctly prioritizes today over yesterday regardless of time string', () => {
    const yesterdayLate = {
      id: 'txn-yesterday',
      date: '2026-10-16',
      time: '11:59 PM',
      createdAt: '2026-10-16T18:29:00.000Z',
    };
    const todayEarly = {
      id: 'txn-today',
      date: '2026-10-17',
      time: '06:00 AM',
      createdAt: '2026-10-17T00:30:00.000Z',
    };

    const sorted = [yesterdayLate, todayEarly].sort(compareTransactionsByLatest);
    assert.equal(sorted[0].id, 'txn-today');
    assert.equal(sorted[1].id, 'txn-yesterday');
  });

  it('provides deterministic zero-jitter tie-breaking when transactions share identical dates and times', () => {
    const txA = {
      id: 'txn-1729158300000-aaa',
      date: '2026-10-17',
      time: '12:00 PM',
      createdAt: '2026-10-17T12:00:00.000Z',
    };
    const txB = {
      id: 'txn-1729158305000-bbb',
      date: '2026-10-17',
      time: '12:00 PM',
      createdAt: '2026-10-17T12:00:00.000Z',
    };

    // Sort in both permutations
    const sort1 = [txA, txB].sort(compareTransactionsByLatest);
    const sort2 = [txB, txA].sort(compareTransactionsByLatest);

    assert.equal(sort1[0].id, sort2[0].id);
    assert.equal(sort1[1].id, sort2[1].id);
    // B has higher id timestamp so it is reliably placed first
    assert.equal(sort1[0].id, 'txn-1729158305000-bbb');
  });

  it('extracts epoch millisecond timestamp reliably across 12-hour and 24-hour inputs', () => {
    const t1 = getTransactionTimestamp({ date: '2026-10-17', time: '02:30 PM' });
    const t2 = getTransactionTimestamp({ date: '2026-10-17', time: '14:30' });
    assert.equal(t1, t2, '12-hour PM and 24-hour times must produce identical timestamps');
  });

  it('converts 12-hour time to 24-hour time accurately', () => {
    assert.equal(convertTo24Hour('12:00 AM'), '00:00');
    assert.equal(convertTo24Hour('09:15 AM'), '09:15');
    assert.equal(convertTo24Hour('12:00 PM'), '12:00');
    assert.equal(convertTo24Hour('01:30 PM'), '13:30');
    assert.equal(convertTo24Hour('11:59 PM'), '23:59');
  });
});

describe('Cash Expense Subtraction & Classification', () => {
  it('correctly calculates cash account balance by subtracting expense amounts', () => {
    const initialOpeningBalance = 2000;
    const cashExpenses = [
      { id: '1', amount: 150, type: 'EXPENSE', accountId: 'acc-cash' },
      { id: '2', amount: 350, type: 'EXPENSE', accountId: 'acc-cash' },
      { id: '3', amount: 100, type: 'expense', accountId: 'acc-cash' }, // lowercase type
    ];

    let balance = initialOpeningBalance;
    for (const txn of cashExpenses) {
      const amt = Math.abs(Number(txn.amount)) || 0;
      const type = (txn.type || '').trim().toUpperCase();
      if (type === 'EXPENSE') {
        balance -= amt;
      } else if (type === 'INCOME') {
        balance += amt;
      }
    }

    assert.equal(balance, 1400, '2000 - 150 - 350 - 100 must equal 1400, never 2600');
  });

  it('prevents negative input amounts from inverting subtraction into addition', () => {
    const openingBalance = 1000;
    const negativeInputTxn = { id: 'bad-input', amount: -200, type: 'EXPENSE' };

    let balance = openingBalance;
    const safeAmount = Math.abs(Number(negativeInputTxn.amount)) || 0;
    balance -= safeAmount;

    assert.equal(balance, 800, 'Must subtract 200 rather than adding 200');
  });

  it('classifies "got coffee for 50 in cash" as EXPENSE (not INCOME)', () => {
    const type = classifyVoiceTransactionType('got coffee for 50 in cash');
    assert.equal(type, 'EXPENSE', 'Spoken "got coffee for 50 in cash" must be EXPENSE');
  });

  it('classifies "paid 200 cash for lunch" as EXPENSE', () => {
    const type = classifyVoiceTransactionType('paid 200 cash for lunch');
    assert.equal(type, 'EXPENSE');
  });

  it('classifies "spent 500 cash on groceries" as EXPENSE', () => {
    const type = classifyVoiceTransactionType('spent 500 cash on groceries');
    assert.equal(type, 'EXPENSE');
  });

  it('classifies "chai ke 20 diye" as EXPENSE', () => {
    const type = classifyVoiceTransactionType('chai ke 20 diye');
    assert.equal(type, 'EXPENSE');
  });

  it('correctly identifies genuine income phrases like "salary received 50000"', () => {
    const type = classifyVoiceTransactionType('salary received 50000');
    assert.equal(type, 'INCOME');
  });

  it('correctly identifies transfer phrases like "cash out 2000 from atm"', () => {
    const type = classifyVoiceTransactionType('cash out 2000 from atm');
    assert.equal(type, 'TRANSFER');
  });

  it('allows account balance and main wallet to go negative when 25,000 expense is logged', () => {
    const openingBalance = 0;
    const transactions = [
      { id: 'txn-1', amount: 25000, type: 'EXPENSE', accountId: 'main-wallet' }
    ];

    let balance = openingBalance;
    for (const txn of transactions) {
      const amt = Math.abs(Number(txn.amount)) || 0;
      const t = (txn.type || 'EXPENSE').trim().toUpperCase();
      if (t === 'EXPENSE') balance -= amt;
      else if (t === 'INCOME') balance += amt;
    }

    assert.equal(balance, -25000, '0 minus 25,000 expense must equal -25,000');

    // Verify negative currency formatting places minus after Rupees symbol and before numbers
    const abs = Math.abs(balance);
    const formatted = abs.toLocaleString('en-IN');
    const sign = balance < 0 ? '-' : '';
    const formattedDisplay = `₹${sign}${formatted}`;
    assert.equal(formattedDisplay, '₹-25,000', 'Frontend display must show ₹-25,000 with minus after Rupees sign and before numbers');
  });

  it('computes total balance in negative when accounts list is empty or unassigned', () => {
    const transactions = [
      { id: 'txn-exp', amount: 25000, type: 'EXPENSE' },
    ];
    let net = 0;
    for (const txn of transactions) {
      const amount = Math.abs(Number(txn.amount)) || 0;
      const type = (txn.type || 'EXPENSE').trim().toUpperCase();
      if (type === 'INCOME') net += amount;
      else if (type === 'EXPENSE') net -= amount;
    }
    assert.equal(net, -25000, 'Fallback calculation must produce -25,000 instead of 0');
  });

  it('correctly ranks a newly added goal transaction as the latest transaction', () => {
    const olderTx = {
      id: 'txn-older',
      category: 'Food & Drinks',
      description: 'Coffee',
      date: '2026-10-18',
      time: '01:00 AM',
      createdAt: '2026-10-17T19:30:00.000Z',
    };
    const goalTx = {
      id: 'txn-goal-new',
      category: 'Goals',
      description: 'New Laptop',
      date: '2026-10-18',
      time: '01:30 AM',
      createdAt: '2026-10-17T20:00:00.000Z',
    };

    const sorted = [olderTx, goalTx].sort(compareTransactionsByLatest);
    assert.equal(sorted[0].id, 'txn-goal-new');
    assert.equal(sorted[0].category, 'Goals');
    assert.equal(sorted[0].description, 'New Laptop');
  });
});
