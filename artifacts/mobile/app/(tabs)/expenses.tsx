import { Feather } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFinance, type Transaction } from '@/context/FinanceContext';
import { useColors } from '@/hooks/useColors';
import { money, formatDate } from '@/utils/format';
import { spacing, radius, fontSize, fontWeight, lineHeight } from '@/constants/tokens';

type TabType = 'ALL' | 'EXPENSE' | 'INCOME' | 'TRANSFER';

function groupByDate(transactions: Transaction[]): { date: string; label: string; items: Transaction[] }[] {
  const groups: Record<string, Transaction[]> = {};
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const yesterday = new Date(now.setDate(now.getDate() - 1)).toISOString().split('T')[0];

  for (const tx of transactions) {
    if (!groups[tx.date]) groups[tx.date] = [];
    groups[tx.date].push(tx);
  }

  const sorted = Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, items]) => ({
      date,
      label: date === today ? 'Today' : date === yesterday ? 'Yesterday' : formatDate(date),
      items,
    }));

  return sorted;
}

export default function TransactionsScreen() {
  const { transactions, accounts, settings } = useFinance();
  const colors = useColors();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('ALL');
  const insets = useSafeAreaInsets();

  const filtered = useMemo(() => {
    let items = transactions;
    if (activeTab !== 'ALL') items = items.filter(t => t.type === activeTab);
    return items.filter((item) =>
      (item.description + (item.category || '')).toLowerCase().includes(query.toLowerCase())
    );
  }, [transactions, query, activeTab]);

  const groups = useMemo(() => groupByDate(filtered), [filtered]);

  const tabs: { key: TabType; label: string }[] = [
    { key: 'ALL', label: 'All' },
    { key: 'INCOME', label: 'Income' },
    { key: 'EXPENSE', label: 'Expense' },
    { key: 'TRANSFER', label: 'Transfer' },
  ];

  const renderGroup = ({ item: group }: { item: { date: string; label: string; items: Transaction[] } }) => (
    <View style={styles.group}>
      <Text style={[styles.groupLabel, { color: colors.fg }]}>{group.label}</Text>
      <View style={[styles.txCard, { backgroundColor: colors.surface }]}>
        {group.items.map((tx, index) => {
          const isExpense = tx.type === 'EXPENSE';
          const isIncome = tx.type === 'INCOME';
          return (
            <View key={tx.id}>
              <View style={styles.txRow}>
                <View style={[styles.txIcon, { backgroundColor: colors.surfaceRecessed }]}>
                  <Feather
                    name={isExpense ? 'arrow-up-right' : isIncome ? 'arrow-down-left' : 'arrow-right'}
                    size={18}
                    color={isExpense ? colors.expense : isIncome ? colors.income : colors.transfer}
                  />
                </View>
                <View style={styles.txContent}>
                  <Text style={[styles.txTitle, { color: colors.fg }]} numberOfLines={1}>{tx.description}</Text>
                  <Text style={[styles.txSubtitle, { color: colors.fgMuted }]} numberOfLines={1}>
                    {tx.category || 'Transfer'} · {tx.time || ''}
                  </Text>
                </View>
                <Text style={[styles.txAmount, { color: isIncome ? colors.income : colors.fg }]}>
                  {isExpense ? '-' : isIncome ? '+' : ''}{money(tx.amount, settings.currency)}
                </Text>
              </View>
              {index < group.items.length - 1 && (
                <View style={[styles.divider, { backgroundColor: colors.divider }]} />
              )}
            </View>
          );
        })}
      </View>
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.canvas }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing[4] }]}>
        <Text style={[styles.headerTitle, { color: colors.fg }]}>Transactions</Text>
        <Pressable style={[styles.headerBtn, { backgroundColor: colors.surface }]}>
          <Feather name="sliders" size={18} color={colors.fg} />
        </Pressable>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.surfaceRecessed }]}>
          <Feather name="search" size={18} color={colors.fgMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search transactions..."
            placeholderTextColor={colors.fgSubtle}
            style={[styles.searchInput, { color: colors.fg }]}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')}>
              <Feather name="x" size={16} color={colors.fgMuted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Filter tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[
              styles.tab,
              {
                backgroundColor: activeTab === tab.key ? colors.primary : colors.surfaceRecessed,
              },
            ]}
          >
            <Text style={[styles.tabText, { color: activeTab === tab.key ? colors.onPrimary : colors.fgMuted }]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Transaction groups */}
      <FlatList
        data={groups}
        keyExtractor={(item) => item.date}
        renderItem={renderGroup}
        contentContainerStyle={{ paddingTop: spacing[3], paddingBottom: 120, paddingHorizontal: spacing[4] }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="inbox" size={40} color={colors.fgSubtle} />
            <Text style={[styles.emptyTitle, { color: colors.fgMuted }]}>No transactions found</Text>
            <Text style={[styles.emptySubtitle, { color: colors.fgSubtle }]}>Try adjusting your filters</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    height: 44,
    borderRadius: radius.md,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.base,
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  tab: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  group: {
    marginBottom: spacing[4],
  },
  groupLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing[2],
  },
  txCard: {
    borderRadius: radius.lg,
    padding: spacing[1],
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    gap: spacing[3],
  },
  txIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txContent: {
    flex: 1,
    gap: 2,
  },
  txTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  txSubtitle: {
    fontSize: fontSize.xs,
  },
  txAmount: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    fontVariant: ['tabular-nums'],
  },
  divider: {
    height: 1,
    marginHorizontal: spacing[4],
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing[12],
    gap: spacing[2],
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
  },
});
