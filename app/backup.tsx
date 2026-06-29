import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function BackupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>النسخ الاحتياطي</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>💾</Text>
        </View>
        <Text style={styles.infoTitle}>حافظ على بياناتك آمنة</Text>
        <Text style={styles.infoText}>قم بإنشاء نسخة احتياطية لجميع بياناتك المالية واستعدها عند الحاجة</Text>

        <TouchableOpacity style={styles.backupBtn} onPress={() => Alert.alert('نجاح', 'تم إنشاء النسخة الاحتياطية بنجاح ✅')}>
          <Text style={styles.backupBtnText}>📦 إنشاء نسخة احتياطية</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.restoreBtn} onPress={() => Alert.alert('استعادة', 'سيتم استعادة البيانات من آخر نسخة')}>
          <Text style={styles.restoreBtnText}>📥 استعادة نسخة</Text>
        </TouchableOpacity>
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
  iconContainer: { marginBottom: 24 },
  icon: { fontSize: 80 },
  infoTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 12 },
  infoText: { color: '#94a3b8', fontSize: 14, textAlign: 'center', marginBottom: 32, lineHeight: 22 },
  backupBtn: { backgroundColor: '#10B981', borderRadius: 16, padding: 18, width: '100%', alignItems: 'center', marginBottom: 12 },
  backupBtnText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  restoreBtn: { backgroundColor: '#3B82F6', borderRadius: 16, padding: 18, width: '100%', alignItems: 'center' },
  restoreBtnText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
});
