export interface Transaction {
  id: string;
  amount: number;
  type: "EXPENSE" | "INCOME" | "TRANSFER";
  description: string;
  category?: string;
  categoryId?: string;
  accountId?: string;
  fromAccountId?: string;
  toAccountId?: string;
  date: string;
  time?: string;
  createdAt: string;
  updatedAt: string;
}

export function generateSyntheticTransactions(count: number): Transaction[] {
  const categories = ["Food & Drinks", "Shopping", "Transport", "Bills & Utilities", "Entertainment", "Groceries", "Healthcare"];
  const merchants = [
    "Starbucks Coffee", "Amazon India", "Uber Rides", "Swiggy Food", "Zomato",
    "Smart Point Supermarket", "RV TRADERS", "Shell Fuel Station", "Airtel Postpaid", "Netflix"
  ];
  const accounts = ["acc-1", "acc-2", "acc-cash"];
  const types: ("EXPENSE" | "INCOME" | "TRANSFER")[] = ["EXPENSE", "EXPENSE", "EXPENSE", "INCOME", "TRANSFER"];

  const transactions: Transaction[] = [];
  const baseTime = new Date("2026-10-17T12:00:00.000Z").getTime();

  for (let i = 0; i < count; i++) {
    const txTime = new Date(baseTime - i * 3600 * 1000); // 1 hour intervals
    const dateStr = txTime.toISOString().split("T")[0];
    const timeStr = `${String(txTime.getUTCHours()).padStart(2, "0")}:${String(txTime.getUTCMinutes()).padStart(2, "0")}`;
    const type = types[i % types.length];
    const merchant = merchants[i % merchants.length];
    const category = categories[i % categories.length];
    const accountId = accounts[i % accounts.length];
    const amount = 50 + (i % 500) * 10;

    transactions.push({
      id: `txn-bench-${i}`,
      amount,
      type,
      description: `${merchant} #${i}`,
      category: type === "TRANSFER" ? undefined : category,
      categoryId: type === "TRANSFER" ? undefined : `cat-${category.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
      accountId,
      fromAccountId: type === "TRANSFER" ? accountId : undefined,
      toAccountId: type === "TRANSFER" ? "acc-2" : undefined,
      date: dateStr,
      time: timeStr,
      createdAt: txTime.toISOString(),
      updatedAt: txTime.toISOString(),
    });
  }

  return transactions;
}

