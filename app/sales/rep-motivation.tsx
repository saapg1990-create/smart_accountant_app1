import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalTable } from '../../hooks/useLocalStore';

const MOTIVATION_MSGS = [
  '🌟 أنت نجم الفريق! استمر في التألق!',
  '🔥 أداء رائع! التارجت في متناول يدك!',
  '💪 اقتربت من الهدف! شد حيلك!',
  '🚀 أداء أسطوري! تجاوزت التوقعات!',
  '👏 عمل ممتاز! العميل سعيد جداً!',
  '🏆 بطل المبيعات! استحققت التكريم!',
  '⚡ طاقة إيجابية! مبيعاتك في ارتفاع!',
  '🎯 على بعد خطوات من التارجت! كمل!',
];

export default function RepMotivationScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const { data: reps } = useLocalTable('salesReps');
  const { data: invoices } = useLocalTable('salesInvoices');

  const getRepSales = (repId: string) => {
    return invoices.filter((inv: any) => inv.repId === repId).reduce((s: number, inv: any) => s + (inv.total || 0), 0);
  };

  const getMotivationMsg = (percent: number) => {
    if (percent >= 100) return MOTIVATION_MSGS[0];
    if (percent >= 80) return MOTIVATION_MSGS[1];
    if (percent >= 60) return MOTIVATION_MSGS[2];
    if (percent >= 40) return MOTIVATION_MSGS[4];
    return MOTIVATION_MSGS[7];
  };

  return (
    <View style={[st.c, { paddingTop: insets.top }]}>
      <View style={st.h}><TouchableOpacity onPress={() => router.back()}><Text style={st.bb}>←</Text></TouchableOpacity><Text style={st.t}>🎯 تحفيز المندوبين</Text><View style={{ width: 36 }} /></View>
      
      <FlatList data={reps} keyExtractor={(i: any) => i.id}
        renderItem={({ item }: any) => {
          const sales = getRepSales(item.id);
          const target = item.monthlyTarget || 10000;
          const percent = target > 0 ? Math.round((sales / target) * 100) : 0;
          const msg = getMotivationMsg(percent);
          return (
            <View style={st.card}>
              <View style={st.header}>
                <Text style={st.name}>👤 {item.name}</Text>
                <Text style={st.percent}>{percent}%</Text>
              </View>
              <View style={st.barBg}><View style={[st.bar, { width: `${Math.min(percent, 100)}%`, backgroundColor: percent >= 80 ? '#10B981' : percent >= 50 ? '#F59E0B' : '#EF4444' }]} /></View>
              <View style={st.row}>
                <Text style={st.sales}>💰 المبيعات: {sales.toLocaleString()} ﷼</Text>
                <Text style={st.target}>🎯 التارجت: {target.toLocaleString()}</Text>
              </View>
              <Text style={st.msg}>{msg}</Text>
            </View>
          );
        }}
        contentContainerStyle={{ padding: 12 }}
        ListEmptyComponent={<Text style={st.et}>لا يوجد مندوبين</Text>}
      />
    </View>
  );
}
const st = StyleSheet.create({
  c:{flex:1,backgroundColor:'#0A1128'},h:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:16},bb:{fontSize:24,color:'#D4AF37'},t:{color:'#D4AF37',fontSize:20,fontWeight:'bold'},
  et:{color:'#666',textAlign:'center',marginTop:40,fontSize:16},
  card:{backgroundColor:'#16213E',borderRadius:14,padding:16,marginBottom:10,marginHorizontal:12,borderWidth:1,borderColor:'#2a3550'},
  header:{flexDirection:'row',justifyContent:'space-between',marginBottom:8},name:{color:'#FFF',fontSize:16,fontWeight:'bold'},percent:{color:'#D4AF37',fontSize:18,fontWeight:'bold'},
  barBg:{height:8,backgroundColor:'#0A1128',borderRadius:4,marginBottom:8,overflow:'hidden'},bar:{height:8,borderRadius:4},
  row:{flexDirection:'row',justifyContent:'space-between',marginBottom:6},sales:{color:'#10B981',fontSize:12},target:{color:'#94a3b8',fontSize:12},
  msg:{color:'#F59E0B',fontSize:13,textAlign:'center',marginTop:8,fontStyle:'italic'},
});
