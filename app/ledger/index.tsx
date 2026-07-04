import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LedgerIndex() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  
  const items = [
    { icon: "📚", label: "دليل الحسابات", route: "/ledger/accounts", desc: "شجرة الحسابات 3 مستويات" },
    { icon: "📁", label: "مجموعات الحسابات", route: "/ledger/account-groups", desc: "تصنيف الحسابات" },
    { icon: "📝", label: "القيود اليومية", route: "/ledger/journal-entry", desc: "قيد مزدوج تلقائي" },
    { icon: "🧾", label: "سندات القبض والصرف", route: "/ledger/vouchers", desc: "نقدي - بنكي - محفظة" },
    { icon: "💰", label: "الصناديق", route: "/ledger/cash-boxes", desc: "إدارة النقدية" },
    { icon: "🏦", label: "البنوك", route: "/ledger/banks", desc: "الحسابات البنكية" },
    { icon: "📱", label: "المحافظ الإلكترونية", route: "/ledger/ewallets", desc: "محافظ رقمية" },
    { icon: "💱", label: "العملات", route: "/ledger/currencies", desc: "أسعار الصرف" },
    { icon: "⚖️", label: "ميزان المراجعة", route: "/ledger/trial-balance", desc: "الأرصدة المدينة والدائنة" },
    { icon: "📖", label: "دفتر الأستاذ العام", route: "/ledger/general-ledger", desc: "سجل القيود" },
    { icon: "📄", label: "كشف حساب", route: "/ledger/account-statement", desc: "حركة حساب محدد" },
  ];

  return (
    <View style={st.c}><StatusBar barStyle="light-content"/>
      <View style={[st.ct, { paddingTop: insets.top }]}>
        <View style={st.h}>
          <TouchableOpacity onPress={() => router.back()} style={st.backBtn}>
            <Text style={st.backText}>←</Text>
          </TouchableOpacity>
          <Text style={st.title}>📚 دفتر الأستاذ العام</Text>
          <View style={{ width: 40 }} />
        </View>
        
        <ScrollView contentContainerStyle={st.grid}>
          {items.map((item, i) => (
            <TouchableOpacity key={i} style={st.card} onPress={() => router.push(item.route as any)}>
              <Text style={st.icon}>{item.icon}</Text>
              <Text style={st.label}>{item.label}</Text>
              <Text style={st.desc}>{item.desc}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  c: { flex: 1, backgroundColor: '#0A1128' },
  ct: { flex: 1 },
  h: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#16213E', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#2a3550' },
  backText: { fontSize: 20, color: '#D4AF37' },
  title: { flex: 1, fontSize: 18, fontWeight: 'bold', color: '#FFF', textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 10 },
  card: {
    width: '30%', backgroundColor: '#16213E', borderRadius: 16, padding: 20,
    alignItems: 'center', borderWidth: 1, borderColor: '#2a3550',
  },
  icon: { fontSize: 36, marginBottom: 10 },
  label: { color: '#FFF', fontSize: 11, fontWeight: '600', textAlign: 'center' },
  desc: { color: '#94a3b8', fontSize: 8, textAlign: 'center', marginTop: 4 },
});
