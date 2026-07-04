import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DataService } from '../../src/services/dataService';
import { ControlButtons, ControlHeader } from '../../src/components/ui/ControlButtons';

export default function TrialBalanceScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => { loadAll(); }, []));
  const loadAll = async () => { setLoading(true); setAccounts(await DataService.getAccounts() || []); setLoading(false); };

  const filtered = accounts.filter((a: any) => a.name?.includes(searchQuery) || a.code?.includes(searchQuery));
  const totalDebit = filtered.filter((a: any) => ['اصل','مصروف'].includes(a.type)).reduce((s: number, a: any) => s + Math.max(0, a.balance || 0), 0);
  const totalCredit = filtered.filter((a: any) => ['خصم','ايراد','ملكية'].includes(a.type)).reduce((s: number, a: any) => s + Math.abs(Math.min(0, a.balance || 0)), 0);

  const handlePrint = () => Alert.alert('🖨️', 'جاري طباعة ميزان المراجعة...');
  const handleExport = () => Alert.alert('📤', 'جاري تصدير ميزان المراجعة...');

  return (
    <View style={[st.c, { paddingTop: insets.top }]}>
      <ControlHeader title="ميزان المراجعة" count={accounts.length} onBack={() => router.back()} />
      <ControlButtons showSearch showPrint showRefresh showExport onRefresh={loadAll} onPrint={handlePrint} onExport={handleExport} />
      <TextInput style={st.si} placeholder="🔍 بحث..." placeholderTextColor="#666" value={searchQuery} onChangeText={setSearchQuery} />
      <View style={st.summary}>
        <View style={[st.sb,{borderColor:'#EF4444'}]}><Text style={st.sl}>إجمالي مدين</Text><Text style={[st.sv,{color:'#EF4444'}]}>{totalDebit.toLocaleString()}</Text></View>
        <View style={[st.sb,{borderColor:'#10B981'}]}><Text style={st.sl}>إجمالي دائن</Text><Text style={[st.sv,{color:'#10B981'}]}>{totalCredit.toLocaleString()}</Text></View>
        <View style={[st.sb,{borderColor:Math.abs(totalDebit-totalCredit)<0.01?'#10B981':'#EF4444'}]}><Text style={st.sl}>الفرق</Text><Text style={[st.sv,{color:Math.abs(totalDebit-totalCredit)<0.01?'#10B981':'#EF4444'}]}>{(totalDebit-totalCredit).toLocaleString()}</Text></View>
      </View>
      {loading ? <Text style={st.loading}>⏳ جاري التحميل...</Text> :
        <FlatList data={filtered} keyExtractor={(i: any) => i.id} renderItem={({ item }: any) => (
          <View style={st.card}>
            <View style={st.row}><Text style={st.code}>{item.code}</Text><Text style={st.name}>{item.name}</Text></View>
            <View style={st.row}>
              <Text style={st.dr}>{item.balance > 0 ? (item.balance||0).toLocaleString() : '0'}</Text>
              <Text style={st.cr}>{item.balance < 0 ? Math.abs(item.balance||0).toLocaleString() : '0'}</Text>
            </View>
          </View>
        )} ListEmptyComponent={<Text style={st.et}>لا توجد حسابات</Text>} contentContainerStyle={{padding:12}} />
      }
    </View>
  );
}
const st = StyleSheet.create({
  c:{flex:1,backgroundColor:'#0A1128'},si:{marginHorizontal:12,marginBottom:8,padding:10,backgroundColor:'#16213E',borderRadius:10,color:'#FFF',borderWidth:1,borderColor:'#2a3550',textAlign:'right'},
  summary:{flexDirection:'row',marginHorizontal:12,gap:6,marginBottom:12},sb:{flex:1,backgroundColor:'#16213E',borderRadius:10,padding:10,alignItems:'center',borderWidth:1},sl:{color:'#94a3b8',fontSize:10},sv:{fontSize:14,fontWeight:'bold',marginTop:4},
  loading:{color:'#D4AF37',textAlign:'center',marginTop:40},et:{color:'#666',textAlign:'center',marginTop:40},
  card:{backgroundColor:'#16213E',padding:14,marginHorizontal:12,marginVertical:4,borderRadius:12},row:{flexDirection:'row',justifyContent:'space-between'},
  code:{color:'#94a3b8',fontSize:11},name:{color:'#FFF',fontSize:13,fontWeight:'bold'},dr:{color:'#EF4444',fontSize:12},cr:{color:'#10B981',fontSize:12},
});
