import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, StatusBar, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalTable } from '../../hooks/useLocalStore';

interface Account { id: string; code: string; name: string; type: string; balance: number; }
interface JournalLine { id: string; entryId: string; accountName: string; debit: number; credit: number; }
interface JournalEntry { id: string; number: string; date: string; description: string; lines: JournalLine[]; }

export default function AccountStatementScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: accounts } = useLocalTable<Account>('accounts');
  const { data: entries } = useLocalTable<JournalEntry>('journalEntries');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const selectedAccount = accounts.find((a: Account) => a.id === selectedAccountId);
  const safeNum = (v: any): number => (v === null || isNaN(Number(v)) ? 0 : Number(v));

  // فلترة القيود حسب الحساب المحدد
  const accountEntries = entries.filter((e: JournalEntry) => {
    if (selectedAccountId && e.lines) {
      return e.lines.some((l: JournalLine) => l.accountName === selectedAccount?.name);
    }
    return true;
  });

  const totalDebit = accountEntries.reduce((s: number, e: JournalEntry) => {
    return s + (e.lines || []).filter((l: JournalLine) => l.accountName === selectedAccount?.name).reduce((sum: number, l: JournalLine) => sum + safeNum(l.debit), 0);
  }, 0);

  const totalCredit = accountEntries.reduce((s: number, e: JournalEntry) => {
    return s + (e.lines || []).filter((l: JournalLine) => l.accountName === selectedAccount?.name).reduce((sum: number, l: JournalLine) => sum + safeNum(l.credit), 0);
  }, 0);

  const theme = {
    text: '#f1f5f9', accent: '#D4AF37', background: '#0A1128',
    card: '#16213E', border: '#2a3550', mutedForeground: '#94a3b8',
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backBtn, { color: theme.accent }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>كشف حساب</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* اختيار الحساب */}
      <View style={styles.filterSection}>
        <Text style={[styles.label, { color: theme.mutedForeground }]}>اختيار الحساب</Text>
        <View style={styles.accountList}>
          {accounts.slice(0, 10).map((acc: Account) => (
            <TouchableOpacity
              key={acc.id}
              style={[styles.accountChip, selectedAccountId === acc.id && { backgroundColor: theme.accent + '30', borderColor: theme.accent }]}
              onPress={() => setSelectedAccountId(acc.id)}
            >
              <Text style={[styles.accountChipText, { color: selectedAccountId === acc.id ? theme.accent : theme.mutedForeground }]}>
                {acc.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput style={styles.searchInput} placeholder="🔍 بحث عن حساب..." placeholderTextColor="#94a3b8" value={searchQuery} onChangeText={setSearchQuery} />
        {searchQuery.length > 0 && accounts.filter((a: Account) => a.name?.includes(searchQuery)).map((acc: Account) => (
          <TouchableOpacity key={acc.id} style={styles.searchResult} onPress={() => { setSelectedAccountId(acc.id); setSearchQuery(''); }}>
            <Text style={{ color: '#FFFFFF' }}>{acc.name} ({acc.code})</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* معلومات الحساب */}
      {selectedAccount && (
        <View style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.accountName, { color: theme.text }]}>{selectedAccount.name}</Text>
          <Text style={[styles.accountCode, { color: theme.mutedForeground }]}>كود: {selectedAccount.code} | {selectedAccount.type}</Text>
          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <Text style={[styles.balanceLabel, { color: theme.mutedForeground }]}>مدين</Text>
              <Text style={[styles.balanceValue, { color: '#10B981' }]}>{totalDebit.toLocaleString()} ﷼</Text>
            </View>
            <View style={styles.balanceItem}>
              <Text style={[styles.balanceLabel, { color: theme.mutedForeground }]}>دائن</Text>
              <Text style={[styles.balanceValue, { color: '#EF4444' }]}>{totalCredit.toLocaleString()} ﷼</Text>
            </View>
            <View style={styles.balanceItem}>
              <Text style={[styles.balanceLabel, { color: theme.mutedForeground }]}>الرصيد</Text>
              <Text style={[styles.balanceValue, { color: theme.accent }]}>
                {((selectedAccount.balance || 0) + totalDebit - totalCredit).toLocaleString()} ﷼
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* الحركات */}
      {selectedAccount && accountEntries.length > 0 ? (
        <FlatList
          data={accountEntries}
          keyExtractor={(item: JournalEntry) => item.id}
          renderItem={({ item }) => {
            const line = item.lines?.find((l: JournalLine) => l.accountName === selectedAccount.name);
            return (
              <View style={[styles.entryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.entryHeader}>
                  <Text style={[styles.entryNumber, { color: theme.accent }]}>{item.number}</Text>
                  <Text style={[styles.entryDate, { color: theme.mutedForeground }]}>{item.date}</Text>
                </View>
                <Text style={[styles.entryDesc, { color: theme.text }]}>{item.description}</Text>
                {line && (
                  <View style={styles.entryAmounts}>
                    {safeNum(line.debit) > 0 && (
                      <Text style={[styles.amountText, { color: '#10B981' }]}>مدين: {safeNum(line.debit).toLocaleString()} ﷼</Text>
                    )}
                    {safeNum(line.credit) > 0 && (
                      <Text style={[styles.amountText, { color: '#EF4444' }]}>دائن: {safeNum(line.credit).toLocaleString()} ﷼</Text>
                    )}
                  </View>
                )}
              </View>
            );
          }}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        />
      ) : selectedAccount ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📄</Text>
          <Text style={[styles.emptyText, { color: theme.text }]}>لا توجد حركات لهذا الحساب</Text>
        </View>
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={[styles.emptyText, { color: theme.text }]}>اختر حساباً لعرض كشف الحساب</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1128' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { fontSize: 24, fontWeight: 'bold' },
  title: { fontSize: 18, fontWeight: 'bold' },
  filterSection: { paddingHorizontal: 16, marginBottom: 12 },
  label: { fontSize: 13, marginBottom: 8 },
  accountList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  accountChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#16213E', borderWidth: 1, borderColor: '#2a3550' },
  accountChipText: { fontSize: 12 },
  searchInput: { backgroundColor: '#16213E', borderRadius: 10, padding: 10, color: '#FFFFFF', borderWidth: 1, borderColor: '#2a3550', textAlign: 'right', fontSize: 14 },
  searchResult: { padding: 10, backgroundColor: '#16213E', borderRadius: 8, marginTop: 4 },
  infoCard: { marginHorizontal: 16, marginBottom: 16, padding: 16, borderRadius: 14, borderWidth: 1 },
  accountName: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  accountCode: { fontSize: 12, marginBottom: 12 },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-around' },
  balanceItem: { alignItems: 'center' },
  balanceLabel: { fontSize: 11, marginBottom: 4 },
  balanceValue: { fontSize: 16, fontWeight: 'bold' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: 'bold' },
  entryCard: { padding: 14, borderRadius: 12, marginBottom: 8, borderWidth: 1 },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  entryNumber: { fontSize: 13, fontWeight: 'bold' },
  entryDate: { fontSize: 11 },
  entryDesc: { fontSize: 14, marginBottom: 6 },
  entryAmounts: { flexDirection: 'row', gap: 12 },
  amountText: { fontSize: 13, fontWeight: 'bold' },
});
