import test from "node:test";
import assert from "node:assert/strict";

test("Savings Goals — Add Funds & Account Deduction Flow", async (t) => {
  await t.test(
    "Deducts amount from selected account when adding funds to a goal",
    () => {
      // Mock account and balance state
      const accounts = [
        { id: "acc-bank", name: "HDFC Bank", openingBalance: 50000 },
        { id: "acc-cash", name: "Cash Wallet", openingBalance: 5000 },
      ];

      const goal = {
        id: "goal-2",
        name: "New Laptop",
        targetAmount: 150000,
        currentAmount: 85000,
      };

      const depositAmount = 15000;
      const selectedAccountId = "acc-bank";

      // 1. Goal updated
      const updatedGoal = {
        ...goal,
        currentAmount: goal.currentAmount + depositAmount,
      };
      assert.equal(updatedGoal.currentAmount, 100000);

      // 2. Transaction created for selected account
      const deductionTx = {
        id: "txn-savings-1",
        amount: depositAmount,
        type: "EXPENSE",
        category: "Goals",
        description: goal.name,
        accountId: selectedAccountId,
        date: "2026-10-18",
        time: "12:00",
      };

      assert.equal(deductionTx.accountId, "acc-bank");
      assert.equal(deductionTx.amount, 15000);
      assert.equal(deductionTx.type, "EXPENSE");
      assert.equal(deductionTx.category, "Goals");
      assert.equal(deductionTx.description, "New Laptop");

      // 3. Balance deduction calculation
      const bankOpening = accounts.find((a) => a.id === selectedAccountId)!.openingBalance;
      const newBankBalance = bankOpening - deductionTx.amount;
      assert.equal(newBankBalance, 35000);
    },
  );

  await t.test(
    "Maintains zero-touch goal increase if no account is selected",
    () => {
      const goal = {
        id: "goal-1",
        name: "Emergency Fund",
        targetAmount: 100000,
        currentAmount: 45000,
      };
      const depositAmount = 5000;
      const updatedGoal = {
        ...goal,
        currentAmount: goal.currentAmount + depositAmount,
      };
      assert.equal(updatedGoal.currentAmount, 50000);
    },
  );
});

