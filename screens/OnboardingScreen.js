import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, TouchableOpacity, SafeAreaView } from 'react-native';
import MyFilesSVG from '../assets/images/undraw_my-files_1xwx.svg';
import UploadSVG from '../assets/images/undraw_upload_cucu.svg';
import UserAccountSVG from '../assets/images/undraw_user-account_fvqa.svg';
import FeedbackSVG from '../assets/images/undraw_feedback_ebmx.svg';
import TermsSVG from '../assets/images/undraw_terms_sx63.svg';
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
    Illustration: MyFilesSVG,
  },
  {
    key: 'slide2',
    title: 'Upload & Share',
    description: 'Upload files of any type and share them with friends or colleagues instantly.',
    Illustration: UploadSVG,
  },
  {
    key: 'slide3',
    title: 'Stay Organized',
    description: 'Create folders, favorite files, and keep everything organized in the cloud.',
    Illustration: TermsSVG,
  },
];

const DEEP_BLUE_GRADIENT = ['#0a0f1c', '#12203a', '#1a2a4f'];
const GLASS_BG_DEEP = 'rgba(20,40,80,0.32)';
const GLASS_BORDER = 'rgba(255,255,255,0.10)';

export default function OnboardingScreen({ navigation }) {
  const { theme } = useTheme();
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
      flatListRef.current.scrollToIndex({ index: currentIndex + 1 });
    } else {
      navigation.replace('Auth');
    }
  };

  return (
    <LinearGradient colors={DEEP_BLUE_GRADIENT} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <FlatList
          ref={flatListRef}
          data={slides}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          keyExtractor={item => item.key}
          renderItem={({ item }) => (
            <View style={{ width, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
              <BlurView intensity={90} tint="dark" style={{ backgroundColor: GLASS_BG_DEEP, borderRadius: 32, borderWidth: 1.5, borderColor: GLASS_BORDER, padding: 32, alignItems: 'center', width: '100%', maxWidth: 340, marginBottom: 32, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 12 }}>
                <item.Illustration width={140} height={140} style={{ borderRadius: 24, marginBottom: 18 }} />
              </BlurView>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 30, color: '#fff', marginBottom: 14, textAlign: 'center', letterSpacing: 0.5 }}>{item.title}</Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 17, color: '#fff', marginBottom: 36, textAlign: 'center', lineHeight: 24 }}>{item.description}</Text>
            </View>
          )}
        />
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 24, marginTop: 8 }}>
          {slides.map((_, idx) => (
            <View
              key={idx}
              style={{ width: currentIndex === idx ? 18 : 10, height: 10, borderRadius: 5, marginHorizontal: 6, backgroundColor: currentIndex === idx ? theme.primary : theme.border }}
            />
          ))}
        </View>
        <TouchableOpacity style={{ backgroundColor: theme.primary, borderRadius: 999, paddingVertical: 18, alignItems: 'center', width: '80%', shadowColor: theme.primary, shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 2, alignSelf: 'center', marginBottom: 32 }} onPress={handleNext}>
          <Text style={{ color: theme.textInverse, fontFamily: 'Inter_700Bold', fontSize: 19, letterSpacing: 0.5, textAlign: 'center' }}>{currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </LinearGradient>
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