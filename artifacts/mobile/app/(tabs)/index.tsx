import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFinance, type Category, type Account } from '@/context/FinanceContext';
import { useColors } from '@/hooks/useColors';
import { money, currencySymbol, getGreeting, formatDate } from '@/utils/format';
import { spacing, radius, fontSize, fontWeight, lineHeight } from '@/constants/tokens';
import { registerQuickAddListener } from '@/utils/quickAddEvent';
import { getMerchantLogo } from '@/utils/merchantLogos';

function MerchantLogo({ description, category }: { description: string; category?: string }) {
  const logo = getMerchantLogo(description, category);
  return (
    <View style={[styles.merchantLogo, { backgroundColor: logo.bg }]}>
      <Text style={[styles.merchantLetter, { color: logo.color }]}>{logo.letter}</Text>
    </View>
  );
}

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
          <View style={[styles.handle, { backgroundColor: '#D1D1D6' }]} />
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: '#1C1C1E' }]}>
              {type === 'EXPENSE' ? 'Add Expense' : type === 'INCOME' ? 'Add Income' : 'Transfer'}
            </Text>
            <Pressable onPress={onClose}>
              <Feather name="x" size={20} color="#8E8E93" />
            </Pressable>
          </View>

          <View style={styles.typeSelector}>
            {(['EXPENSE', 'INCOME', 'TRANSFER'] as const).map((t) => (
              <Pressable
                key={t}
                onPress={() => { setType(t); void Haptics.selectionAsync(); }}
                style={[
                  styles.typeBtn,
                  { backgroundColor: type === t ? '#B7FF63' : '#F2F2F7' },
                ]}
              >
                <Text style={[styles.typeBtnText, { color: type === t ? '#000000' : '#8E8E93' }]}>
                  {t}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.amountContainer}>
            <Text style={[styles.currencySymbol, { color: '#B7FF63' }]}>{currencySymbol(settings.currency)}</Text>
            <TextInput
              autoFocus
              value={amount}
              onChangeText={(v) => setAmount(v.replace(/[^0-9.]/g, ''))}
              placeholder="0.00"
              placeholderTextColor="#C7C7CC"
              keyboardType="decimal-pad"
              style={[styles.amountInput, { color: '#1C1C1E' }]}
            />
          </View>

          <View style={[styles.formRow, { backgroundColor: '#F2F2F7' }]}>
            <Feather name="file-text" size={18} color="#8E8E93" />
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="What was it for?"
              placeholderTextColor="#C7C7CC"
              style={[styles.formInput, { color: '#1C1C1E' }]}
            />
          </View>

          <Pressable style={[styles.formRow, { backgroundColor: '#F2F2F7' }]}>
            <Feather name="tag" size={18} color="#8E8E93" />
            <Text style={[styles.formValue, { color: '#1C1C1E' }]}>{category.name}</Text>
            <Feather name="chevron-right" size={18} color="#C7C7CC" />
          </Pressable>

          <Pressable style={[styles.formRow, { backgroundColor: '#F2F2F7' }]}>
            <Feather name="credit-card" size={18} color="#8E8E93" />
            <Text style={[styles.formValue, { color: '#1C1C1E' }]}>{account?.name || 'Select account'}</Text>
            <Feather name="chevron-right" size={18} color="#C7C7CC" />
          </Pressable>

          <Pressable
            onPress={() => void save()}
            style={[styles.saveBtn, { backgroundColor: '#B7FF63' }]}
          >
            <Text style={[styles.saveBtnText, { color: '#000000' }]}>Save Transaction</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default function HomeScreen() {
  const { transactions, accounts, settings } = useFinance();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [quickAdd, setQuickAdd] = useState(false);
  const [quickAddType, setQuickAddType] = useState<'EXPENSE' | 'INCOME' | 'TRANSFER'>('EXPENSE');

  useEffect(() => {
    const unsub = registerQuickAddListener((type) => {
      if (type) setQuickAddType(type);
      setQuickAdd(true);
    });
    return unsub;
  }, []);

  const totalBalance = useMemo(() => accounts.reduce((sum, a) => sum + (a.isDefault ? a.openingBalance : 0), 0), [accounts]);

  const latestTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  }, [transactions]);

  const greeting = getGreeting();
  const firstName = settings.profileName.split(' ')[0] || 'there';

  const formatAmount = (tx: { type: string; amount: number }) => {
    const prefix = tx.type === 'INCOME' ? '+' : tx.type === 'EXPENSE' ? '-' : '';
    return `${prefix}${money(tx.amount, settings.currency)}`;
  };

  const getTxDateLabel = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (dateStr === today) return 'Today';
    if (dateStr === yesterday) return 'Yesterday';
    return formatDate(dateStr);
  };

  return (
    <View style={styles.screen}>
      {/* Subtle green glow background */}
      <LinearGradient
        colors={['#18251A', '#0D120E', '#090B0A']}
        locations={[0, 0.35, 0.75]}
        style={styles.bgGlow}
        start={{ x: 0.85, y: 0.05 }}
        end={{ x: 0.3, y: 0.6 }}
      />

      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + spacing[5], paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greetSmall, { color: '#A5AAA3' }]}>{greeting},</Text>
            <Text style={[styles.greetName, { color: '#F5F7F3' }]}>{firstName} 👋</Text>
          </View>
          <Pressable style={[styles.notifBtn, { backgroundColor: '#171A18' }]}>
            <Feather name="bell" size={20} color="#F5F7F3" />
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>3</Text>
            </View>
          </Pressable>
        </View>

        {/* Balance */}
        <View style={styles.balanceSection}>
          <Text style={[styles.balanceLabel, { color: '#A5AAA3' }]}>Total Balance</Text>
          <Text style={[styles.balanceValue, { color: '#F5F7F3' }]}>{money(totalBalance, settings.currency)}</Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Pressable
            style={styles.quickAction}
            onPress={() => { setQuickAddType('EXPENSE'); setQuickAdd(true); void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
          >
            <View style={[styles.quickActionCircle, { backgroundColor: '#B7FF63' }]}>
              <Feather name="plus" size={22} color="#000000" />
            </View>
            <Text style={[styles.quickActionLabel, { color: '#A5AAA3' }]}>Add</Text>
          </Pressable>
          <Pressable
            style={styles.quickAction}
            onPress={() => { setQuickAddType('TRANSFER'); setQuickAdd(true); void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
          >
            <View style={[styles.quickActionCircle, { backgroundColor: '#171A18' }]}>
              <Feather name="arrow-right" size={20} color="#F5F7F3" />
            </View>
            <Text style={[styles.quickActionLabel, { color: '#A5AAA3' }]}>Transfer</Text>
          </Pressable>
          <Pressable
            style={styles.quickAction}
            onPress={() => { setQuickAddType('INCOME'); setQuickAdd(true); void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
          >
            <View style={[styles.quickActionCircle, { backgroundColor: '#171A18' }]}>
              <Feather name="arrow-down-left" size={20} color="#F5F7F3" />
            </View>
            <Text style={[styles.quickActionLabel, { color: '#A5AAA3' }]}>Request</Text>
          </Pressable>
        </View>

        {/* My Accounts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: '#F5F7F3' }]}>My Accounts</Text>
            <Pressable>
              <Text style={[styles.sectionAction, { color: '#B7FF63' }]}>See all</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.accountsScroll}>
            {accounts.filter(a => a.isActive).length === 0 ? (
              <View style={styles.accountCardLime}>
                <View style={styles.accountCardTop}>
                  <View style={styles.accountIconDark}>
                    <Feather name="dollar-sign" size={18} color="#000000" />
                  </View>
                  <View style={styles.accountAddDark}>
                    <Feather name="plus" size={14} color="#000000" />
                  </View>
                </View>
                <Text style={styles.accountNameDark}>Main Wallet</Text>
                <Text style={styles.accountTypeDark}>CASH</Text>
                <Text style={styles.accountBalanceDark}>{money(0, settings.currency)}</Text>
                <Text style={styles.accountMaskDark}>•••• •••• 1let</Text>
              </View>
            ) : (
              accounts.filter(a => a.isActive).map((account, index) => (
                <View
                  key={account.id}
                  style={index === 0 ? styles.accountCardLime : styles.accountCardDark}
                >
                  <View style={styles.accountCardTop}>
                    <View style={index === 0 ? styles.accountIconDark : styles.accountIconLight}>
                      <Feather
                        name={account.type === 'BANK' ? 'credit-card' : account.type === 'UPI' ? 'smartphone' : 'dollar-sign'}
                        size={18}
                        color={index === 0 ? '#000000' : '#F5F7F3'}
                      />
                    </View>
                    <View style={index === 0 ? styles.accountAddDark : styles.accountAddLight}>
                      <Feather name="plus" size={14} color={index === 0 ? '#000000' : '#A5AAA3'} />
                    </View>
                  </View>
                  <Text style={index === 0 ? styles.accountNameDark : styles.accountNameLight} numberOfLines={1}>{account.name}</Text>
                  <Text style={index === 0 ? styles.accountTypeDark : styles.accountTypeLight}>{account.type === 'BANK' ? 'Bank Account' : account.type}</Text>
                  <Text style={index === 0 ? styles.accountBalanceDark : styles.accountBalanceLight}>{money(account.openingBalance, account.currency)}</Text>
                  <Text style={index === 0 ? styles.accountMaskDark : styles.accountMaskLight}>•••• •••• {account.id.slice(-4)}</Text>
                </View>
              ))
            )}
          </ScrollView>
        </View>

        {/* Latest Transactions — WHITE CARD */}
        <View style={styles.txSection}>
          <View style={styles.txSectionHeader}>
            <Text style={[styles.txSectionTitle, { color: '#1C1C1E' }]}>Latest Transactions</Text>
            <Pressable>
              <Text style={[styles.txSectionAction, { color: '#8E8E93' }]}>See all</Text>
            </Pressable>
          </View>

          <View style={styles.txWhiteCard}>
            {latestTransactions.length > 0 ? (
              latestTransactions.map((tx, index) => {
                const isExpense = tx.type === 'EXPENSE';
                const isIncome = tx.type === 'INCOME';
                return (
                  <View key={tx.id}>
                    <View style={styles.txRow}>
                      <MerchantLogo description={tx.description} category={tx.category} />
                      <View style={styles.txContent}>
                        <Text style={[styles.txTitle, { color: '#1C1C1E' }]} numberOfLines={1}>{tx.description}</Text>
                        <Text style={[styles.txSubtitle, { color: '#8E8E93' }]} numberOfLines={1}>
                          {tx.category || 'Transfer'} · {getTxDateLabel(tx.date)}
                        </Text>
                      </View>
                      <Text style={[styles.txAmount, { color: isIncome ? '#34C759' : '#1C1C1E' }]}>
                        {formatAmount(tx)}
                      </Text>
                    </View>
                    {index < latestTransactions.length - 1 && (
                      <View style={[styles.txDivider, { backgroundColor: '#E5E5EA' }]} />
                    )}
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyTxCard}>
                <Feather name="inbox" size={28} color="#C7C7CC" />
                <Text style={[styles.emptyTxText, { color: '#8E8E93' }]}>No transactions yet</Text>
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
  bgGlow: {
    ...StyleSheet.absoluteFillObject,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
  },
  greetSmall: {
    fontSize: 13,
    lineHeight: 18,
  },
  greetName: {
    fontSize: 17,
    fontWeight: fontWeight.semibold,
    lineHeight: 22,
    marginTop: 1,
  },
  notifBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
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
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: fontWeight.bold,
  },

  // Balance
  balanceSection: {
    paddingHorizontal: spacing[4],
    marginTop: spacing[6],
  },
  balanceLabel: {
    fontSize: 13,
    lineHeight: 18,
  },
  balanceValue: {
    fontSize: 36,
    fontWeight: fontWeight.semibold,
    lineHeight: 42,
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
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: 12,
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
    fontSize: 16,
    fontWeight: fontWeight.semibold,
    lineHeight: 22,
  },
  sectionAction: {
    fontSize: 13,
    fontWeight: fontWeight.semibold,
  },

  // Account cards
  accountsScroll: {
    gap: spacing[3],
    paddingRight: spacing[4],
  },
  accountCardLime: {
    width: 190,
    height: 190,
    padding: 18,
    borderRadius: 22,
    backgroundColor: '#B7FF63',
    justifyContent: 'space-between',
  },
  accountCardDark: {
    width: 190,
    height: 190,
    padding: 18,
    borderRadius: 22,
    backgroundColor: '#171A18',
    justifyContent: 'space-between',
  },
  accountCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountIconDark: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountIconLight: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#202320',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountAddDark: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountAddLight: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#202320',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountNameDark: {
    fontSize: 15,
    fontWeight: fontWeight.semibold,
    color: '#000000',
  },
  accountNameLight: {
    fontSize: 15,
    fontWeight: fontWeight.semibold,
    color: '#F5F7F3',
  },
  accountTypeDark: {
    fontSize: 11,
    fontWeight: fontWeight.medium,
    color: 'rgba(0,0,0,0.5)',
    textTransform: 'uppercase',
  },
  accountTypeLight: {
    fontSize: 11,
    fontWeight: fontWeight.medium,
    color: '#A5AAA3',
    textTransform: 'uppercase',
  },
  accountBalanceDark: {
    fontSize: 19,
    fontWeight: fontWeight.semibold,
    color: '#000000',
    fontVariant: ['tabular-nums'],
  },
  accountBalanceLight: {
    fontSize: 19,
    fontWeight: fontWeight.semibold,
    color: '#F5F7F3',
    fontVariant: ['tabular-nums'],
  },
  accountMaskDark: {
    fontSize: 11,
    color: 'rgba(0,0,0,0.35)',
  },
  accountMaskLight: {
    fontSize: 11,
    color: '#777D76',
  },

  // Latest Transactions — WHITE CARD
  txSection: {
    marginTop: spacing[6],
    paddingHorizontal: spacing[4],
  },
  txSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  txSectionTitle: {
    fontSize: 17,
    fontWeight: fontWeight.semibold,
    lineHeight: 22,
  },
  txSectionAction: {
    fontSize: 13,
    fontWeight: fontWeight.medium,
  },
  txWhiteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    minHeight: 160,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  merchantLogo: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  merchantLetter: {
    fontSize: 18,
    fontWeight: fontWeight.semibold,
  },
  txContent: {
    flex: 1,
    gap: 2,
  },
  txTitle: {
    fontSize: 15,
    fontWeight: fontWeight.medium,
  },
  txSubtitle: {
    fontSize: 12,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: fontWeight.semibold,
    fontVariant: ['tabular-nums'],
  },
  txDivider: {
    height: 1,
    marginLeft: 72,
  },
  emptyTxCard: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 140,
    gap: spacing[2],
  },
  emptyTxText: {
    fontSize: 14,
    fontWeight: fontWeight.medium,
  },

  // QuickAdd sheet
  sheetBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
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
