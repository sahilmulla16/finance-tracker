import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useFinance } from '@/context/FinanceContext';
import { useColors } from '@/hooks/useColors';
import { spacing, radius, fontSize, fontWeight, lineHeight } from '@/constants/tokens';

export default function RestoreScreen() {
  const { importData } = useFinance();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [importing, setImporting] = useState(false);

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;

      const fileUri = result.assets[0].uri;
      const content = await FileSystem.readAsStringAsync(fileUri);

      Alert.alert(
        'Restore Backup',
        'This will replace all current data. Are you sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Restore',
            style: 'destructive',
            onPress: async () => {
              setImporting(true);
              try {
                await importData(content);
                Alert.alert('Success', 'Backup restored successfully.');
                router.back();
              } catch {
                Alert.alert('Import failed', 'The selected file is not a valid Pocketflow backup.');
              } finally {
                setImporting(false);
              }
            },
          },
        ]
      );
    } catch {
      Alert.alert('Error', 'Could not read the selected file.');
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.canvas }]}>
      <View style={[styles.header, { paddingTop: insets.top + spacing[4] }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.surface }]}>
          <Feather name="arrow-left" size={20} color={colors.fg} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.fg }]}>Restore Backup</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: colors.surface }]}>
          <Feather name="upload" size={48} color={colors.primary} />
        </View>

        <Text style={[styles.title, { color: colors.fg }]}>Restore from Backup</Text>
        <Text style={[styles.description, { color: colors.fgMuted }]}>
          Select a Pocketflow JSON backup file to restore your data. This will replace all current data.
        </Text>

        <Pressable
          onPress={() => void pickFile()}
          disabled={importing}
          style={[styles.restoreBtn, { backgroundColor: colors.primary }, importing && { opacity: 0.7 }]}
        >
          <Feather name={importing ? 'loader' : 'folder'} size={20} color={colors.onPrimary} />
          <Text style={[styles.restoreBtnText, { color: colors.onPrimary }]}>
            {importing ? 'Importing...' : 'Choose JSON file'}
          </Text>
        </Pressable>

        <View style={[styles.warningCard, { backgroundColor: `${colors.warning}15` }]}>
          <Feather name="alert-triangle" size={20} color={colors.warning} />
          <Text style={[styles.warningText, { color: colors.warning }]}>
            This will replace all current data. Export a backup first if needed.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  content: {
    flex: 1,
    padding: spacing[4],
    alignItems: 'center',
    gap: spacing[4],
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[8],
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    textAlign: 'center',
  },
  description: {
    fontSize: fontSize.base,
    textAlign: 'center',
    lineHeight: fontSize.base * lineHeight.normal,
    paddingHorizontal: spacing[4],
  },
  restoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[8],
    borderRadius: radius.full,
    marginTop: spacing[4],
  },
  restoreBtnText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[4],
    borderRadius: radius.lg,
    marginTop: spacing[4],
  },
  warningText: {
    flex: 1,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * lineHeight.normal,
  },
});
