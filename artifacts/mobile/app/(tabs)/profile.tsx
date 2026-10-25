import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Sentry from "@sentry/react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

import { useFinance } from "@/context/FinanceContext";
import { useWalkthrough } from "@/context/WalkthroughContext";
import { useColors } from "@/hooks/useColors";
import { spacing, radius, fontSize, fontWeight } from "@/constants/tokens";
import { QuickAddLogo, PremiumLoader } from "@/components/ui";
import { ProfileScreenSkeleton } from "@/components/skeletons";
import { saveProfileImage, getValidProfileImageUri } from "@/services/profileImageService";

const APP_VERSION = "1.0.0";

function SettingsRow({
  icon,
  customIcon,
  label,
  subtitle,
  iconColor,
  badge,
  onPress,
  showDivider = false,
}: {
  icon?: string;
  customIcon?: React.ReactNode;
  label: string;
  subtitle?: string;
  iconColor?: string;
  badge?: string;
  onPress: () => void;
  showDivider?: boolean;
}) {
  const colors = useColors();
  return (
    <>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
      >
        {customIcon ? (
          customIcon
        ) : (
          <View
            style={[
              styles.rowIcon,
              { backgroundColor: colors.surfaceRecessed },
            ]}
          >
            <Feather
              name={icon as never}
              size={18}
              color={iconColor || colors.fgMuted}
            />
          </View>
        )}
        <View style={styles.rowContent}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={[styles.rowLabel, { color: colors.fg }]}>{label}</Text>
            {badge && (
              <View
                style={[
                  styles.badgePill,
                  { backgroundColor: colors.surfaceRecessed },
                ]}
              >
                <Text style={[styles.badgePillText, { color: colors.primary }]}>
                  {badge}
                </Text>
              </View>
            )}
          </View>
          {subtitle && (
            <Text style={[styles.rowSubtitle, { color: colors.fgMuted }]}>
              {subtitle}
            </Text>
          )}
        </View>
        <Feather name="chevron-right" size={18} color={colors.fgSubtle} />
      </Pressable>
      {showDivider && (
        <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />
      )}
    </>
  );
}

function InfoRow({
  icon,
  label,
  value,
  showDivider = false,
}: {
  icon: string;
  label: string;
  value: string;
  showDivider?: boolean;
}) {
  const colors = useColors();
  return (
    <>
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
      {showDivider && (
        <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />
      )}
    </>
  );
}

