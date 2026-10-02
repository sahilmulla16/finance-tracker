import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { spacing, radius, fontSize, fontWeight } from "@/constants/tokens";
import { haptics } from "@/utils/haptics";

export interface DeleteConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  children?: React.ReactNode;
}

export function DeleteConfirmationModal({
  visible,
  title,
  message,
  confirmText = "Delete",
  cancelText = "Cancel",
  isDestructive = true,
  onConfirm,
  onCancel,
  children,
}: DeleteConfirmationModalProps) {
  const colors = useColors();

  const handleConfirm = () => {
    void haptics.strong();
    void onConfirm();
  };

  const handleCancel = () => {
    void haptics.selection();
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleCancel} />
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Icon Badge */}
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: isDestructive
                  ? "rgba(239, 68, 68, 0.14)"
                  : `${colors.primary}20`,
              },
            ]}
          >
            <Feather
              name={isDestructive ? "trash-2" : "alert-circle"}
              size={22}
              color={isDestructive ? colors.error || "#EF4444" : colors.primary}
            />
          </View>

          {/* Title & Description */}
          <Text style={[styles.title, { color: colors.fg }]}>{title}</Text>
          <Text style={[styles.message, { color: colors.fgMuted }]}>
            {message}
          </Text>

          {/* Optional custom content (e.g. category selector) */}
          {children && <View style={styles.customContent}>{children}</View>}

          {/* Action Buttons: Cancel and Delete */}
          <View style={styles.actionsRow}>
            <Pressable
              onPress={handleCancel}
              style={[
                styles.btn,
                styles.cancelBtn,
                {
                  backgroundColor: colors.surfaceRecessed,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.btnText, { color: colors.fg }]}>
                {cancelText}
              </Text>
            </Pressable>

            <Pressable
              onPress={handleConfirm}
              style={[
                styles.btn,
                styles.confirmBtn,
                {
                  backgroundColor: isDestructive
                    ? colors.error || "#EF4444"
                    : colors.primary,
                },
              ]}
            >
              <Text
                style={[
                  styles.btnText,
                  { color: isDestructive ? "#FFFFFF" : colors.onPrimary },
                ]}
              >
                {confirmText}
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
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing[5],
  },
  card: {
    width: "100%",
    maxWidth: 340,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing[5],
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing[3],
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    textAlign: "center",
    marginBottom: spacing[2],
  },
  message: {
    fontSize: fontSize.sm,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: spacing[4],
  },
  customContent: {
    width: "100%",
    marginBottom: spacing[4],
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing[3],
    width: "100%",
  },
  btn: {
    flex: 1,
    height: 46,
    borderRadius: radius.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelBtn: {
    borderWidth: 1,
  },
  confirmBtn: {},
  btnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
});
