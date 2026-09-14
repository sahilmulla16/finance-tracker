import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFinance, type Currency } from '@/context/FinanceContext';
import { useColors } from '@/hooks/useColors';
import { spacing, radius, fontSize, fontWeight } from '@/constants/tokens';

const currencies: { code: Currency; symbol: string; name: string }[] = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
];

export default function CurrencyScreen() {
  const { settings, updateSettings } = useFinance();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const handleSelect = async (code: Currency) => {
    await updateSettings({ currency: code });
    router.back();
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.canvas }]}>
      <View style={[styles.header, { paddingTop: insets.top + spacing[4] }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.surface }]}>
          <Feather name="arrow-left" size={20} color={colors.fg} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.fg }]}>Currency</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, { color: colors.fgMuted }]}>SELECT CURRENCY</Text>
        {currencies.map((curr) => (
          <Pressable
            key={curr.code}
            onPress={() => void handleSelect(curr.code)}
            style={[
              styles.currencyCard,
              { backgroundColor: colors.surface },
              settings.currency === curr.code && { backgroundColor: `${colors.primary}20`, borderColor: colors.primary },
            ]}
          >
            <Text style={[styles.currencySymbol, { color: settings.currency === curr.code ? colors.primary : colors.fg }]}>{curr.symbol}</Text>
            <View style={styles.currencyInfo}>
              <Text style={[styles.currencyCode, { color: settings.currency === curr.code ? colors.primary : colors.fg }]}>{curr.code}</Text>
              <Text style={[styles.currencyName, { color: colors.fgMuted }]}>{curr.name}</Text>
            </View>
            {settings.currency === curr.code && (
              <Feather name="check-circle" size={22} color={colors.primary} />
            )}
          </Pressable>
        ))}
      </ScrollView>
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
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  content: {
    padding: spacing[4],
    gap: spacing[3],
  },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    letterSpacing: 1,
    marginBottom: spacing[2],
  },
  currencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    borderRadius: radius.lg,
    gap: spacing[3],
    borderWidth: 2,
    borderColor: 'transparent',
  },
  currencySymbol: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.semibold,
    width: 44,
    textAlign: 'center',
  },
  currencyInfo: {
    flex: 1,
  },
  currencyCode: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  currencyName: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },
});
