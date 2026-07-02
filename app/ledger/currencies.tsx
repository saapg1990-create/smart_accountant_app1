import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalTable } from '../../hooks/useLocalStore';
import { ControlButtons, ControlHeader } from '../../src/components/ui/ControlButtons';
import { useDatabase } from '../../context/DatabaseContext';

export default function CurrenciesScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const { data: currencies, add, update, remove } = useLocalTable('currencies');
  const { db } = useDatabase();
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ code: '', name: '', symbol: '', rate: '1', isDefault: false });
  const [showRateModal, setShowRateModal] = useState(false);
  const [newRate, setNewRate] = useState('');
  const [rateCurrencyId, setRateCurrencyId] = useState('');

  const filtered = currencies.filter((c: any) => c.name?.includes(searchQuery) || c.code?.includes(searchQuery));

  const openAdd = () => { setEditMode(false); setFormData({ code: '', name: '', symbol: '', rate: '1', isDefault: false }); setShowModal(true); };
  
  const openEdit = () => {
    const item = currencies.find((c: any) => c.id === selectedId);
    if (!item) return Alert.alert('تنبيه', 'اختر عملة');
    setEditMode(true);
    setFormData({ code: item.code, name: item.name, symbol: item.symbol, rate: String(item.rate), isDefault: item.isDefault === 1 });
    setShowModal(true);
  };

  const openRateUpdate = () => {
    const item = currencies.find((c: any) => c.id === selectedId);
    if (!item) return Alert.alert('تنبيه', 'اختر عملة لتحديث السعر');
    setRateCurrencyId(item.id);
    setNewRate(String(item.rate));
    setShowRateModal(true);
  };

  const handleDelete = () => {
    if (!selectedId) return Alert.alert('تنبيه', 'اختر عملة');
    Alert.alert('حذف', 'حذف العملة؟', [{ text: 'إلغاء' }, { text: 'حذف', onPress: async () => { await remove(selectedId); setSelectedId(null); } }]);
  };

  const handleSave = async () => {
    if (!formData.code || !formData.name) { Alert.alert('خطأ', 'أكمل البيانات'); return; }
    const data = { ...formData, rate: parseFloat(formData.rate) || 1, isDefault: formData.isDefault ? 1 : 0 };
    if (editMode && selectedId) await update(selectedId, data); 
    else await add(data);
    setShowModal(false);
  };

  const updateRate = async () => {
    if (!rateCurrencyId) return;
    const rate = parseFloat(newRate) || 1;
    await update(rateCurrencyId, { rate });
    
    // ✅ تحديث أرصدة الحسابات المرتبطة بهذه العملة
    if (db) {
      const currency = currencies.find((c: any) => c.id === rateCurrencyId);
      if (currency) {
        await db.runAsync('UPDATE accounts SET balance = balance * ? WHERE currency = ?', [rate, currency.code]);
      }
    }
    setShowRateModal(false);
    Alert.alert('✅', 'تم تحديث سعر الصرف وتأثير الحسابات');
  };

  return (
    <View style={[st.c, { paddingTop: insets.top }]}>
      <ControlHeader title="العملات" count={currencies.length} onBack={() => router.back()} onAdd={openAdd} />
      <ControlButtons showAdd showEdit showDelete showSearch showPrint showRefresh showExport onAdd={openAdd} onEdit={openEdit} onDelete={handleDelete} onRefresh={() => loadAll()} />
      <TextInput style={st.si} placeholder="🔍 بحث..." placeholderTextColor="#94a3b8" value={searchQuery} onChangeText={setSearchQuery} />
      
      <TouchableOpacity style={st.rateBtn} onPress={openRateUpdate}>
        <Text style={st.rateBtnText}>💱 تحديث سعر الصرف للعملة المحددة</Text>
      </TouchableOpacity>

      <FlatList data={filtered} keyExtractor={(i: any) => i.id}
        renderItem={({ item }: any) => (
          <TouchableOpacity style={[st.rc, selectedId === item.id && st.selected]} onPress={() => setSelectedId(selectedId === item.id ? null : item.id)}>
            <Text style={st.rn}>{item.code} {item.symbol} {item.isDefault ? '⭐' : ''}</Text>
            <Text style={st.rd}>{item.name}</Text>
            <Text style={st.rt}>سعر الصرف: {item.rate?.toLocaleString()}</Text>
          </TouchableOpacity>
        )} contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<Text style={st.et}>لا توجد عملات</Text>}
      />

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={st.mo}><View style={st.mc}><View style={st.mh}><Text style={st.mt}>{editMode ? 'تعديل عملة' : 'عملة جديدة'}</Text><TouchableOpacity onPress={() => setShowModal(false)}><Text style={st.mx}>✕</Text></TouchableOpacity></View>
        <View style={st.mb}>
          <Text style={st.fl}>كود العملة *</Text><TextInput style={st.fi} value={formData.code} onChangeText={v => setFormData({ ...formData, code: v.toUpperCase() })} placeholder="USD" placeholderTextColor="#666" />
          <Text style={st.fl}>اسم العملة *</Text><TextInput style={st.fi} value={formData.name} onChangeText={v => setFormData({ ...formData, name: v })} placeholder="دولار" placeholderTextColor="#666" />
          <Text style={st.fl}>الرمز</Text><TextInput style={st.fi} value={formData.symbol} onChangeText={v => setFormData({ ...formData, symbol: v })} placeholder="$" placeholderTextColor="#666" />
          <Text style={st.fl}>سعر الصرف</Text><TextInput style={st.fi} value={formData.rate} onChangeText={v => setFormData({ ...formData, rate: v })} keyboardType="numeric" />
          <TouchableOpacity style={[st.tb, formData.isDefault && st.tbA]} onPress={() => setFormData({ ...formData, isDefault: !formData.isDefault })}>
            <Text style={[st.tbt, formData.isDefault && st.tbtA]}>{formData.isDefault ? '⭐ العملة الافتراضية' : 'تعيين كافتراضية'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={st.sb} onPress={handleSave}><Text style={st.sbt}>💾 حفظ</Text></TouchableOpacity>
        </View></View></View>
      </Modal>

      <Modal visible={showRateModal} animationType="fade" transparent>
        <View style={st.mo}><View style={[st.mc, { maxHeight: 250 }]}><View style={st.mh}><Text style={st.mt}>تحديث سعر الصرف</Text><TouchableOpacity onPress={() => setShowRateModal(false)}><Text style={st.mx}>✕</Text></TouchableOpacity></View>
        <View style={st.mb}><Text style={st.fl}>سعر الصرف الجديد</Text><TextInput style={st.fi} value={newRate} onChangeText={setNewRate} keyboardType="numeric" /><Text style={st.hint}>⚠️ سيتم تحديث أرصدة الحسابات المرتبطة</Text><TouchableOpacity style={st.sb} onPress={updateRate}><Text style={st.sbt}>💱 تحديث</Text></TouchableOpacity></View></View></View>
      </Modal>
    </View>
  );
}
const st = StyleSheet.create({
  c:{flex:1,backgroundColor:'#0A1128'},si:{marginHorizontal:16,marginBottom:6,padding:12,backgroundColor:'#16213E',borderRadius:10,color:'#FFF',borderWidth:1,borderColor:'#2a3550',textAlign:'right'},et:{color:'#FFF',fontSize:16,textAlign:'center',marginTop:40},
  rateBtn:{marginHorizontal:16,marginBottom:8,padding:12,backgroundColor:'#D4AF3720',borderRadius:10,borderWidth:1,borderColor:'#D4AF37',alignItems:'center'},rateBtnText:{color:'#D4AF37',fontSize:14,fontWeight:'bold'},
  rc:{backgroundColor:'#16213E',borderRadius:14,padding:14,marginBottom:8,marginHorizontal:16,borderWidth:1,borderColor:'#2a3550'},selected:{borderColor:'#D4AF37',backgroundColor:'#1a2540'},rn:{color:'#D4AF37',fontSize:16,fontWeight:'bold'},rd:{color:'#FFF',fontSize:13},rt:{color:'#10B981',fontSize:14,fontWeight:'bold'},
  mo:{flex:1,backgroundColor:'rgba(0,0,0,0.7)',justifyContent:'flex-end'},mc:{backgroundColor:'#16213E',borderTopLeftRadius:20,borderTopRightRadius:20,maxHeight:'90%'},mh:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:16,borderBottomWidth:1,borderBottomColor:'#2a3550'},mt:{color:'#D4AF37',fontSize:18,fontWeight:'bold'},mx:{color:'#EF4444',fontSize:22},mb:{padding:16},
  fl:{color:'#94a3b8',fontSize:13,marginBottom:6,marginTop:12},fi:{backgroundColor:'#0A1128',borderRadius:10,padding:12,color:'#FFF',borderWidth:1,borderColor:'#2a3550',fontSize:14},
  tb:{padding:12,borderRadius:10,backgroundColor:'#0A1128',borderWidth:1,borderColor:'#2a3550',alignItems:'center',marginTop:10},tbA:{borderColor:'#D4AF37',backgroundColor:'#D4AF3720'},tbt:{color:'#94a3b8',fontSize:14},tbtA:{color:'#D4AF37',fontWeight:'bold'},
  hint:{color:'#EF4444',fontSize:11,textAlign:'center',marginTop:8},sb:{backgroundColor:'#D4AF37',borderRadius:12,padding:14,alignItems:'center',marginTop:20},sbt:{color:'#0A1128',fontSize:16,fontWeight:'bold'},
});
