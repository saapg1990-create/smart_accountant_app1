import { DataService } from '../src/services/dataService';
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import { useLocalTable } from '../../hooks/useLocalStore';
import { useAccountStore } from '../../src/store/useAccountStore';

export default function DashboardScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const { data: customers } = useLocalTable('customers');
  const { data: invoices } = useLocalTable('salesInvoices');
  const { accounts } = useAccountStore();
  const totalSales = (invoices || []).reduce((s: number, i: any) => s + (i.total || 0), 0);

  return (
    <View style={[st.c, { paddingTop: insets.top }]}><StatusBar barStyle="light-content" />
      <View style={st.h}><Text style={st.w}>💎 دفتر المحاسب الذكي</Text><TouchableOpacity onPress={() => router.push('/settings')}><Text style={st.s}>⚙️</Text></TouchableOpacity></View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={st.stats}>
          <View style={st.stat}><Text style={st.sv}>💰 {totalSales.toLocaleString()}</Text><Text style={st.sl}>المبيعات</Text></View>
          <View style={st.stat}><Text style={st.sv}>📚 {accounts.length}</Text><Text style={st.sl}>حسابات</Text></View>
          <View style={st.stat}><Text style={st.sv}>👥 {customers.length}</Text><Text style={st.sl}>عملاء</Text></View>
        </View>
        <Text style={st.tt}>⚡ إجراءات سريعة</Text>
        <View style={st.qr}>
          {[{icon:'📄',label:'فاتورة مبيعات',route:'/sales/sales-invoice'},{icon:'📋',label:'فاتورة مشتريات',route:'/inventory/purchase-invoice'},{icon:'📝',label:'قيد يومية',route:'/ledger/journal-entry'},{icon:'🧾',label:'سند قبض/صرف',route:'/ledger/vouchers'}].map((q,i)=>(
            <TouchableOpacity key={i} style={st.qc} onPress={()=>router.push(q.route)}><Text style={st.qi}>{q.icon}</Text><Text style={st.ql}>{q.label}</Text></TouchableOpacity>
          ))}
        </View>
        <Text style={st.tt}>📊 الأقسام الرئيسية</Text>
        {[{icon:'📚',label:'دفتر الأستاذ العام',color:'#D4AF37',route:'/ledger/index'},{icon:'📦',label:'المخزون والمشتريات',color:'#3B82F6',route:'/inventory/index'},{icon:'💰',label:'المبيعات والعملاء',color:'#10B981',route:'/sales/index'},{icon:'📊',label:'التقارير والتنبيهات',color:'#7C3AED',route:'/reports/index'}].map((s,i)=>(
          <TouchableOpacity key={i} style={[st.card,{borderLeftColor:s.color}]} onPress={()=>router.push(s.route)}><Text style={st.ci}>{s.icon}</Text><View style={{flex:1}}><Text style={st.cl}>{s.label}</Text></View><Text style={st.ca}>→</Text></TouchableOpacity>
        ))}
        <View style={{height:30}}/>
      </ScrollView>
    </View>
  );
}
const st = StyleSheet.create({
  c:{flex:1,backgroundColor:'#0A1128'},h:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingHorizontal:18,paddingVertical:14},w:{fontSize:19,fontWeight:'bold',color:'#FFF'},s:{fontSize:24},
  stats:{flexDirection:'row',gap:6,marginBottom:16,marginTop:4,paddingHorizontal:14},stat:{flex:1,backgroundColor:'#16213E',borderRadius:12,padding:12,alignItems:'center',borderWidth:1,borderColor:'#2a3550'},sv:{fontSize:12,fontWeight:'bold',color:'#D4AF37',marginBottom:3},sl:{color:'#94a3b8',fontSize:10},
  tt:{fontSize:14,fontWeight:'bold',color:'#D4AF37',marginBottom:10,marginTop:16,paddingHorizontal:14},qr:{flexDirection:'row',gap:8,paddingHorizontal:14},qc:{flex:1,alignItems:'center'},qi:{fontSize:22,marginBottom:4},ql:{color:'#FFF',fontSize:10,textAlign:'center'},
  card:{flexDirection:'row',alignItems:'center',backgroundColor:'#16213E',borderRadius:14,padding:16,marginBottom:10,marginHorizontal:14,borderLeftWidth:4,borderWidth:1,borderColor:'#2a3550'},ci:{fontSize:28,marginRight:12},cl:{color:'#FFF',fontSize:14,fontWeight:'bold'},ca:{fontSize:20,color:'#D4AF37',fontWeight:'bold'},
});
