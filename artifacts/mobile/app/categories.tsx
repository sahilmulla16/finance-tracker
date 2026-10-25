import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import React, { useState, useEffect, useMemo } from "react";
import {
  Alert,
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useFinance,
  type Category,
  type CategoryType,
} from "@/context/FinanceContext";
import { useColors } from "@/hooks/useColors";
import { spacing, radius, fontSize, fontWeight } from "@/constants/tokens";
import { CategoryVisual, DeleteConfirmationModal } from "@/components/ui";
import { saveCategoryImage } from "@/services/profileImageService";
import {
  CATEGORY_VISUALS,
  type CategoryVisualId,
} from "@/constants/categoryVisuals";

const PALETTE = [
  "#059669", // Emerald
  "#10B981", // Mint
  "#0D9488", // Teal
  "#06B6D4", // Cyan
  "#0284C7", // Sky
  "#2563EB", // Blue
  "#4F46E5", // Indigo
  "#7C3AED", // Violet
  "#9333EA", // Purple
  "#C026D3", // Fuchsia
  "#DB2777", // Pink
  "#E11D48", // Rose
  "#EF4444", // Red
  "#EA580C", // Orange
  "#F59E0B", // Amber
  "#EAB308", // Yellow
  "#84CC16", // Lime
  "#16A34A", // Green
  "#475569", // Slate
  "#1E293B", // Navy / Dark
];

const FEATHER_ICONS = [
  "coffee",
  "shopping-cart",
  "shopping-bag",
  "navigation",
  "file-text",
  "heart",
  "music",
  "book-open",
  "map",
  "briefcase",
  "trending-up",
  "moon",
  "gift",
  "film",
  "tag",
  "smile",
  "award",
  "shield",
  "compass",
  "star",
  "zap",
  "tool",
  "camera",
  "phone",
  "globe",
  "truck",
  "home",
  "dollar-sign",
  "percent",
  "activity",
  "crosshair",
  "feather",
];

const ALL_LOGO_IDS: CategoryVisualId[] = [
  "fuel",
  "emi",
  "pets",
  "family",
  "savings",
  "taxes",
  "insurance",
  "gaming",
  "beauty",
  "cloud",
  "food",
  "groceries",
  "transport",
  "shopping",
  "bills",
  "health",
  "entertainment",
  "education",
  "travel",
  "fitness",
  "subscriptions",
  "salary",
  "investment",
  "freelance",
  "personal_care",
  "gifts",
  "rent",
  "deen",
  "other",
];

type QuickPreset = {
  name: string;
  logoId: CategoryVisualId;
  type: CategoryType;
  color: string;
};

const QUICK_PRESETS: QuickPreset[] = [
  { name: "Fuel & Gas", logoId: "fuel", type: "expense", color: "#FB923C" },
  { name: "Loans & EMI", logoId: "emi", type: "expense", color: "#8B5CF6" },
  { name: "Pets & Animals", logoId: "pets", type: "expense", color: "#F43F5E" },
  { name: "Savings & Vault", logoId: "savings", type: "expense", color: "#059669" },
  { name: "Family & Kids", logoId: "family", type: "expense", color: "#0284C7" },
  { name: "Taxes & Duties", logoId: "taxes", type: "expense", color: "#475569" },
  { name: "Insurance", logoId: "insurance", type: "expense", color: "#0D9488" },
  { name: "Gaming & Esports", logoId: "gaming", type: "expense", color: "#9333EA" },
  { name: "Beauty & Care", logoId: "beauty", type: "expense", color: "#DB2777" },
  { name: "Cloud & SaaS", logoId: "cloud", type: "expense", color: "#4F46E5" },
  { name: "Fitness & Gym", logoId: "fitness", type: "expense", color: "#EF4444" },
  { name: "Education", logoId: "education", type: "expense", color: "#2E90FA" },
  { name: "Travel & Trips", logoId: "travel", type: "expense", color: "#7A5AF8" },
  { name: "Deen & Sadqa", logoId: "deen", type: "expense", color: "#059669" },
];

