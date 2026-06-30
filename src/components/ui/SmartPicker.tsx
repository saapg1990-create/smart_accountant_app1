import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Modal, StyleSheet } from 'react-native';

interface SmartPickerProps {
  label: string;
  placeholder: string;
  value: string;
  displayValue: string;
  data: any[];
  searchFields: string[];
  displayField: string;
  idField: string;
  onSelect: (item: any) => void;
  visible: boolean;
  onClose: () => void;
  onOpen: () => void;
}

export default function SmartPicker({
  label, placeholder, value, displayValue, data, searchFields, displayField, idField, onSelect, visible, onClose, onOpen
}: SmartPickerProps) {
  const [search, setSearch] = useState('');
  const [filtered, setFiltered] = useState<any[]>(data);

  useEffect(() => { setFiltered(data); }, [data]);

  const handleSearch = (text: string) => {
    setSearch(text);
    if (!text.trim()) { setFiltered(data); return; }
    const q = text.toLowerCase();
    const result = data.filter(item =>
      searchFields.some(field => String(item[field] || '').toLowerCase().includes(q))
    );
    setFiltered(result);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.selector} onPress={onOpen}>
        <Text style={[styles.selectorText, !displayValue && styles.placeholder]}>
          {displayValue || placeholder}
        </Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>

      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={handleSearch}
              placeholder="🔍 بحث..."
              placeholderTextColor="#888"
            />
            <FlatList
              data={filtered}
              keyExtractor={(item) => String(item[idField])}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.item}
                  onPress={() => { onSelect(item); onClose(); setSearch(''); }}
                >
                  <Text style={styles.itemText}>{String(item[displayField] || '')}</Text>
                  {item.code && <Text style={styles.itemCode}>{item.code}</Text>}
                  {item.balance !== undefined && (
                    <Text style={styles.itemBalance}>الرصيد: {item.balance?.toLocaleString()}</Text>
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.emptyText}>لا توجد نتائج</Text>}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 10 },
  label: { color: '#9A9B3B', fontSize: 14, marginBottom: 4 },
  selector: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#0a0f1e', padding: 12, borderRadius: 8,
    borderWidth: 1, borderColor: '#2a3550',
  },
  selectorText: { color: '#fff', fontSize: 15, flex: 1, textAlign: 'right' },
  placeholder: { color: '#666' },
  arrow: { color: '#D4AF37', fontSize: 14, marginLeft: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#16213E', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%', padding: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { color: '#D4AF37', fontSize: 20, fontWeight: 'bold' },
  closeBtn: { color: '#D4AF37', fontSize: 24, padding: 4 },
  searchInput: { backgroundColor: '#0a0f1e', color: '#fff', padding: 12, borderRadius: 8, marginBottom: 10, textAlign: 'right' },
  item: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#2a3550' },
  itemText: { color: '#fff', fontSize: 16, textAlign: 'right' },
  itemCode: { color: '#D4AF37', fontSize: 12, textAlign: 'right', marginTop: 2 },
  itemBalance: { color: '#9A9B3B', fontSize: 12, textAlign: 'right', marginTop: 2 },
  emptyText: { color: '#666', textAlign: 'center', padding: 20, fontSize: 16 },
});
