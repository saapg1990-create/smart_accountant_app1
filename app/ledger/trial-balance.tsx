import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAccountStore } from '../../src/store/useAccountStore';
import { ControlButtons, ControlHeader } from '../../src/components/ui/ControlButtons';

export default function TrialBalanceScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const { accounts, loadAccounts } = useAccountStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState(0);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useFocusEffect(useCallback(() => { loadAccounts(); }, []));

  // ✅ حسب القانون اليمني: الأصول والمصروفات = مدين، الخصوم وحقوق الملكية والإيرادات = دائن
  const getNature = (type: string) => ['أصل', 'مصروف'].includes(type) ? 'debit' : 'credit';
  
  const getMainAccounts = () => accounts.filter((a: any) => !a.parentId || a.parentId === '');
  const getSubAccounts = (parentId: string) => accounts.filter((a: any) => a.parentId === parentId);
  
  const buildTree = (parentId: string = '', level: number = 0): any[] => {
    const children = parentId === '' ? getMainAccounts() : getSubAccounts(parentId);
    if (level >= 3) return [];
    return children.filter((a: any) => {
      if (searchQuery) return a.name?.includes(searchQuery) || a.code?.includes(searchQuery);
      return true;
    }).map((a: any) => ({
      ...a,
      level,
      children: expandedIds.has(a.id) ? buildTree(a.id, level + 1) : [],
      isExpanded: expandedIds.has(a.id)
    }));
  };

  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedIds);
    if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
    setExpandedIds(newSet);
  };

  const tree = buildTree();
  
  const flattenTree = (items: any[]): any[] => {
    let result: any[] = [];
    items.forEach(item => {
      result.push(item);
      if (item.isExpanded && item.children) {
        result = [...result, ...flattenTree(item.children)];
      }
    });
    return result;
  };

  const displayList = flattenTree(tree);
  
  const totalDebit = accounts.filter(a => getNature(a.type) === 'debit').reduce((s, a) => s + Math.max(0, a.balance || 0), 0);
  const totalCredit = accounts.filter(a => getNature(a.type) === 'credit').reduce((s, a) => s + Math.max(0, a.balance || 0), 0);

  return (
    <View style={[st.c, { paddingTop: insets.top }]}>
      <ControlHeader title="ميزان المراجعة" count={accounts.length} onBack={() => router.back()} />
      <ControlButtons showSearch showPrint showRefresh showExport onRefresh={loadAccounts} />
      <TextInput style={st.si} placeholder="🔍 بحث..." placeholderTextColor="#94a3b8" value={searchQuery} onChangeText={setSearchQuery} />
      
      {/* ملخص */}
      <View style={st.summary}>
        <View style={[st.sumBox, { borderColor: '#EF4444' }]}>
          <Text style={st.sumLabel}>إجمالي مدين</Text>
          <Text style={[st.sumVal, { color: '#EF4444' }]}>{totalDebit.toLocaleString()} ﷼</Text>
        </View>
        <View style={[st.sumBox, { borderColor: '#10B981' }]}>
          <Text style={st.sumLabel}>إجمالي دائن</Text>
          <Text style={[st.sumVal, { color: '#10B981' }]}>{totalCredit.toLocaleString()} ﷼</Text>
        </View>
        <View style={[st.sumBox, { borderColor: Math.abs(totalDebit - totalCredit) < 0.01 ? '#10B981' : '#EF4444' }]}>
          <Text style={st.sumLabel}>{Math.abs(totalDebit - totalCredit) < 0.01 ? '✅ متوازن' : '❌ غير متوازن'}</Text>
          <Text style={[st.sumVal, { color: Math.abs(totalDebit - totalCredit) < 0.01 ? '#10B981' : '#EF4444' }]}>{(totalDebit - totalCredit).toLocaleString()}</Text>
        </View>
      </View>

      {/* رأس الجدول */}
      <View style={st.headerRow}>
        <Text style={[st.th, { flex: 2 }]}>اسم الحساب</Text>
        <Text style={[st.th, { flex: 1, color: '#EF4444' }]}>مدين</Text>
        <Text style={[st.th, { flex: 1, color: '#10B981' }]}>دائن</Text>
      </View>

      <FlatList data={displayList} keyExtractor={(i, idx) => i.id + idx}
        renderItem={({ item }) => {
          const nature = getNature(item.type);
          const ml = item.level * 20;
          const hasChildren = getSubAccounts(item.id).length > 0;
          
          return (
            <TouchableOpacity style={[st.row, { marginLeft: ml }]} onPress={() => hasChildren && toggleExpand(item.id)}>
              <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center' }}>
                {hasChildren && <Text style={st.arrow}>{item.isExpanded ? '▼' : '▶'}</Text>}
                <Text style={[st.name, { fontWeight: item.level === 0 ? 'bold' : 'normal' }]}>{item.name}</Text>
                <Text style={st.code}>{item.code}</Text>
              </View>
              <Text style={[st.val, { flex: 1, color: '#EF4444' }]}>{nature === 'debit' ? (item.balance || 0).toLocaleString() : '-'}</Text>
              <Text style={[st.val, { flex: 1, color: '#10B981' }]}>{nature === 'credit' ? (item.balance || 0).toLocaleString() : '-'}</Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={<Text style={st.et}>لا توجد حسابات</Text>}
        contentContainerStyle={{ padding: 12 }}
      />
    </View>
  );
}
const st = StyleSheet.create({
  c: { flex: 1, backgroundColor: '#0A1128' },
  si: { marginHorizontal: 12, marginBottom: 8, padding: 12, backgroundColor: '#16213E', borderRadius: 10, color: '#FFF', borderWidth: 1, borderColor: '#2a3550', textAlign: 'right' },
  et: { color: '#FFF', textAlign: 'center', marginTop: 40 },
  summary: { flexDirection: 'row', marginHorizontal: 12, gap: 6, marginBottom: 10 },
  sumBox: { flex: 1, backgroundColor: '#16213E', borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1 },
  sumLabel: { color: '#94a3b8', fontSize: 10 },
  sumVal: { fontSize: 16, fontWeight: 'bold', marginTop: 4 },
  headerRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#16213E', marginHorizontal: 12, borderRadius: 8, marginBottom: 4 },
  th: { color: '#D4AF37', fontSize: 11, fontWeight: 'bold', textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#2a3550' },
  arrow: { color: '#D4AF37', fontSize: 10, marginRight: 4 },
  name: { color: '#FFF', fontSize: 13, flex: 1, textAlign: 'right' },
  code: { color: '#94a3b8', fontSize: 9, marginLeft: 4 },
  val: { fontSize: 13, textAlign: 'center', fontWeight: 'bold' },
});
