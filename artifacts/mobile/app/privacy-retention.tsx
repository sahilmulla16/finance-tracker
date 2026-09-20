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

function RetentionCard({
  category,
  purpose,
  retentionRule,
  deletionTrigger,
}: {
  category: string;
  purpose: string;
  retentionRule: string;
  deletionTrigger: string;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.divider },
      ]}
    >
      <Text style={[styles.cardTitle, { color: colors.fg }]}>{category}</Text>

      <View style={styles.row}>
        <Text style={[styles.label, { color: colors.fgSubtle }]}>Purpose:</Text>
        <Text style={[styles.val, { color: colors.fgMuted }]}>{purpose}</Text>
      </View>

      <View style={styles.row}>
        <Text style={[styles.label, { color: colors.fgSubtle }]}>
          Retention Rule:
        </Text>
        <Text style={[styles.val, { color: colors.fg }]}>{retentionRule}</Text>
      </View>

      <View
        style={[
          styles.triggerRow,
          { borderTopColor: colors.divider, borderTopWidth: 1 },
        ]}
      >
        <Feather name="trash-2" size={13} color={colors.error} />
        <Text style={[styles.triggerText, { color: colors.fgMuted }]}>
          <Text style={{ fontWeight: fontWeight.semibold, color: colors.fg }}>
            Deletion Trigger:{" "}
          </Text>
          {deletionTrigger}
        </Text>
      </View>
    </View>
  );
}

export default function PrivacyRetentionScreen() {
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
          Data Retention Schedule
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
          DATA LIFECYCLE GOVERNANCE
        </Text>
        <Text style={[styles.screenHeading, { color: colors.fg }]}>
          Data Retention Rules
        </Text>
        <Text style={[styles.screenSubheading, { color: colors.fgMuted }]}>
          Under the Digital Personal Data Protection Act, 2023, data must not be
          retained longer than necessary to satisfy the purpose for which it was
          processed. Because Pocketflow is an offline local application, data
          lifecycle is governed directly on your device.
        </Text>

        <RetentionCard
          category="Financial Transactions & Balances"
          purpose="Provide historical budgeting, expense tracking, and account calculations."
          retentionRule="Retained in device storage as long as you maintain the application."
          deletionTrigger="Individual entry deletion in app, or full data purge via 'Delete My Data'."
        />

        <RetentionCard
          category="Financial Accounts & Custom Categories"
          purpose="Organize and classify your income and expenses."
          retentionRule="Retained until deleted or edited by user."
          deletionTrigger="User deletes account/category in settings, or performs full data erasure."
        />

        <RetentionCard
          category="User Profile & Display Preferences"
          purpose="Display your customized experience and selected currency."
          retentionRule="Retained until overwritten or cleared by user."
          deletionTrigger="Profile edit, application data clear, or 'Delete My Data' execution."
        />

        <RetentionCard
          category="Consent & Privacy Audit Records"
          purpose="Maintain legal proof of consent grant and timestamped withdrawal under DPDP."
          retentionRule="Retained locally for the active policy lifecycle."
          deletionTrigger="Wiped permanently when user executes 'Delete My Data'."
        />

        <RetentionCard
          category="Privacy Requests & Grievance Submissions"
          purpose="Track your inquiry history and resolution status."
          retentionRule="Kept on device for user reference."
          deletionTrigger="Purged upon user data erasure."
        />

        <RetentionCard
          category="Exported Backups (JSON / CSV)"
          purpose="User-created archive files for external backup."
          retentionRule="Managed by user in device file system or cloud storage."
          deletionTrigger="Controlled exclusively by user file manager."
        />
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
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  content: {
    paddingHorizontal: spacing[4],
    gap: spacing[3],
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
    marginBottom: spacing[2],
  },
  card: {
    borderRadius: radius.xl,
    padding: spacing[4],
    borderWidth: 1,
    gap: spacing[2],
  },
  cardTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  row: {
    gap: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: fontWeight.semibold,
  },
  val: {
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * 1.4,
  },
  triggerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    paddingTop: spacing[2],
    marginTop: 2,
  },
  triggerText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 15,
  },
});
