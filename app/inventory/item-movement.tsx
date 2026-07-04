import { DataService } from '../src/services/dataService';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, FlatList, TextInput, Alert } from 'react-native';
import { ControlButtons, ControlHeader } from '../../src/components/ui/ControlButtons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import { useLocalTable } from '../../hooks/useLocalStore';

export default function ItemMovementScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const { data: items } = useLocalTable('items');
  const { data: invoices } = useLocalTable('salesInvoices');
  const { data: purchases } = useLocalTable('purchaseInvoices');
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);

  const handleSearch = () => {
    let all: any[] = [];
    invoices.forEach((inv: any) => {
      inv.items?.forEach((line: any) => {
        if (!searchQuery || line.itemName?.includes(searchQuery)) {
          all.push({ date: inv.date, type: 'بيع', item: line.itemName, qty: line.qty, ref: inv.number, party: inv.customerName });
        }
      });
    });
    purchases.forEach((inv: any) => {
      inv.items?.forEach((line: any) => {
        if (!searchQuery || line.itemName?.includes(searchQuery)) {
          all.push({ date: inv.date, type: 'شراء', item: line.itemName, qty: line.qty, ref: inv.number, party: inv.supplierName });
        }
      });
    });
    setResults(all.slice(0, 50));
  };

  return (
    <View style={[st.c, { paddingTop: insets.top }]}><StatusBar barStyle="light-content" />
      <View style={st.h}><TouchableOpacity onPress={() => router.back()} style={st.b}><Text style={st.bt}>←</Text></TouchableOpacity><Text style={st.t}>📊 حركة الأصناف</Text><View style={{ width: 40 }} /></View>
      <View style={st.fc}>
        <TextInput style={st.si} value={searchQuery} onChangeText={setSearchQuery} placeholder="🔍 بحث عن صنف..." placeholderTextColor="#666" />
        <TouchableOpacity style={st.sb} onPress={handleSearch}><Text style={st.sbt}>🔍 بحث</Text></TouchableOpacity>
      </View>
      {results.length === 0 ? <View style={st.e}><Text style={st.ei}>📊</Text><Text style={st.et}>ابحث عن صنف لعرض حركته</Text></View> :
        <FlatList data={results} keyExtractor={(_, i) => i.toString()} renderItem={({ item }) => (
          <TouchableOpacity style={st.rc} onPress={() => Alert.alert(item.type, `${item.item}\nالكمية: ${item.qty}\n${item.ref}\n${item.party}`)}>
            <View style={st.rh}><Text style={[st.rt, { color: item.type === 'بيع' ? '#10B981' : '#EF4444' }]}>{item.type}</Text><Text style={st.rd}>{item.date}</Text></View>
            <Text style={st.rn}>📦 {item.item} ({item.qty})</Text>
            <Text style={st.rp}>{item.ref} - {item.party}</Text>
          </TouchableOpacity>
        )} contentContainerStyle={{ padding: 16 }} />
      }
    </View>
  );
}
const st = StyleSheet.create({
  c: { flex: 1, backgroundColor: '#0A1128' }, h: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }, b: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#16213E', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#2a3550' }, bt: { fontSize: 20, color: '#D4AF37' }, t: { flex: 1, fontSize: 18, fontWeight: 'bold', color: '#FFF', textAlign: 'center' },
  fc: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 12, gap: 8 }, si: { flex: 1, backgroundColor: '#16213E', borderRadius: 10, padding: 12, color: '#FFF', borderWidth: 1, borderColor: '#2a3550', textAlign: 'right', fontSize: 14 }, sb: { backgroundColor: '#D4AF37', borderRadius: 10, padding: 12, justifyContent: 'center' }, sbt: { color: '#0A1128', fontSize: 14, fontWeight: 'bold' },
  e: { flex: 1, justifyContent: 'center', alignItems: 'center' }, ei: { fontSize: 48, marginBottom: 12 }, et: { color: '#94a3b8', fontSize: 16 },
  rc: { backgroundColor: '#16213E', borderRadius: 12, padding: 14, marginBottom: 8, marginHorizontal: 16, borderWidth: 1, borderColor: '#2a3550' }, rh: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }, rt: { fontSize: 14, fontWeight: 'bold' }, rd: { color: '#94a3b8', fontSize: 11 }, rn: { color: '#FFF', fontSize: 13, marginBottom: 4 }, rp: { color: '#94a3b8', fontSize: 11 },
});
