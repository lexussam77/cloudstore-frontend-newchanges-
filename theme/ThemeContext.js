import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Theme constants function
export const getThemeConstants = (isDarkMode, themeVariant = 'default') => {
  if (themeVariant === 'twitter') {
    return {
      gradient: ['#000000', '#000000', '#000000'], // Pure black, no gradient
      glassBg: 'rgba(0, 0, 0, 0.8)', // Pure black with transparency
      glassBorder: 'rgba(255, 255, 255, 0.1)', // White border with low opacity
      primaryText: '#ffffff', // Pure white text
      secondaryText: '#8b98a5', // Twitter's secondary text color
      accent: '#1d9bf0', // Twitter blue
    };
  }

  return {
    gradient: isDarkMode ? ['#0a0f1c', '#12203a', '#1a2a4f'] : ['#f8f9fa', '#e9ecef', '#dee2e6'],
    glassBg: isDarkMode ? 'rgba(20,40,80,0.32)' : 'rgba(255,255,255,0.1)',
    glassBorder: isDarkMode ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.1)',
    primaryText: isDarkMode ? '#fff' : '#1a1a1a',
    secondaryText: isDarkMode ? '#e0e6f0' : '#6b7280',
    accent: '#2979FF',
  };
};

const lightTheme = {
  // Background colors
  background: '#FFFFFF',
  surface: '#F8F9FA',
  card: '#FFFFFF',
  elevated: '#FFFFFF',
  
  // Text colors
  text: '#1A1A1A',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',
  
  // Primary colors
  primary: '#0061FF',
  primaryLight: '#E6F0FF',
  primaryDark: '#0047CC',
  
  // Secondary colors
  secondary: '#F3F4F6',
  secondaryLight: '#F9FAFB',
  secondaryDark: '#E5E7EB',
  
  // Status colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Border colors
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  borderDark: '#D1D5DB',
  
  // Shadow colors
  shadow: '#000000',
  shadowLight: '#000000',
  
  // Search bar
  searchBackground: '#F6F7F9',
  searchText: '#1A1A1A',
  searchPlaceholder: '#9CA3AF',
  
  // File icons
  fileIcon: '#6B7280',
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  
  // Status bar
  statusBar: 'dark',
  statusBarBackground: '#FFFFFF',
};

const darkTheme = {
  // Background colors
  background: '#0F0F0F',
  surface: '#1A1A1A',
  card: '#1F1F1F',
  elevated: '#2A2A2A',
  
  // Text colors
  text: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textTertiary: '#71717A',
  textInverse: '#0F0F0F',
  
  // Primary colors
  primary: '#3B82F6',
  primaryLight: '#1E3A8A',
  primaryDark: '#60A5FA',
  
  // Secondary colors
  secondary: '#27272A',
  secondaryLight: '#3F3F46',
  secondaryDark: '#18181B',
  
  // Status colors
  success: '#22C55E',
  warning: '#FBBF24',
  error: '#F87171',
  info: '#60A5FA',
  
  // Border colors
  border: '#3F3F46',
  borderLight: '#52525B',
  borderDark: '#27272A',
  
  // Shadow colors
  shadow: '#000000',
  shadowLight: '#000000',
  
  // Search bar
  searchBackground: '#27272A',
  searchText: '#FFFFFF',
  searchPlaceholder: '#71717A',
  
  // File icons
  fileIcon: '#A1A1AA',
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.7)',
  
  // Status bar
  statusBar: 'light',
  statusBarBackground: '#0F0F0F',
};

const twitterTheme = {
  // Background colors - Pure Twitter black and white
  background: '#000000', // Pure black
  surface: '#000000', // Pure black
  card: '#000000', // Pure black
  elevated: '#000000', // Pure black

  // Text colors
  text: '#FFFFFF', // Pure white
  textSecondary: '#8B98A5', // Twitter's secondary text
  textTertiary: '#6E767D', // Twitter's tertiary text
  textInverse: '#000000', // Black text for white backgrounds

  // Primary colors
  primary: '#1D9BF0', // Twitter blue
  primaryLight: '#1A8CD8',
  primaryDark: '#1A8CD8',

  // Secondary colors
  secondary: '#000000', // Pure black
  secondaryLight: '#16181C', // Very dark gray for subtle variations
  secondaryDark: '#000000', // Pure black

  // Status colors
  success: '#00BA7C', // Twitter green
  warning: '#FFD400', // Twitter yellow
  error: '#F4212E', // Twitter red
  info: '#1D9BF0', // Twitter blue

  // Border colors
  border: '#2F3336', // Twitter's border color
  borderLight: '#3E4144',
  borderDark: '#1C1F23',

  // Shadow colors
  shadow: '#000000',
  shadowLight: '#000000',

  // Search bar
  searchBackground: '#202327', // Twitter's search background
  searchText: '#FFFFFF',
  searchPlaceholder: '#8B98A5',

  // File icons
  fileIcon: '#8B98A5',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.8)',

  // Status bar
  statusBar: 'light',
  statusBarBackground: '#000000',
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [themeVariant, setThemeVariant] = useState('default');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme_preference');
      const savedVariant = await AsyncStorage.getItem('theme_variant');
      
      if (savedTheme !== null) {
        setIsDarkMode(savedTheme === 'dark');
      } else {
        setIsDarkMode(true);
        await AsyncStorage.setItem('theme_preference', 'dark');
      }
      
      if (savedVariant !== null) {
        setThemeVariant(savedVariant);
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
      setIsDarkMode(true);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = async () => {
    try {
      const newTheme = !isDarkMode;
      setIsDarkMode(newTheme);
      await AsyncStorage.setItem('theme_preference', newTheme ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  // Select theme based on variant and dark mode preference
  let theme;
  if (themeVariant === 'twitter') {
    theme = twitterTheme;
  } else {
    theme = isDarkMode ? darkTheme : lightTheme;
  }

  const constants = getThemeConstants(isDarkMode, themeVariant);

  const value = {
    theme,
    constants,
    isDarkMode,
    themeVariant,
    toggleTheme,
    setThemeVariant,
    isLoading,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext; 
