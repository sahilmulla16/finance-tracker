import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
import { useFinance, type Category } from '@/context/FinanceContext';
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

function QuickAdd({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { categories, addExpense } = useFinance();
  const insets = useSafeAreaInsets();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>(categories[0]);
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
    await addExpense(parsed, description || suggestion.name, suggestion);
    setAmount(''); setDescription(''); setCategory(categories[0]); onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.sheetBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 18) }]}>
          <View style={styles.handle} />
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.eyebrow}>QUICK CAPTURE</Text>
              <Text style={styles.sheetTitle}>Add expense</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}><Feather name="x" size={20} color="#74839B" /></Pressable>
          </View>
          <Text style={styles.amountLabel}>AMOUNT</Text>
          <View style={styles.amountRow}>
            <Text style={styles.currency}>₹</Text>
            <TextInput
              testID="expense-amount"
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
            testID="expense-description"
            value={description}
            onChangeText={setDescription}
            placeholder="What was it for?"
            placeholderTextColor="#9AA8BC"
            style={styles.descriptionInput}
            returnKeyType="done"
          />
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
          <Pressable testID="save-expense" onPress={() => void save()} style={({ pressed }) => [styles.saveButton, pressed && { opacity: 0.82 }]}>
            <Text style={styles.saveButtonText}>Save expense</Text>
            <Feather name="arrow-up-right" size={19} color="#FFF" />
          </Pressable>
          <Text style={styles.quickHint}>Saved privately on this device · {new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</Text>
        </View>
      </View>
    </Modal>
  );
}

