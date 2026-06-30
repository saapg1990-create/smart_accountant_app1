import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, StatusBar, Alert, Modal, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAccountStore } from '../../src/store/useAccountStore';
import { ControlButtons, ControlHeader } from '../../src/components/ui/ControlButtons';

export default function AccountsScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const { accounts, loading, loadAccounts, addAccount, updateAccount, removeAccount, getMainAccounts, getSubAccounts, generateCode } = useAccountStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', code: '', type: 'أصل', balance: '0', parentId: '' });
  const [parentName, setParentName] = useState('');
  const types = ['أصل', 'خصم', 'إيراد', 'مصروف', 'ملكية'];

  useFocusEffect(useCallback(() => { loadAccounts(); }, []));

  const mainAccounts = getMainAccounts();

  const openAdd = (parentId: string = '', parentName: string = '') => {
    setEditMode(false); setSelectedId(null);
    setFormData({ name: '', code: '', type: 'أصل', balance: '0', parentId });
    setParentName(parentName);
    setShowModal(true);
  };

  const openEdit = (account: any) => {
    setEditMode(true); setSelectedId(account.id);
    setFormData({ name: account.name, code: account.code, type: account.type, balance: String(account.balance || 0), parentId: account.parentId || '' });
    const parent = accounts.find((a: any) => a.id === account.parentId);
    setParentName(parent ? parent.name : '');
    setShowModal(true);
  };

  const handleDelete = (account: any) => {
    const subs = getSubAccounts(account.id);
    if (subs.length > 0) { Alert.alert('تنبيه', 'لا يمكن حذف حساب له حسابات فرعية'); return; }
    Alert.alert('حذف', `حذف "${account.name}"؟`, [
      { text: 'إلغاء' },
      { text: 'حذف', onPress: () => removeAccount(account.id) }
    ]);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) { Alert.alert('خطأ', 'أدخل اسم الحساب'); return; }
    const code = formData.code || generateCode(formData.parentId || undefined);
    const data = { ...formData, code, balance: parseFloat(formData.balance) || 0 };
    
    if (editMode && selectedId) {
      await updateAccount(selectedId, data);
    } else {
      const result = await addAccount(data);
      if (result === null) { Alert.alert('تنبيه', 'الحساب موجود مسبقاً'); return; }
    }
    setShowModal(false);
  };

  const getIcon = (name: string) => {
    if (name.includes('أصول')) return '🏢';
    if (name.includes('خصوم')) return '💳';
    if (name.includes('ملكية')) return '👑';
    if (name.includes('إيراد')) return '💰';
    if (name.includes('مصروف')) return '💸';
    if (name.includes('صندوق')) return '💵';
    if (name.includes('بنك')) return '🏦';
    if (name.includes('عملاء')) return '👥';
    if (name.includes('مخزون')) return '📦';
    if (name.includes('مورد')) return '🏭';
    if (name.includes('ضريبة')) return '🧾';
    if (name.includes('رأس مال')) return '🏛️';
    if (name.includes('مبيع')) return '🛒';
    if (name.includes('مشتري')) return '📥';
    if (name.includes('رواتب')) return '👷';
    if (name.includes('إيجار')) return '🏠';
    return '📋';
  };

  const getTypeColor = (t: string) => ({ 'أصل': '#D4AF37', 'خصم': '#EF4444', 'إيراد': '#10B981', 'مصروف': '#3B82F6', 'ملكية': '#F59E0B' }[t] || '#6B7280');

  const displayList: any[] = [];
  mainAccounts.forEach((main: any) => {
    const matchMain = !searchQuery || main.name.includes(searchQuery) || main.code.includes(searchQuery);
    const subs = getSubAccounts(main.id).filter((s: any) => !searchQuery || s.name.includes(searchQuery) || s.code.includes(searchQuery));
    if (matchMain || subs.length > 0) {
      displayList.push({ type: 'main', data: main, show: matchMain });
      subs.forEach((sub: any) => displayList.push({ type: 'sub', data: sub, parentName: main.name }));
    }
  });

  return (
    <View style={[st.c, { paddingTop: insets.top }]}><StatusBar barStyle="light-content" />
      <ControlHeader title="دليل الحسابات" count={accounts.length} onBack={() => router.back()} onAdd={() => openAdd()} />
      <ControlButtons showSearch showRefresh showPrint showExport onRefresh={loadAccounts} />
      <TextInput style={st.si} placeholder="🔍 بحث..." placeholderTextColor="#94a3b8" value={searchQuery} onChangeText={setSearchQuery} />
      
      <View style={st.info}><Text style={st.infoText}>🏗️ الرئيسية للتجميع | 📋 الفرعية للترحيل والعمليات</Text></View>

      {loading ? <Text style={st.loading}>⏳ جاري التحميل...</Text> :
        <FlatList data={displayList} keyExtractor={(i, idx) => i.data.id + idx}
          renderItem={({ item }) => {
            if (item.type === 'main' && item.show) {
              const main = item.data;
              const subsCount = getSubAccounts(main.id).length;
              const totalBalance = getSubAccounts(main.id).reduce((s: number, sub: any) => s + (sub.balance || 0), 0);
              return (
                <TouchableOpacity style={[st.mainCard, { borderRightColor: getTypeColor(main.type), borderRightWidth: 5 }]} 
                  onPress={() => openEdit(main)} onLongPress={() => handleDelete(main)}>
                  <View style={st.row1}>
                    <Text style={st.icon}>{getIcon(main.name)}</Text>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={st.name}>{main.name}</Text>
                      <Text style={st.code}>{main.code}</Text>
                    </View>
                    <View style={[st.badge, { backgroundColor: getTypeColor(main.type) + '20' }]}>
                      <Text style={[st.badgeText, { color: getTypeColor(main.type) }]}>{main.type}</Text>
                    </View>
                  </View>
                  <View style={st.row2}>
                    <Text style={st.balance}>المجموع: {totalBalance.toLocaleString()} ﷼</Text>
                    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                      <Text style={st.count}>{subsCount} حساب فرعي</Text>
                      <TouchableOpacity style={st.addSub} onPress={() => openAdd(main.id, main.name)}>
                        <Text style={st.addSubText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }
            if (item.type === 'sub') {
              const sub = item.data;
              return (
                <TouchableOpacity key={sub.id} style={st.subCard}
                  onPress={() => openEdit(sub)} onLongPress={() => handleDelete(sub)}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={st.subIcon}>{getIcon(sub.name)}</Text>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={st.subName}>{sub.name}</Text>
                      <Text style={st.subCode}>{sub.code}</Text>
                    </View>
                    <Text style={[st.subBalance, { color: sub.balance >= 0 ? '#10B981' : '#EF4444' }]}>
                      {sub.balance?.toLocaleString()} ﷼
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }
            return null;
          }}
          ListEmptyComponent={
            <View style={st.emptyView}>
              <Text style={st.emptyIcon}>📚</Text>
              <Text style={st.empty}>لا توجد حسابات</Text>
              <TouchableOpacity style={st.emptyBtn} onPress={() => openAdd()}>
                <Text style={st.emptyBtnText}>+ إضافة حساب رئيسي</Text>
              </TouchableOpacity>
            </View>
          }
          contentContainerStyle={{ padding: 16 }}
        />
      }

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={st.mo}><View style={st.mc}><View style={st.mh}><Text style={st.mt}>{editMode ? '✏️ تعديل حساب' : parentName ? `➕ فرعي تحت: ${parentName}` : '📁 حساب رئيسي جديد'}</Text><TouchableOpacity onPress={() => setShowModal(false)}><Text style={st.mx}>✕</Text></TouchableOpacity></View>
        <ScrollView style={st.mb}>
          <Text style={st.fl}>اسم الحساب *</Text><TextInput style={st.fi} value={formData.name} onChangeText={v => setFormData({ ...formData, name: v })} placeholder="اسم الحساب" placeholderTextColor="#666" />
          <Text style={st.fl}>الكود (تلقائي)</Text><TextInput style={[st.fi, { color: '#D4AF37' }]} value={formData.code || generateCode(formData.parentId || undefined)} editable={false} />
          {!formData.parentId && (
            <>
              <Text style={st.fl}>النوع</Text>
              <View style={st.typeRow}>{types.map(t => <TouchableOpacity key={t} style={[st.typeBtn, formData.type === t && st.typeBtnA]} onPress={() => setFormData({ ...formData, type: t })}><Text style={[st.typeText, formData.type === t && st.typeTextA]}>{t}</Text></TouchableOpacity>)}</View>
            </>
          )}
          <Text style={st.fl}>الرصيد الافتتاحي</Text><TextInput style={st.fi} value={formData.balance} onChangeText={v => setFormData({ ...formData, balance: v })} keyboardType="numeric" placeholder="0" placeholderTextColor="#666" />
          <TouchableOpacity style={st.sb} onPress={handleSave}><Text style={st.sbt}>💾 {editMode ? 'تحديث' : 'حفظ'}</Text></TouchableOpacity>
        </ScrollView></View></View>
      </Modal>
    </View>
  );
}

const st = StyleSheet.create({
  c: { flex: 1, backgroundColor: '#0A1128' },
  si: { marginHorizontal: 16, marginBottom: 8, padding: 12, backgroundColor: '#16213E', borderRadius: 10, color: '#FFF', borderWidth: 1, borderColor: '#2a3550', textAlign: 'right' },
  info: { marginHorizontal: 16, marginBottom: 8, padding: 8, backgroundColor: '#D4AF3710', borderRadius: 8 },
  infoText: { color: '#D4AF37', fontSize: 10, textAlign: 'center' },
  loading: { color: '#D4AF37', textAlign: 'center', marginTop: 40, fontSize: 16 },
  emptyView: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 64, marginBottom: 12 },
  empty: { color: '#666', fontSize: 16, marginBottom: 16 },
  emptyBtn: { backgroundColor: '#D4AF37', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  emptyBtnText: { color: '#000', fontWeight: 'bold' },
  mainCard: { backgroundColor: '#16213E', borderRadius: 14, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: '#2a3550' },
  subCard: { backgroundColor: '#1a2240', borderRadius: 10, padding: 12, marginLeft: 20, marginBottom: 6, borderWidth: 1, borderColor: '#2a3550' },
  row1: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  row2: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#2a3550', paddingTop: 8 },
  icon: { fontSize: 28 }, subIcon: { fontSize: 22 },
  name: { color: '#FFF', fontSize: 18, fontWeight: 'bold', textAlign: 'right' },
  subName: { color: '#FFF', fontSize: 15, fontWeight: 'bold', textAlign: 'right' },
  code: { color: '#94a3b8', fontSize: 10, textAlign: 'right' }, subCode: { color: '#94a3b8', fontSize: 9, textAlign: 'right' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }, badgeText: { fontSize: 10, fontWeight: 'bold' },
  balance: { color: '#D4AF37', fontSize: 14, fontWeight: 'bold' },
  subBalance: { fontSize: 15, fontWeight: 'bold' },
  count: { color: '#94a3b8', fontSize: 10 },
  addSub: { backgroundColor: '#10B98120', width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#10B981' },
  addSubText: { color: '#10B981', fontSize: 18, fontWeight: 'bold' },
  mo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  mc: { backgroundColor: '#16213E', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%' },
  mh: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#2a3550' },
  mt: { color: '#D4AF37', fontSize: 16, fontWeight: 'bold', flex: 1 }, mx: { color: '#EF4444', fontSize: 22 }, mb: { padding: 16 },
  fl: { color: '#94a3b8', fontSize: 13, marginBottom: 6, marginTop: 12 },
  fi: { backgroundColor: '#0A1128', borderRadius: 10, padding: 12, color: '#FFF', borderWidth: 1, borderColor: '#2a3550', fontSize: 14, textAlign: 'right' },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  typeBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, backgroundColor: '#0A1128', borderWidth: 1, borderColor: '#2a3550' },
  typeBtnA: { borderColor: '#D4AF37', backgroundColor: '#D4AF3720' },
  typeText: { color: '#94a3b8', fontSize: 12 }, typeTextA: { color: '#D4AF37', fontWeight: 'bold' },
  sb: { backgroundColor: '#D4AF37', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 20, marginBottom: 20 },
  sbt: { color: '#0A1128', fontSize: 16, fontWeight: 'bold' },
});
