import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Modal } from 'react-native';
import { PostingEngine } from '../../services/PostingEngine';

interface AccountSelectorProps {
  visible: boolean;
  title: string;
  filterType?: 'cash' | 'customer' | 'supplier' | 'expense' | 'income' | 'all';
  onSelect: (account: any) => void;
  onClose: () => void;
}

export const AccountSelector: React.FC<AccountSelectorProps> = ({
  visible, title, filterType = 'all', onSelect, onClose
}) => {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) loadAccounts();
  }, [visible, filterType]);

  const loadAccounts = async () => {
    setLoading(true);
    let result: any[] = [];
    
    switch (filterType) {
      case 'cash':
        result = await PostingEngine.getCashAccounts();
        break;
      case 'customer':
        result = await PostingEngine.getLeafAccounts('العملاء');
        break;
      case 'supplier':
        result = await PostingEngine.getLeafAccounts('الموردين');
        break;
      case 'expense':
        result = await PostingEngine.getLeafAccounts('المصروفات');
        break;
      case 'income':
        result = await PostingEngine.getLeafAccounts('الإيرادات');
        break;
      default:
        // كل الحسابات الفرعية
        const store = (await import('../../hooks/useLocalStore')).default.getInstance();
        const all = await store.getAll('accounts');
        result = all.filter((a: any) => !!a.parentId);
    }
    
    setAccounts(result);
    setLoading(false);
  };

  const filtered = accounts.filter((a: any) => 
    (a.name || '').includes(search) || (a.code || '').includes(search)
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={st.overlay}>
        <View style={st.content}>
          <View style={st.header}>
            <Text style={st.title}>{title}</Text>
            <TouchableOpacity onPress={onClose}><Text style={st.close}>✕</Text></TouchableOpacity>
          </View>
          <View style={st.body}>
            <TextInput style={st.search} value={search} onChangeText={setSearch} placeholder="🔍 بحث..." placeholderTextColor="#666" />
            <Text style={st.hint}>※ الحسابات الفرعية فقط (Leaf Accounts)</Text>
            <ScrollView style={{ maxHeight: 400 }}>
              {loading ? <Text style={st.loading}>جاري التحميل...</Text> :
                filtered.length === 0 ? <Text style={st.noData}>لا توجد حسابات فرعية</Text> :
                filtered.map((item: any, i: number) => (
                  <TouchableOpacity key={item.id || i} style={st.item} onPress={() => { onSelect(item); onClose(); }}>
                    <View>
                      <Text style={st.itemName}>{item.name}</Text>
                      <Text style={st.itemCode}>{item.code} | الرصيد: {(item.balance || 0).toLocaleString()} ﷼</Text>
                    </View>
                    <Text style={st.itemType}>{item.type}</Text>
                  </TouchableOpacity>
                ))
              }
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const st = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  content: { backgroundColor: '#16213E', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#2a3550' },
  title: { color: '#D4AF37', fontSize: 18, fontWeight: 'bold' },
  close: { color: '#EF4444', fontSize: 22, fontWeight: 'bold' },
  body: { padding: 16 },
  search: { backgroundColor: '#0A1128', borderRadius: 10, padding: 12, color: '#FFF', borderWidth: 1, borderColor: '#2a3550', textAlign: 'right', fontSize: 14, marginBottom: 8 },
  hint: { color: '#F59E0B', fontSize: 10, textAlign: 'center', marginBottom: 8 },
  loading: { color: '#94a3b8', textAlign: 'center', padding: 20 },
  noData: { color: '#94a3b8', textAlign: 'center', padding: 20 },
  item: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderBottomColor: '#2a3550', alignItems: 'center' },
  itemName: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  itemCode: { color: '#94a3b8', fontSize: 10, marginTop: 2 },
  itemType: { color: '#D4AF37', fontSize: 11 },
});
