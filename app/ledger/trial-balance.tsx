import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAccountStore } from '../../src/store/useAccountStore';
import { ControlButtons, ControlHeader } from '../../src/components/ui/ControlButtons';

export default function TrialBalanceScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const { accounts, loadAccounts } = useAccountStore();
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(useCallback(() => { loadAccounts(); }, []));

  const filtered = accounts.filter((a: any) => a.name?.includes(searchQuery) || a.code?.includes(searchQuery));
  const totalDebit = filtered.filter((a: any) => ['أصل','مصروف'].includes(a.type)).reduce((s: number, a: any) => s + (a.balance || 0), 0);
  const totalCredit = filtered.filter((a: any) => ['خصم','إيراد','ملكية'].includes(a.type)).reduce((s: number, a: any) => s + (a.balance || 0), 0);

  return (
    <View style={[st.c, { paddingTop: insets.top }]}>
      <ControlHeader title="ميزان المراجعة" count={accounts.length} onBack={() => router.back()} />
      <ControlButtons showSearch showPrint showRefresh showExport onRefresh={loadAccounts} />
      <TextInput style={st.si} placeholder="🔍 بحث..." placeholderTextColor="#94a3b8" value={searchQuery} onChangeText={setSearchQuery} />
      
      <View style={st.summary}>
        <View style={st.box}><Text style={st.boxL}>مدين</Text><Text style={[st.boxV,{color:'#EF4444'}]}>{totalDebit.toLocaleString()}</Text></View>
        <View style={st.box}><Text style={st.boxL}>دائن</Text><Text style={[st.boxV,{color:'#10B981'}]}>{totalCredit.toLocaleString()}</Text></View>
        <View style={st.box}><Text style={st.boxL}>الفرق</Text><Text style={[st.boxV,{color:Math.abs(totalDebit-totalCredit)<0.01?'#10B981':'#EF4444'}]}>{(totalDebit-totalCredit).toLocaleString()}</Text></View>
      </View>

      <FlatList data={filtered} keyExtractor={(i:any)=>i.id} renderItem={({item}:any)=>(
        <View style={st.row}><Text style={st.code}>{item.code}</Text><Text style={st.name}>{item.name}</Text><Text style={st.debit}>{['أصل','مصروف'].includes(item.type)?item.balance?.toLocaleString():'0'}</Text><Text style={st.credit}>{['خصم','إيراد','ملكية'].includes(item.type)?item.balance?.toLocaleString():'0'}</Text></View>
      )} ListEmptyComponent={<Text style={st.et}>لا توجد حسابات</Text>} contentContainerStyle={{padding:16}} />
    </View>
  );
}
const st = StyleSheet.create({
  c:{flex:1,backgroundColor:'#0A1128'},si:{marginHorizontal:16,marginBottom:10,padding:12,backgroundColor:'#16213E',borderRadius:10,color:'#FFF',borderWidth:1,borderColor:'#2a3550',textAlign:'right'},et:{color:'#FFF',textAlign:'center',marginTop:40},
  summary:{flexDirection:'row',marginHorizontal:12,gap:8,marginBottom:10},box:{flex:1,backgroundColor:'#16213E',borderRadius:10,padding:10,alignItems:'center'},boxL:{color:'#94a3b8',fontSize:11},boxV:{fontSize:18,fontWeight:'bold',marginTop:4},
  row:{flexDirection:'row',alignItems:'center',paddingVertical:8,borderBottomWidth:1,borderBottomColor:'#2a3550',paddingHorizontal:16},code:{color:'#94a3b8',fontSize:11,width:60},name:{color:'#FFF',flex:1,fontSize:13,textAlign:'right'},debit:{color:'#EF4444',width:80,textAlign:'center'},credit:{color:'#10B981',width:80,textAlign:'center'},
});
