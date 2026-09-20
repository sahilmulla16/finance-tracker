import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
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

export default function QuickAddSettingsScreen() {
  const { quickAddSettings, updateQuickAddSettings, accounts, categories } =
    useFinance();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  // Local state for toggles and settings
  const [volumeDownTrigger, setVolumeDownTrigger] = useState(
    quickAddSettings.volumeDownTrigger,
  );
  const [homeShortcutTrigger, setHomeShortcutTrigger] = useState(
    quickAddSettings.homeShortcutTrigger,
  );
  const [quickSettingsTrigger, setQuickSettingsTrigger] = useState(
    quickAddSettings.quickSettingsTrigger,
  );
  const [lockScreenTrigger, setLockScreenTrigger] = useState(
    quickAddSettings.lockScreenTrigger,
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

  // Modals for selection
  const [accountModalVisible, setAccountModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const selectedAccount =
    accounts.find((a) => a.id === defaultAccountId) ||
    accounts.find((a) => a.isDefault) ||
    accounts[0];
  const selectedCategory = defaultCategoryId
    ? categories.find((c) => c.id === defaultCategoryId)
    : null;

  const handleVolumeDownToggle = (enabled: boolean) => {
    setVolumeDownTrigger(enabled);
    if (enabled && Platform.OS === "android") {
      Alert.alert(
        "Android Permission Required",
        "To detect 2× Volume Down, Android requires enabling Pocketflow in Accessibility Settings.\n\nWould you like to open Accessibility Settings now?",
        [
          { text: "Later", style: "cancel" },
          {
            text: "Open Settings",
            onPress: () => {
              void Linking.sendIntent(
                "android.settings.ACCESSIBILITY_SETTINGS",
              ).catch(() => {
                void Linking.openSettings();
              });
            },
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
              Double-press Volume Down to summon the Pocketflow HUD from
              anywhere without opening the app.
            </Text>
          </View>
        </View>

        {/* Triggers Section */}
        <SectionHeader title="Triggers" />
        <Card style={styles.card}>
          <ListItem
            title="🔊 2× Volume Down"
            subtitle="Double-press Volume Down from anywhere"
            trailing={
              <Toggle
                value={volumeDownTrigger}
                onValueChange={handleVolumeDownToggle}
              />
            }
          />
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <ListItem
            title="⚡ Home Screen Shortcut"
            subtitle="Long-press app icon on home screen"
            trailing={
              <Toggle
                value={homeShortcutTrigger}
                onValueChange={setHomeShortcutTrigger}
              />
            }
          />
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <ListItem
            title="⚙️ Quick Settings"
            subtitle="Tile in Android notification shade"
            trailing={
              <Toggle
                value={quickSettingsTrigger}
                onValueChange={setQuickSettingsTrigger}
              />
            }
          />
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <ListItem
            title="🔔 Lock Screen"
            subtitle="Show HUD directly over lock screen"
            trailing={
              <Toggle
                value={lockScreenTrigger}
                onValueChange={setLockScreenTrigger}
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
            trailing={
              <Feather name="chevron-right" size={18} color={colors.fgMuted} />
            }
          />
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <ListItem
            title="Category"
            subtitle={
              selectedCategory ? selectedCategory.name : "Ask Every Time"
            }
            onPress={() => setCategoryModalVisible(true)}
            trailing={
              <Feather name="chevron-right" size={18} color={colors.fgMuted} />
            }
          />
        </Card>

        {/* Accessibility Helper button if Volume Down enabled on Android */}
        {Platform.OS === "android" && volumeDownTrigger && (
          <Pressable
            style={[
              styles.accessibilityLink,
              {
                backgroundColor: `${colors.primary}12`,
                borderColor: `${colors.primary}30`,
              },
            ]}
            onPress={() => {
              void Linking.sendIntent(
                "android.settings.ACCESSIBILITY_SETTINGS",
              ).catch(() => {
                void Linking.openSettings();
              });
            }}
          >
            <Feather name="settings" size={16} color={colors.primary} />
            <Text
              style={[styles.accessibilityLinkText, { color: colors.primary }]}
            >
              Open Android Accessibility Settings
            </Text>
          </Pressable>
        )}

        {/* Save Button */}
        <Pressable
          onPress={() => void handleSave()}
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.saveButtonText, { color: colors.onPrimary }]}>
            {savedSuccess ? "Saved ✓" : "Save"}
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
  accessibilityLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing[5],
  },
  accessibilityLinkText: {
    fontSize: 13,
    fontWeight: "600",
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
});
