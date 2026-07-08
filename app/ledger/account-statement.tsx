import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAccountStore } from '../../src/store/useAccountStore';
import { Selector } from '../../src/components/common/Selector';
import { ControlHeader } from '../../src/components/ui/ControlButtons';
import { useDatabase } from '../../context/DatabaseContext';

export default function AccountStatementScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const { accounts, loadAccounts } = useAccountStore();
  const { db } = useDatabase();
  const [selectedId, setSelectedId] = useState('');
  const [selectedName, setSelectedName] = useState('');
  const [transactions, setTransactions] = useState<any[]>([]);

  useFocusEffect(useCallback(() => { loadAccounts(); }, []));

  const loadStatement = async (accountId: string) => {
    if (!db) return;
    const result = await db.getAllAsync('SELECT * FROM journal_details WHERE account_id = ? ORDER BY rowid DESC LIMIT 50', [accountId]);
    setTransactions(result);
  };

  const selectedAccount = accounts.find((a: any) => a.id === selectedId);
  const nature = selectedAccount?.isDebit !== false ? 'مدين' : 'دائن';
  const currency = selectedAccount?.currency || 'YER';
  const isForeign = currency !== 'YER';

  return (
    <View style={[st.c, { paddingTop: insets.top }]}>
      <ControlHeader title="كشف حساب" onBack={() => router.back()} />
      <Selector label="اختر الحساب" tableName="accounts" displayField="name" subField="code" showBalance selectedId={selectedId} selectedName={selectedName} onSelect={(i: any) => { setSelectedId(i.id); setSelectedName(i.name); loadStatement(i.id); }} />

      {selectedName && (
        <View style={st.balBox}>
          <Text style={st.balLabel}>الرصيد الحالي</Text>
          <Text style={[st.balValue, { color: (selectedAccount?.balance || 0) >= 0 ? '#10B981' : '#EF4444' }]}>
            {(selectedAccount?.balance || 0).toLocaleString()} ﷼
          </Text>
          <Text style={st.nature}>طبيعة الحساب: {nature} | العملة: {currency}</Text>
        </View>
      )}

      <View style={st.headerRow}>
        <Text style={[st.th, { flex: 2 }]}>البيان</Text>
        <Text style={[st.th, { flex: 1, color: '#10B981' }]}>مدين</Text>
        <Text style={[st.th, { flex: 1, color: '#EF4444' }]}>دائن</Text>
        {isForeign && <Text style={[st.th, { flex: 1 }]}>بالعملة</Text>}
      </View>

      <FlatList data={transactions} keyExtractor={(i, idx) => i.id + idx}
        renderItem={({ item }: any) => (
          <View style={[st.row, { borderRightColor: item.debit > 0 ? '#10B981' : '#EF4444', borderRightWidth: 3 }]}>
            <View style={{ flex: 2 }}>
              <Text style={st.desc}>{item.description || 'حركة'}</Text>
            </View>
            <Text style={[st.debit, { flex: 1 }]}>{item.debit > 0 ? item.debit?.toLocaleString() : '-'}</Text>
            <Text style={[st.credit, { flex: 1 }]}>{item.credit > 0 ? item.credit?.toLocaleString() : '-'}</Text>
            {isForeign && (
              <Text style={[st.foreign, { flex: 1 }]}>
                {item.currency !== 'YER' ? `${(item.original_debit || item.original_credit || 0).toLocaleString()} ${item.currency}` : '-'}
              </Text>
            )}
          </View>
        )}
        ListEmptyComponent={<Text style={st.et}>{selectedId ? 'لا توجد حركات' : 'اختر حساباً لعرض كشف الحساب'}</Text>}
        contentContainerStyle={{ padding: 12 }}
      />
    </View>
  );
}
const st = StyleSheet.create({
  c: { flex: 1, backgroundColor: '#0A1128' },
  et: { color: '#FFF', textAlign: 'center', marginTop: 40 },
  balBox: { marginHorizontal: 16, marginVertical: 10, padding: 16, backgroundColor: '#16213E', borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#2a3550' },
  balLabel: { color: '#94a3b8', fontSize: 12 },
  balValue: { fontSize: 28, fontWeight: 'bold', marginTop: 4 },
  nature: { color: '#D4AF37', fontSize: 13, marginTop: 6 },
  headerRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#16213E', marginHorizontal: 8, borderRadius: 8, marginBottom: 4 },
  th: { color: '#94a3b8', fontSize: 11, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16213E', borderRadius: 8, padding: 10, marginBottom: 4, marginHorizontal: 8 },
  desc: { color: '#FFF', fontSize: 12, textAlign: 'right' },
  debit: { color: '#10B981', textAlign: 'center', fontWeight: 'bold', fontSize: 12 },
  credit: { color: '#EF4444', textAlign: 'center', fontWeight: 'bold', fontSize: 12 },
  foreign: { color: '#D4AF37', textAlign: 'center', fontSize: 10 },
});
