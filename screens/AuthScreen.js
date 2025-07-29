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
import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';

export default function AuthScreen({ navigation }) {
  let [fontsLoaded] = useFonts({ Inter_400Regular, Inter_700Bold });
  // Move the fontsLoaded check below, after all hooks
  const { theme, constants } = useTheme();
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    <LinearGradient colors={constants.gradient} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 24, marginTop: -380 }}>
        {/* Logo */}
        <Animated.View
          style={{ marginBottom: 40, alignItems: 'center', transform: [{ translateY: logoAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -20] }) }] }}
        >
          <AntDesign name="cloud" size={38} color={constants.accent} style={{ marginBottom: 6 }} />
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 28, color: constants.primaryText, letterSpacing: 0.2 }}>CloudStore</Text>
        </Animated.View>
        {/* Auth Forms */}
        <Animated.View style={{ width: '100%', maxWidth: 400, opacity: cardAnim, transform: [{ translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }] }}>
          <View style={{ width: '100%', alignItems: 'center' }}>
            <Animated.View
                style={[{ position: 'absolute', width: '100%', backfaceVisibility: 'hidden', transform: [{ rotateY: frontInterpolate }] }]}
              pointerEvents={isLogin ? 'auto' : 'none'}
            >
            {isLogin && (
                  <View style={{ width: '100%' }}>
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 24, color: constants.primaryText, marginBottom: 24, textAlign: 'center' }}>Log In</Text>
                <TextInput
                      style={{ width: '100%', borderRadius: 16, padding: 18, fontSize: 16, marginBottom: 16, borderWidth: 2, fontFamily: 'Inter_400Regular', backgroundColor: 'rgba(255,255,255,0.08)', color: constants.primaryText, borderColor: focusedInput === 'identifier' ? constants.accent : constants.glassBorder }}
                  placeholder="Email or Username"
                  value={email}
                  onChangeText={setEmail}
                      placeholderTextColor={constants.primaryText + '99'}
                  onFocus={() => setFocusedInput('identifier')}
                  onBlur={() => setFocusedInput('')}
                />
                <View style={{ position: 'relative', marginBottom: 16 }}>
                  <TextInput
                        style={{ width: '100%', borderRadius: 16, padding: 18, paddingRight: 60, fontSize: 16, borderWidth: 2, fontFamily: 'Inter_400Regular', backgroundColor: 'rgba(255,255,255,0.08)', color: constants.primaryText, borderColor: focusedInput === 'password' ? constants.accent : constants.glassBorder }}
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                        placeholderTextColor={constants.primaryText + '99'}
                    onFocus={() => setFocusedInput('password')}
                    onBlur={() => setFocusedInput('')}
                  />
                  <TouchableOpacity
                    style={{ position: 'absolute', right: 18, top: 18, padding: 4 }}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Feather name={showPassword ? 'eye-off' : 'eye'} size={20} color={constants.primaryText + '99'} />
                  </TouchableOpacity>
                </View>
                    <TouchableOpacity style={{ backgroundColor: constants.accent, borderRadius: 20, paddingVertical: 18, alignItems: 'center', width: '100%', marginBottom: 16, shadowOpacity: 0.10, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 }} activeOpacity={0.85} onPress={handleSubmit} disabled={loading}>
                      {loading ? <ActivityIndicator color={constants.primaryText} /> : <Text style={{ color: constants.primaryText, fontFamily: 'Inter_700Bold', fontSize: 18, textAlign: 'center' }}>Log in</Text>}
                </TouchableOpacity>
                    <TouchableOpacity onPress={flipCard} style={{ marginTop: 12 }}>
                      <Text style={{ color: constants.primaryText, fontFamily: 'Inter_400Regular', fontSize: 16, textAlign: 'center' }}>Don't have an account? <Text style={{ color: constants.accent, fontFamily: 'Inter_700Bold' }}>Sign up</Text></Text>
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
                {/* <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 24, color: constants.primaryText, marginBottom: 20, textAlign: 'center' }}>Create Account</Text> */}
                <TextInput
                      style={{ width: '100%', borderRadius: 16, padding: 18, fontSize: 16, marginBottom: 16, borderWidth: 2, fontFamily: 'Inter_400Regular', backgroundColor: 'rgba(255,255,255,0.08)', color: constants.primaryText, borderColor: focusedInput === 'name' ? constants.accent : constants.glassBorder }}
                  placeholder="Full name"
                  value={name}
                  onChangeText={setName}
                      placeholderTextColor={constants.primaryText + '99'}
                  onFocus={() => setFocusedInput('name')}
                  onBlur={() => setFocusedInput('')}
                />
                <TextInput
                      style={{ width: '100%', borderRadius: 16, padding: 18, fontSize: 16, marginBottom: 16, borderWidth: 2, fontFamily: 'Inter_400Regular', backgroundColor: 'rgba(255,255,255,0.08)', color: constants.primaryText, borderColor: focusedInput === 'email' ? constants.accent : constants.glassBorder }}
                  placeholder="Email address"
                  value={email}
                  onChangeText={setEmail}
                      placeholderTextColor={constants.primaryText + '99'}
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => setFocusedInput('')}
                />
                <View style={{ position: 'relative', marginBottom: 16 }}>
                  <TextInput
                        style={{ width: '100%', borderRadius: 16, padding: 20, paddingRight: 60, fontSize: 18, borderWidth: 2, fontFamily: 'Inter_400Regular', backgroundColor: 'rgba(255,255,255,0.08)', color: constants.primaryText, borderColor: focusedInput === 'password' ? constants.accent : constants.glassBorder }}
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                        placeholderTextColor={constants.primaryText + '99'}
                    onFocus={() => setFocusedInput('password')}
                    onBlur={() => setFocusedInput('')}
                  />
                  <TouchableOpacity
                    style={{ position: 'absolute', right: 20, top: 20, padding: 4 }}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Feather name={showPassword ? 'eye-off' : 'eye'} size={20} color={constants.primaryText + '99'} />
                  </TouchableOpacity>
                </View>
                <View style={{ position: 'relative', marginBottom: 20 }}>
                  <TextInput
                        style={{ width: '100%', borderRadius: 16, padding: 20, paddingRight: 60, fontSize: 18, borderWidth: 2, fontFamily: 'Inter_400Regular', backgroundColor: 'rgba(255,255,255,0.08)', color: constants.primaryText, borderColor: focusedInput === 'confirmPassword' ? constants.accent : constants.glassBorder }}
                        placeholder="Confirm password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                        placeholderTextColor={constants.primaryText + '99'}
                    onFocus={() => setFocusedInput('confirmPassword')}
                    onBlur={() => setFocusedInput('')}
                  />
                  <TouchableOpacity
                    style={{ position: 'absolute', right: 20, top: 20, padding: 4 }}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Feather name={showConfirmPassword ? 'eye-off' : 'eye'} size={20} color={constants.primaryText + '99'} />
                  </TouchableOpacity>
                </View>
                    <TouchableOpacity style={{ backgroundColor: constants.accent, borderRadius: 20, paddingVertical: 18, alignItems: 'center', width: '100%', marginBottom: 16, shadowOpacity: 0.10, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 }} activeOpacity={0.85} onPress={handleSubmit} disabled={loading}>
                      {loading ? <ActivityIndicator color={constants.primaryText} /> : <Text style={{ color: constants.primaryText, fontFamily: 'Inter_700Bold', fontSize: 18, textAlign: 'center' }}>Sign up</Text>}
                </TouchableOpacity>
                    <TouchableOpacity onPress={flipCard} style={{ marginTop: 12 }}>
                      <Text style={{ color: constants.primaryText, fontFamily: 'Inter_400Regular', fontSize: 16, textAlign: 'center' }}>Already have an account? <Text style={{ color: constants.accent, fontFamily: 'Inter_700Bold' }}>Log in</Text></Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        </View>
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