import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalTable } from '../../hooks/useLocalStore';

export default function AlertsScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const { data: items } = useLocalTable('items');
  const { data: customers } = useLocalTable('customers');
  const { data: invoices } = useLocalTable('salesInvoices');
  const [alerts, setAlerts] = useState<any[]>([]);

  useFocusEffect(useCallback(() => {
    const list: any[] = [];
    
    // أصناف أقل من الحد الأدنى
    items.forEach((item: any) => {
      if ((item.quantity || 0) <= (item.minQuantity || 5) && (item.minQuantity || 0) > 0) {
        list.push({ type: '⚠️ مخزون منخفض', icon: '📦', msg: `${item.name} - الكمية: ${item.quantity || 0} (الحد: ${item.minQuantity})`, color: '#F59E0B' });
      }
    });

    // عملاء عليهم ديون
    customers.forEach((cust: any) => {
      if ((cust.balance || 0) > (cust.creditLimit || 10000)) {
        list.push({ type: '💳 ديون', icon: '👤', msg: `${cust.name} - الرصيد: ${cust.balance?.toLocaleString()}`, color: '#EF4444' });
      }
    });

    // فواتير غير مدفوعة
    invoices.forEach((inv: any) => {
      if ((inv.remaining || 0) > 0 && inv.type === 'credit') {
        list.push({ type: '📋 فاتورة معلقة', icon: '🧾', msg: `${inv.number} - ${inv.customerName} - المتبقي: ${inv.remaining?.toLocaleString()}`, color: '#3B82F6' });
      }
    });

    setAlerts(list);
  }, [items, customers, invoices]));

  return (
    <View style={[st.c, { paddingTop: insets.top }]}>
      <View style={st.h}><TouchableOpacity onPress={() => router.back()}><Text style={st.bb}>←</Text></TouchableOpacity><Text style={st.t}>🔔 التنبيهات</Text><View style={{ width: 36 }} /></View>
      
      <View style={st.stats}>
        <View style={[st.stat, { borderColor: '#F59E0B' }]}><Text style={st.sv}>{alerts.filter((a:any) => a.type.includes('مخزون')).length}</Text><Text style={st.sl}>مخزون منخفض</Text></View>
        <View style={[st.stat, { borderColor: '#EF4444' }]}><Text style={st.sv}>{alerts.filter((a:any) => a.type.includes('ديون')).length}</Text><Text style={st.sl}>ديون</Text></View>
        <View style={[st.stat, { borderColor: '#3B82F6' }]}><Text style={st.sv}>{alerts.filter((a:any) => a.type.includes('فاتورة')).length}</Text><Text style={st.sl}>فواتير معلقة</Text></View>
      </View>

      {alerts.length === 0 ? <Text style={st.et}>✅ لا توجد تنبيهات</Text> :
        <FlatList data={alerts} keyExtractor={(_, i) => i.toString()}
          renderItem={({ item }) => (
            <View style={[st.card, { borderLeftColor: item.color, borderLeftWidth: 4 }]}>
              <Text style={st.ci}>{item.icon}</Text>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[st.ct, { color: item.color }]}>{item.type}</Text>
                <Text style={st.cm}>{item.msg}</Text>
              </View>
            </View>
          )} contentContainerStyle={{ padding: 12 }} />
      }
    </View>
  );
}
const st = StyleSheet.create({
  c:{flex:1,backgroundColor:'#0A1128'},h:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:16},bb:{fontSize:24,color:'#D4AF37'},t:{color:'#D4AF37',fontSize:20,fontWeight:'bold'},
  stats:{flexDirection:'row',gap:6,marginHorizontal:12,marginBottom:12},stat:{flex:1,backgroundColor:'#16213E',borderRadius:10,padding:12,alignItems:'center',borderWidth:1},sv:{color:'#FFF',fontSize:20,fontWeight:'bold'},sl:{color:'#94a3b8',fontSize:10,marginTop:4},
  et:{color:'#10B981',textAlign:'center',marginTop:40,fontSize:16},
  card:{flexDirection:'row',alignItems:'center',backgroundColor:'#16213E',borderRadius:12,padding:14,marginBottom:8,marginHorizontal:12,borderWidth:1,borderColor:'#2a3550'},
  ci:{fontSize:24},ct:{fontSize:13,fontWeight:'bold'},cm:{color:'#FFF',fontSize:12,marginTop:4},
});
