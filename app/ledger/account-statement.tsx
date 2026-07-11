import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAccountStore } from '../../src/store/useAccountStore';
import { Selector } from '../../src/components/common/Selector';
import { ControlHeader } from '../../src/components/ui/ControlButtons';
import { useDatabase } from '../../src/context/DatabaseContext';

export default function AccountStatementScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const { accounts, loadAccounts } = useAccountStore();
  const { db } = useDatabase();
  const [selectedId, setSelectedId] = useState('');
  const [selectedName, setSelectedName] = useState('');
  const [transactions, setTransactions] = useState<any[]>([]);

  useFocusEffect(useCallback(() => { loadAccounts(); }, []));

  const loadStatement = async (id: string) => {
    if (!db) return;
    const result = await db.getAllAsync('SELECT * FROM journal_details WHERE account_id=? ORDER BY rowid DESC LIMIT 100', [id]);
    setTransactions(result);
  };

  const account = accounts.find((a: any) => a.id === selectedId);
  const balance = account?.balance || 0;
  const nature = account?.isDebit !== 0 ? 'مدين' : 'دائن';

  return (
    <View style={[st.c, { paddingTop: insets.top }]}>
      <ControlHeader title="كشف حساب" onBack={() => router.back()} />
      <Selector label="اختر الحساب" tableName="accounts" displayField="name" subField="code" showBalance selectedId={selectedId} selectedName={selectedName} onSelect={(i: any) => { setSelectedId(i.id); setSelectedName(i.name); loadStatement(i.id); }} />
      
      {selectedName && (
        <View style={st.balBox}>
          <Text style={st.balLabel}>الرصيد: {balance.toLocaleString()} ﷼</Text>
          <Text style={st.nature}>الطبيعة: {nature} | العملة: {account?.currency}</Text>
        </View>
      )}

      <View style={st.headerRow}>
        <Text style={[st.th, { flex: 2 }]}>البيان</Text>
        <Text style={[st.th, { flex: 1, color: '#10B981' }]}>مدين</Text>
        <Text style={[st.th, { flex: 1, color: '#EF4444' }]}>دائن</Text>
      </View>

      <FlatList data={transactions} keyExtractor={(i, idx) => i.id + idx}
        renderItem={({ item }) => (
          <View style={[st.row, { borderRightColor: item.debit > 0 ? '#10B981' : '#EF4444', borderRightWidth: 3 }]}>
            <Text style={[st.desc, { flex: 2 }]}>{item.description || 'حركة'}</Text>
            <Text style={[st.val, { flex: 1, color: '#10B981' }]}>{item.debit > 0 ? item.debit?.toLocaleString() : '-'}</Text>
            <Text style={[st.val, { flex: 1, color: '#EF4444' }]}>{item.credit > 0 ? item.credit?.toLocaleString() : '-'}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={st.et}>{selectedId ? 'لا توجد حركات' : 'اختر حساباً'}</Text>}
        contentContainerStyle={{ padding: 12 }}
      />
    </View>
  );
}
const st = StyleSheet.create({
  c: { flex: 1, backgroundColor: '#0A1128' }, et: { color: '#FFF', textAlign: 'center', marginTop: 40 },
  balBox: { marginHorizontal: 16, marginVertical: 10, padding: 16, backgroundColor: '#16213E', borderRadius: 12, alignItems: 'center' },
  balLabel: { color: '#D4AF37', fontSize: 20, fontWeight: 'bold' }, nature: { color: '#94a3b8', fontSize: 13, marginTop: 4 },
  headerRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#16213E', marginHorizontal: 8, borderRadius: 8 },
  th: { color: '#D4AF37', fontSize: 11, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16213E', borderRadius: 8, padding: 10, marginBottom: 4, marginHorizontal: 8 },
  desc: { color: '#FFF', fontSize: 12, textAlign: 'right' }, val: { textAlign: 'center', fontWeight: 'bold', fontSize: 12 },
});
