import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, StatusBar, Alert, Modal, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAccountStore } from '../../src/store/useAccountStore';
import { useLocalTable } from '../../hooks/useLocalStore';
import { PickerModal } from '../../src/components/ui/PickerModal';
import { ControlButtons, ControlHeader } from '../../src/components/ui/ControlButtons';

const ICONS: Record<string, string> = {
  'الأصول':'🏢','الخصوم':'💳','حقوق الملكية':'👑','الإيرادات':'💰','المصروفات':'💸',
  'الأصول المتداولة':'💎','الأصول الثابتة':'🏗️','الخصوم المتداولة':'📋','الخصوم طويلة الأجل':'📑',
  'رأس المال':'🏛️','المبيعات':'🛒','المشتريات':'📥',
  'الصندوق':'💵','البنوك':'🏦','المحافظ الإلكترونية':'📱','العملاء':'👥','المخزون':'📦',
  'الموردين':'🏭','الضرائب المستحقة':'🧾','رواتب وأجور':'👷','إيجارات':'🏠','مصاريف تشغيلية':'🔧'
};

export default function AccountsScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const { accounts, loading, loadAccounts, addAccount, updateAccount, removeAccount, generateCode } = useAccountStore();
  const { data: currencies } = useLocalTable('currencies');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('الكل');
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '', code: '', type: 'أصل', balance: '0', parentId: '',
    currency: 'YER', bankAccount: '', walletPhone: '', notes: ''
  });
  const [parentName, setParentName] = useState('');
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const types = ['الكل', 'أصل', 'خصم', 'إيراد', 'مصروف', 'ملكية'];

  useFocusEffect(useCallback(() => { loadAccounts(); }, []));

  const getColor = (t: string) => ({ 'أصل':'#D4AF37','خصم':'#EF4444','ملكية':'#F59E0B','إيراد':'#10B981','مصروف':'#3B82F6' }[t] || '#6B7280');

  const openAdd = (parentId='', parentName='', parentType='أصل') => {
    setEditMode(false); setEditingId(null);
    setFormData({ name:'', code:'', type:parentType, balance:'0', parentId, currency:'YER', bankAccount:'', walletPhone:'', notes:'' }); 
    setParentName(parentName); setShowModal(true);
  };

  const openEdit = (acc: any) => {
    setEditMode(true); setEditingId(acc.id);
    setFormData({
      name:acc.name, code:acc.code, type:acc.type, balance:String(acc.balance||0), parentId:acc.parentId||'',
      currency:acc.currency||'YER', bankAccount:acc.bankAccount||'', walletPhone:acc.walletPhone||'', notes:acc.notes||''
    });
    setParentName(acc.parentId ? (accounts.find((a:any)=>a.id===acc.parentId)?.name||'') : ''); 
    setShowModal(true);
  };

  const handleDelete = (acc: any) => {
    const subs = accounts.filter((a: any) => a.parentId === acc.id);
    if (subs.length > 0) { Alert.alert('تنبيه','لا يمكن حذف حساب له فروع'); return; }
    Alert.alert('حذف',`حذف "${acc.name}"؟`,[{text:'إلغاء'},{text:'حذف',onPress:()=>removeAccount(acc.id)}]);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) { Alert.alert('خطأ','أدخل اسم الحساب'); return; }
    const code = formData.code || generateCode(formData.parentId || undefined);
    const data = { ...formData, code, balance: parseFloat(formData.balance) || 0 };
    
    if (editMode && editingId) { await updateAccount(editingId, data); }
    else { await addAccount(data); }
    
    setShowModal(false);
    setTimeout(() => { loadAccounts(); setRefreshKey(prev => prev + 1); }, 400);
  };

  // بناء شجرة تكراري
  const buildTree = () => {
    const mainAccounts = accounts.filter((a: any) => {
      const pid = a.parentId;
      return (!pid || pid === '' || pid === 'null') && (selectedType === 'الكل' || a.type === selectedType);
    });
    const result: any[] = [];
    const addChildren = (parentId: string, level: number) => {
      const children = accounts.filter((a: any) => a.parentId === parentId);
      children.forEach((child: any) => {
        if (searchQuery && !child.name.includes(searchQuery) && !child.code.includes(searchQuery)) return;
        result.push({ level, data: child, color: getColor(child.type) });
        addChildren(child.id, level + 1);
      });
    };
    mainAccounts.forEach((main: any) => {
      if (searchQuery && !main.name.includes(searchQuery) && !main.code.includes(searchQuery)) return;
      result.push({ level: 1, data: main, color: getColor(main.type) });
      addChildren(main.id, 2);
    });
    return result;
  };

  const displayList = buildTree();

  const isBankAccount = (acc: any) => acc.parentId === '112' || acc.name?.includes('بنك');
  const isWallet = (acc: any) => acc.parentId === '113' || acc.name?.includes('محفظ');

  return (
    <View style={[st.c, { paddingTop: insets.top }]}><StatusBar barStyle="light-content" />
      <ControlHeader title="دليل الحسابات" count={accounts.length} onBack={() => router.back()} onAdd={() => openAdd()} />
      <ControlButtons showSearch showRefresh showPrint showExport onRefresh={() => { loadAccounts(); setRefreshKey(prev => prev + 1); }} />
      <TextInput style={st.si} placeholder="🔍 بحث..." placeholderTextColor="#94a3b8" value={searchQuery} onChangeText={setSearchQuery} />
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{maxHeight:40,marginBottom:8}} contentContainerStyle={{flexDirection:'row',paddingHorizontal:12,gap:6}}>
        {types.map(t => <TouchableOpacity key={t} style={[st.fb, selectedType===t&&st.fba]} onPress={()=>setSelectedType(t)}><Text style={[st.ft, selectedType===t&&st.fta]}>{t}</Text></TouchableOpacity>)}
      </ScrollView>

      {loading ? <Text style={{color:'#D4AF37',textAlign:'center',marginTop:40}}>⏳ جاري التحميل...</Text> :
        <FlatList key={refreshKey} data={displayList} keyExtractor={(i,idx)=>i.data.id+idx}
          renderItem={({item}) => {
            const acc = item.data; const subs = accounts.filter((a: any) => a.parentId === acc.id); const ml = (item.level-1)*22;
            return (
              <TouchableOpacity style={[item.level===1?st.l1:item.level===2?st.l2:st.l3, {marginLeft:ml, borderRightColor:item.color, borderRightWidth:item.level===1?5:item.level===2?3:2}]}
                onPress={()=>openEdit(acc)} onLongPress={()=>handleDelete(acc)}>
                <View style={{flexDirection:'row',alignItems:'center'}}>
                  <Text style={{fontSize:item.level===1?28:item.level===2?22:18}}>{ICONS[acc.name]||'📋'}</Text>
                  <View style={{flex:1,marginLeft:8}}>
                    <Text style={{color:'#FFF',fontSize:item.level===1?16:item.level===2?14:12,fontWeight:'bold',textAlign:'right'}}>{acc.name}</Text>
                    <Text style={{color:'#94a3b8',fontSize:9,textAlign:'right'}}>كود: {acc.code} | {acc.currency}</Text>
                    {acc.bankAccount ? <Text style={{color:'#3B82F6',fontSize:9,textAlign:'right'}}>🏦 {acc.bankAccount}</Text> : null}
                    {acc.walletPhone ? <Text style={{color:'#10B981',fontSize:9,textAlign:'right'}}>📱 {acc.walletPhone}</Text> : null}
                  </View>
                  <View style={{alignItems:'flex-end',marginRight:4}}>
                    <Text style={{color:(acc.balance||0)>=0?'#10B981':'#EF4444',fontSize:13,fontWeight:'bold'}}>{(acc.balance||0).toLocaleString()} ﷼</Text>
                    {subs.length>0 && <Text style={{color:'#94a3b8',fontSize:9}}>{subs.length} فرعي</Text>}
                  </View>
                  <TouchableOpacity style={{backgroundColor:'#10B98120',width:26,height:26,borderRadius:13,justifyContent:'center',alignItems:'center'}} onPress={()=>openAdd(acc.id,acc.name,acc.type)}>
                    <Text style={{color:'#10B981',fontSize:14,fontWeight:'bold'}}>+</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={<View style={{alignItems:'center',marginTop:60}}><Text style={{fontSize:64}}>📚</Text><Text style={{color:'#666',fontSize:16}}>لا توجد حسابات</Text></View>}
          contentContainerStyle={{padding:12}}
        />
      }

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={st.mo}><View style={st.mc}><View style={{flexDirection:'row',justifyContent:'space-between',padding:16,borderBottomWidth:1,borderBottomColor:'#2a3550'}}><Text style={{color:'#D4AF37',fontSize:16,fontWeight:'bold'}}>{editMode?'✏️ تعديل':parentName?`➕ فرعي: ${parentName}`:'📁 رئيسي جديد'}</Text><TouchableOpacity onPress={()=>setShowModal(false)}><Text style={{color:'#EF4444',fontSize:22}}>✕</Text></TouchableOpacity></View>
        <ScrollView style={{padding:16}}>
          <Text style={{color:'#94a3b8',fontSize:13,marginBottom:6,marginTop:12}}>اسم الحساب *</Text>
          <TextInput style={{backgroundColor:'#0A1128',borderRadius:10,padding:12,color:'#FFF',borderWidth:1,borderColor:'#2a3550',textAlign:'right'}} value={formData.name} onChangeText={v=>setFormData({...formData,name:v})} />
          
          <Text style={{color:'#94a3b8',fontSize:13,marginBottom:6,marginTop:12}}>الكود</Text>
          <TextInput style={{backgroundColor:'#0A1128',borderRadius:10,padding:12,color:'#D4AF37',borderWidth:1,borderColor:'#2a3550',textAlign:'right'}} value={formData.code||generateCode(formData.parentId||undefined)} editable={false} />
          
          <Text style={{color:'#94a3b8',fontSize:13,marginBottom:6,marginTop:12}}>العملة</Text>
          <TouchableOpacity style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',backgroundColor:'#0A1128',borderRadius:10,padding:14,borderWidth:1,borderColor:'#2a3550'}} onPress={()=>setShowCurrencyPicker(true)}>
            <Text style={{color:'#FFF',fontSize:14}}>{formData.currency}</Text><Text style={{color:'#D4AF37',fontSize:12}}>▼</Text>
          </TouchableOpacity>

          {/* ✅ حقول إضافية للبنوك */}
          {isBankAccount({parentId: formData.parentId, name: formData.name}) && (
            <>
              <Text style={{color:'#3B82F6',fontSize:13,marginBottom:6,marginTop:12}}>🏦 رقم الحساب البنكي</Text>
              <TextInput style={{backgroundColor:'#0A1128',borderRadius:10,padding:12,color:'#FFF',borderWidth:1,borderColor:'#2a3550',textAlign:'right'}} value={formData.bankAccount} onChangeText={v=>setFormData({...formData,bankAccount:v})} placeholder="رقم الحساب" placeholderTextColor="#666" keyboardType="numeric" />
            </>
          )}

          {/* ✅ حقول إضافية للمحافظ */}
          {isWallet({parentId: formData.parentId, name: formData.name}) && (
            <>
              <Text style={{color:'#10B981',fontSize:13,marginBottom:6,marginTop:12}}>📱 رقم هاتف المحفظة</Text>
              <TextInput style={{backgroundColor:'#0A1128',borderRadius:10,padding:12,color:'#FFF',borderWidth:1,borderColor:'#2a3550',textAlign:'right'}} value={formData.walletPhone} onChangeText={v=>setFormData({...formData,walletPhone:v})} placeholder="رقم الجوال" placeholderTextColor="#666" keyboardType="phone-pad" />
            </>
          )}

          {!formData.parentId && (
            <>
              <Text style={{color:'#94a3b8',fontSize:13,marginBottom:6,marginTop:12}}>النوع</Text>
              <View style={{flexDirection:'row',flexWrap:'wrap',gap:6}}>
                {types.filter(t=>t!=='الكل').map(t=><TouchableOpacity key={t} style={[st.tb,formData.type===t&&st.tba]} onPress={()=>setFormData({...formData,type:t})}><Text style={[st.tt,formData.type===t&&st.tta]}>{t}</Text></TouchableOpacity>)}
              </View>
            </>
          )}
          
          <Text style={{color:'#94a3b8',fontSize:13,marginBottom:6,marginTop:12}}>الرصيد الافتتاحي</Text>
          <TextInput style={{backgroundColor:'#0A1128',borderRadius:10,padding:12,color:'#FFF',borderWidth:1,borderColor:'#2a3550',textAlign:'right'}} value={formData.balance} onChangeText={v=>setFormData({...formData,balance:v})} keyboardType="numeric" />
          
          <Text style={{color:'#94a3b8',fontSize:13,marginBottom:6,marginTop:12}}>ملاحظات</Text>
          <TextInput style={{backgroundColor:'#0A1128',borderRadius:10,padding:12,color:'#FFF',borderWidth:1,borderColor:'#2a3550',textAlign:'right',height:60}} value={formData.notes} onChangeText={v=>setFormData({...formData,notes:v})} multiline placeholder="ملاحظات إضافية..." placeholderTextColor="#666" />
          
          <TouchableOpacity style={{backgroundColor:'#D4AF37',borderRadius:12,padding:14,alignItems:'center',marginTop:20,marginBottom:20}} onPress={handleSave}><Text style={{color:'#0A1128',fontSize:16,fontWeight:'bold'}}>💾 {editMode?'تحديث':'حفظ'}</Text></TouchableOpacity>
        </ScrollView></View></View>
      </Modal>
      <PickerModal visible={showCurrencyPicker} title="اختيار العملة" data={currencies||[]} displayField="code" subField="name" onSelect={(i:any)=>setFormData({...formData,currency:i.code})} onClose={()=>setShowCurrencyPicker(false)} />
    </View>
  );
}

const st = StyleSheet.create({
  c:{flex:1,backgroundColor:'#0A1128'},si:{marginHorizontal:12,marginBottom:6,padding:12,backgroundColor:'#16213E',borderRadius:10,color:'#FFF',borderWidth:1,borderColor:'#2a3550',textAlign:'right'},
  fb:{paddingHorizontal:14,paddingVertical:7,borderRadius:20,backgroundColor:'#16213E',borderWidth:1,borderColor:'#2a3550'},fba:{backgroundColor:'#D4AF3720',borderColor:'#D4AF37'},ft:{color:'#94a3b8',fontSize:12},fta:{color:'#D4AF37',fontWeight:'bold'},
  l1:{backgroundColor:'#16213E',borderRadius:14,padding:14,marginBottom:6,borderWidth:1,borderColor:'#2a3550'},
  l2:{backgroundColor:'#192140',borderRadius:11,padding:12,marginBottom:5,borderWidth:1,borderColor:'#2a3550'},
  l3:{backgroundColor:'#1c2545',borderRadius:9,padding:10,marginBottom:4,borderWidth:1,borderColor:'#2a3550'},
  mo:{flex:1,backgroundColor:'rgba(0,0,0,0.7)',justifyContent:'flex-end'},mc:{backgroundColor:'#16213E',borderTopLeftRadius:20,borderTopRightRadius:20,maxHeight:'85%'},
  tb:{paddingVertical:8,paddingHorizontal:14,borderRadius:8,backgroundColor:'#0A1128',borderWidth:1,borderColor:'#2a3550'},tba:{borderColor:'#D4AF37',backgroundColor:'#D4AF3720'},tt:{color:'#94a3b8',fontSize:12},tta:{color:'#D4AF37',fontWeight:'bold'},
});
