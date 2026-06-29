import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const items = [
  { icon: '👥', label: 'العملاء', route: '/sales/customers' },
  { icon: '📄', label: 'فاتورة مبيعات', route: '/sales/sales-invoice' },
  { icon: '🔄', label: 'مرتجع مبيعات', route: '/sales/sales-return' },
  { icon: '👨‍💼', label: 'مندوبي المبيعات', route: '/sales/reps' },
  { icon: '📊', label: 'ملخص المبيعات', route: '/sales/summary' },
  { icon: '📋', label: 'عرض سعر', route: '/sales/quotation' },
];

export default function SalesIndex() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  return (
    <View style={styles.c}><StatusBar barStyle="light-content"/>
      <View style={[styles.ct,{paddingTop:insets.top}]}>
        <View style={styles.h}><TouchableOpacity onPress={()=>router.back()} style={styles.b}><Text style={styles.bt}>←</Text></TouchableOpacity><Text style={styles.t}>💰 المبيعات والعملاء</Text><View style={{width:40}}/></View>
        <ScrollView contentContainerStyle={styles.g}>
          {items.map((item,i)=><TouchableOpacity key={i} style={styles.card} onPress={()=>router.push(item.route)}><Text style={styles.ci}>{item.icon}</Text><Text style={styles.cl}>{item.label}</Text></TouchableOpacity>)}
        </ScrollView>
      </View>
    </View>
  );
}
const styles=StyleSheet.create({c:{flex:1,backgroundColor:'#0A1128'},ct:{flex:1},h:{flexDirection:'row',alignItems:'center',paddingHorizontal:16,paddingVertical:14},b:{width:40,height:40,borderRadius:20,backgroundColor:'#16213E',justifyContent:'center',alignItems:'center',borderWidth:1,borderColor:'#2a3550'},bt:{fontSize:20,color:'#D4AF37'},t:{flex:1,fontSize:18,fontWeight:'bold',color:'#FFF',textAlign:'center'},g:{flexDirection:'row',flexWrap:'wrap',padding:12,gap:10},card:{width:'30%',backgroundColor:'#16213E',borderRadius:16,padding:20,alignItems:'center',borderWidth:1,borderColor:'#2a3550'},ci:{fontSize:36,marginBottom:10},cl:{color:'#FFF',fontSize:12,fontWeight:'600',textAlign:'center'}});
