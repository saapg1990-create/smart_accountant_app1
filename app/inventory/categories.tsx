import { ControlButtons, ControlHeader } from "../../src/components/ui/ControlButtons";
      <ControlButtons showAdd showEdit showDelete showSearch showPrint showRefresh showExport onAdd={openAdd} onRefresh={loadData} />
import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDatabase } from '../../context/DatabaseContext';

export default function CategoriesScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const { db } = useDatabase();
  const [data, setData] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  useFocusEffect(useCallback(() => { loadData(); }, [db]));

  const loadData = async () => {
    if (!db) return;
    try {
      await db.execAsync(`CREATE TABLE IF NOT EXISTS item_groups (id TEXT PRIMARY KEY, name TEXT NOT NULL, code TEXT DEFAULT '')`);
      const r = await db.getAllAsync('SELECT * FROM item_groups ORDER BY name'); 
      setData(r);
    } catch(e) { console.log(e); }
  };

  const generateCode = (name: string) => {
    return name.slice(0, 3).toUpperCase() + '-' + (data.length + 1).toString().padStart(2, '0');
  };

  const openAdd = () => { setEditMode(false); setEditingId(null); setName(''); setCode(''); setShowForm(true); };
  const openEdit = (item: any) => { setEditMode(true); setEditingId(item.id); setName(item.name); setCode(item.code||''); setShowForm(true); };

  const handleDelete = async (id: string) => {
    Alert.alert('حذف', 'حذف المجموعة؟', [{ text: 'إلغاء' }, { text: 'حذف', onPress: async () => { 
      await db.runAsync('DELETE FROM item_groups WHERE id=?', [id]); await loadData(); 
    }}]);
  };

  const handleSave = async () => {
    if (!name.trim()) return Alert.alert('خطأ', 'أدخل اسم المجموعة');
    const finalCode = code || generateCode(name);
    if (editMode && editingId) {
      await db.runAsync('UPDATE item_groups SET name=?, code=? WHERE id=?', [name, finalCode, editingId]);
    } else {
      const id = 'grp' + Date.now();
      await db.runAsync('INSERT INTO item_groups (id, name, code) VALUES (?,?,?)', [id, name, finalCode]);
    }
    await loadData(); setShowForm(false);
  };

  return (
    <View style={[st.container, { paddingTop: insets.top }]}>
      <View style={st.header}><TouchableOpacity onPress={() => router.back()}><Text style={st.backBtn}>← رجوع</Text></TouchableOpacity><Text style={st.title}>مجموعات مخزنية</Text><TouchableOpacity onPress={openAdd}><Text style={st.addBtn}>+ إضافة</Text></TouchableOpacity></View>
      <Text style={st.hint}>💡 مثال: زيوت، حبوب، حلويات، مشروبات، منظفات</Text>
      
      {showForm && (
        <View style={st.form}>
          <Text style={st.label}>اسم المجموعة *</Text>
          <TextInput style={st.input} value={name} onChangeText={(v) => { setName(v); setCode(generateCode(v)); }} placeholder="مثال: الزيوت" placeholderTextColor="#666" />
          <Text style={st.label}>الكود</Text>
          <TextInput style={[st.input, {color:'#D4AF37'}]} value={code} onChangeText={setCode} placeholder="مثال: ZYT" placeholderTextColor="#444" />
          <View style={{flexDirection:'row',gap:8}}>
            <TouchableOpacity style={[st.saveBtn,{flex:1}]} onPress={handleSave}><Text style={st.saveBtnText}>💾 حفظ</Text></TouchableOpacity>
            <TouchableOpacity style={[st.cancelBtn,{flex:1}]} onPress={()=>setShowForm(false)}><Text style={st.cancelBtnText}>إلغاء</Text></TouchableOpacity>
          </View>
        </View>
      )}

      <FlatList data={data} keyExtractor={i => i.id} 
        renderItem={({ item }) => (
          <TouchableOpacity style={st.card} onPress={() => openEdit(item)} onLongPress={() => handleDelete(item.id)}>
            <Text style={st.cardIcon}>📁</Text>
            <View style={{flex:1}}>
              <Text style={st.cardName}>{item.name}</Text>
              <Text style={st.cardCode}>كود: {item.code}</Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item.id)}><Text style={st.deleteBtn}>🗑️</Text></TouchableOpacity>
          </TouchableOpacity>
        )} 
        ListEmptyComponent={<Text style={st.empty}>لا توجد مجموعات</Text>} 
        contentContainerStyle={{padding:12}}
      />
    </View>
  );
}
const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f1e' }, 
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1a2540' }, 
  backBtn: { color: '#D4AF37', fontSize: 16 }, title: { color: '#D4AF37', fontSize: 20, fontWeight: 'bold' }, addBtn: { color: '#D4AF37', fontSize: 16, fontWeight: 'bold' },
  hint: { color: '#F59E0B', fontSize: 11, textAlign: 'center', marginVertical: 8, paddingHorizontal: 16 },
  form: { padding: 16, backgroundColor: '#16213E', margin: 12, borderRadius: 12 }, 
  label: { color: '#9A9B3B', fontSize: 14, marginTop: 8 }, 
  input: { backgroundColor: '#0a0f1e', color: '#fff', padding: 10, borderRadius: 8, marginBottom: 6, textAlign: 'right' }, 
  saveBtn: { backgroundColor: '#D4AF37', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 12 }, saveBtnText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  cancelBtn: { backgroundColor: '#2a3550', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 12 }, cancelBtnText: { color: '#FFF', fontSize: 16 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16213E', padding: 14, marginBottom: 6, borderRadius: 12, borderWidth: 1, borderColor: '#2a3550' }, 
  cardIcon: { fontSize: 28, marginRight: 10 },
  cardName: { color: '#fff', fontSize: 16, fontWeight: 'bold' }, cardCode: { color: '#D4AF37', fontSize: 10 },
  deleteBtn: { fontSize: 22, padding: 8 }, empty: { color: '#666', textAlign: 'center', marginTop: 40, fontSize: 16 },
});
