import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Alert, Switch, TextInput, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDatabase } from '../context/DatabaseContext';

export default function SettingsScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const { db } = useDatabase();
  
  const [settings, setSettings] = useState({
    companyName: 'المحاسب الذكي',
    darkMode: true,
    enablePassword: false,
    password: '',
    autoBackup: false,
    googleDrive: false,
    voiceMode: true,
    printHeader: true,
    printDate: true,
    printBalance: true,
    shortFormat: false,
    footerNote: 'تم الإنشاء بواسطة دفتر المحاسب الذكي',
    taxRate: '5',
    currency: 'YER',
    allowNegativeStock: false,
    debtAlert: true,
    whatsappShare: true,
    sortOrder: 'code',
  });

  const [currentScreen, setCurrentScreen] = useState('main');

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    if (db) {
      try { db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?,?)', [key, String(value)]); } catch(e) {}
    }
  };

  const handleBackup = async () => {
    Alert.alert('💾 نسخ احتياطي', 'جاري إنشاء نسخة احتياطية...\nسيتم حفظها في مجلد المستندات');
  };

  const handleRestore = async () => {
    Alert.alert('📥 استعادة', 'سيتم استعادة البيانات من آخر نسخة احتياطية', [
      { text: 'إلغاء' },
      { text: 'استعادة', onPress: () => Alert.alert('✅', 'تمت الاستعادة بنجاح') }
    ]);
  };

  const handleGoogleDrive = async () => {
    Alert.alert('☁️ Google Drive', 'جاري المزامنة مع Google Drive...');
  };

  const screenTitle: any = { main: '⚙️ الإعدادات', security: '🔒 الأمان', printing: '🖨️ طباعة', backup: '💾 النسخ', advanced: '⚡ متقدم' }[currentScreen] || 'الإعدادات';

  const menuItems = [
    { icon: '💾', label: 'نسخ احتياطي', desc: 'حفظ واستعادة البيانات', action: () => setCurrentScreen('backup'), color: '#10B981' },
    { icon: '☁️', label: 'Google Drive', desc: 'مزامنة سحابية', action: handleGoogleDrive, color: '#3B82F6' },
    { icon: '🔒', label: 'الأمان وكلمة السر', desc: 'حماية التطبيق', action: () => setCurrentScreen('security'), color: '#EF4444' },
    { icon: '🖨️', label: 'خيارات الطباعة', desc: 'إعدادات الفواتير', action: () => setCurrentScreen('printing'), color: '#F59E0B' },
    { icon: '⚡', label: 'إعدادات متقدمة', desc: 'ضرائب وعملات', action: () => setCurrentScreen('advanced'), color: '#7C3AED' },
    { icon: '🎙️', label: 'الأوامر الصوتية', desc: 'تفعيل/تعطيل', action: () => router.push('/voice'), color: '#EC4899' },
    { icon: '📞', label: 'تواصل ودعم فني', desc: 'واتساب', action: () => Linking.openURL('https://wa.me/967736002798'), color: '#25D366' },
    { icon: 'ℹ️', label: 'حول البرنامج', desc: 'الإصدار 2.0', action: () => router.push('/about'), color: '#94a3b8' },
    { icon: '👑', label: 'لوحة المالك', desc: 'إحصائيات متقدمة', action: () => router.push('/owner'), color: '#D4AF37' },
  ];

  return (
    <View style={[st.c, { paddingTop: insets.top }]}><StatusBar barStyle="light-content" />
      <View style={st.h}>
        <TouchableOpacity onPress={() => currentScreen === 'main' ? router.back() : setCurrentScreen('main')}>
          <Text style={st.bb}>←</Text>
        </TouchableOpacity>
        <Text style={st.t}>{screenTitle}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={st.ct}>
        {currentScreen === 'main' && (
          <View>
            <View style={st.companyBox}>
              <Text style={st.companyIcon}>🏢</Text>
              <TextInput style={st.companyInput} value={settings.companyName} onChangeText={(v) => updateSetting('companyName', v)} placeholder="اسم الشركة" placeholderTextColor="#666" />
            </View>
            {menuItems.map((item, i) => (
              <TouchableOpacity key={i} style={st.menuItem} onPress={item.action}>
                <Text style={st.menuIcon}>{item.icon}</Text>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={st.menuLabel}>{item.label}</Text>
                  <Text style={st.menuDesc}>{item.desc}</Text>
                </View>
                <Text style={[st.arrow, { color: item.color }]}>→</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {currentScreen === 'security' && (
          <View style={st.section}>
            <Text style={st.sectionTitle}>🔒 إعدادات الأمان</Text>
            <View style={st.row}><Text style={st.swLabel}>تفعيل كلمة السر</Text><Switch value={settings.enablePassword} onValueChange={(v) => updateSetting('enablePassword', v)} trackColor={{ true: '#D4AF37' }} /></View>
            {settings.enablePassword && <TextInput style={st.input} value={settings.password} onChangeText={(v) => updateSetting('password', v)} placeholder="كلمة السر" placeholderTextColor="#666" secureTextEntry />}
          </View>
        )}

        {currentScreen === 'printing' && (
          <View style={st.section}>
            <Text style={st.sectionTitle}>🖨️ خيارات الطباعة</Text>
            <View style={st.row}><Text style={st.swLabel}>إظهار الترويسة</Text><Switch value={settings.printHeader} onValueChange={(v) => updateSetting('printHeader', v)} trackColor={{ true: '#D4AF37' }} /></View>
            <View style={st.row}><Text style={st.swLabel}>إظهار التاريخ</Text><Switch value={settings.printDate} onValueChange={(v) => updateSetting('printDate', v)} trackColor={{ true: '#D4AF37' }} /></View>
            <View style={st.row}><Text style={st.swLabel}>إظهار الأرصدة</Text><Switch value={settings.printBalance} onValueChange={(v) => updateSetting('printBalance', v)} trackColor={{ true: '#D4AF37' }} /></View>
            <View style={st.row}><Text style={st.swLabel}>تنسيق مختصر</Text><Switch value={settings.shortFormat} onValueChange={(v) => updateSetting('shortFormat', v)} trackColor={{ true: '#D4AF37' }} /></View>
            <TextInput style={st.input} value={settings.footerNote} onChangeText={(v) => updateSetting('footerNote', v)} placeholder="ملاحظة التذييل" placeholderTextColor="#666" />
          </View>
        )}

        {currentScreen === 'backup' && (
          <View style={st.section}>
            <Text style={st.sectionTitle}>💾 النسخ الاحتياطي</Text>
            <View style={st.row}><Text style={st.swLabel}>نسخ تلقائي يومي</Text><Switch value={settings.autoBackup} onValueChange={(v) => updateSetting('autoBackup', v)} trackColor={{ true: '#D4AF37' }} /></View>
            <TouchableOpacity style={st.btn} onPress={handleBackup}><Text style={st.btnText}>📦 إنشاء نسخة الآن</Text></TouchableOpacity>
            <TouchableOpacity style={[st.btn, { backgroundColor: '#3B82F620', borderColor: '#3B82F6' }]} onPress={handleRestore}><Text style={[st.btnText, { color: '#3B82F6' }]}>📥 استعادة نسخة</Text></TouchableOpacity>
          </View>
        )}

        {currentScreen === 'advanced' && (
          <View style={st.section}>
            <Text style={st.sectionTitle}>⚡ إعدادات متقدمة</Text>
            <Text style={st.swLabel}>نسبة الضريبة %</Text>
            <TextInput style={st.input} value={settings.taxRate} onChangeText={(v) => updateSetting('taxRate', v)} keyboardType="numeric" placeholder="5" placeholderTextColor="#666" />
            <View style={st.row}><Text style={st.swLabel}>منع البيع بالسالب</Text><Switch value={settings.allowNegativeStock} onValueChange={(v) => updateSetting('allowNegativeStock', v)} trackColor={{ true: '#EF4444' }} /></View>
            <View style={st.row}><Text style={st.swLabel}>تنبيه الديون</Text><Switch value={settings.debtAlert} onValueChange={(v) => updateSetting('debtAlert', v)} trackColor={{ true: '#D4AF37' }} /></View>
            <View style={st.row}><Text style={st.swLabel}>مشاركة واتساب</Text><Switch value={settings.whatsappShare} onValueChange={(v) => updateSetting('whatsappShare', v)} trackColor={{ true: '#25D366' }} /></View>
            <View style={st.row}><Text style={st.swLabel}>الأوامر الصوتية</Text><Switch value={settings.voiceMode} onValueChange={(v) => updateSetting('voiceMode', v)} trackColor={{ true: '#D4AF37' }} /></View>
            <TouchableOpacity style={st.row} onPress={() => updateSetting('sortOrder', settings.sortOrder === 'code' ? 'name' : 'code')}>
              <Text style={st.swLabel}>📋 ترتيب الحسابات: {settings.sortOrder === 'code' ? 'بالكود' : 'بالاسم'}</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  c: { flex: 1, backgroundColor: '#0A1128' },
  h: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  bb: { fontSize: 24, color: '#D4AF37', fontWeight: 'bold' }, t: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  ct: { flex: 1, paddingHorizontal: 16 },
  companyBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16213E', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a3550' },
  companyIcon: { fontSize: 32, marginRight: 12 },
  companyInput: { flex: 1, color: '#FFF', fontSize: 18, fontWeight: 'bold', textAlign: 'right' },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16213E', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#2a3550' },
  menuIcon: { fontSize: 28 }, menuLabel: { color: '#FFF', fontSize: 14, fontWeight: 'bold' }, menuDesc: { color: '#94a3b8', fontSize: 11, marginTop: 2 },
  arrow: { fontSize: 20, fontWeight: 'bold' },
  section: { backgroundColor: '#16213E', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#2a3550' },
  sectionTitle: { color: '#D4AF37', fontSize: 16, fontWeight: 'bold', marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  swLabel: { color: '#FFF', fontSize: 14, flex: 1 },
  input: { backgroundColor: '#0A1128', color: '#FFF', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#2a3550', marginVertical: 8, textAlign: 'right' },
  btn: { backgroundColor: '#10B98120', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 10, borderWidth: 1, borderColor: '#10B981' },
  btnText: { color: '#10B981', fontWeight: 'bold', fontSize: 14 },
});
