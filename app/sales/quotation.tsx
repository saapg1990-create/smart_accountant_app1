import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, StatusBar, Alert, Modal, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalTable } from '../../hooks/useLocalStore';
import { ControlButtons, ControlHeader } from '../../src/components/ui/ControlButtons';

export default function QuotationScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const { data: quotations, add, remove } = useLocalTable('quotations');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ date: new Date().toISOString().split('T')[0], customerName: '', description: '', totalAmount: '0' });
  const [lines, setLines] = useState([{ id: '1', itemName: '', qty: '0', price: '0', total: '0' }]);

  const addLine = () => setLines([...lines, { id: Date.now().toString(), itemName: '', qty: '0', price: '0', total: '0' }]);
  const removeLine = (id: string) => { if (lines.length > 1) setLines(lines.filter(l => l.id !== id)); };
  const updateLine = (id: string, field: string, value: string) => { setLines(lines.map(l => { if (l.id !== id) return l; const u = { ...l, [field]: value }; if (['qty','price'].includes(field)) u.total = ((parseFloat(u.qty)||0)*(parseFloat(u.price)||0)).toString(); return u; })); };
  const totalAmount = lines.reduce((s, l) => s + (parseFloat(l.total) || 0), 0);
  const generateNumber = () => `Q-${(quotations.length + 1).toString().padStart(6, '0')}`;

  const handleSave = async () => {
    if (!formData.customerName) { Alert.alert('خطأ', 'أدخل اسم العميل'); return; }
    await add({ ...formData, number: generateNumber(), totalAmount, items: lines.filter(l => l.itemName) });
    setShowModal(false);
  };

  return (
    <View style={[st.c, { paddingTop: insets.top }]}><StatusBar barStyle="light-content" />
      <ControlHeader title="عروض الأسعار" count={quotations.length} onBack={() => router.back()} onAdd={() => { setFormData({ date: new Date().toISOString().split('T')[0], customerName: '', description: '', totalAmount: '0' }); setLines([{ id: '1', itemName: '', qty: '0', price: '0', total: '0' }]); setShowModal(true); }} />
      <ControlButtons showEdit={false} showDelete={false} />
      <TextInput style={st.si} placeholder="🔍 بحث..." placeholderTextColor="#94a3b8" value={searchQuery} onChangeText={setSearchQuery} />
      {quotations.length === 0 ? <View style={st.e}><Text style={st.ei}>📋</Text><Text style={st.et}>لا توجد عروض</Text></View> :
        <FlatList data={quotations} keyExtractor={(i: any) => i.id} renderItem={({ item }: any) => (
          <TouchableOpacity style={st.rc} onLongPress={() => Alert.alert('حذف', 'حذف؟', [{ text: 'حذف', style: 'destructive', onPress: () => remove(item.id) }, { text: 'إلغاء' }])}>
            <Text style={st.rn}>{item.number}</Text><Text style={st.rd}>👤 {item.customerName}</Text><Text style={st.rt}>{item.totalAmount?.toLocaleString()} ﷼</Text>
          </TouchableOpacity>
        )} contentContainerStyle={{ padding: 16 }} />}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={st.mo}><View style={[st.mc, { maxHeight: '85%' }]}><View style={st.mh}><Text style={st.mt}>عرض سعر جديد</Text><TouchableOpacity onPress={() => setShowModal(false)}><Text style={st.mx}>✕</Text></TouchableOpacity></View>
        <ScrollView style={st.mb}>
          <Text style={st.fl}>رقم العرض</Text><TextInput style={[st.fi, { color: '#D4AF37' }]} value={generateNumber()} editable={false} />
          <Text style={st.fl}>العميل *</Text><TextInput style={st.fi} value={formData.customerName} onChangeText={v => setFormData({ ...formData, customerName: v })} placeholder="اسم العميل" placeholderTextColor="#666" />
          <Text style={st.fl}>التاريخ</Text><TextInput style={st.fi} value={formData.date} onChangeText={v => setFormData({ ...formData, date: v })} />
          <Text style={st.fl}>البيان</Text><TextInput style={[st.fi, { height: 50 }]} value={formData.description} onChangeText={v => setFormData({ ...formData, description: v })} placeholder="بيان" placeholderTextColor="#666" multiline />
          <Text style={st.st}>📦 الأصناف</Text>
          {lines.map((line, i) => (
            <View key={line.id} style={st.lc}>
              <View style={st.lh}><Text>#{i + 1}</Text>{lines.length > 1 && <TouchableOpacity onPress={() => removeLine(line.id)}><Text>🗑️</Text></TouchableOpacity>}</View>
              <TextInput style={st.fi} value={line.itemName} onChangeText={v => updateLine(line.id, 'itemName', v)} placeholder="اسم الصنف" placeholderTextColor="#666" />
              <View style={st.rw}><TextInput style={[st.fi, st.hf]} value={line.qty} onChangeText={v => updateLine(line.id, 'qty', v)} placeholder="كمية" placeholderTextColor="#666" keyboardType="numeric" /><TextInput style={[st.fi, st.hf]} value={line.price} onChangeText={v => updateLine(line.id, 'price', v)} placeholder="سعر" placeholderTextColor="#666" keyboardType="numeric" /></View>
              <Text style={st.lt}>{parseFloat(line.total || '0').toLocaleString()} ﷼</Text>
            </View>
          ))}
          <TouchableOpacity style={st.al} onPress={addLine}><Text>+ إضافة صنف</Text></TouchableOpacity>
          <Text style={st.tx}>الإجمالي: {totalAmount.toLocaleString()} ﷼</Text>
          <TouchableOpacity style={st.sb} onPress={handleSave}><Text style={st.sbt}>💾 حفظ</Text></TouchableOpacity>
        </ScrollView></View></View>
      </Modal>
    </View>
  );
}
const st = StyleSheet.create({c:{flex:1,backgroundColor:'#0A1128'},si:{marginHorizontal:16,marginBottom:12,padding:12,backgroundColor:'#16213E',borderRadius:10,color:'#FFF',borderWidth:1,borderColor:'#2a3550',textAlign:'right',fontSize:14},e:{flex:1,justifyContent:'center',alignItems:'center'},ei:{fontSize:48,marginBottom:12},et:{color:'#FFF',fontSize:16},rc:{backgroundColor:'#16213E',borderRadius:14,padding:14,marginBottom:10,marginHorizontal:16,borderWidth:1,borderColor:'#2a3550'},rn:{color:'#D4AF37',fontSize:14,fontWeight:'bold'},rd:{color:'#FFF',fontSize:13},rt:{color:'#10B981',fontSize:16,fontWeight:'bold',marginTop:4},mo:{flex:1,backgroundColor:'rgba(0,0,0,0.7)',justifyContent:'flex-end'},mc:{backgroundColor:'#16213E',borderTopLeftRadius:20,borderTopRightRadius:20,maxHeight:'85%'},mh:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:16,borderBottomWidth:1,borderBottomColor:'#2a3550'},mt:{color:'#D4AF37',fontSize:18,fontWeight:'bold'},mx:{color:'#EF4444',fontSize:22,fontWeight:'bold'},mb:{padding:16},fl:{color:'#94a3b8',fontSize:13,marginBottom:6,marginTop:12},fi:{backgroundColor:'#0A1128',borderRadius:10,padding:12,color:'#FFF',borderWidth:1,borderColor:'#2a3550',fontSize:14},st:{fontSize:16,fontWeight:'bold',color:'#D4AF37',marginTop:16,marginBottom:10},lc:{backgroundColor:'#0A1128',borderRadius:10,padding:12,marginBottom:8,borderWidth:1,borderColor:'#2a3550'},lh:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:8},rw:{flexDirection:'row',gap:8},hf:{flex:1},lt:{color:'#10B981',fontSize:13,fontWeight:'bold',textAlign:'right',marginTop:4},al:{backgroundColor:'#D4AF37'+'20',borderRadius:10,padding:12,alignItems:'center',marginTop:8,borderWidth:1,borderColor:'#D4AF37'+'40'},tx:{color:'#F59E0B',fontSize:16,fontWeight:'bold',textAlign:'center',marginTop:12},sb:{backgroundColor:'#D4AF37',borderRadius:12,padding:14,alignItems:'center',marginTop:20},sbt:{color:'#0A1128',fontSize:16,fontWeight:'bold'}});
