import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DataService } from '../../src/services/dataService';
import { PickerModal } from '../../src/components/ui/PickerModal';
import { ControlButtons, ControlHeader } from '../../src/components/ui/ControlButtons';

const CURRENCY_SYMBOLS: any = { 'YER': '﷼', 'USD': '$', 'SAR': '﷼', 'EUR': '€' };

export default function AccountStatementScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [selectedCurrency, setSelectedCurrency] = useState('YER');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [showCurPicker, setShowCurPicker] = useState(false);

  useFocusEffect(useCallback(() => { loadAll(); }, []));
  const loadAll = async () => {
    setAccounts(await DataService.getAccounts() || []);
    setCurrencies(await DataService.getCurrencies() || []);
  };

  const selectAccount = async (acc: any) => {
    setSelected(acc); setSelectedCurrency(acc.currency || 'YER'); setShowPicker(false);
    const entries = await DataService.getJournalEntries();
    setTransactions((entries || []).filter((e: any) => 
      e.description?.includes(acc.name) || e.number?.includes(acc.code)
    ));
  };

  const balance = transactions.reduce((s: number, t: any) => s + (t.totalDebit || 0) - (t.totalCredit || 0), 0);
  const symbol = CURRENCY_SYMBOLS[selectedCurrency] || selectedCurrency;

  return (
    <View style={[st.c, { paddingTop: insets.top }]}>
      <ControlHeader title="كشف حساب" onBack={() => router.back()} />
      <ControlButtons showPrint showRefresh showExport onRefresh={loadAll} />
      
      <TouchableOpacity style={st.pk} onPress={()=>setShowPicker(true)}>
        <Text style={selected?st.pkt:st.pkp}>{selected ? `${selected.code} - ${selected.name}` : 'اختر الحساب'}</Text>
        <Text style={st.pka}>▼</Text>
      </TouchableOpacity>

      {selected && (
        <View style={st.curRow}>
          <Text style={st.curLabel}>العملة:</Text>
          <TouchableOpacity style={st.curBtn} onPress={()=>setShowCurPicker(true)}>
            <Text style={st.curText}>{selectedCurrency} {symbol}</Text>
            <Text style={st.pka}>▼</Text>
          </TouchableOpacity>
        </View>
      )}

      {selected && <View style={st.bal}><Text style={st.bl}>الرصيد: {balance.toLocaleString()} {symbol}</Text></View>}

      <FlatList data={transactions} keyExtractor={i => i.id} renderItem={({item}: any) => (
        <View style={st.card}>
          <View style={st.row}><Text style={st.cn}>{item.number}</Text><Text style={st.date}>{item.date}</Text></View>
          <Text style={st.desc}>{item.description}</Text>
          <View style={st.row}>
            <Text style={st.dr}>مدين: {item.totalDebit?.toLocaleString()||0} {symbol}</Text>
            <Text style={st.cr}>دائن: {item.totalCredit?.toLocaleString()||0} {symbol}</Text>
          </View>
        </View>
      )} ListEmptyComponent={<Text style={st.et}>{selected ? 'لا توجد حركات' : 'اختر حساباً'}</Text>} contentContainerStyle={{padding:12}} />
      
      <PickerModal visible={showPicker} title="اختيار الحساب" data={accounts} displayField="name" subField="code" onSelect={selectAccount} onClose={()=>setShowPicker(false)} />
      <PickerModal visible={showCurPicker} title="اختيار العملة" data={currencies} displayField="code" subField="name" onSelect={(i: any) => setSelectedCurrency(i.code)} onClose={()=>setShowCurPicker(false)} />
    </View>
  );
}
const st = StyleSheet.create({
  c:{flex:1,backgroundColor:'#0A1128'},
  pk:{flexDirection:'row',justifyContent:'space-between',margin:12,padding:14,backgroundColor:'#16213E',borderRadius:10,borderWidth:1,borderColor:'#2a3550'},pkt:{color:'#FFF',fontSize:14},pkp:{color:'#666',fontSize:14},pka:{color:'#D4AF37',fontSize:12},
  curRow:{flexDirection:'row',alignItems:'center',marginHorizontal:12,marginBottom:8,gap:8},curLabel:{color:'#94a3b8',fontSize:13},curBtn:{flexDirection:'row',alignItems:'center',backgroundColor:'#16213E',padding:8,borderRadius:8,gap:6,borderWidth:1,borderColor:'#2a3550'},curText:{color:'#FFF',fontSize:13},
  bal:{marginHorizontal:12,padding:12,backgroundColor:'#16213E',borderRadius:10,alignItems:'center',marginBottom:8},bl:{color:'#10B981',fontSize:18,fontWeight:'bold'},
  card:{backgroundColor:'#16213E',padding:14,marginHorizontal:12,marginVertical:4,borderRadius:12},row:{flexDirection:'row',justifyContent:'space-between'},
  cn:{color:'#D4AF37',fontSize:13,fontWeight:'bold'},date:{color:'#94a3b8',fontSize:10},desc:{color:'#FFF',fontSize:12,marginVertical:4},
  dr:{color:'#EF4444',fontSize:11},cr:{color:'#10B981',fontSize:11},et:{color:'#666',textAlign:'center',marginTop:40},
});
