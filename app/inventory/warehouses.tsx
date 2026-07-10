import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDatabase } from '../../src/context/DatabaseContext';
import { ControlButtons, ControlHeader } from '../../src/components/ui/ControlButtons';
export default function WarehousesScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const { db } = useDatabase();
  const [data, setData] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  useFocusEffect(useCallback(() => { if(db) db.getAllAsync('SELECT * FROM warehouses ORDER BY name').then(setData); }, [db]));
  const handleSave = async () => { if(!name.trim()){Alert.alert('خطأ','أدخل اسم المخزن');return;} await db.runAsync('INSERT INTO warehouses (id,name,location) VALUES (?,?,?)',['wh-'+Date.now(),name,location]); db.getAllAsync('SELECT * FROM warehouses ORDER BY name').then(setData); setName('');setLocation('');setShowModal(false); };
  return (<View style={[st.c,{paddingTop:insets.top}]}><ControlHeader title="المخازن" count={data.length} onBack={()=>router.back()} onAdd={()=>setShowModal(true)} /><FlatList data={data} keyExtractor={i=>i.id} renderItem={({item})=>(<View style={st.rc}><Text style={st.rn}>🏭 {item.name}</Text><Text style={st.rd}>{item.location||'بدون موقع'}</Text></View>)} ListEmptyComponent={<Text style={st.et}>لا توجد مخازن</Text>} contentContainerStyle={{padding:16}} />
  <Modal visible={showModal} animationType="slide" transparent><View style={st.mo}><View style={st.mc}><View style={st.mh}><Text style={st.mt}>إضافة مخزن</Text><TouchableOpacity onPress={()=>setShowModal(false)}><Text style={st.mx}>✕</Text></TouchableOpacity></View>
  <View style={st.mb}><Text style={st.fl}>اسم المخزن *</Text><TextInput style={st.fi} value={name} onChangeText={setName} /><Text style={st.fl}>الموقع</Text><TextInput style={st.fi} value={location} onChangeText={setLocation} /><TouchableOpacity style={st.sb} onPress={handleSave}><Text style={st.sbt}>💾 حفظ</Text></TouchableOpacity></View></View></View></Modal></View>);
}
const st=StyleSheet.create({c:{flex:1,backgroundColor:'#0A1128'},et:{color:'#FFF',textAlign:'center',marginTop:40},rc:{backgroundColor:'#16213E',borderRadius:14,padding:14,marginBottom:8,marginHorizontal:16},rn:{color:'#FFF',fontSize:16,fontWeight:'bold'},rd:{color:'#10B981',fontSize:13},mo:{flex:1,backgroundColor:'rgba(0,0,0,0.7)',justifyContent:'flex-end'},mc:{backgroundColor:'#16213E',borderTopLeftRadius:20,borderTopRightRadius:20,maxHeight:'60%'},mh:{flexDirection:'row',justifyContent:'space-between',padding:16},mt:{color:'#D4AF37',fontSize:18,fontWeight:'bold'},mx:{color:'#EF4444',fontSize:22},mb:{padding:16},fl:{color:'#94a3b8',fontSize:13,marginBottom:6,marginTop:12},fi:{backgroundColor:'#0A1128',borderRadius:10,padding:12,color:'#FFF',fontSize:14},sb:{backgroundColor:'#D4AF37',borderRadius:12,padding:14,alignItems:'center',marginTop:20},sbt:{color:'#0A1128',fontSize:16,fontWeight:'bold'}});
