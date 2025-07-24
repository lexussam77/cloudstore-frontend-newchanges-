import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';

export default function TermsOfServiceScreen({ navigation }) {
  const { theme } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  let [fontsLoaded] = useFonts({ Inter_400Regular, Inter_700Bold });
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);
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
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 26, color: WHITE, textAlign: 'center', marginBottom: 18, letterSpacing: 0.1 }}>Terms of Service</Text>
          {[{
            header: null,
            text: 'Welcome to CloudStore! Please read these Terms of Service ("Terms") carefully before using our app. By accessing or using CloudStore, you agree to be bound by these Terms.'
          },
          { header: '1. Using CloudStore', text: 'You must be at least 13 years old to use CloudStore. You are responsible for your account and all activity on it. Please keep your password secure.' },
          { header: '2. Your Content', text: 'You retain ownership of your files. By uploading, you grant us permission to store and back up your files as needed to provide our service. We do not claim ownership of your content.' },
          { header: '3. Prohibited Use', text: 'Do not use CloudStore to store or share illegal, harmful, or infringing content. We reserve the right to suspend accounts that violate these rules.' },
          { header: '4. Termination', text: 'You may stop using CloudStore at any time. We may suspend or terminate your account if you violate these Terms.' },
          { header: '5. Changes', text: 'We may update these Terms from time to time. We will notify you of significant changes.' },
          { header: '6. Contact', text: 'If you have questions, contact us at support@cloudstore.com.' }
          ].map((section, idx) => (
            <BlurView key={idx} intensity={80} tint="dark" style={{ backgroundColor: GLASS_BG_DEEP, borderRadius: 22, borderWidth: 1, borderColor: GLASS_BORDER, marginBottom: 18, padding: 18, shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 }}>
              {section.header && <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 17, color: WHITE, marginBottom: 6 }}>{section.header}</Text>}
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 16, color: LIGHT_TEXT, marginBottom: 0 }}>{section.text}</Text>
            </BlurView>
          ))}
          <TouchableOpacity style={{ borderRadius: 16, paddingVertical: 14, paddingHorizontal: 32, alignSelf: 'center', width: '100%', marginTop: 10, marginBottom: 10, backgroundColor: BLUE_ACCENT, shadowOpacity: 0.10, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 }} onPress={() => navigation.goBack()}>
            <Text style={{ color: WHITE, fontFamily: 'Inter_700Bold', fontSize: 16, textAlign: 'center', letterSpacing: 0.1 }}>Back</Text>
          </TouchableOpacity>
        </Animated.View>
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
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 18,
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  text: {
    fontSize: 16,
    marginBottom: 24,
    fontWeight: '400',
    letterSpacing: 0.1,
  },
  button: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignSelf: 'center',
    width: '100%',
    marginTop: 10,
    marginBottom: 10,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  buttonText: {
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  sectionHeader: {
    fontSize: 17,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 6,
    letterSpacing: 0.1,
  },
  card: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  scrollContent: {
    paddingVertical: 24,
    paddingHorizontal: 8,
  },
}); 