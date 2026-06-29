import { ControlButtons, ControlHeader } from '../../src/components/ui/ControlButtons';
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, StatusBar, Alert, Modal, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalTable } from '../../hooks/useLocalStore';
import { PickerModal } from '../../src/components/ui/PickerModal';

export default function PurchaseInvoiceScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const { data: invoices, add, remove, update } = useLocalTable('purchaseInvoices');
  const { data: accounts } = useLocalTable('accounts');
  const { data: suppliers } = useLocalTable('suppliers');
  const { data: items } = useLocalTable('items');
  const { data: warehouses } = useLocalTable('warehouses');
  const { data: cashBoxes } = useLocalTable('cashBoxes');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [invoiceType, setInvoiceType] = useState<'cash'|'credit'>('cash');
  const [editMode, setEditMode] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showSupplierPicker, setShowSupplierPicker] = useState(false);
  const [showWarehousePicker, setShowWarehousePicker] = useState(false);
  const [showCashBoxPicker, setShowCashBoxPicker] = useState(false);
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [currentLineId, setCurrentLineId] = useState('');
  const [formData, setFormData] = useState({ date: new Date().toISOString().split('T')[0], supplierId: '', supplierName: '', warehouseId: '', warehouseName: '', cashBoxId: '', cashBoxName: '', paid: '0', discount: '0', description: '', refNumber: '' });
  const [lines, setLines] = useState([{ id: '1', itemId: '', itemName: '', unit: 'قطعة', qty: '0', freeQty: '0', price: '0', discount: '0', total: '0' }]);

  const addLine = () => setLines([...lines, { id: Date.now().toString(), itemId: '', itemName: '', unit: 'قطعة', qty: '0', freeQty: '0', price: '0', discount: '0', total: '0' }]);
  const removeLine = (id: string) => { if (lines.length > 1) setLines(lines.filter(l => l.id !== id)); };
  const updateLine = (id: string, field: string, value: string) => { setLines(lines.map(l => { if (l.id !== id) return l; const u = { ...l, [field]: value }; if (['qty', 'price', 'discount'].includes(field)) u.total = (((parseFloat(u.qty) || 0) * (parseFloat(u.price) || 0)) - (parseFloat(u.discount) || 0)).toString(); return u; })); };
  const subtotal = lines.reduce((s, l) => s + (parseFloat(l.total) || 0), 0);
  const total = subtotal - (parseFloat(formData.discount) || 0);
  const paid = parseFloat(formData.paid) || 0;
  const remaining = total - paid;
  const generateNumber = () => { const p = invoiceType === 'cash' ? 'CSI' : 'CRI'; return `${p}-${(invoices.length + 1).toString().padStart(6, '0')}`; };

  const handleSave = async () => {
    if (!formData.supplierName) { Alert.alert('خطأ', 'الرجاء اختيار المورد'); return; }
    const data = { number: generateNumber(), type: invoiceType, ...formData, subtotal, total, paid, remaining, items: lines.filter(l => l.itemName) };
    if (editMode && selectedInvoice) { await update(selectedInvoice.id, data); } else { await add(data); }
    setShowModal(false); setEditMode(false); setSelectedInvoice(null);
  };

  const openEdit = (inv: any) => { setInvoiceType(inv.type); setFormData({ date: inv.date, supplierId: inv.supplierId || '', supplierName: inv.supplierName, warehouseId: inv.warehouseId || '', warehouseName: inv.warehouseName || '', cashBoxId: inv.cashBoxId || '', cashBoxName: inv.cashBoxName || '', paid: inv.paid?.toString() || '0', discount: inv.discount?.toString() || '0', description: inv.description || '', refNumber: inv.refNumber || '' }); setLines(inv.items?.length > 0 ? inv.items : [{ id: '1', itemId: '', itemName: '', unit: 'قطعة', qty: '0', freeQty: '0', price: '0', discount: '0', total: '0' }]); setSelectedInvoice(inv); setEditMode(true); setShowModal(true); };

  const filtered = invoices.filter((i: any) => i.number?.includes(searchQuery) || i.supplierName?.includes(searchQuery));

  return (
    <View style={[st.c, { paddingTop: insets.top }]}><StatusBar barStyle="light-content" />
      <View style={st.h}><TouchableOpacity onPress={() => router.back()}><Text style={st.bt}>←</Text></TouchableOpacity><Text style={st.t}>فواتير المشتريات</Text><TouchableOpacity style={st.ab} onPress={() => { setEditMode(false); setSelectedInvoice(null); setFormData({ date: new Date().toISOString().split('T')[0], supplierId: '', supplierName: '', warehouseId: '', warehouseName: '', cashBoxId: '', cashBoxName: '', paid: '0', discount: '0', description: '', refNumber: '' }); setLines([{ id: '1', itemId: '', itemName: '', unit: 'قطعة', qty: '0', freeQty: '0', price: '0', discount: '0', total: '0' }]); setShowModal(true); }}><Text style={st.atx}>+</Text></TouchableOpacity></View>
      <View style={st.cb}><TextInput style={st.si} placeholder="🔍 بحث..." placeholderTextColor="#94a3b8" value={searchQuery} onChangeText={setSearchQuery} /><TouchableOpacity style={st.pb}><Text>🖨️</Text></TouchableOpacity></View>
      {filtered.length === 0 ? <View style={st.e}><Text style={st.ei}>📄</Text><Text style={st.et}>لا توجد فواتير</Text></View> :
        <FlatList data={filtered} keyExtractor={(i: any) => i.id} renderItem={({ item }: any) => (
          <TouchableOpacity style={st.ic} onPress={() => openEdit(item)} onLongPress={() => Alert.alert('حذف', `حذف "${item.number}"؟`, [{ text: 'حذف', style: 'destructive', onPress: () => remove(item.id) }, { text: 'إلغاء' }])}>
            <View style={st.ih}><Text style={st.in}>{item.number}</Text><Text style={[st.it, { color: item.remaining > 0 ? '#F59E0B' : '#10B981' }]}>{item.total?.toLocaleString()} ﷼</Text></View>
            <Text style={st.icu}>👤 {item.supplierName}</Text>
            <View style={st.if}><Text style={st.id}>{item.date}</Text><Text style={[st.ity, { color: item.type === 'cash' ? '#10B981' : '#F59E0B' }]}>{item.type === 'cash' ? '💰 نقدي' : '📋 آجل'}</Text></View>
          </TouchableOpacity>
        )} contentContainerStyle={{ padding: 16 }} />}

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={st.mo}><View style={[st.mc, { maxHeight: '95%' }]}><View style={st.mh}><Text style={st.mt}>{editMode ? 'تعديل' : 'إضافة'} فاتورة</Text><TouchableOpacity onPress={() => setShowModal(false)}><Text style={st.mx}>✕</Text></TouchableOpacity></View>
          <ScrollView style={st.mb}>
            <Text style={st.fl}>نوع الفاتورة</Text>
            <View style={st.tr}><TouchableOpacity style={[st.tb, invoiceType === 'cash' && st.tbA]} onPress={() => setInvoiceType('cash')}><Text style={[st.tbt, invoiceType === 'cash' && st.tbtA]}>💰 نقدي</Text></TouchableOpacity><TouchableOpacity style={[st.tb, invoiceType === 'credit' && st.tbA]} onPress={() => setInvoiceType('credit')}><Text style={[st.tbt, invoiceType === 'credit' && st.tbtA]}>📋 آجل</Text></TouchableOpacity></View>
            <Text style={st.fl}>رقم الفاتورة</Text><TextInput style={[st.fi, { color: '#D4AF37', fontWeight: 'bold' }]} value={generateNumber()} editable={false} />
            {invoiceType === 'cash' && <><Text style={st.fl}>الصندوق</Text><TouchableOpacity style={st.pk} onPress={() => setShowCashBoxPicker(true)}><Text style={formData.cashBoxName ? st.pkt : st.pkp}>{formData.cashBoxName || 'اختيار الصندوق'}</Text><Text style={st.pka}>▼</Text></TouchableOpacity></>}
            <Text style={st.fl}>المورد *</Text><TouchableOpacity style={st.pk} onPress={() => setShowSupplierPicker(true)}><Text style={formData.supplierName ? st.pkt : st.pkp}>{formData.supplierName || 'اختيار المورد'}</Text><Text style={st.pka}>▼</Text></TouchableOpacity>
            <Text style={st.fl}>المخزن</Text><TouchableOpacity style={st.pk} onPress={() => setShowWarehousePicker(true)}><Text style={formData.warehouseName ? st.pkt : st.pkp}>{formData.warehouseName || 'اختيار المخزن'}</Text><Text style={st.pka}>▼</Text></TouchableOpacity>
            <Text style={st.fl}>التاريخ</Text><TextInput style={st.fi} value={formData.date} onChangeText={v => setFormData({ ...formData, date: v })} />
            <Text style={st.fl}>البيان</Text><TextInput style={[st.fi, { height: 50 }]} value={formData.description} onChangeText={v => setFormData({ ...formData, description: v })} placeholder="بيان" placeholderTextColor="#666" multiline />
            <Text style={st.fl}>رقم المرجع</Text><TextInput style={st.fi} value={formData.refNumber} onChangeText={v => setFormData({ ...formData, refNumber: v })} placeholder="اختياري" placeholderTextColor="#666" />
            <Text style={st.st}>📦 الأصناف</Text>
            {lines.map((line, index) => (
              <View key={line.id} style={st.lc}>
                <View style={st.lh}><Text style={st.ln}>#{index + 1}</Text>{lines.length > 1 && <TouchableOpacity onPress={() => removeLine(line.id)}><Text>🗑️</Text></TouchableOpacity>}</View>
                <TouchableOpacity style={st.pk} onPress={() => { setCurrentLineId(line.id); setShowItemPicker(true); }}><Text style={line.itemName ? st.pkt : st.pkp}>{line.itemName || 'اختيار الصنف'}</Text><Text style={st.pka}>▼</Text></TouchableOpacity>
                <View style={st.rw}><TextInput style={[st.fi, st.hf]} value={line.qty} onChangeText={v => updateLine(line.id, 'qty', v)} placeholder="كمية" placeholderTextColor="#666" keyboardType="numeric" /><TextInput style={[st.fi, st.hf]} value={line.price} onChangeText={v => updateLine(line.id, 'price', v)} placeholder="سعر" placeholderTextColor="#666" keyboardType="numeric" /></View>
                <View style={st.rw}><TextInput style={[st.fi, st.hf]} value={line.freeQty} onChangeText={v => updateLine(line.id, 'freeQty', v)} placeholder="مجاني" placeholderTextColor="#666" keyboardType="numeric" /><TextInput style={[st.fi, st.hf]} value={line.discount} onChangeText={v => updateLine(line.id, 'discount', v)} placeholder="خصم" placeholderTextColor="#666" keyboardType="numeric" /></View>
                <Text style={st.lt}>الإجمالي: {parseFloat(line.total || '0').toLocaleString()} ﷼</Text>
              </View>
            ))}
            <TouchableOpacity style={st.al} onPress={addLine}><Text>+ إضافة صنف</Text></TouchableOpacity>
            <View style={st.ss}><Text style={st.sl}>الإجمالي: {subtotal.toLocaleString()} ﷼</Text><Text style={st.fl}>خصم إضافي</Text><TextInput style={st.fi} value={formData.discount} onChangeText={v => setFormData({ ...formData, discount: v })} keyboardType="numeric" placeholder="0" placeholderTextColor="#666" /><Text style={st.fl}>المدفوع</Text><TextInput style={st.fi} value={formData.paid} onChangeText={v => setFormData({ ...formData, paid: v })} keyboardType="numeric" placeholder="0" placeholderTextColor="#666" /><Text style={st.gt}>الصافي: {total.toLocaleString()} ﷼ | المتبقي: {remaining.toLocaleString()} ﷼</Text></View>
            <View style={st.ma}><TouchableOpacity style={st.sb} onPress={handleSave}><Text style={st.sbt}>💾 {editMode ? 'تحديث' : 'حفظ'}</Text></TouchableOpacity><TouchableOpacity style={st.clb} onPress={() => setShowModal(false)}><Text style={st.clt}>إلغاء</Text></TouchableOpacity></View>
          </ScrollView></View></View>
      </Modal>
      <PickerModal visible={showSupplierPicker} title="اختيار المورد" data={suppliers || []} displayField="name" subField="code" onSelect={(i: any) => setFormData({ ...formData, supplierId: i.id, supplierName: i.name })} onClose={() => setShowSupplierPicker(false)} />
      <PickerModal visible={showWarehousePicker} title="اختيار المخزن" data={warehouses || []} displayField="name" subField="code" onSelect={(i: any) => setFormData({ ...formData, warehouseId: i.id, warehouseName: i.name })} onClose={() => setShowWarehousePicker(false)} />
      <PickerModal visible={showCashBoxPicker} title="اختيار الصندوق" data={cashBoxes || []} displayField="name" onSelect={(i: any) => setFormData({ ...formData, cashBoxId: i.id, cashBoxName: i.name })} onClose={() => setShowCashBoxPicker(false)} />
      <PickerModal visible={showItemPicker} title="اختيار الصنف" data={items || []} displayField="name" subField="code" onSelect={(i: any) => { updateLine(currentLineId, 'itemId', i.id); updateLine(currentLineId, 'itemName', i.name); updateLine(currentLineId, 'price', i.salePrice?.toString() || '0'); updateLine(currentLineId, 'unit', i.unit || 'قطعة'); }} onClose={() => setShowItemPicker(false)} />
    </View>
  );
}
const st = StyleSheet.create({
  c: { flex: 1, backgroundColor: '#0A1128' }, h: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 }, bt: { fontSize: 24, color: '#D4AF37', fontWeight: 'bold' }, t: { fontSize: 18, fontWeight: 'bold', color: '#FFF' }, ab: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#D4AF37' + '20', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#D4AF37' }, atx: { fontSize: 20, color: '#D4AF37', fontWeight: 'bold' },
  cb: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 12, gap: 8 }, si: { flex: 1, backgroundColor: '#16213E', borderRadius: 10, padding: 10, color: '#FFF', borderWidth: 1, borderColor: '#2a3550', textAlign: 'right', fontSize: 14 }, pb: { backgroundColor: '#16213E', borderRadius: 10, padding: 10, justifyContent: 'center', borderWidth: 1, borderColor: '#2a3550' },
  e: { flex: 1, justifyContent: 'center', alignItems: 'center' }, ei: { fontSize: 48, marginBottom: 12 }, et: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  ic: { backgroundColor: '#16213E', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#2a3550' }, ih: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }, in: { color: '#D4AF37', fontSize: 14, fontWeight: 'bold' }, it: { fontSize: 16, fontWeight: 'bold' }, icu: { color: '#FFF', fontSize: 14, marginBottom: 6 }, if: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#2a3550', paddingTop: 8 }, id: { color: '#94a3b8', fontSize: 11 }, ity: { fontSize: 12, fontWeight: 'bold' },
  mo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }, mc: { backgroundColor: '#16213E', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '95%' }, mh: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#2a3550' }, mt: { color: '#D4AF37', fontSize: 18, fontWeight: 'bold' }, mx: { color: '#EF4444', fontSize: 22, fontWeight: 'bold' }, mb: { padding: 16 },
  fl: { color: '#94a3b8', fontSize: 13, marginBottom: 6, marginTop: 12 }, fi: { backgroundColor: '#0A1128', borderRadius: 10, padding: 12, color: '#FFF', borderWidth: 1, borderColor: '#2a3550', fontSize: 14 },
  tr: { flexDirection: 'row', gap: 8 }, tb: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#0A1128', borderWidth: 1, borderColor: '#2a3550', alignItems: 'center' }, tbA: { borderColor: '#D4AF37', backgroundColor: '#D4AF37' + '20' }, tbt: { color: '#94a3b8', fontSize: 13 }, tbtA: { color: '#D4AF37', fontWeight: 'bold' },
  pk: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0A1128', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#2a3550' }, pkt: { color: '#FFF', fontSize: 14, flex: 1 }, pkp: { color: '#666', fontSize: 14, flex: 1 }, pka: { color: '#D4AF37', fontSize: 12, marginLeft: 8 },
  st: { fontSize: 16, fontWeight: 'bold', color: '#D4AF37', marginTop: 16, marginBottom: 10 }, lc: { backgroundColor: '#0A1128', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#2a3550' }, lh: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }, ln: { color: '#D4AF37', fontSize: 12, fontWeight: 'bold' }, rw: { flexDirection: 'row', gap: 8 }, hf: { flex: 1 }, lt: { color: '#10B981', fontSize: 13, fontWeight: 'bold', textAlign: 'right', marginTop: 4 },
  al: { backgroundColor: '#D4AF37' + '20', borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 8, borderWidth: 1, borderColor: '#D4AF37' + '40' }, ss: { backgroundColor: '#0A1128', borderRadius: 12, padding: 14, marginTop: 12 }, sl: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginBottom: 8 }, gt: { color: '#F59E0B', fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginTop: 8 },
  ma: { flexDirection: 'row', gap: 10, marginTop: 24, marginBottom: 16 }, sb: { flex: 1, backgroundColor: '#D4AF37', borderRadius: 12, padding: 14, alignItems: 'center' }, sbt: { color: '#0A1128', fontSize: 16, fontWeight: 'bold' }, clb: { flex: 1, backgroundColor: '#2a3550', borderRadius: 12, padding: 14, alignItems: 'center' }, clt: { color: '#FFF', fontSize: 16 },
});
