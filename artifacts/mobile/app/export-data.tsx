import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useFinance } from "@/context/FinanceContext";
import { useColors } from "@/hooks/useColors";
import {
  spacing,
  radius,
  fontSize,
  fontWeight,
  lineHeight,
} from "@/constants/tokens";

export default function ExportDataScreen() {
  const { exportData, transactions, accounts, categories } = useFinance();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isDark = colors.canvas !== "#FFFFFF";

  const [exportingJson, setExportingJson] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);

  const handleExport = async (format: "json" | "csv") => {
    if (format === "json") {
      setExportingJson(true);
    } else {
      setExportingCsv(true);
    }

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await exportData(format);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      Alert.alert(
        "Export Failed",
        err?.message || `Could not export ${format.toUpperCase()} file. Please try again.`,
      );
    } finally {
      if (format === "json") {
        setExportingJson(false);
      } else {
        setExportingCsv(false);
      }
    }
  };

  const isBusy = exportingJson || exportingCsv;

  return (
    <View style={[styles.screen, { backgroundColor: colors.canvas }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing[4] }]}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.surface }]}
          hitSlop={8}
          accessibilityLabel="Back"
        >
          <Feather name="arrow-left" size={20} color={colors.fg} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.fg }]}>
          Export Data
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing[8] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Hero Icon */}
        <View
          style={[styles.iconContainer, { backgroundColor: colors.surface }]}
        >
          <Feather name="download" size={44} color={colors.primary} />
        </View>

        <Text style={[styles.title, { color: colors.fg }]}>
          Export Your Financial Data
        </Text>

        <Text style={[styles.description, { color: colors.fgMuted }]}>
          Download a complete JSON backup to restore on another device, or export
          a clean CSV spreadsheet for Excel and Google Sheets.
        </Text>

        {/* Data summary preview pill */}
        <View
          style={[
            styles.statsCard,
            {
              backgroundColor: isDark
                ? colors.surface
                : colors.surfaceElevated || "#F8F9FB",
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {transactions.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.fgMuted }]}>
              Transactions
            </Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.fg }]}>
              {accounts.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.fgMuted }]}>
              Accounts
            </Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.fg }]}>
              {categories.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.fgMuted }]}>
              Categories
            </Text>
          </View>
        </View>

        {/* Option 1: Full JSON Backup */}
        <View
          style={[
            styles.exportCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.exportCardHeader}>
            <View
              style={[
                styles.cardIconWrap,
                { backgroundColor: `${colors.primary}18` },
              ]}
            >
              <Feather name="database" size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.badgeRow}>
                <Text style={[styles.cardTitle, { color: colors.fg }]}>
                  JSON Full Backup
                </Text>
                <View
                  style={[
                    styles.tagBadge,
                    { backgroundColor: `${colors.primary}20` },
                  ]}
                >
                  <Text style={[styles.tagBadgeText, { color: colors.primary }]}>
                    Full Backup
                  </Text>
                </View>
              </View>
              <Text style={[styles.cardSub, { color: colors.fgMuted }]}>
                Recommended for device migration & restore
              </Text>
            </View>
          </View>

          <Text style={[styles.cardDetail, { color: colors.fgMuted }]}>
            Includes all transactions, accounts, custom categories, budgets, and
            app preferences. Fully compatible with Zeno’s Restore feature.
          </Text>

          <Pressable
            onPress={() => void handleExport("json")}
            disabled={isBusy}
            style={({ pressed }) => [
              styles.actionBtn,
              { backgroundColor: colors.primary },
              (isBusy || pressed) && { opacity: 0.8 },
            ]}
          >
            {exportingJson ? (
              <ActivityIndicator size="small" color={colors.onPrimary} />
            ) : (
              <Feather name="download" size={18} color={colors.onPrimary} />
            )}
            <Text style={[styles.actionBtnText, { color: colors.onPrimary }]}>
              {exportingJson ? "Exporting JSON..." : "Export JSON Backup"}
            </Text>
          </Pressable>
        </View>

        {/* Option 2: CSV Spreadsheet */}
        <View
          style={[
            styles.exportCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.exportCardHeader}>
            <View
              style={[
                styles.cardIconWrap,
                { backgroundColor: `${colors.fgSubtle}15` },
              ]}
            >
              <Feather name="grid" size={22} color={colors.fg} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.badgeRow}>
                <Text style={[styles.cardTitle, { color: colors.fg }]}>
                  CSV Spreadsheet
                </Text>
                <View
                  style={[
                    styles.tagBadge,
                    { backgroundColor: `${colors.fgSubtle}18` },
                  ]}
                >
                  <Text style={[styles.tagBadgeText, { color: colors.fg }]}>
                    Excel & Sheets
                  </Text>
                </View>
              </View>
              <Text style={[styles.cardSub, { color: colors.fgMuted }]}>
                Tabular format for analysis & tax prep
              </Text>
            </View>
          </View>

          <Text style={[styles.cardDetail, { color: colors.fgMuted }]}>
            A structured spreadsheet containing transaction date, amount,
            category, account, type, and merchant notes. Opens in Microsoft Excel,
            Google Sheets, or Numbers.
          </Text>

          <Pressable
            onPress={() => void handleExport("csv")}
            disabled={isBusy}
            style={({ pressed }) => [
              styles.actionBtnOutline,
              {
                borderColor: colors.border,
                backgroundColor: colors.surfaceRecessed,
              },
              (isBusy || pressed) && { opacity: 0.8 },
            ]}
          >
            {exportingCsv ? (
              <ActivityIndicator size="small" color={colors.fg} />
            ) : (
              <Feather name="file-text" size={18} color={colors.fg} />
            )}
            <Text style={[styles.actionBtnOutlineText, { color: colors.fg }]}>
              {exportingCsv ? "Exporting CSV..." : "Export CSV Spreadsheet"}
            </Text>
          </Pressable>
        </View>

        {/* Privacy & Offline Card (Matches restore warning style) */}
        <View
          style={[
            styles.privacyCard,
            {
              backgroundColor: isDark
                ? "rgba(184, 243, 107, 0.08)"
                : "rgba(16, 28, 61, 0.04)",
              borderColor: isDark ? "rgba(184, 243, 107, 0.2)" : colors.border,
            },
          ]}
        >
          <Feather name="shield" size={18} color={colors.primary} />
          <Text style={[styles.privacyText, { color: colors.fgMuted }]}>
            <Text style={{ fontWeight: fontWeight.bold, color: colors.fg }}>
              100% On-Device & Private:{" "}
            </Text>
            Your export file is compiled directly on your phone and saved locally
            or shared through your device's native share sheet. No data is ever sent
            to any cloud server.
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  content: {
    paddingHorizontal: spacing[4],
    alignItems: "center",
    gap: spacing[4],
  },
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing[4],
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    textAlign: "center",
  },
  description: {
    fontSize: fontSize.sm,
    textAlign: "center",
    lineHeight: fontSize.sm * lineHeight.normal,
    paddingHorizontal: spacing[3],
  },
  statsCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    width: "100%",
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: radius.xl,
    borderWidth: 1,
    marginTop: spacing[1],
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  statLabel: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
  },
  exportCard: {
    width: "100%",
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing[4],
    gap: spacing[3],
  },
  exportCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  tagBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  cardSub: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  cardDetail: {
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * lineHeight.normal,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    paddingVertical: 14,
    borderRadius: radius.lg,
    marginTop: spacing[1],
  },
  actionBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  actionBtnOutline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    paddingVertical: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginTop: spacing[1],
  },
  actionBtnOutlineText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  privacyCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing[3],
    padding: spacing[4],
    borderRadius: radius.lg,
    borderWidth: 1,
    width: "100%",
    marginTop: spacing[2],
  },
  privacyText: {
    flex: 1,
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * lineHeight.normal,
  },
});

