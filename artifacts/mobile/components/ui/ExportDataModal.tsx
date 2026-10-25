import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { spacing, radius, fontSize, fontWeight } from "@/constants/tokens";
import { haptics } from "@/utils/haptics";

export interface ExportDataModalProps {
  visible: boolean;
  onClose: () => void;
  onExportCSV: () => void | Promise<void>;
  onExportJSON: () => void | Promise<void>;
}

export function ExportDataModal({
  visible,
  onClose,
  onExportCSV,
  onExportJSON,
}: ExportDataModalProps) {
  const colors = useColors();

  const handleCSV = () => {
    void haptics.selection();
    onClose();
    void onExportCSV();
  };

  const handleJSON = () => {
    void haptics.selection();
    onClose();
    void onExportJSON();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
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
                backgroundColor: `${colors.primary}18`,
              },
            ]}
          >
            <Feather name="download" size={22} color={colors.primary} />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.fg }]}>Export Data</Text>
          <Text style={[styles.subtitle, { color: colors.fgMuted }]}>
            Choose an export format
          </Text>

          {/* Two Buttons: CSV and JSON */}
          <View style={styles.actionsRow}>
            <Pressable
              onPress={handleCSV}
              style={[
                styles.btn,
                {
                  backgroundColor: colors.surfaceRecessed,
                  borderColor: colors.border,
                },
              ]}
            >
              <Feather
                name="file-text"
                size={18}
                color={colors.primary}
                style={styles.btnIcon}
              />
              <Text style={[styles.btnText, { color: colors.fg }]}>CSV</Text>
            </Pressable>

            <Pressable
              onPress={handleJSON}
              style={[
                styles.btn,
                {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                },
              ]}
            >
              <Feather
                name="code"
                size={18}
                color={colors.onPrimary || "#FFFFFF"}
                style={styles.btnIcon}
              />
              <Text
                style={[
                  styles.btnText,
                  { color: colors.onPrimary || "#FFFFFF" },
                ]}
              >
                JSON
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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing[4],
  },
  card: {
    width: "100%",
    maxWidth: 320,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing[5],
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: fontSize.sm,
    textAlign: "center",
    marginBottom: spacing[5],
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
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  btnIcon: {
    marginRight: spacing[2],
  },
  btnText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
});

