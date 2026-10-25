import sqlite3
import time

def setup_and_benchmark():
    conn = sqlite3.connect(":memory:")
    cursor = conn.cursor()

    # Create tables
    cursor.execute("""
    CREATE TABLE zeno_transactions (
        id TEXT PRIMARY KEY,
        amount REAL NOT NULL,
        type TEXT NOT NULL,
        description TEXT,
        normalized_merchant TEXT,
        category TEXT,
        category_id TEXT,
        account_id TEXT,
        date TEXT,
        time TEXT,
        created_at TEXT,
        updated_at TEXT
    );
    """)

    cursor.execute("""
    CREATE TABLE zeno_merchant_rules (
        normalized_key TEXT PRIMARY KEY,
        display_name TEXT NOT NULL,
        category_id TEXT NOT NULL,
        category_name TEXT NOT NULL,
        enabled INTEGER NOT NULL DEFAULT 1,
        preferred_account_id TEXT,
        scope TEXT NOT NULL DEFAULT 'GLOBAL',
        updated_at TEXT NOT NULL
    );
    """)

    # Create optimized indexes
    cursor.execute("CREATE INDEX idx_zeno_tx_account ON zeno_transactions(account_id);")
    cursor.execute("CREATE INDEX idx_zeno_tx_date ON zeno_transactions(date DESC);")
    cursor.execute("CREATE INDEX idx_zeno_tx_month_type ON zeno_transactions(type, date);")
    cursor.execute("CREATE INDEX idx_zeno_tx_merchant ON zeno_transactions(normalized_merchant);")
    cursor.execute("CREATE INDEX idx_zeno_tx_dedup ON zeno_transactions(amount, date);")
    cursor.execute("CREATE INDEX idx_zeno_rules_norm ON zeno_merchant_rules(normalized_key);")

    # Insert 50,000 synthetic transactions
    print("Inserting 50,000 synthetic transactions...")
    t0 = time.perf_counter()
    rows = []
    merchants = ["starbucks", "amazon", "uber", "swiggy", "zomato", "smart_point", "rv_traders", "shell", "airtel", "netflix"]
    types = ["EXPENSE", "EXPENSE", "EXPENSE", "INCOME", "TRANSFER"]
    accounts = ["acc-1", "acc-2", "acc-cash"]

    for i in range(50000):
        m = merchants[i % len(merchants)]
        t = types[i % len(types)]
        acc = accounts[i % len(accounts)]
        amt = 50.0 + (i % 500) * 10.0
        d = f"2026-{(10 - (i % 10)):02d}-{(1 + (i % 28)):02d}"
        rows.append((
            f"txn-{i}", amt, t, f"{m} payment #{i}", m, "Food", "cat-food", acc, d, "12:00", f"{d}T12:00:00Z", f"{d}T12:00:00Z"
        ))

    cursor.executemany("""
    INSERT INTO zeno_transactions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, rows)
    conn.commit()
    t_insert = (time.perf_counter() - t0) * 1000
    print(f"50,000 transactions inserted in {t_insert:.1f}ms")

    # Insert merchant rules
    cursor.execute("""
    INSERT INTO zeno_merchant_rules VALUES
    ('rv_traders', 'RV TRADERS', 'cat-petrol', 'Petrol', 1, NULL, 'GLOBAL', '2026-10-17T12:00:00Z'),
    ('starbucks', 'Starbucks', 'cat-food', 'Food & Drinks', 1, NULL, 'GLOBAL', '2026-10-17T12:00:00Z'),
    ('smart_point', 'Smart Point', 'cat-groceries', 'Groceries', 1, NULL, 'GLOBAL', '2026-10-17T12:00:00Z');
    """)
    conn.commit()

    print("\n--- EXPLAIN QUERY PLAN VERIFICATION ---")

    queries = [
        ("Account balance summary",
         "SELECT type, SUM(amount) FROM zeno_transactions WHERE account_id = 'acc-1' GROUP BY type"),

        ("Date range monthly report",
         "SELECT category, SUM(amount) FROM zeno_transactions WHERE type = 'EXPENSE' AND date >= '2026-10-01' AND date <= '2026-10-31' GROUP BY category"),

        ("Merchant memory lookup",
         "SELECT category_id, category_name FROM zeno_merchant_rules WHERE normalized_key = 'rv_traders' AND enabled = 1"),

        ("Historical merchant transactions count",
         "SELECT COUNT(*) FROM zeno_transactions WHERE normalized_merchant = 'rv_traders' AND type = 'EXPENSE'"),

        ("Duplicate check on amount + date",
         "SELECT id FROM zeno_transactions WHERE amount = 150.0 AND date = '2026-10-17'"),

        ("Recent 20 transactions for history pagination",
         "SELECT id, amount, type, description, date, time FROM zeno_transactions ORDER BY date DESC LIMIT 20 OFFSET 0")
    ]

    for label, sql in queries:
        print(f"\nQuery: {label}")
        print(f"SQL: {sql}")
        plan = cursor.execute(f"EXPLAIN QUERY PLAN {sql}").fetchall()
        for p in plan:
            print(f" -> Plan: {p}")

        # Benchmark actual execution time
        t_start = time.perf_counter()
        for _ in range(100):
            cursor.execute(sql).fetchall()
        t_avg = ((time.perf_counter() - t_start) / 100) * 1000
        print(f" -> Execution Time (over 50,000 rows): {t_avg:.3f} ms")

if __name__ == "__main__":
    setup_and_benchmark()

