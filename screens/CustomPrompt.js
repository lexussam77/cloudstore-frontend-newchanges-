import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { useTheme } from '../theme/ThemeContext';
import { useNotification } from './AuthContext';
import { BlurView } from 'expo-blur';
import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';

export default function CustomPrompt({ visible, message, onClose, success = true }) {
  const { theme } = useTheme();
  const { addNotification } = useNotification();
  // Animation for icon pop
  const scaleAnim = useRef(new Animated.Value(0)).current;
  let [fontsLoaded] = useFonts({ Inter_400Regular, Inter_700Bold });
  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0);
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }).start();
      // Send notification when prompt is shown
      addNotification(message, success ? 'success' : 'error');
    }
  }, [visible]);

  if (!visible || !fontsLoaded) return null;

  const GLASS_BG_DEEP = 'rgba(20,40,80,0.32)';
  const GLASS_BORDER = 'rgba(255,255,255,0.10)';
  const WHITE = '#fff';
  const BLUE_ACCENT = '#2979FF';
  return (
    <View style={[styles.overlay, { backgroundColor: 'rgba(10,20,40,0.55)' }]}> 
      <BlurView intensity={120} tint="dark" style={{ ...StyleSheet.absoluteFillObject, zIndex: 1 }} />
      <Animated.View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 18, transform: [{ scale: scaleAnim }], zIndex: 2 }}>
        <BlurView intensity={90} tint="dark" style={{ backgroundColor: GLASS_BG_DEEP, borderRadius: 48, padding: 18, borderWidth: 1.5, borderColor: GLASS_BORDER, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 8 }}>
          <AntDesign
            name={success ? 'checkcircle' : 'closecircle'}
            size={84}
            color={success ? BLUE_ACCENT : 'crimson'}
          />
        </BlurView>
      </Animated.View>
      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: WHITE, textAlign: 'center', marginBottom: 14, marginHorizontal: 24, zIndex: 2 }}>{message}</Text>
      <TouchableOpacity onPress={onClose} activeOpacity={0.85} style={{ backgroundColor: BLUE_ACCENT, borderRadius: 18, paddingVertical: 14, paddingHorizontal: 38, alignItems: 'center', marginTop: 4, shadowOpacity: 0.10, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2, zIndex: 2 }}>
        <Text style={{ color: WHITE, fontFamily: 'Inter_700Bold', fontSize: 16 }}>OK</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  iconWrap: {
    marginBottom: 18,
    borderRadius: 48,
    padding: 16,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  promptText: {
    fontSize: 17,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    marginHorizontal: 24,
  },
  promptBtn: {
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginTop: 4,
  },
  promptBtnText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 