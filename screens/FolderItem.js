import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from '../theme/ThemeContext';
import { BlurView } from 'expo-blur';

const GLASS_BG_DEEP = 'rgba(20,40,80,0.32)';
const GLASS_BORDER = 'rgba(255,255,255,0.10)';

export default function FolderItem({ item, onMenuPress, onPress }) {
  const { theme } = useTheme();

  const handleFolderPress = () => {
    if (onPress) {
      onPress(item);
    }
  };

  return (
    <BlurView intensity={70} tint="dark" style={styles.glassCard}>
      <TouchableOpacity style={styles.touchable} onPress={handleFolderPress} activeOpacity={0.85}>
        <View style={styles.folderIconContainer}>
          <Feather name="folder" size={36} color="#2979FF" />
        </View>
        <Text style={styles.folderNameGrid} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.folderMeta} numberOfLines={1}>{item.modifiedAt ? new Date(item.modifiedAt).toLocaleString() : ''}</Text>
        <TouchableOpacity style={styles.menuButton} onPress={onMenuPress} activeOpacity={0.7}>
          <BlurView intensity={60} tint="dark" style={styles.menuBlur}>
            <Feather name="more-vertical" size={22} color="#fff" />
          </BlurView>
        </TouchableOpacity>
      </TouchableOpacity>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  glassCard: {
    borderRadius: 18,
    margin: 8,
    width: 110,
    borderWidth: 1.5,
    borderColor: GLASS_BORDER,
    overflow: 'hidden',
    backgroundColor: GLASS_BG_DEEP,
  },
  touchable: {
    alignItems: 'center',
    padding: 0,
    width: '100%',
    borderRadius: 18,
  },
  folderIconContainer: {
    width: 48,
    height: 48,
    marginBottom: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  folderNameGrid: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
    textAlign: 'center',
    color: '#fff',
    fontFamily: 'Inter',
  },
  folderMeta: {
    fontSize: 12,
    marginBottom: 2,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'Inter',
  },
  menuButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuBlur: {
    borderRadius: 16,
    padding: 4,
    backgroundColor: 'rgba(20,40,80,0.32)',
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 