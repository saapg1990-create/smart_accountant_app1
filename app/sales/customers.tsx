import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDatabase } from '../../context/DatabaseContext';

export default function CustomersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { db } = useDatabase();
  const [customers, setCustomers] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [balance, setBalance] = useState('0');
  const [creditLimit, setCreditLimit] = useState('0');
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(useCallback(() => { loadCustomers(); }, [db]));

  const loadCustomers = async () => {
    if (!db) return;
    try {
      const result = await db.getAllAsync('SELECT * FROM customers ORDER BY name');
      setCustomers(result);
    } catch (e) { console.log('Load error:', e); }
  };

  const addCustomer = async () => {
    if (!name.trim()) { Alert.alert('خطأ', 'الرجاء إدخال الاسم'); return; }
    if (!db) return;
    const id = 'cust' + Date.now();
    try {
      await db.runAsync(
        'INSERT INTO customers (id, name, phone, address, balance, creditLimit) VALUES (?,?,?,?,?,?)',
        [id, name, phone, address, parseFloat(balance)||0, parseFloat(creditLimit)||0]
      );
      await loadCustomers();
      setName(''); setPhone(''); setAddress(''); setBalance('0'); setCreditLimit('0'); setShowForm(false);
    } catch (e) { console.log('Add error:', e); }
  };

  const deleteCustomer = async (id: string) => {
    Alert.alert('تأكيد', 'حذف العميل؟', [
      { text: 'إلغاء' },
      { text: 'حذف', onPress: async () => {
        if (!db) return;
        await db.runAsync('DELETE FROM customers WHERE id=?', [id]);
        await loadCustomers();
      }}
    ]);
  };

  const filtered = customers.filter(c => c.name?.includes(searchQuery) || c.phone?.includes(searchQuery));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.backBtn}>← رجوع</Text></TouchableOpacity>
        <Text style={styles.title}>العملاء</Text>
        <TouchableOpacity onPress={() => setShowForm(!showForm)}><Text style={styles.addBtn}>+ إضافة</Text></TouchableOpacity>
      </View>
      <TextInput style={styles.search} value={searchQuery} onChangeText={setSearchQuery} placeholder="🔍 بحث..." placeholderTextColor="#666" />
      {showForm && (
        <ScrollView style={styles.form}>
          <Text style={styles.label}>الاسم</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="اسم العميل" placeholderTextColor="#666" />
          <Text style={styles.label}>الهاتف</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="رقم الهاتف" placeholderTextColor="#666" keyboardType="phone-pad" />
          <Text style={styles.label}>العنوان</Text>
          <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="العنوان" placeholderTextColor="#666" />
          <Text style={styles.label}>الرصيد الافتتاحي</Text>
          <TextInput style={styles.input} value={balance} onChangeText={setBalance} placeholder="0" placeholderTextColor="#666" keyboardType="numeric" />
          <Text style={styles.label}>الحد الائتماني</Text>
          <TextInput style={styles.input} value={creditLimit} onChangeText={setCreditLimit} placeholder="0" placeholderTextColor="#666" keyboardType="numeric" />
          <TouchableOpacity style={styles.saveBtn} onPress={addCustomer}><Text style={styles.saveBtnText}>حفظ</Text></TouchableOpacity>
        </ScrollView>
      )}
      <FlatList data={filtered} keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardName}>{item.name}</Text>
              <Text style={styles.cardDetail}>📞 {item.phone || 'لا يوجد'}</Text>
              <Text style={styles.cardBalance}>الرصيد: {item.balance?.toLocaleString() || 0} YER</Text>
            </View>
            <TouchableOpacity onPress={() => deleteCustomer(item.id)}><Text style={styles.deleteBtn}>🗑️</Text></TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>لا يوجد عملاء</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f1e' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1a2540' },
  backBtn: { color: '#D4AF37', fontSize: 16 },
  title: { color: '#D4AF37', fontSize: 22, fontWeight: 'bold' },
  addBtn: { color: '#D4AF37', fontSize: 16, fontWeight: 'bold' },
  search: { backgroundColor: '#16213E', color: '#fff', padding: 12, margin: 12, borderRadius: 8, borderWidth: 1, borderColor: '#2a3550', textAlign: 'right' },
  form: { padding: 16, backgroundColor: '#16213E', margin: 12, borderRadius: 12, borderWidth: 1, borderColor: '#2a3550', maxHeight: 300 },
  label: { color: '#9A9B3B', fontSize: 14, marginBottom: 4, marginTop: 8 },
  input: { backgroundColor: '#0a0f1e', color: '#fff', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#2a3550', marginBottom: 6, textAlign: 'right' },
  saveBtn: { backgroundColor: '#D4AF37', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 12, marginBottom: 8 },
  saveBtnText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16213E', padding: 14, marginHorizontal: 12, marginVertical: 5, borderRadius: 12, borderWidth: 1, borderColor: '#2a3550' },
  cardName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  cardDetail: { color: '#9A9B3B', fontSize: 12, marginTop: 4 },
  cardBalance: { color: '#D4AF37', fontSize: 13, marginTop: 4 },
  deleteBtn: { fontSize: 22, padding: 8 },
  empty: { color: '#666', textAlign: 'center', marginTop: 40, fontSize: 16 },
});
