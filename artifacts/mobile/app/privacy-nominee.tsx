import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
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
import { NomineeRecord, NomineeRelationship } from "@/types/privacy";

const RELATIONSHIPS: NomineeRelationship[] = [
  "Spouse",
  "Parent",
  "Child",
  "Sibling",
  "Legal Representative",
  "Other",
];

export default function PrivacyNomineeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { nominee, saveNominee } = useFinance();

  const [name, setName] = useState(nominee?.name || "");
  const [relationship, setRelationship] = useState<string>(
    nominee?.relationship || "Spouse",
  );
  const [email, setEmail] = useState(nominee?.email || "");
  const [phone, setPhone] = useState(nominee?.phone || "");
  const [instructions, setInstructions] = useState(
    nominee?.specialInstructions || "",
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Required", "Please provide the nominee's full legal name.");
      return;
    }
    if (!email.trim() && !phone.trim()) {
      Alert.alert(
        "Required",
        "Please provide at least one valid contact method (email or phone) for your nominee.",
      );
      return;
    }

    setSaving(true);
    try {
      const record: NomineeRecord = {
        name: name.trim(),
        relationship,
        email: email.trim(),
        phone: phone.trim(),
        specialInstructions: instructions.trim() || undefined,
        registeredAt: nominee?.registeredAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveNominee(record);
      Alert.alert(
        "Nominee Registered",
        `Nominee details for ${record.name} have been securely stored in your local data records.`,
      );
    } catch {
      Alert.alert("Error", "Could not save nominee. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    Alert.alert(
      "Remove Nominee?",
      "Are you sure you want to remove this nominee declaration?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            await saveNominee(null);
            setName("");
            setEmail("");
            setPhone("");
            setInstructions("");
            Alert.alert("Removed", "Nominee declaration has been cleared.");
          },
        },
      ],
    );
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
          Nominee Declaration
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
          DPDP ACT 2023 · SECTION 14
        </Text>
        <Text style={[styles.screenHeading, { color: colors.fg }]}>
          Right to Nominate
        </Text>
        <Text style={[styles.screenSubheading, { color: colors.fgMuted }]}>
          Under Section 14 of the Digital Personal Data Protection Act, you have
          the right to nominate an individual who shall, in the event of death
          or incapacity of the data principal, exercise your data protection
          rights (such as accessing or requesting deletion of your financial
          records).
        </Text>

        {/* Input Form Card */}
        <View
          style={[
            styles.formCard,
            { backgroundColor: colors.surface, borderColor: colors.divider },
          ]}
        >
          <Text style={[styles.fieldLabel, { color: colors.fgMuted }]}>
            NOMINEE FULL LEGAL NAME
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Aditi Sharma"
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
            RELATIONSHIP
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.relationshipRow}
          >
            {RELATIONSHIPS.map((rel) => {
              const isSelected = relationship === rel;
              return (
                <Pressable
                  key={rel}
                  onPress={() => setRelationship(rel)}
                  style={[
                    styles.relPill,
                    {
                      backgroundColor: isSelected
                        ? colors.primary
                        : colors.surfaceRecessed,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.relPillText,
                      {
                        color: isSelected ? colors.onPrimary : colors.fgMuted,
                      },
                    ]}
                  >
                    {rel}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={[styles.fieldLabel, { color: colors.fgMuted }]}>
            CONTACT EMAIL
          </Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="e.g. aditi.sharma@example.com"
            placeholderTextColor={colors.fgSubtle}
            keyboardType="email-address"
            autoCapitalize="none"
            style={[
              styles.textInput,
              {
                backgroundColor: colors.surfaceRecessed,
                color: colors.fg,
              },
            ]}
          />

          <Text style={[styles.fieldLabel, { color: colors.fgMuted }]}>
            CONTACT PHONE NUMBER
          </Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="+91 98765 43210"
            placeholderTextColor={colors.fgSubtle}
            keyboardType="phone-pad"
            style={[
              styles.textInput,
              {
                backgroundColor: colors.surfaceRecessed,
                color: colors.fg,
              },
            ]}
          />

          <Text style={[styles.fieldLabel, { color: colors.fgMuted }]}>
            SPECIAL INSTRUCTIONS (OPTIONAL)
          </Text>
          <TextInput
            value={instructions}
            onChangeText={setInstructions}
            placeholder="e.g. Authorize nominee to download final financial statement and purge records"
            placeholderTextColor={colors.fgSubtle}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            style={[
              styles.textArea,
              {
                backgroundColor: colors.surfaceRecessed,
                color: colors.fg,
              },
            ]}
          />

          <View style={styles.btnRow}>
            {nominee && (
              <Pressable
                onPress={() => void handleRemove()}
                style={[
                  styles.removeBtn,
                  { backgroundColor: `${colors.error}14` },
                ]}
              >
                <Feather name="trash-2" size={16} color={colors.error} />
              </Pressable>
            )}

            <Pressable
              disabled={saving}
              onPress={() => void handleSave()}
              style={[
                styles.saveBtn,
                { backgroundColor: colors.primary, flex: 1 },
              ]}
            >
              <Feather name="check" size={16} color={colors.onPrimary} />
              <Text style={[styles.saveBtnText, { color: colors.onPrimary }]}>
                {saving
                  ? "Saving..."
                  : nominee
                    ? "Update Nominee"
                    : "Save Nominee"}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Informational Disclaimer */}
        <View
          style={[styles.infoCard, { backgroundColor: colors.surfaceRecessed }]}
        >
          <Feather name="shield" size={16} color={colors.fgMuted} />
          <Text style={[styles.infoText, { color: colors.fgMuted }]}>
            This screen provides the technical nomination record for your Zeno
            data. In statutory circumstances under Indian law, nominees must
            provide appropriate verification (such as death certificate or legal
            proof of incapacity) when exercising data principal rights.
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
  formCard: {
    borderRadius: radius.xl,
    padding: spacing[4],
    borderWidth: 1,
    gap: spacing[2],
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.8,
    marginTop: spacing[2],
    marginBottom: 2,
  },
  relationshipRow: {
    gap: spacing[2],
    paddingVertical: 4,
  },
  relPill: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
  },
  relPillText: {
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
    height: 80,
    borderRadius: radius.md,
    padding: spacing[3],
    fontSize: fontSize.sm,
  },
  btnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    marginTop: spacing[4],
  },
  removeBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    height: 44,
    borderRadius: radius.full,
  },
  saveBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  infoCard: {
    flexDirection: "row",
    gap: spacing[3],
    padding: spacing[4],
    borderRadius: radius.lg,
    marginTop: spacing[3],
  },
  infoText: {
    flex: 1,
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * 1.4,
  },
});
