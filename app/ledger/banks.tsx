import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DataService } from '../../src/services/dataService';
import { ControlButtons, ControlHeader } from '../../src/components/ui/ControlButtons';

export default function BanksScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const [data, setData] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState(''); const [accNum, setAccNum] = useState(''); const [bal, setBal] = useState('');

  useFocusEffect(useCallback(() => { loadAll(); }, []));
  const loadAll = async () => { const res = await DataService.getBanks(); setData(res || []); };
  const openAdd = () => { setName(''); setAccNum(''); setBal(''); setShowForm(true); };
  const handleSave = async () => {
    if (!name.trim()) return Alert.alert('خطأ', 'أدخل اسم البنك');
    await DataService.addBank({ id: 'bnk-' + Date.now(), name, accountNumber: accNum, balance: parseFloat(bal) || 0 });
    setName(''); setAccNum(''); setBal(''); setShowForm(false); loadAll();
  };

  return (
    <View style={[st.c, { paddingTop: insets.top }]}>
      <ControlHeader title="البنوك" count={data.length} onBack={() => router.back()} onAdd={openAdd} />
      <ControlButtons showAdd showSearch showRefresh onAdd={openAdd} onRefresh={loadAll} />
      {showForm && (
        <Modal visible={showForm} animationType="slide" transparent>
          <View style={st.mo}><View style={st.mc}><View style={st.mh}><Text style={st.mt}>بنك جديد</Text><TouchableOpacity onPress={()=>setShowForm(false)}><Text style={st.mx}>✕</Text></TouchableOpacity></View>
          <View style={{padding:16}}>
            <TextInput style={st.fi} value={name} onChangeText={setName} placeholder="اسم البنك" placeholderTextColor="#666" />
            <TextInput style={st.fi} value={accNum} onChangeText={setAccNum} placeholder="رقم الحساب" placeholderTextColor="#666" />
            <TextInput style={st.fi} value={bal} onChangeText={setBal} placeholder="الرصيد" placeholderTextColor="#666" keyboardType="numeric" />
            <TouchableOpacity style={st.sb} onPress={handleSave}><Text style={st.sbt}>💾 حفظ</Text></TouchableOpacity>
          </View></View></View>
        </Modal>
      )}
      <FlatList data={data} keyExtractor={i => i.id} renderItem={({item}) => (
        <View style={st.card}><Text style={st.cn}>🏦 {item.name}</Text><Text style={st.cd}>رقم: {item.accountNumber} | 💰 {item.balance?.toLocaleString()}</Text></View>
      )} ListEmptyComponent={<Text style={st.et}>لا توجد بنوك</Text>} contentContainerStyle={{padding:12}} />
    </View>
  );
}
const st = StyleSheet.create({
  c:{flex:1,backgroundColor:'#0A1128'},mo:{flex:1,backgroundColor:'rgba(0,0,0,0.7)',justifyContent:'flex-end'},mc:{backgroundColor:'#16213E',borderTopLeftRadius:20,borderTopRightRadius:20,maxHeight:'70%'},
  mh:{flexDirection:'row',justifyContent:'space-between',padding:16},mt:{color:'#D4AF37',fontSize:16,fontWeight:'bold'},mx:{color:'#EF4444',fontSize:22},
  fi:{backgroundColor:'#0A1128',color:'#FFF',padding:10,borderRadius:8,marginBottom:8,textAlign:'right'},sb:{backgroundColor:'#D4AF37',padding:12,borderRadius:8,alignItems:'center',marginTop:12},sbt:{color:'#000',fontWeight:'bold'},
  card:{backgroundColor:'#16213E',padding:14,marginHorizontal:12,marginVertical:4,borderRadius:12},cn:{color:'#FFF',fontSize:14,fontWeight:'bold'},cd:{color:'#94a3b8',fontSize:11},et:{color:'#666',textAlign:'center',marginTop:40},
});
