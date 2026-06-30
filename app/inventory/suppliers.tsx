import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDatabase } from '../../context/DatabaseContext';
import { PickerModal } from '../../src/components/ui/PickerModal';
import { useLocalTable } from '../../hooks/useLocalStore';

export default function SuppliersScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const { db } = useDatabase();
  const { data: currencies } = useLocalTable('currencies');
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [currency, setCurrency] = useState('YER');
  const [balance, setBalance] = useState('0');
  const [creditLimit, setCreditLimit] = useState('0');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  useFocusEffect(useCallback(() => { loadSuppliers(); }, [db]));

  const loadSuppliers = async () => {
    if (!db) return;
    try {
      const result = await db.getAllAsync('SELECT * FROM suppliers ORDER BY name');
      setSuppliers(result);
    } catch (e) { console.log('Load error:', e); }
  };

  const addSupplier = async () => {
    if (!name.trim()) { Alert.alert('خطأ', 'أدخل اسم المورد'); return; }
    if (!db) return;
    const id = 'sup' + Date.now();
    try {
      await db.runAsync('INSERT INTO suppliers (id, name, phone, address, currency, balance, creditLimit) VALUES (?,?,?,?,?,?,?)',
        [id, name, phone, address, currency, parseFloat(balance)||0, parseFloat(creditLimit)||0]);
      await loadSuppliers();
      setName(''); setPhone(''); setAddress(''); setCurrency('YER'); setBalance('0'); setCreditLimit('0'); setShowForm(false);
    } catch (e) { console.log('Add error:', e); }
  };

  const deleteSupplier = async (id: string) => {
    Alert.alert('تأكيد', 'حذف المورد؟', [{ text: 'إلغاء' }, { text: 'حذف', onPress: async () => { await db.runAsync('DELETE FROM suppliers WHERE id=?', [id]); await loadSuppliers(); }}]);
  };

  const filtered = suppliers.filter(s => s.name?.includes(searchQuery) || s.phone?.includes(searchQuery));

  return (
    <View style={[st.container, { paddingTop: insets.top }]}>
      <View style={st.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={st.backBtn}>← رجوع</Text></TouchableOpacity>
        <Text style={st.title}>الموردين</Text>
        <TouchableOpacity onPress={() => setShowForm(!showForm)}><Text style={st.addBtn}>+ إضافة</Text></TouchableOpacity>
      </View>
      <TextInput style={st.search} placeholder="🔍 بحث..." placeholderTextColor="#666" value={searchQuery} onChangeText={setSearchQuery} />
      {showForm && (
        <ScrollView style={st.form}>
          <Text style={st.label}>اسم المورد *</Text>
          <TextInput style={st.input} value={name} onChangeText={setName} placeholder="اسم المورد" placeholderTextColor="#666" />
          <Text style={st.label}>رقم الهاتف</Text>
          <TextInput style={st.input} value={phone} onChangeText={setPhone} placeholder="رقم الهاتف" placeholderTextColor="#666" keyboardType="phone-pad" />
          <Text style={st.label}>العنوان</Text>
          <TextInput style={st.input} value={address} onChangeText={setAddress} placeholder="العنوان" placeholderTextColor="#666" />
          <Text style={st.label}>العملة</Text>
          <TouchableOpacity style={st.picker} onPress={() => setShowCurrencyPicker(true)}>
            <Text style={st.pickerText}>{currency}</Text>
            <Text style={st.arrow}>▼</Text>
          </TouchableOpacity>
          <Text style={st.label}>الرصيد الافتتاحي</Text>
          <TextInput style={st.input} value={balance} onChangeText={setBalance} placeholder="0" placeholderTextColor="#666" keyboardType="numeric" />
          <Text style={st.label}>الحد الائتماني</Text>
          <TextInput style={st.input} value={creditLimit} onChangeText={setCreditLimit} placeholder="0" placeholderTextColor="#666" keyboardType="numeric" />
          <TouchableOpacity style={st.saveBtn} onPress={addSupplier}><Text style={st.saveBtnText}>💾 حفظ</Text></TouchableOpacity>
        </ScrollView>
      )}
      <FlatList data={filtered} keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={st.card}>
            <View style={{ flex: 1 }}>
              <Text style={st.cardName}>{item.name}</Text>
              <Text style={st.cardDetail}>📞 {item.phone || 'لا يوجد'} | 📍 {item.address || '-'} | 💱 {item.currency}</Text>
              <Text style={st.cardBalance}>الرصيد: {item.balance?.toLocaleString() || 0} | الحد: {item.creditLimit?.toLocaleString() || 0}</Text>
            </View>
            <TouchableOpacity onPress={() => deleteSupplier(item.id)}><Text style={st.deleteBtn}>🗑️</Text></TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={st.empty}>لا يوجد موردين</Text>}
      />
      <PickerModal visible={showCurrencyPicker} title="اختيار العملة" data={currencies || []} displayField="code" onSelect={(i: any) => setCurrency(i.code)} onClose={() => setShowCurrencyPicker(false)} />
    </View>
  );
}
const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f1e' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1a2540' },
  backBtn: { color: '#D4AF37', fontSize: 16 }, title: { color: '#D4AF37', fontSize: 22, fontWeight: 'bold' }, addBtn: { color: '#D4AF37', fontSize: 16, fontWeight: 'bold' },
  search: { marginHorizontal: 16, marginTop: 10, padding: 12, backgroundColor: '#16213E', borderRadius: 10, color: '#FFF', borderWidth: 1, borderColor: '#2a3550', textAlign: 'right' },
  form: { padding: 16, backgroundColor: '#16213E', margin: 12, borderRadius: 12, borderWidth: 1, borderColor: '#2a3550', maxHeight: 400 },
  label: { color: '#9A9B3B', fontSize: 14, marginBottom: 4, marginTop: 8 },
  input: { backgroundColor: '#0a0f1e', color: '#fff', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#2a3550', marginBottom: 6, textAlign: 'right' },
  picker: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0a0f1e', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#2a3550', marginBottom: 8 },
  pickerText: { color: '#fff', fontSize: 14 }, arrow: { color: '#D4AF37', fontSize: 12 },
  saveBtn: { backgroundColor: '#D4AF37', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 12, marginBottom: 8 }, saveBtnText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16213E', padding: 14, marginHorizontal: 12, marginVertical: 5, borderRadius: 12, borderWidth: 1, borderColor: '#2a3550' },
  cardName: { color: '#fff', fontSize: 16, fontWeight: 'bold' }, cardDetail: { color: '#9A9B3B', fontSize: 12, marginTop: 2 }, cardBalance: { color: '#D4AF37', fontSize: 13, marginTop: 4 },
  deleteBtn: { fontSize: 22, padding: 8 }, empty: { color: '#666', textAlign: 'center', marginTop: 40, fontSize: 16 },
});
