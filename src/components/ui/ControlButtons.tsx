import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Share } from 'react-native';

interface ControlButtonsProps {
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
  editDisabled?: boolean;
  deleteDisabled?: boolean;
}

export const ControlButtons: React.FC<ControlButtonsProps> = ({
  onAdd, onEdit, onDelete, onSearch, onPrint, onRefresh, onExport, onSave, onCancel,
  showAdd = true, showEdit = true, showDelete = true,
  showSearch = true, showPrint = true, showRefresh = true, showExport = true,
  showSave = false, showCancel = false,
  title = 'التقرير', editDisabled = false, deleteDisabled = false,
}) => {

  const handlePrint = () => {
    if (onPrint) { onPrint(); return; }
    Alert.alert('🖨️ طباعة', 'جاري تجهيز التقرير للطباعة...');
  };

  const handleExport = async () => {
    if (onExport) { onExport(); return; }
    try {
      await Share.share({ message: `${title} - دفتر المحاسب الذكي 💎` });
    } catch (e) {
      Alert.alert('📤 تصدير', 'جاري تصدير البيانات...');
    }
  };

  const handleRefresh = () => {
    if (onRefresh) { onRefresh(); return; }
    Alert.alert('🔄 تحديث', 'جاري تحديث البيانات...');
  };

  const handleSearch = () => {
    if (onSearch) { onSearch(); return; }
  };

  // الصف الأول - العمليات الأساسية
  const mainButtons = [
    { show: showAdd, icon: '➕', label: 'إضافة', color: '#10B981', bg: '#10B98120', border: '#10B98140', onPress: onAdd || (() => Alert.alert('➕', 'إضافة عنصر جديد')) },
    { show: showEdit, icon: '✏️', label: 'تعديل', color: '#3B82F6', bg: '#3B82F620', border: '#3B82F640', onPress: onEdit || (() => Alert.alert('✏️', 'اختر عنصراً لتعديله')), disabled: editDisabled },
    { show: showDelete, icon: '🗑️', label: 'حذف', color: '#EF4444', bg: '#EF444420', border: '#EF444440', onPress: onDelete || (() => Alert.alert('🗑️', 'اختر عنصراً لحذفه')), disabled: deleteDisabled },
    { show: showSave, icon: '💾', label: 'حفظ', color: '#8B5CF6', bg: '#8B5CF620', border: '#8B5CF640', onPress: onSave || (() => Alert.alert('💾', 'جاري الحفظ...')) },
    { show: showCancel, icon: '❌', label: 'إلغاء', color: '#6B7280', bg: '#6B728020', border: '#6B728040', onPress: onCancel || (() => {}) },
  ].filter(b => b.show);

  // الصف الثاني - أدوات مساعدة
  const toolButtons = [
    { show: showSearch, icon: '🔍', label: 'بحث', color: '#7C3AED', bg: '#7C3AED20', border: '#7C3AED40', onPress: handleSearch },
    { show: showPrint, icon: '🖨️', label: 'طباعة', color: '#F59E0B', bg: '#F59E0B20', border: '#F59E0B40', onPress: handlePrint },
    { show: showRefresh, icon: '🔄', label: 'تحديث', color: '#06B6D4', bg: '#06B6D420', border: '#06B6D440', onPress: handleRefresh },
    { show: showExport, icon: '📤', label: 'تصدير', color: '#EC4899', bg: '#EC489920', border: '#EC489940', onPress: handleExport },
  ].filter(b => b.show);

  return (
    <View style={styles.container}>
      {mainButtons.length > 0 && (
        <View style={styles.row}>
          {mainButtons.map((btn, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.btn, { backgroundColor: btn.bg, borderColor: btn.border }, btn.disabled && styles.disabled]}
              onPress={btn.onPress}
              disabled={btn.disabled}
            >
              <Text style={styles.icon}>{btn.icon}</Text>
              <Text style={[styles.label, { color: btn.color }, btn.disabled && styles.disabledText]}>{btn.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {toolButtons.length > 0 && (
        <View style={styles.row}>
          {toolButtons.map((btn, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.btn, { backgroundColor: btn.bg, borderColor: btn.border }]}
              onPress={btn.onPress}
            >
              <Text style={styles.icon}>{btn.icon}</Text>
              <Text style={[styles.label, { color: btn.color }]}>{btn.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

// هيدر موحد لجميع الشاشات
export const ControlHeader: React.FC<{
  title: string;
  count?: number;
  onAdd?: () => void;
  onBack?: () => void;
  rightIcon?: string;
  onRightPress?: () => void;
}> = ({ title, count, onAdd, onBack, rightIcon, onRightPress }) => (
  <View style={styles.header}>
    {onBack ? (
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Text style={styles.backText}>←</Text>
      </TouchableOpacity>
    ) : <View style={{ width: 36 }} />}
    
    <Text style={styles.headerTitle}>
      {title}{count !== undefined ? ` (${count})` : ''}
    </Text>
    
    {onAdd ? (
      <TouchableOpacity onPress={onAdd} style={styles.addBtn}>
        <Text style={styles.addText}>+</Text>
      </TouchableOpacity>
    ) : rightIcon ? (
      <TouchableOpacity onPress={onRightPress} style={styles.addBtn}>
        <Text style={styles.addText}>{rightIcon}</Text>
      </TouchableOpacity>
    ) : <View style={{ width: 36 }} />}
  </View>
);

// شريط بحث موحد
export const SearchBar: React.FC<{
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}> = ({ value, onChangeText, placeholder = '🔍 بحث...' }) => (
  <View style={styles.searchContainer}>
    <Text style={styles.searchIcon}>🔍</Text>
    <TextInput
      style={styles.searchInput}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#666"
      textAlign="right"
    />
  </View>
);

import { TextInput } from 'react-native';

const styles = StyleSheet.create({
  container: { paddingHorizontal: 10, marginBottom: 4 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, justifyContent: 'center', marginBottom: 4 },
  btn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 9, paddingVertical: 7, borderRadius: 8, borderWidth: 1, gap: 3 },
  icon: { fontSize: 13 },
  label: { fontSize: 10, fontWeight: '600' },
  disabled: { opacity: 0.4 },
  disabledText: { color: '#6B7280' },
  
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#2a3550',
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#16213E', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#2a3550' },
  backText: { fontSize: 20, color: '#D4AF37', fontWeight: 'bold' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', flex: 1, textAlign: 'center' },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#D4AF37' + '20', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#D4AF37' },
  addText: { fontSize: 20, color: '#D4AF37', fontWeight: 'bold' },
  
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginBottom: 10,
    backgroundColor: '#16213E', borderRadius: 10,
    borderWidth: 1, borderColor: '#2a3550', paddingHorizontal: 10,
  },
  searchIcon: { fontSize: 16, marginRight: 6 },
  searchInput: { flex: 1, paddingVertical: 10, color: '#FFF', fontSize: 14 },
});
