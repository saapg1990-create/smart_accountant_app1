import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, TextInput, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackupService } from '../src/services/BackupService';

export default function SettingsScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const [settings, setSettings] = useState({
    companyName: 'المحاسب الذكي',
    taxNumber: '',
    autoBackup: false,
    passwordEnabled: false,
    darkMode: true,
  });

  const handleBackup = async () => {
    await BackupService.shareBackup();
  };

  const handleRestore = () => {
    Alert.alert('استعادة', 'سيتم استعادة آخر نسخة احتياطية');
  };

  const menuItems = [
    { icon: '🏢', label: 'اسم المنشأة', value: settings.companyName },
    { icon: '🏷️', label: 'الرقم الضريبي', value: settings.taxNumber || 'غير محدد' },
    { icon: '💾', label: 'نسخ احتياطي', action: handleBackup, color: '#10B981' },
    { icon: '📥', label: 'استعادة نسخة', action: handleRestore, color: '#3B82F6' },
    { icon: '🔒', label: 'قفل التطبيق', action: () => Alert.alert('قريباً') },
    { icon: '📊', label: 'إقفال الفترة', action: () => Alert.alert('قريباً') },
    { icon: 'ℹ️', label: 'حول التطبيق', action: () => router.push('/about') },
  ];

  return (
    <View style={[st.c, { paddingTop: insets.top }]}>
      <View style={st.h}><TouchableOpacity onPress={() => router.back()}><Text style={st.bb}>←</Text></TouchableOpacity><Text style={st.t}>⚙️ الإعدادات</Text></View>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {menuItems.map((item, i) => (
          <TouchableOpacity key={i} style={st.card} onPress={item.action}>
            <Text style={st.ci}>{item.icon}</Text>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={st.cl}>{item.label}</Text>
              {item.value && <Text style={st.cv}>{item.value}</Text>}
            </View>
            {item.action && <Text style={[st.ar, { color: item.color || '#D4AF37' }]}>→</Text>}
          </TouchableOpacity>
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}
const st = StyleSheet.create({
  c:{flex:1,backgroundColor:'#0A1128'},h:{flexDirection:'row',alignItems:'center',padding:16},bb:{fontSize:24,color:'#D4AF37'},t:{color:'#D4AF37',fontSize:20,fontWeight:'bold',flex:1,textAlign:'center'},
  card:{flexDirection:'row',alignItems:'center',backgroundColor:'#16213E',borderRadius:14,padding:16,marginBottom:8,borderWidth:1,borderColor:'#2a3550'},
  ci:{fontSize:28},cl:{color:'#FFF',fontSize:14,fontWeight:'bold'},cv:{color:'#94a3b8',fontSize:11,marginTop:2},ar:{fontSize:20,fontWeight:'bold'},
});
