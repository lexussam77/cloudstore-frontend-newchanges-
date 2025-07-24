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

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme_preference');
      if (savedTheme !== null) {
        setIsDarkMode(savedTheme === 'dark');
      } else {
        // Default to dark mode permanently
        setIsDarkMode(true);
        await AsyncStorage.setItem('theme_preference', 'dark');
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

  const theme = isDarkMode ? darkTheme : lightTheme;

  const value = {
    theme,
    isDarkMode,
    toggleTheme,
    isLoading,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext; 