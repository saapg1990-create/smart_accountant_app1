import { DataService } from '../src/services/dataService';
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Modal, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import { useLocalTable } from '../../hooks/useLocalStore';
import { PickerModal } from '../../src/components/ui/PickerModal';
import { ControlButtons, ControlHeader } from '../../src/components/ui/ControlButtons';

export default function StockCountScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const { data: counts, add } = useLocalTable('stockCounts');
  const { data: items } = useLocalTable('items');
  const { data: warehouses } = useLocalTable('warehouses');
  const [showForm, setShowForm] = useState(false);
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [showWarehousePicker, setShowWarehousePicker] = useState(false);
  const [formData, setFormData] = useState({ date: new Date().toISOString().split('T')[0], itemId: '', itemName: '', warehouseId: '', warehouseName: '', expectedQty: '', actualQty: '' });
  const [searchQuery, setSearchQuery] = useState('');

  const diff = parseFloat(formData.actualQty || '0') - parseFloat(formData.expectedQty || '0');

  const handleSave = async () => {
    if (!formData.itemName) { Alert.alert('خطأ', 'اختر الصنف'); return; }
    await add({ ...formData, difference: diff, date: formData.date, number: 'STK-' + Date.now().toString().slice(-6) });
    setShowForm(false); Alert.alert('✅', 'تم حفظ الجرد');
  };

  return (
    <View style={[st.c, { paddingTop: insets.top }]}>
      <ControlHeader title="جرد المخزون" count={counts.length} onBack={() => router.back()} onAdd={() => setShowForm(true)} />
      <ControlButtons showAdd showSearch showPrint showRefresh showExport onAdd={() => setShowForm(true)} onRefresh={() => {}} />
      <TextInput style={st.si} placeholder="🔍 بحث..." placeholderTextColor="#666" value={searchQuery} onChangeText={setSearchQuery} />
      <FlatList data={counts} keyExtractor={(i: any) => i.id} renderItem={({ item }: any) => (
        <View style={st.card}>
          <Text style={st.cn}>{item.number}</Text><Text style={st.ci}>📦 {item.itemName}</Text>
          <View style={st.row}><Text>متوقع: {item.expectedQty}</Text><Text>فعلي: {item.actualQty}</Text><Text style={{ color: item.difference > 0 ? '#10B981' : '#EF4444' }}>الفرق: {item.difference}</Text></View>
        </View>
      )} contentContainerStyle={{ padding: 12 }} ListEmptyComponent={<Text style={st.et}>لا توجد عمليات جرد</Text>} />

      <Modal visible={showForm} animationType="slide" transparent>
        <View style={st.mo}><View style={st.mc}><View style={st.mh}><Text style={st.mt}>جرد مخزون</Text><TouchableOpacity onPress={() => setShowForm(false)}><Text style={st.mx}>✕</Text></TouchableOpacity></View>
        <ScrollView style={st.mb}>
          <Text style={st.fl}>الصنف</Text><TouchableOpacity style={st.pk} onPress={() => setShowItemPicker(true)}><Text style={formData.itemName ? st.pkt : st.pkp}>{formData.itemName || 'اختيار الصنف'}</Text><Text style={st.pka}>▼</Text></TouchableOpacity>
          <Text style={st.fl}>المخزن</Text><TouchableOpacity style={st.pk} onPress={() => setShowWarehousePicker(true)}><Text style={formData.warehouseName ? st.pkt : st.pkp}>{formData.warehouseName || 'اختيار المخزن'}</Text><Text style={st.pka}>▼</Text></TouchableOpacity>
          <Text style={st.fl}>الكمية المتوقعة</Text><TextInput style={st.fi} value={formData.expectedQty} onChangeText={v => setFormData({ ...formData, expectedQty: v })} keyboardType="numeric" />
          <Text style={st.fl}>الكمية الفعلية</Text><TextInput style={st.fi} value={formData.actualQty} onChangeText={v => setFormData({ ...formData, actualQty: v })} keyboardType="numeric" />
          {diff !== 0 && <Text style={{ color: diff > 0 ? '#10B981' : '#EF4444', textAlign: 'center', marginTop: 8 }}>الفرق: {diff > 0 ? '+' : ''}{diff}</Text>}
          <TouchableOpacity style={st.sb} onPress={handleSave}><Text style={st.sbt}>💾 حفظ</Text></TouchableOpacity>
        </ScrollView></View></View>
      </Modal>
      <PickerModal visible={showItemPicker} title="اختيار الصنف" data={items || []} displayField="name" onSelect={(i: any) => setFormData({ ...formData, itemId: i.id, itemName: i.name })} onClose={() => setShowItemPicker(false)} />
      <PickerModal visible={showWarehousePicker} title="اختيار المخزن" data={warehouses || []} displayField="name" onSelect={(i: any) => setFormData({ ...formData, warehouseId: i.id, warehouseName: i.name })} onClose={() => setShowWarehousePicker(false)} />
    </View>
  );
}
const st = StyleSheet.create({
  c:{flex:1,backgroundColor:'#0A1128'},si:{marginHorizontal:12,marginBottom:8,padding:12,backgroundColor:'#16213E',borderRadius:10,color:'#FFF',borderWidth:1,borderColor:'#2a3550',textAlign:'right'},
  et:{color:'#666',textAlign:'center',marginTop:40,fontSize:16},
  card:{backgroundColor:'#16213E',borderRadius:12,padding:14,marginBottom:8,marginHorizontal:12,borderWidth:1,borderColor:'#2a3550'},
  cn:{color:'#D4AF37',fontSize:14,fontWeight:'bold'},ci:{color:'#FFF',fontSize:13,marginTop:4},
  row:{flexDirection:'row',justifyContent:'space-between',marginTop:6},
  mo:{flex:1,backgroundColor:'rgba(0,0,0,0.7)',justifyContent:'flex-end'},mc:{backgroundColor:'#16213E',borderTopLeftRadius:20,borderTopRightRadius:20,maxHeight:'80%'},
  mh:{flexDirection:'row',justifyContent:'space-between',padding:16,borderBottomWidth:1,borderBottomColor:'#2a3550'},mt:{color:'#D4AF37',fontSize:16,fontWeight:'bold'},mx:{color:'#EF4444',fontSize:22},mb:{padding:16},
  fl:{color:'#94a3b8',fontSize:13,marginBottom:6,marginTop:10},fi:{backgroundColor:'#0A1128',borderRadius:10,padding:10,color:'#FFF',borderWidth:1,borderColor:'#2a3550',textAlign:'right'},
  pk:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',backgroundColor:'#0A1128',borderRadius:10,padding:14,borderWidth:1,borderColor:'#2a3550'},pkt:{color:'#FFF',fontSize:14},pkp:{color:'#666',fontSize:14},pka:{color:'#D4AF37',fontSize:12},
  sb:{backgroundColor:'#D4AF37',borderRadius:12,padding:14,alignItems:'center',marginTop:20},sbt:{color:'#0A1128',fontSize:16,fontWeight:'bold'},
});
