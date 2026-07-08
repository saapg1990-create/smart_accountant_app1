import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, StatusBar, Alert, Modal, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Selector } from '../../src/components/common/Selector';
import { ItemRow } from '../../src/components/common/ItemRow';
import { ControlButtons, ControlHeader } from '../../src/components/ui/ControlButtons';
import { unifiedPost } from '../../src/services/unifiedPost';

export default function WarehouseTransferScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const [transfers, setTransfers] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ date: new Date().toISOString().split('T')[0], fromId: '', fromName: '', toId: '', toName: '', notes: '' });
  const [lines, setLines] = useState([{ id: '1', itemId: '', itemName: '', qty: '0', price: '0', total: '0' }]);

  const addLine = () => setLines([...lines, { id: Date.now().toString(), itemId: '', itemName: '', qty: '0', price: '0', total: '0' }]);
  const removeLine = (id: string) => { if (lines.length > 1) setLines(lines.filter(l => l.id !== id)); };
  const updateLine = (id: string, field: string, value: string) => { setLines(lines.map(l => l.id === id ? { ...l, [field]: value } : l)); };

  const count = transfers.length + 1;
  const transferNumber = `TR-${count.toString().padStart(6, '0')}`;

  const handleSave = async () => {
    if (!formData.fromName || !formData.toName) { Alert.alert('خطأ', 'اختر المخزنين'); return; }
    if (formData.fromId === formData.toId) { Alert.alert('خطأ', 'لا يمكن التحويل لنفس المخزن'); return; }
    const result = await unifiedPost('warehouseTransfer', { ...formData });
    if (result.success) {
      setTransfers([{ id: Date.now().toString(), number: transferNumber, ...formData }, ...transfers]);
      setShowModal(false);
      Alert.alert('✅', transferNumber);
    } else { Alert.alert('❌', result.error); }
  };

  return (
    <View style={[st.c, { paddingTop: insets.top }]}><StatusBar barStyle="light-content" />
      <ControlHeader title="تحويل مخزون" count={transfers.length} onBack={() => router.back()} onAdd={() => { setFormData({ date: new Date().toISOString().split('T')[0], fromId: '', fromName: '', toId: '', toName: '', notes: '' }); setLines([{ id: '1', itemId: '', itemName: '', qty: '0', price: '0', total: '0' }]); setShowModal(true); }} />
      {transfers.length === 0 ? <Text style={st.et}>لا توجد تحويلات</Text> :
        <FlatList data={transfers} keyExtractor={(i: any) => i.id} renderItem={({ item }: any) => (
          <View style={st.rc}><Text style={st.rn}>{item.number}</Text><Text style={st.rd}>{item.fromName} → {item.toName}</Text></View>
        )} contentContainerStyle={{ padding: 16 }} />}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={st.mo}><View style={st.mc}><View style={st.mh}><Text style={st.mt}>تحويل مخزون</Text><TouchableOpacity onPress={() => setShowModal(false)}><Text style={st.mx}>✕</Text></TouchableOpacity></View>
        <ScrollView style={st.mb}>
          <Text style={st.fl}>الرقم</Text><TextInput style={[st.fi,{color:'#D4AF37'}]} value={transferNumber} editable={false} />
          <Selector label="من مخزن *" tableName="warehouses" displayField="name" selectedId={formData.fromId} selectedName={formData.fromName} onSelect={(i:any)=>setFormData({...formData,fromId:i.id,fromName:i.name})} />
          <Selector label="إلى مخزن *" tableName="warehouses" displayField="name" selectedId={formData.toId} selectedName={formData.toName} onSelect={(i:any)=>setFormData({...formData,toId:i.id,toName:i.name})} />
          <Text style={st.fl}>التاريخ</Text><TextInput style={st.fi} value={formData.date} onChangeText={v=>setFormData({...formData,date:v})} />
          <Text style={st.fl}>ملاحظات</Text><TextInput style={st.fi} value={formData.notes} onChangeText={v=>setFormData({...formData,notes:v})} />
          <Text style={st.st}>📦 الأصناف</Text>
          {lines.map((line) => (
            <View key={line.id}>
              <Selector label="الصنف" tableName="items" displayField="name" selectedId={line.itemId} selectedName={line.itemName} onSelect={(item:any)=>{updateLine(line.id,'itemId',item.id);updateLine(line.id,'itemName',item.name)}} />
              <ItemRow item={line} onUpdate={updateLine} onRemove={removeLine} showRemove={lines.length > 1} />
            </View>
          ))}
          <TouchableOpacity style={st.al} onPress={addLine}><Text style={{color:'#D4AF37'}}>+ صنف</Text></TouchableOpacity>
          <TouchableOpacity style={st.sb} onPress={handleSave}><Text style={st.sbt}>💾 حفظ</Text></TouchableOpacity>
        </ScrollView></View></View>
      </Modal>
    </View>
  );
}
const st = StyleSheet.create({
  c:{flex:1,backgroundColor:'#0A1128'},et:{color:'#FFF',fontSize:16,textAlign:'center',marginTop:40},
  rc:{backgroundColor:'#16213E',borderRadius:14,padding:14,marginBottom:8,marginHorizontal:16,borderWidth:1,borderColor:'#2a3550'},rn:{color:'#D4AF37',fontSize:14,fontWeight:'bold'},rd:{color:'#FFF',fontSize:13},
  mo:{flex:1,backgroundColor:'rgba(0,0,0,0.7)',justifyContent:'flex-end'},mc:{backgroundColor:'#16213E',borderTopLeftRadius:20,borderTopRightRadius:20,maxHeight:'90%'},mh:{flexDirection:'row',justifyContent:'space-between',padding:16},mt:{color:'#D4AF37',fontSize:18,fontWeight:'bold'},mx:{color:'#EF4444',fontSize:22},mb:{padding:16},
  fl:{color:'#94a3b8',fontSize:13,marginBottom:6,marginTop:12},fi:{backgroundColor:'#0A1128',borderRadius:10,padding:12,color:'#FFF',borderWidth:1,borderColor:'#2a3550',fontSize:14,textAlign:'right'},
  st:{fontSize:16,fontWeight:'bold',color:'#D4AF37',marginTop:16,marginBottom:10},al:{backgroundColor:'#D4AF3720',borderRadius:10,padding:12,alignItems:'center',marginTop:8},
  sb:{backgroundColor:'#D4AF37',borderRadius:12,padding:14,alignItems:'center',marginTop:20,marginBottom:20},sbt:{color:'#0A1128',fontSize:16,fontWeight:'bold'},
});
