import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator, Vibration } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalTable } from '../hooks/useLocalStore';
import { useAccountStore } from '../src/store/useAccountStore';

// ✅ محرك تحليل الأوامر الصوتية الذكي
class VoiceCommandEngine {
  static parseCommand(text: string, context: any): { action: string; params: any; response: string } | null {
    const t = text.trim().toLowerCase();
    
    // أنماط الأوامر
    const patterns: { regex: RegExp; action: string; extract: (m: RegExpMatchArray) => any }[] = [
      // مبيعات
      { regex: /بيع\s+(.+)\s+بمبلغ\s+(\d+)\s+(نقدا|آجل)\s+(.+)/, action: 'sales_invoice', 
        extract: (m) => ({ item: m[1], amount: m[2], type: m[3] === 'نقدا' ? 'cash' : 'credit', customer: m[4] }) },
      { regex: /بيع\s+(.+)\s+بـ\s*(\d+)/, action: 'sales_invoice', 
        extract: (m) => ({ item: m[1], amount: m[2], type: 'cash', customer: 'عميل نقدي' }) },
      
      // مشتريات
      { regex: /اشتريت\s+(.+)\s+بمبلغ\s+(\d+)\s+(نقدا|آجل)\s+(.+)/, action: 'purchase_invoice',
        extract: (m) => ({ item: m[1], amount: m[2], type: m[3] === 'نقدا' ? 'cash' : 'credit', supplier: m[4] }) },
      
      // قبض/صرف
      { regex: /(قبض|استلمت)\s+مبلغ\s+(\d+)\s+من\s+(.+)/, action: 'receipt_voucher',
        extract: (m) => ({ amount: m[2], source: m[3], type: 'receipt' }) },
      { regex: /(صرف|دفعت)\s+مبلغ\s+(\d+)\s+(.+)/, action: 'payment_voucher',
        extract: (m) => ({ amount: m[2], reason: m[3], type: 'payment' }) },
      
      // استعلام عن رصيد
      { regex: /كم\s+(رصيد|الرصيد)\s+(.+)/, action: 'check_balance',
        extract: (m) => ({ account: m[2] }) },
      { regex: /رصيد\s+(.+)/, action: 'check_balance',
        extract: (m) => ({ account: m[1] }) },
      
      // إضافة عميل
      { regex: /عميل\s+جديد\s+(.+)\s+هاتف\s+(.+)/, action: 'new_customer',
        extract: (m) => ({ name: m[1], phone: m[2] }) },
      
      // إضافة صنف
      { regex: /صنف\s+جديد\s+(.+)\s+سعر\s+(\d+)/, action: 'new_item',
        extract: (m) => ({ name: m[1], price: m[2] }) },
      
      // ملخص اليوم
      { regex: /(ملخص|تقرير)\s+(اليوم|المبيعات)/, action: 'daily_summary', extract: () => ({}) },
      
      // أمر غير معروف
      { regex: /(.+)/, action: 'unknown', extract: (m) => ({ text: m[1] }) },
    ];

    for (const p of patterns) {
      const match = t.match(p.regex);
      if (match) {
        return {
          action: p.action,
          params: p.extract(match),
          response: VoiceCommandEngine.getResponse(p.action, p.extract(match))
        };
      }
    }
    return null;
  }

  static getResponse(action: string, params: any): string {
    const responses: Record<string, string> = {
      'sales_invoice': `✅ تم تسجيل فاتورة مبيعات:\n📦 ${params.item}\n💰 المبلغ: ${params.amount} ﷼\n👤 ${params.customer}\n💳 ${params.type === 'cash' ? 'نقداً' : 'آجل'}\n\nهل تريد الحفظ؟`,
      'purchase_invoice': `✅ تم تسجيل فاتورة مشتريات:\n📦 ${params.item}\n💰 المبلغ: ${params.amount} ﷼\n🏭 ${params.supplier}\n\nهل تريد الحفظ؟`,
      'receipt_voucher': `✅ سند قبض:\n💰 المبلغ: ${params.amount} ﷼\n👤 من: ${params.source}\n\nهل تريد الحفظ؟`,
      'payment_voucher': `✅ سند صرف:\n💰 المبلغ: ${params.amount} ﷼\n📝 ${params.reason}\n\nهل تريد الحفظ؟`,
      'check_balance': `📊 جاري البحث عن رصيد: ${params.account}...`,
      'new_customer': `👤 إضافة عميل جديد:\nالاسم: ${params.name}\n📞 الهاتف: ${params.phone}\n\nهل تريد الحفظ؟`,
      'new_item': `📦 إضافة صنف جديد:\nالاسم: ${params.name}\n💰 السعر: ${params.price} ﷼\n\nهل تريد الحفظ؟`,
      'daily_summary': `📊 ملخص اليوم:\nجاري تجهيز التقرير...`,
      'unknown': `❓ لم أفهم: "${params.text}"\n\nجرّب:\n• "بيع سكر بمبلغ 5000 نقدا"\n• "كم رصيد الصندوق"\n• "صرفت مبلغ 2000 رواتب"\n• "عميل جديد أحمد هاتف 777000000"`,
    };
    return responses[action] || '✅ تم فهم الأمر';
  }
}

