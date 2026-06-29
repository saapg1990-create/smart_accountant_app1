import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, StatusBar, Alert, Modal, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalTable } from '../../hooks/useLocalStore';
import { ControlButtons, ControlHeader } from '../../src/components/ui/ControlButtons';

export default function CurrenciesScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const { data: currencies, add, remove } = useLocalTable('currencies');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ code: '', name: '', symbol: '', rate: '1' });

  const filtered = currencies.filter((c: any) => (c.name || '').includes(searchQuery) || (c.code || '').includes(searchQuery));

  const handleSave = async () => {
    if (!formData.code || !formData.name) { Alert.alert('خطأ', 'أدخل كود واسم العملة'); return; }
    const exists = currencies.find((c: any) => c.code === formData.code);
    if (exists) { Alert.alert('تنبيه', 'هذه العملة موجودة بالفعل'); return; }
    await add({ ...formData, rate: parseFloat(formData.rate) || 1 });
    setShowModal(false); setFormData({ code: '', name: '', symbol: '', rate: '1' });
  };

  return (
    <View style={[st.c, { paddingTop: insets.top }]}><StatusBar barStyle="light-content" />
      <ControlHeader title="العملات" count={currencies.length} onBack={() => router.back()} onAdd={() => { setFormData({ code: '', name: '', symbol: '', rate: '1' }); setShowModal(true); }} />
      <ControlButtons showEdit={false} showDelete={false} />
      <TextInput style={st.si} placeholder="🔍 بحث..." placeholderTextColor="#94a3b8" value={searchQuery} onChangeText={setSearchQuery} />
      {filtered.length === 0 ? <View style={st.e}><Text style={st.ei}>💱</Text><Text style={st.et}>لا توجد عملات</Text></View> :
        <FlatList data={filtered} keyExtractor={(i: any) => i.id} renderItem={({ item }: any) => (
          <TouchableOpacity style={st.rc} onLongPress={() => Alert.alert('حذف', `حذف "${item.name}"؟`, [{ text: 'حذف', style: 'destructive', onPress: () => remove(item.id) }, { text: 'إلغاء' }])}>
            <Text style={st.ri}>{item.symbol || '¤'}</Text><View style={{ flex: 1 }}><Text style={st.rn}>{item.name} ({item.code})</Text><Text style={st.ru}>1 = {item.rate} ﷼</Text></View>
          </TouchableOpacity>
        )} contentContainerStyle={{ padding: 16 }} />}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={st.mo}><View style={[st.mc, { maxHeight: '65%' }]}><View style={st.mh}><Text style={st.mt}>إضافة عملة</Text><TouchableOpacity onPress={() => setShowModal(false)}><Text style={st.mx}>✕</Text></TouchableOpacity></View>
        <ScrollView style={st.mb}>
          <Text style={st.fl}>كود العملة *</Text><TextInput style={st.fi} value={formData.code} onChangeText={v => setFormData({ ...formData, code: v.toUpperCase() })} placeholder="USD" placeholderTextColor="#666" maxLength={4} autoCapitalize="characters" />
          <Text style={st.fl}>اسم العملة *</Text><TextInput style={st.fi} value={formData.name} onChangeText={v => setFormData({ ...formData, name: v })} placeholder="دولار أمريكي" placeholderTextColor="#666" />
          <Text style={st.fl}>الرمز</Text><TextInput style={st.fi} value={formData.symbol} onChangeText={v => setFormData({ ...formData, symbol: v })} placeholder="$" placeholderTextColor="#666" />
          <Text style={st.fl}>سعر الصرف</Text><TextInput style={st.fi} value={formData.rate} onChangeText={v => setFormData({ ...formData, rate: v })} keyboardType="numeric" placeholder="1" placeholderTextColor="#666" />
          <TouchableOpacity style={st.sb} onPress={handleSave}><Text style={st.sbt}>💾 حفظ</Text></TouchableOpacity>
        </ScrollView></View></View>
      </Modal>
    </View>
  );
}
const st = StyleSheet.create({c:{flex:1,backgroundColor:'#0A1128'},si:{marginHorizontal:16,marginBottom:12,padding:12,backgroundColor:'#16213E',borderRadius:10,color:'#FFF',borderWidth:1,borderColor:'#2a3550',textAlign:'right',fontSize:14},e:{flex:1,justifyContent:'center',alignItems:'center'},ei:{fontSize:48,marginBottom:12},et:{color:'#FFF',fontSize:16},rc:{flexDirection:'row',alignItems:'center',backgroundColor:'#16213E',borderRadius:14,padding:14,marginBottom:10,marginHorizontal:16,borderWidth:1,borderColor:'#2a3550'},ri:{fontSize:28,marginRight:10,color:'#D4AF37'},rn:{color:'#FFF',fontSize:14,fontWeight:'bold'},ru:{color:'#94a3b8',fontSize:11},mo:{flex:1,backgroundColor:'rgba(0,0,0,0.7)',justifyContent:'flex-end'},mc:{backgroundColor:'#16213E',borderTopLeftRadius:20,borderTopRightRadius:20,maxHeight:'65%'},mh:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:16,borderBottomWidth:1,borderBottomColor:'#2a3550'},mt:{color:'#D4AF37',fontSize:18,fontWeight:'bold'},mx:{color:'#EF4444',fontSize:22,fontWeight:'bold'},mb:{padding:16},fl:{color:'#94a3b8',fontSize:13,marginBottom:6,marginTop:12},fi:{backgroundColor:'#0A1128',borderRadius:10,padding:12,color:'#FFF',borderWidth:1,borderColor:'#2a3550',fontSize:14},sb:{backgroundColor:'#D4AF37',borderRadius:12,padding:14,alignItems:'center',marginTop:20},sbt:{color:'#0A1128',fontSize:16,fontWeight:'bold'}});
