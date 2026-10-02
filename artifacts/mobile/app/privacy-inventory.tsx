import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import {
  spacing,
  radius,
  fontSize,
  fontWeight,
  lineHeight,
} from "@/constants/tokens";

function InventoryItem({
  title,
  required,
  purpose,
  fields,
  storage,
}: {
  title: string;
  required: boolean;
  purpose: string;
  fields: string[];
  storage: string;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.inventoryCard,
        { backgroundColor: colors.surface, borderColor: colors.divider },
      ]}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: colors.fg }]}>{title}</Text>
        <View
          style={[
            styles.badge,
            {
              backgroundColor: required
                ? `${colors.primary}18`
                : `${colors.fgMuted}18`,
            },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              { color: required ? colors.primary : colors.fgMuted },
            ]}
          >
            {required ? "REQUIRED FOR USE" : "OPTIONAL"}
          </Text>
        </View>
      </View>

      <Text style={[styles.purposeText, { color: colors.fgMuted }]}>
        <Text style={{ fontWeight: fontWeight.semibold, color: colors.fg }}>
          Purpose:{" "}
        </Text>
        {purpose}
      </Text>

      <View style={styles.fieldsList}>
        <Text style={[styles.fieldsTitle, { color: colors.fg }]}>
          Fields Collected:
        </Text>
        {fields.map((f, i) => (
          <Text key={i} style={[styles.fieldLine, { color: colors.fgMuted }]}>
            • {f}
          </Text>
        ))}
      </View>

      <View
        style={[
          styles.storageRow,
          { borderTopColor: colors.divider, borderTopWidth: 1 },
        ]}
      >
        <Feather name="hard-drive" size={14} color={colors.fgSubtle} />
        <Text style={[styles.storageText, { color: colors.fgSubtle }]}>
          Storage: {storage}
        </Text>
      </View>
    </View>
  );
}

export default function PrivacyInventoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { backgroundColor: colors.canvas }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing[3] }]}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.surface }]}
          accessibilityLabel="Back"
        >
          <Feather name="arrow-left" size={20} color={colors.fg} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.fg }]}>
          Data Inventory
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing[10] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.kicker, { color: colors.primary }]}>
          TRANSPARENCY & DATA MINIMISATION
        </Text>
        <Text style={[styles.screenHeading, { color: colors.fg }]}>
          What Data We Use
        </Text>
        <Text style={[styles.screenSubheading, { color: colors.fgMuted }]}>
          Zeno adheres strictly to the principle of data minimisation under the
          Digital Personal Data Protection Act, 2023. We collect only what is
          strictly necessary to run your personal finance tracker locally.
        </Text>

        {/* 1. Account Information */}
        <InventoryItem
          title="Account & Profile"
          required={false}
          purpose="Display your personalized greeting and local profile representation."
          fields={[
            "Profile display name (defaults to 'Sahil Mulla')",
            "Profile avatar image (stored as local URI when picked)",
          ]}
          storage="On-device Local Storage (@zeno/settings)"
        />

        {/* 2. Financial Information */}
        <InventoryItem
          title="Financial Information"
          required={true}
          purpose="Calculate your account balances, spending trends, category progress, and budget summaries."
          fields={[
            "Account names, types (Cash, Bank, UPI, Savings), and opening balances",
            "Transactions (Amount, timestamp, note/description, category ID, account ID)",
            "Custom categories (Title, icon, color tag, expense/income type)",
            "Savings goals (Goal name, target amount, current saved amount, target date)",
            "Payment method names (e.g. UPI, Card, Cash)",
          ]}
          storage="On-device Local SQLite & AsyncStorage"
        />

        {/* 3. App Preferences */}
        <InventoryItem
          title="App Preferences"
          required={false}
          purpose="Preserve your chosen UI theme, display currency, and shortcut triggers."
          fields={[
            "Display currency (INR ₹, USD $, EUR €, GBP £, AED د.إ)",
            "Appearance preference (Dark, Light, System default)",
            "Quick Add trigger preferences (Volume down, home launcher, quick settings tile)",
            "Notification alert toggles",
          ]}
          storage="On-device Local Storage (@zeno/settings, @zeno/quickAddSettings)"
        />

        {/* 4. Technical Diagnostics */}
        <InventoryItem
          title="Technical Storage & Logs"
          required={true}
          purpose="Persist local app migrations and guarantee that instant Quick Add writes operate without data corruption."
          fields={[
            "Internal SQLite database schema version",
            "Privacy consent grant/withdrawal timestamp log (non-financial)",
          ]}
          storage="On-device Local Database"
        />

        {/* What We NEVER Collect */}
        <View
          style={[
            styles.neverCollectCard,
            {
              backgroundColor: `${colors.success}10`,
              borderColor: `${colors.success}30`,
            },
          ]}
        >
          <View style={styles.neverHeader}>
            <Feather name="shield" size={18} color={colors.success} />
            <Text style={[styles.neverTitle, { color: colors.success }]}>
              What Zeno Never Collects
            </Text>
          </View>
          <Text style={[styles.neverBody, { color: colors.fgMuted }]}>
            • No phone contact lists or address book access{"\n"}• No GPS
            location tracking{"\n"}• No SMS scraping or reading of private text
            messages{"\n"}• No bank login credentials, net-banking passwords, or
            UPI PINs{"\n"}• No advertising identifiers or cross-app tracking
            cookies{"\n"}• No biometric face or fingerprint data (biometrics
            stay inside OS secure enclave)
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  content: {
    paddingHorizontal: spacing[4],
    gap: spacing[4],
  },
  kicker: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    letterSpacing: 1.2,
  },
  screenHeading: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.bold,
    letterSpacing: -0.5,
    marginTop: -spacing[2],
  },
  screenSubheading: {
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * lineHeight.normal,
    marginTop: -spacing[2],
  },
  inventoryCard: {
    borderRadius: radius.xl,
    padding: spacing[4],
    borderWidth: 1,
    gap: spacing[3],
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  badge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.6,
  },
  purposeText: {
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * 1.4,
  },
  fieldsList: {
    gap: 2,
  },
  fieldsTitle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    marginBottom: 2,
  },
  fieldLine: {
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * 1.35,
  },
  storageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    paddingTop: spacing[2],
  },
  storageText: {
    fontSize: 11,
  },
  neverCollectCard: {
    borderRadius: radius.xl,
    padding: spacing[4],
    borderWidth: 1,
    gap: spacing[2],
    marginTop: spacing[2],
  },
  neverHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  neverTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  neverBody: {
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * 1.5,
  },
});
