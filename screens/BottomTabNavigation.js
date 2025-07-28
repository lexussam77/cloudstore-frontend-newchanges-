import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HomeScreen from './HomeScreen';
import FilesScreen from './FilesScreen';
import PhotosScreen from './PhotosScreen';
import AccountScreen from './AccountScreen';
import CompressionScreen from './CompressionScreen';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from '../theme/ThemeContext';
import { BlurView } from 'expo-blur';

const TABS = [
  { key: 'Home', label: 'Home', icon: 'home' },
  { key: 'Files', label: 'Files', icon: 'file' },
  { key: 'Compression', label: 'Compress', icon: 'package' },
  { key: 'Photos', label: 'Media', icon: 'image' },
  { key: 'Account', label: 'Profile', icon: 'user' },
];

const { width } = Dimensions.get('window');

export default function BottomTabNavigation({ navigation }) {
  const { theme, constants } = useTheme();
  const [activeTab, setActiveTab] = useState('Home');

  // Simple scale animations for Twitter X style
  const scaleAnimations = {};

  TABS.forEach(tab => {
    scaleAnimations[tab.key] = useRef(new Animated.Value(1)).current;
  });

  useEffect(() => {
    // Simple scale animation for active tab
    TABS.forEach(tab => {
      const isActive = tab.key === activeTab;
      Animated.spring(scaleAnimations[tab.key], {
        toValue: isActive ? 1.05 : 1,
        useNativeDriver: true,
        tension: 300,
        friction: 20,
      }).start();
    });
  }, [activeTab]);

  const handleTabPress = (tab) => {
    if (activeTab !== tab.key) {
      setActiveTab(tab.key);

      // Quick press animation - Twitter X style
      Animated.sequence([
        Animated.spring(scaleAnimations[tab.key], {
          toValue: 0.95,
          useNativeDriver: true,
          tension: 400,
          friction: 15,
        }),
        Animated.spring(scaleAnimations[tab.key], {
          toValue: 1.05,
          useNativeDriver: true,
          tension: 400,
          friction: 15,
        }),
      ]).start();
    }
  };

  let ScreenComponent;
  switch (activeTab) {
    case 'Files':
      ScreenComponent = FilesScreen;
      break;
    case 'Photos':
      ScreenComponent = PhotosScreen;
      break;
    case 'Account':
      ScreenComponent = (props) => <AccountScreen {...props} navigation={navigation} />;
      break;
    case 'Compression':
      ScreenComponent = CompressionScreen;
      break;
    case 'Home':
    default:
      ScreenComponent = HomeScreen;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Main Screen Content */}
      <View style={[styles.content, { pointerEvents: 'box-none' }]}>
        <ScreenComponent />
      </View>

      {/* Twitter X Style Bottom Tab Bar */}
      <View style={[styles.tabBarContainer, { backgroundColor: theme.background }]}>
        <View style={[styles.tabBarContent, { borderTopColor: theme.border }]}>
          {/* Tab Buttons */}
          {TABS.map((tab, index) => {
            const isActive = activeTab === tab.key;

            return (
              <TouchableOpacity
                key={tab.key}
                style={styles.tabButton}
                onPress={() => handleTabPress(tab)}
                activeOpacity={0.6}
              >
                <Animated.View
                  style={[
                    styles.tabIconContainer,
                    {
                      transform: [{ scale: scaleAnimations[tab.key] }],
                    },
                  ]}
                >
                  <Feather
                    name={tab.icon}
                    size={26}
                    color={isActive ? theme.primary : '#FFFFFF'}
                    strokeWidth={isActive ? 3 : 2.5}
                  />
                </Animated.View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  tabBarContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 84, // Twitter X style height
    zIndex: 100,
  },
  tabBarContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 8,
    paddingBottom: 20, // Account for safe area
    paddingHorizontal: 16,
    borderTopWidth: 0.5, // Subtle top border like Twitter X
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
  },
});