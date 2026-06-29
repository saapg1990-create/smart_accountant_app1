import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, StatusBar, Alert, Modal, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalTable } from '../../hooks/useLocalStore';

export default function SalesReturnScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const { data: accounts } = useLocalTable("accounts");
  const { data: returns, add, remove } = useLocalTable('purchaseReturns');
  const { data: suppliers } = useLocalTable('suppliers');
  const { data: items } = useLocalTable('items');
  const { data: warehouses } = useLocalTable('warehouses');
  const { data: cashBoxes } = useLocalTable('cashBoxes');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [returnType, setReturnType] = useState<'cash' | 'credit'>('cash');
  const [formData, setFormData] = useState({ date: new Date().toISOString().split('T')[0], supplierId: '', supplierName: '', warehouseId: '', warehouseName: '', cashBoxId: '', cashBoxName: '', description: '', refNumber: '' });
  const [lines, setLines] = useState([{ id: '1', itemId: '', itemName: '', unit: 'قطعة', qty: '0', price: '0', total: '0' }]);

  const addLine = () => setLines([...lines, { id: Date.now().toString(), itemId: '', itemName: '', unit: 'قطعة', qty: '0', price: '0', total: '0' }]);
  const removeLine = (id: string) => { if (lines.length > 1) setLines(lines.filter(l => l.id !== id)); };
  const updateLine = (id: string, field: string, value: string) => { setLines(lines.map(l => { if (l.id !== id) return l; const u = { ...l, [field]: value }; if (['qty', 'price'].includes(field)) u.total = ((parseFloat(u.qty) || 0) * (parseFloat(u.price) || 0)).toString(); return u; })); };
  const totalAmount = lines.reduce((s, l) => s + (parseFloat(l.total) || 0), 0);
  const generateNumber = () => `${returnType === 'cash' ? 'CSR' : 'CRR'}-${(returns.length + 1).toString().padStart(6, '0')}`;

  const handleSave = async () => {
    if (!formData.supplierName) { Alert.alert('خطأ', 'اختر المورد'); return; }
    await add({ ...formData, number: generateNumber(), type: returnType, totalAmount, items: lines.filter(l => l.itemName) });
    setShowModal(false);
  };

  return (
    <View style={[st.c, { paddingTop: insets.top }]}><StatusBar barStyle="light-content" />
      <View style={st.h}><TouchableOpacity onPress={() => router.back()}><Text style={st.bt}>←</Text></TouchableOpacity><Text style={st.t}>مردود مشتريات</Text><TouchableOpacity style={st.ab} onPress={() => { setFormData({ date: new Date().toISOString().split('T')[0], supplierId: '', supplierName: '', warehouseId: '', warehouseName: '', cashBoxId: '', cashBoxName: '', description: '', refNumber: '' }); setLines([{ id: '1', itemId: '', itemName: '', unit: 'قطعة', qty: '0', price: '0', total: '0' }]); setShowModal(true); }}><Text style={st.atx}>+</Text></TouchableOpacity></View>
      <TextInput style={st.si} placeholder="🔍 بحث..." placeholderTextColor="#94a3b8" value={searchQuery} onChangeText={setSearchQuery} />
      {returns.length === 0 ? <View style={st.e}><Text style={st.ei}>🔄</Text><Text style={st.et}>لا توجد مرتجعات</Text></View> :
        <FlatList data={returns} keyExtractor={(i: any) => i.id} renderItem={({ item }: any) => (
          <TouchableOpacity style={st.rc} onLongPress={() => Alert.alert('حذف', 'حذف؟', [{ text: 'حذف', style: 'destructive', onPress: () => remove(item.id) }, { text: 'إلغاء' }])}>
            <Text style={st.rn}>{item.number}</Text><Text style={st.rd}>👤 {item.supplierName}</Text>
            <View style={st.rf}><Text style={st.rdate}>{item.date}</Text><Text style={[st.rtype, { color: item.type === 'cash' ? '#10B981' : '#F59E0B' }]}>{item.type === 'cash' ? '💰 نقدي' : '📋 آجل'}</Text></View>
            <Text style={[st.rt, { color: '#EF4444' }]}>{item.totalAmount?.toLocaleString()} ﷼</Text>
          </TouchableOpacity>
        )} contentContainerStyle={{ padding: 16 }} />}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={st.mo}><View style={[st.mc, { maxHeight: '95%' }]}><View style={st.mh}><Text style={st.mt}>مردود مشتريات</Text><TouchableOpacity onPress={() => setShowModal(false)}><Text style={st.mx}>✕</Text></TouchableOpacity></View>
          <ScrollView style={st.mb}>
            <Text style={st.fl}>نوع المرتجع</Text>
            <View style={st.tr}><TouchableOpacity style={[st.tb, returnType === 'cash' && st.tbA]} onPress={() => setReturnType('cash')}><Text style={[st.tbt, returnType === 'cash' && st.tbtA]}>💰 نقدي</Text></TouchableOpacity><TouchableOpacity style={[st.tb, returnType === 'credit' && st.tbA]} onPress={() => setReturnType('credit')}><Text style={[st.tbt, returnType === 'credit' && st.tbtA]}>📋 آجل</Text></TouchableOpacity></View>
            <Text style={st.fl}>رقم المرتجع</Text><TextInput style={[st.fi, { color: '#D4AF37' }]} value={generateNumber()} editable={false} />
            {returnType === 'cash' && <><Text style={st.fl}>الصندوق</Text><TextInput style={st.fi} value={formData.cashBoxName} onChangeText={v => setFormData({ ...formData, cashBoxName: v })} placeholder="اسم الصندوق" placeholderTextColor="#666" /></>}
            <Text style={st.fl}>المورد *</Text><TextInput style={st.fi} value={formData.supplierName} onChangeText={v => setFormData({ ...formData, supplierName: v })} placeholder="اسم المورد" placeholderTextColor="#666" />
            <Text style={st.fl}>المخزن</Text><TextInput style={st.fi} value={formData.warehouseName} onChangeText={v => setFormData({ ...formData, warehouseName: v })} placeholder="اسم المخزن" placeholderTextColor="#666" />
            <Text style={st.fl}>التاريخ</Text><TextInput style={st.fi} value={formData.date} onChangeText={v => setFormData({ ...formData, date: v })} />
            <Text style={st.fl}>البيان</Text><TextInput style={[st.fi, { height: 50 }]} value={formData.description} onChangeText={v => setFormData({ ...formData, description: v })} placeholder="بيان" placeholderTextColor="#666" multiline />
            <Text style={st.fl}>رقم المرجع</Text><TextInput style={st.fi} value={formData.refNumber} onChangeText={v => setFormData({ ...formData, refNumber: v })} />
            <Text style={st.st}>📦 الأصناف</Text>
            {lines.map((line, i) => (
              <View key={line.id} style={st.lc}>
                <View style={st.lh}><Text>#{i + 1}</Text>{lines.length > 1 && <TouchableOpacity onPress={() => removeLine(line.id)}><Text>🗑️</Text></TouchableOpacity>}</View>
                <TextInput style={st.fi} value={line.itemName} onChangeText={v => updateLine(line.id, 'itemName', v)} placeholder="اسم الصنف" placeholderTextColor="#666" />
                <View style={st.rw}><TextInput style={[st.fi, st.hf]} value={line.qty} onChangeText={v => updateLine(line.id, 'qty', v)} placeholder="كمية" placeholderTextColor="#666" keyboardType="numeric" /><TextInput style={[st.fi, st.hf]} value={line.price} onChangeText={v => updateLine(line.id, 'price', v)} placeholder="سعر" placeholderTextColor="#666" keyboardType="numeric" /></View>
                <Text style={st.lt}>{parseFloat(line.total || '0').toLocaleString()} ﷼</Text>
              </View>
            ))}
            <TouchableOpacity style={st.al} onPress={addLine}><Text>+ إضافة صنف</Text></TouchableOpacity>
            <Text style={st.tx}>الإجمالي: {totalAmount.toLocaleString()} ﷼</Text>
            <TouchableOpacity style={st.sb} onPress={handleSave}><Text style={st.sbt}>💾 حفظ</Text></TouchableOpacity>
          </ScrollView></View></View>
      </Modal>
    </View>
  );
}
const st = StyleSheet.create({
  c: { flex: 1, backgroundColor: '#0A1128' }, h: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 }, bt: { fontSize: 24, color: '#D4AF37', fontWeight: 'bold' }, t: { fontSize: 18, fontWeight: 'bold', color: '#FFF' }, ab: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#D4AF37' + '20', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#D4AF37' }, atx: { fontSize: 20, color: '#D4AF37', fontWeight: 'bold' },
  si: { marginHorizontal: 16, marginBottom: 12, padding: 12, backgroundColor: '#16213E', borderRadius: 10, color: '#FFF', borderWidth: 1, borderColor: '#2a3550', textAlign: 'right', fontSize: 14 },
  e: { flex: 1, justifyContent: 'center', alignItems: 'center' }, ei: { fontSize: 48, marginBottom: 12 }, et: { color: '#FFF', fontSize: 16 },
  rc: { backgroundColor: '#16213E', borderRadius: 14, padding: 14, marginBottom: 10, marginHorizontal: 16, borderWidth: 1, borderColor: '#2a3550' }, rn: { color: '#D4AF37', fontSize: 14, fontWeight: 'bold' }, rd: { color: '#FFF', fontSize: 13 }, rf: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }, rdate: { color: '#94a3b8', fontSize: 11 }, rtype: { fontSize: 12, fontWeight: 'bold' }, rt: { fontSize: 16, fontWeight: 'bold', marginTop: 6 },
  mo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }, mc: { backgroundColor: '#16213E', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '95%' }, mh: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#2a3550' }, mt: { color: '#D4AF37', fontSize: 18, fontWeight: 'bold' }, mx: { color: '#EF4444', fontSize: 22, fontWeight: 'bold' }, mb: { padding: 16 },
  fl: { color: '#94a3b8', fontSize: 13, marginBottom: 6, marginTop: 12 }, fi: { backgroundColor: '#0A1128', borderRadius: 10, padding: 12, color: '#FFF', borderWidth: 1, borderColor: '#2a3550', fontSize: 14 },
  tr: { flexDirection: 'row', gap: 8 }, tb: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#0A1128', borderWidth: 1, borderColor: '#2a3550', alignItems: 'center' }, tbA: { borderColor: '#D4AF37', backgroundColor: '#D4AF37' + '20' }, tbt: { color: '#94a3b8', fontSize: 13 }, tbtA: { color: '#D4AF37', fontWeight: 'bold' },
  st: { fontSize: 16, fontWeight: 'bold', color: '#D4AF37', marginTop: 16, marginBottom: 10 }, lc: { backgroundColor: '#0A1128', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#2a3550' }, lh: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }, rw: { flexDirection: 'row', gap: 8 }, hf: { flex: 1 }, lt: { color: '#EF4444', fontSize: 13, fontWeight: 'bold', textAlign: 'right', marginTop: 4 },
  al: { backgroundColor: '#D4AF37' + '20', borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 8, borderWidth: 1, borderColor: '#D4AF37' + '40' }, tx: { color: '#F59E0B', fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginTop: 12 },
  sb: { backgroundColor: '#D4AF37', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 20 }, sbt: { color: '#0A1128', fontSize: 16, fontWeight: 'bold' },
});
