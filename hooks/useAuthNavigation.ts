import { useRouter } from 'expo-router';
import { useDatabase } from '../context/DatabaseContext';
import { Alert } from 'react-native';

export function useAuthNavigation() {
  const router = useRouter();
  const { isReady } = useDatabase(); // نفترض وجود هذا المتغير في context الخاص بك

  const navigateTo = (route: string) => {
    if (!isReady) {
      Alert.alert('تنبيه', 'جاري تهيئة قاعدة البيانات، يرجى الانتظار ثانية...');
      return;
    }
    router.push(route as any);
  };

  return { navigateTo };
}
