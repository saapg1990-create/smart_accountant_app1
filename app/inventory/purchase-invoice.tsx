import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Modal, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DataService } from '../../src/services/dataService';
import { PickerModal } from '../../src/components/ui/PickerModal';
import { ControlButtons, ControlHeader } from '../../src/components/ui/ControlButtons';

export default function PurchaseInvoiceScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], supplierId: '', supplierName: '', itemId: '', itemName: '', qty: '1', cost: '', total: '' });
  const [showSuppPicker, setShowSuppPicker] = useState(false);
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(useCallback(() => { loadAll(); }, []));
  const loadAll = async () => {
    const inv = await DataService.getPurchaseInvoices(); setInvoices(inv || []);
    const sup = await DataService.getSuppliers(); setSuppliers(sup || []);
    const itm = await DataService.getItems(); setItems(itm || []);
  };

  const calcTotal = () => { const q = parseFloat(form.qty)||0; const c = parseFloat(form.cost)||0; setForm({...form, total: String(q * c)}); };

  const handleSave = async () => {
    if (!form.supplierName || !form.itemName) return Alert.alert('خطأ', 'أكمل البيانات');
    const total = parseFloat(form.total) || 0;
    await DataService.addPurchaseInvoice({ id: 'pinv-' + Date.now(), number: 'PINV-' + Date.now().toString().slice(-6), date: form.date, supplierName: form.supplierName, itemName: form.itemName, qty: form.qty, cost: form.cost, total });
    setShowForm(false); loadAll();
  };

  return (
    <View style={[st.c, { paddingTop: insets.top }]}>
      <ControlHeader title="فواتير المشتريات" count={invoices.length} onBack={() => router.back()} onAdd={() => { setForm({ date: new Date().toISOString().split('T')[0], supplierId: '', supplierName: '', itemId: '', itemName: '', qty: '1', cost: '', total: '' }); setShowForm(true); }} />
      <ControlButtons showAdd showSearch showPrint showRefresh onAdd={() => setShowForm(true)} onRefresh={loadAll} />
      <TextInput style={st.si} placeholder="🔍 بحث..." placeholderTextColor="#666" value={searchQuery} onChangeText={setSearchQuery} />
      {showForm && (
        <Modal visible={showForm} animationType="slide" transparent>
          <View style={st.mo}><View style={st.mc}><View style={st.mh}><Text style={st.mt}>فاتورة مشتريات</Text><TouchableOpacity onPress={()=>setShowForm(false)}><Text style={st.mx}>✕</Text></TouchableOpacity></View>
          <ScrollView style={{padding:16}}>
            <Text style={st.fl}>التاريخ</Text><TextInput style={st.fi} value={form.date} onChangeText={v=>setForm({...form,date:v})} />
            <Text style={st.fl}>المورد *</Text>
            <TouchableOpacity style={st.pk} onPress={()=>setShowSuppPicker(true)}><Text style={form.supplierName?st.pkt:st.pkp}>{form.supplierName||'اختيار المورد'}</Text><Text style={st.pka}>▼</Text></TouchableOpacity>
            <Text style={st.fl}>الصنف *</Text>
            <TouchableOpacity style={st.pk} onPress={()=>setShowItemPicker(true)}><Text style={form.itemName?st.pkt:st.pkp}>{form.itemName||'اختيار الصنف'}</Text><Text style={st.pka}>▼</Text></TouchableOpacity>
            <View style={{flexDirection:'row',gap:8}}>
              <View style={{flex:1}}><Text style={st.fl}>الكمية</Text><TextInput style={st.fi} value={form.qty} onChangeText={v=>{setForm({...form,qty:v}); setTimeout(calcTotal,100);}} keyboardType="numeric" /></View>
              <View style={{flex:1}}><Text style={st.fl}>التكلفة</Text><TextInput style={st.fi} value={form.cost} onChangeText={v=>{setForm({...form,cost:v}); setTimeout(calcTotal,100);}} keyboardType="numeric" /></View>
            </View>
            <Text style={st.fl}>الإجمالي</Text><TextInput style={[st.fi,{fontSize:18,color:'#EF4444'}]} value={form.total} editable={false} />
            <TouchableOpacity style={st.sb} onPress={handleSave}><Text style={st.sbt}>💾 حفظ</Text></TouchableOpacity>
          </ScrollView></View></View>
        </Modal>
      )}
      <FlatList data={invoices.filter((i:any) => i.number?.includes(searchQuery) || i.supplierName?.includes(searchQuery))} keyExtractor={i => i.id} renderItem={({item}) => (
        <View style={st.card}><Text style={st.cn}>{item.number}</Text><Text style={st.cd}>🏭 {item.supplierName} | 📦 {item.itemName}</Text><Text style={[st.ca,{color:'#EF4444'}]}>{item.total?.toLocaleString()} ﷼</Text></View>
      )} ListEmptyComponent={<Text style={st.et}>لا توجد فواتير</Text>} contentContainerStyle={{padding:12}} />
      <PickerModal visible={showSuppPicker} title="اختيار المورد" data={suppliers} displayField="name" onSelect={(i:any)=>setForm({...form,supplierId:i.id,supplierName:i.name})} onClose={()=>setShowSuppPicker(false)} />
      <PickerModal visible={showItemPicker} title="اختيار الصنف" data={items} displayField="name" onSelect={(i:any)=>setForm({...form,itemId:i.id,itemName:i.name,cost:String(i.cost||'')})} onClose={()=>setShowItemPicker(false)} />
    </View>
  );
}
const st = StyleSheet.create({
  c:{flex:1,backgroundColor:'#0A1128'},si:{marginHorizontal:12,marginBottom:8,padding:10,backgroundColor:'#16213E',borderRadius:10,color:'#FFF',borderWidth:1,borderColor:'#2a3550',textAlign:'right'},
  mo:{flex:1,backgroundColor:'rgba(0,0,0,0.7)',justifyContent:'flex-end'},mc:{backgroundColor:'#16213E',borderTopLeftRadius:20,borderTopRightRadius:20,maxHeight:'90%'},
  mh:{flexDirection:'row',justifyContent:'space-between',padding:16},mt:{color:'#D4AF37',fontSize:16,fontWeight:'bold'},mx:{color:'#EF4444',fontSize:22},
  fl:{color:'#94a3b8',fontSize:13,marginBottom:6,marginTop:10},fi:{backgroundColor:'#0A1128',color:'#FFF',padding:10,borderRadius:8,textAlign:'right'},
  pk:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',backgroundColor:'#0A1128',padding:12,borderRadius:8,borderWidth:1,borderColor:'#2a3550'},pkt:{color:'#FFF',fontSize:13},pkp:{color:'#666',fontSize:13},pka:{color:'#D4AF37',fontSize:11},
  sb:{backgroundColor:'#D4AF37',padding:12,borderRadius:8,alignItems:'center',marginTop:16},sbt:{color:'#000',fontWeight:'bold'},
  card:{backgroundColor:'#16213E',padding:14,marginHorizontal:12,marginVertical:4,borderRadius:12},cn:{color:'#D4AF37',fontSize:14,fontWeight:'bold'},cd:{color:'#FFF',fontSize:12},ca:{fontSize:14,fontWeight:'bold'},et:{color:'#666',textAlign:'center',marginTop:40},
});
