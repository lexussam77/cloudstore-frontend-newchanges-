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

export default function FileItem({ item, onMenuPress, onPress, onStarPress }) {
  const { theme } = useTheme();
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

  // Determine if this is a compressed file
  const isCompressed = item.name && item.name.includes('_compressed');
  const isImage = item.name && ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(item.name.split('.').pop().toLowerCase());
  const isVideo = item.name && ['mp4', 'mov', 'avi', 'webm', 'mkv'].includes(item.name.split('.').pop().toLowerCase());
  const isFavorited = item.favourite || item.favorites;
  // Choose vibrant color for compressed files
  const compressedBg = isCompressed ? '#e0f2fe' : theme.secondaryLight;
  const compressedIcon = isCompressed ? '#0ea5e9' : theme.primary;

  let [fontsLoaded] = useFonts({ Inter_400Regular, Inter_700Bold });
  if (!fontsLoaded) return null;

  return (
    <Animated.View style={{ opacity: fadeAnim, width: '100%' }}>
      <BlurView intensity={90} tint="dark" style={{
        backgroundColor: 'rgba(20,40,80,0.32)',
        borderRadius: 14, // reduced from 22
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.10)',
        paddingVertical: 8, // reduced
        paddingHorizontal: 10, // slightly reduced
        width: '95%',
        alignSelf: 'center',
        marginHorizontal: 0,
        marginVertical: 4, // reduced
        flexDirection: 'row',
        alignItems: 'center',
        overflow: 'hidden',
        // Removed shadowColor, shadowOpacity, shadowRadius, shadowOffset, elevation for no glow
      }}>
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }} onPress={onPress} activeOpacity={0.8}>
          <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: compressedBg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginRight: 12 }}>
          {isImage && item.url ? (
              <Image source={{ uri: item.url }} style={{ width: 44, height: 44, borderRadius: 12, resizeMode: 'cover' }} />
          ) : isVideo && item.url ? (
              <Feather name="film" size={28} color={compressedIcon} />
          ) : (
              <Feather name={getFileIcon(item.name)} size={28} color={compressedIcon} />
          )}
        </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: theme.text, marginBottom: 2 }} numberOfLines={1}>{item.name}</Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: theme.textSecondary }} numberOfLines={1}>{item.modifiedAt ? new Date(item.modifiedAt).toLocaleString() : ''} {item.size ? `• ${item.size}` : ''}</Text>
        </View>
        </TouchableOpacity>
        <Animated.View style={{ transform: [{ scale: starScaleAnim }] }}>
          <TouchableOpacity 
            style={{ padding: 6, borderRadius: 20, marginRight: 2, backgroundColor: 'rgba(255,255,255,0.08)' }} 
            onPress={handleStarPress} 
            activeOpacity={0.7}
          >
            <Feather 
              name={isFavorited ? "star" : "star"} 
              size={20} 
              color={isFavorited ? "#fbbf24" : theme.textTertiary} 
            />
          </TouchableOpacity>
        </Animated.View>
        <TouchableOpacity style={{ padding: 6, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)', marginLeft: 2 }} onPress={onMenuPress} activeOpacity={0.7}>
          <Feather name="more-vertical" size={22} color={theme.textSecondary} />
        </TouchableOpacity>
      </BlurView>
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