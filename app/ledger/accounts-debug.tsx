// نسخة تشخيصية لعرض كل الحسابات
import React, { useState, useCallback } from 'react';
import { View, Text, FlatList } from 'react-native';
import { useAccountStore } from '../../src/store/useAccountStore';

export default function DebugAccounts() {
  const { accounts, loadAccounts } = useAccountStore();
  useCallback(() => { loadAccounts(); }, []);
  
  return (
    <View style={{flex:1,backgroundColor:'#000',padding:20}}>
      <Text style={{color:'#fff',fontSize:20}}>كل الحسابات ({accounts.length})</Text>
      <FlatList data={accounts} renderItem={({item}) => (
        <View style={{padding:8,borderBottomWidth:1,borderColor:'#333'}}>
          <Text style={{color:'#D4AF37'}}>ID: {item.id}</Text>
          <Text style={{color:'#fff'}}>الاسم: {item.name}</Text>
          <Text style={{color:'#0f0'}}>ParentID: "{item.parentId}"</Text>
          <Text style={{color:'#94a3b8'}}>Code: {item.code}</Text>
        </View>
      )} />
    </View>
  );
}
