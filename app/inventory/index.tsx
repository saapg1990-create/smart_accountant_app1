import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function InventoryIndex() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const items = [
    ["🏪","الموردين","/inventory/suppliers"],["🏭","المستودعات","/inventory/warehouses"],
    ["📦","الأصناف","/inventory/items"],["📋","فاتورة مشتريات","/inventory/purchase-invoice"],
    ["🔄","مردود مشتريات","/inventory/purchase-return"],["📤","صرف مخزون","/inventory/inventory-issue"],
    ["📥","توريد مخزون","/inventory/inventory-receipt"],["🔄","تحويل مخزني","/inventory/warehouse-transfer"],
    ["📐","وحدات القياس","/inventory/units"],["🏷️","الفئات","/inventory/categories"],
    ["⭐","الماركات","/inventory/brands"],["📊","حركة الأصناف","/inventory/item-movement"]
  ];
  return (
    <View style={st.c}><StatusBar barStyle="light-content"/><View style={[st.ct,{paddingTop:insets.top}]}>
      <View style={st.h}><TouchableOpacity onPress={()=>router.back()} style={st.b}><Text style={st.bt}>←</Text></TouchableOpacity><Text style={st.t}>📦 المخزون والمشتريات</Text><View style={{width:40}}/></View>
      <ScrollView contentContainerStyle={st.g}>{items.map((item,i)=><TouchableOpacity key={i} style={st.card} onPress={()=>router.push(item[2])}><Text style={st.ci}>{item[0]}</Text><Text style={st.cl}>{item[1]}</Text></TouchableOpacity>)}</ScrollView>
    </View></View>
  );
}
const st=StyleSheet.create({c:{flex:1,backgroundColor:'#0A1128'},ct:{flex:1},h:{flexDirection:'row',alignItems:'center',paddingHorizontal:16,paddingVertical:14},b:{width:40,height:40,borderRadius:20,backgroundColor:'#16213E',justifyContent:'center',alignItems:'center',borderWidth:1,borderColor:'#2a3550'},bt:{fontSize:20,color:'#D4AF37'},t:{flex:1,fontSize:18,fontWeight:'bold',color:'#FFF',textAlign:'center'},g:{flexDirection:'row',flexWrap:'wrap',padding:12,gap:10},card:{width:'30%',backgroundColor:'#16213E',borderRadius:16,padding:20,alignItems:'center',borderWidth:1,borderColor:'#2a3550'},ci:{fontSize:36,marginBottom:10},cl:{color:'#FFF',fontSize:10,fontWeight:'600',textAlign:'center'}});
