import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFinance, type Category } from "@/context/FinanceContext";
import { useColors } from "@/hooks/useColors";
import { spacing, radius, fontSize, fontWeight } from "@/constants/tokens";
import { CategoryVisual } from "@/components/ui";

const palette = [
  "#2868E8",
  "#FF8C69",
  "#9B7BEB",
  "#48B49B",
  "#EC6A8E",
  "#E6B85C",
];
const icons = [
  "briefcase",
  "home",
  "book-open",
  "film",
  "navigation",
  "star",
  "tag",
  "coffee",
  "shopping-cart",
  "music",
  "heart",
  "gift",
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
  const [name, setName] = useState(initial?.name || "");
  const [icon, setIcon] = useState(initial?.icon || icons[0]);
  const [color, setColor] = useState(initial?.color || palette[0]);

  const save = async () => {
    if (!name.trim()) return;
    if (initial)
      await updateCategory({ ...initial, name: name.trim(), icon, color });
    else await addCategory(name.trim(), icon, color);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.editor, { backgroundColor: colors.surface }]}>
          <View style={[styles.handle, { backgroundColor: colors.fgSubtle }]} />
          <View style={styles.editorHeader}>
            <Text style={[styles.editorTitle, { color: colors.fg }]}>
              {initial ? "Edit category" : "Add category"}
            </Text>
            <Pressable onPress={onClose}>
              <Feather name="x" size={20} color={colors.fgMuted} />
            </Pressable>
          </View>

          <View style={{ alignItems: "center", marginVertical: spacing[3] }}>
            <CategoryVisual
              categoryName={name || "Category"}
              iconName={icon}
              size="large"
              showBorder
            />
          </View>

          <Text style={[styles.label, { color: colors.fgMuted }]}>
            CATEGORY NAME
          </Text>
          <TextInput
            autoFocus
            value={name}
            onChangeText={setName}
            placeholder="e.g. Freelancing"
            placeholderTextColor={colors.fgSubtle}
            style={[
              styles.textInput,
              { backgroundColor: colors.surfaceRecessed, color: colors.fg },
            ]}
          />

          <Text style={[styles.label, { color: colors.fgMuted }]}>
            CHOOSE ICON
          </Text>
          <View style={styles.optionRow}>
            {icons.map((item) => (
              <Pressable
                key={item}
                onPress={() => setIcon(item)}
                style={[
                  styles.iconOption,
                  { backgroundColor: `${colors.primary}20` },
                  icon === item && { backgroundColor: colors.primary },
                ]}
              >
                <Feather
                  name={item as never}
                  size={18}
                  color={icon === item ? colors.onPrimary : colors.primary}
                />
              </Pressable>
            ))}
          </View>

          <Text style={[styles.label, { color: colors.fgMuted }]}>
            CHOOSE COLOR
          </Text>
          <View style={styles.optionRow}>
            {palette.map((item) => (
              <Pressable
                key={item}
                onPress={() => setColor(item)}
                style={[
                  styles.colorOption,
                  { backgroundColor: item },
                  color === item && styles.colorSelected,
                ]}
              />
            ))}
          </View>

          <Pressable
            onPress={() => void save()}
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          >
            <Text
              style={[styles.primaryButtonText, { color: colors.onPrimary }]}
            >
              {initial ? "Save changes" : "Save category"}
            </Text>
            <Feather name="check" size={18} color={colors.onPrimary} />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default function CategoriesScreen() {
  const { categories, deleteCategory } = useFinance();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [editorVisible, setEditorVisible] = useState(false);
  const [editing, setEditing] = useState<Category | undefined>();

  const openEditor = (cat?: Category) => {
    setEditing(cat);
    setEditorVisible(true);
  };

  const remove = async (cat: Category) => {
    const removed = await deleteCategory(cat.id);
    if (!removed)
      Alert.alert(
        "Category is in use",
        "Move existing expenses to another category before deleting.",
      );
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
        contentContainerStyle={styles.content}
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
              style={[styles.categoryCard, { backgroundColor: colors.surface }]}
            >
              <CategoryVisual
                categoryName={cat.name}
                iconName={cat.icon}
                size="medium"
              />
              <Text style={[styles.categoryName, { color: colors.fg }]}>
                {cat.name}
              </Text>
              <View style={styles.categoryActions}>
                <Pressable
                  onPress={() => openEditor(cat)}
                  style={[
                    styles.actionBtn,
                    { backgroundColor: colors.surfaceRecessed },
                  ]}
                >
                  <Feather name="edit-2" size={16} color={colors.primary} />
                </Pressable>
                <Pressable
                  onPress={() => void remove(cat)}
                  style={[
                    styles.actionBtn,
                    { backgroundColor: colors.surfaceRecessed },
                  ]}
                >
                  <Feather name="trash-2" size={16} color={colors.error} />
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
    padding: spacing[4],
    borderRadius: radius.lg,
    gap: spacing[3],
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryName: {
    flex: 1,
    fontSize: fontSize.base,
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
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  editor: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing[5],
    paddingBottom: spacing[8],
  },
  handle: {
    width: spacing[8],
    height: 1,
    borderRadius: radius.full,
    alignSelf: "center",
    marginBottom: spacing[4],
  },
  editorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[4],
  },
  editorTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold },
  label: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    letterSpacing: 1,
    marginBottom: spacing[2],
    marginTop: spacing[3],
  },
  textInput: {
    borderRadius: radius.sm,
    padding: spacing[3],
    fontSize: fontSize.base,
  },
  optionRow: { flexDirection: "row", gap: spacing[2], flexWrap: "wrap" },
  iconOption: {
    width: spacing[8],
    height: spacing[8],
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  colorOption: {
    width: spacing[8],
    height: spacing[8],
    borderRadius: radius.full,
  },
  colorSelected: { borderWidth: 3, borderColor: "#FFF", elevation: 4 },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    borderRadius: radius.md,
    padding: spacing[3],
    marginTop: spacing[4],
  },
  primaryButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
});
