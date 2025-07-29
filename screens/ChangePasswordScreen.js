import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, Animated, Modal, Image } from 'react-native';
import SimplePrompt from './SimplePrompt';
import { useTheme } from '../theme/ThemeContext';
import { changePassword } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Feather from 'react-native-vector-icons/Feather';
import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';

export default function ChangePasswordScreen({ navigation }) {
  const { theme, constants } = useTheme();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [promptVisible, setPromptVisible] = useState(false);
  const [promptMessage, setPromptMessage] = useState('');
  const [focusedInput, setFocusedInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Initial loading effect - show loading image for 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoading(false);
      // Start fade animation after loading is complete
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async () => {
    if (!current || !next || !confirm) {
      setPromptMessage('Please fill all fields.');
      setPromptVisible(true);
      return;
    }
    if (next !== confirm) {
      setPromptMessage('Passwords do not match.');
      setPromptVisible(true);
      return;
    }
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('jwt');
      if (!token) {
        setPromptMessage('Authentication required.');
        setPromptVisible(true);
        setLoading(false);
        return;
      }
      const res = await changePassword(token, current, next);
      if (res.success) {
        setPromptMessage('Password changed successfully!');
        setPromptVisible(true);
        setTimeout(() => navigation.goBack(), 1200);
      } else {
        setPromptMessage(res.error || 'Failed to change password.');
        setPromptVisible(true);
      }
    } catch (err) {
      setPromptMessage(err.message || 'Network error.');
      setPromptVisible(true);
    } finally {
      setLoading(false);
    }
  };

  let [fontsLoaded] = useFonts({ Inter_400Regular, Inter_700Bold });
  if (!fontsLoaded) return null;

  // Show loading screen for 3 seconds
  if (initialLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }}>
        <Image
          source={require('../assets/images/Screenshot_20250727-213531.jpg')}
          style={{
            width: 250,
            height: 250,
            borderRadius: 20,
            marginBottom: 24
          }}
          resizeMode="cover"
        />
        <Text style={{
          fontFamily: 'Inter_400Regular',
          fontSize: 16,
          color: constants.secondaryText,
          textAlign: 'center'
        }}>
          Loading change password...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <BlurView intensity={90} tint="dark" style={{ backgroundColor: constants.glassBg, borderRadius: 28, borderWidth: 1.5, borderColor: constants.glassBorder, padding: 32, alignItems: 'center', width: '100%', maxWidth: 380, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 12 }}>
          <Feather name="lock" size={48} color={constants.accent} style={{ marginBottom: 18 }} />
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 24, color: constants.primaryText, marginBottom: 12, textAlign: 'center' }}>Change Password</Text>
          <TextInput
            style={{ width: '100%', borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 16, borderWidth: 1.5, fontWeight: '500', height: 52, backgroundColor: 'rgba(255,255,255,0.08)', color: constants.primaryText, borderColor: constants.glassBorder, fontFamily: 'Inter_400Regular' }}
            placeholder="Current password"
            placeholderTextColor={constants.primaryText + '99'}
            secureTextEntry
            value={current}
            onChangeText={setCurrent}
          />
          <TextInput
            style={{ width: '100%', borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 16, borderWidth: 1.5, fontWeight: '500', height: 52, backgroundColor: 'rgba(255,255,255,0.08)', color: constants.primaryText, borderColor: constants.glassBorder, fontFamily: 'Inter_400Regular' }}
            placeholder="New password"
            placeholderTextColor={constants.primaryText + '99'}
            secureTextEntry
            value={next}
            onChangeText={setNext}
          />
          <TextInput
            style={{ width: '100%', borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 16, borderWidth: 1.5, fontWeight: '500', height: 52, backgroundColor: 'rgba(255,255,255,0.08)', color: constants.primaryText, borderColor: constants.glassBorder, fontFamily: 'Inter_400Regular' }}
            placeholder="Confirm new password"
            placeholderTextColor={constants.primaryText + '99'}
            secureTextEntry
            value={confirm}
            onChangeText={setConfirm}
          />
          <TouchableOpacity style={{ backgroundColor: constants.accent, borderRadius: 18, paddingVertical: 16, paddingHorizontal: 32, marginBottom: 12, width: '100%', alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.10, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 }} onPress={handleSubmit} activeOpacity={0.85} disabled={loading}>
            <Text style={{ color: constants.primaryText, fontFamily: 'Inter_700Bold', fontSize: 18, textAlign: 'center' }}>{loading ? 'Changing...' : 'Change Password'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ backgroundColor: 'rgba(41,121,255,0.08)', borderRadius: 18, paddingVertical: 14, paddingHorizontal: 32, alignItems: 'center', justifyContent: 'center', width: '100%' }} onPress={() => navigation.goBack()} activeOpacity={0.85}>
            <Text style={{ color: constants.accent, fontFamily: 'Inter_700Bold', fontSize: 16, textAlign: 'center' }}>Back</Text>
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
          <BlurView intensity={90} tint="dark" style={{ backgroundColor: constants.glassBg, borderRadius: 24, padding: 32, alignItems: 'center', width: 320, borderWidth: 1.5, borderColor: constants.glassBorder, zIndex: 2, shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 16 }}>
            <Feather name={promptMessage.includes('success') ? 'check-circle' : 'alert-circle'} size={48} color={promptMessage.includes('success') ? constants.accent : 'crimson'} style={{ marginBottom: 18 }} />
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: constants.primaryText, marginBottom: 18, textAlign: 'center' }}>{promptMessage}</Text>
            <TouchableOpacity style={{ backgroundColor: constants.accent, borderRadius: 18, paddingVertical: 14, paddingHorizontal: 38, alignItems: 'center', marginTop: 4, width: '100%' }} onPress={() => setPromptVisible(false)} activeOpacity={0.85}>
              <Text style={{ color: constants.primaryText, fontFamily: 'Inter_700Bold', fontSize: 16 }}>OK</Text>
            </TouchableOpacity>
          </BlurView>
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
    width: '100%',
    maxWidth: 350,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 18,
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  inputAligned: {
    width: '100%',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    fontWeight: '500',
    height: 52,
  },
  inputFocused: {
    borderColor: '#0061FF',
    backgroundColor: '#e6f0ff',
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