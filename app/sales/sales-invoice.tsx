import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, StatusBar, Alert, Modal, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalTable } from '../../hooks/useLocalStore';
import { useAccountStore } from '../../src/store/useAccountStore';
import { PickerModal } from '../../src/components/ui/PickerModal';
import { ControlButtons, ControlHeader } from '../../src/components/ui/ControlButtons';
import { useDatabase } from '../../context/DatabaseContext';

export default function SalesInvoiceScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const { data: invoices, add: addInvoice } = useLocalTable('salesInvoices');
  const { accounts, loadAccounts, getLeafAccounts, getSubAccounts } = useAccountStore();
  const { data: customers } = useLocalTable('customers');
  const { data: items } = useLocalTable('items');
  const { data: warehouses } = useLocalTable('warehouses');
  const { db } = useDatabase();
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [invoiceType, setInvoiceType] = useState<'cash'|'credit'>('cash');
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [showWarehousePicker, setShowWarehousePicker] = useState(false);
  const [currentLineId, setCurrentLineId] = useState('');
  const [formData, setFormData] = useState({ date: new Date().toISOString().split('T')[0], accountId: '', accountName: '', customerId: '', customerName: '', warehouseId: '', warehouseName: '', paid: '0', discount: '0', description: '', refNumber: '' });
  const [lines, setLines] = useState([{ id: '1', itemId: '', itemName: '', unit: 'قطعة', qty: '0', price: '0', total: '0' }]);

  useFocusEffect(useCallback(() => { loadAccounts(); }, []));
  const leafAccounts = getLeafAccounts();
  const customerAccounts = getSubAccounts(accounts.find((a: any) => a.name === 'العملاء' && !a.parentId)?.id || '');

  const addLine = () => setLines([...lines, { id: Date.now().toString(), itemId: '', itemName: '', unit: 'قطعة', qty: '0', price: '0', total: '0' }]);
  const removeLine = (id: string) => { if (lines.length > 1) setLines(lines.filter(l => l.id !== id)); };
  const updateLine = (id: string, field: string, value: string) => { setLines(lines.map(l => { if (l.id !== id) return l; const u = { ...l, [field]: value }; if (['qty', 'price'].includes(field)) u.total = ((parseFloat(u.qty) || 0) * (parseFloat(u.price) || 0)).toString(); return u; })); };
  const subtotal = lines.reduce((s, l) => s + (parseFloat(l.total) || 0), 0);
  const discountAmount = parseFloat(formData.discount) || 0;
  const taxRate = 0.05;
  const taxAmount = (subtotal - discountAmount) * taxRate;
  const total = subtotal - discountAmount + taxAmount;
  const paid = parseFloat(formData.paid) || 0;
  const remaining = total - paid;
  const generateNumber = () => `${invoiceType === 'cash' ? 'CSI' : 'CRI'}-${(invoices.length + 1).toString().padStart(6, '0')}`;

  // ✅ الترحيل المحاسبي التلقائي
  const postToAccounting = async (invoiceId: string, invoiceNumber: string) => {
    if (!db) return;
    try {
      const entryId = 'je' + Date.now();
      await db.runAsync('INSERT INTO journal_entries (id, number, date, description, totalDebit, totalCredit, isPosted) VALUES (?,?,?,?,?,?,1)',
        [entryId, 'JE-' + invoiceNumber, formData.date, `فاتورة مبيعات ${invoiceNumber} - ${formData.customerName}`, total, total]);

      if (invoiceType === 'cash') {
        // مدين: الصندوق
        await db.runAsync('INSERT INTO journal_items (id, entryId, accountId, debit, credit, description) VALUES (?,?,?,?,?,?)',
          ['ji1' + Date.now(), entryId, 'cash_default', total, 0, 'مدين الصندوق - فاتورة مبيعات']);
      } else {
        // مدين: العميل
        await db.runAsync('INSERT INTO journal_items (id, entryId, accountId, debit, credit, description) VALUES (?,?,?,?,?,?)',
          ['ji1' + Date.now(), entryId, formData.customerId, total, 0, 'مدين العميل']);
      }
      // دائن: المبيعات
      await db.runAsync('INSERT INTO journal_items (id, entryId, accountId, debit, credit, description) VALUES (?,?,?,?,?,?)',
        ['ji2' + Date.now(), entryId, 'sales_revenue', 0, subtotal - discountAmount, 'دائن المبيعات']);
      // دائن: ضريبة المبيعات (إذا وجدت)
      if (taxAmount > 0) {
        await db.runAsync('INSERT INTO journal_items (id, entryId, accountId, debit, credit, description) VALUES (?,?,?,?,?,?)',
          ['ji3' + Date.now(), entryId, 'tax_payable', 0, taxAmount, 'دائن ضريبة المبيعات']);
      }
    } catch (e) { console.log('Posting error:', e); }
  };

  const handleSave = async () => {
    if (!formData.customerName) { Alert.alert('خطأ', 'اختر العميل'); return; }
    if (lines.filter(l => l.itemName).length === 0) { Alert.alert('خطأ', 'أضف صنف واحد على الأقل'); return; }
    const invoiceNumber = generateNumber();
    await addInvoice({ number: invoiceNumber, type: invoiceType, ...formData, subtotal, discount: discountAmount, tax: taxAmount, total, paid, remaining, items: lines.filter(l => l.itemName) });
    await postToAccounting('', invoiceNumber);
    setShowModal(false);
    Alert.alert('✅', 'تم حفظ الفاتورة والترحيل المحاسبي');
  };

  const handlePrint = () => { Alert.alert('🖨️', 'جاري طباعة الفاتورة...'); };
  const handleExport = () => { Alert.alert('📤', 'جاري تصدير الفاتورة...'); };
  const handleRefresh = () => { loadAccounts(); };

  return (
    <View style={[st.c, { paddingTop: insets.top }]}><StatusBar barStyle="light-content" />
      <ControlHeader title="فواتير المبيعات" count={invoices.length} onBack={() => router.back()} onAdd={() => { setFormData({ date: new Date().toISOString().split('T')[0], accountId: '', accountName: '', customerId: '', customerName: '', warehouseId: '', warehouseName: '', paid: '0', discount: '0', description: '', refNumber: '' }); setLines([{ id: '1', itemId: '', itemName: '', unit: 'قطعة', qty: '0', price: '0', total: '0' }]); setShowModal(true); }} />
      <ControlButtons showPrint showRefresh showExport onPrint={handlePrint} onRefresh={handleRefresh} onExport={handleExport} />
      <TextInput style={st.si} placeholder="🔍 بحث..." placeholderTextColor="#94a3b8" value={searchQuery} onChangeText={setSearchQuery} />
      {invoices.length === 0 ? <View style={st.e}><Text style={st.ei}>📄</Text><Text style={st.et}>لا توجد فواتير</Text></View> :
        <FlatList data={invoices} keyExtractor={(i: any) => i.id} renderItem={({ item }: any) => (
          <TouchableOpacity style={st.rc}><Text style={st.rn}>{item.number}</Text><Text style={st.rd}>👤 {item.customerName}</Text><Text style={st.rt}>{item.type === 'cash' ? '💰 نقدي' : '📋 آجل'} | {item.total?.toLocaleString()} ﷼ | المتبقي: {item.remaining?.toLocaleString() || 0}</Text></TouchableOpacity>
        )} contentContainerStyle={{ padding: 16 }} />}
      
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={st.mo}><View style={st.mc}><View style={st.mh}><Text style={st.mt}>فاتورة مبيعات جديدة</Text><TouchableOpacity onPress={() => setShowModal(false)}><Text style={st.mx}>✕</Text></TouchableOpacity></View>
        <ScrollView style={st.mb}>
          <Text style={st.fl}>نوع الفاتورة</Text>
          <View style={st.tr}><TouchableOpacity style={[st.tb, invoiceType === 'cash' && st.tbA]} onPress={() => setInvoiceType('cash')}><Text style={[st.tbt, invoiceType === 'cash' && st.tbtA]}>💰 نقدي</Text></TouchableOpacity><TouchableOpacity style={[st.tb, invoiceType === 'credit' && st.tbA]} onPress={() => setInvoiceType('credit')}><Text style={[st.tbt, invoiceType === 'credit' && st.tbtA]}>📋 آجل</Text></TouchableOpacity></View>
          <Text style={st.fl}>العميل *</Text><TouchableOpacity style={st.pk} onPress={() => setShowCustomerPicker(true)}><Text style={formData.customerName ? st.pkt : st.pkp}>{formData.customerName || 'اختيار العميل'}</Text><Text style={st.pka}>▼</Text></TouchableOpacity>
          <Text style={st.fl}>المخزن</Text><TouchableOpacity style={st.pk} onPress={() => setShowWarehousePicker(true)}><Text style={formData.warehouseName ? st.pkt : st.pkp}>{formData.warehouseName || 'اختيار المخزن'}</Text><Text style={st.pka}>▼</Text></TouchableOpacity>
          <Text style={st.fl}>التاريخ</Text><TextInput style={st.fi} value={formData.date} onChangeText={v => setFormData({ ...formData, date: v })} />
          <Text style={st.fl}>البيان</Text><TextInput style={[st.fi, { height: 50 }]} value={formData.description} onChangeText={v => setFormData({ ...formData, description: v })} placeholder="بيان" placeholderTextColor="#666" multiline />
          <Text style={st.st}>📦 الأصناف</Text>
          {lines.map((line, i) => (
            <View key={line.id} style={st.lc}>
              <View style={st.lh}><Text style={{ color: '#D4AF37' }}>#{i + 1}</Text>{lines.length > 1 && <TouchableOpacity onPress={() => removeLine(line.id)}><Text style={{ color: '#EF4444' }}>🗑️</Text></TouchableOpacity>}</View>
              <TouchableOpacity style={st.pk} onPress={() => { setCurrentLineId(line.id); setShowItemPicker(true); }}><Text style={line.itemName ? st.pkt : st.pkp}>{line.itemName || 'اختيار الصنف'}</Text><Text style={st.pka}>▼</Text></TouchableOpacity>
              <View style={st.rw}><TextInput style={[st.fi, st.hf]} value={line.qty} onChangeText={v => updateLine(line.id, 'qty', v)} placeholder="كمية" placeholderTextColor="#666" keyboardType="numeric" /><TextInput style={[st.fi, st.hf]} value={line.price} onChangeText={v => updateLine(line.id, 'price', v)} placeholder="سعر" placeholderTextColor="#666" keyboardType="numeric" /></View>
              <Text style={st.lt}>{parseFloat(line.total || '0').toLocaleString()} ﷼</Text>
            </View>
          ))}
          <TouchableOpacity style={st.al} onPress={addLine}><Text style={{ color: '#D4AF37' }}>+ إضافة صنف</Text></TouchableOpacity>
          <View style={st.ss}>
            <View style={st.sr}><Text style={st.sl}>الإجمالي</Text><Text style={st.sv}>{subtotal.toLocaleString()} ﷼</Text></View>
            <View style={st.sr}><Text style={st.sl}>الخصم</Text><TextInput style={[st.fi, { width: 100 }]} value={formData.discount} onChangeText={v => setFormData({ ...formData, discount: v })} keyboardType="numeric" /></View>
            <View style={st.sr}><Text style={st.sl}>الضريبة (5%)</Text><Text style={st.sv}>{taxAmount.toLocaleString()} ﷼</Text></View>
            <View style={st.sr}><Text style={st.sl}>المدفوع</Text><TextInput style={[st.fi, { width: 100 }]} value={formData.paid} onChangeText={v => setFormData({ ...formData, paid: v })} keyboardType="numeric" /></View>
            <View style={st.gr}><Text style={st.gl}>الصافي</Text><Text style={st.gv}>{total.toLocaleString()} ﷼</Text></View>
            <View style={st.sr}><Text style={st.rm}>المتبقي</Text><Text style={[st.sv, { color: remaining > 0 ? '#EF4444' : '#10B981' }]}>{remaining.toLocaleString()} ﷼</Text></View>
          </View>
          <TouchableOpacity style={st.sb} onPress={handleSave}><Text style={st.sbt}>💾 حفظ مع الترحيل المحاسبي</Text></TouchableOpacity>
        </ScrollView></View></View>
      </Modal>
      <PickerModal visible={showCustomerPicker} title="اختيار العميل" data={customers || []} displayField="name" onSelect={(i: any) => setFormData({ ...formData, customerId: i.id, customerName: i.name })} onClose={() => setShowCustomerPicker(false)} />
      <PickerModal visible={showItemPicker} title="اختيار الصنف" data={items || []} displayField="name" onSelect={(i: any) => { updateLine(currentLineId, 'itemId', i.id); updateLine(currentLineId, 'itemName', i.name); updateLine(currentLineId, 'price', i.salePrice?.toString() || i.price?.toString() || '0'); }} onClose={() => setShowItemPicker(false)} />
      <PickerModal visible={showWarehousePicker} title="اختيار المخزن" data={warehouses || []} displayField="name" onSelect={(i: any) => setFormData({ ...formData, warehouseId: i.id, warehouseName: i.name })} onClose={() => setShowWarehousePicker(false)} />
    </View>
  );
}
const st = StyleSheet.create({
  c:{flex:1,backgroundColor:'#0A1128'},si:{marginHorizontal:16,marginBottom:12,padding:12,backgroundColor:'#16213E',borderRadius:10,color:'#FFF',borderWidth:1,borderColor:'#2a3550',textAlign:'right',fontSize:14},e:{flex:1,justifyContent:'center',alignItems:'center'},ei:{fontSize:48,marginBottom:12},et:{color:'#FFF',fontSize:16},
  rc:{backgroundColor:'#16213E',borderRadius:14,padding:14,marginBottom:10,marginHorizontal:16,borderWidth:1,borderColor:'#2a3550'},rn:{color:'#D4AF37',fontSize:14,fontWeight:'bold'},rd:{color:'#FFF',fontSize:13},rt:{color:'#10B981',fontSize:13,fontWeight:'bold'},
  mo:{flex:1,backgroundColor:'rgba(0,0,0,0.7)',justifyContent:'flex-end'},mc:{backgroundColor:'#16213E',borderTopLeftRadius:20,borderTopRightRadius:20,maxHeight:'95%'},mh:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:16,borderBottomWidth:1,borderBottomColor:'#2a3550'},mt:{color:'#D4AF37',fontSize:18,fontWeight:'bold'},mx:{color:'#EF4444',fontSize:22,fontWeight:'bold'},mb:{padding:16},
  fl:{color:'#94a3b8',fontSize:13,marginBottom:6,marginTop:12},fi:{backgroundColor:'#0A1128',borderRadius:10,padding:12,color:'#FFF',borderWidth:1,borderColor:'#2a3550',fontSize:14},
  tr:{flexDirection:'row',gap:8},tb:{flex:1,paddingVertical:12,borderRadius:10,backgroundColor:'#0A1128',borderWidth:1,borderColor:'#2a3550',alignItems:'center'},tbA:{borderColor:'#D4AF37',backgroundColor:'#D4AF37'+'20'},tbt:{color:'#94a3b8',fontSize:13},tbtA:{color:'#D4AF37',fontWeight:'bold'},
  pk:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',backgroundColor:'#0A1128',borderRadius:10,padding:14,borderWidth:1,borderColor:'#2a3550'},pkt:{color:'#FFF',fontSize:14,flex:1},pkp:{color:'#666',fontSize:14,flex:1},pka:{color:'#D4AF37',fontSize:12},
  st:{fontSize:16,fontWeight:'bold',color:'#D4AF37',marginTop:16,marginBottom:10},lc:{backgroundColor:'#0A1128',borderRadius:10,padding:12,marginBottom:8,borderWidth:1,borderColor:'#2a3550'},lh:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:8},rw:{flexDirection:'row',gap:8},hf:{flex:1},lt:{color:'#10B981',fontSize:13,fontWeight:'bold',textAlign:'right',marginTop:4},
  al:{backgroundColor:'#D4AF37'+'20',borderRadius:10,padding:12,alignItems:'center',marginTop:8,borderWidth:1,borderColor:'#D4AF37'+'40'},ss:{backgroundColor:'#0A1128',borderRadius:12,padding:14,marginTop:12},
  sr:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:4},sl:{color:'#94a3b8',fontSize:13},sv:{color:'#FFF',fontSize:14,fontWeight:'bold'},
  gr:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:10,borderTopWidth:1,borderTopColor:'#D4AF37',marginTop:4},gl:{color:'#D4AF37',fontSize:18,fontWeight:'bold'},gv:{color:'#D4AF37',fontSize:18,fontWeight:'bold'},
  rm:{color:'#EF4444',fontSize:12},sb:{backgroundColor:'#D4AF37',borderRadius:12,padding:14,alignItems:'center',marginTop:20,marginBottom:20},sbt:{color:'#0A1128',fontSize:16,fontWeight:'bold'},
});
