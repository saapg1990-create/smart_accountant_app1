import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Share } from 'react-native';
import { eventBus, EVENTS } from '../../services/EventBus';

interface ControlButton {
  show: boolean;
  icon: string;
  label: string;
  color: string;
  bg: string;
  border: string;
  onPress: () => void;
}

interface Props {
  onAdd?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onSearch?: () => void;
  onPrint?: () => void;
  onRefresh?: () => void;
  onExport?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  showAdd?: boolean;
  showEdit?: boolean;
  showDelete?: boolean;
  showSearch?: boolean;
  showPrint?: boolean;
  showRefresh?: boolean;
  showExport?: boolean;
  showSave?: boolean;
  showCancel?: boolean;
  title?: string;
  screenName?: string;
}

export const ControlButtons: React.FC<Props> = ({
  onAdd, onEdit, onDelete, onSearch, onPrint, onRefresh, onExport, onSave, onCancel,
  showAdd=true, showEdit=true, showDelete=true, showSearch=true, showPrint=true, showRefresh=true, showExport=true,
  showSave=false, showCancel=false, title='التقرير', screenName=''
}) => {
  
  // التنفيذ مع إطلاق حدث عام
  const executeAndNotify = async (action: string, fn?: () => void) => {
    if (fn) {
      await fn();
      // إطلاق حدث عام لتحديث كل الشاشات
      eventBus.emit(EVENTS.DATA_SAVED, { screen: screenName, action });
      eventBus.emit(EVENTS.REFRESH_ALL);
    }
  };

  const handlePrint = () => {
    if (onPrint) onPrint();
    else Alert.alert('🖨️ طباعة', 'جاري تجهيز التقرير...');
  };

  const handleExport = async () => {
    if (onExport) onExport();
    else try { await Share.share({ message: `${title} - دفتر المحاسب الذكي 💎` }); } catch (e) {}
  };

  const handleRefresh = () => {
    if (onRefresh) onRefresh();
    eventBus.emit(EVENTS.REFRESH_ALL);
  };

  const buttons: ControlButton[] = [
    { show: showAdd, icon: '➕', label: 'إضافة', color: '#10B981', bg: '#10B98120', border: '#10B98140', onPress: () => onAdd?.() },
    { show: showEdit, icon: '✏️', label: 'تعديل', color: '#3B82F6', bg: '#3B82F620', border: '#3B82F640', onPress: () => Alert.alert('✏️', 'اختر عنصراً للتعديل') },
    { show: showDelete, icon: '🗑️', label: 'حذف', color: '#EF4444', bg: '#EF444420', border: '#EF444440', onPress: () => Alert.alert('🗑️', 'اختر عنصراً للحذف') },
    { show: showSave, icon: '💾', label: 'حفظ', color: '#8B5CF6', bg: '#8B5CF620', border: '#8B5CF640', onPress: () => executeAndNotify('save', onSave) },
    { show: showCancel, icon: '❌', label: 'إلغاء', color: '#6B7280', bg: '#6B728020', border: '#6B728040', onPress: onCancel || (() => {}) },
  ].filter(b => b.show);

  const toolButtons: ControlButton[] = [
    { show: showSearch, icon: '🔍', label: 'بحث', color: '#7C3AED', bg: '#7C3AED20', border: '#7C3AED40', onPress: onSearch || (() => {}) },
    { show: showPrint, icon: '🖨️', label: 'طباعة', color: '#F59E0B', bg: '#F59E0B20', border: '#F59E0B40', onPress: handlePrint },
    { show: showRefresh, icon: '🔄', label: 'تحديث', color: '#06B6D4', bg: '#06B6D420', border: '#06B6D440', onPress: handleRefresh },
    { show: showExport, icon: '📤', label: 'تصدير', color: '#EC4899', bg: '#EC489920', border: '#EC489940', onPress: handleExport },
  ].filter(b => b.show);

  const renderRow = (btns: ControlButton[]) => (
    <View style={st.row}>
      {btns.map((b, i) => (
        <TouchableOpacity key={i} style={[st.btn, { backgroundColor: b.bg, borderColor: b.border }]} onPress={b.onPress}>
          <Text style={st.icon}>{b.icon}</Text>
          <Text style={[st.label, { color: b.color }]}>{b.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={st.container}>
      {buttons.length > 0 && renderRow(buttons)}
      {toolButtons.length > 0 && renderRow(toolButtons)}
    </View>
  );
};

export const ControlHeader: React.FC<{ title: string; count?: number; onAdd?: () => void; onBack?: () => void; rightIcon?: string; onRightPress?: () => void }> = ({ title, count, onAdd, onBack, rightIcon, onRightPress }) => (
  <View style={st.header}>
    {onBack ? <TouchableOpacity onPress={onBack} style={st.backBtn}><Text style={st.backText}>←</Text></TouchableOpacity> : <View style={{ width: 36 }} />}
    <Text style={st.headerTitle}>{title}{count !== undefined ? ` (${count})` : ''}</Text>
    {onAdd ? <TouchableOpacity onPress={onAdd} style={st.addBtn}><Text style={st.addText}>+</Text></TouchableOpacity> : rightIcon ? <TouchableOpacity onPress={onRightPress} style={st.addBtn}><Text style={st.addText}>{rightIcon}</Text></TouchableOpacity> : <View style={{ width: 36 }} />}
  </View>
);

const st = StyleSheet.create({
  container: { paddingHorizontal: 10, marginBottom: 4 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, justifyContent: 'center', marginBottom: 4 },
  btn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 9, paddingVertical: 7, borderRadius: 8, borderWidth: 1, gap: 3 },
  icon: { fontSize: 13 }, label: { fontSize: 10, fontWeight: '600' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2a3550' },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#16213E', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#2a3550' },
  backText: { fontSize: 20, color: '#D4AF37', fontWeight: 'bold' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', flex: 1, textAlign: 'center' },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#D4AF37' + '20', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#D4AF37' },
  addText: { fontSize: 20, color: '#D4AF37', fontWeight: 'bold' },
});
