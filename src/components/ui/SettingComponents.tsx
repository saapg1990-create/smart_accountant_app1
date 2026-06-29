import React from 'react';
import { View, Text, StyleSheet, Switch, TextInput } from 'react-native';

export const SettingSwitch: React.FC<{ icon: string; label: string; value: boolean; onValueChange: (v: boolean) => void }> = ({ icon, label, value, onValueChange }) => (
  <View style={st.row}><Text style={st.icon}>{icon}</Text><Text style={st.label}>{label}</Text><Switch value={value} onValueChange={onValueChange} trackColor={{ false: '#2a3550', true: '#10B981' }} thumbColor={value ? '#FFF' : '#94a3b8'} /></View>
);
export const SettingField: React.FC<{ icon: string; label: string; value: string; onChangeText: (v: string) => void; placeholder?: string; secureTextEntry?: boolean }> = ({ icon, label, value, onChangeText, placeholder, secureTextEntry }) => (
  <View><View style={st.row}><Text style={st.icon}>{icon}</Text><Text style={st.label}>{label}</Text></View><TextInput style={st.input} value={value} onChangeText={onChangeText} placeholder={placeholder || ''} placeholderTextColor="#666" secureTextEntry={secureTextEntry} /></View>
);
export const SettingSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <View style={st.section}><Text style={st.sectionTitle}>{title}</Text><View style={st.card}>{children}</View></View>
);
export const SettingButton: React.FC<{ icon: string; label: string; onPress: () => void; color?: string }> = ({ icon, label, onPress, color = '#D4AF37' }) => (
  <View style={[st.row, st.btn]} onTouchEnd={onPress}><Text style={st.icon}>{icon}</Text><Text style={[st.label, { color }]}>{label}</Text><Text style={st.arrow}>→</Text></View>
);
const st = StyleSheet.create({
  section: { marginBottom: 20 }, sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#D4AF37', marginBottom: 8 },
  card: { backgroundColor: '#16213E', borderRadius: 14, padding: 4, borderWidth: 1, borderColor: '#2a3550' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  icon: { fontSize: 18, marginRight: 10 }, label: { color: '#FFF', fontSize: 14, flex: 1 },
  arrow: { color: '#D4AF37', fontSize: 18, fontWeight: 'bold' },
  input: { backgroundColor: '#0A1128', borderRadius: 10, padding: 12, color: '#FFF', borderWidth: 1, borderColor: '#2a3550', fontSize: 14, marginHorizontal: 14, marginBottom: 8 },
  btn: { cursor: 'pointer' },
});
