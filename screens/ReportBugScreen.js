import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';

const DEEP_BLUE_GRADIENT = ['#0a0f1c', '#12203a', '#1a2a4f'];
const GLASS_BG_DEEP = 'rgba(20,40,80,0.32)';
const GLASS_BORDER = 'rgba(255,255,255,0.10)';
const WHITE = '#fff';
const LIGHT_TEXT = '#e0e6f0';
const BLUE_ACCENT = '#2979FF';

export default function ReportBugScreen({ navigation }) {
  const handleEmail = (type) => {
    let subject = type === 'bug' ? 'Bug Report' : 'Other Complaint';
    let body = type === 'bug' ? 'Describe the bug you encountered:' : 'Describe your complaint:';
    Linking.openURL(`mailto:akombea77@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };
  let [fontsLoaded] = useFonts({ Inter_400Regular, Inter_700Bold });
  if (!fontsLoaded) return null;
  return (
    <LinearGradient colors={DEEP_BLUE_GRADIENT} style={{ flex: 1 }}>
      <BlurView intensity={80} tint="dark" style={{ backgroundColor: GLASS_BG_DEEP, borderRadius: 28, borderWidth: 1, borderColor: GLASS_BORDER, margin: 24, padding: 28, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8, alignItems: 'center', justifyContent: 'center', flex: 1 }}>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 24, color: WHITE, marginBottom: 18, textAlign: 'center' }}>Report a Bug or Complaint</Text>
        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 16, color: LIGHT_TEXT, marginBottom: 32, textAlign: 'center' }}>Help us improve CloudStore! Choose an option below to send us an email directly.</Text>
        <TouchableOpacity style={{ backgroundColor: BLUE_ACCENT, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 32, marginBottom: 18, alignSelf: 'stretch', alignItems: 'center', shadowOpacity: 0.10, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 }} onPress={() => handleEmail('bug')}>
          <Text style={{ color: WHITE, fontFamily: 'Inter_700Bold', fontSize: 16 }}>Report a Bug</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ backgroundColor: BLUE_ACCENT, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 32, marginBottom: 18, alignSelf: 'stretch', alignItems: 'center', shadowOpacity: 0.10, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 }} onPress={() => handleEmail('complaint')}>
          <Text style={{ color: WHITE, fontFamily: 'Inter_700Bold', fontSize: 16 }}>Other Complaint</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ backgroundColor: 'rgba(41,121,255,0.08)', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32, marginTop: 18, alignSelf: 'center' }} onPress={() => navigation.goBack()}>
          <Text style={{ color: BLUE_ACCENT, fontFamily: 'Inter_700Bold', fontSize: 16 }}>Back</Text>
        </TouchableOpacity>
      </BlurView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fafd',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 18,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#444',
    marginBottom: 32,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginBottom: 18,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  backBtn: {
    marginTop: 18,
    alignSelf: 'center',
  },
  backBtnText: {
    color: '#2563eb',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 