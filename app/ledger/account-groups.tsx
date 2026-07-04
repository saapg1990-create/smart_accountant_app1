import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Modal, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DataService } from '../../src/services/dataService';
import { ControlButtons, ControlHeader } from '../../src/components/ui/ControlButtons';

export default function AccountGroupsScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const [data, setData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('اصل');
  const types = ['اصل','خصم','ايراد','مصروف','ملكية'];

  useFocusEffect(useCallback(() => { loadAll(); }, []));
  const loadAll = async () => { const res = await DataService.getGroups(); setData(res || []); };

  const openAdd = () => { setName(''); setType('اصل'); setShowForm(true); };
  const handleSave = async () => {
    if (!name.trim()) return Alert.alert('خطأ', 'أدخل الاسم');
    await DataService.addGroup({ id: 'grp-' + Date.now(), name, type });
    setName(''); setShowForm(false); loadAll();
  };

  return (
    <View style={[st.c, { paddingTop: insets.top }]}>
      <ControlHeader title="مجموعات الحسابات" count={data.length} onBack={() => router.back()} onAdd={openAdd} />
      <ControlButtons showAdd showSearch showRefresh showExport onAdd={openAdd} onRefresh={loadAll} />
      <TextInput style={st.si} placeholder="🔍 بحث..." placeholderTextColor="#666" value={searchQuery} onChangeText={setSearchQuery} />
      {showForm && (
        <Modal visible={showForm} animationType="slide" transparent>
          <View style={st.mo}><View style={st.mc}><View style={st.mh}><Text style={st.mt}>مجموعة جديدة</Text><TouchableOpacity onPress={()=>setShowForm(false)}><Text style={st.mx}>✕</Text></TouchableOpacity></View>
          <ScrollView style={{padding:16}}>
            <Text style={st.fl}>الاسم *</Text><TextInput style={st.fi} value={name} onChangeText={setName} />
            <Text style={st.fl}>النوع</Text>
            <View style={{flexDirection:'row',gap:6,flexWrap:'wrap'}}>
              {types.map(t => <TouchableOpacity key={t} style={[st.tb, type===t&&st.tba]} onPress={()=>setType(t)}><Text style={[st.tt, type===t&&st.tta]}>{t}</Text></TouchableOpacity>)}
            </View>
            <TouchableOpacity style={st.sb} onPress={handleSave}><Text style={st.sbt}>💾 حفظ</Text></TouchableOpacity>
          </ScrollView></View></View>
        </Modal>
      )}
      <FlatList data={data.filter((d:any) => d.name?.includes(searchQuery))} keyExtractor={i => i.id} renderItem={({item}) => (
        <View style={st.card}><Text style={st.cn}>{item.name}</Text><Text style={st.cd}>{item.type}</Text></View>
      )} ListEmptyComponent={<Text style={st.et}>لا توجد مجموعات</Text>} contentContainerStyle={{padding:12}} />
    </View>
  );
}
const st = StyleSheet.create({
  c:{flex:1,backgroundColor:'#0A1128'},si:{marginHorizontal:12,marginBottom:8,padding:10,backgroundColor:'#16213E',borderRadius:10,color:'#FFF',borderWidth:1,borderColor:'#2a3550',textAlign:'right'},
  mo:{flex:1,backgroundColor:'rgba(0,0,0,0.7)',justifyContent:'flex-end'},mc:{backgroundColor:'#16213E',borderTopLeftRadius:20,borderTopRightRadius:20,maxHeight:'80%'},
  mh:{flexDirection:'row',justifyContent:'space-between',padding:16,borderBottomWidth:1,borderBottomColor:'#2a3550'},mt:{color:'#D4AF37',fontSize:16,fontWeight:'bold'},mx:{color:'#EF4444',fontSize:22},
  fl:{color:'#94a3b8',fontSize:13,marginBottom:6,marginTop:10},fi:{backgroundColor:'#0A1128',color:'#FFF',padding:10,borderRadius:8,textAlign:'right'},
  tb:{paddingHorizontal:12,paddingVertical:6,borderRadius:16,backgroundColor:'#0A1128',borderWidth:1,borderColor:'#2a3550'},tba:{borderColor:'#D4AF37',backgroundColor:'#D4AF3720'},tt:{color:'#94a3b8',fontSize:11},tta:{color:'#D4AF37',fontWeight:'bold'},
  sb:{backgroundColor:'#D4AF37',padding:12,borderRadius:8,alignItems:'center',marginTop:16},sbt:{color:'#000',fontWeight:'bold'},
  card:{backgroundColor:'#16213E',padding:14,marginHorizontal:12,marginVertical:4,borderRadius:12},cn:{color:'#FFF',fontSize:14,fontWeight:'bold'},cd:{color:'#94a3b8',fontSize:11},et:{color:'#666',textAlign:'center',marginTop:40},
});