export default function VoiceScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const [isListening, setIsListening] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [processing, setProcessing] = useState(false);
  const { data: items } = useLocalTable('items');
  const { data: customers } = useLocalTable('customers');
  const { accounts } = useAccountStore();

  const addMessage = (type: 'user' | 'bot', text: string, action?: string, params?: any) => {
    setMessages(prev => [...prev, { type, text, action, params, id: Date.now() }]);
  };

  const handleVoiceInput = () => {
    setIsListening(true);
    Vibration.vibrate(50);
    
    // محاكاة الاستماع (في الإصدار الحقيقي نستخدم expo-speech-recognition)
    setTimeout(() => {
      setIsListening(false);
      Alert.prompt(
        '🎙️ تحدث الآن',
        'قل الأمر الصوتي...',
        (text) => {
          if (text) processCommand(text);
        },
        'plain-text',
        '',
        'default'
      );
    }, 1500);
  };

  const handleTextInput = () => {
    if (!textInput.trim()) return;
    processCommand(textInput);
    setTextInput('');
  };

  const processCommand = (text: string) => {
    addMessage('user', text);
    setProcessing(true);
    
    const context = { items, customers, accounts };
    
    setTimeout(() => {
      const result = VoiceCommandEngine.parseCommand(text, context);
      if (result) {
        addMessage('bot', result.response, result.action, result.params);
      }
      setProcessing(false);
    }, 500);
  };

  const executeAction = async (action: string, params: any) => {
    switch (action) {
      case 'sales_invoice':
        router.push('/sales/sales-invoice');
        break;
      case 'purchase_invoice':
        router.push('/inventory/purchase-invoice');
        break;
      case 'receipt_voucher':
      case 'payment_voucher':
        router.push('/ledger/vouchers');
        break;
      case 'check_balance':
        router.push('/ledger/trial-balance');
        break;
      case 'new_customer':
        router.push('/sales/customers');
        break;
      case 'new_item':
        router.push('/inventory/items');
        break;
      case 'daily_summary':
        router.push('/reports/index');
        break;
      default:
        Alert.alert('تنفيذ', 'جاري تنفيذ الأمر...');
    }
    addMessage('bot', '✅ تم الانتقال إلى الشاشة المناسبة');
  };

  const quickCommands = [
    { icon: '💰', text: 'بيع سكر بمبلغ 5000 نقدا' },
    { icon: '📥', text: 'قبض مبلغ 10000 من محمد' },
    { icon: '📤', text: 'صرفت مبلغ 2000 رواتب' },
    { icon: '📊', text: 'كم رصيد الصندوق' },
    { icon: '👤', text: 'عميل جديد أحمد هاتف 777000000' },
    { icon: '📦', text: 'صنف جديد زيت سعر 1500' },
    { icon: '📋', text: 'ملخص اليوم' },
  ];

  return (
    <View style={[st.c, { paddingTop: insets.top }]}>
      <View style={st.h}>
        <TouchableOpacity onPress={() => router.back()}><Text style={st.bb}>←</Text></TouchableOpacity>
        <Text style={st.t}>🎙️ الأوامر الصوتية</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={st.messages} contentContainerStyle={{ padding: 12 }}>
        {messages.length === 0 && (
          <View style={st.welcome}>
            <Text style={st.wi}>🤖</Text>
            <Text style={st.wt}>مرحباً! أنا مساعدك الذكي</Text>
            <Text style={st.ws}>يمكنك التحدث أو كتابة أي أمر محاسبي</Text>
          </View>
        )}
        
        {messages.map((msg: any) => (
          <View key={msg.id} style={[st.msg, msg.type === 'user' ? st.userMsg : st.botMsg]}>
            <Text style={msg.type === 'user' ? st.userText : st.botText}>{msg.text}</Text>
            {msg.action && msg.action !== 'unknown' && (
              <TouchableOpacity style={st.execBtn} onPress={() => executeAction(msg.action, msg.params)}>
                <Text style={st.execBtnText}>⚡ تنفيذ</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
        
        {processing && <ActivityIndicator color="#D4AF37" style={{ marginTop: 10 }} />}
      </ScrollView>

      <View style={st.quickSection}>
        <Text style={st.qTitle}>⚡ أوامر سريعة</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={st.quickScroll}>
          {quickCommands.map((cmd, i) => (
            <TouchableOpacity key={i} style={st.qCmd} onPress={() => processCommand(cmd.text)}>
              <Text style={st.qIcon}>{cmd.icon}</Text>
              <Text style={st.qText}>{cmd.text}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={st.inputRow}>
        <TouchableOpacity style={st.voiceBtn} onPress={handleVoiceInput}>
          <Text style={st.voiceIcon}>{isListening ? '🔴' : '🎤'}</Text>
        </TouchableOpacity>
        <TextInput style={st.input} value={textInput} onChangeText={setTextInput} 
          placeholder="اكتب أمراً محاسبياً..." placeholderTextColor="#666"
          onSubmitEditing={handleTextInput} returnKeyType="send" />
        <TouchableOpacity style={st.sendBtn} onPress={handleTextInput}>
          <Text style={st.sendIcon}>📤</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  c:{flex:1,backgroundColor:'#0A1128'},h:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:16},bb:{fontSize:24,color:'#D4AF37'},t:{color:'#D4AF37',fontSize:20,fontWeight:'bold'},
  messages:{flex:1},
  welcome:{alignItems:'center',marginTop:60},wi:{fontSize:64,marginBottom:12},wt:{color:'#FFF',fontSize:18,fontWeight:'bold'},ws:{color:'#94a3b8',fontSize:13,marginTop:8},
  msg:{padding:14,borderRadius:14,marginBottom:8,maxWidth:'85%'},
  userMsg:{backgroundColor:'#D4AF3720',alignSelf:'flex-end',borderWidth:1,borderColor:'#D4AF3740'},
  botMsg:{backgroundColor:'#16213E',alignSelf:'flex-start',borderWidth:1,borderColor:'#2a3550'},
  userText:{color:'#FFF',fontSize:14,textAlign:'right'},botText:{color:'#FFF',fontSize:14,textAlign:'right'},
  execBtn:{backgroundColor:'#10B981',padding:8,borderRadius:8,alignSelf:'flex-end',marginTop:8},execBtnText:{color:'#FFF',fontSize:12,fontWeight:'bold'},
  quickSection:{paddingHorizontal:12,paddingBottom:8},qTitle:{color:'#D4AF37',fontSize:13,fontWeight:'bold',marginBottom:8},quickScroll:{flexDirection:'row'},
  qCmd:{backgroundColor:'#16213E',padding:12,borderRadius:12,marginRight:8,alignItems:'center',borderWidth:1,borderColor:'#2a3550',minWidth:120},qIcon:{fontSize:24,marginBottom:4},qText:{color:'#FFF',fontSize:10,textAlign:'center'},
  inputRow:{flexDirection:'row',alignItems:'center',padding:12,gap:8,borderTopWidth:1,borderTopColor:'#2a3550'},
  voiceBtn:{width:50,height:50,borderRadius:25,backgroundColor:'#D4AF3720',justifyContent:'center',alignItems:'center',borderWidth:2,borderColor:'#D4AF37'},voiceIcon:{fontSize:24},
  input:{flex:1,backgroundColor:'#16213E',borderRadius:25,paddingHorizontal:16,paddingVertical:12,color:'#FFF',borderWidth:1,borderColor:'#2a3550',textAlign:'right',fontSize:14},
  sendBtn:{width:44,height:44,borderRadius:22,backgroundColor:'#10B98120',justifyContent:'center',alignItems:'center'},sendIcon:{fontSize:20},
});
