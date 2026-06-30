import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useDatabase } from '../../context/DatabaseContext';
import { PickerModal } from '../../src/components/ui/PickerModal';
import { useLocalTable } from '../../hooks/useLocalStore';
import { useAccountStore } from '../../src/store/useAccountStore';

export default function BanksScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const { db } = useDatabase();
  const { data: currencies } = useLocalTable('currencies');
  const { accounts, loadAccounts, addAccount, generateCode } = useAccountStore();
  const [banks, setBanks] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [currency, setCurrency] = useState('YER');
  const [balance, setBalance] = useState('0');
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(useCallback(() => { loadBanks(); loadAccounts(); }, [db]));

  const loadBanks = async () => {
    if (!db) return;
    try {
      const result = await db.getAllAsync('SELECT * FROM banks ORDER BY name');
      setBanks(result);
    } catch (e) { console.log('Load error:', e); }
  };

  const addBank = async () => {
    if (!name.trim()) { Alert.alert('خطأ', 'أدخل اسم البنك'); return; }
    if (!db) return;
    const bankId = 'bank-' + Date.now();
    const bal = parseFloat(balance) || 0;
    try {
      // 1. إضافة البنك في جدول banks
      await db.runAsync('INSERT INTO banks (id, name, accountNumber, currency, balance) VALUES (?,?,?,?,?)',
        [bankId, name, accountNumber, currency, bal]);
      
      // 2. البحث عن حساب "البنوك" الأب في شجرة الحسابات
      const parentAccounts = await db.getAllAsync("SELECT * FROM accounts WHERE name = 'البنوك' AND type = 'أصل' LIMIT 1");
      let parentId = '';
      let parentCode = '';
      
      if (parentAccounts.length === 0) {
        // إنشاء حساب "البنوك" الأب إذا لم يكن موجوداً
        parentId = 'acc-banks-parent';
        parentCode = '11';
        await db.runAsync('INSERT INTO accounts (id, code, name, type, parentId, currency, balance, isActive) VALUES (?,?,?,?,?,?,?,1)',
          [parentId, parentCode, 'البنوك', 'أصل', '', 'YER', 0]);
      } else {
        parentId = parentAccounts[0].id;
        parentCode = parentAccounts[0].code || '11';
      }
      
      // 3. إنشاء حساب فرعي للبنك في شجرة الحسابات
      const accountCode = generateCode(parentId);
      await db.runAsync('INSERT INTO accounts (id, code, name, type, parentId, currency, balance, isActive) VALUES (?,?,?,?,?,?,?,1)',
        [bankId, accountCode, name, 'أصل', parentId, currency, bal]);
      
      // 4. تحديث رصيد الحساب الأب
      await db.runAsync('UPDATE accounts SET balance = balance + ? WHERE id = ?', [bal, parentId]);
      
      // 5. ترحيل محاسبي للرصيد الافتتاحي
      if (bal > 0) {
        const entryId = 'je-open-' + Date.now();
        await db.runAsync('INSERT INTO journal_entries (id, number, date, description, totalDebit, totalCredit, isPosted) VALUES (?,?,?,?,?,?,1)',
          [entryId, 'OPEN-BANK-' + bankId.slice(-6), new Date().toISOString().split('T')[0], 'رصيد افتتاحي بنك: ' + name, bal, bal]);
        await db.runAsync('INSERT INTO journal_items (id, entryId, accountId, debit, credit, description) VALUES (?,?,?,?,?,?)',
          ['ji1' + Date.now(), entryId, bankId, bal, 0, 'مدين البنك - رصيد افتتاحي']);
        await db.runAsync('INSERT INTO journal_items (id, entryId, accountId, debit, credit, description) VALUES (?,?,?,?,?,?)',
          ['ji2' + Date.now(), entryId, 'capital', 0, bal, 'دائن رأس المال']);
      }
      
      await loadBanks(); await loadAccounts();
      setName(''); setAccountNumber(''); setCurrency('YER'); setBalance('0'); setShowForm(false);
      Alert.alert('✅', 'تم إضافة البنك وإنشاء حسابه في دليل الحسابات');
    } catch (e) { console.log('Add error:', e); Alert.alert('خطأ', 'فشل الإضافة'); }
  };

  const deleteBank = async (id: string) => {
    Alert.alert('تأكيد', 'حذف البنك وحسابه من الدليل؟', [
      { text: 'إلغاء' },
      { text: 'حذف', onPress: async () => { 
        if (!db) return; 
        await db.runAsync('DELETE FROM banks WHERE id=?', [id]); 
        await db.runAsync('DELETE FROM accounts WHERE id=?', [id]);
        await loadBanks(); await loadAccounts();
      }}
    ]);
  };

  const filtered = banks.filter(b => b.name?.includes(searchQuery) || b.accountNumber?.includes(searchQuery));

  return (
    <View style={[st.container, { paddingTop: insets.top }]}>
      <View style={st.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={st.backBtn}>← رجوع</Text></TouchableOpacity>
        <Text style={st.title}>البنوك</Text>
        <TouchableOpacity onPress={() => setShowForm(!showForm)}><Text style={st.addBtn}>+ إضافة</Text></TouchableOpacity>
      </View>
      <TextInput style={st.search} placeholder="🔍 بحث..." placeholderTextColor="#666" value={searchQuery} onChangeText={setSearchQuery} />
      {showForm && (
        <View style={st.form}>
          <Text style={st.label}>اسم البنك *</Text>
          <TextInput style={st.input} value={name} onChangeText={setName} placeholder="اسم البنك" placeholderTextColor="#666" />
          <Text style={st.label}>رقم الحساب</Text>
          <TextInput style={st.input} value={accountNumber} onChangeText={setAccountNumber} placeholder="رقم الحساب البنكي" placeholderTextColor="#666" />
          <Text style={st.label}>العملة</Text>
          <TouchableOpacity style={st.picker} onPress={() => setShowCurrencyPicker(true)}>
            <Text style={st.pickerText}>{currency}</Text><Text style={st.arrow}>▼</Text>
          </TouchableOpacity>
          <Text style={st.label}>الرصيد الافتتاحي</Text>
          <TextInput style={st.input} value={balance} onChangeText={setBalance} placeholder="0" placeholderTextColor="#666" keyboardType="numeric" />
          <TouchableOpacity style={st.saveBtn} onPress={addBank}><Text style={st.saveBtnText}>💾 حفظ وإنشاء حساب في الدليل</Text></TouchableOpacity>
        </View>
      )}
      <FlatList data={filtered} keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={st.card}>
            <View style={{ flex: 1 }}>
              <Text style={st.bankName}>🏦 {item.name}</Text>
              <Text style={st.bankDetail}>الحساب: {item.accountNumber || 'بدون'} | العملة: {item.currency}</Text>
              <Text style={st.bankBalance}>الرصيد: {item.balance?.toLocaleString() || 0} {item.currency}</Text>
            </View>
            <TouchableOpacity onPress={() => deleteBank(item.id)}><Text style={st.deleteBtn}>🗑️</Text></TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={st.empty}>لا توجد بنوك</Text>}
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
  form: { padding: 16, backgroundColor: '#16213E', margin: 12, borderRadius: 12, borderWidth: 1, borderColor: '#2a3550' },
  label: { color: '#9A9B3B', fontSize: 14, marginBottom: 4, marginTop: 8 },
  input: { backgroundColor: '#0a0f1e', color: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#2a3550', marginBottom: 8, textAlign: 'right' },
  picker: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0a0f1e', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#2a3550', marginBottom: 8 },
  pickerText: { color: '#fff', fontSize: 14 }, arrow: { color: '#D4AF37', fontSize: 12 },
  saveBtn: { backgroundColor: '#D4AF37', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 8 }, saveBtnText: { color: '#000', fontWeight: 'bold', fontSize: 14 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16213E', padding: 16, marginHorizontal: 12, marginVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#2a3550' },
  bankName: { color: '#fff', fontSize: 16, fontWeight: 'bold' }, bankDetail: { color: '#9A9B3B', fontSize: 12, marginTop: 4 }, bankBalance: { color: '#D4AF37', fontSize: 14, marginTop: 4 },
  deleteBtn: { fontSize: 22, padding: 8 }, empty: { color: '#666', textAlign: 'center', marginTop: 40, fontSize: 16 },
});
