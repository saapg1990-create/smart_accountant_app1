import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

interface ItemRowProps {
  item: {
    id: string;
    itemName: string;
    qty: string;
    price: string;
    discount?: string;
    taxRate?: number;
    total: string;
  };
  onUpdate: (id: string, field: string, value: string) => void;
  onRemove?: (id: string) => void;
  showRemove?: boolean;
}

export const ItemRow: React.FC<ItemRowProps> = ({ item, onUpdate, onRemove, showRemove = true }) => {
  // ✅ الحساب التلقائي
  const calculateTotal = (qty: string, price: string, discount: string = '0', taxRate: number = 5): number => {
    const q = parseFloat(qty) || 0;
    const p = parseFloat(price) || 0;
    const d = parseFloat(discount) || 0;
    const subtotal = q * p;
    const net = subtotal - d;
    const taxAmount = net * (taxRate / 100);
    return net + taxAmount;
  };

  const total = calculateTotal(item.qty, item.price, item.discount, item.taxRate);

  return (
    <View style={styles.row}>
      {showRemove && onRemove && (
        <TouchableOpacity onPress={() => onRemove(item.id)} style={styles.removeBtn}>
          <Text style={styles.removeText}>✕</Text>
        </TouchableOpacity>
      )}

      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.itemName || 'اختر الصنف'}</Text>
      </View>

      <TextInput
        style={styles.input}
        keyboardType="numeric"
        placeholder="كمية"
        placeholderTextColor="#666"
        value={item.qty === '0' ? '' : item.qty}
        onChangeText={(val) => onUpdate(item.id, 'qty', val || '0')}
      />

      <TextInput
        style={styles.input}
        keyboardType="numeric"
        placeholder="سعر"
        placeholderTextColor="#666"
        value={item.price === '0' ? '' : item.price}
        onChangeText={(val) => onUpdate(item.id, 'price', val || '0')}
      />

      <Text style={styles.totalText}>
        {total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ﷼
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A1128',
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#2a3550',
    gap: 6,
  },
  removeBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EF444420',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemInfo: {
    flex: 2,
  },
  itemName: {
    color: '#FFF',
    fontSize: 13,
    textAlign: 'right',
  },
  input: {
    flex: 1,
    backgroundColor: '#16213E',
    color: '#FFF',
    padding: 8,
    borderRadius: 6,
    textAlign: 'center',
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#2a3550',
  },
  totalText: {
    flex: 1,
    color: '#10B981',
    fontWeight: 'bold',
    textAlign: 'right',
    fontSize: 13,
  },
});
