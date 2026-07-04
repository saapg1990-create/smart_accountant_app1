import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AccountingEngine } from '../../src/services/AccountingEngine';

export default function IncomeStatementScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const loadData = async () => {
    setLoading(true);
    const tb: any = await AccountingEngine.getTrialBalance();
    const accounts = tb.accounts || [];
    
    const revenues = accounts.filter((a: any) => a.type === 'إيراد');
    const expenses = accounts.filter((a: any) => a.type === 'مصروف');
    const totalRevenue = revenues.reduce((s: number, a: any) => s + (a.balance || 0), 0);
    const totalExpense = expenses.reduce((s: number, a: any) => s + (a.balance || 0), 0);
    
    setData({ revenues, expenses, totalRevenue, totalExpense, netIncome: totalRevenue - totalExpense });
    setLoading(false);
  };

  if (loading) return <View style={[st.c, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}><ActivityIndicator color="#D4AF37" size="large" /></View>;

  return (
    <View style={[st.c, { paddingTop: insets.top }]}>
      <View style={st.h}><TouchableOpacity onPress={() => router.back()}><Text style={st.bb}>←</Text></TouchableOpacity><Text style={st.t}>📈 قائمة الدخل</Text></View>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={st.section}>💰 الإيرادات</Text>
        {data?.revenues.map((a: any) => (
          <View key={a.id} style={st.row}><Text style={st.name}>{a.name}</Text><Text style={[st.val, { color: '#10B981' }]}>{a.balance?.toLocaleString()}</Text></View>
        ))}
        <View style={st.total}><Text style={st.tl}>إجمالي الإيرادات</Text><Text style={[st.tv, { color: '#10B981' }]}>{data?.totalRevenue?.toLocaleString()}</Text></View>

        <Text style={[st.section, { marginTop: 24 }]}>💸 المصروفات</Text>
        {data?.expenses.map((a: any) => (
          <View key={a.id} style={st.row}><Text style={st.name}>{a.name}</Text><Text style={[st.val, { color: '#EF4444' }]}>{a.balance?.toLocaleString()}</Text></View>
        ))}
        <View style={st.total}><Text style={st.tl}>إجمالي المصروفات</Text><Text style={[st.tv, { color: '#EF4444' }]}>{data?.totalExpense?.toLocaleString()}</Text></View>

        <View style={[st.total, { borderTopColor: '#D4AF37', borderTopWidth: 2, marginTop: 16, paddingTop: 16 }]}>
          <Text style={[st.tl, { fontSize: 18 }]}>صافي الربح</Text>
          <Text style={[st.tv, { fontSize: 20, color: data?.netIncome >= 0 ? '#10B981' : '#EF4444' }]}>
            {data?.netIncome?.toLocaleString()} ﷼
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
const st = StyleSheet.create({
  c:{flex:1,backgroundColor:'#0A1128'},h:{flexDirection:'row',alignItems:'center',padding:16},bb:{fontSize:24,color:'#D4AF37'},t:{color:'#D4AF37',fontSize:20,fontWeight:'bold',flex:1,textAlign:'center'},
  section:{color:'#D4AF37',fontSize:16,fontWeight:'bold',marginBottom:12},
  row:{flexDirection:'row',justifyContent:'space-between',paddingVertical:8,borderBottomWidth:1,borderBottomColor:'#1a2540'},
  name:{color:'#FFF',fontSize:13},val:{fontSize:14,fontWeight:'bold'},
  total:{flexDirection:'row',justifyContent:'space-between',paddingVertical:10,borderTopWidth:1,borderTopColor:'#2a3550',marginTop:8},
  tl:{color:'#FFF',fontSize:15,fontWeight:'bold'},tv:{fontSize:16,fontWeight:'bold'},
});
