import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DataService } from '../../src/services/dataService';
import { PickerModal } from '../../src/components/ui/PickerModal';
import { ControlHeader } from '../../src/components/ui/ControlButtons';

const SYMBOLS: any = { 'YER': '﷼', 'USD': '$', 'SAR': '﷼', 'EUR': '€' };

export default function AccountCurrenciesScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [balances, setBalances] = useState<any[]>([]);
  const [showAccPicker, setShowAccPicker] = useState(false);
  const [showCurPicker, setShowCurPicker] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCurrency, setNewCurrency] = useState('');
  const [newBalance, setNewBalance] = useState('');

  useFocusEffect(useCallback(() => { loadAll(); }, []));
  const loadAll = async () => {
    setAccounts(await DataService.getAccounts() || []);
    setCurrencies(await DataService.getCurrencies() || []);
  };

  const selectAccount = async (acc: any) => {
    setSelectedAccount(acc);
    setShowAccPicker(false);
    const b = await DataService.getAccountBalances(acc.id);
    setBalances(b || []);
  };

  const addCurrency = async () => {
    if (!newCurrency || !selectedAccount) return Alert.alert('خطأ', 'اختر العملة');
    await DataService.addAccountBalance(selectedAccount.id, newCurrency, parseFloat(newBalance) || 0);
    setNewCurrency(''); setNewBalance(''); setShowAddForm(false);
    const b = await DataService.getAccountBalances(selectedAccount.id);
    setBalances(b || []);
  };

  const totalInYER = balances.reduce((s: number, b: any) => {
    const cur = currencies.find((c: any) => c.code === b.currency);
    return s + (b.balance || 0) * (cur?.rate || 1);
  }, 0);

  return (
    <View style={[st.c, { paddingTop: insets.top }]}>
      <ControlHeader title="أرصدة العملات" onBack={() => router.back()} />
      
      <TouchableOpacity style={st.pk} onPress={()=>setShowAccPicker(true)}>
        <Text style={selectedAccount?st.pkt:st.pkp}>{selectedAccount ? `${selectedAccount.code} - ${selectedAccount.name}` : 'اختر الحساب'}</Text>
        <Text style={st.pka}>▼</Text>
      </TouchableOpacity>

      {selectedAccount && (
        <View>
          <View style={st.totalBox}>
            <Text style={st.totalLabel}>الإجمالي بالريال اليمني</Text>
            <Text style={st.totalValue}>{totalInYER.toLocaleString()} ﷼</Text>
          </View>

          <TouchableOpacity style={st.addBtn} onPress={() => setShowAddForm(true)}>
            <Text style={st.addText}>+ إضافة رصيد بعملة</Text>
          </TouchableOpacity>

          <FlatList data={balances} keyExtractor={i => i.id} renderItem={({item}: any) => (
            <View style={st.card}>
              <Text style={st.cn}>{item.currency} {SYMBOLS[item.currency] || ''}</Text>
              <Text style={st.cb}>{item.balance?.toLocaleString()}</Text>
              <Text style={st.cr}>≈ {(item.balance * (currencies.find((c:any) => c.code === item.currency)?.rate || 1)).toLocaleString()} ﷼</Text>
            </View>
          )} ListEmptyComponent={<Text style={st.et}>لا توجد أرصدة</Text>} contentContainerStyle={{padding:12}} />
        </View>
      )}

      {showAddForm && (
        <Modal visible={showAddForm} animationType="slide" transparent>
          <View style={st.mo}><View style={st.mc}><View style={st.mh}><Text style={st.mt}>إضافة رصيد بعملة</Text><TouchableOpacity onPress={()=>setShowAddForm(false)}><Text style={st.mx}>✕</Text></TouchableOpacity></View>
          <View style={{padding:16}}>
            <Text style={st.fl}>العملة</Text>
            <TouchableOpacity style={st.pk} onPress={()=>setShowCurPicker(true)}>
              <Text style={newCurrency?st.pkt:st.pkp}>{newCurrency || 'اختيار العملة'}</Text><Text style={st.pka}>▼</Text>
            </TouchableOpacity>
            <Text style={st.fl}>الرصيد</Text>
            <TextInput style={st.fi} value={newBalance} onChangeText={setNewBalance} keyboardType="numeric" placeholder="0" placeholderTextColor="#666" />
            <TouchableOpacity style={st.sb} onPress={addCurrency}><Text style={st.sbt}>💾 حفظ</Text></TouchableOpacity>
          </View></View></View>
        </Modal>
      )}

      <PickerModal visible={showAccPicker} title="اختيار الحساب" data={accounts} displayField="name" subField="code" onSelect={selectAccount} onClose={()=>setShowAccPicker(false)} />
      <PickerModal visible={showCurPicker} title="اختيار العملة" data={currencies} displayField="code" onSelect={(i:any) => setNewCurrency(i.code)} onClose={()=>setShowCurPicker(false)} />
    </View>
  );
}
const st = StyleSheet.create({
  c:{flex:1,backgroundColor:'#0A1128'},
  pk:{flexDirection:'row',justifyContent:'space-between',margin:12,padding:14,backgroundColor:'#16213E',borderRadius:10,borderWidth:1,borderColor:'#2a3550'},pkt:{color:'#FFF',fontSize:14},pkp:{color:'#666',fontSize:14},pka:{color:'#D4AF37',fontSize:12},
  totalBox:{marginHorizontal:12,padding:14,backgroundColor:'#16213E',borderRadius:12,alignItems:'center',borderWidth:1,borderColor:'#D4AF37'},totalLabel:{color:'#94a3b8',fontSize:12},totalValue:{color:'#D4AF37',fontSize:22,fontWeight:'bold',marginTop:4},
  addBtn:{marginHorizontal:12,marginVertical:8,padding:12,backgroundColor:'#10B98120',borderRadius:10,alignItems:'center',borderWidth:1,borderColor:'#10B981'},addText:{color:'#10B981',fontSize:14,fontWeight:'bold'},
  card:{backgroundColor:'#16213E',padding:14,marginHorizontal:12,marginVertical:4,borderRadius:12},cn:{color:'#D4AF37',fontSize:14,fontWeight:'bold'},cb:{color:'#FFF',fontSize:16,fontWeight:'bold'},cr:{color:'#94a3b8',fontSize:11},
  mo:{flex:1,backgroundColor:'rgba(0,0,0,0.7)',justifyContent:'flex-end'},mc:{backgroundColor:'#16213E',borderTopLeftRadius:20,borderTopRightRadius:20,maxHeight:'70%'},
  mh:{flexDirection:'row',justifyContent:'space-between',padding:16},mt:{color:'#D4AF37',fontSize:16,fontWeight:'bold'},mx:{color:'#EF4444',fontSize:22},
  fl:{color:'#94a3b8',fontSize:13,marginBottom:6,marginTop:10},fi:{backgroundColor:'#0A1128',color:'#FFF',padding:10,borderRadius:8,textAlign:'right'},
  sb:{backgroundColor:'#D4AF37',padding:12,borderRadius:8,alignItems:'center',marginTop:16},sbt:{color:'#000',fontWeight:'bold'},et:{color:'#666',textAlign:'center',marginTop:40},
});
