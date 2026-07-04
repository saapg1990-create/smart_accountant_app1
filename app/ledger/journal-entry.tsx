import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Modal, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DataService } from '../../src/services/dataService';
import { PickerModal } from '../../src/components/ui/PickerModal';
import { ControlButtons, ControlHeader } from '../../src/components/ui/ControlButtons';

export default function JournalEntryScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const [entries, setEntries] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], description: '', debitAccountId: '', debitAccountName: '', creditAccountId: '', creditAccountName: '', debitAmount: '', creditAmount: '' });
  const [showDebitPicker, setShowDebitPicker] = useState(false);
  const [showCreditPicker, setShowCreditPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(useCallback(() => { loadAll(); }, []));
  const loadAll = async () => {
    const ent = await DataService.getJournalEntries();
    const acc = await DataService.getAccounts();
    setEntries(ent || []); setAccounts(acc || []);
  };

  const openAdd = () => { setForm({ date: new Date().toISOString().split('T')[0], description: '', debitAccountId: '', debitAccountName: '', creditAccountId: '', creditAccountName: '', debitAmount: '', creditAmount: '' }); setShowForm(true); };

  const handleSave = async () => {
    if (!form.description || !form.debitAmount || !form.creditAmount) return Alert.alert('خطأ', 'أكمل البيانات');
    const debit = parseFloat(form.debitAmount) || 0;
    const credit = parseFloat(form.creditAmount) || 0;
    if (Math.abs(debit - credit) > 0.001) return Alert.alert('خطأ', 'القيد غير متوازن');
    await DataService.addJournalEntry({
      id: 'je-' + Date.now(),
      date: form.date,
      description: form.description,
      debitAccount: form.debitAccountId,
      creditAccount: form.creditAccountId,
      amount: debit,
    });
    setShowForm(false); loadAll();
  };

  const filtered = entries.filter((e: any) => e.number?.includes(searchQuery) || e.description?.includes(searchQuery));

  return (
    <View style={[st.c, { paddingTop: insets.top }]}>
      <ControlHeader title="القيود اليومية" count={entries.length} onBack={() => router.back()} onAdd={openAdd} />
      <ControlButtons showAdd showSearch showPrint showRefresh showExport onAdd={openAdd} onRefresh={loadAll} />
      <TextInput style={st.si} placeholder="🔍 بحث..." placeholderTextColor="#666" value={searchQuery} onChangeText={setSearchQuery} />
      {showForm && (
        <Modal visible={showForm} animationType="slide" transparent>
          <View style={st.mo}><View style={st.mc}><View style={st.mh}><Text style={st.mt}>قيد جديد</Text><TouchableOpacity onPress={()=>setShowForm(false)}><Text style={st.mx}>✕</Text></TouchableOpacity></View>
          <ScrollView style={{padding:16}}>
            <Text style={st.fl}>التاريخ</Text><TextInput style={st.fi} value={form.date} onChangeText={v=>setForm({...form,date:v})} />
            <Text style={st.fl}>البيان *</Text><TextInput style={[st.fi,{height:60}]} value={form.description} onChangeText={v=>setForm({...form,description:v})} multiline />
            <Text style={st.fl}>حساب مدين *</Text>
            <TouchableOpacity style={st.pk} onPress={()=>setShowDebitPicker(true)}><Text style={form.debitAccountName?st.pkt:st.pkp}>{form.debitAccountName||'اختيار'}</Text><Text style={st.pka}>▼</Text></TouchableOpacity>
            <TextInput style={st.fi} value={form.debitAmount} onChangeText={v=>setForm({...form,debitAmount:v})} keyboardType="numeric" placeholder="المبلغ المدين" placeholderTextColor="#666" />
            <Text style={st.fl}>حساب دائن *</Text>
            <TouchableOpacity style={st.pk} onPress={()=>setShowCreditPicker(true)}><Text style={form.creditAccountName?st.pkt:st.pkp}>{form.creditAccountName||'اختيار'}</Text><Text style={st.pka}>▼</Text></TouchableOpacity>
            <TextInput style={st.fi} value={form.creditAmount} onChangeText={v=>setForm({...form,creditAmount:v})} keyboardType="numeric" placeholder="المبلغ الدائن" placeholderTextColor="#666" />
            <TouchableOpacity style={st.sb} onPress={handleSave}><Text style={st.sbt}>💾 حفظ</Text></TouchableOpacity>
          </ScrollView></View></View>
        </Modal>
      )}
      <FlatList data={filtered} keyExtractor={i => i.id} renderItem={({item}) => (
        <View style={st.card}><Text style={st.cn}>{item.number}</Text><Text style={st.cd}>{item.description}</Text><View style={st.row}><Text style={st.dr}>مدين: {item.totalDebit?.toLocaleString()}</Text><Text style={st.cr}>دائن: {item.totalCredit?.toLocaleString()}</Text></View></View>
      )} ListEmptyComponent={<Text style={st.et}>لا توجد قيود</Text>} contentContainerStyle={{padding:12}} />
      <PickerModal visible={showDebitPicker} title="اختيار حساب مدين" data={accounts} displayField="name" subField="code" onSelect={(i:any)=>setForm({...form,debitAccountId:i.id,debitAccountName:i.name})} onClose={()=>setShowDebitPicker(false)} />
      <PickerModal visible={showCreditPicker} title="اختيار حساب دائن" data={accounts} displayField="name" subField="code" onSelect={(i:any)=>setForm({...form,creditAccountId:i.id,creditAccountName:i.name})} onClose={()=>setShowCreditPicker(false)} />
    </View>
  );
}
const st = StyleSheet.create({
  c:{flex:1,backgroundColor:'#0A1128'},si:{marginHorizontal:12,marginBottom:8,padding:10,backgroundColor:'#16213E',borderRadius:10,color:'#FFF',borderWidth:1,borderColor:'#2a3550',textAlign:'right'},
  mo:{flex:1,backgroundColor:'rgba(0,0,0,0.7)',justifyContent:'flex-end'},mc:{backgroundColor:'#16213E',borderTopLeftRadius:20,borderTopRightRadius:20,maxHeight:'90%'},
  mh:{flexDirection:'row',justifyContent:'space-between',padding:16,borderBottomWidth:1,borderBottomColor:'#2a3550'},mt:{color:'#D4AF37',fontSize:16,fontWeight:'bold'},mx:{color:'#EF4444',fontSize:22},
  fl:{color:'#94a3b8',fontSize:13,marginBottom:6,marginTop:10},fi:{backgroundColor:'#0A1128',color:'#FFF',padding:10,borderRadius:8,textAlign:'right'},
  pk:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',backgroundColor:'#0A1128',padding:12,borderRadius:8,borderWidth:1,borderColor:'#2a3550'},pkt:{color:'#FFF',fontSize:13},pkp:{color:'#666',fontSize:13},pka:{color:'#D4AF37',fontSize:11},
  sb:{backgroundColor:'#D4AF37',padding:12,borderRadius:8,alignItems:'center',marginTop:16},sbt:{color:'#000',fontWeight:'bold'},
  card:{backgroundColor:'#16213E',padding:14,marginHorizontal:12,marginVertical:4,borderRadius:12},cn:{color:'#D4AF37',fontSize:14,fontWeight:'bold'},cd:{color:'#FFF',fontSize:12,marginTop:4},
  row:{flexDirection:'row',justifyContent:'space-between',marginTop:6},dr:{color:'#EF4444',fontSize:12},cr:{color:'#10B981',fontSize:12},et:{color:'#666',textAlign:'center',marginTop:40},
});
