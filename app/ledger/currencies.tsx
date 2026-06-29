import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useDatabase } from '../../context/DatabaseContext';

export default function CurrenciesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { db } = useDatabase();
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [rate, setRate] = useState('');

  useFocusEffect(useCallback(() => {
    loadCurrencies();
  }, [db]));

  const loadCurrencies = async () => {
    if (!db) return;
    try {
      const result = await db.getAllAsync('SELECT * FROM currencies ORDER BY isDefault DESC, code');
      setCurrencies(result);
    } catch (e) {
      console.log('Load currencies error:', e);
    }
  };

  const addCurrency = async () => {
    if (!code.trim() || !name.trim()) { Alert.alert('خطأ', 'الرجاء إدخال الكود والاسم'); return; }
    if (!db) return;
    const id = 'curr' + Date.now();
    try {
      await db.runAsync(
        'INSERT INTO currencies (id, code, name, symbol, rate) VALUES (?,?,?,?,?)',
        [id, code.toUpperCase(), name, symbol, parseFloat(rate) || 1]
      );
      await loadCurrencies();
      setCode(''); setName(''); setSymbol(''); setRate(''); setShowForm(false);
    } catch (e) {
      Alert.alert('خطأ', 'الكود موجود مسبقاً');
    }
  };

  const deleteCurrency = async (id: string) => {
    Alert.alert('تأكيد', 'هل تريد حذف هذه العملة؟', [
      { text: 'إلغاء' },
      { text: 'حذف', onPress: async () => {
        if (!db) return;
        await db.runAsync('DELETE FROM currencies WHERE id=?', [id]);
        await loadCurrencies();
      }}
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>← رجوع</Text>
        </TouchableOpacity>
        <Text style={styles.title}>العملات</Text>
        <TouchableOpacity onPress={() => setShowForm(!showForm)}>
          <Text style={styles.addBtn}>+ إضافة</Text>
        </TouchableOpacity>
      </View>

      {showForm && (
        <View style={styles.form}>
          <Text style={styles.label}>كود العملة</Text>
          <TextInput style={styles.input} value={code} onChangeText={setCode} placeholder="مثال: USD" placeholderTextColor="#666" />
          <Text style={styles.label}>اسم العملة</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="مثال: دولار أمريكي" placeholderTextColor="#666" />
          <Text style={styles.label}>الرمز</Text>
          <TextInput style={styles.input} value={symbol} onChangeText={setSymbol} placeholder="مثال: $" placeholderTextColor="#666" />
          <Text style={styles.label}>سعر الصرف</Text>
          <TextInput style={styles.input} value={rate} onChangeText={setRate} placeholder="مثال: 530" placeholderTextColor="#666" keyboardType="numeric" />
          <TouchableOpacity style={styles.saveBtn} onPress={addCurrency}>
            <Text style={styles.saveBtnText}>حفظ</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={currencies}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.currencyCode}>{item.code} {item.isDefault ? '(افتراضي)' : ''}</Text>
              <Text style={styles.currencyName}>{item.name}</Text>
              <Text style={styles.currencyRate}>السعر: {item.rate} {item.symbol}</Text>
            </View>
            <TouchableOpacity onPress={() => deleteCurrency(item.id)}>
              <Text style={styles.deleteBtn}>🗑️</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>لا توجد عملات مضافة</Text>}
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
  form: { padding: 16, backgroundColor: '#16213E', margin: 12, borderRadius: 12, borderWidth: 1, borderColor: '#2a3550' },
  label: { color: '#9A9B3B', fontSize: 14, marginBottom: 4, marginTop: 8 },
  input: { backgroundColor: '#0a0f1e', color: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#2a3550', marginBottom: 8, textAlign: 'right' },
  saveBtn: { backgroundColor: '#D4AF37', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16213E', padding: 16, marginHorizontal: 12, marginVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#2a3550' },
  currencyCode: { color: '#D4AF37', fontSize: 18, fontWeight: 'bold' },
  currencyName: { color: '#fff', fontSize: 14, marginTop: 4 },
  currencyRate: { color: '#9A9B3B', fontSize: 12, marginTop: 4 },
  deleteBtn: { fontSize: 22, padding: 8 },
  empty: { color: '#666', textAlign: 'center', marginTop: 40, fontSize: 16 },
});
