import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFinance } from '@/context/FinanceContext';
import { useColors } from '@/hooks/useColors';
import { spacing, radius, fontSize, fontWeight, lineHeight } from '@/constants/tokens';
import { Card, Avatar, SectionHeader, ListItem, Toggle, StatTile } from '@/components/ui';

export default function ProfileScreen() {
  const {
    settings,
    categories,
    accounts,
    transactions,
    paymentMethods,
    updateSettings,
    exportData,
  } = useFinance();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const totalTransactions = transactions.length;
  const expenseCount = transactions.filter(t => t.type === 'EXPENSE').length;
  const incomeCount = transactions.filter(t => t.type === 'INCOME').length;

  const defaultPayment = paymentMethods.find(m => m.isDefault)?.name || 'None';
  const defaultAccount = accounts.find(a => a.isDefault);

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.canvas }]}
      contentContainerStyle={{ paddingTop: insets.top + spacing[5], paddingBottom: spacing[24] }}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Avatar name={settings.profileName} size={40} backgroundColor={colors.surfaceRecessed} textColor={colors.fg} />
          <View style={styles.headerText}>
            <Text style={[styles.headerSub, { color: colors.fgMuted }]}>Account</Text>
            <Text style={[styles.headerTitle, { color: colors.fg }]}>Profile</Text>
          </View>
        </View>
        <Pressable
          onPress={() => router.push('/settings')}
          style={[styles.iconBtn, { backgroundColor: colors.surface }]}
        >
          <Feather name="edit-2" size={18} color={colors.primary} />
        </Pressable>
      </View>

      {/* Identity Plate */}
      <Card variant="hero" style={styles.plate}>
        <View style={styles.plateRow}>
          <Avatar name={settings.profileName} size={64} backgroundColor="rgba(255,255,255,0.10)" textColor="#ffffff" />
          <View style={styles.plateInfo}>
            <Text style={[styles.plateName, { color: '#ffffff' }]}>{settings.profileName}</Text>
            <Text style={[styles.plateEmail, { color: 'rgba(255,255,255,0.55)' }]}>
              Member since {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </Text>
            <Text style={[styles.plateMeta, { color: 'rgba(255,255,255,0.55)' }]}>
              {settings.currency}
            </Text>
          </View>
        </View>

        {/* Financial Health Ring */}
        <View style={styles.plateViz}>
          <View style={styles.ringContainer}>
            <View style={[styles.ringTrack, { borderColor: 'rgba(255,255,255,0.12)' }]}>
              <View
                style={[
                  styles.ringFill,
                  {
                    borderColor: colors.primary,
                    transform: [{ rotate: '-90deg' }],
                    borderTopRightRadius: 999,
                    borderBottomRightRadius: 999,
                    borderLeftColor: 'transparent',
                    borderBottomColor: accounts.length > 0 ? colors.primary : 'transparent',
                  },
                ]}
              />
            </View>
            <View style={styles.ringText}>
              <Text style={[styles.ringPercent, { color: '#ffffff' }]}>
                {Math.min(Math.round((accounts.length / 4) * 100), 100)}%
              </Text>
              <Text style={[styles.ringLabel, { color: 'rgba(255,255,255,0.55)' }]}>SET UP</Text>
            </View>
          </View>
          <View style={styles.vizLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.legendText, { color: 'rgba(255,255,255,0.55)' }]}>Accounts</Text>
              <Text style={[styles.legendValue, { color: '#ffffff' }]}>{accounts.length} active</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.legendText, { color: 'rgba(255,255,255,0.55)' }]}>Categories</Text>
              <Text style={[styles.legendValue, { color: '#ffffff' }]}>{categories.length}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.legendText, { color: 'rgba(255,255,255,0.55)' }]}>Transactions</Text>
              <Text style={[styles.legendValue, { color: '#ffffff' }]}>{totalTransactions}</Text>
            </View>
          </View>
        </View>
      </Card>

      {/* Activity Stats */}
      <View style={styles.section}>
        <SectionHeader title="Your activity" action="Insights" onAction={() => router.push('/(tabs)/insights')} />
        <View style={styles.statsGrid}>
          <StatTile label="Tracked" value={totalTransactions.toString()} style={{ flex: 1 }} />
          <StatTile label="Categories" value={categories.length.toString()} style={{ flex: 1 }} />
        </View>
      </View>

      {/* Account Settings */}
      <View style={styles.section}>
        <SectionHeader title="Account" />
        <Card style={styles.settingsCard}>
          <ListItem
            icon="user"
            title="Personal details"
            subtitle={settings.profileName}
            onPress={() => router.push('/settings')}
          />
          <ListItem
            icon="wallet"
            title="Linked accounts"
            subtitle={accounts.length > 0 ? `${accounts.length} accounts` : 'No accounts yet'}
            value={defaultAccount?.name || '—'}
            onPress={() => router.push('/settings')}
          />
          <ListItem
            icon="tag"
            title="Categories"
            subtitle="Custom spend labels"
            value={categories.length.toString()}
            onPress={() => router.push('/settings')}
          />
          <ListItem
            icon="dollar-sign"
            title="Currency"
            subtitle="Display and reports"
            value={settings.currency}
            onPress={() => router.push('/settings')}
          />
        </Card>
      </View>

      {/* Preferences */}
      <View style={styles.section}>
        <SectionHeader title="Preferences" />
        <Card style={styles.settingsCard}>
          <View style={styles.toggleRow}>
            <View style={[styles.toggleIcon, { backgroundColor: colors.surfaceRecessed }]}>
              <Feather name="bell" size={18} color={colors.fgMuted} />
            </View>
            <View style={styles.toggleContent}>
              <Text style={[styles.toggleTitle, { color: colors.fg }]}>Spend alerts</Text>
              <Text style={[styles.toggleSubtitle, { color: colors.fgMuted }]}>When a budget nears its cap</Text>
            </View>
            <Toggle
              value={settings.notificationsEnabled}
              onValueChange={(value) => updateSettings({ notificationsEnabled: value })}
            />
          </View>
          <View style={styles.toggleRow}>
            <View style={[styles.toggleIcon, { backgroundColor: colors.surfaceRecessed }]}>
              <Feather name="eye-off" size={18} color={colors.fgMuted} />
            </View>
            <View style={styles.toggleContent}>
              <Text style={[styles.toggleTitle, { color: colors.fg }]}>Hide balances</Text>
              <Text style={[styles.toggleSubtitle, { color: colors.fgMuted }]}>Mask amounts on open</Text>
            </View>
            <Toggle
              value={false}
              onValueChange={() => {}}
            />
          </View>
        </Card>
      </View>

      {/* Security & Support */}
      <View style={styles.section}>
        <SectionHeader title="Security & support" />
        <Card style={styles.settingsCard}>
          <ListItem
            icon="lock"
            title="App lock"
            subtitle="Face ID on launch"
            value="On"
            onPress={() => {}}
          />
          <ListItem
            icon="download"
            title="Export data"
            subtitle="JSON backup of all data"
            onPress={() => exportData('json')}
          />
          <ListItem
            icon="message-circle"
            title="Help centre"
            subtitle="Guides and contact"
            onPress={() => {}}
          />
        </Card>
      </View>

      {/* Sign Out */}
      <View style={styles.section}>
        <Pressable
          style={({ pressed }) => [
            styles.signOutBtn,
            { backgroundColor: colors.surface },
            pressed && { opacity: 0.8 },
          ]}
        >
          <Text style={[styles.signOutText, { color: colors.primary }]}>Sign out</Text>
        </Pressable>
        <Text style={[styles.version, { color: colors.fgMuted }]}>
          PocketFlow 1.0.0
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  headerText: {
    gap: 2,
  },
  headerSub: {
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * lineHeight.normal,
  },
  headerTitle: {
    fontFamily: 'SpaceGrotesk-Regular',
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
  plate: {
    marginHorizontal: spacing[4],
    marginTop: spacing[6],
    padding: spacing[6],
  },
  plateRow: {
    flexDirection: 'row',
    gap: spacing[4],
  },
  plateInfo: {
    flex: 1,
    gap: spacing[1],
  },
  plateName: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.medium,
    letterSpacing: -0.01,
    lineHeight: fontSize['2xl'] * lineHeight.tight,
  },
  plateEmail: {
    fontSize: fontSize.xs,
  },
  plateMeta: {
    fontSize: fontSize.xs,
  },
  plateViz: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    marginTop: spacing[6],
  },
  ringContainer: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringTrack: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 8,
    position: 'absolute',
  },
  ringFill: {
    width: 70,
    height: 70,
    position: 'absolute',
  },
  ringText: {
    alignItems: 'center',
  },
  ringPercent: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 20,
    fontWeight: fontWeight.medium,
  },
  ringLabel: {
    fontSize: 8,
    letterSpacing: 0.08,
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
  },
  section: {
    paddingHorizontal: spacing[5],
    marginTop: spacing[6],
    gap: spacing[3],
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  settingsCard: {
    padding: 0,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[4],
    minHeight: 56,
  },
  toggleIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleContent: {
    flex: 1,
    gap: 2,
  },
  toggleTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    lineHeight: fontSize.base * lineHeight.snug,
  },
  toggleSubtitle: {
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * lineHeight.snug,
  },
  signOutBtn: {
    padding: spacing[4],
    borderRadius: radius.md,
    alignItems: 'center',
  },
  signOutText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  version: {
    textAlign: 'center',
    fontSize: fontSize.xs,
  },
});
