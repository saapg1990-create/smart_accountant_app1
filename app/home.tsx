import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const mainSections = [
    { icon: '📚', label: 'دفتر الأستاذ', desc: 'الحسابات والقيود اليومية', route: '/ledger', color: '#D4AF37' },
    { icon: '📦', label: 'المخزون والمشتريات', desc: 'الموردين والأصناف والمستودعات', route: '/inventory', color: '#3B82F6' },
    { icon: '💰', label: 'المبيعات والعملاء', desc: 'فواتير المبيعات والعملاء', route: '/sales', color: '#10B981' },
    { icon: '📊', label: 'التقارير', desc: 'التقارير المالية والإحصائية', route: '/reports', color: '#7C3AED' },
    { icon: '🎤', label: 'الأوامر الصوتية', desc: 'تحدث لإنجاز معاملاتك', route: '/voice', color: '#F59E0B' },
    { icon: '⚙️', label: 'الإعدادات', desc: 'تخصيص النظام', route: '/settings', color: '#6B7280' },
  ];

  const quickActions = [
    { icon: '📄', label: 'فاتورة مبيعات', route: '/sales/sales-invoice', color: '#10B981' },
    { icon: '📋', label: 'فاتورة مشتريات', route: '/inventory/purchase-invoice', color: '#3B82F6' },
    { icon: '📝', label: 'قيد يومية', route: '/ledger/journal-entry', color: '#7C3AED' },
    { icon: '👤', label: 'عميل جديد', route: '/sales/customers', color: '#D4AF37' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.welcome}>💎 دفتر المحاسب الذكي</Text>
          <Text style={styles.subtitle}>النظام المحاسبي المتكامل</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>📊 القائمة الرئيسية</Text>
        
        {mainSections.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.mainCard}
            onPress={() => router.push(item.route as any)}
          >
            <View style={[styles.iconCircle, { backgroundColor: item.color + '20' }]}>
              <Text style={styles.mainIcon}>{item.icon}</Text>
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardLabel}>{item.label}</Text>
              <Text style={styles.cardDesc}>{item.desc}</Text>
            </View>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>
        ))}

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>⚡ إجراءات سريعة</Text>
        <View style={styles.quickGrid}>
          {quickActions.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickCard}
              onPress={() => router.push(item.route as any)}
            >
              <View style={[styles.quickIcon, { backgroundColor: item.color + '20' }]}>
                <Text style={styles.quickEmoji}>{item.icon}</Text>
              </View>
              <Text style={styles.quickLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1128' },
  header: { paddingHorizontal: 20, paddingVertical: 16 },
  welcome: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' },
  subtitle: { fontSize: 14, color: '#D4AF37', marginTop: 4 },
  content: { flex: 1, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 16 },
  mainCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#16213E', borderRadius: 16, padding: 16,
    marginBottom: 10, borderWidth: 1, borderColor: '#2a3550',
  },
  iconCircle: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  mainIcon: { fontSize: 26 },
  cardInfo: { flex: 1 },
  cardLabel: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  cardDesc: { color: '#94a3b8', fontSize: 12 },
  arrow: { color: '#D4AF37', fontSize: 22, fontWeight: 'bold' },
  quickGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  quickCard: {
    width: '23%', backgroundColor: '#16213E', borderRadius: 16,
    padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#2a3550',
  },
  quickIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  quickEmoji: { fontSize: 20 },
  quickLabel: { color: '#FFFFFF', fontSize: 11, textAlign: 'center' },
});
