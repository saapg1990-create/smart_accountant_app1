import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, StatusBar, Alert, Modal, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalTable } from '../../hooks/useLocalStore';
import { useAccountStore } from '../../src/store/useAccountStore';
import { ControlButtons, ControlHeader } from '../../src/components/ui/ControlButtons';

export default function WarehousesScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  useFocusEffect(useCallback(() => { loadAccounts(); }, []));
  const { data: warehouses, add } = useLocalTable('warehouses');
  const { accounts, addAccount, getMainAccounts, generateCode } = useAccountStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', location: '' });

  const filtered = warehouses.filter((w: any) => (w.name || '').includes(searchQuery));

  const handleSave = async () => {
    if (!formData.name) { Alert.alert('خطأ', 'أدخل اسم المستودع'); return; }
    const exists = warehouses.find((w: any) => w.name === formData.name);
    if (exists) { Alert.alert('تنبيه', 'هذا المستودع موجود بالفعل'); return; }
    
    await add(formData);
    let parent = accounts.find((a: any) => a.name === 'المستودعات' && !a.parentId);
    if (!parent) { const c = '1' + (getMainAccounts().length + 1).toString().padStart(2, '0'); await addAccount({ name: 'المستودعات', code: c, type: 'أصل', currency: 'YER', balance: 0, parentId: '' }); }
    parent = accounts.find((a: any) => a.name === 'المستودعات' && !a.parentId);
    if (parent) { const code = generateCode(parent.id); await addAccount({ name: formData.name, code, type: 'أصل', currency: 'YER', balance: 0, parentId: parent.id }); }
    
    setShowModal(false); setFormData({ name: '', location: '' });
    Alert.alert('✅', 'تم إضافة المستودع وإضافته للدليل تلقائياً');
  };

  return (
    <View style={[st.c, { paddingTop: insets.top }]}><StatusBar barStyle="light-content" />
      <ControlHeader title="المستودعات" count={warehouses.length} onBack={() => router.back()} onAdd={() => { setFormData({ name: '', location: '' }); setShowModal(true); }} />
      <ControlButtons showEdit={false} showDelete={false} />
      <TextInput style={st.si} placeholder="🔍 بحث..." placeholderTextColor="#94a3b8" value={searchQuery} onChangeText={setSearchQuery} />
      {filtered.length === 0 ? <View style={st.e}><Text style={st.ei}>🏭</Text><Text style={st.et}>لا توجد مستودعات</Text></View> :
        <FlatList data={filtered} keyExtractor={(i: any) => i.id} renderItem={({ item }: any) => (
          <TouchableOpacity style={st.rc}><Text style={st.ri}>🏭</Text><View style={{ flex: 1 }}><Text style={st.rn}>{item.name}</Text><Text style={st.ru}>{item.location || '-'}</Text></View></TouchableOpacity>
        )} contentContainerStyle={{ padding: 16 }} />}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={st.mo}><View style={[st.mc, { maxHeight: '55%' }]}><View style={st.mh}><Text style={st.mt}>إضافة مستودع</Text><TouchableOpacity onPress={() => setShowModal(false)}><Text style={st.mx}>✕</Text></TouchableOpacity></View>
        <ScrollView style={st.mb}>
          <Text style={st.fl}>اسم المستودع *</Text><TextInput style={st.fi} value={formData.name} onChangeText={v => setFormData({ ...formData, name: v })} placeholder="اسم المستودع" placeholderTextColor="#666" />
          <Text style={st.fl}>الموقع</Text><TextInput style={st.fi} value={formData.location} onChangeText={v => setFormData({ ...formData, location: v })} placeholder="الموقع" placeholderTextColor="#666" />
          <Text style={st.hint}>سيتم إضافته تلقائياً كحساب فرعي في دليل الحسابات</Text>
          <TouchableOpacity style={st.sb} onPress={handleSave}><Text style={st.sbt}>💾 حفظ</Text></TouchableOpacity>
        </ScrollView></View></View>
      </Modal>
    </View>
  );
}
const st = StyleSheet.create({c:{flex:1,backgroundColor:'#0A1128'},si:{marginHorizontal:16,marginBottom:12,padding:12,backgroundColor:'#16213E',borderRadius:10,color:'#FFF',borderWidth:1,borderColor:'#2a3550',textAlign:'right',fontSize:14},e:{flex:1,justifyContent:'center',alignItems:'center'},ei:{fontSize:48,marginBottom:12},et:{color:'#FFF',fontSize:16},rc:{flexDirection:'row',alignItems:'center',backgroundColor:'#16213E',borderRadius:14,padding:14,marginBottom:10,marginHorizontal:16,borderWidth:1,borderColor:'#2a3550'},ri:{fontSize:28,marginRight:10},rn:{color:'#FFF',fontSize:14,fontWeight:'bold',marginBottom:2},ru:{color:'#94a3b8',fontSize:11},mo:{flex:1,backgroundColor:'rgba(0,0,0,0.7)',justifyContent:'flex-end'},mc:{backgroundColor:'#16213E',borderTopLeftRadius:20,borderTopRightRadius:20,maxHeight:'55%'},mh:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:16,borderBottomWidth:1,borderBottomColor:'#2a3550'},mt:{color:'#D4AF37',fontSize:18,fontWeight:'bold'},mx:{color:'#EF4444',fontSize:22,fontWeight:'bold'},mb:{padding:16},fl:{color:'#94a3b8',fontSize:13,marginBottom:6,marginTop:12},fi:{backgroundColor:'#0A1128',borderRadius:10,padding:12,color:'#FFF',borderWidth:1,borderColor:'#2a3550',fontSize:14},hint:{color:'#10B981',fontSize:11,textAlign:'center',marginTop:8},sb:{backgroundColor:'#D4AF37',borderRadius:12,padding:14,alignItems:'center',marginTop:20},sbt:{color:'#0A1128',fontSize:16,fontWeight:'bold'}});
