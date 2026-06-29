import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, StatusBar, Alert, Modal, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalTable } from '../../hooks/useLocalStore';
import { useAccountStore } from '../../src/store/useAccountStore';
import { ControlButtons, ControlHeader } from '../../src/components/ui/ControlButtons';

export default function CurrenciesScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  useFocusEffect(useCallback(() => { loadAccounts(); }, []));
  const { data: currencies, add, remove } = useLocalTable('currencies');
  const { accounts, addAccount, getMainAccounts, generateCode } = useAccountStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ code: '', name: '', symbol: '', rate: '1', isDefault: false });

  const filtered = currencies.filter((c: any) => (c.name || '').includes(searchQuery) || (c.code || '').includes(searchQuery));

  const handleSave = async () => {
    if (!formData.code || !formData.name) { Alert.alert('خطأ', 'أدخل كود واسم العملة'); return; }
    const exists = currencies.find((c: any) => c.code === formData.code);
    if (exists) { Alert.alert('تنبيه', 'هذه العملة موجودة بالفعل'); return; }
    
    await add({ ...formData, rate: parseFloat(formData.rate) || 1 });
    let parent = accounts.find((a: any) => a.name === 'العملات الأجنبية' && !a.parentId);
    if (!parent) { const c = '1' + (getMainAccounts().length + 1).toString().padStart(2, '0'); await addAccount({ name: 'العملات الأجنبية', code: c, type: 'أصل', currency: 'YER', balance: 0, parentId: '' }); }
    parent = accounts.find((a: any) => a.name === 'العملات الأجنبية' && !a.parentId);
    if (parent) { const code = generateCode(parent.id); await addAccount({ name: formData.name, code, type: 'أصل', currency: formData.code, balance: 0, parentId: parent.id }); }
    
    setShowModal(false); setFormData({ code: '', name: '', symbol: '', rate: '1', isDefault: false });
    Alert.alert('✅', 'تم إضافة العملة وإضافتها للدليل تلقائياً');
  };

  return (
    <View style={[st.c, { paddingTop: insets.top }]}><StatusBar barStyle="light-content" />
      <ControlHeader title="العملات" count={currencies.length} onBack={() => router.back()} onAdd={() => { setFormData({ code: '', name: '', symbol: '', rate: '1', isDefault: false }); setShowModal(true); }} />
      <ControlButtons showEdit={false} showDelete={false} />
      <TextInput style={st.si} placeholder="🔍 بحث..." placeholderTextColor="#94a3b8" value={searchQuery} onChangeText={setSearchQuery} />
      {filtered.length === 0 ? <View style={st.e}><Text style={st.ei}>💱</Text><Text style={st.et}>لا توجد عملات</Text></View> :
        <FlatList data={filtered} keyExtractor={(i: any) => i.id} renderItem={({ item }: any) => (
          <TouchableOpacity style={st.rc} onLongPress={() => Alert.alert('حذف', `حذف "${item.name}"؟`, [{ text: 'حذف', style: 'destructive', onPress: () => remove(item.id) }, { text: 'إلغاء' }])}>
            <Text style={st.ri}>{item.symbol || '¤'}</Text><View style={{ flex: 1 }}><Text style={st.rn}>{item.name}</Text><Text style={st.ru}>{item.code} | 1 = {item.rate} ﷼</Text></View>{item.isDefault && <View style={st.def}><Text style={st.defT}>أساسي</Text></View>}
          </TouchableOpacity>
        )} contentContainerStyle={{ padding: 16 }} />}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={st.mo}><View style={[st.mc, { maxHeight: '70%' }]}><View style={st.mh}><Text style={st.mt}>إضافة عملة</Text><TouchableOpacity onPress={() => setShowModal(false)}><Text style={st.mx}>✕</Text></TouchableOpacity></View>
        <ScrollView style={st.mb}>
          <Text style={st.fl}>كود العملة *</Text><TextInput style={st.fi} value={formData.code} onChangeText={v => setFormData({ ...formData, code: v.toUpperCase() })} placeholder="USD" placeholderTextColor="#666" maxLength={4} />
          <Text style={st.fl}>اسم العملة *</Text><TextInput style={st.fi} value={formData.name} onChangeText={v => setFormData({ ...formData, name: v })} placeholder="دولار أمريكي" placeholderTextColor="#666" />
          <Text style={st.fl}>الرمز</Text><TextInput style={st.fi} value={formData.symbol} onChangeText={v => setFormData({ ...formData, symbol: v })} placeholder="$" placeholderTextColor="#666" />
          <Text style={st.fl}>سعر الصرف</Text><TextInput style={st.fi} value={formData.rate} onChangeText={v => setFormData({ ...formData, rate: v })} keyboardType="numeric" placeholder="1" placeholderTextColor="#666" />
          <Text style={st.hint}>سيتم إضافتها تلقائياً كحساب فرعي في دليل الحسابات</Text>
          <TouchableOpacity style={st.sb} onPress={handleSave}><Text style={st.sbt}>💾 حفظ</Text></TouchableOpacity>
        </ScrollView></View></View>
      </Modal>
    </View>
  );
}
const st = StyleSheet.create({c:{flex:1,backgroundColor:'#0A1128'},si:{marginHorizontal:16,marginBottom:12,padding:12,backgroundColor:'#16213E',borderRadius:10,color:'#FFF',borderWidth:1,borderColor:'#2a3550',textAlign:'right',fontSize:14},e:{flex:1,justifyContent:'center',alignItems:'center'},ei:{fontSize:48,marginBottom:12},et:{color:'#FFF',fontSize:16},rc:{flexDirection:'row',alignItems:'center',backgroundColor:'#16213E',borderRadius:14,padding:14,marginBottom:10,marginHorizontal:16,borderWidth:1,borderColor:'#2a3550'},ri:{fontSize:28,marginRight:10,color:'#D4AF37'},rn:{color:'#FFF',fontSize:14,fontWeight:'bold',marginBottom:2},ru:{color:'#94a3b8',fontSize:11},def:{backgroundColor:'#D4AF37'+'20',paddingHorizontal:8,paddingVertical:3,borderRadius:8},defT:{color:'#D4AF37',fontSize:10,fontWeight:'bold'},mo:{flex:1,backgroundColor:'rgba(0,0,0,0.7)',justifyContent:'flex-end'},mc:{backgroundColor:'#16213E',borderTopLeftRadius:20,borderTopRightRadius:20,maxHeight:'70%'},mh:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:16,borderBottomWidth:1,borderBottomColor:'#2a3550'},mt:{color:'#D4AF37',fontSize:18,fontWeight:'bold'},mx:{color:'#EF4444',fontSize:22,fontWeight:'bold'},mb:{padding:16},fl:{color:'#94a3b8',fontSize:13,marginBottom:6,marginTop:12},fi:{backgroundColor:'#0A1128',borderRadius:10,padding:12,color:'#FFF',borderWidth:1,borderColor:'#2a3550',fontSize:14},hint:{color:'#10B981',fontSize:11,textAlign:'center',marginTop:8},sb:{backgroundColor:'#D4AF37',borderRadius:12,padding:14,alignItems:'center',marginTop:20},sbt:{color:'#0A1128',fontSize:16,fontWeight:'bold'}});
