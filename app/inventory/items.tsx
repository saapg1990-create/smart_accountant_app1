import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Modal, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDatabase } from '../../src/context/DatabaseContext';
import { Selector } from '../../src/components/common/Selector';
import { ControlHeader } from '../../src/components/ui/ControlButtons';
export default function ItemsScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const { db } = useDatabase();
  const [items, setItems] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name:'', code:'', unit:'حبة', cost:'0', price:'0', qty:'0', minQty:'0', catId:'', catName:'', brandId:'', brandName:'' });
  useFocusEffect(useCallback(() => { if(db) db.getAllAsync('SELECT * FROM items ORDER BY name').then(setItems); }, [db]));
  const handleSave = async () => { if(!form.name.trim()){Alert.alert('خطأ','أدخل اسم الصنف');return;} await db.runAsync('INSERT INTO items (id,name,code,unit,cost,price,quantity,minQuantity,categoryId,brandId) VALUES (?,?,?,?,?,?,?,?,?,?)',['itm-'+Date.now(),form.name,form.code,form.unit,parseFloat(form.cost)||0,parseFloat(form.price)||0,parseFloat(form.qty)||0,parseFloat(form.minQty)||0,form.catId,form.brandId]); db.getAllAsync('SELECT * FROM items ORDER BY name').then(setItems); setShowModal(false); };
  return (<View style={[st.c,{paddingTop:insets.top}]}><ControlHeader title="الأصناف" count={items.length} onBack={()=>router.back()} onAdd={()=>{setForm({name:'',code:'',unit:'حبة',cost:'0',price:'0',qty:'0',minQty:'0',catId:'',catName:'',brandId:'',brandName:''});setShowModal(true);}} /><FlatList data={items} keyExtractor={i=>i.id} renderItem={({item})=>(<View style={st.rc}><Text style={st.rn}>📦 {item.name}</Text><Text style={st.rd}>التكلفة: {item.cost} | البيع: {item.price} | الكمية: {item.quantity}</Text></View>)} ListEmptyComponent={<Text style={st.et}>لا توجد أصناف</Text>} contentContainerStyle={{padding:16}} />
  <Modal visible={showModal} animationType="slide" transparent><View style={st.mo}><View style={st.mc}><View style={st.mh}><Text style={st.mt}>إضافة صنف</Text><TouchableOpacity onPress={()=>setShowModal(false)}><Text style={st.mx}>✕</Text></TouchableOpacity></View>
  <ScrollView style={st.mb}>
    <Text style={st.fl}>اسم الصنف *</Text><TextInput style={st.fi} value={form.name} onChangeText={v=>setForm({...form,name:v})} />
    <Text style={st.fl}>الكود</Text><TextInput style={st.fi} value={form.code} onChangeText={v=>setForm({...form,code:v})} />
    <Selector label="الفئة" tableName="categories" displayField="name" selectedId={form.catId} selectedName={form.catName} onSelect={(i:any)=>setForm({...form,catId:i.id,catName:i.name})} />
    <Selector label="العلامة" tableName="brands" displayField="name" selectedId={form.brandId} selectedName={form.brandName} onSelect={(i:any)=>setForm({...form,brandId:i.id,brandName:i.name})} />
    <Text style={st.fl}>الوحدة</Text><TextInput style={st.fi} value={form.unit} onChangeText={v=>setForm({...form,unit:v})} />
    <Text style={st.fl}>سعر التكلفة</Text><TextInput style={st.fi} value={form.cost} onChangeText={v=>setForm({...form,cost:v})} keyboardType="numeric" />
    <Text style={st.fl}>سعر البيع</Text><TextInput style={st.fi} value={form.price} onChangeText={v=>setForm({...form,price:v})} keyboardType="numeric" />
    <Text style={st.fl}>الكمية</Text><TextInput style={st.fi} value={form.qty} onChangeText={v=>setForm({...form,qty:v})} keyboardType="numeric" />
    <TouchableOpacity style={st.sb} onPress={handleSave}><Text style={st.sbt}>💾 حفظ</Text></TouchableOpacity>
  </ScrollView></View></View></Modal></View>);
}
const st=StyleSheet.create({c:{flex:1,backgroundColor:'#0A1128'},et:{color:'#FFF',textAlign:'center',marginTop:40},rc:{backgroundColor:'#16213E',borderRadius:14,padding:14,marginBottom:8,marginHorizontal:16},rn:{color:'#FFF',fontSize:16,fontWeight:'bold'},rd:{color:'#10B981',fontSize:13},mo:{flex:1,backgroundColor:'rgba(0,0,0,0.7)',justifyContent:'flex-end'},mc:{backgroundColor:'#16213E',borderTopLeftRadius:20,borderTopRightRadius:20,maxHeight:'90%'},mh:{flexDirection:'row',justifyContent:'space-between',padding:16},mt:{color:'#D4AF37',fontSize:18,fontWeight:'bold'},mx:{color:'#EF4444',fontSize:22},mb:{padding:16},fl:{color:'#94a3b8',fontSize:13,marginBottom:6,marginTop:12},fi:{backgroundColor:'#0A1128',borderRadius:10,padding:12,color:'#FFF',fontSize:14,textAlign:'right'},sb:{backgroundColor:'#D4AF37',borderRadius:12,padding:14,alignItems:'center',marginTop:20},sbt:{color:'#0A1128',fontSize:16,fontWeight:'bold'}});
