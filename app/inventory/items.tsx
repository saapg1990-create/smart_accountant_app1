import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Modal, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalTable } from '../../hooks/useLocalStore';
import { PickerModal } from '../../src/components/ui/PickerModal';
import { ControlButtons, ControlHeader } from '../../src/components/ui/ControlButtons';

export default function ItemsScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const { data: items, add, update, remove } = useLocalTable('items');
  const { data: groups } = useLocalTable('categories');
  const { data: units } = useLocalTable('units');
  const { data: warehouses } = useLocalTable('warehouses');
  const { data: brands } = useLocalTable('brands');

  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [groupId, setGroupId] = useState(''); const [groupName, setGroupName] = useState('');
  const [unitId, setUnitId] = useState(''); const [unitName, setUnitName] = useState('');
  const [brandId, setBrandId] = useState(''); const [brandName, setBrandName] = useState('');
  const [warehouseId, setWarehouseId] = useState(''); const [warehouseName, setWarehouseName] = useState('');
  const [cost, setCost] = useState('0'); const [price, setPrice] = useState('0');
  const [quantity, setQuantity] = useState('0'); const [minQuantity, setMinQuantity] = useState('0');

  const [showGroupPicker, setShowGroupPicker] = useState(false);
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [showBrandPicker, setShowBrandPicker] = useState(false);
  const [showWarehousePicker, setShowWarehousePicker] = useState(false);

  useFocusEffect(useCallback(() => {}, []));

  const generateCode = (groupName: string) => {
    const prefix = groupName ? groupName.slice(0, 2).toUpperCase() : 'IT';
    return prefix + '-' + (items.length + 1).toString().padStart(4, '0');
  };

  const resetForm = () => {
    setName(''); setCode(''); setGroupId(''); setGroupName(''); setUnitId(''); setUnitName('');
    setBrandId(''); setBrandName(''); setWarehouseId(''); setWarehouseName('');
    setCost('0'); setPrice('0'); setQuantity('0'); setMinQuantity('0');
  };

  const openAdd = () => { setEditMode(false); setEditingId(null); resetForm(); setShowForm(true); };

  const openEdit = (item: any) => {
    setEditMode(true); setEditingId(item.id);
    setName(item.name || ''); setCode(item.code || ''); setGroupId(item.groupId || ''); setGroupName(item.groupName || '');
    setUnitId(item.unitId || ''); setUnitName(item.unitName || ''); setBrandId(item.brandId || ''); setBrandName(item.brandName || '');
    setWarehouseId(item.warehouseId || ''); setWarehouseName(item.warehouseName || '');
    setCost(String(item.cost || 0)); setPrice(String(item.price || 0)); setQuantity(String(item.quantity || 0)); setMinQuantity(String(item.minQuantity || 0));
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    Alert.alert('حذف', 'حذف الصنف؟', [{ text: 'إلغاء' }, { text: 'حذف', onPress: () => remove(id) }]);
  };

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('خطأ', 'أدخل اسم الصنف'); return; }
    if (!unitId) { Alert.alert('تنبيه', 'اختر وحدة'); return; }
    const finalCode = code || generateCode(groupName);
    const data = { name, code: finalCode, groupId, groupName, unitId, unitName, brandId, brandName, warehouseId, warehouseName, cost: parseFloat(cost) || 0, price: parseFloat(price) || 0, quantity: parseFloat(quantity) || 0, minQuantity: parseFloat(minQuantity) || 0 };
    if (editMode && editingId) { await update(editingId, data); } else { await add(data); }
    setShowForm(false);
  };

  const onSelectGroup = (g: any) => { setGroupId(g.id); setGroupName(g.name); if (!code) setCode(generateCode(g.name)); };

  const filtered = items.filter((i: any) => i.name?.includes(searchQuery) || i.code?.includes(searchQuery) || i.groupName?.includes(searchQuery));

  const grouped: Record<string, any[]> = {};
  filtered.forEach((item: any) => { const g = item.groupName || 'بدون مجموعة'; if (!grouped[g]) grouped[g] = []; grouped[g].push(item); });

  const displayList: any[] = [];
  Object.entries(grouped).forEach(([group, items]) => { displayList.push({ type: 'group', name: group, count: items.length }); items.forEach((item: any) => displayList.push({ type: 'item', data: item })); });

  return (
    <View style={[st.c, { paddingTop: insets.top }]}>
      <ControlHeader title="الأصناف" count={items.length} onBack={() => router.back()} onAdd={openAdd} />
      <TextInput style={st.si} placeholder="🔍 بحث..." placeholderTextColor="#666" value={searchQuery} onChangeText={setSearchQuery} />
      {displayList.length === 0 ? <Text style={st.et}>لا توجد أصناف</Text> :
        <FlatList data={displayList} keyExtractor={(i, idx) => idx.toString()} renderItem={({ item }) => {
          if (item.type === 'group') return <View style={st.groupHeader}><Text style={st.groupIcon}>📁</Text><Text style={st.groupName}>{item.name}</Text><Text style={st.groupCount}>({item.count})</Text></View>;
          const it = item.data;
          return (
            <TouchableOpacity style={st.card} onPress={() => openEdit(it)} onLongPress={() => handleDelete(it.id)}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={st.icon}>📦</Text>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={st.name}>{it.name}</Text>
                  <Text style={st.code}>🔑 {it.code || 'بدون كود'}</Text>
                  <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap', marginTop: 3 }}>
                    {it.unitName && <Text style={st.tag}>📐 {it.unitName}</Text>}
                    {it.groupName && <Text style={st.tag}>📁 {it.groupName}</Text>}
                    {it.warehouseName && <Text style={st.tag}>🏭 {it.warehouseName}</Text>}
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={st.price}>{it.price?.toLocaleString()} ﷼</Text>
                  <Text style={st.qty}>المخزون: {it.quantity || 0}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }} contentContainerStyle={{ padding: 12 }} />
      }
      <Modal visible={showForm} animationType="slide" transparent>
        <View style={st.mo}><View style={st.mc}><View style={st.mh}><Text style={st.mt}>{editMode ? '✏️ تعديل صنف' : '📦 صنف جديد'}</Text><TouchableOpacity onPress={() => setShowForm(false)}><Text style={st.mx}>✕</Text></TouchableOpacity></View>
          <ScrollView style={st.mb}>
            <Text style={st.fl}>المجموعة</Text>
            <TouchableOpacity style={st.pk} onPress={() => setShowGroupPicker(true)}><Text style={groupName ? st.pkt : st.pkp}>{groupName || 'اختيار المجموعة'}</Text><Text style={st.pka}>▼</Text></TouchableOpacity>
            <Text style={st.fl}>🔑 كود الصنف</Text>
            <TextInput style={st.fi} value={code} onChangeText={setCode} placeholder="تلقائي" placeholderTextColor="#444" />
            <Text style={st.fl}>اسم الصنف *</Text>
            <TextInput style={st.fi} value={name} onChangeText={setName} placeholder="اسم الصنف" placeholderTextColor="#666" />
            <Text style={st.fl}>الوحدة *</Text>
            <TouchableOpacity style={[st.pk, !unitId && { borderColor: '#EF4444' }]} onPress={() => setShowUnitPicker(true)}><Text style={unitName ? st.pkt : st.pkp}>{unitName || 'اختيار الوحدة'}</Text><Text style={st.pka}>▼</Text></TouchableOpacity>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1 }}><Text style={st.fl}>سعر البيع</Text><TextInput style={st.fi} value={price} onChangeText={setPrice} keyboardType="numeric" /></View>
              <View style={{ flex: 1 }}><Text style={st.fl}>سعر الشراء</Text><TextInput style={st.fi} value={cost} onChangeText={setCost} keyboardType="numeric" /></View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1 }}><Text style={st.fl}>الكمية</Text><TextInput style={st.fi} value={quantity} onChangeText={setQuantity} keyboardType="numeric" /></View>
              <View style={{ flex: 1 }}><Text style={st.fl}>الحد الأدنى</Text><TextInput style={st.fi} value={minQuantity} onChangeText={setMinQuantity} keyboardType="numeric" /></View>
            </View>
            <Text style={st.fl}>العلامة (اختياري)</Text>
            <TouchableOpacity style={st.pk} onPress={() => setShowBrandPicker(true)}><Text style={brandName ? st.pkt : st.pkp}>{brandName || 'اختيار العلامة'}</Text><Text style={st.pka}>▼</Text></TouchableOpacity>
            <Text style={st.fl}>المخزن (اختياري)</Text>
            <TouchableOpacity style={st.pk} onPress={() => setShowWarehousePicker(true)}><Text style={warehouseName ? st.pkt : st.pkp}>{warehouseName || 'اختيار المخزن'}</Text><Text style={st.pka}>▼</Text></TouchableOpacity>
            <TouchableOpacity style={st.sb} onPress={handleSave}><Text style={st.sbt}>💾 حفظ</Text></TouchableOpacity>
          </ScrollView></View></View>
      </Modal>
      <PickerModal visible={showGroupPicker} title="اختيار المجموعة" data={groups || []} displayField="name" onSelect={onSelectGroup} onClose={() => setShowGroupPicker(false)} />
      <PickerModal visible={showUnitPicker} title="اختيار الوحدة" data={units || []} displayField="name" onSelect={(i: any) => { setUnitId(i.id); setUnitName(i.name); }} onClose={() => setShowUnitPicker(false)} />
      <PickerModal visible={showBrandPicker} title="اختيار العلامة" data={brands || []} displayField="name" onSelect={(i: any) => { setBrandId(i.id); setBrandName(i.name); }} onClose={() => setShowBrandPicker(false)} />
      <PickerModal visible={showWarehousePicker} title="اختيار المخزن" data={warehouses || []} displayField="name" onSelect={(i: any) => { setWarehouseId(i.id); setWarehouseName(i.name); }} onClose={() => setShowWarehousePicker(false)} />
    </View>
  );
}

