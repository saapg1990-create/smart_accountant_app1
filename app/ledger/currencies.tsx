import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DataService } from '../../src/services/dataService';
import { ControlButtons, ControlHeader } from '../../src/components/ui/ControlButtons';

export default function CurrenciesScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const [data, setData] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: '', name: '', symbol: '', rate: '1' });
  const [showRate, setShowRate] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newRate, setNewRate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(useCallback(() => { loadAll(); }, []));
  const loadAll = async () => { const res = await DataService.getCurrencies(); setData(res || []); };
  const openAdd = () => { setForm({ code: '', name: '', symbol: '', rate: '1' }); setShowForm(true); };
  const handleSave = async () => {
    if (!form.code || !form.name) return Alert.alert('خطأ', 'أكمل البيانات');
    await DataService.addCurrency({ id: 'cur-' + Date.now(), ...form, rate: parseFloat(form.rate) || 1, isDefault: 0 });
    setShowForm(false); loadAll();
  };
  const updateRate = async () => {
    if (!selectedId) return;
    await DataService.updateCurrency(selectedId, { rate: parseFloat(newRate) || 1 });
    setShowRate(false); loadAll();
  };

  const filtered = data.filter((c: any) => c.name?.includes(searchQuery) || c.code?.includes(searchQuery));

  return (
    <View style={[st.c, { paddingTop: insets.top }]}>
      <ControlHeader title="العملات" count={data.length} onBack={() => router.back()} onAdd={openAdd} />
      <ControlButtons showAdd showSearch showRefresh showExport onAdd={openAdd} onRefresh={loadAll} />
      <TextInput style={st.si} placeholder="🔍 بحث..." placeholderTextColor="#666" value={searchQuery} onChangeText={setSearchQuery} />
      <TouchableOpacity style={st.rateBtn} onPress={() => { const c = data.find((x: any) => x.id === selectedId); if (c) { setNewRate(String(c.rate)); setShowRate(true); } else Alert.alert('تنبيه', 'اختر عملة أولاً'); }}>
        <Text style={st.rateText}>💱 تحديث سعر الصرف</Text>
      </TouchableOpacity>
      {showForm && (
        <Modal visible={showForm} animationType="slide" transparent>
          <View style={st.mo}><View style={st.mc}><View style={st.mh}><Text style={st.mt}>عملة جديدة</Text><TouchableOpacity onPress={()=>setShowForm(false)}><Text style={st.mx}>✕</Text></TouchableOpacity></View>
          <View style={{padding:16}}>
            <TextInput style={st.fi} value={form.code} onChangeText={v=>setForm({...form,code:v.toUpperCase()})} placeholder="كود (USD)" placeholderTextColor="#666" />
            <TextInput style={st.fi} value={form.name} onChangeText={v=>setForm({...form,name:v})} placeholder="الاسم" placeholderTextColor="#666" />
            <TextInput style={st.fi} value={form.symbol} onChangeText={v=>setForm({...form,symbol:v})} placeholder="الرمز ($)" placeholderTextColor="#666" />
            <TextInput style={st.fi} value={form.rate} onChangeText={v=>setForm({...form,rate:v})} placeholder="سعر الصرف" placeholderTextColor="#666" keyboardType="numeric" />
            <TouchableOpacity style={st.sb} onPress={handleSave}><Text style={st.sbt}>💾 حفظ</Text></TouchableOpacity>
          </View></View></View>
        </Modal>
      )}
      {showRate && (
        <Modal visible={showRate} animationType="fade" transparent>
          <View style={st.mo}><View style={[st.mc,{maxHeight:200}]}><View style={st.mh}><Text style={st.mt}>تحديث السعر</Text><TouchableOpacity onPress={()=>setShowRate(false)}><Text style={st.mx}>✕</Text></TouchableOpacity></View>
          <View style={{padding:16}}><TextInput style={st.fi} value={newRate} onChangeText={setNewRate} keyboardType="numeric" /><TouchableOpacity style={st.sb} onPress={updateRate}><Text style={st.sbt}>💱 تحديث</Text></TouchableOpacity></View></View></View>
        </Modal>
      )}
      <FlatList data={filtered} keyExtractor={i => i.id} renderItem={({item}) => (
        <TouchableOpacity style={[st.card, selectedId===item.id&&st.cardSel]} onPress={()=>setSelectedId(selectedId===item.id?null:item.id)}>
          <Text style={st.cn}>{item.code} {item.symbol}</Text><Text style={st.cd}>{item.name}</Text><Text style={st.cr}>سعر: {item.rate}</Text>
        </TouchableOpacity>
      )} ListEmptyComponent={<Text style={st.et}>لا توجد عملات</Text>} contentContainerStyle={{padding:12}} />
    </View>
  );
}
const st = StyleSheet.create({
  c:{flex:1,backgroundColor:'#0A1128'},si:{marginHorizontal:12,marginBottom:8,padding:10,backgroundColor:'#16213E',borderRadius:10,color:'#FFF',borderWidth:1,borderColor:'#2a3550',textAlign:'right'},
  rateBtn:{marginHorizontal:12,marginBottom:8,padding:10,backgroundColor:'#D4AF3720',borderRadius:10,alignItems:'center',borderWidth:1,borderColor:'#D4AF37'},rateText:{color:'#D4AF37',fontSize:13,fontWeight:'bold'},
  mo:{flex:1,backgroundColor:'rgba(0,0,0,0.7)',justifyContent:'flex-end'},mc:{backgroundColor:'#16213E',borderTopLeftRadius:20,borderTopRightRadius:20,maxHeight:'80%'},
  mh:{flexDirection:'row',justifyContent:'space-between',padding:16},mt:{color:'#D4AF37',fontSize:16,fontWeight:'bold'},mx:{color:'#EF4444',fontSize:22},
  fi:{backgroundColor:'#0A1128',color:'#FFF',padding:10,borderRadius:8,marginBottom:8,textAlign:'right'},sb:{backgroundColor:'#D4AF37',padding:12,borderRadius:8,alignItems:'center',marginTop:12},sbt:{color:'#000',fontWeight:'bold'},
  card:{backgroundColor:'#16213E',padding:14,marginHorizontal:12,marginVertical:4,borderRadius:12},cardSel:{borderColor:'#D4AF37',borderWidth:1},cn:{color:'#FFF',fontSize:14,fontWeight:'bold'},cd:{color:'#94a3b8',fontSize:11},cr:{color:'#10B981',fontSize:12},et:{color:'#666',textAlign:'center',marginTop:40},
});