function CategoryEditor({
  visible,
  initial,
  onClose,
}: {
  visible: boolean;
  initial?: Category;
  onClose: () => void;
}) {
  const { addCategory, updateCategory } = useFinance();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState(initial?.name || "");
  const [icon, setIcon] = useState(initial?.icon || "logo:fuel");
  const [color, setColor] = useState(initial?.color || PALETTE[0]);
  const [type, setType] = useState<CategoryType>(initial?.type || "expense");
  const [imageUrl, setImageUrl] = useState<string | undefined>(
    initial?.imageUrl,
  );
  const [visualMode, setVisualMode] = useState<"logos" | "icons" | "photo">(
    initial?.imageUrl
      ? "photo"
      : initial?.icon?.startsWith("logo:")
        ? "logos"
        : "logos",
  );

  useEffect(() => {
    if (initial) {
      setName(initial.name);
      setIcon(initial.icon || "logo:fuel");
      setColor(initial.color || PALETTE[0]);
      setType(initial.type || "expense");
      setImageUrl(initial.imageUrl);
      if (initial.imageUrl) {
        setVisualMode("photo");
      } else if (initial.icon?.startsWith("logo:")) {
        setVisualMode("logos");
      } else if (ALL_LOGO_IDS.includes(initial.icon as CategoryVisualId)) {
        setIcon("logo:" + initial.icon);
        setVisualMode("logos");
      } else {
        setVisualMode("icons");
      }
    } else {
      setName("");
      setIcon("logo:fuel");
      setColor(PALETTE[0]);
      setType("expense");
      setImageUrl(undefined);
      setVisualMode("logos");
    }
  }, [initial, visible]);

  const handleApplyPreset = (preset: QuickPreset) => {
    setName(preset.name);
    setIcon("logo:" + preset.logoId);
    setColor(preset.color);
    setType(preset.type);
    setImageUrl(undefined);
    setVisualMode("logos");
  };

  const handlePickLogo = (logoId: CategoryVisualId) => {
    const visual = CATEGORY_VISUALS[logoId];
    setIcon("logo:" + logoId);
    if (visual?.palette?.primary) {
      setColor(visual.palette.primary);
    }
    setImageUrl(undefined);
  };

  const handlePickIcon = (iconName: string) => {
    setIcon(iconName);
    setImageUrl(undefined);
  };

  const handlePickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please allow photo access to choose a category picture.",
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        const permanentUri = await saveCategoryImage(result.assets[0].uri);
        setImageUrl(permanentUri);
        setVisualMode("photo");
      }
    } catch (err) {
      console.warn("Failed to pick image:", err);
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please allow camera access to take a category picture.",
        );
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        const permanentUri = await saveCategoryImage(result.assets[0].uri);
        setImageUrl(permanentUri);
        setVisualMode("photo");
      }
    } catch (err) {
      console.warn("Failed to take photo:", err);
    }
  };

  const handleRemoveImage = () => {
    setImageUrl(undefined);
    setVisualMode("logos");
    if (!icon || icon.startsWith("file:")) {
      setIcon("logo:other");
    }
  };

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert("Missing Name", "Please enter a name for this category.");
      return;
    }
    if (initial) {
      await updateCategory({
        ...initial,
        name: trimmed,
        icon,
        color,
        type,
        imageUrl,
      });
    } else {
      await addCategory(trimmed, icon, color, type, imageUrl);
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.modalBackdrop}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={[
            styles.editor,
            {
              backgroundColor: colors.surface,
              maxHeight: "92%",
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: colors.fgSubtle }]} />

          <View style={styles.editorHeader}>
            <Text style={[styles.editorTitle, { color: colors.fg }]}>
              {initial ? "Edit Category" : "New Category"}
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              style={[
                styles.closeIconBtn,
                { backgroundColor: colors.surfaceRecessed },
              ]}
            >
              <Feather name="x" size={18} color={colors.fgMuted} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[
              styles.scrollInner,
              { paddingBottom: Math.max(insets.bottom + 16, 24) },
            ]}
          >
            {/* Visual Live Preview Banner */}
            <View
              style={[
                styles.previewContainer,
                {
                  backgroundColor: colors.surfaceRecessed,
                  borderColor: colors.border,
                },
              ]}
            >
              <CategoryVisual
                categoryName={name || "Preview"}
                iconName={icon}
                color={color}
                imageUrl={imageUrl}
                size="large"
                showBorder
              />
              <View style={styles.previewInfo}>
                <Text
                  style={[styles.previewName, { color: colors.fg }]}
                  numberOfLines={1}
                >
                  {name.trim() || "Category Name"}
                </Text>
                <View style={styles.previewBadgeRow}>
                  <View
                    style={[
                      styles.typeBadge,
                      {
                        backgroundColor:
                          type === "expense"
                            ? `${colors.error}20`
                            : `${colors.primary}20`,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.typeBadgeText,
                        {
                          color:
                            type === "expense" ? colors.error : colors.primary,
                        },
                      ]}
                    >
                      {type === "expense" ? "Expense" : "Income"}
                    </Text>
                  </View>
                  {imageUrl ? (
                    <View
                      style={[
                        styles.typeBadge,
                        { backgroundColor: `${colors.primary}20` },
                      ]}
                    >
                      <Text
                        style={[
                          styles.typeBadgeText,
                          { color: colors.primary },
                        ]}
                      >
                        Custom Photo
                      </Text>
                    </View>
                  ) : icon.startsWith("logo:") ? (
                    <View
                      style={[
                        styles.typeBadge,
                        { backgroundColor: `${color}25` },
                      ]}
                    >
                      <Text style={[styles.typeBadgeText, { color }]}>
                        Vector Logo
                      </Text>
                    </View>
                  ) : (
                    <View
                      style={[
                        styles.typeBadge,
                        { backgroundColor: `${color}25` },
                      ]}
                    >
                      <Text style={[styles.typeBadgeText, { color }]}>
                        Custom Color
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Category Name Input */}
            <Text style={[styles.label, { color: colors.fgMuted }]}>
              CATEGORY NAME
            </Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: colors.surfaceRecessed,
                  borderColor: colors.border,
                },
              ]}
            >
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Fuel, Loans, Pet Care..."
                placeholderTextColor={colors.fgSubtle}
                style={[styles.textInput, { color: colors.fg }]}
                returnKeyType="done"
              />
              {name.length > 0 && (
                <Pressable onPress={() => setName("")} hitSlop={6}>
                  <Feather name="x-circle" size={16} color={colors.fgSubtle} />
                </Pressable>
              )}
            </View>

            {/* Quick Presets Carousel */}
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.label, { color: colors.fgMuted }]}>
                POPULAR PRESETS
              </Text>
              <Text style={[styles.subHint, { color: colors.fgSubtle }]}>
                Tap to auto-fill
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.presetsRow}
            >
              {QUICK_PRESETS.map((p) => {
                const isMatching =
                  name.toLowerCase() === p.name.toLowerCase() &&
                  icon === "logo:" + p.logoId;
                return (
                  <Pressable
                    key={p.logoId}
                    onPress={() => handleApplyPreset(p)}
                    style={[
                      styles.presetChip,
                      {
                        backgroundColor: isMatching
                          ? colors.primary
                          : colors.surfaceRecessed,
                        borderColor: isMatching
                          ? colors.primary
                          : colors.border,
                      },
                    ]}
                  >
                    <CategoryVisual
                      iconName={"logo:" + p.logoId}
                      size={20}
                    />
                    <Text
                      style={[
                        styles.presetChipText,
                        {
                          color: isMatching ? colors.onPrimary : colors.fg,
                          fontWeight: isMatching
                            ? fontWeight.semibold
                            : fontWeight.medium,
                        },
                      ]}
                    >
                      {p.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Category Type (Expense / Income) */}
            <Text style={[styles.label, { color: colors.fgMuted }]}>
              TRANSACTION TYPE
            </Text>
            <View
              style={[
                styles.typeToggleRow,
                { backgroundColor: colors.surfaceRecessed },
              ]}
            >
              <Pressable
                onPress={() => setType("expense")}
                style={[
                  styles.typeTab,
                  type === "expense" && {
                    backgroundColor: colors.surface,
                    shadowColor: "#000",
                    shadowOpacity: 0.1,
                    shadowRadius: 3,
                    elevation: 2,
                  },
                ]}
              >
                <Feather
                  name="arrow-down-left"
                  size={15}
                  color={type === "expense" ? colors.error : colors.fgMuted}
                />
                <Text
                  style={[
                    styles.typeTabText,
                    {
                      color: type === "expense" ? colors.fg : colors.fgMuted,
                      fontWeight:
                        type === "expense"
                          ? fontWeight.semibold
                          : fontWeight.medium,
                    },
                  ]}
                >
                  Expense
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setType("income")}
                style={[
                  styles.typeTab,
                  type === "income" && {
                    backgroundColor: colors.surface,
                    shadowColor: "#000",
                    shadowOpacity: 0.1,
                    shadowRadius: 3,
                    elevation: 2,
                  },
                ]}
              >
                <Feather
                  name="arrow-up-right"
                  size={15}
                  color={type === "income" ? colors.primary : colors.fgMuted}
                />
                <Text
                  style={[
                    styles.typeTabText,
                    {
                      color: type === "income" ? colors.fg : colors.fgMuted,
                      fontWeight:
                        type === "income"
                          ? fontWeight.semibold
                          : fontWeight.medium,
                    },
                  ]}
                >
                  Income
                </Text>
              </Pressable>
            </View>

            {/* Customization Mode Tabs: Logos | Icons | Photo */}
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.label, { color: colors.fgMuted }]}>
                VISUAL STYLE
              </Text>
            </View>
            <View
              style={[
                styles.modeTabsRow,
                { backgroundColor: colors.surfaceRecessed },
              ]}
            >
              <Pressable
                onPress={() => setVisualMode("logos")}
                style={[
                  styles.modeTab,
                  visualMode === "logos" && {
                    backgroundColor: colors.surface,
                    shadowColor: "#000",
                    shadowOpacity: 0.1,
                    shadowRadius: 3,
                    elevation: 2,
                  },
                ]}
              >
                <Feather
                  name="grid"
                  size={14}
                  color={visualMode === "logos" ? colors.primary : colors.fgMuted}
                />
                <Text
                  style={[
                    styles.modeTabText,
                    {
                      color:
                        visualMode === "logos" ? colors.fg : colors.fgMuted,
                      fontWeight:
                        visualMode === "logos"
                          ? fontWeight.semibold
                          : fontWeight.medium,
                    },
                  ]}
                >
                  Logos ({ALL_LOGO_IDS.length})
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setVisualMode("icons")}
                style={[
                  styles.modeTab,
                  visualMode === "icons" && {
                    backgroundColor: colors.surface,
                    shadowColor: "#000",
                    shadowOpacity: 0.1,
                    shadowRadius: 3,
                    elevation: 2,
                  },
                ]}
              >
                <Feather
                  name="tag"
                  size={14}
                  color={visualMode === "icons" ? colors.primary : colors.fgMuted}
                />
                <Text
                  style={[
                    styles.modeTabText,
                    {
                      color:
                        visualMode === "icons" ? colors.fg : colors.fgMuted,
                      fontWeight:
                        visualMode === "icons"
                          ? fontWeight.semibold
                          : fontWeight.medium,
                    },
                  ]}
                >
                  Icons & Color
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setVisualMode("photo")}
                style={[
                  styles.modeTab,
                  visualMode === "photo" && {
                    backgroundColor: colors.surface,
                    shadowColor: "#000",
                    shadowOpacity: 0.1,
                    shadowRadius: 3,
                    elevation: 2,
                  },
                ]}
              >
                <Feather
                  name="image"
                  size={14}
                  color={visualMode === "photo" ? colors.primary : colors.fgMuted}
                />
                <Text
                  style={[
                    styles.modeTabText,
                    {
                      color:
                        visualMode === "photo" ? colors.fg : colors.fgMuted,
                      fontWeight:
                        visualMode === "photo"
                          ? fontWeight.semibold
                          : fontWeight.medium,
                    },
                  ]}
                >
                  Your Photo
                </Text>
              </Pressable>
            </View>

            {/* TAB CONTENT 1: High-fidelity Vector Logos */}
            {visualMode === "logos" && (
              <View style={styles.tabContentContainer}>
                <View style={styles.logosGrid}>
                  {ALL_LOGO_IDS.map((logoId) => {
                    const visual = CATEGORY_VISUALS[logoId];
                    const isSelected =
                      !imageUrl && icon === "logo:" + logoId;
                    return (
                      <Pressable
                        key={logoId}
                        onPress={() => handlePickLogo(logoId)}
                        style={[
                          styles.logoTile,
                          {
                            backgroundColor: isSelected
                              ? `${visual.palette.primary}20`
                              : colors.surfaceRecessed,
                            borderColor: isSelected
                              ? visual.palette.primary
                              : "transparent",
                          },
                        ]}
                      >
                        <CategoryVisual
                          iconName={"logo:" + logoId}
                          size={38}
                        />
                        <Text
                          style={[
                            styles.logoTileLabel,
                            {
                              color: isSelected
                                ? colors.fg
                                : colors.fgMuted,
                              fontWeight: isSelected
                                ? fontWeight.bold
                                : fontWeight.normal,
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {visual.name.split(" ")[0]}
                        </Text>
                        {isSelected && (
                          <View
                            style={[
                              styles.logoCheckmark,
                              { backgroundColor: visual.palette.primary },
                            ]}
                          >
                            <Feather name="check" size={10} color="#FFFFFF" />
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {/* TAB CONTENT 2: Custom Feather Icons & Color Swatches */}
            {visualMode === "icons" && (
              <View style={styles.tabContentContainer}>
                <Text
                  style={[
                    styles.subSectionTitle,
                    { color: colors.fgMuted, marginTop: 4 },
                  ]}
                >
                  PICK ICON
                </Text>
                <View style={styles.featherIconsGrid}>
                  {FEATHER_ICONS.map((item) => {
                    const isSelected = !imageUrl && icon === item;
                    return (
                      <Pressable
                        key={item}
                        onPress={() => handlePickIcon(item)}
                        style={[
                          styles.featherIconOption,
                          {
                            backgroundColor: isSelected
                              ? color
                              : colors.surfaceRecessed,
                          },
                        ]}
                      >
                        <Feather
                          name={item as never}
                          size={18}
                          color={isSelected ? "#FFFFFF" : colors.fg}
                        />
                      </Pressable>
                    );
                  })}
                </View>

                <Text
                  style={[
                    styles.subSectionTitle,
                    { color: colors.fgMuted, marginTop: spacing[3] },
                  ]}
                >
                  CUSTOM COLOR PALETTE
                </Text>
                <View style={styles.colorPaletteGrid}>
                  {PALETTE.map((hex) => {
                    const isSelected = color.toLowerCase() === hex.toLowerCase();
                    return (
                      <Pressable
                        key={hex}
                        onPress={() => setColor(hex)}
                        style={[
                          styles.colorSwatch,
                          { backgroundColor: hex },
                          isSelected && styles.colorSwatchSelected,
                        ]}
                      >
                        {isSelected && (
                          <Feather name="check" size={14} color="#FFFFFF" />
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {/* TAB CONTENT 3: Custom User Photo */}
            {visualMode === "photo" && (
              <View style={styles.tabContentContainer}>
                <View
                  style={[
                    styles.photoBox,
                    {
                      backgroundColor: colors.surfaceRecessed,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  {imageUrl ? (
                    <View style={styles.photoPreviewCard}>
                      <CategoryVisual
                        imageUrl={imageUrl}
                        size={84}
                        showBorder
                      />
                      <Text
                        style={[styles.photoLoadedText, { color: colors.fg }]}
                      >
                        Custom Photo Selected
                      </Text>
                      <View style={styles.photoActionsRow}>
                        <Pressable
                          onPress={handlePickImage}
                          style={[
                            styles.photoSmallBtn,
                            { backgroundColor: colors.surface },
                          ]}
                        >
                          <Feather
                            name="refresh-cw"
                            size={14}
                            color={colors.primary}
                          />
                          <Text
                            style={[
                              styles.photoSmallBtnText,
                              { color: colors.primary },
                            ]}
                          >
                            Change
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={handleRemoveImage}
                          style={[
                            styles.photoSmallBtn,
                            { backgroundColor: `${colors.error}15` },
                          ]}
                        >
                          <Feather
                            name="trash-2"
                            size={14}
                            color={colors.error}
                          />
                          <Text
                            style={[
                              styles.photoSmallBtnText,
                              { color: colors.error },
                            ]}
                          >
                            Remove
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.photoEmptyBox}>
                      <View
                        style={[
                          styles.photoIconCircle,
                          { backgroundColor: `${colors.primary}20` },
                        ]}
                      >
                        <Feather
                          name="camera"
                          size={28}
                          color={colors.primary}
                        />
                      </View>
                      <Text
                        style={[styles.photoPromptTitle, { color: colors.fg }]}
                      >
                        Personalize with your own photo
                      </Text>
                      <Text
                        style={[
                          styles.photoPromptSub,
                          { color: colors.fgMuted },
                        ]}
                      >
                        Use a photo of your pet, car, house, or receipt
                      </Text>

                      <View style={styles.photoPickBtnRow}>
                        <Pressable
                          onPress={handlePickImage}
                          style={[
                            styles.photoMainBtn,
                            { backgroundColor: colors.primary },
                          ]}
                        >
                          <Feather
                            name="image"
                            size={16}
                            color={colors.onPrimary}
                          />
                          <Text
                            style={[
                              styles.photoMainBtnText,
                              { color: colors.onPrimary },
                            ]}
                          >
                            Choose from Gallery
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={handleTakePhoto}
                          style={[
                            styles.photoMainBtn,
                            {
                              backgroundColor: colors.surface,
                              borderColor: colors.border,
                              borderWidth: 1,
                            },
                          ]}
                        >
                          <Feather
                            name="camera"
                            size={16}
                            color={colors.fg}
                          />
                          <Text
                            style={[
                              styles.photoMainBtnText,
                              { color: colors.fg },
                            ]}
                          >
                            Take Photo
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Save Button */}
            <Pressable
              onPress={() => void save()}
              style={[
                styles.primaryButton,
                { backgroundColor: colors.primary },
              ]}
            >
              <Text
                style={[styles.primaryButtonText, { color: colors.onPrimary }]}
              >
                {initial ? "Save Changes" : "Create Category"}
              </Text>
              <Feather name="check" size={18} color={colors.onPrimary} />
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function CategoriesScreen() {
  const { categories, deleteCategory, expenses, transactions } = useFinance();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [editorVisible, setEditorVisible] = useState(false);
  const [editing, setEditing] = useState<Category | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [replacementCatId, setReplacementCatId] = useState<string>("");

  const targetExpensesCount = useMemo(() => {
    if (!deleteTarget) return 0;
    const expCount = expenses.filter(
      (e) => e.category === deleteTarget.name,
    ).length;
    const txCount = transactions.filter(
      (t) =>
        t.category === deleteTarget.name || t.categoryId === deleteTarget.id,
    ).length;
    return Math.max(expCount, txCount);
  }, [deleteTarget, expenses, transactions]);

  const availableReplacements = useMemo(() => {
    if (!deleteTarget) return [];
    return categories.filter((c) => c.id !== deleteTarget.id);
  }, [deleteTarget, categories]);

  const openEditor = (cat?: Category) => {
    setEditing(cat);
    setEditorVisible(true);
  };

  const promptDelete = (cat: Category) => {
    setDeleteTarget(cat);
    const otherCats = categories.filter((c) => c.id !== cat.id);
    const defaultOther =
      otherCats.find((c) => c.name.toLowerCase() === "other") || otherCats[0];
    setReplacementCatId(defaultOther?.id || "");
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    if (targetExpensesCount > 0) {
      await deleteCategory(deleteTarget.id, replacementCatId);
    } else {
      await deleteCategory(deleteTarget.id);
    }
    setDeleteTarget(null);
  };

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
          Categories
        </Text>
        <Pressable
          onPress={() => openEditor()}
          style={[styles.backBtn, { backgroundColor: colors.primary }]}
        >
          <Feather name="plus" size={20} color={colors.onPrimary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing[6] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {categories.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="tag" size={48} color={colors.fgSubtle} />
            <Text style={[styles.emptyTitle, { color: colors.fgMuted }]}>
              No categories yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.fgSubtle }]}>
              Add your first category
            </Text>
          </View>
        ) : (
          categories.map((cat) => (
            <View
              key={cat.id}
              style={[
                styles.categoryCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <CategoryVisual
                categoryName={cat.name}
                iconName={cat.icon}
                color={cat.color}
                imageUrl={cat.imageUrl}
                size="medium"
                showBorder
              />
              <View style={styles.categoryInfo}>
                <Text
                  style={[styles.categoryName, { color: colors.fg }]}
                  numberOfLines={1}
                >
                  {cat.name}
                </Text>
                <View style={styles.categoryMetaRow}>
                  <Text
                    style={[
                      styles.categoryMetaText,
                      {
                        color:
                          cat.type === "income"
                            ? colors.primary
                            : colors.fgSubtle,
                      },
                    ]}
                  >
                    {cat.type === "income" ? "Income" : "Expense"}
                  </Text>
                  {cat.imageUrl && (
                    <Text
                      style={[
                        styles.categoryMetaText,
                        { color: colors.primary },
                      ]}
                    >
                      • Photo
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.categoryActions}>
                <Pressable
                  onPress={() => openEditor(cat)}
                  style={[
                    styles.actionBtn,
                    { backgroundColor: colors.surfaceRecessed },
                  ]}
                  hitSlop={6}
                >
                  <Feather name="edit-2" size={15} color={colors.primary} />
                </Pressable>
                <Pressable
                  onPress={() => promptDelete(cat)}
                  style={[
                    styles.actionBtn,
                    { backgroundColor: colors.surfaceRecessed },
                  ]}
                  hitSlop={6}
                >
                  <Feather name="trash-2" size={15} color={colors.error} />
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <CategoryEditor
        visible={editorVisible}
        initial={editing}
        onClose={() => setEditorVisible(false)}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        visible={!!deleteTarget}
        title={targetExpensesCount > 0 ? "Category in use" : "Delete Category"}
        message={
          targetExpensesCount > 0
            ? `"${deleteTarget?.name}" has ${targetExpensesCount} tracked ${targetExpensesCount === 1 ? "expense" : "expenses"}. Move existing expenses to another category before deleting:`
            : `Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`
        }
        confirmText={targetExpensesCount > 0 ? "Move & Delete" : "Delete"}
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      >
        {targetExpensesCount > 0 && availableReplacements.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.replacementScroll}
          >
            {availableReplacements.map((r) => {
              const isSelected = r.id === replacementCatId;
              return (
                <Pressable
                  key={r.id}
                  onPress={() => setReplacementCatId(r.id)}
                  style={[
                    styles.replacementPill,
                    {
                      backgroundColor: isSelected
                        ? colors.primary
                        : colors.surfaceRecessed,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.replacementPillText,
                      { color: isSelected ? colors.onPrimary : colors.fg },
                    ]}
                  >
                    {r.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </DeleteConfirmationModal>
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
    gap: spacing[3],
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing[12],
    gap: spacing[3],
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
  },
  categoryCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing[3],
  },
  categoryInfo: {
    flex: 1,
    gap: 2,
  },
  categoryName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  categoryMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  categoryMetaText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  categoryActions: {
    flexDirection: "row",
    gap: spacing[2],
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  editor: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing[3],
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: radius.full,
    alignSelf: "center",
    marginBottom: spacing[3],
  },
  editorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing[5],
    marginBottom: spacing[2],
  },
  editorTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  closeIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollInner: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[2],
  },
  previewContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 14,
    marginBottom: spacing[3],
  },
  previewInfo: {
    flex: 1,
    gap: 4,
  },
  previewName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  previewBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: radius.full,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: fontWeight.semibold,
    textTransform: "uppercase",
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    letterSpacing: 0.8,
    marginBottom: spacing[2],
    marginTop: spacing[3],
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  subHint: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.normal,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  textInput: {
    flex: 1,
    fontSize: fontSize.base,
    padding: 0,
  },
  presetsRow: {
    paddingVertical: spacing[1],
    gap: spacing[2],
  },
  presetChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  presetChipText: {
    fontSize: fontSize.xs,
  },
  typeToggleRow: {
    flexDirection: "row",
    borderRadius: radius.md,
    padding: 3,
    gap: 4,
  },
  typeTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: radius.sm,
  },
  typeTabText: {
    fontSize: fontSize.sm,
  },
  modeTabsRow: {
    flexDirection: "row",
    borderRadius: radius.md,
    padding: 3,
    gap: 4,
    marginBottom: spacing[3],
  },
  modeTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: spacing[2],
    borderRadius: radius.sm,
  },
  modeTabText: {
    fontSize: fontSize.xs,
  },
  tabContentContainer: {
    marginBottom: spacing[3],
  },
  logosGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },
  logoTile: {
    width: "31%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: spacing[1],
    borderRadius: radius.md,
    borderWidth: 1.5,
    gap: 4,
    position: "relative",
  },
  logoTileLabel: {
    fontSize: 11,
    textAlign: "center",
  },
  logoCheckmark: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  subSectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    letterSpacing: 0.6,
    marginBottom: spacing[2],
  },
  featherIconsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },
  featherIconOption: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  colorPaletteGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  colorSwatchSelected: {
    borderWidth: 3,
    borderColor: "#FFFFFF",
    elevation: 4,
    transform: [{ scale: 1.15 }],
  },
  photoBox: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing[4],
  },
  photoPreviewCard: {
    alignItems: "center",
    gap: spacing[2],
  },
  photoLoadedText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    marginTop: 4,
  },
  photoActionsRow: {
    flexDirection: "row",
    gap: spacing[3],
    marginTop: spacing[2],
  },
  photoSmallBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.md,
  },
  photoSmallBtnText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  photoEmptyBox: {
    alignItems: "center",
    paddingVertical: spacing[3],
    gap: spacing[2],
  },
  photoIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  photoPromptTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  photoPromptSub: {
    fontSize: fontSize.xs,
    textAlign: "center",
    marginBottom: spacing[2],
  },
  photoPickBtnRow: {
    flexDirection: "column",
    width: "100%",
    gap: spacing[2],
  },
  photoMainBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    paddingVertical: spacing[3],
    borderRadius: radius.md,
  },
  photoMainBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    borderRadius: radius.md,
    paddingVertical: 14,
    marginTop: spacing[4],
  },
  primaryButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  replacementScroll: {
    paddingVertical: spacing[1],
    gap: spacing[2],
  },
  replacementPill: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
    borderWidth: 1,
  },
  replacementPillText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
});