const st = StyleSheet.create({
  c: { flex: 1, backgroundColor: '#0A1128' },
  si: { marginHorizontal: 12, marginBottom: 8, padding: 12, backgroundColor: '#16213E', borderRadius: 10, color: '#FFF', borderWidth: 1, borderColor: '#2a3550', textAlign: 'right' },
  et: { color: '#666', textAlign: 'center', marginTop: 40, fontSize: 16 },
  groupHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#D4AF3715', padding: 10, borderRadius: 8, marginBottom: 6, marginTop: 4 },
  groupIcon: { fontSize: 18, marginRight: 8 }, groupName: { color: '#D4AF37', fontSize: 14, fontWeight: 'bold', flex: 1 }, groupCount: { color: '#94a3b8', fontSize: 11 },
  card: { backgroundColor: '#16213E', borderRadius: 12, padding: 14, marginBottom: 6, marginLeft: 16, borderWidth: 1, borderColor: '#2a3550' },
  icon: { fontSize: 24 }, name: { color: '#FFF', fontSize: 15, fontWeight: 'bold', textAlign: 'right' }, code: { color: '#D4AF37', fontSize: 11, textAlign: 'right' },
  tag: { backgroundColor: '#1a2240', color: '#94a3b8', fontSize: 10, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  price: { color: '#10B981', fontSize: 14, fontWeight: 'bold' }, qty: { color: '#94a3b8', fontSize: 10, marginTop: 2 },
  mo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }, mc: { backgroundColor: '#16213E', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' },
  mh: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#2a3550' }, mt: { color: '#D4AF37', fontSize: 16, fontWeight: 'bold' }, mx: { color: '#EF4444', fontSize: 22 }, mb: { padding: 16 },
  fl: { color: '#94a3b8', fontSize: 13, marginBottom: 6, marginTop: 10 }, fi: { backgroundColor: '#0A1128', borderRadius: 10, padding: 10, color: '#FFF', borderWidth: 1, borderColor: '#2a3550', textAlign: 'right' },
  pk: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0A1128', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#2a3550' }, pkt: { color: '#FFF', fontSize: 14 }, pkp: { color: '#666', fontSize: 14 }, pka: { color: '#D4AF37', fontSize: 12 },
  sb: { backgroundColor: '#D4AF37', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 20, marginBottom: 20 }, sbt: { color: '#0A1128', fontSize: 16, fontWeight: 'bold' },
});
