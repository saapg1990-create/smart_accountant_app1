import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalTable } from '../../hooks/useLocalStore';

export default function QtyReportScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const { data: items } = useLocalTable('items');
  const { data: warehouses } = useLocalTable('warehouses');
  const { data: suppliers } = useLocalTable('suppliers');
  const [mode, setMode] = useState<'warehouse'|'supplier'|'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = items.filter((i: any) => i.name?.includes(searchQuery) || i.code?.includes(searchQuery));

  // تجميع حسب المخزن
  const byWarehouse: Record<string, any[]> = {};
  filtered.forEach((item: any) => {
    const w = item.warehouseName || 'بدون مخزن';
    if (!byWarehouse[w]) byWarehouse[w] = [];
    byWarehouse[w].push(item);
  });

  // تجميع حسب المورد (من المشتريات)
  const bySupplier: Record<string, any[]> = {};
  filtered.forEach((item: any) => {
    const s = item.supplierName || 'غير معروف';
    if (!bySupplier[s]) bySupplier[s] = [];
    bySupplier[s].push(item);
  });

  const getTotalQty = (items: any[]) => items.reduce((s: number, i: any) => s + (i.quantity || 0), 0);
  const getTotalValue = (items: any[]) => items.reduce((s: number, i: any) => s + ((i.quantity || 0) * (i.price || 0)), 0);

  return (
    <View style={[st.c, { paddingTop: insets.top }]}>
      <View style={st.h}><TouchableOpacity onPress={() => router.back()}><Text style={st.bb}>←</Text></TouchableOpacity><Text style={st.t}>📦 تقرير الأصناف</Text><View style={{ width: 36 }} /></View>
      
      <View style={st.tabs}>
        {['all','warehouse','supplier'].map(t => (
          <TouchableOpacity key={t} style={[st.tab, mode===t&&st.tabA]} onPress={()=>setMode(t as any)}>
            <Text style={[st.tabT, mode===t&&st.tabTA]}>{t==='all'?'📋 إجمالي':t==='warehouse'?'🏭 حسب المخزن':'🚚 حسب المورد'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput style={st.si} placeholder="🔍 بحث..." placeholderTextColor="#666" value={searchQuery} onChangeText={setSearchQuery} />

      {mode === 'all' && (
        <FlatList data={filtered} keyExtractor={(i:any) => i.id} renderItem={({item}: any) => (
          <View style={st.card}>
            <Text style={st.name}>{item.name} ({item.code})</Text>
            <View style={st.row}><Text style={st.qty}>الكمية: {item.quantity || 0} {item.unitName}</Text><Text style={st.val}>القيمة: {((item.quantity||0)*(item.price||0)).toLocaleString()} ﷼</Text></View>
            {item.warehouseName && <Text style={st.sub}>🏭 {item.warehouseName}</Text>}
          </View>
        )} contentContainerStyle={{padding:12}} ListEmptyComponent={<Text style={st.et}>لا توجد أصناف</Text>} />
      )}

      {mode === 'warehouse' && (
        <FlatList data={Object.entries(byWarehouse)} keyExtractor={([w]) => w} renderItem={({item: [w, items]}) => (
          <View style={st.card}>
            <Text style={st.name}>🏭 {w} ({items.length} صنف)</Text>
            <View style={st.row}><Text style={st.qty}>إجمالي الكمية: {getTotalQty(items)}</Text><Text style={st.val}>القيمة: {getTotalValue(items).toLocaleString()} ﷼</Text></View>
          </View>
        )} contentContainerStyle={{padding:12}} />
      )}

      {mode === 'supplier' && (
        <FlatList data={Object.entries(bySupplier)} keyExtractor={([s]) => s} renderItem={({item: [s, items]}) => (
          <View style={st.card}>
            <Text style={st.name}>🚚 {s} ({items.length} صنف)</Text>
            <View style={st.row}><Text style={st.qty}>إجمالي الكمية: {getTotalQty(items)}</Text><Text style={st.val}>القيمة: {getTotalValue(items).toLocaleString()} ﷼</Text></View>
          </View>
        )} contentContainerStyle={{padding:12}} />
      )}
    </View>
  );
}
const st = StyleSheet.create({
  c:{flex:1,backgroundColor:'#0A1128'},h:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:16},bb:{fontSize:24,color:'#D4AF37'},t:{color:'#D4AF37',fontSize:20,fontWeight:'bold'},
  tabs:{flexDirection:'row',gap:6,marginHorizontal:12,marginBottom:8},tab:{flex:1,padding:10,borderRadius:10,backgroundColor:'#16213E',alignItems:'center',borderWidth:1,borderColor:'#2a3550'},tabA:{borderColor:'#D4AF37',backgroundColor:'#D4AF3710'},tabT:{color:'#94a3b8',fontSize:11},tabTA:{color:'#D4AF37',fontWeight:'bold'},
  si:{marginHorizontal:12,marginBottom:8,padding:12,backgroundColor:'#16213E',borderRadius:10,color:'#FFF',borderWidth:1,borderColor:'#2a3550',textAlign:'right'},
  et:{color:'#666',textAlign:'center',marginTop:40,fontSize:16},
  card:{backgroundColor:'#16213E',borderRadius:12,padding:14,marginBottom:8,marginHorizontal:12,borderWidth:1,borderColor:'#2a3550'},
  name:{color:'#FFF',fontSize:14,fontWeight:'bold',textAlign:'right',marginBottom:6},
  row:{flexDirection:'row',justifyContent:'space-between'},qty:{color:'#94a3b8',fontSize:12},val:{color:'#10B981',fontSize:12,fontWeight:'bold'},
  sub:{color:'#3B82F6',fontSize:10,marginTop:4},
});
