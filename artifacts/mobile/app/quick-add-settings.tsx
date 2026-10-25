import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { AccessibilityDisclosureModal } from "@/components/AccessibilityDisclosureModal";
import {
  Alert,
  AppState,
  AppStateStatus,
  Linking,
  Modal,
  NativeModules,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Card } from "@/components/ui/Card";
import { ListItem } from "@/components/ui/ListItem";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Toggle } from "@/components/ui/Toggle";
import { BankLogo, CategoryVisual } from "@/components/ui";
import { radius, spacing } from "@/constants/tokens";
import {
  useFinance,
  type Account,
  type Category,
} from "@/context/FinanceContext";
import { useColors } from "@/hooks/useColors";

const CONSENT_STORAGE_KEY = "@pocketflow/accessibility_consent_granted";

export default function QuickAddSettingsScreen() {
  const params = useLocalSearchParams<{ focus?: string }>();
  const scrollRef = useRef<ScrollView>(null);
  const { quickAddSettings, updateQuickAddSettings, accounts, categories } =
    useFinance();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  // Local state for toggles and settings
  // Local state for triggers and settings
  const [volumeDownTrigger, setVolumeDownTrigger] = useState(
    quickAddSettings.volumeDownTrigger,
  );
  const [homeShortcutTrigger, setHomeShortcutTrigger] = useState(
    quickAddSettings.homeShortcutTrigger ?? true,
  );
  const [quickSettingsTrigger, setQuickSettingsTrigger] = useState(
    quickAddSettings.quickSettingsTrigger ?? true,
  );
  const [lockScreenTrigger, setLockScreenTrigger] = useState(
    quickAddSettings.lockScreenTrigger,
  );
  const [upiDetectionTrigger, setUpiDetectionTrigger] = useState(
    quickAddSettings.upiDetectionTrigger ?? true,
  );
  const [defaultAccountId, setDefaultAccountId] = useState(
    quickAddSettings.defaultAccountId ||
      accounts.find((a) => a.isDefault)?.id ||
      accounts[0]?.id ||
      "",
  );
  const [defaultCategoryId, setDefaultCategoryId] = useState<string | null>(
    quickAddSettings.defaultCategoryId,
  );

  // Accessibility Service runtime status & consent
  const [serviceStatus, setServiceStatus] = useState<
    "enabled" | "disabled" | "checking"
  >("checking");
  const [notifListenerStatus, setNotifListenerStatus] = useState<
    "enabled" | "disabled" | "checking"
  >("checking");
  const [disclosureModalVisible, setDisclosureModalVisible] = useState(false);
  const [hasConsented, setHasConsented] = useState(false);

  // Modals for selection
  const [accountModalVisible, setAccountModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const checkServiceEnabled = useCallback(async () => {
    if (Platform.OS !== "android") {
      setServiceStatus("disabled");
      return;
    }
    try {
      const isEnabled =
        await NativeModules.PocketflowQuickAdd?.isAccessibilityServiceEnabled();
      setServiceStatus(isEnabled ? "enabled" : "disabled");
    } catch {
      setServiceStatus("disabled");
    }
  }, []);

  const checkNotifListenerEnabled = useCallback(async () => {
    if (Platform.OS !== "android") {
      setNotifListenerStatus("disabled");
      return;
    }
    try {
      const isEnabled =
        await NativeModules.PocketflowQuickAdd?.isNotificationListenerEnabled();
      setNotifListenerStatus(isEnabled ? "enabled" : "disabled");
    } catch {
      setNotifListenerStatus("disabled");
    }
  }, []);

  useEffect(() => {
    // Read saved consent
    void AsyncStorage.getItem(CONSENT_STORAGE_KEY).then((val) => {
      setHasConsented(val === "true");
    });

    // Check service enablement
    void checkServiceEnabled();
    void checkNotifListenerEnabled();

    // Re-check service status when returning from Android Settings
    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        if (nextAppState === "active") {
          void checkServiceEnabled();
          void checkNotifListenerEnabled();
        }
      },
    );

    if (params.focus === "upi") {
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: 320, animated: true });
      }, 350);
    }

    return () => {
      subscription.remove();
    };
  }, [checkServiceEnabled, checkNotifListenerEnabled, params.focus]);

  const selectedAccount =
    accounts.find((a) => a.id === defaultAccountId) ||
    accounts.find((a) => a.isDefault) ||
    accounts[0];
  const selectedCategory = defaultCategoryId
    ? categories.find((c) => c.id === defaultCategoryId)
    : null;

  const openSystemAccessibilitySettings = () => {
    if (NativeModules.PocketflowQuickAdd?.openAccessibilitySettings) {
      void NativeModules.PocketflowQuickAdd.openAccessibilitySettings().catch(
        () => {
          void Linking.sendIntent(
            "android.settings.ACCESSIBILITY_SETTINGS",
          ).catch(() => {
            void Linking.openSettings();
          });
        },
      );
    } else {
      void Linking.sendIntent("android.settings.ACCESSIBILITY_SETTINGS").catch(
        () => {
          void Linking.openSettings();
        },
      );
    }
  };

  const handleVolumeDownToggle = async (enabled: boolean) => {
    if (enabled && Platform.OS === "android") {
      if (!hasConsented || serviceStatus !== "enabled") {
        setDisclosureModalVisible(true);
        return;
      }
    }
    setVolumeDownTrigger(enabled);
    void Haptics.selectionAsync();
    await updateQuickAddSettings({ volumeDownTrigger: enabled });
  };

  const handleDisclosureAgree = async () => {
    setDisclosureModalVisible(false);
    setHasConsented(true);
    setVolumeDownTrigger(true);
    await AsyncStorage.setItem(CONSENT_STORAGE_KEY, "true");
    await updateQuickAddSettings({ volumeDownTrigger: true });
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    openSystemAccessibilitySettings();
  };

  const handleDisclosureDecline = () => {
    setDisclosureModalVisible(false);
    setVolumeDownTrigger(false);
  };

  const handleOpenAccessibilityPress = () => {
    if (!hasConsented) {
      setDisclosureModalVisible(true);
    } else {
      openSystemAccessibilitySettings();
    }
  };

  const handleHomeShortcutToggle = async (enabled: boolean) => {
    setHomeShortcutTrigger(enabled);
    void Haptics.selectionAsync();
    await updateQuickAddSettings({ homeShortcutTrigger: enabled });
  };

  const handleQuickSettingsToggle = async (enabled: boolean) => {
    setQuickSettingsTrigger(enabled);
    void Haptics.selectionAsync();
    await updateQuickAddSettings({ quickSettingsTrigger: enabled });
  };

  const handleLockScreenToggle = async (enabled: boolean) => {
    setLockScreenTrigger(enabled);
    void Haptics.selectionAsync();
    await updateQuickAddSettings({ lockScreenTrigger: enabled });
    if (enabled && Platform.OS === "android") {
      Alert.alert(
        "Lock Screen Permission",
        "On custom Android skins (MIUI, HyperOS, ColorOS, OneUI), make sure to enable 'Show on Lock Screen' in Android Settings > Apps > Zeno > Other Permissions.",
        [
          {
            text: "Open App Settings",
            onPress: () => {
              void Linking.openSettings();
            },
          },
        ],
      );
    }
  };

  const openSystemNotificationListenerSettings = () => {
    if (NativeModules.PocketflowQuickAdd?.openNotificationListenerSettings) {
      void NativeModules.PocketflowQuickAdd.openNotificationListenerSettings().catch(
        () => {
          void Linking.sendIntent(
            "android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS",
          ).catch(() => {
            void Linking.openSettings();
          });
        },
      );
    } else {
      void Linking.sendIntent(
        "android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS",
      ).catch(() => {
        void Linking.openSettings();
      });
    }
  };

  const openSystemAppDetailsSettings = () => {
    if (NativeModules.PocketflowQuickAdd?.openAppDetailsSettings) {
      void NativeModules.PocketflowQuickAdd.openAppDetailsSettings().catch(
        () => {
          void Linking.openSettings();
        },
      );
    } else {
      void Linking.openSettings();
    }
  };

  const handleTestPopup = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (NativeModules.PocketflowQuickAdd?.openQuickAddForDetectedPayment) {
      void NativeModules.PocketflowQuickAdd.openQuickAddForDetectedPayment(
        "150.00",
        "Google Pay",
        "UPI-TEST-102938",
      ).catch(() => {
        Alert.alert("Error", "Could not trigger Quick Add category popup.");
      });
    }
  };

  const handleUpiDetectionToggle = async (enabled: boolean) => {
    setUpiDetectionTrigger(enabled);
    void Haptics.selectionAsync();
    await updateQuickAddSettings({ upiDetectionTrigger: enabled });

    if (
      enabled &&
      Platform.OS === "android" &&
      notifListenerStatus !== "enabled"
    ) {
      Alert.alert(
        "Notification Access Required",
        "Zeno parses payment notifications 100% on-device to detect outgoing UPI expenses without external servers or SMS access. Please grant Notification Access in Android Settings.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Open Settings",
            onPress: openSystemNotificationListenerSettings,
          },
        ],
      );
    }
  };

  const handleSave = async () => {
    await updateQuickAddSettings({
      volumeDownTrigger,
      homeShortcutTrigger,
      quickSettingsTrigger,
      lockScreenTrigger,
      upiDetectionTrigger,
      defaultAccountId,
      defaultCategoryId,
    });
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSavedSuccess(true);
    setTimeout(() => {
      router.back();
    }, 400);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.canvas }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing[4] }]}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.surface }]}
        >
          <Feather name="arrow-left" size={20} color={colors.fg} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.fg }]}>
          Quick Add
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner */}
        <View style={[styles.heroCard, { backgroundColor: colors.surface }]}>
          <View
            style={[
              styles.heroIconBadge,
              { backgroundColor: `${colors.primary}20` },
            ]}
          >
            <Feather name="zap" size={24} color={colors.primary} />
          </View>
          <View style={styles.heroTextContainer}>
            <Text style={[styles.heroTitle, { color: colors.fg }]}>
              Instant Expense Logging
            </Text>
            <Text style={[styles.heroSubtitle, { color: colors.fgMuted }]}>
              Double-press Volume Down to summon the Zeno HUD from anywhere
              without opening the app.
            </Text>
          </View>
        </View>

        {/* Triggers Section */}
        <SectionHeader title="Triggers & Launchers" />
        <Card style={styles.card}>
          {/* 1. 2x Volume Down */}
          <ListItem
            title="🔊 2× Volume Down"
            subtitle={
              serviceStatus === "enabled"
                ? "Status: Active • Double-press from anywhere"
                : "Status: Not active in Android Settings • Tap setup below"
            }
            trailing={
              <Toggle
                value={volumeDownTrigger}
                onValueChange={handleVolumeDownToggle}
              />
            }
          />

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          {/* 2. Lock Screen */}
          {/* 2. Quick Settings Tile */}
          <ListItem
            title="⚡ Quick Settings Tile"
            subtitle="Add tile to notification shade for 1-tap logging"
            trailing={
              <Toggle
                value={quickSettingsTrigger}
                onValueChange={handleQuickSettingsToggle}
              />
            }
          />

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          {/* 3. Home Launcher Shortcut */}
          <ListItem
            title="🚀 Home Screen Shortcut"
            subtitle="Long-press app icon to quickly record an expense"
            trailing={
              <Toggle
                value={homeShortcutTrigger}
                onValueChange={handleHomeShortcutToggle}
              />
            }
          />

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          {/* 4. Lock Screen */}
          <ListItem
            title="🔔 Lock Screen"
            subtitle="Show HUD directly over lock screen without unlocking"
            trailing={
              <Toggle
                value={lockScreenTrigger}
                onValueChange={handleLockScreenToggle}
              />
            }
          />
        </Card>

        {/* Quick Add Defaults */}
        <SectionHeader title="Quick Add Defaults" />
        <Card style={styles.card}>
          <ListItem
            title="Default Account"
            subtitle={selectedAccount ? selectedAccount.name : "Select account"}
            onPress={() => setAccountModalVisible(true)}
          />
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <ListItem
            title="Category"
            subtitle={
              selectedCategory ? selectedCategory.name : "Ask Every Time"
            }
            onPress={() => setCategoryModalVisible(true)}
          />
        </Card>

        {/* Visual Accessibility Step-by-Step Guide */}
        <SectionHeader title="Accessibility Setup Guide" />
        <View
          style={[
            styles.visualGuideCard,
            {
              backgroundColor: colors.surface,
              borderColor: `${colors.primary}35`,
            },
          ]}
        >
          <View style={styles.guideHeader}>
            <View
              style={[
                styles.guideIconBadge,
                { backgroundColor: `${colors.primary}20` },
              ]}
            >
              <Feather name="shield" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.guideMainTitle, { color: colors.fg }]}>
                How to Enable 2× Volume Down
              </Text>
              <Text style={[styles.guideSubtitle, { color: colors.fgMuted }]}>
                Follow these 4 simple steps in Android Settings:
              </Text>
            </View>
          </View>

          {/* Step 1 */}
          <View style={styles.stepCard}>
            <View
              style={[
                styles.stepNumCircle,
                { backgroundColor: colors.primary },
              ]}
            >
              <Text style={[styles.stepNumText, { color: colors.onPrimary }]}>
                1
              </Text>
            </View>
            <View style={styles.stepTextContainer}>
              <Text style={[styles.stepTitle, { color: colors.fg }]}>
                Click "Open Accessibility Settings" below
              </Text>
              <Text style={[styles.stepSubtitle, { color: colors.fgMuted }]}>
                Takes you directly into your phone's Accessibility menu.
              </Text>
            </View>
          </View>

          {/* Step 2 */}
          <View style={styles.stepCard}>
            <View
              style={[
                styles.stepNumCircle,
                { backgroundColor: colors.primary },
              ]}
            >
              <Text style={[styles.stepNumText, { color: colors.onPrimary }]}>
                2
              </Text>
            </View>
            <View style={styles.stepTextContainer}>
              <Text style={[styles.stepTitle, { color: colors.fg }]}>
                Click on "Downloaded Apps" (or "Installed Services")
              </Text>
              <Text style={[styles.stepSubtitle, { color: colors.fgMuted }]}>
                Scroll down until you see the Downloaded section.
              </Text>
              {/* Simulated UI Row */}
              <View
                style={[
                  styles.visualMockRow,
                  {
                    backgroundColor: colors.surfaceRecessed,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Feather name="folder" size={14} color={colors.primary} />
                <Text
                  style={[styles.visualMockText, { color: colors.fg, flex: 1 }]}
                >
                  Downloaded Apps / Installed Services
                </Text>
                <Feather
                  name="chevron-right"
                  size={14}
                  color={colors.fgSubtle}
                />
              </View>
            </View>
          </View>

          {/* Step 3 */}
          <View style={styles.stepCard}>
            <View
              style={[
                styles.stepNumCircle,
                { backgroundColor: colors.primary },
              ]}
            >
              <Text style={[styles.stepNumText, { color: colors.onPrimary }]}>
                3
              </Text>
            </View>
            <View style={styles.stepTextContainer}>
              <Text style={[styles.stepTitle, { color: colors.fg }]}>
                Select "Zeno"
              </Text>
              <Text style={[styles.stepSubtitle, { color: colors.fgMuted }]}>
                Tap on Zeno in your downloaded apps list.
              </Text>
              {/* Simulated UI Row */}
              <View
                style={[
                  styles.visualMockRow,
                  {
                    backgroundColor: colors.surfaceRecessed,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Feather name="zap" size={14} color={colors.primary} />
                <Text
                  style={[styles.visualMockText, { color: colors.fg, flex: 1 }]}
                >
                  Zeno
                </Text>
                <Text
                  style={[styles.visualMockStatus, { color: colors.fgMuted }]}
                >
                  Off
                </Text>
                <Feather
                  name="chevron-right"
                  size={14}
                  color={colors.fgSubtle}
                />
              </View>
            </View>
          </View>

          {/* Step 4 */}
          <View style={styles.stepCard}>
            <View
              style={[
                styles.stepNumCircle,
                { backgroundColor: colors.primary },
              ]}
            >
              <Text style={[styles.stepNumText, { color: colors.onPrimary }]}>
                4
              </Text>
            </View>
            <View style={styles.stepTextContainer}>
              <Text style={[styles.stepTitle, { color: colors.fg }]}>
                Turn it ON & Tap "Allow"
              </Text>
              <Text style={[styles.stepSubtitle, { color: colors.fgMuted }]}>
                Toggle the switch to ON and confirm by tapping "Allow".
              </Text>
              {/* Simulated UI Row */}
              <View
                style={[
                  styles.visualMockRow,
                  {
                    backgroundColor: `${colors.primary}12`,
                    borderColor: `${colors.primary}40`,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.visualMockText,
                    { color: colors.primary, flex: 1 },
                  ]}
                >
                  Use Zeno
                </Text>
                <View
                  style={[
                    styles.visualMockToggle,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <View style={styles.visualMockToggleThumb} />
                </View>
              </View>
            </View>
          </View>

          {/* Primary Action Button */}
          <Pressable
            style={[styles.guideActionBtn, { backgroundColor: colors.primary }]}
            onPress={handleOpenAccessibilityPress}
          >
            <Feather name="external-link" size={16} color={colors.onPrimary} />
            <Text
              style={[styles.guideActionBtnText, { color: colors.onPrimary }]}
            >
              Open Android Accessibility Settings
            </Text>
          </Pressable>
        </View>

        {/* Save Button */}
        <Pressable
          onPress={() => void handleSave()}
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.saveButtonText, { color: colors.onPrimary }]}>
            {savedSuccess ? "Saved" : "Save"}
          </Text>
          <Feather
            name={savedSuccess ? "check" : "check-circle"}
            size={18}
            color={colors.onPrimary}
          />
        </Pressable>
      </ScrollView>

      {/* Account Picker Modal */}
      <Modal
        visible={accountModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAccountModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setAccountModalVisible(false)}
          />
          <View
            style={[styles.pickerModal, { backgroundColor: colors.surface }]}
          >
            <View
              style={[styles.handle, { backgroundColor: colors.fgSubtle }]}
            />
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.fg }]}>
                Select Default Account
              </Text>
              <Pressable onPress={() => setAccountModalVisible(false)}>
                <Feather name="x" size={20} color={colors.fgMuted} />
              </Pressable>
            </View>
            <ScrollView style={{ maxHeight: 300 }}>
              {accounts.map((account) => {
                const isSelected = account.id === defaultAccountId;
                return (
                  <Pressable
                    key={account.id}
                    onPress={() => {
                      setDefaultAccountId(account.id);
                      setAccountModalVisible(false);
                    }}
                    style={[
                      styles.modalOption,
                      isSelected && { backgroundColor: `${colors.primary}15` },
                    ]}
                  >
                    <BankLogo
                      accountName={account.name}
                      accountType={account.type}
                      size="small"
                    />
                    <View style={styles.modalOptionTextContainer}>
                      <Text
                        style={[
                          styles.modalOptionTitle,
                          { color: isSelected ? colors.primary : colors.fg },
                        ]}
                      >
                        {account.name}
                      </Text>
                      <Text
                        style={[
                          styles.modalOptionSubtitle,
                          { color: colors.fgMuted },
                        ]}
                      >
                        {account.type}
                      </Text>
                    </View>
                    {isSelected && (
                      <Feather name="check" size={18} color={colors.primary} />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Category Picker Modal */}
      <Modal
        visible={categoryModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setCategoryModalVisible(false)}
          />
          <View
            style={[styles.pickerModal, { backgroundColor: colors.surface }]}
          >
            <View
              style={[styles.handle, { backgroundColor: colors.fgSubtle }]}
            />
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.fg }]}>
                Select Category
              </Text>
              <Pressable onPress={() => setCategoryModalVisible(false)}>
                <Feather name="x" size={20} color={colors.fgMuted} />
              </Pressable>
            </View>
            <ScrollView style={{ maxHeight: 360 }}>
              {/* Ask every time option */}
              <Pressable
                onPress={() => {
                  setDefaultCategoryId(null);
                  setCategoryModalVisible(false);
                }}
                style={[
                  styles.modalOption,
                  defaultCategoryId === null && {
                    backgroundColor: `${colors.primary}15`,
                  },
                ]}
              >
                <View style={styles.modalOptionTextContainer}>
                  <Text
                    style={[
                      styles.modalOptionTitle,
                      {
                        color:
                          defaultCategoryId === null
                            ? colors.primary
                            : colors.fg,
                      },
                    ]}
                  >
                    Ask Every Time
                  </Text>
                  <Text
                    style={[
                      styles.modalOptionSubtitle,
                      { color: colors.fgMuted },
                    ]}
                  >
                    Shows category pills on every Quick Add
                  </Text>
                </View>
                {defaultCategoryId === null && (
                  <Feather name="check" size={18} color={colors.primary} />
                )}
              </Pressable>

              <View
                style={[
                  styles.divider,
                  { backgroundColor: colors.divider, marginVertical: 4 },
                ]}
              />

              {/* Individual categories */}
              {categories
                .filter(
                  (c) => c.type === "expense" || c.type === "both" || !c.type,
                )
                .map((cat) => {
                  const isSelected = cat.id === defaultCategoryId;
                  return (
                    <Pressable
                      key={cat.id}
                      onPress={() => {
                        setDefaultCategoryId(cat.id);
                        setCategoryModalVisible(false);
                      }}
                      style={[
                        styles.modalOption,
                        isSelected && {
                          backgroundColor: `${colors.primary}15`,
                        },
                      ]}
                    >
                      <CategoryVisual
                        categoryName={cat.name}
                        iconName={cat.icon}
                        size="small"
                      />
                      <View style={styles.modalOptionTextContainer}>
                        <Text
                          style={[
                            styles.modalOptionTitle,
                            { color: isSelected ? colors.primary : colors.fg },
                          ]}
                        >
                          {cat.name}
                        </Text>
                      </View>
                      {isSelected && (
                        <Feather
                          name="check"
                          size={18}
                          color={colors.primary}
                        />
                      )}
                    </Pressable>
                  );
                })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Prominent Accessibility Disclosure Modal */}
      <AccessibilityDisclosureModal
        visible={disclosureModalVisible}
        onAgree={handleDisclosureAgree}
        onDecline={handleDisclosureDecline}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
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
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  content: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
  },
  heroCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing[4],
    borderRadius: radius.xl,
    marginBottom: spacing[4],
    gap: spacing[3],
  },
  heroIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  heroTextContainer: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  heroSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  card: {
    overflow: "hidden",
    marginBottom: spacing[4],
  },
  divider: {
    height: 1,
    marginHorizontal: spacing[4],
  },
  visualGuideCard: {
    borderRadius: radius.xl,
    padding: spacing[4],
    borderWidth: 1,
    marginBottom: spacing[4],
    gap: spacing[3],
  },
  guideHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    marginBottom: spacing[2],
  },
  guideIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  guideMainTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  guideSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  stepCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing[3],
    paddingVertical: spacing[2],
  },
  stepNumCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  stepNumText: {
    fontSize: 12,
    fontWeight: "700",
  },
  stepTextContainer: {
    flex: 1,
    gap: 2,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  stepSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  visualMockRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: 6,
    gap: spacing[2],
  },
  visualMockText: {
    fontSize: 13,
    fontWeight: "600",
  },
  visualMockStatus: {
    fontSize: 12,
  },
  visualMockToggle: {
    width: 36,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "flex-end",
    paddingHorizontal: 2,
  },
  visualMockToggleThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
  },
  guideActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    height: 46,
    borderRadius: radius.lg,
    marginTop: spacing[2],
  },
  guideActionBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    height: 52,
    borderRadius: radius.lg,
    marginTop: spacing[2],
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  pickerModal: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing[4],
    paddingBottom: spacing[6],
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: spacing[3],
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing[3],
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: radius.md,
  },
  modalOptionTextContainer: {
    flex: 1,
    marginLeft: spacing[2],
  },
  modalOptionTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  modalOptionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  catIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  disclosureBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing[4],
  },
  disclosureCard: {
    width: "100%",
    maxWidth: 380,
    borderRadius: radius.xl,
    padding: spacing[5],
    borderWidth: 1,
    alignItems: "center",
  },
  disclosureIconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing[3],
  },
  disclosureTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: spacing[3],
  },
  disclosureBody: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    marginBottom: spacing[5],
  },
  disclosureActions: {
    width: "100%",
    gap: spacing[2],
  },
  disclosurePrimaryBtn: {
    height: 48,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  disclosurePrimaryBtnText: {
    fontSize: 15,
    fontWeight: "700",
  },
  disclosureSecondaryBtn: {
    height: 44,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  disclosureSecondaryBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
