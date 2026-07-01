import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, StatusBar, Alert, Modal, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalTable } from '../../hooks/useLocalStore';
import { useAccountStore } from '../../src/store/useAccountStore';
import { PickerModal } from '../../src/components/ui/PickerModal';
import { ControlButtons, ControlHeader } from '../../src/components/ui/ControlButtons';

export default function VouchersScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const { data: vouchers, add } = useLocalTable('vouchers');
  const { accounts, loadAccounts, getLeafAccounts } = useAccountStore();
  const { data: currencies } = useLocalTable('currencies');
  
  const [activeTab, setActiveTab] = useState<'receipt'|'payment'>('receipt');
  const [voucherType, setVoucherType] = useState<'cash'|'bank'|'ewallet'>('cash');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [showSourcePicker, setShowSourcePicker] = useState(false);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    sourceId: '', sourceName: '',
    currency: 'YER', exchangeRate: '1',
    accountId: '', accountName: '',
    description: '', amount: '', refNumber: ''
  });

  useFocusEffect(useCallback(() => { loadAccounts(); }, []));

  const leafAccounts = getLeafAccounts();
  
  // ✅ فلترة الحسابات حسب نوع السند
  const cashAccounts = accounts.filter((a: any) => a.parentId === '111');
  const bankAccounts = accounts.filter((a: any) => a.parentId === '112');
  const ewalletAccounts = accounts.filter((a: any) => a.parentId === '113');
  const sourceAccounts = voucherType === 'cash' ? cashAccounts : voucherType === 'bank' ? bankAccounts : ewalletAccounts;

  const filtered = vouchers.filter((v: any) => v.type === activeTab && (v.number?.includes(searchQuery) || v.accountName?.includes(searchQuery)));

  const generateNumber = () => {
    const prefix = activeTab === 'receipt' ? 'RV' : 'PV';
    const typeCode = voucherType === 'cash' ? 'C' : voucherType === 'bank' ? 'B' : 'E';
    return `${prefix}-${typeCode}-${Date.now().toString().slice(-6)}`;
  };

  const handleSave = async () => {
    if (!formData.sourceName || !formData.accountName || !formData.amount) {
      Alert.alert('خطأ', 'الرجاء تعبئة جميع الحقول'); return;
    }
    const exchangeRate = parseFloat(formData.exchangeRate) || 1;
    const amount = parseFloat(formData.amount) || 0;
    const localAmount = formData.currency !== 'YER' ? amount * exchangeRate : amount;
    
    await add({
      number: generateNumber(),
      type: activeTab,
      voucherType,
      ...formData,
      exchangeRate,
      amount,
      localAmount
    });
    setShowModal(false);
    Alert.alert('✅', 'تم حفظ السند بنجاح');
  };

  const getVoucherTypeLabel = (t: string) => ({ 'cash': '💰 نقدي', 'bank': '🏦 بنكي', 'ewallet': '📱 محفظة' }[t] || t);

  return (
    <View style={[st.c, { paddingTop: insets.top }]}><StatusBar barStyle="light-content" />
      <ControlHeader title="سندات القبض والصرف" count={vouchers.length} onBack={() => router.back()} 
        onAdd={() => {
          setFormData({ date: new Date().toISOString().split('T')[0], sourceId: '', sourceName: '', currency: 'YER', exchangeRate: '1', accountId: '', accountName: '', description: '', amount: '', refNumber: '' });
          setShowModal(true);
        }} 
      />
      
      <View style={st.tabs}>
        <TouchableOpacity style={[st.tab, activeTab==='receipt'&&st.tabA]} onPress={()=>setActiveTab('receipt')}>
          <Text style={[st.tabT, activeTab==='receipt'&&st.tabTA]}>📥 قبض</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[st.tab, activeTab==='payment'&&st.tabA]} onPress={()=>setActiveTab('payment')}>
          <Text style={[st.tabT, activeTab==='payment'&&st.tabTA]}>📤 صرف</Text>
        </TouchableOpacity>
      </View>

      <ControlButtons showSearch showPrint showRefresh showExport />
      <TextInput style={st.si} placeholder="🔍 بحث..." placeholderTextColor="#94a3b8" value={searchQuery} onChangeText={setSearchQuery} />
      
      {filtered.length === 0 ? <View style={st.e}><Text style={st.et}>لا توجد سندات</Text></View> :
        <FlatList data={filtered} keyExtractor={(i: any) => i.id}
          renderItem={({ item }: any) => (
            <TouchableOpacity style={[st.vc, { borderLeftColor: item.type==='receipt'?'#10B981':'#EF4444', borderLeftWidth:4 }]}>
              <View style={st.vh}>
                <Text style={st.vn}>{item.number}</Text>
                <Text style={[st.va, { color: item.type==='receipt'?'#10B981':'#EF4444' }]}>
                  {item.type==='receipt'?'+':'-'}{(item.localAmount||item.amount||0).toLocaleString()} ﷼
                </Text>
              </View>
              <Text style={st.vac}>{item.accountName}</Text>
              <Text style={st.vs}>{getVoucherTypeLabel(item.voucherType)} {item.sourceName}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ padding: 16 }}
        />
      }

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={st.mo}><View style={st.mc}><View style={st.mh}>
          <Text style={st.mt}>{activeTab==='receipt'?'سند قبض':'سند صرف'}</Text>
          <TouchableOpacity onPress={()=>setShowModal(false)}><Text style={st.mx}>✕</Text></TouchableOpacity>
        </View>
        <ScrollView style={st.mb}>
          <Text style={st.fl}>نوع السند</Text>
          <View style={st.tr}>
            {(['cash','bank','ewallet'] as const).map(t => (
              <TouchableOpacity key={t} style={[st.tb, voucherType===t&&st.tbA]} onPress={()=>setVoucherType(t)}>
                <Text style={[st.tbt, voucherType===t&&st.tbtA]}>{getVoucherTypeLabel(t)}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <Text style={st.fl}>رقم السند</Text>
          <TextInput style={[st.fi, { color: '#D4AF37' }]} value={generateNumber()} editable={false} />
          
          <Text style={st.fl}>{voucherType==='cash'?'الصندوق':voucherType==='bank'?'البنك':'المحفظة'} *</Text>
          <TouchableOpacity style={st.pk} onPress={()=>setShowSourcePicker(true)}>
            <Text style={formData.sourceName?st.pkt:st.pkp}>{formData.sourceName||'اختيار'}</Text>
            <Text style={st.pka}>▼</Text>
          </TouchableOpacity>
          
          <Text style={st.fl}>الحساب *</Text>
          <TouchableOpacity style={st.pk} onPress={()=>setShowAccountPicker(true)}>
            <Text style={formData.accountName?st.pkt:st.pkp}>{formData.accountName||'اختيار الحساب'}</Text>
            <Text style={st.pka}>▼</Text>
          </TouchableOpacity>
          
          <Text style={st.fl}>العملة</Text>
          <View style={st.cr}>
            {(currencies||[]).map((c: any) => (
              <TouchableOpacity key={c.id} style={[st.ch, formData.currency===c.code&&st.chA]} 
                onPress={()=>setFormData({...formData, currency:c.code, exchangeRate:c.rate?.toString()||'1'})}>
                <Text style={[st.cht, formData.currency===c.code&&st.chtA]}>{c.code}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <Text style={st.fl}>التاريخ</Text>
          <TextInput style={st.fi} value={formData.date} onChangeText={v=>setFormData({...formData,date:v})} />
          <Text style={st.fl}>البيان</Text>
          <TextInput style={[st.fi,{height:60}]} value={formData.description} onChangeText={v=>setFormData({...formData,description:v})} placeholder="بيان السند" placeholderTextColor="#666" multiline />
          <Text style={st.fl}>المبلغ *</Text>
          <TextInput style={[st.fi,{fontSize:18}]} value={formData.amount} onChangeText={v=>setFormData({...formData,amount:v})} keyboardType="numeric" placeholder="0" placeholderTextColor="#666" />
          <Text style={st.fl}>رقم المرجع</Text>
          <TextInput style={st.fi} value={formData.refNumber} onChangeText={v=>setFormData({...formData,refNumber:v})} />
          
          <View style={st.ma}>
            <TouchableOpacity style={st.sb} onPress={handleSave}><Text style={st.sbt}>💾 حفظ</Text></TouchableOpacity>
            <TouchableOpacity style={st.clb} onPress={()=>setShowModal(false)}><Text style={st.clt}>إلغاء</Text></TouchableOpacity>
          </View>
        </ScrollView></View></View>
      </Modal>

      <PickerModal visible={showAccountPicker} title="اختيار الحساب" data={leafAccounts} displayField="name" subField="code" onSelect={(i:any)=>setFormData({...formData,accountId:i.id,accountName:i.name})} onClose={()=>setShowAccountPicker(false)} />
      <PickerModal visible={showSourcePicker} title={voucherType==='cash'?'اختيار الصندوق':voucherType==='bank'?'اختيار البنك':'اختيار المحفظة'} data={sourceAccounts} displayField="name" onSelect={(i:any)=>setFormData({...formData,sourceId:i.id,sourceName:i.name})} onClose={()=>setShowSourcePicker(false)} />
    </View>
  );
}

const st = StyleSheet.create({
  c:{flex:1,backgroundColor:'#0A1128'},
  tabs:{flexDirection:'row',marginHorizontal:16,marginBottom:12,gap:8},
  tab:{flex:1,backgroundColor:'#16213E',borderRadius:12,padding:12,alignItems:'center',borderWidth:1,borderColor:'#2a3550'},
  tabA:{borderColor:'#D4AF37',backgroundColor:'#D4AF37'+'10'},
  tabT:{color:'#94a3b8',fontSize:13},tabTA:{color:'#D4AF37',fontWeight:'bold'},
  si:{marginHorizontal:16,marginBottom:12,padding:12,backgroundColor:'#16213E',borderRadius:10,color:'#FFF',borderWidth:1,borderColor:'#2a3550',textAlign:'right',fontSize:14},
  e:{flex:1,justifyContent:'center',alignItems:'center'},et:{color:'#FFF',fontSize:16},
  vc:{backgroundColor:'#16213E',borderRadius:14,padding:14,marginBottom:10,marginHorizontal:16,borderWidth:1,borderColor:'#2a3550'},
  vh:{flexDirection:'row',justifyContent:'space-between',marginBottom:8},
  vn:{color:'#D4AF37',fontSize:14,fontWeight:'bold'},va:{fontSize:16,fontWeight:'bold'},
  vac:{color:'#FFF',fontSize:14},vs:{color:'#94a3b8',fontSize:12},
  mo:{flex:1,backgroundColor:'rgba(0,0,0,0.7)',justifyContent:'flex-end'},
  mc:{backgroundColor:'#16213E',borderTopLeftRadius:20,borderTopRightRadius:20,maxHeight:'90%'},
  mh:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:16,borderBottomWidth:1,borderBottomColor:'#2a3550'},
  mt:{color:'#D4AF37',fontSize:18,fontWeight:'bold'},mx:{color:'#EF4444',fontSize:22,fontWeight:'bold'},
  mb:{padding:16},
  fl:{color:'#94a3b8',fontSize:13,marginBottom:6,marginTop:12},
  fi:{backgroundColor:'#0A1128',borderRadius:10,padding:12,color:'#FFF',borderWidth:1,borderColor:'#2a3550',fontSize:14},
  tr:{flexDirection:'row',gap:6,flexWrap:'wrap'},
  tb:{paddingVertical:10,paddingHorizontal:12,borderRadius:10,backgroundColor:'#0A1128',borderWidth:1,borderColor:'#2a3550'},
  tbA:{borderColor:'#D4AF37',backgroundColor:'#D4AF37'+'20'},
  tbt:{color:'#94a3b8',fontSize:12},tbtA:{color:'#D4AF37',fontWeight:'bold'},
  pk:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',backgroundColor:'#0A1128',borderRadius:10,padding:14,borderWidth:1,borderColor:'#2a3550'},
  pkt:{color:'#FFF',fontSize:14,flex:1},pkp:{color:'#666',fontSize:14,flex:1},pka:{color:'#D4AF37',fontSize:12},
  cr:{flexDirection:'row',flexWrap:'wrap',gap:4},
  ch:{paddingHorizontal:10,paddingVertical:6,borderRadius:12,backgroundColor:'#0A1128',borderWidth:1,borderColor:'#2a3550'},
  chA:{borderColor:'#D4AF37',backgroundColor:'#D4AF37'+'20'},
  cht:{color:'#94a3b8',fontSize:11},chtA:{color:'#D4AF37',fontWeight:'bold'},
  ma:{flexDirection:'row',gap:10,marginTop:24,marginBottom:16},
  sb:{flex:1,backgroundColor:'#D4AF37',borderRadius:12,padding:14,alignItems:'center'},
  sbt:{color:'#0A1128',fontSize:16,fontWeight:'bold'},
  clb:{flex:1,backgroundColor:'#2a3550',borderRadius:12,padding:14,alignItems:'center'},
  clt:{color:'#FFF',fontSize:16},
});
