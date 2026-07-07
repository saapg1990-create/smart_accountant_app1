import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, StatusBar, Alert, Modal, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAccountStore } from '../../src/store/useAccountStore';
import { Selector } from '../../src/components/common/Selector';
import { ControlButtons, ControlHeader } from '../../src/components/ui/ControlButtons';
import { quickPost } from '../../src/services/quickPost';

export default function PurchaseInvoiceScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const { accounts, loadAccounts } = useAccountStore();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [invoiceType, setInvoiceType] = useState<'cash'|'credit'>('cash');
  const [currentLineId, setCurrentLineId] = useState('');
  const [formData, setFormData] = useState({ date: new Date().toISOString().split('T')[0], supplierId: '', supplierName: '', cashId: '', cashName: '', warehouseId: '', warehouseName: '', paid: '0', discount: '0', description: '', currency: 'YER', exchangeRate: '1' });
  const [lines, setLines] = useState([{ id: '1', itemId: '', itemName: '', qty: '0', cost: '0', total: '0' }]);

  useFocusEffect(useCallback(() => { loadAccounts(); }, []));

  const addLine = () => setLines([...lines, { id: Date.now().toString(), itemId: '', itemName: '', qty: '0', cost: '0', total: '0' }]);
  const removeLine = (id: string) => { if (lines.length > 1) setLines(lines.filter(l => l.id !== id)); };
  const updateLine = (id: string, field: string, value: string) => { setLines(lines.map(l => { if (l.id !== id) return l; const u = { ...l, [field]: value }; if (['qty', 'cost'].includes(field)) u.total = ((parseFloat(u.qty) || 0) * (parseFloat(u.cost) || 0)).toString(); return u; })); };
  
  const subtotal = lines.reduce((s, l) => s + (parseFloat(l.total) || 0), 0);
  const discountAmount = parseFloat(formData.discount) || 0;
  const total = subtotal - discountAmount;
  const paid = parseFloat(formData.paid) || 0;
  const remaining = total - paid;
  
  const cashCount = invoices.filter((i: any) => i.type === 'cash').length + 1;
  const creditCount = invoices.filter((i: any) => i.type === 'credit').length + 1;
  const invoiceNumber = invoiceType === 'cash' ? `CPI-${cashCount.toString().padStart(6, '0')}` : `CRPI-${creditCount.toString().padStart(6, '0')}`;

  const handleSave = async () => {
    if (invoiceType === 'credit' && !formData.supplierName) { Alert.alert('خطأ', 'اختر المورد'); return; }
    if (invoiceType === 'cash' && !formData.cashName) { Alert.alert('خطأ', 'اختر الصندوق'); return; }
    if (lines.filter(l => l.itemName).length === 0) { Alert.alert('خطأ', 'أضف صنف'); return; }
    
    // ✅ ترحيل محاسبي
    if (invoiceType === 'cash') {
      await quickPost('Purchase', formData.date, invoiceNumber, formData.cashName, total, '511', formData.cashId);
    } else {
      await quickPost('Purchase', formData.date, invoiceNumber, formData.supplierName, total, '511', formData.supplierId);
    }
    
    const newInvoice = { id: 'pinv-' + Date.now(), number: invoiceNumber, type: invoiceType, ...formData, subtotal, discount: discountAmount, total, paid, remaining };
    setInvoices([newInvoice, ...invoices]);
    await loadAccounts();
    setShowModal(false);
    Alert.alert('✅', `${invoiceNumber}\n${total.toLocaleString()} ﷼`);
  };

  return (
    <View style={[st.c, { paddingTop: insets.top }]}><StatusBar barStyle="light-content" />
      <ControlHeader title="فواتير المشتريات" count={invoices.length} onBack={() => router.back()} onAdd={() => { setFormData({ date: new Date().toISOString().split('T')[0], supplierId: '', supplierName: '', cashId: '', cashName: '', warehouseId: '', warehouseName: '', paid: '0', discount: '0', description: '', currency: 'YER', exchangeRate: '1' }); setLines([{ id: '1', itemId: '', itemName: '', qty: '0', cost: '0', total: '0' }]); setShowModal(true); }} />
      <ControlButtons showSearch showPrint showRefresh showExport onRefresh={loadAccounts} />
      <TextInput style={st.si} placeholder="🔍 بحث..." placeholderTextColor="#94a3b8" value={searchQuery} onChangeText={setSearchQuery} />
      
      {invoices.length === 0 ? <Text style={st.et}>لا توجد فواتير</Text> :
        <FlatList data={invoices} keyExtractor={(i: any) => i.id} renderItem={({ item }: any) => (
          <View style={st.rc}><Text style={st.rn}>{item.number}</Text><Text style={st.rd}>{item.type==='cash'?'💰 نقدي':'📋 آجل'} | {item.supplierName||item.cashName}</Text><Text style={st.rt}>{item.total?.toLocaleString()} ﷼</Text></View>
        )} contentContainerStyle={{ padding: 16 }} />}

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={st.mo}><View style={st.mc}><View style={st.mh}><Text style={st.mt}>فاتورة مشتريات</Text><TouchableOpacity onPress={() => setShowModal(false)}><Text style={st.mx}>✕</Text></TouchableOpacity></View>
        <ScrollView style={st.mb}>
          <Text style={st.fl}>النوع</Text>
          <View style={st.tr}>
            <TouchableOpacity style={[st.tb, invoiceType==='cash'&&st.tbA]} onPress={()=>setInvoiceType('cash')}><Text style={[st.tbt, invoiceType==='cash'&&st.tbtA]}>💰 نقدي</Text></TouchableOpacity>
            <TouchableOpacity style={[st.tb, invoiceType==='credit'&&st.tbA]} onPress={()=>setInvoiceType('credit')}><Text style={[st.tbt, invoiceType==='credit'&&st.tbtA]}>📋 آجل</Text></TouchableOpacity>
          </View>
          <Text style={st.fl}>الرقم</Text><TextInput style={[st.fi,{color:'#D4AF37'}]} value={invoiceNumber} editable={false} />

          {invoiceType==='cash' ? (
            <Selector label="الصندوق *" tableName="accounts" filterField="parentId" filterValue="111" displayField="name" subField="code" selectedId={formData.cashId} selectedName={formData.cashName} onSelect={(i:any)=>setFormData({...formData,cashId:i.id,cashName:i.name})} />
          ) : (
            <Selector label="المورد *" tableName="suppliers" displayField="name" selectedId={formData.supplierId} selectedName={formData.supplierName} onSelect={(i:any)=>setFormData({...formData,supplierId:i.id,supplierName:i.name})} />
          )}

          <Selector label="المخزن" tableName="warehouses" displayField="name" selectedId={formData.warehouseId} selectedName={formData.warehouseName} onSelect={(i:any)=>setFormData({...formData,warehouseId:i.id,warehouseName:i.name})} />

          <Text style={st.fl}>التاريخ</Text><TextInput style={st.fi} value={formData.date} onChangeText={v=>setFormData({...formData,date:v})} />
          <Text style={st.fl}>البيان</Text><TextInput style={[st.fi,{height:50}]} value={formData.description} onChangeText={v=>setFormData({...formData,description:v})} placeholder="بيان" placeholderTextColor="#666" multiline />

          <Text style={st.st}>📦 الأصناف</Text>
          {lines.map((line,i)=>(
            <View key={line.id} style={st.lc}>
              <View style={{flexDirection:'row',justifyContent:'space-between',marginBottom:8}}>
                <Text style={{color:'#D4AF37'}}>#{i+1}</Text>
                {lines.length>1 && <TouchableOpacity onPress={()=>removeLine(line.id)}><Text style={{color:'#EF4444'}}>🗑️</Text></TouchableOpacity>}
              </View>
              <Selector label="الصنف" tableName="items" displayField="name" selectedId={line.itemId} selectedName={line.itemName} onSelect={(item:any)=>{updateLine(line.id,'itemId',item.id);updateLine(line.id,'itemName',item.name);updateLine(line.id,'cost',String(item.cost||0))}} />
              <View style={st.rw}><TextInput style={[st.fi,st.hf]} value={line.qty} onChangeText={v=>updateLine(line.id,'qty',v)} placeholder="كمية" keyboardType="numeric"/><TextInput style={[st.fi,st.hf]} value={line.cost} onChangeText={v=>updateLine(line.id,'cost',v)} placeholder="تكلفة" keyboardType="numeric"/></View>
              <Text style={st.lt}>{parseFloat(line.total||'0').toLocaleString()} ﷼</Text>
            </View>
          ))}
          <TouchableOpacity style={st.al} onPress={addLine}><Text style={{color:'#D4AF37'}}>+ صنف</Text></TouchableOpacity>

          <View style={st.ss}>
            <View style={st.sr}><Text style={st.sl}>الإجمالي</Text><Text style={st.sv}>{subtotal.toLocaleString()}</Text></View>
            <View style={st.sr}><Text style={st.sl}>الخصم</Text><TextInput style={[st.fi,{width:100}]} value={formData.discount} onChangeText={v=>setFormData({...formData,discount:v})} keyboardType="numeric"/></View>
            <View style={st.sr}><Text style={st.sl}>المدفوع</Text><TextInput style={[st.fi,{width:100}]} value={formData.paid} onChangeText={v=>setFormData({...formData,paid:v})} keyboardType="numeric"/></View>
            <View style={st.gr}><Text style={st.gl}>الصافي</Text><Text style={st.gv}>{total.toLocaleString()}</Text></View>
          </View>
          <TouchableOpacity style={st.sb} onPress={handleSave}><Text style={st.sbt}>💾 حفظ مع الترحيل</Text></TouchableOpacity>
        </ScrollView></View></View>
      </Modal>
    </View>
  );
}
const st = StyleSheet.create({
  c:{flex:1,backgroundColor:'#0A1128'},si:{marginHorizontal:16,marginBottom:8,padding:12,backgroundColor:'#16213E',borderRadius:10,color:'#FFF',borderWidth:1,borderColor:'#2a3550',textAlign:'right'},et:{color:'#FFF',fontSize:16,textAlign:'center',marginTop:40},
  rc:{backgroundColor:'#16213E',borderRadius:14,padding:14,marginBottom:8,marginHorizontal:16,borderWidth:1,borderColor:'#2a3550'},rn:{color:'#D4AF37',fontSize:14,fontWeight:'bold'},rd:{color:'#FFF',fontSize:12},rt:{color:'#10B981',fontSize:13},
  mo:{flex:1,backgroundColor:'rgba(0,0,0,0.7)',justifyContent:'flex-end'},mc:{backgroundColor:'#16213E',borderTopLeftRadius:20,borderTopRightRadius:20,maxHeight:'95%'},mh:{flexDirection:'row',justifyContent:'space-between',padding:16},mt:{color:'#D4AF37',fontSize:18,fontWeight:'bold'},mx:{color:'#EF4444',fontSize:22},mb:{padding:16},
  fl:{color:'#94a3b8',fontSize:13,marginBottom:6,marginTop:12},fi:{backgroundColor:'#0A1128',borderRadius:10,padding:12,color:'#FFF',borderWidth:1,borderColor:'#2a3550',fontSize:14,textAlign:'right'},
  tr:{flexDirection:'row',gap:8},tb:{flex:1,paddingVertical:12,borderRadius:10,backgroundColor:'#0A1128',borderWidth:1,borderColor:'#2a3550',alignItems:'center'},tbA:{borderColor:'#D4AF37',backgroundColor:'#D4AF3720'},tbt:{color:'#94a3b8',fontSize:13},tbtA:{color:'#D4AF37',fontWeight:'bold'},
  st:{fontSize:16,fontWeight:'bold',color:'#D4AF37',marginTop:16,marginBottom:10},lc:{backgroundColor:'#0A1128',borderRadius:10,padding:12,marginBottom:8,borderWidth:1,borderColor:'#2a3550'},rw:{flexDirection:'row',gap:8},hf:{flex:1},lt:{color:'#10B981',fontSize:13,textAlign:'right'},
  al:{backgroundColor:'#D4AF3720',borderRadius:10,padding:12,alignItems:'center',marginTop:8},ss:{backgroundColor:'#0A1128',borderRadius:12,padding:14,marginTop:12},
  sr:{flexDirection:'row',justifyContent:'space-between',paddingVertical:4},sl:{color:'#94a3b8',fontSize:13},sv:{color:'#FFF',fontSize:14,fontWeight:'bold'},
  gr:{flexDirection:'row',justifyContent:'space-between',paddingVertical:10,borderTopWidth:1,borderTopColor:'#D4AF37',marginTop:4},gl:{color:'#D4AF37',fontSize:18,fontWeight:'bold'},gv:{color:'#D4AF37',fontSize:18,fontWeight:'bold'},
  sb:{backgroundColor:'#D4AF37',borderRadius:12,padding:14,alignItems:'center',marginTop:20,marginBottom:20},sbt:{color:'#0A1128',fontSize:16,fontWeight:'bold'},
});
