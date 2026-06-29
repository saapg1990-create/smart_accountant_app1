import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ReportsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const reports = [
    { title: 'ميزان المراجعة', route: '/ledger/trial-balance', icon: '📊' },
    { title: 'دفتر الأستاذ العام', route: '/ledger/general-ledger', icon: '📖' },
    { title: 'كشف حساب', route: '/ledger/account-statement', icon: '📄' },
    { title: 'تقارير العملات', route: '/ledger/currency-reports', icon: '💱' },
    { title: 'تقرير الكميات', route: '/inventory/qty-report', icon: '📦' },
    { title: 'تقرير التكاليف', route: '/inventory/cost-report', icon: '💰' },
    { title: 'حركة الأصناف', route: '/inventory/item-movement', icon: '🔄' },
    { title: 'حركة الموردين', route: '/inventory/supplier-movement', icon: '🚚' },
    { title: 'الأصناف بطيئة الحركة', route: '/inventory/slow-moving', icon: '🐌' },
    { title: 'الأصناف منتهية الصلاحية', route: '/inventory/expired', icon: '⚠️' },
    { title: 'مبيعات العملاء', route: '/sales/customer-sales', icon: '👤' },
    { title: 'مبيعات الأصناف', route: '/sales/item-sales', icon: '🏷️' },
    { title: 'ملخص المبيعات', route: '/sales/summary', icon: '📈' },
    { title: 'أداء المندوبين', route: '/sales/rep-performance', icon: '🏆' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>← رجوع</Text>
        </TouchableOpacity>
        <Text style={styles.title}>التقارير</Text>
        <View style={{ width: 60 }} />
      </View>
      <ScrollView style={styles.list}>
        {reports.map((item, i) => (
          <TouchableOpacity
            key={i}
            style={styles.card}
            onPress={() => router.push(item.route as any)}
          >
            <Text style={styles.icon}>{item.icon}</Text>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.arrow}>←</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f1e' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1a2540' },
  backBtn: { color: '#D4AF37', fontSize: 16 },
  title: { color: '#D4AF37', fontSize: 22, fontWeight: 'bold' },
  list: { flex: 1, padding: 12 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16213E', padding: 16, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#2a3550' },
  icon: { fontSize: 28, marginRight: 12 },
  cardTitle: { color: '#fff', fontSize: 16, flex: 1, textAlign: 'right' },
  arrow: { color: '#D4AF37', fontSize: 20 },
});
