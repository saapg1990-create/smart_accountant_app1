import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { useDatabase } from '../../../context/DatabaseContext';

interface CurrencySelectorProps {
  selectedCurrency: string;
  exchangeRate: string;
  onCurrencyChange: (currency: string, rate: string) => void;
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  selectedCurrency, exchangeRate, onCurrencyChange
}) => {
  const { db } = useDatabase();
  const [currencies, setCurrencies] = useState<any[]>([]);

  useEffect(() => {
    if (db) {
      db.getAllAsync('SELECT * FROM currencies ORDER BY isDefault DESC').then(setCurrencies);
    }
  }, [db]);

  return (
    <View style={s.container}>
      <Text style={s.label}>العملة</Text>
      <View style={s.row}>
        {currencies.map((c: any) => (
          <TouchableOpacity
            key={c.id}
            style={[s.chip, selectedCurrency === c.code && s.chipActive]}
            onPress={() => onCurrencyChange(c.code, String(c.rate || 1))}
          >
            <Text style={[s.chipText, selectedCurrency === c.code && s.chipTextActive]}>
              {c.symbol} {c.code}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {selectedCurrency !== 'YER' && (
        <View style={s.rateBox}>
          <Text style={s.rateLabel}>سعر الصرف</Text>
          <TextInput
            style={s.rateInput}
            value={exchangeRate}
            onChangeText={(v) => onCurrencyChange(selectedCurrency, v)}
            keyboardType="numeric"
            placeholder="1"
            placeholderTextColor="#666"
          />
          <Text style={s.rateInfo}>1 {selectedCurrency} = {exchangeRate} ﷼</Text>
        </View>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  container: { marginBottom: 10 },
  label: { color: '#9A9B3B', fontSize: 13, marginBottom: 6 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#0A1128', borderWidth: 1, borderColor: '#2a3550',
  },
  chipActive: { borderColor: '#D4AF37', backgroundColor: '#D4AF37' + '20' },
  chipText: { color: '#94a3b8', fontSize: 12 },
  chipTextActive: { color: '#D4AF37', fontWeight: 'bold' },
  rateBox: {
    marginTop: 8, padding: 10, backgroundColor: '#0A1128', borderRadius: 8,
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  rateLabel: { color: '#94a3b8', fontSize: 11 },
  rateInput: {
    backgroundColor: '#16213E', color: '#D4AF37', padding: 6, borderRadius: 6,
    width: 80, textAlign: 'center', fontSize: 14, fontWeight: 'bold',
  },
  rateInfo: { color: '#10B981', fontSize: 10, flex: 1 },
});
