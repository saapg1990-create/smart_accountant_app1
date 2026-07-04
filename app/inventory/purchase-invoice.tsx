import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Modal, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DataService } from '../../src/services/dataService';

export default function Screen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const [data, setData] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], description: '', amount: '', sourceName: '', accountName: '' });
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(useCallback(() => { loadData(); }, []));
  const loadData = async () => { const res = await DataService.getPurchaseInvoices(); setData(res); };

  const handleSave = async () => {
    if (!form.description.trim()) return Alert.alert('خطأ', 'أدخل البيان');
    await DataService.addPurchaseInvoice({ id: 'purchase-invoice-' + Date.now(), ...form, number: 'purchase-invoice-' + Date.now().toString().slice(-6), amount: parseFloat(form.amount) || 0 });
    setShowForm(false); setForm({ date: new Date().toISOString().split('T')[0], description: '', amount: '', sourceName: '', accountName: '' }); loadData();
  };

  const filtered = data.filter((d: any) => d.number?.includes(searchQuery) || d.description?.includes(searchQuery));

  return (
    <View style={[st.c, { paddingTop: insets.top }]}>
      <View style={st.h}><TouchableOpacity onPress={() => router.back()}><Text style={st.bb}>←</Text></TouchableOpacity><Text style={st.t}>مشتريات</Text><TouchableOpacity onPress={() => setShowForm(true)}><Text style={st.add}>+</Text></TouchableOpacity></View>
      <TextInput style={st.si} placeholder="🔍 بحث..." placeholderTextColor="#666" value={searchQuery} onChangeText={setSearchQuery} />
      {showForm && (
        <Modal visible={showForm} animationType="slide" transparent>
          <View style={st.mo}><View style={st.mc}><View style={{flexDirection:'row',justifyContent:'space-between',padding:16}}><Text style={{color:'#D4AF37',fontSize:16,fontWeight:'bold'}}>مشتريات</Text><TouchableOpacity onPress={() => setShowForm(false)}><Text style={{color:'#EF4444',fontSize:22}}>✕</Text></TouchableOpacity></View>
          <ScrollView style={{padding:16}}>
            <TextInput style={st.fi} value={form.date} onChangeText={v => setForm({...form, date: v})} placeholder="التاريخ" placeholderTextColor="#666" />
            <TextInput style={st.fi} value={form.description} onChangeText={v => setForm({...form, description: v})} placeholder="البيان" placeholderTextColor="#666" multiline />
            <TextInput style={st.fi} value={form.amount} onChangeText={v => setForm({...form, amount: v})} placeholder="المبلغ" placeholderTextColor="#666" keyboardType="numeric" />
            <TextInput style={st.fi} value={form.sourceName} onChangeText={v => setForm({...form, sourceName: v})} placeholder="الجهة" placeholderTextColor="#666" />
            <TouchableOpacity style={st.sb} onPress={handleSave}><Text style={st.sbt}>💾 حفظ</Text></TouchableOpacity>
          </ScrollView></View></View>
        </Modal>
      )}
      <FlatList data={filtered} keyExtractor={i => i.id} renderItem={({ item }) => (
        <View style={st.card}><Text style={st.cn}>{item.number}</Text><Text style={st.cd}>{item.description}</Text><Text style={st.ca}>{item.amount?.toLocaleString()} ﷼</Text></View>
      )} ListEmptyComponent={<Text style={st.et}>لا توجد مشتريات</Text>} />
    </View>
  );
}
const st = StyleSheet.create({
  c:{flex:1,backgroundColor:'#0A1128'},h:{flexDirection:'row',alignItems:'center',padding:16},bb:{fontSize:24,color:'#D4AF37'},t:{color:'#D4AF37',fontSize:18,fontWeight:'bold',flex:1,textAlign:'center'},add:{fontSize:28,color:'#D4AF37'},
  si:{marginHorizontal:12,marginBottom:8,padding:12,backgroundColor:'#16213E',borderRadius:10,color:'#FFF',borderWidth:1,borderColor:'#2a3550',textAlign:'right'},
  mo:{flex:1,backgroundColor:'rgba(0,0,0,0.7)',justifyContent:'flex-end'},mc:{backgroundColor:'#16213E',borderTopLeftRadius:20,borderTopRightRadius:20,maxHeight:'80%'},
  fi:{backgroundColor:'#0A1128',color:'#FFF',padding:10,borderRadius:8,marginBottom:8,textAlign:'right'},
  sb:{backgroundColor:'#D4AF37',padding:12,borderRadius:8,alignItems:'center',marginTop:12},sbt:{color:'#000',fontWeight:'bold'},
  card:{backgroundColor:'#16213E',padding:14,marginHorizontal:12,marginVertical:4,borderRadius:12},cn:{color:'#D4AF37',fontSize:13,fontWeight:'bold'},cd:{color:'#FFF',fontSize:12,marginTop:4},ca:{color:'#10B981',fontSize:13,fontWeight:'bold',marginTop:4},
  et:{color:'#666',textAlign:'center',marginTop:40},
});
