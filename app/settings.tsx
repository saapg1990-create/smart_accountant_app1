import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettingsStore } from '../src/store/useSettingsStore';
import { SettingSwitch, SettingField, SettingSection, SettingButton } from '../src/components/ui/SettingComponents';

export default function SettingsScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const { settings, updateSetting } = useSettingsStore();
  const [currentScreen, setCurrentScreen] = useState('main');
  const screenTitle: any = { main: '⚙️ الإعدادات', security: '🔒 الأمان', printing: '🖨️ طباعة', backup: '💾 النسخ', advanced: 'متقدم' }[currentScreen] || 'الإعدادات';

  return (
    <View style={[st.c, { paddingTop: insets.top }]}><StatusBar barStyle="light-content" />
      <View style={st.h}><TouchableOpacity onPress={() => currentScreen === 'main' ? router.back() : setCurrentScreen('main')}><Text style={st.bt}>←</Text></TouchableOpacity><Text style={st.tl}>{screenTitle}</Text><View style={{ width: 36 }} /></View>
      <ScrollView style={st.ct}>
        {currentScreen === 'main' && <View>
          <SettingButton icon="💾" label="حفظ نسخة احتياطية" onPress={() => Alert.alert('✅', 'تم الحفظ')} />
          <SettingButton icon="🔄" label="إسترجاع قاعدة البيانات" onPress={() => Alert.alert('🔄', 'جاري الاستعادة')} />
          <SettingButton icon="☁️" label="جوجل درايف" onPress={() => Alert.alert('☁️', 'جاري المزامنة')} />
          <SettingButton icon="🔒" label="خيارات الأمان" onPress={() => setCurrentScreen('security')} />
          <SettingButton icon="🖨️" label="خيارات الطباعة" onPress={() => setCurrentScreen('printing')} />
          <SettingButton icon="💾" label="خيارات الحفظ" onPress={() => setCurrentScreen('backup')} />
          <SettingButton icon="⚙️" label="خيارات متقدمة" onPress={() => setCurrentScreen('advanced')} />
          <SettingButton icon="📞" label="تواصل والدعم" onPress={() => Linking.openURL('https://wa.me/967736002798')} />
          <SettingButton icon="ℹ️" label="حول البرنامج" onPress={() => router.push('/about')} />
          <SettingButton icon="👑" label="لوحة تحكم المالك" onPress={() => router.push('/owner')} />
          <SettingButton icon="🚪" label="خروج" onPress={() => router.push('/login')} color="#EF4444" />
        </View>}
        {currentScreen === 'security' && <SettingSection title="🔒 إعدادات الأمان">
          <SettingSwitch icon="🔑" label="تفعيل كلمة السر" value={settings.enablePassword} onValueChange={(v) => updateSetting('enablePassword', v)} />
          {settings.enablePassword && <SettingField icon="🔐" label="كلمة السر" value={settings.password} onChangeText={(v) => updateSetting('password', v)} secureTextEntry />}
        </SettingSection>}
        {currentScreen === 'printing' && <SettingSection title="🖨️ خيارات الطباعة">
          <SettingSwitch icon="📄" label="إظهار الترويسة" value={settings.printHeader} onValueChange={(v) => updateSetting('printHeader', v)} />
          <View style={st.dv} /><SettingSwitch icon="📅" label="إظهار التاريخ" value={settings.printDate} onValueChange={(v) => updateSetting('printDate', v)} />
          <View style={st.dv} /><SettingSwitch icon="💰" label="إظهار الرصيد" value={settings.printBalance} onValueChange={(v) => updateSetting('printBalance', v)} />
          <View style={st.dv} /><SettingSwitch icon="📝" label="تنسيق مختصر" value={settings.shortFormat} onValueChange={(v) => updateSetting('shortFormat', v)} />
          <View style={st.dv} /><SettingField icon="💬" label="ملاحظة التذييل" value={settings.footerNote} onChangeText={(v) => updateSetting('footerNote', v)} />
        </SettingSection>}
        {currentScreen === 'backup' && <SettingSection title="💾 خيارات النسخ الاحتياطي">
          <SettingSwitch icon="📆" label="نسخ احتياطي تلقائي" value={settings.autoBackup} onValueChange={(v) => updateSetting('autoBackup', v)} />
          <View style={st.dv} /><SettingField icon="📁" label="مجلد الحفظ" value={settings.backupFolder} onChangeText={(v) => updateSetting('backupFolder', v)} />
          <View style={st.dv} /><SettingSwitch icon="☁️" label="تفعيل Google Drive" value={settings.googleDriveEnabled} onValueChange={(v) => updateSetting('googleDriveEnabled', v)} />
          <View style={st.dv} /><SettingField icon="🕐" label="وقت النسخ" value={settings.backupTime} onChangeText={(v) => updateSetting('backupTime', v)} />
        </SettingSection>}
        {currentScreen === 'advanced' && <SettingSection title="⚙️ إعدادات متقدمة">
          <SettingSwitch icon="🗣️" label="الوضع الصوتي" value={settings.voiceMode} onValueChange={(v) => updateSetting('voiceMode', v)} />
          <View style={st.dv} /><SettingSwitch icon="📌" label="أيقونة الموجه" value={settings.showVoiceIcon} onValueChange={(v) => updateSetting('showVoiceIcon', v)} />
          <View style={st.dv} /><SettingSwitch icon="💲" label="إظهار العملات" value={settings.showCurrency} onValueChange={(v) => updateSetting('showCurrency', v)} />
          <View style={st.dv} /><SettingSwitch icon="🚫" label="منع البيع بالسالب" value={!settings.allowNegativeStock} onValueChange={(v) => updateSetting('allowNegativeStock', !v)} />
          <View style={st.dv} /><SettingSwitch icon="🔢" label="إظهار رقم العملية" value={settings.showTransactionNumber} onValueChange={(v) => updateSetting('showTransactionNumber', v)} />
          <View style={st.dv} /><SettingSwitch icon="📉" label="إجمالي أسفل الحساب" value={settings.showTotalBelowAccount} onValueChange={(v) => updateSetting('showTotalBelowAccount', v)} />
          <View style={st.dv} /><SettingSwitch icon="🌙" label="الوضع الليلي" value={settings.darkMode} onValueChange={(v) => updateSetting('darkMode', v)} />
          <View style={st.dv} /><SettingSwitch icon="🔔" label="تنبيه الديون" value={settings.debtAlert} onValueChange={(v) => updateSetting('debtAlert', v)} />
          <View style={st.dv} /><SettingSwitch icon="💬" label="مشاركة واتساب" value={settings.whatsappShare} onValueChange={(v) => updateSetting('whatsappShare', v)} />
          <TouchableOpacity style={st.row} onPress={() => updateSetting('sortOrder', settings.sortOrder === 'code' ? 'name' : 'code')}><Text>📋</Text><Text style={st.rowLabel}>ترتيب الشاشة: {settings.sortOrder === 'code' ? 'بالكود' : 'بالاسم'}</Text></TouchableOpacity>
        </SettingSection>}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}
const st = StyleSheet.create({
  c: { flex: 1, backgroundColor: '#0A1128' }, h: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  bt: { fontSize: 24, color: '#D4AF37', fontWeight: 'bold' }, tl: { fontSize: 18, fontWeight: 'bold', color: '#FFF' }, ct: { flex: 1, padding: 16 },
  dv: { height: 1, backgroundColor: '#2a3550', marginHorizontal: 14 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 }, rowLabel: { color: '#FFF', fontSize: 14, flex: 1 },
});
