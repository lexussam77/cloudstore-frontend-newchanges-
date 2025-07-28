import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SectionList, Alert, ScrollView, Image, Modal, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import FeedbackSVG from '../assets/images/undraw_feedback_ebmx.svg';
import CustomPrompt from './CustomPrompt';
import { useTheme } from '../theme/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';
import AsyncStorage from '@react-native-async-storage/async-storage';

const accountSettings = [
  { icon: 'file-text', label: 'Terms of service', nav: 'TermsOfService' },
  { icon: 'shield', label: 'Privacy policy', nav: 'PrivacyPolicy' },
  { icon: 'code', label: 'Open source & third party soft..', nav: 'OpenSource' },
];
const appSettings = [
  { icon: 'info', label: 'App version 428.2.2', nav: null },
  { icon: 'refresh-cw', label: 'Reset photos tab', nav: null },
  { icon: 'search', label: 'Clear search history', nav: null },
  { icon: 'trash', label: 'Clear cache', nav: null },
  { icon: 'alert-circle', label: 'Report bug or complaint', nav: 'ReportBug' },
];
const dangerZone = [
  { icon: 'log-out', label: 'Sign out of CloudStore', nav: 'SignOut', color: 'crimson' },
  { icon: 'x-circle', label: 'Delete account', nav: 'DeleteAccount', color: 'crimson' },
];

const sections = [
  { title: 'Your account', data: accountSettings, key: 'account' },
  { title: 'App', data: appSettings, key: 'app' },
  { title: 'Danger Zone', data: dangerZone, key: 'danger' },
];

const DEEP_BLUE_GRADIENT = ['#0a0f1c', '#12203a', '#1a2a4f'];
const GLASS_BG_DEEP = 'rgba(20,40,80,0.32)';
const GLASS_BORDER = 'rgba(255,255,255,0.10)';
const WHITE = '#fff';
const LIGHT_TEXT = '#e0e6f0';
const BLUE_ACCENT = '#2979FF';

