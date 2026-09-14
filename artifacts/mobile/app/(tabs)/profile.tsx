import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFinance } from '@/context/FinanceContext';
import { useColors } from '@/hooks/useColors';
import { spacing, radius, fontSize, fontWeight, lineHeight } from '@/constants/tokens';

function SettingsRow({ icon, label, subtitle, onPress }: { icon: string; label: string; subtitle?: string; onPress: () => void }) {
  const colors = useColors();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
      <View style={[styles.rowIcon, { backgroundColor: colors.surfaceRecessed }]}>
        <Feather name={icon as never} size={18} color={colors.fgMuted} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, { color: colors.fg }]}>{label}</Text>
        {subtitle && <Text style={[styles.rowSubtitle, { color: colors.fgMuted }]}>{subtitle}</Text>}
      </View>
      <Feather name="chevron-right" size={18} color={colors.fgSubtle} />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { settings, categories, accounts, transactions, paymentMethods, exportData } = useFinance();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const initials = settings.profileName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.canvas }]}
      contentContainerStyle={{ paddingTop: insets.top + spacing[5], paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={[styles.headerBtn, { backgroundColor: colors.surface }]}>
          <Feather name="more-horizontal" size={20} color={colors.fg} />
        </Pressable>
        <Pressable style={[styles.headerBtn, { backgroundColor: colors.surface }]}>
          <Feather name="bell" size={20} color={colors.fg} />
        </Pressable>
      </View>

      {/* Avatar */}
      <View style={styles.avatarSection}>
        <View style={[styles.avatar, { backgroundColor: colors.surfaceRecessed }]}>
          <Text style={[styles.avatarText, { color: colors.lavender }]}>{initials}</Text>
        </View>
        <Text style={[styles.profileName, { color: colors.fg }]}>{settings.profileName}</Text>
        <Text style={[styles.profileEmail, { color: colors.fgMuted }]}>sahil@example.com</Text>
      </View>

      {/* Account group */}
      <View style={styles.group}>
        <View style={[styles.groupCard, { backgroundColor: colors.surface }]}>
          <SettingsRow icon="wallet" label="Accounts" onPress={() => router.push('/settings')} />
          <SettingsRow icon="credit-card" label="Payment Methods" onPress={() => router.push('/settings')} />
          <SettingsRow icon="tag" label="Categories" subtitle={`${categories.length} categories`} onPress={() => router.push('/settings')} />
          <SettingsRow icon="target" label="Savings Goals" onPress={() => router.push('/settings')} />
          <SettingsRow icon="pie-chart" label="Budgets" onPress={() => router.push('/(tabs)/insights')} />
        </View>
      </View>

      {/* Preferences group */}
      <View style={styles.group}>
        <View style={[styles.groupCard, { backgroundColor: colors.surface }]}>
          <SettingsRow icon="moon" label="Appearance" subtitle="Dark" onPress={() => router.push('/settings')} />
          <SettingsRow icon="bell" label="Notifications" onPress={() => router.push('/settings')} />
          <SettingsRow icon="download" label="Export Data" onPress={() => exportData('json')} />
          <SettingsRow icon="info" label="About" onPress={() => Alert.alert('About', 'Pocketflow Finance v1.0.0\nA calm, premium financial command center.')} />
        </View>
      </View>

      {/* Sign Out */}
      <View style={styles.group}>
        <Pressable
          onPress={() => {
            Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Sign Out', style: 'destructive' },
            ]);
          }}
          style={({ pressed }) => [
            styles.signOutBtn,
            { backgroundColor: colors.surface },
            pressed && { opacity: 0.7 },
          ]}
        >
          <Text style={[styles.signOutText, { color: colors.expense }]}>Sign Out</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    marginBottom: spacing[4],
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Avatar
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing[6],
    gap: spacing[2],
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  avatarText: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.semibold,
  },
  profileName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
  },
  profileEmail: {
    fontSize: fontSize.sm,
  },

  // Groups
  group: {
    paddingHorizontal: spacing[4],
    marginBottom: spacing[4],
  },
  groupCard: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },

  // Rows
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[4],
    minHeight: 56,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContent: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  rowSubtitle: {
    fontSize: fontSize.xs,
  },

  // Sign out
  signOutBtn: {
    borderRadius: radius.lg,
    padding: spacing[4],
    alignItems: 'center',
  },
  signOutText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
});
