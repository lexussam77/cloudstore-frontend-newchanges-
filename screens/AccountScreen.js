import React, { useContext, useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Image, Modal, ActivityIndicator, Animated } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Feather from 'react-native-vector-icons/Feather';
import { AuthContext } from './AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { getCurrentUser, listFiles } from './api';
import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';


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

// Constants moved to theme system

export default function AccountScreen({ navigation }) {
  const { logout } = useContext(AuthContext);
  const { theme, constants } = useTheme();
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
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <SafeAreaView style={{ flex: 1 }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16, marginBottom: 8 }}>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 28, color: '#FFFFFF' }}>Account</Text>
        <TouchableOpacity style={{ padding: 8, borderRadius: 20, backgroundColor: '#1D9BF0' }} onPress={() => navigation.navigate('Settings')} activeOpacity={0.8}>
          <Feather name="settings" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 80, paddingTop: 8 }} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#333333' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={pickImage} activeOpacity={0.8} style={{ marginRight: 16, position: 'relative' }}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={{ width: 64, height: 64, borderRadius: 32 }} />
                ) : (
                  <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#1D9BF0', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' }}>
                      {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : 'U'}
                    </Text>
                  </View>
                )}
                <View style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: '#1D9BF0', borderRadius: 12, padding: 4, borderWidth: 2, borderColor: '#000000' }}>
                  <Feather name="edit-3" size={12} color="#FFFFFF" />
                </View>
                </TouchableOpacity>
            <View style={{ flex: 1, justifyContent: 'center', minWidth: 0 }}>
                {loading ? (
                <ActivityIndicator size="small" color="#1D9BF0" style={{ marginTop: 0 }} />
                ) : error ? (
                <Text style={{ color: '#F91880', fontFamily: 'Inter_400Regular', marginTop: 0, fontSize: 14, textAlign: 'left' }} numberOfLines={1} adjustsFontSizeToFit>{error}</Text>
                ) : (
                  <>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: '#FFFFFF', marginBottom: 4, textAlign: 'left' }} numberOfLines={1} adjustsFontSizeToFit>{userProfile.name}</Text>
                  <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: '#8B98A5', textAlign: 'left' }} numberOfLines={1} adjustsFontSizeToFit>{userProfile.email}</Text>
                  </>
                )}
            </View>
          </View>
        </View>

        {/* Storage Card - Dropbox Style Split Layout */}
        <View style={{ backgroundColor: '#000000', borderRadius: 16, borderWidth: 1, borderColor: '#333333', marginHorizontal: 16, marginTop: 24, marginBottom: 16, overflow: 'hidden' }}>

          {/* Header */}
          <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ backgroundColor: '#1D9BF0', borderRadius: 8, padding: 8, marginRight: 12 }}>
                <Text style={{ fontSize: 16, color: '#FFFFFF' }}>☁️</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: '#FFFFFF', marginBottom: 2 }}>CloudStore Storage</Text>
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: '#8B98A5' }}>
                  {formatBytes(totalFileSize)} of {formatQuota(userProfile.storageQuota)} used
                </Text>
              </View>
            </View>
          </View>

          {/* Split Content - Two Halves */}
          <View style={{ flexDirection: 'row', minHeight: 120 }}>

            {/* Left Half - Circular Progress */}
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 20, borderRightWidth: 1, borderRightColor: '#333333' }}>
              {(() => {
                let percent = userProfile.storageQuota && userProfile.storageQuota > 0 ? (totalFileSize / userProfile.storageQuota) * 100 : 0;
                let displayPercent = Math.min(100, Math.max(0, percent)); // Ensure it's between 0-100

                return (
                  <View style={{ alignItems: 'center' }}>
                    {/* Circular Progress Indicator */}
                    <View style={{
                      width: 70,
                      height: 70,
                      borderRadius: 35,
                      borderWidth: 6,
                      borderColor: '#333333',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative'
                    }}>
                      {/* Progress Arc - Multiple segments for better visual */}
                      {displayPercent > 0 && (
                        <>
                          {displayPercent >= 25 && <View style={{ position: 'absolute', width: 70, height: 70, borderRadius: 35, borderWidth: 6, borderColor: 'transparent', borderTopColor: '#1D9BF0', transform: [{ rotate: '0deg' }] }} />}
                          {displayPercent >= 50 && <View style={{ position: 'absolute', width: 70, height: 70, borderRadius: 35, borderWidth: 6, borderColor: 'transparent', borderRightColor: '#1D9BF0', transform: [{ rotate: '0deg' }] }} />}
                          {displayPercent >= 75 && <View style={{ position: 'absolute', width: 70, height: 70, borderRadius: 35, borderWidth: 6, borderColor: 'transparent', borderBottomColor: '#1D9BF0', transform: [{ rotate: '0deg' }] }} />}
                          {displayPercent > 75 && <View style={{ position: 'absolute', width: 70, height: 70, borderRadius: 35, borderWidth: 6, borderColor: 'transparent', borderLeftColor: '#1D9BF0', transform: [{ rotate: `${((displayPercent - 75) / 25) * 90}deg` }] }} />}
                        </>
                      )}
                      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: '#FFFFFF' }}>
                        {displayPercent.toFixed(1)}%
                      </Text>
                    </View>
                    <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: '#8B98A5', marginTop: 8, textAlign: 'center' }}>
                      Storage used
                    </Text>
                  </View>
                );
              })()}
            </View>

            {/* Right Half - Upgrade Button */}
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 20 }}>
              <TouchableOpacity
                style={{
                  backgroundColor: '#1D9BF0',
                  borderRadius: 12,
                  paddingVertical: 14,
                  paddingHorizontal: 20,
                  width: '100%',
                  alignItems: 'center'
                }}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('ManagePlan', { userEmail: userProfile.email })}
              >
                <Text style={{ color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 15, marginBottom: 4 }}>Upgrade to Plus</Text>
                <Text style={{ color: '#FFFFFF', fontFamily: 'Inter_400Regular', fontSize: 12, opacity: 0.9 }}>Get more storage</Text>
              </TouchableOpacity>

              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: '#8B98A5', marginTop: 12, textAlign: 'center' }}>
                Starting at 60 cedis/month
              </Text>
            </View>
          </View>
        </View>

        {/* Security Section Header */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: '#8B98A5', textTransform: 'uppercase', letterSpacing: 0.5 }}>Security</Text>
        </View>

        {/* Security Items */}
        {securityOptions.map((item, idx) => (
          <TouchableOpacity
            key={idx}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderBottomWidth: idx !== securityOptions.length - 1 ? 0.5 : 0,
              borderBottomColor: '#333333'
            }}
            activeOpacity={0.8}
            onPress={() => {
              if (item.label === 'Change password') navigation.navigate('ChangePassword');
              if (item.label === 'Two-factor authentication') navigation.navigate('TwoFactor');
            }}
          >
            <Feather name={item.icon} size={20} color="#1D9BF0" style={{ marginRight: 12 }} />
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 16, color: '#FFFFFF', flex: 1 }}>{item.label}</Text>
            <Feather name="chevron-right" size={16} color="#8B98A5" />
          </TouchableOpacity>
        ))}

        {/* Connected Apps Section Header */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 12, marginTop: 24 }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: '#8B98A5', textTransform: 'uppercase', letterSpacing: 0.5 }}>Connected Apps</Text>
        </View>

        {/* Connected Apps Items */}
        {connectedApps.map((item, idx) => (
          <View
            key={idx}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderBottomWidth: idx !== connectedApps.length - 1 ? 0.5 : 0,
              borderBottomColor: '#333333'
            }}
          >
            <Feather name={item.icon} size={20} color="#1D9BF0" style={{ marginRight: 12 }} />
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 16, color: '#FFFFFF', flex: 1 }}>{item.label}</Text>
          </View>
        ))}

        {/* Recent Logins Section Header */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 12, marginTop: 24 }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: '#8B98A5', textTransform: 'uppercase', letterSpacing: 0.5 }}>Recent Logins</Text>
        </View>

        {/* Recent Logins Items */}
        {recentLogins.map((item, idx) => (
          <View
            key={idx}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderBottomWidth: idx !== recentLogins.length - 1 ? 0.5 : 0,
              borderBottomColor: '#333333'
            }}
          >
            <Feather name={item.icon} size={20} color="#1D9BF0" style={{ marginRight: 12 }} />
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 16, color: '#FFFFFF', flex: 1 }}>{item.label}</Text>
          </View>
        ))}

        {/* Logout Button */}
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 16,
            marginHorizontal: 16,
            marginTop: 32,
            paddingVertical: 14,
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: '#1D9BF0'
          }}
          onPress={() => setShowLogoutModal(true)}
          activeOpacity={0.8}
        >
          <Feather name="log-out" size={18} color="#1D9BF0" style={{ marginRight: 8 }} />
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, textAlign: 'center', color: '#1D9BF0' }}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Logout Confirmation Modal - Twitter X Style */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.8)' }}>
          <View style={{ backgroundColor: '#000000', borderRadius: 16, padding: 24, alignItems: 'center', width: 320, borderWidth: 1, borderColor: '#333333', shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 20 }}>
            <View style={{ backgroundColor: '#1D9BF0', borderRadius: 50, padding: 16, marginBottom: 16 }}>
              <Feather name="log-out" size={24} color="#FFFFFF" />
            </View>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: '#FFFFFF', marginBottom: 8, textAlign: 'center' }}>Sign Out</Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: '#8B98A5', marginBottom: 24, textAlign: 'center', lineHeight: 20 }}>Are you sure you want to sign out of your CloudStore account?</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'center', width: '100%', gap: 12 }}>
              <TouchableOpacity
                style={{ backgroundColor: 'transparent', borderRadius: 20, paddingVertical: 12, paddingHorizontal: 24, flex: 1, alignItems: 'center', borderWidth: 1, borderColor: '#333333' }}
                onPress={() => setShowLogoutModal(false)}
                activeOpacity={0.8}
              >
                <Text style={{ color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 15 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ backgroundColor: '#1D9BF0', borderRadius: 20, paddingVertical: 12, paddingHorizontal: 24, flex: 1, alignItems: 'center' }}
                onPress={async () => {
                  setShowLogoutModal(false);
                  await logout();
                  navigation.getParent()?.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
                }}
                activeOpacity={0.8}
              >
                <Text style={{ color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 15 }}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
    </View>
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
    borderColor: 'rgba(255,255,255,0.10)', // Fallback since this style is unused
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
    borderColor: '#2979FF', // Fallback since this style is unused
    backgroundColor: '#1a237e',
  },
  editAvatarOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderRadius: 18,
    padding: 8,
    borderWidth: 2,
    backgroundColor: '#2979FF', // Fallback since this style is unused
    borderColor: 'rgba(20,40,80,0.32)', // Fallback since this style is unused
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
    color: '#fff', // Fallback since this style is unused
  },
  email: {
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'left',
    color: '#e0e6f0', // Fallback since this style is unused
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
    color: '#fff', // Fallback since this style is unused
  },
  upgradeBtn: {
    backgroundColor: '#fff', // Fallback since this style is unused
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#2979FF', // Fallback since this style is unused
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 6,
  },
  upgradeBtnText: {
    color: '#2979FF', // Fallback since this style is unused
    fontWeight: 'bold',
    fontSize: 17,
  },
  storageText: {
    color: '#e0e6f0', // Fallback since this style is unused
    fontSize: 16,
    marginTop: 6,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#fff', // Fallback since this style is unused
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
    backgroundColor: 'rgba(20,40,80,0.32)',
  },
  specIcon: {
    marginBottom: 10,
  },
  specLabel: {
    fontSize: 16,
    color: '#fff', // Fallback since this style is unused
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
    backgroundColor: '#2979FF', // Fallback since this style is unused
    shadowColor: '#2979FF', // Fallback since this style is unused
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
    color: '#fff', // Fallback since this style is unused
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
    backgroundColor: 'rgba(20,40,80,0.32)', // Fallback since this style is unused
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)', // Fallback since this style is unused
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
    backgroundColor: '#2979FF', // Fallback since this style is unused
  },
  modalTitle: {
    fontSize: 23,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    color: '#fff', // Fallback since this style is unused
  },
  modalMessage: {
    fontSize: 17,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 24,
    color: '#e0e6f0', // Fallback since this style is unused
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
    backgroundColor: '#2979FF', // Fallback since this style is unused
  },
  modalButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff', // Fallback since this style is unused
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