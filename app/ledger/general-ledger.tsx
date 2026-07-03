import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDatabase } from '../../context/DatabaseContext';
import { ControlButtons, ControlHeader } from '../../src/components/ui/ControlButtons';

export default function GeneralLedgerScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const { db } = useDatabase();
  const [entries, setEntries] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => { loadData(); }, [db]));

  const loadData = async () => {
    if (!db) return;
    setLoading(true);
    try {
      const result = await db.getAllAsync(
        `SELECT je.*, COUNT(ji.id) as itemCount 
         FROM journal_entries je 
         LEFT JOIN journal_items ji ON je.id = ji.entryId 
         GROUP BY je.id 
         ORDER BY je.date DESC, je.number DESC 
         LIMIT 100`
      );
      setEntries(result);
    } catch (e) { console.log('Error:', e); }
    setLoading(false);
  };

  const totalDebit = entries.reduce((s: number, e: any) => s + (e.totalDebit || 0), 0);
  const totalCredit = entries.reduce((s: number, e: any) => s + (e.totalCredit || 0), 0);

  const handlePrint = () => Alert.alert('🖨️', 'جاري طباعة دفتر الأستاذ...');
  const handleExport = () => Alert.alert('📤', 'جاري تصدير دفتر الأستاذ...');

  return (
    <View style={[st.c, { paddingTop: insets.top }]}>
      <ControlHeader title="دفتر الأستاذ العام" count={entries.length} onBack={() => router.back()} />
      <ControlButtons showSearch showPrint showRefresh showExport onRefresh={loadData} onPrint={handlePrint} onExport={handleExport} />
      <TextInput style={st.si} placeholder="🔍 بحث..." placeholderTextColor="#94a3b8" value={searchQuery} onChangeText={setSearchQuery} />
      
      <View style={st.summary}>
        <View style={[st.sumBox, { borderColor: '#EF4444' }]}><Text style={st.sumLabel}>مدين</Text><Text style={[st.sumValue, { color: '#EF4444' }]}>{totalDebit.toLocaleString()}</Text></View>
        <View style={[st.sumBox, { borderColor: '#10B981' }]}><Text style={st.sumLabel}>دائن</Text><Text style={[st.sumValue, { color: '#10B981' }]}>{totalCredit.toLocaleString()}</Text></View>
      </View>

      {loading ? <Text style={st.loading}>⏳ جاري التحميل...</Text> :
        <FlatList data={entries} keyExtractor={(i: any) => i.id}
          renderItem={({ item }: any) => (
            <View style={st.card}>
              <View style={st.row}><Text style={st.num}>{item.number}</Text><Text style={st.date}>{item.date}</Text></View>
              <Text style={st.desc}>{item.description}</Text>
              <View style={st.row}>
                <Text style={st.debit}>مدين: {item.totalDebit?.toLocaleString()}</Text>
                <Text style={st.credit}>دائن: {item.totalCredit?.toLocaleString()}</Text>
                <Text style={st.items}>{item.itemCount} بند</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={st.empty}>لا توجد قيود</Text>}
        />
      }
    </View>
  );
}

const st = StyleSheet.create({
  c: { flex: 1, backgroundColor: '#0A1128' },
  si: { marginHorizontal: 16, marginBottom: 10, padding: 12, backgroundColor: '#16213E', borderRadius: 10, color: '#FFF', borderWidth: 1, borderColor: '#2a3550', textAlign: 'right' },
  summary: { flexDirection: 'row', marginHorizontal: 12, gap: 6, marginBottom: 12 },
  sumBox: { flex: 1, backgroundColor: '#16213E', borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1 },
  sumLabel: { color: '#94a3b8', fontSize: 10 }, sumValue: { fontSize: 16, fontWeight: 'bold', marginTop: 4 },
  loading: { color: '#D4AF37', textAlign: 'center', marginTop: 40, fontSize: 16 },
  empty: { color: '#94a3b8', textAlign: 'center', marginTop: 40, fontSize: 16 },
  card: { backgroundColor: '#16213E', borderRadius: 12, padding: 14, marginBottom: 8, marginHorizontal: 12, borderWidth: 1, borderColor: '#2a3550' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  num: { color: '#D4AF37', fontSize: 14, fontWeight: 'bold' }, date: { color: '#94a3b8', fontSize: 11 },
  desc: { color: '#FFF', fontSize: 13, textAlign: 'right', marginBottom: 6 },
  debit: { color: '#EF4444', fontSize: 12 }, credit: { color: '#10B981', fontSize: 12 }, items: { color: '#94a3b8', fontSize: 10 },
});