export default function ProfileScreen() {
  const {
    loading,
    settings,
    categories,
    accounts,
    exportData,
    updateSettings,
    unreadNotificationsCount,
    authState,
    signOut,
    resetOnboarding,
  } = useFinance();
  const { startWalkthroughManually } = useWalkthrough();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [pickingImage, setPickingImage] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [nameModalVisible, setNameModalVisible] = useState(false);
  const [tempName, setTempName] = useState(settings.profileName || "");

  // Verify and refresh profile image reference
  React.useEffect(() => {
    let isMounted = true;
    if (settings.profileImage) {
      void getValidProfileImageUri(settings.profileImage).then((validUri) => {
        if (isMounted) {
          setAvatarError(!validUri);
        }
      });
    } else {
      setAvatarError(false);
    }
    return () => {
      isMounted = false;
    };
  }, [settings.profileImage]);

  const handleSaveName = async () => {
    const trimmed = tempName.trim();
    if (trimmed) {
      await updateSettings({ profileName: trimmed });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setNameModalVisible(false);
  };

  const displayName = settings.profileName?.trim() || "My Profile";
  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "PF";

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
        // Persist to permanent storage before saving to profile settings
        const permanentUri = await saveProfileImage(result.assets[0].uri);
        await updateSettings({ profileImage: permanentUri });
        setAvatarError(false);
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err: unknown) {
      console.warn("Failed to save profile picture:", err);
      Alert.alert("Upload Failed", "Could not save your profile picture. Please try again.");
    } finally {
      setPickingImage(false);
    }
  };

  if (loading) {
    return <ProfileScreenSkeleton />;
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.canvas }]}>
      <ScrollView
        style={{ flex: 1 }}
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
            {settings.profileImage && !avatarError ? (
              <Image
                source={{ uri: settings.profileImage }}
                style={styles.avatarImage}
                onError={() => setAvatarError(true)}
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
            <View
              style={[styles.editBadge, { backgroundColor: colors.primary }]}
            >
              {pickingImage ? (
                <PremiumLoader size={12} color={colors.onPrimary} />
              ) : (
                <Feather name="camera" size={12} color={colors.onPrimary} />
              )}
            </View>
          </Pressable>
          <Pressable
            onPress={() => {
              setTempName(
                settings.profileName && settings.profileName !== "User"
                  ? settings.profileName
                  : "",
              );
              setNameModalVisible(true);
            }}
            style={styles.nameRow}
            accessibilityLabel="Edit profile name"
          >
            <Text style={[styles.profileName, { color: colors.fg }]}>
              {displayName}
            </Text>
            <Feather
              name="edit-2"
              size={13}
              color={colors.primary}
              style={{ marginLeft: 6 }}
            />
          </Pressable>
          {authState?.email ? (
            <Text style={[styles.profileEmail, { color: colors.fgMuted }]}>
              {authState.email}
            </Text>
          ) : null}
          <Text style={[styles.profileSub, { color: colors.fgSubtle }]}>
            {accounts.length} accounts · {settings.currency}
          </Text>
        </View>

        {/* Section 1: Account & Preferences */}
        <View style={styles.group}>
          <Text style={[styles.sectionTitle, { color: colors.fgSubtle }]}>
            ACCOUNT & PREFERENCES
          </Text>
          <View style={[styles.groupCard, { backgroundColor: colors.surface }]}>
            <SettingsRow
              icon="credit-card"
              label="Accounts"
              subtitle={
                defaultAccount?.name
                  ? `Default: ${defaultAccount.name}`
                  : "Manage payment sources"
              }
              onPress={() => router.push("/accounts")}
              showDivider={true}
            />
            <SettingsRow
              icon="globe"
              label="Currency"
              subtitle={settings.currency}
              onPress={() => router.push("/currency")}
              showDivider={true}
            />
            <SettingsRow
              icon="trending-up"
              label="Insights"
              subtitle="Spending trends & analytics"
              onPress={() => router.push("/(tabs)/insights")}
              showDivider={true}
            />
            <SettingsRow
              icon="moon"
              label="Appearance"
              subtitle={
                settings.appearance.charAt(0).toUpperCase() +
                settings.appearance.slice(1)
              }
              onPress={() => router.push("/appearance")}
              showDivider={true}
            />
            <SettingsRow
              icon="tag"
              label="Categories"
              subtitle={`${categories.length} organized categories`}
              onPress={() => router.push("/categories")}
              showDivider={true}
            />
            <SettingsRow
              icon="target"
              label="Saving Goals"
              subtitle="Milestones & financial progress"
              onPress={() => router.push("/savings")}
              showDivider={true}
            />
            <SettingsRow
              icon="bell"
              label="Notification Settings"
              subtitle="Budget alerts, spending limits & summaries"
              onPress={() => router.push("/notification-settings" as never)}
              showDivider={false}
            />
          </View>
        </View>

        {/* Section 2: Experimental Features */}
        <View style={styles.group}>
          <Text style={[styles.sectionTitle, { color: colors.fgSubtle }]}>
            EXPERIMENTAL FEATURES
          </Text>
          <View style={[styles.groupCard, { backgroundColor: colors.surface }]}>
            <SettingsRow
              icon="message-square"
              label="Ask Zeno"
              subtitle="100% on-device private financial AI companion"
              onPress={() => router.push("/(tabs)/ai")}
              showDivider={true}
            />
            <SettingsRow
              customIcon={<QuickAddLogo size={36} />}
              label="Quick Add"
              subtitle="2× Volume Down instant expense logging"
              onPress={() => router.push("/quick-add-settings")}
              showDivider={true}
            />
            <SettingsRow
              icon="radio"
              iconColor={colors.primary}
              label="Smart Auto Track"
              subtitle="100% on-device UPI & Bank SMS detection"
              onPress={() => router.push("/smart-auto-track")}
              showDivider={true}
            />
            <SettingsRow
              icon="pie-chart"
              label="Budgets"
              subtitle="Monthly limits & category spending targets"
              onPress={() => router.push("/(tabs)/budgets")}
              showDivider={false}
            />
          </View>
        </View>

        {/* Section 3: Tools & Data */}
        <View style={styles.group}>
          <Text style={[styles.sectionTitle, { color: colors.fgSubtle }]}>
            DATA & TOOLS
          </Text>
          <View style={[styles.groupCard, { backgroundColor: colors.surface }]}>
            <SettingsRow
              icon="download"
              label="Export Data"
              subtitle="Save JSON full backup or CSV spreadsheet"
              onPress={() => router.push("/export-data" as never)}
              showDivider={true}
            />
            <SettingsRow
              icon="upload"
              label="Restore Backup"
              subtitle="Import records from backup file"
              onPress={() => router.push("/restore")}
              showDivider={true}
            />
            <SettingsRow
              icon="compass"
              label="Onboarding Walkthrough"
              subtitle="Test interactive guided tour"
              onPress={() => {
                router.replace("/(tabs)");
                setTimeout(() => {
                  startWalkthroughManually();
                }, 350);
              }}
              showDivider={true}
            />
            <SettingsRow
              icon="rotate-ccw"
              label="Reset & Test Onboarding"
              subtitle="Re-run 5-step welcome flow"
              onPress={async () => {
                await resetOnboarding();
                router.replace("/welcome" as never);
              }}
              showDivider={false}
            />
          </View>
        </View>

        {/* Section 3: Privacy & Policy */}
        <View style={styles.group}>
          <Text style={[styles.sectionTitle, { color: colors.fgSubtle }]}>
            PRIVACY & POLICY
          </Text>
          <View style={[styles.groupCard, { backgroundColor: colors.surface }]}>
            <SettingsRow
              icon="lock"
              label="Privacy & Data Controls"
              subtitle="Consent, Export, Erasure & DPDP Rights"
              onPress={() => router.push("/privacy-and-data" as never)}
              showDivider={true}
            />
            <SettingsRow
              icon="shield"
              label="Privacy Notice"
              subtitle="Zero third-party trackers or telemetry"
              onPress={() => router.push("/privacy")}
              showDivider={true}
            />
            <SettingsRow
              icon="file-text"
              label="Terms of Service"
              subtitle="Usage terms & local-first data policy"
              onPress={() => router.push("/terms")}
              showDivider={true}
            />
            <InfoRow
              icon="info"
              label="App Version"
              value={`v${APP_VERSION} (Production Build)`}
              showDivider={false}
            />
          </View>
        </View>

        {/* Sentry Test Event */}
        <View style={styles.group}>
          <Text style={[styles.sectionTitle, { color: colors.fgSubtle }]}>
            DIAGNOSTICS
          </Text>
          <View
            style={[
              styles.groupCard,
              {
                backgroundColor: colors.surface,
                padding: spacing[4],
                gap: spacing[2],
              },
            ]}
          >
            <Text style={{ fontSize: fontSize.xs, color: colors.fgMuted }}>
              Send a test exception to Sentry to verify error tracking:
            </Text>
            <Button
              title="Try!"
              color={colors.primary}
              onPress={() => {
                Sentry.captureException(new Error("First error"));
                Alert.alert(
                  "Sentry Event Sent",
                  "Successfully sent 'First error' test exception to Sentry!",
                );
              }}
            />
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
          ) : null}
        </View>
      </ScrollView>

      {/* Edit Name Modal */}
      <Modal
        visible={nameModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setNameModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalBackdrop}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setNameModalVisible(false)}
          />
          <View
            style={[
              styles.nameModalCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.surfaceRecessed,
              },
            ]}
          >
            <Text style={[styles.nameModalTitle, { color: colors.fg }]}>
              What can we call you?
            </Text>
            <View
              style={[
                styles.modalInputWrap,
                {
                  backgroundColor: colors.surfaceRecessed,
                  borderColor: colors.border,
                },
              ]}
            >
              <Feather
                name="user"
                size={18}
                color={colors.primary}
                style={{ marginRight: 10 }}
              />
              <TextInput
                value={tempName}
                onChangeText={setTempName}
                placeholder="Enter your name"
                placeholderTextColor={colors.fgSubtle}
                autoCapitalize="words"
                autoFocus
                returnKeyType="done"
                onSubmitEditing={() => void handleSaveName()}
                style={[styles.modalTextInput, { color: colors.fg }]}
              />
            </View>
            <View style={styles.modalBtnRow}>
              <Pressable
                onPress={() => setNameModalVisible(false)}
                style={[
                  styles.modalCancelBtn,
                  { backgroundColor: colors.surfaceRecessed },
                ]}
              >
                <Text
                  style={[styles.modalCancelText, { color: colors.fgMuted }]}
                >
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={() => void handleSaveName()}
                style={[
                  styles.modalSaveBtn,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Text
                  style={[styles.modalSaveText, { color: colors.onPrimary }]}
                >
                  Save
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
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
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.1,
    marginBottom: spacing[2],
    marginLeft: spacing[1],
    textTransform: "uppercase",
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
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 64,
  },
  badgePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  badgePillText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
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
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing[4],
  },
  nameModalCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    padding: spacing[5],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  nameModalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    marginBottom: spacing[4],
    textAlign: "center",
  },
  modalInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing[3],
    height: 48,
    marginBottom: spacing[4],
  },
  modalTextInput: {
    flex: 1,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  modalBtnRow: {
    flexDirection: "row",
    gap: spacing[3],
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  modalSaveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  modalSaveText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
});
