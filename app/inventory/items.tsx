import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Modal, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DataService } from '../../src/services/dataService';
import { PickerModal } from '../../src/components/ui/PickerModal';
import { ControlButtons, ControlHeader } from '../../src/components/ui/ControlButtons';

export default function ItemsScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const [items, setItems] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', unitName: '', groupName: '', warehouseName: '', cost: '', price: '', quantity: '' });
  const [showGroup, setShowGroup] = useState(false);
  const [showUnit, setShowUnit] = useState(false);
  const [showWarehouse, setShowWarehouse] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(useCallback(() => { loadAll(); }, []));
  const loadAll = async () => {
    setItems(await DataService.getItems() || []);
    setGroups(await DataService.getGroups() || []);
    setUnits(await DataService.getUnits() || []);
    setWarehouses(await DataService.getWarehouses() || []);
  };

  const openAdd = () => { setForm({ name: '', code: '', unitName: '', groupName: '', warehouseName: '', cost: '', price: '', quantity: '' }); setShowForm(true); };
  const handleSave = async () => {
    if (!form.name.trim()) return Alert.alert('خطأ', 'أدخل اسم الصنف');
    await DataService.addItem({ id: 'item-' + Date.now(), ...form, cost: parseFloat(form.cost)||0, price: parseFloat(form.price)||0, quantity: parseFloat(form.quantity)||0, code: form.code || 'IT-' + Date.now().toString().slice(-4) });
    setShowForm(false); loadAll();
  };

  return (
    <View style={[st.c, { paddingTop: insets.top }]}>
      <ControlHeader title="الأصناف" count={items.length} onBack={() => router.back()} onAdd={openAdd} />
      <ControlButtons showAdd showSearch showPrint showRefresh onAdd={openAdd} onRefresh={loadAll} />
      <TextInput style={st.si} placeholder="🔍 بحث..." placeholderTextColor="#666" value={searchQuery} onChangeText={setSearchQuery} />
      {showForm && (
        <Modal visible={showForm} animationType="slide" transparent>
          <View style={st.mo}><View style={st.mc}><View style={st.mh}><Text style={st.mt}>صنف جديد</Text><TouchableOpacity onPress={()=>setShowForm(false)}><Text style={st.mx}>✕</Text></TouchableOpacity></View>
          <ScrollView style={{padding:16}}>
            <Text style={st.fl}>الاسم *</Text><TextInput style={st.fi} value={form.name} onChangeText={v=>setForm({...form,name:v})} />
            <Text style={st.fl}>الكود</Text><TextInput style={st.fi} value={form.code} onChangeText={v=>setForm({...form,code:v})} />
            <Text style={st.fl}>المجموعة</Text>
            <TouchableOpacity style={st.pk} onPress={()=>setShowGroup(true)}><Text style={form.groupName?st.pkt:st.pkp}>{form.groupName||'اختيار'}</Text><Text style={st.pka}>▼</Text></TouchableOpacity>
            <Text style={st.fl}>الوحدة</Text>
            <TouchableOpacity style={st.pk} onPress={()=>setShowUnit(true)}><Text style={form.unitName?st.pkt:st.pkp}>{form.unitName||'اختيار'}</Text><Text style={st.pka}>▼</Text></TouchableOpacity>
            <Text style={st.fl}>المخزن</Text>
            <TouchableOpacity style={st.pk} onPress={()=>setShowWarehouse(true)}><Text style={form.warehouseName?st.pkt:st.pkp}>{form.warehouseName||'اختيار'}</Text><Text style={st.pka}>▼</Text></TouchableOpacity>
            <View style={{flexDirection:'row',gap:8}}>
              <View style={{flex:1}}><Text style={st.fl}>التكلفة</Text><TextInput style={st.fi} value={form.cost} onChangeText={v=>setForm({...form,cost:v})} keyboardType="numeric" /></View>
              <View style={{flex:1}}><Text style={st.fl}>السعر</Text><TextInput style={st.fi} value={form.price} onChangeText={v=>setForm({...form,price:v})} keyboardType="numeric" /></View>
            </View>
            <Text style={st.fl}>الكمية</Text><TextInput style={st.fi} value={form.quantity} onChangeText={v=>setForm({...form,quantity:v})} keyboardType="numeric" />
            <TouchableOpacity style={st.sb} onPress={handleSave}><Text style={st.sbt}>💾 حفظ</Text></TouchableOpacity>
          </ScrollView></View></View>
        </Modal>
      )}
      <FlatList data={items.filter((i:any) => i.name?.includes(searchQuery) || i.code?.includes(searchQuery))} keyExtractor={i => i.id} renderItem={({item}) => (
        <View style={st.card}>
          <Text style={st.cn}>{item.name} ({item.code})</Text>
          <Text style={st.cd}>📁 {item.groupName} | 📐 {item.unitName} | 🏭 {item.warehouseName}</Text>
          <Text style={st.cd}>💰 شراء: {item.cost} | بيع: {item.price} | 📦 {item.quantity}</Text>
        </View>
      )} ListEmptyComponent={<Text style={st.et}>لا توجد أصناف</Text>} contentContainerStyle={{padding:12}} />
      <PickerModal visible={showGroup} title="اختيار المجموعة" data={groups} displayField="name" onSelect={(i:any)=>setForm({...form,groupName:i.name})} onClose={()=>setShowGroup(false)} />
      <PickerModal visible={showUnit} title="اختيار الوحدة" data={units} displayField="name" onSelect={(i:any)=>setForm({...form,unitName:i.name})} onClose={()=>setShowUnit(false)} />
      <PickerModal visible={showWarehouse} title="اختيار المخزن" data={warehouses} displayField="name" onSelect={(i:any)=>setForm({...form,warehouseName:i.name})} onClose={()=>setShowWarehouse(false)} />
    </View>
  );
}
const st = StyleSheet.create({
  c:{flex:1,backgroundColor:'#0A1128'},si:{marginHorizontal:12,marginBottom:8,padding:10,backgroundColor:'#16213E',borderRadius:10,color:'#FFF',borderWidth:1,borderColor:'#2a3550',textAlign:'right'},
  mo:{flex:1,backgroundColor:'rgba(0,0,0,0.7)',justifyContent:'flex-end'},mc:{backgroundColor:'#16213E',borderTopLeftRadius:20,borderTopRightRadius:20,maxHeight:'90%'},
  mh:{flexDirection:'row',justifyContent:'space-between',padding:16},mt:{color:'#D4AF37',fontSize:16,fontWeight:'bold'},mx:{color:'#EF4444',fontSize:22},
  fl:{color:'#94a3b8',fontSize:13,marginBottom:6,marginTop:10},fi:{backgroundColor:'#0A1128',color:'#FFF',padding:10,borderRadius:8,textAlign:'right'},
  pk:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',backgroundColor:'#0A1128',padding:12,borderRadius:8,borderWidth:1,borderColor:'#2a3550'},pkt:{color:'#FFF',fontSize:13},pkp:{color:'#666',fontSize:13},pka:{color:'#D4AF37',fontSize:11},
  sb:{backgroundColor:'#D4AF37',padding:12,borderRadius:8,alignItems:'center',marginTop:16},sbt:{color:'#000',fontWeight:'bold'},
  card:{backgroundColor:'#16213E',padding:14,marginHorizontal:12,marginVertical:4,borderRadius:12},cn:{color:'#FFF',fontSize:14,fontWeight:'bold'},cd:{color:'#94a3b8',fontSize:11,marginTop:4},et:{color:'#666',textAlign:'center',marginTop:40},
});
