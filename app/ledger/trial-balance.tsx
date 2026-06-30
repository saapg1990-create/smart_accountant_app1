import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDatabase } from '../../context/DatabaseContext';
import { ControlButtons, ControlHeader } from '../../src/components/ui/ControlButtons';

export default function TrialBalanceScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const { db } = useDatabase();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => { loadData(); }, [db]));

  const loadData = async () => {
    if (!db) return;
    setLoading(true);
    try {
      const result = await db.getAllAsync('SELECT * FROM accounts WHERE isActive=1 ORDER BY code');
      setAccounts(result);
    } catch (e) { console.log('Error:', e); }
    setLoading(false);
  };

  const filtered = accounts.filter(a => a.name?.includes(searchQuery) || a.code?.includes(searchQuery));
  const totalDebit = filtered.filter(a => ['أصل','مصروف'].includes(a.type)).reduce((s, a) => s + (a.balance || 0), 0);
  const totalCredit = filtered.filter(a => ['خصم','ايراد','مخزون'].includes(a.type)).reduce((s, a) => s + (a.balance || 0), 0);
  const balanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const handlePrint = () => { Alert.alert('🖨️', 'جاري طباعة ميزان المراجعة...'); };
  const handleExport = () => { Alert.alert('📤', 'جاري تصدير ميزان المراجعة...'); };

  const getTypeColor = (type: string) => {
    const colors: any = { 'أصل': '#10B981', 'خصم': '#EF4444', 'مصروف': '#3B82F6', 'ايراد': '#F59E0B', 'مخزون': '#8B5CF6' };
    return colors[type] || '#94a3b8';
  };

  return (
    <View style={[st.c, { paddingTop: insets.top }]}>
      <ControlHeader title="ميزان المراجعة" count={accounts.length} onBack={() => router.back()} />
      <ControlButtons showSearch showPrint showRefresh showExport onRefresh={loadData} onPrint={handlePrint} onExport={handleExport} />
      <TextInput style={st.si} placeholder="🔍 بحث..." placeholderTextColor="#94a3b8" value={searchQuery} onChangeText={setSearchQuery} />
      
      <View style={st.summary}>
        <View style={[st.sumBox, { borderColor: '#EF4444' }]}>
          <Text style={st.sumLabel}>إجمالي مدين</Text>
          <Text style={[st.sumValue, { color: '#EF4444' }]}>{totalDebit.toLocaleString()} ﷼</Text>
        </View>
        <View style={[st.sumBox, { borderColor: '#10B981' }]}>
          <Text style={st.sumLabel}>إجمالي دائن</Text>
          <Text style={[st.sumValue, { color: '#10B981' }]}>{totalCredit.toLocaleString()} ﷼</Text>
        </View>
        <View style={[st.sumBox, { borderColor: balanced ? '#10B981' : '#EF4444' }]}>
          <Text style={st.sumLabel}>{balanced ? '✅ متوازن' : '❌ غير متوازن'}</Text>
          <Text style={[st.sumValue, { color: balanced ? '#10B981' : '#EF4444', fontSize: 14 }]}>
            الفرق: {(totalDebit - totalCredit).toLocaleString()} ﷼
          </Text>
        </View>
      </View>

      <View style={st.tableHeader}>
        <Text style={[st.th, { flex: 1 }]}>الكود</Text>
        <Text style={[st.th, { flex: 2 }]}>اسم الحساب</Text>
        <Text style={[st.th, { flex: 1, color: '#EF4444' }]}>مدين</Text>
        <Text style={[st.th, { flex: 1, color: '#10B981' }]}>دائن</Text>
      </View>

      {loading ? <Text style={st.loading}>جاري التحميل...</Text> :
        <FlatList data={filtered} keyExtractor={i => i.id}
          renderItem={({ item }) => (
            <View style={st.row}>
              <Text style={[st.cell, { flex: 1 }]}>{item.code}</Text>
              <View style={{ flex: 2 }}>
                <Text style={st.name}>{item.name}</Text>
                <View style={[st.badge, { backgroundColor: getTypeColor(item.type) + '30' }]}>
                  <Text style={[st.badgeText, { color: getTypeColor(item.type) }]}>{item.type}</Text>
                </View>
              </View>
              <Text style={[st.cell, { flex: 1, color: '#EF4444' }]}>
                {['أصل','مصروف'].includes(item.type) ? item.balance?.toLocaleString() : '-'}
              </Text>
              <Text style={[st.cell, { flex: 1, color: '#10B981' }]}>
                {['خصم','ايراد','مخزون'].includes(item.type) ? item.balance?.toLocaleString() : '-'}
              </Text>
            </View>
          )}
          ListEmptyComponent={<Text style={st.empty}>لا توجد حسابات</Text>}
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
  tableHeader: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#16213E', marginHorizontal: 12, borderRadius: 8, marginBottom: 4 },
  th: { color: '#D4AF37', fontSize: 12, fontWeight: 'bold', textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1a2540' },
  cell: { color: '#FFF', fontSize: 13, textAlign: 'center' },
  name: { color: '#FFF', fontSize: 14, fontWeight: 'bold', textAlign: 'right' },
  badge: { alignSelf: 'flex-end', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginTop: 3 },
  badgeText: { fontSize: 10, fontWeight: 'bold' },
  loading: { color: '#94a3b8', textAlign: 'center', marginTop: 40, fontSize: 16 },
  empty: { color: '#94a3b8', textAlign: 'center', marginTop: 40, fontSize: 16 },
});
