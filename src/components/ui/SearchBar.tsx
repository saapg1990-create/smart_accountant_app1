import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme/colors';

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onVoicePress?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ 
  placeholder = '🔍 بحث سريع...',
  value,
  onChangeText,
  onVoicePress 
}) => {
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={Colors.text.secondary}
        value={value}
        onChangeText={onChangeText}
      />
      {onVoicePress && (
        <TouchableOpacity style={styles.voiceButton} onPress={onVoicePress}>
          <Text style={styles.voiceIcon}>🎤</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.ui.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.ui.border,
    ...Shadows.small,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
    textAlign: 'right',
  },
  voiceButton: {
    padding: Spacing.md,
    marginRight: Spacing.sm,
  },
  voiceIcon: {
    fontSize: 24,
  },
});
