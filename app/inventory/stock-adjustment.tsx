import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function stock_adjustmentScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  return (
    <View style={[st.c, { paddingTop: insets.top }]}>
      <View style={st.h}>
        <TouchableOpacity onPress={() => router.back()}><Text style={st.bb}>←</Text></TouchableOpacity>
        <Text style={st.t}>stock-adjustment</Text>
        <View style={{ width: 36 }} />
      </View>
      <View style={st.body}><Text style={st.msg}>🚧 قيد التطوير</Text></View>
    </View>
  );
}
const st = StyleSheet.create({
  c:{flex:1,backgroundColor:'#0A1128'},h:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:16},bb:{fontSize:24,color:'#D4AF37'},t:{color:'#D4AF37',fontSize:20,fontWeight:'bold'},
  body:{flex:1,justifyContent:'center',alignItems:'center'},msg:{color:'#94a3b8',fontSize:16},
});
