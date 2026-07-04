import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DataService } from '../../src/services/dataService';
import { ControlButtons, ControlHeader } from '../../src/components/ui/ControlButtons';

export default function CurrenciesScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const [data, setData] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState({ code: '', name: '', symbol: '', rate: '1', isDefault: false });
  const [showRate, setShowRate] = useState(false);
  const [newRate, setNewRate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(useCallback(() => { loadAll(); }, []));
  const loadAll = async () => { setData(await DataService.getCurrencies() || []); };

  const openAdd = () => { setEditMode(false); setEditingId(null); setForm({ code: '', name: '', symbol: '', rate: '1', isDefault: false }); setShowForm(true); };

  const openEdit = () => {
    const item = data.find((c: any) => c.id === selectedId);
    if (!item) return Alert.alert('تنبيه', 'اختر عملة للتعديل');
    setEditMode(true); setEditingId(item.id);
    setForm({ code: item.code, name: item.name, symbol: item.symbol || '', rate: String(item.rate || 1), isDefault: item.isDefault === 1 });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.code.trim() || !form.name.trim()) return Alert.alert('خطأ', 'أكمل البيانات');
    const saveData = { ...form, rate: parseFloat(form.rate) || 1, isDefault: form.isDefault ? 1 : 0 };
    
    if (editMode && editingId) {
      await DataService.updateCurrency(editingId, saveData);
    } else {
      await DataService.addCurrency({ id: 'cur-' + Date.now(), ...saveData });
    }
    setShowForm(false); loadAll();
    Alert.alert('✅', editMode ? 'تم التعديل' : 'تمت الإضافة');
  };

  const handleDelete = async () => {
    if (!selectedId) return Alert.alert('تنبيه', 'اختر عملة للحذف');
    Alert.alert('حذف', 'متأكد؟', [
      { text: 'لا' },
      { text: 'نعم', onPress: async () => { await DataService.deleteCurrency(selectedId); setSelectedId(null); loadAll(); } }
    ]);
  };

  const updateRate = async () => {
    if (!selectedId) return Alert.alert('تنبيه', 'اختر عملة أولاً');
    await DataService.updateCurrency(selectedId, { rate: parseFloat(newRate) || 1 });
    setShowRate(false); loadAll();
    Alert.alert('✅', 'تم تحديث سعر الصرف');
  };

  const filtered = data.filter((c: any) => c.name?.includes(searchQuery) || c.code?.includes(searchQuery));

  return (
    <View style={[st.c, { paddingTop: insets.top }]}>
      <ControlHeader title="العملات" count={data.length} onBack={() => router.back()} onAdd={openAdd} />
      <ControlButtons showAdd showEdit showDelete showSearch showPrint showRefresh showExport onAdd={openAdd} onEdit={openEdit} onDelete={handleDelete} onRefresh={loadAll} />
      <TextInput style={st.si} placeholder="🔍 بحث..." placeholderTextColor="#666" value={searchQuery} onChangeText={setSearchQuery} />

      <TouchableOpacity style={st.rateBtn} onPress={() => {
        const c = data.find((x: any) => x.id === selectedId);
        if (c) { setNewRate(String(c.rate)); setShowRate(true); }
        else Alert.alert('تنبيه', 'اختر عملة من القائمة أولاً');
      }}>
        <Text style={st.rateText}>💱 تحديث سعر الصرف للعملة المحددة</Text>
      </TouchableOpacity>

      {showForm && (
        <Modal visible={showForm} animationType="slide" transparent>
          <View style={st.mo}><View style={st.mc}>
            <View style={st.mh}><Text style={st.mt}>{editMode ? 'تعديل عملة' : 'عملة جديدة'}</Text><TouchableOpacity onPress={()=>setShowForm(false)}><Text style={st.mx}>✕</Text></TouchableOpacity></View>
            <View style={{padding:16}}>
              <Text style={st.fl}>الكود *</Text>
              <TextInput style={st.fi} value={form.code} onChangeText={v=>setForm({...form,code:v.toUpperCase()})} placeholder="USD" placeholderTextColor="#666" autoCapitalize="characters" />
              <Text style={st.fl}>الاسم *</Text>
              <TextInput style={st.fi} value={form.name} onChangeText={v=>setForm({...form,name:v})} placeholder="دولار أمريكي" placeholderTextColor="#666" />
              <Text style={st.fl}>الرمز</Text>
              <TextInput style={st.fi} value={form.symbol} onChangeText={v=>setForm({...form,symbol:v})} placeholder="$" placeholderTextColor="#666" />
              <Text style={st.fl}>سعر الصرف</Text>
              <TextInput style={st.fi} value={form.rate} onChangeText={v=>setForm({...form,rate:v})} keyboardType="numeric" placeholder="1" placeholderTextColor="#666" />
              <TouchableOpacity style={[st.tb, form.isDefault&&st.tba]} onPress={()=>setForm({...form,isDefault:!form.isDefault})}>
                <Text style={[st.tt, form.isDefault&&st.tta]}>{form.isDefault ? '⭐ العملة الافتراضية' : 'تعيين كافتراضية'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={st.sb} onPress={handleSave}><Text style={st.sbt}>💾 {editMode ? 'تحديث' : 'حفظ'}</Text></TouchableOpacity>
            </View>
          </View></View>
        </Modal>
      )}

      {showRate && (
        <Modal visible={showRate} animationType="fade" transparent>
          <View style={st.mo}><View style={[st.mc,{maxHeight:200}]}>
            <View style={st.mh}><Text style={st.mt}>تحديث سعر الصرف</Text><TouchableOpacity onPress={()=>setShowRate(false)}><Text style={st.mx}>✕</Text></TouchableOpacity></View>
            <View style={{padding:16}}>
              <TextInput style={st.fi} value={newRate} onChangeText={setNewRate} keyboardType="numeric" placeholder="سعر الصرف الجديد" placeholderTextColor="#666" />
              <TouchableOpacity style={st.sb} onPress={updateRate}><Text style={st.sbt}>💱 تحديث</Text></TouchableOpacity>
            </View>
          </View></View>
        </Modal>
      )}

      <FlatList data={filtered} keyExtractor={i => i.id} renderItem={({item}) => (
        <TouchableOpacity style={[st.card, selectedId===item.id&&st.cardSel]} onPress={()=>setSelectedId(selectedId===item.id?null:item.id)}>
          <Text style={st.cn}>{item.code} {item.symbol} {item.isDefault ? '⭐' : ''}</Text>
          <Text style={st.cd}>{item.name}</Text>
          <Text style={st.cr}>سعر الصرف: {item.rate?.toLocaleString()}</Text>
        </TouchableOpacity>
      )} ListEmptyComponent={<Text style={st.et}>لا توجد عملات</Text>} contentContainerStyle={{padding:12}} />
    </View>
  );
}
const st = StyleSheet.create({
  c:{flex:1,backgroundColor:'#0A1128'},si:{marginHorizontal:12,marginBottom:8,padding:10,backgroundColor:'#16213E',borderRadius:10,color:'#FFF',borderWidth:1,borderColor:'#2a3550',textAlign:'right'},
  rateBtn:{marginHorizontal:12,marginBottom:8,padding:10,backgroundColor:'#D4AF3720',borderRadius:10,alignItems:'center',borderWidth:1,borderColor:'#D4AF37'},rateText:{color:'#D4AF37',fontSize:13,fontWeight:'bold'},
  mo:{flex:1,backgroundColor:'rgba(0,0,0,0.7)',justifyContent:'flex-end'},mc:{backgroundColor:'#16213E',borderTopLeftRadius:20,borderTopRightRadius:20,maxHeight:'80%'},
  mh:{flexDirection:'row',justifyContent:'space-between',padding:16},mt:{color:'#D4AF37',fontSize:16,fontWeight:'bold'},mx:{color:'#EF4444',fontSize:22},
  fl:{color:'#94a3b8',fontSize:13,marginBottom:6,marginTop:10},fi:{backgroundColor:'#0A1128',color:'#FFF',padding:10,borderRadius:8,textAlign:'right'},
  tb:{padding:12,borderRadius:8,backgroundColor:'#0A1128',alignItems:'center',marginTop:10,borderWidth:1,borderColor:'#2a3550'},tba:{borderColor:'#D4AF37',backgroundColor:'#D4AF3720'},tt:{color:'#94a3b8',fontSize:13},tta:{color:'#D4AF37',fontWeight:'bold'},
  sb:{backgroundColor:'#D4AF37',padding:12,borderRadius:8,alignItems:'center',marginTop:16},sbt:{color:'#000',fontWeight:'bold'},
  card:{backgroundColor:'#16213E',padding:14,marginHorizontal:12,marginVertical:4,borderRadius:12},cardSel:{borderColor:'#D4AF37',borderWidth:1},
  cn:{color:'#D4AF37',fontSize:16,fontWeight:'bold'},cd:{color:'#FFF',fontSize:13},cr:{color:'#10B981',fontSize:12,fontWeight:'bold'},et:{color:'#666',textAlign:'center',marginTop:40},
});
