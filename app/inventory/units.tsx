import { ControlButtons, ControlHeader } from '../../src/components/ui/ControlButtons';
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, StatusBar, Alert, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalTable } from '../../hooks/useLocalStore';

export default function UnitsScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const { data: units, add, remove } = useLocalTable('units');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const filtered = (units||[]).filter((u:any) => (u.name||'').includes(searchQuery));

  const handleAdd = async () => {
    if (!newName.trim()) { Alert.alert('خطأ', 'أدخل اسم الوحدة'); return; }
    await add({ name: newName }); setNewName(''); setShowModal(false);
  };

  return (
    <View style={[st.c,{paddingTop:insets.top}]}><StatusBar barStyle="light-content"/>
      <View style={st.h}><TouchableOpacity onPress={()=>router.back()} style={st.b}><Text style={st.bt}>←</Text></TouchableOpacity><Text style={st.t}>📐 وحدات القياس ({units.length})</Text><TouchableOpacity style={st.ab} onPress={()=>setShowModal(true)}><Text style={st.at}>+</Text></TouchableOpacity></View>
      <TextInput style={st.si} placeholder="🔍 بحث..." placeholderTextColor="#94a3b8" value={searchQuery} onChangeText={setSearchQuery}/>
      {filtered.length===0?<View style={st.e}><Text style={st.ei}>📐</Text><Text style={st.et}>لا توجد وحدات</Text></View>:
        <FlatList data={filtered} keyExtractor={(i:any)=>i.id} renderItem={({item}:any)=>(
          <TouchableOpacity style={st.rc} onLongPress={()=>Alert.alert('حذف',`حذف "${item.name}"؟`,[{text:'حذف',style:'destructive',onPress:()=>remove(item.id)},{text:'إلغاء'}])}>
            <Text style={st.rn}>📐 {item.name}</Text>
          </TouchableOpacity>
        )} contentContainerStyle={{padding:16}}/>
      }
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={st.mo}><View style={st.mc}><View style={st.mh}><Text style={st.mt}>إضافة وحدة</Text><TouchableOpacity onPress={()=>setShowModal(false)}><Text style={st.mx}>✕</Text></TouchableOpacity></View>
          <View style={st.mb}><Text style={st.fl}>اسم الوحدة</Text><TextInput style={st.fi} value={newName} onChangeText={setNewName} placeholder="قطعة، كيلو..." placeholderTextColor="#666"/><TouchableOpacity style={st.sb} onPress={handleAdd}><Text style={st.sbt}>💾 حفظ</Text></TouchableOpacity></View>
        </View></View>
      </Modal>
    </View>
  );
}
const st=StyleSheet.create({c:{flex:1,backgroundColor:'#0A1128'},h:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingHorizontal:16,paddingVertical:12},b:{width:36,height:36,borderRadius:18,backgroundColor:'#16213E',justifyContent:'center',alignItems:'center',borderWidth:1,borderColor:'#2a3550'},bt:{fontSize:20,color:'#D4AF37'},t:{fontSize:18,fontWeight:'bold',color:'#FFF'},ab:{width:36,height:36,borderRadius:18,backgroundColor:'#D4AF37'+'20',justifyContent:'center',alignItems:'center',borderWidth:1,borderColor:'#D4AF37'},at:{fontSize:20,color:'#D4AF37',fontWeight:'bold'},si:{marginHorizontal:16,marginBottom:12,padding:12,backgroundColor:'#16213E',borderRadius:10,color:'#FFF',borderWidth:1,borderColor:'#2a3550',textAlign:'right',fontSize:14},e:{flex:1,justifyContent:'center',alignItems:'center'},ei:{fontSize:48,marginBottom:12},et:{color:'#FFF',fontSize:16},rc:{backgroundColor:'#16213E',borderRadius:12,padding:14,marginBottom:8,marginHorizontal:16,borderWidth:1,borderColor:'#2a3550'},rn:{color:'#FFF',fontSize:14,fontWeight:'bold'},mo:{flex:1,backgroundColor:'rgba(0,0,0,0.7)',justifyContent:'flex-end'},mc:{backgroundColor:'#16213E',borderTopLeftRadius:20,borderTopRightRadius:20},mh:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:16,borderBottomWidth:1,borderBottomColor:'#2a3550'},mt:{color:'#D4AF37',fontSize:18,fontWeight:'bold'},mx:{color:'#EF4444',fontSize:22,fontWeight:'bold'},mb:{padding:16},fl:{color:'#94a3b8',fontSize:13,marginBottom:6,marginTop:12},fi:{backgroundColor:'#0A1128',borderRadius:10,padding:12,color:'#FFF',borderWidth:1,borderColor:'#2a3550',fontSize:14},sb:{backgroundColor:'#D4AF37',borderRadius:12,padding:14,alignItems:'center',marginTop:20},sbt:{color:'#0A1128',fontSize:16,fontWeight:'bold'}});
