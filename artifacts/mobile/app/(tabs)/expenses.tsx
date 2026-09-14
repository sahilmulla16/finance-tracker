import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFinance, type Transaction } from '@/context/FinanceContext';
import { useColors } from '@/hooks/useColors';
import { money, formatDate } from '@/utils/format';
import { spacing, radius, fontSize, fontWeight, lineHeight } from '@/constants/tokens';
import { SegmentedControl, Card, EmptyState } from '@/components/ui';

type TabType = 'ALL' | 'EXPENSE' | 'INCOME' | 'TRANSFER';

export default function ExpensesScreen() {
  const { transactions, accounts, settings } = useFinance();
  const colors = useColors();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('ALL');
  const insets = useSafeAreaInsets();

  const filtered = useMemo(() => {
    let items = transactions;
    if (activeTab !== 'ALL') {
      items = items.filter(t => t.type === activeTab);
    }
    return items.filter((item) =>
      (item.description + (item.category || '')).toLowerCase().includes(query.toLowerCase())
    );
  }, [transactions, query, activeTab]);

  const getTabTotal = (type: Transaction['type']) => {
    return transactions.filter(t => t.type === type).reduce((sum, t) => sum + t.amount, 0);
  };

  const allTotal = getTabTotal('EXPENSE') - getTabTotal('INCOME');
  const expenseTotal = getTabTotal('EXPENSE');
  const incomeTotal = getTabTotal('INCOME');
  const transferTotal = getTabTotal('TRANSFER');

  const getDisplayTotal = () => {
    switch (activeTab) {
      case 'ALL': return money(allTotal, settings.currency);
      case 'EXPENSE': return money(expenseTotal, settings.currency);
      case 'INCOME': return money(incomeTotal, settings.currency);
      case 'TRANSFER': return money(transferTotal, settings.currency);
    }
  };

  const getDisplayLabel = () => {
    switch (activeTab) {
      case 'ALL': return 'NET';
      case 'EXPENSE': return 'EXPENSES';
      case 'INCOME': return 'INCOME';
      case 'TRANSFER': return 'TRANSFERS';
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
      <View style={styles.txRow}>
        <View style={[styles.txIcon, { backgroundColor: colors.surfaceRecessed }]}>
          <Feather
            name={isExpense ? 'arrow-up-right' : isIncome ? 'arrow-down-left' : 'arrow-right'}
            size={18}
            color={isExpense ? colors.expense : isIncome ? colors.income : colors.transfer}
          />
        </View>
        <View style={styles.txContent}>
          <Text style={[styles.txTitle, { color: colors.fg }]} numberOfLines={1}>
            {item.description}
          </Text>
          <Text style={[styles.txSubtitle, { color: colors.fgMuted }]} numberOfLines={1}>
            {isExpense && item.category ? `${item.category} · ` : ''}
            {isTransfer ? `${fromAcc?.name || ''} → ${toAcc?.name || ''} · ` : ''}
            {acc ? `${acc.name} · ` : ''}
            {formatDate(item.date)}
          </Text>
        </View>
        <Text
          style={[
            styles.txAmount,
            {
              color: isIncome ? colors.income : isTransfer ? colors.transfer : colors.fg,
            },
          ]}
        >
          {isExpense ? '-' : isIncome ? '+' : ''}{money(item.amount, settings.currency)}
        </Text>
      </View>
    );
  };

  // Group transactions by date
  const groupedData = useMemo(() => {
    const groups: { title: string; data: Transaction[] }[] = [];
    let currentGroup: { title: string; data: Transaction[] } | null = null;

    for (const item of filtered) {
      const dateLabel = formatDate(item.date);
      if (!currentGroup || currentGroup.title !== dateLabel) {
        currentGroup = { title: dateLabel, data: [] };
        groups.push(currentGroup);
      }
      currentGroup.data.push(item);
    }

    return groups;
  }, [filtered]);

  const flatData = useMemo(() => {
    const result: (Transaction | { type: 'header'; title: string })[] = [];
    for (const group of groupedData) {
      result.push({ type: 'header', title: group.title });
      for (const item of group.data) {
        result.push(item);
      }
    }
    return result;
  }, [groupedData]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.canvas }]}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.kicker, { color: colors.primaryText }]}>YOUR MONEY</Text>
            <Text style={[styles.title, { color: colors.fg }]}>Transactions</Text>
          </View>
          <View style={styles.total}>
            <Text style={[styles.totalLabel, { color: colors.fgMuted }]}>{getDisplayLabel()}</Text>
            <Text style={[styles.totalValue, { color: colors.fg }]}>{getDisplayTotal()}</Text>
          </View>
        </View>

        {/* Segmented Control */}
        <View style={styles.tabContainer}>
          <SegmentedControl
            options={['All', 'Expenses', 'Income', 'Transfers']}
            selected={activeTab === 'ALL' ? 'All' : activeTab === 'EXPENSE' ? 'Expenses' : activeTab === 'INCOME' ? 'Income' : 'Transfers'}
            onSelect={(value) => {
              const tab = value === 'All' ? 'ALL' : value === 'Expenses' ? 'EXPENSE' : value === 'Income' ? 'INCOME' : 'TRANSFER';
              setActiveTab(tab);
              void Haptics.selectionAsync();
            }}
          />
        </View>

        {/* Search */}
        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Feather name="search" size={17} color={colors.fgSubtle} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search transactions"
            placeholderTextColor={colors.fgSubtle}
            style={[styles.searchInput, { color: colors.fg }]}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')}>
              <Feather name="x" size={16} color={colors.fgMuted} />
            </Pressable>
          )}
        </View>

        {/* Result count */}
        <Text style={[styles.resultLabel, { color: colors.fgMuted }]}>
          {filtered.length} {filtered.length === 1 ? 'transaction' : 'transactions'}
        </Text>
      </View>

      {/* Transaction List */}
      <FlatList
        data={flatData}
        keyExtractor={(item, index) => {
          if ('type' in item && item.type === 'header') return `header-${item.title}-${index}`;
          return (item as Transaction).id;
        }}
        contentContainerStyle={{ paddingBottom: spacing[10] }}
        ListEmptyComponent={
          <EmptyState
            icon="search"
            title="No transactions found"
            message="Try a different search, or add your first transaction from Home."
          />
        }
        renderItem={({ item }) => {
          if ('type' in item && item.type === 'header') {
            return (
              <View style={[styles.dateHeader, { paddingHorizontal: spacing[5] }]}>
                <Text style={[styles.dateHeaderText, { color: colors.fgMuted }]}>{item.title}</Text>
              </View>
            );
          }
          return renderItem({ item: item as Transaction });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    gap: spacing[3],
    paddingBottom: spacing[3],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: spacing[5],
  },
  kicker: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    letterSpacing: 1.2,
  },
  title: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 30,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.8,
    marginTop: 4,
  },
  total: {
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: fontWeight.bold,
  },
  totalValue: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
  tabContainer: {
    paddingHorizontal: spacing[5],
  },
  searchBox: {
    height: 45,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    gap: spacing[2],
    marginHorizontal: spacing[5],
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.base,
  },
  resultLabel: {
    fontSize: fontSize.sm,
    paddingHorizontal: spacing[5],
  },
  dateHeader: {
    paddingVertical: spacing[2],
    marginTop: spacing[2],
  },
  dateHeaderText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    letterSpacing: 0.04,
    textTransform: 'uppercase',
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[5],
    minHeight: 56,
    paddingVertical: spacing[3],
  },
  txIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txContent: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  txTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    lineHeight: fontSize.base * lineHeight.snug,
  },
  txSubtitle: {
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * lineHeight.snug,
  },
  txAmount: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    fontVariant: ['tabular-nums'],
  },
});
