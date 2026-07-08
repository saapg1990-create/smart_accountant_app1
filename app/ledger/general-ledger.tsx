import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDatabase } from '../../context/DatabaseContext';
import { ControlButtons, ControlHeader } from '../../src/components/ui/ControlButtons';

export default function GeneralLedgerScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const { db } = useDatabase();
  const [entries, setEntries] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(useCallback(() => { if(db) db.getAllAsync('SELECT * FROM journal_entries ORDER BY date DESC LIMIT 100').then(setEntries); }, [db]));

  const filtered = entries.filter((e:any) => e.number?.includes(searchQuery) || e.description?.includes(searchQuery));

  return (
    <View style={[st.c, { paddingTop: insets.top }]}>
      <ControlHeader title="دفتر الأستاذ" count={entries.length} onBack={() => router.back()} />
      <ControlButtons showSearch showPrint showRefresh showExport onRefresh={() => db.getAllAsync('SELECT * FROM journal_entries ORDER BY date DESC LIMIT 100').then(setEntries)} />
      <TextInput style={st.si} placeholder="🔍 بحث..." placeholderTextColor="#94a3b8" value={searchQuery} onChangeText={setSearchQuery} />
      <FlatList data={filtered} keyExtractor={(i:any)=>i.id} renderItem={({item}:any)=>(
        <View style={st.row}><Text style={st.num}>{item.number}</Text><Text style={st.desc}>{item.description}</Text><Text style={st.amt}>{item.base_amount?.toLocaleString()} ﷼</Text><Text style={st.date}>{item.date}</Text></View>
      )} ListEmptyComponent={<Text style={st.et}>لا توجد قيود</Text>} contentContainerStyle={{padding:16}} />
    </View>
  );
}
const st = StyleSheet.create({
  c:{flex:1,backgroundColor:'#0A1128'},si:{marginHorizontal:16,marginBottom:10,padding:12,backgroundColor:'#16213E',borderRadius:10,color:'#FFF',borderWidth:1,borderColor:'#2a3550',textAlign:'right'},et:{color:'#FFF',textAlign:'center',marginTop:40},
  row:{backgroundColor:'#16213E',borderRadius:10,padding:12,marginBottom:6,marginHorizontal:16},num:{color:'#D4AF37',fontWeight:'bold'},desc:{color:'#FFF',marginTop:4},amt:{color:'#10B981',fontWeight:'bold',marginTop:4},date:{color:'#94a3b8',fontSize:10},
});
