import { DataService } from 'src/services/dataService';
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, FlatList } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDatabase } from '../context/DatabaseContext';
// import { useLocalTable } from '../hooks/useLocalStore';

export default function OwnerScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const { db } = useDatabase();
  const { data: invoices } = useLocalTable('salesInvoices');
  const { data: purchases } = useLocalTable('purchaseInvoices');
  const { data: customers } = useLocalTable('customers');
  const { data: accounts } = useLocalTable('accounts');

  const [activeTab, setActiveTab] = useState('dashboard');
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editSubId, setEditSubId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ user: '', type: 'شهري', startDate: '', endDate: '', phone: '' });

  useFocusEffect(useCallback(() => {
    loadData();
  }, [db]));

  const loadData = async () => {
    if (!db) return;
    try {
      await db.execAsync(`CREATE TABLE IF NOT EXISTS subscriptions (id TEXT PRIMARY KEY, user TEXT, type TEXT, startDate TEXT, endDate TEXT, phone TEXT, active INTEGER DEFAULT 1)`);
      const result = await db.getAllAsync('SELECT * FROM subscriptions ORDER BY startDate DESC');
      setSubscriptions(result);
    } catch (e) { console.log('Load error:', e); }
  };

  const totalSales = invoices.reduce((s: number, i: any) => s + (i.total || 0), 0);
  const totalPurchases = purchases.reduce((s: number, i: any) => s + (i.total || 0), 0);
  const profit = totalSales - totalPurchases;

  const handleSaveSub = async () => {
    if (!editForm.user.trim()) { Alert.alert('خطأ', 'أدخل اسم المستخدم'); return; }
    if (!db) return;
    if (editSubId) {
      await db.runAsync('UPDATE subscriptions SET user=?, type=?, startDate=?, endDate=?, phone=? WHERE id=?', [editForm.user, editForm.type, editForm.startDate, editForm.endDate, editForm.phone, editSubId]);
    } else {
      const id = 'sub-' + Date.now();
      await db.runAsync('INSERT INTO subscriptions (id, user, type, startDate, endDate, phone) VALUES (?,?,?,?,?,?)', [id, editForm.user, editForm.type, editForm.startDate, editForm.endDate, editForm.phone]);
    }
    setShowForm(false); setEditSubId(null);
    setEditForm({ user: '', type: 'شهري', startDate: '', endDate: '', phone: '' });
    loadData();
  };

  const handleDeleteSub = async (id: string) => {
    Alert.alert('حذف', 'حذف الاشتراك؟', [{ text: 'إلغاء' }, { text: 'حذف', onPress: async () => {
      await db.runAsync('UPDATE subscriptions SET active=0 WHERE id=?', [id]);
      loadData();
    }}]);
  };

  const tabs = [
    { key: 'dashboard', icon: '📊', label: 'لوحة التحكم' },
    { key: 'subscriptions', icon: '🔑', label: 'الاشتراكات' },
    { key: 'stats', icon: '📈', label: 'إحصائيات' },
  ];

  return (
    <View style={[st.c, { paddingTop: insets.top }]}>
      <View style={st.h}>
        <TouchableOpacity onPress={() => router.back()}><Text style={st.bb}>←</Text></TouchableOpacity>
        <Text style={st.t}>👑 لوحة المالك</Text>
        <TouchableOpacity onPress={() => { setEditSubId(null); setEditForm({ user: '', type: 'شهري', startDate: '', endDate: '', phone: '' }); setShowForm(true); }}><Text style={st.add}>+</Text></TouchableOpacity>
      </View>

      <View style={st.tabs}>
        {tabs.map(tab => (
          <TouchableOpacity key={tab.key} style={[st.tab, activeTab === tab.key && st.tabA]} onPress={() => setActiveTab(tab.key)}>
            <Text style={[st.tabT, activeTab === tab.key && st.tabTA]}>{tab.icon} {tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {activeTab === 'dashboard' && (
          <View>
            <View style={st.stats}>
              <View style={st.stat}><Text style={st.sv}>{totalSales.toLocaleString()} ﷼</Text><Text style={st.sl}>إجمالي المبيعات</Text></View>
              <View style={st.stat}><Text style={st.sv}>{totalPurchases.toLocaleString()} ﷼</Text><Text style={st.sl}>إجمالي المشتريات</Text></View>
              <View style={[st.stat, { borderColor: profit >= 0 ? '#10B981' : '#EF4444' }]}><Text style={[st.sv, { color: profit >= 0 ? '#10B981' : '#EF4444' }]}>{profit.toLocaleString()} ﷼</Text><Text style={st.sl}>صافي الربح</Text></View>
            </View>
            <View style={st.infoBox}>
              <Text style={st.infoTitle}>📊 ملخص النظام</Text>
              <Text style={st.infoText}>👥 العملاء: {customers.length}</Text>
              <Text style={st.infoText}>📚 الحسابات: {accounts.length}</Text>
              <Text style={st.infoText}>🔑 الاشتراكات: {subscriptions.length}</Text>
            </View>
          </View>
        )}

        {activeTab === 'subscriptions' && (
          <View>
            {showForm && (
              <View style={st.form}>
                <Text style={st.fl}>اسم المستخدم *</Text>
                <TextInput style={st.fi} value={editForm.user} onChangeText={v => setEditForm({ ...editForm, user: v })} placeholder="الاسم" placeholderTextColor="#666" />
                <Text style={st.fl}>نوع الاشتراك</Text>
                <View style={st.typeRow}>
                  {['شهري', 'سنوي', 'دائم'].map(t => (
                    <TouchableOpacity key={t} style={[st.typeBtn, editForm.type === t && st.typeBtnA]} onPress={() => setEditForm({ ...editForm, type: t })}>
                      <Text style={[st.typeText, editForm.type === t && st.typeTextA]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <View style={{ flex: 1 }}><Text style={st.fl}>من تاريخ</Text><TextInput style={st.fi} value={editForm.startDate} onChangeText={v => setEditForm({ ...editForm, startDate: v })} placeholder="YYYY-MM-DD" placeholderTextColor="#666" /></View>
                  <View style={{ flex: 1 }}><Text style={st.fl}>إلى تاريخ</Text><TextInput style={st.fi} value={editForm.endDate} onChangeText={v => setEditForm({ ...editForm, endDate: v })} placeholder="YYYY-MM-DD" placeholderTextColor="#666" /></View>
                </View>
                <Text style={st.fl}>رقم الهاتف</Text>
                <TextInput style={st.fi} value={editForm.phone} onChangeText={v => setEditForm({ ...editForm, phone: v })} placeholder="الهاتف" placeholderTextColor="#666" keyboardType="phone-pad" />
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                  <TouchableOpacity style={[st.btn, { flex: 1, backgroundColor: '#D4AF37' }]} onPress={handleSaveSub}><Text style={[st.btnT, { color: '#000' }]}>💾 حفظ</Text></TouchableOpacity>
                  <TouchableOpacity style={[st.btn, { flex: 1, backgroundColor: '#2a3550' }]} onPress={() => { setShowForm(false); setEditSubId(null); }}><Text style={[st.btnT, { color: '#FFF' }]}>إلغاء</Text></TouchableOpacity>
                </View>
              </View>
            )}
            <FlatList data={subscriptions} keyExtractor={(i: any) => i.id}
              renderItem={({ item }: any) => (
                <View style={st.card}>
                  <View style={{ flex: 1 }}>
                    <Text style={st.cn}>{item.user}</Text>
                    <Text style={st.cd}>{item.type} | {item.startDate} → {item.endDate}</Text>
                    <Text style={st.cp}>📞 {item.phone || '-'}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity onPress={() => { setEditSubId(item.id); setEditForm({ user: item.user, type: item.type, startDate: item.startDate, endDate: item.endDate, phone: item.phone || '' }); setShowForm(true); }}><Text>✏️</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteSub(item.id)}><Text>🗑️</Text></TouchableOpacity>
                  </View>
                </View>
              )}
              ListEmptyComponent={<Text style={st.empty}>لا توجد اشتراكات</Text>}
            />
          </View>
        )}

        {activeTab === 'stats' && (
          <View style={st.infoBox}>
            <Text style={st.infoTitle}>📈 إحصائيات متقدمة</Text>
            <Text style={st.infoText}>عدد الفواتير: {invoices.length}</Text>
            <Text style={st.infoText}>عدد فواتير الشراء: {purchases.length}</Text>
            <Text style={st.infoText}>متوسط المبيعات: {invoices.length > 0 ? (totalSales / invoices.length).toLocaleString() : 0} ﷼</Text>
            <Text style={st.infoText}>نسبة الربح: {totalSales > 0 ? ((profit / totalSales) * 100).toFixed(1) : 0}%</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  c: { flex: 1, backgroundColor: '#0A1128' },
  h: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  bb: { fontSize: 24, color: '#D4AF37' }, t: { color: '#D4AF37', fontSize: 20, fontWeight: 'bold' }, add: { fontSize: 28, color: '#D4AF37' },
  tabs: { flexDirection: 'row', gap: 6, paddingHorizontal: 16, marginBottom: 8 },
  tab: { flex: 1, padding: 10, borderRadius: 10, backgroundColor: '#16213E', alignItems: 'center', borderWidth: 1, borderColor: '#2a3550' },
  tabA: { borderColor: '#D4AF37', backgroundColor: '#D4AF3710' }, tabT: { color: '#94a3b8', fontSize: 12 }, tabTA: { color: '#D4AF37', fontWeight: 'bold' },
  stats: { flexDirection: 'row', gap: 6, marginBottom: 16 },
  stat: { flex: 1, backgroundColor: '#16213E', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#2a3550' },
  sv: { color: '#D4AF37', fontSize: 14, fontWeight: 'bold' }, sl: { color: '#94a3b8', fontSize: 10, marginTop: 4 },
  infoBox: { backgroundColor: '#16213E', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#2a3550' },
  infoTitle: { color: '#D4AF37', fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  infoText: { color: '#FFF', fontSize: 13, marginBottom: 6 },
  form: { backgroundColor: '#16213E', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#2a3550' },
  fl: { color: '#94a3b8', fontSize: 13, marginBottom: 4, marginTop: 8 },
  fi: { backgroundColor: '#0A1128', color: '#FFF', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#2a3550', textAlign: 'right' },
  typeRow: { flexDirection: 'row', gap: 6 }, typeBtn: { padding: 8, borderRadius: 8, backgroundColor: '#0A1128', borderWidth: 1, borderColor: '#2a3550' },
  typeBtnA: { borderColor: '#D4AF37', backgroundColor: '#D4AF3720' }, typeText: { color: '#94a3b8', fontSize: 12 }, typeTextA: { color: '#D4AF37', fontWeight: 'bold' },
  btn: { padding: 12, borderRadius: 8, alignItems: 'center' }, btnT: { fontWeight: 'bold', fontSize: 14 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16213E', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#2a3550' },
  cn: { color: '#FFF', fontSize: 14, fontWeight: 'bold' }, cd: { color: '#94a3b8', fontSize: 11, marginTop: 2 }, cp: { color: '#10B981', fontSize: 11, marginTop: 2 },
  empty: { color: '#666', textAlign: 'center', marginTop: 40 },
});
