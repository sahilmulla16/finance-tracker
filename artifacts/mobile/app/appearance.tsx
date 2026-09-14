import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFinance, type Appearance } from '@/context/FinanceContext';
import { useColors } from '@/hooks/useColors';
import { spacing, radius, fontSize, fontWeight } from '@/constants/tokens';

const options: { value: Appearance; label: string; icon: string }[] = [
  { value: 'dark', label: 'Dark', icon: 'moon' },
  { value: 'light', label: 'Light', icon: 'sun' },
  { value: 'system', label: 'System', icon: 'smartphone' },
];

export default function AppearanceScreen() {
  const { settings, updateSettings } = useFinance();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const handleSelect = async (value: Appearance) => {
    await updateSettings({ appearance: value });
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.canvas }]}>
      <View style={[styles.header, { paddingTop: insets.top + spacing[4] }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.surface }]}>
          <Feather name="arrow-left" size={20} color={colors.fg} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.fg }]}>Appearance</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, { color: colors.fgMuted }]}>THEME</Text>
        {options.map((opt) => (
          <Pressable
            key={opt.value}
            onPress={() => void handleSelect(opt.value)}
            style={[
              styles.optionCard,
              { backgroundColor: colors.surface },
              settings.appearance === opt.value && { backgroundColor: `${colors.primary}20`, borderColor: colors.primary },
            ]}
          >
            <View style={[styles.optionIcon, { backgroundColor: colors.surfaceRecessed }]}>
              <Feather name={opt.icon as never} size={20} color={settings.appearance === opt.value ? colors.primary : colors.fgMuted} />
            </View>
            <Text style={[styles.optionLabel, { color: settings.appearance === opt.value ? colors.primary : colors.fg }]}>{opt.label}</Text>
            {settings.appearance === opt.value && (
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
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    borderRadius: radius.lg,
    gap: spacing[3],
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    flex: 1,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
});
