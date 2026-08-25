import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Linking, Modal, Pressable, ScrollView, Share, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useFinance, type Appearance, type Category, type Currency, type PaymentMethod } from '@/context/FinanceContext';

const palette = ['#2868E8', '#FF8C69', '#9B7BEB', '#48B49B', '#EC6A8E', '#E6B85C'];
const icons = ['briefcase', 'home', 'book-open', 'film', 'plane', 'star', 'tag'];

const APP_VERSION = '0.0.0';
const PRIVACY_URL = 'https://pocketflow.app/privacy';
const TERMS_URL = 'https://pocketflow.app/terms';

function Row({ icon, title, subtitle, onPress, trailing }: { icon: string; title: string; subtitle?: string; onPress?: () => void; trailing?: React.ReactNode }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}><View style={styles.rowIcon}><Feather name={icon as never} size={17} color="#2868E8" /></View><View style={styles.rowCopy}><Text style={styles.rowTitle}>{title}</Text>{subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}</View>{trailing || <Feather name="chevron-right" size={17} color="#9BA9BB" />}</Pressable>;
}

function CategoryEditor({ visible, initial, onClose }: { visible: boolean; initial?: Category; onClose: () => void }) {
  const { addCategory, updateCategory } = useFinance();
  const [name, setName] = useState(initial?.name || '');
  const [icon, setIcon] = useState(initial?.icon || icons[0]);
  const [color, setColor] = useState(initial?.color || palette[0]);
  const save = async () => {
    if (!name.trim()) return;
    if (initial) await updateCategory({ ...initial, name: name.trim(), icon, color });
    else await addCategory(name, icon, color);
    onClose();
  };
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}><View style={styles.modalBackdrop}><Pressable style={StyleSheet.absoluteFill} onPress={onClose} /><View style={styles.editor}><View style={styles.handle} /><View style={styles.editorHeader}><Text style={styles.editorTitle}>{initial ? 'Edit category' : 'Add category'}</Text><Pressable onPress={onClose}><Feather name="x" size={20} color="#74839B" /></Pressable></View><Text style={styles.label}>CATEGORY NAME</Text><TextInput autoFocus value={name} onChangeText={setName} placeholder="e.g. Freelancing" placeholderTextColor="#9AA8BC" style={styles.textInput} /><Text style={styles.label}>CHOOSE ICON</Text><View style={styles.optionRow}>{icons.map((item) => <Pressable key={item} onPress={() => setIcon(item)} style={[styles.iconOption, icon === item && { backgroundColor: '#2868E8' }]}><Feather name={item as never} size={18} color={icon === item ? '#FFF' : '#2868E8'} /></Pressable>)}</View><Text style={styles.label}>CHOOSE COLOR</Text><View style={styles.optionRow}>{palette.map((item) => <Pressable key={item} onPress={() => setColor(item)} style={[styles.colorOption, { backgroundColor: item }, color === item && styles.colorSelected]} />)}</View><Pressable onPress={() => void save()} style={styles.primaryButton}><Text style={styles.primaryButtonText}>{initial ? 'Save changes' : 'Save category'}</Text><Feather name="check" size={18} color="#FFF" /></Pressable></View></View></Modal>;
}

function ProfileEditor({ visible, name, onClose, onSave }: { visible: boolean; name: string; onClose: () => void; onSave: (name: string) => void }) {
  const [editName, setEditName] = useState(name);
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}><View style={styles.modalBackdrop}><Pressable style={StyleSheet.absoluteFill} onPress={onClose} /><View style={styles.editor}><View style={styles.handle} /><View style={styles.editorHeader}><Text style={styles.editorTitle}>Edit Profile</Text><Pressable onPress={onClose}><Feather name="x" size={20} color="#74839B" /></Pressable></View><Text style={styles.label}>DISPLAY NAME</Text><TextInput autoFocus value={editName} onChangeText={setEditName} placeholder="Your name" placeholderTextColor="#9AA8BC" style={styles.textInput} /><Pressable onPress={() => { onSave(editName.trim()); onClose(); }} style={styles.primaryButton}><Text style={styles.primaryButtonText}>Save</Text><Feather name="check" size={18} color="#FFF" /></Pressable></View></View></Modal>;
}

