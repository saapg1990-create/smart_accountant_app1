import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useDatabase } from '../../context/DatabaseContext';
import { useAccountStore } from '../../src/store/useAccountStore';

export default function EWalletsScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const { db } = useDatabase();
  const { loadAccounts, addAccount } = useAccountStore();
  const [wallets, setWallets] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [balance, setBalance] = useState('0');

  useFocusEffect(useCallback(() => { if(db) loadWallets(); }, [db]));

  const loadWallets = async () => {
    await db.execAsync(`CREATE TABLE IF NOT EXISTS ewallets (id TEXT PRIMARY KEY, name TEXT, phone TEXT, balance REAL DEFAULT 0)`);
    const result = await db.getAllAsync('SELECT * FROM ewallets ORDER BY name');
    setWallets(result);
  };

  const addWallet = async () => {
    if (!name.trim()) { Alert.alert('خطأ', 'أدخل اسم المحفظة'); return; }
    const id = 'ew-' + Date.now();
    const bal = parseFloat(balance) || 0;
    await db.runAsync('INSERT INTO ewallets (id, name, phone, balance) VALUES (?,?,?,?)', [id, name, phone, bal]);
    await addAccount({ id, name, type: 'أصل', balance: bal, code: 'EW' + Date.now().toString().slice(-4) });
    await loadWallets(); await loadAccounts();
    setName(''); setPhone(''); setBalance('0'); setShowForm(false);
    Alert.alert('✅', 'تم إضافة المحفظة وحسابها في الدليل');
  };

  const deleteWallet = async (id: string) => {
    Alert.alert('حذف', 'حذف المحفظة؟', [{ text: 'إلغاء' }, { text: 'حذف', onPress: async () => { 
      await db.runAsync('DELETE FROM ewallets WHERE id=?', [id]); 
      await db.runAsync('UPDATE accounts SET isActive=0 WHERE id=?', [id]);
      await loadWallets(); await loadAccounts();
    }}]);
  };

  return (
    <View style={[st.c, { paddingTop: insets.top }]}>
      <View style={st.h}><TouchableOpacity onPress={() => router.back()}><Text style={st.bb}>←</Text></TouchableOpacity><Text style={st.t}>المحافظ الإلكترونية</Text><TouchableOpacity onPress={() => setShowForm(!showForm)}><Text style={st.ab}>+</Text></TouchableOpacity></View>
      {showForm && (<View style={st.f}><Text style={st.l}>اسم المحفظة</Text><TextInput style={st.i} value={name} onChangeText={setName} /><Text style={st.l}>رقم الهاتف</Text><TextInput style={st.i} value={phone} onChangeText={setPhone} /><Text style={st.l}>الرصيد</Text><TextInput style={st.i} value={balance} onChangeText={setBalance} keyboardType="numeric" /><TouchableOpacity style={st.s} onPress={addWallet}><Text style={st.st}>حفظ</Text></TouchableOpacity></View>)}
      <FlatList data={wallets} keyExtractor={i=>i.id} renderItem={({item})=>(<View style={st.card}><View style={{flex:1}}><Text style={st.n}>📱 {item.name}</Text><Text style={st.d}>{item.phone} | الرصيد: {item.balance}</Text></View><TouchableOpacity onPress={()=>deleteWallet(item.id)}><Text>🗑️</Text></TouchableOpacity></View>)} ListEmptyComponent={<Text style={st.e}>لا توجد محافظ</Text>} />
    </View>
  );
}
const st = StyleSheet.create({
  c:{flex:1,backgroundColor:'#0A1128'},h:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:16},bb:{fontSize:24,color:'#D4AF37'},t:{color:'#D4AF37',fontSize:20,fontWeight:'bold'},ab:{fontSize:28,color:'#D4AF37'},
  f:{padding:16,backgroundColor:'#16213E',margin:12,borderRadius:12},l:{color:'#9A9B3B',fontSize:14,marginTop:8},i:{backgroundColor:'#0A1128',color:'#FFF',padding:10,borderRadius:8,marginTop:4},
  s:{backgroundColor:'#D4AF37',padding:12,borderRadius:8,alignItems:'center',marginTop:12},st:{color:'#000',fontWeight:'bold'},
  card:{flexDirection:'row',alignItems:'center',backgroundColor:'#16213E',padding:14,marginHorizontal:12,marginVertical:5,borderRadius:12},n:{color:'#FFF',fontSize:16,fontWeight:'bold'},d:{color:'#9A9B3B',fontSize:12},
  e:{color:'#666',textAlign:'center',marginTop:40},
});
