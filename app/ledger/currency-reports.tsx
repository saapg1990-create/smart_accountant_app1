import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDatabase } from '../../context/DatabaseContext';
import { ControlButtons, ControlHeader } from '../../src/components/ui/ControlButtons';

export default function CurrencyReportsScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const { db } = useDatabase();
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(useCallback(() => { if(db) db.getAllAsync('SELECT * FROM currencies ORDER BY code').then(setCurrencies); }, [db]));

  return (
    <View style={[st.c, { paddingTop: insets.top }]}>
      <ControlHeader title="تقرير العملات" count={currencies.length} onBack={() => router.back()} />
      <ControlButtons showSearch showPrint showRefresh showExport onRefresh={() => db.getAllAsync('SELECT * FROM currencies ORDER BY code').then(setCurrencies)} />
      <TextInput style={st.si} placeholder="🔍 بحث..." placeholderTextColor="#94a3b8" value={searchQuery} onChangeText={setSearchQuery} />
      <FlatList data={currencies.filter((c:any)=>c.code?.includes(searchQuery)||c.name?.includes(searchQuery))} keyExtractor={(i:any)=>i.id} renderItem={({item}:any)=>(
        <View style={st.row}><Text style={st.code}>{item.code} {item.symbol}</Text><Text style={st.name}>{item.name}</Text><Text style={st.rate}>السعر: {item.rate?.toLocaleString()}</Text></View>
      )} ListEmptyComponent={<Text style={st.et}>لا توجد عملات</Text>} contentContainerStyle={{padding:16}} />
    </View>
  );
}
const st = StyleSheet.create({
  c:{flex:1,backgroundColor:'#0A1128'},si:{marginHorizontal:16,marginBottom:10,padding:12,backgroundColor:'#16213E',borderRadius:10,color:'#FFF',borderWidth:1,borderColor:'#2a3550',textAlign:'right'},et:{color:'#FFF',textAlign:'center',marginTop:40},
  row:{backgroundColor:'#16213E',borderRadius:10,padding:12,marginBottom:6,marginHorizontal:16},code:{color:'#D4AF37',fontSize:16,fontWeight:'bold'},name:{color:'#FFF',marginTop:4},rate:{color:'#10B981',marginTop:4},
});
