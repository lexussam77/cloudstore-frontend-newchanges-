import React, { useState, useRef, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, Alert, Image, ActivityIndicator, Animated, Easing } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { AntDesign } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginUser, registerUser } from './api';
import CustomPrompt from './CustomPrompt';
import { AuthContext } from './AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';

export default function AuthScreen({ navigation }) {
  let [fontsLoaded] = useFonts({ Inter_400Regular, Inter_700Bold });
  // Move the fontsLoaded check below, after all hooks
  const DEEP_BLUE_GRADIENT = ['#0a0f1c', '#12203a', '#1a2a4f'];
  const GLASS_BG_DEEP = 'rgba(20,40,80,0.32)';
  const GLASS_BORDER = 'rgba(255,255,255,0.10)';
  const WHITE = '#fff';
  const BLUE_ACCENT = '#2979FF';
  const { theme } = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [promptVisible, setPromptVisible] = useState(false);
  const [promptMessage, setPromptMessage] = useState('');
  const [promptSuccess, setPromptSuccess] = useState(true);
  const flipAnim = useRef(new Animated.Value(0)).current;
  const [flipped, setFlipped] = useState(false);
  const [focusedInput, setFocusedInput] = useState('');
  const { setJwt } = useContext(AuthContext);
  const cardAnim = useRef(new Animated.Value(0)).current;
  const logoAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(cardAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    Animated.timing(logoAnim, {
      toValue: isLogin ? 0 : 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [isLogin]);

  // Interpolate rotation
  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });
  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const flipCard = () => {
    if (!flipped) {
      Animated.timing(flipAnim, {
        toValue: 180,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.ease),
      }).start(() => setFlipped(true));
    } else {
      Animated.timing(flipAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.ease),
      }).start(() => setFlipped(false));
    }
    setIsLogin(!isLogin);
  };

  const handleSubmit = async () => {
    // Validation for login
    if (isLogin) {
      if (!email.trim() || !password.trim()) {
        setPromptMessage('Please enter both email/username and password.');
        setPromptSuccess(false);
        setPromptVisible(true);
        return;
      }
      if (password.length < 6) {
        setPromptMessage('Password must be at least 6 characters.');
        setPromptSuccess(false);
        setPromptVisible(true);
        return;
      }
    } else {
      // Validation for signup
      if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
        setPromptMessage('Please fill in all fields.');
        setPromptSuccess(false);
        setPromptVisible(true);
        return;
      }
      if (password.length < 6 || confirmPassword.length < 6) {
        setPromptMessage('Password must be at least 6 characters.');
        setPromptSuccess(false);
        setPromptVisible(true);
        return;
      }
      if (password !== confirmPassword) {
        setPromptMessage('Passwords do not match.');
        setPromptSuccess(false);
        setPromptVisible(true);
        return;
      }
    }
    setLoading(true);
    if (isLogin) {
      try {
        const res = await loginUser({ identifier: email, password });
        if (res.success && res.data.token) {
          await AsyncStorage.setItem('jwt', res.data.token);
          setJwt(res.data.token);
          setPromptMessage('Login Successful! Welcome back!');
          setPromptSuccess(true);
          setPromptVisible(true);
        } else {
          setPromptMessage(res.error || res.data?.message || 'Invalid credentials.');
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
    } else {
      try {
        const res = await registerUser({ email, password, name });
        if (res.success) {
          setPromptMessage('Registration Successful! Check your email for the verification code.');
          setPromptSuccess(true);
          setPromptVisible(true);
        } else {
          setPromptMessage(res.error || res.data?.message || 'Registration failed.');
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
    }
  };

  const handlePromptClose = () => {
    setPromptVisible(false);
    if (promptSuccess && !isLogin) {
      navigation.navigate('EmailVerification', { email });
    }
  };

  // Render loading indicator if fonts are not loaded
  if (!fontsLoaded) {
    return (
      <View style={{flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#0a0f1c'}}>
        <ActivityIndicator size="large" color="#2979FF" />
      </View>
    );
  }

  return (
    <LinearGradient colors={DEEP_BLUE_GRADIENT} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        {/* Logo */}
        <Animated.View
          style={{ marginBottom: 18, alignItems: 'center', transform: [{ translateY: logoAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -60] }) }] }}
        >
          <AntDesign name="cloud" size={38} color={BLUE_ACCENT} style={{ marginBottom: 2 }} />
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 28, color: WHITE, letterSpacing: 0.2 }}>CloudStore</Text>
        </Animated.View>
        {/* Glassy Flip Card */}
        <Animated.View style={{ width: '100%', maxWidth: 380, opacity: cardAnim, transform: [{ translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }] }}>
          <BlurView intensity={90} tint="dark" style={{ backgroundColor: GLASS_BG_DEEP, borderRadius: 32, borderWidth: 1.5, borderColor: GLASS_BORDER, padding: 32, alignItems: 'center', width: '100%', shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 12, overflow: 'hidden' }}>
            <View style={{ height: isLogin ? 340 : 480, width: '100%', alignItems: 'center', justifyContent: isLogin ? 'center' : 'flex-start', marginTop: isLogin ? 10 : 0, paddingTop: !isLogin ? 14 : 0, paddingBottom: !isLogin ? 8 : 0 }}>
            <Animated.View
                style={[{ position: 'absolute', width: '100%', backfaceVisibility: 'hidden', transform: [{ rotateY: frontInterpolate }] }]}
              pointerEvents={isLogin ? 'auto' : 'none'}
            >
            {isLogin && (
                  <View style={{ width: '100%' }}>
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 22, color: WHITE, marginBottom: 18, textAlign: 'center' }}>Log In</Text>
                <TextInput
                      style={{ width: '100%', borderRadius: 14, padding: 16, fontSize: 16, marginBottom: 16, borderWidth: 1.5, fontFamily: 'Inter_400Regular', backgroundColor: 'rgba(255,255,255,0.08)', color: WHITE, borderColor: GLASS_BORDER }}
                  placeholder="Email or Username"
                  value={email}
                  onChangeText={setEmail}
                      placeholderTextColor={WHITE + '99'}
                  onFocus={() => setFocusedInput('identifier')}
                  onBlur={() => setFocusedInput('')}
                />
                <TextInput
                      style={{ width: '100%', borderRadius: 14, padding: 16, fontSize: 16, marginBottom: 16, borderWidth: 1.5, fontFamily: 'Inter_400Regular', backgroundColor: 'rgba(255,255,255,0.08)', color: WHITE, borderColor: GLASS_BORDER }}
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                      placeholderTextColor={WHITE + '99'}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput('')}
                />
                    <TouchableOpacity style={{ backgroundColor: BLUE_ACCENT, borderRadius: 18, paddingVertical: 16, alignItems: 'center', width: '100%', marginBottom: 10, shadowOpacity: 0.10, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 }} activeOpacity={0.85} onPress={handleSubmit} disabled={loading}>
                      {loading ? <ActivityIndicator color={WHITE} /> : <Text style={{ color: WHITE, fontFamily: 'Inter_700Bold', fontSize: 17, textAlign: 'center' }}>Log in</Text>}
                </TouchableOpacity>
                    <TouchableOpacity onPress={flipCard} style={{ marginTop: 8 }}>
                      <Text style={{ color: WHITE, fontFamily: 'Inter_400Regular', fontSize: 15, textAlign: 'center' }}>Don't have an account? <Text style={{ color: BLUE_ACCENT, fontFamily: 'Inter_700Bold' }}>Sign up</Text></Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
            <Animated.View
                style={[{ position: 'absolute', width: '100%', backfaceVisibility: 'hidden', transform: [{ rotateY: backInterpolate }] }]}
              pointerEvents={!isLogin ? 'auto' : 'none'}
            >
            {!isLogin && (
                  <View style={{ width: '100%' }}>
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 22, color: WHITE, marginTop: 0, marginBottom: 6, textAlign: 'center' }}>Sign Up</Text>
                <TextInput
                      style={{ width: '100%', borderRadius: 14, padding: 16, fontSize: 16, marginBottom: 16, borderWidth: 1.5, fontFamily: 'Inter_400Regular', backgroundColor: 'rgba(255,255,255,0.08)', color: WHITE, borderColor: GLASS_BORDER }}
                  placeholder="Full name"
                  value={name}
                  onChangeText={setName}
                      placeholderTextColor={WHITE + '99'}
                  onFocus={() => setFocusedInput('name')}
                  onBlur={() => setFocusedInput('')}
                />
                <TextInput
                      style={{ width: '100%', borderRadius: 14, padding: 16, fontSize: 16, marginBottom: 16, borderWidth: 1.5, fontFamily: 'Inter_400Regular', backgroundColor: 'rgba(255,255,255,0.08)', color: WHITE, borderColor: GLASS_BORDER }}
                  placeholder="Email address"
                  value={email}
                  onChangeText={setEmail}
                      placeholderTextColor={WHITE + '99'}
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => setFocusedInput('')}
                />
                <TextInput
                      style={{ width: '100%', borderRadius: 14, padding: 16, fontSize: 16, marginBottom: 16, borderWidth: 1.5, fontFamily: 'Inter_400Regular', backgroundColor: 'rgba(255,255,255,0.08)', color: WHITE, borderColor: GLASS_BORDER }}
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                      placeholderTextColor={WHITE + '99'}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput('')}
                />
                <TextInput
                      style={{ width: '100%', borderRadius: 14, padding: 16, fontSize: 16, marginBottom: 16, borderWidth: 1.5, fontFamily: 'Inter_400Regular', backgroundColor: 'rgba(255,255,255,0.08)', color: WHITE, borderColor: GLASS_BORDER }}
                      placeholder="Confirm password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                      placeholderTextColor={WHITE + '99'}
                  onFocus={() => setFocusedInput('confirmPassword')}
                  onBlur={() => setFocusedInput('')}
                />
                    <TouchableOpacity style={{ backgroundColor: BLUE_ACCENT, borderRadius: 18, paddingVertical: 16, alignItems: 'center', width: '100%', marginBottom: 10, shadowOpacity: 0.10, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 }} activeOpacity={0.85} onPress={handleSubmit} disabled={loading}>
                      {loading ? <ActivityIndicator color={WHITE} /> : <Text style={{ color: WHITE, fontFamily: 'Inter_700Bold', fontSize: 17, textAlign: 'center' }}>Sign up</Text>}
                </TouchableOpacity>
                    <TouchableOpacity onPress={flipCard} style={{ marginTop: 8 }}>
                      <Text style={{ color: WHITE, fontFamily: 'Inter_400Regular', fontSize: 15, textAlign: 'center' }}>Already have an account? <Text style={{ color: BLUE_ACCENT, fontFamily: 'Inter_700Bold' }}>Log in</Text></Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        </View>
          </BlurView>
        </Animated.View>
        {/* Prompt Modal */}
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
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 18,
  },
  logoText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  cardWrap: {
    width: '92%',
    maxWidth: 400,
    alignItems: 'center',
    borderRadius: 22,
    padding: 18,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  flipCard: {
    width: '100%',
    height: 340,
    alignItems: 'center',
    justifyContent: 'center',
    backfaceVisibility: 'hidden',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  flipCardBack: {
    zIndex: 2,
  },
  form: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
  },
  input: {
    width: '100%',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    fontWeight: '500',
  },
  inputFocused: {
    // Colors applied dynamically
  },
  submitBtn: {
    width: '100%',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 8,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  submitText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  link: {
    fontWeight: '500',
    fontSize: 15,
    marginTop: 2,
    marginBottom: 8,
    textAlign: 'center',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 8,
  },
  divider: {
    flex: 1,
    height: 1.5,
    borderRadius: 1,
  },
  dividerText: {
    marginHorizontal: 10,
    fontSize: 14,
    fontWeight: '500',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 12,
    paddingHorizontal: 18,
    width: '100%',
    justifyContent: 'center',
    marginTop: 2,
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  googleLogo: {
    width: 22,
    height: 22,
    marginRight: 10,
  },
  googleBtnText: {
    fontWeight: 'bold',
    fontSize: 15,
  },
}); 