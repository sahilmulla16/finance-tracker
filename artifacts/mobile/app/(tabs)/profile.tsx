import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { promptGoogleSignInAsync } from "@/services/googleAuth";

import { useFinance } from "@/context/FinanceContext";
import { useColors } from "@/hooks/useColors";
import { spacing, radius, fontSize, fontWeight } from "@/constants/tokens";

const APP_VERSION = "1.0.0";

function SettingsRow({
  icon,
  label,
  subtitle,
  onPress,
}: {
  icon: string;
  label: string;
  subtitle?: string;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
    >
      <View
        style={[styles.rowIcon, { backgroundColor: colors.surfaceRecessed }]}
      >
        <Feather name={icon as never} size={18} color={colors.fgMuted} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, { color: colors.fg }]}>{label}</Text>
        {subtitle && (
          <Text style={[styles.rowSubtitle, { color: colors.fgMuted }]}>
            {subtitle}
          </Text>
        )}
      </View>
      <Feather name="chevron-right" size={18} color={colors.fgSubtle} />
    </Pressable>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  const colors = useColors();
  return (
    <View style={styles.row}>
      <View
        style={[styles.rowIcon, { backgroundColor: colors.surfaceRecessed }]}
      >
        <Feather name={icon as never} size={18} color={colors.fgMuted} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, { color: colors.fg }]}>{label}</Text>
        <Text style={[styles.rowSubtitle, { color: colors.fgMuted }]}>
          {value}
        </Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const {
    settings,
    categories,
    accounts,
    exportData,
    updateSettings,
    unreadNotificationsCount,
    authState,
    signInWithGoogle,
    signOut,
  } = useFinance();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [pickingImage, setPickingImage] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  const handleGoogleSignIn = async () => {
    if (signingIn) return;
    setSigningIn(true);
    try {
      const result = await promptGoogleSignInAsync();
      if (result.type === "success") {
        await signInWithGoogle(result.profile);
        Alert.alert("Welcome!", `Signed in as ${result.profile.name}`);
      } else if (result.type === "error") {
        Alert.alert("Sign-In Note", result.message);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to sign in";
      Alert.alert("Sign-In Note", msg);
    } finally {
      setSigningIn(false);
    }
  };

  const displayName = authState?.displayName || settings.profileName;
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const defaultAccount = accounts.find((a) => a.isDefault);

  const pickProfileImage = async () => {
    if (pickingImage) return;
    setPickingImage(true);
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Please grant media library access to choose a profile picture.",
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        await updateSettings({ profileImage: result.assets[0].uri });
      }
    } catch {
      // User cancelled or error — do nothing
    } finally {
      setPickingImage(false);
    }
  };

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.canvas }]}
      contentContainerStyle={{
        paddingTop: insets.top + spacing[5],
        paddingBottom: 120,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={[styles.headerBtn, { backgroundColor: colors.surface }]}
          onPress={() => router.push("/settings")}
          accessibilityLabel="Settings"
        >
          <Feather name="more-horizontal" size={20} color={colors.fg} />
        </Pressable>
        <Pressable
          style={[styles.headerBtn, { backgroundColor: colors.surface }]}
          onPress={() => router.push("/notifications")}
          accessibilityLabel="Notifications"
        >
          <Feather name="bell" size={20} color={colors.fg} />
          {unreadNotificationsCount > 0 && (
            <View
              style={[styles.notifBadge, { backgroundColor: colors.primary }]}
            />
          )}
        </Pressable>
      </View>

      {/* Avatar */}
      <View style={styles.avatarSection}>
        <Pressable
          onPress={() => void pickProfileImage()}
          style={styles.avatarContainer}
        >
          {settings.profileImage ? (
            <Image
              source={{ uri: settings.profileImage }}
              style={styles.avatarImage}
            />
          ) : (
            <View
              style={[
                styles.avatar,
                { backgroundColor: colors.surfaceRecessed },
              ]}
            >
              <Text style={[styles.avatarText, { color: colors.primary }]}>
                {initials}
              </Text>
            </View>
          )}
          <View style={[styles.editBadge, { backgroundColor: colors.primary }]}>
            <Feather name="camera" size={12} color={colors.onPrimary} />
          </View>
        </Pressable>
        <Text style={[styles.profileName, { color: colors.fg }]}>
          {displayName}
        </Text>
        {authState?.email ? (
          <Text style={[styles.profileEmail, { color: colors.fgMuted }]}>
            {authState.email}
          </Text>
        ) : null}
        <Text style={[styles.profileSub, { color: colors.fgSubtle }]}>
          {accounts.length} accounts · {settings.currency}
        </Text>
      </View>

      {/* Account group */}
      <View style={styles.group}>
        <View style={[styles.groupCard, { backgroundColor: colors.surface }]}>
          <SettingsRow
            icon="credit-card"
            label="Accounts"
            subtitle={defaultAccount?.name || "No default"}
            onPress={() => router.push("/accounts")}
          />
          <SettingsRow
            icon="globe"
            label="Currency"
            subtitle={settings.currency}
            onPress={() => router.push("/currency")}
          />
          <SettingsRow
            icon="tag"
            label="Categories"
            subtitle={`${categories.length} categories`}
            onPress={() => router.push("/categories")}
          />
          <SettingsRow
            icon="target"
            label="Saving Goals"
            onPress={() => router.push("/savings")}
          />
          <SettingsRow
            icon="pie-chart"
            label="Budgets"
            onPress={() => router.push("/(tabs)/budgets")}
          />
        </View>
      </View>

      {/* Preferences group */}
      <View style={styles.group}>
        <View style={[styles.groupCard, { backgroundColor: colors.surface }]}>
          <SettingsRow
            icon="zap"
            label="Quick Add"
            subtitle="2× Volume Down & Triggers"
            onPress={() => router.push("/quick-add-settings")}
          />
          <SettingsRow
            icon="moon"
            label="Appearance"
            subtitle={
              settings.appearance.charAt(0).toUpperCase() +
              settings.appearance.slice(1)
            }
            onPress={() => router.push("/appearance")}
          />
          <SettingsRow
            icon="download"
            label="Export Data"
            subtitle="Save your data"
            onPress={() => {
              Alert.alert("Export Data", "Export your financial data as JSON", [
                { text: "Cancel", style: "cancel" },
                { text: "Export", onPress: () => void exportData("json") },
              ]);
            }}
          />
          <SettingsRow
            icon="upload"
            label="Restore Backup"
            subtitle="Import from backup"
            onPress={() => router.push("/restore")}
          />
        </View>
      </View>

      {/* Privacy & Legal group */}
      <View style={styles.group}>
        <View style={[styles.groupCard, { backgroundColor: colors.surface }]}>
          <SettingsRow
            icon="lock"
            label="Privacy & Data"
            subtitle="Consent, Export, Erasure & DPDP Controls"
            onPress={() => router.push("/privacy-and-data" as never)}
          />
          <SettingsRow
            icon="shield"
            label="Privacy Notice"
            onPress={() => router.push("/privacy")}
          />
          <SettingsRow
            icon="file-text"
            label="Terms of Service"
            onPress={() => router.push("/terms")}
          />
          <InfoRow icon="info" label="Version" value={APP_VERSION} />
        </View>
      </View>

      {/* Sign Out / Connect Account */}
      <View style={styles.group}>
        {authState?.isAuthenticated ? (
          <Pressable
            onPress={() => {
              Alert.alert(
                "Sign Out",
                "Your financial records will safely remain on this device. You can sign back in anytime.",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Sign Out",
                    style: "destructive",
                    onPress: async () => {
                      await signOut();
                      router.replace("/welcome" as never);
                    },
                  },
                ],
              );
            }}
            style={({ pressed }) => [
              styles.signOutBtn,
              { backgroundColor: colors.surface },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={[styles.signOutText, { color: colors.error }]}>
              Sign Out
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => void handleGoogleSignIn()}
            disabled={signingIn}
            style={({ pressed }) => [
              styles.signOutBtn,
              { backgroundColor: colors.surface },
              (pressed || signingIn) && { opacity: 0.7 },
            ]}
          >
            {signingIn ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={[styles.signOutText, { color: colors.primary }]}>
                Sign in with Google
              </Text>
            )}
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    marginBottom: spacing[4],
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  notifBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Avatar
  avatarSection: {
    alignItems: "center",
    marginBottom: spacing[6],
    gap: spacing[2],
  },
  avatarContainer: {
    position: "relative",
    marginBottom: spacing[2],
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  avatarText: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.semibold,
  },
  profileName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
  },
  profileEmail: {
    fontSize: fontSize.sm,
  },
  profileSub: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },

  // Groups
  group: {
    paddingHorizontal: spacing[4],
    marginBottom: spacing[4],
  },
  groupCard: {
    borderRadius: radius.lg,
    overflow: "hidden",
  },

  // Rows
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    padding: spacing[4],
    minHeight: 56,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  rowContent: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  rowSubtitle: {
    fontSize: fontSize.xs,
  },

  // Sign out
  signOutBtn: {
    borderRadius: radius.lg,
    padding: spacing[4],
    alignItems: "center",
  },
  signOutText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
});
