import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, StatusBar, Alert, Modal, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAccountStore } from '../../src/store/useAccountStore';
import { Selector } from '../../src/components/common/Selector';
import { ControlButtons, ControlHeader } from '../../src/components/ui/ControlButtons';
import { injectJournalEntry } from '../../src/services/accountingService';

export default function JournalEntryScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const { accounts, loadAccounts } = useAccountStore();
  const [entries, setEntries] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], description: '', debitAccountId: '', debitAccountName: '', creditAccountId: '', creditAccountName: '', amount: '' });

  useFocusEffect(useCallback(() => { loadAccounts(); }, []));

  // ✅ دالة الحفظ الصحيحة
  const handleSaveJournal = async () => {
    const amount = parseFloat(form.amount) || 0;
    
    // 1. التحقق من الحقول المطلوبة
    if (!form.description.trim()) { Alert.alert('خطأ', 'أدخل البيان'); return; }
    if (!form.debitAccountName || !form.creditAccountName) { Alert.alert('خطأ', 'اختر حساب المدين والدائن'); return; }
    if (form.debitAccountId === form.creditAccountId) { Alert.alert('خطأ', 'لا يمكن أن يكون المدين والدائن نفس الحساب'); return; }
    if (amount <= 0) { Alert.alert('خطأ', 'المبلغ يجب أن يكون أكبر من صفر'); return; }

    // 2. التحقق من التوازن (المدين = الدائن)
    // في القيد البسيط: المبلغ واحد للطرفين
    const debit = amount;
    const credit = amount;
    
    if (Math.abs(debit - credit) > 0.001) {
      Alert.alert('خطأ', 'مجموع المدين والدائن غير متساوي');
      return;
    }

    try {
      // 3. حفظ القيد مع الترحيل المحاسبي
      const number = 'JE-' + Date.now().toString().slice(-6);
      const success = await injectJournalEntry(
        'manual',
        form.date,
        form.description,
        form.debitAccountId,
        form.creditAccountId,
        amount
      );

      if (success) {
        const newEntry = { id: 'je-' + Date.now(), number, ...form, amount, date: form.date };
        setEntries([newEntry, ...entries]);
        await loadAccounts();
        setShowModal(false);
        setForm({ date: new Date().toISOString().split('T')[0], description: '', debitAccountId: '', debitAccountName: '', creditAccountId: '', creditAccountName: '', amount: '' });
        Alert.alert('✅', `تم حفظ القيد ${number}\n${amount.toLocaleString()} ﷼`);
      } else {
        Alert.alert('خطأ', 'فشل حفظ القيد المحاسبي');
      }
    } catch (error) {
      console.error('خطأ في حفظ القيد:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء حفظ القيد');
    }
  };

  const leafAccounts = accounts.filter((a: any) => a.parentId && !accounts.some((p: any) => p.parentId === a.id));

  return (
    <View style={[st.c, { paddingTop: insets.top }]}><StatusBar barStyle="light-content" />
      <ControlHeader title="قيود اليومية" count={entries.length} onBack={() => router.back()} onAdd={() => { setForm({ date: new Date().toISOString().split('T')[0], description: '', debitAccountId: '', debitAccountName: '', creditAccountId: '', creditAccountName: '', amount: '' }); setShowModal(true); }} />
      <ControlButtons showSearch showRefresh showPrint showExport onRefresh={loadAccounts} />
      
      {entries.length === 0 ? <Text style={st.et}>لا توجد قيود</Text> :
        <FlatList data={entries} keyExtractor={(i: any) => i.id} renderItem={({ item }: any) => (
          <View style={st.rc}>
            <Text style={st.rn}>{item.number}</Text>
            <Text style={st.rd}>مدين: {item.debitAccountName}</Text>
            <Text style={st.rd}>دائن: {item.creditAccountName}</Text>
            <Text style={st.rt}>{item.amount?.toLocaleString()} ﷼ | {item.date}</Text>
          </View>
        )} contentContainerStyle={{ padding: 16 }} />}

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={st.mo}><View style={st.mc}><View style={st.mh}><Text style={st.mt}>قيد يومية جديد</Text><TouchableOpacity onPress={() => setShowModal(false)}><Text style={st.mx}>✕</Text></TouchableOpacity></View>
        <ScrollView style={st.mb}>
          <Text style={st.fl}>التاريخ</Text><TextInput style={st.fi} value={form.date} onChangeText={v => setForm({ ...form, date: v })} />
          <Text style={st.fl}>البيان *</Text><TextInput style={[st.fi, { height: 60 }]} value={form.description} onChangeText={v => setForm({ ...form, description: v })} placeholder="بيان القيد" placeholderTextColor="#666" multiline />
          
          <Selector label="حساب مدين *" tableName="accounts" filterField="parentId" displayField="name" subField="code" selectedId={form.debitAccountId} selectedName={form.debitAccountName} onSelect={(i: any) => setForm({ ...form, debitAccountId: i.id, debitAccountName: i.name })} />
          
          <Selector label="حساب دائن *" tableName="accounts" filterField="parentId" displayField="name" subField="code" selectedId={form.creditAccountId} selectedName={form.creditAccountName} onSelect={(i: any) => setForm({ ...form, creditAccountId: i.id, creditAccountName: i.name })} />
          
          <Text style={st.fl}>المبلغ *</Text><TextInput style={[st.fi, { fontSize: 18 }]} value={form.amount} onChangeText={v => setForm({ ...form, amount: v })} keyboardType="numeric" placeholder="0" placeholderTextColor="#666" />
          
          <TouchableOpacity style={st.sb} onPress={handleSaveJournal}><Text style={st.sbt}>💾 حفظ القيد</Text></TouchableOpacity>
        </ScrollView></View></View>
      </Modal>
    </View>
  );
}
const st = StyleSheet.create({
  c:{flex:1,backgroundColor:'#0A1128'},et:{color:'#FFF',fontSize:16,textAlign:'center',marginTop:40},
  rc:{backgroundColor:'#16213E',borderRadius:14,padding:14,marginBottom:8,marginHorizontal:16,borderWidth:1,borderColor:'#2a3550'},rn:{color:'#D4AF37',fontSize:14,fontWeight:'bold'},rd:{color:'#FFF',fontSize:13},rt:{color:'#10B981',fontSize:13},
  mo:{flex:1,backgroundColor:'rgba(0,0,0,0.7)',justifyContent:'flex-end'},mc:{backgroundColor:'#16213E',borderTopLeftRadius:20,borderTopRightRadius:20,maxHeight:'90%'},mh:{flexDirection:'row',justifyContent:'space-between',padding:16},mt:{color:'#D4AF37',fontSize:18,fontWeight:'bold'},mx:{color:'#EF4444',fontSize:22},mb:{padding:16},
  fl:{color:'#94a3b8',fontSize:13,marginBottom:6,marginTop:12},fi:{backgroundColor:'#0A1128',borderRadius:10,padding:12,color:'#FFF',borderWidth:1,borderColor:'#2a3550',fontSize:14,textAlign:'right'},
  sb:{backgroundColor:'#D4AF37',borderRadius:12,padding:14,alignItems:'center',marginTop:20,marginBottom:20},sbt:{color:'#0A1128',fontSize:16,fontWeight:'bold'},
});
