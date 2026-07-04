import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DataService } from '../../src/services/dataService';
import { PickerModal } from '../../src/components/ui/PickerModal';
import { ControlButtons, ControlHeader } from '../../src/components/ui/ControlButtons';

export default function CashBoxesScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const [data, setData] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', currency: 'YER', balance: '' });
  const [showCurPicker, setShowCurPicker] = useState(false);

  useFocusEffect(useCallback(() => { loadAll(); }, []));
  const loadAll = async () => {
    setData(await DataService.getCashBoxes() || []);
    setCurrencies(await DataService.getCurrenciesWithSymbols() || []);
  };

  const openAdd = () => { setForm({ name: '', currency: 'YER', balance: '' }); setShowForm(true); };
  
  const handleSave = async () => {
    if (!form.name.trim()) return Alert.alert('خطأ', 'أدخل اسم الصندوق');
    await DataService.addCashBox({ id: 'cb-' + Date.now(), name: form.name, currency: form.currency, balance: parseFloat(form.balance) || 0 });
    setShowForm(false); loadAll();
  };

  const totalByCurrency: any = {};
  data.forEach((b: any) => {
    const cur = b.currency || 'YER';
    totalByCurrency[cur] = (totalByCurrency[cur] || 0) + (b.balance || 0);
  });

  const getSymbol = (code: string) => currencies.find((c: any) => c.code === code)?.symbol || code;

  return (
    <View style={[st.c, { paddingTop: insets.top }]}>
      <ControlHeader title="الصناديق" count={data.length} onBack={() => router.back()} onAdd={openAdd} />
      <ControlButtons showAdd showSearch showRefresh onAdd={openAdd} onRefresh={loadAll} />
      
      <View style={st.totalRow}>
        {Object.entries(totalByCurrency).map(([cur, bal]: any) => (
          <View key={cur} style={st.totalBox}>
            <Text style={st.totalCur}>{cur} {getSymbol(cur)}</Text>
            <Text style={st.totalVal}>{bal.toLocaleString()}</Text>
          </View>
        ))}
      </View>

      {showForm && (
        <Modal visible={showForm} animationType="slide" transparent>
          <View style={st.mo}><View style={st.mc}><View style={st.mh}><Text style={st.mt}>صندوق جديد</Text><TouchableOpacity onPress={()=>setShowForm(false)}><Text style={st.mx}>✕</Text></TouchableOpacity></View>
          <View style={{padding:16}}>
            <Text style={st.fl}>اسم الصندوق</Text>
            <TextInput style={st.fi} value={form.name} onChangeText={v=>setForm({...form,name:v})} placeholder="اسم الصندوق" placeholderTextColor="#666" />
            <Text style={st.fl}>العملة</Text>
            <TouchableOpacity style={st.pk} onPress={()=>setShowCurPicker(true)}>
              <Text style={st.pkt}>{form.currency} {getSymbol(form.currency)}</Text>
              <Text style={st.pka}>▼</Text>
            </TouchableOpacity>
            <Text style={st.fl}>الرصيد الافتتاحي</Text>
            <TextInput style={st.fi} value={form.balance} onChangeText={v=>setForm({...form,balance:v})} keyboardType="numeric" placeholder="0" placeholderTextColor="#666" />
            <TouchableOpacity style={st.sb} onPress={handleSave}><Text style={st.sbt}>💾 حفظ</Text></TouchableOpacity>
          </View></View></View>
        </Modal>
      )}

      <FlatList data={data} keyExtractor={i => i.id} renderItem={({item}) => (
        <View style={st.card}>
          <Text style={st.cn}>💰 {item.name}</Text>
          <Text style={st.cb}>{item.balance?.toLocaleString()} {getSymbol(item.currency)}</Text>
          <Text style={st.cc}>{item.currency}</Text>
        </View>
      )} ListEmptyComponent={<Text style={st.et}>لا توجد صناديق</Text>} contentContainerStyle={{padding:12}} />
      
      <PickerModal visible={showCurPicker} title="اختيار العملة" data={currencies} displayField="code" subField="name" onSelect={(i:any)=>setForm({...form,currency:i.code})} onClose={()=>setShowCurPicker(false)} />
    </View>
  );
}
const st = StyleSheet.create({
  c:{flex:1,backgroundColor:'#0A1128'},
  totalRow:{flexDirection:'row',marginHorizontal:12,marginBottom:8,gap:6},
  totalBox:{flex:1,backgroundColor:'#16213E',borderRadius:10,padding:12,alignItems:'center',borderWidth:1,borderColor:'#2a3550'},
  totalCur:{color:'#94a3b8',fontSize:12},totalVal:{color:'#D4AF37',fontSize:16,fontWeight:'bold',marginTop:4},
  mo:{flex:1,backgroundColor:'rgba(0,0,0,0.7)',justifyContent:'flex-end'},mc:{backgroundColor:'#16213E',borderTopLeftRadius:20,borderTopRightRadius:20,maxHeight:'70%'},
  mh:{flexDirection:'row',justifyContent:'space-between',padding:16},mt:{color:'#D4AF37',fontSize:16,fontWeight:'bold'},mx:{color:'#EF4444',fontSize:22},
  fl:{color:'#94a3b8',fontSize:13,marginBottom:6,marginTop:10},fi:{backgroundColor:'#0A1128',color:'#FFF',padding:10,borderRadius:8,textAlign:'right'},
  pk:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',backgroundColor:'#0A1128',padding:12,borderRadius:8,borderWidth:1,borderColor:'#2a3550'},pkt:{color:'#FFF',fontSize:13},pka:{color:'#D4AF37',fontSize:11},
  sb:{backgroundColor:'#D4AF37',padding:12,borderRadius:8,alignItems:'center',marginTop:12},sbt:{color:'#000',fontWeight:'bold'},
  card:{backgroundColor:'#16213E',flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:14,marginHorizontal:12,marginVertical:4,borderRadius:12},cn:{color:'#FFF',fontSize:14,fontWeight:'bold'},cb:{color:'#10B981',fontSize:14,fontWeight:'bold'},cc:{color:'#94a3b8',fontSize:10},et:{color:'#666',textAlign:'center',marginTop:40},
});
