import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Modal, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAccountStore } from '../../src/store/useAccountStore';
import { Selector } from '../../src/components/common/Selector';
import { ControlButtons, ControlHeader } from '../../src/components/ui/ControlButtons';

export default function JournalEntryScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const { accounts, loadAccounts } = useAccountStore();
  const [entries, setEntries] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], description: '', debitId: '', debitName: '', creditId: '', creditName: '', amount: '' });

  useFocusEffect(useCallback(() => { loadAccounts(); }, []));

  const leafAccounts = accounts.filter((a: any) => a.parentId && !accounts.some((p: any) => p.parentId === a.id));
  const count = entries.length + 1;
  const journalNumber = `JE-${count.toString().padStart(6, '0')}`;

  const handleSave = async () => {
    if (!form.description || !form.amount) { Alert.alert('خطأ', 'أكمل البيانات'); return; }
    if (!form.debitName || !form.creditName) { Alert.alert('خطأ', 'اختر حسابات المدين والدائن'); return; }
    if (form.debitId === form.creditId) { Alert.alert('خطأ', 'لا يمكن أن يكون المدين والدائن نفس الحساب'); return; }
    
    const amount = parseFloat(form.amount) || 0;
    if (amount <= 0) { Alert.alert('خطأ', 'المبلغ يجب أن يكون أكبر من صفر'); return; }

    setEntries([{ id: 'je-' + Date.now(), number: journalNumber, ...form, amount }, ...entries]);
    setShowModal(false);
    setForm({ date: new Date().toISOString().split('T')[0], description: '', debitId: '', debitName: '', creditId: '', creditName: '', amount: '' });
    Alert.alert('✅', `تم حفظ القيد ${journalNumber}`);
  };

  return (
    <View style={[st.c, { paddingTop: insets.top }]}>
      <ControlHeader title="قيود اليومية" count={entries.length} onBack={() => router.back()} onAdd={() => { setForm({ date: new Date().toISOString().split('T')[0], description: '', debitId: '', debitName: '', creditId: '', creditName: '', amount: '' }); setShowModal(true); }} />
      <ControlButtons showSearch showRefresh showPrint showExport onRefresh={loadAccounts} />
      
      {entries.length === 0 ? <Text style={st.et}>لا توجد قيود</Text> :
        <FlatList data={entries} keyExtractor={(i: any) => i.id} renderItem={({ item }: any) => (
          <View style={st.card}>
            <Text style={st.num}>{item.number}</Text>
            <Text style={st.desc}>{item.description}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
              <Text style={st.debit}>مدين: {item.debitName}</Text>
              <Text style={st.credit}>دائن: {item.creditName}</Text>
            </View>
            <Text style={st.amt}>{item.amount?.toLocaleString()} ﷼</Text>
          </View>
        )} contentContainerStyle={{ padding: 16 }} />}

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={st.mo}><View style={st.mc}><View style={st.mh}><Text style={st.mt}>قيد يومية</Text><TouchableOpacity onPress={() => setShowModal(false)}><Text style={st.mx}>✕</Text></TouchableOpacity></View>
        <ScrollView style={st.mb}>
          <Text style={st.fl}>رقم القيد</Text><TextInput style={[st.fi, { color: '#D4AF37' }]} value={journalNumber} editable={false} />
          <Text style={st.fl}>التاريخ</Text><TextInput style={st.fi} value={form.date} onChangeText={v => setForm({ ...form, date: v })} />
          <Text style={st.fl}>البيان *</Text><TextInput style={[st.fi, { height: 60 }]} value={form.description} onChangeText={v => setForm({ ...form, description: v })} placeholder="بيان القيد" placeholderTextColor="#666" multiline />
          
          <Selector label="حساب مدين *" tableName="accounts" displayField="name" subField="code" showBalance selectedId={form.debitId} selectedName={form.debitName} onSelect={(i: any) => setForm({ ...form, debitId: i.id, debitName: i.name })} />
          <Selector label="حساب دائن *" tableName="accounts" displayField="name" subField="code" showBalance selectedId={form.creditId} selectedName={form.creditName} onSelect={(i: any) => setForm({ ...form, creditId: i.id, creditName: i.name })} />
          
          <Text style={st.fl}>المبلغ *</Text><TextInput style={[st.fi, { fontSize: 18 }]} value={form.amount} onChangeText={v => setForm({ ...form, amount: v })} keyboardType="numeric" placeholder="0" placeholderTextColor="#666" />
          
          <TouchableOpacity style={st.sb} onPress={handleSave}><Text style={st.sbt}>💾 حفظ القيد</Text></TouchableOpacity>
        </ScrollView></View></View>
      </Modal>
    </View>
  );
}
const st = StyleSheet.create({
  c: { flex: 1, backgroundColor: '#0A1128' }, et: { color: '#FFF', textAlign: 'center', marginTop: 40 },
  card: { backgroundColor: '#16213E', borderRadius: 14, padding: 14, marginBottom: 8, marginHorizontal: 16, borderWidth: 1, borderColor: '#2a3550' },
  num: { color: '#D4AF37', fontSize: 14, fontWeight: 'bold' }, desc: { color: '#FFF', fontSize: 14, marginTop: 4 },
  debit: { color: '#10B981', fontSize: 12 }, credit: { color: '#EF4444', fontSize: 12 }, amt: { color: '#D4AF37', fontSize: 14, fontWeight: 'bold', marginTop: 4, textAlign: 'right' },
  mo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }, mc: { backgroundColor: '#16213E', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' },
  mh: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#2a3550' }, mt: { color: '#D4AF37', fontSize: 18, fontWeight: 'bold' }, mx: { color: '#EF4444', fontSize: 22 }, mb: { padding: 16 },
  fl: { color: '#94a3b8', fontSize: 13, marginBottom: 6, marginTop: 12 }, fi: { backgroundColor: '#0A1128', borderRadius: 10, padding: 12, color: '#FFF', borderWidth: 1, borderColor: '#2a3550', fontSize: 14, textAlign: 'right' },
  sb: { backgroundColor: '#D4AF37', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 20, marginBottom: 20 }, sbt: { color: '#0A1128', fontSize: 16, fontWeight: 'bold' },
});
