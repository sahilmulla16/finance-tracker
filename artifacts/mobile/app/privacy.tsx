import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { spacing, radius, fontSize, fontWeight, lineHeight } from '@/constants/tokens';

export default function PrivacyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { backgroundColor: colors.canvas }]}>
      <View style={[styles.header, { paddingTop: insets.top + spacing[4] }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.surface }]}>
          <Feather name="arrow-left" size={20} color={colors.fg} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.fg }]}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.fg }]}>Privacy Policy</Text>
        <Text style={[styles.date, { color: colors.fgMuted }]}>Last updated: January 2024</Text>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.fg }]}>Information We Collect</Text>
          <Text style={[styles.paragraph, { color: colors.fgMuted }]}>
            Pocketflow collects financial data that you manually enter, including transactions, accounts, categories, and budgets. This data is stored locally on your device.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.fg }]}>How We Use Your Information</Text>
          <Text style={[styles.paragraph, { color: colors.fgMuted }]}>
            Your financial data is used solely to provide you with budgeting and expense tracking features within the app. We do not share, sell, or transmit your data to external servers.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.fg }]}>Data Storage</Text>
          <Text style={[styles.paragraph, { color: colors.fgMuted }]}>
            All data is stored locally on your device using secure storage mechanisms. You can export your data at any time from the Settings menu.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.fg }]}>Contact Us</Text>
          <Text style={[styles.paragraph, { color: colors.fgMuted }]}>
            If you have questions about this Privacy Policy, please contact us at privacy@pocketflow.app
          </Text>
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
    gap: spacing[4],
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
  },
  date: {
    fontSize: fontSize.sm,
    marginTop: -spacing[2],
  },
  card: {
    padding: spacing[4],
    borderRadius: radius.lg,
    gap: spacing[2],
  },
  sectionTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  paragraph: {
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * lineHeight.normal,
  },
});
