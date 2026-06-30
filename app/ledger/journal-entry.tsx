import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDatabase } from '../../context/DatabaseContext';
import SmartPicker from '../../src/components/ui/SmartPicker';

export default function JournalEntryScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const { db } = useDatabase();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([{ id: '1', accountId: '', accountName: '', debit: '', credit: '', desc: '' }]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [totalDebit, setTotalDebit] = useState(0);
  const [totalCredit, setTotalCredit] = useState(0);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);

  useFocusEffect(useCallback(() => { loadAccounts(); loadEntries(); }, [db]));

  const loadAccounts = async () => {
    if (!db) return;
    const result = await db.getAllAsync('SELECT * FROM accounts WHERE isActive=1 ORDER BY code');
    setAccounts(result);
  };

  const loadEntries = async () => {
    if (!db) return;
    const result = await db.getAllAsync('SELECT * FROM journal_entries ORDER BY date DESC LIMIT 50');
    setEntries(result);
  };

  const calculateTotals = (itemsList: any[]) => {
    let debit = 0, credit = 0;
    itemsList.forEach(i => { debit += parseFloat(i.debit) || 0; credit += parseFloat(i.credit) || 0; });
    setTotalDebit(debit); setTotalCredit(credit);
  };

  const addItem = () => {
    const newItems = [...items, { id: 'i' + Date.now(), accountId: '', accountName: '', debit: '', credit: '', desc: '' }];
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return Alert.alert('خطأ', 'يجب وجود بند واحد على الأقل');
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    calculateTotals(newItems);
  };

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
    if (field === 'debit' || field === 'credit') calculateTotals(newItems);
  };

  const selectAccount = (account: any) => {
    const newItems = [...items];
    newItems[currentItemIndex].accountId = account.id;
    newItems[currentItemIndex].accountName = `${account.code} - ${account.name}`;
    setItems(newItems);
  };

  const saveEntry = async () => {
    if (!date || !description.trim()) return Alert.alert('خطأ', 'أدخل التاريخ والبيان');
    if (Math.abs(totalDebit - totalCredit) > 0.001) return Alert.alert('خطأ', 'القيد غير متوازن! يجب تساوي المدين والدائن');

    if (!db) return;
    const entryId = 'je' + Date.now();
    const number = 'QYD-' + new Date().getTime().toString().slice(-6);

    try {
      await db.runAsync(
        'INSERT INTO journal_entries (id, number, date, description, totalDebit, totalCredit, isPosted) VALUES (?,?,?,?,?,?,1)',
        [entryId, number, date, description, totalDebit, totalCredit]
      );

      for (const item of items) {
        if (!item.accountId || (!item.debit && !item.credit)) continue;
        await db.runAsync(
          'INSERT INTO journal_items (id, entryId, accountId, debit, credit, description) VALUES (?,?,?,?,?,?)',
          ['ji' + Date.now() + Math.random(), entryId, item.accountId, parseFloat(item.debit) || 0, parseFloat(item.credit) || 0, item.desc]
        );
        // تحديث رصيد الحساب
        await db.runAsync('UPDATE accounts SET balance = balance + ? - ? WHERE id = ?',
          [parseFloat(item.debit) || 0, parseFloat(item.credit) || 0, item.accountId]);
      }

      Alert.alert('تم', 'تم حفظ القيد بنجاح');
      await loadEntries();
      setItems([{ id: '1', accountId: '', accountName: '', debit: '', credit: '', desc: '' }]);
      setDescription(''); setTotalDebit(0); setTotalCredit(0);
    } catch (e) { console.log('Save error:', e); Alert.alert('خطأ', 'فشل حفظ القيد'); }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.backBtn}>← رجوع</Text></TouchableOpacity>
        <Text style={styles.title}>قيود اليومية</Text>
        <TouchableOpacity onPress={saveEntry}><Text style={styles.saveBtnText}>💾 حفظ</Text></TouchableOpacity>
      </View>

      <ScrollView style={styles.body}>
        <Text style={styles.label}>التاريخ</Text>
        <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor="#666" />

        <Text style={styles.label}>البيان</Text>
        <TextInput style={styles.input} value={description} onChangeText={setDescription} placeholder="بيان القيد" placeholderTextColor="#666" multiline />

        <View style={styles.totalsRow}>
          <Text style={styles.totalDebit}>مدين: {totalDebit.toLocaleString()}</Text>
          <Text style={styles.totalCredit}>دائن: {totalCredit.toLocaleString()}</Text>
          <Text style={totalDebit === totalCredit ? styles.balanced : styles.unbalanced}>
            {totalDebit === totalCredit ? '✅ متوازن' : '❌ غير متوازن'}
          </Text>
        </View>

        <TouchableOpacity style={styles.addItemBtn} onPress={addItem}>
          <Text style={styles.addItemText}>+ إضافة بند</Text>
        </TouchableOpacity>

        {items.map((item, index) => (
          <View key={item.id} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemTitle}>بند {index + 1}</Text>
              <TouchableOpacity onPress={() => removeItem(index)}><Text style={styles.removeBtn}>✕</Text></TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.selector} onPress={() => { setCurrentItemIndex(index); setPickerVisible(true); }}>
              <Text style={[styles.selectorText, !item.accountName && { color: '#666' }]}>
                {item.accountName || 'اختر الحساب...'}
              </Text>
              <Text style={styles.arrow}>▼</Text>
            </TouchableOpacity>

            <View style={styles.amountRow}>
              <View style={styles.amountCol}>
                <Text style={styles.amountLabel}>مدين</Text>
                <TextInput style={styles.amountInput} value={item.debit} onChangeText={(v) => updateItem(index, 'debit', v)} keyboardType="numeric" placeholder="0" placeholderTextColor="#666" />
              </View>
              <View style={styles.amountCol}>
                <Text style={styles.amountLabel}>دائن</Text>
                <TextInput style={styles.amountInput} value={item.credit} onChangeText={(v) => updateItem(index, 'credit', v)} keyboardType="numeric" placeholder="0" placeholderTextColor="#666" />
              </View>
            </View>

            <TextInput style={styles.descInput} value={item.desc} onChangeText={(v) => updateItem(index, 'desc', v)} placeholder="وصف البند (اختياري)" placeholderTextColor="#666" />
          </View>
        ))}
      </ScrollView>

      <SmartPicker
        label="اختر الحساب"
        placeholder="ابحث عن حساب..."
        value=""
        displayValue=""
        data={accounts}
        searchFields={['name', 'code']}
        displayField="name"
        idField="id"
        onSelect={selectAccount}
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onOpen={() => setPickerVisible(true)}
      />

      <FlatList data={entries} keyExtractor={i => i.id}
        style={styles.entriesList}
        ListHeaderComponent={<Text style={styles.sectionTitle}>آخر القيود</Text>}
        renderItem={({ item }) => (
          <View style={styles.entryCard}>
            <Text style={styles.entryNum}>{item.number}</Text>
            <Text style={styles.entryDesc}>{item.description}</Text>
            <Text style={styles.entryAmounts}>مدين: {item.totalDebit?.toLocaleString()} | دائن: {item.totalCredit?.toLocaleString()}</Text>
            <Text style={styles.entryDate}>{item.date}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f1e' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1a2540' },
  backBtn: { color: '#D4AF37', fontSize: 16 },
  title: { color: '#D4AF37', fontSize: 22, fontWeight: 'bold' },
  saveBtnText: { color: '#D4AF37', fontSize: 16, fontWeight: 'bold' },
  body: { flex: 1, padding: 12 },
  label: { color: '#9A9B3B', fontSize: 14, marginBottom: 4, marginTop: 10 },
  input: { backgroundColor: '#16213E', color: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#2a3550', textAlign: 'right' },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#16213E', padding: 12, borderRadius: 8, marginVertical: 10 },
  totalDebit: { color: '#e74c3c', fontSize: 14, fontWeight: 'bold' },
  totalCredit: { color: '#2ecc71', fontSize: 14, fontWeight: 'bold' },
  balanced: { color: '#2ecc71', fontSize: 14 },
  unbalanced: { color: '#e74c3c', fontSize: 14 },
  addItemBtn: { backgroundColor: '#D4AF37', padding: 10, borderRadius: 8, alignItems: 'center', marginVertical: 8 },
  addItemText: { color: '#000', fontWeight: 'bold' },
  itemCard: { backgroundColor: '#16213E', padding: 12, borderRadius: 10, marginVertical: 6, borderWidth: 1, borderColor: '#2a3550' },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  itemTitle: { color: '#D4AF37', fontSize: 15, fontWeight: 'bold' },
  removeBtn: { color: '#e74c3c', fontSize: 18, padding: 4 },
  selector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0a0f1e', padding: 10, borderRadius: 6, marginBottom: 8 },
  selectorText: { color: '#fff', fontSize: 14, flex: 1, textAlign: 'right' },
  arrow: { color: '#D4AF37', fontSize: 12, marginLeft: 8 },
  amountRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  amountCol: { flex: 1 },
  amountLabel: { color: '#9A9B3B', fontSize: 11, marginBottom: 2, textAlign: 'center' },
  amountInput: { backgroundColor: '#0a0f1e', color: '#fff', padding: 8, borderRadius: 6, textAlign: 'center', fontSize: 16 },
  descInput: { backgroundColor: '#0a0f1e', color: '#fff', padding: 8, borderRadius: 6, textAlign: 'right', fontSize: 12 },
  sectionTitle: { color: '#D4AF37', fontSize: 18, fontWeight: 'bold', marginVertical: 12, textAlign: 'right' },
  entriesList: { marginTop: 10 },
  entryCard: { backgroundColor: '#16213E', padding: 12, marginVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#2a3550' },
  entryNum: { color: '#D4AF37', fontSize: 14, fontWeight: 'bold', textAlign: 'right' },
  entryDesc: { color: '#fff', fontSize: 13, textAlign: 'right', marginTop: 4 },
  entryAmounts: { color: '#9A9B3B', fontSize: 11, textAlign: 'right', marginTop: 2 },
  entryDate: { color: '#666', fontSize: 10, textAlign: 'right', marginTop: 2 },
});
