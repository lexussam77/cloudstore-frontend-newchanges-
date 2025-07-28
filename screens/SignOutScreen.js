import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from './AuthContext';
import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';

export default function SignOutScreen({ navigation }) {
  const { setJwt } = useContext(AuthContext);
  let [fontsLoaded] = useFonts({ Inter_400Regular, Inter_700Bold });
  if (!fontsLoaded) return null;

  const handleSignOut = async () => {
    await AsyncStorage.removeItem('jwt');
    setJwt(null);
    navigation.getParent()?.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <View style={{ backgroundColor: '#000000', borderRadius: 20, borderWidth: 1, borderColor: '#333333', padding: 32, alignItems: 'center', width: '100%', maxWidth: 380, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 20 }}>
          <View style={{ backgroundColor: '#1D9BF0', borderRadius: 50, padding: 16, marginBottom: 24 }}>
            <Feather name="log-out" size={32} color="#FFFFFF" />
          </View>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 24, color: '#FFFFFF', marginBottom: 8, textAlign: 'center' }}>Sign Out</Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 16, color: '#8B98A5', marginBottom: 32, textAlign: 'center', lineHeight: 22 }}>Are you sure you want to sign out of your CloudStore account?</Text>
          <TouchableOpacity
            style={{ backgroundColor: '#1D9BF0', borderRadius: 20, paddingVertical: 14, paddingHorizontal: 32, marginBottom: 12, width: '100%', alignItems: 'center' }}
            onPress={handleSignOut}
            activeOpacity={0.8}
          >
            <Text style={{ color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 16 }}>Sign Out</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ backgroundColor: 'transparent', borderRadius: 20, paddingVertical: 14, paddingHorizontal: 32, alignItems: 'center', width: '100%', borderWidth: 1, borderColor: '#333333' }}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={{ color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 16 }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  iconWrap: {
    borderRadius: 32,
    padding: 18,
    marginBottom: 18,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 18,
    fontFamily: 'System',
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
    fontWeight: '400',
    fontFamily: 'System',
  },
  button: {
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginBottom: 16,
    width: '100%',
    alignItems: 'center',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  buttonText: {
    fontWeight: 'bold',
    fontSize: 18,
    fontFamily: 'System',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  cancelButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'System',
    textAlign: 'center',
  },
  simpleTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
}); 