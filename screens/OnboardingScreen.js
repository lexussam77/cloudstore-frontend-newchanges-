import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';

const { width } = Dimensions.get('window');

const slides = [
  {
    key: 'slide1',
    title: 'Welcome to CloudStore',
    description: 'Access your files anywhere, anytime. Secure, fast, and easy to use.',
    image: require('../assets/images/Screenshot_20250724-130820.jpg'),
  },
  {
    key: 'slide2',
    title: 'Upload & Share',
    description: 'Upload files of any type and share them with friends or colleagues instantly.',
    image: require('../assets/images/Screenshot_20250724-130536.jpg'),
  },
  {
    key: 'slide3',
    title: 'Stay Organized',
    description: 'Create folders, favorite files, and keep everything organized in the cloud.',
    image: require('../assets/images/Screenshot_20250727-213618.jpg'),
  },
];

export default function OnboardingScreen({ navigation }) {
  const { theme, constants } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef();
  let [fontsLoaded] = useFonts({ Inter_400Regular, Inter_700Bold });

  if (!fontsLoaded) return null;

  const handleScroll = (event) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      // Go to next slide
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    } else {
      // On last slide, navigate to Auth screen
      navigation.replace('Auth');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <FlatList
          ref={flatListRef}
          data={slides}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEnabled={true}
          onMomentumScrollEnd={handleScroll}
          scrollEventThrottle={16}
          keyExtractor={item => item.key}
          renderItem={({ item }) => (
            <View style={{ width, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
              <View style={{
                borderRadius: 20,
                overflow: 'hidden',
                marginBottom: 40,
                shadowColor: '#000',
                shadowOpacity: 0.3,
                shadowRadius: 20,
                shadowOffset: { width: 0, height: 8 },
                elevation: 10,
              }}>
                <Image
                  source={item.image}
                  style={{
                    width: 280,
                    height: 280,
                    resizeMode: 'cover',
                  }}
                />
              </View>
              <Text style={{
                fontFamily: 'Inter_700Bold',
                fontSize: 28,
                color: constants.primaryText,
                marginBottom: 12,
                textAlign: 'center',
                letterSpacing: -0.5,
                textShadowColor: 'rgba(0, 0, 0, 0.3)',
                textShadowOffset: { width: 0, height: 2 },
                textShadowRadius: 4,
              }}>
                {item.title}
              </Text>
              <Text style={{
                fontFamily: 'Inter_400Regular',
                fontSize: 16,
                color: constants.secondaryText,
                marginBottom: 36,
                textAlign: 'center',
                lineHeight: 22,
                maxWidth: 280,
                opacity: 0.9
              }}>
                {item.description}
              </Text>
            </View>
          )}
        />
        <View style={{ alignItems: 'center', marginBottom: 24, marginTop: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
            {slides.map((_, idx) => (
              <View
                key={idx}
                style={{
                  width: currentIndex === idx ? 20 : 8,
                  height: 8,
                  borderRadius: 4,
                  marginHorizontal: 4,
                  backgroundColor: currentIndex === idx ? constants.accent : constants.glassBorder,
                  opacity: currentIndex === idx ? 1 : 0.5
                }}
              />
            ))}
          </View>
        </View>
        <TouchableOpacity
          style={{
            backgroundColor: constants.accent,
            borderRadius: 16,
            paddingVertical: 18,
            alignItems: 'center',
            width: '80%',
            shadowColor: '#000',
            shadowOpacity: 0.15,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 6 },
            elevation: 6,
            alignSelf: 'center',
            marginBottom: 32
          }}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={{
            color: constants.primaryText,
            fontFamily: 'Inter_700Bold',
            fontSize: 17,
            letterSpacing: -0.3,
            textAlign: 'center'
          }}>
            {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slide: {
    width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  illustration: {
    marginBottom: 18,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 18,
    textAlign: 'center',
  },
  description: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 32,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 6,
  },
  dotActive: {
    width: 18,
  },
  nextBtn: {
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 40,
    alignSelf: 'center',
    marginBottom: 32,
  },
  nextBtnText: {
    fontWeight: 'bold',
    fontSize: 18,
  },
}); 