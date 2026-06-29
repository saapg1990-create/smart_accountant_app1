import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalTable } from '../../hooks/useLocalStore';

export default function SalesSummaryScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const { data: invoices } = useLocalTable('salesInvoices');
  const totalSales = (invoices||[]).reduce((s:number,i:any)=>s+(i.total||0),0);
  const totalCash = (invoices||[]).filter((i:any)=>i.type==='cash').reduce((s:number,i:any)=>s+(i.total||0),0);
  const totalCredit = (invoices||[]).filter((i:any)=>i.type==='credit').reduce((s:number,i:any)=>s+(i.total||0),0);

  return (
    <View style={[st.c,{paddingTop:insets.top}]}><StatusBar barStyle="light-content"/>
      <View style={st.h}><TouchableOpacity onPress={()=>router.back()}><Text style={st.bt}>←</Text></TouchableOpacity><Text style={st.t}>ملخص المبيعات</Text><TouchableOpacity onPress={()=>Alert.alert('🖨️','جاري الطباعة')}><Text>🖨️</Text></TouchableOpacity></View>
      <View style={st.ct}>
        <View style={st.card}><Text style={st.lbl}>إجمالي المبيعات</Text><Text style={[st.val,{color:'#D4AF37'}]}>{totalSales.toLocaleString()} ﷼</Text></View>
        <View style={st.card}><Text style={st.lbl}>مبيعات نقدي</Text><Text style={[st.val,{color:'#10B981'}]}>{totalCash.toLocaleString()} ﷼</Text></View>
        <View style={st.card}><Text style={st.lbl}>مبيعات آجل</Text><Text style={[st.val,{color:'#F59E0B'}]}>{totalCredit.toLocaleString()} ﷼</Text></View>
        <View style={st.card}><Text style={st.lbl}>عدد الفواتير</Text><Text style={[st.val,{color:'#3B82F6'}]}>{invoices.length}</Text></View>
      </View>
    </View>
  );
}
const st=StyleSheet.create({c:{flex:1,backgroundColor:'#0A1128'},h:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingHorizontal:16,paddingVertical:12},bt:{fontSize:24,color:'#D4AF37',fontWeight:'bold'},t:{fontSize:18,fontWeight:'bold',color:'#FFF'},ct:{padding:16,gap:10},card:{backgroundColor:'#16213E',borderRadius:14,padding:20,alignItems:'center',borderWidth:1,borderColor:'#2a3550'},lbl:{color:'#94a3b8',fontSize:14,marginBottom:8},val:{fontSize:24,fontWeight:'bold'}});
