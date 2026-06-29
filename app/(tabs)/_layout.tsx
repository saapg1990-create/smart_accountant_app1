import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: '#D4AF37',
      tabBarInactiveTintColor: '#94a3b8',
      tabBarStyle: { backgroundColor: '#16213E', borderTopColor: '#2a3550' },
      headerShown: false,
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
    }}>
      <Tabs.Screen name="index" options={{ title: 'الرئيسية', tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>🏠</Text> }} />
    </Tabs>
  );
}
