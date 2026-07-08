import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Modal, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAccountStore } from '../../src/store/useAccountStore';
import { CurrencySelector } from '../../src/components/common/CurrencySelector';
import { ControlButtons, ControlHeader } from '../../src/components/ui/ControlButtons';

export default function EWalletsScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const { accounts, loadAccounts, addAccount, generateCode } = useAccountStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currency, setCurrency] = useState('YER');
  const [formData, setFormData] = useState({ name: '', balance: '0' });

  useFocusEffect(useCallback(() => { loadAccounts(); }, []));

  // ✅ جلب حسابات المحفظة من الدليل مباشرة
  const cashBoxes = accounts.filter((a: any) => a.parentId === '113' && a.isActive !== 0);
  const totalBalance = cashBoxes.reduce((s: number, b: any) => s + (b.balance || 0), 0);
  const count = cashBoxes.length + 1;
  const boxNumber = `EW-${count.toString().padStart(4, '0')}`;

  const handleSave = async () => {
    if (!formData.name.trim()) { Alert.alert('خطأ', 'أدخل اسم المحفظة'); return; }
    const code = generateCode('113');
    
    // ✅ إضافة حساب في الدليل تحت "المحفظة" (113)
    const result = await addAccount({
      id: 'cash-' + Date.now(),
      name: formData.name,
      code,
      type: 'أصل',
      parentId: '113',
      balance: parseFloat(formData.balance) || 0,
      currency,
      isDebit: 1
    });
    
    if (!result.success) {
      Alert.alert('تنبيه', result.error);
      return;
    }
    
    await loadAccounts();
    setShowModal(false);
    setFormData({ name: '', balance: '0' });
    Alert.alert('✅', `تم إضافة "${formData.name}" تحت المحفظة في الدليل`);
  };

  return (
    <View style={[st.c, { paddingTop: insets.top }]}>
      <ControlHeader title="المحافظ" count={cashBoxes.length} onBack={() => router.back()} onAdd={() => { setFormData({ name: '', balance: '0' }); setShowModal(true); }} />
      <ControlButtons showSearch showRefresh onRefresh={loadAccounts} />
      <TextInput style={st.si} placeholder="🔍 بحث..." placeholderTextColor="#94a3b8" value={searchQuery} onChangeText={setSearchQuery} />
      <View style={st.sm}><Text style={st.sl}>إجمالي النقدية</Text><Text style={st.sv}>{totalBalance.toLocaleString()} ﷼</Text></View>
      {cashBoxes.length === 0 ? <Text style={st.et}>لا توجد صناديق</Text> :
        <FlatList data={cashBoxes.filter((b: any) => b.name?.includes(searchQuery))} keyExtractor={(i: any) => i.id} renderItem={({ item }: any) => (
          <View style={st.rc}><Text style={st.rn}>📱 {item.name}</Text><Text style={st.rd}>الرصيد: {item.balance?.toLocaleString()} {item.currency} | الكود: {item.code}</Text></View>
        )} contentContainerStyle={{ padding: 16 }} />}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={st.mo}><View style={st.mc}><View style={st.mh}><Text style={st.mt}>إضافة محفظة</Text><TouchableOpacity onPress={() => setShowModal(false)}><Text style={st.mx}>✕</Text></TouchableOpacity></View>
        <ScrollView style={st.mb}>
          <Text style={st.fl}>الرقم</Text><TextInput style={[st.fi,{color:'#D4AF37'}]} value={boxNumber} editable={false} />
          <CurrencySelector selectedCurrency={currency} exchangeRate="1" onCurrencyChange={(c) => setCurrency(c)} />
          <Text style={st.fl}>اسم المحفظة *</Text><TextInput style={st.fi} value={formData.name} onChangeText={v=>setFormData({...formData,name:v})} placeholder="اسم المحفظة" placeholderTextColor="#666" />
          <Text style={st.fl}>الرصيد الافتتاحي</Text><TextInput style={st.fi} value={formData.balance} onChangeText={v=>setFormData({...formData,balance:v})} keyboardType="numeric" placeholder="0" placeholderTextColor="#666" />
          <Text style={st.hint}>سيظهر تلقائياً في دليل الحسابات تحت "المحفظة"</Text>
          <TouchableOpacity style={st.sb} onPress={handleSave}><Text style={st.sbt}>💾 حفظ</Text></TouchableOpacity>
        </ScrollView></View></View>
      </Modal>
    </View>
  );
}
const st = StyleSheet.create({
  c:{flex:1,backgroundColor:'#0A1128'},si:{marginHorizontal:16,marginBottom:8,padding:12,backgroundColor:'#16213E',borderRadius:10,color:'#FFF',borderWidth:1,borderColor:'#2a3550',textAlign:'right'},et:{color:'#FFF',fontSize:16,textAlign:'center',marginTop:40},
  sm:{marginHorizontal:16,marginBottom:12,padding:16,backgroundColor:'#16213E',borderRadius:14,alignItems:'center',borderWidth:1,borderColor:'#2a3550'},sl:{color:'#94a3b8',fontSize:13},sv:{color:'#D4AF37',fontSize:24,fontWeight:'bold'},
  rc:{backgroundColor:'#16213E',borderRadius:14,padding:14,marginBottom:8,marginHorizontal:16,borderWidth:1,borderColor:'#2a3550'},rn:{color:'#FFF',fontSize:16,fontWeight:'bold'},rd:{color:'#10B981',fontSize:13},
  mo:{flex:1,backgroundColor:'rgba(0,0,0,0.7)',justifyContent:'flex-end'},mc:{backgroundColor:'#16213E',borderTopLeftRadius:20,borderTopRightRadius:20,maxHeight:'70%'},mh:{flexDirection:'row',justifyContent:'space-between',padding:16},mt:{color:'#D4AF37',fontSize:18,fontWeight:'bold'},mx:{color:'#EF4444',fontSize:22},mb:{padding:16},
  fl:{color:'#94a3b8',fontSize:13,marginBottom:6,marginTop:12},fi:{backgroundColor:'#0A1128',borderRadius:10,padding:12,color:'#FFF',borderWidth:1,borderColor:'#2a3550',fontSize:14,textAlign:'right'},
  hint:{color:'#10B981',fontSize:11,textAlign:'center',marginTop:8},sb:{backgroundColor:'#D4AF37',borderRadius:12,padding:14,alignItems:'center',marginTop:20},sbt:{color:'#0A1128',fontSize:16,fontWeight:'bold'},
});
