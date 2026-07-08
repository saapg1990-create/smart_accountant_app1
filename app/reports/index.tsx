import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const reports = [
  { icon:'📊', title:'ميزان المراجعة', route:'/ledger/trial-balance' },
  { icon:'📖', title:'دفتر الأستاذ العام', route:'/ledger/general-ledger' },
  { icon:'📄', title:'كشف حساب', route:'/ledger/account-statement' },
  { icon:'💱', title:'تقرير العملات', route:'/ledger/currency-reports' },
  { icon:'📦', title:'حركة الأصناف', route:'/inventory/item-movement' },
  { icon:'👤', title:'مبيعات العملاء', route:'/sales/customer-sales' },
  { icon:'📈', title:'ملخص المبيعات', route:'/sales/summary' },
];

export default function ReportsScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();

  return (
    <View style={[st.c, { paddingTop: insets.top }]}>
      <View style={st.h}><TouchableOpacity onPress={()=>router.back()}><Text style={st.bb}>←</Text></TouchableOpacity><Text style={st.t}>📊 التقارير</Text><View style={{width:40}}/></View>
      <ScrollView contentContainerStyle={{padding:12}}>
        {reports.map((r,i)=>(
          <TouchableOpacity key={i} style={st.card} onPress={()=>router.push(r.route as any)}>
            <Text style={st.icon}>{r.icon}</Text><Text style={st.title}>{r.title}</Text><Text style={st.arrow}>←</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
const st = StyleSheet.create({
  c:{flex:1,backgroundColor:'#0A1128'},h:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:16},bb:{fontSize:24,color:'#D4AF37'},t:{fontSize:20,fontWeight:'bold',color:'#D4AF37'},
  card:{flexDirection:'row',alignItems:'center',backgroundColor:'#16213E',padding:14,borderRadius:12,marginBottom:8,borderWidth:1,borderColor:'#2a3550'},icon:{fontSize:28,marginRight:12},title:{color:'#FFF',fontSize:16,flex:1,textAlign:'right'},arrow:{color:'#D4AF37',fontSize:18},
});
