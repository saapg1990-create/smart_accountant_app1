import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useDatabase } from '../../context/DatabaseContext';
import { useAccountStore } from '../../src/store/useAccountStore';

export default function BanksScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const { db } = useDatabase();
  const { addAccount, loadAccounts, generateCode } = useAccountStore();
  const [banks, setBanks] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [balance, setBalance] = useState('0');

  useFocusEffect(useCallback(() => { if(db) loadBanks(); }, [db]));

  const loadBanks = async () => {
    const result = await db.getAllAsync('SELECT * FROM banks ORDER BY name');
    setBanks(result);
  };

  const addBank = async () => {
    if (!name.trim()) { Alert.alert('خطأ', 'أدخل اسم البنك'); return; }
    const bankId = 'bank-' + Date.now();
    const bal = parseFloat(balance) || 0;
    await db.runAsync('INSERT INTO banks (id, name, accountNumber, balance) VALUES (?,?,?,?)', [bankId, name, accountNumber, bal]);
    
    // ✅ إضافة حساب تحت "الأصول المتداولة" (id=11)
    const code = generateCode('11');
    await addAccount({ id: bankId, name, code, type: 'أصل', parentId: '112', balance: bal });
    
    await loadBanks(); await loadAccounts();
    setName(''); setAccountNumber(''); setBalance('0'); setShowForm(false);
    Alert.alert('✅', 'تم إضافة البنك تحت الأصول المتداولة');
  };

  const deleteBank = async (id: string) => {
    Alert.alert('حذف', 'حذف البنك؟', [{ text: 'إلغاء' }, { text: 'حذف', onPress: async () => { 
      await db.runAsync('DELETE FROM banks WHERE id=?', [id]); 
      await db.runAsync('UPDATE accounts SET isActive=0 WHERE id=?', [id]);
      await loadBanks(); await loadAccounts();
    }}]);
  };

  return (
    <View style={[st.c, { paddingTop: insets.top }]}>
      <View style={st.h}><TouchableOpacity onPress={() => router.back()}><Text style={st.bb}>←</Text></TouchableOpacity><Text style={st.t}>البنوك</Text><TouchableOpacity onPress={() => setShowForm(!showForm)}><Text style={st.ab}>+</Text></TouchableOpacity></View>
      {showForm && (<View style={st.f}><Text style={st.l}>اسم البنك</Text><TextInput style={st.i} value={name} onChangeText={setName} /><Text style={st.l}>رقم الحساب</Text><TextInput style={st.i} value={accountNumber} onChangeText={setAccountNumber} /><Text style={st.l}>الرصيد</Text><TextInput style={st.i} value={balance} onChangeText={setBalance} keyboardType="numeric" /><TouchableOpacity style={st.s} onPress={addBank}><Text style={st.st}>حفظ</Text></TouchableOpacity></View>)}
      <FlatList data={banks} keyExtractor={i=>i.id} renderItem={({item})=>(<View style={st.card}><View style={{flex:1}}><Text style={st.n}>🏦 {item.name}</Text><Text style={st.d}>{item.accountNumber} | الرصيد: {item.balance}</Text></View><TouchableOpacity onPress={()=>deleteBank(item.id)}><Text>🗑️</Text></TouchableOpacity></View>)} ListEmptyComponent={<Text style={st.e}>لا توجد بنوك</Text>} />
    </View>
  );
}
const st = StyleSheet.create({c:{flex:1,backgroundColor:'#0A1128'},h:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:16},bb:{fontSize:24,color:'#D4AF37'},t:{color:'#D4AF37',fontSize:20,fontWeight:'bold'},ab:{fontSize:28,color:'#D4AF37'},f:{padding:16,backgroundColor:'#16213E',margin:12,borderRadius:12},l:{color:'#9A9B3B',fontSize:14,marginTop:8},i:{backgroundColor:'#0A1128',color:'#FFF',padding:10,borderRadius:8,marginTop:4},s:{backgroundColor:'#D4AF37',padding:12,borderRadius:8,alignItems:'center',marginTop:12},st:{color:'#000',fontWeight:'bold'},card:{flexDirection:'row',alignItems:'center',backgroundColor:'#16213E',padding:14,marginHorizontal:12,marginVertical:5,borderRadius:12},n:{color:'#FFF',fontSize:16,fontWeight:'bold'},d:{color:'#9A9B3B',fontSize:12},e:{color:'#666',textAlign:'center',marginTop:40}});
