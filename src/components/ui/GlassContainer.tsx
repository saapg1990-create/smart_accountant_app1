import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors, BorderRadius } from '../../theme/colors';

interface GlassContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
}

export const GlassContainer: React.FC<GlassContainerProps> = ({ 
  children, 
  style, 
  intensity = 20 
}) => {
  return (
    <BlurView intensity={intensity} tint="light" style={[styles.container, style]}>
      {children}
    </BlurView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.ui.glass,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.ui.border,
    overflow: 'hidden',
  },
});
