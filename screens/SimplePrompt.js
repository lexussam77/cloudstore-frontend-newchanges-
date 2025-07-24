import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
// If using expo-blur, uncomment the next line:
// import { BlurView } from 'expo-blur';

export default function SimplePrompt({ visible, message, onClose }) {
  const { theme } = useTheme();
  
  if (!visible) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* Uncomment BlurView below if using expo-blur, else use fallback overlay */}
      {/* <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} /> */}
      <View style={[styles.overlay, { backgroundColor: theme.overlay }]} />
      <View style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
        <Text style={[styles.text, { color: theme.primary }]}>{message}</Text>
        <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={onClose} activeOpacity={0.85}>
          <Text style={[styles.buttonText, { color: theme.textInverse }]}>OK</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    // If using BlurView, you can remove this backgroundColor
  },
  card: {
    position: 'absolute',
    top: '40%',
    left: '8%',
    right: '8%',
    borderRadius: 22,
    padding: 32,
    alignItems: 'center',
    shadowOpacity: 0.22,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  text: {
    fontSize: 17,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 18,
  },
  button: {
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 36,
    alignItems: 'center',
  },
  buttonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 