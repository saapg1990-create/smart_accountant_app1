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
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'receipt'|'payment'>('receipt');
  const [voucherType, setVoucherType] = useState<'cash'|'bank'|'ewallet'>('cash');
  const [showForm, setShowForm] = useState(false);
  const [showAccPicker, setShowAccPicker] = useState(false);
  const [showSrcPicker, setShowSrcPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    sourceId: '', sourceName: '',
    accountId: '', accountName: '',
    amount: '', description: '',
    currency: 'YER', exchangeRate: '1', refNumber: ''
  });

  useFocusEffect(useCallback(() => { loadAll(); }, []));
  const loadAll = async () => {
    setVouchers(await DataService.getVouchers() || []);
    setAccounts(await DataService.getAccounts() || []);
    setCurrencies(await DataService.getCurrencies() || []);
  };

  const srcAccs = accounts.filter((a: any) => {
    if (voucherType === 'cash') return String(a.parentId) === '111';
    if (voucherType === 'bank') return String(a.parentId) === '112';
    return String(a.parentId) === '113';
  });

  const genNum = () => {
    const prefix = activeTab === 'receipt' ? 'RV' : 'PV';
    const typeCode = voucherType === 'cash' ? 'C' : voucherType === 'bank' ? 'B' : 'E';
    return `${prefix}-${typeCode}-${Date.now().toString().slice(-6)}`;
  };

  const handleSave = async () => {
    if (!form.sourceName || !form.amount) return Alert.alert('خطأ', 'أكمل البيانات');
    const exchangeRate = parseFloat(form.exchangeRate) || 1;
    const amount = parseFloat(form.amount) || 0;
    const localAmount = form.currency !== 'YER' ? amount * exchangeRate : amount;
    
    await DataService.addVoucher({
      id: 'vch-' + Date.now(), number: genNum(), date: form.date,
      description: form.description, amount, localAmount,
      sourceName: form.sourceName, accountName: form.accountName,
      type: activeTab, voucherType, currency: form.currency, exchangeRate,
      refNumber: form.refNumber
    });
    setShowForm(false); loadAll();
  };

  const filtered = vouchers.filter((v: any) => 
    v.type === activeTab && (v.number?.includes(searchQuery) || v.sourceName?.includes(searchQuery))
  );

  const totalReceipts = vouchers.filter((v: any) => v.type === 'receipt').reduce((s: number, v: any) => s + (v.amount || 0), 0);
  const totalPayments = vouchers.filter((v: any) => v.type === 'payment').reduce((s: number, v: any) => s + (v.amount || 0), 0);

  const getVoucherTypeLabel = (t: string) => ({ 'cash': '💰 نقدي', 'bank': '🏦 بنكي', 'ewallet': '📱 محفظة' }[t] || t);

  return (
    <View style={[st.c, { paddingTop: insets.top }]}>
      <ControlHeader title="سندات القبض والصرف" count={vouchers.length} onBack={() => router.back()} onAdd={() => { setForm({ date: new Date().toISOString().split('T')[0], sourceId: '', sourceName: '', accountId: '', accountName: '', amount: '', description: '', currency: 'YER', exchangeRate: '1', refNumber: '' }); setShowForm(true); }} />
      
      <View style={st.tabs}>
        <TouchableOpacity style={[st.tab, activeTab==='receipt'&&st.tabA]} onPress={()=>setActiveTab('receipt')}>
          <Text style={[st.tabT, activeTab==='receipt'&&st.tabTA]}>📥 قبض</Text>
          <Text style={st.tabAm}>{totalReceipts.toLocaleString()} ﷼</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[st.tab, activeTab==='payment'&&st.tabA]} onPress={()=>setActiveTab('payment')}>
          <Text style={[st.tabT, activeTab==='payment'&&st.tabTA]}>📤 صرف</Text>
          <Text style={st.tabAm}>{totalPayments.toLocaleString()} ﷼</Text>
        </TouchableOpacity>
      </View>

      <ControlButtons showAdd showSearch showPrint showRefresh showExport onAdd={() => setShowForm(true)} onRefresh={loadAll} />
      <TextInput style={st.si} placeholder="🔍 بحث..." placeholderTextColor="#666" value={searchQuery} onChangeText={setSearchQuery} />
      
      {filtered.length === 0 ? <Text style={st.et}>لا توجد سندات</Text> :
        <FlatList data={filtered} keyExtractor={(i: any) => i.id}
          renderItem={({ item }: any) => (
            <TouchableOpacity style={[st.card, { borderLeftColor: item.type==='receipt'?'#10B981':'#EF4444', borderLeftWidth:4 }]}>
              <View style={st.row}>
                <Text style={st.cn}>{item.number}</Text>
                <Text style={[st.ca, { color: item.type==='receipt'?'#10B981':'#EF4444' }]}>
                  {item.type==='receipt'?'+':'-'}{(item.localAmount||item.amount||0).toLocaleString()} ﷼
                </Text>
              </View>
              <Text style={st.cd}>👤 {item.sourceName} → 📋 {item.accountName}</Text>
              <View style={st.row}>
                <Text style={st.cdt}>{item.date}</Text>
                <Text style={st.cdt}>{getVoucherTypeLabel(item.voucherType)} | {item.currency}</Text>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ padding: 12 }}
        />
      }

      <Modal visible={showForm} animationType="slide" transparent>
        <View style={st.mo}><View style={st.mc}>
          <View style={st.mh}><Text style={st.mt}>{activeTab==='receipt'?'سند قبض':'سند صرف'}</Text><TouchableOpacity onPress={()=>setShowForm(false)}><Text style={st.mx}>✕</Text></TouchableOpacity></View>
          <ScrollView style={{padding:16}}>
            <Text style={st.fl}>نوع السند</Text>
            <View style={st.typeRow}>
              {(['cash','bank','ewallet'] as const).map(t => (
                <TouchableOpacity key={t} style={[st.typeBtn, voucherType===t&&st.typeBtnA]} onPress={()=>setVoucherType(t)}>
                  <Text style={[st.typeText, voucherType===t&&st.typeTextA]}>{getVoucherTypeLabel(t)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={st.fl}>رقم السند</Text>
            <TextInput style={[st.fi, { color: '#D4AF37' }]} value={genNum()} editable={false} />

            <Text style={st.fl}>{voucherType==='cash'?'الصندوق':voucherType==='bank'?'البنك':'المحفظة'} *</Text>
            <TouchableOpacity style={st.pk} onPress={()=>setShowSrcPicker(true)}>
              <Text style={form.sourceName?st.pkt:st.pkp}>{form.sourceName||'اختيار'}</Text>
              <Text style={st.pka}>▼</Text>
            </TouchableOpacity>

            <Text style={st.fl}>الحساب</Text>
            <TouchableOpacity style={st.pk} onPress={()=>setShowAccPicker(true)}>
              <Text style={form.accountName?st.pkt:st.pkp}>{form.accountName||'اختيار الحساب'}</Text>
              <Text style={st.pka}>▼</Text>
            </TouchableOpacity>

            <Text style={st.fl}>العملة</Text>
            <View style={st.curRow}>
              {(currencies||[]).map((c: any) => (
                <TouchableOpacity key={c.id} style={[st.curBtn, form.currency===c.code&&st.curBtnA]} 
                  onPress={()=>setForm({...form, currency:c.code, exchangeRate:String(c.rate||1)})}>
                  <Text style={[st.curText, form.currency===c.code&&st.curTextA]}>{c.code}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={st.fl}>التاريخ</Text>
            <TextInput style={st.fi} value={form.date} onChangeText={v=>setForm({...form,date:v})} />

            <Text style={st.fl}>البيان</Text>
            <TextInput style={[st.fi,{height:60}]} value={form.description} onChangeText={v=>setForm({...form,description:v})} multiline placeholder="بيان السند" placeholderTextColor="#666" />

            <Text style={st.fl}>المبلغ *</Text>
            <TextInput style={[st.fi,{fontSize:18}]} value={form.amount} onChangeText={v=>setForm({...form,amount:v})} keyboardType="numeric" placeholder="0" placeholderTextColor="#666" />

            <Text style={st.fl}>رقم المرجع</Text>
            <TextInput style={st.fi} value={form.refNumber} onChangeText={v=>setForm({...form,refNumber:v})} placeholder="اختياري" placeholderTextColor="#666" />

            <View style={{flexDirection:'row',gap:8,marginTop:20}}>
              <TouchableOpacity style={[st.btn,{flex:1,backgroundColor:'#D4AF37'}]} onPress={handleSave}>
                <Text style={[st.btnt,{color:'#000'}]}>💾 حفظ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[st.btn,{flex:1,backgroundColor:'#2a3550'}]} onPress={()=>setShowForm(false)}>
                <Text style={st.btnt}>إلغاء</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View></View>
      </Modal>

      <PickerModal visible={showAccPicker} title="اختيار الحساب" data={accounts} displayField="name" subField="code" onSelect={(i:any)=>setForm({...form,accountId:i.id,accountName:i.name})} onClose={()=>setShowAccPicker(false)} />
      <PickerModal visible={showSrcPicker} title={voucherType==='cash'?'الصندوق':voucherType==='bank'?'البنك':'المحفظة'} data={srcAccs} displayField="name" onSelect={(i:any)=>setForm({...form,sourceId:i.id,sourceName:i.name})} onClose={()=>setShowSrcPicker(false)} />
    </View>
  );
}

const st = StyleSheet.create({
  c:{flex:1,backgroundColor:'#0A1128'},
  tabs:{flexDirection:'row',marginHorizontal:12,marginBottom:8,gap:6},
  tab:{flex:1,backgroundColor:'#16213E',borderRadius:10,padding:12,alignItems:'center',borderWidth:1,borderColor:'#2a3550'},
  tabA:{borderColor:'#D4AF37',backgroundColor:'#D4AF3710'},
  tabT:{color:'#94a3b8',fontSize:12},tabTA:{color:'#D4AF37',fontWeight:'bold'},
  tabAm:{color:'#FFF',fontSize:13,fontWeight:'bold',marginTop:4},
  si:{marginHorizontal:12,marginBottom:8,padding:10,backgroundColor:'#16213E',borderRadius:10,color:'#FFF',borderWidth:1,borderColor:'#2a3550',textAlign:'right'},
  et:{color:'#666',textAlign:'center',marginTop:40,fontSize:16},
  card:{backgroundColor:'#16213E',padding:14,marginHorizontal:12,marginVertical:4,borderRadius:12,borderWidth:1,borderColor:'#2a3550'},
  row:{flexDirection:'row',justifyContent:'space-between',marginBottom:4},
  cn:{color:'#D4AF37',fontSize:14,fontWeight:'bold'},ca:{fontSize:16,fontWeight:'bold'},
  cd:{color:'#FFF',fontSize:12,marginTop:4},cdt:{color:'#94a3b8',fontSize:10,marginTop:2},
  mo:{flex:1,backgroundColor:'rgba(0,0,0,0.7)',justifyContent:'flex-end'},mc:{backgroundColor:'#16213E',borderTopLeftRadius:20,borderTopRightRadius:20,maxHeight:'95%'},
  mh:{flexDirection:'row',justifyContent:'space-between',padding:16,borderBottomWidth:1,borderBottomColor:'#2a3550'},mt:{color:'#D4AF37',fontSize:18,fontWeight:'bold'},mx:{color:'#EF4444',fontSize:22},
  fl:{color:'#94a3b8',fontSize:13,marginBottom:6,marginTop:12},fi:{backgroundColor:'#0A1128',color:'#FFF',padding:10,borderRadius:8,textAlign:'right'},
  typeRow:{flexDirection:'row',gap:6},typeBtn:{flex:1,padding:10,borderRadius:8,backgroundColor:'#0A1128',alignItems:'center',borderWidth:1,borderColor:'#2a3550'},
  typeBtnA:{borderColor:'#D4AF37',backgroundColor:'#D4AF3720'},typeText:{color:'#94a3b8',fontSize:12},typeTextA:{color:'#D4AF37',fontWeight:'bold'},
  curRow:{flexDirection:'row',gap:4,flexWrap:'wrap'},curBtn:{paddingHorizontal:10,paddingVertical:6,borderRadius:12,backgroundColor:'#0A1128',borderWidth:1,borderColor:'#2a3550'},
  curBtnA:{borderColor:'#D4AF37',backgroundColor:'#D4AF3720'},curText:{color:'#94a3b8',fontSize:11},curTextA:{color:'#D4AF37',fontWeight:'bold'},
  pk:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',backgroundColor:'#0A1128',padding:12,borderRadius:8,borderWidth:1,borderColor:'#2a3550'},
  pkt:{color:'#FFF',fontSize:13},pkp:{color:'#666',fontSize:13},pka:{color:'#D4AF37',fontSize:11},
  btn:{padding:14,borderRadius:10,alignItems:'center'},btnt:{color:'#FFF',fontWeight:'bold',fontSize:16},
});
