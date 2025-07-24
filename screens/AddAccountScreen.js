import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, Image, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './api';

export default function AddAccountScreen({ navigation }) {
  const [modalVisible, setModalVisible] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [focusedInput, setFocusedInput] = useState('');

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Missing Fields', 'Please fill in all fields to create your account.');
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const text = await response.text();
      console.log('RESPONSE:', text);
      let data = {};
      try { data = text ? JSON.parse(text) : {}; } catch (e) { /* ignore */ }
      if (response.ok) {
        // Store JWT and email in AsyncStorage
        await AsyncStorage.setItem('jwt', data.token || '');
        await AsyncStorage.setItem('email', email);
        // Navigate to EmailVerificationScreen, passing email
        navigation.navigate('EmailVerification', { email });
      } else if (data.error) {
        let msg = data.error;
        if (msg.includes('exists')) msg = 'An account with that email already exists.';
        if (msg.includes('required')) msg = 'Please fill in all required fields.';
        Alert.alert('Registration Failed', msg);
      } else {
        Alert.alert('Registration Failed', 'An unexpected error occurred. Please try again or contact support.');
      }
    } catch (err) {
      Alert.alert('Network Error', 'Cannot connect to server. Please check your internet connection and try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.simpleTitle}>Add Account</Text>
      {/* Background illustration and logo */}
      <View style={styles.bgContent}>
        <Image source={require('../assets/images/CloudStore.png')} style={styles.logo} />
        <Text style={styles.headline}>Store, edit, share</Text>
        <View style={styles.illustrationPlaceholder}>
          <Ionicons name="cloud-outline" size={80} color="#2563eb" />
          <Text style={styles.illustrationText}>CloudStore</Text>
        </View>
      </View>
      {/* Modal bottom sheet */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Create your CloudStore account</Text>
            <TouchableOpacity style={styles.googleBtn} activeOpacity={0.85}>
              <Image source={require('../assets/images/Google.png')} style={styles.googleIcon} />
              <Text style={styles.googleText}>Continue with Google</Text>
            </TouchableOpacity>
            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.orText}>Or</Text>
              <View style={styles.divider} />
            </View>
            <TextInput
              style={[styles.input, focusedInput === 'name' && styles.inputFocused]}
              placeholder="Full Name"
              value={name}
              onChangeText={setName}
              onFocus={() => setFocusedInput('name')}
              onBlur={() => setFocusedInput('')}
            />
            <TextInput
              style={[styles.input, focusedInput === 'email' && styles.inputFocused]}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              onFocus={() => setFocusedInput('email')}
              onBlur={() => setFocusedInput('')}
            />
            <TextInput
              style={[styles.input, focusedInput === 'password' && styles.inputFocused]}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              onFocus={() => setFocusedInput('password')}
              onBlur={() => setFocusedInput('')}
            />
            <TouchableOpacity style={styles.continueBtn} activeOpacity={0.85} onPress={() => navigation.navigate('EmailVerification', { email })}>
              <Text style={styles.continueText}>Continue</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.troubleBtn}>
              <Text style={styles.troubleText}>Having trouble signing up?</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8fc',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 350,
    shadowColor: '#0061FF',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    alignItems: 'center',
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0061FF',
    marginBottom: 18,
    fontFamily: 'System',
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#faf9f7',
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
    color: '#222',
    fontFamily: 'System',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#eee',
  },
  button: {
    backgroundColor: '#0061FF',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginBottom: 16,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#0061FF',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    fontFamily: 'System',
  },
  link: {
    color: '#0061FF',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'System',
    textAlign: 'center',
    marginTop: 8,
  },
  error: {
    color: 'crimson',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  bgContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  logo: {
    width: 48,
    height: 48,
    marginBottom: 18,
    resizeMode: 'contain',
  },
  headline: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 18,
    textAlign: 'center',
  },
  illustration: {
    width: 260,
    height: 160,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  illustrationPlaceholder: {
    width: 260,
    height: 160,
    backgroundColor: '#e0e7ef',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  illustrationText: {
    color: '#2563eb',
    fontWeight: 'bold',
    fontSize: 20,
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -2 },
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 18,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e7ef',
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginBottom: 18,
    width: '100%',
    justifyContent: 'center',
  },
  googleIcon: {
    width: 22,
    height: 22,
    marginRight: 10,
    resizeMode: 'contain',
  },
  googleText: {
    fontSize: 16,
    color: '#222',
    fontWeight: '500',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    width: '100%',
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e7ef',
  },
  orText: {
    marginHorizontal: 10,
    color: '#888',
    fontWeight: 'bold',
  },
  continueBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  continueText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  troubleBtn: {
    marginTop: 6,
  },
  troubleText: {
    color: '#2563eb',
    fontWeight: '500',
    fontSize: 15,
    textAlign: 'center',
  },
  simpleTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
    marginTop: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  inputFocused: {
    borderColor: '#0061FF',
    backgroundColor: '#e6f0ff',
  },
}); 