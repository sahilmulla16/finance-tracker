import { Feather } from "@expo/vector-icons";
import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { radius, spacing } from "@/constants/tokens";
import { useColors } from "@/hooks/useColors";

interface AccessibilityDisclosureModalProps {
  visible: boolean;
  onAgree: () => void;
  onDecline: () => void;
}

/**
 * Dedicated, unbundled Prominent Disclosure Modal for Google Play Policy Compliance.
 *
 * Requirements:
 * - Appears in normal user flow (e.g. Home screen card or trigger setup) before requesting the capability.
 * - Clearly explains WHY AccessibilityService is needed (hardware double-press shortcut).
 * - Identifies data accessed (Volume Down key event only).
 * - Identifies what is NOT accessed (no screen reading, no passwords, no other apps, no automation).
 * - Requires explicit affirmative consent before opening Android Accessibility Settings.
 * - Safe decline path that allows re-triggering later.
 */
export function AccessibilityDisclosureModal({
  visible,
  onAgree,
  onDecline,
}: AccessibilityDisclosureModalProps) {
  const colors = useColors();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDecline}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: `${colors.primary}35`,
            },
          ]}
        >
          <View
            style={[
              styles.iconBadge,
              { backgroundColor: `${colors.primary}18` },
            ]}
          >
            <Feather name="shield" size={28} color={colors.primary} />
          </View>

          <Text style={[styles.title, { color: colors.fg }]}>
            Enable Quick Add Shortcut
          </Text>

          <Text style={[styles.body, { color: colors.fgMuted }]}>
            Zeno can detect a double-press of the Volume Down button even when
            Zeno is not open. This lets you quickly open Quick Add and record an
            expense without opening the app.
            {"\n\n"}
            <Text style={{ fontWeight: "700", color: colors.fg }}>
              Scope & Boundaries:
            </Text>
            {"\n"}
            Zeno uses Android Accessibility Service only for this hardware
            button shortcut. It does NOT read your screen, inspect messages,
            view passwords, monitor banking apps, or control any other
            application.
          </Text>

          <View style={styles.actions}>
            <Pressable
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
              onPress={onAgree}
              accessibilityRole="button"
              accessibilityLabel="Agree and Enable Quick Add Shortcut"
            >
              <Text
                style={[styles.primaryBtnText, { color: colors.onPrimary }]}
              >
                Agree & Enable
              </Text>
            </Pressable>

            <Pressable
              style={[styles.secondaryBtn, { borderColor: colors.border }]}
              onPress={onDecline}
              accessibilityRole="button"
              accessibilityLabel="Not Now"
            >
              <Text
                style={[styles.secondaryBtnText, { color: colors.fgMuted }]}
              >
                Not Now
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.68)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing[4],
  },
  card: {
    width: "100%",
    maxWidth: 380,
    borderRadius: radius.xl,
    padding: spacing[5],
    borderWidth: 1,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing[3],
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: spacing[3],
  },
  body: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    marginBottom: spacing[5],
  },
  actions: {
    width: "100%",
    gap: spacing[2],
  },
  primaryBtn: {
    height: 48,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryBtn: {
    height: 44,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
