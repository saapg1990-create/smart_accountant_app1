import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Alert, Modal, TextInput, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalTable } from '../../hooks/useLocalStore';
import { PickerModal } from '../../src/components/ui/PickerModal';
import { ControlButtons, ControlHeader, SearchBar } from '../../src/components/ui/ControlButtons';
import { PostingEngine } from '../../src/services/PostingEngine';

export default function ReportsScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const { data: accounts } = useLocalTable('accounts');
  const { data: entries } = useLocalTable('journalEntries');
  const { data: invoices } = useLocalTable('salesInvoices');
  const { data: purchases } = useLocalTable('purchaseInvoices');
  const { data: items } = useLocalTable('items');
  const { data: customers } = useLocalTable('customers');
  const { data: suppliers } = useLocalTable('suppliers');
  const { data: vouchers } = useLocalTable('vouchers');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showAccountReport, setShowAccountReport] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showItemReport, setShowItemReport] = useState(false);
  const [reportTitle, setReportTitle] = useState('');
  const [reportResults, setReportResults] = useState<any>(null);
  const [reportType, setReportType] = useState<'summary' | 'detail'>('summary');
  
  // Picker states
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [showSupplierPicker, setShowSupplierPicker] = useState(false);
  
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilter, setShowFilter] = useState(false);

  // الإحصائيات المالية
  const totalAssets = accounts.filter((a: any) => a.type === 'أصل').reduce((s: number, a: any) => s + (a.balance || 0), 0);
  const totalLiabilities = accounts.filter((a: any) => a.type === 'خصم').reduce((s: number, a: any) => s + (a.balance || 0), 0);
  const totalEquity = accounts.filter((a: any) => a.type === 'ملكية').reduce((s: number, a: any) => s + (a.balance || 0), 0);
  const totalIncome = accounts.filter((a: any) => a.type === 'إيراد').reduce((s: number, a: any) => s + (a.balance || 0), 0);
  const totalExpenses = accounts.filter((a: any) => a.type === 'مصروف').reduce((s: number, a: any) => s + (a.balance || 0), 0);
  const netProfit = totalIncome - totalExpenses;
  const totalSales = (invoices || []).reduce((s: number, i: any) => s + (i.total || 0), 0);

  // تقارير النظام
  const reportCards = [
    { icon: '⚖️', label: 'ميزان المراجعة', desc: 'الأرصدة المدينة والدائنة', route: '/ledger/trial-balance', color: '#D4AF37' },
    { icon: '📚', label: 'الأستاذ العام', desc: 'حركة جميع الحسابات', route: '/ledger/account-statement', color: '#3B82F6' },
    { icon: '📈', label: 'قائمة الدخل', desc: 'الإيرادات والمصروفات', color: '#10B981', action: 'income' },
    { icon: '🏛️', label: 'الميزانية العمومية', desc: 'الأصول = الخصوم + الملكية', color: '#7C3AED', action: 'balance' },
    { icon: '💰', label: 'التدفقات النقدية', desc: 'حركة النقدية', color: '#F59E0B', action: 'cashflow' },
    { icon: '📊', label: 'تقرير المبيعات', desc: 'إحصائيات المبيعات', color: '#EF4444', action: 'sales' },
    { icon: '📦', label: 'حركة الأصناف', desc: 'تقرير المخزون', color: '#06B6D4', action: 'items' },
    { icon: '💱', label: 'تقارير العملات', desc: 'الأرصدة حسب العملة', route: '/ledger/currency-reports', color: '#8B5CF6' },
  ];

  // تقرير الحساب
  const generateAccountReport = () => {
    if (!selectedAccount) { Alert.alert('تنبيه', 'اختر حساباً'); return; }
    const subs = accounts.filter((a: any) => a.parentId === selectedAccount.id);
    const totalBalance = (selectedAccount.balance || 0) + subs.reduce((s: number, a: any) => s + (a.balance || 0), 0);
    
    setReportTitle(`تقرير: ${selectedAccount.name}`);
    setReportResults({ main: selectedAccount, subs, totalBalance, totalSubs: subs.length });
    setShowResults(true); setShowAccountReport(false);
  };

  // تقرير الأصناف
  const generateItemReport = () => {
    if (!selectedItem) { Alert.alert('تنبيه', 'اختر صنفاً'); return; }
    let results: any[] = [];
    
    invoices.forEach((inv: any) => {
      inv.items?.forEach((line: any) => {
        if (line.itemName?.includes(selectedItem.name)) {
          if (selectedCustomer && inv.customerName !== selectedCustomer.name) return;
          results.push({ date: inv.date, type: 'بيع', party: inv.customerName, ref: inv.number, qty: parseFloat(line.qty) || 0, price: parseFloat(line.price) || 0, total: parseFloat(line.total) || 0 });
        }
      });
    });
    
    purchases.forEach((inv: any) => {
      inv.items?.forEach((line: any) => {
        if (line.itemName?.includes(selectedItem.name)) {
          if (selectedSupplier && inv.supplierName !== selectedSupplier.name) return;
          results.push({ date: inv.date, type: 'شراء', party: inv.supplierName, ref: inv.number, qty: parseFloat(line.qty) || 0, price: parseFloat(line.price) || 0, total: parseFloat(line.total) || 0 });
        }
      });
    });

    if (reportType === 'summary') {
      const totalSold = results.filter(r => r.type === 'بيع').reduce((s, r) => s + r.qty, 0);
      const totalPurchased = results.filter(r => r.type === 'شراء').reduce((s, r) => s + r.qty, 0);
      const totalSoldValue = results.filter(r => r.type === 'بيع').reduce((s, r) => s + r.total, 0);
      results = [{ _summary: true, totalSold, totalPurchased, totalSoldValue, netQty: totalSold - totalPurchased }];
    }
    
    setReportTitle(`حركة الصنف: ${selectedItem.name}`);
    setReportResults(results);
    setShowResults(true); setShowItemReport(false);
  };

  // عرض التقارير السريعة
  const showQuickReport = (action: string) => {
    switch (action) {
      case 'income':
        setReportTitle('📈 قائمة الدخل');
        setReportResults({
          income: totalIncome, expenses: totalExpenses, netProfit,
          incomeAccounts: accounts.filter((a: any) => a.type === 'إيراد'),
          expenseAccounts: accounts.filter((a: any) => a.type === 'مصروف'),
        });
        setShowResults(true);
        break;
      case 'balance':
        setReportTitle('🏛️ الميزانية العمومية');
        setReportResults({ totalAssets, totalLiabilities, totalEquity });
        setShowResults(true);
        break;
      case 'sales':
        setReportTitle('📊 تقرير المبيعات');
        setReportResults({ totalSales, invoiceCount: invoices.length, invoices: invoices.slice(0, 10) });
        setShowResults(true);
        break;
      case 'items':
        setShowItemReport(true);
        break;
      default:
        Alert.alert('قيد التطوير', 'هذا التقرير قيد التطوير');
    }
  };

  return (
    <View style={[st.c, { paddingTop: insets.top }]}><StatusBar barStyle="light-content" />
      <ControlHeader title="التقارير والتنبيهات" onBack={() => router.back()} rightIcon="📅" onRightPress={() => setShowFilter(true)} />
      <ControlButtons 
        onAdd={() => setShowAccountReport(true)}
        showEdit={false} showDelete={false}
        onPrint={() => Alert.alert('🖨️', 'جاري طباعة جميع التقارير')}
        onExport={() => Alert.alert('📤', 'جاري تصدير التقارير')}
      />
      
      <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="🔍 بحث في التقارير..." />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={st.ct}>
        
        {/* بطاقات الإحصائيات */}
        <Text style={st.tt}>📊 ملخص الوضع المالي</Text>
        <View style={st.sr}>
          <View style={st.s}><Text style={st.sv}>{totalAssets.toLocaleString()}</Text><Text style={st.sl}>الأصول</Text></View>
          <View style={st.s}><Text style={st.sv}>{totalLiabilities.toLocaleString()}</Text><Text style={st.sl}>الخصوم</Text></View>
          <View style={[st.s, { borderColor: netProfit >= 0 ? '#10B981' : '#EF4444' }]}>
            <Text style={[st.sv, { color: netProfit >= 0 ? '#10B981' : '#EF4444' }]}>{netProfit.toLocaleString()}</Text>
            <Text style={st.sl}>صافي الربح</Text>
          </View>
        </View>
        
        <View style={st.sr}>
          <View style={st.s}><Text style={[st.sv, { color: '#10B981' }]}>{totalIncome.toLocaleString()}</Text><Text style={st.sl}>الإيرادات</Text></View>
          <View style={st.s}><Text style={[st.sv, { color: '#EF4444' }]}>{totalExpenses.toLocaleString()}</Text><Text style={st.sl}>المصروفات</Text></View>
          <View style={st.s}><Text style={st.sv}>{entries.length}</Text><Text style={st.sl}>قيود</Text></View>
        </View>

        {/* التقارير المتاحة */}
        <Text style={st.tt}>📋 التقارير</Text>
        <View style={st.grid}>
          {reportCards.filter(r => (r.label + r.desc).includes(searchQuery)).map((r, i) => (
            <TouchableOpacity key={i} style={[st.rc, { borderLeftColor: r.color }]}
              onPress={() => r.route ? router.push(r.route as any) : showQuickReport(r.action!)}>
              <Text style={st.ri}>{r.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={st.rl}>{r.label}</Text>
                <Text style={st.rd}>{r.desc}</Text>
              </View>
              <Text style={st.ar}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* تنبيهات */}
        <Text style={st.tt}>🔔 التنبيهات</Text>
        {items.filter((i: any) => (i.quantity || 0) <= (i.minQuantity || 10)).length > 0 && (
          <View style={[st.alert, { borderLeftColor: '#F59E0B' }]}>
            <Text style={st.alertTitle}>⚠️ أصناف منخفضة المخزون</Text>
            {items.filter((i: any) => (i.quantity || 0) <= (i.minQuantity || 10)).slice(0, 3).map((i: any, idx: number) => (
              <Text key={idx} style={st.alertItem}>📦 {i.name}: {i.quantity || 0} متبقي</Text>
            ))}
          </View>
        )}
        
        <View style={[st.alert, { borderLeftColor: '#3B82F6' }]}>
          <Text style={st.alertTitle}>💎 معلومات النظام</Text>
          <Text style={st.alertItem}>📚 الحسابات: {accounts.length}</Text>
          <Text style={st.alertItem}>📝 القيود: {entries.length}</Text>
          <Text style={st.alertItem}>📄 الفواتير: {invoices.length}</Text>
          <Text style={st.alertItem}>📦 الأصناف: {items.length}</Text>
        </View>
        
        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Modal تقرير حساب */}
      <Modal visible={showAccountReport} animationType="slide" transparent>
        <View style={st.mo}><View style={[st.mc, { maxHeight: '50%' }]}><View style={st.mh}><Text style={st.mt}>📊 تقرير حساب</Text><TouchableOpacity onPress={() => setShowAccountReport(false)}><Text style={st.mx}>✕</Text></TouchableOpacity></View>
        <View style={st.mb}>
          <Text style={st.fl}>اختيار الحساب</Text>
          <TouchableOpacity style={st.pk} onPress={() => setShowAccountPicker(true)}>
            <Text style={selectedAccount ? st.pkt : st.pkp}>{selectedAccount?.name || 'اختيار الحساب'}</Text><Text style={st.pka}>▼</Text></TouchableOpacity>
          <TouchableOpacity style={st.sb} onPress={generateAccountReport}><Text style={st.sbt}>🔍 عرض التقرير</Text></TouchableOpacity>
        </View></View></View>
      </Modal>

      {/* Modal تقرير الأصناف */}
      <Modal visible={showItemReport} animationType="slide" transparent>
        <View style={st.mo}><View style={[st.mc, { maxHeight: '80%' }]}><View style={st.mh}><Text style={st.mt}>📦 تقرير حركة الصنف</Text><TouchableOpacity onPress={() => setShowItemReport(false)}><Text style={st.mx}>✕</Text></TouchableOpacity></View>
        <ScrollView style={st.mb}>
          <Text style={st.fl}>الصنف *</Text>
          <TouchableOpacity style={st.pk} onPress={() => setShowItemPicker(true)}>
            <Text style={selectedItem ? st.pkt : st.pkp}>{selectedItem?.name || 'اختيار الصنف'}</Text><Text style={st.pka}>▼</Text></TouchableOpacity>
          <Text style={st.fl}>العميل (اختياري)</Text>
          <TouchableOpacity style={st.pk} onPress={() => setShowCustomerPicker(true)}>
            <Text style={selectedCustomer ? st.pkt : st.pkp}>{selectedCustomer?.name || 'كل العملاء'}</Text><Text style={st.pka}>▼</Text></TouchableOpacity>
          <Text style={st.fl}>المورد (اختياري)</Text>
          <TouchableOpacity style={st.pk} onPress={() => setShowSupplierPicker(true)}>
            <Text style={selectedSupplier ? st.pkt : st.pkp}>{selectedSupplier?.name || 'كل الموردين'}</Text><Text style={st.pka}>▼</Text></TouchableOpacity>
          <Text style={st.fl}>نوع التقرير</Text>
          <View style={st.tr}>
            <TouchableOpacity style={[st.tb, reportType === 'summary' && st.tbA]} onPress={() => setReportType('summary')}>
              <Text style={[st.tbt, reportType === 'summary' && st.tbtA]}>📊 إجمالي</Text></TouchableOpacity>
            <TouchableOpacity style={[st.tb, reportType === 'detail' && st.tbA]} onPress={() => setReportType('detail')}>
              <Text style={[st.tbt, reportType === 'detail' && st.tbtA]}>📋 تحليلي</Text></TouchableOpacity>
          </View>
          <TouchableOpacity style={st.sb} onPress={generateItemReport}><Text style={st.sbt}>🔍 عرض التقرير</Text></TouchableOpacity>
        </ScrollView></View></View>
      </Modal>

      {/* Modal عرض النتائج */}
      <Modal visible={showResults} animationType="slide" transparent>
        <View style={st.mo}><View style={[st.mc, { maxHeight: '85%' }]}><View style={st.mh}><Text style={st.mt}>{reportTitle}</Text><TouchableOpacity onPress={() => setShowResults(false)}><Text style={st.mx}>✕</Text></TouchableOpacity></View>
        <ScrollView style={st.mb}>
          {reportResults && (
            reportResults._summary ? (
              <View style={st.sumCard}>
                <Text style={st.sumTitle}>📊 ملخص إجمالي</Text>
                {reportResults.totalSold !== undefined && (
                  <>
                    <View style={st.sumRow}><Text style={st.sumLbl}>الكمية المباعة</Text><Text style={[st.sumVal, { color: '#10B981' }]}>{reportResults.totalSold}</Text></View>
                    <View style={st.sumRow}><Text style={st.sumLbl}>الكمية المشتراة</Text><Text style={[st.sumVal, { color: '#EF4444' }]}>{reportResults.totalPurchased}</Text></View>
                    <View style={st.sumRow}><Text style={st.sumLbl}>صافي الكمية</Text><Text style={st.sumVal}>{reportResults.netQty}</Text></View>
                  </>
                )}
                {reportResults.totalSoldValue !== undefined && (
                  <View style={st.sumRow}><Text style={st.sumLbl}>قيمة المبيعات</Text><Text style={[st.sumVal, { color: '#10B981' }]}>{reportResults.totalSoldValue.toLocaleString()} ﷼</Text></View>
                )}
                {reportResults.netProfit !== undefined && (
                  <>
                    <View style={st.sumRow}><Text style={st.sumLbl}>الإيرادات</Text><Text style={[st.sumVal, { color: '#10B981' }]}>{reportResults.income.toLocaleString()}</Text></View>
                    <View style={st.sumRow}><Text style={st.sumLbl}>المصروفات</Text><Text style={[st.sumVal, { color: '#EF4444' }]}>{reportResults.expenses.toLocaleString()}</Text></View>
                    <View style={st.sumRow}><Text style={st.sumLbl}>صافي الربح</Text><Text style={[st.sumVal, { color: reportResults.netProfit >= 0 ? '#10B981' : '#EF4444' }]}>{reportResults.netProfit.toLocaleString()}</Text></View>
                  </>
                )}
                {reportResults.totalAssets !== undefined && (
                  <>
                    <View style={st.sumRow}><Text style={st.sumLbl}>الأصول</Text><Text style={st.sumVal}>{reportResults.totalAssets.toLocaleString()}</Text></View>
                    <View style={st.sumRow}><Text style={st.sumLbl}>الخصوم</Text><Text style={st.sumVal}>{reportResults.totalLiabilities.toLocaleString()}</Text></View>
                    <View style={st.sumRow}><Text style={st.sumLbl}>حقوق الملكية</Text><Text style={st.sumVal}>{reportResults.totalEquity.toLocaleString()}</Text></View>
                  </>
                )}
              </View>
            ) : reportResults.main ? (
              <View>
                <View style={st.sumCard}>
                  <Text style={st.sumTitle}>الحساب الرئيسي</Text>
                  <Text style={st.sumVal}>{reportResults.main.name} ({reportResults.main.code})</Text>
                  <Text style={st.sumVal}>الرصيد: {(reportResults.main.balance || 0).toLocaleString()} ﷼</Text>
                </View>
                <Text style={st.tt}>الفروع ({reportResults.totalSubs})</Text>
                {reportResults.subs?.map((sub: any, i: number) => (
                  <View key={i} style={st.subRow}>
                    <Text style={st.subName}>{sub.code} - {sub.name}</Text>
                    <Text style={[st.subBal, { color: (sub.balance || 0) >= 0 ? '#10B981' : '#EF4444' }]}>{(sub.balance || 0).toLocaleString()}</Text>
                  </View>
                ))}
                <View style={st.totalRow}>
                  <Text style={st.totalLbl}>الإجمالي</Text><Text style={st.totalVal}>{reportResults.totalBalance.toLocaleString()} ﷼</Text>
                </View>
              </View>
            ) : Array.isArray(reportResults) ? (
              reportResults.map((item: any, i: number) => (
                <View key={i} style={st.itemCard}>
                  <View style={st.itemHead}><Text style={[st.itemType, { color: item.type === 'بيع' ? '#10B981' : '#EF4444' }]}>{item.type}</Text><Text style={st.itemDate}>{item.date}</Text></View>
                  <Text style={st.itemParty}>{item.party}</Text>
                  <Text style={st.itemInfo}>الكمية: {item.qty} | السعر: {item.price?.toLocaleString()} | الإجمالي: {item.total?.toLocaleString()} ﷼</Text>
                </View>
              ))
            ) : null
          )}
        </ScrollView></View></View>
      </Modal>

      <PickerModal visible={showAccountPicker} title="اختيار الحساب" data={accounts || []} displayField="name" subField="code" onSelect={(i: any) => { setSelectedAccount(i); setShowAccountPicker(false); }} onClose={() => setShowAccountPicker(false)} />
      <PickerModal visible={showItemPicker} title="اختيار الصنف" data={items || []} displayField="name" onSelect={(i: any) => { setSelectedItem(i); setShowItemPicker(false); }} onClose={() => setShowItemPicker(false)} />
      <PickerModal visible={showCustomerPicker} title="اختيار العميل" data={customers || []} displayField="name" onSelect={(i: any) => { setSelectedCustomer(i); setShowCustomerPicker(false); }} onClose={() => setShowCustomerPicker(false)} />
      <PickerModal visible={showSupplierPicker} title="اختيار المورد" data={suppliers || []} displayField="name" onSelect={(i: any) => { setSelectedSupplier(i); setShowSupplierPicker(false); }} onClose={() => setShowSupplierPicker(false)} />
    </View>
  );
}
const st = StyleSheet.create({
  c: { flex: 1, backgroundColor: '#0A1128' }, ct: { padding: 14 },
  sr: { flexDirection: 'row', gap: 6, marginBottom: 8 }, s: { flex: 1, backgroundColor: '#16213E', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#2a3550' }, sv: { color: '#D4AF37', fontSize: 14, fontWeight: 'bold', marginBottom: 3 }, sl: { color: '#94a3b8', fontSize: 10 },
  tt: { fontSize: 14, fontWeight: 'bold', color: '#D4AF37', marginBottom: 10, marginTop: 16 },
  grid: { gap: 6 },
  rc: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16213E', borderRadius: 14, padding: 14, marginBottom: 8, borderLeftWidth: 4, borderWidth: 1, borderColor: '#2a3550' }, ri: { fontSize: 26, marginRight: 12 }, rl: { color: '#FFF', fontSize: 14, fontWeight: 'bold', marginBottom: 2 }, rd: { color: '#94a3b8', fontSize: 11 }, ar: { fontSize: 20, color: '#D4AF37' },
  alert: { backgroundColor: '#16213E', borderRadius: 14, padding: 14, marginBottom: 10, borderLeftWidth: 4, borderWidth: 1, borderColor: '#2a3550' }, alertTitle: { color: '#FFF', fontSize: 14, fontWeight: 'bold', marginBottom: 8 }, alertItem: { color: '#94a3b8', fontSize: 12, marginBottom: 4 },
  mo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }, mc: { backgroundColor: '#16213E', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '85%' }, mh: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#2a3550' }, mt: { color: '#D4AF37', fontSize: 18, fontWeight: 'bold' }, mx: { color: '#EF4444', fontSize: 22, fontWeight: 'bold' }, mb: { padding: 16 },
  fl: { color: '#94a3b8', fontSize: 13, marginBottom: 6, marginTop: 12 }, pk: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0A1128', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#2a3550' }, pkt: { color: '#FFF', fontSize: 14, flex: 1 }, pkp: { color: '#666', fontSize: 14, flex: 1 }, pka: { color: '#D4AF37', fontSize: 12 },
  tr: { flexDirection: 'row', gap: 8 }, tb: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#0A1128', borderWidth: 1, borderColor: '#2a3550', alignItems: 'center' }, tbA: { borderColor: '#D4AF37', backgroundColor: '#D4AF37' + '20' }, tbt: { color: '#94a3b8', fontSize: 13 }, tbtA: { color: '#D4AF37', fontWeight: 'bold' },
  sb: { backgroundColor: '#D4AF37', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 20 }, sbt: { color: '#0A1128', fontSize: 16, fontWeight: 'bold' },
  sumCard: { backgroundColor: '#0A1128', borderRadius: 14, padding: 16, marginBottom: 12 }, sumTitle: { color: '#D4AF37', fontSize: 14, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }, sumLbl: { color: '#94a3b8', fontSize: 13 }, sumVal: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  subRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 10, backgroundColor: '#0A1128', borderRadius: 8, marginBottom: 4 }, subName: { color: '#FFF', fontSize: 12 }, subBal: { fontSize: 13, fontWeight: 'bold' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, backgroundColor: '#D4AF37' + '20', borderRadius: 10, marginTop: 8 }, totalLbl: { color: '#D4AF37', fontSize: 14, fontWeight: 'bold' }, totalVal: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  itemCard: { backgroundColor: '#0A1128', borderRadius: 10, padding: 12, marginBottom: 6 }, itemHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }, itemType: { fontSize: 14, fontWeight: 'bold' }, itemDate: { color: '#94a3b8', fontSize: 11 }, itemParty: { color: '#FFF', fontSize: 13, marginBottom: 4 }, itemInfo: { color: '#94a3b8', fontSize: 11 },
});
