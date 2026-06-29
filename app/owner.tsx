import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, StatusBar, Alert, Modal, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalTable } from '../hooks/useLocalStore';

const MASTER_PASSWORD = 'admin123';

export default function OwnerDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: accounts } = useLocalTable('accounts');
  const { data: customers } = useLocalTable('customers');
  const { data: suppliers } = useLocalTable('suppliers');
  const { data: invoices } = useLocalTable('salesInvoices');
  const { data: purchases } = useLocalTable('purchaseInvoices');
  const { data: items } = useLocalTable('items');
  
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [subscriptions, setSubscriptions] = useState([
    { id: '1', user: 'أحمد محمد', type: 'نصف سنوي', startDate: '2026-01-01', endDate: '2026-07-01', active: true, phone: '711111111' },
    { id: '2', user: 'شركة النور', type: 'سنوي', startDate: '2026-03-15', endDate: '2027-03-15', active: true, phone: '733222222' },
    { id: '3', user: 'محمد سالم', type: 'نصف سنوي', startDate: '2026-02-01', endDate: '2026-08-01', active: false, phone: '712444444' },
  ]);
  const [editSubId, setEditSubId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ user: '', type: 'نصف سنوي', startDate: '', endDate: '', phone: '' });

  const totalSales = (invoices || []).reduce((s: number, i: any) => s + (i.total || 0), 0);
  const totalPurchases = (purchases || []).reduce((s: number, p: any) => s + (p.total || 0), 0);
  const activeSubs = subscriptions.filter(s => s.active).length;

  const handleUnlock = () => {
    if (password === MASTER_PASSWORD) { setIsUnlocked(true); setPassword(''); }
    else { Alert.alert('❌ خطأ', 'كلمة المرور غير صحيحة'); }
  };

  const generateCode = () => {
    const code = 'ACT-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    setGeneratedCode(code);
  };

  const handleToggleSubscription = (id: string) => {
    setSubscriptions(subs => subs.map(s => s.id === id ? { ...s, active: !s.active } : s));
  };

  const handleDeleteSubscription = (id: string) => {
    Alert.alert('حذف', 'هل أنت متأكد من حذف هذا الاشتراك؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: () => setSubscriptions(subs => subs.filter(s => s.id !== id)) }
    ]);
  };

  const handleEditSubscription = (sub: any) => {
    setEditSubId(sub.id);
    setEditForm({ user: sub.user, type: sub.type, startDate: sub.startDate, endDate: sub.endDate, phone: sub.phone || '' });
  };

  const handleSaveEdit = () => {
    setSubscriptions(subs => subs.map(s => s.id === editSubId ? { ...s, ...editForm } : s));
    setEditSubId(null);
  };

  const handleBroadcast = () => {
    if (!broadcastMsg.trim()) { Alert.alert('خطأ', 'اكتب نص الإشعار'); return; }
    Alert.alert('✅ تم الإرسال', 'تم إرسال الإشعار الجماعي لجميع المستخدمين');
    setBroadcastMsg('');
    setShowBroadcastModal(false);
  };

  if (!isUnlocked) {
    return (
      <View style={[st.c, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" />
        <View style={st.h}><TouchableOpacity onPress={() => router.back()}><Text style={st.bt}>←</Text></TouchableOpacity><Text style={st.t}>🔒 لوحة تحكم المالك</Text><View style={{ width: 36 }} /></View>
        <View style={st.lockScreen}>
          <Text style={st.lockIcon}>🔐</Text>
          <Text style={st.lockTitle}>كلمة مرور المالك</Text>
          <TextInput style={st.lockInput} value={password} onChangeText={setPassword} placeholder="أدخل كلمة المرور" placeholderTextColor="#666" secureTextEntry />
          <TouchableOpacity style={st.lockBtn} onPress={handleUnlock}><Text style={st.lockBtnText}>🔓 فتح</Text></TouchableOpacity>
          <Text style={st.hint}>كلمة المرور الافتراضية: admin123</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[st.c, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      
      <View style={st.h}>
        <TouchableOpacity onPress={() => router.back()}><Text style={st.bt}>←</Text></TouchableOpacity>
        <Text style={st.t}>👑 لوحة تحكم المالك</Text>
        <TouchableOpacity onPress={() => setIsUnlocked(false)}><Text style={st.logout}>🔒</Text></TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={st.ct}>
        
        {/* إحصائيات */}
        <Text style={st.st}>📊 إحصائيات النظام</Text>
        <View style={st.statsGrid}>
          {[
            { icon: '📚', label: 'الحسابات', value: accounts.length, color: '#D4AF37' },
            { icon: '👥', label: 'العملاء', value: customers.length, color: '#10B981' },
            { icon: '🏪', label: 'الموردين', value: suppliers.length, color: '#3B82F6' },
            { icon: '📄', label: 'فواتير البيع', value: invoices.length, color: '#7C3AED' },
            { icon: '📋', label: 'فواتير الشراء', value: purchases.length, color: '#F59E0B' },
            { icon: '📦', label: 'الأصناف', value: items.length, color: '#EF4444' },
            { icon: '💰', label: 'المبيعات', value: totalSales.toLocaleString() + ' ﷼', color: '#06B6D4' },
            { icon: '💳', label: 'المشتريات', value: totalPurchases.toLocaleString() + ' ﷼', color: '#8B5CF6' },
            { icon: '💎', label: 'مشتركين نشطين', value: activeSubs, color: '#10B981' },
          ].map((stat, i) => (
            <View key={i} style={st.statCard}>
              <Text style={st.statIcon}>{stat.icon}</Text>
              <Text style={[st.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={st.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* أزرار التحكم */}
        <Text style={st.st}>⚡ إجراءات المالك</Text>
        <View style={st.controlRow}>
          <TouchableOpacity style={[st.ctrlBtn, { backgroundColor: '#10B98120', borderColor: '#10B98140' }]} onPress={() => { generateCode(); setShowGenerateModal(true); }}>
            <Text style={st.ctrlIcon}>🔑</Text><Text style={[st.ctrlLabel, { color: '#10B981' }]}>توليد رمز تفعيل</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[st.ctrlBtn, { backgroundColor: '#3B82F620', borderColor: '#3B82F640' }]} onPress={() => setShowBroadcastModal(true)}>
            <Text style={st.ctrlIcon}>📢</Text><Text style={[st.ctrlLabel, { color: '#3B82F6' }]}>إشعار جماعي</Text>
          </TouchableOpacity>
        </View>
        <View style={st.controlRow}>
          <TouchableOpacity style={[st.ctrlBtn, { backgroundColor: '#F59E0B20', borderColor: '#F59E0B40' }]} onPress={() => setShowUpdateModal(true)}>
            <Text style={st.ctrlIcon}>🔄</Text><Text style={[st.ctrlLabel, { color: '#F59E0B' }]}>رفع تحديث</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[st.ctrlBtn, { backgroundColor: '#EF444420', borderColor: '#EF444440' }]} onPress={() => Alert.alert('⚠️', 'هل أنت متأكد من مسح جميع البيانات؟', [{ text: 'نعم', style: 'destructive' }, { text: 'لا' }])}>
            <Text style={st.ctrlIcon}>🗑️</Text><Text style={[st.ctrlLabel, { color: '#EF4444' }]}>مسح البيانات</Text>
          </TouchableOpacity>
        </View>

        {/* إدارة الاشتراكات */}
        <Text style={st.st}>💎 إدارة الاشتراكات</Text>
        <TouchableOpacity style={st.addSubBtn} onPress={() => {
          setEditSubId('new');
          setEditForm({ user: '', type: 'نصف سنوي', startDate: new Date().toISOString().split('T')[0], endDate: '', phone: '' });
        }}>
          <Text style={st.addSubText}>➕ إضافة مشترك جديد</Text>
        </TouchableOpacity>

        {subscriptions.map(sub => (
          <View key={sub.id} style={st.subCard}>
            {editSubId === sub.id ? (
              <View>
                <TextInput style={st.fi} value={editForm.user} onChangeText={v => setEditForm({ ...editForm, user: v })} placeholder="اسم المشترك" placeholderTextColor="#666" />
                <View style={st.rw}>
                  <TextInput style={[st.fi, st.hf]} value={editForm.phone} onChangeText={v => setEditForm({ ...editForm, phone: v })} placeholder="رقم الهاتف" placeholderTextColor="#666" />
                  <TextInput style={[st.fi, st.hf]} value={editForm.type} onChangeText={v => setEditForm({ ...editForm, type: v })} placeholder="النوع" placeholderTextColor="#666" />
                </View>
                <View style={st.rw}>
                  <TextInput style={[st.fi, st.hf]} value={editForm.startDate} onChangeText={v => setEditForm({ ...editForm, startDate: v })} placeholder="من" placeholderTextColor="#666" />
                  <TextInput style={[st.fi, st.hf]} value={editForm.endDate} onChangeText={v => setEditForm({ ...editForm, endDate: v })} placeholder="إلى" placeholderTextColor="#666" />
                </View>
                <View style={st.editActions}>
                  <TouchableOpacity style={st.saveEditBtn} onPress={handleSaveEdit}><Text style={st.saveEditText}>💾 حفظ</Text></TouchableOpacity>
                  <TouchableOpacity style={st.cancelEditBtn} onPress={() => setEditSubId(null)}><Text style={st.cancelEditText}>إلغاء</Text></TouchableOpacity>
                </View>
              </View>
            ) : (
              <View>
                <View style={st.subHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={st.subUser}>👤 {sub.user}</Text>
                    <Text style={st.subPhone}>📞 {sub.phone || 'لا يوجد'}</Text>
                    <Text style={st.subType}>{sub.type}</Text>
                    <Text style={st.subDate}>📅 {sub.startDate} → {sub.endDate}</Text>
                  </View>
                  <View style={st.subActions}>
                    <TouchableOpacity onPress={() => handleToggleSubscription(sub.id)}>
                      <Text style={[st.subStatus, { color: sub.active ? '#10B981' : '#EF4444' }]}>{sub.active ? '✅ نشط' : '❌ موقوف'}</Text>
                    </TouchableOpacity>
                    <View style={st.subBtns}>
                      <TouchableOpacity style={st.editBtn} onPress={() => handleEditSubscription(sub)}><Text style={st.editBtnText}>✏️</Text></TouchableOpacity>
                      <TouchableOpacity style={st.delBtn} onPress={() => handleDeleteSubscription(sub.id)}><Text style={st.delBtnText}>🗑️</Text></TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </View>
        ))}

        {/* إضافة مشترك جديد */}
        {editSubId === 'new' && (
          <View style={st.subCard}>
            <View>
              <TextInput style={st.fi} value={editForm.user} onChangeText={v => setEditForm({ ...editForm, user: v })} placeholder="اسم المشترك *" placeholderTextColor="#666" />
              <View style={st.rw}>
                <TextInput style={[st.fi, st.hf]} value={editForm.phone} onChangeText={v => setEditForm({ ...editForm, phone: v })} placeholder="رقم الهاتف" placeholderTextColor="#666" />
                <TextInput style={[st.fi, st.hf]} value={editForm.type} onChangeText={v => setEditForm({ ...editForm, type: v })} placeholder="نصف سنوي/سنوي" placeholderTextColor="#666" />
              </View>
              <View style={st.rw}>
                <TextInput style={[st.fi, st.hf]} value={editForm.startDate} onChangeText={v => setEditForm({ ...editForm, startDate: v })} placeholder="تاريخ البداية" placeholderTextColor="#666" />
                <TextInput style={[st.fi, st.hf]} value={editForm.endDate} onChangeText={v => setEditForm({ ...editForm, endDate: v })} placeholder="تاريخ النهاية" placeholderTextColor="#666" />
              </View>
              <View style={st.editActions}>
                <TouchableOpacity style={st.saveEditBtn} onPress={() => {
                  if (!editForm.user) { Alert.alert('خطأ', 'أدخل اسم المشترك'); return; }
                  setSubscriptions([...subscriptions, { id: Date.now().toString(), user: editForm.user, type: editForm.type, startDate: editForm.startDate, endDate: editForm.endDate, active: true, phone: editForm.phone }]);
                  setEditSubId(null);
                }}><Text style={st.saveEditText}>💾 إضافة</Text></TouchableOpacity>
                <TouchableOpacity style={st.cancelEditBtn} onPress={() => setEditSubId(null)}><Text style={st.cancelEditText}>إلغاء</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal توليد رمز تفعيل */}
      <Modal visible={showGenerateModal} animationType="slide" transparent>
        <View style={st.mo}><View style={st.mc}><View style={st.mh}><Text style={st.mt}>🔑 رمز التفعيل الجديد</Text><TouchableOpacity onPress={() => setShowGenerateModal(false)}><Text style={st.mx}>✕</Text></TouchableOpacity></View>
          <View style={st.modalBody}>
            <Text style={st.codeText}>{generatedCode}</Text>
            <Text style={st.codeHint}>انسخ هذا الرمز وأرسله للمستخدم للتفعيل</Text>
            <TouchableOpacity style={st.modalBtn} onPress={() => { setShowGenerateModal(false); Alert.alert('✅', 'تم نسخ الرمز'); }}><Text style={st.modalBtnText}>✅ تم</Text></TouchableOpacity>
          </View></View></View>
      </Modal>

      {/* Modal إشعار جماعي */}
      <Modal visible={showBroadcastModal} animationType="slide" transparent>
        <View style={st.mo}><View style={st.mc}><View style={st.mh}><Text style={st.mt}>📢 إشعار جماعي</Text><TouchableOpacity onPress={() => setShowBroadcastModal(false)}><Text style={st.mx}>✕</Text></TouchableOpacity></View>
          <View style={st.modalBody}>
            <TextInput style={[st.fi, { height: 80 }]} value={broadcastMsg} onChangeText={setBroadcastMsg} placeholder="نص الإشعار لجميع المستخدمين..." placeholderTextColor="#666" multiline textAlignVertical="top" />
            <TouchableOpacity style={st.modalBtn} onPress={handleBroadcast}><Text style={st.modalBtnText}>📤 إرسال للجميع</Text></TouchableOpacity>
          </View></View></View>
      </Modal>

      {/* Modal رفع تحديث */}
      <Modal visible={showUpdateModal} animationType="slide" transparent>
        <View style={st.mo}><View style={st.mc}><View style={st.mh}><Text style={st.mt}>🔄 رفع تحديث</Text><TouchableOpacity onPress={() => setShowUpdateModal(false)}><Text style={st.mx}>✕</Text></TouchableOpacity></View>
          <View style={st.modalBody}>
            <Text style={st.fl}>رقم الإصدار</Text><TextInput style={st.fi} placeholder="مثال: 1.0.1" placeholderTextColor="#666" />
            <Text style={st.fl}>وصف التحديث</Text><TextInput style={[st.fi, { height: 60 }]} placeholder="ما الجديد في هذا التحديث؟" placeholderTextColor="#666" multiline />
            <TouchableOpacity style={st.modalBtn} onPress={() => { setShowUpdateModal(false); Alert.alert('✅', 'تم رفع التحديث'); }}><Text style={st.modalBtnText}>📤 رفع التحديث</Text></TouchableOpacity>
          </View></View></View>
      </Modal>
    </View>
  );
}

const st = StyleSheet.create({
  c: { flex: 1, backgroundColor: '#0A1128' },
  h: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  bt: { fontSize: 24, color: '#D4AF37', fontWeight: 'bold' },
  t: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  logout: { fontSize: 22 },
  ct: { padding: 14 },
  
  lockScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  lockIcon: { fontSize: 64, marginBottom: 16 },
  lockTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  lockInput: { backgroundColor: '#16213E', borderRadius: 12, padding: 14, color: '#FFF', borderWidth: 1, borderColor: '#2a3550', width: '100%', textAlign: 'center', fontSize: 18, marginBottom: 16 },
  lockBtn: { backgroundColor: '#D4AF37', borderRadius: 12, padding: 14, width: '100%', alignItems: 'center' },
  lockBtnText: { color: '#0A1128', fontSize: 16, fontWeight: 'bold' },
  hint: { color: '#6B7280', fontSize: 11, marginTop: 12 },
  
  st: { fontSize: 15, fontWeight: 'bold', color: '#D4AF37', marginBottom: 10, marginTop: 18 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  statCard: { width: '30%', backgroundColor: '#16213E', borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#2a3550' },
  statIcon: { fontSize: 18, marginBottom: 3 },
  statValue: { fontSize: 12, fontWeight: 'bold', marginBottom: 2 },
  statLabel: { color: '#94a3b8', fontSize: 9 },
  
  controlRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  ctrlBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, gap: 6 },
  ctrlIcon: { fontSize: 18 },
  ctrlLabel: { fontSize: 12, fontWeight: '600' },
  
  addSubBtn: { backgroundColor: '#D4AF37' + '20', borderRadius: 12, padding: 12, alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#D4AF37' + '40' },
  addSubText: { color: '#D4AF37', fontSize: 14, fontWeight: 'bold' },
  
  subCard: { backgroundColor: '#16213E', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#2a3550' },
  subHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  subUser: { color: '#FFF', fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  subPhone: { color: '#94a3b8', fontSize: 11, marginBottom: 2 },
  subType: { color: '#D4AF37', fontSize: 11, marginBottom: 2 },
  subDate: { color: '#6B7280', fontSize: 10 },
  subActions: { alignItems: 'flex-end', gap: 6 },
  subStatus: { fontSize: 13, fontWeight: 'bold' },
  subBtns: { flexDirection: 'row', gap: 6 },
  editBtn: { backgroundColor: '#3B82F6' + '20', padding: 6, borderRadius: 8 },
  editBtnText: { color: '#3B82F6', fontSize: 14 },
  delBtn: { backgroundColor: '#EF4444' + '20', padding: 6, borderRadius: 8 },
  delBtnText: { color: '#EF4444', fontSize: 14 },
  
  fi: { backgroundColor: '#0A1128', borderRadius: 10, padding: 10, color: '#FFF', borderWidth: 1, borderColor: '#2a3550', fontSize: 13, marginBottom: 6 },
  rw: { flexDirection: 'row', gap: 6 },
  hf: { flex: 1 },
  editActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  saveEditBtn: { flex: 1, backgroundColor: '#D4AF37', borderRadius: 10, padding: 10, alignItems: 'center' },
  saveEditText: { color: '#0A1128', fontSize: 14, fontWeight: 'bold' },
  cancelEditBtn: { flex: 1, backgroundColor: '#2a3550', borderRadius: 10, padding: 10, alignItems: 'center' },
  cancelEditText: { color: '#FFF', fontSize: 14 },
  
  mo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  mc: { backgroundColor: '#16213E', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  mh: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#2a3550' },
  mt: { color: '#D4AF37', fontSize: 18, fontWeight: 'bold' },
  mx: { color: '#EF4444', fontSize: 22, fontWeight: 'bold' },
  modalBody: { padding: 16 },
  fl: { color: '#94a3b8', fontSize: 13, marginBottom: 6, marginTop: 10 },
  codeText: { color: '#10B981', fontSize: 22, fontWeight: 'bold', textAlign: 'center', letterSpacing: 2, marginBottom: 8 },
  codeHint: { color: '#94a3b8', fontSize: 12, textAlign: 'center', marginBottom: 20 },
  modalBtn: { backgroundColor: '#D4AF37', borderRadius: 12, padding: 14, alignItems: 'center' },
  modalBtnText: { color: '#0A1128', fontSize: 16, fontWeight: 'bold' },
});
