import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Modal, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAccountStore } from '../../src/store/useAccountStore';
import { Selector } from '../../src/components/common/Selector';
import { ControlButtons, ControlHeader } from '../../src/components/ui/ControlButtons';

export default function CustomersScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const { accounts, loadAccounts, addAccount, generateCode } = useAccountStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '', phone: '', address: '', currency: 'YER', balance: '0', creditLimit: '0', isDebit: true, showDebitCredit: false
  });

  useFocusEffect(useCallback(() => { loadAccounts(); }, []));

  const customers = accounts.filter((a: any) => a.parentId === '114');
  const total = customers.reduce((s: number, c: any) => s + (c.balance || 0), 0);
  const count = customers.length + 1;

  const resetForm = () => setFormData({ name: '', phone: '', address: '', currency: 'YER', balance: '0', creditLimit: '0', isDebit: true, showDebitCredit: false });

  const handleSave = async () => {
    if (!formData.name.trim()) { Alert.alert('خطأ', 'أدخل اسم العميل'); return; }
    const balance = parseFloat(formData.balance) || 0;
    const code = generateCode('114');
    const finalBalance = formData.isDebit ? balance : -balance;

    if (balance > 0) {
      const nature = formData.isDebit ? 'مدين' : 'دائن';
      Alert.alert('تأكيد', `الرصيد: ${balance.toLocaleString()} ${formData.currency}\nالطبيعة: ${nature}`, [
        { text: 'تعديل' },
        { text: 'حفظ', onPress: async () => {
          await addAccount({ name: formData.name, code, type: 'أصل', parentId: '114', balance: finalBalance, currency: formData.currency, isDebit: formData.isDebit ? 1 : 0, walletPhone: formData.phone, notes: formData.address });
          await loadAccounts(); resetForm(); setShowModal(false);
          Alert.alert('✅', `تم إضافة ${formData.name} تحت العملاء`);
        }}
      ]);
      return;
    }

    await addAccount({ name: formData.name, code, type: 'أصل', parentId: '114', balance: 0, currency: formData.currency, isDebit: 1, walletPhone: formData.phone, notes: formData.address });
    await loadAccounts(); resetForm(); setShowModal(false);
  };

  return (
    <View style={[st.c, { paddingTop: insets.top }]}>
      <ControlHeader title="العملاء" count={customers.length} onBack={() => router.back()} onAdd={() => { resetForm(); setShowModal(true); }} />
      <ControlButtons showSearch showRefresh onRefresh={loadAccounts} />
      <TextInput style={st.si} placeholder="🔍 بحث..." placeholderTextColor="#94a3b8" value={searchQuery} onChangeText={setSearchQuery} />
      <View style={st.sm}><Text style={st.sl}>إجمالي الذمم</Text><Text style={st.sv}>{total.toLocaleString()} ﷼</Text></View>
      {customers.length === 0 ? <Text style={st.et}>لا يوجد عملاء</Text> :
        <FlatList data={customers.filter(c => c.name?.includes(searchQuery) || c.code?.includes(searchQuery))} keyExtractor={i => i.id} renderItem={({ item }) => (
          <View style={st.rc}><Text style={st.rn}>👤 {item.name}</Text><Text style={st.rd}>📞 {item.walletPhone || '-'} | 📍 {item.notes || '-'} | الرصيد: {item.balance?.toLocaleString()} {item.currency}</Text></View>
        )} contentContainerStyle={{ padding: 16 }} />}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={st.mo}><View style={st.mc}><View style={st.mh}><Text style={st.mt}>إضافة عميل</Text><TouchableOpacity onPress={() => setShowModal(false)}><Text style={st.mx}>✕</Text></TouchableOpacity></View>
        <ScrollView style={st.mb}>
          <Text style={st.fl}>الرقم</Text><TextInput style={[st.fi,{color:'#D4AF37'}]} value={`CST-${count.toString().padStart(4,'0')}`} editable={false} />
          
          <Text style={st.fl}>اسم العميل *</Text><TextInput style={st.fi} value={formData.name} onChangeText={v=>setFormData({...formData,name:v})} placeholder="اسم العميل" placeholderTextColor="#666" />
          
          <Text style={st.fl}>📞 رقم الهاتف</Text><TextInput style={st.fi} value={formData.phone} onChangeText={v=>setFormData({...formData,phone:v})} placeholder="رقم الهاتف" placeholderTextColor="#666" keyboardType="phone-pad" />
          
          <Text style={st.fl}>📍 العنوان</Text><TextInput style={st.fi} value={formData.address} onChangeText={v=>setFormData({...formData,address:v})} placeholder="العنوان" placeholderTextColor="#666" />
          
          <Text style={st.fl}>العملة</Text>
          <Selector label="" tableName="currencies" displayField="code" subField="name" selectedId={formData.currency} selectedName={formData.currency} onSelect={(i:any)=>setFormData({...formData,currency:i.code})} />
          
          <Text style={st.fl}>الرصيد الافتتاحي</Text>
          <TextInput style={st.fi} value={formData.balance} onChangeText={v => setFormData({...formData, balance: v, showDebitCredit: parseFloat(v) > 0})} keyboardType="numeric" placeholder="0" placeholderTextColor="#666" />
          
          {formData.showDebitCredit && (
            <>
              <Text style={[st.fl, {color:'#D4AF37'}]}>⚠️ طبيعة الرصيد</Text>
              <View style={{flexDirection:'row',gap:8}}>
                <TouchableOpacity style={[st.tb,{flex:1},formData.isDebit&&st.tba]} onPress={()=>setFormData({...formData,isDebit:true})}><Text style={[st.tt,formData.isDebit&&st.tta]}>مدين</Text></TouchableOpacity>
                <TouchableOpacity style={[st.tb,{flex:1},!formData.isDebit&&st.tba]} onPress={()=>setFormData({...formData,isDebit:false})}><Text style={[st.tt,!formData.isDebit&&st.tta]}>دائن</Text></TouchableOpacity>
              </View>
            </>
          )}

          <Text style={st.fl}>الحد الائتماني</Text>
          <TextInput style={st.fi} value={formData.creditLimit} onChangeText={v=>setFormData({...formData,creditLimit:v})} keyboardType="numeric" placeholder="0" placeholderTextColor="#666" />

          <TouchableOpacity style={st.sb} onPress={handleSave}><Text style={st.sbt}>💾 حفظ</Text></TouchableOpacity>
        </ScrollView></View></View>
      </Modal>
    </View>
  );
}
const st = StyleSheet.create({
  c:{flex:1,backgroundColor:'#0A1128'},si:{marginHorizontal:16,marginBottom:8,padding:12,backgroundColor:'#16213E',borderRadius:10,color:'#FFF',borderWidth:1,borderColor:'#2a3550',textAlign:'right'},et:{color:'#FFF',fontSize:16,textAlign:'center',marginTop:40},
  sm:{marginHorizontal:16,marginBottom:12,padding:16,backgroundColor:'#16213E',borderRadius:14,alignItems:'center',borderWidth:1,borderColor:'#2a3550'},sl:{color:'#94a3b8',fontSize:13},sv:{color:'#D4AF37',fontSize:24,fontWeight:'bold'},
  rc:{backgroundColor:'#16213E',borderRadius:14,padding:14,marginBottom:8,marginHorizontal:16,borderWidth:1,borderColor:'#2a3550'},rn:{color:'#FFF',fontSize:16,fontWeight:'bold'},rd:{color:'#10B981',fontSize:13},
  mo:{flex:1,backgroundColor:'rgba(0,0,0,0.7)',justifyContent:'flex-end'},mc:{backgroundColor:'#16213E',borderTopLeftRadius:20,borderTopRightRadius:20,maxHeight:'85%'},mh:{flexDirection:'row',justifyContent:'space-between',padding:16},mt:{color:'#D4AF37',fontSize:18,fontWeight:'bold'},mx:{color:'#EF4444',fontSize:22},mb:{padding:16},
  fl:{color:'#94a3b8',fontSize:13,marginBottom:6,marginTop:12},fi:{backgroundColor:'#0A1128',borderRadius:10,padding:12,color:'#FFF',borderWidth:1,borderColor:'#2a3550',fontSize:14,textAlign:'right'},
  tb:{paddingVertical:8,paddingHorizontal:14,borderRadius:8,backgroundColor:'#0A1128',borderWidth:1,borderColor:'#2a3550'},tba:{borderColor:'#D4AF37',backgroundColor:'#D4AF3720'},tt:{color:'#94a3b8',fontSize:12},tta:{color:'#D4AF37',fontWeight:'bold'},
  sb:{backgroundColor:'#D4AF37',borderRadius:12,padding:14,alignItems:'center',marginTop:20},sbt:{color:'#0A1128',fontSize:16,fontWeight:'bold'},
});
