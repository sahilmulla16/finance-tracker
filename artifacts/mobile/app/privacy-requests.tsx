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
import {
  PrivacyRequest,
  PrivacyRequestType,
  PrivacyRequestStatus,
  PRIVACY_CONTACT,
} from "@/types/privacy";

const REQUEST_TYPES: {
  type: PrivacyRequestType;
  label: string;
  icon: string;
}[] = [
  { type: "access", label: "Access My Data", icon: "eye" },
  { type: "correct", label: "Correct My Data", icon: "edit-3" },
  { type: "delete", label: "Delete My Data", icon: "trash-2" },
  { type: "withdraw", label: "Withdraw Consent", icon: "x-circle" },
  { type: "question", label: "Privacy Question", icon: "help-circle" },
  {
    type: "complaint",
    label: "Privacy Complaint / Grievance",
    icon: "alert-octagon",
  },
  { type: "other", label: "Other Privacy Inquiry", icon: "message-circle" },
];

function getStatusBadge(status: PrivacyRequestStatus, colors: any) {
  switch (status) {
    case "submitted":
      return {
        label: "Submitted",
        color: colors.primary,
        bg: `${colors.primary}18`,
      };
    case "under_review":
      return {
        label: "Under Review",
        color: colors.warning,
        bg: `${colors.warning}18`,
      };
    case "needs_information":
      return {
        label: "Needs Info",
        color: colors.accent,
        bg: `${colors.accent}18`,
      };
    case "resolved":
      return {
        label: "Resolved",
        color: colors.success,
        bg: `${colors.success}18`,
      };
    case "rejected":
      return {
        label: "Rejected",
        color: colors.error,
        bg: `${colors.error}18`,
      };
  }
}

