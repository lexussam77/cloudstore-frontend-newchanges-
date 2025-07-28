i// Design system constants that work with both light and dark themes
export const GRADIENTS = {
  // Current deep blue gradient
  DEEP_BLUE: ['#0a0f1c', '#12203a', '#1a2a4f'],
  
  // Twitter/X dark theme gradient
  TWITTER_X: ['#000000', '#0f1419', '#1d2328'],
  
  // Alternative gradients for future experiments
  PURPLE_NIGHT: ['#0f0a1c', '#1a0f2a', '#2a1a4f'],
  GREEN_FOREST: ['#0a1c0f', '#12302a', '#1a4f2a'],
  SUNSET: ['#1c0f0a', '#2a1f12', '#4f2f1a'],
};

export const GLASS_EFFECTS = {
  // Twitter/X glass effects
  TWITTER_BG: 'rgba(29, 35, 40, 0.8)',
  TWITTER_BORDER: 'rgba(83, 100, 113, 0.24)',
  
  // Original effects
  BG_DEEP: 'rgba(20,40,80,0.32)',
  BG_LIGHT: 'rgba(255,255,255,0.1)',
  BORDER: 'rgba(255,255,255,0.10)',
  BORDER_LIGHT: 'rgba(0,0,0,0.1)',
};

export const ACCENT_COLORS = {
  TWITTER_BLUE: '#1d9bf0',
  BLUE: '#2979FF',
  PURPLE: '#7C3AED',
  GREEN: '#10B981',
  ORANGE: '#F59E0B',
};

export const TEXT_COLORS = {
  WHITE: '#fff',
  LIGHT: '#e0e6f0',
  DARK: '#1a1a1a',
};

// Function to get theme-appropriate constants
export const getThemeConstants = (isDarkMode, themeVariant = 'default') => {
  if (themeVariant === 'twitter') {
    return {
      gradient: GRADIENTS.TWITTER_X,
      glassBg: GLASS_EFFECTS.TWITTER_BG,
      glassBorder: GLASS_EFFECTS.TWITTER_BORDER,
      primaryText: TEXT_COLORS.WHITE,
      secondaryText: '#71767b',
      accent: ACCENT_COLORS.TWITTER_BLUE,
    };
  }
  
  return {
    gradient: isDarkMode ? GRADIENTS.DEEP_BLUE : ['#f8f9fa', '#e9ecef', '#dee2e6'],
    glassBg: isDarkMode ? GLASS_EFFECTS.BG_DEEP : GLASS_EFFECTS.BG_LIGHT,
    glassBorder: isDarkMode ? GLASS_EFFECTS.BORDER : GLASS_EFFECTS.BORDER_LIGHT,
    primaryText: isDarkMode ? TEXT_COLORS.WHITE : TEXT_COLORS.DARK,
    secondaryText: isDarkMode ? TEXT_COLORS.LIGHT : '#6b7280',
    accent: ACCENT_COLORS.BLUE,
  };
};