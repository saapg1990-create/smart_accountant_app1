import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, StatusBar, Alert, Modal, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalTable } from '../../hooks/useLocalStore';
import { PickerModal } from '../../src/components/ui/PickerModal';

export default function WarehouseTransferScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const { data: transfers, add, remove } = useLocalTable('warehouseTransfers');
  const { data: warehouses } = useLocalTable('warehouses');
  const { data: items } = useLocalTable('items');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [currentLineId, setCurrentLineId] = useState('');
  const [formData, setFormData] = useState({ date: new Date().toISOString().split('T')[0], fromId: '', fromName: '', toId: '', toName: '', description: '', refNumber: '' });
  const [lines, setLines] = useState([{ id: '1', itemId: '', itemName: '', unit: 'قطعة', qty: '0' }]);

  const addLine = () => setLines([...lines, { id: Date.now().toString(), itemId: '', itemName: '', unit: 'قطعة', qty: '0' }]);
  const removeLine = (id: string) => { if (lines.length > 1) setLines(lines.filter(l => l.id !== id)); };
  const updateLine = (id: string, field: string, value: string) => { setLines(lines.map(l => l.id === id ? { ...l, [field]: value } : l)); };
  const generateNumber = () => `TR-${(transfers.length + 1).toString().padStart(6, '0')}`;

  const handleSave = async () => { if (!formData.fromName || !formData.toName) { Alert.alert('خطأ', 'اختر المخازن'); return; } if (formData.fromId === formData.toId) { Alert.alert('خطأ', 'لا يمكن لنفس المخزن'); return; } await add({ ...formData, number: generateNumber(), items: lines.filter(l => l.itemName) }); setShowModal(false); };

  return (
    <View style={[st.c, { paddingTop: insets.top }]}><StatusBar barStyle="light-content" />
      <View style={st.h}><TouchableOpacity onPress={() => router.back()}><Text style={st.bt}>←</Text></TouchableOpacity><Text style={st.t}>تحويل مخزني</Text><TouchableOpacity style={st.ab} onPress={() => { setShowModal(true); }}><Text style={st.atx}>+</Text></TouchableOpacity></View>
      <View style={st.cb}><TextInput style={st.si} placeholder="🔍 بحث..." placeholderTextColor="#94a3b8" value={searchQuery} onChangeText={setSearchQuery} /><TouchableOpacity style={st.pb}><Text>🖨️</Text></TouchableOpacity></View>
      {transfers.length === 0 ? <View style={st.e}><Text style={st.ei}>🔄</Text><Text style={st.et}>لا توجد تحويلات</Text></View> :
        <FlatList data={transfers} keyExtractor={(i: any) => i.id} renderItem={({ item }: any) => (
          <TouchableOpacity style={st.rc} onLongPress={() => Alert.alert('حذف', 'حذف؟', [{ text: 'حذف', style: 'destructive', onPress: () => remove(item.id) }, { text: 'إلغاء' }])}>
            <Text style={st.rn}>{item.number}</Text><Text style={st.rd}>🏭 {item.fromName} → {item.toName}</Text><Text style={st.rd}>{item.items?.length || 0} صنف</Text>
          </TouchableOpacity>
        )} contentContainerStyle={{ padding: 16 }} />}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={st.mo}><View style={[st.mc, { maxHeight: '95%' }]}><View style={st.mh}><Text style={st.mt}>تحويل مخزني</Text><TouchableOpacity onPress={() => setShowModal(false)}><Text style={st.mx}>✕</Text></TouchableOpacity></View>
          <ScrollView style={st.mb}>
            <Text style={st.fl}>رقم الأمر</Text><TextInput style={[st.fi, { color: '#D4AF37' }]} value={generateNumber()} editable={false} />
            <Text style={st.fl}>المخزن المحول منه *</Text><TouchableOpacity style={st.pk} onPress={() => setShowFromPicker(true)}><Text style={formData.fromName ? st.pkt : st.pkp}>{formData.fromName || 'اختيار المخزن'}</Text><Text style={st.pka}>▼</Text></TouchableOpacity>
            <Text style={st.fl}>المخزن المستلم *</Text><TouchableOpacity style={st.pk} onPress={() => setShowToPicker(true)}><Text style={formData.toName ? st.pkt : st.pkp}>{formData.toName || 'اختيار المخزن'}</Text><Text style={st.pka}>▼</Text></TouchableOpacity>
            <Text style={st.fl}>التاريخ</Text><TextInput style={st.fi} value={formData.date} onChangeText={v => setFormData({ ...formData, date: v })} />
            <Text style={st.fl}>البيان</Text><TextInput style={[st.fi, { height: 50 }]} value={formData.description} onChangeText={v => setFormData({ ...formData, description: v })} placeholder="بيان" placeholderTextColor="#666" multiline />
            <Text style={st.fl}>رقم المرجع</Text><TextInput style={st.fi} value={formData.refNumber} onChangeText={v => setFormData({ ...formData, refNumber: v })} />
            <Text style={st.st}>📦 الأصناف</Text>
            {lines.map((line, i) => (
              <View key={line.id} style={st.lc}>
                <View style={st.lh}><Text>#{i + 1}</Text>{lines.length > 1 && <TouchableOpacity onPress={() => removeLine(line.id)}><Text>🗑️</Text></TouchableOpacity>}</View>
                <TouchableOpacity style={st.pk} onPress={() => { setCurrentLineId(line.id); setShowItemPicker(true); }}><Text style={line.itemName ? st.pkt : st.pkp}>{line.itemName || 'اختيار الصنف'}</Text><Text style={st.pka}>▼</Text></TouchableOpacity>
                <TextInput style={st.fi} value={line.qty} onChangeText={v => updateLine(line.id, 'qty', v)} placeholder="الكمية" placeholderTextColor="#666" keyboardType="numeric" />
              </View>
            ))}
            <TouchableOpacity style={st.al} onPress={addLine}><Text>+ إضافة صنف</Text></TouchableOpacity>
            <TouchableOpacity style={st.sb} onPress={handleSave}><Text style={st.sbt}>💾 حفظ</Text></TouchableOpacity>
          </ScrollView></View></View>
      </Modal>
      <PickerModal visible={showFromPicker} title="المخزن المحول منه" data={warehouses || []} displayField="name" subField="code" onSelect={(i: any) => setFormData({ ...formData, fromId: i.id, fromName: i.name })} onClose={() => setShowFromPicker(false)} />
      <PickerModal visible={showToPicker} title="المخزن المستلم" data={warehouses || []} displayField="name" subField="code" onSelect={(i: any) => setFormData({ ...formData, toId: i.id, toName: i.name })} onClose={() => setShowToPicker(false)} />
      <PickerModal visible={showItemPicker} title="اختيار الصنف" data={items || []} displayField="name" subField="code" onSelect={(i: any) => { updateLine(currentLineId, 'itemId', i.id); updateLine(currentLineId, 'itemName', i.name); }} onClose={() => setShowItemPicker(false)} />
    </View>
  );
}
const st = StyleSheet.create({
  c: { flex: 1, backgroundColor: '#0A1128' }, h: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 }, bt: { fontSize: 24, color: '#D4AF37', fontWeight: 'bold' }, t: { fontSize: 18, fontWeight: 'bold', color: '#FFF' }, ab: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#D4AF37' + '20', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#D4AF37' }, atx: { fontSize: 20, color: '#D4AF37', fontWeight: 'bold' },
  cb: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 12, gap: 8 }, si: { flex: 1, backgroundColor: '#16213E', borderRadius: 10, padding: 10, color: '#FFF', borderWidth: 1, borderColor: '#2a3550', textAlign: 'right', fontSize: 14 }, pb: { backgroundColor: '#16213E', borderRadius: 10, padding: 10, justifyContent: 'center', borderWidth: 1, borderColor: '#2a3550' },
  e: { flex: 1, justifyContent: 'center', alignItems: 'center' }, ei: { fontSize: 48, marginBottom: 12 }, et: { color: '#FFF', fontSize: 16 },
  rc: { backgroundColor: '#16213E', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#2a3550' }, rn: { color: '#D4AF37', fontSize: 14, fontWeight: 'bold' }, rd: { color: '#FFF', fontSize: 13 },
  mo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }, mc: { backgroundColor: '#16213E', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '95%' }, mh: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#2a3550' }, mt: { color: '#D4AF37', fontSize: 18, fontWeight: 'bold' }, mx: { color: '#EF4444', fontSize: 22, fontWeight: 'bold' }, mb: { padding: 16 },
  fl: { color: '#94a3b8', fontSize: 13, marginBottom: 6, marginTop: 12 }, fi: { backgroundColor: '#0A1128', borderRadius: 10, padding: 12, color: '#FFF', borderWidth: 1, borderColor: '#2a3550', fontSize: 14 },
  pk: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0A1128', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#2a3550' }, pkt: { color: '#FFF', fontSize: 14, flex: 1 }, pkp: { color: '#666', fontSize: 14, flex: 1 }, pka: { color: '#D4AF37', fontSize: 12, marginLeft: 8 },
  st: { fontSize: 16, fontWeight: 'bold', color: '#D4AF37', marginTop: 16, marginBottom: 10 }, lc: { backgroundColor: '#0A1128', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#2a3550' }, lh: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  al: { backgroundColor: '#D4AF37' + '20', borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 8, borderWidth: 1, borderColor: '#D4AF37' + '40' },
  sb: { backgroundColor: '#D4AF37', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 20 }, sbt: { color: '#0A1128', fontSize: 16, fontWeight: 'bold' },
});
