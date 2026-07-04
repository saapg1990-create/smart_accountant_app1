import { DataService } from '../src/services/dataService';
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, StatusBar, Alert, Modal, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import { useLocalTable } from '../../hooks/useLocalStore';
import { useAccountStore } from '../../src/store/useAccountStore';
import { PickerModal } from '../../src/components/ui/PickerModal';
import { ControlButtons, ControlHeader } from '../../src/components/ui/ControlButtons';

export default function CashBoxesScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const { data: cashBoxes, add } = useLocalTable('cashBoxes');
  const { data: currencies } = useLocalTable('currencies');
  const { addAccount, loadAccounts, generateCode } = useAccountStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [formData, setFormData] = useState({ name: '', currency: 'YER', balance: '' });

  useFocusEffect(useCallback(() => { loadAccounts(); }, []));

  useFocusEffect(useCallback(() => { loadAccounts(); }, []));

  const filtered = cashBoxes.filter((b: any) => (b.name || '').includes(searchQuery));
  const totalBalance = cashBoxes.reduce((s: number, b: any) => s + (b.balance || 0), 0);

  const handleSave = async () => {
    if (!formData.name) { Alert.alert('خطأ', 'أدخل اسم الصندوق'); return; }
    
    // إضافة للصناديق
    const boxId = 'cash-' + Date.now();
    await add({ id: boxId, ...formData, balance: parseFloat(formData.balance) || 0 });
    
    // ✅ إضافة حساب في الدليل تحت "الأصول المتداولة" (id=11)
    const code = generateCode('11');
    await addAccount({
      id: boxId,
      name: formData.name,
      code,
      type: 'أصل',
      parentId: '111',
      balance: parseFloat(formData.balance) || 0,
      currency: formData.currency
    });
    
    await loadAccounts();
    setShowModal(false); 
    setFormData({ name: '', currency: 'YER', balance: '' });
    Alert.alert('✅', 'تم إضافة الصندوق وإضافته تحت الأصول المتداولة');
  };

  return (
    <View style={[st.c, { paddingTop: insets.top }]}><StatusBar barStyle="light-content" />
      <ControlHeader title="الصناديق" count={cashBoxes.length} onBack={() => router.back()} onAdd={() => { setFormData({ name: '', currency: 'YER', balance: '' }); setShowModal(true); }} />
      <TextInput style={st.si} placeholder="🔍 بحث..." placeholderTextColor="#94a3b8" value={searchQuery} onChangeText={setSearchQuery} />
      <View style={st.sm}><Text style={st.sl}>إجمالي النقدية</Text><Text style={st.sv}>{totalBalance.toLocaleString()} ﷼</Text></View>
      {filtered.length === 0 ? <View style={st.e}><Text style={st.et}>لا توجد صناديق</Text></View> :
        <FlatList data={filtered} keyExtractor={(i: any) => i.id} renderItem={({ item }: any) => (
          <TouchableOpacity style={st.rc}><Text style={st.ri}>💰</Text><View style={{ flex: 1 }}><Text style={st.rn}>{item.name}</Text><Text style={st.ru}>{item.currency}</Text></View><Text style={[st.rbal, { color: (item.balance || 0) >= 0 ? '#10B981' : '#EF4444' }]}>{(item.balance || 0).toLocaleString()} ﷼</Text></TouchableOpacity>
        )} contentContainerStyle={{ padding: 16 }} />}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={st.mo}><View style={[st.mc, { maxHeight: '60%' }]}><View style={st.mh}><Text style={st.mt}>إضافة صندوق</Text><TouchableOpacity onPress={() => setShowModal(false)}><Text style={st.mx}>✕</Text></TouchableOpacity></View>
        <ScrollView style={st.mb}>
          <Text style={st.fl}>اسم الصندوق *</Text><TextInput style={st.fi} value={formData.name} onChangeText={v => setFormData({ ...formData, name: v })} placeholder="اسم الصندوق" placeholderTextColor="#666" />
          <Text style={st.fl}>العملة</Text><TouchableOpacity style={st.pk} onPress={() => setShowCurrencyPicker(true)}><Text style={st.pkt}>{formData.currency}</Text><Text style={st.pka}>▼</Text></TouchableOpacity>
          <Text style={st.fl}>الرصيد الافتتاحي</Text><TextInput style={st.fi} value={formData.balance} onChangeText={v => setFormData({ ...formData, balance: v })} keyboardType="numeric" placeholder="0" placeholderTextColor="#666" />
          <Text style={st.hint}>سيتم إضافته تحت "الأصول المتداولة" في الدليل</Text>
          <TouchableOpacity style={st.sb} onPress={handleSave}><Text style={st.sbt}>💾 حفظ</Text></TouchableOpacity>
        </ScrollView></View></View>
      </Modal>
      <PickerModal visible={showCurrencyPicker} title="اختيار العملة" data={currencies || []} displayField="code" onSelect={(i: any) => setFormData({ ...formData, currency: i.code })} onClose={() => setShowCurrencyPicker(false)} />
    </View>
  );
}
const st = StyleSheet.create({c:{flex:1,backgroundColor:'#0A1128'},si:{marginHorizontal:16,marginBottom:12,padding:12,backgroundColor:'#16213E',borderRadius:10,color:'#FFF',borderWidth:1,borderColor:'#2a3550',textAlign:'right',fontSize:14},sm:{marginHorizontal:16,marginBottom:12,padding:16,backgroundColor:'#16213E',borderRadius:14,alignItems:'center',borderWidth:1,borderColor:'#2a3550'},sl:{color:'#94a3b8',fontSize:13,marginBottom:6},sv:{color:'#D4AF37',fontSize:24,fontWeight:'bold'},e:{flex:1,justifyContent:'center',alignItems:'center'},et:{color:'#FFF',fontSize:16},rc:{flexDirection:'row',alignItems:'center',backgroundColor:'#16213E',borderRadius:14,padding:14,marginBottom:10,marginHorizontal:16,borderWidth:1,borderColor:'#2a3550'},ri:{fontSize:28,marginRight:10},rn:{color:'#FFF',fontSize:14,fontWeight:'bold',marginBottom:2},ru:{color:'#94a3b8',fontSize:11},rbal:{fontSize:16,fontWeight:'bold'},mo:{flex:1,backgroundColor:'rgba(0,0,0,0.7)',justifyContent:'flex-end'},mc:{backgroundColor:'#16213E',borderTopLeftRadius:20,borderTopRightRadius:20,maxHeight:'60%'},mh:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:16,borderBottomWidth:1,borderBottomColor:'#2a3550'},mt:{color:'#D4AF37',fontSize:18,fontWeight:'bold'},mx:{color:'#EF4444',fontSize:22,fontWeight:'bold'},mb:{padding:16},fl:{color:'#94a3b8',fontSize:13,marginBottom:6,marginTop:12},fi:{backgroundColor:'#0A1128',borderRadius:10,padding:12,color:'#FFF',borderWidth:1,borderColor:'#2a3550',fontSize:14},pk:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',backgroundColor:'#0A1128',borderRadius:10,padding:14,borderWidth:1,borderColor:'#2a3550'},pkt:{color:'#FFF',fontSize:14,flex:1},pka:{color:'#D4AF37',fontSize:12,marginLeft:8},hint:{color:'#10B981',fontSize:11,textAlign:'center',marginTop:8},sb:{backgroundColor:'#D4AF37',borderRadius:12,padding:14,alignItems:'center',marginTop:20},sbt:{color:'#0A1128',fontSize:16,fontWeight:'bold'}});
