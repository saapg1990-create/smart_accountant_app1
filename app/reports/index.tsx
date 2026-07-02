import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const reportSections = [
  {
    title: '📊 تقارير محاسبية',
    items: [
      { icon: '📊', title: 'ميزان المراجعة', route: '/ledger/trial-balance', desc: 'أرصدة الحسابات' },
      { icon: '📖', title: 'دفتر الأستاذ', route: '/ledger/general-ledger', desc: 'حركات الحسابات' },
      { icon: '📄', title: 'كشف حساب', route: '/ledger/account-statement', desc: 'تفاصيل الحساب' },
      { icon: '💱', title: 'العملات', route: '/ledger/currency-reports', desc: 'أسعار الصرف' },
    ]
  },
  {
    title: '📦 تقارير المخزون',
    items: [
      { icon: '📦', title: 'حركة الأصناف', route: '/inventory/item-movement', desc: 'داخل/خارج' },
      { icon: '📋', title: 'تقرير الأصناف', route: '/inventory/qty-report', desc: 'حسب المخزن/المورد' },
      { icon: '💰', title: 'تقرير التكاليف', route: '/inventory/cost-report', desc: 'تكلفة البضاعة' },
      { icon: '⚠️', title: 'أصناف بطيئة', route: '/inventory/slow-moving', desc: 'الراكدة' },
      { icon: '⏰', title: 'منتهية الصلاحية', route: '/inventory/expired', desc: 'التواريخ' },
    ]
  },
  {
    title: '💰 تقارير المبيعات',
    items: [
      { icon: '👤', title: 'مبيعات العملاء', route: '/sales/customer-sales', desc: 'تحليلي/إجمالي' },
      { icon: '🏷️', title: 'مبيعات الأصناف', route: '/sales/item-sales', desc: 'الأكثر مبيعاً' },
      { icon: '📈', title: 'ملخص المبيعات', route: '/sales/summary', desc: 'يومي/شهري' },
      { icon: '🏆', title: 'أداء المندوبين', route: '/sales/rep-performance', desc: 'التارجت والتحفيز' },
      { icon: '🚚', title: 'حركة الموردين', route: '/inventory/supplier-movement', desc: 'مشتريات' },
    ]
  },
  {
    title: '🔔 تنبيهات وتحفيز',
    items: [
      { icon: '🔔', title: 'التنبيهات', route: '/reports/alerts', desc: 'المخزون والديون' },
      { icon: '🎯', title: 'تحفيز المندوبين', route: '/sales/rep-motivation', desc: 'رسائل ونسب الإنجاز' },
    ]
  }
];

export default function ReportsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[st.c, { paddingTop: insets.top }]}>
      <View style={st.h}>
        <TouchableOpacity onPress={() => router.back()}><Text style={st.bb}>←</Text></TouchableOpacity>
        <Text style={st.t}>📊 التقارير</Text>
        <View style={{ width: 36 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 12 }}>
        {reportSections.map((section, si) => (
          <View key={si}>
            <Text style={st.st}>{section.title}</Text>
            {section.items.map((item, ii) => (
              <TouchableOpacity key={ii} style={st.card} onPress={() => router.push(item.route as any)}>
                <Text style={st.ci}>{item.icon}</Text>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={st.cl}>{item.title}</Text>
                  <Text style={st.cd}>{item.desc}</Text>
                </View>
                <Text style={st.ar}>←</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  c:{flex:1,backgroundColor:'#0A1128'},h:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:16},bb:{fontSize:24,color:'#D4AF37'},t:{color:'#D4AF37',fontSize:20,fontWeight:'bold'},
  st:{color:'#D4AF37',fontSize:15,fontWeight:'bold',marginTop:16,marginBottom:8},
  card:{flexDirection:'row',alignItems:'center',backgroundColor:'#16213E',borderRadius:14,padding:14,marginBottom:8,borderWidth:1,borderColor:'#2a3550'},
  ci:{fontSize:28},cl:{color:'#FFF',fontSize:14,fontWeight:'bold'},cd:{color:'#94a3b8',fontSize:11,marginTop:2},ar:{color:'#D4AF37',fontSize:18},
});
