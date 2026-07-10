import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
export default function SettingsScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const sections = [
    { title:'💰 المالية', items:[{ icon:'📅', label:'إقفال السنة', action:()=>Alert.alert('✅','تم الإقفال') }] },
    { title:'💾 البيانات', items:[{ icon:'💾', label:'نسخ احتياطي', action:()=>Alert.alert('💾','جاري النسخ') }] },
    { title:'📊 التقارير', items:[{ icon:'📋', label:'الميزانية العمومية', action:()=>router.push('/reports/balance-sheet') }] },
    { title:'ℹ️ النظام', items:[{ icon:'ℹ️', label:'حول التطبيق', action:()=>Alert.alert('المحاسب الذكي','v1.0') }] }
  ];
  return (<View style={[st.c,{paddingTop:insets.top}]}><View style={st.h}><TouchableOpacity onPress={()=>router.back()}><Text style={st.bb}>←</Text></TouchableOpacity><Text style={st.t}>⚙️ الإعدادات</Text></View><ScrollView>{sections.map((sec,i)=>(<View key={i}><Text style={st.st}>{sec.title}</Text>{sec.items.map((item,j)=>(<TouchableOpacity key={j} style={st.card} onPress={item.action}><Text style={st.icon}>{item.icon}</Text><Text style={st.label}>{item.label}</Text></TouchableOpacity>))}</View>))}</ScrollView></View>);
}
const st=StyleSheet.create({c:{flex:1,backgroundColor:'#0A1128'},h:{flexDirection:'row',padding:16},bb:{fontSize:24,color:'#D4AF37'},t:{color:'#D4AF37',fontSize:20,fontWeight:'bold',flex:1,textAlign:'center'},st:{color:'#D4AF37',fontSize:16,fontWeight:'bold',marginTop:20,marginHorizontal:16},card:{flexDirection:'row',alignItems:'center',backgroundColor:'#16213E',padding:14,borderRadius:12,marginHorizontal:16,marginBottom:8},icon:{fontSize:24,marginRight:12},label:{color:'#FFF',fontSize:15}});
