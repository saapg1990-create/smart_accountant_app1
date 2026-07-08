import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, StatusBar, Alert, Modal, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAccountStore } from '../../src/store/useAccountStore';
import { Selector } from '../../src/components/common/Selector';
import { ControlButtons, ControlHeader } from '../../src/components/ui/ControlButtons';

const ICONS: any = { 'الأصول':'🏢','الخصوم':'💳','حقوق الملكية':'👑','الإيرادات':'💰','المصروفات':'💸','الصندوق':'💵','البنوك':'🏦','المحافظ':'📱','العملاء':'👥','المخزون':'📦','الموردين':'🏭' };
const CURRENCY_SYMBOLS: any = { 'YER': '﷼', 'USD': '$', 'SAR': '﷼', 'EUR': '€' };

export default function AccountsScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const { accounts, loadAccounts, addAccount, updateAccount, removeAccount, getMainAccounts, getSubAccounts, generateCode } = useAccountStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('الكل');
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', code: '', type: 'أصل', balance: '0', parentId: '', parentName: '', currency: 'YER', isDebit: true, bankAccount: '', walletPhone: '', notes: '' });
  const types = ['الكل', 'أصل', 'خصم', 'إيراد', 'مصروف', 'ملكية'];

  useFocusEffect(useCallback(() => { loadAccounts(); }, []));
  const [refreshKey, setRefreshKey] = useState(0);
  const getColor = (t: string) => ({ 'أصل':'#D4AF37','خصم':'#EF4444','ملكية':'#F59E0B','إيراد':'#10B981','مصروف':'#3B82F6' }[t] || '#6B7280');

  const openAdd = (parentId='', parentName='', parentType='أصل') => {
    setEditMode(false); setEditingId(null);
    setFormData({ name:'', code:'', type:parentType, balance:'0', parentId, parentName, currency:'YER', isDebit:true, bankAccount:'', walletPhone:'', notes:'' });
    setShowModal(true);
  };

  const openEdit = (acc: any) => {
    setEditMode(true); setEditingId(acc.id);
    const parent = accounts.find((a:any)=>a.id===acc.parentId);
    setFormData({ name:acc.name, code:acc.code, type:acc.type, balance:String(Math.abs(acc.balance||0)), parentId:acc.parentId||'', parentName:parent?.name||'', currency:acc.currency||'YER', isDebit:(acc.balance||0)>=0, bankAccount:acc.bankAccount||'', walletPhone:acc.walletPhone||'', notes:acc.notes||'' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) { Alert.alert('خطأ','أدخل اسم الحساب'); return; }
    const code = formData.code || generateCode(formData.parentId || undefined);
    const balance = parseFloat(formData.balance) || 0;
    const finalBalance = formData.isDebit ? balance : -balance;
    if (editMode && editingId) { await updateAccount(editingId, { ...formData, code, balance: finalBalance }); }
    else { await addAccount({ ...formData, code, balance: finalBalance }); }
    setShowModal(false); setTimeout(() => { loadAccounts(); setRefreshKey(prev => prev + 1); }, 300);
  };

  const mainAccounts = getMainAccounts().filter((m:any) => selectedType==='الكل' || m.type===selectedType);
  const displayList: any[] = [];
  mainAccounts.forEach((main: any) => {
    if (!searchQuery || main.name.includes(searchQuery) || main.code.includes(searchQuery)) displayList.push({ level: 1, data: main, color: getColor(main.type) });
    getSubAccounts(main.id).forEach((child: any) => {
      if (!searchQuery || child.name.includes(searchQuery) || child.code.includes(searchQuery)) displayList.push({ level: 2, data: child, color: getColor(child.type) });
      getSubAccounts(child.id).forEach((grand: any) => {
        if (!searchQuery || grand.name.includes(searchQuery) || grand.code.includes(searchQuery)) displayList.push({ level: 3, data: grand, color: getColor(grand.type) });
      });
    });
  });

  return (
    <View style={[st.c, { paddingTop: insets.top }]}><StatusBar barStyle="light-content" />
      <ControlHeader title="دليل الحسابات" count={accounts.length} onBack={() => router.back()} onAdd={() => openAdd()} />
      <ControlButtons showSearch showRefresh onRefresh={() => { loadAccounts(); setRefreshKey(prev => prev + 1); }} />
      <TextInput style={st.si} placeholder="🔍 بحث..." placeholderTextColor="#94a3b8" value={searchQuery} onChangeText={setSearchQuery} />
      <ScrollView horizontal style={{maxHeight:40,marginBottom:8}} contentContainerStyle={{flexDirection:'row',paddingHorizontal:12,gap:6}}>
        {types.map(t => <TouchableOpacity key={t} style={[st.fb, selectedType===t&&st.fba]} onPress={()=>setSelectedType(t)}><Text style={[st.ft, selectedType===t&&st.fta]}>{t}</Text></TouchableOpacity>)}
      </ScrollView>
      <FlatList key={refreshKey} data={displayList} keyExtractor={(i,idx)=>i.data.id+idx}
        renderItem={({item}) => {
          const acc = item.data; const ml = (item.level-1)*20;
          const nature = (acc.balance||0) >= 0 ? 'مدين' : 'دائن';
          return (
            <TouchableOpacity style={[item.level===1?st.l1:item.level===2?st.l2:st.l3, {marginLeft:ml}]} onPress={()=>openEdit(acc)} onLongPress={()=>{ if(getSubAccounts(acc.id).length===0) Alert.alert('حذف',`حذف "${acc.name}"؟`,[{text:'حذف',onPress:()=>removeAccount(acc.id)},{text:'إلغاء'}]); }}>
              <View style={{flexDirection:'row',alignItems:'center'}}>
                <Text style={{fontSize:24}}>{ICONS[acc.name]||'📋'}</Text>
                <View style={{flex:1,marginLeft:8}}>
                  <Text style={{color:'#FFF',fontSize:14,fontWeight:'bold',textAlign:'right'}}>{acc.name}</Text>
                  <Text style={{color:'#94a3b8',fontSize:10,textAlign:'right'}}>كود: {acc.code} | 💱 {acc.currency}</Text>
                </View>
                <View style={{alignItems:'flex-end',marginRight:4}}>
                  <Text style={{color:(acc.balance||0)>=0?'#10B981':'#EF4444',fontSize:13,fontWeight:'bold'}}>{Math.abs(acc.balance||0).toLocaleString()} ﷼</Text>
                  <Text style={{color:nature==='مدين'?'#10B981':'#EF4444',fontSize:9}}>{nature}</Text>
                </View>
                <TouchableOpacity style={{backgroundColor:'#10B98120',width:26,height:26,borderRadius:13,justifyContent:'center',alignItems:'center'}} onPress={()=>openAdd(acc.id,acc.name,acc.type)}><Text style={{color:'#10B981',fontSize:14}}>+</Text></TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={<View style={{alignItems:'center',marginTop:60}}><Text style={{fontSize:64}}>📚</Text><Text style={{color:'#666',fontSize:16}}>لا توجد حسابات</Text></View>}
        contentContainerStyle={{padding:12}}
      />
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={st.mo}><View style={st.mc}><View style={{flexDirection:'row',justifyContent:'space-between',padding:16,borderBottomWidth:1,borderBottomColor:'#2a3550'}}><Text style={{color:'#D4AF37',fontSize:16,fontWeight:'bold'}}>{editMode?'✏️ تعديل':formData.parentName?`➕ فرعي: ${formData.parentName}`:'📁 رئيسي جديد'}</Text><TouchableOpacity onPress={()=>setShowModal(false)}><Text style={{color:'#EF4444',fontSize:22}}>✕</Text></TouchableOpacity></View>
        <ScrollView style={{padding:16}}>
          {/* الحساب الأب - Selector ذكي */}
          <Text style={st.fl}>الحساب الأب</Text>
          <Selector label="" tableName="accounts" displayField="name" subField="code" selectedId={formData.parentId} selectedName={formData.parentName} onSelect={(i:any)=>setFormData({...formData,parentId:i.id,parentName:i.name,type:i.type})} placeholder="اختر الحساب الأب (اختياري)" />

          <Text style={st.fl}>اسم الحساب *</Text><TextInput style={st.fi} value={formData.name} onChangeText={v=>setFormData({...formData,name:v})} placeholder="اسم الحساب" placeholderTextColor="#666" />
          <Text style={st.fl}>الكود (تلقائي)</Text><TextInput style={[st.fi,{color:'#D4AF37'}]} value={formData.code||generateCode(formData.parentId||undefined)} editable={false} />
          
          {!formData.parentId && (<>
            <Text style={st.fl}>نوع الحساب</Text>
            <View style={{flexDirection:'row',flexWrap:'wrap',gap:6}}>{types.filter(t=>t!=='الكل').map(t=><TouchableOpacity key={t} style={[st.tb,formData.type===t&&st.tba]} onPress={()=>setFormData({...formData,type:t})}><Text style={[st.tt,formData.type===t&&st.tta]}>{t}</Text></TouchableOpacity>)}</View>
          </>)}

          <Text style={st.fl}>الطبيعة</Text>
          <View style={{flexDirection:'row',gap:8}}>
            <TouchableOpacity style={[st.tb,{flex:1},formData.isDebit&&st.tba]} onPress={()=>setFormData({...formData,isDebit:true})}><Text style={[st.tt,formData.isDebit&&st.tta]}>مدين</Text></TouchableOpacity>
            <TouchableOpacity style={[st.tb,{flex:1},!formData.isDebit&&st.tba]} onPress={()=>setFormData({...formData,isDebit:false})}><Text style={[st.tt,!formData.isDebit&&st.tta]}>دائن</Text></TouchableOpacity>
          </View>

          <Text style={st.fl}>العملة</Text><TextInput style={st.fi} value={formData.currency} onChangeText={v=>setFormData({...formData,currency:v})} placeholder="YER" placeholderTextColor="#666" />

          <Text style={st.fl}>الرصيد الافتتاحي</Text><TextInput style={st.fi} value={formData.balance} onChangeText={v=>setFormData({...formData,balance:v})} keyboardType="numeric" placeholder="0" placeholderTextColor="#666" />

          {/* حقول إضافية حسب النوع */}
          {(formData.name.includes('بنك') || formData.parentName.includes('بنك')) && (<><Text style={st.fl}>رقم الحساب البنكي</Text><TextInput style={st.fi} value={formData.bankAccount} onChangeText={v=>setFormData({...formData,bankAccount:v})} placeholder="رقم الحساب" placeholderTextColor="#666" /></>)}
          {(formData.name.includes('محفظ') || formData.parentName.includes('محفظ')) && (<><Text style={st.fl}>رقم الهاتف</Text><TextInput style={st.fi} value={formData.walletPhone} onChangeText={v=>setFormData({...formData,walletPhone:v})} placeholder="رقم الجوال" placeholderTextColor="#666" keyboardType="phone-pad" /></>)}

          <Text style={st.fl}>ملاحظات</Text><TextInput style={[st.fi,{height:60}]} value={formData.notes} onChangeText={v=>setFormData({...formData,notes:v})} multiline placeholder="ملاحظات" placeholderTextColor="#666" />
          
          <TouchableOpacity style={st.sb} onPress={handleSave}><Text style={st.sbt}>💾 {editMode?'تحديث':'حفظ'}</Text></TouchableOpacity>
        </ScrollView></View></View>
      </Modal>
    </View>
  );
}
const st = StyleSheet.create({
  c:{flex:1,backgroundColor:'#0A1128'},si:{marginHorizontal:12,marginBottom:6,padding:12,backgroundColor:'#16213E',borderRadius:10,color:'#FFF',borderWidth:1,borderColor:'#2a3550',textAlign:'right'},
  fb:{paddingHorizontal:14,paddingVertical:7,borderRadius:20,backgroundColor:'#16213E',borderWidth:1,borderColor:'#2a3550'},fba:{backgroundColor:'#D4AF3720',borderColor:'#D4AF37'},ft:{color:'#94a3b8',fontSize:12},fta:{color:'#D4AF37',fontWeight:'bold'},
  l1:{backgroundColor:'#16213E',borderRadius:14,padding:14,marginBottom:6,borderWidth:1,borderColor:'#2a3550'},
  l2:{backgroundColor:'#192140',borderRadius:11,padding:12,marginBottom:5,borderWidth:1,borderColor:'#2a3550'},
  l3:{backgroundColor:'#1c2545',borderRadius:9,padding:10,marginBottom:4,borderWidth:1,borderColor:'#2a3550'},
  mo:{flex:1,backgroundColor:'rgba(0,0,0,0.7)',justifyContent:'flex-end'},mc:{backgroundColor:'#16213E',borderTopLeftRadius:20,borderTopRightRadius:20,maxHeight:'90%'},
  fl:{color:'#94a3b8',fontSize:13,marginBottom:6,marginTop:12},fi:{backgroundColor:'#0A1128',borderRadius:10,padding:12,color:'#FFF',borderWidth:1,borderColor:'#2a3550',fontSize:14,textAlign:'right'},
  tb:{paddingVertical:8,paddingHorizontal:14,borderRadius:8,backgroundColor:'#0A1128',borderWidth:1,borderColor:'#2a3550'},tba:{borderColor:'#D4AF37',backgroundColor:'#D4AF3720'},tt:{color:'#94a3b8',fontSize:12},tta:{color:'#D4AF37',fontWeight:'bold'},
  sb:{backgroundColor:'#D4AF37',borderRadius:12,padding:14,alignItems:'center',marginTop:20,marginBottom:20},sbt:{color:'#0A1128',fontSize:16,fontWeight:'bold'},
});
