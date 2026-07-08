import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAccountStore } from '../../src/store/useAccountStore';
import { Selector } from '../../src/components/common/Selector';
import { ControlHeader } from '../../src/components/ui/ControlButtons';
import { useDatabase } from '../../context/DatabaseContext';

export default function AccountStatementScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const { accounts, loadAccounts } = useAccountStore();
  const { db } = useDatabase();
  const [selectedId, setSelectedId] = useState('');
  const [selectedName, setSelectedName] = useState('');
  const [transactions, setTransactions] = useState<any[]>([]);

  useFocusEffect(useCallback(() => { loadAccounts(); }, []));

  const loadStatement = async (accountId: string) => {
    if (!db) return;
    const result = await db.getAllAsync('SELECT * FROM journal_details WHERE account_id = ? ORDER BY rowid DESC LIMIT 50', [accountId]);
    setTransactions(result);
  };

  return (
    <View style={[st.c, { paddingTop: insets.top }]}>
      <ControlHeader title="كشف حساب" onBack={() => router.back()} />
      <Selector label="اختر الحساب" tableName="accounts" displayField="name" subField="code" showBalance selectedId={selectedId} selectedName={selectedName} onSelect={(i:any)=>{setSelectedId(i.id);setSelectedName(i.name);loadStatement(i.id)}} />
      
      {selectedName && <Text style={st.bal}>الرصيد: {accounts.find((a:any)=>a.id===selectedId)?.balance?.toLocaleString()} ﷼</Text>}

      <FlatList data={transactions} keyExtractor={(i,idx)=>i.id+idx} renderItem={({item}:any)=>(
        <View style={st.row}><Text style={st.debit}>{item.debit>0?item.debit?.toLocaleString():'-'}</Text><Text style={st.credit}>{item.credit>0?item.credit?.toLocaleString():'-'}</Text><Text style={st.desc}>{item.description}</Text></View>
      )} ListEmptyComponent={<Text style={st.et}>{selectedId?'لا توجد حركات':'اختر حساباً'}</Text>} contentContainerStyle={{padding:16}} />
    </View>
  );
}
const st = StyleSheet.create({
  c:{flex:1,backgroundColor:'#0A1128'},et:{color:'#FFF',textAlign:'center',marginTop:40},bal:{color:'#D4AF37',fontSize:20,fontWeight:'bold',textAlign:'center',marginVertical:10},
  row:{backgroundColor:'#16213E',borderRadius:10,padding:10,marginBottom:4,marginHorizontal:16,flexDirection:'row'},debit:{color:'#EF4444',width:80},credit:{color:'#10B981',width:80},desc:{color:'#FFF',flex:1,textAlign:'right'},
});