export default function HomeScreen() {
  const { expenses, categories } = useFinance();
  const [quickAdd, setQuickAdd] = useState(false);
  const [search, setSearch] = useState('');
  const insets = useSafeAreaInsets();
  const monthTotal = expenses.reduce((sum, item) => sum + item.amount, 0);
  const todayTotal = expenses.filter((item) => new Date(item.date).toDateString() === new Date().toDateString()).reduce((sum, item) => sum + item.amount, 0);
  const filtered = expenses.filter((item) => `${item.description} ${item.category}`.toLowerCase().includes(search.toLowerCase()));
  const categoryTotals = categories.map((category) => ({ ...category, total: expenses.filter((item) => item.category === category.name).reduce((sum, item) => sum + item.amount, 0) })).filter((item) => item.total > 0).sort((a, b) => b.total - a.total);

  return (
    <View style={styles.screen}>
      <LinearGradient colors={['#EAF1FF', '#F7F9FD', '#F5F8FF']} style={StyleSheet.absoluteFill} />
      <FlatList
        data={filtered.slice(0, 5)}
        keyExtractor={(item) => item.id}
        scrollEnabled={filtered.length > 0}
        contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 120 }}
        ListHeaderComponent={
          <View>
            <View style={styles.topBar}>
              <View><Text style={styles.greeting}>{greeting()}, Sahil</Text><Text style={styles.dateText}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</Text></View>
              <Pressable testID="open-settings" onPress={() => router.push('/settings')} style={styles.avatar}><Text style={styles.avatarText}>S</Text></Pressable>
            </View>
            <View style={styles.balanceCard}>
              <View style={styles.balanceTop}><Text style={styles.cardEyebrow}>TOTAL SPENT · AUGUST</Text><Feather name="more-horizontal" size={20} color="#8A9AB3" /></View>
              <Text style={styles.totalAmount}>{money(monthTotal)}</Text>
              <View style={styles.balanceMeta}><View style={styles.trend}><Feather name="trending-up" size={14} color="#2C9C77" /><Text style={styles.trendText}>8.4%</Text></View><Text style={styles.mutedMeta}>vs last month</Text></View>
              <View style={styles.balanceDivider} />
              <View style={styles.todayRow}><View><Text style={styles.todayLabel}>Today</Text><Text style={styles.todayAmount}>{money(todayTotal)}</Text></View><View style={styles.todayCount}><Text style={styles.countValue}>{expenses.filter((item) => new Date(item.date).toDateString() === new Date().toDateString()).length}</Text><Text style={styles.countLabel}>expenses</Text></View></View>
            </View>
            <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Where it goes</Text><Text style={styles.sectionLink}>This month</Text></View>
            <View style={styles.categoryCard}>{categoryTotals.slice(0, 4).map((item, index) => <View key={item.id} style={styles.categoryRow}><IconBubble icon={item.icon} color={item.color} size={34} /><View style={styles.categoryInfo}><View style={styles.categoryNameRow}><Text style={styles.categoryName}>{item.name}</Text><Text style={styles.categoryTotal}>{money(item.total)}</Text></View><View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.max(18, (item.total / Math.max(monthTotal, 1)) * 100)}%`, backgroundColor: item.color }]} /></View></View></View>)}</View>
            <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Recent activity</Text><Text style={styles.sectionLink}>See all</Text></View>
            <View style={styles.searchBox}><Feather name="search" size={17} color="#9AA8BC" /><TextInput value={search} onChangeText={setSearch} placeholder="Search expenses" placeholderTextColor="#9AA8BC" style={styles.searchInput} /></View>
          </View>
        }
        ListEmptyComponent={<View style={styles.empty}><Feather name="inbox" size={28} color="#2868E8" /><Text style={styles.emptyTitle}>Nothing here yet</Text><Text style={styles.emptyText}>Your spending will appear once you add your first expense.</Text></View>}
        renderItem={({ item }) => <View style={styles.expenseRow}><IconBubble icon={item.icon} color={item.color} /><View style={styles.expenseMain}><Text style={styles.expenseTitle}>{item.description}</Text><Text style={styles.expenseSub}>{item.category} · {new Date(item.date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</Text></View><Text style={styles.expenseAmount}>−{money(item.amount)}</Text></View>}
      />
      <Pressable testID="quick-add" onPress={() => { setQuickAdd(true); void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }} style={({ pressed }) => [styles.fab, { bottom: Math.max(insets.bottom, 18) + 68 }, pressed && { transform: [{ scale: 0.96 }] }]}><Feather name="plus" size={22} color="#FFF" /><Text style={styles.fabText}>Add expense</Text></Pressable>
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
  balanceMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 7 },
  trend: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#D8F4E9', paddingHorizontal: 7, paddingVertical: 4, borderRadius: 8 },
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
  searchInput: { flex: 1, color: '#14213D', fontSize: 14 }, expenseRow: { marginHorizontal: 22, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }, expenseMain: { flex: 1 }, expenseTitle: { color: '#243653', fontSize: 14, fontWeight: '600' }, expenseSub: { color: '#91A0B5', fontSize: 12, marginTop: 4 }, expenseAmount: { color: '#253756', fontSize: 14, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: 42, paddingHorizontal: 40 }, emptyTitle: { color: '#253756', fontSize: 16, fontWeight: '700', marginTop: 12 }, emptyText: { color: '#91A0B5', textAlign: 'center', lineHeight: 20, fontSize: 13, marginTop: 7 },
  fab: { position: 'absolute', right: 20, height: 54, paddingHorizontal: 19, borderRadius: 19, backgroundColor: '#2868E8', flexDirection: 'row', alignItems: 'center', gap: 8, shadowColor: '#2868E8', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 7 }, elevation: 8 }, fabText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  sheetBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(18,32,60,0.42)' }, sheet: { backgroundColor: '#F8FAFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 22, paddingTop: 10 }, handle: { width: 42, height: 4, borderRadius: 4, backgroundColor: '#C4CEDD', alignSelf: 'center', marginBottom: 19 }, sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }, eyebrow: { color: '#2868E8', fontSize: 10, fontWeight: '700', letterSpacing: 1.2 }, sheetTitle: { color: '#14213D', fontSize: 26, fontWeight: '700', letterSpacing: -0.7, marginTop: 4 }, closeButton: { width: 38, height: 38, borderRadius: 14, backgroundColor: '#EAF0FA', justifyContent: 'center', alignItems: 'center' },
  amountLabel: { color: '#8A99AE', fontSize: 10, letterSpacing: 1, fontWeight: '700', marginTop: 25, marginBottom: 5 }, amountRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#D9E2F0', paddingBottom: 8 }, currency: { color: '#2868E8', fontSize: 26, fontWeight: '700', marginRight: 7 }, amountInput: { color: '#14213D', fontSize: 43, fontWeight: '700', flex: 1, padding: 0, letterSpacing: -1 },
  descriptionInput: { backgroundColor: '#FFF', borderRadius: 15, height: 52, paddingHorizontal: 16, color: '#243653', fontSize: 15, marginTop: 19, borderWidth: 1, borderColor: '#E3EAF5' }, categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 }, categoryChip: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#FFF', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 11, borderWidth: 1, borderColor: '#E2E9F4' }, categoryText: { color: '#53627A', fontSize: 12, fontWeight: '600' }, categoryTextActive: { color: '#FFF' }, moreCategories: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4, marginTop: 13 }, moreText: { color: '#2868E8', fontSize: 12, fontWeight: '600' },
  saveButton: { height: 55, backgroundColor: '#2868E8', borderRadius: 17, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 9, marginTop: 20 }, saveButtonText: { color: '#FFF', fontSize: 15, fontWeight: '700' }, quickHint: { textAlign: 'center', color: '#9AA8BC', fontSize: 11, marginTop: 11 },
});