function PaymentMethodEditor({ visible, initial, onClose }: { visible: boolean; initial?: PaymentMethod; onClose: () => void }) {
  const { addPaymentMethod, updatePaymentMethod, paymentMethods } = useFinance();
  const [name, setName] = useState(initial?.name || '');
  const [isDefault, setIsDefault] = useState(initial?.isDefault || false);
  const save = async () => {
    if (!name.trim()) return;
    if (isDefault) {
      const updated = paymentMethods.map(m => ({ ...m, isDefault: m.id === initial?.id }));
      for (const m of updated) {
        await updatePaymentMethod(m);
      }
    }
    if (initial) await updatePaymentMethod({ ...initial, name: name.trim(), isDefault });
    else await addPaymentMethod(name.trim());
    onClose();
  };
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}><View style={styles.modalBackdrop}><Pressable style={StyleSheet.absoluteFill} onPress={onClose} /><View style={styles.editor}><View style={styles.handle} /><View style={styles.editorHeader}><Text style={styles.editorTitle}>{initial ? 'Edit payment method' : 'Add payment method'}</Text><Pressable onPress={onClose}><Feather name="x" size={20} color="#74839B" /></Pressable></View><Text style={styles.label}>NAME</Text><TextInput autoFocus value={name} onChangeText={setName} placeholder="e.g. Credit Card" placeholderTextColor="#9AA8BC" style={styles.textInput} /><View style={styles.switchRow}><Text style={styles.switchLabel}>Set as default</Text><Switch value={isDefault} onValueChange={setIsDefault} trackColor={{ false: '#D8E1EF', true: '#A9C2FA' }} thumbColor={isDefault ? '#2868E8' : '#FFF'} /></View><Pressable onPress={() => void save()} style={styles.primaryButton}><Text style={styles.primaryButtonText}>{initial ? 'Save changes' : 'Add payment method'}</Text><Feather name="check" size={18} color="#FFF" /></Pressable></View></View></Modal>;
}

function ImportModal({ visible, onClose, onImport }: { visible: boolean; onClose: () => void; onImport: (json: string) => void }) {
  const [importing, setImporting] = useState(false);
  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true });
      if (result.canceled || !result.assets?.[0]) return;
      const fileUri = result.assets[0].uri;
      const content = await FileSystem.readAsStringAsync(fileUri);
      setImporting(true);
      onImport(content);
      onClose();
    } catch (e) {
      Alert.alert('Import failed', 'Could not read the selected file.');
    } finally {
      setImporting(false);
    }
  };
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}><View style={styles.modalBackdrop}><Pressable style={StyleSheet.absoluteFill} onPress={onClose} /><View style={styles.editor}><View style={styles.handle} /><View style={styles.editorHeader}><Text style={styles.editorTitle}>Restore Backup</Text><Pressable onPress={onClose}><Feather name="x" size={20} color="#74839B" /></Pressable></View><Text style={styles.importText}>Select a Pocketflow JSON backup file to restore your data.</Text><Pressable onPress={pickFile} disabled={importing} style={[styles.primaryButton, importing && { opacity: 0.7 }]}><Text style={styles.primaryButtonText}>{importing ? 'Importing...' : 'Choose JSON file'}</Text><Feather name={importing ? 'loader' : 'folder'} size={18} color="#FFF" /></Pressable><Text style={styles.importWarning}>⚠ This will replace all current data. Export a backup first if needed.</Text></View></View></Modal>;
}

