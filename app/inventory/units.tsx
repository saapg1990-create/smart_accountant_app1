import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDatabase } from '../../context/DatabaseContext';

export default function UnitsScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const { db } = useDatabase();
  const [data, setData] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');

  useFocusEffect(useCallback(() => { loadData(); }, [db]));
  const loadData = async () => { if (!db) return; const r = await db.getAllAsync('SELECT * FROM units ORDER BY name'); setData(r); };
  const addData = async () => { if (!name.trim()) return Alert.alert('خطأ', 'أدخل الاسم'); const id = 'u' + Date.now(); await db.runAsync('INSERT INTO units (id, name) VALUES (?,?)', [id, name]); await loadData(); setName(''); setShowForm(false); };
  const deleteData = async (id: string) => { Alert.alert('تأكيد', 'حذف؟', [{ text: 'إلغاء' }, { text: 'حذف', onPress: async () => { await db.runAsync('DELETE FROM units WHERE id=?', [id]); await loadData(); } }]); };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}><TouchableOpacity onPress={() => router.back()}><Text style={styles.backBtn}>← رجوع</Text></TouchableOpacity><Text style={styles.title}>الوحدات</Text><TouchableOpacity onPress={() => setShowForm(!showForm)}><Text style={styles.addBtn}>+ إضافة</Text></TouchableOpacity></View>
      {showForm && (<View style={styles.form}><Text style={styles.label}>اسم الوحدة</Text><TextInput style={styles.input} value={name} onChangeText={setName} /><TouchableOpacity style={styles.saveBtn} onPress={addData}><Text style={styles.saveBtnText}>حفظ</Text></TouchableOpacity></View>)}
      <FlatList data={data} keyExtractor={i => i.id} renderItem={({ item }) => (<View style={styles.card}><Text style={styles.cardName}>{item.name}</Text><TouchableOpacity onPress={() => deleteData(item.id)}><Text style={styles.deleteBtn}>🗑️</Text></TouchableOpacity></View>)} ListEmptyComponent={<Text style={styles.empty}>لا توجد وحدات</Text>} />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f1e' }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1a2540' }, backBtn: { color: '#D4AF37', fontSize: 16 }, title: { color: '#D4AF37', fontSize: 22, fontWeight: 'bold' }, addBtn: { color: '#D4AF37', fontSize: 16, fontWeight: 'bold' },
  form: { padding: 16, backgroundColor: '#16213E', margin: 12, borderRadius: 12 }, label: { color: '#9A9B3B', fontSize: 14, marginTop: 8 }, input: { backgroundColor: '#0a0f1e', color: '#fff', padding: 10, borderRadius: 8, marginBottom: 6, textAlign: 'right' }, saveBtn: { backgroundColor: '#D4AF37', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 12 }, saveBtnText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#16213E', padding: 14, marginHorizontal: 12, marginVertical: 5, borderRadius: 12 }, cardName: { color: '#fff', fontSize: 16, fontWeight: 'bold' }, deleteBtn: { fontSize: 22, padding: 8 }, empty: { color: '#666', textAlign: 'center', marginTop: 40, fontSize: 16 },
});
