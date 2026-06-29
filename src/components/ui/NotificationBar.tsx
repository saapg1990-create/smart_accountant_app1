import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme/colors';

interface Notification {
  id: string;
  icon: string;
  title: string;
  message: string;
  time: string;
}

interface NotificationBarProps {
  notifications: Notification[];
}

export const NotificationBar: React.FC<NotificationBarProps> = ({ notifications }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🔔 آخر الإشعارات</Text>
        <TouchableOpacity>
          <Text style={styles.viewAll}>عرض الكل</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {notifications.map((notif) => (
          <TouchableOpacity key={notif.id} style={styles.card}>
            <Text style={styles.icon}>{notif.icon}</Text>
            <Text style={styles.title}>{notif.title}</Text>
            <Text style={styles.message}>{notif.message}</Text>
            <Text style={styles.time}>{notif.time}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.white,
  },
  viewAll: {
    fontSize: 14,
    color: Colors.primary.gold,
  },
  card: {
    backgroundColor: Colors.ui.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginRight: Spacing.md,
    width: 200,
    borderWidth: 1,
    borderColor: Colors.ui.border,
    ...Shadows.small,
  },
  icon: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  message: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  time: {
    fontSize: 10,
    color: Colors.text.secondary,
    textAlign: 'left',
  },
});
