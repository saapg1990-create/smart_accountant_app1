import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme/colors';

interface QuickActionProps {
  icon: string;
  label: string;
  onPress: () => void;
  color?: string;
}

export const QuickAction: React.FC<QuickActionProps> = ({ 
  icon, 
  label, 
  onPress,
  color = Colors.primary.gold 
}) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.iconCircle, { backgroundColor: color + '20' }]}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: 80,
    marginHorizontal: Spacing.sm,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    borderWidth: 2,
    borderColor: 'rgba(212,175,55,0.3)',
    ...Shadows.small,
  },
  icon: {
    fontSize: 24,
  },
  label: {
    fontSize: 12,
    color: Colors.text.white,
    textAlign: 'center',
  },
});
