import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, StatusBar, Alert, Modal, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalTable } from '../../hooks/useLocalStore';
import { PickerModal } from '../../src/components/ui/PickerModal';
import { ControlButtons, ControlHeader } from '../../src/components/ui/ControlButtons';

export default function JournalEntryScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const { data: entries, add, remove } = useLocalTable('journalEntries');
  const { data: accounts } = useLocalTable('accounts');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [currentLineId, setCurrentLineId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [lines, setLines] = useState([{ id: '1', accountId: '', accountName: '', debit: '', credit: '' }, { id: '2', accountId: '', accountName: '', debit: '', credit: '' }]);

  const addLine = () => setLines([...lines, { id: Date.now().toString(), accountId: '', accountName: '', debit: '', credit: '' }]);
  const removeLine = (id: string) => { if (lines.length > 2) setLines(lines.filter(l => l.id !== id)); };
  const updateLine = (id: string, field: string, value: string) => { setLines(lines.map(l => l.id === id ? { ...l, [field]: value } : l)); };
  const totalDebit = lines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0);
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;
  const generateNumber = () => `JV-${(entries.length + 1).toString().padStart(6, '0')}`;

  const handleSave = async () => {
    if (!description) { Alert.alert('خطأ', 'أدخل وصف القيد'); return; }
    if (!isBalanced) { Alert.alert('خطأ', 'القيد غير متوازن'); return; }
    await add({ number: generateNumber(), date, description, totalDebit, totalCredit, lines: lines.filter(l => l.accountName && (parseFloat(l.debit) > 0 || parseFloat(l.credit) > 0)) });
    setShowModal(false); setDescription(''); setLines([{ id: '1', accountId: '', accountName: '', debit: '', credit: '' }, { id: '2', accountId: '', accountName: '', debit: '', credit: '' }]);
  };

  const filtered = entries.filter((e: any) => e.number?.includes(searchQuery) || e.description?.includes(searchQuery));

  return (
    <View style={[st.c, { paddingTop: insets.top }]}><StatusBar barStyle="light-content" />
      <ControlHeader title="القيود اليومية" count={entries.length} onBack={() => router.back()} onAdd={() => setShowModal(true)} />
      <ControlButtons showEdit={false} showDelete={false} onPrint={() => Alert.alert('🖨️', 'جاري الطباعة')} />
      <TextInput style={st.si} placeholder="🔍 بحث..." placeholderTextColor="#94a3b8" value={searchQuery} onChangeText={setSearchQuery} />
      {filtered.length === 0 ? <View style={st.e}><Text style={st.ei}>📝</Text><Text style={st.et}>لا توجد قيود</Text></View> :
        <FlatList data={filtered} keyExtractor={(i: any) => i.id} renderItem={({ item }: any) => (
          <TouchableOpacity style={st.rc} onLongPress={() => Alert.alert('حذف', `حذف "${item.number}"؟`, [{ text: 'حذف', style: 'destructive', onPress: () => remove(item.id) }, { text: 'إلغاء' }])}>
            <View style={st.rh}><Text style={st.rn}>{item.number}</Text><Text style={st.rd}>{item.date}</Text></View>
            <Text style={st.rdesc}>{item.description}</Text>
            <Text style={[st.rbal, { color: item.totalDebit === item.totalCredit ? '#10B981' : '#EF4444' }]}>مدين: {item.totalDebit?.toLocaleString()} | دائن: {item.totalCredit?.toLocaleString()}</Text>
          </TouchableOpacity>
        )} contentContainerStyle={{ padding: 16 }} />}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={st.mo}><View style={[st.mc, { maxHeight: '95%' }]}><View style={st.mh}><Text style={st.mt}>قيد يومية جديد</Text><TouchableOpacity onPress={() => setShowModal(false)}><Text style={st.mx}>✕</Text></TouchableOpacity></View>
          <ScrollView style={st.mb}>
            <Text style={st.fl}>الوصف *</Text><TextInput style={[st.fi, { height: 50 }]} value={description} onChangeText={setDescription} placeholder="وصف القيد" placeholderTextColor="#666" multiline />
            <Text style={st.fl}>التاريخ</Text><TextInput style={st.fi} value={date} onChangeText={setDate} />
            <Text style={st.st}>تفاصيل القيد</Text>
            {lines.map((line, i) => (
              <View key={line.id} style={st.lc}>
                <View style={st.lh}><Text style={st.ln}>سطر #{i + 1}</Text>{lines.length > 2 && <TouchableOpacity onPress={() => removeLine(line.id)}><Text>🗑️</Text></TouchableOpacity>}</View>
                <TouchableOpacity style={st.pk} onPress={() => { setCurrentLineId(line.id); setShowAccountPicker(true); }}>
                  <Text style={line.accountName ? st.pkt : st.pkp}>{line.accountName || 'اختيار الحساب *'}</Text><Text style={st.pka}>▼</Text></TouchableOpacity>
                <View style={st.rw}>
                  <View style={st.hf}><Text style={st.fl}>مدين</Text><TextInput style={st.fi} value={line.debit} onChangeText={v => updateLine(line.id, 'debit', v)} keyboardType="numeric" placeholder="0" placeholderTextColor="#666" /></View>
                  <View style={st.hf}><Text style={st.fl}>دائن</Text><TextInput style={st.fi} value={line.credit} onChangeText={v => updateLine(line.id, 'credit', v)} keyboardType="numeric" placeholder="0" placeholderTextColor="#666" /></View>
                </View>
              </View>
            ))}
            <TouchableOpacity style={st.al} onPress={addLine}><Text>+ إضافة سطر</Text></TouchableOpacity>
            <View style={st.ss}>
              <Text style={st.sl}>مدين: {totalDebit.toLocaleString()} ﷼</Text>
              <Text style={[st.sl, { color: '#EF4444' }]}>دائن: {totalCredit.toLocaleString()} ﷼</Text>
              <Text style={[st.sl, { color: isBalanced ? '#10B981' : '#EF4444' }]}>{isBalanced ? '✅ متوازن' : '❌ غير متوازن'}</Text>
            </View>
            <TouchableOpacity style={st.sb} onPress={handleSave}><Text style={st.sbt}>💾 حفظ القيد</Text></TouchableOpacity>
          </ScrollView></View></View>
      </Modal>
      <PickerModal visible={showAccountPicker} title="اختيار الحساب" data={accounts || []} displayField="name" subField="code" onSelect={(i: any) => { updateLine(currentLineId, 'accountId', i.id); updateLine(currentLineId, 'accountName', i.name); }} onClose={() => setShowAccountPicker(false)} />
    </View>
  );
}
const st = StyleSheet.create({
  c: { flex: 1, backgroundColor: '#0A1128' },
  si: { marginHorizontal: 16, marginBottom: 12, padding: 12, backgroundColor: '#16213E', borderRadius: 10, color: '#FFF', borderWidth: 1, borderColor: '#2a3550', textAlign: 'right', fontSize: 14 },
  e: { flex: 1, justifyContent: 'center', alignItems: 'center' }, ei: { fontSize: 48, marginBottom: 12 }, et: { color: '#FFF', fontSize: 16 },
  rc: { backgroundColor: '#16213E', borderRadius: 14, padding: 14, marginBottom: 10, marginHorizontal: 16, borderWidth: 1, borderColor: '#2a3550' }, rh: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }, rn: { color: '#D4AF37', fontSize: 14, fontWeight: 'bold' }, rd: { color: '#94a3b8', fontSize: 11 }, rdesc: { color: '#FFF', fontSize: 13, marginBottom: 6 }, rbal: { fontSize: 12, fontWeight: 'bold' },
  mo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }, mc: { backgroundColor: '#16213E', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '95%' }, mh: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#2a3550' }, mt: { color: '#D4AF37', fontSize: 18, fontWeight: 'bold' }, mx: { color: '#EF4444', fontSize: 22, fontWeight: 'bold' }, mb: { padding: 16 },
  fl: { color: '#94a3b8', fontSize: 13, marginBottom: 6, marginTop: 12 }, fi: { backgroundColor: '#0A1128', borderRadius: 10, padding: 12, color: '#FFF', borderWidth: 1, borderColor: '#2a3550', fontSize: 14 },
  st: { fontSize: 16, fontWeight: 'bold', color: '#D4AF37', marginTop: 16, marginBottom: 10 }, lc: { backgroundColor: '#0A1128', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#2a3550' }, lh: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }, ln: { color: '#D4AF37', fontSize: 12, fontWeight: 'bold' },
  pk: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0A1128', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#2a3550' }, pkt: { color: '#FFF', fontSize: 14, flex: 1 }, pkp: { color: '#666', fontSize: 14, flex: 1 }, pka: { color: '#D4AF37', fontSize: 12, marginLeft: 8 },
  rw: { flexDirection: 'row', gap: 8 }, hf: { flex: 1 }, al: { backgroundColor: '#D4AF37' + '20', borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 8, borderWidth: 1, borderColor: '#D4AF37' + '40' },
  ss: { backgroundColor: '#0A1128', borderRadius: 12, padding: 14, marginTop: 12 }, sl: { color: '#FFF', fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  sb: { backgroundColor: '#D4AF37', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 16 }, sbt: { color: '#0A1128', fontSize: 16, fontWeight: 'bold' },
});
