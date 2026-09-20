import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFinance } from "@/context/FinanceContext";
import { useColors } from "@/hooks/useColors";
import {
  spacing,
  radius,
  fontSize,
  fontWeight,
  lineHeight,
} from "@/constants/tokens";
import { Toggle } from "@/components/ui/Toggle";
import { ConsentRecord, CURRENT_POLICY_VERSION } from "@/types/privacy";

function ConsentCard({
  consent,
  isOptional,
  onToggle,
}: {
  consent: ConsentRecord;
  isOptional: boolean;
  onToggle?: (val: boolean) => void;
}) {
  const colors = useColors();
  const isGranted = consent.status === "granted";

  const dateText = isGranted
    ? consent.grantedAt
      ? new Date(consent.grantedAt).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "Active"
    : consent.withdrawnAt
      ? new Date(consent.withdrawnAt).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "Withdrawn";

  return (
    <View
      style={[
        styles.consentCard,
        { backgroundColor: colors.surface, borderColor: colors.divider },
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, { color: colors.fg }]}>
            {consent.title}
          </Text>
          <Text style={[styles.purposeKey, { color: colors.fgSubtle }]}>
            Purpose key: {consent.purpose}
          </Text>
        </View>

        {isOptional ? (
          <Toggle
            value={isGranted}
            onValueChange={(val) => onToggle && onToggle(val)}
          />
        ) : (
          <View
            style={[
              styles.requiredBadge,
              { backgroundColor: `${colors.primary}18` },
            ]}
          >
            <Feather name="lock" size={12} color={colors.primary} />
            <Text style={[styles.requiredText, { color: colors.primary }]}>
              REQUIRED
            </Text>
          </View>
        )}
      </View>

      <Text style={[styles.description, { color: colors.fgMuted }]}>
        {consent.description}
      </Text>

      <View
        style={[
          styles.metadataRow,
          { borderTopColor: colors.divider, borderTopWidth: 1 },
        ]}
      >
        <View style={styles.statusPill}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: isGranted ? colors.success : colors.fgSubtle,
              },
            ]}
          />
          <Text
            style={[
              styles.statusText,
              { color: isGranted ? colors.fg : colors.fgMuted },
            ]}
          >
            {isGranted ? "Granted" : "Withdrawn"} · {dateText}
          </Text>
        </View>

        <Text style={[styles.versionText, { color: colors.fgSubtle }]}>
          Policy: {consent.policyVersion || CURRENT_POLICY_VERSION.version}
        </Text>
      </View>
    </View>
  );
}

export default function PrivacyConsentsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { consents, updateConsent } = useFinance();

  const requiredConsents = Object.values(consents).filter(
    (c) => c.category === "required",
  );
  const optionalConsents = Object.values(consents).filter(
    (c) => c.category === "optional",
  );

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
          Consent & Permissions
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
          GRANULAR CONSENT MANAGEMENT
        </Text>
        <Text style={[styles.screenHeading, { color: colors.fg }]}>
          Your Processing Consents
        </Text>
        <Text style={[styles.screenSubheading, { color: colors.fgMuted }]}>
          Under the DPDP Act 2023, consent must be free, specific, informed,
          unconditional, and unambiguous. You can withdraw optional consents at
          any time with immediate effect.
        </Text>

        {/* REQUIRED PROCESSING SECTION */}
        <View style={styles.sectionHeaderWrap}>
          <Text style={[styles.sectionHeading, { color: colors.fg }]}>
            Required Processing
          </Text>
          <Text style={[styles.sectionSub, { color: colors.fgMuted }]}>
            Strictly necessary to provide local finance computation.
          </Text>
        </View>

        {requiredConsents.map((c) => (
          <ConsentCard key={c.purpose} consent={c} isOptional={false} />
        ))}

        {/* OPTIONAL PROCESSING SECTION */}
        <View style={[styles.sectionHeaderWrap, { marginTop: spacing[4] }]}>
          <Text style={[styles.sectionHeading, { color: colors.fg }]}>
            Optional Processing
          </Text>
          <Text style={[styles.sectionSub, { color: colors.fgMuted }]}>
            Additional conveniences. Toggling off immediately disables the
            feature and updates your audit record.
          </Text>
        </View>

        {optionalConsents.map((c) => (
          <ConsentCard
            key={c.purpose}
            consent={c}
            isOptional={true}
            onToggle={(granted) => void updateConsent(c.purpose, granted)}
          />
        ))}

        {/* DPDP Legal Note */}
        <View
          style={[
            styles.legalNoteCard,
            { backgroundColor: colors.surfaceRecessed },
          ]}
        >
          <Feather name="info" size={16} color={colors.fgMuted} />
          <Text style={[styles.legalNoteText, { color: colors.fgMuted }]}>
            Withdrawing consent does not affect the lawfulness of any processing
            undertaken before such withdrawal. When you withdraw consent, the
            corresponding feature ceases to process data immediately.
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
  sectionHeaderWrap: {
    gap: 2,
    marginTop: spacing[2],
  },
  sectionHeading: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  sectionSub: {
    fontSize: fontSize.xs,
  },
  consentCard: {
    borderRadius: radius.xl,
    padding: spacing[4],
    borderWidth: 1,
    gap: spacing[3],
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing[3],
  },
  cardTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  purposeKey: {
    fontSize: 10,
    marginTop: 2,
  },
  requiredBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  requiredText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.6,
  },
  description: {
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * 1.4,
  },
  metadataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing[2],
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
  },
  versionText: {
    fontSize: 11,
  },
  legalNoteCard: {
    flexDirection: "row",
    gap: spacing[3],
    padding: spacing[4],
    borderRadius: radius.lg,
    marginTop: spacing[4],
  },
  legalNoteText: {
    flex: 1,
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * 1.4,
  },
});
