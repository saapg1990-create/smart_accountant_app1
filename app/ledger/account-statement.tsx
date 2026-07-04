import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DataService } from '../../src/services/dataService';
import { PickerModal } from '../../src/components/ui/PickerModal';
import { ControlButtons, ControlHeader } from '../../src/components/ui/ControlButtons';

export default function AccountStatementScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showPicker, setShowPicker] = useState(false);

  useFocusEffect(useCallback(() => { loadAccounts(); }, []));
  const loadAccounts = async () => { const data = await DataService.getAccounts(); setAccounts(data || []); };

  const selectAccount = async (acc: any) => {
    setSelected(acc);
    setShowPicker(false);
    const entries = await DataService.getJournalEntries();
    setTransactions((entries || []).filter((e: any) => 
      e.description?.includes(acc.name) || e.number?.includes(acc.code)
    ));
  };

  const balance = transactions.reduce((s: number, t: any) => s + (t.totalDebit || 0) - (t.totalCredit || 0), 0);

  return (
    <View style={[st.c, { paddingTop: insets.top }]}>
      <ControlHeader title="كشف حساب" onBack={() => router.back()} />
      <TouchableOpacity style={st.pk} onPress={()=>setShowPicker(true)}>
        <Text style={selected?st.pkt:st.pkp}>{selected ? `${selected.code} - ${selected.name}` : 'اختر الحساب'}</Text>
        <Text style={st.pka}>▼</Text>
      </TouchableOpacity>
      {selected && <View style={st.bal}><Text style={st.bl}>الرصيد: {balance.toLocaleString()} ﷼</Text></View>}
      <FlatList data={transactions} keyExtractor={i => i.id} renderItem={({item}) => (
        <View style={st.card}>
          <Text style={st.cn}>{item.number}</Text><Text style={st.cd}>{item.description}</Text>
          <View style={st.row}><Text style={st.dr}>مدين: {item.totalDebit?.toLocaleString()||0}</Text><Text style={st.cr}>دائن: {item.totalCredit?.toLocaleString()||0}</Text></View>
        </View>
      )} ListEmptyComponent={<Text style={st.et}>{selected ? 'لا توجد حركات' : 'اختر حساباً'}</Text>} contentContainerStyle={{padding:12}} />
      <PickerModal visible={showPicker} title="اختيار الحساب" data={accounts} displayField="name" subField="code" onSelect={selectAccount} onClose={()=>setShowPicker(false)} />
    </View>
  );
}
const st = StyleSheet.create({
  c:{flex:1,backgroundColor:'#0A1128'},pk:{flexDirection:'row',justifyContent:'space-between',margin:12,padding:14,backgroundColor:'#16213E',borderRadius:10,borderWidth:1,borderColor:'#2a3550'},pkt:{color:'#FFF',fontSize:14},pkp:{color:'#666',fontSize:14},pka:{color:'#D4AF37',fontSize:12},
  bal:{marginHorizontal:12,padding:12,backgroundColor:'#16213E',borderRadius:10,alignItems:'center'},bl:{color:'#10B981',fontSize:18,fontWeight:'bold'},
  card:{backgroundColor:'#16213E',padding:14,marginHorizontal:12,marginVertical:4,borderRadius:12},cn:{color:'#D4AF37',fontSize:13,fontWeight:'bold'},cd:{color:'#FFF',fontSize:12,marginTop:4},
  row:{flexDirection:'row',justifyContent:'space-between',marginTop:4},dr:{color:'#EF4444',fontSize:11},cr:{color:'#10B981',fontSize:11},et:{color:'#666',textAlign:'center',marginTop:40},
});
