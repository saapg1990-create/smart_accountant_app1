import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, StatusBar, Alert, Modal, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalTable } from '../../hooks/useLocalStore';
import { useAccountStore } from '../../src/store/useAccountStore';
import { PickerModal } from '../../src/components/ui/PickerModal';
import { ControlButtons, ControlHeader } from '../../src/components/ui/ControlButtons';

export default function SuppliersScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  useFocusEffect(useCallback(() => { loadAccounts(); }, []));
  const { data: suppliers, add } = useLocalTable('suppliers');
  const { data: currencies } = useLocalTable('currencies');
  const { accounts, addAccount, getMainAccounts, generateCode } = useAccountStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', address: '', currency: 'YER', balance: '0', creditLimit: '0' });

  const filtered = suppliers.filter((c: any) => (c.name || '').includes(searchQuery) || (c.phone || '').includes(searchQuery));
  const totalBalance = suppliers.reduce((s: number, c: any) => s + (c.balance || 0), 0);

  const getOrCreateParent = async (parentName: string): Promise<string> => {
    let parent = accounts.find((a: any) => a.name === parentName && !a.parentId);
    if (parent) return parent.id;
    const mainAccounts = getMainAccounts();
    const code = '1' + (mainAccounts.length + 1).toString().padStart(2, '0');
    await addAccount({ name: parentName, code, type: 'أصل', currency: 'YER', balance: 0, parentId: '' });
    return '';
  };

  const handleSave = async () => {
    if (!formData.name) { Alert.alert('خطأ', 'أدخل اسم المورد'); return; }
    const exists = suppliers.find((c: any) => c.name === formData.name);
    if (exists) { Alert.alert('تنبيه', 'هذا المورد موجود بالفعل'); return; }
    
    await add({ ...formData, balance: parseFloat(formData.balance) || 0, creditLimit: parseFloat(formData.creditLimit) || 0 });
    await getOrCreateParent('الموردين');
    const parent = accounts.find((a: any) => a.name === 'الموردين' && !a.parentId);
    if (parent) {
      const code = generateCode(parent.id);
      await addAccount({ name: formData.name, code, type: 'أصل', currency: formData.currency, balance: parseFloat(formData.balance) || 0, parentId: parent.id });
    }
    
    setShowModal(false); setFormData({ name: '', phone: '', address: '', currency: 'YER', balance: '0', creditLimit: '0' });
    Alert.alert('✅', 'تم إضافة المورد وإضافته للدليل تلقائياً');
  };

  return (
    <View style={[st.c, { paddingTop: insets.top }]}><StatusBar barStyle="light-content" />
      <ControlHeader title="الموردين" count={suppliers.length} onBack={() => router.back()} onAdd={() => { setFormData({ name: '', phone: '', address: '', currency: 'YER', balance: '0', creditLimit: '0' }); setShowModal(true); }} />
      <ControlButtons showEdit={false} showDelete={false} />
      <TextInput style={st.si} placeholder="🔍 بحث..." placeholderTextColor="#94a3b8" value={searchQuery} onChangeText={setSearchQuery} />
      <View style={st.sm}><Text style={st.sl}>إجمالي الذمم</Text><Text style={st.sv}>{totalBalance.toLocaleString()} ﷼</Text></View>
      {filtered.length === 0 ? <View style={st.e}><Text style={st.ei}>👥</Text><Text style={st.et}>لا يوجد عملاء</Text></View> :
        <FlatList data={filtered} keyExtractor={(i: any) => i.id} renderItem={({ item }: any) => (
          <TouchableOpacity style={st.rc}><Text style={st.ri}>👤</Text><View style={{ flex: 1 }}><Text style={st.rn}>{item.name}</Text><Text style={st.ru}>{item.phone || '-'} | {item.currency}</Text></View><Text style={[st.rbal, { color: (item.balance || 0) >= 0 ? '#10B981' : '#EF4444' }]}>{(item.balance || 0).toLocaleString()} ﷼</Text></TouchableOpacity>
        )} contentContainerStyle={{ padding: 16 }} />}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={st.mo}><View style={[st.mc, { maxHeight: '75%' }]}><View style={st.mh}><Text style={st.mt}>إضافة مورد</Text><TouchableOpacity onPress={() => setShowModal(false)}><Text style={st.mx}>✕</Text></TouchableOpacity></View>
        <ScrollView style={st.mb}>
          <Text style={st.fl}>اسم المورد *</Text><TextInput style={st.fi} value={formData.name} onChangeText={v => setFormData({ ...formData, name: v })} placeholder="اسم المورد" placeholderTextColor="#666" />
          <Text style={st.fl}>رقم الهاتف</Text><TextInput style={st.fi} value={formData.phone} onChangeText={v => setFormData({ ...formData, phone: v })} placeholder="رقم الهاتف" placeholderTextColor="#666" />
          <Text style={st.fl}>العنوان</Text><TextInput style={st.fi} value={formData.address} onChangeText={v => setFormData({ ...formData, address: v })} placeholder="العنوان" placeholderTextColor="#666" />
          <Text style={st.fl}>العملة</Text><TouchableOpacity style={st.pk} onPress={() => setShowCurrencyPicker(true)}><Text style={st.pkt}>{formData.currency}</Text><Text style={st.pka}>▼</Text></TouchableOpacity>
          <Text style={st.fl}>الرصيد</Text><TextInput style={st.fi} value={formData.balance} onChangeText={v => setFormData({ ...formData, balance: v })} keyboardType="numeric" placeholder="0" placeholderTextColor="#666" />
          <Text style={st.fl}>الحد الائتماني</Text><TextInput style={st.fi} value={formData.creditLimit} onChangeText={v => setFormData({ ...formData, creditLimit: v })} keyboardType="numeric" placeholder="0" placeholderTextColor="#666" />
          <Text style={st.hint}>سيتم إضافته تلقائياً كحساب فرعي في دليل الحسابات</Text>
          <TouchableOpacity style={st.sb} onPress={handleSave}><Text style={st.sbt}>💾 حفظ</Text></TouchableOpacity>
        </ScrollView></View></View>
      </Modal>
      <PickerModal visible={showCurrencyPicker} title="اختيار العملة" data={currencies || []} displayField="code" onSelect={(i: any) => setFormData({ ...formData, currency: i.code })} onClose={() => setShowCurrencyPicker(false)} />
    </View>
  );
}
const st = StyleSheet.create({c:{flex:1,backgroundColor:'#0A1128'},si:{marginHorizontal:16,marginBottom:12,padding:12,backgroundColor:'#16213E',borderRadius:10,color:'#FFF',borderWidth:1,borderColor:'#2a3550',textAlign:'right',fontSize:14},sm:{marginHorizontal:16,marginBottom:12,padding:16,backgroundColor:'#16213E',borderRadius:14,alignItems:'center',borderWidth:1,borderColor:'#2a3550'},sl:{color:'#94a3b8',fontSize:13,marginBottom:6},sv:{color:'#D4AF37',fontSize:24,fontWeight:'bold'},e:{flex:1,justifyContent:'center',alignItems:'center'},ei:{fontSize:48,marginBottom:12},et:{color:'#FFF',fontSize:16},rc:{flexDirection:'row',alignItems:'center',backgroundColor:'#16213E',borderRadius:14,padding:14,marginBottom:10,marginHorizontal:16,borderWidth:1,borderColor:'#2a3550'},ri:{fontSize:28,marginRight:10},rn:{color:'#FFF',fontSize:14,fontWeight:'bold',marginBottom:2},ru:{color:'#94a3b8',fontSize:11},rbal:{fontSize:16,fontWeight:'bold'},mo:{flex:1,backgroundColor:'rgba(0,0,0,0.7)',justifyContent:'flex-end'},mc:{backgroundColor:'#16213E',borderTopLeftRadius:20,borderTopRightRadius:20,maxHeight:'75%'},mh:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:16,borderBottomWidth:1,borderBottomColor:'#2a3550'},mt:{color:'#D4AF37',fontSize:18,fontWeight:'bold'},mx:{color:'#EF4444',fontSize:22,fontWeight:'bold'},mb:{padding:16},fl:{color:'#94a3b8',fontSize:13,marginBottom:6,marginTop:12},fi:{backgroundColor:'#0A1128',borderRadius:10,padding:12,color:'#FFF',borderWidth:1,borderColor:'#2a3550',fontSize:14},pk:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',backgroundColor:'#0A1128',borderRadius:10,padding:14,borderWidth:1,borderColor:'#2a3550'},pkt:{color:'#FFF',fontSize:14,flex:1},pkp:{color:'#666',fontSize:14,flex:1},pka:{color:'#D4AF37',fontSize:12,marginLeft:8},hint:{color:'#10B981',fontSize:11,textAlign:'center',marginTop:8},sb:{backgroundColor:'#D4AF37',borderRadius:12,padding:14,alignItems:'center',marginTop:20},sbt:{color:'#0A1128',fontSize:16,fontWeight:'bold'}});
