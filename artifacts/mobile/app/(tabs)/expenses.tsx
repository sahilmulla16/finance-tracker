import { Feather } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFinance, type Transaction, type Account } from '@/context/FinanceContext';

const money = (amount: number) => '₹' + amount.toLocaleString('en-IN', { maximumFractionDigits: 2 });

type TabType = 'ALL' | 'EXPENSE' | 'INCOME' | 'TRANSFER';

export default function ExpensesScreen() {
  const { transactions, accounts } = useFinance();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('ALL');
  const insets = useSafeAreaInsets();

  const filtered = useMemo(() => {
    let items = transactions;
    if (activeTab !== 'ALL') {
      items = items.filter(t => t.type === activeTab);
    }
    return items.filter((item) => (item.description + (item.category || '')).toLowerCase().includes(query.toLowerCase()));
  }, [transactions, query, activeTab]);

  const getTabTotal = (type: Transaction['type']) => {
    return transactions.filter(t => t.type === type).reduce((sum, t) => sum + t.amount, 0);
  };

  const allTotal = getTabTotal('EXPENSE') - getTabTotal('INCOME'); // Net spending
  const expenseTotal = getTabTotal('EXPENSE');
  const incomeTotal = getTabTotal('INCOME');
  const transferTotal = getTabTotal('TRANSFER');

  const getTabLabel = (tab: TabType) => {
    switch (tab) {
      case 'ALL': return `All (${filtered.length})`;
      case 'EXPENSE': return `Expenses (${money(expenseTotal)})`;
      case 'INCOME': return `Income (${money(incomeTotal)})`;
      case 'TRANSFER': return `Transfers (${money(transferTotal)})`;
    }
  };

  const renderItem = ({ item }: { item: Transaction }) => {
    const isExpense = item.type === 'EXPENSE';
    const isIncome = item.type === 'INCOME';
    const isTransfer = item.type === 'TRANSFER';
    const fromAcc = accounts.find(a => a.id === item.fromAccountId);
    const toAcc = accounts.find(a => a.id === item.toAccountId);
    const acc = accounts.find(a => a.id === item.accountId);

    return (
      <View style={styles.row}>
        <View style={[styles.icon, { backgroundColor: isExpense ? '#FF8C6920' : isIncome ? '#2C9C7720' : '#2868E820' }]}>
          <Feather name={isExpense ? 'shopping-bag' : isIncome ? 'plus-circle' : 'arrow-right'} size={18} color={isExpense ? '#FF8C69' : isIncome ? '#2C9C77' : '#2868E8'} />
        </View>
        <View style={styles.details}>
          <Text style={styles.name}>{item.description}</Text>
          <Text style={styles.sub}>
            {isExpense && item.category ? `${item.category} · ` : ''}
            {isTransfer ? `${fromAcc?.name || ''} → ${toAcc?.name || ''} · ` : ''}
            {acc ? `${acc.name} · ` : ''}
            {new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </Text>
        </View>
        <View style={styles.amountContainer}>
          <Text style={[styles.amount, isIncome && styles.amountIncome, isTransfer && styles.amountTransfer]}>
            {isExpense ? '−' : isIncome ? '+' : '↔'}{money(item.amount)}
          </Text>
          {isTransfer && <Text style={styles.transferLabel}>Transfer</Text>}
        </View>
      </View>
    );
  };

  return <View style={styles.screen}>
    <View style={styles.header}>
      <View>
        <Text style={styles.kicker}>YOUR MONEY</Text>
        <Text style={styles.title}>Transactions</Text>
      </View>
      <View style={styles.total}>
        <Text style={styles.totalLabel}>{activeTab === 'ALL' ? 'NET' : activeTab}</Text>
        <Text style={styles.totalValue}>
          {activeTab === 'ALL' ? money(allTotal) : activeTab === 'EXPENSE' ? money(expenseTotal) : activeTab === 'INCOME' ? money(incomeTotal) : money(transferTotal)}
        </Text>
      </View>
    </View>
    <View style={styles.tabBar}>
      {(['ALL', 'EXPENSE', 'INCOME', 'TRANSFER'] as TabType[]).map((tab) => (
        <Pressable key={tab} onPress={() => setActiveTab(tab)} style={[styles.tab, activeTab === tab && styles.tabActive]}>
          <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
        </Pressable>
      ))}
    </View>
    <View style={styles.search}>
      <Feather name="search" size={17} color="#96A4B9" />
      <TextInput value={query} onChangeText={setQuery} placeholder="Search by name or category" placeholderTextColor="#96A4B9" style={styles.input} />
    </View>
    <Text style={styles.resultLabel}>{filtered.length} {filtered.length === 1 ? 'transaction' : 'transactions'}</Text>
    <FlatList
      data={filtered}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingTop: 8, paddingBottom: 40, paddingHorizontal: 22 }}
      ListEmptyComponent={<View style={styles.empty}><Feather name="search" size={28} color="#2868E8" /><Text style={styles.emptyTitle}>No transactions found</Text><Text style={styles.emptyText}>Try a different search, or add your first transaction from Home.</Text></View>}
      renderItem={renderItem}
    />
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F8FF' },
  header: { paddingHorizontal: 22, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 },
  kicker: { color: '#2868E8', fontSize: 10, fontWeight: '700', letterSpacing: 1.2 },
  title: { color: '#14213D', fontSize: 30, fontWeight: '700', letterSpacing: -0.8, marginTop: 5 },
  total: { alignItems: 'flex-end' },
  totalLabel: { color: '#96A4B9', fontSize: 10, letterSpacing: 1, fontWeight: '700' },
  totalValue: { color: '#223553', fontSize: 16, fontWeight: '700', marginTop: 5 },
  tabBar: { flexDirection: 'row', gap: 8, marginHorizontal: 18, marginBottom: 12 },
  tab: { flex: 1, height: 40, borderRadius: 12, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E9F4', justifyContent: 'center', alignItems: 'center' },
  tabActive: { backgroundColor: '#2868E8', borderColor: '#2868E8' },
  tabText: { color: '#2868E8', fontSize: 12, fontWeight: '700' },
  tabTextActive: { color: '#FFF' },
  search: { marginHorizontal: 18, height: 50, borderRadius: 16, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E9F4', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 9 },
  input: { flex: 1, color: '#14213D', fontSize: 14 },
  resultLabel: { color: '#8493A9', fontSize: 12, marginHorizontal: 22, marginTop: 8, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, gap: 12 },
  icon: { width: 44, height: 44, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  details: { flex: 1 },
  name: { color: '#253756', fontSize: 14, fontWeight: '600' },
  sub: { color: '#94A2B7', fontSize: 12, marginTop: 5 },
  amountContainer: { alignItems: 'flex-end' },
  amount: { color: '#253756', fontSize: 14, fontWeight: '700' },
  amountIncome: { color: '#2C9C77' },
  amountTransfer: { color: '#2868E8' },
  transferLabel: { color: '#2868E8', fontSize: 9, fontWeight: '700', marginTop: 2 },
  empty: { alignItems: 'center', padding: 46 },
  emptyTitle: { color: '#253756', fontSize: 16, fontWeight: '700', marginTop: 12 },
  emptyText: { color: '#91A0B5', textAlign: 'center', lineHeight: 20, fontSize: 13, marginTop: 7 },
});