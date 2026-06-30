import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDatabase } from '../../context/DatabaseContext';

export default function ItemsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { db } = useDatabase();
  const [items, setItems] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [unit, setUnit] = useState('حبة');
  const [cost, setCost] = useState('0');
  const [price, setPrice] = useState('0');
  const [quantity, setQuantity] = useState('0');
  const [minQuantity, setMinQuantity] = useState('0');
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(useCallback(() => { loadItems(); }, [db]));

  const loadItems = async () => {
    if (!db) return;
    try {
      const result = await db.getAllAsync('SELECT * FROM items ORDER BY name');
      setItems(result);
    } catch (e) { console.log('Load error:', e); }
  };

  const addItem = async () => {
    if (!name.trim()) { Alert.alert('خطأ', 'الرجاء إدخال اسم الصنف'); return; }
    if (!db) return;
    const id = 'item' + Date.now();
    try {
      await db.runAsync(
        'INSERT INTO items (id, name, code, unit, cost, price, quantity, minQuantity) VALUES (?,?,?,?,?,?,?,?)',
        [id, name, code, unit, parseFloat(cost)||0, parseFloat(price)||0, parseFloat(quantity)||0, parseFloat(minQuantity)||0]
      );
      await loadItems();
      setName(''); setCode(''); setCost('0'); setPrice('0'); setQuantity('0'); setMinQuantity('0'); setShowForm(false);
    } catch (e) { console.log('Add error:', e); }
  };

  const deleteItem = async (id: string) => {
    Alert.alert('تأكيد', 'حذف الصنف؟', [
      { text: 'إلغاء' },
      { text: 'حذف', onPress: async () => {
        if (!db) return;
        await db.runAsync('DELETE FROM items WHERE id=?', [id]);
        await loadItems();
      }}
    ]);
  };

  const filtered = items.filter(i => i.name?.includes(searchQuery) || i.code?.includes(searchQuery));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.backBtn}>← رجوع</Text></TouchableOpacity>
        <Text style={styles.title}>الأصناف</Text>
        <TouchableOpacity onPress={() => setShowForm(!showForm)}><Text style={styles.addBtn}>+ إضافة</Text></TouchableOpacity>
      </View>
      <TextInput style={styles.search} value={searchQuery} onChangeText={setSearchQuery} placeholder="🔍 بحث..." placeholderTextColor="#666" />
      {showForm && (
        <ScrollView style={styles.form}>
          <Text style={styles.label}>اسم الصنف</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="اسم الصنف" placeholderTextColor="#666" />
          <Text style={styles.label}>الكود</Text>
          <TextInput style={styles.input} value={code} onChangeText={setCode} placeholder="كود الصنف" placeholderTextColor="#666" />
          <Text style={styles.label}>الوحدة</Text>
          <TextInput style={styles.input} value={unit} onChangeText={setUnit} placeholder="حبة" placeholderTextColor="#666" />
          <Text style={styles.label}>سعر التكلفة</Text>
          <TextInput style={styles.input} value={cost} onChangeText={setCost} placeholder="0" placeholderTextColor="#666" keyboardType="numeric" />
          <Text style={styles.label}>سعر البيع</Text>
          <TextInput style={styles.input} value={price} onChangeText={setPrice} placeholder="0" placeholderTextColor="#666" keyboardType="numeric" />
          <Text style={styles.label}>الكمية</Text>
          <TextInput style={styles.input} value={quantity} onChangeText={setQuantity} placeholder="0" placeholderTextColor="#666" keyboardType="numeric" />
          <Text style={styles.label}>الحد الأدنى</Text>
          <TextInput style={styles.input} value={minQuantity} onChangeText={setMinQuantity} placeholder="0" placeholderTextColor="#666" keyboardType="numeric" />
          <TouchableOpacity style={styles.saveBtn} onPress={addItem}><Text style={styles.saveBtnText}>حفظ</Text></TouchableOpacity>
        </ScrollView>
      )}
      <FlatList data={filtered} keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardName}>{item.name} {item.code ? `(${item.code})` : ''}</Text>
              <Text style={styles.cardDetail}>التكلفة: {item.cost} | البيع: {item.price}</Text>
              <Text style={styles.cardBalance}>الكمية: {item.quantity} {item.unit}</Text>
            </View>
            <TouchableOpacity onPress={() => deleteItem(item.id)}><Text style={styles.deleteBtn}>🗑️</Text></TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>لا توجد أصناف</Text>}
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
  form: { padding: 16, backgroundColor: '#16213E', margin: 12, borderRadius: 12, borderWidth: 1, borderColor: '#2a3550', maxHeight: 400 },
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
