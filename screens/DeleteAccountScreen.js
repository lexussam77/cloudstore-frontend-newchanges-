import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useContext } from 'react';
import { AuthContext } from './AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';

const DEEP_BLUE_GRADIENT = ['#0a0f1c', '#12203a', '#1a2a4f'];
const GLASS_BG_DEEP = 'rgba(20,40,80,0.32)';
const GLASS_BORDER = 'rgba(255,255,255,0.10)';
const WHITE = '#fff';
const LIGHT_TEXT = '#e0e6f0';
const BLUE_ACCENT = '#2979FF';

export default function DeleteAccountScreen({ navigation }) {
  const { setJwt } = useContext(AuthContext);
  const { theme } = useTheme();
  let [fontsLoaded] = useFonts({ Inter_400Regular, Inter_700Bold });
  if (!fontsLoaded) return null;

  const handleDelete = async () => {
    // ... your delete logic here ...
    await AsyncStorage.removeItem('jwt');
    setJwt(null);
  };

  return (
    <LinearGradient colors={DEEP_BLUE_GRADIENT} style={{ flex: 1 }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <BlurView intensity={90} tint="dark" style={{ backgroundColor: GLASS_BG_DEEP, borderRadius: 28, borderWidth: 1.5, borderColor: GLASS_BORDER, padding: 32, alignItems: 'center', width: '100%', maxWidth: 380, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 12 }}>
          <Feather name="x-circle" size={48} color={'crimson'} style={{ marginBottom: 18 }} />
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 28, color: 'crimson', marginBottom: 12, textAlign: 'center' }}>Delete Account</Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 16, color: LIGHT_TEXT, marginBottom: 32, textAlign: 'center' }}>Are you sure you want to permanently delete your CloudStore account? This action cannot be undone.</Text>
          <TouchableOpacity style={{ backgroundColor: 'crimson', borderRadius: 18, paddingVertical: 16, paddingHorizontal: 32, marginBottom: 16, width: '100%', alignItems: 'center', shadowOpacity: 0.10, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 }} onPress={handleDelete} activeOpacity={0.85}>
            <Text style={{ color: WHITE, fontFamily: 'Inter_700Bold', fontSize: 18 }}>Delete Account</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ backgroundColor: 'rgba(41,121,255,0.08)', borderRadius: 18, paddingVertical: 14, paddingHorizontal: 32, alignItems: 'center', width: '100%' }} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Text style={{ color: BLUE_ACCENT, fontFamily: 'Inter_700Bold', fontSize: 16 }}>Cancel</Text>
          </TouchableOpacity>
        </BlurView>
      </View>
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