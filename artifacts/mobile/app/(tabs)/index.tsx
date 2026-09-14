import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import {
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
import { useColors } from '@/hooks/useColors';
import { router } from 'expo-router';
import { money, compactMoney, currencySymbol, getGreeting, formatDate } from '@/utils/format';
import { accountTypeIcons } from '@/utils/icons';
import { spacing, radius, fontSize, fontWeight, lineHeight, shadows } from '@/constants/tokens';
import { Card, Badge, Avatar, SectionHeader, StatTile, ListItem, EmptyState } from '@/components/ui';

function SpendingArc({ percentage }: { percentage: number }) {
  const colors = useColors();
  const circumference = 220;
  const offset = circumference * (1 - percentage / 100);

  return (
    <View style={styles.arcContainer}>
      <View style={[styles.arcTrack, { borderColor: 'rgba(255,255,255,0.12)' }]}>
        <View
          style={[
            styles.arcFill,
            {
              borderColor: colors.primary,
              borderWidth: 8,
              transform: [{ rotate: '-90deg' }],
              borderTopRightRadius: 999,
              borderBottomRightRadius: 999,
              borderLeftColor: 'transparent',
              borderBottomColor: percentage > 50 ? colors.primary : 'transparent',
            },
          ]}
        />
      </View>
      <View style={styles.arcTextContainer}>
        <Text style={styles.arcPercentage}>{Math.round(percentage)}%</Text>
        <Text style={styles.arcLabel}>SPENT</Text>
      </View>
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
  const [fromAccount, setFromAccount] = useState<Account | undefined>(accounts.find(a => a.isDefault) || accounts[0]);
  const [toAccount, setToAccount] = useState<Account | undefined>(accounts.filter(a => a.id !== (accounts.find(a => a.isDefault) || accounts[0])?.id)[0] || accounts[1]);
  const [showAll, setShowAll] = useState(false);

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
      if (fromAccount?.id === toAccount?.id) return;
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
        <View style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: Math.max(insets.bottom, 18) }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <View style={styles.sheetHeader}>
            <View>
              <Text style={[styles.eyebrow, { color: colors.primaryText }]}>QUICK CAPTURE</Text>
              <Text style={[styles.sheetTitle, { color: colors.fg }]}>
                {type === 'EXPENSE' ? 'Add expense' : type === 'INCOME' ? 'Add income' : 'Add transfer'}
              </Text>
            </View>
            <Pressable onPress={onClose} style={[styles.closeButton, { backgroundColor: colors.surfaceRecessed }]}>
              <Feather name="x" size={20} color={colors.fgMuted} />
            </Pressable>
          </View>

          <View style={styles.typeSelector}>
            {(['EXPENSE', 'INCOME', 'TRANSFER'] as const).map((t) => (
              <Pressable
                key={t}
                onPress={() => { setType(t); void Haptics.selectionAsync(); }}
                style={[
                  styles.typeButton,
                  {
                    backgroundColor: type === t ? colors.primary : colors.surface,
                    borderColor: type === t ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={[styles.typeButtonText, { color: type === t ? colors.onPrimary : colors.primary }]}>
                  {t}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.amountLabel, { color: colors.fgMuted }]}>AMOUNT</Text>
          <View style={[styles.amountRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.currency, { color: colors.primary }]}>{currencySymbol(settings.currency)}</Text>
            <TextInput
              testID={`${type.toLowerCase()}-amount`}
              autoFocus
              value={amount}
              onChangeText={(value) => setAmount(value.replace(/[^0-9.]/g, ''))}
              placeholder="0"
              placeholderTextColor={colors.fgSubtle}
              keyboardType="decimal-pad"
              style={[styles.amountInput, { color: colors.fg }]}
            />
          </View>

          <TextInput
            testID={`${type.toLowerCase()}-description`}
            value={description}
            onChangeText={setDescription}
            placeholder={type === 'TRANSFER' ? 'Transfer note (optional)' : 'What was it for?'}
            placeholderTextColor={colors.fgSubtle}
            style={[styles.descriptionInput, { backgroundColor: colors.surface, color: colors.fg, borderColor: colors.border }]}
            returnKeyType="done"
          />

          {type === 'EXPENSE' && (
            <>
              <Text style={[styles.amountLabel, { color: colors.fgMuted }]}>CATEGORY</Text>
              <View style={styles.categoryGrid}>
                {(showAll ? categories : categories.slice(0, 4)).map((item) => {
                  const active = item.id === suggestion.id;
                  return (
                    <Pressable
                      key={item.id}
                      testID={`category-${item.id}`}
                      onPress={() => { setCategory(item); void Haptics.selectionAsync(); }}
                      style={[
                        styles.categoryChip,
                        {
                          backgroundColor: active ? item.color : colors.surface,
                          borderColor: active ? item.color : colors.border,
                        },
                      ]}
                    >
                      <Feather name={item.icon as never} size={16} color={active ? '#FFF' : item.color} />
                      <Text style={[styles.categoryText, { color: active ? '#FFF' : colors.fg }]}>
                        {item.name === 'Food & Drinks' ? 'Food' : item.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Pressable onPress={() => setShowAll(!showAll)} style={styles.moreCategories}>
                <Text style={[styles.moreText, { color: colors.primaryText }]}>{showAll ? 'Show less' : 'More categories'}</Text>
                <Feather name={showAll ? 'chevron-up' : 'chevron-down'} size={15} color={colors.primaryText} />
              </Pressable>
            </>
          )}

          {(type === 'EXPENSE' || type === 'INCOME') && (
            <>
              <Text style={[styles.amountLabel, { color: colors.fgMuted }]}>ACCOUNT</Text>
              <View style={styles.categoryGrid}>
                {accounts.filter(a => a.isActive).map((acc) => (
                  <Pressable
                    key={acc.id}
                    onPress={() => { setAccount(acc); void Haptics.selectionAsync(); }}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: account?.id === acc.id ? colors.primary : colors.surface,
                        borderColor: account?.id === acc.id ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Feather name={accountTypeIcons[acc.type] as never} size={16} color={account?.id === acc.id ? colors.onPrimary : colors.primary} />
                    <Text style={[styles.categoryText, { color: account?.id === acc.id ? colors.onPrimary : colors.fg }]}>
                      {acc.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          {type === 'TRANSFER' && (
            <>
              <Text style={[styles.amountLabel, { color: colors.fgMuted }]}>FROM ACCOUNT</Text>
              <View style={styles.categoryGrid}>
                {accounts.filter(a => a.isActive).map((acc) => (
                  <Pressable
                    key={acc.id}
                    onPress={() => { setFromAccount(acc); if (toAccount?.id === acc.id) setToAccount(accounts.find(a => a.id !== acc.id)); void Haptics.selectionAsync(); }}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: fromAccount?.id === acc.id ? colors.error : colors.surface,
                        borderColor: fromAccount?.id === acc.id ? colors.error : colors.border,
                      },
                    ]}
                  >
                    <Feather name={accountTypeIcons[acc.type] as never} size={16} color={fromAccount?.id === acc.id ? '#FFF' : colors.error} />
                    <Text style={[styles.categoryText, { color: fromAccount?.id === acc.id ? '#FFF' : colors.fg }]}>
                      {acc.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text style={[styles.amountLabel, { color: colors.fgMuted }]}>TO ACCOUNT</Text>
              <View style={styles.categoryGrid}>
                {accounts.filter(a => a.isActive && a.id !== fromAccount?.id).map((acc) => (
                  <Pressable
                    key={acc.id}
                    onPress={() => { setToAccount(acc); void Haptics.selectionAsync(); }}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: toAccount?.id === acc.id ? colors.transfer : colors.surface,
                        borderColor: toAccount?.id === acc.id ? colors.transfer : colors.border,
                      },
                    ]}
                  >
                    <Feather name={accountTypeIcons[acc.type] as never} size={16} color={toAccount?.id === acc.id ? '#FFF' : colors.transfer} />
                    <Text style={[styles.categoryText, { color: toAccount?.id === acc.id ? '#FFF' : colors.fg }]}>
                      {acc.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          <Pressable
            testID={`save-${type.toLowerCase()}`}
            onPress={() => void save()}
            style={({ pressed }) => [
              styles.saveButton,
              { backgroundColor: colors.primary },
              pressed && { opacity: 0.82 },
            ]}
          >
            <Text style={[styles.saveButtonText, { color: colors.onPrimary }]}>
              {type === 'EXPENSE' ? 'Save expense' : type === 'INCOME' ? 'Save income' : 'Save transfer'}
            </Text>
            <Feather name="arrow-up-right" size={19} color={colors.onPrimary} />
          </Pressable>
          <Text style={[styles.quickHint, { color: colors.fgMuted }]}>
            Saved privately on this device · {new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

export default function HomeScreen() {
  const { categories, transactions, accounts, settings, getTotalBalance } = useFinance();
  const colors = useColors();
  const [quickAdd, setQuickAdd] = useState(false);
  const [quickAddType, setQuickAddType] = useState<'EXPENSE' | 'INCOME' | 'TRANSFER'>('EXPENSE');
  const [search, setSearch] = useState('');
  const insets = useSafeAreaInsets();

  const totalBalance = getTotalBalance();
  const expenseTotal = transactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);
  const incomeTotal = transactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
  const savedTotal = incomeTotal - expenseTotal;

  const categoryTotals = categories.map((category) => ({
    ...category,
    total: transactions.filter(t => t.type === 'EXPENSE' && t.category === category.name).reduce((sum, t) => sum + t.amount, 0)
  })).filter((item) => item.total > 0).sort((a, b) => b.total - a.total);

  const filteredTransactions = transactions.filter((item) =>
    `${item.description} ${item.category || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  const spentPercentage = incomeTotal > 0 ? (expenseTotal / incomeTotal) * 100 : 0;

  return (
    <View style={[styles.screen, { backgroundColor: colors.canvas }]}>
      <FlatList
        data={filteredTransactions.slice(0, 5)}
        keyExtractor={(item) => item.id}
        scrollEnabled={filteredTransactions.length > 0}
        contentContainerStyle={{ paddingTop: insets.top + spacing[5], paddingBottom: spacing[24] }}
        ListHeaderComponent={
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.topBar}>
              <View style={styles.topLeft}>
                <Avatar name={settings.profileName} size={40} backgroundColor={colors.surfaceRecessed} textColor={colors.fg} />
                <View style={styles.greetContainer}>
                  <Text style={[styles.greetSmall, { color: colors.fgMuted }]}>{getGreeting()},</Text>
                  <Text style={[styles.greetName, { color: colors.fg }]}>{settings.profileName.split(' ')[0]}</Text>
                </View>
              </View>
              <Pressable
                testID="open-settings"
                onPress={() => router.push('/settings')}
                style={[styles.iconBtn, { backgroundColor: colors.surface }]}
              >
                <Feather name="bell" size={20} color={colors.primary} />
              </Pressable>
            </View>

            {/* Hero Balance Card */}
            <Card variant="hero" style={styles.heroCard}>
              <View style={styles.heroTop}>
                <Text style={[styles.heroLabel, { color: colors.heroMuted }]}>Total balance</Text>
                <Text style={[styles.heroAccount, { color: colors.heroMuted }]}>
                  Across {accounts.filter(a => a.isActive).length} accounts
                </Text>
              </View>
              <Text style={[styles.heroAmount, { color: colors.heroText }]}>{compactMoney(totalBalance, settings.currency)}</Text>
              <Text style={[styles.heroSub, { color: colors.heroMuted }]}>
                Updated just now · {settings.currency}
              </Text>

              <View style={styles.heroViz}>
                <SpendingArc percentage={Math.min(spentPercentage, 100)} />
                <View style={styles.vizLegend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
                    <Text style={[styles.legendText, { color: colors.heroMuted }]}>Income</Text>
                    <Text style={[styles.legendValue, { color: colors.heroText }]}>{compactMoney(incomeTotal, settings.currency)}</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: 'rgba(255,255,255,0.28)' }]} />
                    <Text style={[styles.legendText, { color: colors.heroMuted }]}>Expenses</Text>
                    <Text style={[styles.legendValue, { color: colors.heroText }]}>{compactMoney(expenseTotal, settings.currency)}</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: colors.secondary }]} />
                    <Text style={[styles.legendText, { color: colors.heroMuted }]}>Saved</Text>
                    <Text style={[styles.legendValue, { color: colors.heroText }]}>{compactMoney(savedTotal, settings.currency)}</Text>
                  </View>
                </View>
              </View>
            </Card>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <Pressable
                style={[styles.quickActionBtn, { backgroundColor: colors.surface }]}
                onPress={() => { setQuickAdd(true); void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: colors.primary }]}>
                  <Feather name="plus" size={18} color={colors.onPrimary} />
                </View>
                <Text style={[styles.quickActionLabel, { color: colors.fgMuted }]}>Quick Add</Text>
              </Pressable>
              <Pressable
                style={[styles.quickActionBtn, { backgroundColor: colors.surface }]}
                onPress={() => { setQuickAddType('INCOME'); setQuickAdd(true); }}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: colors.surfaceRecessed }]}>
                  <Feather name="arrow-down-right" size={18} color={colors.primary} />
                </View>
                <Text style={[styles.quickActionLabel, { color: colors.fgMuted }]}>Income</Text>
              </Pressable>
              <Pressable
                style={[styles.quickActionBtn, { backgroundColor: colors.surface }]}
                onPress={() => { setQuickAddType('EXPENSE'); setQuickAdd(true); }}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: colors.surfaceRecessed }]}>
                  <Feather name="arrow-up-right" size={18} color={colors.primary} />
                </View>
                <Text style={[styles.quickActionLabel, { color: colors.fgMuted }]}>Expense</Text>
              </Pressable>
              <Pressable
                style={[styles.quickActionBtn, { backgroundColor: colors.surface }]}
                onPress={() => { setQuickAddType('TRANSFER'); setQuickAdd(true); }}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: colors.surfaceRecessed }]}>
                  <Feather name="wallet" size={18} color={colors.primary} />
                </View>
                <Text style={[styles.quickActionLabel, { color: colors.fgMuted }]}>Transfer</Text>
              </Pressable>
            </View>

            {/* Monthly Summary */}
            <View style={styles.section}>
              <SectionHeader
                title="This month"
                action="Insights"
                onAction={() => router.push('/(tabs)/insights')}
              />
              <View style={styles.statsGrid}>
                <StatTile label="Income" value={money(incomeTotal, settings.currency)} style={{ flex: 1 }} />
                <StatTile label="Expenses" value={money(expenseTotal, settings.currency)} style={{ flex: 1 }} />
              </View>
            </View>

            {/* Category Breakdown */}
            {categoryTotals.length > 0 && (
              <View style={styles.section}>
                <SectionHeader title="Where it goes" />
                <Card style={styles.categoryCard}>
                  {categoryTotals.slice(0, 4).map((item, index) => (
                    <View key={item.id}>
                      <View style={styles.categoryRow}>
                        <View style={[styles.categoryIcon, { backgroundColor: colors.surfaceRecessed }]}>
                          <Feather name={item.icon as never} size={18} color={colors.fgMuted} />
                        </View>
                        <View style={styles.categoryInfo}>
                          <View style={styles.categoryNameRow}>
                            <Text style={[styles.categoryName, { color: colors.fg }]}>{item.name}</Text>
                            <Text style={[styles.categoryAmount, { color: colors.fg }]}>{money(item.total, settings.currency)}</Text>
                          </View>
                          <View style={[styles.progressTrack, { backgroundColor: colors.surfaceRecessed }]}>
                            <View
                              style={[
                                styles.progressFill,
                                {
                                  width: `${Math.max(18, (item.total / Math.max(expenseTotal, 1)) * 100)}%`,
                                  backgroundColor: colors.fg,
                                },
                              ]}
                            />
                          </View>
                        </View>
                        <Feather name="chevron-right" size={18} color={colors.fgMuted} />
                      </View>
                      {index < categoryTotals.slice(0, 4).length - 1 && (
                        <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                      )}
                    </View>
                  ))}
                </Card>
              </View>
            )}

            {/* Recent Transactions */}
            <View style={styles.section}>
              <SectionHeader
                title="Recent transactions"
                action="See all"
                onAction={() => router.push('/(tabs)/expenses')}
              />
              <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Feather name="search" size={17} color={colors.fgSubtle} />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search transactions"
                  placeholderTextColor={colors.fgSubtle}
                  style={[styles.searchInput, { color: colors.fg }]}
                />
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="inbox"
            title="Nothing here yet"
            message="Your transactions will appear once you add your first entry."
          />
        }
        renderItem={({ item }) => {
          const isExpense = item.type === 'EXPENSE';
          const isIncome = item.type === 'INCOME';
          const isTransfer = item.type === 'TRANSFER';

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
                <Text style={[styles.txTitle, { color: colors.fg }]} numberOfLines={1}>{item.description}</Text>
                <Text style={[styles.txSubtitle, { color: colors.fgMuted }]} numberOfLines={1}>
                  {isExpense && item.category ? `${item.category} · ` : ''}
                  {isTransfer ? `${accounts.find(a => a.id === item.fromAccountId)?.name || ''} → ${accounts.find(a => a.id === item.toAccountId)?.name || ''} · ` : ''}
                  {formatDate(item.date)}
                </Text>
              </View>
              <Text
                style={[
                  styles.txAmount,
                  { color: isIncome ? colors.income : isTransfer ? colors.transfer : colors.fg },
                ]}
              >
                {isExpense ? '-' : isIncome ? '+' : ''}{money(item.amount, settings.currency)}
              </Text>
            </View>
          );
        }}
      />

      {/* Quick Add Modal */}
      <QuickAdd visible={quickAdd} onClose={() => setQuickAdd(false)} initialType={quickAddType} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    gap: spacing.lg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
  },
  topLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  greetContainer: {
    gap: 2,
  },
  greetSmall: {
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * lineHeight.normal,
  },
  greetName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
    lineHeight: fontSize.lg * lineHeight.snug,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    marginHorizontal: spacing[4],
    padding: spacing[6],
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroLabel: {
    fontSize: fontSize.xs,
    letterSpacing: 0.09,
    textTransform: 'uppercase',
  },
  heroAccount: {
    fontSize: fontSize.xs,
    letterSpacing: 0.04,
  },
  heroAmount: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: fontSize.hero,
    fontWeight: fontWeight.medium,
    letterSpacing: -0.02,
    marginTop: spacing[4],
    fontVariant: ['tabular-nums'],
  },
  heroSub: {
    fontSize: fontSize.xs,
    marginTop: spacing[2],
  },
  heroViz: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    marginTop: spacing[6],
  },
  arcContainer: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arcTrack: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 8,
    position: 'absolute',
  },
  arcFill: {
    width: 70,
    height: 70,
    position: 'absolute',
  },
  arcTextContainer: {
    alignItems: 'center',
  },
  arcPercentage: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 20,
    fontWeight: fontWeight.medium,
    color: '#ffffff',
  },
  arcLabel: {
    fontSize: 8,
    letterSpacing: 0.08,
    color: 'rgba(255,255,255,0.55)',
  },
  vizLegend: {
    flex: 1,
    gap: spacing[2],
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: fontSize.xs,
    flex: 1,
  },
  legendValue: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    fontVariant: ['tabular-nums'],
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: spacing[4],
    gap: spacing[3],
  },
  quickActionBtn: {
    flex: 1,
    alignItems: 'center',
    gap: spacing[2],
    padding: spacing[4],
    borderRadius: radius.md,
  },
  quickActionIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * lineHeight.normal,
  },
  section: {
    paddingHorizontal: spacing[5],
    gap: spacing[3],
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  categoryCard: {
    padding: spacing[2],
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[3],
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryInfo: {
    flex: 1,
    gap: spacing[2],
  },
  categoryNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  categoryAmount: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    fontVariant: ['tabular-nums'],
  },
  progressTrack: {
    height: 4,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    borderRadius: radius.full,
  },
  divider: {
    height: 1,
    marginHorizontal: spacing[3],
  },
  searchBox: {
    height: 45,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    gap: spacing[2],
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.base,
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
  // Quick Add Sheet
  sheetBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
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
    alignItems: 'flex-start',
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    letterSpacing: 1.2,
  },
  sheetTitle: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.medium,
    letterSpacing: -0.7,
    marginTop: 4,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountLabel: {
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: fontWeight.bold,
    marginTop: spacing[6],
    marginBottom: spacing[1],
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingBottom: spacing[2],
  },
  currency: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    marginRight: spacing[2],
  },
  amountInput: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 43,
    fontWeight: fontWeight.bold,
    flex: 1,
    padding: 0,
    letterSpacing: -1,
  },
  descriptionInput: {
    borderRadius: radius.md,
    height: 52,
    paddingHorizontal: spacing[4],
    fontSize: fontSize.base,
    marginTop: spacing[5],
    borderWidth: 1,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    borderRadius: radius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    borderWidth: 1,
  },
  categoryText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  moreCategories: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing[1],
    marginTop: spacing[3],
  },
  moreText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  saveButton: {
    height: 55,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[5],
  },
  saveButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  quickHint: {
    textAlign: 'center',
    fontSize: fontSize.xs,
    marginTop: spacing[3],
  },
  typeSelector: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[5],
    marginBottom: spacing[2],
  },
  typeButton: {
    flex: 1,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
});
