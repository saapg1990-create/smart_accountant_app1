import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DataService } from '../../src/services/dataService';
import { ControlButtons, ControlHeader } from '../../src/components/ui/ControlButtons';

export default function CashBoxesScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const [data, setData] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState(''); const [bal, setBal] = useState('');

  useFocusEffect(useCallback(() => { loadAll(); }, []));
  const loadAll = async () => { setData(await DataService.getCashBoxes() || []); };
  const openAdd = () => { setName(''); setBal(''); setShowForm(true); };
  const handleSave = async () => {
    if (!name.trim()) return Alert.alert('خطأ', 'أدخل اسم الصندوق');
    await DataService.addCashBox({ id: 'cb-' + Date.now(), name, balance: parseFloat(bal) || 0 });
    setName(''); setBal(''); setShowForm(false); loadAll();
  };

  const total = data.reduce((s: number, b: any) => s + (b.balance || 0), 0);

  return (
    <View style={[st.c, { paddingTop: insets.top }]}>
      <ControlHeader title="الصناديق" count={data.length} onBack={() => router.back()} onAdd={openAdd} />
      <ControlButtons showAdd showSearch showRefresh onAdd={openAdd} onRefresh={loadAll} />
      <View style={st.total}><Text style={st.tl}>إجمالي النقدية</Text><Text style={st.tv}>{total.toLocaleString()} ﷼</Text></View>
      {showForm && (
        <Modal visible={showForm} animationType="slide" transparent>
          <View style={st.mo}><View style={st.mc}><View style={st.mh}><Text style={st.mt}>صندوق جديد</Text><TouchableOpacity onPress={()=>setShowForm(false)}><Text style={st.mx}>✕</Text></TouchableOpacity></View>
          <View style={{padding:16}}>
            <TextInput style={st.fi} value={name} onChangeText={setName} placeholder="اسم الصندوق" placeholderTextColor="#666" />
            <TextInput style={st.fi} value={bal} onChangeText={setBal} placeholder="الرصيد الافتتاحي" placeholderTextColor="#666" keyboardType="numeric" />
            <TouchableOpacity style={st.sb} onPress={handleSave}><Text style={st.sbt}>💾 حفظ</Text></TouchableOpacity>
          </View></View></View>
        </Modal>
      )}
      <FlatList data={data} keyExtractor={i => i.id} renderItem={({item}) => (
        <View style={st.card}><Text style={st.cn}>💰 {item.name}</Text><Text style={st.cb}>{item.balance?.toLocaleString()} ﷼</Text></View>
      )} ListEmptyComponent={<Text style={st.et}>لا توجد صناديق</Text>} contentContainerStyle={{padding:12}} />
    </View>
  );
}
const st = StyleSheet.create({
  c:{flex:1,backgroundColor:'#0A1128'},total:{marginHorizontal:12,marginBottom:8,padding:14,backgroundColor:'#16213E',borderRadius:12,alignItems:'center',borderWidth:1,borderColor:'#2a3550'},tl:{color:'#94a3b8',fontSize:12},tv:{color:'#D4AF37',fontSize:22,fontWeight:'bold',marginTop:4},
  mo:{flex:1,backgroundColor:'rgba(0,0,0,0.7)',justifyContent:'flex-end'},mc:{backgroundColor:'#16213E',borderTopLeftRadius:20,borderTopRightRadius:20,maxHeight:'70%'},
  mh:{flexDirection:'row',justifyContent:'space-between',padding:16},mt:{color:'#D4AF37',fontSize:16,fontWeight:'bold'},mx:{color:'#EF4444',fontSize:22},
  fi:{backgroundColor:'#0A1128',color:'#FFF',padding:10,borderRadius:8,marginBottom:8,textAlign:'right'},sb:{backgroundColor:'#D4AF37',padding:12,borderRadius:8,alignItems:'center',marginTop:12},sbt:{color:'#000',fontWeight:'bold'},
  card:{backgroundColor:'#16213E',flexDirection:'row',justifyContent:'space-between',padding:14,marginHorizontal:12,marginVertical:4,borderRadius:12},cn:{color:'#FFF',fontSize:14,fontWeight:'bold'},cb:{color:'#10B981',fontSize:14,fontWeight:'bold'},et:{color:'#666',textAlign:'center',marginTop:40},
});
