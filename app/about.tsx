import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AboutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>حول التطبيق</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>💎</Text>
        </View>
        <Text style={styles.appName}>دفتر المحاسب الذكي</Text>
        <Text style={styles.version}>الإصدار 1.0.0</Text>
        <Text style={styles.description}>
          نظام محاسبي متكامل مصمم خصيصاً للسوق اليمني،{'\n'}
          يجمع بين الأصالة والحداثة لتلبية احتياجات{'\n'}
          الشركات والمحلات التجارية.
        </Text>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>المطور</Text>
            <Text style={styles.infoValue}>م/ صدام بشير</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>البريد</Text>
            <Text style={styles.infoValue}>support@smartaccountant.com</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>الهاتف</Text>
            <Text style={styles.infoValue}>+967-XXX-XXX-XXX</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.whatsappBtn} onPress={() => Linking.openURL('https://wa.me/967XXXXXXXXX')}>
          <Text style={styles.whatsappBtnText}>💬 تواصل عبر واتساب</Text>
        </TouchableOpacity>

        <Text style={styles.copyright}>© 2024 جميع الحقوق محفوظة</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1128' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  backBtn: { fontSize: 28, color: '#D4AF37', fontWeight: 'bold' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  logoContainer: { marginBottom: 16 },
  logo: { fontSize: 80 },
  appName: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 },
  version: { color: '#D4AF37', fontSize: 14, marginBottom: 20 },
  description: { color: '#94a3b8', fontSize: 14, textAlign: 'center', lineHeight: 24, marginBottom: 32 },
  infoCard: { backgroundColor: '#16213E', borderRadius: 16, padding: 16, width: '100%', borderWidth: 1, borderColor: '#2a3550', marginBottom: 24 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  infoLabel: { color: '#94a3b8', fontSize: 14 },
  infoValue: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#2a3550' },
  whatsappBtn: { backgroundColor: '#25D366', borderRadius: 16, padding: 16, width: '100%', alignItems: 'center', marginBottom: 20 },
  whatsappBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  copyright: { color: '#6B7280', fontSize: 12 },
});
