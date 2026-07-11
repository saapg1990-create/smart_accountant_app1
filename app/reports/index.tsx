import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const reports = [
  { section: '📊 التقارير المحاسبية', items: [
    { icon: '📊', title: 'ميزان المراجعة', route: '/ledger/trial-balance', desc: 'أرصدة الحسابات مدينة ودائنة حسب القانون اليمني' },
    { icon: '📖', title: 'دفتر الأستاذ العام', route: '/ledger/general-ledger', desc: 'حركات القيود اليومية' },
    { icon: '📄', title: 'كشف حساب', route: '/ledger/account-statement', desc: 'حركات حساب محدد' },
  ]},
  { section: '💰 التقارير المالية', items: [
    { icon: '📋', title: 'الميزانية العمومية', route: '/reports/balance-sheet', desc: 'الأصول والخصوم وحقوق الملكية' },
    { icon: '💱', title: 'تقرير العملات', route: '/ledger/currency-reports', desc: 'العملات وأسعار الصرف' },
    { icon: '🔔', title: 'التنبيهات', route: '/reports/alerts', desc: 'تنبيهات الزكاة والديون' },
  ]},
  { section: '📦 تقارير المخزون والمبيعات', items: [
    { icon: '📦', title: 'حركة الأصناف', route: '/inventory/item-movement', desc: 'حركة المخزون' },
    { icon: '👤', title: 'مبيعات العملاء', route: '/sales/customer-sales', desc: 'تقرير العملاء' },
    { icon: '📈', title: 'ملخص المبيعات', route: '/sales/summary', desc: 'إجمالي المبيعات' },
  ]},
];

export default function ReportsScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  return (
    <View style={[st.c, { paddingTop: insets.top }]}>
      <View style={st.h}><TouchableOpacity onPress={() => router.back()}><Text style={st.bb}>←</Text></TouchableOpacity><Text style={st.t}>📊 التقارير</Text><View style={{ width: 40 }} /></View>
      <ScrollView contentContainerStyle={{ padding: 12 }}>
        {reports.map((sec, i) => (
          <View key={i}>
            <Text style={st.section}>{sec.section}</Text>
            {sec.items.map((item, j) => (
              <TouchableOpacity key={j} style={st.card} onPress={() => router.push(item.route as any)}>
                <Text style={st.icon}>{item.icon}</Text>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={st.title}>{item.title}</Text>
                  <Text style={st.desc}>{item.desc}</Text>
                </View>
                <Text style={st.arrow}>←</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
const st = StyleSheet.create({
  c: { flex: 1, backgroundColor: '#0A1128' },
  h: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#2a3550' },
  bb: { fontSize: 24, color: '#D4AF37' },
  t: { fontSize: 20, fontWeight: 'bold', color: '#D4AF37' },
  section: { color: '#D4AF37', fontSize: 14, fontWeight: 'bold', marginTop: 16, marginBottom: 8, textAlign: 'right' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16213E', padding: 14, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#2a3550' },
  icon: { fontSize: 28 },
  title: { color: '#FFF', fontSize: 15, fontWeight: 'bold', textAlign: 'right' },
  desc: { color: '#94a3b8', fontSize: 11, textAlign: 'right', marginTop: 2 },
  arrow: { color: '#D4AF37', fontSize: 18 },
});
