import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
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
import { Card } from "@/components/ui/Card";
import { ListItem } from "@/components/ui/ListItem";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { CURRENT_POLICY_VERSION, PRIVACY_CONTACT } from "@/types/privacy";

export default function PrivacyAndDataCenterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    accounts,
    transactions,
    savingsGoals,
    settings,
    consents,
    privacyRequests,
    nominee,
    downloadPersonalDataArchive,
    purgeAllUserData,
  } = useFinance();

  const [exporting, setExporting] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [accessModalVisible, setAccessModalVisible] = useState(false);
  const [correctionModalVisible, setCorrectionModalVisible] = useState(false);
  const [securityModalVisible, setSecurityModalVisible] = useState(false);
  const [processorsModalVisible, setProcessorsModalVisible] = useState(false);

  const activeRequestsCount = privacyRequests.filter(
    (r) => r.status === "submitted" || r.status === "under_review",
  ).length;

  const handleExport = async () => {
    try {
      setExporting(true);
      await downloadPersonalDataArchive();
    } catch {
      Alert.alert("Export Error", "Could not prepare personal data archive.");
    } finally {
      setExporting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmText.trim().toUpperCase() !== "DELETE") {
      Alert.alert(
        "Confirmation Required",
        'Please type "DELETE" into the text field to confirm permanent data removal.',
      );
      return;
    }

    setDeleting(true);
    try {
      await purgeAllUserData();
      setDeleteModalVisible(false);
      setDeleteConfirmText("");
      Alert.alert(
        "Data Purged",
        "All personal data and financial records have been permanently cleared from this device.",
        [{ text: "OK", onPress: () => router.replace("/(tabs)") }],
      );
    } catch {
      Alert.alert("Error", "Failed to clear all data. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.canvas }]}>
      {/* Top App Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing[3] }]}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.surface }]}
          accessibilityLabel="Back"
        >
          <Feather name="arrow-left" size={20} color={colors.fg} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.fg }]}>
          Privacy & Data
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
        {/* Privacy Summary Card */}
        <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
          <View style={styles.summaryBadgeRow}>
            <View
              style={[
                styles.summaryBadge,
                { backgroundColor: `${colors.primary}18` },
              ]}
            >
              <Feather name="shield" size={14} color={colors.primary} />
              <Text
                style={[styles.summaryBadgeText, { color: colors.primary }]}
              >
                ON-DEVICE PRIVACY
              </Text>
            </View>
            <Text style={[styles.versionTag, { color: colors.fgMuted }]}>
              {CURRENT_POLICY_VERSION.version}
            </Text>
          </View>

          <Text style={[styles.summaryTitle, { color: colors.fg }]}>
            Your Privacy
          </Text>
          <Text style={[styles.summaryDescription, { color: colors.fgMuted }]}>
            Zeno stores and uses your data locally on your device to provide
            your finance tracking features. You control your data.
          </Text>

          {/* Active Data Categories in App */}
          <View
            style={[
              styles.categoryGrid,
              { borderTopColor: colors.divider, borderTopWidth: 1 },
            ]}
          >
            <View style={styles.categoryItem}>
              <View
                style={[
                  styles.catIconWrap,
                  { backgroundColor: `${colors.primary}14` },
                ]}
              >
                <Feather name="user" size={16} color={colors.primary} />
              </View>
              <Text style={[styles.catName, { color: colors.fg }]}>
                Personal Info
              </Text>
              <Text style={[styles.catSub, { color: colors.fgMuted }]}>
                {settings.profileName || "User"}
              </Text>
            </View>

            <View style={styles.categoryItem}>
              <View
                style={[
                  styles.catIconWrap,
                  { backgroundColor: `${colors.income}14` },
                ]}
              >
                <Feather name="dollar-sign" size={16} color={colors.income} />
              </View>
              <Text style={[styles.catName, { color: colors.fg }]}>
                Financial Info
              </Text>
              <Text style={[styles.catSub, { color: colors.fgMuted }]}>
                {accounts.length} Accounts · {transactions.length} Txns
              </Text>
            </View>

            <View style={styles.categoryItem}>
              <View
                style={[
                  styles.catIconWrap,
                  { backgroundColor: `${colors.warning}14` },
                ]}
              >
                <Feather name="sliders" size={16} color={colors.warning} />
              </View>
              <Text style={[styles.catName, { color: colors.fg }]}>
                Preferences
              </Text>
              <Text style={[styles.catSub, { color: colors.fgMuted }]}>
                {settings.currency} · {settings.appearance}
              </Text>
            </View>

            <View style={styles.categoryItem}>
              <View
                style={[
                  styles.catIconWrap,
                  { backgroundColor: `${colors.success}14` },
                ]}
              >
                <Feather name="database" size={16} color={colors.success} />
              </View>
              <Text style={[styles.catName, { color: colors.fg }]}>
                Storage Location
              </Text>
              <Text style={[styles.catSub, { color: colors.fgMuted }]}>
                Local Device Only
              </Text>
            </View>
          </View>
        </View>

        {/* YOUR DATA SECTION */}
        <View style={styles.sectionContainer}>
          <SectionHeader title="YOUR DATA" />
          <Card style={styles.card}>
            <ListItem
              icon="file-text"
              title="What data we use"
              subtitle="Plain-language inventory of all collected fields"
              onPress={() => router.push("/privacy-inventory" as never)}
            />
            <ListItem
              icon="info"
              title="How we use it"
              subtitle="Core purpose and local processing notice"
              onPress={() => router.push("/privacy")}
            />
            <ListItem
              icon="server"
              title="Third-party services"
              subtitle="Verified external processors and zero-tracker audit"
              onPress={() => setProcessorsModalVisible(true)}
            />
          </Card>
        </View>

        {/* YOUR CONTROLS SECTION */}
        <View style={styles.sectionContainer}>
          <SectionHeader title="YOUR CONTROLS" />
          <Card style={styles.card}>
            <ListItem
              icon="check-circle"
              title="Consent & Permissions"
              subtitle="Manage required and optional processing purposes"
              onPress={() => router.push("/privacy-consents" as never)}
            />
            <ListItem
              icon="eye"
              title="Access My Data"
              subtitle="Inspect all personal data categories held on device"
              onPress={() => setAccessModalVisible(true)}
            />
            <ListItem
              icon="download"
              title="Download My Data"
              subtitle={
                exporting
                  ? "Exporting machine-readable JSON..."
                  : "Export full personal data archive (JSON)"
              }
              onPress={() => void handleExport()}
            />
            <ListItem
              icon="edit-3"
              title="Correct My Data"
              subtitle="Update your name, accounts, or record adjustments"
              onPress={() => setCorrectionModalVisible(true)}
            />
            <ListItem
              icon="user-plus"
              title="Nominee"
              subtitle={
                nominee
                  ? `Registered: ${nominee.name} (${nominee.relationship})`
                  : "Declare a nominee under DPDP Section 14"
              }
              onPress={() => router.push("/privacy-nominee" as never)}
            />
            <ListItem
              icon="message-square"
              title="Privacy Requests & Grievance"
              subtitle={
                activeRequestsCount > 0
                  ? `${activeRequestsCount} active request(s) under review`
                  : "Submit rights requests or contact Privacy Contact"
              }
              onPress={() => router.push("/privacy-requests" as never)}
            />
            <ListItem
              icon="trash-2"
              title="Delete My Data"
              subtitle="Permanently erase all accounts and transactions"
              onPress={() => {
                setDeleteConfirmText("");
                setDeleteModalVisible(true);
              }}
            />
          </Card>
        </View>

        {/* SECURITY SECTION */}
        <View style={styles.sectionContainer}>
          <SectionHeader title="SECURITY & GOVERNANCE" />
          <Card style={styles.card}>
            <ListItem
              icon="lock"
              title="Security overview"
              subtitle="Local sandbox isolation and credential protections"
              onPress={() => setSecurityModalVisible(true)}
            />
            <ListItem
              icon="clock"
              title="Data Retention"
              subtitle="Retention rules, deletion triggers, and timelines"
              onPress={() => router.push("/privacy-retention" as never)}
            />
          </Card>
        </View>

        {/* LEGAL SECTION */}
        <View style={styles.sectionContainer}>
          <SectionHeader title="LEGAL" />
          <Card style={styles.card}>
            <ListItem
              icon="shield"
              title="Privacy Notice"
              subtitle={`Version ${CURRENT_POLICY_VERSION.version} · Effective ${CURRENT_POLICY_VERSION.effectiveDate}`}
              onPress={() => router.push("/privacy")}
            />
            <ListItem
              icon="book"
              title="Terms of Service"
              onPress={() => router.push("/terms")}
            />
          </Card>
        </View>

        {/* Privacy Contact Footer */}
        <View
          style={[
            styles.contactCard,
            { backgroundColor: colors.surfaceRecessed },
          ]}
        >
          <Feather name="mail" size={16} color={colors.fgMuted} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.contactTitle, { color: colors.fg }]}>
              {PRIVACY_CONTACT.name}
            </Text>
            <Text style={[styles.contactEmail, { color: colors.fgMuted }]}>
              Grievance & Privacy inquiries: {PRIVACY_CONTACT.email}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* ACCESS MY DATA MODAL */}
      <Modal
        visible={accessModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAccessModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setAccessModalVisible(false)}
          />
          <View
            style={[styles.modalSheet, { backgroundColor: colors.surface }]}
          >
            <View
              style={[styles.modalHandle, { backgroundColor: colors.fgSubtle }]}
            />
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.fg }]}>
                Access My Data
              </Text>
              <Pressable onPress={() => setAccessModalVisible(false)}>
                <Feather name="x" size={22} color={colors.fgMuted} />
              </Pressable>
            </View>
            <ScrollView style={{ maxHeight: 380 }}>
              <Text style={[styles.modalParagraph, { color: colors.fgMuted }]}>
                Under DPDP data principal rights, here is an itemized summary of
                the personal and financial data Zeno holds in local storage on
                your phone:
              </Text>

              <View
                style={[
                  styles.dataRecordBox,
                  { backgroundColor: colors.surfaceRecessed },
                ]}
              >
                <Text style={[styles.recordHeader, { color: colors.fg }]}>
                  User Profile
                </Text>
                <Text style={[styles.recordLine, { color: colors.fgMuted }]}>
                  • Display Name: {settings.profileName}
                </Text>
                <Text style={[styles.recordLine, { color: colors.fgMuted }]}>
                  • Profile Image:{" "}
                  {settings.profileImage ? "Custom Avatar Set" : "None"}
                </Text>
                <Text style={[styles.recordLine, { color: colors.fgMuted }]}>
                  • Default Payment Method: {settings.defaultPayment}
                </Text>
              </View>

              <View
                style={[
                  styles.dataRecordBox,
                  { backgroundColor: colors.surfaceRecessed },
                ]}
              >
                <Text style={[styles.recordHeader, { color: colors.fg }]}>
                  Financial Records
                </Text>
                <Text style={[styles.recordLine, { color: colors.fgMuted }]}>
                  • Active Accounts: {accounts.length} accounts configured
                </Text>
                <Text style={[styles.recordLine, { color: colors.fgMuted }]}>
                  • Transactions: {transactions.length} logged entries
                </Text>
                <Text style={[styles.recordLine, { color: colors.fgMuted }]}>
                  • Savings Goals: {savingsGoals.length} active target(s)
                </Text>
              </View>

              <View
                style={[
                  styles.dataRecordBox,
                  { backgroundColor: colors.surfaceRecessed },
                ]}
              >
                <Text style={[styles.recordHeader, { color: colors.fg }]}>
                  Consents & Nominee
                </Text>
                <Text style={[styles.recordLine, { color: colors.fgMuted }]}>
                  • Active Consents: {Object.keys(consents).length} recorded
                </Text>
                <Text style={[styles.recordLine, { color: colors.fgMuted }]}>
                  • Nominee Declared: {nominee ? nominee.name : "None"}
                </Text>
                <Text style={[styles.recordLine, { color: colors.fgMuted }]}>
                  • Privacy Requests: {privacyRequests.length} logged
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalBtnRow}>
              <Pressable
                onPress={() => {
                  setAccessModalVisible(false);
                  void handleExport();
                }}
                style={[
                  styles.primaryPill,
                  { backgroundColor: colors.primary, flex: 1 },
                ]}
              >
                <Feather name="download" size={16} color={colors.onPrimary} />
                <Text
                  style={[styles.primaryPillText, { color: colors.onPrimary }]}
                >
                  Download Archive (JSON)
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* CORRECT MY DATA MODAL */}
      <Modal
        visible={correctionModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCorrectionModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setCorrectionModalVisible(false)}
          />
          <View
            style={[styles.modalSheet, { backgroundColor: colors.surface }]}
          >
            <View
              style={[styles.modalHandle, { backgroundColor: colors.fgSubtle }]}
            />
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.fg }]}>
                Correct My Data
              </Text>
              <Pressable onPress={() => setCorrectionModalVisible(false)}>
                <Feather name="x" size={22} color={colors.fgMuted} />
              </Pressable>
            </View>

            <Text style={[styles.modalParagraph, { color: colors.fgMuted }]}>
              You have the right to ensure all personal and financial data is
              accurate and up-to-date. Choose an area to modify:
            </Text>

            <Pressable
              onPress={() => {
                setCorrectionModalVisible(false);
                router.push("/settings");
              }}
              style={[
                styles.correctRow,
                { backgroundColor: colors.surfaceRecessed },
              ]}
            >
              <Feather name="user" size={18} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.correctRowTitle, { color: colors.fg }]}>
                  Edit Profile Name & Preferences
                </Text>
                <Text
                  style={[styles.correctRowSubtitle, { color: colors.fgMuted }]}
                >
                  Update profile name, avatar, and currency
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.fgSubtle} />
            </Pressable>

            <Pressable
              onPress={() => {
                setCorrectionModalVisible(false);
                router.push("/accounts");
              }}
              style={[
                styles.correctRow,
                { backgroundColor: colors.surfaceRecessed },
              ]}
            >
              <Feather name="credit-card" size={18} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.correctRowTitle, { color: colors.fg }]}>
                  Edit Financial Accounts
                </Text>
                <Text
                  style={[styles.correctRowSubtitle, { color: colors.fgMuted }]}
                >
                  Correct account names, types, and opening balances
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.fgSubtle} />
            </Pressable>

            <Pressable
              onPress={() => {
                setCorrectionModalVisible(false);
                router.push("/categories");
              }}
              style={[
                styles.correctRow,
                { backgroundColor: colors.surfaceRecessed },
              ]}
            >
              <Feather name="tag" size={18} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.correctRowTitle, { color: colors.fg }]}>
                  Edit Expense & Income Categories
                </Text>
                <Text
                  style={[styles.correctRowSubtitle, { color: colors.fgMuted }]}
                >
                  Rename or adjust category tags
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.fgSubtle} />
            </Pressable>

            <Pressable
              onPress={() => {
                setCorrectionModalVisible(false);
                router.push("/privacy-requests" as never);
              }}
              style={[
                styles.correctRow,
                { backgroundColor: colors.surfaceRecessed },
              ]}
            >
              <Feather name="help-circle" size={18} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.correctRowTitle, { color: colors.fg }]}>
                  Submit Correction Request
                </Text>
                <Text
                  style={[styles.correctRowSubtitle, { color: colors.fgMuted }]}
                >
                  Request assistance for complex data discrepancies
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.fgSubtle} />
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* THIRD-PARTY PROCESSORS AUDIT MODAL */}
      <Modal
        visible={processorsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setProcessorsModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setProcessorsModalVisible(false)}
          />
          <View
            style={[styles.modalSheet, { backgroundColor: colors.surface }]}
          >
            <View
              style={[styles.modalHandle, { backgroundColor: colors.fgSubtle }]}
            />
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.fg }]}>
                Third-Party Services & Processors
              </Text>
              <Pressable onPress={() => setProcessorsModalVisible(false)}>
                <Feather name="x" size={22} color={colors.fgMuted} />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 380 }}>
              <View
                style={[
                  styles.processorCard,
                  {
                    backgroundColor: `${colors.success}10`,
                    borderColor: `${colors.success}30`,
                  },
                ]}
              >
                <View style={styles.processorHeader}>
                  <Feather
                    name="check-circle"
                    size={16}
                    color={colors.success}
                  />
                  <Text
                    style={[styles.processorTitle, { color: colors.success }]}
                  >
                    Zero External Data Tracking
                  </Text>
                </View>
                <Text style={[styles.processorBody, { color: colors.fgMuted }]}>
                  Zeno is engineered as a local-first application. No analytics
                  SDKs (such as Google Analytics, Segment, or PostHog), no
                  crash-tracking third parties (like Sentry), and no remote
                  advertising networks receive your data.
                </Text>
              </View>

              <View
                style={[
                  styles.dataRecordBox,
                  { backgroundColor: colors.surfaceRecessed },
                ]}
              >
                <Text style={[styles.recordHeader, { color: colors.fg }]}>
                  On-Device Storage Engine
                </Text>
                <Text style={[styles.recordLine, { color: colors.fgMuted }]}>
                  • Provider: Device Sandbox / Android SQLite
                </Text>
                <Text style={[styles.recordLine, { color: colors.fgMuted }]}>
                  • Location: Within your physical device
                </Text>
                <Text style={[styles.recordLine, { color: colors.fgMuted }]}>
                  • Cross-Border Transmission: None. Data stays on your phone.
                </Text>
              </View>

              <View
                style={[
                  styles.dataRecordBox,
                  { backgroundColor: colors.surfaceRecessed },
                ]}
              >
                <Text style={[styles.recordHeader, { color: colors.fg }]}>
                  Android System Notifications
                </Text>
                <Text style={[styles.recordLine, { color: colors.fgMuted }]}>
                  • Provider: Google Android NotificationManager
                </Text>
                <Text style={[styles.recordLine, { color: colors.fgMuted }]}>
                  • Purpose: Local notification banner when Quick Add logs an
                  expense or milestone
                </Text>
                <Text style={[styles.recordLine, { color: colors.fgMuted }]}>
                  • Remote Push Servers: None
                </Text>
              </View>
            </ScrollView>

            <Pressable
              onPress={() => setProcessorsModalVisible(false)}
              style={[
                styles.primaryPill,
                { backgroundColor: colors.primary, marginTop: spacing[3] },
              ]}
            >
              <Text
                style={[styles.primaryPillText, { color: colors.onPrimary }]}
              >
                Understood
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* SECURITY OVERVIEW MODAL */}
      <Modal
        visible={securityModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSecurityModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setSecurityModalVisible(false)}
          />
          <View
            style={[styles.modalSheet, { backgroundColor: colors.surface }]}
          >
            <View
              style={[styles.modalHandle, { backgroundColor: colors.fgSubtle }]}
            />
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.fg }]}>
                Security & Data Protection
              </Text>
              <Pressable onPress={() => setSecurityModalVisible(false)}>
                <Feather name="x" size={22} color={colors.fgMuted} />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 380 }}>
              <View
                style={[
                  styles.dataRecordBox,
                  { backgroundColor: colors.surfaceRecessed },
                ]}
              >
                <Text style={[styles.recordHeader, { color: colors.fg }]}>
                  1. Sandbox Isolation
                </Text>
                <Text style={[styles.recordLine, { color: colors.fgMuted }]}>
                  Zeno executes within standard operating system sandboxes
                  (iOS/Android). Other apps cannot read your stored database
                  files without operating system compromise.
                </Text>
              </View>

              <View
                style={[
                  styles.dataRecordBox,
                  { backgroundColor: colors.surfaceRecessed },
                ]}
              >
                <Text style={[styles.recordHeader, { color: colors.fg }]}>
                  2. Zero Credential Exposure
                </Text>
                <Text style={[styles.recordLine, { color: colors.fgMuted }]}>
                  No backend database admin secrets, service-role keys, or
                  plain-text financial credentials reside in the mobile client
                  bundle.
                </Text>
              </View>

              <View
                style={[
                  styles.dataRecordBox,
                  { backgroundColor: colors.surfaceRecessed },
                ]}
              >
                <Text style={[styles.recordHeader, { color: colors.fg }]}>
                  3. Non-Financial Privacy Audit Trail
                </Text>
                <Text style={[styles.recordLine, { color: colors.fgMuted }]}>
                  All consent grants, withdrawals, and export operations create
                  timestamped audit records. Financial amounts and account
                  numbers are strictly omitted from privacy logs.
                </Text>
              </View>
            </ScrollView>

            <Pressable
              onPress={() => setSecurityModalVisible(false)}
              style={[
                styles.primaryPill,
                { backgroundColor: colors.primary, marginTop: spacing[3] },
              ]}
            >
              <Text
                style={[styles.primaryPillText, { color: colors.onPrimary }]}
              >
                Close
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* DELETE MY DATA WORKFLOW MODAL */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setDeleteModalVisible(false)}
          />
          <View
            style={[styles.modalSheet, { backgroundColor: colors.surface }]}
          >
            <View
              style={[styles.modalHandle, { backgroundColor: colors.fgSubtle }]}
            />
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.error }]}>
                Delete My Data?
              </Text>
              <Pressable onPress={() => setDeleteModalVisible(false)}>
                <Feather name="x" size={22} color={colors.fgMuted} />
              </Pressable>
            </View>

            <Text style={[styles.modalParagraph, { color: colors.fgMuted }]}>
              This will permanently delete your Zeno data and associated
              personal data from this device, including all accounts,
              transactions, categories, savings goals, and preferences.
            </Text>

            <View
              style={[
                styles.deleteWarningBox,
                {
                  backgroundColor: `${colors.error}12`,
                  borderColor: `${colors.error}40`,
                },
              ]}
            >
              <Feather name="alert-triangle" size={18} color={colors.error} />
              <Text style={[styles.deleteWarningText, { color: colors.error }]}>
                This action is immediate and cannot be undone. Export a backup
                first if you wish to retain your financial records.
              </Text>
            </View>

            <Text style={[styles.deleteInstruction, { color: colors.fg }]}>
              Type <Text style={{ fontWeight: fontWeight.bold }}>DELETE</Text>{" "}
              to confirm:
            </Text>

            <TextInput
              value={deleteConfirmText}
              onChangeText={setDeleteConfirmText}
              placeholder="DELETE"
              placeholderTextColor={colors.fgSubtle}
              autoCapitalize="characters"
              style={[
                styles.deleteInput,
                {
                  backgroundColor: colors.surfaceRecessed,
                  color: colors.fg,
                  borderColor: colors.divider,
                },
              ]}
            />

            <View style={styles.modalBtnRow}>
              <Pressable
                onPress={() => setDeleteModalVisible(false)}
                style={[
                  styles.cancelPill,
                  { backgroundColor: colors.surfaceRecessed },
                ]}
              >
                <Text style={[styles.cancelPillText, { color: colors.fg }]}>
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                disabled={
                  deleteConfirmText.trim().toUpperCase() !== "DELETE" ||
                  deleting
                }
                onPress={() => void handleConfirmDelete()}
                style={[
                  styles.destructivePill,
                  {
                    backgroundColor:
                      deleteConfirmText.trim().toUpperCase() === "DELETE"
                        ? colors.error
                        : `${colors.error}40`,
                  },
                ]}
              >
                <Feather name="trash-2" size={16} color="#FFFFFF" />
                <Text style={styles.destructivePillText}>
                  {deleting ? "Purging..." : "Delete My Data"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  summaryCard: {
    padding: spacing[5],
    borderRadius: radius.xl,
    gap: spacing[3],
  },
  summaryBadgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
    paddingHorizontal: spacing[2],
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  summaryBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.8,
  },
  versionTag: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  summaryTitle: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.bold,
    letterSpacing: -0.5,
  },
  summaryDescription: {
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * lineHeight.normal,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingTop: spacing[3],
    gap: spacing[3],
  },
  categoryItem: {
    width: "47%",
    gap: 4,
  },
  catIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  catName: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  catSub: {
    fontSize: fontSize.xs,
  },
  sectionContainer: {
    gap: spacing[2],
  },
  card: {
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    padding: spacing[4],
    borderRadius: radius.lg,
    marginTop: spacing[2],
  },
  contactTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  contactEmail: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.55)",
  },
  modalSheet: {
    borderTopLeftRadius: radius.hero,
    borderTopRightRadius: radius.hero,
    paddingHorizontal: spacing[5],
    paddingTop: spacing[3],
    paddingBottom: spacing[8],
    gap: spacing[4],
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: spacing[2],
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  modalParagraph: {
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * lineHeight.normal,
  },
  dataRecordBox: {
    padding: spacing[4],
    borderRadius: radius.md,
    gap: spacing[1],
    marginVertical: spacing[2],
  },
  recordHeader: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    marginBottom: 2,
  },
  recordLine: {
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * 1.4,
  },
  modalBtnRow: {
    flexDirection: "row",
    gap: spacing[3],
    marginTop: spacing[3],
  },
  primaryPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    paddingVertical: spacing[3],
    borderRadius: radius.full,
  },
  primaryPillText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  correctRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    padding: spacing[4],
    borderRadius: radius.md,
    marginVertical: 4,
  },
  correctRowTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  correctRowSubtitle: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  processorCard: {
    padding: spacing[4],
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  processorHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  processorTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  processorBody: {
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * lineHeight.normal,
  },
  deleteWarningBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    padding: spacing[3],
    borderRadius: radius.md,
    borderWidth: 1,
  },
  deleteWarningText: {
    flex: 1,
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * 1.3,
  },
  deleteInstruction: {
    fontSize: fontSize.sm,
    marginTop: spacing[2],
  },
  deleteInput: {
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing[4],
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    letterSpacing: 2,
  },
  cancelPill: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[3],
    borderRadius: radius.full,
  },
  cancelPillText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  destructivePill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    paddingVertical: spacing[3],
    borderRadius: radius.full,
  },
  destructivePillText: {
    color: "#FFFFFF",
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
});
