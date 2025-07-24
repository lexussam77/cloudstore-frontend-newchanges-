import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Image, Animated, Modal } from 'react-native';
import SimplePrompt from './SimplePrompt';
import { useTheme } from '../theme/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Feather from 'react-native-vector-icons/Feather';
import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';

export default function TwoFactorScreen({ navigation }) {
  const { theme } = useTheme();
  const [promptVisible, setPromptVisible] = useState(false);
  const [promptMessage, setPromptMessage] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const DEEP_BLUE_GRADIENT = ['#0a0f1c', '#12203a', '#1a2a4f'];
  const GLASS_BG_DEEP = 'rgba(20,40,80,0.32)';
  const GLASS_BORDER = 'rgba(255,255,255,0.10)';
  const WHITE = '#fff';
  const BLUE_ACCENT = '#2979FF';

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const handleEnable = () => {
    setPromptMessage('Fingerprint enabled for two-factor authentication!');
    setPromptVisible(true);
    setTimeout(() => navigation.goBack(), 1200);
  };

  let [fontsLoaded] = useFonts({ Inter_400Regular, Inter_700Bold });
  if (!fontsLoaded) return null;

  return (
    <LinearGradient colors={DEEP_BLUE_GRADIENT} style={{ flex: 1 }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <BlurView intensity={90} tint="dark" style={{ backgroundColor: GLASS_BG_DEEP, borderRadius: 28, borderWidth: 1.5, borderColor: GLASS_BORDER, padding: 32, alignItems: 'center', width: '100%', maxWidth: 380, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 12 }}>
          <Feather name="shield" size={48} color={BLUE_ACCENT} style={{ marginBottom: 18 }} />
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 24, color: WHITE, marginBottom: 12, textAlign: 'center' }}>Two-Factor Authentication</Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 16, color: WHITE, marginBottom: 22, textAlign: 'center' }}>Add an extra layer of security to your account by enabling fingerprint authentication.</Text>
          <TouchableOpacity style={{ backgroundColor: BLUE_ACCENT, borderRadius: 18, paddingVertical: 16, paddingHorizontal: 32, marginBottom: 12, width: '100%', alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.10, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 }} onPress={handleEnable} activeOpacity={0.85}>
            <Text style={{ color: WHITE, fontFamily: 'Inter_700Bold', fontSize: 18, textAlign: 'center' }}>Enable fingerprint</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ backgroundColor: 'rgba(41,121,255,0.08)', borderRadius: 18, paddingVertical: 14, paddingHorizontal: 32, alignItems: 'center', justifyContent: 'center', width: '100%' }} onPress={() => navigation.goBack()} activeOpacity={0.85}>
            <Text style={{ color: BLUE_ACCENT, fontFamily: 'Inter_700Bold', fontSize: 16, textAlign: 'center' }}>Back</Text>
          </TouchableOpacity>
        </BlurView>
      </View>
      {/* Glassy confirmation modal */}
      <Modal
        visible={promptVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPromptVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <BlurView intensity={120} tint="dark" style={{ ...StyleSheet.absoluteFillObject, zIndex: 1 }}>
            <View style={{ flex: 1, backgroundColor: 'rgba(10,10,20,0.55)' }} />
          </BlurView>
          <BlurView intensity={90} tint="dark" style={{ backgroundColor: GLASS_BG_DEEP, borderRadius: 24, padding: 32, alignItems: 'center', width: 320, borderWidth: 1.5, borderColor: GLASS_BORDER, zIndex: 2, shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 16 }}>
            <Feather name="check-circle" size={48} color={BLUE_ACCENT} style={{ marginBottom: 18 }} />
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: WHITE, marginBottom: 18, textAlign: 'center' }}>{promptMessage}</Text>
            <TouchableOpacity style={{ backgroundColor: BLUE_ACCENT, borderRadius: 18, paddingVertical: 14, paddingHorizontal: 38, alignItems: 'center', marginTop: 4, width: '100%' }} onPress={() => setPromptVisible(false)} activeOpacity={0.85}>
              <Text style={{ color: WHITE, fontFamily: 'Inter_700Bold', fontSize: 16 }}>OK</Text>
            </TouchableOpacity>
          </BlurView>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    borderRadius: 22,
    padding: 32,
    marginHorizontal: 10,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fingerprintImg: {
    width: 64,
    height: 64,
    marginBottom: 12,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  info: {
    fontSize: 16,
    marginBottom: 22,
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  button: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 8,
    alignItems: 'center',
    width: '100%',
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
  backBtn: {
    marginTop: 18,
    alignSelf: 'center',
  },
  backBtnText: {
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
    letterSpacing: 0.1,
  },
}); 