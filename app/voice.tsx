import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Alert, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function VoiceCommandScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [draft, setDraft] = useState<any>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);

  const voiceCommands = [
    { phrase: 'بيع 10 أكياس أسمنت للعميل أحمد نقداً', action: 'فاتورة مبيعات نقدية' },
    { phrase: 'شراء 50 كرتون من المورد نقداً', action: 'فاتورة مشتريات نقدية' },
    { phrase: 'استلام 100 ألف ريال من العميل', action: 'سند قبض' },
    { phrase: 'صرف 50 ألف ريال للمورد', action: 'سند صرف' },
    { phrase: 'إضافة عميل جديد اسمه محمد', action: 'إضافة عميل' },
  ];

  const startListening = () => {
    setIsListening(true);
    setTranscript('');
    setTimeout(() => {
      const cmd = voiceCommands[Math.floor(Math.random() * voiceCommands.length)];
      setTranscript(cmd.phrase);
      setIsListening(false);
      processCommand(cmd.phrase);
    }, 3000);
  };

  const processCommand = (command: string) => {
    setIsProcessing(true);
    setTimeout(() => {
      let draftData: any = null;
      if (command.includes('بيع')) {
        draftData = { type: 'فاتورة مبيعات', customerName: 'أحمد', items: [{ name: 'أسمنت', qty: 10, price: 3500 }], total: 35000, paymentType: 'cash' };
      } else if (command.includes('شراء')) {
        draftData = { type: 'فاتورة مشتريات', supplierName: 'المورد', items: [{ name: 'كرتون', qty: 50, price: 1000 }], total: 50000, paymentType: 'cash' };
      } else if (command.includes('استلام')) {
        draftData = { type: 'سند قبض', accountName: 'العميل', amount: 100000 };
      } else if (command.includes('صرف')) {
        draftData = { type: 'سند صرف', accountName: 'المورد', amount: 50000 };
      } else if (command.includes('عميل جديد')) {
        draftData = { type: 'عميل جديد', name: 'محمد' };
      }
      setDraft(draftData);
      setCommandHistory([command, ...commandHistory].slice(0, 10));
      setIsProcessing(false);
    }, 2000);
  };

  const handleSave = () => { Alert.alert('✅', 'تم حفظ المعاملة بنجاح'); setDraft(null); setTranscript(''); };
  const handleCancel = () => { setDraft(null); setTranscript(''); };

  return (
    <View style={[styles.c, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <View style={styles.h}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.bt}>←</Text></TouchableOpacity>
        <Text style={styles.t}>🎤 الأوامر الصوتية</Text>
        <TouchableOpacity onPress={() => setShowHelp(true)}><Text style={styles.help}>❓</Text></TouchableOpacity>
      </View>

      <ScrollView style={styles.ct} contentContainerStyle={{ alignItems: 'center' }}>
        <TouchableOpacity style={[styles.mic, isListening && styles.micA]} onPress={startListening} disabled={isListening || isProcessing}>
          {isListening ? <ActivityIndicator size="large" color="#FFF" /> : <Text style={styles.micI}>🎤</Text>}
        </TouchableOpacity>
        <Text style={styles.micL}>{isListening ? 'جاري الاستماع...' : isProcessing ? 'جاري المعالجة...' : 'اضغط للتحدث'}</Text>

        {transcript ? <View style={styles.card}><Text style={styles.cardT}>📝 النص المستمع:</Text><Text style={styles.cardTx}>{transcript}</Text></View> : null}

        {draft ? (
          <View style={styles.card}>
            <Text style={styles.cardT}>📋 مسودة المعاملة</Text>
            <Text style={styles.draftType}>{draft.type}</Text>
            {draft.items?.map((item: any, i: number) => (
              <Text key={i} style={styles.cardTx}>📦 {item.name}: {item.qty} × {item.price} = {(item.qty * item.price).toLocaleString()} ﷼</Text>
            ))}
            {draft.total && <Text style={styles.cardTx}>الإجمالي: {draft.total.toLocaleString()} ﷼</Text>}
            {draft.amount && <Text style={styles.cardTx}>المبلغ: {draft.amount.toLocaleString()} ﷼</Text>}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}><Text style={styles.saveT}>✅ حفظ</Text></TouchableOpacity>
              <TouchableOpacity style={styles.editBtn} onPress={() => Alert.alert('تعديل', 'يمكنك تعديل المعاملة')}><Text style={styles.editT}>✏️ تعديل</Text></TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}><Text style={styles.cancelT}>❌ إلغاء</Text></TouchableOpacity>
            </View>
          </View>
        ) : null}

        <View style={styles.tips}>
          <Text style={styles.tipsT}>💡 أمثلة للأوامر الصوتية:</Text>
          {voiceCommands.map((cmd, i) => (
            <Text key={i} style={styles.tip}>• "{cmd.phrase}" → {cmd.action}</Text>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={showHelp} animationType="slide" transparent>
        <View style={styles.mo}><View style={styles.mc}><View style={styles.mh}><Text style={styles.mt}>كيفية الاستخدام</Text><TouchableOpacity onPress={() => setShowHelp(false)}><Text style={styles.mx}>✕</Text></TouchableOpacity></View>
          <ScrollView style={styles.mb}>
            <Text style={styles.ht}>🎤 تحدث بوضوح وقرب الهاتف من فمك</Text>
            <Text style={styles.ht}>📝 اذكر نوع المعاملة أولاً</Text>
            <Text style={styles.ht}>👤 اذكر اسم العميل أو المورد</Text>
            <Text style={styles.ht}>📦 اذكر الأصناف والكميات</Text>
            <Text style={styles.ht}>💰 اذكر المبالغ وطريقة الدفع</Text>
            <Text style={styles.ht}>✅ راجع المسودة قبل الحفظ</Text>
          </ScrollView></View></View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: '#0A1128' },
  h: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  bt: { fontSize: 24, color: '#D4AF37', fontWeight: 'bold' }, t: { fontSize: 18, fontWeight: 'bold', color: '#FFF' }, help: { fontSize: 22, color: '#D4AF37' },
  ct: { flex: 1, padding: 16 },
  mic: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#D4AF37', justifyContent: 'center', alignItems: 'center', marginTop: 20, marginBottom: 10 }, micA: { backgroundColor: '#EF4444' }, micI: { fontSize: 50 }, micL: { color: '#FFF', fontSize: 16, marginBottom: 20 },
  card: { backgroundColor: '#16213E', borderRadius: 14, padding: 16, width: '100%', marginBottom: 16, borderWidth: 1, borderColor: '#2a3550' }, cardT: { color: '#D4AF37', fontSize: 14, fontWeight: 'bold', marginBottom: 8 }, cardTx: { color: '#FFF', fontSize: 14, marginBottom: 4, textAlign: 'center' },
  draftType: { color: '#10B981', fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 }, saveBtn: { flex: 1, backgroundColor: '#10B981', borderRadius: 10, padding: 10, alignItems: 'center' }, saveT: { color: '#FFF', fontSize: 13, fontWeight: 'bold' }, editBtn: { flex: 1, backgroundColor: '#3B82F6', borderRadius: 10, padding: 10, alignItems: 'center' }, editT: { color: '#FFF', fontSize: 13, fontWeight: 'bold' }, cancelBtn: { flex: 1, backgroundColor: '#EF4444', borderRadius: 10, padding: 10, alignItems: 'center' }, cancelT: { color: '#FFF', fontSize: 13, fontWeight: 'bold' },
  tips: { backgroundColor: '#16213E', borderRadius: 14, padding: 16, width: '100%', borderWidth: 1, borderColor: '#2a3550' }, tipsT: { color: '#D4AF37', fontSize: 14, fontWeight: 'bold', marginBottom: 10 }, tip: { color: '#94a3b8', fontSize: 12, marginBottom: 6 },
  mo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }, mc: { backgroundColor: '#16213E', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%' }, mh: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#2a3550' }, mt: { color: '#D4AF37', fontSize: 18, fontWeight: 'bold' }, mx: { color: '#EF4444', fontSize: 22, fontWeight: 'bold' }, mb: { padding: 16 }, ht: { color: '#FFF', fontSize: 14, marginBottom: 12 },
});
