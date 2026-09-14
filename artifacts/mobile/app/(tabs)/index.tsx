import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFinance, type Category, type Account } from '@/context/FinanceContext';
import { useColors } from '@/hooks/useColors';
import { money, compactMoney, currencySymbol, getGreeting, formatDate } from '@/utils/format';
import { spacing, radius, fontSize, fontWeight, lineHeight } from '@/constants/tokens';

function QuickAdd({ visible, onClose, initialType = 'EXPENSE' }: { visible: boolean; onClose: () => void; initialType?: 'EXPENSE' | 'INCOME' | 'TRANSFER' }) {
  const { categories, accounts, addTransaction, addExpense, settings } = useFinance();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [type, setType] = useState<'EXPENSE' | 'INCOME' | 'TRANSFER'>(initialType);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>(categories[0]);
  const [account, setAccount] = useState<Account | undefined>(accounts.find(a => a.isDefault) || accounts[0]);

  const save = async () => {
    const parsed = Number(amount.replace(/,/g, ''));
    if (!parsed || parsed <= 0) return;
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().slice(0, 5);
    if (type === 'EXPENSE') {
      await addTransaction({ type: 'EXPENSE', amount: parsed, description: description.trim() || category.name, category: category.name, categoryId: category.id, accountId: account?.id, date, time });
      await addExpense(parsed, description.trim() || category.name, category, account?.name);
    } else if (type === 'INCOME') {
      await addTransaction({ type: 'INCOME', amount: parsed, description: description.trim() || 'Income', category: 'Income', accountId: account?.id, date, time });
    } else {
      await addTransaction({ type: 'TRANSFER', amount: parsed, description: description.trim() || 'Transfer', accountId: account?.id, date, time });
    }
    setAmount('');
    setDescription('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.sheetBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 18) }]}>
          <View style={[styles.handle, { backgroundColor: colors.divider }]} />
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: colors.fg }]}>
              {type === 'EXPENSE' ? 'Add Expense' : type === 'INCOME' ? 'Add Income' : 'Transfer'}
            </Text>
            <Pressable onPress={onClose}>
              <Feather name="x" size={20} color={colors.fgMuted} />
            </Pressable>
          </View>

          {/* Type selector */}
          <View style={styles.typeSelector}>
            {(['EXPENSE', 'INCOME', 'TRANSFER'] as const).map((t) => (
              <Pressable
                key={t}
                onPress={() => { setType(t); void Haptics.selectionAsync(); }}
                style={[
                  styles.typeBtn,
                  {
                    backgroundColor: type === t ? colors.primary : colors.surfaceRecessed,
                  },
                ]}
              >
                <Text style={[styles.typeBtnText, { color: type === t ? colors.onPrimary : colors.fgMuted }]}>
                  {t}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Amount */}
          <View style={styles.amountContainer}>
            <Text style={[styles.currencySymbol, { color: colors.primary }]}>{currencySymbol(settings.currency)}</Text>
            <TextInput
              autoFocus
              value={amount}
              onChangeText={(v) => setAmount(v.replace(/[^0-9.]/g, ''))}
              placeholder="0.00"
              placeholderTextColor={colors.fgSubtle}
              keyboardType="decimal-pad"
              style={[styles.amountInput, { color: colors.fg }]}
            />
          </View>

          {/* Description */}
          <View style={[styles.formRow, { backgroundColor: colors.surfaceRecessed }]}>
            <Feather name="file-text" size={18} color={colors.fgMuted} />
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="What was it for?"
              placeholderTextColor={colors.fgSubtle}
              style={[styles.formInput, { color: colors.fg }]}
            />
          </View>

          {/* Category */}
          <Pressable style={[styles.formRow, { backgroundColor: colors.surfaceRecessed }]}>
            <Feather name="tag" size={18} color={colors.fgMuted} />
            <Text style={[styles.formValue, { color: colors.fg }]}>{category.name}</Text>
            <Feather name="chevron-right" size={18} color={colors.fgSubtle} />
          </Pressable>

          {/* Account */}
          <Pressable style={[styles.formRow, { backgroundColor: colors.surfaceRecessed }]}>
            <Feather name="credit-card" size={18} color={colors.fgMuted} />
            <Text style={[styles.formValue, { color: colors.fg }]}>{account?.name || 'Select account'}</Text>
            <Feather name="chevron-right" size={18} color={colors.fgSubtle} />
          </Pressable>

          {/* Save button */}
          <Pressable
            onPress={() => void save()}
            style={[styles.saveBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.saveBtnText, { color: colors.onPrimary }]}>Save Transaction</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default function HomeScreen() {
  const { transactions, accounts, categories, settings } = useFinance();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [quickAdd, setQuickAdd] = useState(false);
  const [quickAddType, setQuickAddType] = useState<'EXPENSE' | 'INCOME' | 'TRANSFER'>('EXPENSE');

  const totalBalance = useMemo(() => accounts.reduce((sum, a) => sum + (a.isDefault ? a.openingBalance : 0), 0), [accounts]);
  const expenseTotal = useMemo(() => transactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0), [transactions]);
  const incomeTotal = useMemo(() => transactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0), [transactions]);

  const latestTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  }, [transactions]);

  const greeting = getGreeting();
  const firstName = settings.profileName.split(' ')[0] || 'there';

  return (
    <View style={[styles.screen, { backgroundColor: colors.canvas }]}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + spacing[5], paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greetSmall, { color: colors.fgMuted }]}>{greeting},</Text>
            <Text style={[styles.greetName, { color: colors.fg }]}>{firstName} 👋</Text>
          </View>
          <Pressable style={[styles.notifBtn, { backgroundColor: colors.surface }]}>
            <Feather name="bell" size={20} color={colors.fg} />
            <View style={[styles.notifBadge, { backgroundColor: colors.expense }]}>
              <Text style={styles.notifBadgeText}>3</Text>
            </View>
          </Pressable>
        </View>

        {/* Balance */}
        <View style={styles.balanceSection}>
          <Text style={[styles.balanceLabel, { color: colors.fgMuted }]}>Total Balance</Text>
          <Text style={[styles.balanceValue, { color: colors.fg }]}>{money(totalBalance, settings.currency)}</Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Pressable
            style={styles.quickAction}
            onPress={() => { setQuickAddType('EXPENSE'); setQuickAdd(true); void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
          >
            <View style={[styles.quickActionCircle, { backgroundColor: colors.primary }]}>
              <Feather name="plus" size={22} color={colors.onPrimary} />
            </View>
            <Text style={[styles.quickActionLabel, { color: colors.fgMuted }]}>Add</Text>
          </Pressable>
          <Pressable
            style={styles.quickAction}
            onPress={() => { setQuickAddType('TRANSFER'); setQuickAdd(true); }}
          >
            <View style={[styles.quickActionCircle, { backgroundColor: colors.surface }]}>
              <Feather name="arrow-right" size={20} color={colors.fg} />
            </View>
            <Text style={[styles.quickActionLabel, { color: colors.fgMuted }]}>Transfer</Text>
          </Pressable>
          <Pressable
            style={styles.quickAction}
            onPress={() => { setQuickAddType('INCOME'); setQuickAdd(true); }}
          >
            <View style={[styles.quickActionCircle, { backgroundColor: colors.surface }]}>
              <Feather name="arrow-down-left" size={20} color={colors.fg} />
            </View>
            <Text style={[styles.quickActionLabel, { color: colors.fgMuted }]}>Request</Text>
          </Pressable>
        </View>

        {/* My Accounts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.fg }]}>My Accounts</Text>
            <Pressable>
              <Text style={[styles.sectionAction, { color: colors.primary }]}>See all</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.accountsScroll}>
            {accounts.filter(a => a.isActive).map((account, index) => (
              <View
                key={account.id}
                style={[
                  styles.accountCard,
                  index === 0
                    ? { backgroundColor: colors.primary }
                    : { backgroundColor: colors.surface },
                ]}
              >
                <View style={styles.accountCardTop}>
                  <View style={[styles.accountIcon, { backgroundColor: index === 0 ? 'rgba(0,0,0,0.15)' : colors.surfaceRecessed }]}>
                    <Feather
                      name={account.type === 'BANK' ? 'credit-card' : account.type === 'UPI' ? 'smartphone' : 'dollar-sign'}
                      size={18}
                      color={index === 0 ? colors.onPrimary : colors.fg}
                    />
                  </View>
                  <Pressable style={[styles.accountAdd, { backgroundColor: index === 0 ? 'rgba(0,0,0,0.15)' : colors.surfaceRecessed }]}>
                    <Feather name="plus" size={14} color={index === 0 ? colors.onPrimary : colors.fgMuted} />
                  </Pressable>
                </View>
                <Text style={[styles.accountName, { color: index === 0 ? colors.onPrimary : colors.fg }]} numberOfLines={1}>{account.name}</Text>
                <Text style={[styles.accountType, { color: index === 0 ? 'rgba(0,0,0,0.6)' : colors.fgMuted }]}>{account.type === 'BANK' ? 'Bank Account' : account.type}</Text>
                <Text style={[styles.accountBalance, { color: index === 0 ? colors.onPrimary : colors.fg }]}>{money(account.openingBalance, account.currency)}</Text>
                <Text style={[styles.accountMask, { color: index === 0 ? 'rgba(0,0,0,0.4)' : colors.fgSubtle }]}>•••• •••• {account.id.slice(-4)}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Latest Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.fg }]}>Latest Transactions</Text>
            <Pressable>
              <Text style={[styles.sectionAction, { color: colors.primary }]}>See all</Text>
            </Pressable>
          </View>
          <View style={[styles.txCard, { backgroundColor: colors.surface }]}>
            {latestTransactions.map((tx, index) => {
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
                        {tx.category || 'Transfer'} · {formatDate(tx.date)}
                      </Text>
                    </View>
                    <Text style={[styles.txAmount, { color: isIncome ? colors.income : colors.fg }]}>
                      {isExpense ? '-' : isIncome ? '+' : ''}{money(tx.amount, settings.currency)}
                    </Text>
                  </View>
                  {index < latestTransactions.length - 1 && (
                    <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                  )}
                </View>
              );
            })}
            {latestTransactions.length === 0 && (
              <View style={styles.emptyState}>
                <Feather name="inbox" size={32} color={colors.fgSubtle} />
                <Text style={[styles.emptyText, { color: colors.fgMuted }]}>No transactions yet</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <QuickAdd visible={quickAdd} onClose={() => setQuickAdd(false)} initialType={quickAddType} />
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
  },
  greetSmall: {
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * lineHeight.normal,
  },
  greetName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize.xl * lineHeight.tight,
    marginTop: 2,
  },
  notifBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: fontWeight.bold,
  },

  // Balance
  balanceSection: {
    paddingHorizontal: spacing[4],
    marginTop: spacing[6],
  },
  balanceLabel: {
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * lineHeight.normal,
  },
  balanceValue: {
    fontSize: fontSize.hero,
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize.hero * lineHeight.tight,
    marginTop: spacing[1],
    fontVariant: ['tabular-nums'],
  },

  // Quick actions
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[8],
    marginTop: spacing[6],
    paddingHorizontal: spacing[4],
  },
  quickAction: {
    alignItems: 'center',
    gap: spacing[2],
  },
  quickActionCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },

  // Sections
  section: {
    marginTop: spacing[6],
    paddingHorizontal: spacing[4],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize.lg * lineHeight.snug,
  },
  sectionAction: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },

  // Account cards
  accountsScroll: {
    gap: spacing[3],
    paddingRight: spacing[4],
  },
  accountCard: {
    width: 200,
    padding: spacing[5],
    borderRadius: radius.lg,
    gap: spacing[2],
  },
  accountCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountAdd: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    marginTop: spacing[2],
  },
  accountType: {
    fontSize: fontSize.xs,
  },
  accountBalance: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    marginTop: spacing[1],
    fontVariant: ['tabular-nums'],
  },
  accountMask: {
    fontSize: fontSize.xs,
    marginTop: spacing[1],
  },

  // Transaction card
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
    paddingVertical: spacing[8],
    gap: spacing[2],
  },
  emptyText: {
    fontSize: fontSize.sm,
  },

  // QuickAdd sheet
  sheetBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: '#171A18',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing[5],
    paddingTop: spacing[3],
  },
  handle: {
    width: 42,
    height: 4,
    borderRadius: radius.full,
    alignSelf: 'center',
    marginBottom: spacing[5],
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[5],
  },
  sheetTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[5],
  },
  typeBtn: {
    flex: 1,
    paddingVertical: spacing[3],
    borderRadius: radius.md,
    alignItems: 'center',
  },
  typeBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[6],
    gap: spacing[2],
  },
  currencySymbol: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.semibold,
  },
  amountInput: {
    fontSize: fontSize.hero,
    fontWeight: fontWeight.semibold,
    fontVariant: ['tabular-nums'],
    minWidth: 100,
    textAlign: 'center',
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[4],
    borderRadius: radius.md,
    marginBottom: spacing[3],
  },
  formInput: {
    flex: 1,
    fontSize: fontSize.base,
  },
  formValue: {
    flex: 1,
    fontSize: fontSize.base,
  },
  saveBtn: {
    paddingVertical: spacing[4],
    borderRadius: radius.full,
    alignItems: 'center',
    marginTop: spacing[4],
  },
  saveBtnText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
});
