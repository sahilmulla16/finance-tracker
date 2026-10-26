import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import { AnimatedMascot, MascotLookDirection, MascotMood } from "./AnimatedMascot";

const MASCOT_CONTACT_SHEET_IMG = require("@/assets/mascot/mascot_contact_sheet.png");

interface MascotContactSheetProps {
  onClose?: () => void;
}

/**
 * Visual verification contact sheet and interactive playground for Zeno's Mascot.
 * Displays all key poses (Frame 0, Rest, Blink, Look Left, Look Right)
 * and provides live interactive controls for mood, gaze, and tap reactions.
 */
export function MascotContactSheet({ onClose }: MascotContactSheetProps) {
  const [currentMood, setCurrentMood] = useState<MascotMood>("idle");
  const [currentGaze, setCurrentGaze] = useState<MascotLookDirection | undefined>(undefined);
  const [tapCount, setTapCount] = useState(0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Zeno Mascot State Preview</Text>
        <Text style={styles.subtitle}>
          Visual verification across all keyframes and motion modes
        </Text>
      </View>

      {/* 1. Static Frame-by-Frame Contact Sheet */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Reference States Contact Sheet</Text>
        <Text style={styles.caption}>
          From left to right: Frame 0 (Static Fallback), Resting Composite, Blink State (Closed Eyes), Look Left, Look Right.
        </Text>
        <View style={styles.sheetImageContainer}>
          <ExpoImage
            source={MASCOT_CONTACT_SHEET_IMG}
            style={styles.sheetImage}
            contentFit="contain"
          />
        </View>
      </View>

      {/* 2. Live Interactive Mascot Playground */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. Live Interactive Mascot</Text>
        <Text style={styles.caption}>
          Tap the mascot to trigger the reactive bounce + happy wink!
        </Text>

        <View style={styles.interactiveStage}>
          <AnimatedMascot
            size={190}
            mood={currentMood}
            lookDirection={currentGaze}
            onPress={() => setTapCount((c) => c + 1)}
          />
          <Text style={styles.tapCounter}>
            Taps acknowledged: {tapCount}
          </Text>
        </View>

        {/* Mood Controls */}
        <Text style={styles.controlLabel}>Mood / Emotion:</Text>
        <View style={styles.buttonRow}>
          {(["idle", "happy", "thinking", "alert"] as MascotMood[]).map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.pillButton, currentMood === m && styles.pillActive]}
              onPress={() => setCurrentMood(m)}
            >
              <Text style={[styles.pillText, currentMood === m && styles.pillTextActive]}>
                {m.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Gaze Direction Controls */}
        <Text style={styles.controlLabel}>Gaze Direction:</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.pillButton, currentGaze === undefined && styles.pillActive]}
            onPress={() => setCurrentGaze(undefined)}
          >
            <Text style={[styles.pillText, currentGaze === undefined && styles.pillTextActive]}>
              AUTO (CHOREO)
            </Text>
          </TouchableOpacity>
          {(["left", "center", "right", "up", "down"] as MascotLookDirection[]).map((dir) => (
            <TouchableOpacity
              key={dir}
              style={[styles.pillButton, currentGaze === dir && styles.pillActive]}
              onPress={() => setCurrentGaze(dir)}
            >
              <Text style={[styles.pillText, currentGaze === dir && styles.pillTextActive]}>
                {dir.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 3. Reduced Motion Static Fallback */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. Reduced Motion Verification</Text>
        <Text style={styles.caption}>
          When reduceMotion is active or device prefers reduced motion, freezes seamlessly at Frame 0:
        </Text>
        <View style={styles.staticPreviewRow}>
          <View style={styles.previewBox}>
            <Text style={styles.previewBoxLabel}>Static Fallback</Text>
            <AnimatedMascot size={110} floating={false} interactive={false} paused={true} />
          </View>
          <View style={styles.previewBox}>
            <Text style={styles.previewBoxLabel}>Subtle Idle (Compact)</Text>
            <AnimatedMascot size={110} floating={true} interactive={true} />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAF9",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1A2E26",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: "#5C7368",
    marginTop: 4,
  },
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E2EBE6",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A2E26",
    marginBottom: 6,
  },
  caption: {
    fontSize: 13,
    color: "#6D8479",
    marginBottom: 12,
    lineHeight: 18,
  },
  sheetImageContainer: {
    width: "100%",
    height: 100,
    backgroundColor: "#F4F8F5",
    borderRadius: 12,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  sheetImage: {
    width: "100%",
    height: "100%",
  },
  interactiveStage: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4F8F5",
    borderRadius: 16,
    paddingVertical: 20,
    marginVertical: 12,
  },
  tapCounter: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: "500",
    color: "#4A6B5D",
  },
  controlLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2C3E35",
    marginTop: 12,
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pillButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#EEF4F0",
    borderWidth: 1,
    borderColor: "#D8E6DE",
  },
  pillActive: {
    backgroundColor: "#0D9488",
    borderColor: "#0D9488",
  },
  pillText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#4A6B5D",
  },
  pillTextActive: {
    color: "#FFFFFF",
  },
  staticPreviewRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  previewBox: {
    alignItems: "center",
    backgroundColor: "#F4F8F5",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2EBE6",
  },
  previewBoxLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#5C7368",
    marginBottom: 8,
  },
});
