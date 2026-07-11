import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, StatusBar, Alert, Modal, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDatabase } from '../../src/context/DatabaseContext';
import { Selector } from '../../src/components/common/Selector';
import { ControlButtons, ControlHeader } from '../../src/components/ui/ControlButtons';

export default function ItemsScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const { db } = useDatabase();
  const [items, setItems] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '', code: '', unit: 'حبة', cost: '0', price: '0', quantity: '0', minQuantity: '0',
    categoryId: '', categoryName: '', brandId: '', brandName: '', warehouseId: '', warehouseName: ''
  });

  useFocusEffect(useCallback(() => { loadItems(); }, [db]));

  const loadItems = async () => {
    if (!db) return;
    const result = await db.getAllAsync('SELECT * FROM items ORDER BY name');
    setItems(result);
  };

  const count = items.length + 1;

  const resetForm = () => setFormData({
    name: '', code: '', unit: 'حبة', cost: '0', price: '0', quantity: '0', minQuantity: '0',
    categoryId: '', categoryName: '', brandId: '', brandName: '', warehouseId: '', warehouseName: ''
  });

  const handleSave = async () => {
    if (!formData.name.trim()) { Alert.alert('خطأ', 'أدخل اسم الصنف'); return; }
    if (!db) return;

    await db.runAsync(
      'INSERT INTO items (id, name, code, unit, cost, price, quantity, minQuantity, categoryId, brandId, warehouseId) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      ['itm-' + Date.now(), formData.name, formData.code, formData.unit, parseFloat(formData.cost)||0, parseFloat(formData.price)||0, parseFloat(formData.quantity)||0, parseFloat(formData.minQuantity)||0, formData.categoryId, formData.brandId, formData.warehouseId]
    );
    await loadItems();
    resetForm(); setShowModal(false);
    Alert.alert('✅', `تم إضافة ${formData.name}`);
  };

  return (
    <View style={[st.c, { paddingTop: insets.top }]}><StatusBar barStyle="light-content" />
      <ControlHeader title="الأصناف" count={items.length} onBack={() => router.back()} onAdd={() => { resetForm(); setShowModal(true); }} />
      <ControlButtons showSearch showRefresh onRefresh={loadItems} />
      <TextInput style={st.si} placeholder="🔍 بحث..." placeholderTextColor="#94a3b8" value={searchQuery} onChangeText={setSearchQuery} />
      
      {items.length === 0 ? <Text style={st.et}>لا توجد أصناف</Text> :
        <FlatList data={items.filter((i: any) => i.name?.includes(searchQuery))} keyExtractor={(i: any) => i.id} renderItem={({ item }: any) => (
          <View style={st.rc}>
            <Text style={st.rn}>📦 {item.name} {item.code ? `(${item.code})` : ''}</Text>
            <Text style={st.rd}>التكلفة: {item.cost} | البيع: {item.price} | الكمية: {item.quantity} {item.unit}</Text>
          </View>
        )} contentContainerStyle={{ padding: 16 }} />}

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={st.mo}><View style={st.mc}><View style={st.mh}><Text style={st.mt}>إضافة صنف</Text><TouchableOpacity onPress={() => setShowModal(false)}><Text style={st.mx}>✕</Text></TouchableOpacity></View>
        <ScrollView style={st.mb}>
          <Text style={st.fl}>الرقم</Text><TextInput style={[st.fi,{color:'#D4AF37'}]} value={`ITM-${count.toString().padStart(4,'0')}`} editable={false} />
          
          <Text style={st.fl}>اسم الصنف *</Text><TextInput style={st.fi} value={formData.name} onChangeText={v=>setFormData({...formData,name:v})} placeholder="اسم الصنف" placeholderTextColor="#666" />
          
          <Text style={st.fl}>الكود</Text><TextInput style={st.fi} value={formData.code} onChangeText={v=>setFormData({...formData,code:v})} placeholder="كود الصنف" placeholderTextColor="#666" />
          
          <Selector label="الفئة" tableName="categories" displayField="name" selectedId={formData.categoryId} selectedName={formData.categoryName} onSelect={(i:any)=>setFormData({...formData,categoryId:i.id,categoryName:i.name})} />
          
          <Selector label="العلامة التجارية" tableName="brands" displayField="name" selectedId={formData.brandId} selectedName={formData.brandName} onSelect={(i:any)=>setFormData({...formData,brandId:i.id,brandName:i.name})} />
          
          <Selector label="المخزن الافتراضي" tableName="warehouses" displayField="name" selectedId={formData.warehouseId} selectedName={formData.warehouseName} onSelect={(i:any)=>setFormData({...formData,warehouseId:i.id,warehouseName:i.name})} placeholder="اختر المخزن (اختياري)" />
          
          <Text style={st.fl}>الوحدة</Text><TextInput style={st.fi} value={formData.unit} onChangeText={v=>setFormData({...formData,unit:v})} placeholder="حبة" placeholderTextColor="#666" />
          
          <View style={{flexDirection:'row',gap:8}}>
            <View style={{flex:1}}><Text style={st.fl}>سعر التكلفة</Text><TextInput style={st.fi} value={formData.cost} onChangeText={v=>setFormData({...formData,cost:v})} keyboardType="numeric" placeholder="0" placeholderTextColor="#666" /></View>
            <View style={{flex:1}}><Text style={st.fl}>سعر البيع</Text><TextInput style={st.fi} value={formData.price} onChangeText={v=>setFormData({...formData,price:v})} keyboardType="numeric" placeholder="0" placeholderTextColor="#666" /></View>
          </View>
          
          <View style={{flexDirection:'row',gap:8}}>
            <View style={{flex:1}}><Text style={st.fl}>الكمية الحالية</Text><TextInput style={st.fi} value={formData.quantity} onChangeText={v=>setFormData({...formData,quantity:v})} keyboardType="numeric" placeholder="0" placeholderTextColor="#666" /></View>
            <View style={{flex:1}}><Text style={st.fl}>الحد الأدنى</Text><TextInput style={st.fi} value={formData.minQuantity} onChangeText={v=>setFormData({...formData,minQuantity:v})} keyboardType="numeric" placeholder="0" placeholderTextColor="#666" /></View>
          </View>

          <TouchableOpacity style={st.sb} onPress={handleSave}><Text style={st.sbt}>💾 حفظ</Text></TouchableOpacity>
        </ScrollView></View></View>
      </Modal>
    </View>
  );
}
const st = StyleSheet.create({
  c:{flex:1,backgroundColor:'#0A1128'},si:{marginHorizontal:16,marginBottom:8,padding:12,backgroundColor:'#16213E',borderRadius:10,color:'#FFF',borderWidth:1,borderColor:'#2a3550',textAlign:'right'},et:{color:'#FFF',fontSize:16,textAlign:'center',marginTop:40},
  rc:{backgroundColor:'#16213E',borderRadius:14,padding:14,marginBottom:8,marginHorizontal:16,borderWidth:1,borderColor:'#2a3550'},rn:{color:'#FFF',fontSize:16,fontWeight:'bold'},rd:{color:'#10B981',fontSize:13},
  mo:{flex:1,backgroundColor:'rgba(0,0,0,0.7)',justifyContent:'flex-end'},mc:{backgroundColor:'#16213E',borderTopLeftRadius:20,borderTopRightRadius:20,maxHeight:'90%'},mh:{flexDirection:'row',justifyContent:'space-between',padding:16},mt:{color:'#D4AF37',fontSize:18,fontWeight:'bold'},mx:{color:'#EF4444',fontSize:22},mb:{padding:16},
  fl:{color:'#94a3b8',fontSize:13,marginBottom:6,marginTop:12},fi:{backgroundColor:'#0A1128',borderRadius:10,padding:12,color:'#FFF',borderWidth:1,borderColor:'#2a3550',fontSize:14,textAlign:'right'},
  sb:{backgroundColor:'#D4AF37',borderRadius:12,padding:14,alignItems:'center',marginTop:20,marginBottom:20},sbt:{color:'#0A1128',fontSize:16,fontWeight:'bold'},
});
