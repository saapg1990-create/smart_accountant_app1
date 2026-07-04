import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DataService } from '../../src/services/dataService';
import { ControlButtons, ControlHeader } from '../../src/components/ui/ControlButtons';

export default function GeneralLedgerScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const [entries, setEntries] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => { loadAll(); }, []));
  const loadAll = async () => { setLoading(true); setEntries(await DataService.getJournalEntries() || []); setLoading(false); };

  const totalDebit = entries.reduce((s: number, e: any) => s + (e.totalDebit || 0), 0);
  const totalCredit = entries.reduce((s: number, e: any) => s + (e.totalCredit || 0), 0);

  const filtered = entries.filter((e: any) => e.number?.includes(searchQuery) || e.description?.includes(searchQuery));

  return (
    <View style={[st.c, { paddingTop: insets.top }]}>
      <ControlHeader title="دفتر الأستاذ العام" count={entries.length} onBack={() => router.back()} />
      <ControlButtons showSearch showPrint showRefresh showExport onRefresh={loadAll} />
      <TextInput style={st.si} placeholder="🔍 بحث..." placeholderTextColor="#666" value={searchQuery} onChangeText={setSearchQuery} />
      <View style={st.summary}>
        <View style={[st.sb,{borderColor:'#EF4444'}]}><Text style={st.sl}>مدين</Text><Text style={[st.sv,{color:'#EF4444'}]}>{totalDebit.toLocaleString()}</Text></View>
        <View style={[st.sb,{borderColor:'#10B981'}]}><Text style={st.sl}>دائن</Text><Text style={[st.sv,{color:'#10B981'}]}>{totalCredit.toLocaleString()}</Text></View>
      </View>
      {loading ? <Text style={st.loading}>⏳ جاري التحميل...</Text> :
        <FlatList data={filtered} keyExtractor={(i: any) => i.id} renderItem={({ item }: any) => (
          <View style={st.card}>
            <View style={st.row}><Text style={st.cn}>{item.number}</Text><Text style={st.date}>{item.date}</Text></View>
            <Text style={st.desc}>{item.description}</Text>
            <View style={st.row}>
              <Text style={st.dr}>مدين: {item.totalDebit?.toLocaleString()||0}</Text>
              <Text style={st.cr}>دائن: {item.totalCredit?.toLocaleString()||0}</Text>
            </View>
          </View>
        )} ListEmptyComponent={<Text style={st.et}>لا توجد قيود</Text>} contentContainerStyle={{padding:12}} />
      }
    </View>
  );
}
const st = StyleSheet.create({
  c:{flex:1,backgroundColor:'#0A1128'},si:{marginHorizontal:12,marginBottom:8,padding:10,backgroundColor:'#16213E',borderRadius:10,color:'#FFF',borderWidth:1,borderColor:'#2a3550',textAlign:'right'},
  summary:{flexDirection:'row',marginHorizontal:12,gap:6,marginBottom:12},sb:{flex:1,backgroundColor:'#16213E',borderRadius:10,padding:10,alignItems:'center',borderWidth:1},sl:{color:'#94a3b8',fontSize:10},sv:{fontSize:14,fontWeight:'bold',marginTop:4},
  loading:{color:'#D4AF37',textAlign:'center',marginTop:40},et:{color:'#666',textAlign:'center',marginTop:40},
  card:{backgroundColor:'#16213E',padding:14,marginHorizontal:12,marginVertical:4,borderRadius:12},row:{flexDirection:'row',justifyContent:'space-between'},
  cn:{color:'#D4AF37',fontSize:13,fontWeight:'bold'},date:{color:'#94a3b8',fontSize:10},desc:{color:'#FFF',fontSize:12,textAlign:'right',marginVertical:4},
  dr:{color:'#EF4444',fontSize:11},cr:{color:'#10B981',fontSize:11},
});
