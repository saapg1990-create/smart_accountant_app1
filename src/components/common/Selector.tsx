import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useDatabase } from '../../../context/DatabaseContext';

interface SelectorProps {
  label: string;
  tableName: string;
  displayField?: string;
  subField?: string;
  valueField?: string;
  filterField?: string;
  filterValue?: string;
  placeholder?: string;
  selectedId: string;
  selectedName: string;
  onSelect: (item: any) => void;
}

export const Selector: React.FC<SelectorProps> = ({
  label, tableName, displayField = 'name', subField = 'code',
  valueField = 'id', filterField, filterValue,
  placeholder = 'اختر...', selectedId, selectedName, onSelect
}) => {
  const { db } = useDatabase();
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && db) { loadData(); }
  }, [visible, tableName, filterValue]);

  const loadData = async () => {
    try {
      setLoading(true);
      let sql = `SELECT * FROM ${tableName} WHERE 1=1`;
      const params: any[] = [];
      if (filterField && filterValue) { sql += ` AND ${filterField} = ?`; params.push(filterValue); }
      sql += ` ORDER BY ${displayField}`;
      const result = await db.getAllAsync(sql, params);
      setData(result);
    } catch (e) { setData([]); }
    finally { setLoading(false); }
  };

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter((item: any) => (item[displayField] || '').toLowerCase().includes(q) || (item[subField] || '').toLowerCase().includes(q));
  }, [data, search]);

  return (
    <View style={s.container}>
      <Text style={s.label}>{label}</Text>
      <TouchableOpacity style={s.selector} onPress={() => { setVisible(true); setSearch(''); }}>
        <Text style={selectedName ? s.text : s.placeholder}>{selectedName || placeholder}</Text>
        <Text style={s.arrow}>▼</Text>
      </TouchableOpacity>
      <Modal visible={visible} animationType="slide" transparent>
        <View style={s.overlay}><View style={s.content}>
          <View style={s.header}><Text style={s.title}>{label}</Text><TouchableOpacity onPress={() => setVisible(false)}><Text style={s.close}>✕</Text></TouchableOpacity></View>
          <TextInput style={s.search} value={search} onChangeText={setSearch} placeholder="🔍 بحث..." placeholderTextColor="#666" autoFocus />
          {loading ? <ActivityIndicator color="#D4AF37" style={{padding:20}} /> :
            <FlatList data={filtered} keyExtractor={(item) => item[valueField] || item.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={[s.item, selectedId===item[valueField]&&s.selectedItem]} onPress={()=>{onSelect(item);setVisible(false);}}>
                  <View style={{flex:1}}>
                    <Text style={s.itemText}>{item[displayField]}</Text>
                    {item[subField]&&<Text style={s.itemSub}>{item[subField]}</Text>}
                  </View>
                  {selectedId===item[valueField]&&<Text style={{fontSize:16}}>✅</Text>}
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={s.empty}>لا توجد نتائج</Text>}
              style={{maxHeight:400}}
            />
          }
        </View></View>
      </Modal>
    </View>
  );
};

const s = StyleSheet.create({
  container:{marginBottom:10},label:{color:'#9A9B3B',fontSize:13,marginBottom:4,marginTop:8},
  selector:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',backgroundColor:'#0A1128',padding:12,borderRadius:10,borderWidth:1,borderColor:'#2a3550'},
  text:{color:'#FFF',fontSize:14,flex:1,textAlign:'right'},placeholder:{color:'#666',fontSize:14,flex:1,textAlign:'right'},arrow:{color:'#D4AF37',fontSize:12,marginLeft:8},
  overlay:{flex:1,backgroundColor:'rgba(0,0,0,0.7)',justifyContent:'flex-end'},content:{backgroundColor:'#16213E',borderTopLeftRadius:20,borderTopRightRadius:20,maxHeight:'75%'},
  header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:16,borderBottomWidth:1,borderBottomColor:'#2a3550'},title:{color:'#D4AF37',fontSize:18,fontWeight:'bold'},close:{color:'#EF4444',fontSize:22},
  search:{backgroundColor:'#0A1128',color:'#FFF',padding:12,borderRadius:10,margin:16,textAlign:'right',borderWidth:1,borderColor:'#2a3550'},
  item:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:14,borderBottomWidth:1,borderBottomColor:'#2a3550'},selectedItem:{backgroundColor:'#D4AF3710'},
  itemText:{color:'#FFF',fontSize:14,textAlign:'right'},itemSub:{color:'#94a3b8',fontSize:11,textAlign:'right',marginTop:2},empty:{color:'#94a3b8',textAlign:'center',padding:20},
});
