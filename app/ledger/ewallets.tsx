import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DataService } from '../../src/services/dataService';
import { ControlButtons, ControlHeader } from '../../src/components/ui/ControlButtons';

export default function EWalletsScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const [data, setData] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState(''); const [phone, setPhone] = useState(''); const [bal, setBal] = useState('');

  useFocusEffect(useCallback(() => { loadAll(); }, []));
  const loadAll = async () => { const res = await DataService.getEwallets(); setData(res || []); };
  const openAdd = () => { setName(''); setPhone(''); setBal(''); setShowForm(true); };
  const handleSave = async () => {
    if (!name.trim()) return Alert.alert('خطأ', 'أدخل اسم المحفظة');
    await DataService.addEwallet({ id: 'ewl-' + Date.now(), name, phone, balance: parseFloat(bal) || 0 });
    setName(''); setPhone(''); setBal(''); setShowForm(false); loadAll();
  };

  return (
    <View style={[st.c, { paddingTop: insets.top }]}>
      <ControlHeader title="المحافظ الإلكترونية" count={data.length} onBack={() => router.back()} onAdd={openAdd} />
      <ControlButtons showAdd showSearch showRefresh onAdd={openAdd} onRefresh={loadAll} />
      {showForm && (
        <Modal visible={showForm} animationType="slide" transparent>
          <View style={st.mo}><View style={st.mc}><View style={st.mh}><Text style={st.mt}>محفظة جديدة</Text><TouchableOpacity onPress={()=>setShowForm(false)}><Text style={st.mx}>✕</Text></TouchableOpacity></View>
          <View style={{padding:16}}>
            <TextInput style={st.fi} value={name} onChangeText={setName} placeholder="اسم المحفظة" placeholderTextColor="#666" />
            <TextInput style={st.fi} value={phone} onChangeText={setPhone} placeholder="رقم الهاتف" placeholderTextColor="#666" />
            <TextInput style={st.fi} value={bal} onChangeText={setBal} placeholder="الرصيد" placeholderTextColor="#666" keyboardType="numeric" />
            <TouchableOpacity style={st.sb} onPress={handleSave}><Text style={st.sbt}>💾 حفظ</Text></TouchableOpacity>
          </View></View></View>
        </Modal>
      )}
      <FlatList data={data} keyExtractor={i => i.id} renderItem={({item}) => (
        <View style={st.card}><Text style={st.cn}>📱 {item.name}</Text><Text style={st.cd}>📞 {item.phone} | 💰 {item.balance?.toLocaleString()}</Text></View>
      )} ListEmptyComponent={<Text style={st.et}>لا توجد محافظ</Text>} contentContainerStyle={{padding:12}} />
    </View>
  );
}
const st = StyleSheet.create({
  c:{flex:1,backgroundColor:'#0A1128'},mo:{flex:1,backgroundColor:'rgba(0,0,0,0.7)',justifyContent:'flex-end'},mc:{backgroundColor:'#16213E',borderTopLeftRadius:20,borderTopRightRadius:20,maxHeight:'70%'},
  mh:{flexDirection:'row',justifyContent:'space-between',padding:16},mt:{color:'#D4AF37',fontSize:16,fontWeight:'bold'},mx:{color:'#EF4444',fontSize:22},
  fi:{backgroundColor:'#0A1128',color:'#FFF',padding:10,borderRadius:8,marginBottom:8,textAlign:'right'},sb:{backgroundColor:'#D4AF37',padding:12,borderRadius:8,alignItems:'center',marginTop:12},sbt:{color:'#000',fontWeight:'bold'},
  card:{backgroundColor:'#16213E',padding:14,marginHorizontal:12,marginVertical:4,borderRadius:12},cn:{color:'#FFF',fontSize:14,fontWeight:'bold'},cd:{color:'#94a3b8',fontSize:11},et:{color:'#666',textAlign:'center',marginTop:40},
});
