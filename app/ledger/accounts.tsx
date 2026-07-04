import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Modal, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DataService } from '../../src/services/dataService';
import { ControlButtons, ControlHeader } from '../../src/components/ui/ControlButtons';

const ICONS: any = {
  'الاصول':'🏢','الخصوم':'💳','حقوق الملكية':'👑','الايرادات':'💰','المصروفات':'💸',
  'الاصول المتداولة':'💎','الاصول الثابتة':'🏗️','الخصوم المتداولة':'📋',
  'راس المال':'🏛️','المبيعات':'🛒','المشتريات':'📥',
  'الصندوق':'💵','البنوك':'🏦','المحافظ':'📱','العملاء':'👥','المخزون':'📦',
  'الموردين':'🏭','الضرائب':'🧾','رواتب واجور':'👷','ايجارات':'🏠'
};

export default function AccountsScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('الكل');
  const [form, setForm] = useState({ name: '', code: '', type: 'اصل', parentId: '', parentName: '', balance: '' });
  const types = ['الكل', 'اصل', 'خصم', 'ايراد', 'مصروف', 'ملكية'];
  const [refreshKey, setRefreshKey] = useState(0);

  useFocusEffect(useCallback(() => { loadAll(); }, []));
  const loadAll = async () => { const data = await DataService.getAccounts(); setAccounts(data || []); setRefreshKey(prev => prev + 1); };

  const getColor = (t: string) => ({ 'اصل':'#D4AF37','خصم':'#EF4444','ايراد':'#10B981','مصروف':'#3B82F6','ملكية':'#F59E0B' }[t] || '#6B7280');

  const openAdd = (parentId = '', parentName = '') => {
    setEditMode(false); setEditingId(null);
    setForm({ name: '', code: '', type: 'اصل', parentId, parentName, balance: '' });
    setShowForm(true);
  };

  const openEdit = (acc: any) => {
    setEditMode(true); setEditingId(acc.id);
    setForm({ name: acc.name, code: acc.code, type: acc.type, parentId: acc.parentId || '', parentName: '', balance: String(acc.balance || '') });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return Alert.alert('خطأ', 'أدخل اسم الحساب');
    const subs = accounts.filter((a: any) => String(a.parentId) === String(form.parentId));
    const code = form.code || (form.parentId ? form.parentId + (subs.length + 1).toString().padStart(2, '0') : (accounts.filter((a: any) => !a.parentId).length + 1).toString());
    await DataService.addAccount({ id: 'acc-' + Date.now(), code, name: form.name, type: form.type, parentId: form.parentId, balance: parseFloat(form.balance) || 0 });
    setShowForm(false); setTimeout(() => loadAll(), 300);
  };

  const handleDelete = (acc: any) => {
    const subs = accounts.filter((a: any) => String(a.parentId) === String(acc.id));
    if (subs.length > 0) return Alert.alert('تنبيه', 'لا يمكن حذف حساب له فروع');
    Alert.alert('حذف', `حذف ${acc.name}؟`, [{ text: 'نعم', onPress: async () => { await DataService.deleteAccount(acc.id); loadAll(); } }, { text: 'لا' }]);
  };

  const buildTree = () => {
    const result: any[] = [];
    if (selectedType === 'الكل') {
      const mainAccs = accounts.filter((a: any) => !a.parentId || a.parentId === '');
      mainAccs.forEach((main: any) => {
        if (!searchQuery || main.name.includes(searchQuery)) result.push({ level: 1, data: main });
        accounts.filter((a: any) => String(a.parentId) === String(main.id)).forEach((child: any) => {
          if (!searchQuery || child.name.includes(searchQuery)) result.push({ level: 2, data: child });
          accounts.filter((a: any) => String(a.parentId) === String(child.id)).forEach((grand: any) => {
            if (!searchQuery || grand.name.includes(searchQuery)) result.push({ level: 3, data: grand });
          });
        });
      });
    } else {
      accounts.filter((a: any) => a.type === selectedType).forEach((acc: any) => {
        if (!searchQuery || acc.name.includes(searchQuery)) result.push({ level: 1, data: acc });
      });
    }
    return result;
  };

  const displayList = buildTree();

  return (
    <View style={[st.c, { paddingTop: insets.top }]}>
      <ControlHeader title="دليل الحسابات" count={accounts.length} onBack={() => router.back()} onAdd={() => openAdd()} />
      <ScrollView horizontal style={{maxHeight:38,marginBottom:6}} contentContainerStyle={{flexDirection:'row',paddingHorizontal:12,gap:6}}>
        {types.map(t => <TouchableOpacity key={t} style={[st.tb, selectedType===t&&st.tba]} onPress={()=>setSelectedType(t)}><Text style={[st.ttx, selectedType===t&&st.ttxa]}>{t}</Text></TouchableOpacity>)}
      </ScrollView>
      <TextInput style={st.si} placeholder="🔍 بحث..." placeholderTextColor="#666" value={searchQuery} onChangeText={setSearchQuery} />
      <FlatList key={refreshKey} data={displayList} keyExtractor={(i,idx) => i.data.id+idx} renderItem={({ item }) => {
        const acc = item.data; const ml = (item.level-1)*20;
        return (
          <TouchableOpacity style={[item.level===1?st.l1:item.level===2?st.l2:st.l3, {marginLeft:ml, borderRightColor:getColor(acc.type), borderRightWidth:item.level===1?5:3}]} onPress={() => openEdit(acc)} onLongPress={() => handleDelete(acc)}>
            <View style={{flexDirection:'row',alignItems:'center'}}>
              <Text style={{fontSize:item.level===1?24:18}}>{ICONS[acc.name]||'📋'}</Text>
              <View style={{flex:1,marginLeft:8}}>
                <Text style={{color:'#FFF',fontSize:item.level===1?15:13,fontWeight:'bold',textAlign:'right'}}>{acc.name}</Text>
                <Text style={{color:'#94a3b8',fontSize:9,textAlign:'right'}}>كود: {acc.code}</Text>
              </View>
              <Text style={{color:'#10B981',fontSize:13,fontWeight:'bold'}}>{acc.balance?.toLocaleString()} ﷼</Text>
              <TouchableOpacity style={{backgroundColor:'#10B98120',width:24,height:24,borderRadius:12,justifyContent:'center',alignItems:'center',marginLeft:6}} onPress={() => openAdd(acc.id, acc.name)}>
                <Text style={{color:'#10B981',fontSize:12}}>+</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        );
      }} ListEmptyComponent={<Text style={st.et}>لا توجد حسابات</Text>} contentContainerStyle={{padding:12}} />
      <Modal visible={showForm} animationType="slide" transparent>
        <View style={st.mo}><View style={st.mc}><View style={st.mh}><Text style={st.mt}>{editMode?'✏️ تعديل':form.parentName?`➕ تحت: ${form.parentName}`:'📁 رئيسي'}</Text><TouchableOpacity onPress={()=>setShowForm(false)}><Text style={st.mx}>✕</Text></TouchableOpacity></View>
        <View style={{padding:16}}>
          <Text style={st.fl}>الاسم *</Text><TextInput style={st.fi} value={form.name} onChangeText={v=>setForm({...form,name:v})} />
          <Text style={st.fl}>الكود</Text><TextInput style={[st.fi,{color:'#D4AF37'}]} value={form.code} onChangeText={v=>setForm({...form,code:v})} />
          {!form.parentId && <><Text style={st.fl}>النوع</Text><View style={{flexDirection:'row',gap:6}}>{types.filter(t=>t!=='الكل').map(t=><TouchableOpacity key={t} style={[st.tb,form.type===t&&st.tba]} onPress={()=>setForm({...form,type:t})}><Text style={[st.ttx,form.type===t&&st.ttxa]}>{t}</Text></TouchableOpacity>)}</View></>}
          <Text style={st.fl}>الرصيد</Text><TextInput style={st.fi} value={form.balance} onChangeText={v=>setForm({...form,balance:v})} keyboardType="numeric" />
          <TouchableOpacity style={st.sb} onPress={handleSave}><Text style={st.sbt}>💾 حفظ</Text></TouchableOpacity>
        </View></View></View>
      </Modal>
    </View>
  );
}
const st = StyleSheet.create({
  c:{flex:1,backgroundColor:'#0A1128'},si:{marginHorizontal:12,marginBottom:6,padding:10,backgroundColor:'#16213E',borderRadius:10,color:'#FFF',borderWidth:1,borderColor:'#2a3550',textAlign:'right'},
  tb:{paddingHorizontal:12,paddingVertical:6,borderRadius:16,backgroundColor:'#16213E',borderWidth:1,borderColor:'#2a3550'},tba:{borderColor:'#D4AF37',backgroundColor:'#D4AF3720'},ttx:{color:'#94a3b8',fontSize:11},ttxa:{color:'#D4AF37',fontWeight:'bold'},
  l1:{backgroundColor:'#16213E',borderRadius:12,padding:12,marginBottom:5},l2:{backgroundColor:'#192140',borderRadius:10,padding:10,marginBottom:4},l3:{backgroundColor:'#1c2545',borderRadius:8,padding:8,marginBottom:3},
  et:{color:'#666',textAlign:'center',marginTop:40},mo:{flex:1,backgroundColor:'rgba(0,0,0,0.7)',justifyContent:'flex-end'},mc:{backgroundColor:'#16213E',borderTopLeftRadius:20,borderTopRightRadius:20,maxHeight:'80%'},
  mh:{flexDirection:'row',justifyContent:'space-between',padding:16,borderBottomWidth:1,borderBottomColor:'#2a3550'},mt:{color:'#D4AF37',fontSize:16,fontWeight:'bold'},mx:{color:'#EF4444',fontSize:22},
  fl:{color:'#94a3b8',fontSize:13,marginBottom:6,marginTop:10},fi:{backgroundColor:'#0A1128',color:'#FFF',padding:10,borderRadius:8,textAlign:'right'},
  sb:{backgroundColor:'#D4AF37',padding:12,borderRadius:8,alignItems:'center',marginTop:16},sbt:{color:'#000',fontWeight:'bold'},
});
