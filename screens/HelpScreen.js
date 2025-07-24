import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

const helpTopics = [
  'How to upload files',
  'How to create folders',
  'How to scan documents',
  'Managing your storage',
  'Contact support',
];

const helpIcons = [
  'cloud-upload-outline',
  'folder-outline',
  'document-text-outline',
  'bar-chart-outline',
  'help-circle-outline',
];

export default function HelpScreen() {
  const { theme } = useTheme();
  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.header, { color: theme.primary }]}>CloudStore Help</Text>
      {helpTopics.map((topic, idx) => (
        <TouchableOpacity key={idx} style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]} activeOpacity={0.85}>
          <Ionicons name={helpIcons[idx]} size={22} color={theme.primary} style={styles.icon} />
          <Text style={[styles.text, { color: theme.text }]}>{topic}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 10,
    paddingHorizontal: 16,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderRadius: 12,
    marginBottom: 10,
    paddingHorizontal: 10,
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  icon: {
    marginRight: 14,
  },
  text: {
    fontSize: 16,
  },
}); //ai man gengis