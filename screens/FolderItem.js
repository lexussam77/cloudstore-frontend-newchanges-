import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from '../theme/ThemeContext';
import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';

export default function FolderItem({ item, onMenuPress, onPress }) {
  const { theme, constants } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  let [fontsLoaded] = useFonts({ Inter_400Regular, Inter_700Bold });

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, []);

  if (!fontsLoaded) return null;

  const handleFolderPress = () => {
    if (onPress) {
      onPress(item);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return '';
    }
  };

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <TouchableOpacity
        style={{
          backgroundColor: constants.glassBg,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: constants.glassBorder,
          margin: 6,
          width: 140,
          height: 160,
          padding: 0,
          alignItems: 'center',
          justifyContent: 'flex-start',
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 3,
        }}
        onPress={handleFolderPress}
        activeOpacity={0.8}
      >
        {/* Folder Icon */}
        <View style={{
          width: 64,
          height: 64,
          borderRadius: 20,
          backgroundColor: '#3b82f6' + '15',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 20,
          marginBottom: 16,
          borderWidth: 1.5,
          borderColor: '#3b82f6' + '30'
        }}>
          {/* Custom Blue Folder Icon */}
          <View style={{ position: 'relative' }}>
            {/* Folder Base */}
            <View style={{
              width: 36,
              height: 28,
              backgroundColor: '#3b82f6',
              borderRadius: 4,
              borderTopLeftRadius: 8,
              borderTopRightRadius: 8,
            }} />
            {/* Folder Tab */}
            <View style={{
              position: 'absolute',
              top: -6,
              left: 2,
              width: 16,
              height: 8,
              backgroundColor: '#3b82f6',
              borderTopLeftRadius: 4,
              borderTopRightRadius: 4,
            }} />
            {/* Folder Highlight */}
            <View style={{
              position: 'absolute',
              top: 2,
              left: 2,
              right: 2,
              height: 2,
              backgroundColor: '#60a5fa',
              borderRadius: 1,
            }} />
          </View>
        </View>

        {/* Folder Info */}
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 12,
          paddingBottom: 16
        }}>
          <Text
            style={{
              fontFamily: 'Inter_700Bold',
              fontSize: 15,
              color: constants.primaryText,
              textAlign: 'center',
              marginBottom: 6,
              letterSpacing: -0.3,
              lineHeight: 18
            }}
            numberOfLines={2}
          >
            {item.name}
          </Text>
          <Text
            style={{
              fontFamily: 'Inter_400Regular',
              fontSize: 12,
              color: constants.secondaryText,
              textAlign: 'center',
              letterSpacing: -0.2,
              opacity: 0.8
            }}
            numberOfLines={1}
          >
            {formatDate(item.modifiedAt) || 'Folder'}
          </Text>
        </View>

        {/* Menu Button */}
        <TouchableOpacity
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            padding: 8,
            borderRadius: 14,
            backgroundColor: constants.glassBg,
            borderWidth: 1,
            borderColor: constants.glassBorder,
            shadowColor: '#000',
            shadowOpacity: 0.1,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 2 },
            elevation: 2,
          }}
          onPress={(e) => {
            e.stopPropagation();
            onMenuPress && onMenuPress();
          }}
          activeOpacity={0.8}
        >
          <Feather name="more-vertical" size={14} color={constants.secondaryText} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

