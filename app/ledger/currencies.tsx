import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, StatusBar, Alert, Modal } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDatabase } from '../../src/context/DatabaseContext';
import { useAccountStore } from '../../src/store/useAccountStore';
import { ControlButtons, ControlHeader } from '../../src/components/ui/ControlButtons';

export default function CurrenciesScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const { db } = useDatabase();
  const { loadAccounts } = useAccountStore();
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ code: '', name: '', symbol: '', rate: '1', isDefault: false });
  const [showRateModal, setShowRateModal] = useState(false);
  const [rateId, setRateId] = useState('');
  const [newRate, setNewRate] = useState('');

  useFocusEffect(useCallback(() => { if (db) loadAll(); }, [db]));

  const loadAll = async () => {
    if (!db) return;
    const result = await db.getAllAsync('SELECT * FROM currencies ORDER BY isDefault DESC, code');
    setCurrencies(result);
  };

  const filtered = currencies.filter((c: any) => c.code?.includes(searchQuery) || c.name?.includes(searchQuery));

  const openAdd = () => { setEditMode(false); setEditingId(null); setFormData({ code: '', name: '', symbol: '', rate: '1', isDefault: false }); setShowModal(true); };
  const openEdit = (item: any) => { setEditMode(true); setEditingId(item.id); setFormData({ code: item.code, name: item.name, symbol: item.symbol, rate: String(item.rate), isDefault: item.isDefault === 1 }); setShowModal(true); };
  const openRateUpdate = (item: any) => { setRateId(item.id); setNewRate(String(item.rate)); setShowRateModal(true); };

  const handleDelete = (id: string) => {
    Alert.alert('حذف', 'حذف العملة؟', [{ text: 'إلغاء' }, { text: 'حذف', onPress: async () => { if (!db) return; await db.runAsync('DELETE FROM currencies WHERE id=?', [id]); await loadAll(); } }]);
  };

  const handleSave = async () => {
    if (!db) return;
    if (!formData.code || !formData.name) { Alert.alert('خطأ', 'أكمل البيانات'); return; }
    const data = { code: formData.code.toUpperCase(), name: formData.name, symbol: formData.symbol, rate: parseFloat(formData.rate) || 1, isDefault: formData.isDefault ? 1 : 0 };
    if (editMode && editingId) { await db.runAsync('UPDATE currencies SET code=?, name=?, symbol=?, rate=?, isDefault=? WHERE id=?', [data.code, data.name, data.symbol, data.rate, data.isDefault, editingId]); }
    else { await db.runAsync('INSERT INTO currencies (id, code, name, symbol, rate, isDefault) VALUES (?,?,?,?,?,?)', ['cur-' + Date.now(), data.code, data.name, data.symbol, data.rate, data.isDefault]); }
    if (data.isDefault === 1) { await db.runAsync('UPDATE currencies SET isDefault=0 WHERE id!=?', [editingId || '']); }
    await loadAll(); setShowModal(false);
  };

  const updateRate = async () => {
    if (!db) return;
    const rate = parseFloat(newRate) || 1;
    const oldCurrency = currencies.find((c: any) => c.id === rateId);
    const oldRate = oldCurrency?.rate || 1;
    await db.runAsync('UPDATE currencies SET rate=? WHERE id=?', [rate, rateId]);
    if (oldCurrency && oldRate !== rate && oldCurrency.code !== 'YER') {
      const factor = rate / oldRate;
      await db.runAsync('UPDATE accounts SET balance = round(balance * ?, 2) WHERE currency = ?', [factor, oldCurrency.code]);
      await loadAccounts();
      Alert.alert('✅', `تم تحديث السعر وتأثير الحسابات`);
    }
    await loadAll(); setShowRateModal(false);
  };

  return (
    <View style={[st.c, { paddingTop: insets.top }]}><StatusBar barStyle="light-content" />
      <ControlHeader title="العملات" count={currencies.length} onBack={() => router.back()} onAdd={openAdd} />
      <ControlButtons showSearch showPrint showRefresh showExport onRefresh={loadAll} />
      <TextInput style={st.si} placeholder="🔍 بحث..." placeholderTextColor="#94a3b8" value={searchQuery} onChangeText={setSearchQuery} />
      <FlatList data={filtered} keyExtractor={(i: any) => i.id}
        renderItem={({ item }: any) => (
          <TouchableOpacity style={st.card} onPress={() => openEdit(item)} onLongPress={() => handleDelete(item.id)}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}><Text style={st.code}>{item.code} {item.symbol} {item.isDefault === 1 ? '⭐' : ''}</Text><Text style={st.name}>{item.name}</Text></View>
              <View style={{ alignItems: 'flex-end' }}><Text style={st.rate}>السعر: {item.rate?.toLocaleString()}</Text><TouchableOpacity style={st.rateBtn} onPress={() => openRateUpdate(item)}><Text style={st.rateBtnText}>💱 تحديث</Text></TouchableOpacity></View>
            </View>
          </TouchableOpacity>
        )} ListEmptyComponent={<Text style={st.et}>لا توجد عملات</Text>} contentContainerStyle={{ padding: 16 }} />
    </View>
  );
}
const st = StyleSheet.create({
  c: { flex: 1, backgroundColor: '#0A1128' }, si: { marginHorizontal: 16, marginBottom: 8, padding: 12, backgroundColor: '#16213E', borderRadius: 10, color: '#FFF', borderWidth: 1, borderColor: '#2a3550', textAlign: 'right' }, et: { color: '#FFF', fontSize: 16, textAlign: 'center', marginTop: 40 },
  card: { backgroundColor: '#16213E', borderRadius: 14, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: '#2a3550' }, code: { color: '#D4AF37', fontSize: 18, fontWeight: 'bold' }, name: { color: '#FFF', fontSize: 14, marginTop: 4 },
  rate: { color: '#10B981', fontSize: 13, fontWeight: 'bold', marginTop: 4 }, rateBtn: { marginTop: 6, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: '#D4AF3720', borderRadius: 8, borderWidth: 1, borderColor: '#D4AF3740' }, rateBtnText: { color: '#D4AF37', fontSize: 11 },
});
