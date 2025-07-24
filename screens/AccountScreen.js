import React, { useContext, useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SectionList, Alert, SafeAreaView, ScrollView, Image, Animated, Modal, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Feather from 'react-native-vector-icons/Feather';
import { AuthContext } from './AuthContext';
import LogoutSVG from '../assets/images/undraw_log-out_2vod.svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { getCurrentUser, listFiles } from './api';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';
import { BlurView } from 'expo-blur';
import EyesBro from '../assets/images/pngs/Eyes-bro.png';
import ExpertsBro from '../assets/images/pngs/Experts-bro.png';
import NerdBro from '../assets/images/pngs/Nerd-bro.png';

const user = {
  name: 'lazarus sam',
  email: 'akombea77@gmail.com',
  plan: 'Dropbox Basic',
  storage: '4.0 MB / 2.0 GB',
};
const securityOptions = [
  { icon: 'lock', label: 'Change password' },
  { icon: 'shield', label: 'Two-factor authentication' },
];
const connectedApps = [
  { icon: 'slack', label: 'Slack' },
  { icon: 'github', label: 'GitHub' },
];
const recentLogins = [
  { icon: 'monitor', label: 'Windows 10 · 2 hours ago' },
  { icon: 'smartphone', label: 'iPhone 13 · 1 day ago' },
];

const sections = [
  { title: 'Security', data: securityOptions.length ? securityOptions : [{}], key: 'security' },
  { title: 'Connected apps', data: connectedApps.length ? connectedApps : [{}], key: 'apps' },
  { title: 'Recent logins', data: recentLogins.length ? recentLogins : [{}], key: 'logins' },
  { title: 'Keep work moving', data: [{}], key: 'keepwork' },
];

const DEEP_BLUE_GRADIENT = ['#0a0f1c', '#12203a', '#1a2a4f'];
const GLASS_BG_DEEP = 'rgba(20,40,80,0.32)';
const GLASS_BORDER = 'rgba(255,255,255,0.10)';
const WHITE = '#fff';
const LIGHT_TEXT = '#e0e6f0';
const BLUE_ACCENT = '#2979FF';

export default function AccountScreen({ navigation }) {
  const { logout } = useContext(AuthContext);
  const { theme } = useTheme();
  const [avatarUri, setAvatarUri] = useState(null);
  const [storage, setStorage] = useState('4.0 MB / 2.0 GB');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const isFocused = useIsFocused();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);
  useEffect(() => {
    const fetchStorage = async () => {
      const newStorage = await AsyncStorage.getItem('user_storage');
      if (newStorage) {
        setStorage(`4.0 MB / ${newStorage}`);
      } else {
        setStorage('4.0 MB / 2.0 GB');
      }
    };
    fetchStorage();
  }, [isFocused]);

  useEffect(() => {
    const loadProfilePicture = async () => {
      try {
        const savedAvatarUri = await AsyncStorage.getItem('user_avatar_uri');
        if (savedAvatarUri) {
          setAvatarUri(savedAvatarUri);
        }
      } catch (error) {
        console.log('Error loading profile picture:', error);
      }
    };
    loadProfilePicture();
  }, []);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets[0]?.uri) {
      const newAvatarUri = result.assets[0].uri;
      setAvatarUri(newAvatarUri);
      // Save to AsyncStorage for persistence
      try {
        await AsyncStorage.setItem('user_avatar_uri', newAvatarUri);
      } catch (error) {
        console.log('Error saving profile picture:', error);
      }
    }
  };

  const [userProfile, setUserProfile] = useState({ name: '', email: '', storageQuota: 0 });
  const [totalFileSize, setTotalFileSize] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    const fetchUserProfileAndFiles = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = await AsyncStorage.getItem('jwt');
        if (!token) {
          setError('No token found.');
          setLoading(false);
          return;
        }
        const res = await getCurrentUser(token);
        if (res.success && res.data) {
          setUserProfile({
            name: res.data.name,
            email: res.data.email,
            storageQuota: res.data.storageQuota && res.data.storageQuota > 0 ? res.data.storageQuota : 1073741824, // 1GB default
          });
        } else {
          setError('Failed to fetch user profile.');
        }
        // Fetch all files and sum their sizes
        const filesRes = await listFiles(token);
        if (filesRes.success && Array.isArray(filesRes.data)) {
          const sum = filesRes.data.reduce((acc, f) => acc + (f.size || 0), 0);
          setTotalFileSize(sum);
        } else {
          setTotalFileSize(0);
        }
      } catch (err) {
        setError('Failed to fetch user profile.');
        setTotalFileSize(0);
      }
      setLoading(false);
    };
    fetchUserProfileAndFiles();
  }, [isFocused]);

  function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Helper to format quota nicely (e.g., 1 GB instead of 1073741824 B)
  function formatQuota(bytes) {
    if (bytes === 1073741824) return '1 GB';
    return formatBytes(bytes);
  }

  let [fontsLoaded] = useFonts({ Inter_400Regular, Inter_700Bold });
  if (!fontsLoaded) return null;

  return (
    <LinearGradient colors={DEEP_BLUE_GRADIENT} style={styles.gradientContainer}>
      <SafeAreaView style={styles.container}>
      {/* Top Bar */}
        <View style={styles.topBar}>
        <TouchableOpacity style={styles.settingsIconWrap} onPress={() => navigation.navigate('Settings')} activeOpacity={0.7}>
            <Feather name="settings" size={26} color={WHITE} />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <BlurView intensity={80} tint="dark" style={{ backgroundColor: GLASS_BG_DEEP, borderRadius: 28, borderWidth: 1, borderColor: GLASS_BORDER, marginHorizontal: 16, marginBottom: 16, padding: 0, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8, overflow: 'hidden', minHeight: 100 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 18 }}>
            <TouchableOpacity onPress={pickImage} activeOpacity={0.8} style={[styles.avatarCircleImgWrap, { marginRight: 16 }] }>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatarCircleImg} />
                ) : (
                  <View style={[styles.avatarCircleImg, { backgroundColor: '#1a237e', alignItems: 'center', justifyContent: 'center' }]}> 
                    <Feather name="user" size={40} color={BLUE_ACCENT} />
                  </View>
                )}
                <View style={styles.editAvatarOverlay}>
                  <Feather name="edit-3" size={16} color={WHITE} />
                </View>
                </TouchableOpacity>
            <View style={{ flex: 1, justifyContent: 'center', minWidth: 0 }}>
                {loading ? (
                <ActivityIndicator size="small" color={BLUE_ACCENT} style={{ marginTop: 0 }} />
                ) : error ? (
                <Text style={{ color: 'red', fontFamily: 'Inter_400Regular', marginTop: 0, fontSize: 14, textAlign: 'left' }} numberOfLines={1} adjustsFontSizeToFit>{error}</Text>
                ) : (
                  <>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 17, color: WHITE, marginBottom: 2, textAlign: 'left' }} numberOfLines={1} adjustsFontSizeToFit>{userProfile.name}</Text>
                  <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: LIGHT_TEXT, textAlign: 'left' }} numberOfLines={1} adjustsFontSizeToFit>{userProfile.email}</Text>
                  </>
                )}
            </View>
          </View>
        </BlurView>
        
        {/* Plan and Storage Card */}
        <BlurView intensity={80} tint="dark" style={{ backgroundColor: GLASS_BG_DEEP, borderRadius: 28, borderWidth: 1, borderColor: GLASS_BORDER, marginHorizontal: 16, marginBottom: 24, padding: 0, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8, overflow: 'hidden' }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: WHITE, marginBottom: 0, marginTop: 18, marginLeft: 24 }}>Your storage</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 18, paddingHorizontal: 24, justifyContent: 'space-between' }}>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ color: WHITE, fontFamily: 'Inter_700Bold', fontSize: 15, marginBottom: 4, textAlign: 'center', alignSelf: 'center' }} numberOfLines={1} adjustsFontSizeToFit>
                {formatBytes(totalFileSize)} / {formatQuota(userProfile.storageQuota)}
              </Text>
              <View style={{ width: '100%', height: 10, backgroundColor: '#233', borderRadius: 6, overflow: 'hidden', marginBottom: 6 }}>
                {(() => {
                  let percent = userProfile.storageQuota && userProfile.storageQuota > 0 ? (totalFileSize / userProfile.storageQuota) * 100 : 0;
                  let barWidth = percent > 0 && percent < 0.5 ? 4 : `${Math.min(100, percent)}%`;
                  return (
                    <View style={{ width: barWidth, height: '100%', backgroundColor: BLUE_ACCENT, borderRadius: 6 }} />
                  );
                })()}
          </View>
              <Text style={{ color: '#aaa', fontFamily: 'Inter_400Regular', fontSize: 11 }}>
                {userProfile.storageQuota && userProfile.storageQuota > 0
                  ? ((totalFileSize / userProfile.storageQuota) * 100).toFixed(2) + '% used'
                  : '0% used'}
            </Text>
            </View>
          </View>
          <TouchableOpacity style={{ backgroundColor: BLUE_ACCENT, borderRadius: 18, paddingVertical: 14, paddingHorizontal: 0, marginHorizontal: 24, marginBottom: 18, marginTop: 0, width: '90%', alignSelf: 'center', shadowColor: BLUE_ACCENT, shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 }} activeOpacity={0.85} onPress={() => navigation.navigate('ManagePlan', { userEmail: userProfile.email })}>
            <Text style={{ color: WHITE, fontFamily: 'Inter_700Bold', fontSize: 17, textAlign: 'center', letterSpacing: 0.2 }}>Upgrade</Text>
            </TouchableOpacity>
        </BlurView>

        {/* Security Section */}
        <BlurView intensity={80} tint="dark" style={{ backgroundColor: GLASS_BG_DEEP, borderRadius: 28, borderWidth: 1, borderColor: GLASS_BORDER, marginHorizontal: 16, marginBottom: 24, padding: 0, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8, overflow: 'hidden' }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: WHITE, marginBottom: 0, marginTop: 18, marginLeft: 24 }}>Security</Text>
          {securityOptions.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: idx !== securityOptions.length-1 ? 1 : 0, borderColor: GLASS_BORDER, paddingVertical: 18, paddingHorizontal: 24 }}
              activeOpacity={0.85}
              onPress={() => {
                if (item.label === 'Change password') navigation.navigate('ChangePassword');
                if (item.label === 'Two-factor authentication') navigation.navigate('TwoFactor');
              }}
            >
              <Feather name={item.icon} size={22} color={BLUE_ACCENT} style={{ marginRight: 14 }} />
                    <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 16, color: WHITE }}>{item.label}</Text>
            </TouchableOpacity>
          ))}
                </BlurView>

        {/* 24/7 Support Section (image and main text only) */}
        <View style={{ alignItems: 'center', marginBottom: 32, width: '100%' }}>
          <View style={{ width: '100%', aspectRatio: 1.8, marginBottom: 10 }}>
            <Image source={NerdBro} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          </View>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 22, color: WHITE, textAlign: 'center' }}>24/7 Support</Text>
        </View>

        {/* Connected Apps Section */}
        <BlurView intensity={80} tint="dark" style={{ backgroundColor: GLASS_BG_DEEP, borderRadius: 28, borderWidth: 1, borderColor: GLASS_BORDER, marginHorizontal: 16, marginBottom: 24, padding: 0, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8, overflow: 'hidden' }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: WHITE, marginBottom: 0, marginTop: 18, marginLeft: 24 }}>Connected apps</Text>
              {connectedApps.map((item, idx) => (
            <View
              key={idx}
              style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: idx !== connectedApps.length-1 ? 1 : 0, borderColor: GLASS_BORDER, paddingVertical: 18, paddingHorizontal: 24 }}
            >
              <Feather name={item.icon} size={22} color={BLUE_ACCENT} style={{ marginRight: 14 }} />
                    <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 16, color: WHITE }}>{item.label}</Text>
                  </View>
          ))}
                </BlurView>

        {/* Recent Logins Section */}
        <BlurView intensity={80} tint="dark" style={{ backgroundColor: GLASS_BG_DEEP, borderRadius: 28, borderWidth: 1, borderColor: GLASS_BORDER, marginHorizontal: 16, marginBottom: 24, padding: 0, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8, overflow: 'hidden' }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: WHITE, marginBottom: 0, marginTop: 18, marginLeft: 24 }}>Recent logins</Text>
          {recentLogins.map((item, idx) => (
            <View
              key={idx}
              style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: idx !== recentLogins.length-1 ? 1 : 0, borderColor: GLASS_BORDER, paddingVertical: 18, paddingHorizontal: 24 }}
            >
              <Feather name={item.icon} size={22} color={BLUE_ACCENT} style={{ marginRight: 14 }} />
                    <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 16, color: WHITE }}>{item.label}</Text>
            </View>
          ))}
        </BlurView>

        {/* Logout Button */}
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 28, marginHorizontal: 16, marginTop: 36, paddingVertical: 20, backgroundColor: BLUE_ACCENT, shadowOpacity: 0.18, shadowRadius: 12, elevation: 10 }} onPress={() => setShowLogoutModal(true)} activeOpacity={0.85}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 19, textAlign: 'center', color: WHITE }}>Log Out</Text>
            <Feather name="log-out" size={20} color={WHITE} style={{ marginLeft: 8 }} />
          </TouchableOpacity>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <BlurView intensity={120} tint="dark" style={{ ...StyleSheet.absoluteFillObject, zIndex: 1 }}>
            <View style={{ flex: 1, backgroundColor: 'rgba(10,10,20,0.55)' }} />
          </BlurView>
          <BlurView intensity={90} tint="dark" style={{ backgroundColor: GLASS_BG_DEEP, borderRadius: 24, padding: 32, alignItems: 'center', width: 320, borderWidth: 1.5, borderColor: GLASS_BORDER, zIndex: 2, shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 16 }}>
            <View style={{ width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 20, backgroundColor: BLUE_ACCENT }}>
                <Feather name="log-out" size={32} color={WHITE} />
            </View>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 23, color: WHITE, marginBottom: 12, textAlign: 'center' }}>Log Out</Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 17, color: LIGHT_TEXT, marginBottom: 28, textAlign: 'center', lineHeight: 24 }}>Are you sure you want to log out of your CloudStore account?</Text>
            <View style={{ flexDirection: 'row', gap: 16, width: '100%' }}>
              <TouchableOpacity
                style={{ flex: 1, borderRadius: 18, paddingVertical: 16, paddingHorizontal: 22, alignItems: 'center', backgroundColor: '#23272f' }}
                onPress={() => setShowLogoutModal(false)}
                activeOpacity={0.85}
              >
                <Text style={{ color: WHITE, fontFamily: 'Inter_700Bold', fontSize: 17, textAlign: 'center' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1, borderRadius: 18, paddingVertical: 16, paddingHorizontal: 22, alignItems: 'center', backgroundColor: BLUE_ACCENT }}
                onPress={async () => {
                  setShowLogoutModal(false);
                  await logout();
                  navigation.getParent()?.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
                }}
                activeOpacity={0.85}
              >
                <Text style={{ color: WHITE, fontFamily: 'Inter_700Bold', fontSize: 17, textAlign: 'center' }}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      </Modal>
    </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingBottom: 80,
    paddingTop: 8,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 56,
    borderBottomWidth: 0,
    paddingHorizontal: 16,
    marginBottom: 2,
  },
  settingsIconWrap: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(41,121,255,0.12)',
  },
  glassCard: {
    backgroundColor: '#18213a',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 24,
    width: '95%',
    alignSelf: 'center',
    overflow: 'hidden',
  },
  // Revert profileCard and avatar to original dominant style
  profileCard: {
    flexDirection: 'row',
    gap: 18,
    alignItems: 'center',
    marginBottom: 32,
    paddingVertical: 36,
  },
  profileImageWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircleImgWrap: {
    position: 'relative',
    marginBottom: 0,
  },
  avatarCircleImg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: BLUE_ACCENT,
    backgroundColor: '#1a237e',
  },
  editAvatarOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderRadius: 18,
    padding: 8,
    borderWidth: 2,
    backgroundColor: BLUE_ACCENT,
    borderColor: GLASS_BG_DEEP,
  },
  profileTextWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 4,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 2,
    textAlign: 'left',
    color: WHITE,
  },
  email: {
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'left',
    color: LIGHT_TEXT,
  },
  planStorageCard: {
    marginBottom: 14,
    paddingBottom: 10,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  planLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: WHITE,
  },
  upgradeBtn: {
    backgroundColor: WHITE,
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: BLUE_ACCENT,
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 6,
  },
  upgradeBtnText: {
    color: BLUE_ACCENT,
    fontWeight: 'bold',
    fontSize: 17,
  },
  storageText: {
    color: LIGHT_TEXT,
    fontSize: 16,
    marginTop: 6,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: WHITE,
    fontFamily: 'Inter_700Bold',
    textAlign: 'left',
  },
  specsRow: {
    flexDirection: 'column',
    gap: 8,
  },
  specCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.18)',
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginHorizontal: 2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    backgroundColor: GLASS_BG_DEEP,
  },
  specIcon: {
    marginBottom: 10,
  },
  specLabel: {
    fontSize: 16,
    color: WHITE,
    fontWeight: '500',
    textAlign: 'center',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    marginHorizontal: 18,
    marginTop: 12,
    paddingVertical: 10,
    backgroundColor: BLUE_ACCENT,
    shadowColor: BLUE_ACCENT,
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
    width: '95%',
    alignSelf: 'center',
  },
  logoutText: {
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
    color: WHITE,
    fontFamily: 'Inter_700Bold',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(10,10,20,0.7)',
  },
  modalCard: {
    borderRadius: 28,
    padding: 32,
    width: '85%',
    maxWidth: 360,
    alignItems: 'center',
    backgroundColor: GLASS_BG_DEEP,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  modalIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    backgroundColor: BLUE_ACCENT,
  },
  modalTitle: {
    fontSize: 23,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    color: WHITE,
  },
  modalMessage: {
    fontSize: 17,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 24,
    color: LIGHT_TEXT,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 22,
    alignItems: 'center',
    borderWidth: 0,
  },
  modalButtonCancel: {
    backgroundColor: '#23272f',
  },
  modalButtonConfirm: {
    backgroundColor: BLUE_ACCENT,
  },
  modalButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: WHITE,
  },
  // New styles for outerGlassCard and innerGlassPad
  outerGlassCard: {
    borderRadius: 36,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.18)',
    padding: 32,
    marginHorizontal: 16,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
    backgroundColor: 'transparent',
  },
  innerGradientPad: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999, // Perfect pill/oval for the light glow
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.18)',
    paddingVertical: 28,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
}); 