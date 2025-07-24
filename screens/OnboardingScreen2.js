import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';

export default function OnboardingScreen2({ navigation }) {
  let [fontsLoaded] = useFonts({ Inter_400Regular, Inter_700Bold });
  if (!fontsLoaded) return null;
  const DEEP_BLUE_GRADIENT = ['#0a0f1c', '#12203a', '#1a2a4f'];
  const GLASS_BG_DEEP = 'rgba(20,40,80,0.32)';
  const GLASS_BORDER = 'rgba(255,255,255,0.10)';
  const WHITE = '#fff';
  const BLUE_ACCENT = '#2979FF';
  return (
    <LinearGradient colors={DEEP_BLUE_GRADIENT} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <BlurView intensity={90} tint="dark" style={{ backgroundColor: GLASS_BG_DEEP, borderRadius: 32, borderWidth: 1.5, borderColor: GLASS_BORDER, padding: 32, alignItems: 'center', width: '100%', maxWidth: 340, marginBottom: 32, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 12 }}>
          <Image source={require('../assets/images/Upload.png')} style={{ width: 140, height: 140, borderRadius: 24, marginBottom: 18 }} />
        </BlurView>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 30, color: WHITE, marginBottom: 14, textAlign: 'center', letterSpacing: 0.5 }}>Upload and organize</Text>
        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 17, color: WHITE, marginBottom: 36, textAlign: 'center', lineHeight: 24 }}>Easily upload files and keep them organized in folders with CloudStore.</Text>
        <TouchableOpacity style={{ backgroundColor: BLUE_ACCENT, borderRadius: 999, paddingVertical: 18, alignItems: 'center', width: '100%', shadowColor: BLUE_ACCENT, shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 2 }} activeOpacity={0.85} onPress={() => navigation.navigate('Onboarding3')}>
          <Text style={{ color: WHITE, fontFamily: 'Inter_700Bold', fontSize: 19, letterSpacing: 0.5, textAlign: 'center' }}>Next</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  illustration: {
    width: 140,
    height: 140,
    marginBottom: 36,
    resizeMode: 'contain',
    borderRadius: 24,
    backgroundColor: '#f5f3ef',
    shadowColor: '#007AFF',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
}); 