import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Modal, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDatabase } from '../../context/DatabaseContext';
import { ControlButtons, ControlHeader } from '../../src/components/ui/ControlButtons';

export default function UnitsScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const { db } = useDatabase();
  const [units, setUnits] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', parentId: '', parentName: '', ratio: '1' });
  const [searchQuery, setSearchQuery] = useState('');
  const [showParentPicker, setShowParentPicker] = useState(false);

  useFocusEffect(useCallback(() => { loadUnits(); }, [db]));

  const loadUnits = async () => {
    if (!db) return;
    try {
      await db.execAsync(`CREATE TABLE IF NOT EXISTS units (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, parentId TEXT DEFAULT '', 
        ratio REAL DEFAULT 1, createdAt TEXT DEFAULT (datetime('now'))
      )`);
      const result = await db.getAllAsync('SELECT * FROM units ORDER BY name');
      setUnits(result);
    } catch (e) { console.log('Load error:', e); }
  };

  const mainUnits = units.filter((u: any) => !u.parentId || u.parentId === '');
  const getSubUnits = (parentId: string) => units.filter((u: any) => u.parentId === parentId);

  const openAdd = (parentId = '', parentName = '') => {
    setEditMode(false); setEditingId(null);
    setFormData({ name: '', parentId, parentName, ratio: '1' });
    setShowForm(true);
  };

  const openEdit = (unit: any) => {
    setEditMode(true); setEditingId(unit.id);
    const parent = units.find((u: any) => u.id === unit.parentId);
    setFormData({ name: unit.name, parentId: unit.parentId || '', parentName: parent?.name || '', ratio: String(unit.ratio || 1) });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const subs = getSubUnits(id);
    if (subs.length > 0) { Alert.alert('تنبيه', 'لا يمكن حذف وحدة لها وحدات فرعية'); return; }
    Alert.alert('حذف', 'حذف الوحدة؟', [{ text: 'إلغاء' }, { text: 'حذف', onPress: async () => {
      await db.runAsync('DELETE FROM units WHERE id=?', [id]); await loadUnits();
    }}]);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) { Alert.alert('خطأ', 'أدخل اسم الوحدة'); return; }
    if (formData.parentId && (!formData.ratio || parseFloat(formData.ratio) <= 0)) {
      Alert.alert('خطأ', 'أدخل نسبة التحويل الصحيحة'); return;
    }
    if (editMode && editingId) {
      await db.runAsync('UPDATE units SET name=?, parentId=?, ratio=? WHERE id=?', [formData.name, formData.parentId, parseFloat(formData.ratio)||1, editingId]);
    } else {
      const id = 'u' + Date.now();
      await db.runAsync('INSERT INTO units (id, name, parentId, ratio) VALUES (?,?,?,?)', [id, formData.name, formData.parentId, parseFloat(formData.ratio)||1]);
    }
    await loadUnits(); setShowForm(false);
  };

  const parentUnits = units.filter((u: any) => !u.parentId || u.parentId === '');

  // بناء شجرة الوحدات
  const buildTree = () => {
    const result: any[] = [];
    mainUnits.forEach((main: any) => {
      if (searchQuery && !main.name.includes(searchQuery)) return;
      result.push({ level: 1, data: main });
      getSubUnits(main.id).forEach((sub: any) => {
        if (searchQuery && !sub.name.includes(searchQuery)) return;
        result.push({ level: 2, data: sub, parent: main });
      });
    });
    return result;
  };

  const displayList = buildTree();

  return (
    <View style={[st.c, { paddingTop: insets.top }]}>
      <ControlHeader title="وحدات القياس" count={units.length} onBack={() => router.back()} onAdd={() => openAdd()} />
      <ControlButtons showSearch showRefresh showPrint showExport onRefresh={loadUnits} />
      <TextInput style={st.si} placeholder="🔍 بحث..." placeholderTextColor="#666" value={searchQuery} onChangeText={setSearchQuery} />
      
      {displayList.length === 0 ? <Text style={st.et}>لا توجد وحدات</Text> :
        <FlatList data={displayList} keyExtractor={(i,idx) => i.data.id+idx}
          renderItem={({ item }) => {
            const unit = item.data; const isMain = item.level === 1;
            return (
              <TouchableOpacity style={[isMain ? st.mainCard : st.subCard, { marginLeft: (item.level-1)*25 }]}
                onPress={() => openEdit(unit)} onLongPress={() => handleDelete(unit.id)}>
                <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>
                  <View style={{flex:1}}>
                    <Text style={isMain ? st.mainName : st.subName}>
                      {isMain ? '📐 ' : '└ 📏 '}{unit.name}
                    </Text>
                    {!isMain && item.parent && (
                      <Text style={st.ratioText}>
                        1 {item.parent.name} = {unit.ratio} {unit.name}
                      </Text>
                    )}
                  </View>
                  <View style={{flexDirection:'row',gap:6}}>
                    {isMain && <TouchableOpacity style={st.addSubBtn} onPress={() => openAdd(unit.id, unit.name)}><Text style={st.addSubText}>+ فرعي</Text></TouchableOpacity>}
                    <TouchableOpacity onPress={() => handleDelete(unit.id)}><Text style={st.delBtn}>🗑️</Text></TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={{padding:12}}
        />
      }

      {/* Modal إضافة/تعديل */}
      <Modal visible={showForm} animationType="slide" transparent>
        <View style={st.mo}><View style={st.mc}><View style={st.mh}><Text style={st.mt}>{editMode?'✏️ تعديل وحدة':formData.parentId?'➕ وحدة فرعية':'📐 وحدة رئيسية'}</Text><TouchableOpacity onPress={()=>setShowForm(false)}><Text style={st.mx}>✕</Text></TouchableOpacity></View>
        <ScrollView style={st.mb}>
          <Text style={st.fl}>اسم الوحدة *</Text>
          <TextInput style={st.fi} value={formData.name} onChangeText={v=>setFormData({...formData,name:v})} placeholder="مثال: كرتون، درزن، حبة" placeholderTextColor="#666" />
          
          <Text style={st.fl}>الوحدة الأب</Text>
          <TouchableOpacity style={st.pk} onPress={()=>setShowParentPicker(true)}>
            <Text style={formData.parentName?st.pkt:st.pkp}>{formData.parentName||'اختيار الوحدة الأب (اختياري)'}</Text>
            <Text style={st.pka}>▼</Text>
          </TouchableOpacity>

          {formData.parentId && (
            <>
              <Text style={st.fl}>نسبة التحويل *</Text>
              <TextInput style={st.fi} value={formData.ratio} onChangeText={v=>setFormData({...formData,ratio:v})} keyboardType="numeric" placeholder={`كم ${formData.name} في الـ ${formData.parentName}؟`} placeholderTextColor="#666" />
              <Text style={st.hint}>مثال: إذا كان الكرتون فيه 12 حبة، اكتب 12</Text>
            </>
          )}

          <TouchableOpacity style={st.sb} onPress={handleSave}><Text style={st.sbt}>💾 حفظ</Text></TouchableOpacity>
        </ScrollView></View></View>
      </Modal>

      {/* PickerModal للوحدة الأب */}
      <Modal visible={showParentPicker} animationType="slide" transparent>
        <View style={st.mo}><View style={st.mc}><View style={st.mh}><Text style={st.mt}>اختيار الوحدة الأب</Text><TouchableOpacity onPress={()=>setShowParentPicker(false)}><Text style={st.mx}>✕</Text></TouchableOpacity></View>
        <View style={st.mb}>
          <ScrollView style={{maxHeight:300}}>
            {parentUnits.map((u: any) => (
              <TouchableOpacity key={u.id} style={st.item} onPress={()=>{setFormData({...formData,parentId:u.id,parentName:u.name});setShowParentPicker(false);}}>
                <Text style={st.itemText}>{u.name}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={st.item} onPress={()=>{setFormData({...formData,parentId:'',parentName:''});setShowParentPicker(false);}}>
              <Text style={{color:'#EF4444'}}>❌ بدون أب (وحدة رئيسية)</Text>
            </TouchableOpacity>
          </ScrollView>
        </View></View></View>
      </Modal>
    </View>
  );
}

const st = StyleSheet.create({
  c:{flex:1,backgroundColor:'#0A1128'},si:{marginHorizontal:12,marginBottom:8,padding:12,backgroundColor:'#16213E',borderRadius:10,color:'#FFF',borderWidth:1,borderColor:'#2a3550',textAlign:'right'},
  et:{color:'#666',textAlign:'center',marginTop:40,fontSize:16},
  mainCard:{backgroundColor:'#16213E',borderRadius:14,padding:14,marginBottom:6,borderWidth:1,borderColor:'#2a3550'},
  subCard:{backgroundColor:'#1a2240',borderRadius:10,padding:12,marginBottom:5,borderWidth:1,borderColor:'#2a3550'},
  mainName:{color:'#FFF',fontSize:16,fontWeight:'bold'},subName:{color:'#FFF',fontSize:14,fontWeight:'bold'},
  ratioText:{color:'#D4AF37',fontSize:11,marginTop:4,marginLeft:20},
  addSubBtn:{backgroundColor:'#10B98120',paddingHorizontal:10,paddingVertical:4,borderRadius:12,borderWidth:1,borderColor:'#10B981'},addSubText:{color:'#10B981',fontSize:11,fontWeight:'bold'},
  delBtn:{fontSize:20,padding:4},
  mo:{flex:1,backgroundColor:'rgba(0,0,0,0.7)',justifyContent:'flex-end'},mc:{backgroundColor:'#16213E',borderTopLeftRadius:20,borderTopRightRadius:20,maxHeight:'80%'},
  mh:{flexDirection:'row',justifyContent:'space-between',padding:16,borderBottomWidth:1,borderBottomColor:'#2a3550'},mt:{color:'#D4AF37',fontSize:16,fontWeight:'bold'},mx:{color:'#EF4444',fontSize:22},mb:{padding:16},
  fl:{color:'#94a3b8',fontSize:13,marginBottom:6,marginTop:12},fi:{backgroundColor:'#0A1128',borderRadius:10,padding:12,color:'#FFF',borderWidth:1,borderColor:'#2a3550',textAlign:'right'},
  pk:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',backgroundColor:'#0A1128',borderRadius:10,padding:14,borderWidth:1,borderColor:'#2a3550'},pkt:{color:'#FFF',fontSize:14},pkp:{color:'#666',fontSize:14},pka:{color:'#D4AF37',fontSize:12},
  hint:{color:'#F59E0B',fontSize:11,textAlign:'center',marginTop:6},
  item:{padding:14,borderBottomWidth:1,borderBottomColor:'#2a3550'},itemText:{color:'#FFF',fontSize:14,textAlign:'right'},
  sb:{backgroundColor:'#D4AF37',borderRadius:12,padding:14,alignItems:'center',marginTop:20,marginBottom:20},sbt:{color:'#0A1128',fontSize:16,fontWeight:'bold'},
});
