import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
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
import { getMerchantLogo, getBankLogo } from '@/utils/merchantLogos';
import { suggestCategory } from '@/utils/categorySuggestions';

function MerchantLogo({ description, category }: { description: string; category?: string }) {
  const logo = getMerchantLogo(description, category);
  return (
    <View style={[styles.merchantLogo, { backgroundColor: logo.bg }]}>
      <Text style={[styles.merchantLetter, { color: logo.color }]}>{logo.letter}</Text>
    </View>
  );
}

function BankLogoIcon({ name }: { name: string }) {
  const logo = getBankLogo(name);
  return (
    <View style={[styles.bankLogoContainer, { backgroundColor: logo.bg }]}>
      <Text style={[styles.bankLogoLetter, { color: logo.color }]}>{logo.letter}</Text>
    </View>
  );
}

function CategoryPicker({
  visible,
  categories,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  categories: Category[];
  selected: Category | null;
  onSelect: (cat: Category) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.pickerBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.pickerSheet}>
          <View style={[styles.pickerHandle, { backgroundColor: '#303431' }]} />
          <Text style={[styles.pickerTitle, { color: '#F5F7F3' }]}>Select Category</Text>
          <ScrollView style={styles.pickerList} showsVerticalScrollIndicator={false}>
            {categories.map((cat) => (
              <Pressable
                key={cat.id}
                onPress={() => { onSelect(cat); onClose(); }}
                style={[
                  styles.pickerItem,
                  { backgroundColor: selected?.id === cat.id ? 'rgba(183,255,99,0.12)' : 'transparent' },
                ]}
              >
                <View style={[styles.pickerIcon, { backgroundColor: cat.color + '20' }]}>
                  <Feather name={cat.icon as never} size={18} color={cat.color} />
                </View>
                <Text style={[styles.pickerItemText, { color: '#F5F7F3' }]}>{cat.name}</Text>
                {selected?.id === cat.id && (
                  <Feather name="check" size={18} color="#B7FF63" />
                )}
              </Pressable>
            ))}
          </ScrollView>
          <Pressable onPress={onClose} style={[styles.pickerClose, { backgroundColor: '#171A18' }]}>
            <Text style={[styles.pickerCloseText, { color: '#A5AAA3' }]}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function AccountPicker({
  visible,
  accounts,
  selected,
  onSelect,
  onClose,
  currency,
}: {
  visible: boolean;
  accounts: Account[];
  selected: Account | null;
  onSelect: (acc: Account) => void;
  onClose: () => void;
  currency: string;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.pickerBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.pickerSheet}>
          <View style={[styles.pickerHandle, { backgroundColor: '#303431' }]} />
          <Text style={[styles.pickerTitle, { color: '#F5F7F3' }]}>Select Account</Text>
          <ScrollView style={styles.pickerList} showsVerticalScrollIndicator={false}>
            {accounts.filter(a => a.isActive).map((acc) => (
              <Pressable
                key={acc.id}
                onPress={() => { onSelect(acc); onClose(); }}
                style={[
                  styles.pickerItem,
                  { backgroundColor: selected?.id === acc.id ? 'rgba(183,255,99,0.12)' : 'transparent' },
                ]}
              >
                <BankLogoIcon name={acc.name} />
                <View style={styles.pickerItemInfo}>
                  <Text style={[styles.pickerItemText, { color: '#F5F7F3' }]}>{acc.name}</Text>
                  <Text style={[styles.pickerItemSub, { color: '#A5AAA3' }]}>
                    {acc.type} · {money(acc.openingBalance, acc.currency)}
                  </Text>
                </View>
                {selected?.id === acc.id && (
                  <Feather name="check" size={18} color="#B7FF63" />
                )}
              </Pressable>
            ))}
          </ScrollView>
          <Pressable onPress={onClose} style={[styles.pickerClose, { backgroundColor: '#171A18' }]}>
            <Text style={[styles.pickerCloseText, { color: '#A5AAA3' }]}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function QuickAdd({ visible, onClose, initialType = 'EXPENSE' }: { visible: boolean; onClose: () => void; initialType?: 'EXPENSE' | 'INCOME' | 'TRANSFER' }) {
  const { categories, accounts, addTransaction, addExpense, settings } = useFinance();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [type, setType] = useState<'EXPENSE' | 'INCOME' | 'TRANSFER'>(initialType);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(
    accounts.find(a => a.isDefault) || accounts[0] || null
  );
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);
  const [accountPickerVisible, setAccountPickerVisible] = useState(false);

  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null);
  const [categoryManuallySelected, setCategoryManuallySelected] = useState(false);

  // Smart category suggestion
  useEffect(() => {
    if (description.trim().length >= 2 && !categoryManuallySelected) {
      const suggested = suggestCategory(description);
      setSuggestedCategory(suggested);
    } else {
      setSuggestedCategory(null);
    }
  }, [description, categoryManuallySelected]);

  // Reset form when type changes
  useEffect(() => {
    if (visible) {
      setType(initialType);
      setAmount('');
      setDescription('');
      setSelectedCategory(null);
      setSelectedAccount(accounts.find(a => a.isDefault) || accounts[0] || null);
      setSelectedDate(new Date().toISOString().split('T')[0]);
      setSuggestedCategory(null);
      setCategoryManuallySelected(false);
    }
  }, [visible, initialType, accounts]);

  const handleCategorySelect = (cat: Category) => {
    setSelectedCategory(cat);
    setCategoryManuallySelected(true);
    setSuggestedCategory(null);
  };

  const handleSuggestedCategoryTap = () => {
    if (suggestedCategory) {
      const cat = categories.find(c => c.name === suggestedCategory);
      if (cat) {
        handleCategorySelect(cat);
      }
    }
  };

  const save = async () => {
    const parsed = Number(amount.replace(/,/g, ''));
    if (!parsed || parsed <= 0) return;

    const now = new Date();
    const date = selectedDate || now.toISOString().split('T')[0];
    const time = now.toTimeString().slice(0, 5);

    const finalCategory = selectedCategory || categories[0];
    const finalAccount = selectedAccount || accounts[0];

    if (type === 'EXPENSE') {
      await addTransaction({
        type: 'EXPENSE',
        amount: parsed,
        description: description.trim() || finalCategory.name,
        category: finalCategory.name,
        categoryId: finalCategory.id,
        accountId: finalAccount?.id,
        date,
        time,
      });
      await addExpense(parsed, description.trim() || finalCategory.name, finalCategory, finalAccount?.name);
    } else if (type === 'INCOME') {
      await addTransaction({
        type: 'INCOME',
        amount: parsed,
        description: description.trim() || 'Income',
        category: finalCategory.name,
        categoryId: finalCategory.id,
        accountId: finalAccount?.id,
        date,
        time,
      });
    } else {
      await addTransaction({
        type: 'TRANSFER',
        amount: parsed,
        description: description.trim() || 'Transfer',
        accountId: finalAccount?.id,
        date,
        time,
      });
    }

    setAmount('');
    setDescription('');
    setSelectedCategory(null);
    setSuggestedCategory(null);
    setCategoryManuallySelected(false);
    onClose();
  };

  const showSaveButton = amount.trim() && Number(amount.replace(/,/g, '')) > 0;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.sheetBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.sheetKeyboard}
        >
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 18) }]}>
            <View style={[styles.handle, { backgroundColor: '#303431' }]} />
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: '#F5F7F3' }]}>Quick Track</Text>
              <Pressable onPress={onClose} style={[styles.sheetCloseBtn, { backgroundColor: '#171A18' }]}>
                <Feather name="x" size={18} color="#A5AAA3" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Transaction Type */}
              <View style={styles.typeSelector}>
                {(['EXPENSE', 'INCOME', 'TRANSFER'] as const).map((t) => (
                  <Pressable
                    key={t}
                    onPress={() => { setType(t); void Haptics.selectionAsync(); }}
                    style={[
                      styles.typeBtn,
                      { backgroundColor: type === t ? '#B7FF63' : '#171A18' },
                    ]}
                  >
                    <Text style={[styles.typeBtnText, { color: type === t ? '#000000' : '#A5AAA3' }]}>
                      {t}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Amount */}
              <View style={styles.amountContainer}>
                <Text style={[styles.currencySymbol, { color: '#B7FF63' }]}>{currencySymbol(settings.currency)}</Text>
                <TextInput
                  autoFocus
                  value={amount}
                  onChangeText={(v) => setAmount(v.replace(/[^0-9.]/g, ''))}
                  placeholder="0.00"
                  placeholderTextColor="#303431"
                  keyboardType="decimal-pad"
                  style={[styles.amountInput, { color: '#F5F7F3' }]}
                />
              </View>

              {/* Description */}
              <View style={[styles.formRow, { backgroundColor: '#171A18' }]}>
                <Feather name="file-text" size={18} color="#A5AAA3" />
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="What did you spend on?"
                  placeholderTextColor="#303431"
                  style={[styles.formInput, { color: '#F5F7F3' }]}
                />
              </View>

              {/* Smart Category Suggestion */}
              {suggestedCategory && !selectedCategory && (
                <Pressable
                  onPress={handleSuggestedCategoryTap}
                  style={[styles.suggestionRow, { backgroundColor: 'rgba(183,255,99,0.08)' }]}
                >
                  <Feather name="zap" size={14} color="#B7FF63" />
                  <Text style={[styles.suggestionLabel, { color: '#A5AAA3' }]}>Suggested:</Text>
                  <Text style={[styles.suggestionCategory, { color: '#B7FF63' }]}>{suggestedCategory}</Text>
                  <Feather name="arrow-right" size={14} color="#B7FF63" />
                </Pressable>
              )}

              {/* Category */}
              <Pressable
                onPress={() => setCategoryPickerVisible(true)}
                style={[styles.formRow, { backgroundColor: '#171A18' }]}
              >
                <Feather name="tag" size={18} color="#A5AAA3" />
                <Text style={[styles.formValue, { color: selectedCategory ? '#F5F7F3' : '#303431' }]}>
                  {selectedCategory?.name || 'Select category'}
                </Text>
                <Feather name="chevron-right" size={18} color="#303431" />
              </Pressable>

              {/* Account */}
              <Pressable
                onPress={() => setAccountPickerVisible(true)}
                style={[styles.formRow, { backgroundColor: '#171A18' }]}
              >
                <Feather name="credit-card" size={18} color="#A5AAA3" />
                <Text style={[styles.formValue, { color: selectedAccount ? '#F5F7F3' : '#303431' }]}>
                  {selectedAccount?.name || 'Select account'}
                </Text>
                <Feather name="chevron-right" size={18} color="#303431" />
              </Pressable>

              {/* Date */}
              <View style={[styles.formRow, { backgroundColor: '#171A18' }]}>
                <Feather name="calendar" size={18} color="#A5AAA3" />
                <Text style={[styles.formValue, { color: '#F5F7F3' }]}>{selectedDate}</Text>
              </View>

              {/* Save Button */}
              {showSaveButton && (
                <Pressable
                  onPress={() => void save()}
                  style={[styles.saveBtn, { backgroundColor: '#B7FF63' }]}
                >
                  <Text style={[styles.saveBtnText, { color: '#000000' }]}>Save Transaction</Text>
                </Pressable>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>

      <CategoryPicker
        visible={categoryPickerVisible}
        categories={categories}
        selected={selectedCategory}
        onSelect={handleCategorySelect}
        onClose={() => setCategoryPickerVisible(false)}
      />

      <AccountPicker
        visible={accountPickerVisible}
        accounts={accounts}
        selected={selectedAccount}
        onSelect={setSelectedAccount}
        onClose={() => setAccountPickerVisible(false)}
        currency={settings.currency}
      />
    </Modal>
  );
}

export default function HomeScreen() {
  const { transactions, accounts, settings } = useFinance();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [quickAdd, setQuickAdd] = useState(false);
  const [quickAddType, setQuickAddType] = useState<'EXPENSE' | 'INCOME' | 'TRANSFER'>('EXPENSE');
  const [balanceVisible, setBalanceVisible] = useState(false);

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
          <View style={styles.balanceRow}>
            <Text style={[styles.balanceValue, { color: '#F5F7F3' }]}>
              {balanceVisible ? money(totalBalance, settings.currency) : `${currencySymbol(settings.currency)}••••••`}
            </Text>
            <Pressable
              onPress={() => setBalanceVisible(!balanceVisible)}
              style={[styles.eyeBtn, { backgroundColor: '#171A18' }]}
            >
              <Feather name={balanceVisible ? 'eye' : 'eye-off'} size={18} color="#A5AAA3" />
            </Pressable>
          </View>
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
              <Pressable
                style={styles.accountCardLime}
                onPress={() => router.push('/settings')}
              >
                <View style={styles.accountCardContent}>
                  <BankLogoIcon name="Cash Wallet" />
                  <View style={styles.accountInfo}>
                    <Text style={styles.accountNameDark}>Cash Wallet</Text>
                    <Text style={styles.accountTypeDark}>Cash</Text>
                  </View>
                </View>
                <Text style={styles.accountBalanceDark}>{money(0, settings.currency)}</Text>
                <Text style={styles.accountMaskDark}>•••• •••• 0000</Text>
              </Pressable>
            ) : (
              accounts.filter(a => a.isActive).map((account, index) => (
                <Pressable
                  key={account.id}
                  style={index === 0 ? styles.accountCardLime : styles.accountCardDark}
                  onPress={() => router.push('/settings')}
                >
                  <View style={styles.accountCardContent}>
                    <BankLogoIcon name={account.name} />
                    <View style={styles.accountInfo}>
                      <Text style={index === 0 ? styles.accountNameDark : styles.accountNameLight} numberOfLines={1}>{account.name}</Text>
                      <Text style={index === 0 ? styles.accountTypeDark : styles.accountTypeLight}>{account.type === 'BANK' ? 'Bank Account' : account.type}</Text>
                    </View>
                    <View style={index === 0 ? styles.accountAddDark : styles.accountAddLight}>
                      <Feather name="plus" size={14} color={index === 0 ? '#000000' : '#A5AAA3'} />
                    </View>
                  </View>
                  <Text style={index === 0 ? styles.accountBalanceDark : styles.accountBalanceLight}>{money(account.openingBalance, account.currency)}</Text>
                  <Text style={index === 0 ? styles.accountMaskDark : styles.accountMaskLight}>•••• •••• {account.id.slice(-4)}</Text>
                </Pressable>
              ))
            )}
          </ScrollView>
        </View>

        {/* Latest Transactions — WHITE CARD (header inside) */}
        <View style={styles.txWhiteCard}>
          <View style={styles.txSectionHeader}>
            <Text style={[styles.txSectionTitle, { color: '#111312' }]}>Latest Transactions</Text>
            <Pressable onPress={() => router.push('/(tabs)/expenses')}>
              <Text style={[styles.txSectionAction, { color: '#6B706B' }]}>See all</Text>
            </Pressable>
          </View>

          {latestTransactions.length > 0 ? (
            latestTransactions.map((tx, index) => {
              const isExpense = tx.type === 'EXPENSE';
              const isIncome = tx.type === 'INCOME';
              return (
                <View key={tx.id}>
                  <View style={styles.txRow}>
                    <MerchantLogo description={tx.description} category={tx.category} />
                    <View style={styles.txContent}>
                      <Text style={[styles.txTitle, { color: '#111312' }]} numberOfLines={1}>{tx.description}</Text>
                      <Text style={[styles.txSubtitle, { color: '#6B706B' }]} numberOfLines={1}>
                        {tx.category || 'Transfer'} · {getTxDateLabel(tx.date)}
                      </Text>
                    </View>
                    <Text style={[styles.txAmount, { color: isIncome ? '#34C759' : '#111312' }]}>
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
              <Text style={[styles.emptyTxText, { color: '#6B706B' }]}>No transactions yet</Text>
            </View>
          )}
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
    fontSize: 15,
    lineHeight: 20,
  },
  greetName: {
    fontSize: 22,
    fontWeight: fontWeight.semibold,
    lineHeight: 28,
    marginTop: 2,
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
    marginTop: spacing[8],
  },
  balanceLabel: {
    fontSize: 14,
    lineHeight: 20,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginTop: spacing[2],
  },
  balanceValue: {
    fontSize: 42,
    fontWeight: fontWeight.semibold,
    lineHeight: 48,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  eyeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Quick actions
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[8],
    marginTop: spacing[8],
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

  // Account cards — wider, shorter, horizontal layout
  accountsScroll: {
    gap: spacing[3],
    paddingRight: spacing[4],
  },
  accountCardLime: {
    width: 220,
    height: 170,
    padding: 18,
    borderRadius: 22,
    backgroundColor: '#B7FF63',
    justifyContent: 'space-between',
  },
  accountCardDark: {
    width: 220,
    height: 170,
    padding: 18,
    borderRadius: 22,
    backgroundColor: '#171A18',
    justifyContent: 'space-between',
  },
  accountCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bankLogoContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankLogoLetter: {
    fontSize: 18,
    fontWeight: fontWeight.semibold,
  },
  accountInfo: {
    flex: 1,
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
    marginTop: 2,
  },
  accountTypeLight: {
    fontSize: 11,
    fontWeight: fontWeight.medium,
    color: '#A5AAA3',
    marginTop: 2,
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

  // Latest Transactions — WHITE CARD (header inside)
  txWhiteCard: {
    marginTop: spacing[6],
    marginHorizontal: spacing[4],
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    minHeight: 160,
  },
  txSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 0,
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
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  sheetKeyboard: {
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#090B0A',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing[5],
    paddingTop: spacing[3],
    maxHeight: '85%',
  },
  handle: {
    width: 42,
    height: 4,
    borderRadius: radius.full,
    alignSelf: 'center',
    marginBottom: spacing[4],
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  sheetTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
  },
  sheetCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[4],
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
    marginBottom: spacing[5],
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
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    padding: spacing[3],
    borderRadius: radius.md,
    marginBottom: spacing[3],
  },
  suggestionLabel: {
    fontSize: fontSize.sm,
  },
  suggestionCategory: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    flex: 1,
  },
  saveBtn: {
    paddingVertical: spacing[4],
    borderRadius: radius.full,
    alignItems: 'center',
    marginTop: spacing[3],
  },
  saveBtnText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },

  // Picker styles
  pickerBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  pickerSheet: {
    backgroundColor: '#090B0A',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing[5],
    paddingTop: spacing[3],
    maxHeight: '60%',
  },
  pickerHandle: {
    width: 42,
    height: 4,
    borderRadius: radius.full,
    alignSelf: 'center',
    marginBottom: spacing[4],
  },
  pickerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing[4],
  },
  pickerList: {
    flex: 1,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[3],
    borderRadius: radius.md,
    marginBottom: spacing[1],
  },
  pickerIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerItemInfo: {
    flex: 1,
  },
  pickerItemText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  pickerItemSub: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  pickerClose: {
    paddingVertical: spacing[3],
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: spacing[3],
    marginBottom: spacing[2],
  },
  pickerCloseText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
});
