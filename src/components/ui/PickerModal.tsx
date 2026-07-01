import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ScrollView } from 'react-native';

interface Props {
  visible: boolean;
  title: string;
  data: any[];
  searchPlaceholder?: string;
  displayField?: string;
  subField?: string;
  filterField?: string;
  filterValue?: string;
  onSelect: (item: any) => void;
  onClose: () => void;
}

export const PickerModal: React.FC<Props> = ({ 
  visible, title, data, searchPlaceholder = 'بحث...', 
  displayField = 'name', subField, filterField, filterValue,
  onSelect, onClose 
}) => {
  const [search, setSearch] = useState('');
  
  let filtered = (data || []);
  if (filterField && filterValue) {
    filtered = filtered.filter((item: any) => item[filterField] === filterValue);
  }
  if (search) {
    filtered = filtered.filter((item: any) => 
      (item[displayField] || '').includes(search) || 
      (item[subField || 'code'] || '').includes(search)
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={s.overlay}>
        <View style={s.content}>
          <View style={s.header}>
            <Text style={s.title}>{title}</Text>
            <TouchableOpacity onPress={onClose}><Text style={s.close}>x</Text></TouchableOpacity>
          </View>
          <View style={s.body}>
            <TextInput style={s.search} value={search} onChangeText={setSearch} placeholder={searchPlaceholder} placeholderTextColor="#666"/>
            <ScrollView style={{maxHeight:400}}>
              {filtered.map((item: any, i: number) => (
                <TouchableOpacity key={item.id || i} style={s.item} onPress={() => { onSelect(item); onClose(); }}>
                  <Text style={s.itemText}>{item[displayField]}</Text>
                  {item[subField || ''] ? <Text style={s.itemSub}>{item[subField]}</Text> : null}
                </TouchableOpacity>
              ))}
              {filtered.length === 0 && <Text style={s.noData}>لا توجد نتائج</Text>}
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  overlay:{flex:1,backgroundColor:'rgba(0,0,0,0.7)',justifyContent:'flex-end'},
  content:{backgroundColor:'#16213E',borderTopLeftRadius:20,borderTopRightRadius:20,maxHeight:'70%'},
  header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:16,borderBottomWidth:1,borderBottomColor:'#2a3550'},
  title:{color:'#D4AF37',fontSize:18,fontWeight:'bold'},
  close:{color:'#EF4444',fontSize:22,fontWeight:'bold'},
  body:{padding:16},
  search:{backgroundColor:'#0A1128',borderRadius:10,padding:12,color:'#FFF',borderWidth:1,borderColor:'#2a3550',textAlign:'right',fontSize:14,marginBottom:10},
  item:{flexDirection:'row',justifyContent:'space-between',padding:14,borderBottomWidth:1,borderBottomColor:'#2a3550'},
  itemText:{color:'#FFF',fontSize:14},
  itemSub:{color:'#94a3b8',fontSize:11},
  noData:{color:'#94a3b8',textAlign:'center',padding:20}
});
