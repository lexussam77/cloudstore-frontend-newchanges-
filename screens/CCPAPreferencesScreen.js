import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export default function CCPAPreferencesScreen({ navigation }) {
  const { theme } = useTheme();
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.simpleTitle, { color: theme.text }]}>CCPA Preferences</Text>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.shadow }]}><Text style={[styles.text, { color: theme.text }]}>As a California resident, you have rights under the California Consumer Privacy Act (CCPA). You can request access to your data, request deletion, or opt out of the sale of your personal information.</Text></View>
        <View style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.shadow }]}><TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.primary }]} onPress={() => {}}><Text style={[styles.buttonText, { color: theme.textInverse }]}>Request My Data</Text></TouchableOpacity></View>
        <View style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.shadow }]}><TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.primary }]} onPress={() => {}}><Text style={[styles.buttonText, { color: theme.textInverse }]}>Delete My Data</Text></TouchableOpacity></View>
        <View style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.shadow }]}><TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.primary }]} onPress={() => {}}><Text style={[styles.buttonText, { color: theme.textInverse }]}>Do Not Sell My Info</Text></TouchableOpacity></View>
        <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={() => navigation.goBack()}>
          <Text style={[styles.buttonText, { color: theme.textInverse }]}>Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  simpleTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  text: {
    fontSize: 16,
    marginBottom: 32,
    fontWeight: 'bold',
    fontFamily: 'System',
  },
  button: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignSelf: 'center',
  },
  buttonText: {
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'System',
  },
  actionBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignSelf: 'center',
    marginBottom: 16,
  },
  card: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  scrollContent: {
    paddingVertical: 24,
    paddingHorizontal: 8,
  },
}); 