import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useContext } from 'react';
import { AuthContext } from './AuthContext';
import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';

export default function DeleteAccountScreen({ navigation }) {
  const { setJwt } = useContext(AuthContext);
  let [fontsLoaded] = useFonts({ Inter_400Regular, Inter_700Bold });
  if (!fontsLoaded) return null;

  const handleDelete = async () => {
    // ... your delete logic here ...
    await AsyncStorage.removeItem('jwt');
    setJwt(null);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <View style={{ backgroundColor: '#000000', borderRadius: 20, borderWidth: 1, borderColor: '#333333', padding: 32, alignItems: 'center', width: '100%', maxWidth: 380, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 20 }}>
          <View style={{ backgroundColor: '#F91880', borderRadius: 50, padding: 16, marginBottom: 24 }}>
            <Feather name="x-circle" size={32} color="#FFFFFF" />
          </View>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 24, color: '#F91880', marginBottom: 8, textAlign: 'center' }}>Delete Account</Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 16, color: '#8B98A5', marginBottom: 32, textAlign: 'center', lineHeight: 22 }}>Are you sure you want to permanently delete your CloudStore account? This action cannot be undone.</Text>
          <TouchableOpacity
            style={{ backgroundColor: '#F91880', borderRadius: 20, paddingVertical: 14, paddingHorizontal: 32, marginBottom: 12, width: '100%', alignItems: 'center' }}
            onPress={handleDelete}
            activeOpacity={0.8}
          >
            <Text style={{ color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 16 }}>Delete Account</Text>
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