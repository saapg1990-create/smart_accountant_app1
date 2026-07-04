import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Modal, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DataService } from '../../src/services/dataService';

export default function AccountsScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('الكل');
  const [form, setForm] = useState({ name: '', code: '', type: 'أصل', parentId: '', parentName: '', balance: '' });
  const types = ['الكل', 'أصل', 'خصم', 'إيراد', 'مصروف', 'ملكية'];

  useFocusEffect(useCallback(() => { loadAll(); }, []));

  const loadAll = async () => {
    const accData = await DataService.getAccounts();
    const curData = await DataService.getCurrencies();
    setAccounts(accData);
    setCurrencies(curData);
  };

  const getColor = (t: string) => ({ 'أصل':'#D4AF37','خصم':'#EF4444','إيراد':'#10B981','مصروف':'#3B82F6','ملكية':'#F59E0B' }[t] || '#6B7280');

  const mainAccounts = accounts.filter((a: any) => !a.parentId);
  const getSubAccounts = (parentId: string) => accounts.filter((a: any) => a.parentId === parentId);

  const openAdd = (parentId = '', parentName = '') => {
    setEditMode(false); setEditingId(null);
    setForm({ name: '', code: '', type: 'أصل', parentId, parentName, balance: '' });
    setShowForm(true);
  };

  const openEdit = (acc: any) => {
    setEditMode(true); setEditingId(acc.id);
    const parent = accounts.find((a: any) => a.id === acc.parentId);
    setForm({ name: acc.name, code: acc.code, type: acc.type, parentId: acc.parentId || '', parentName: parent?.name || '', balance: String(acc.balance || '') });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return Alert.alert('خطأ', 'أدخل اسم الحساب');
    const code = form.code || (form.parentId ? form.parentId + (getSubAccounts(form.parentId).length + 1).toString().padStart(2, '0') : (mainAccounts.length + 1).toString());
    await DataService.addAccount({ id: 'acc-' + Date.now(), code, name: form.name, type: form.type, parentId: form.parentId, balance: parseFloat(form.balance) || 0 });
    setShowForm(false); loadAll();
  };

  const handleDelete = (acc: any) => {
    if (getSubAccounts(acc.id).length > 0) return Alert.alert('تنبيه', 'لا يمكن حذف حساب له فروع');
    Alert.alert('حذف', `حذف ${acc.name}؟`, [{ text: 'نعم', onPress: async () => { await DataService.deleteAccount(acc.id); loadAll(); } }, { text: 'لا' }]);
  };

  const buildTree = () => {
    const result: any[] = [];
    mainAccounts.filter((m: any) => selectedType === 'الكل' || m.type === selectedType).forEach((main: any) => {
      if (!searchQuery || main.name.includes(searchQuery) || main.code.includes(searchQuery)) result.push({ level: 1, data: main });
      getSubAccounts(main.id).forEach((sub: any) => {
        if (!searchQuery || sub.name.includes(searchQuery) || sub.code.includes(searchQuery)) result.push({ level: 2, data: sub });
        getSubAccounts(sub.id).forEach((grand: any) => {
          if (!searchQuery || grand.name.includes(searchQuery) || grand.code.includes(searchQuery)) result.push({ level: 3, data: grand });
        });
      });
    });
    return result;
  };

  const displayList = buildTree();

  return (
    <View style={[st.c, { paddingTop: insets.top }]}>
      <View style={st.h}><TouchableOpacity onPress={() => router.back()}><Text style={st.bb}>←</Text></TouchableOpacity><Text style={st.t}>دليل الحسابات ({accounts.length})</Text><TouchableOpacity onPress={() => openAdd()}><Text style={st.add}>+</Text></TouchableOpacity></View>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{maxHeight:38,marginBottom:6}} contentContainerStyle={{flexDirection:'row',paddingHorizontal:12,gap:6}}>
        {types.map(t => <TouchableOpacity key={t} style={[st.tb, selectedType===t&&st.tba]} onPress={()=>setSelectedType(t)}><Text style={[st.ttx, selectedType===t&&st.ttxa]}>{t}</Text></TouchableOpacity>)}
      </ScrollView>

      <TextInput style={st.si} placeholder="🔍 بحث..." placeholderTextColor="#666" value={searchQuery} onChangeText={setSearchQuery} />

      <FlatList data={displayList} keyExtractor={(i,idx) => i.data.id+idx} renderItem={({ item }) => {
        const acc = item.data; const ml = (item.level-1)*20;
        return (
          <TouchableOpacity style={[item.level===1?st.l1:item.level===2?st.l2:st.l3, {marginLeft:ml, borderRightColor:getColor(acc.type), borderRightWidth:item.level===1?5:item.level===2?3:2}]} onPress={() => openEdit(acc)} onLongPress={() => handleDelete(acc)}>
            <View style={{flexDirection:'row',alignItems:'center'}}>
              <Text style={{fontSize:item.level===1?24:18}}>{item.level===1?'📁':'└ 📋'}</Text>
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
  c:{flex:1,backgroundColor:'#0A1128'},h:{flexDirection:'row',alignItems:'center',padding:16},bb:{fontSize:24,color:'#D4AF37'},t:{color:'#D4AF37',fontSize:18,fontWeight:'bold',flex:1,textAlign:'center'},add:{fontSize:28,color:'#D4AF37'},
  tb:{paddingHorizontal:12,paddingVertical:6,borderRadius:16,backgroundColor:'#16213E',borderWidth:1,borderColor:'#2a3550'},tba:{borderColor:'#D4AF37',backgroundColor:'#D4AF3720'},ttx:{color:'#94a3b8',fontSize:11},ttxa:{color:'#D4AF37',fontWeight:'bold'},
  si:{marginHorizontal:12,marginBottom:6,padding:10,backgroundColor:'#16213E',borderRadius:10,color:'#FFF',borderWidth:1,borderColor:'#2a3550',textAlign:'right'},
  l1:{backgroundColor:'#16213E',borderRadius:12,padding:12,marginBottom:5},l2:{backgroundColor:'#192140',borderRadius:10,padding:10,marginBottom:4},l3:{backgroundColor:'#1c2545',borderRadius:8,padding:8,marginBottom:3},
  et:{color:'#666',textAlign:'center',marginTop:40},mo:{flex:1,backgroundColor:'rgba(0,0,0,0.7)',justifyContent:'flex-end'},mc:{backgroundColor:'#16213E',borderTopLeftRadius:20,borderTopRightRadius:20,maxHeight:'80%'},
  mh:{flexDirection:'row',justifyContent:'space-between',padding:16,borderBottomWidth:1,borderBottomColor:'#2a3550'},mt:{color:'#D4AF37',fontSize:16,fontWeight:'bold'},mx:{color:'#EF4444',fontSize:22},
  fl:{color:'#94a3b8',fontSize:13,marginBottom:6,marginTop:10},fi:{backgroundColor:'#0A1128',color:'#FFF',padding:10,borderRadius:8,textAlign:'right'},
  sb:{backgroundColor:'#D4AF37',padding:12,borderRadius:8,alignItems:'center',marginTop:16},sbt:{color:'#000',fontWeight:'bold'},
});
