import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Modal } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';

export default function TwoFactorScreen({ navigation }) {
  const [promptVisible, setPromptVisible] = useState(false);
  const [promptMessage, setPromptMessage] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

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
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <View style={{ backgroundColor: '#000000', borderRadius: 20, borderWidth: 1, borderColor: '#333333', padding: 32, alignItems: 'center', width: '100%', maxWidth: 380, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 20 }}>
          <View style={{ backgroundColor: '#1D9BF0', borderRadius: 50, padding: 16, marginBottom: 24 }}>
            <Feather name="shield" size={32} color="#FFFFFF" />
          </View>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 24, color: '#FFFFFF', marginBottom: 8, textAlign: 'center' }}>Two-Factor Authentication</Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 16, color: '#8B98A5', marginBottom: 32, textAlign: 'center', lineHeight: 22 }}>Add an extra layer of security to your account by enabling fingerprint authentication.</Text>
          <TouchableOpacity
            style={{ backgroundColor: '#1D9BF0', borderRadius: 20, paddingVertical: 14, paddingHorizontal: 32, marginBottom: 12, width: '100%', alignItems: 'center' }}
            onPress={handleEnable}
            activeOpacity={0.8}
          >
            <Text style={{ color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 16, textAlign: 'center' }}>Enable Fingerprint</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ backgroundColor: 'transparent', borderRadius: 20, paddingVertical: 14, paddingHorizontal: 32, alignItems: 'center', width: '100%', borderWidth: 1, borderColor: '#333333' }}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={{ color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 16, textAlign: 'center' }}>Back</Text>
          </TouchableOpacity>
        </View>
      </View>
      {/* Success Modal - Twitter X Style */}
      <Modal
        visible={promptVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPromptVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.8)' }}>
          <View style={{ backgroundColor: '#000000', borderRadius: 16, padding: 24, alignItems: 'center', width: 320, borderWidth: 1, borderColor: '#333333', shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 20 }}>
            <View style={{ backgroundColor: '#1D9BF0', borderRadius: 50, padding: 16, marginBottom: 16 }}>
              <Feather name="check-circle" size={24} color="#FFFFFF" />
            </View>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: '#FFFFFF', marginBottom: 20, textAlign: 'center', lineHeight: 24 }}>{promptMessage}</Text>
            <TouchableOpacity
              style={{ backgroundColor: '#1D9BF0', borderRadius: 20, paddingVertical: 12, paddingHorizontal: 32, alignItems: 'center', minWidth: 120 }}
              onPress={() => setPromptVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={{ color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 16 }}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
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