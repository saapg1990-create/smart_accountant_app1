import { DataService } from '../src/services/dataService';
import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Modal, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import { useLocalTable } from '../../hooks/useLocalStore';
import { PickerModal } from '../../src/components/ui/PickerModal';
import { ControlButtons, ControlHeader } from '../../src/components/ui/ControlButtons';

export default function CustomersScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const { data: customers, add, update, remove } = useLocalTable('customers');
  const { data: currencies } = useLocalTable('currencies');
  const { data: groups } = useLocalTable('customerGroups');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState(''); const [phone, setPhone] = useState('');
  const [address, setAddress] = useState(''); const [currency, setCurrency] = useState('YER');
  const [groupId, setGroupId] = useState(''); const [groupName, setGroupName] = useState('');
  const [balance, setBalance] = useState(''); const [creditLimit, setCreditLimit] = useState('');
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [showGroupPicker, setShowGroupPicker] = useState(false);

  useFocusEffect(useCallback(() => {}, []));

  const generateCode = () => 'CUST-' + (customers.length + 1).toString().padStart(5, '0');

  const filtered = customers.filter((c: any) => c.name?.includes(searchQuery) || c.phone?.includes(searchQuery) || c.code?.includes(searchQuery));

  const openAdd = () => { setEditMode(false); setEditingId(null); setName(''); setPhone(''); setAddress(''); setCurrency('YER'); setGroupId(''); setGroupName(''); setBalance(''); setCreditLimit(''); setShowModal(true); };
  
  const openEdit = () => {
    const item = customers.find((c: any) => c.id === selectedId);
    if (!item) return Alert.alert('تنبيه', 'اختر عميلاً');
    setEditMode(true); setEditingId(item.id);
    setName(item.name); setPhone(item.phone||''); setAddress(item.address||''); setCurrency(item.currency||'YER');
    setGroupId(item.groupId||''); setGroupName(item.groupName||''); setBalance(String(item.balance||'')); setCreditLimit(String(item.creditLimit||''));
    setShowModal(true);
  };

  const handleDelete = () => {
    if (!selectedId) return Alert.alert('تنبيه', 'اختر عميلاً');
    Alert.alert('حذف', 'حذف العميل؟', [{ text: 'إلغاء' }, { text: 'حذف', onPress: () => { remove(selectedId); setSelectedId(null); } }]);
  };

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('خطأ', 'أدخل اسم العميل'); return; }
    const code = editMode ? undefined : generateCode();
    const data = { name, phone, address, currency, groupId, groupName, balance: parseFloat(balance)||0, creditLimit: parseFloat(creditLimit)||0, ...(code && { code }) };
    if (editMode && editingId) { await update(editingId, data); } else { await add(data); }
    setShowModal(false);
  };

  return (
    <View style={[st.c, { paddingTop: insets.top }]}>
      <ControlHeader title="العملاء" count={customers.length} onBack={() => router.back()} onAdd={openAdd} />
      <ControlButtons showAdd showEdit showDelete showSearch showPrint showRefresh showExport onAdd={openAdd} onEdit={openEdit} onDelete={handleDelete} onRefresh={() => loadAll()} />
      <TextInput style={st.si} placeholder="🔍 بحث..." placeholderTextColor="#666" value={searchQuery} onChangeText={setSearchQuery} />
      <FlatList data={filtered} keyExtractor={(i: any) => i.id}
        renderItem={({ item }: any) => (
          <TouchableOpacity style={[st.card, selectedId === item.id && st.selected]} onPress={() => setSelectedId(selectedId === item.id ? null : item.id)}>
            <View style={{ flex: 1 }}>
              <Text style={st.name}>{item.name}</Text>
              <Text style={st.code}>🔑 {item.code || 'بدون كود'}</Text>
              <Text style={st.detail}>📞 {item.phone || '-'} | 📍 {item.address || '-'}</Text>
              <Text style={st.balance}>الرصيد: {item.balance?.toLocaleString() || 0} | 💱 {item.currency}</Text>
            </View>
            <TouchableOpacity onPress={() => { setSelectedId(item.id); handleDelete(); }}><Text style={st.del}>🗑️</Text></TouchableOpacity>
          </TouchableOpacity>
        )} contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<Text style={st.et}>لا يوجد عملاء</Text>}
      />
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={st.mo}><View style={st.mc}><View style={st.mh}><Text style={st.mt}>{editMode ? '✏️ تعديل عميل' : '👤 عميل جديد'}</Text><TouchableOpacity onPress={() => setShowModal(false)}><Text style={st.mx}>✕</Text></TouchableOpacity></View>
        <ScrollView style={st.mb}>
          {!editMode && <Text style={[st.fl, { color: '#D4AF37' }]}>الكود: {generateCode()}</Text>}
          <Text style={st.fl}>اسم العميل *</Text><TextInput style={st.fi} value={name} onChangeText={setName} placeholder="الاسم" placeholderTextColor="#666" />
          <Text style={st.fl}>رقم الهاتف</Text><TextInput style={st.fi} value={phone} onChangeText={setPhone} placeholder="الهاتف" placeholderTextColor="#666" keyboardType="phone-pad" />
          <Text style={st.fl}>العنوان</Text><TextInput style={st.fi} value={address} onChangeText={setAddress} placeholder="العنوان" placeholderTextColor="#666" />
          <Text style={st.fl}>المجموعة</Text>
          <TouchableOpacity style={st.pk} onPress={() => setShowGroupPicker(true)}><Text style={groupName ? st.pkt : st.pkp}>{groupName || 'اختيار المجموعة'}</Text><Text style={st.pka}>▼</Text></TouchableOpacity>
          <Text style={st.fl}>العملة</Text>
          <TouchableOpacity style={st.pk} onPress={() => setShowCurrencyPicker(true)}><Text style={st.pkt}>{currency}</Text><Text style={st.pka}>▼</Text></TouchableOpacity>
          <Text style={st.fl}>الرصيد الافتتاحي</Text><TextInput style={st.fi} value={balance} onChangeText={setBalance} placeholder="0" placeholderTextColor="#666" keyboardType="numeric" />
          <Text style={st.fl}>الحد الائتماني</Text><TextInput style={st.fi} value={creditLimit} onChangeText={setCreditLimit} placeholder="0" placeholderTextColor="#666" keyboardType="numeric" />
          <TouchableOpacity style={st.sb} onPress={handleSave}><Text style={st.sbt}>💾 حفظ</Text></TouchableOpacity>
        </ScrollView></View></View>
      </Modal>
      <PickerModal visible={showCurrencyPicker} title="اختيار العملة" data={currencies || []} displayField="code" onSelect={(i: any) => setCurrency(i.code)} onClose={() => setShowCurrencyPicker(false)} />
      <PickerModal visible={showGroupPicker} title="اختيار المجموعة" data={groups || []} displayField="name" onSelect={(i: any) => { setGroupId(i.id); setGroupName(i.name); }} onClose={() => setShowGroupPicker(false)} />
    </View>
  );
}
const st = StyleSheet.create({
  c:{flex:1,backgroundColor:'#0A1128'},si:{marginHorizontal:16,marginBottom:8,padding:12,backgroundColor:'#16213E',borderRadius:10,color:'#FFF',borderWidth:1,borderColor:'#2a3550',textAlign:'right'},
  et:{color:'#666',textAlign:'center',marginTop:40,fontSize:16},
  card:{backgroundColor:'#16213E',borderRadius:14,padding:14,marginBottom:8,marginHorizontal:16,borderWidth:1,borderColor:'#2a3550'},selected:{borderColor:'#D4AF37',backgroundColor:'#1a2540'},
  name:{color:'#FFF',fontSize:16,fontWeight:'bold'},code:{color:'#D4AF37',fontSize:10},detail:{color:'#94a3b8',fontSize:12,marginTop:4},balance:{color:'#10B981',fontSize:13,marginTop:4},del:{fontSize:22,padding:8},
  mo:{flex:1,backgroundColor:'rgba(0,0,0,0.7)',justifyContent:'flex-end'},mc:{backgroundColor:'#16213E',borderTopLeftRadius:20,borderTopRightRadius:20,maxHeight:'85%'},
  mh:{flexDirection:'row',justifyContent:'space-between',padding:16,borderBottomWidth:1,borderBottomColor:'#2a3550'},mt:{color:'#D4AF37',fontSize:16,fontWeight:'bold'},mx:{color:'#EF4444',fontSize:22},mb:{padding:16},
  fl:{color:'#94a3b8',fontSize:13,marginBottom:6,marginTop:10},fi:{backgroundColor:'#0A1128',borderRadius:10,padding:10,color:'#FFF',borderWidth:1,borderColor:'#2a3550',textAlign:'right'},
  pk:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',backgroundColor:'#0A1128',borderRadius:10,padding:14,borderWidth:1,borderColor:'#2a3550'},pkt:{color:'#FFF',fontSize:14},pkp:{color:'#666',fontSize:14},pka:{color:'#D4AF37',fontSize:12},
  sb:{backgroundColor:'#D4AF37',borderRadius:12,padding:14,alignItems:'center',marginTop:20,marginBottom:20},sbt:{color:'#0A1128',fontSize:16,fontWeight:'bold'},
});
