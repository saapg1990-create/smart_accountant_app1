import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Modal, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DataService } from '../../src/services/dataService';
import { PickerModal } from '../../src/components/ui/PickerModal';
import { ControlButtons, ControlHeader } from '../../src/components/ui/ControlButtons';

export default function VouchersScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [cashAccs, setCashAccs] = useState<any[]>([]);
  const [bankAccs, setBankAccs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'receipt'|'payment'>('receipt');
  const [voucherType, setVoucherType] = useState<'cash'|'bank'>('cash');
  const [showForm, setShowForm] = useState(false);
  const [showAccPicker, setShowAccPicker] = useState(false);
  const [showSrcPicker, setShowSrcPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], sourceId: '', sourceName: '', accountId: '', accountName: '', amount: '', description: '' });

  useFocusEffect(useCallback(() => { loadAll(); }, []));
  const loadAll = async () => {
    const v = await DataService.getVouchers(); setVouchers(v || []);
    const a = await DataService.getAccounts(); setAccounts(a || []);
    setCashAccs((a || []).filter((x: any) => String(x.parentId) === '111'));
    setBankAccs((a || []).filter((x: any) => String(x.parentId) === '112'));
  };

  const genNum = () => `${activeTab==='receipt'?'RV':'PV'}-${voucherType==='cash'?'C':'B'}-${Date.now().toString().slice(-6)}`;
  const srcAccs = voucherType === 'cash' ? cashAccs : bankAccs;

  const handleSave = async () => {
    if (!form.sourceName || !form.amount) return Alert.alert('خطأ', 'أكمل البيانات');
    await DataService.addVoucher({ id: 'vch-' + Date.now(), number: genNum(), date: form.date, description: form.description, amount: parseFloat(form.amount) || 0, sourceName: form.sourceName, accountName: form.accountName, type: activeTab });
    setShowForm(false); loadAll();
  };

  const filtered = vouchers.filter((v: any) => v.type === activeTab && (v.number?.includes(searchQuery) || v.sourceName?.includes(searchQuery)));

  return (
    <View style={[st.c, { paddingTop: insets.top }]}>
      <ControlHeader title="سندات القبض والصرف" count={vouchers.length} onBack={() => router.back()} onAdd={() => { setForm({ date: new Date().toISOString().split('T')[0], sourceId: '', sourceName: '', accountId: '', accountName: '', amount: '', description: '' }); setShowForm(true); }} />
      <View style={st.tabs}>
        <TouchableOpacity style={[st.tab, activeTab==='receipt'&&st.tabA]} onPress={()=>setActiveTab('receipt')}><Text style={[st.tabT, activeTab==='receipt'&&st.tabTA]}>📥 قبض</Text></TouchableOpacity>
        <TouchableOpacity style={[st.tab, activeTab==='payment'&&st.tabA]} onPress={()=>setActiveTab('payment')}><Text style={[st.tabT, activeTab==='payment'&&st.tabTA]}>📤 صرف</Text></TouchableOpacity>
      </View>
      <ControlButtons showAdd showSearch showPrint showRefresh showExport onAdd={() => setShowForm(true)} onRefresh={loadAll} />
      <TextInput style={st.si} placeholder="🔍 بحث..." placeholderTextColor="#666" value={searchQuery} onChangeText={setSearchQuery} />
      {showForm && (
        <Modal visible={showForm} animationType="slide" transparent>
          <View style={st.mo}><View style={st.mc}><View style={st.mh}><Text style={st.mt}>{activeTab==='receipt'?'سند قبض':'سند صرف'}</Text><TouchableOpacity onPress={()=>setShowForm(false)}><Text style={st.mx}>✕</Text></TouchableOpacity></View>
          <ScrollView style={{padding:16}}>
            <Text style={st.fl}>النوع</Text>
            <View style={st.typeRow}>
              <TouchableOpacity style={[st.typeBtn, voucherType==='cash'&&st.typeBtnA]} onPress={()=>setVoucherType('cash')}><Text style={[st.typeText, voucherType==='cash'&&st.typeTextA]}>💰 نقدي</Text></TouchableOpacity>
              <TouchableOpacity style={[st.typeBtn, voucherType==='bank'&&st.typeBtnA]} onPress={()=>setVoucherType('bank')}><Text style={[st.typeText, voucherType==='bank'&&st.typeTextA]}>🏦 بنكي</Text></TouchableOpacity>
            </View>
            <Text style={st.fl}>الرقم</Text><TextInput style={[st.fi,{color:'#D4AF37'}]} value={genNum()} editable={false} />
            <Text style={st.fl}>{voucherType==='cash'?'الصندوق':'البنك'} *</Text>
            <TouchableOpacity style={st.pk} onPress={()=>setShowSrcPicker(true)}><Text style={form.sourceName?st.pkt:st.pkp}>{form.sourceName||'اختيار'}</Text><Text style={st.pka}>▼</Text></TouchableOpacity>
            <Text style={st.fl}>الحساب</Text>
            <TouchableOpacity style={st.pk} onPress={()=>setShowAccPicker(true)}><Text style={form.accountName?st.pkt:st.pkp}>{form.accountName||'اختيار'}</Text><Text style={st.pka}>▼</Text></TouchableOpacity>
            <Text style={st.fl}>التاريخ</Text><TextInput style={st.fi} value={form.date} onChangeText={v=>setForm({...form,date:v})} />
            <Text style={st.fl}>البيان</Text><TextInput style={[st.fi,{height:60}]} value={form.description} onChangeText={v=>setForm({...form,description:v})} multiline />
            <Text style={st.fl}>المبلغ *</Text><TextInput style={[st.fi,{fontSize:18}]} value={form.amount} onChangeText={v=>setForm({...form,amount:v})} keyboardType="numeric" />
            <TouchableOpacity style={st.sb} onPress={handleSave}><Text style={st.sbt}>💾 حفظ</Text></TouchableOpacity>
          </ScrollView></View></View>
        </Modal>
      )}
      <FlatList data={filtered} keyExtractor={i => i.id} renderItem={({item}) => (
        <View style={[st.card,{borderLeftColor:item.type==='receipt'?'#10B981':'#EF4444',borderLeftWidth:4}]}>
          <View style={st.row}><Text style={st.cn}>{item.number}</Text><Text style={[st.ca,{color:item.type==='receipt'?'#10B981':'#EF4444'}]}>{item.type==='receipt'?'+':'-'}{item.amount?.toLocaleString()}</Text></View>
          <Text style={st.cd}>👤 {item.sourceName} → {item.accountName}</Text>
        </View>
      )} ListEmptyComponent={<Text style={st.et}>لا توجد سندات</Text>} contentContainerStyle={{padding:12}} />
      <PickerModal visible={showAccPicker} title="اختيار الحساب" data={accounts} displayField="name" subField="code" onSelect={(i:any)=>setForm({...form,accountId:i.id,accountName:i.name})} onClose={()=>setShowAccPicker(false)} />
      <PickerModal visible={showSrcPicker} title={voucherType==='cash'?'اختيار الصندوق':'اختيار البنك'} data={srcAccs} displayField="name" onSelect={(i:any)=>setForm({...form,sourceId:i.id,sourceName:i.name})} onClose={()=>setShowSrcPicker(false)} />
    </View>
  );
}
const st = StyleSheet.create({
  c:{flex:1,backgroundColor:'#0A1128'},tabs:{flexDirection:'row',marginHorizontal:12,marginBottom:8,gap:6},tab:{flex:1,backgroundColor:'#16213E',borderRadius:10,padding:10,alignItems:'center',borderWidth:1,borderColor:'#2a3550'},tabA:{borderColor:'#D4AF37',backgroundColor:'#D4AF3710'},tabT:{color:'#94a3b8',fontSize:12},tabTA:{color:'#D4AF37',fontWeight:'bold'},
  si:{marginHorizontal:12,marginBottom:8,padding:10,backgroundColor:'#16213E',borderRadius:10,color:'#FFF',borderWidth:1,borderColor:'#2a3550',textAlign:'right'},
  mo:{flex:1,backgroundColor:'rgba(0,0,0,0.7)',justifyContent:'flex-end'},mc:{backgroundColor:'#16213E',borderTopLeftRadius:20,borderTopRightRadius:20,maxHeight:'90%'},
  mh:{flexDirection:'row',justifyContent:'space-between',padding:16},mt:{color:'#D4AF37',fontSize:16,fontWeight:'bold'},mx:{color:'#EF4444',fontSize:22},
  fl:{color:'#94a3b8',fontSize:13,marginBottom:6,marginTop:10},fi:{backgroundColor:'#0A1128',color:'#FFF',padding:10,borderRadius:8,textAlign:'right'},
  typeRow:{flexDirection:'row',gap:6},typeBtn:{flex:1,padding:10,borderRadius:8,backgroundColor:'#0A1128',alignItems:'center',borderWidth:1,borderColor:'#2a3550'},typeBtnA:{borderColor:'#D4AF37',backgroundColor:'#D4AF3720'},typeText:{color:'#94a3b8',fontSize:12},typeTextA:{color:'#D4AF37',fontWeight:'bold'},
  pk:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',backgroundColor:'#0A1128',padding:12,borderRadius:8,borderWidth:1,borderColor:'#2a3550'},pkt:{color:'#FFF',fontSize:13},pkp:{color:'#666',fontSize:13},pka:{color:'#D4AF37',fontSize:11},
  sb:{backgroundColor:'#D4AF37',padding:12,borderRadius:8,alignItems:'center',marginTop:16},sbt:{color:'#000',fontWeight:'bold'},
  card:{backgroundColor:'#16213E',padding:14,marginHorizontal:12,marginVertical:4,borderRadius:12},row:{flexDirection:'row',justifyContent:'space-between'},cn:{color:'#D4AF37',fontSize:14,fontWeight:'bold'},ca:{fontSize:16,fontWeight:'bold'},cd:{color:'#FFF',fontSize:12,marginTop:4},et:{color:'#666',textAlign:'center',marginTop:40},
});
