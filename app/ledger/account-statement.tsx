import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDatabase } from '../../context/DatabaseContext';
import { ControlHeader } from '../../src/components/ui/ControlButtons';

export default function AccountStatementScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const { db } = useDatabase();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(useCallback(() => { loadAccounts(); }, [db]));

  const loadAccounts = async () => {
    if (!db) return;
    const result = await db.getAllAsync('SELECT * FROM accounts WHERE isActive=1 ORDER BY code');
    setAccounts(result);
  };

  const loadTransactions = async (accountId: string) => {
    if (!db) return;
    const result = await db.getAllAsync(
      `SELECT ji.*, je.date, je.number as entryNumber, je.description as entryDesc 
       FROM journal_items ji 
       JOIN journal_entries je ON ji.entryId = je.id 
       WHERE ji.accountId = ? 
       ORDER BY je.date DESC, je.number DESC 
       LIMIT 100`,
      [accountId]
    );
    setTransactions(result);
  };

  const selectAccount = (account: any) => {
    setSelectedAccount(account);
    loadTransactions(account.id);
    setShowPicker(false);
  };

  const balance = transactions.reduce((sum, t) => sum + (t.debit || 0) - (t.credit || 0), 0);

  return (
    <View style={[st.c, { paddingTop: insets.top }]}>
      <ControlHeader title="كشف حساب" onBack={() => router.back()} />
      
      <TouchableOpacity style={st.selector} onPress={() => setShowPicker(true)}>
        <Text style={selectedAccount ? st.selectorText : st.placeholder}>
          {selectedAccount ? `${selectedAccount.code} - ${selectedAccount.name}` : 'اختر الحساب...'}
        </Text>
        <Text style={st.arrow}>▼</Text>
      </TouchableOpacity>

      {selectedAccount && (
        <View style={st.balanceBox}>
          <Text style={st.balanceLabel}>الرصيد الحالي</Text>
          <Text style={[st.balanceValue, { color: balance >= 0 ? '#10B981' : '#EF4444' }]}>
            {balance.toLocaleString()} ﷼
          </Text>
        </View>
      )}

      {showPicker && (
        <View style={st.pickerOverlay}>
          <View style={st.pickerContent}>
            <Text style={st.pickerTitle}>اختر الحساب</Text>
            <TextInput style={st.searchInput} placeholder="🔍 بحث..." placeholderTextColor="#666" value={searchQuery} onChangeText={setSearchQuery} />
            <FlatList data={accounts.filter(a => a.name?.includes(searchQuery) || a.code?.includes(searchQuery))}
              keyExtractor={i => i.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={st.pickerItem} onPress={() => selectAccount(item)}>
                  <Text style={st.pickerItemCode}>{item.code}</Text>
                  <Text style={st.pickerItemName}>{item.name}</Text>
                  <Text style={[st.pickerItemType, { color: item.type === 'أصل' ? '#10B981' : '#EF4444' }]}>{item.type}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={st.closePicker} onPress={() => setShowPicker(false)}>
              <Text style={st.closePickerText}>إغلاق</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={st.tableHeader}>
        <Text style={[st.th, { flex: 1 }]}>التاريخ</Text>
        <Text style={[st.th, { flex: 2 }]}>البيان</Text>
        <Text style={[st.th, { flex: 1, color: '#EF4444' }]}>مدين</Text>
        <Text style={[st.th, { flex: 1, color: '#10B981' }]}>دائن</Text>
      </View>

      <FlatList data={transactions} keyExtractor={i => i.id}
        renderItem={({ item }) => (
          <View style={st.row}>
            <Text style={[st.cell, { flex: 1, fontSize: 10 }]}>{item.date}</Text>
            <View style={{ flex: 2 }}>
              <Text style={st.desc}>{item.description || item.entryDesc}</Text>
              <Text style={st.entryNum}>{item.entryNumber}</Text>
            </View>
            <Text style={[st.cell, { flex: 1, color: '#EF4444' }]}>{item.debit > 0 ? item.debit.toLocaleString() : '-'}</Text>
            <Text style={[st.cell, { flex: 1, color: '#10B981' }]}>{item.credit > 0 ? item.credit.toLocaleString() : '-'}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={st.empty}>{selectedAccount ? 'لا توجد حركات' : 'اختر حساباً لعرض الحركات'}</Text>}
      />
    </View>
  );
}

const st = StyleSheet.create({
  c: { flex: 1, backgroundColor: '#0A1128' },
  selector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', margin: 16, padding: 14, backgroundColor: '#16213E', borderRadius: 10, borderWidth: 1, borderColor: '#2a3550' },
  selectorText: { color: '#FFF', fontSize: 16, flex: 1, textAlign: 'right' },
  placeholder: { color: '#666', fontSize: 16, flex: 1, textAlign: 'right' },
  arrow: { color: '#D4AF37', fontSize: 14, marginLeft: 8 },
  balanceBox: { marginHorizontal: 16, padding: 14, backgroundColor: '#16213E', borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#D4AF37' },
  balanceLabel: { color: '#94a3b8', fontSize: 12 }, balanceValue: { fontSize: 24, fontWeight: 'bold', marginTop: 4 },
  pickerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 10, justifyContent: 'center', padding: 20 },
  pickerContent: { backgroundColor: '#16213E', borderRadius: 16, maxHeight: '80%', padding: 16 },
  pickerTitle: { color: '#D4AF37', fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
  searchInput: { backgroundColor: '#0A1128', color: '#FFF', padding: 12, borderRadius: 8, marginBottom: 10, textAlign: 'right' },
  pickerItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#2a3550' },
  pickerItemCode: { color: '#D4AF37', fontSize: 14, fontWeight: 'bold', width: 70 },
  pickerItemName: { color: '#FFF', fontSize: 14, flex: 1, textAlign: 'right' },
  pickerItemType: { fontSize: 11, fontWeight: 'bold' },
  closePicker: { backgroundColor: '#EF4444', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  closePickerText: { color: '#FFF', fontWeight: 'bold' },
  tableHeader: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#16213E', marginHorizontal: 12, borderRadius: 8, marginTop: 12 },
  th: { color: '#D4AF37', fontSize: 12, fontWeight: 'bold', textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#1a2540' },
  cell: { color: '#FFF', fontSize: 13, textAlign: 'center' },
  desc: { color: '#FFF', fontSize: 12, textAlign: 'right' },
  entryNum: { color: '#94a3b8', fontSize: 10, textAlign: 'right', marginTop: 2 },
  empty: { color: '#94a3b8', textAlign: 'center', marginTop: 40, fontSize: 16 },
});
