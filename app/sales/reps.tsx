import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDatabase } from '../../src/context/DatabaseContext';
import { ControlHeader } from '../../src/components/ui/ControlButtons';
export default function RepsScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const { db } = useDatabase();
  const [data, setData] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name:'', phone:'', target:'0' });
  useFocusEffect(useCallback(() => { if(db) db.getAllAsync('SELECT * FROM salesReps ORDER BY name').then(setData); }, [db]));
  const handleSave = async () => { if(!form.name.trim()){Alert.alert('خطأ','أدخل الاسم');return;} await db.runAsync('INSERT INTO salesReps (id,name,phone,monthlyTarget) VALUES (?,?,?,?)',['rep-'+Date.now(),form.name,form.phone,parseFloat(form.target)||0]); db.getAllAsync('SELECT * FROM salesReps ORDER BY name').then(setData); setShowModal(false); };
  return (<View style={[st.c,{paddingTop:insets.top}]}><ControlHeader title="المندوبين" count={data.length} onBack={()=>router.back()} onAdd={()=>{setForm({name:'',phone:'',target:'0'});setShowModal(true);}} /><FlatList data={data} keyExtractor={i=>i.id} renderItem={({item})=>(<View style={st.rc}><Text style={st.rn}>👷 {item.name}</Text><Text style={st.rd}>📞 {item.phone} | الهدف: {item.monthlyTarget}</Text></View>)} ListEmptyComponent={<Text style={st.et}>لا يوجد مندوبين</Text>} contentContainerStyle={{padding:16}} />
  <Modal visible={showModal} animationType="slide" transparent><View style={st.mo}><View style={st.mc}><View style={st.mh}><Text style={st.mt}>إضافة مندوب</Text><TouchableOpacity onPress={()=>setShowModal(false)}><Text style={st.mx}>✕</Text></TouchableOpacity></View>
  <View style={st.mb}><Text style={st.fl}>الاسم *</Text><TextInput style={st.fi} value={form.name} onChangeText={v=>setForm({...form,name:v})} /><Text style={st.fl}>الهاتف</Text><TextInput style={st.fi} value={form.phone} onChangeText={v=>setForm({...form,phone:v})} keyboardType="phone-pad" /><Text style={st.fl}>الهدف الشهري</Text><TextInput style={st.fi} value={form.target} onChangeText={v=>setForm({...form,target:v})} keyboardType="numeric" /><TouchableOpacity style={st.sb} onPress={handleSave}><Text style={st.sbt}>💾 حفظ</Text></TouchableOpacity></View></View></View></Modal></View>);
}
const st=StyleSheet.create({c:{flex:1,backgroundColor:'#0A1128'},et:{color:'#FFF',textAlign:'center',marginTop:40},rc:{backgroundColor:'#16213E',borderRadius:14,padding:14,marginBottom:8,marginHorizontal:16},rn:{color:'#FFF',fontSize:16,fontWeight:'bold'},rd:{color:'#10B981',fontSize:13},mo:{flex:1,backgroundColor:'rgba(0,0,0,0.7)',justifyContent:'flex-end'},mc:{backgroundColor:'#16213E',borderTopLeftRadius:20,borderTopRightRadius:20,maxHeight:'60%'},mh:{flexDirection:'row',justifyContent:'space-between',padding:16},mt:{color:'#D4AF37',fontSize:18,fontWeight:'bold'},mx:{color:'#EF4444',fontSize:22},mb:{padding:16},fl:{color:'#94a3b8',fontSize:13,marginTop:12},fi:{backgroundColor:'#0A1128',borderRadius:10,padding:12,color:'#FFF',fontSize:14},sb:{backgroundColor:'#D4AF37',borderRadius:12,padding:14,alignItems:'center',marginTop:20},sbt:{color:'#0A1128',fontSize:16,fontWeight:'bold'}});
