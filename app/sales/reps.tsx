import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, StatusBar, Alert, Modal, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ControlButtons, ControlHeader } from '../../src/components/ui/ControlButtons';
import { useDatabase } from '../../context/DatabaseContext';

export default function RepsScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const { db } = useDatabase();
  const [salesReps, setReps] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '' });

  useFocusEffect(useCallback(() => { if(db) db.getAllAsync('SELECT * FROM salesReps ORDER BY name').then(setReps); }, [db]));

  const count = salesReps.length + 1;
  const whNumber = `REP-${count.toString().padStart(4, '0')}`;

  const handleSave = async () => {
    if (!formData.name.trim()) { Alert.alert('خطأ', 'أدخل اسم المندوب'); return; }
    await db.runAsync('INSERT INTO salesReps (id, name, phone) VALUES (?,?,?)', ['wh-' + Date.now(), formData.name, formData.phone]);
    db.getAllAsync('SELECT * FROM salesReps ORDER BY name').then(setReps);
    setShowModal(false);
    setFormData({ name: '', phone: '' });
    Alert.alert('✅', `تم إضافة ${formData.name}`);
  };

  return (
    <View style={[st.c, { paddingTop: insets.top }]}><StatusBar barStyle="light-content" />
      <ControlHeader title="المندوبين" count={salesReps.length} onBack={() => router.back()} onAdd={() => { setFormData({ name: '', phone: '' }); setShowModal(true); }} />
      <ControlButtons showSearch showPrint showRefresh showExport onRefresh={() => db.getAllAsync('SELECT * FROM salesReps ORDER BY name').then(setReps)} />
      <TextInput style={st.si} placeholder="🔍 بحث..." placeholderTextColor="#94a3b8" value={searchQuery} onChangeText={setSearchQuery} />
      {salesReps.length === 0 ? <Text style={st.et}>لا توجد مخازن</Text> :
        <FlatList data={salesReps.filter((w: any) => w.name?.includes(searchQuery))} keyExtractor={(i: any) => i.id} renderItem={({ item }: any) => (
          <View style={st.rc}><Text style={st.rn}>👷 {item.name}</Text><Text style={st.rd}>📍 {item.phone || 'بدون موقع'}</Text></View>
        )} contentContainerStyle={{ padding: 16 }} />}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={st.mo}><View style={st.mc}><View style={st.mh}><Text style={st.mt}>إضافة مندوب</Text><TouchableOpacity onPress={() => setShowModal(false)}><Text style={st.mx}>✕</Text></TouchableOpacity></View>
        <ScrollView style={st.mb}>
          <Text style={st.fl}>الرقم</Text><TextInput style={[st.fi,{color:'#D4AF37'}]} value={whNumber} editable={false} />
          <Text style={st.fl}>اسم المندوب *</Text><TextInput style={st.fi} value={formData.name} onChangeText={v=>setFormData({...formData,name:v})} />
          <Text style={st.fl}>الهاتف</Text><TextInput style={st.fi} value={formData.phone} onChangeText={v=>setFormData({...formData,phone:v})} />
          <TouchableOpacity style={st.sb} onPress={handleSave}><Text style={st.sbt}>💾 حفظ</Text></TouchableOpacity>
        </ScrollView></View></View>
      </Modal>
    </View>
  );
}
const st = StyleSheet.create({
  c:{flex:1,backgroundColor:'#0A1128'},si:{marginHorizontal:16,marginBottom:8,padding:12,backgroundColor:'#16213E',borderRadius:10,color:'#FFF',borderWidth:1,borderColor:'#2a3550',textAlign:'right'},et:{color:'#FFF',fontSize:16,textAlign:'center',marginTop:40},
  rc:{backgroundColor:'#16213E',borderRadius:14,padding:14,marginBottom:8,marginHorizontal:16,borderWidth:1,borderColor:'#2a3550'},rn:{color:'#FFF',fontSize:16,fontWeight:'bold'},rd:{color:'#10B981',fontSize:13},
  mo:{flex:1,backgroundColor:'rgba(0,0,0,0.7)',justifyContent:'flex-end'},mc:{backgroundColor:'#16213E',borderTopLeftRadius:20,borderTopRightRadius:20,maxHeight:'60%'},mh:{flexDirection:'row',justifyContent:'space-between',padding:16},mt:{color:'#D4AF37',fontSize:18,fontWeight:'bold'},mx:{color:'#EF4444',fontSize:22},mb:{padding:16},
  fl:{color:'#94a3b8',fontSize:13,marginBottom:6,marginTop:12},fi:{backgroundColor:'#0A1128',borderRadius:10,padding:12,color:'#FFF',borderWidth:1,borderColor:'#2a3550',fontSize:14,textAlign:'right'},
  sb:{backgroundColor:'#D4AF37',borderRadius:12,padding:14,alignItems:'center',marginTop:20,marginBottom:20},sbt:{color:'#0A1128',fontSize:16,fontWeight:'bold'},
});
