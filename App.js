import React, { useContext, useRef, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomTabNavigation from './screens/BottomTabNavigation';
import { Image, View, Text, Animated, Dimensions } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

import SettingsScreen from './screens/SettingsScreen';
import HelpScreen from './screens/HelpScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import AddAccountScreen from './screens/AddAccountScreen';
import EmailVerificationScreen from './screens/EmailVerificationScreen';
import SignOutScreen from './screens/SignOutScreen';
import DeleteAccountScreen from './screens/DeleteAccountScreen';
import TermsOfServiceScreen from './screens/TermsOfServiceScreen';
import PrivacyPolicyScreen from './screens/PrivacyPolicyScreen';
import OpenSourceScreen from './screens/OpenSourceScreen';
import CCPAPreferencesScreen from './screens/CCPAPreferencesScreen';
import { AuthProvider, AuthContext, NotificationProvider } from './screens/AuthContext';
import { ActivityIndicator } from 'react-native';
import AuthScreen from './screens/AuthScreen';
import ManagePlanScreen from './screens/ManagePlanScreen';
import ReportBugScreen from './screens/ReportBugScreen';
import BackupLoadingScreen from './screens/BackupLoadingScreen';
import ChangePasswordScreen from './screens/ChangePasswordScreen';
import TwoFactorScreen from './screens/TwoFactorScreen';
import CreditCardScreen from './screens/CreditCardScreen';
import FileViewerScreen from './screens/FileViewerScreen';
import DocumentScannerScreen from './screens/DocumentScannerScreen';
import NotificationScreen from './screens/NotificationScreen';
import { ThemeProvider, useTheme } from './theme/ThemeContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PremiumProvider } from './screens/PremiumContext';

const Stack = createNativeStackNavigator();

function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const { width, height } = Dimensions.get('window');

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <LinearGradient
      colors={['#000000', '#0F0F0F', '#1A1A1A']}
      style={{ flex: 1 }}
    >
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24
      }}>

        {/* Animated Logo Container */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
            alignItems: 'center',
          }}
        >
          {/* Logo Background with Glow Effect */}
          <BlurView intensity={90} tint="dark" style={{
            backgroundColor: 'rgba(0,0,0,0.4)',
            borderRadius: 32,
            borderWidth: 1.5,
            borderColor: 'rgba(255,255,255,0.15)',
            padding: 32,
            alignItems: 'center',
            shadowColor: '#FFFFFF',
            shadowOpacity: 0.1,
            shadowRadius: 30,
            shadowOffset: { width: 0, height: 0 },
            elevation: 20,
          }}>
            <Image
              source={require('./assets/cloudstore-logo.png')}
              style={{
                width: 120,
                height: 120,
                resizeMode: 'contain',
                borderRadius: 16
              }}
            />
          </BlurView>

          {/* App Name */}
          <Text style={{
            fontFamily: 'Inter_700Bold',
            fontSize: 28,
            color: '#FFFFFF',
            marginTop: 24,
            letterSpacing: 1,
            textAlign: 'center',
          }}>
            CloudStore
          </Text>

          {/* Tagline */}
          <Text style={{
            fontFamily: 'Inter_400Regular',
            fontSize: 16,
            color: 'rgba(255,255,255,0.7)',
            marginTop: 8,
            textAlign: 'center',
            letterSpacing: 0.5,
          }}>
            Your files, everywhere
          </Text>

          {/* Loading Indicator */}
          <View style={{
            marginTop: 40,
            alignItems: 'center',
          }}>
            <View style={{
              width: 40,
              height: 4,
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: 2,
              overflow: 'hidden',
            }}>
              <Animated.View style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#FFFFFF',
                borderRadius: 2,
                transform: [{
                  translateX: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-40, 0],
                  })
                }]
              }} />
            </View>
          </View>

        </Animated.View>

        {/* Footer */}
        <View style={{
          position: 'absolute',
          bottom: 50,
          alignItems: 'center',
        }}>
          <Text style={{
            fontFamily: 'Inter_400Regular',
            fontSize: 12,
            color: 'rgba(255,255,255,0.5)',
            textAlign: 'center',
          }}>
            Powered by CloudStore Technology
          </Text>
        </View>

      </View>
    </LinearGradient>
  );
}

function AppNavigator() {
  const { jwt, loading } = useContext(AuthContext);
  const { theme } = useTheme();
  
  if (loading) {
    return <SplashScreen />;
  }
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={jwt ? 'MainTabs' : 'Onboarding'}>
      {jwt ? (
        <>
          <Stack.Screen name="MainTabs" component={BottomTabNavigation} />
          <Stack.Screen name="NotificationScreen" component={NotificationScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="Help" component={HelpScreen} />
          <Stack.Screen name="SignOut" component={SignOutScreen} />
          <Stack.Screen name="DeleteAccount" component={DeleteAccountScreen} />
          <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
          <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
          <Stack.Screen name="OpenSource" component={OpenSourceScreen} />
          <Stack.Screen name="CCPAPreferences" component={CCPAPreferencesScreen} />
          <Stack.Screen name="ManagePlan" component={ManagePlanScreen} />
          <Stack.Screen name="CreditCard" component={CreditCardScreen} />
          <Stack.Screen name="ReportBug" component={ReportBugScreen} />
          <Stack.Screen name="BackupLoading" component={BackupLoadingScreen} />
          <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
          <Stack.Screen name="TwoFactor" component={TwoFactorScreen} />
          <Stack.Screen name="FileViewer" component={FileViewerScreen} />
          <Stack.Screen name="DocumentScanner" component={DocumentScannerScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="AddAccount" component={AddAccountScreen} />
          <Stack.Screen name="Auth" component={AuthScreen} />
          <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <PremiumProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <ThemeProvider>
            <AuthProvider>
              <NotificationProvider>
                <NavigationContainer>
                  <AppNavigator />
                </NavigationContainer>
              </NotificationProvider>
            </AuthProvider>
          </ThemeProvider>
        </GestureHandlerRootView>
      </PremiumProvider>
    </SafeAreaProvider>
  );
}