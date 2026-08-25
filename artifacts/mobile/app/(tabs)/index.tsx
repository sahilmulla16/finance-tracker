import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFinance, type Category, type Account } from '@/context/FinanceContext';
import { router } from 'expo-router';

const money = (amount: number) => `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const greeting = () => {
  const hour = new Date().getHours();
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
};

function IconBubble({ icon, color, size = 42 }: { icon: string; color: string; size?: number }) {
  return (
    <View style={[styles.iconBubble, { width: size, height: size, borderRadius: size / 3, backgroundColor: `${color}20` }]}>
      <Feather name={icon as never} size={size * 0.43} color={color} />
    </View>
  );
}

type TransactionType = 'EXPENSE' | 'INCOME' | 'TRANSFER';

function QuickAdd({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { categories, accounts, addTransaction, addExpense } = useFinance();
  const insets = useSafeAreaInsets();
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>(categories[0]);
  const [account, setAccount] = useState<Account | undefined>(accounts.find(a => a.isDefault) || accounts[0]);
  const [fromAccount, setFromAccount] = useState<Account | undefined>(accounts.find(a => a.isDefault) || accounts[0]);
  const [toAccount, setToAccount] = useState<Account | undefined>(accounts.filter(a => a.id !== (accounts.find(a => a.isDefault) || accounts[0])?.id)[0] || accounts[1]);
  const [showAll, setShowAll] = useState(false);

  const defaultAccount = accounts.find(a => a.isDefault) || accounts[0];

  const suggestion = useMemo(() => {
    const text = description.toLowerCase();
    if (text.includes('uber') || text.includes('taxi') || text.includes('fuel')) return categories[1];
    if (text.includes('amazon') || text.includes('shop') || text.includes('cloth')) return categories[2];
    if (text.includes('bill') || text.includes('rent') || text.includes('electric')) return categories[3];
    if (text.includes('gym') || text.includes('medicine')) return categories[4];
    return category;
  }, [description, category, categories]);

  const save = async () => {
    const parsed = Number(amount.replace(/,/g, ''));
    if (!parsed || parsed <= 0) return;

    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().slice(0, 5);

    if (type === 'EXPENSE') {
      const cat = suggestion;
      await addTransaction({
        type: 'EXPENSE',
        amount: parsed,
        description: description.trim() || cat.name,
        category: cat.name,
        categoryId: cat.id,
        accountId: account?.id,
        date,
        time,
      });
      // Also add to legacy expenses for backward compatibility
      await addExpense(parsed, description.trim() || cat.name, cat, account?.name);
    } else if (type === 'INCOME') {
      await addTransaction({
        type: 'INCOME',
        amount: parsed,
        description: description.trim() || 'Income',
        accountId: account?.id,
        date,
        time,
      });
    } else if (type === 'TRANSFER') {
      if (fromAccount?.id === toAccount?.id) {
        Alert.alert('Invalid transfer', 'Source and destination accounts must be different.');
        return;
      }
      await addTransaction({
        type: 'TRANSFER',
        amount: parsed,
        description: description.trim() || 'Transfer',
        fromAccountId: fromAccount?.id,
        toAccountId: toAccount?.id,
        date,
        time,
      });
    }

    setAmount('');
    setDescription('');
    setCategory(categories[0]);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.sheetBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 18) }]}>
          <View style={styles.handle} />
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.eyebrow}>QUICK CAPTURE</Text>
              <Text style={styles.sheetTitle}>{type === 'EXPENSE' ? 'Add expense' : type === 'INCOME' ? 'Add income' : 'Add transfer'}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}><Feather name="x" size={20} color="#74839B" /></Pressable>
          </View>

          <View style={styles.typeSelector}>
            {(['EXPENSE', 'INCOME', 'TRANSFER'] as TransactionType[]).map((t) => (
              <Pressable key={t} onPress={() => { setType(t); void Haptics.selectionAsync(); }} style={[styles.typeButton, type === t && styles.typeButtonActive]}>
                <Text style={[styles.typeButtonText, type === t && styles.typeButtonTextActive]}>{t}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.amountLabel}>AMOUNT</Text>
          <View style={styles.amountRow}>
            <Text style={styles.currency}>₹</Text>
            <TextInput
              testID={`${type.toLowerCase()}-amount`}
              autoFocus
              value={amount}
              onChangeText={(value) => setAmount(value.replace(/[^0-9.]/g, ''))}
              placeholder="0"
              placeholderTextColor="#B5C0D2"
              keyboardType="decimal-pad"
              style={styles.amountInput}
            />
          </View>

          <TextInput
            testID={`${type.toLowerCase()}-description`}
            value={description}
            onChangeText={setDescription}
            placeholder={type === 'TRANSFER' ? 'Transfer note (optional)' : 'What was it for?'}
            placeholderTextColor="#9AA8BC"
            style={styles.descriptionInput}
            returnKeyType="done"
          />

          {type === 'EXPENSE' && (
            <>
              <Text style={styles.amountLabel}>CATEGORY</Text>
              <View style={styles.categoryGrid}>
                {(showAll ? categories : categories.slice(0, 4)).map((item) => {
                  const active = item.id === suggestion.id;
                  return (
                    <Pressable key={item.id} testID={`category-${item.id}`} onPress={() => { setCategory(item); void Haptics.selectionAsync(); }} style={[styles.categoryChip, active && { backgroundColor: item.color, borderColor: item.color }]}>
                      <Feather name={item.icon as never} size={16} color={active ? '#FFF' : item.color} />
                      <Text style={[styles.categoryText, active && styles.categoryTextActive]}>{item.name === 'Food & Drinks' ? 'Food' : item.name}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <Pressable onPress={() => setShowAll(!showAll)} style={styles.moreCategories}>
                <Text style={styles.moreText}>{showAll ? 'Show less' : 'More categories'}</Text>
                <Feather name={showAll ? 'chevron-up' : 'chevron-down'} size={15} color="#2868E8" />
              </Pressable>
            </>
          )}

          {(type === 'EXPENSE' || type === 'INCOME') && (
            <>
              <Text style={styles.amountLabel}>ACCOUNT</Text>
              <View style={styles.accountGrid}>
                {accounts.filter(a => a.isActive).map((acc) => (
                  <Pressable key={acc.id} onPress={() => { setAccount(acc); void Haptics.selectionAsync(); }} style={[styles.accountChip, account?.id === acc.id && { backgroundColor: '#2868E8', borderColor: '#2868E8' }]}>
                    <Feather name={accountTypeIcons[acc.type] as never} size={16} color={account?.id === acc.id ? '#FFF' : '#2868E8'} />
                    <Text style={[styles.accountChipText, account?.id === acc.id && styles.accountChipTextActive]}>{acc.name}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          {type === 'TRANSFER' && (
            <>
              <Text style={styles.amountLabel}>FROM ACCOUNT</Text>
              <View style={styles.accountGrid}>
                {accounts.filter(a => a.isActive).map((acc) => (
                  <Pressable key={acc.id} onPress={() => { setFromAccount(acc); if (toAccount?.id === acc.id) setToAccount(accounts.find(a => a.id !== acc.id)); void Haptics.selectionAsync(); }} style={[styles.accountChip, fromAccount?.id === acc.id && { backgroundColor: '#D95765', borderColor: '#D95765' }]}>
                    <Feather name={accountTypeIcons[acc.type] as never} size={16} color={fromAccount?.id === acc.id ? '#FFF' : '#D95765'} />
                    <Text style={[styles.accountChipText, fromAccount?.id === acc.id && styles.accountChipTextActive]}>{acc.name}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.amountLabel}>TO ACCOUNT</Text>
              <View style={styles.accountGrid}>
                {accounts.filter(a => a.isActive && a.id !== fromAccount?.id).map((acc) => (
                  <Pressable key={acc.id} onPress={() => { setToAccount(acc); void Haptics.selectionAsync(); }} style={[styles.accountChip, toAccount?.id === acc.id && { backgroundColor: '#2C9C77', borderColor: '#2C9C77' }]}>
                    <Feather name={accountTypeIcons[acc.type] as never} size={16} color={toAccount?.id === acc.id ? '#FFF' : '#2C9C77'} />
                    <Text style={[styles.accountChipText, toAccount?.id === acc.id && styles.accountChipTextActive]}>{acc.name}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          <Pressable testID={`save-${type.toLowerCase()}`} onPress={() => void save()} style={({ pressed }) => [styles.saveButton, pressed && { opacity: 0.82 }]}>
            <Text style={styles.saveButtonText}>{type === 'EXPENSE' ? 'Save expense' : type === 'INCOME' ? 'Save income' : 'Save transfer'}</Text>
            <Feather name="arrow-up-right" size={19} color="#FFF" />
          </Pressable>
          <Text style={styles.quickHint}>Saved privately on this device · {new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</Text>
        </View>
      </View>
    </Modal>
  );
}

const accountTypeIcons: Record<string, string> = { CASH: 'dollar-sign', BANK: 'credit-card', UPI: 'smartphone', SAVINGS: 'target', OTHER: 'more-horizontal' };

export default function HomeScreen() {
  const { expenses, categories, transactions, accounts, getTotalBalance, getAccountBalance } = useFinance();
  const [quickAdd, setQuickAdd] = useState(false);
  const [search, setSearch] = useState('');
  const insets = useSafeAreaInsets();

  const totalBalance = getTotalBalance();
  const expenseTotal = transactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);
  const incomeTotal = transactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
  const todayExpenses = transactions.filter(t => t.type === 'EXPENSE' && new Date(t.date).toDateString() === new Date().toDateString());
  const todayTotal = todayExpenses.reduce((sum, t) => sum + t.amount, 0);

  const categoryTotals = categories.map((category) => ({
    ...category,
    total: transactions.filter(t => t.type === 'EXPENSE' && t.category === category.name).reduce((sum, t) => sum + t.amount, 0)
  })).filter((item) => item.total > 0).sort((a, b) => b.total - a.total);

  const filteredTransactions = transactions.filter((item) => `${item.description} ${item.category || ''}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <View style={styles.screen}>
      <LinearGradient colors={['#EAF1FF', '#F7F9FD', '#F5F8FF']} style={StyleSheet.absoluteFill} />
      <FlatList
        data={filteredTransactions.slice(0, 5)}
        keyExtractor={(item) => item.id}
        scrollEnabled={filteredTransactions.length > 0}
        contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 120 }}
        ListHeaderComponent={
          <View>
            <View style={styles.topBar}>
              <View><Text style={styles.greeting}>{greeting()}, Sahil</Text><Text style={styles.dateText}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</Text></View>
              <Pressable testID="open-settings" onPress={() => router.push('/settings')} style={styles.avatar}><Text style={styles.avatarText}>S</Text></Pressable>
            </View>
            <View style={styles.balanceCard}>
              <View style={styles.balanceTop}><Text style={styles.cardEyebrow}>TOTAL BALANCE</Text><Feather name="more-horizontal" size={20} color="#8A9AB3" /></View>
              <Text style={styles.totalAmount}>{money(totalBalance)}</Text>
              <View style={styles.balanceMeta}>
                <View style={[styles.trend, { backgroundColor: '#D8F4E9' }]}><Feather name="arrow-up" size={14} color="#2C9C77" /><Text style={styles.trendText}>Income: {money(incomeTotal)}</Text></View>
                <View style={[styles.trend, { backgroundColor: '#FDE8E8' }]}><Feather name="arrow-down" size={14} color="#D95765" /><Text style={[styles.trendText, { color: '#D95765' }]}>Expenses: {money(expenseTotal)}</Text></View>
              </View>
              <View style={styles.balanceDivider} />
              <View style={styles.todayRow}>
                <View><Text style={styles.todayLabel}>Today</Text><Text style={styles.todayAmount}>{money(todayTotal)}</Text></View>
                <View style={styles.todayCount}><Text style={styles.countValue}>{todayExpenses.length}</Text><Text style={styles.countLabel}>expenses</Text></View>
              </View>
            </View>
            <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Where it goes</Text><Text style={styles.sectionLink}>This month</Text></View>
            <View style={styles.categoryCard}>{categoryTotals.slice(0, 4).map((item, index) => <View key={item.id} style={styles.categoryRow}><IconBubble icon={item.icon} color={item.color} size={34} /><View style={styles.categoryInfo}><View style={styles.categoryNameRow}><Text style={styles.categoryName}>{item.name}</Text><Text style={styles.categoryTotal}>{money(item.total)}</Text></View><View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.max(18, (item.total / Math.max(expenseTotal, 1)) * 100)}%`, backgroundColor: item.color }]} /></View></View></View>)}</View>
            <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Recent activity</Text><Text style={styles.sectionLink}>See all</Text></View>
            <View style={styles.searchBox}><Feather name="search" size={17} color="#9AA8BC" /><TextInput value={search} onChangeText={setSearch} placeholder="Search transactions" placeholderTextColor="#9AA8BC" style={styles.searchInput} /></View>
          </View>
        }
        ListEmptyComponent={<View style={styles.empty}><Feather name="inbox" size={28} color="#2868E8" /><Text style={styles.emptyTitle}>Nothing here yet</Text><Text style={styles.emptyText}>Your transactions will appear once you add your first entry.</Text></View>}
        renderItem={({ item }) => {
          const isExpense = item.type === 'EXPENSE';
          const isIncome = item.type === 'INCOME';
          const isTransfer = item.type === 'TRANSFER';
          return (
            <View style={styles.expenseRow}>
              <IconBubble
                icon={isExpense ? item.category ? 'shopping-bag' : 'dollar-sign' : isIncome ? 'plus-circle' : 'arrow-right'}
                color={isExpense ? item.category ? '#FF8C69' : '#D95765' : isIncome ? '#2C9C77' : '#2868E8'}
              />
              <View style={styles.expenseMain}>
                <Text style={styles.expenseTitle}>{item.description}</Text>
                <Text style={styles.expenseSub}>
                  {isExpense && item.category ? `${item.category} · ` : ''}
                  {isTransfer ? `${accounts.find(a => a.id === item.fromAccountId)?.name || ''} → ${accounts.find(a => a.id === item.toAccountId)?.name || ''} · ` : ''}
                  {new Date(item.date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                </Text>
              </View>
              <Text style={[styles.expenseAmount, isIncome && { color: '#2C9C77' }, isTransfer && { color: '#2868E8' }]}>
                {isExpense ? '−' : isIncome ? '+' : '↔'}{money(item.amount)}
              </Text>
            </View>
          );
        }}
      />
      <Pressable testID="quick-add" onPress={() => { setQuickAdd(true); void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }} style={({ pressed }) => [styles.fab, { bottom: Math.max(insets.bottom, 18) + 68 }, pressed && { transform: [{ scale: 0.96 }] }]}><Feather name="plus" size={22} color="#FFF" /><Text style={styles.fabText}>Add</Text></Pressable>
      <QuickAdd visible={quickAdd} onClose={() => setQuickAdd(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F8FF' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, marginBottom: 22 },
  greeting: { color: '#14213D', fontSize: 24, fontWeight: '700', letterSpacing: -0.6 },
  dateText: { color: '#8090AA', fontSize: 13, marginTop: 5 },
  avatar: { width: 42, height: 42, borderRadius: 15, backgroundColor: '#2868E8', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  balanceCard: { marginHorizontal: 18, padding: 22, borderRadius: 28, backgroundColor: '#17356F', shadowColor: '#17356F', shadowOpacity: 0.18, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 7 },
  balanceTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardEyebrow: { color: '#9EB9F0', fontSize: 11, letterSpacing: 1.2, fontWeight: '700' },
  totalAmount: { color: '#FFF', fontSize: 37, fontWeight: '700', letterSpacing: -1.5, marginTop: 14 },
  balanceMeta: { flexDirection: 'row', gap: 8, marginTop: 7, flexWrap: 'wrap' },
  trend: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 8 },
  trendText: { color: '#238260', fontSize: 12, fontWeight: '700' },
  mutedMeta: { color: '#A6BADF', fontSize: 12 },
  balanceDivider: { height: 1, backgroundColor: '#40609A', marginVertical: 18 },
  todayRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  todayLabel: { color: '#9EB9F0', fontSize: 12 }, todayAmount: { color: '#FFF', fontSize: 18, fontWeight: '600', marginTop: 5 },
  todayCount: { alignItems: 'flex-end' }, countValue: { color: '#FFF', fontSize: 18, fontWeight: '600' }, countLabel: { color: '#9EB9F0', fontSize: 12, marginTop: 5 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 22, marginTop: 27, marginBottom: 12 },
  sectionTitle: { color: '#14213D', fontSize: 17, fontWeight: '700' }, sectionLink: { color: '#2868E8', fontSize: 12, fontWeight: '600' },
  categoryCard: { backgroundColor: '#FFF', marginHorizontal: 18, borderRadius: 22, padding: 15, borderWidth: 1, borderColor: '#E6ECF6' },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 11, marginVertical: 7 },
  iconBubble: { justifyContent: 'center', alignItems: 'center' },
  categoryInfo: { flex: 1 }, categoryNameRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  categoryName: { color: '#31415D', fontSize: 13, fontWeight: '500' }, categoryTotal: { color: '#50617D', fontSize: 13, fontWeight: '600' },
  progressTrack: { height: 5, backgroundColor: '#EEF2F8', borderRadius: 5, overflow: 'hidden' }, progressFill: { height: 5, borderRadius: 5 },
  searchBox: { height: 45, backgroundColor: '#FFF', borderRadius: 14, borderWidth: 1, borderColor: '#E2E9F4', marginHorizontal: 18, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 9 },
  searchInput: { flex: 1, color: '#14213D', fontSize: 14 },
  expenseRow: { marginHorizontal: 22, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  expenseMain: { flex: 1 },
  expenseTitle: { color: '#243653', fontSize: 14, fontWeight: '600' },
  expenseSub: { color: '#91A0B5', fontSize: 12, marginTop: 4 },
  expenseAmount: { color: '#253756', fontSize: 14, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: 42, paddingHorizontal: 40 },
  emptyTitle: { color: '#253756', fontSize: 16, fontWeight: '700', marginTop: 12 },
  emptyText: { color: '#91A0B5', textAlign: 'center', lineHeight: 20, fontSize: 13, marginTop: 7 },
  fab: { position: 'absolute', right: 20, height: 54, paddingHorizontal: 19, borderRadius: 19, backgroundColor: '#2868E8', flexDirection: 'row', alignItems: 'center', gap: 8, shadowColor: '#2868E8', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 7 }, elevation: 8 },
  fabText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  sheetBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(18,32,60,0.42)' },
  sheet: { backgroundColor: '#F8FAFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 22, paddingTop: 10 },
  handle: { width: 42, height: 4, borderRadius: 4, backgroundColor: '#C4CEDD', alignSelf: 'center', marginBottom: 19 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  eyebrow: { color: '#2868E8', fontSize: 10, fontWeight: '700', letterSpacing: 1.2 },
  sheetTitle: { color: '#14213D', fontSize: 26, fontWeight: '700', letterSpacing: -0.7, marginTop: 4 },
  closeButton: { width: 38, height: 38, borderRadius: 14, backgroundColor: '#EAF0FA', justifyContent: 'center', alignItems: 'center' },
  amountLabel: { color: '#8A99AE', fontSize: 10, letterSpacing: 1, fontWeight: '700', marginTop: 25, marginBottom: 5 },
  amountRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#D9E2F0', paddingBottom: 8 },
  currency: { color: '#2868E8', fontSize: 26, fontWeight: '700', marginRight: 7 },
  amountInput: { color: '#14213D', fontSize: 43, fontWeight: '700', flex: 1, padding: 0, letterSpacing: -1 },
  descriptionInput: { backgroundColor: '#FFF', borderRadius: 15, height: 52, paddingHorizontal: 16, color: '#243653', fontSize: 15, marginTop: 19, borderWidth: 1, borderColor: '#E3EAF5' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  categoryChip: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#FFF', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 11, borderWidth: 1, borderColor: '#E2E9F4' },
  categoryText: { color: '#53627A', fontSize: 12, fontWeight: '600' },
  categoryTextActive: { color: '#FFF' },
  moreCategories: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4, marginTop: 13 },
  moreText: { color: '#2868E8', fontSize: 12, fontWeight: '600' },
  saveButton: { height: 55, backgroundColor: '#2868E8', borderRadius: 17, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 9, marginTop: 20 },
  saveButtonText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  quickHint: { textAlign: 'center', color: '#9AA8BC', fontSize: 11, marginTop: 11 },
  typeSelector: { flexDirection: 'row', gap: 8, marginTop: 18, marginBottom: 8 },
  typeButton: { flex: 1, height: 44, borderRadius: 14, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E9F4', justifyContent: 'center', alignItems: 'center' },
  typeButtonActive: { backgroundColor: '#2868E8', borderColor: '#2868E8' },
  typeButtonText: { color: '#2868E8', fontSize: 13, fontWeight: '700' },
  typeButtonTextActive: { color: '#FFF' },
  accountGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginBottom: 8 },
  accountChip: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#FFF', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 11, borderWidth: 1, borderColor: '#E2E9F4' },
  accountChipText: { color: '#2868E8', fontSize: 12, fontWeight: '600' },
  accountChipTextActive: { color: '#FFF' },
});