export default function PrivacyRequestsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { privacyRequests, submitPrivacyRequest } = useFinance();

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedType, setSelectedType] =
    useState<PrivacyRequestType>("question");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!subject.trim()) {
      Alert.alert("Required", "Please enter a subject for your request.");
      return;
    }
    if (!description.trim()) {
      Alert.alert("Required", "Please enter a description for your request.");
      return;
    }

    setSubmitting(true);
    try {
      const created = await submitPrivacyRequest(
        selectedType,
        subject,
        description,
      );
      setModalVisible(false);
      setSubject("");
      setDescription("");
      Alert.alert(
        "Request Logged",
        `Your request (ID: ${created.id}) has been recorded. The Privacy Contact will address your request according to DPDP grievance timelines.`,
      );
    } catch {
      Alert.alert("Error", "Could not submit request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

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
          Privacy Requests & Grievance
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
          GRIEVANCE REDRESSAL MECHANISM
        </Text>
        <Text style={[styles.screenHeading, { color: colors.fg }]}>
          Exercise Your Rights
        </Text>
        <Text style={[styles.screenSubheading, { color: colors.fgMuted }]}>
          Under Section 13 of the DPDP Act 2023, you have the right to readily
          available grievance redressal regarding any personal data inquiry,
          correction, or erasure.
        </Text>

        {/* Submit New Request Button */}
        <Pressable
          onPress={() => setModalVisible(true)}
          style={[styles.newRequestBtn, { backgroundColor: colors.primary }]}
        >
          <Feather name="plus" size={18} color={colors.onPrimary} />
          <Text style={[styles.newRequestText, { color: colors.onPrimary }]}>
            Submit New Privacy Request
          </Text>
        </Pressable>

        {/* Request History Section */}
        <View style={styles.historySection}>
          <Text style={[styles.historyHeading, { color: colors.fg }]}>
            Request History ({privacyRequests.length})
          </Text>

          {privacyRequests.length === 0 ? (
            <View
              style={[
                styles.emptyCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.divider,
                },
              ]}
            >
              <Feather name="inbox" size={32} color={colors.fgSubtle} />
              <Text style={[styles.emptyTitle, { color: colors.fg }]}>
                No Privacy Requests Logged
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.fgMuted }]}>
                Any formal rights requests, grievances, or privacy questions you
                submit will appear here with live tracking status.
              </Text>
            </View>
          ) : (
            privacyRequests.map((req) => {
              const badge = getStatusBadge(req.status, colors);
              const formattedDate = new Date(req.createdAt).toLocaleDateString(
                "en-IN",
                {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                },
              );

              return (
                <View
                  key={req.id}
                  style={[
                    styles.requestCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.divider,
                    },
                  ]}
                >
                  <View style={styles.cardTopRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.reqType, { color: colors.primary }]}>
                        {req.type.toUpperCase()} REQUEST
                      </Text>
                      <Text style={[styles.reqSubject, { color: colors.fg }]}>
                        {req.subject}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: badge.bg },
                      ]}
                    >
                      <Text
                        style={[styles.statusBadgeText, { color: badge.color }]}
                      >
                        {badge.label}
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={[styles.reqDescription, { color: colors.fgMuted }]}
                    numberOfLines={3}
                  >
                    {req.description}
                  </Text>

                  {req.responseNotes && (
                    <View
                      style={[
                        styles.responseBox,
                        { backgroundColor: colors.surfaceRecessed },
                      ]}
                    >
                      <Text
                        style={[styles.responseLabel, { color: colors.fg }]}
                      >
                        Response:
                      </Text>
                      <Text
                        style={[styles.responseText, { color: colors.fgMuted }]}
                      >
                        {req.responseNotes}
                      </Text>
                    </View>
                  )}

                  <View
                    style={[
                      styles.cardFooter,
                      { borderTopColor: colors.divider, borderTopWidth: 1 },
                    ]}
                  >
                    <Text style={[styles.cardDate, { color: colors.fgSubtle }]}>
                      Submitted: {formattedDate}
                    </Text>
                    <Text style={[styles.cardId, { color: colors.fgSubtle }]}>
                      ID: {req.id}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Contact Info Card */}
        <View
          style={[
            styles.contactBox,
            { backgroundColor: colors.surfaceRecessed },
          ]}
        >
          <Feather name="mail" size={16} color={colors.fgMuted} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.contactName, { color: colors.fg }]}>
              {PRIVACY_CONTACT.name}
            </Text>
            <Text style={[styles.contactDetails, { color: colors.fgMuted }]}>
              Direct Email: {PRIVACY_CONTACT.email}
              {"\n"}Location: {PRIVACY_CONTACT.address}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* NEW REQUEST MODAL */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setModalVisible(false)}
          />
          <View
            style={[styles.modalSheet, { backgroundColor: colors.surface }]}
          >
            <View
              style={[styles.modalHandle, { backgroundColor: colors.fgSubtle }]}
            />
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.fg }]}>
                New Privacy Request
              </Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Feather name="x" size={22} color={colors.fgMuted} />
              </Pressable>
            </View>

            <ScrollView
              style={{ maxHeight: 420 }}
              showsVerticalScrollIndicator={false}
            >
              <Text style={[styles.fieldLabel, { color: colors.fgMuted }]}>
                REQUEST TYPE
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.typeSelectorRow}
              >
                {REQUEST_TYPES.map((t) => {
                  const isSelected = selectedType === t.type;
                  return (
                    <Pressable
                      key={t.type}
                      onPress={() => setSelectedType(t.type)}
                      style={[
                        styles.typePill,
                        {
                          backgroundColor: isSelected
                            ? colors.primary
                            : colors.surfaceRecessed,
                        },
                      ]}
                    >
                      <Feather
                        name={t.icon as never}
                        size={13}
                        color={isSelected ? colors.onPrimary : colors.fgMuted}
                      />
                      <Text
                        style={[
                          styles.typePillText,
                          {
                            color: isSelected
                              ? colors.onPrimary
                              : colors.fgMuted,
                          },
                        ]}
                      >
                        {t.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <Text style={[styles.fieldLabel, { color: colors.fgMuted }]}>
                SUBJECT
              </Text>
              <TextInput
                value={subject}
                onChangeText={setSubject}
                placeholder="e.g. Request to correct account classification"
                placeholderTextColor={colors.fgSubtle}
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.surfaceRecessed,
                    color: colors.fg,
                  },
                ]}
              />

              <Text style={[styles.fieldLabel, { color: colors.fgMuted }]}>
                DETAILS & DESCRIPTION
              </Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Please describe your specific request or grievance..."
                placeholderTextColor={colors.fgSubtle}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                style={[
                  styles.textArea,
                  {
                    backgroundColor: colors.surfaceRecessed,
                    color: colors.fg,
                  },
                ]}
              />
            </ScrollView>

            <View style={styles.modalBtnRow}>
              <Pressable
                onPress={() => setModalVisible(false)}
                style={[
                  styles.cancelBtn,
                  { backgroundColor: colors.surfaceRecessed },
                ]}
              >
                <Text style={[styles.cancelBtnText, { color: colors.fg }]}>
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                disabled={submitting}
                onPress={() => void handleSubmit()}
                style={[styles.submitBtn, { backgroundColor: colors.primary }]}
              >
                <Text
                  style={[styles.submitBtnText, { color: colors.onPrimary }]}
                >
                  {submitting ? "Submitting..." : "Submit Request"}
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
  newRequestBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    paddingVertical: spacing[3],
    borderRadius: radius.full,
    marginTop: spacing[1],
  },
  newRequestText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  historySection: {
    marginTop: spacing[4],
    gap: spacing[3],
  },
  historyHeading: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing[6],
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing[2],
  },
  emptyTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    marginTop: spacing[1],
  },
  emptySubtitle: {
    fontSize: fontSize.xs,
    textAlign: "center",
    lineHeight: fontSize.xs * 1.4,
  },
  requestCard: {
    borderRadius: radius.xl,
    padding: spacing[4],
    borderWidth: 1,
    gap: spacing[2],
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing[2],
  },
  reqType: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.6,
  },
  reqSubject: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
  },
  reqDescription: {
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * 1.4,
  },
  responseBox: {
    padding: spacing[3],
    borderRadius: radius.md,
    gap: 2,
    marginTop: 2,
  },
  responseLabel: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
  },
  responseText: {
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * 1.3,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing[2],
  },
  cardDate: {
    fontSize: 11,
  },
  cardId: {
    fontSize: 11,
    fontFamily: "monospace",
  },
  contactBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    padding: spacing[4],
    borderRadius: radius.lg,
    marginTop: spacing[4],
  },
  contactName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  contactDetails: {
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * 1.4,
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
    gap: spacing[3],
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
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.8,
    marginTop: spacing[2],
    marginBottom: 4,
  },
  typeSelectorRow: {
    gap: spacing[2],
    paddingVertical: 4,
  },
  typePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
  },
  typePillText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  textInput: {
    height: 44,
    borderRadius: radius.md,
    paddingHorizontal: spacing[3],
    fontSize: fontSize.sm,
  },
  textArea: {
    height: 90,
    borderRadius: radius.md,
    padding: spacing[3],
    fontSize: fontSize.sm,
  },
  modalBtnRow: {
    flexDirection: "row",
    gap: spacing[3],
    marginTop: spacing[3],
  },
  cancelBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[3],
    borderRadius: radius.full,
  },
  cancelBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  submitBtn: {
    flex: 2,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[3],
    borderRadius: radius.full,
  },
  submitBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
});
