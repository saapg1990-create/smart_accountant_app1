import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ReportsScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();

  const sections = [
    { title: '📊 تقارير محاسبية', items: [
      { icon: '📊', label: 'ميزان المراجعة', route: '/ledger/trial-balance' },
      { icon: '📖', label: 'دفتر الأستاذ', route: '/ledger/general-ledger' },
      { icon: '📄', label: 'كشف حساب', route: '/ledger/account-statement' },
    ]},
    { title: '📈 تقارير مالية', items: [
      { icon: '📈', label: 'قائمة الدخل', route: '/reports/income-statement' },
      { icon: '📋', label: 'الميزانية العمومية', route: '/reports/balance-sheet' },
    ]},
    { title: '📦 تقارير المخزون', items: [
      { icon: '📦', label: 'حركة الأصناف', route: '/inventory/item-movement' },
      { icon: '📋', label: 'تقرير الكميات', route: '/inventory/qty-report' },
    ]},
    { title: '💰 تقارير المبيعات', items: [
      { icon: '👤', label: 'مبيعات العملاء', route: '/sales/customer-sales' },
      { icon: '📈', label: 'ملخص المبيعات', route: '/sales/summary' },
    ]},
  ];

  return (
    <View style={[st.c, { paddingTop: insets.top }]}>
      <View style={st.h}><TouchableOpacity onPress={() => router.back()}><Text style={st.bb}>←</Text></TouchableOpacity><Text style={st.t}>📊 التقارير</Text></View>
      <ScrollView contentContainerStyle={{ padding: 12 }}>
        {sections.map((s, i) => (
          <View key={i}>
            <Text style={st.st}>{s.title}</Text>
            {s.items.map((item, j) => (
              <TouchableOpacity key={j} style={st.card} onPress={() => router.push(item.route as any)}>
                <Text style={st.ci}>{item.icon}</Text>
                <Text style={st.cl}>{item.label}</Text>
                <Text style={st.ar}>←</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
const st = StyleSheet.create({
  c:{flex:1,backgroundColor:'#0A1128'},h:{flexDirection:'row',alignItems:'center',padding:16},bb:{fontSize:24,color:'#D4AF37'},t:{color:'#D4AF37',fontSize:20,fontWeight:'bold',flex:1,textAlign:'center'},
  st:{color:'#D4AF37',fontSize:15,fontWeight:'bold',marginTop:16,marginBottom:8},
  card:{flexDirection:'row',alignItems:'center',backgroundColor:'#16213E',borderRadius:14,padding:14,marginBottom:8,borderWidth:1,borderColor:'#2a3550'},
  ci:{fontSize:28},cl:{color:'#FFF',fontSize:14,fontWeight:'bold',flex:1,marginLeft:12},ar:{color:'#D4AF37',fontSize:18},
});
