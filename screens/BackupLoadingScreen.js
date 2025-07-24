import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export default function BackupLoadingScreen({ navigation }) {
  const { theme } = useTheme();
  const [progress, setProgress] = useState(0);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let percent = 0;
    const interval = setInterval(() => {
      percent += 0.01;
      if (percent > 0.05) percent = 0;
      setProgress(percent);
      Animated.timing(anim, {
        toValue: percent,
        duration: 500,
        useNativeDriver: false,
      }).start();
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.header, { color: theme.primary }]}>Backing up your photos…</Text>
      <ActivityIndicator size="large" color={theme.primary} style={{ marginBottom: 32 }} />
      <View style={[styles.progressBarBg, { backgroundColor: theme.secondaryDark }]}>
        <Animated.View style={[styles.progressBarFill, { backgroundColor: theme.primary, width: anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
      </View>
      <Text style={[styles.progressText, { color: theme.primary }]}>{Math.round(progress * 100)}%</Text>
      <Text style={[styles.info, { color: theme.textSecondary }]}>Uploading your photos to the cloud. This may take a while…</Text>
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
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 18,
    textAlign: 'center',
  },
  progressBarBg: {
    width: '80%',
    height: 18,
    borderRadius: 12,
    marginBottom: 18,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 18,
    borderRadius: 12,
  },
  progressText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 18,
  },
  info: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 12,
  },
}); 