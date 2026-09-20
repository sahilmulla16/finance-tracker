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
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useFinance } from "@/context/FinanceContext";
import { promptGoogleSignInAsync } from "@/services/googleAuth";
import { spacing, radius, fontSize, fontWeight } from "@/constants/tokens";

function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </Svg>
  );
}

export default function WelcomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signInWithGoogle } = useFinance();
  const [signingIn, setSigningIn] = useState(false);

  const handleGoogleSignIn = async () => {
    if (signingIn) return;
    setSigningIn(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const result = await promptGoogleSignInAsync();
      if (result.type === "success") {
        await signInWithGoogle(result.profile);
        router.push("/onboarding" as never);
      } else if (result.type === "error") {
        Alert.alert("Sign-In Note", result.message);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to sign in";
      Alert.alert("Sign-In Note", message);
    } finally {
      setSigningIn(false);
    }
  };

  const handleContinueAsGuest = () => {
    void Haptics.selectionAsync();
    router.push("/onboarding" as never);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.canvas }]}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            paddingTop: insets.top + spacing[6],
            paddingBottom: insets.bottom + spacing[5],
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Logo & Header */}
        <View style={styles.brandSection}>
          <View
            style={[
              styles.logoBadge,
              {
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.border,
              },
            ]}
          >
            <Feather name="trending-up" size={36} color={colors.primary} />
          </View>

          <Text style={[styles.brandTitle, { color: colors.fg }]}>
            Pocketflow
          </Text>
          <Text style={[styles.brandTagline, { color: colors.fgMuted }]}>
            Your money. One clear picture.
          </Text>
        </View>

        {/* Feature Pillars */}
        <View style={styles.featuresCard}>
          <View
            style={[
              styles.featureRow,
              { backgroundColor: colors.surface, borderColor: colors.divider },
            ]}
          >
            <View
              style={[
                styles.featureIconContainer,
                { backgroundColor: `${colors.primary}16` },
              ]}
            >
              <Feather name="shield" size={18} color={colors.primary} />
            </View>
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: colors.fg }]}>
                100% On-Device Privacy
              </Text>
              <Text
                style={[styles.featureDescription, { color: colors.fgMuted }]}
              >
                No cloud database. Financial data never leaves your device.
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.featureRow,
              { backgroundColor: colors.surface, borderColor: colors.divider },
            ]}
          >
            <View
              style={[
                styles.featureIconContainer,
                { backgroundColor: `${colors.income}16` },
              ]}
            >
              <Feather name="zap" size={18} color={colors.income} />
            </View>
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: colors.fg }]}>
                2-Second Quick Add
              </Text>
              <Text
                style={[styles.featureDescription, { color: colors.fgMuted }]}
              >
                Double-press Volume Down on Android to record instantly.
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.featureRow,
              { backgroundColor: colors.surface, borderColor: colors.divider },
            ]}
          >
            <View
              style={[
                styles.featureIconContainer,
                { backgroundColor: `${colors.transfer}16` },
              ]}
            >
              <Feather name="pie-chart" size={18} color={colors.transfer} />
            </View>
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: colors.fg }]}>
                Smart Visual Insights
              </Text>
              <Text
                style={[styles.featureDescription, { color: colors.fgMuted }]}
              >
                Track multiple bank accounts, cash, and UPI with ease.
              </Text>
            </View>
          </View>
        </View>

        {/* Actions Area */}
        <View style={styles.actionsSection}>
          <Pressable
            onPress={handleGoogleSignIn}
            disabled={signingIn}
            style={({ pressed }) => [
              styles.googleButton,
              {
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.border,
                opacity: pressed || signingIn ? 0.8 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Continue with Google"
          >
            {signingIn ? (
              <ActivityIndicator size="small" color={colors.fg} />
            ) : (
              <>
                <GoogleIcon size={20} />
                <Text style={[styles.googleButtonText, { color: colors.fg }]}>
                  Continue with Google
                </Text>
              </>
            )}
          </Pressable>

          <Pressable
            onPress={handleContinueAsGuest}
            disabled={signingIn}
            style={({ pressed }) => [
              styles.guestButton,
              pressed && { opacity: 0.6 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Continue as Guest"
          >
            <Text style={[styles.guestButtonText, { color: colors.fgMuted }]}>
              Continue without signing in
            </Text>
          </Pressable>
        </View>

        {/* DPDP Local-first Privacy Notice */}
        <View style={styles.privacyFooter}>
          <View style={styles.privacyRow}>
            <Feather
              name="lock"
              size={12}
              color={colors.fgSubtle}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.privacyNote, { color: colors.fgSubtle }]}>
              Financial records stay 100% local on this device. Google Sign-In
              is used strictly for profile display.
            </Text>
          </View>

          <View style={styles.legalLinks}>
            <Pressable onPress={() => router.push("/privacy")}>
              <Text style={[styles.legalLinkText, { color: colors.primary }]}>
                Privacy Notice
              </Text>
            </Pressable>
            <Text style={[styles.legalDivider, { color: colors.divider }]}>
              •
            </Text>
            <Pressable onPress={() => router.push("/terms")}>
              <Text style={[styles.legalLinkText, { color: colors.primary }]}>
                Terms of Service
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing[5],
    justifyContent: "space-between",
  },
  brandSection: {
    alignItems: "center",
    marginTop: spacing[4],
    marginBottom: spacing[6],
  },
  logoBadge: {
    width: 76,
    height: 76,
    borderRadius: radius.hero,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing[4],
  },
  brandTitle: {
    fontSize: fontSize["3xl"],
    fontWeight: fontWeight.bold,
    letterSpacing: -0.5,
    marginBottom: spacing[2],
  },
  brandTagline: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.regular,
    textAlign: "center",
  },
  featuresCard: {
    gap: spacing[3],
    marginBottom: spacing[6],
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing[4],
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing[3],
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.regular,
    lineHeight: 16,
  },
  actionsSection: {
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[3],
    height: 52,
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  googleButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  guestButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[3],
  },
  guestButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  privacyFooter: {
    alignItems: "center",
    paddingTop: spacing[2],
  },
  privacyRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing[3],
    paddingHorizontal: spacing[2],
  },
  privacyNote: {
    fontSize: fontSize.xs - 0.5,
    lineHeight: 15,
    textAlign: "center",
    flex: 1,
  },
  legalLinks: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  legalLinkText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  legalDivider: {
    fontSize: fontSize.xs,
  },
});
