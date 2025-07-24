import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';

export default function PrivacyPolicyScreen({ navigation }) {
  const { theme } = useTheme();
  let [fontsLoaded] = useFonts({ Inter_400Regular, Inter_700Bold });
  if (!fontsLoaded) return null;
  const DEEP_BLUE_GRADIENT = ['#0a0f1c', '#12203a', '#1a2a4f'];
  const GLASS_BG_DEEP = 'rgba(20,40,80,0.32)';
  const GLASS_BORDER = 'rgba(255,255,255,0.10)';
  const WHITE = '#fff';
  const LIGHT_TEXT = '#e0e6f0';
  const BLUE_ACCENT = '#2979FF';
  return (
    <LinearGradient colors={DEEP_BLUE_GRADIENT} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingVertical: 32, paddingHorizontal: 8 }} showsVerticalScrollIndicator={false}>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 26, color: WHITE, textAlign: 'center', marginBottom: 18 }}>Privacy Policy</Text>
        {[{
          header: null,
          text: 'Your privacy is important to us. This Privacy Policy explains how CloudStore collects, uses, and protects your information.'
        },
        { header: '1. What We Collect', text: 'We collect your name, email, and files you upload. We may also collect usage data to improve our service.' },
        { header: '2. How We Use Your Data', text: 'We use your data to provide and improve CloudStore, communicate with you, and keep your account secure. We do not sell your personal information.' },
        { header: '3. Your Rights', text: 'You can access, update, or delete your data at any time. Contact us to exercise your rights.' },
        { header: '4. Security', text: 'We use industry-standard security to protect your data. However, no system is 100% secure.' },
        { header: '5. Contact', text: 'If you have questions, contact us at privacy@cloudstore.com.' }
        ].map((section, idx) => (
          <BlurView key={idx} intensity={80} tint="dark" style={{ backgroundColor: GLASS_BG_DEEP, borderRadius: 22, borderWidth: 1, borderColor: GLASS_BORDER, marginBottom: 18, padding: 18, shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 }}>
            {section.header && <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 17, color: WHITE, marginBottom: 6 }}>{section.header}</Text>}
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 16, color: LIGHT_TEXT, marginBottom: 0 }}>{section.text}</Text>
          </BlurView>
        ))}
        <TouchableOpacity style={{ borderRadius: 16, paddingVertical: 14, paddingHorizontal: 32, alignSelf: 'center', width: '100%', marginTop: 10, marginBottom: 10, backgroundColor: BLUE_ACCENT, shadowOpacity: 0.10, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 }} onPress={() => navigation.goBack()}>
          <Text style={{ color: WHITE, fontFamily: 'Inter_700Bold', fontSize: 16, textAlign: 'center' }}>Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 18,
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
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 18,
    marginBottom: 6,
    fontFamily: 'System',
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