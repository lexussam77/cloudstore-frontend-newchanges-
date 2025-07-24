import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Animated } from 'react-native';
import HomeScreen from './HomeScreen';
import FilesScreen from './FilesScreen';
import PhotosScreen from './PhotosScreen';
import AccountScreen from './AccountScreen';
import CompressionScreen from './CompressionScreen';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from '../theme/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

const TABS = [
  { key: 'Home', label: 'Home', icon: 'home' },
  { key: 'Files', label: 'Files', icon: 'file' },
  { key: 'Compression', label: 'Compression', icon: 'package' },
  { key: 'Photos', label: 'Photos', icon: 'image' },
  { key: 'Account', label: 'Account', icon: 'user' },
];

const NAV_GRADIENT = ['#0a0f1c', '#12203a', '#1a2a4f'];

export default function BottomTabNavigation({ navigation }) {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('Home');
  const [pressedTab, setPressedTab] = useState(null);

  // Animation values for each tab
  const tabAnim = {};
  TABS.forEach(tab => {
    tabAnim[tab.key] = useRef(new Animated.Value(0)).current;
  });

  const handleTabPressIn = (tab) => {
    setPressedTab(tab.key);
    Animated.spring(tabAnim[tab.key], {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 8,
    }).start();
  };
  const handleTabPressOut = (tab) => {
    Animated.spring(tabAnim[tab.key], {
      toValue: 0,
      useNativeDriver: true,
      speed: 20,
      bounciness: 8,
    }).start(() => setPressedTab(null));
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

  const handleTabPress = (tab) => {
    setActiveTab(tab.key);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Main Screen Content */}
      <View style={[styles.content, { pointerEvents: 'box-none' }]}>
        <ScreenComponent />
      </View>
      {/* Bottom Tab Bar */}
      <View style={styles.tabBarContainer}>
        <LinearGradient
          colors={NAV_GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.tabBarGradient}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={styles.tabButton}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.8}
              >
                <Feather
                  name={tab.icon}
                  size={isActive ? 30 : 26}
                  color={isActive ? '#2979FF' : '#fff'}
                  style={isActive ? styles.activeIcon : styles.inactiveIcon}
                />
              </TouchableOpacity>
            );
          })}
        </LinearGradient>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    top: 15,
  },
  topBarTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'System',
    flex: 1,
    textAlign: 'center',
  },

  content: {
    flex: 1,
    // pointerEvents: 'box-none', // uncomment if touch issues occur
  },
  tabBarContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 70,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -2 },
    elevation: 20, // increased for overlay
    zIndex: 100, // ensure always on top
  },
  tabBarGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  activeIcon: {
    // Optionally add a glow or shadow for the active icon
    textShadowColor: '#2979FF44',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  inactiveIcon: {},
});