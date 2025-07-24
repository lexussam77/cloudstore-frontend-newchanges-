import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomTabNavigation from './screens/BottomTabNavigation';
import { Image, View } from 'react-native';

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
  return (
    <View style={{ 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center', 
      backgroundColor: '#0F0F0F' 
    }}>
      <Image 
        source={require('./assets/cloudstore-logo.png')} 
        style={{ 
          width: 200, 
          height: 200, 
          resizeMode: 'contain',
          borderRadius: 20
        }}
      />
    </View>
  );
}

function AppNavigator() {
  const { jwt, loading } = useContext(AuthContext);
  const { theme } = useTheme();
  
  if (loading) {
    return <SplashScreen />;
  }
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={jwt ? 'MainTabs' : 'Auth'}>
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
  );
}