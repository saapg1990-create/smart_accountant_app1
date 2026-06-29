import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, StatusBar, Alert, Modal, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalTable } from '../../hooks/useLocalStore';
import { useAccountStore } from '../../src/store/useAccountStore';
import { PickerModal } from '../../src/components/ui/PickerModal';
import { ControlButtons, ControlHeader } from '../../src/components/ui/ControlButtons';

export default function ItemsScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  useFocusEffect(useCallback(() => { loadAccounts(); }, []));
  const { data: items, add } = useLocalTable('items');
  const { accounts, addAccount, getMainAccounts, generateCode } = useAccountStore();
  const { data: units } = useLocalTable('units');
  const { data: categories } = useLocalTable('categories');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [formData, setFormData] = useState({ name: '', unit: 'قطعة', category: '', costPrice: '0', salePrice: '0', quantity: '0', minQuantity: '0' });

  const filtered = items.filter((i: any) => (i.name || '').includes(searchQuery));
  const totalValue = items.reduce((s: number, i: any) => s + ((i.quantity || 0) * (i.costPrice || 0)), 0);

  const handleSave = async () => {
    if (!formData.name) { Alert.alert('خطأ', 'أدخل اسم الصنف'); return; }
    const exists = items.find((i: any) => i.name === formData.name);
    if (exists) { Alert.alert('تنبيه', 'هذا الصنف موجود بالفعل'); return; }
    
    await add({ ...formData, costPrice: parseFloat(formData.costPrice) || 0, salePrice: parseFloat(formData.salePrice) || 0, quantity: parseFloat(formData.quantity) || 0 });
    let parent = accounts.find((a: any) => a.name === 'الأصناف' && !a.parentId);
    if (!parent) { const c = '1' + (getMainAccounts().length + 1).toString().padStart(2, '0'); await addAccount({ name: 'الأصناف', code: c, type: 'أصل', currency: 'YER', balance: 0, parentId: '' }); }
    parent = accounts.find((a: any) => a.name === 'الأصناف' && !a.parentId);
    if (parent) { const code = generateCode(parent.id); await addAccount({ name: formData.name, code, type: 'أصل', currency: 'YER', balance: 0, parentId: parent.id }); }
    
    setShowModal(false); setFormData({ name: '', unit: 'قطعة', category: '', costPrice: '0', salePrice: '0', quantity: '0', minQuantity: '0' });
    Alert.alert('✅', 'تم إضافة الصنف وإضافته للدليل تلقائياً');
  };

  return (
    <View style={[st.c, { paddingTop: insets.top }]}><StatusBar barStyle="light-content" />
      <ControlHeader title="الأصناف" count={items.length} onBack={() => router.back()} onAdd={() => { setFormData({ name: '', unit: 'قطعة', category: '', costPrice: '0', salePrice: '0', quantity: '0', minQuantity: '0' }); setShowModal(true); }} />
      <ControlButtons showEdit={false} showDelete={false} />
      <TextInput style={st.si} placeholder="🔍 بحث..." placeholderTextColor="#94a3b8" value={searchQuery} onChangeText={setSearchQuery} />
      <View style={st.sm}><Text style={st.sl}>قيمة المخزون</Text><Text style={st.sv}>{totalValue.toLocaleString()} ﷼</Text></View>
      {filtered.length === 0 ? <View style={st.e}><Text style={st.ei}>📦</Text><Text style={st.et}>لا توجد أصناف</Text></View> :
        <FlatList data={filtered} keyExtractor={(i: any) => i.id} renderItem={({ item }: any) => (
          <TouchableOpacity style={st.rc}><Text style={st.ri}>📦</Text><View style={{ flex: 1 }}><Text style={st.rn}>{item.name}</Text><Text style={st.ru}>{item.unit} | {(item.costPrice||0)} | {(item.salePrice||0)}</Text></View><Text style={st.rbal}>{(item.quantity||0)}</Text></TouchableOpacity>
        )} contentContainerStyle={{ padding: 16 }} />}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={st.mo}><View style={[st.mc, { maxHeight: '80%' }]}><View style={st.mh}><Text style={st.mt}>إضافة صنف</Text><TouchableOpacity onPress={() => setShowModal(false)}><Text style={st.mx}>✕</Text></TouchableOpacity></View>
        <ScrollView style={st.mb}>
          <Text style={st.fl}>اسم الصنف *</Text><TextInput style={st.fi} value={formData.name} onChangeText={v => setFormData({ ...formData, name: v })} placeholder="اسم الصنف" placeholderTextColor="#666" />
          <Text style={st.fl}>الوحدة</Text><TouchableOpacity style={st.pk} onPress={() => setShowUnitPicker(true)}><Text style={st.pkt}>{formData.unit}</Text><Text style={st.pka}>▼</Text></TouchableOpacity>
          <Text style={st.fl}>الفئة</Text><TouchableOpacity style={st.pk} onPress={() => setShowCategoryPicker(true)}><Text style={st.pkt}>{formData.category || 'اختيار'}</Text><Text style={st.pka}>▼</Text></TouchableOpacity>
          <View style={st.rw}><View style={st.hf}><Text style={st.fl}>تكلفة</Text><TextInput style={st.fi} value={formData.costPrice} onChangeText={v => setFormData({ ...formData, costPrice: v })} keyboardType="numeric" /></View><View style={st.hf}><Text style={st.fl}>بيع</Text><TextInput style={st.fi} value={formData.salePrice} onChangeText={v => setFormData({ ...formData, salePrice: v })} keyboardType="numeric" /></View></View>
          <View style={st.rw}><View style={st.hf}><Text style={st.fl}>كمية</Text><TextInput style={st.fi} value={formData.quantity} onChangeText={v => setFormData({ ...formData, quantity: v })} keyboardType="numeric" /></View><View style={st.hf}><Text style={st.fl}>حد أدنى</Text><TextInput style={st.fi} value={formData.minQuantity} onChangeText={v => setFormData({ ...formData, minQuantity: v })} keyboardType="numeric" /></View></View>
          <Text style={st.hint}>سيتم إضافته تلقائياً كحساب فرعي في دليل الحسابات</Text>
          <TouchableOpacity style={st.sb} onPress={handleSave}><Text style={st.sbt}>💾 حفظ</Text></TouchableOpacity>
        </ScrollView></View></View>
      </Modal>
      <PickerModal visible={showUnitPicker} title="اختيار الوحدة" data={units || []} displayField="name" onSelect={(i: any) => setFormData({ ...formData, unit: i.name })} onClose={() => setShowUnitPicker(false)} />
      <PickerModal visible={showCategoryPicker} title="اختيار الفئة" data={categories || []} displayField="name" onSelect={(i: any) => setFormData({ ...formData, category: i.name })} onClose={() => setShowCategoryPicker(false)} />
    </View>
  );
}
const st = StyleSheet.create({c:{flex:1,backgroundColor:'#0A1128'},si:{marginHorizontal:16,marginBottom:12,padding:12,backgroundColor:'#16213E',borderRadius:10,color:'#FFF',borderWidth:1,borderColor:'#2a3550',textAlign:'right',fontSize:14},sm:{marginHorizontal:16,marginBottom:12,padding:16,backgroundColor:'#16213E',borderRadius:14,alignItems:'center',borderWidth:1,borderColor:'#2a3550'},sl:{color:'#94a3b8',fontSize:13,marginBottom:6},sv:{color:'#D4AF37',fontSize:24,fontWeight:'bold'},e:{flex:1,justifyContent:'center',alignItems:'center'},ei:{fontSize:48,marginBottom:12},et:{color:'#FFF',fontSize:16},rc:{flexDirection:'row',alignItems:'center',backgroundColor:'#16213E',borderRadius:14,padding:14,marginBottom:10,marginHorizontal:16,borderWidth:1,borderColor:'#2a3550'},ri:{fontSize:28,marginRight:10},rn:{color:'#FFF',fontSize:14,fontWeight:'bold',marginBottom:2},ru:{color:'#94a3b8',fontSize:11},rbal:{fontSize:16,fontWeight:'bold',color:'#D4AF37'},mo:{flex:1,backgroundColor:'rgba(0,0,0,0.7)',justifyContent:'flex-end'},mc:{backgroundColor:'#16213E',borderTopLeftRadius:20,borderTopRightRadius:20,maxHeight:'80%'},mh:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:16,borderBottomWidth:1,borderBottomColor:'#2a3550'},mt:{color:'#D4AF37',fontSize:18,fontWeight:'bold'},mx:{color:'#EF4444',fontSize:22,fontWeight:'bold'},mb:{padding:16},fl:{color:'#94a3b8',fontSize:13,marginBottom:6,marginTop:12},fi:{backgroundColor:'#0A1128',borderRadius:10,padding:12,color:'#FFF',borderWidth:1,borderColor:'#2a3550',fontSize:14},pk:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',backgroundColor:'#0A1128',borderRadius:10,padding:14,borderWidth:1,borderColor:'#2a3550'},pkt:{color:'#FFF',fontSize:14,flex:1},pkp:{color:'#666',fontSize:14,flex:1},pka:{color:'#D4AF37',fontSize:12,marginLeft:8},rw:{flexDirection:'row',gap:8},hf:{flex:1},hint:{color:'#10B981',fontSize:11,textAlign:'center',marginTop:8},sb:{backgroundColor:'#D4AF37',borderRadius:12,padding:14,alignItems:'center',marginTop:20},sbt:{color:'#0A1128',fontSize:16,fontWeight:'bold'}});