export default function SettingsScreen() {
  const { categories, settings, paymentMethods, updateSettings, deleteCategory, exportData, importData, addPaymentMethod, updatePaymentMethod, deletePaymentMethod } = useFinance();
  const [editorVisible, setEditorVisible] = useState(false);
  const [editing, setEditing] = useState<Category | undefined>();
  const [showCategories, setShowCategories] = useState(false);
  const [profileEditorVisible, setProfileEditorVisible] = useState(false);
  const [paymentEditorVisible, setPaymentEditorVisible] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentMethod | undefined>();
  const [importModalVisible, setImportModalVisible] = useState(false);
  const insets = useSafeAreaInsets();

  const openNew = () => { setEditing(undefined); setEditorVisible(true); };
  const openEdit = (category: Category) => { setEditing(category); setEditorVisible(true); };
  const remove = async (category: Category) => {
    const removed = await deleteCategory(category.id);
    if (!removed) Alert.alert('Category is in use', 'Move existing expenses to another category before deleting this one.');
  };

  const chooseCurrency = () => Alert.alert('Currency', 'Choose your default currency', ['INR', 'USD', 'EUR', 'GBP', 'AED'].map((value) => ({ text: value, onPress: () => void updateSettings({ currency: value as Currency }) })));
  const chooseAppearance = () => Alert.alert('Appearance', 'Choose how Pocketflow should look', ['System', 'Light', 'Dark'].map((value) => ({ text: value, onPress: () => void updateSettings({ appearance: value.toLowerCase() as Appearance }) })));

  const openProfileEditor = () => setProfileEditorVisible(true);
  const saveProfile = async (name: string) => {
    if (name.trim()) await updateSettings({ profileName: name.trim() });
  };

  const openPaymentEditor = (method?: PaymentMethod) => {
    setEditingPayment(method);
    setPaymentEditorVisible(true);
  };
  const removePayment = async (method: PaymentMethod) => {
    if (method.isDefault) { Alert.alert('Cannot delete', 'Set another payment method as default first.'); return; }
    Alert.alert('Delete payment method', `Remove "${method.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void deletePaymentMethod(method.id) },
    ]);
  };

  const handleImport = async (json: string) => {
    try {
      await importData(json);
      Alert.alert('Success', 'Backup restored successfully. The app will reload.');
    } catch {
      Alert.alert('Import failed', 'The selected file is not a valid Pocketflow backup.');
    }
  };

  const openPrivacy = () => Linking.openURL(PRIVACY_URL);
  const openTerms = () => Linking.openURL(TERMS_URL);

  const defaultPayment = paymentMethods.find(m => m.isDefault)?.name || settings.defaultPayment;

  return <View style={styles.screen}><ScrollView contentContainerStyle={{ paddingTop: insets.top + 18, paddingBottom: 42 }}><View style={styles.header}><Pressable onPress={() => router.back()} style={styles.back}><Feather name="arrow-left" size={20} color="#253756" /></Pressable><View><Text style={styles.kicker}>POCKETFLOW</Text><Text style={styles.title}>Settings</Text></View><View style={{ width: 38 }} /></View><Text style={styles.sectionLabel}>ACCOUNT</Text><View style={styles.card}><Row icon="user" title="Profile" subtitle={settings.profileName} onPress={openProfileEditor} /><Row icon="globe" title="Currency" subtitle={settings.currency} onPress={chooseCurrency} /><Row icon="credit-card" title="Wallets & accounts" subtitle="Coming in next update" onPress={() => Alert.alert('Wallets & accounts', 'Account management with types (Cash, Bank, UPI, Credit Card, Savings), opening balances, and transfers is coming in the next update.')} /></View><Text style={styles.sectionLabel}>FINANCE</Text><View style={styles.card}><Row icon="layers" title="Categories" subtitle={`${categories.length} available`} onPress={() => setShowCategories(!showCategories)} />{showCategories && <View style={styles.categoryList}>{categories.map((category) => <View key={category.id} style={styles.categoryRow}><View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}><Feather name={category.icon as never} size={16} color={category.color} /></View><Text style={styles.categoryName}>{category.name}</Text>{!category.isDefault && <><Pressable onPress={() => openEdit(category)} style={styles.action}><Feather name="edit-2" size={15} color="#2868E8" /></Pressable><Pressable onPress={() => void remove(category)} style={styles.action}><Feather name="trash-2" size={15} color="#D95765" /></Pressable></>}</View>)}<Pressable onPress={openNew} style={styles.addCategory}><Feather name="plus" size={17} color="#2868E8" /><Text style={styles.addCategoryText}>Add category</Text></Pressable></View>}<Row icon="repeat" title="Payment methods" subtitle={`${paymentMethods.length} methods · Default: ${defaultPayment}`} onPress={() => openPaymentEditor()} /><Row icon="target" title="Budgets & savings" subtitle="Coming in next update" onPress={() => Alert.alert('Budgets & savings', 'Monthly budgets, category budgets, and savings goals with progress tracking are coming in the next update.')} /></View><Text style={styles.sectionLabel}>QUICK ACCESS</Text><View style={styles.card}><Row icon="zap" title="Quick Add" subtitle="Fast expense capture is enabled" /><Row icon="bell" title="Notifications" subtitle={settings.notificationsEnabled ? 'Enabled' : 'Off'} trailing={<Switch value={settings.notificationsEnabled} onValueChange={(value) => void updateSettings({ notificationsEnabled: value })} trackColor={{ false: '#D8E1EF', true: '#A9C2FA' }} thumbColor={settings.notificationsEnabled ? '#2868E8' : '#FFF'} />} /><Row icon="grid" title="Quick Settings tile" subtitle="Requires an Android development build" onPress={() => Alert.alert('Android development build required', 'Expo Go cannot install Android Quick Settings tiles. This option becomes available after generating a native development build.')} /></View><Text style={styles.sectionLabel}>APPEARANCE</Text><View style={styles.card}><Row icon="sun" title="Appearance" subtitle={settings.appearance[0].toUpperCase() + settings.appearance.slice(1)} onPress={chooseAppearance} /></View><Text style={styles.sectionLabel}>DATA</Text><View style={styles.card}><Row icon="share-2" title="Export CSV" subtitle="Share a readable transaction list" onPress={() => void exportData('csv')} /><Row icon="archive" title="Backup JSON" subtitle="Share a complete local backup" onPress={() => void exportData('json')} /><Row icon="download" title="Restore from backup" subtitle="Import a previous JSON backup" onPress={() => setImportModalVisible(true)} /><Row icon="info" title="About Pocketflow" subtitle={`Version ${APP_VERSION} · Offline first`} /></View><Text style={styles.note}>Pocketflow keeps your financial data on this device by default. No account or internet connection is required to record expenses.</Text></ScrollView><CategoryEditor visible={editorVisible} initial={editing} onClose={() => setEditorVisible(false)} /><ProfileEditor visible={profileEditorVisible} name={settings.profileName} onClose={() => setProfileEditorVisible(false)} onSave={saveProfile} /><PaymentMethodEditor visible={paymentEditorVisible} initial={editingPayment} onClose={() => { setPaymentEditorVisible(false); setEditingPayment(undefined); }} /><ImportModal visible={importModalVisible} onClose={() => setImportModalVisible(false)} onImport={handleImport} /></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F8FF' }, header: { paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 25 }, back: { width: 38, height: 38, borderRadius: 14, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E9F4' }, kicker: { textAlign: 'center', color: '#2868E8', fontSize: 10, fontWeight: '700', letterSpacing: 1.2 }, title: { color: '#14213D', fontSize: 30, fontWeight: '700', letterSpacing: -0.8, marginTop: 5 }, sectionLabel: { color: '#8191A8', fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginHorizontal: 22, marginBottom: 9, marginTop: 18 }, card: { backgroundColor: '#FFF', borderRadius: 20, marginHorizontal: 18, paddingVertical: 4, borderWidth: 1, borderColor: '#E4EAF4' }, row: { minHeight: 62, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 12 }, rowIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: '#EAF0FF', alignItems: 'center', justifyContent: 'center' }, rowCopy: { flex: 1 }, rowTitle: { color: '#2D3D59', fontSize: 14, fontWeight: '600' }, rowSubtitle: { color: '#93A1B6', fontSize: 12, marginTop: 4 }, categoryList: { borderTopWidth: 1, borderTopColor: '#EEF2F8', padding: 12 }, categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 }, categoryIcon: { width: 30, height: 30, borderRadius: 10, justifyContent: 'center', alignItems: 'center' }, categoryName: { flex: 1, color: '#42516A', fontSize: 13 }, action: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }, addCategory: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingTop: 12, paddingBottom: 5 }, addCategoryText: { color: '#2868E8', fontSize: 13, fontWeight: '700' }, note: { color: '#94A2B7', fontSize: 12, lineHeight: 19, textAlign: 'center', marginHorizontal: 35, marginTop: 24 }, modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(18,32,60,0.42)' }, editor: { backgroundColor: '#F8FAFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 22, paddingBottom: 34 }, handle: { width: 42, height: 4, borderRadius: 4, backgroundColor: '#C4CEDD', alignSelf: 'center', marginBottom: 19 }, editorHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, editorTitle: { color: '#14213D', fontSize: 24, fontWeight: '700' }, label: { color: '#8A99AE', fontSize: 10, letterSpacing: 1, fontWeight: '700', marginTop: 22, marginBottom: 8 }, textInput: { height: 50, backgroundColor: '#FFF', borderRadius: 15, paddingHorizontal: 16, color: '#243653', fontSize: 15, borderWidth: 1, borderColor: '#E3EAF5' }, optionRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' }, iconOption: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#EAF0FF', justifyContent: 'center', alignItems: 'center' }, colorOption: { width: 30, height: 30, borderRadius: 15 }, colorSelected: { borderWidth: 3, borderColor: '#14213D' }, primaryButton: { height: 54, backgroundColor: '#2868E8', borderRadius: 17, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 8, marginTop: 25 }, primaryButtonText: { color: '#FFF', fontWeight: '700', fontSize: 15 }, switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 18 }, switchLabel: { color: '#2D3D59', fontSize: 14, fontWeight: '600' }, importText: { color: '#53627A', fontSize: 14, marginTop: 10, lineHeight: 22 }, importWarning: { color: '#D95765', fontSize: 12, marginTop: 12, textAlign: 'center' },
});