export default function SettingsScreen({ navigation }) {
  const { theme, constants, isDarkMode, themeVariant, toggleTheme, setThemeVariant } = useTheme();

  const [promptVisible, setPromptVisible] = useState(false);
  const [promptMessage, setPromptMessage] = useState('');
  const [promptSuccess, setPromptSuccess] = useState(true);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmAction, setConfirmAction] = useState('');
  let [fontsLoaded] = useFonts({ Inter_400Regular, Inter_700Bold });
  if (!fontsLoaded) return null;



  return (
    <LinearGradient colors={constants.gradient} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <TouchableOpacity style={{ position: 'absolute', top: 38, left: 18, zIndex: 10, backgroundColor: 'rgba(20,40,80,0.32)', borderRadius: 18, padding: 8 }} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Feather name="arrow-left" size={22} color={WHITE} />
        </TouchableOpacity>
        <ScrollView contentContainerStyle={{ paddingBottom: 80, paddingTop: 8 }} showsVerticalScrollIndicator={false}>
          {/* Optional: Glassy/gradient header or illustration can go here */}
          <View style={{ alignItems: 'center', marginTop: 24, marginBottom: 18 }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 26, color: WHITE, letterSpacing: 0.2, textAlign: 'center' }}>Settings & Preferences</Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 15, color: LIGHT_TEXT, marginTop: 6, textAlign: 'center', maxWidth: 320 }}>
              Personalize your CloudStore experience.
            </Text>
          </View>
          {/* Settings List */}

          {/* Account Section Header */}
          <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: LIGHT_TEXT, textTransform: 'uppercase', letterSpacing: 0.5 }}>Your account</Text>
          </View>

            {/* Account Items */}
            {accountSettings.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderBottomWidth: idx !== accountSettings.length - 1 ? 0.5 : 0,
                  borderBottomColor: GLASS_BORDER
                }}
                activeOpacity={0.85}
                onPress={() => {
                  if (item.nav) navigation.navigate(item.nav);
                  else if (item.label.includes('App version')) Alert.alert('CloudStore App Version', '428.2.2');
                }}
              >
                <Feather name={item.icon} size={20} color={BLUE_ACCENT} style={{ marginRight: 12 }} />
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 16, color: WHITE, flex: 1 }}>{item.label}</Text>
                <Feather name="chevron-right" size={16} color={LIGHT_TEXT} />
              </TouchableOpacity>
            ))}

          {/* App Section Header */}
          <View style={{ paddingHorizontal: 16, paddingVertical: 12, marginTop: 24 }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: LIGHT_TEXT, textTransform: 'uppercase', letterSpacing: 0.5 }}>App</Text>
          </View>

            {/* App Items */}
            {appSettings.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderBottomWidth: idx !== appSettings.length - 1 ? 0.5 : 0,
                  borderBottomColor: GLASS_BORDER
                }}
                activeOpacity={0.85}
                onPress={() => {
                  if (item.nav) {
                    navigation.navigate(item.nav);
                  } else if (item.label.includes('App version')) {
                    setPromptMessage('CloudStore App Version\n428.2.2');
                    setPromptSuccess(true);
                    setPromptVisible(true);
                  } else if (item.label.toLowerCase().includes('reset photos tab')) {
                    setPromptMessage('Photos tab reset successfully!');
                    setPromptSuccess(true);
                    setPromptVisible(true);
                  } else if (item.label.toLowerCase().includes('clear cache')) {
                    setConfirmAction('cache');
                    setConfirmVisible(true);
                  } else if (item.label.toLowerCase().includes('search history')) {
                    setConfirmAction('search');
                    setConfirmVisible(true);
                  }
                }}
              >
                <Feather name={item.icon} size={20} color={BLUE_ACCENT} style={{ marginRight: 12 }} />
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 16, color: WHITE, flex: 1 }}>{item.label}</Text>
                <Feather name="chevron-right" size={16} color={LIGHT_TEXT} />
              </TouchableOpacity>
            ))}

          {/* Danger Zone Section Header */}
          <View style={{ paddingHorizontal: 16, paddingVertical: 12, marginTop: 24 }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: 'crimson', textTransform: 'uppercase', letterSpacing: 0.5 }}>Danger Zone</Text>
          </View>

            {/* Danger Zone Items */}
            {dangerZone.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderBottomWidth: idx !== dangerZone.length - 1 ? 0.5 : 0,
                  borderBottomColor: 'rgba(220, 38, 38, 0.2)'
                }}
                activeOpacity={0.85}
                onPress={() => {
                  if (item.nav) navigation.navigate(item.nav);
                }}
              >
                <Feather name={item.icon} size={20} color={'crimson'} style={{ marginRight: 12 }} />
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 16, color: 'crimson', flex: 1 }}>{item.label}</Text>
                <Feather name="chevron-right" size={16} color={'crimson'} />
              </TouchableOpacity>
            ))}

          {/* Prompt and Modal remain unchanged */}
        </ScrollView>
        <CustomPrompt
          visible={promptVisible}
          message={promptMessage}
          onClose={() => setPromptVisible(false)}
          success={promptSuccess}
        />
        {/* Confirmation Modal - Twitter X Style */}
        <Modal
          visible={confirmVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setConfirmVisible(false)}
        >
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.8)' }}>
            <View style={{ backgroundColor: '#000000', borderRadius: 16, padding: 24, alignItems: 'center', width: 320, borderWidth: 1, borderColor: '#333333', shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 20 }}>
              <Text style={{ fontSize: 18, fontFamily: 'Inter_700Bold', color: '#FFFFFF', marginBottom: 16, textAlign: 'center' }}>
                {confirmAction === 'cache' ? 'Clear cache?' : 'Clear search history?'}
              </Text>
              <Text style={{ fontSize: 14, fontFamily: 'Inter_400Regular', color: '#8B98A5', marginBottom: 24, textAlign: 'center', lineHeight: 20 }}>
                {confirmAction === 'cache' ? 'This will clear all cached data and may improve performance.' : 'This will permanently delete your search history.'}
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'center', width: '100%', gap: 12 }}>
                <TouchableOpacity
                  style={{ backgroundColor: '#1D9BF0', borderRadius: 20, paddingVertical: 12, paddingHorizontal: 24, flex: 1, alignItems: 'center' }}
                  onPress={() => {
                    setConfirmVisible(false);
                    setTimeout(() => {
                      setPromptMessage(confirmAction === 'cache' ? 'Cache cleared successfully!' : 'Search history cleared!');
                      setPromptSuccess(true);
                      setPromptVisible(true);
                    }, 200);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={{ color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 15 }}>Clear</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ backgroundColor: 'transparent', borderRadius: 20, paddingVertical: 12, paddingHorizontal: 24, flex: 1, alignItems: 'center', borderWidth: 1, borderColor: '#333333' }}
                  onPress={() => setConfirmVisible(false)}
                  activeOpacity={0.8}
                >
                  <Text style={{ color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 15 }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>



      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 10,
    paddingHorizontal: 0,
  },
  sectionCard: {
    borderRadius: 22,
    marginHorizontal: 18,
    marginBottom: 26,
    padding: 26,
    shadowOpacity: 0.13,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
    backgroundColor: '#fff',
  },
  sectionHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
    paddingVertical: 18,
    paddingHorizontal: 0,
    marginBottom: 0,
  },
  text: {
    fontSize: 16,
    marginLeft: 14,
    fontWeight: '600',
  },
  icon: {
    marginRight: 12,
    fontSize: 24,
  },
  illustrationWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 18,
  },
  illustrationImage: {
    width: 180,
    height: 130,
  },
  dangerIllustrationWrap: {
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 6,
  },
  scrollContent: {
    paddingBottom: 60,
    paddingTop: 10,
  },
  headerImage: {
    width: '100%',
    height: 110,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    marginBottom: 0,
  },
  settingsInfoSection: {
    alignItems: 'center',
    marginBottom: 18,
    marginTop: 2,
    paddingHorizontal: 18,
  },
  settingsCaption: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  settingsDescription: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 2,
  },
  themeDescription: {
    fontSize: 13,
    marginTop: 8,
    marginLeft: 36,
    fontStyle: 'italic',
  },

}); 









