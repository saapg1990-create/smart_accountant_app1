import { ControlButtons, ControlHeader } from '../../src/components/ui/ControlButtons';
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, StatusBar, Alert, Modal, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalTable } from '../../hooks/useLocalStore';

interface SalesRep {
  id: string; code: string; name: string; phone: string;
  monthlyTarget: number; totalSales: number; notes: string; createdAt: string;
}

export default function SalesRepsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: reps, add, remove, update } = useLocalTable<SalesRep>('salesReps');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedRep, setSelectedRep] = useState<SalesRep | null>(null);
  const [formData, setFormData] = useState({
    name: '', phone: '', monthlyTarget: '0', totalSales: '0', notes: ''
  });

  const filtered = reps.filter((r: SalesRep) =>
    r.name?.includes(searchQuery) || r.code?.includes(searchQuery)
  );
  const totalTarget = reps.reduce((s: number, r: SalesRep) => s + (r.monthlyTarget || 0), 0);
  const totalSales = reps.reduce((s: number, r: SalesRep) => s + (r.totalSales || 0), 0);

  const generateCode = () => 'REP-' + (reps.length + 1).toString().padStart(3, '0');

  const handleSave = async () => {
    if (!formData.name) { Alert.alert('خطأ', 'الرجاء إدخال اسم المندوب'); return; }
    const data = {
      ...formData,
      monthlyTarget: parseFloat(formData.monthlyTarget) || 0,
      totalSales: parseFloat(formData.totalSales) || 0
    };
    if (editMode && selectedRep) {
      await update(selectedRep.id, data);
    } else {
      await add({ ...data, code: generateCode() });
    }
    setShowModal(false); resetForm();
  };

  const handleDelete = (rep: SalesRep) => {
    Alert.alert('تأكيد الحذف', 'حذف "' + rep.name + '"؟', [
      { text: 'حذف', style: 'destructive', onPress: () => remove(rep.id) },
      { text: 'إلغاء', style: 'cancel' },
    ]);
  };

  const resetForm = () => {
    setFormData({ name: '', phone: '', monthlyTarget: '0', totalSales: '0', notes: '' });
    setSelectedRep(null); setEditMode(false);
  };

  const openEdit = (rep: SalesRep) => {
    setFormData({
      name: rep.name, phone: rep.phone || '',
      monthlyTarget: rep.monthlyTarget?.toString() || '0',
      totalSales: rep.totalSales?.toString() || '0',
      notes: rep.notes || ''
    });
    setSelectedRep(rep); setEditMode(true); setShowModal(true);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>المندوبين ({reps.length})</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => { resetForm(); setShowModal(true); }}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.controlBar}>
        <TextInput style={styles.searchInput} placeholder="🔍 بحث..." placeholderTextColor="#94a3b8" value={searchQuery} onChangeText={setSearchQuery} />
        <TouchableOpacity style={styles.printBtn}><Text style={styles.printBtnText}>🖨️</Text></TouchableOpacity>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>الهدف الشهري</Text>
          <Text style={styles.summaryValue}>{totalTarget.toLocaleString()} ﷼</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>المبيعات</Text>
          <Text style={[styles.summaryValue, { color: '#10B981' }]}>{totalSales.toLocaleString()} ﷼</Text>
        </View>
      </View>

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>👨‍💼</Text>
          <Text style={styles.emptyText}>لا يوجد مندوبين</Text>
          <Text style={styles.emptySubtext}>اضغط + لإضافة مندوب</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item: SalesRep) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => openEdit(item)} onLongPress={() => handleDelete(item)}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>👨‍💼</Text>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>{item.name}</Text>
                  <Text style={styles.cardCode}>{item.code}</Text>
                  {item.phone ? <Text style={styles.cardPhone}>📞 {item.phone}</Text> : null}
                </View>
                <View style={styles.achievement}>
                  <Text style={styles.achievementValue}>
                    {item.monthlyTarget > 0 ? Math.round((item.totalSales / item.monthlyTarget) * 100) : 0}%
                  </Text>
                  <Text style={styles.achievementLabel}>إنجاز</Text>
                </View>
              </View>
              <View style={styles.cardFooter}>
                <Text style={styles.targetText}>هدف: {item.monthlyTarget?.toLocaleString()} ﷼</Text>
                <Text style={styles.salesText}>مبيعات: {item.totalSales?.toLocaleString()} ﷼</Text>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        />
      )}

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editMode ? 'تعديل مندوب' : 'إضافة مندوب جديد'}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.fieldLabel}>اسم المندوب *</Text>
              <TextInput style={styles.fieldInput} value={formData.name} onChangeText={(v) => setFormData({ ...formData, name: v })} placeholder="اسم المندوب" placeholderTextColor="#666" />
              <Text style={styles.fieldLabel}>رقم الهاتف</Text>
              <TextInput style={styles.fieldInput} value={formData.phone} onChangeText={(v) => setFormData({ ...formData, phone: v })} placeholder="رقم الهاتف" placeholderTextColor="#666" keyboardType="phone-pad" />
              <Text style={styles.fieldLabel}>الهدف الشهري</Text>
              <TextInput style={styles.fieldInput} value={formData.monthlyTarget} onChangeText={(v) => setFormData({ ...formData, monthlyTarget: v })} keyboardType="numeric" placeholder="0" placeholderTextColor="#666" />
              <Text style={styles.fieldLabel}>إجمالي المبيعات</Text>
              <TextInput style={styles.fieldInput} value={formData.totalSales} onChangeText={(v) => setFormData({ ...formData, totalSales: v })} keyboardType="numeric" placeholder="0" placeholderTextColor="#666" />
              <Text style={styles.fieldLabel}>ملاحظات</Text>
              <TextInput style={[styles.fieldInput, { height: 60 }]} value={formData.notes} onChangeText={(v) => setFormData({ ...formData, notes: v })} placeholder="ملاحظات" placeholderTextColor="#666" multiline />
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
  summaryRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, gap: 8 },
  summaryItem: { flex: 1, backgroundColor: '#16213E', borderRadius: 10, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#2a3550' },
  summaryLabel: { color: '#94a3b8', fontSize: 11, marginBottom: 4 },
  summaryValue: { color: '#D4AF37', fontSize: 16, fontWeight: 'bold' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  emptySubtext: { color: '#94a3b8', fontSize: 12 },
  card: { backgroundColor: '#16213E', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#2a3550' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  cardIcon: { fontSize: 28, marginRight: 10 },
  cardInfo: { flex: 1 },
  cardName: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold', marginBottom: 2 },
  cardCode: { color: '#94a3b8', fontSize: 11, marginBottom: 2 },
  cardPhone: { color: '#6B7280', fontSize: 11 },
  achievement: { alignItems: 'center', backgroundColor: '#10B981' + '20', padding: 8, borderRadius: 10, minWidth: 50 },
  achievementValue: { color: '#10B981', fontSize: 16, fontWeight: 'bold' },
  achievementLabel: { color: '#10B981', fontSize: 9 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#2a3550', paddingTop: 8 },
  targetText: { color: '#94a3b8', fontSize: 11 },
  salesText: { color: '#10B981', fontSize: 11, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#16213E', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#2a3550' },
  modalTitle: { color: '#D4AF37', fontSize: 18, fontWeight: 'bold' },
  modalClose: { color: '#EF4444', fontSize: 22, fontWeight: 'bold' },
  modalBody: { padding: 16 },
  fieldLabel: { color: '#94a3b8', fontSize: 13, marginBottom: 6, marginTop: 12 },
  fieldInput: { backgroundColor: '#0A1128', borderRadius: 10, padding: 12, color: '#FFFFFF', borderWidth: 1, borderColor: '#2a3550', fontSize: 14 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 24, marginBottom: 16 },
  saveModalBtn: { flex: 1, backgroundColor: '#D4AF37', borderRadius: 12, padding: 14, alignItems: 'center' },
  saveModalBtnText: { color: '#0A1128', fontSize: 16, fontWeight: 'bold' },
  cancelModalBtn: { flex: 1, backgroundColor: '#2a3550', borderRadius: 12, padding: 14, alignItems: 'center' },
  cancelModalBtnText: { color: '#FFFFFF', fontSize: 16 },
});
