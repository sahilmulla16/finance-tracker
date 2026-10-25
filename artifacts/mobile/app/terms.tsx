import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import {
  spacing,
  radius,
  fontSize,
  fontWeight,
  lineHeight,
} from "@/constants/tokens";

export default function TermsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { backgroundColor: colors.canvas }]}>
      <View style={[styles.header, { paddingTop: insets.top + spacing[4] }]}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.surface }]}
        >
          <Feather name="arrow-left" size={20} color={colors.fg} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.fg }]}>
          Terms of Service
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.fg }]}>
          Terms of Service
        </Text>
        <Text style={[styles.date, { color: colors.fgMuted }]}>
          Last updated: October 2026
        </Text>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.fg }]}>
            Acceptance of Terms
          </Text>
          <Text style={[styles.paragraph, { color: colors.fgMuted }]}>
            By using Zeno, you agree to be bound by these Terms of Service. If
            you do not agree, please do not use the application.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.fg }]}>
            Use of the Application
          </Text>
          <Text style={[styles.paragraph, { color: colors.fgMuted }]}>
            Zeno is a personal finance tracking tool. You are responsible for
            the accuracy of the data you enter. The application is provided
            as-is without warranties.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.fg }]}>
            User Responsibilities
          </Text>
          <Text style={[styles.paragraph, { color: colors.fgMuted }]}>
            You are responsible for maintaining the confidentiality of your
            data. We recommend regularly exporting backups of your financial
            data.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.fg }]}>
            Limitation of Liability
          </Text>
          <Text style={[styles.paragraph, { color: colors.fgMuted }]}>
            Zeno shall not be liable for any financial decisions made based on
            the data presented in this application. Always consult a financial
            advisor for important decisions.
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
    paddingBottom: spacing[4],
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
    padding: spacing[4],
    gap: spacing[4],
  },
  title: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.bold,
  },
  date: {
    fontSize: fontSize.sm,
    marginTop: -spacing[2],
  },
  card: {
    padding: spacing[4],
    borderRadius: radius.lg,
    gap: spacing[2],
  },
  sectionTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  paragraph: {
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * lineHeight.normal,
  },
});
