import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ControlHeader } from '../../src/components/ui/ControlButtons';

const groups = [
  { code: '1', name: 'الأصول', type: 'أصل', icon: '🏛️', color: '#D4AF37' },
  { code: '2', name: 'الخصوم', type: 'خصم', icon: '📋', color: '#EF4444' },
  { code: '3', name: 'حقوق الملكية', type: 'ملكية', icon: '👑', color: '#3B82F6' },
  { code: '4', name: 'الإيرادات', type: 'إيراد', icon: '💰', color: '#10B981' },
  { code: '5', name: 'المصروفات', type: 'مصروف', icon: '📉', color: '#F59E0B' },
];

export default function AccountGroupsScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  return (
    <View style={[st.c, { paddingTop: insets.top }]}><StatusBar barStyle="light-content" />
      <ControlHeader title="مجموعات الحسابات" onBack={() => router.back()} />
      <FlatList data={groups} keyExtractor={(i) => i.code} renderItem={({ item }) => (
        <TouchableOpacity style={[st.card, { borderLeftColor: item.color }]}>
          <Text style={st.icon}>{item.icon}</Text>
          <View style={{ flex: 1 }}><Text style={st.code}>{item.code} - {item.name}</Text><Text style={st.type}>{item.type}</Text></View>
        </TouchableOpacity>
      )} contentContainerStyle={{ padding: 16 }} />
    </View>
  );
}
const st = StyleSheet.create({ c: { flex: 1, backgroundColor: '#0A1128' }, card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16213E', borderRadius: 14, padding: 16, marginBottom: 8, borderLeftWidth: 4, borderWidth: 1, borderColor: '#2a3550' }, icon: { fontSize: 28, marginRight: 12 }, code: { color: '#FFF', fontSize: 14, fontWeight: 'bold' }, type: { color: '#94a3b8', fontSize: 12, marginTop: 2 } });
