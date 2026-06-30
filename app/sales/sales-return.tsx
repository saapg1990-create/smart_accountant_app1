import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Modal, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalTable } from '../../hooks/useLocalStore';
import { useAccountStore } from '../../src/store/useAccountStore';
import { PickerModal } from '../../src/components/ui/PickerModal';
import { ControlHeader } from '../../src/components/ui/ControlButtons';
import { useDatabase } from '../../context/DatabaseContext';

export default function SalesReturnScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const { data: returns, add } = useLocalTable('salesReturns');
  const { loadAccounts } = useAccountStore();
  const { data: customers } = useLocalTable('customers');
  const { data: invoices } = useLocalTable('salesInvoices');
  const { data: items } = useLocalTable('items');
  const { db } = useDatabase();
  const [showModal, setShowModal] = useState(false);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [showInvoicePicker, setShowInvoicePicker] = useState(false);
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [currentLineId, setCurrentLineId] = useState('');
  const [formData, setFormData] = useState({ date: new Date().toISOString().split('T')[0], customerId: '', customerName: '', invoiceId: '', invoiceNumber: '', reason: '', total: '0' });
  const [lines, setLines] = useState([{ id: '1', itemId: '', itemName: '', qty: '0', price: '0', total: '0' }]);

  useFocusEffect(useCallback(() => { loadAccounts(); }, []));
  const addLine = () => setLines([...lines, { id: Date.now().toString(), itemId: '', itemName: '', qty: '0', price: '0', total: '0' }]);
  const updateLine = (id: string, field: string, value: string) => { setLines(lines.map(l => { if (l.id !== id) return l; const u = { ...l, [field]: value }; if (['qty', 'price'].includes(field)) u.total = ((parseFloat(u.qty) || 0) * (parseFloat(u.price) || 0)).toString(); return u; })); };
  const total = lines.reduce((s, l) => s + (parseFloat(l.total) || 0), 0);

  const postToAccounting = async (returnNumber: string) => {
    if (!db) return;
    try {
      const entryId = 'je' + Date.now();
      await db.runAsync('INSERT INTO journal_entries (id, number, date, description, totalDebit, totalCredit, isPosted) VALUES (?,?,?,?,?,?,1)',
        [entryId, 'JE-' + returnNumber, formData.date, `مردود مبيعات ${returnNumber} - ${formData.customerName}`, total, total]);
      await db.runAsync('INSERT INTO journal_items (id, entryId, accountId, debit, credit, description) VALUES (?,?,?,?,?,?)',
        ['ji1' + Date.now(), entryId, 'sales_returns', total, 0, 'مدين مردودات المبيعات']);
      await db.runAsync('INSERT INTO journal_items (id, entryId, accountId, debit, credit, description) VALUES (?,?,?,?,?,?)',
        ['ji2' + Date.now(), entryId, formData.customerId, 0, total, 'دائن العميل']);
    } catch (e) { console.log('Posting error:', e); }
  };

  const handleSave = async () => {
    if (!formData.customerName) { Alert.alert('خطأ', 'اختر العميل'); return; }
    const returnNumber = 'SR-' + (returns.length + 1).toString().padStart(5, '0');
    await add({ number: returnNumber, ...formData, total, items: lines.filter(l => l.itemName) });
    await postToAccounting(returnNumber);
    setShowModal(false); Alert.alert('✅', 'تم حفظ مردود المبيعات مع الترحيل المحاسبي');
  };

  return (
    <View style={[st.c, { paddingTop: insets.top }]}>
      <ControlHeader title="مردود المبيعات" count={returns.length} onBack={() => router.back()} onAdd={() => { setFormData({ date: new Date().toISOString().split('T')[0], customerId: '', customerName: '', invoiceId: '', invoiceNumber: '', reason: '', total: '0' }); setLines([{ id: '1', itemId: '', itemName: '', qty: '0', price: '0', total: '0' }]); setShowModal(true); }} />
      {returns.length === 0 ? <View style={st.e}><Text style={st.et}>لا توجد مردودات</Text></View> :
        <FlatList data={returns} keyExtractor={(i: any) => i.id} renderItem={({ item }: any) => (
          <View style={st.rc}><Text style={st.rn}>{item.number}</Text><Text style={st.rd}>👤 {item.customerName}</Text><Text style={st.rt}>{item.total?.toLocaleString()} ﷼</Text></View>
        )} contentContainerStyle={{ padding: 16 }} />}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={st.mo}><View style={st.mc}><View style={st.mh}><Text style={st.mt}>مردود مبيعات</Text><TouchableOpacity onPress={() => setShowModal(false)}><Text style={st.mx}>✕</Text></TouchableOpacity></View>
        <ScrollView style={st.mb}>
          <Text style={st.fl}>العميل *</Text><TouchableOpacity style={st.pk} onPress={() => setShowCustomerPicker(true)}><Text style={formData.customerName ? st.pkt : st.pkp}>{formData.customerName || 'اختيار العميل'}</Text><Text style={st.pka}>▼</Text></TouchableOpacity>
          <Text style={st.fl}>رقم الفاتورة</Text><TouchableOpacity style={st.pk} onPress={() => setShowInvoicePicker(true)}><Text style={formData.invoiceNumber ? st.pkt : st.pkp}>{formData.invoiceNumber || 'اختيار الفاتورة'}</Text><Text style={st.pka}>▼</Text></TouchableOpacity>
          <Text style={st.fl}>التاريخ</Text><TextInput style={st.fi} value={formData.date} onChangeText={v => setFormData({ ...formData, date: v })} />
          <Text style={st.fl}>السبب</Text><TextInput style={st.fi} value={formData.reason} onChangeText={v => setFormData({ ...formData, reason: v })} />
          <Text style={st.st}>📦 الأصناف</Text>
          {lines.map((line, i) => (
            <View key={line.id} style={st.lc}>
              <TouchableOpacity style={st.pk} onPress={() => { setCurrentLineId(line.id); setShowItemPicker(true); }}><Text style={line.itemName ? st.pkt : st.pkp}>{line.itemName || 'اختيار الصنف'}</Text><Text style={st.pka}>▼</Text></TouchableOpacity>
              <View style={st.rw}><TextInput style={[st.fi, st.hf]} value={line.qty} onChangeText={v => updateLine(line.id, 'qty', v)} placeholder="كمية" placeholderTextColor="#666" keyboardType="numeric" /><TextInput style={[st.fi, st.hf]} value={line.price} onChangeText={v => updateLine(line.id, 'price', v)} placeholder="سعر" placeholderTextColor="#666" keyboardType="numeric" /></View>
            </View>
          ))}
          <TouchableOpacity style={st.al} onPress={addLine}><Text style={{ color: '#D4AF37' }}>+ إضافة صنف</Text></TouchableOpacity>
          <Text style={st.gt}>الإجمالي: {total.toLocaleString()} ﷼</Text>
          <TouchableOpacity style={st.sb} onPress={handleSave}><Text style={st.sbt}>💾 حفظ مع الترحيل</Text></TouchableOpacity>
        </ScrollView></View></View>
      </Modal>
      <PickerModal visible={showCustomerPicker} title="اختيار العميل" data={customers || []} displayField="name" onSelect={(i: any) => setFormData({ ...formData, customerId: i.id, customerName: i.name })} onClose={() => setShowCustomerPicker(false)} />
      <PickerModal visible={showInvoicePicker} title="اختيار الفاتورة" data={invoices || []} displayField="number" onSelect={(i: any) => setFormData({ ...formData, invoiceId: i.id, invoiceNumber: i.number })} onClose={() => setShowInvoicePicker(false)} />
      <PickerModal visible={showItemPicker} title="اختيار الصنف" data={items || []} displayField="name" onSelect={(i: any) => { updateLine(currentLineId, 'itemId', i.id); updateLine(currentLineId, 'itemName', i.name); updateLine(currentLineId, 'price', i.price?.toString() || '0'); }} onClose={() => setShowItemPicker(false)} />
    </View>
  );
}
const st = StyleSheet.create({
  c:{flex:1,backgroundColor:'#0A1128'},e:{flex:1,justifyContent:'center',alignItems:'center'},et:{color:'#FFF',fontSize:16},
  rc:{backgroundColor:'#16213E',borderRadius:14,padding:14,marginBottom:10,marginHorizontal:16,borderWidth:1,borderColor:'#2a3550'},rn:{color:'#D4AF37',fontSize:14,fontWeight:'bold'},rd:{color:'#FFF',fontSize:13},rt:{color:'#10B981',fontSize:13},
  mo:{flex:1,backgroundColor:'rgba(0,0,0,0.7)',justifyContent:'flex-end'},mc:{backgroundColor:'#16213E',borderTopLeftRadius:20,borderTopRightRadius:20,maxHeight:'95%'},mh:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:16,borderBottomWidth:1,borderBottomColor:'#2a3550'},mt:{color:'#D4AF37',fontSize:18,fontWeight:'bold'},mx:{color:'#EF4444',fontSize:22},mb:{padding:16},
  fl:{color:'#94a3b8',fontSize:13,marginBottom:6,marginTop:12},fi:{backgroundColor:'#0A1128',borderRadius:10,padding:12,color:'#FFF',borderWidth:1,borderColor:'#2a3550',fontSize:14},
  pk:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',backgroundColor:'#0A1128',borderRadius:10,padding:14,borderWidth:1,borderColor:'#2a3550'},pkt:{color:'#FFF',fontSize:14,flex:1},pkp:{color:'#666',fontSize:14,flex:1},pka:{color:'#D4AF37',fontSize:12},
  st:{fontSize:16,fontWeight:'bold',color:'#D4AF37',marginTop:16,marginBottom:10},lc:{backgroundColor:'#0A1128',borderRadius:10,padding:12,marginBottom:8,borderWidth:1,borderColor:'#2a3550'},rw:{flexDirection:'row',gap:8},hf:{flex:1},
  al:{backgroundColor:'#D4AF37'+'20',borderRadius:10,padding:12,alignItems:'center',marginTop:8},gt:{color:'#D4AF37',fontSize:16,fontWeight:'bold',textAlign:'center',marginTop:12},sb:{backgroundColor:'#D4AF37',borderRadius:12,padding:14,alignItems:'center',marginTop:20,marginBottom:20},sbt:{color:'#0A1128',fontSize:16,fontWeight:'bold'},
});
