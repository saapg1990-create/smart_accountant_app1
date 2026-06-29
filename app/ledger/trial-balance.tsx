import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Alert, Modal, TextInput, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalTable } from '../../hooks/useLocalStore';
import { ControlButtons, ControlHeader } from '../../src/components/ui/ControlButtons';

export default function TrialBalanceScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const { data: accounts } = useLocalTable('accounts');
  const { data: entries } = useLocalTable('journalEntries');
  
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [accountEntries, setAccountEntries] = useState<any[]>([]);

  // فلترة القيود حسب الفترة
  const filteredEntries = entries.filter((e: any) => {
    if (dateFrom && e.date < dateFrom) return false;
    if (dateTo && e.date > dateTo) return false;
    return true;
  });

  // حساب الأرصدة لكل حساب
  const trialBalance = accounts.map((acc: any) => {
    let totalDebit = 0;
    let totalCredit = 0;
    
    filteredEntries.forEach((entry: any) => {
      (entry.lines || []).forEach((line: any) => {
        if (line.accountId === acc.id || line.accountName === acc.name) {
          totalDebit += line.debit || 0;
          totalCredit += line.credit || 0;
        }
      });
    });
    
    const balance = totalDebit - totalCredit;
    return { ...acc, totalDebit, totalCredit, balance };
  });

  const totalDebit = trialBalance.reduce((s: number, a: any) => s + a.totalDebit, 0);
  const totalCredit = trialBalance.reduce((s: number, a: any) => s + a.totalCredit, 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  // Drill Down - عرض تفاصيل الحساب
  const showAccountDetail = (account: any) => {
    const details: any[] = [];
    filteredEntries.forEach((entry: any) => {
      (entry.lines || []).forEach((line: any) => {
        if (line.accountId === account.id || line.accountName === account.name) {
          details.push({
            date: entry.date,
            number: entry.number,
            description: entry.description,
            debit: line.debit || 0,
            credit: line.credit || 0,
            refType: entry.refType,
            refId: entry.refId,
          });
        }
      });
    });
    setSelectedAccount(account);
    setAccountEntries(details);
    setShowDetail(true);
  };

  return (
    <View style={[st.c, { paddingTop: insets.top }]}><StatusBar barStyle="light-content" />
      <ControlHeader title="ميزان المراجعة" onBack={() => router.back()} />
      <ControlButtons showAdd={false} showEdit={false} showDelete={false} onPrint={() => Alert.alert('🖨️', 'جاري الطباعة')} />
      
      {/* فلتر التاريخ */}
      <TouchableOpacity style={st.filterBtn} onPress={() => setShowFilter(true)}>
        <Text style={st.filterText}>📅 {dateFrom || 'من'} - {dateTo || 'إلى'} | {isBalanced ? '✅ متوازن' : '❌ غير متوازن'}</Text>
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={st.ct}>
        {/* المجاميع */}
        <View style={st.summary}>
          <View style={st.sumItem}><Text style={st.sumLabel}>مدين</Text><Text style={[st.sumVal, { color: '#10B981' }]}>{totalDebit.toLocaleString()}</Text></View>
          <View style={st.divider} />
          <View style={st.sumItem}><Text style={st.sumLabel}>دائن</Text><Text style={[st.sumVal, { color: '#EF4444' }]}>{totalCredit.toLocaleString()}</Text></View>
          <View style={st.divider} />
          <View style={st.sumItem}><Text style={st.sumLabel}>الفرق</Text><Text style={[st.sumVal, { color: isBalanced ? '#10B981' : '#EF4444' }]}>{(totalDebit - totalCredit).toLocaleString()}</Text></View>
        </View>

        {/* جدول ميزان المراجعة */}
        <View style={st.table}>
          <View style={st.tableHead}>
            <Text style={[st.th, { flex: 2 }]}>الحساب</Text>
            <Text style={st.th}>مدين</Text>
            <Text style={st.th}>دائن</Text>
            <Text style={st.th}>الرصيد</Text>
          </View>
          
          {trialBalance.filter((a: any) => a.totalDebit > 0 || a.totalCredit > 0 || (a.balance || 0) !== 0).map((acc: any, i: number) => (
            <TouchableOpacity key={i} style={st.tr} onPress={() => showAccountDetail(acc)}>
              <View style={{ flex: 2 }}>
                <Text style={st.tdName}>{acc.code} - {acc.name}</Text>
                <Text style={st.tdType}>{acc.type}</Text>
              </View>
              <Text style={[st.td, { color: '#10B981' }]}>{acc.totalDebit > 0 ? acc.totalDebit.toLocaleString() : '-'}</Text>
              <Text style={[st.td, { color: '#EF4444' }]}>{acc.totalCredit > 0 ? acc.totalCredit.toLocaleString() : '-'}</Text>
              <Text style={[st.td, { color: acc.balance >= 0 ? '#10B981' : '#EF4444', fontWeight: 'bold' }]}>
                {acc.balance !== 0 ? acc.balance.toLocaleString() : '-'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Modal فلتر التاريخ */}
      <Modal visible={showFilter} animationType="slide" transparent>
        <View style={st.mo}><View style={st.mc}><View style={st.mh}><Text style={st.mt}>تحديد الفترة</Text><TouchableOpacity onPress={() => setShowFilter(false)}><Text style={st.mx}>✕</Text></TouchableOpacity></View>
        <View style={st.mb}>
          <Text style={st.fl}>من تاريخ</Text><TextInput style={st.fi} value={dateFrom} onChangeText={setDateFrom} placeholder="YYYY-MM-DD" placeholderTextColor="#666" />
          <Text style={st.fl}>إلى تاريخ</Text><TextInput style={st.fi} value={dateTo} onChangeText={setDateTo} placeholder="YYYY-MM-DD" placeholderTextColor="#666" />
          <View style={st.quickDates}>
            {['اليوم','الشهر','السنة'].map((d, i) => {
              const now = new Date();
              const dates: any = {'اليوم':[now.toISOString().split('T')[0],now.toISOString().split('T')[0]],'الشهر':[new Date(now.getFullYear(),now.getMonth(),1).toISOString().split('T')[0],now.toISOString().split('T')[0]],'السنة':[new Date(now.getFullYear(),0,1).toISOString().split('T')[0],now.toISOString().split('T')[0]]};
              return <TouchableOpacity key={i} style={st.qb} onPress={() => { setDateFrom(dates[d][0]); setDateTo(dates[d][1]); }}><Text style={st.qt}>{d}</Text></TouchableOpacity>;
            })}
          </View>
          <TouchableOpacity style={st.sb} onPress={() => setShowFilter(false)}><Text style={st.sbt}>✅ تطبيق</Text></TouchableOpacity>
        </View></View></View>
      </Modal>

      {/* Modal Drill Down - كشف حساب تفصيلي */}
      <Modal visible={showDetail} animationType="slide" transparent>
        <View style={st.mo}><View style={[st.mc, { maxHeight: '85%' }]}><View style={st.mh}><Text style={st.mt}>كشف حساب: {selectedAccount?.name}</Text><TouchableOpacity onPress={() => setShowDetail(false)}><Text style={st.mx}>✕</Text></TouchableOpacity></View>
        <View style={st.mb}>
          <View style={st.detailSummary}>
            <Text style={st.detailCode}>{selectedAccount?.code} | {selectedAccount?.type}</Text>
            <Text style={st.detailBal}>الرصيد: {(selectedAccount?.balance || 0).toLocaleString()} ﷼</Text>
          </View>
          {accountEntries.length === 0 ? (
            <Text style={st.noData}>لا توجد حركات</Text>
          ) : (
            <FlatList
              data={accountEntries}
              keyExtractor={(_, i) => i.toString()}
              renderItem={({ item }: any) => (
                <TouchableOpacity style={st.entryCard}>
                  <View style={st.entryHead}>
                    <Text style={st.entryNum}>{item.number}</Text>
                    <Text style={st.entryDate}>{item.date}</Text>
                  </View>
                  <Text style={st.entryDesc}>{item.description}</Text>
                  <View style={st.entryAmounts}>
                    {item.debit > 0 && <Text style={[st.entryAmt, { color: '#10B981' }]}>مدين: {item.debit.toLocaleString()} ﷼</Text>}
                    {item.credit > 0 && <Text style={[st.entryAmt, { color: '#EF4444' }]}>دائن: {item.credit.toLocaleString()} ﷼</Text>}
                  </View>
                </TouchableOpacity>
              )}
              style={{ maxHeight: 400 }}
            />
          )}
        </View></View></View>
      </Modal>
    </View>
  );
}
const st = StyleSheet.create({
  c: { flex: 1, backgroundColor: '#0A1128' }, ct: { padding: 14 },
  filterBtn: { backgroundColor: '#16213E', borderRadius: 12, padding: 12, alignItems: 'center', marginBottom: 12, marginHorizontal: 14, borderWidth: 1, borderColor: '#2a3550' }, filterText: { color: '#D4AF37', fontSize: 13 },
  summary: { flexDirection: 'row', backgroundColor: '#16213E', borderRadius: 14, padding: 16, marginBottom: 14, marginHorizontal: 14, borderWidth: 1, borderColor: '#2a3550' }, sumItem: { flex: 1, alignItems: 'center' }, sumLabel: { color: '#94a3b8', fontSize: 12, marginBottom: 4 }, sumVal: { fontSize: 16, fontWeight: 'bold' }, divider: { width: 1, backgroundColor: '#2a3550' },
  table: { backgroundColor: '#16213E', borderRadius: 14, overflow: 'hidden', marginHorizontal: 14, borderWidth: 1, borderColor: '#2a3550' },
  tableHead: { flexDirection: 'row', backgroundColor: '#1a2240', padding: 12 }, th: { flex: 1, color: '#D4AF37', fontSize: 12, fontWeight: 'bold', textAlign: 'center' },
  tr: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#2a3550' }, td: { flex: 1, color: '#FFF', fontSize: 12, textAlign: 'center' }, tdName: { color: '#FFF', fontSize: 12, fontWeight: 'bold' }, tdType: { color: '#94a3b8', fontSize: 10 },
  mo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }, mc: { backgroundColor: '#16213E', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '85%' }, mh: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#2a3550' }, mt: { color: '#D4AF37', fontSize: 18, fontWeight: 'bold' }, mx: { color: '#EF4444', fontSize: 22, fontWeight: 'bold' }, mb: { padding: 16 },
  fl: { color: '#94a3b8', fontSize: 13, marginBottom: 6, marginTop: 12 }, fi: { backgroundColor: '#0A1128', borderRadius: 10, padding: 12, color: '#FFF', borderWidth: 1, borderColor: '#2a3550', fontSize: 14 },
  quickDates: { flexDirection: 'row', gap: 8, marginTop: 12 }, qb: { flex: 1, backgroundColor: '#0A1128', borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#2a3550' }, qt: { color: '#94a3b8', fontSize: 12 },
  sb: { backgroundColor: '#D4AF37', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 20 }, sbt: { color: '#0A1128', fontSize: 16, fontWeight: 'bold' },
  detailSummary: { backgroundColor: '#D4AF37' + '15', borderRadius: 12, padding: 14, marginBottom: 12 }, detailCode: { color: '#D4AF37', fontSize: 14, fontWeight: 'bold', marginBottom: 4 }, detailBal: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  entryCard: { backgroundColor: '#0A1128', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#2a3550' }, entryHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }, entryNum: { color: '#D4AF37', fontSize: 12, fontWeight: 'bold' }, entryDate: { color: '#94a3b8', fontSize: 11 }, entryDesc: { color: '#FFF', fontSize: 13, marginBottom: 6 }, entryAmounts: { flexDirection: 'row', gap: 12 }, entryAmt: { fontSize: 12, fontWeight: 'bold' },
  noData: { color: '#94a3b8', textAlign: 'center', padding: 20 },
});
