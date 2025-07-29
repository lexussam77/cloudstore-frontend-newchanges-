import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, verifyEmail } from './api';
import CustomPrompt from './CustomPrompt';
import { useTheme } from '../theme/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';

export default function EmailVerificationScreen({ navigation, route }) {
  const { theme, constants } = useTheme();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [email, setEmail] = useState(route?.params?.email || '');
  const inputs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
  const [loading, setLoading] = useState(false);
  const [promptVisible, setPromptVisible] = useState(false);
  const [promptMessage, setPromptMessage] = useState('');
  const [promptSuccess, setPromptSuccess] = useState(true);
  const cardAnim = useRef(new Animated.Value(0)).current;
  const [focusedInput, setFocusedInput] = useState(-1);

  // If email is not passed, try to get it from AsyncStorage
  useEffect(() => {
    if (!email) {
      AsyncStorage.getItem('email').then(storedEmail => {
        if (storedEmail) setEmail(storedEmail);
      });
    }
  }, []);

  useEffect(() => {
    Animated.timing(cardAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const handleChange = (text, idx) => {
    if (/^[0-9]?$/.test(text)) {
      const newCode = [...code];
      newCode[idx] = text;
      setCode(newCode);
      if (text && idx < 5) {
        inputs[idx + 1].current.focus();
      }
      if (!text && idx > 0) {
        inputs[idx - 1].current.focus();
      }
    }
  };

  const handleVerify = async () => {
    setLoading(true);
      const codeStr = code.join('');
    if (codeStr.length !== 6) {
      setPromptMessage('Please enter the 6-digit code.');
      setPromptSuccess(false);
      setPromptVisible(true);
      setLoading(false);
      return;
    }
    if (!email) {
      setPromptMessage('Email is missing.');
      setPromptSuccess(false);
      setPromptVisible(true);
      setLoading(false);
      return;
    }
    console.log('Verifying email:', email, 'with code:', codeStr);
    try {
      const res = await verifyEmail({ email, code: codeStr });
      if (res.success) {
        setPromptMessage('Email verified! You can now log in.');
        setPromptSuccess(true);
        setPromptVisible(true);
      } else {
        setPromptMessage(res.error || res.data?.message || 'Invalid code.');
        setPromptSuccess(false);
        setPromptVisible(true);
      }
    } catch (err) {
      setPromptMessage(err.message || 'Network error.');
      setPromptSuccess(false);
      setPromptVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handlePromptClose = () => {
    setPromptVisible(false);
    if (promptSuccess) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Auth' }],
      });
    }
  };

  let [fontsLoaded] = useFonts({ Inter_400Regular, Inter_700Bold });
  if (!fontsLoaded) return null;

  return (
    <LinearGradient colors={constants.gradient} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 12 }}>
        <BlurView intensity={90} tint="dark" style={{ backgroundColor: constants.glassBg, borderRadius: 28, borderWidth: 1.5, borderColor: constants.glassBorder, padding: 32, alignItems: 'center', width: '100%', maxWidth: 380, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 12 }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 24, color: constants.primaryText, marginBottom: 10, textAlign: 'center', letterSpacing: 0.1 }}>Verify your CloudStore email</Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 16, color: constants.secondaryText, marginBottom: 18, textAlign: 'center', letterSpacing: 0.1 }}>Enter the 6-digit verification code sent to your email address.</Text>
          <View style={{ width: '100%', alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 32, marginTop: 16, alignSelf: 'center' }}>
              {code.map((digit, idx) => (
                <TextInput
                  key={idx}
                  ref={inputs[idx]}
                  style={[
                    { borderRadius: 12, paddingHorizontal: 0, paddingVertical: 12, fontSize: 24, borderWidth: 1.5, textAlign: 'center', width: 48, height: 64, fontWeight: 'bold', letterSpacing: 1, includeFontPadding: false, textAlignVertical: 'center', marginHorizontal: 2, backgroundColor: 'rgba(255,255,255,0.08)', fontFamily: 'Inter_700Bold', color: constants.primaryText },
                    { borderColor: constants.glassBorder },
                    digit && { borderColor: constants.accent, backgroundColor: constants.accent + '20' },
                    focusedInput === idx && { borderColor: constants.accent }
                  ]}
                  value={digit}
                  onChangeText={text => handleChange(text, idx)}
                  keyboardType="number-pad"
                  maxLength={1}
                  placeholder=""
                  placeholderTextColor="transparent"
                  returnKeyType="next"
                  autoFocus={idx === 0}
                  onFocus={() => setFocusedInput(idx)}
                  onBlur={() => setFocusedInput(-1)}
                />
              ))}
            </View>
          </View>
          <TouchableOpacity style={{ borderRadius: 18, paddingVertical: 16, paddingHorizontal: 32, width: '100%', alignItems: 'center', backgroundColor: constants.accent, shadowOpacity: 0.10, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2, marginTop: 8 }} activeOpacity={0.85} onPress={handleVerify} disabled={loading}>
            {loading ? <ActivityIndicator color={constants.primaryText} /> : <Text style={{ color: constants.primaryText, fontFamily: 'Inter_700Bold', fontSize: 17, textAlign: 'center' }}>Verify Email</Text>}
          </TouchableOpacity>
        </BlurView>
        {loading && (
          <View style={{ ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
            <ActivityIndicator size="large" color={constants.accent} />
          </View>
        )}
        <CustomPrompt
          visible={promptVisible}
          message={promptMessage}
          onClose={handlePromptClose}
          success={promptSuccess}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  card: {
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 350,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    alignItems: 'center',
    marginBottom: 18,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  message: {
    fontSize: 16,
    fontWeight: '400',
    marginBottom: 18,
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  codeInputRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 16,
    gap: 4, // reduced from 12
    alignSelf: 'center',
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 0,
    paddingVertical: 12,
    fontSize: 24,
    borderWidth: 1.5,
    textAlign: 'center',
    width: 40, // reduced from 44
    height: 64, // increased from 50
    fontWeight: 'bold',
    letterSpacing: 1,
    includeFontPadding: false,
    textAlignVertical: 'center',
    marginHorizontal: 2, // reduced from 4
    backgroundColor: 'transparent',
  },
  inputFilled: {
    // Colors applied dynamically
  },
  inputFocused: {
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  button: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
}); 