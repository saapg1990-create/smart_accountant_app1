import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LoginScreen } from './src/screens/auth';

export default function App() {
  return (
    <View style={styles.container}>
      <LoginScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
