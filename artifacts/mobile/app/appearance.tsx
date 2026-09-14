import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFinance, type Appearance } from '@/context/FinanceContext';
import { useColors } from '@/hooks/useColors';
import { spacing, radius, fontSize, fontWeight } from '@/constants/tokens';

const options: { value: Appearance; label: string; icon: string; description: string }[] = [
  { value: 'dark', label: 'Dark', icon: 'moon', description: 'Premium dark aesthetic' },
  { value: 'light', label: 'Light', icon: 'sun', description: 'Clean light theme' },
  { value: 'system', label: 'System', icon: 'smartphone', description: 'Follow device setting' },
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
        {options.map((opt) => {
          const isSelected = settings.appearance === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => void handleSelect(opt.value)}
              style={[
                styles.optionCard,
                { backgroundColor: colors.surface },
                isSelected && { backgroundColor: `${colors.primary}15`, borderColor: colors.primary },
              ]}
            >
              <View style={[styles.optionIcon, { backgroundColor: colors.surfaceRecessed }]}>
                <Feather name={opt.icon as never} size={20} color={isSelected ? colors.primary : colors.fgMuted} />
              </View>
              <View style={styles.optionInfo}>
                <Text style={[styles.optionLabel, { color: isSelected ? colors.primary : colors.fg }]}>{opt.label}</Text>
                <Text style={[styles.optionDesc, { color: colors.fgMuted }]}>{opt.description}</Text>
              </View>
              {isSelected && (
                <Feather name="check-circle" size={22} color={colors.primary} />
              )}
            </Pressable>
          );
        })}

        <View style={[styles.previewCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.previewTitle, { color: colors.fg }]}>Preview</Text>
          <View style={[styles.previewRow, { backgroundColor: colors.surfaceRecessed }]}>
            <Feather name="user" size={18} color={colors.fgMuted} />
            <Text style={[styles.previewText, { color: colors.fg }]}>Sample text</Text>
          </View>
          <View style={[styles.previewButton, { backgroundColor: colors.primary }]}>
            <Text style={[styles.previewButtonText, { color: colors.onPrimary }]}>Primary Button</Text>
          </View>
        </View>
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
  optionInfo: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  optionDesc: {
    fontSize: fontSize.xs,
  },
  previewCard: {
    marginTop: spacing[4],
    padding: spacing[4],
    borderRadius: radius.lg,
    gap: spacing[3],
  },
  previewTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing[2],
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[3],
    borderRadius: radius.md,
  },
  previewText: {
    fontSize: fontSize.base,
  },
  previewButton: {
    paddingVertical: spacing[3],
    borderRadius: radius.full,
    alignItems: 'center',
  },
  previewButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
});
