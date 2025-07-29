import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Animated } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from '../theme/ThemeContext';
import { BlurView } from 'expo-blur';
import { Inter_400Regular, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';

function getFileIcon(name) {
  if (!name) return 'file-text';
  const ext = name.split('.').pop().toLowerCase();
  if (['pdf'].includes(ext)) return 'file-text'; // PDF icon - using file-text as it's close to PDF appearance
  if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return 'image';
  if (['doc', 'docx'].includes(ext)) return 'file';
  if (['xls', 'xlsx'].includes(ext)) return 'bar-chart-2';
  if (['ppt', 'pptx'].includes(ext)) return 'file';
  if (['mp3', 'wav'].includes(ext)) return 'music';
  if (['mp4', 'mov', 'avi'].includes(ext)) return 'film';
  return 'file-text';
}

export default function FileItem({ item, onMenuPress, onPress, onStarPress, hideActions = false, showCompressedBadge = false }) {
  const { theme, constants } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const starScaleAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleStarPress = () => {
    // Add a small scale animation
    Animated.sequence([
      Animated.timing(starScaleAnim, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(starScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    onStarPress();
  };

  // Determine file type and properties
  const isCompressed = item.name && item.name.includes('_compressed');
  const isImage = item.name && ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(item.name.split('.').pop().toLowerCase());
  const isVideo = item.name && ['mp4', 'mov', 'avi', 'webm', 'mkv'].includes(item.name.split('.').pop().toLowerCase());
  const isFavorited = item.favourite || item.favorites;

  // Modern icon background colors based on file type
  const getIconStyle = () => {
    if (isCompressed) return { bg: 'rgba(29, 155, 240, 0.15)', color: constants.accent };
    if (isImage) return { bg: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' };
    if (isVideo) return { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' };
    return { bg: 'rgba(156, 163, 175, 0.15)', color: constants.secondaryText };
  };

  const iconStyle = getIconStyle();

  let [fontsLoaded] = useFonts({ Inter_400Regular, Inter_700Bold });
  if (!fontsLoaded) return null;

  return (
    <Animated.View style={{ opacity: fadeAnim, width: '100%' }}>
      <TouchableOpacity
        style={{
          backgroundColor: constants.glassBg,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: constants.glassBorder,
          paddingVertical: 14,
          paddingHorizontal: 16,
          marginHorizontal: 12,
          marginVertical: 3,
          flexDirection: 'row',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOpacity: 0.06,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          elevation: 2,
        }}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {/* File Icon */}
        <View style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          backgroundColor: iconStyle.bg,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 14,
          borderWidth: 1,
          borderColor: iconStyle.color + '30'
        }}>
          {isImage && item.url ? (
            <Image source={{ uri: item.url }} style={{ width: 44, height: 44, borderRadius: 12, resizeMode: 'cover' }} />
          ) : (
            <Feather name={getFileIcon(item.name)} size={22} color={iconStyle.color} />
          )}
        </View>

        {/* File Info */}
        <View style={{ flex: 1, justifyContent: 'center', paddingRight: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
            <Text
              style={{
                fontFamily: 'Inter_700Bold',
                fontSize: 16,
                color: constants.primaryText,
                letterSpacing: -0.2,
                flex: 1
              }}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            {showCompressedBadge && (
              <View style={{
                backgroundColor: '#22c55e',
                borderRadius: 6,
                paddingHorizontal: 8,
                paddingVertical: 3,
                marginLeft: 8,
              }}>
                <Text style={{
                  fontFamily: 'Inter_700Bold',
                  fontSize: 9,
                  color: '#ffffff',
                  letterSpacing: 0.5,
                }}>
                  COMPRESSED
                </Text>
              </View>
            )}
          </View>
          <Text
            style={{
              fontFamily: 'Inter_400Regular',
              fontSize: 13,
              color: constants.secondaryText,
              letterSpacing: -0.1,
              opacity: 0.9
            }}
            numberOfLines={1}
          >
            {item.size ? `${(item.size / 1024).toFixed(1)} KB` : 'Unknown size'} • {item.modifiedAt ? new Date(item.modifiedAt).toLocaleDateString() : 'Recently added'}
          </Text>
        </View>

        {/* Action Buttons */}
        {!hideActions && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Animated.View style={{ transform: [{ scale: starScaleAnim }] }}>
              <TouchableOpacity
                style={{
                  padding: 10,
                  borderRadius: 14,
                  backgroundColor: isFavorited ? 'rgba(251, 191, 36, 0.15)' : constants.glassBg,
                  borderWidth: 1.5,
                  borderColor: isFavorited ? 'rgba(251, 191, 36, 0.4)' : constants.glassBorder,
                  shadowColor: '#000',
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 2,
                }}
                onPress={handleStarPress}
                activeOpacity={0.8}
              >
                <Feather
                  name={isFavorited ? "star" : "star"}
                  size={16}
                  color={isFavorited ? "#fbbf24" : constants.secondaryText}
                />
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity
              style={{
                padding: 10,
                borderRadius: 14,
                backgroundColor: constants.glassBg,
                borderWidth: 1.5,
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
              <Feather name="more-vertical" size={16} color={constants.secondaryText} />
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fileCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginHorizontal: 12,
    marginVertical: 4,
    padding: 12,
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  fileThumbWrap: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fileThumbImg: {
    width: 40,
    height: 40,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  fileCardName: {
    fontSize: 16,
    fontWeight: '500',
  },
  fileCardMeta: {
    fontSize: 13,
    marginTop: 2,
  },
  menuButton: {
    padding: 6,
    borderRadius: 20,
  },
  starButton: {
    padding: 6,
    borderRadius: 20,
    marginRight: 4,
  },
}); 