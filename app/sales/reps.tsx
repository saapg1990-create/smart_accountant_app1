import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DataService } from '../../src/services/dataService';

export default function RepsScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const [data, setData] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState(''); const [phone, setPhone] = useState('');

  useFocusEffect(useCallback(() => { loadData(); }, []));
  const loadData = async () => { const res = await DataService.getReps(); setData(res); };
  const openAdd = () => { setName(''); setPhone(''); setShowForm(true); };
  const addData = async () => { if (!name.trim()) return Alert.alert('خطأ', 'أدخل الاسم'); await DataService.addRep({ id: 'rep-' + Date.now(), name, phone }); setName(''); setPhone(''); setShowForm(false); loadData(); };

  return (
    <View style={[st.c, { paddingTop: insets.top }]}>
      <View style={st.h}><TouchableOpacity onPress={() => router.back()}><Text style={st.bb}>←</Text></TouchableOpacity><Text style={st.t}>المندوبين</Text><TouchableOpacity onPress={openAdd}><Text style={st.add}>+</Text></TouchableOpacity></View>
      {showForm && (<View style={st.f}><TextInput style={st.i} value={name} onChangeText={setName} placeholder="الاسم" placeholderTextColor="#666" /><TextInput style={st.i} value={phone} onChangeText={setPhone} placeholder="الهاتف" placeholderTextColor="#666" /><TouchableOpacity style={st.sb} onPress={addData}><Text style={st.sbt}>حفظ</Text></TouchableOpacity></View>)}
      <FlatList data={data} keyExtractor={i => i.id} renderItem={({ item }) => (<View style={st.card}><Text style={st.cn}>{item.name}</Text><Text style={st.cd}>📞 {item.phone}</Text></View>)} ListEmptyComponent={<Text style={st.et}>لا يوجد مندوبين</Text>} />
    </View>
  );
}
const st = StyleSheet.create({ c:{flex:1,backgroundColor:'#0A1128'},h:{flexDirection:'row',alignItems:'center',padding:16},bb:{fontSize:24,color:'#D4AF37'},t:{color:'#D4AF37',fontSize:18,fontWeight:'bold',flex:1,textAlign:'center'},add:{fontSize:28,color:'#D4AF37'},f:{padding:16,backgroundColor:'#16213E',margin:12,borderRadius:12},i:{backgroundColor:'#0A1128',color:'#FFF',padding:10,borderRadius:8,marginBottom:6,textAlign:'right'},sb:{backgroundColor:'#D4AF37',padding:12,borderRadius:8,alignItems:'center',marginTop:8},sbt:{color:'#000',fontWeight:'bold'},card:{backgroundColor:'#16213E',padding:14,marginHorizontal:12,marginVertical:4,borderRadius:12},cn:{color:'#FFF',fontSize:14},cd:{color:'#94a3b8',fontSize:11},et:{color:'#666',textAlign:'center',marginTop:40} });
