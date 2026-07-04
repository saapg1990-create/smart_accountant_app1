import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Modal, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DataService } from '../../src/services/dataService';
import { PickerModal } from '../../src/components/ui/PickerModal';
import { ControlButtons, ControlHeader } from '../../src/components/ui/ControlButtons';

export default function SuppliersScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const [data, setData] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address: '', currency: 'YER', balance: '' });
  const [showCur, setShowCur] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(useCallback(() => { loadAll(); }, []));
  const loadAll = async () => { setData(await DataService.getSuppliers() || []); setCurrencies(await DataService.getCurrencies() || []); };
  const openAdd = () => { setForm({ name: '', phone: '', address: '', currency: 'YER', balance: '' }); setShowForm(true); };
  const handleSave = async () => {
    if (!form.name.trim()) return Alert.alert('خطأ', 'أدخل اسم المورد');
    await DataService.addSupplier({ id: 'sup-' + Date.now(), code: 'SUP-' + Date.now().toString().slice(-4), ...form, balance: parseFloat(form.balance)||0 });
    setShowForm(false); loadAll();
  };

  return (
    <View style={[st.c, { paddingTop: insets.top }]}>
      <ControlHeader title="الموردين" count={data.length} onBack={() => router.back()} onAdd={openAdd} />
      <ControlButtons showAdd showSearch showRefresh onAdd={openAdd} onRefresh={loadAll} />
      <TextInput style={st.si} placeholder="🔍 بحث..." placeholderTextColor="#666" value={searchQuery} onChangeText={setSearchQuery} />
      {showForm && (
        <Modal visible={showForm} animationType="slide" transparent>
          <View style={st.mo}><View style={st.mc}><View style={st.mh}><Text style={st.mt}>مورد جديد</Text><TouchableOpacity onPress={()=>setShowForm(false)}><Text style={st.mx}>✕</Text></TouchableOpacity></View>
          <ScrollView style={{padding:16}}>
            <TextInput style={st.fi} value={form.name} onChangeText={v=>setForm({...form,name:v})} placeholder="الاسم *" placeholderTextColor="#666" />
            <TextInput style={st.fi} value={form.phone} onChangeText={v=>setForm({...form,phone:v})} placeholder="الهاتف" placeholderTextColor="#666" />
            <TextInput style={st.fi} value={form.address} onChangeText={v=>setForm({...form,address:v})} placeholder="العنوان" placeholderTextColor="#666" />
            <TouchableOpacity style={st.pk} onPress={()=>setShowCur(true)}><Text style={st.pkt}>{form.currency}</Text><Text style={st.pka}>▼</Text></TouchableOpacity>
            <TextInput style={st.fi} value={form.balance} onChangeText={v=>setForm({...form,balance:v})} placeholder="الرصيد" placeholderTextColor="#666" keyboardType="numeric" />
            <TouchableOpacity style={st.sb} onPress={handleSave}><Text style={st.sbt}>💾 حفظ</Text></TouchableOpacity>
          </ScrollView></View></View>
        </Modal>
      )}
      <FlatList data={data.filter((d:any) => d.name?.includes(searchQuery))} keyExtractor={i => i.id} renderItem={({item}) => (
        <View style={st.card}><Text style={st.cn}>{item.name}</Text><Text style={st.cd}>📞 {item.phone} | 💱 {item.currency} | 💰 {item.balance}</Text></View>
      )} ListEmptyComponent={<Text style={st.et}>لا يوجد موردين</Text>} contentContainerStyle={{padding:12}} />
      <PickerModal visible={showCur} title="اختيار العملة" data={currencies} displayField="code" onSelect={(i:any)=>setForm({...form,currency:i.code})} onClose={()=>setShowCur(false)} />
    </View>
  );
}
const st = StyleSheet.create({
  c:{flex:1,backgroundColor:'#0A1128'},si:{marginHorizontal:12,marginBottom:8,padding:10,backgroundColor:'#16213E',borderRadius:10,color:'#FFF',borderWidth:1,borderColor:'#2a3550',textAlign:'right'},
  mo:{flex:1,backgroundColor:'rgba(0,0,0,0.7)',justifyContent:'flex-end'},mc:{backgroundColor:'#16213E',borderTopLeftRadius:20,borderTopRightRadius:20,maxHeight:'80%'},
  mh:{flexDirection:'row',justifyContent:'space-between',padding:16},mt:{color:'#D4AF37',fontSize:16,fontWeight:'bold'},mx:{color:'#EF4444',fontSize:22},
  fi:{backgroundColor:'#0A1128',color:'#FFF',padding:10,borderRadius:8,marginBottom:8,textAlign:'right'},
  pk:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',backgroundColor:'#0A1128',padding:12,borderRadius:8,borderWidth:1,borderColor:'#2a3550'},pkt:{color:'#FFF',fontSize:13},pka:{color:'#D4AF37',fontSize:11},
  sb:{backgroundColor:'#D4AF37',padding:12,borderRadius:8,alignItems:'center',marginTop:16},sbt:{color:'#000',fontWeight:'bold'},
  card:{backgroundColor:'#16213E',padding:14,marginHorizontal:12,marginVertical:4,borderRadius:12},cn:{color:'#FFF',fontSize:14,fontWeight:'bold'},cd:{color:'#94a3b8',fontSize:11,marginTop:4},et:{color:'#666',textAlign:'center',marginTop:40},
});
