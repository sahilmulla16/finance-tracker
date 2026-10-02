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
import { CURRENT_POLICY_VERSION, PRIVACY_CONTACT } from "@/types/privacy";

function NoticeSection({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.sectionCard,
        { backgroundColor: colors.surface, borderColor: colors.divider },
      ]}
    >
      <View style={styles.sectionHeader}>
        <View
          style={[
            styles.sectionNumberBadge,
            { backgroundColor: `${colors.primary}18` },
          ]}
        >
          <Text style={[styles.sectionNumberText, { color: colors.primary }]}>
            {number}
          </Text>
        </View>
        <Text style={[styles.sectionTitle, { color: colors.fg }]}>{title}</Text>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

export default function PrivacyNoticeScreen() {
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
          Privacy Notice
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
        <View style={styles.headerBlock}>
          <Text style={[styles.kicker, { color: colors.primary }]}>
            DIGITAL PERSONAL DATA PROTECTION (DPDP) NOTICE
          </Text>
          <Text style={[styles.title, { color: colors.fg }]}>
            Privacy Notice
          </Text>
          <Text style={[styles.versionDate, { color: colors.fgMuted }]}>
            Version {CURRENT_POLICY_VERSION.version} · Effective:{" "}
            {CURRENT_POLICY_VERSION.effectiveDate}
          </Text>
          <Text style={[styles.introText, { color: colors.fgMuted }]}>
            This notice describes how Zeno ("we", "us", or "our") processes
            personal data under the Digital Personal Data Protection Act, 2023.
            Zeno is an on-device, local-first finance tracker engineered to keep
            your personal data entirely in your possession.
          </Text>
        </View>

        {/* 1. What data Zeno collects */}
        <NoticeSection number="1" title="What Data We Collect">
          <Text style={[styles.paragraph, { color: colors.fgMuted }]}>
            We only collect and store data that you directly create within the
            app:
          </Text>
          <Text style={[styles.bullet, { color: colors.fgMuted }]}>
            •{" "}
            <Text style={{ color: colors.fg, fontWeight: fontWeight.semibold }}>
              Personal Identity:
            </Text>{" "}
            Profile name and optional avatar photo.
          </Text>
          <Text style={[styles.bullet, { color: colors.fgMuted }]}>
            •{" "}
            <Text style={{ color: colors.fg, fontWeight: fontWeight.semibold }}>
              Financial Entries:
            </Text>{" "}
            Account labels, types (Bank, Cash, UPI), balances, expense and
            income transactions, custom categories, and savings goals.
          </Text>
          <Text style={[styles.bullet, { color: colors.fgMuted }]}>
            •{" "}
            <Text style={{ color: colors.fg, fontWeight: fontWeight.semibold }}>
              Preferences:
            </Text>{" "}
            Currency symbol, visual theme (light/dark), Quick Add shortcut
            triggers, and notification toggles.
          </Text>
          <Text style={[styles.bullet, { color: colors.fgMuted }]}>
            •{" "}
            <Text style={{ color: colors.fg, fontWeight: fontWeight.semibold }}>
              Consent Records:
            </Text>{" "}
            Timestamps of granted or withdrawn permissions and nominee
            information.
          </Text>
        </NoticeSection>

        {/* 2. Why it is collected & 3. How it is used */}
        <NoticeSection number="2" title="Why We Collect It & How It Is Used">
          <Text style={[styles.paragraph, { color: colors.fgMuted }]}>
            Your data is used solely to provide personal accounting and
            budgeting functionality directly on your phone:
          </Text>
          <Text style={[styles.bullet, { color: colors.fgMuted }]}>
            • Computing cumulative balances, category allocations, and budget
            alerts.
          </Text>
          <Text style={[styles.bullet, { color: colors.fgMuted }]}>
            • Enabling fast on-device transaction recording via 2× Volume Down
            and shortcut HUD.
          </Text>
          <Text style={[styles.bullet, { color: colors.fgMuted }]}>
            • Generating exportable financial backup archives upon your explicit
            request.
          </Text>
          <Text
            style={[styles.paragraph, { color: colors.fgMuted, marginTop: 4 }]}
          >
            We do NOT sell, lease, monetize, or transmit your financial data to
            external servers or third-party marketers.
          </Text>
        </NoticeSection>

        {/* 4. Optional vs Required data */}
        <NoticeSection number="3" title="Required vs. Optional Data">
          <Text style={[styles.paragraph, { color: colors.fgMuted }]}>
            •{" "}
            <Text style={{ color: colors.fg, fontWeight: fontWeight.semibold }}>
              Required Processing:
            </Text>{" "}
            Basic account and transaction entries are required to use Zeno for
            finance tracking. Without them, the app cannot calculate your
            balances.
          </Text>
          <Text style={[styles.paragraph, { color: colors.fgMuted }]}>
            •{" "}
            <Text style={{ color: colors.fg, fontWeight: fontWeight.semibold }}>
              Optional Processing:
            </Text>{" "}
            Profile photo, savings goals, local milestone notification banners,
            and hardware shortcut triggers (Volume Down / Quick Settings tile)
            are strictly optional and can be toggled off at any time.
          </Text>
        </NoticeSection>

        {/* 5. External Providers / Processors */}
        <NoticeSection
          number="4"
          title="Third-Party Processors & Data Transfers"
        >
          <Text style={[styles.paragraph, { color: colors.fgMuted }]}>
            Zeno operates local-first. We do NOT use third-party analytics
            trackers (such as Google Analytics or Segment), remote error
            reporters (like Sentry), or external artificial intelligence APIs.
          </Text>
          <Text style={[styles.paragraph, { color: colors.fgMuted }]}>
            All database files reside inside the secure application sandbox
            managed by your operating system. No personal data crosses
            international borders or leaves your physical device unless you
            manually export or share a backup.
          </Text>
        </NoticeSection>

        {/* 6. Exercising Rights */}
        <NoticeSection
          number="5"
          title="Exercising Your Rights (DPDP Act 2023)"
        >
          <Text style={[styles.paragraph, { color: colors.fgMuted }]}>
            Under the Digital Personal Data Protection Act, 2023, you have the
            following actionable rights directly within Zeno:
          </Text>
          <Text style={[styles.bullet, { color: colors.fgMuted }]}>
            •{" "}
            <Text style={{ color: colors.fg, fontWeight: fontWeight.semibold }}>
              Right to Access:
            </Text>{" "}
            View all personal data categories and download a full
            machine-readable JSON archive.
          </Text>
          <Text style={[styles.bullet, { color: colors.fgMuted }]}>
            •{" "}
            <Text style={{ color: colors.fg, fontWeight: fontWeight.semibold }}>
              Right to Correction:
            </Text>{" "}
            Update any account name, profile detail, or category directly.
          </Text>
          <Text style={[styles.bullet, { color: colors.fgMuted }]}>
            •{" "}
            <Text style={{ color: colors.fg, fontWeight: fontWeight.semibold }}>
              Right to Erasure:
            </Text>{" "}
            Permanently wipe all personal data using the "Delete My Data"
            feature.
          </Text>
          <Text style={[styles.bullet, { color: colors.fgMuted }]}>
            •{" "}
            <Text style={{ color: colors.fg, fontWeight: fontWeight.semibold }}>
              Right to Nominate:
            </Text>{" "}
            Register a nominee under Section 14 to exercise rights in unforeseen
            circumstances.
          </Text>
          <Text style={[styles.bullet, { color: colors.fgMuted }]}>
            •{" "}
            <Text style={{ color: colors.fg, fontWeight: fontWeight.semibold }}>
              Right of Grievance Redressal:
            </Text>{" "}
            Submit requests directly via the Privacy Requests screen.
          </Text>
        </NoticeSection>

        {/* 7. Data Deletion */}
        <NoticeSection number="6" title="How to Delete Your Data">
          <Text style={[styles.paragraph, { color: colors.fgMuted }]}>
            You can delete all your personal data at any time by navigating to:
          </Text>
          <Text
            style={[
              styles.paragraph,
              { color: colors.primary, fontWeight: fontWeight.semibold },
            ]}
          >
            Profile → Privacy & Data → Delete My Data
          </Text>
          <Text style={[styles.paragraph, { color: colors.fgMuted }]}>
            Confirming deletion permanently wipes the local database,
            preferences, and SQLite stores. Because no cloud backup is held,
            deletion on your device is immediate and irreversible.
          </Text>
        </NoticeSection>

        {/* 8. Contact Information */}
        <NoticeSection number="7" title="Privacy Contact & Grievance Redressal">
          <Text style={[styles.paragraph, { color: colors.fgMuted }]}>
            If you have any questions, concerns, or grievances regarding this
            Privacy Notice or the processing of your personal data, please reach
            out to our Privacy Contact:
          </Text>
          <View
            style={[
              styles.contactInfoBox,
              { backgroundColor: colors.surfaceRecessed },
            ]}
          >
            <Text style={[styles.contactName, { color: colors.fg }]}>
              {PRIVACY_CONTACT.name}
            </Text>
            <Text style={[styles.contactLine, { color: colors.fgMuted }]}>
              Role: {PRIVACY_CONTACT.role}
            </Text>
            <Text style={[styles.contactLine, { color: colors.fgMuted }]}>
              Email: {PRIVACY_CONTACT.email}
            </Text>
            <Text style={[styles.contactLine, { color: colors.fgMuted }]}>
              Jurisdiction: India
            </Text>
          </View>
        </NoticeSection>
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
    gap: spacing[4],
  },
  headerBlock: {
    gap: spacing[2],
  },
  kicker: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    letterSpacing: 1.2,
  },
  title: {
    fontSize: fontSize["3xl"],
    fontWeight: fontWeight.bold,
    letterSpacing: -0.8,
  },
  versionDate: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  introText: {
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * lineHeight.normal,
    marginTop: spacing[1],
  },
  sectionCard: {
    borderRadius: radius.xl,
    padding: spacing[4],
    borderWidth: 1,
    gap: spacing[3],
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  sectionNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionNumberText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  sectionTitle: {
    flex: 1,
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  sectionBody: {
    gap: spacing[2],
  },
  paragraph: {
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * 1.5,
  },
  bullet: {
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * 1.5,
    paddingLeft: spacing[2],
  },
  contactInfoBox: {
    padding: spacing[3],
    borderRadius: radius.md,
    gap: 3,
    marginTop: spacing[2],
  },
  contactName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  contactLine: {
    fontSize: fontSize.xs,
  },
});
