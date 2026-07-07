import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, StatusBar, Alert, Modal, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAccountStore } from '../../src/store/useAccountStore';
import { Selector } from '../../src/components/common/Selector';
import { CurrencySelector } from '../../src/components/common/CurrencySelector';
import { PickerModal } from '../../src/components/ui/PickerModal';
import { ControlButtons, ControlHeader } from '../../src/components/ui/ControlButtons';
import { unifiedPost } from '../../src/services/unifiedPost';

export default function VouchersScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const { accounts, loadAccounts } = useAccountStore();
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'receipt'|'payment'>('receipt');
  const [voucherType, setVoucherType] = useState<'cash'|'bank'|'ewallet'>('cash');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [currency, setCurrency] = useState('YER');
  const [exchangeRate, setExchangeRate] = useState('1');
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    sourceId: '', sourceName: '',
    accountId: '', accountName: '',
    description: '', amount: '', refNumber: ''
  });

  useFocusEffect(useCallback(() => { loadAccounts(); }, []));

  const leafAccounts = accounts.filter((a: any) => a.parentId && !accounts.some((p: any) => p.parentId === a.id));
  const cashAccounts = accounts.filter((a: any) => a.parentId === '111');
  const bankAccounts = accounts.filter((a: any) => a.parentId === '112');
  const ewalletAccounts = accounts.filter((a: any) => a.parentId === '113');
  const sourceAccounts = voucherType === 'cash' ? cashAccounts : voucherType === 'bank' ? bankAccounts : ewalletAccounts;

  // توليد الرقم التسلسلي
  const receiptCashCount = vouchers.filter((v: any) => v.type === 'receipt' && v.voucherType === 'cash').length + 1;
  const receiptBankCount = vouchers.filter((v: any) => v.type === 'receipt' && v.voucherType === 'bank').length + 1;
  const paymentCashCount = vouchers.filter((v: any) => v.type === 'payment' && v.voucherType === 'cash').length + 1;
  const paymentBankCount = vouchers.filter((v: any) => v.type === 'payment' && v.voucherType === 'bank').length + 1;
  
  const getVoucherNumber = () => {
    const prefix = activeTab === 'receipt' ? 'RV' : 'PV';
    const typeCode = voucherType === 'cash' ? 'C' : voucherType === 'bank' ? 'B' : 'E';
    const count = activeTab === 'receipt' ? 
      (voucherType === 'cash' ? receiptCashCount : receiptBankCount) : 
      (voucherType === 'cash' ? paymentCashCount : paymentBankCount);
    return `${prefix}-${typeCode}-${count.toString().padStart(6, '0')}`;
  };

  const handleSave = async () => {
    if (!formData.sourceName || !formData.accountName || !formData.amount) {
      Alert.alert('خطأ', 'الرجاء تعبئة جميع الحقول'); return;
    }
    
    const result = await unifiedPost(activeTab === 'receipt' ? 'receiptVoucher' : 'paymentVoucher', {
      ...formData,
      voucherType,
      type: activeTab,
      total: parseFloat(formData.amount) || 0,
      currency,
      exchangeRate,
      sourceId: formData.sourceId,
      sourceName: formData.sourceName,
      accountId: formData.accountId,
      accountName: formData.accountName
    });

    if (result.success) {
      setVouchers([{ id: Date.now().toString(), number: result.number, ...formData, type: activeTab, voucherType }, ...vouchers]);
      await loadAccounts();
      setShowModal(false);
      Alert.alert('✅', `تم حفظ السند ${result.number}`);
    } else {
      Alert.alert('❌', result.error);
    }
  };

  return (
    <View style={[st.c, { paddingTop: insets.top }]}><StatusBar barStyle="light-content" />
      <ControlHeader title="سندات القبض والصرف" count={vouchers.length} onBack={() => router.back()} onAdd={() => { setFormData({ date: new Date().toISOString().split('T')[0], sourceId: '', sourceName: '', accountId: '', accountName: '', description: '', amount: '', refNumber: '' }); setShowModal(true); }} />
      
      <View style={st.tabs}>
        <TouchableOpacity style={[st.tab, activeTab==='receipt'&&st.tabA]} onPress={()=>setActiveTab('receipt')}><Text style={[st.tabT, activeTab==='receipt'&&st.tabTA]}>📥 قبض</Text></TouchableOpacity>
        <TouchableOpacity style={[st.tab, activeTab==='payment'&&st.tabA]} onPress={()=>setActiveTab('payment')}><Text style={[st.tabT, activeTab==='payment'&&st.tabTA]}>📤 صرف</Text></TouchableOpacity>
      </View>

      <ControlButtons showSearch showPrint showRefresh showExport />
      <TextInput style={st.si} placeholder="🔍 بحث..." placeholderTextColor="#94a3b8" value={searchQuery} onChangeText={setSearchQuery} />
      
      {vouchers.length === 0 ? <Text style={st.et}>لا توجد سندات</Text> :
        <FlatList data={vouchers} keyExtractor={(i: any) => i.id} renderItem={({ item }: any) => (
          <TouchableOpacity style={[st.vc, { borderLeftColor: item.type==='receipt'?'#10B981':'#EF4444', borderLeftWidth:4 }]}>
            <Text style={st.vn}>{item.number}</Text>
            <Text style={st.va}>{item.amount?.toLocaleString()} ﷼</Text>
            <Text style={st.vac}>{item.accountName}</Text>
            <Text style={st.vs}>{item.voucherType==='cash'?'💰':item.voucherType==='bank'?'🏦':'📱'} {item.sourceName}</Text>
          </TouchableOpacity>
        )} contentContainerStyle={{ padding: 16 }} />}

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={st.mo}><View style={st.mc}><View style={st.mh}><Text style={st.mt}>{activeTab==='receipt'?'سند قبض':'سند صرف'}</Text><TouchableOpacity onPress={()=>setShowModal(false)}><Text style={st.mx}>✕</Text></TouchableOpacity></View>
        <ScrollView style={st.mb}>
          <Text style={st.fl}>نوع السند</Text>
          <View style={st.tr}>
            {['cash','bank','ewallet'].map(t => (
              <TouchableOpacity key={t} style={[st.tb, voucherType===t&&st.tbA]} onPress={()=>setVoucherType(t as any)}>
                <Text style={[st.tbt, voucherType===t&&st.tbtA]}>{t==='cash'?'💰 نقدي':t==='bank'?'🏦 بنكي':'📱 محفظة'}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <Text style={st.fl}>رقم السند</Text>
          <TextInput style={[st.fi, { color: '#D4AF37' }]} value={getVoucherNumber()} editable={false} />
          
          <CurrencySelector selectedCurrency={currency} exchangeRate={exchangeRate} onCurrencyChange={(c, r) => { setCurrency(c); setExchangeRate(r); }} />
          
          <Selector label={voucherType==='cash'?'الصندوق':voucherType==='bank'?'البنك':'المحفظة'} tableName="accounts" filterField="parentId" filterValue={voucherType==='cash'?'111':voucherType==='bank'?'112':'113'} displayField="name" subField="code" showBalance selectedId={formData.sourceId} selectedName={formData.sourceName} onSelect={(i:any)=>setFormData({...formData,sourceId:i.id,sourceName:i.name})} />
          
          <Selector label="الحساب" tableName="accounts" displayField="name" subField="code" showBalance selectedId={formData.accountId} selectedName={formData.accountName} onSelect={(i:any)=>setFormData({...formData,accountId:i.id,accountName:i.name})} />
          
          <Text style={st.fl}>التاريخ</Text><TextInput style={st.fi} value={formData.date} onChangeText={v=>setFormData({...formData,date:v})} />
          <Text style={st.fl}>البيان</Text><TextInput style={[st.fi,{height:60}]} value={formData.description} onChangeText={v=>setFormData({...formData,description:v})} placeholder="بيان" placeholderTextColor="#666" multiline />
          <Text style={st.fl}>المبلغ *</Text><TextInput style={[st.fi,{fontSize:18}]} value={formData.amount} onChangeText={v=>setFormData({...formData,amount:v})} keyboardType="numeric" placeholder="0" placeholderTextColor="#666" />
          
          <TouchableOpacity style={st.sb} onPress={handleSave}><Text style={st.sbt}>💾 حفظ</Text></TouchableOpacity>
        </ScrollView></View></View>
      </Modal>
    </View>
  );
}
const st = StyleSheet.create({
  c:{flex:1,backgroundColor:'#0A1128'},tabs:{flexDirection:'row',marginHorizontal:16,marginBottom:12,gap:8},tab:{flex:1,backgroundColor:'#16213E',borderRadius:12,padding:12,alignItems:'center',borderWidth:1,borderColor:'#2a3550'},tabA:{borderColor:'#D4AF37',backgroundColor:'#D4AF3710'},tabT:{color:'#94a3b8',fontSize:13},tabTA:{color:'#D4AF37',fontWeight:'bold'},
  si:{marginHorizontal:16,marginBottom:12,padding:12,backgroundColor:'#16213E',borderRadius:10,color:'#FFF',borderWidth:1,borderColor:'#2a3550',textAlign:'right',fontSize:14},e:{flex:1,justifyContent:'center',alignItems:'center'},et:{color:'#FFF',fontSize:16},
  vc:{backgroundColor:'#16213E',borderRadius:14,padding:14,marginBottom:10,marginHorizontal:16,borderWidth:1,borderColor:'#2a3550'},vn:{color:'#D4AF37',fontSize:14,fontWeight:'bold'},va:{color:'#FFF',fontSize:16,fontWeight:'bold'},vac:{color:'#FFF',fontSize:14},vs:{color:'#94a3b8',fontSize:12},
  mo:{flex:1,backgroundColor:'rgba(0,0,0,0.7)',justifyContent:'flex-end'},mc:{backgroundColor:'#16213E',borderTopLeftRadius:20,borderTopRightRadius:20,maxHeight:'90%'},mh:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:16,borderBottomWidth:1,borderBottomColor:'#2a3550'},mt:{color:'#D4AF37',fontSize:18,fontWeight:'bold'},mx:{color:'#EF4444',fontSize:22,fontWeight:'bold'},mb:{padding:16},
  fl:{color:'#94a3b8',fontSize:13,marginBottom:6,marginTop:12},fi:{backgroundColor:'#0A1128',borderRadius:10,padding:12,color:'#FFF',borderWidth:1,borderColor:'#2a3550',fontSize:14},
  tr:{flexDirection:'row',gap:6,flexWrap:'wrap'},tb:{paddingVertical:10,paddingHorizontal:12,borderRadius:10,backgroundColor:'#0A1128',borderWidth:1,borderColor:'#2a3550'},tbA:{borderColor:'#D4AF37',backgroundColor:'#D4AF3720'},tbt:{color:'#94a3b8',fontSize:12},tbtA:{color:'#D4AF37',fontWeight:'bold'},
  sb:{backgroundColor:'#D4AF37',borderRadius:12,padding:14,alignItems:'center',marginTop:20},sbt:{color:'#0A1128',fontSize:16,fontWeight:'bold'},
});
