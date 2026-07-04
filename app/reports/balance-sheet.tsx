import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AccountingEngine } from '../../src/services/AccountingEngine';

export default function BalanceSheetScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const loadData = async () => {
    setLoading(true);
    const tb: any = await AccountingEngine.getTrialBalance();
    const accounts = tb.accounts || [];
    
    const assets = accounts.filter((a: any) => a.type === 'أصل');
    const liabilities = accounts.filter((a: any) => a.type === 'خصم');
    const equity = accounts.filter((a: any) => a.type === 'ملكية');
    const totalAssets = assets.reduce((s: number, a: any) => s + (a.balance || 0), 0);
    const totalLiabilities = liabilities.reduce((s: number, a: any) => s + (a.balance || 0), 0);
    const totalEquity = equity.reduce((s: number, a: any) => s + (a.balance || 0), 0);
    
    setData({ assets, liabilities, equity, totalAssets, totalLiabilities, totalEquity });
    setLoading(false);
  };

  if (loading) return <View style={[st.c, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}><ActivityIndicator color="#D4AF37" size="large" /></View>;

  return (
    <View style={[st.c, { paddingTop: insets.top }]}>
      <View style={st.h}><TouchableOpacity onPress={() => router.back()}><Text style={st.bb}>←</Text></TouchableOpacity><Text style={st.t}>📋 الميزانية العمومية</Text></View>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={st.section}>🏢 الأصول</Text>
        {data?.assets.map((a: any) => (
          <View key={a.id} style={st.row}><Text style={st.name}>{a.name}</Text><Text style={st.val}>{a.balance?.toLocaleString()}</Text></View>
        ))}
        <View style={st.total}><Text style={st.tl}>إجمالي الأصول</Text><Text style={st.tv}>{data?.totalAssets?.toLocaleString()}</Text></View>

        <Text style={[st.section, { marginTop: 24 }]}>💳 الخصوم</Text>
        {data?.liabilities.map((a: any) => (
          <View key={a.id} style={st.row}><Text style={st.name}>{a.name}</Text><Text style={st.val}>{a.balance?.toLocaleString()}</Text></View>
        ))}
        <View style={st.total}><Text style={st.tl}>إجمالي الخصوم</Text><Text style={st.tv}>{data?.totalLiabilities?.toLocaleString()}</Text></View>

        <Text style={[st.section, { marginTop: 24 }]}>👑 حقوق الملكية</Text>
        {data?.equity.map((a: any) => (
          <View key={a.id} style={st.row}><Text style={st.name}>{a.name}</Text><Text style={st.val}>{a.balance?.toLocaleString()}</Text></View>
        ))}
        <View style={st.total}><Text style={st.tl}>إجمالي حقوق الملكية</Text><Text style={st.tv}>{data?.totalEquity?.toLocaleString()}</Text></View>

        <View style={[st.total, { borderTopColor: '#D4AF37', borderTopWidth: 2, marginTop: 16, paddingTop: 16 }]}>
          <Text style={[st.tl, { fontSize: 16 }]}>الخصوم + حقوق الملكية</Text>
          <Text style={[st.tv, { fontSize: 18, color: data?.totalLiabilities + data?.totalEquity === data?.totalAssets ? '#10B981' : '#EF4444' }]}>
            {(data?.totalLiabilities + data?.totalEquity)?.toLocaleString()} ﷼
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
  name:{color:'#FFF',fontSize:13},val:{color:'#FFF',fontSize:14,fontWeight:'bold'},
  total:{flexDirection:'row',justifyContent:'space-between',paddingVertical:10,borderTopWidth:1,borderTopColor:'#2a3550',marginTop:8},
  tl:{color:'#FFF',fontSize:15,fontWeight:'bold'},tv:{fontSize:16,fontWeight:'bold',color:'#D4AF37'},
});
