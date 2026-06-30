import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const reportItems = [
  { icon: '📊', title: 'ميزان المراجعة', route: '/ledger/trial-balance', desc: 'أرصدة الحسابات مدينة ودائنة' },
  { icon: '📖', title: 'دفتر الأستاذ العام', route: '/ledger/general-ledger', desc: 'حركات الحسابات التفصيلية' },
  { icon: '📄', title: 'كشف حساب', route: '/ledger/account-statement', desc: 'كشف حساب مفصل' },
  { icon: '💱', title: 'تقرير العملات', route: '/ledger/currency-reports', desc: 'العملات وأسعار الصرف' },
  { icon: '🧾', title: 'تقرير الفواتير', route: '/sales/summary', desc: 'ملخص فواتير المبيعات' },
  { icon: '📦', title: 'حركة المخزون', route: '/inventory/item-movement', desc: 'حركة الأصناف' },
  { icon: '👤', title: 'تقرير العملاء', route: '/sales/customer-sales', desc: 'مبيعات العملاء' },
  { icon: '🏭', title: 'تقرير الموردين', route: '/inventory/supplier-movement', desc: 'حركة الموردين' },
  { icon: '📈', title: 'الأصناف الأكثر مبيعاً', route: '/sales/item-sales', desc: 'تقرير مبيعات الأصناف' },
  { icon: '⚠️', title: 'الأصناف بطيئة الحركة', route: '/inventory/slow-moving', desc: 'الأصناف الراكدة' },
];

export default function ReportsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[st.container, { paddingTop: insets.top }]}>
      <View style={st.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={st.backBtn}>← رجوع</Text>
        </TouchableOpacity>
        <Text style={st.title}>📊 التقارير</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={st.body} contentContainerStyle={{ padding: 12 }}>
        <Text style={st.sectionTitle}>تقارير محاسبية</Text>
        {reportItems.slice(0, 4).map((item, i) => (
          <TouchableOpacity key={i} style={st.card} onPress={() => router.push(item.route as any)}>
            <Text style={st.cardIcon}>{item.icon}</Text>
            <View style={st.cardContent}>
              <Text style={st.cardTitle}>{item.title}</Text>
              <Text style={st.cardDesc}>{item.desc}</Text>
            </View>
            <Text style={st.arrow}>←</Text>
          </TouchableOpacity>
        ))}

        <Text style={[st.sectionTitle, { marginTop: 20 }]}>تقارير المبيعات والمخزون</Text>
        {reportItems.slice(4).map((item, i) => (
          <TouchableOpacity key={i} style={st.card} onPress={() => router.push(item.route as any)}>
            <Text style={st.cardIcon}>{item.icon}</Text>
            <View style={st.cardContent}>
              <Text style={st.cardTitle}>{item.title}</Text>
              <Text style={st.cardDesc}>{item.desc}</Text>
            </View>
            <Text style={st.arrow}>←</Text>
          </TouchableOpacity>
        ))}

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1128' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#2a3550' },
  backBtn: { color: '#D4AF37', fontSize: 16, fontWeight: 'bold' },
  title: { color: '#D4AF37', fontSize: 22, fontWeight: 'bold' },
  body: { flex: 1 },
  sectionTitle: { color: '#94a3b8', fontSize: 14, marginBottom: 10, marginTop: 5, textAlign: 'right' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16213E', padding: 14, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#2a3550' },
  cardIcon: { fontSize: 30, marginRight: 12 },
  cardContent: { flex: 1, alignItems: 'flex-end' },
  cardTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  cardDesc: { color: '#94a3b8', fontSize: 11, marginTop: 3 },
  arrow: { color: '#D4AF37', fontSize: 18, marginLeft: 8 },
});
