import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAccountStore } from '../../src/store/useAccountStore';
export default function AlertsScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const { accounts, loadAccounts } = useAccountStore();
  const [alerts, setAlerts] = useState<any[]>([]);
  useFocusEffect(useCallback(() => { loadAccounts().then(() => {
    const list: any[] = [];
    const total = accounts.filter(a => a.type==='أصل').reduce((s,i) => s+(i.balance||0), 0);
    if (total > 850000) list.push({ icon:'💰', msg:'تجاوزت النصاب - احسب الزكاة 2.5%', color:'#F59E0B' });
    setAlerts(list);
  }); }, []));
  return (<View style={[st.c,{paddingTop:insets.top}]}><View style={st.h}><TouchableOpacity onPress={()=>router.back()}><Text style={st.bb}>←</Text></TouchableOpacity><Text style={st.t}>🔔 التنبيهات</Text></View><FlatList data={alerts} keyExtractor={(i,idx)=>idx.toString()} renderItem={({item})=>(<View style={[st.card,{borderRightColor:item.color,borderRightWidth:4}]}><Text style={st.icon}>{item.icon}</Text><Text style={st.msg}>{item.msg}</Text></View>)} ListEmptyComponent={<Text style={st.empty}>لا توجد تنبيهات</Text>} contentContainerStyle={{padding:16}} /></View>);
}
const st=StyleSheet.create({c:{flex:1,backgroundColor:'#0A1128'},h:{flexDirection:'row',padding:16},bb:{fontSize:24,color:'#D4AF37'},t:{color:'#D4AF37',fontSize:20,fontWeight:'bold',flex:1,textAlign:'center'},card:{flexDirection:'row',alignItems:'center',backgroundColor:'#16213E',padding:14,borderRadius:12,marginBottom:8},icon:{fontSize:28,marginRight:12},msg:{color:'#FFF',fontSize:14,flex:1},empty:{color:'#666',textAlign:'center',marginTop:40}});
