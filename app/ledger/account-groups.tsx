import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, StatusBar, Alert, Modal, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAccountStore } from '../../src/store/useAccountStore';
import { ControlButtons, ControlHeader } from '../../src/components/ui/ControlButtons';

export default function AccountGroupsScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const { accounts, loadAccounts, getMainAccounts, getSubAccounts } = useAccountStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', type: 'أصل', parentId: '', notes: '' });

  useFocusEffect(useCallback(() => { loadAccounts(); }, []));

  const groups = getMainAccounts();
  const filtered = groups.filter((g: any) => g.name?.includes(searchQuery));

  const getColor = (t: string) => ({ 'أصل':'#D4AF37','خصم':'#EF4444','ملكية':'#F59E0B','إيراد':'#10B981','مصروف':'#3B82F6' }[t] || '#6B7280');

  const openAdd = () => { setEditMode(false); setEditingId(null); setFormData({ name: '', type: 'أصل', parentId: '', notes: '' }); setShowModal(true); };
  
  const openEdit = (group: any) => {
    setEditMode(true); setEditingId(group.id);
    setFormData({ name: group.name, type: group.type, parentId: group.parentId || '', notes: group.notes || '' });
    setShowModal(true);
  };

  const handleDelete = (group: any) => {
    const subs = getSubAccounts(group.id);
    if (subs.length > 0) { Alert.alert('تنبيه', `لا يمكن حذف "${group.name}" لأنه يحتوي على ${subs.length} حسابات فرعية`); return; }
    Alert.alert('حذف', `حذف "${group.name}"؟`, [{ text: 'إلغاء' }, { text: 'حذف', onPress: async () => {
      await useAccountStore.getState().removeAccount(group.id);
      loadAccounts();
    }}]);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) { Alert.alert('خطأ', 'أدخل اسم المجموعة'); return; }
    const { addAccount, updateAccount, generateCode } = useAccountStore.getState();
    const code = generateCode(formData.parentId || undefined);
    
    if (editMode && editingId) {
      await updateAccount(editingId, { ...formData, code });
    } else {
      await addAccount({ ...formData, code, isDebit: formData.type === 'أصل' || formData.type === 'مصروف' ? 1 : 0 });
    }
    setShowModal(false);
    loadAccounts();
  };

  return (
    <View style={[st.c, { paddingTop: insets.top }]}><StatusBar barStyle="light-content" />
      <ControlHeader title="مجموعات الحسابات" count={groups.length} onBack={() => router.back()} onAdd={openAdd} />
      <ControlButtons showSearch showRefresh showPrint showExport onRefresh={loadAccounts} />
      <TextInput style={st.si} placeholder="🔍 بحث..." placeholderTextColor="#94a3b8" value={searchQuery} onChangeText={setSearchQuery} />
      
      {filtered.length === 0 ? <Text style={st.et}>لا توجد مجموعات</Text> :
        <FlatList data={filtered} keyExtractor={(i: any) => i.id}
          renderItem={({ item }: any) => {
            const subs = getSubAccounts(item.id);
            const totalBalance = subs.reduce((s: number, sub: any) => s + (sub.balance || 0), 0);
            return (
              <TouchableOpacity style={[st.card, { borderRightColor: getColor(item.type), borderRightWidth: 5 }]} onPress={() => openEdit(item)} onLongPress={() => handleDelete(item)}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={st.name}>{item.name}</Text>
                    <Text style={st.code}>الكود: {item.code}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <View style={[st.badge, { backgroundColor: getColor(item.type) + '20' }]}>
                      <Text style={[st.badgeText, { color: getColor(item.type) }]}>{item.type}</Text>
                    </View>
                    <Text style={st.count}>{subs.length} حسابات فرعية</Text>
                    <Text style={st.balance}>{totalBalance.toLocaleString()} ﷼</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={{ padding: 16 }}
        />
      }

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={st.mo}><View style={st.mc}><View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#2a3550' }}><Text style={{ color: '#D4AF37', fontSize: 16, fontWeight: 'bold' }}>{editMode ? '✏️ تعديل' : '📁 مجموعة جديدة'}</Text><TouchableOpacity onPress={() => setShowModal(false)}><Text style={{ color: '#EF4444', fontSize: 22 }}>✕</Text></TouchableOpacity></View>
        <ScrollView style={{ padding: 16 }}>
          <Text style={st.fl}>اسم المجموعة *</Text><TextInput style={st.fi} value={formData.name} onChangeText={v => setFormData({ ...formData, name: v })} placeholder="اسم المجموعة" placeholderTextColor="#666" />
          
          <Text style={st.fl}>النوع</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {['أصل', 'خصم', 'إيراد', 'مصروف', 'ملكية'].map(t => (
              <TouchableOpacity key={t} style={[st.tb, formData.type === t && st.tba]} onPress={() => setFormData({ ...formData, type: t })}>
                <Text style={[st.tt, formData.type === t && st.tta]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={st.fl}>ملاحظات</Text><TextInput style={[st.fi, { height: 60 }]} value={formData.notes} onChangeText={v => setFormData({ ...formData, notes: v })} multiline placeholder="ملاحظات" placeholderTextColor="#666" />
          
          <TouchableOpacity style={st.sb} onPress={handleSave}><Text style={st.sbt}>💾 {editMode ? 'تحديث' : 'حفظ'}</Text></TouchableOpacity>
        </ScrollView></View></View>
      </Modal>
    </View>
  );
}
const st = StyleSheet.create({
  c: { flex: 1, backgroundColor: '#0A1128' },
  si: { marginHorizontal: 12, marginBottom: 6, padding: 12, backgroundColor: '#16213E', borderRadius: 10, color: '#FFF', borderWidth: 1, borderColor: '#2a3550', textAlign: 'right' },
  et: { color: '#FFF', fontSize: 16, textAlign: 'center', marginTop: 40 },
  card: { backgroundColor: '#16213E', borderRadius: 14, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: '#2a3550' },
  name: { color: '#FFF', fontSize: 18, fontWeight: 'bold', textAlign: 'right' },
  code: { color: '#94a3b8', fontSize: 10, textAlign: 'right', marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-end' },
  badgeText: { fontSize: 10, fontWeight: 'bold' },
  count: { color: '#94a3b8', fontSize: 10, marginTop: 4 },
  balance: { color: '#10B981', fontSize: 13, fontWeight: 'bold', marginTop: 2 },
  mo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  mc: { backgroundColor: '#16213E', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%' },
  fl: { color: '#94a3b8', fontSize: 13, marginBottom: 6, marginTop: 12 },
  fi: { backgroundColor: '#0A1128', borderRadius: 10, padding: 12, color: '#FFF', borderWidth: 1, borderColor: '#2a3550', fontSize: 14, textAlign: 'right' },
  tb: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, backgroundColor: '#0A1128', borderWidth: 1, borderColor: '#2a3550' },
  tba: { borderColor: '#D4AF37', backgroundColor: '#D4AF3720' },
  tt: { color: '#94a3b8', fontSize: 12 }, tta: { color: '#D4AF37', fontWeight: 'bold' },
  sb: { backgroundColor: '#D4AF37', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 20, marginBottom: 20 },
  sbt: { color: '#0A1128', fontSize: 16, fontWeight: 'bold' },
});
