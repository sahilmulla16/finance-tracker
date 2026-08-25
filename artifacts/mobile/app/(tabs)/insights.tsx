import { Feather } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFinance, type Transaction, type Category } from '@/context/FinanceContext';

const money = (amount: number) => '₹' + amount.toLocaleString('en-IN', { maximumFractionDigits: 2 });

export default function InsightsScreen() {
  const { transactions, categories } = useFinance();
  const insets = useSafeAreaInsets();

  const expenseTransactions = useMemo(() => transactions.filter(t => t.type === 'EXPENSE'), [transactions]);

  const total = expenseTransactions.reduce((sum, item) => sum + item.amount, 0);
  const expenseCount = expenseTransactions.length;
  const daysInMonth = new Date().getDate();
  const average = expenseCount ? Math.round(total / Math.max(daysInMonth, 1)) : 0;

  const groups = useMemo(() => {
    return expenseTransactions.reduce<Record<string, number>>((acc, item) => {
      acc[item.category || 'Other'] = (acc[item.category || 'Other'] || 0) + item.amount;
      return acc;
    }, {});
  }, [expenseTransactions]);

  const top = Object.entries(groups).sort((a, b) => b[1] - a[1]);
  const largest = [...expenseTransactions].sort((a, b) => b.amount - a.amount)[0];
  const largestCategory = largest ? categories.find(c => c.name === largest.category) : undefined;

  // Monthly comparison - this month vs last month
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const thisMonthExpenses = expenseTransactions.filter(t => new Date(t.date) >= thisMonthStart);
  const lastMonthExpenses = expenseTransactions.filter(t => new Date(t.date) >= lastMonthStart && new Date(t.date) <= lastMonthEnd);

  const thisMonthTotal = thisMonthExpenses.reduce((sum, t) => sum + t.amount, 0);
  const lastMonthTotal = lastMonthExpenses.reduce((sum, t) => sum + t.amount, 0);
  const monthChange = lastMonthTotal > 0 ? Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100) : 0;

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const thisMonthName = monthNames[now.getMonth()];
  const lastMonthName = monthNames[(now.getMonth() + 11) % 12];

  return <ScrollView style={styles.screen} contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: 38 }}>
    <Text style={styles.kicker}>A QUIET LOOK AT</Text>
    <Text style={styles.title}>Your {thisMonthName}</Text>
    <View style={styles.hero}>
      <Text style={styles.heroLabel}>TOTAL SPENT</Text>
      <Text style={styles.heroValue}>{money(total)}</Text>
      <View style={styles.heroMeta}>
        <Feather name={monthChange >= 0 ? 'trending-up' : 'trending-down'} size={15} color={monthChange >= 0 ? '#A6F0D2' : '#F5B8B8'} />
        <Text style={styles.heroMetaText}>
          {monthChange >= 0 ? '+' : ''}{monthChange}% vs {lastMonthName}
        </Text>
      </View>
    </View>
    <View style={styles.stats}>
      <View style={styles.stat}>
        <Text style={styles.statLabel}>DAILY AVERAGE</Text>
        <Text style={styles.statValue}>{money(average)}</Text>
        <Text style={styles.statSub}>per day</Text>
      </View>
      <View style={styles.stat}>
        <Text style={styles.statLabel}>EXPENSES</Text>
        <Text style={styles.statValue}>{expenseCount}</Text>
        <Text style={styles.statSub}>this month</Text>
      </View>
    </View>
    <Text style={styles.section}>Top categories</Text>
    <View style={styles.card}>
      {top.slice(0, 4).map(([name, amount], index) => {
        const cat = categories.find(c => c.name === name);
        return (
          <View style={styles.category} key={name}>
            <View style={styles.rank}>
              <Text style={styles.rankText}>{index + 1}</Text>
            </View>
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryName}>{name}</Text>
              {cat && <View style={[styles.categoryColor, { backgroundColor: cat.color }]} />}
            </View>
            <Text style={styles.categoryAmount}>{money(amount)}</Text>
          </View>
        );
      })}
      {top.length === 0 && <Text style={styles.muted}>Add a few expenses to see your patterns.</Text>}
    </View>
    <Text style={styles.section}>Largest expense</Text>
    <View style={styles.largest}>
      <View style={[styles.largeIcon, { backgroundColor: (largestCategory?.color || '#2868E8') + '20' }]}>
        <Feather name={(largestCategory?.icon || 'shopping-bag') as never} size={21} color={largestCategory?.color || '#2868E8'} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.largeName}>{largest?.description || 'Nothing yet'}</Text>
        <Text style={styles.largeSub}>{largest?.category || 'Your biggest spends will show here'}</Text>
      </View>
      <Text style={styles.largeAmount}>{largest ? money(largest.amount) : '—'}</Text>
    </View>
  </ScrollView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F8FF', paddingHorizontal: 18 },
  kicker: { color: '#2868E8', fontSize: 10, fontWeight: '700', letterSpacing: 1.2 },
  title: { color: '#14213D', fontSize: 30, fontWeight: '700', letterSpacing: -0.8, marginTop: 5, marginBottom: 22 },
  hero: { backgroundColor: '#17356F', borderRadius: 28, padding: 22, shadowColor: '#17356F', shadowOpacity: .18, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 7 },
  heroLabel: { color: '#9EB9F0', fontSize: 10, letterSpacing: 1.2, fontWeight: '700' },
  heroValue: { color: '#FFF', fontSize: 35, fontWeight: '700', marginTop: 14 },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 9 },
  heroMetaText: { color: '#A6F0D2', fontSize: 12 },
  stats: { flexDirection: 'row', gap: 12, marginTop: 12 },
  stat: { flex: 1, backgroundColor: '#FFF', borderRadius: 19, padding: 16, borderWidth: 1, borderColor: '#E4EAF4' },
  statLabel: { color: '#91A0B5', fontSize: 9, letterSpacing: .8, fontWeight: '700' },
  statValue: { color: '#253756', fontSize: 20, fontWeight: '700', marginTop: 11 },
  statSub: { color: '#91A0B5', fontSize: 11, marginTop: 3 },
  section: { color: '#253756', fontSize: 17, fontWeight: '700', marginTop: 27, marginBottom: 12 },
  card: { backgroundColor: '#FFF', borderRadius: 22, padding: 14, borderWidth: 1, borderColor: '#E4EAF4' },
  category: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 11 },
  rank: { width: 27, height: 27, borderRadius: 10, backgroundColor: '#EAF0FF', alignItems: 'center', justifyContent: 'center' },
  rankText: { color: '#2868E8', fontSize: 12, fontWeight: '700' },
  categoryInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  categoryName: { flex: 1, color: '#33435E', fontSize: 13, fontWeight: '500' },
  categoryColor: { width: 10, height: 10, borderRadius: 5 },
  categoryAmount: { color: '#253756', fontSize: 13, fontWeight: '700' },
  muted: { color: '#91A0B5', fontSize: 13, paddingVertical: 16 },
  largest: { backgroundColor: '#FFF', borderRadius: 22, padding: 15, borderWidth: 1, borderColor: '#E4EAF4', flexDirection: 'row', alignItems: 'center', gap: 12 },
  largeIcon: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  largeName: { color: '#253756', fontSize: 15, fontWeight: '600' },
  largeSub: { color: '#91A0B5', fontSize: 12, marginTop: 3 },
  largeAmount: { color: '#253756', fontSize: 18, fontWeight: '700' },
});