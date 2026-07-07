import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Modal, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAccountStore } from '../../src/store/useAccountStore';
import { Selector } from '../../src/components/common/Selector';
import { CurrencySelector } from '../../src/components/common/CurrencySelector';
import { ControlHeader } from '../../src/components/ui/ControlButtons';
import { unifiedPost } from '../../src/services/unifiedPost';

export default function SalesReturnScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const { accounts, loadAccounts } = useAccountStore();
  const [returns, setReturns] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [currency, setCurrency] = useState('YER');
  const [exchangeRate, setExchangeRate] = useState('1');
  const [formData, setFormData] = useState({ date: new Date().toISOString().split('T')[0], customerId: '', customerName: '', reason: '' });
  const [lines, setLines] = useState([{ id: '1', itemId: '', itemName: '', qty: '0', price: '0', total: '0' }]);

  useFocusEffect(useCallback(() => { loadAccounts(); }, []));

  const customerAccounts = accounts.filter((a: any) => a.parentId === '114');
  const inventoryAccounts = accounts.filter((a: any) => a.parentId === '115');

  const addLine = () => setLines([...lines, { id: Date.now().toString(), itemId: '', itemName: '', qty: '0', price: '0', total: '0' }]);
  const updateLine = (id: string, field: string, value: string) => { setLines(lines.map(l => { if (l.id !== id) return l; const u = { ...l, [field]: value }; if (['qty', 'price'].includes(field)) u.total = ((parseFloat(u.qty) || 0) * (parseFloat(u.price) || 0)).toString(); return u; })); };
  const total = lines.reduce((s, l) => s + (parseFloat(l.total) || 0), 0);
  
  const count = returns.length + 1;
  const returnNumber = `SR-${count.toString().padStart(6, '0')}`;

  const handleSave = async () => {
    if (!formData.customerName) { Alert.alert('خطأ', 'اختر العميل'); return; }
    
    const result = await unifiedPost('salesReturn', { ...formData, total, currency, exchangeRate, customerId: formData.customerId, customerName: formData.customerName });
    
    if (result.success) {
      setReturns([{ id: Date.now().toString(), number: returnNumber, ...formData, total }, ...returns]);
      await loadAccounts();
      setShowModal(false);
      Alert.alert('✅', `${returnNumber}\n${result.amountYER?.toLocaleString()} ﷼`);
    } else {
      Alert.alert('❌', result.error);
    }
  };

  return (
    <View style={[st.c, { paddingTop: insets.top }]}>
      <ControlHeader title="مردود المبيعات" count={returns.length} onBack={() => router.back()} onAdd={() => { setFormData({ date: new Date().toISOString().split('T')[0], customerId: '', customerName: '', reason: '' }); setLines([{ id: '1', itemId: '', itemName: '', qty: '0', price: '0', total: '0' }]); setShowModal(true); }} />
      {returns.length === 0 ? <Text style={st.et}>لا توجد مردودات</Text> :
        <FlatList data={returns} keyExtractor={(i: any) => i.id} renderItem={({ item }: any) => (
          <View style={st.rc}><Text style={st.rn}>{item.number}</Text><Text style={st.rd}>👤 {item.customerName}</Text><Text style={st.rt}>{item.total?.toLocaleString()} ﷼</Text></View>
        )} contentContainerStyle={{ padding: 16 }} />}

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={st.mo}><View style={st.mc}><View style={st.mh}><Text style={st.mt}>مردود مبيعات</Text><TouchableOpacity onPress={() => setShowModal(false)}><Text style={st.mx}>✕</Text></TouchableOpacity></View>
        <ScrollView style={st.mb}>
          <Text style={st.fl}>الرقم</Text><TextInput style={[st.fi,{color:'#D4AF37'}]} value={returnNumber} editable={false} />
          <CurrencySelector selectedCurrency={currency} exchangeRate={exchangeRate} onCurrencyChange={(c, r) => { setCurrency(c); setExchangeRate(r); }} />
          <Selector label="العميل *" tableName="accounts" filterField="parentId" filterValue="114" displayField="name" subField="code" showBalance selectedId={formData.customerId} selectedName={formData.customerName} onSelect={(i:any)=>setFormData({...formData,customerId:i.id,customerName:i.name})} />
          <Text style={st.fl}>التاريخ</Text><TextInput style={st.fi} value={formData.date} onChangeText={v=>setFormData({...formData,date:v})} />
          <Text style={st.fl}>سبب المردود</Text><TextInput style={st.fi} value={formData.reason} onChangeText={v=>setFormData({...formData,reason:v})} />
          <Text style={st.st}>📦 الأصناف المرتجعة</Text>
          {lines.map((line,i)=>(
            <View key={line.id} style={st.lc}>
              <Selector label="الصنف" tableName="items" displayField="name" selectedId={line.itemId} selectedName={line.itemName} onSelect={(item:any)=>{updateLine(line.id,'itemId',item.id);updateLine(line.id,'itemName',item.name)}} />
              <View style={st.rw}><TextInput style={[st.fi,st.hf]} value={line.qty} onChangeText={v=>updateLine(line.id,'qty',v)} placeholder="كمية" keyboardType="numeric"/><TextInput style={[st.fi,st.hf]} value={line.price} onChangeText={v=>updateLine(line.id,'price',v)} placeholder="سعر" keyboardType="numeric"/></View>
            </View>
          ))}
          <TouchableOpacity style={st.al} onPress={addLine}><Text style={{color:'#D4AF37'}}>+ صنف</Text></TouchableOpacity>
          <Text style={st.gt}>الإجمالي: {total.toLocaleString()} ﷼</Text>
          <TouchableOpacity style={st.sb} onPress={handleSave}><Text style={st.sbt}>💾 حفظ</Text></TouchableOpacity>
        </ScrollView></View></View>
      </Modal>
    </View>
  );
}
const st = StyleSheet.create({
  c:{flex:1,backgroundColor:'#0A1128'},et:{color:'#FFF',fontSize:16,textAlign:'center',marginTop:40},
  rc:{backgroundColor:'#16213E',borderRadius:14,padding:14,marginBottom:10,marginHorizontal:16,borderWidth:1,borderColor:'#2a3550'},rn:{color:'#D4AF37',fontSize:14,fontWeight:'bold'},rd:{color:'#FFF',fontSize:13},rt:{color:'#10B981',fontSize:13},
  mo:{flex:1,backgroundColor:'rgba(0,0,0,0.7)',justifyContent:'flex-end'},mc:{backgroundColor:'#16213E',borderTopLeftRadius:20,borderTopRightRadius:20,maxHeight:'95%'},mh:{flexDirection:'row',justifyContent:'space-between',padding:16},mt:{color:'#D4AF37',fontSize:18,fontWeight:'bold'},mx:{color:'#EF4444',fontSize:22},mb:{padding:16},
  fl:{color:'#94a3b8',fontSize:13,marginBottom:6,marginTop:12},fi:{backgroundColor:'#0A1128',borderRadius:10,padding:12,color:'#FFF',borderWidth:1,borderColor:'#2a3550',fontSize:14,textAlign:'right'},
  st:{fontSize:16,fontWeight:'bold',color:'#D4AF37',marginTop:16,marginBottom:10},lc:{backgroundColor:'#0A1128',borderRadius:10,padding:12,marginBottom:8,borderWidth:1,borderColor:'#2a3550'},rw:{flexDirection:'row',gap:8},hf:{flex:1},
  al:{backgroundColor:'#D4AF3720',borderRadius:10,padding:12,alignItems:'center',marginTop:8},gt:{color:'#D4AF37',fontSize:16,fontWeight:'bold',textAlign:'center',marginTop:12},sb:{backgroundColor:'#D4AF37',borderRadius:12,padding:14,alignItems:'center',marginTop:20,marginBottom:20},sbt:{color:'#0A1128',fontSize:16,fontWeight:'bold'},
});
