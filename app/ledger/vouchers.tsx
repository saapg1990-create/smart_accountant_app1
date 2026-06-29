import { ControlButtons, ControlHeader } from '../../src/components/ui/ControlButtons';
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, StatusBar, Alert, Modal, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalTable } from '../../hooks/useLocalStore';
import { PickerModal } from '../../src/components/ui/PickerModal';

export default function VouchersScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const { data: vouchers, add, remove, update } = useLocalTable('vouchers');
  const { data: accounts } = useLocalTable('accounts');
  const { data: cashBoxes } = useLocalTable('cashBoxes');
  const { data: banks } = useLocalTable('banks');
  const { data: currencies } = useLocalTable('currencies');
  const [activeTab, setActiveTab] = useState<'receipt'|'payment'>('receipt');
  const [voucherType, setVoucherType] = useState<'cash'|'bank'>('cash');
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const [formData, setFormData] = useState({ date: new Date().toISOString().split('T')[0], sourceId: '', sourceName: '', sourceType: 'cash', currency: 'YER', exchangeRate: '1', accountId: '', accountName: '', description: '', amount: '', refNumber: '' });

  const sources = voucherType==='cash'?cashBoxes:banks;
  const exchangeRate = parseFloat(formData.exchangeRate)||1;
  const amount = parseFloat(formData.amount)||0;
  const localAmount = formData.currency!=='YER'?amount*exchangeRate:amount;
  const generateNumber = () => { const p=activeTab==='receipt'?'RV':'PV'; const tp=voucherType==='cash'?'C':'B'; const c=vouchers.filter((v:any)=>v.voucherType===voucherType&&v.type===activeTab).length; return `${p}-${tp}-${(c+1).toString().padStart(6,'0')}`; };
  
  const handleSave = async () => {
    if(!formData.sourceName||!formData.accountName||!formData.amount){Alert.alert('خطأ','الرجاء تعبئة جميع الحقول');return;}
    const data={number:generateNumber(),type:activeTab,voucherType,...formData,exchangeRate,amount,localAmount};
    if(editMode&&selectedVoucher){await update(selectedVoucher.id,data);}else{await add(data);}
    setShowModal(false);setEditMode(false);setSelectedVoucher(null);
  };
  const openEdit=(v:any)=>{setVoucherType(v.voucherType);setActiveTab(v.type);setFormData({date:v.date,sourceId:v.sourceId,sourceName:v.sourceName,sourceType:v.sourceType,currency:v.currency,exchangeRate:v.exchangeRate?.toString()||'1',accountId:v.accountId,accountName:v.accountName,description:v.description||'',amount:v.amount?.toString()||'',refNumber:v.refNumber||''});setSelectedVoucher(v);setEditMode(true);setShowModal(true);};

  const filtered = vouchers.filter((v:any)=>v.type===activeTab&&(v.number?.includes(searchQuery)||v.accountName?.includes(searchQuery)));
  const totalReceipts=vouchers.filter((v:any)=>v.type==='receipt').reduce((s:number,v:any)=>s+(v.localAmount||v.amount||0),0);
  const totalPayments=vouchers.filter((v:any)=>v.type==='payment').reduce((s:number,v:any)=>s+(v.localAmount||v.amount||0),0);

  return (
    <View style={[st.c,{paddingTop:insets.top}]}><StatusBar barStyle="light-content"/>
      <View style={st.h}><TouchableOpacity onPress={()=>router.back()}><Text style={st.bt}>←</Text></TouchableOpacity><Text style={st.t}>سندات القبض والصرف</Text><TouchableOpacity style={st.ab} onPress={()=>{setEditMode(false);setSelectedVoucher(null);setFormData({date:new Date().toISOString().split('T')[0],sourceId:'',sourceName:'',sourceType:voucherType,currency:'YER',exchangeRate:'1',accountId:'',accountName:'',description:'',amount:'',refNumber:''});setShowModal(true);}}><Text style={st.atx}>+</Text></TouchableOpacity></View>
      <View style={st.tabs}>
        <TouchableOpacity style={[st.tab,activeTab==='receipt'&&st.tabA]} onPress={()=>setActiveTab('receipt')}><Text style={[st.tabT,activeTab==='receipt'&&st.tabTA]}>📥 قبض</Text><Text style={st.tabAm}>{totalReceipts.toLocaleString()} ﷼</Text></TouchableOpacity>
        <TouchableOpacity style={[st.tab,activeTab==='payment'&&st.tabA]} onPress={()=>setActiveTab('payment')}><Text style={[st.tabT,activeTab==='payment'&&st.tabTA]}>📤 صرف</Text><Text style={st.tabAm}>{totalPayments.toLocaleString()} ﷼</Text></TouchableOpacity>
      </View>
      <View style={st.cb}><TextInput style={st.si} placeholder="🔍 بحث..." placeholderTextColor="#94a3b8" value={searchQuery} onChangeText={setSearchQuery}/><TouchableOpacity style={st.pb}><Text>🖨️</Text></TouchableOpacity></View>
      {filtered.length===0?<View style={st.e}><Text style={st.ei}>🧾</Text><Text style={st.et}>لا توجد سندات</Text></View>:
        <FlatList data={filtered} keyExtractor={(i:any)=>i.id} renderItem={({item}:any)=>(
          <TouchableOpacity style={[st.vc,{borderLeftColor:item.type==='receipt'?'#10B981':'#EF4444',borderLeftWidth:4}]} onPress={()=>openEdit(item)} onLongPress={()=>Alert.alert('حذف',`حذف "${item.number}"؟`,[{text:'حذف',style:'destructive',onPress:()=>remove(item.id)},{text:'إلغاء'}])}>
            <View style={st.vh}><View><Text style={st.vn}>{item.number}</Text><Text style={st.vd}>{item.date}</Text></View><Text style={[st.va,{color:item.type==='receipt'?'#10B981':'#EF4444'}]}>{item.type==='receipt'?'+':'-'}{(item.localAmount||item.amount||0).toLocaleString()} ﷼</Text></View>
            <Text style={st.vac}>{item.accountName}</Text><View style={st.vf}><Text style={st.vs}>{item.voucherType==='cash'?'💰':'🏦'} {item.sourceName}</Text>{item.refNumber?<Text style={st.vr}>#{item.refNumber}</Text>:null}</View>
          </TouchableOpacity>
        )} contentContainerStyle={{padding:16}}/>
      }
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={st.mo}><View style={[st.mc,{maxHeight:'95%'}]}><View style={st.mh}><Text style={st.mt}>{editMode?'تعديل':'إضافة'} سند {activeTab==='receipt'?'قبض':'صرف'}</Text><TouchableOpacity onPress={()=>setShowModal(false)}><Text style={st.mx}>✕</Text></TouchableOpacity></View>
        <ScrollView style={st.mb}>
          <Text style={st.fl}>نوع السند</Text>
          <View style={st.tr}><TouchableOpacity style={[st.tb,voucherType==='cash'&&st.tbA]} onPress={()=>{setVoucherType('cash');setFormData({...formData,sourceType:'cash',sourceId:'',sourceName:''});}}><Text style={[st.tbt,voucherType==='cash'&&st.tbtA]}>💰 نقدي</Text></TouchableOpacity><TouchableOpacity style={[st.tb,voucherType==='bank'&&st.tbA]} onPress={()=>{setVoucherType('bank');setFormData({...formData,sourceType:'bank',sourceId:'',sourceName:''});}}><Text style={[st.tbt,voucherType==='bank'&&st.tbtA]}>🏦 بنكي</Text></TouchableOpacity></View>
          <Text style={st.fl}>رقم السند</Text><TextInput style={[st.fi,{color:'#D4AF37',fontWeight:'bold'}]} value={generateNumber()} editable={false}/>
          <Text style={st.fl}>{voucherType==='cash'?'الصندوق':'البنك/المحفظة'} *</Text>
          <TouchableOpacity style={st.pk} onPress={()=>setShowSourcePicker(true)}><Text style={formData.sourceName?st.pkt:st.pkp}>{formData.sourceName||`اختيار ${voucherType==='cash'?'الصندوق':'البنك'}`}</Text><Text style={st.pka}>▼</Text></TouchableOpacity>
          <Text style={st.fl}>الحساب {activeTab==='receipt'?'الدائن':'المدين'} *</Text>
          <TouchableOpacity style={st.pk} onPress={()=>setShowAccountPicker(true)}><Text style={formData.accountName?st.pkt:st.pkp}>{formData.accountName||'اختيار الحساب'}</Text><Text style={st.pka}>▼</Text></TouchableOpacity>
          <Text style={st.fl}>العملة</Text><View style={st.cr}>{(currencies||[]).map((c:any)=><TouchableOpacity key={c.id} style={[st.ch,formData.currency===c.code&&st.chA]} onPress={()=>setFormData({...formData,currency:c.code,exchangeRate:c.rate?.toString()||'1'})}><Text style={[st.cht,formData.currency===c.code&&st.chtA]}>{c.code}</Text></TouchableOpacity>)}</View>
          {formData.currency!=='YER'&&<><Text style={st.fl}>سعر الصرف</Text><TextInput style={st.fi} value={formData.exchangeRate} onChangeText={v=>setFormData({...formData,exchangeRate:v})} keyboardType="numeric"/><Text style={st.la}>المبلغ بالريال: {localAmount.toLocaleString()} ﷼</Text></>}
          <Text style={st.fl}>التاريخ</Text><TextInput style={st.fi} value={formData.date} onChangeText={v=>setFormData({...formData,date:v})}/>
          <Text style={st.fl}>البيان</Text><TextInput style={[st.fi,{height:60}]} value={formData.description} onChangeText={v=>setFormData({...formData,description:v})} placeholder="بيان السند" placeholderTextColor="#666" multiline/>
          <Text style={st.fl}>المبلغ *</Text><TextInput style={[st.fi,{fontSize:18}]} value={formData.amount} onChangeText={v=>setFormData({...formData,amount:v})} keyboardType="numeric" placeholder="0" placeholderTextColor="#666"/>
          <Text style={st.la}>المبلغ بالريال: {localAmount.toLocaleString()} ﷼</Text>
          <Text style={st.fl}>رقم المرجع</Text><TextInput style={st.fi} value={formData.refNumber} onChangeText={v=>setFormData({...formData,refNumber:v})} placeholder="اختياري" placeholderTextColor="#666"/>
          <View style={st.ma}><TouchableOpacity style={st.sb} onPress={handleSave}><Text style={st.sbt}>💾 {editMode?'تحديث':'حفظ'}</Text></TouchableOpacity><TouchableOpacity style={st.clb} onPress={()=>setShowModal(false)}><Text style={st.clt}>إلغاء</Text></TouchableOpacity></View>
        </ScrollView></View></View>
      </Modal>
      <PickerModal visible={showAccountPicker} title="اختيار الحساب" data={accounts||[]} displayField="name" subField="code" onSelect={(i:any)=>{setFormData({...formData,accountId:i.id,accountName:i.name});}} onClose={()=>setShowAccountPicker(false)}/>
      <PickerModal visible={showSourcePicker} title={`اختيار ${voucherType==='cash'?'الصندوق':'البنك'}`} data={sources||[]} displayField="name" onSelect={(i:any)=>{setFormData({...formData,sourceId:i.id,sourceName:i.name||i.accountName});}} onClose={()=>setShowSourcePicker(false)}/>
    </View>
  );
}
const st=StyleSheet.create({c:{flex:1,backgroundColor:'#0A1128'},h:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingHorizontal:16,paddingVertical:12},bt:{fontSize:24,color:'#D4AF37',fontWeight:'bold'},t:{fontSize:18,fontWeight:'bold',color:'#FFF'},ab:{width:36,height:36,borderRadius:18,backgroundColor:'#D4AF37'+'20',justifyContent:'center',alignItems:'center',borderWidth:1,borderColor:'#D4AF37'},atx:{fontSize:20,color:'#D4AF37',fontWeight:'bold'},
  tabs:{flexDirection:'row',marginHorizontal:16,marginBottom:12,gap:8},tab:{flex:1,backgroundColor:'#16213E',borderRadius:12,padding:12,alignItems:'center',borderWidth:1,borderColor:'#2a3550'},tabA:{borderColor:'#D4AF37',backgroundColor:'#D4AF37'+'10'},tabT:{color:'#94a3b8',fontSize:13,marginBottom:4},tabTA:{color:'#D4AF37',fontWeight:'bold'},tabAm:{color:'#FFF',fontSize:14,fontWeight:'bold'},
  cb:{flexDirection:'row',paddingHorizontal:16,marginBottom:12,gap:8},si:{flex:1,backgroundColor:'#16213E',borderRadius:10,padding:10,color:'#FFF',borderWidth:1,borderColor:'#2a3550',textAlign:'right',fontSize:14},pb:{backgroundColor:'#16213E',borderRadius:10,padding:10,justifyContent:'center',borderWidth:1,borderColor:'#2a3550'},
  e:{flex:1,justifyContent:'center',alignItems:'center'},ei:{fontSize:48,marginBottom:12},et:{color:'#FFF',fontSize:16,fontWeight:'bold'},
  vc:{backgroundColor:'#16213E',borderRadius:14,padding:14,marginBottom:10,borderWidth:1,borderColor:'#2a3550'},vh:{flexDirection:'row',justifyContent:'space-between',marginBottom:8},vn:{color:'#D4AF37',fontSize:14,fontWeight:'bold'},vd:{color:'#94a3b8',fontSize:11},va:{fontSize:16,fontWeight:'bold'},vac:{color:'#FFF',fontSize:14,marginBottom:6},vf:{flexDirection:'row',justifyContent:'space-between',borderTopWidth:1,borderTopColor:'#2a3550',paddingTop:8},vs:{color:'#94a3b8',fontSize:12},vr:{color:'#6B7280',fontSize:11},
  mo:{flex:1,backgroundColor:'rgba(0,0,0,0.7)',justifyContent:'flex-end'},mc:{backgroundColor:'#16213E',borderTopLeftRadius:20,borderTopRightRadius:20,maxHeight:'95%'},mh:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:16,borderBottomWidth:1,borderBottomColor:'#2a3550'},mt:{color:'#D4AF37',fontSize:18,fontWeight:'bold'},mx:{color:'#EF4444',fontSize:22,fontWeight:'bold'},mb:{padding:16},
  fl:{color:'#94a3b8',fontSize:13,marginBottom:6,marginTop:12},fi:{backgroundColor:'#0A1128',borderRadius:10,padding:12,color:'#FFF',borderWidth:1,borderColor:'#2a3550',fontSize:14},
  tr:{flexDirection:'row',gap:8},tb:{flex:1,paddingVertical:12,borderRadius:10,backgroundColor:'#0A1128',borderWidth:1,borderColor:'#2a3550',alignItems:'center'},tbA:{borderColor:'#D4AF37',backgroundColor:'#D4AF37'+'20'},tbt:{color:'#94a3b8',fontSize:13},tbtA:{color:'#D4AF37',fontWeight:'bold'},
  pk:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',backgroundColor:'#0A1128',borderRadius:10,padding:14,borderWidth:1,borderColor:'#2a3550'},pkt:{color:'#FFF',fontSize:14,flex:1},pkp:{color:'#666',fontSize:14,flex:1},pka:{color:'#D4AF37',fontSize:12,marginLeft:8},
  cr:{flexDirection:'row',flexWrap:'wrap',gap:4},ch:{paddingHorizontal:10,paddingVertical:6,borderRadius:12,backgroundColor:'#0A1128',borderWidth:1,borderColor:'#2a3550'},chA:{borderColor:'#D4AF37',backgroundColor:'#D4AF37'+'20'},cht:{color:'#94a3b8',fontSize:11},chtA:{color:'#D4AF37',fontWeight:'bold'},
  la:{color:'#F59E0B',fontSize:12,textAlign:'right',marginTop:4},ma:{flexDirection:'row',gap:10,marginTop:24,marginBottom:16},sb:{flex:1,backgroundColor:'#D4AF37',borderRadius:12,padding:14,alignItems:'center'},sbt:{color:'#0A1128',fontSize:16,fontWeight:'bold'},clb:{flex:1,backgroundColor:'#2a3550',borderRadius:12,padding:14,alignItems:'center'},clt:{color:'#FFF',fontSize:16},
});
