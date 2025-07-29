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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.8)' }]}>
        <Animated.View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 24,
          transform: [{ scale: scaleAnim }]
        }}>
          <BlurView intensity={90} tint="dark" style={{
            backgroundColor: 'rgba(20,40,80,0.32)',
            borderRadius: 24,
            padding: 32,
            borderWidth: 1.5,
            borderColor: 'rgba(255,255,255,0.10)',
            shadowColor: '#000',
            shadowOpacity: 0.25,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: 10 },
            elevation: 20,
            alignItems: 'center',
            minWidth: 280,
            maxWidth: 320
          }}>
            <View style={{ backgroundColor: success ? '#1D9BF0' : '#F91880', borderRadius: 50, padding: 16, marginBottom: 16 }}>
              <AntDesign
                name={success ? 'checkcircle' : 'closecircle'}
                size={48}
                color="#FFFFFF"
              />
            </View>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: '#FFFFFF', textAlign: 'center', marginBottom: 20, lineHeight: 24 }}>{message}</Text>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.8}
              style={{ backgroundColor: '#1D9BF0', borderRadius: 20, paddingVertical: 12, paddingHorizontal: 32, alignItems: 'center', minWidth: 120 }}
            >
              <Text style={{ color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 16 }}>OK</Text>
            </TouchableOpacity>
          </BlurView>
        </Animated.View>
      </View>
    </Modal>
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