import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, StatusBar, Alert, Modal, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalTable } from '../../hooks/useLocalStore';

interface AccountGroup {
  id: string;
  code: string;
  name: string;
  type: string;
  accountsCount: number;
  createdAt: string;
}

export default function AccountGroupsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: groups, add, remove, update, reload } = useLocalTable<AccountGroup>('accountGroups');
  const { data: accounts } = useLocalTable('accounts');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<AccountGroup | null>(null);
  const [formData, setFormData] = useState({ code: '', name: '', type: 'أصل' });

  const mainTypes = ['أصل', 'خصم', 'ملكية', 'إيراد', 'مصروف'];

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'أصل': return '#D4AF37';
      case 'خصم': return '#EF4444';
      case 'ملكية': return '#3B82F6';
      case 'إيراد': return '#10B981';
      case 'مصروف': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getAccountsCount = (groupType: string) => {
    return accounts.filter((a: any) => a.type === groupType).length;
  };

  const filteredGroups = groups.filter((g: AccountGroup) => 
    g.name?.includes(searchQuery) || g.code?.includes(searchQuery)
  );

  const handleSave = async () => {
    if (!formData.name) {
      Alert.alert('خطأ', 'الرجاء إدخال اسم المجموعة');
      return;
    }

    if (editMode && selectedGroup) {
      await update(selectedGroup.id, { ...formData, accountsCount: getAccountsCount(formData.type) });
    } else {
      await add({ ...formData, accountsCount: 0 });
    }
    
    setShowModal(false);
    resetForm();
  };

  const handleDelete = (group: AccountGroup) => {
    const hasAccounts = accounts.some((a: any) => a.type === group.type);
    if (hasAccounts) {
      Alert.alert('تنبيه', 'لا يمكن حذف مجموعة تحتوي على حسابات');
      return;
    }

    Alert.alert('تأكيد الحذف', `هل تريد حذف "${group.name}"؟`, [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: () => remove(group.id) },
    ]);
  };

  const openEdit = (group: AccountGroup) => {
    setFormData({ code: group.code, name: group.name, type: group.type });
    setSelectedGroup(group);
    setEditMode(true);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ code: '', name: '', type: 'أصل' });
    setSelectedGroup(null);
    setEditMode(false);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>مجموعات الحسابات</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => { resetForm(); setShowModal(true); }}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.controlBar}>
        <TextInput style={styles.searchInput} placeholder="🔍 بحث..." placeholderTextColor="#94a3b8" value={searchQuery} onChangeText={setSearchQuery} />
        <TouchableOpacity style={styles.printBtn}>
          <Text style={styles.printBtnText}>🖨️</Text>
        </TouchableOpacity>
      </View>

      {filteredGroups.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📁</Text>
          <Text style={styles.emptyText}>لا توجد مجموعات</Text>
          <Text style={styles.emptySubtext}>اضغط + لإضافة مجموعة جديدة</Text>
        </View>
      ) : (
        <FlatList
          data={filteredGroups}
          keyExtractor={(item: AccountGroup) => item.id}
          renderItem={({ item }: { item: AccountGroup }) => (
            <TouchableOpacity style={styles.groupCard} onPress={() => openEdit(item)} onLongPress={() => handleDelete(item)}>
              <View style={[styles.typeBar, { backgroundColor: getTypeColor(item.type) }]} />
              <View style={styles.groupContent}>
                <View style={styles.groupHeader}>
                  <View>
                    <Text style={styles.groupCode}>كود: {item.code}</Text>
                    <Text style={styles.groupName}>{item.name}</Text>
                  </View>
                  <View style={[styles.typeBadge, { backgroundColor: getTypeColor(item.type) + '20' }]}>
                    <Text style={[styles.typeText, { color: getTypeColor(item.type) }]}>{item.type}</Text>
                  </View>
                </View>
                <View style={styles.groupFooter}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{getAccountsCount(item.type)}</Text>
                    <Text style={styles.statLabel}>حساب</Text>
                  </View>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}>
                      <Text style={styles.editBtnText}>✏️ تعديل</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
                      <Text style={styles.deleteBtnText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        />
      )}

      {/* Modal الإضافة والتعديل */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editMode ? 'تعديل مجموعة' : 'إضافة مجموعة جديدة'}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.fieldLabel}>كود المجموعة</Text>
              <TextInput style={styles.fieldInput} value={formData.code} onChangeText={(v) => setFormData({ ...formData, code: v })} placeholder="مثال: 1" placeholderTextColor="#666" />

              <Text style={styles.fieldLabel}>اسم المجموعة *</Text>
              <TextInput style={styles.fieldInput} value={formData.name} onChangeText={(v) => setFormData({ ...formData, name: v })} placeholder="اسم المجموعة" placeholderTextColor="#666" />

              <Text style={styles.fieldLabel}>نوع المجموعة</Text>
              <View style={styles.typeSelector}>
                {mainTypes.map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.typeBtn, formData.type === type && styles.typeBtnActive, { borderColor: getTypeColor(type) }]}
                    onPress={() => setFormData({ ...formData, type })}
                  >
                    <Text style={[styles.typeBtnText, formData.type === type && { color: getTypeColor(type), fontWeight: 'bold' }]}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.saveModalBtn} onPress={handleSave}>
                  <Text style={styles.saveModalBtnText}>💾 حفظ</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setShowModal(false)}>
                  <Text style={styles.cancelModalBtnText}>إلغاء</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1128' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { fontSize: 24, color: '#D4AF37', fontWeight: 'bold' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF' },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#D4AF37' + '20', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#D4AF37' },
  addBtnText: { fontSize: 20, color: '#D4AF37', fontWeight: 'bold' },
  controlBar: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 12, gap: 8 },
  searchInput: { flex: 1, backgroundColor: '#16213E', borderRadius: 10, padding: 10, color: '#FFFFFF', borderWidth: 1, borderColor: '#2a3550', textAlign: 'right', fontSize: 14 },
  printBtn: { backgroundColor: '#16213E', borderRadius: 10, padding: 10, justifyContent: 'center', borderWidth: 1, borderColor: '#2a3550' },
  printBtnText: { fontSize: 18 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  emptySubtext: { color: '#94a3b8', fontSize: 12 },
  groupCard: { flexDirection: 'row', marginBottom: 10, backgroundColor: '#16213E', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#2a3550' },
  typeBar: { width: 4 },
  groupContent: { flex: 1, padding: 14 },
  groupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  groupCode: { color: '#94a3b8', fontSize: 11, marginBottom: 4 },
  groupName: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  typeText: { fontSize: 11, fontWeight: 'bold' },
  groupFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statItem: { alignItems: 'center' },
  statValue: { color: '#D4AF37', fontSize: 20, fontWeight: 'bold' },
  statLabel: { color: '#94a3b8', fontSize: 10 },
  actionButtons: { flexDirection: 'row', gap: 6 },
  editBtn: { backgroundColor: '#3B82F6' + '20', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  editBtnText: { color: '#3B82F6', fontSize: 12, fontWeight: 'bold' },
  deleteBtn: { backgroundColor: '#EF4444' + '20', padding: 6, borderRadius: 8 },
  deleteBtnText: { fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#16213E', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#2a3550' },
  modalTitle: { color: '#D4AF37', fontSize: 18, fontWeight: 'bold' },
  modalClose: { color: '#EF4444', fontSize: 22, fontWeight: 'bold' },
  modalBody: { padding: 16 },
  fieldLabel: { color: '#94a3b8', fontSize: 13, marginBottom: 6, marginTop: 12 },
  fieldInput: { backgroundColor: '#0A1128', borderRadius: 10, padding: 12, color: '#FFFFFF', borderWidth: 1, borderColor: '#2a3550', fontSize: 14 },
  typeSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  typeBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#0A1128', borderWidth: 1 },
  typeBtnActive: { borderWidth: 2 },
  typeBtnText: { color: '#94a3b8', fontSize: 12 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 24 },
  saveModalBtn: { flex: 1, backgroundColor: '#D4AF37', borderRadius: 12, padding: 14, alignItems: 'center' },
  saveModalBtnText: { color: '#0A1128', fontSize: 16, fontWeight: 'bold' },
  cancelModalBtn: { flex: 1, backgroundColor: '#2a3550', borderRadius: 12, padding: 14, alignItems: 'center' },
  cancelModalBtnText: { color: '#FFFFFF', fontSize: 16 },
});
