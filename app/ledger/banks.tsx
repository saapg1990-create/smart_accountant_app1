import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAccountStore } from '../../src/store/useAccountStore';
import { useDatabase } from '../../context/DatabaseContext';
import { useState } from 'react';

export default function BanksScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { db } = useDatabase();
  const { accounts, loadAccounts } = useAccountStore();
  const [banks, setBanks] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [currency, setCurrency] = useState('YER');

  useFocusEffect(useCallback(() => {
    loadBanks();
  }, [db]));

  const loadBanks = async () => {
    if (!db) return;
    try {
      const result = await db.getAllAsync('SELECT * FROM banks ORDER BY name');
      setBanks(result);
    } catch (e) {
      console.log('Load banks error:', e);
    }
  };

  const addBank = async () => {
    if (!name.trim()) { Alert.alert('خطأ', 'الرجاء إدخال اسم البنك'); return; }
    if (!db) return;
    const id = 'b' + Date.now();
    try {
      await db.runAsync(
        'INSERT INTO banks (id, name, accountNumber, currency) VALUES (?,?,?,?)',
        [id, name, accountNumber, currency]
      );
      await loadBanks();
      setName(''); setAccountNumber(''); setShowForm(false);
    } catch (e) {
      console.log('Add bank error:', e);
    }
  };

  const deleteBank = async (id: string) => {
    Alert.alert('تأكيد', 'هل تريد حذف هذا البنك؟', [
      { text: 'إلغاء' },
      { text: 'حذف', onPress: async () => {
        if (!db) return;
        await db.runAsync('DELETE FROM banks WHERE id=?', [id]);
        await loadBanks();
      }}
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>← رجوع</Text>
        </TouchableOpacity>
        <Text style={styles.title}>البنوك</Text>
        <TouchableOpacity onPress={() => setShowForm(!showForm)}>
          <Text style={styles.addBtn}>+ إضافة</Text>
        </TouchableOpacity>
      </View>

      {showForm && (
        <View style={styles.form}>
          <Text style={styles.label}>اسم البنك</Text>
          <Text style={styles.input} onPress={() => Alert.prompt ? Alert.prompt('اسم البنك', '', setName) : null}>{name || 'اضغط للإدخال'}</Text>
          <Text style={styles.label}>رقم الحساب</Text>
          <Text style={styles.input} onPress={() => Alert.prompt ? Alert.prompt('رقم الحساب', '', setAccountNumber) : null}>{accountNumber || 'اضغط للإدخال'}</Text>
          <TouchableOpacity style={styles.saveBtn} onPress={addBank}>
            <Text style={styles.saveBtnText}>حفظ</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={banks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.bankName}>{item.name}</Text>
              <Text style={styles.bankDetail}>{item.accountNumber || 'بدون رقم حساب'}</Text>
              <Text style={styles.bankBalance}>الرصيد: {item.balance?.toLocaleString() || 0} {item.currency}</Text>
            </View>
            <TouchableOpacity onPress={() => deleteBank(item.id)}>
              <Text style={styles.deleteBtn}>🗑️</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>لا توجد بنوك مضافة</Text>}
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
  input: { backgroundColor: '#0a0f1e', color: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#2a3550', marginBottom: 8 },
  saveBtn: { backgroundColor: '#D4AF37', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16213E', padding: 16, marginHorizontal: 12, marginVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#2a3550' },
  bankName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  bankDetail: { color: '#9A9B3B', fontSize: 12, marginTop: 4 },
  bankBalance: { color: '#D4AF37', fontSize: 14, marginTop: 4 },
  deleteBtn: { fontSize: 22, padding: 8 },
  empty: { color: '#666', textAlign: 'center', marginTop: 40, fontSize: 16 },
});
