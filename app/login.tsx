import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Alert, Animated, Modal, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';

const CORRECT_PIN = '1234';
const MAX_ATTEMPTS = 5;
const LOCK_DURATION = 60;

export default function LoginScreen() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [timer, setTimer] = useState(0);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [bioSupported, setBioSupported] = useState(false);
  const router = useRouter();
  const shake = new Animated.Value(0);

  useEffect(() => {
    checkBiometrics();
    if (locked && timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
    if (locked && timer === 0) { setLocked(false); setAttempts(0); }
  }, [locked, timer]);

  const checkBiometrics = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setBioSupported(compatible && enrolled);
    } catch (e) {}
  };

  const shakeAnim = () => {
    Animated.sequence([...Array(6)].map((_, i) =>
      Animated.timing(shake, { toValue: (i % 2 === 0 ? 12 : -12), duration: 40, useNativeDriver: true })
    )).start(() => shake.setValue(0));
  };

  const handlePin = (d: string) => { if (pin.length < 4 && !locked) { setPin(pin + d); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } };
  const handleDelete = () => { setPin(pin.slice(0, -1)); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); };

  const handleLogin = () => {
    if (pin.length !== 4) return;
    if (pin === CORRECT_PIN) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/home');
    } else {
      shakeAnim();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setPin('');
      if (newAttempts >= MAX_ATTEMPTS) {
        setLocked(true);
        setTimer(LOCK_DURATION);
      } else {
        setError(`رمز PIN غير صحيح. متبقي ${MAX_ATTEMPTS - newAttempts} محاولات`);
      }
    }
  };

  const handleBiometric = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'تسجيل الدخول بالبصمة',
        fallbackLabel: 'استخدام رمز PIN',
      });
      if (result.success) router.replace('/home');
    } catch (e) {}
  };

  if (locked) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#0A1128', '#16213E'] as const} style={styles.bg} />
        <View style={styles.lockContent}>
          <Text style={styles.lockIcon}>🔒</Text>
          <Text style={styles.lockTitle}>تم قفل التطبيق</Text>
          <Text style={styles.lockTimer}>{timer} ثانية</Text>
        </View>
      </View>
    );
  }

  const keys = [['1','2','3'],['4','5','6'],['7','8','9'],[bioSupported ? '🖐️' : '','0','⌫']];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#0A1128', '#16213E'] as const} style={styles.bg} />
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <LinearGradient colors={['#D4AF37', '#FFD700'] as const} style={styles.logoCircle}>
            <Text style={styles.logoText}>💎</Text>
          </LinearGradient>
        </View>
        <Text style={styles.title}>دفتر المحاسب الذكي</Text>
        <Text style={styles.subtitle}>النظام المحاسبي المتكامل</Text>

        <Animated.View style={[styles.dots, { transform: [{ translateX: shake }] }]}>
          {[0, 1, 2, 3].map(i => <View key={i} style={[styles.dot, i < pin.length && styles.dotFill, error && styles.dotErr]} />)}
        </Animated.View>

        {error ? <Text style={styles.error}>{error}</Text> : <View style={{ height: 20 }} />}

        <View style={styles.keypad}>
          {keys.map((row, ri) => (
            <View key={ri} style={styles.keyRow}>
              {row.map((key, ci) => {
                if (key === '') return <View key={ci} style={styles.key} />;
                if (key === '🖐️') return (
                  <TouchableOpacity key={ci} style={[styles.key, styles.bioKey]} onPress={handleBiometric}>
                    <Text style={styles.bioIcon}>🖐️</Text>
                  </TouchableOpacity>
                );
                return (
                  <TouchableOpacity key={ci} style={[styles.key, key === '⌫' && styles.keyDel]} onPress={() => key === '⌫' ? handleDelete() : handlePin(key)}>
                    <Text style={[styles.keyText, key === '⌫' && styles.keyDelText]}>{key}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        <TouchableOpacity style={[styles.loginBtn, pin.length !== 4 && styles.loginBtnOff]} onPress={handleLogin} disabled={pin.length !== 4}>
          <LinearGradient colors={pin.length === 4 ? ['#D4AF37', '#FFD700'] as const : ['#2a3550', '#1a2235'] as const} style={styles.loginGrad}>
            <Text style={[styles.loginText, pin.length !== 4 && styles.loginTextOff]}>{'🔐 تسجيل الدخول'}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.forgotBtn} onPress={() => setShowForgotModal(true)}>
          <Text style={styles.forgotText}>📞 نسيت كلمة السر؟</Text>
        </TouchableOpacity>

        {bioSupported && (
          <TouchableOpacity style={styles.bioBtn} onPress={handleBiometric}>
            <Text style={styles.bioBtnText}>🖐️ دخول بالبصمة</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.dev}>م/ صدام بشير | 736002798</Text>
      </View>

      <Modal visible={showForgotModal} animationType="slide" transparent>
        <View style={styles.mo}><View style={styles.mc}>
          <View style={styles.mh}><Text style={styles.mt}>🔑 استعادة كلمة السر</Text><TouchableOpacity onPress={() => setShowForgotModal(false)}><Text style={styles.mx}>✕</Text></TouchableOpacity></View>
          <View style={styles.mb}>
            <Text style={styles.md}>للتواصل مع الدعم الفني:</Text>
            <Text style={styles.md}>📞 736002798</Text>
            <Text style={styles.md}>📧 saap1990@gmail.com</Text>
            <Text style={styles.md}>كلمة السر الافتراضية: 1234</Text>
          </View>
        </View></View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bg: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  logoContainer: { marginBottom: 20 },
  logoCircle: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center' },
  logoText: { fontSize: 40 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FFF' },
  subtitle: { fontSize: 14, color: '#D4AF37', marginBottom: 24 },
  dots: { flexDirection: 'row', gap: 14, marginBottom: 8 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: 'rgba(212,175,55,0.5)' },
  dotFill: { backgroundColor: '#D4AF37', borderColor: '#D4AF37' },
  dotErr: { borderColor: '#EF4444' },
  error: { color: '#EF4444', fontSize: 13, marginBottom: 4 },
  keypad: { width: 280, marginBottom: 20 },
  keyRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
  key: { width: 68, height: 68, borderRadius: 34, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(212,175,55,0.2)' },
  keyDel: { backgroundColor: 'rgba(239,68,68,0.15)' },
  keyText: { fontSize: 24, color: '#FFF', fontWeight: '600' },
  keyDelText: { color: '#EF4444' },
  bioKey: { backgroundColor: 'rgba(16,185,129,0.15)', borderColor: 'rgba(16,185,129,0.3)' },
  bioIcon: { fontSize: 22 },
  loginBtn: { width: 280, borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
  loginBtnOff: { opacity: 0.6 },
  loginGrad: { paddingVertical: 15, alignItems: 'center' },
  loginText: { color: '#0A1128', fontSize: 17, fontWeight: 'bold' },
  loginTextOff: { color: '#6B7280' },
  forgotBtn: { padding: 10, marginBottom: 8 },
  forgotText: { color: 'rgba(255,255,255,0.7)', fontSize: 13, textDecorationLine: 'underline' },
  bioBtn: { padding: 10, marginBottom: 16 },
  bioBtnText: { color: '#10B981', fontSize: 14 },
  dev: { color: 'rgba(255,255,255,0.4)', fontSize: 11, position: 'absolute', bottom: 30 },
  lockContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  lockIcon: { fontSize: 64, marginBottom: 16 },
  lockTitle: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  lockTimer: { color: '#F59E0B', fontSize: 48, fontWeight: 'bold' },
  mo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  mc: { backgroundColor: '#16213E', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  mh: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#2a3550' },
  mt: { color: '#D4AF37', fontSize: 18, fontWeight: 'bold' },
  mx: { color: '#EF4444', fontSize: 22, fontWeight: 'bold' },
  mb: { padding: 16 },
  md: { color: '#FFF', fontSize: 14, marginBottom: 8, textAlign: 'center' },
});
