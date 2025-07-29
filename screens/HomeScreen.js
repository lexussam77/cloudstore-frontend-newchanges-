import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, Image, Animated, FlatList, RefreshControl, Dimensions, Modal, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { searchFiles, listFiles } from './api';
import Feather from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useNotification } from './AuthContext';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import FileItem from './FileItem';


const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const user = { name: 'Lazarus', avatar: 'https://img.icons8.com/color/96/user-male-circle--v2.png' };

// DEEP_BLUE_GRADIENT moved to theme constants

export default function HomeScreen() {
  const { theme, constants } = useTheme();
  const [folders, setFolders] = useState([]);
  const [allFiles, setAllFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const heroAnim = useRef(new Animated.Value(0)).current;
  const recentAnim = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation();
  const { hasUnread, unreadCount, markAllRead } = useNotification();

  useEffect(() => {
    Animated.stagger(120, [
      Animated.timing(heroAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(recentAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
    
    fetchFiles();

  }, []);

  const fetchFiles = async () => {
    try {
      const token = await AsyncStorage.getItem('jwt');
      if (!token) return;

      const res = await listFiles(token);
      if (res.success) {
        setAllFiles(res.data);
      }
    } catch (err) {
      console.error('Error fetching files:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshFiles = async () => {
    setRefreshing(true);
    await fetchFiles();
    setRefreshing(false);
  };



  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    if (diffDays <= 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays <= 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const getFileIcon = (fileName) => {
    if (!fileName) return 'https://img.icons8.com/color/96/file.png';
    
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return 'https://img.icons8.com/color/96/pdf.png';
      case 'doc':
      case 'docx':
        return 'https://img.icons8.com/color/96/ms-word.png';
      case 'xls':
      case 'xlsx':
        return 'https://img.icons8.com/color/96/ms-excel.png';
      case 'ppt':
      case 'pptx':
        return 'https://img.icons8.com/color/96/ms-powerpoint.png';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
        return 'https://img.icons8.com/color/96/image.png';
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'wmv':
        return 'https://img.icons8.com/color/96/video.png';
      case 'mp3':
      case 'wav':
      case 'flac':
        return 'https://img.icons8.com/color/96/music.png';
      case 'zip':
      case 'rar':
      case '7z':
        return 'https://img.icons8.com/color/96/zip.png';
      case 'txt':
        return 'https://img.icons8.com/color/96/text.png';
      default:
        return 'https://img.icons8.com/color/96/file.png';
    }
  };

  // Get recent files (last 5 files, excluding compressed ones)
  const recentFiles = allFiles
    .filter(file => !file.name?.includes('_compressed'))
    .slice(0, 5)
    .map(file => ({
      id: file.id,
      name: file.name,
      modified: formatDate(file.modifiedAt || file.createdAt),
      thumb: getFileIcon(file.name),
      file: file
    }));

  // Get starred files
  const starredFiles = allFiles
    .filter(file => (file.favourite || file.favorites) && !file.name?.includes('_compressed'))
    .slice(0, 5)
    .map(file => ({
      id: file.id,
      name: file.name,
      modified: formatDate(file.modifiedAt || file.createdAt),
      thumb: getFileIcon(file.name),
      file: file
    }));

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (!query) {
      setSearchResults(null);
      return;
    }
    
    try {
      const token = await AsyncStorage.getItem('jwt');
      if (!token) return;
      
      const res = await searchFiles(token, query);
      if (res.success) {
        setSearchResults(res.data);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Search error:', err);
      setSearchResults([]);
    }
  };

  const getFilePreview = (file) => {
    if (!file || !file.name) return null;
    
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    // For images, show the actual image
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension)) {
      return { type: 'image', source: file.url };
    }
    
    // For videos, show a video thumbnail with play icon
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(extension)) {
      return { type: 'video', source: file.url };
    }
    
    // For audio, show audio waveform or music icon
    if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'].includes(extension)) {
      return { type: 'audio', source: file.url };
    }
    
    // For PDFs, show PDF icon with preview
    if (extension === 'pdf') {
      return { type: 'pdf', source: file.url };
    }
    
    // For text files, show text preview
    if (['txt', 'md', 'json', 'xml', 'html', 'css', 'js', 'py', 'java', 'cpp', 'c', 'php'].includes(extension)) {
      return { type: 'text', source: file.url };
    }
    
    // For other files, show file icon
    return { type: 'file', source: null };
  };

  const handleFilePress = (file) => {
    // Find the index of the tapped file in recentFiles
    const index = recentFiles.findIndex(f => f.file.id === file.id);
    // Pass the full recentFiles list and initial index to FileViewer
    navigation.navigate('FileViewer', { files: recentFiles.map(f => f.file), initialIndex: index });
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Split Gradient Background */}
      <LinearGradient
        colors={constants.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}> 
        <ScrollView
          contentContainerStyle={{ paddingBottom: 80 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshFiles} tintColor={theme.primary} />}
        >
          {/* Header Row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, marginBottom: 10, marginHorizontal: 24 }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 28, color: '#fff', letterSpacing: 0.2 }}>Home</Text>
            <TouchableOpacity
              style={[styles.bellButton, { padding: 12 }]} // Increased padding for better touch area
              onPress={() => {
                markAllRead();
                navigation.navigate('NotificationScreen');
              }}
            >
              <Feather name="bell" size={32} color={theme.primary} />
              {unreadCount > 0 && (
                <View style={styles.bellNumberCircle}>
                  <Text style={styles.bellNumberText}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          {/* Glassy Search Bar */}
          <BlurView intensity={60} tint="dark" style={[styles.glassySearchBarWrap, { backgroundColor: 'rgba(20,40,80,0.18)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.10)', overflow: 'hidden' }]}> 
            <Feather name="search" size={20} color={theme.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: theme.searchText, fontFamily: 'Inter_400Regular' }]}
              placeholder="Search files..."
              placeholderTextColor={theme.searchPlaceholder}
              value={searchQuery}
              onChangeText={handleSearch}
            />
          </BlurView>
          {/* Search Results */}
          {searchQuery && searchResults !== null && (
            <BlurView intensity={90} tint="dark" style={{ backgroundColor: theme.card, borderRadius: 18, marginHorizontal: 12, marginBottom: 12, padding: 16, shadowColor: theme.shadow, shadowOpacity: 0.10, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 3, overflow: 'hidden' }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: theme.text, marginBottom: 10 }}>Search Results</Text>
              {searchResults.length > 0 ? (
                <FlatList
                  data={searchResults}
                  keyExtractor={item => item.id?.toString()}
                  renderItem={({ item }) => (
                    <FileItem
                      item={item}
                          onPress={() => handleFilePress(item)}
                      onMenuPress={() => {}}
                      onStarPress={() => {}}
                    />
                  )}
                />
              ) : (
                <View style={styles.emptyState}>
                  <Text style={{ color: theme.textSecondary, fontFamily: 'Inter_400Regular', fontSize: 16 }}>No files found</Text>
                </View>
              )}
            </BlurView>
          )}

          {/* Recent Files Section - Only show this section */}
          {recentFiles.length > 0 && (
            <View style={{ marginHorizontal: 12, marginBottom: 18 }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: '#fff', letterSpacing: 0.2, marginLeft: 8, marginBottom: 8 }}>Recent Files</Text>
              {recentFiles.map(item => (
                <FileItem
                  key={item.id}
                  item={item.file}
                  onPress={() => handleFilePress(item.file)}
                  onMenuPress={() => {}}
                  onStarPress={() => {}}
                />
              ))}
            </View>
          )}

          {/* Features Section */}
          <View style={{ marginHorizontal: 12, marginBottom: 24 }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: '#fff', letterSpacing: 0.2, marginLeft: 8, marginBottom: 16 }}>Quick Actions</Text>

            <BlurView intensity={90} tint="dark" style={{
              backgroundColor: constants.glassBg,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: constants.glassBorder,
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOpacity: 0.08,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
              elevation: 3,
            }}>



              {/* Document Scanner */}
              <TouchableOpacity
                style={styles.featureListItem}
                onPress={() => navigation.navigate('DocumentScanner')}
                activeOpacity={0.8}
              >
                <View style={[styles.featureListIcon, { backgroundColor: '#8b5cf6' + '20' }]}>
                  <Feather name="camera" size={20} color="#8b5cf6" />
                </View>
                <View style={styles.featureListContent}>
                  <Text style={styles.featureListTitle}>Scanner</Text>
                  <Text style={styles.featureListDescription}>Scan documents with camera</Text>
                </View>
                <Feather name="chevron-right" size={16} color={constants.secondaryText} />
              </TouchableOpacity>

              {/* Settings */}
              <TouchableOpacity
                style={styles.featureListItem}
                onPress={() => navigation.navigate('Settings')}
                activeOpacity={0.8}
              >
                <View style={[styles.featureListIcon, { backgroundColor: '#ef4444' + '20' }]}>
                  <Feather name="settings" size={20} color="#ef4444" />
                </View>
                <View style={styles.featureListContent}>
                  <Text style={styles.featureListTitle}>Settings</Text>
                  <Text style={styles.featureListDescription}>Customize app preferences</Text>
                </View>
                <Feather name="chevron-right" size={16} color={constants.secondaryText} />
              </TouchableOpacity>

              {/* Account */}
              <TouchableOpacity
                style={styles.featureListItem}
                onPress={() => navigation.navigate('Account')}
                activeOpacity={0.8}
              >
                <View style={[styles.featureListIcon, { backgroundColor: '#06b6d4' + '20' }]}>
                  <Feather name="user" size={20} color="#06b6d4" />
                </View>
                <View style={styles.featureListContent}>
                  <Text style={styles.featureListTitle}>Account</Text>
                  <Text style={styles.featureListDescription}>Manage your profile</Text>
                </View>
                <Feather name="chevron-right" size={16} color={constants.secondaryText} />
              </TouchableOpacity>

              {/* Premium */}
              <TouchableOpacity
                style={styles.featureListItem}
                onPress={() => navigation.navigate('ManagePlan')}
                activeOpacity={0.8}
              >
                <View style={[styles.featureListIcon, { backgroundColor: '#f97316' + '20' }]}>
                  <Feather name="star" size={20} color="#f97316" />
                </View>
                <View style={styles.featureListContent}>
                  <Text style={styles.featureListTitle}>Premium</Text>
                  <Text style={styles.featureListDescription}>Upgrade for more features</Text>
                </View>
                <Feather name="chevron-right" size={16} color={constants.secondaryText} />
              </TouchableOpacity>

              {/* Help & Support */}
              <TouchableOpacity
                style={[styles.featureListItem, { borderBottomWidth: 0 }]}
                onPress={() => navigation.navigate('Help')}
                activeOpacity={0.8}
              >
                <View style={[styles.featureListIcon, { backgroundColor: '#ec4899' + '20' }]}>
                  <Feather name="help-circle" size={20} color="#ec4899" />
                </View>
                <View style={styles.featureListContent}>
                  <Text style={styles.featureListTitle}>Help</Text>
                  <Text style={styles.featureListDescription}>Get support and find answers</Text>
                </View>
                <Feather name="chevron-right" size={16} color={constants.secondaryText} />
              </TouchableOpacity>

            </BlurView>
          </View>

          {/* Folders Grid */}
          {folders.length > 0 && (
            <View style={styles.foldersGrid}>
              {folders.map(folder => (
                <TouchableOpacity key={folder.id} style={[styles.folderCardGrid, { backgroundColor: theme.card, shadowColor: theme.shadow }]} onPress={() => Alert.alert('Open Folder', `Open folder: ${folder.name}`)}>
                  <Image source={{ uri: 'https://img.icons8.com/color/96/folder-invoices--v2.png' }} style={styles.folderIconImgGrid} />
                  <Text style={[styles.folderNameGrid, { color: theme.text, fontFamily: 'Inter_400Regular' }]}>{folder.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 80,
  },
  homeTitleContainer: {
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  homeTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  heroSearchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    marginHorizontal: 18,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowOpacity: 0.1,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'System',
  },
  sectionCard: {
    borderRadius: 16,
    marginHorizontal: 12,
    marginBottom: 12,
    padding: 16,
    shadowOpacity: 0.10,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
    backgroundColor: '#fff',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14.5,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  sketchIllustration: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: 40,
    width: 60,
  },
  sketchCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginBottom: 4,
  },
  sketchLine: {
    width: '100%',
    height: 3,
    borderRadius: 2,
    marginBottom: 4,
  },
  sketchDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginBottom: 4,
  },
  sketchBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: 3,
    width: '100%',
  },
  sketchLink: {
    height: 2,
    borderRadius: 1,
    marginBottom: 3,
    width: '100%',
  },
  sketchTimeline: {
    width: 2,
    height: '100%',
    borderRadius: 1,
    position: 'absolute',
    right: 10,
  },
  sketchFile: {
    height: 3,
    borderRadius: 2,
    marginBottom: 3,
    width: '100%',
  },
  sketchStar: {
    height: 3,
    borderRadius: 2,
    marginBottom: 3,
    width: '100%',
  },
  sketchFileType: {
    height: 4,
    borderRadius: 2,
    marginBottom: 4,
    width: '100%',
  },
  sketchCloud: {
    width: 30,
    height: 20,
    borderRadius: 15,
    marginBottom: 6,
  },
  sketchSync: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginBottom: 6,
  },
  sketchShield: {
    width: 25,
    height: 30,
    borderRadius: 12,
    marginBottom: 6,
  },
  sketchLock: {
    width: 20,
    height: 25,
    borderRadius: 10,
    marginBottom: 6,
  },
  sketchKey: {
    width: 15,
    height: 20,
    borderRadius: 8,
    marginBottom: 6,
  },
  sketchBackup: {
    width: 25,
    height: 25,
    borderRadius: 12,
    marginBottom: 6,
  },
  sketchArrow: {
    width: 20,
    height: 3,
    borderRadius: 2,
    marginBottom: 6,
  },
  sketchServer: {
    width: 30,
    height: 20,
    borderRadius: 10,
    marginBottom: 6,
  },
  sketchUsers: {
    width: 25,
    height: 25,
    borderRadius: 12,
    marginBottom: 6,
  },
  sketchChat: {
    width: 20,
    height: 15,
    borderRadius: 8,
    marginBottom: 6,
  },
  sketchEdit: {
    width: 15,
    height: 20,
    borderRadius: 8,
    marginBottom: 6,
  },
  sketchGraph: {
    width: 30,
    height: 20,
    borderRadius: 10,
    marginBottom: 6,
  },
  sketchMetric: {
    width: 20,
    height: 15,
    borderRadius: 8,
    marginBottom: 6,
  },
  sketchTrend: {
    width: 25,
    height: 3,
    borderRadius: 2,
    marginBottom: 6,
  },
  sketchShare: {
    width: 25,
    height: 25,
    borderRadius: 12,
    marginBottom: 6,
  },
  sketchAudio: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  sketchWave: {
    height: 2,
    borderRadius: 1,
    marginBottom: 2,
    width: '100%',
  },
  sketchDocument: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  sketchPage: {
    width: 20,
    height: 25,
    borderRadius: 2,
    marginBottom: 3,
  },
  sketchText: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  sketchTextLine: {
    height: 2,
    borderRadius: 1,
    marginBottom: 2,
    width: '100%',
  },
  sketchEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  sketchSearch: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  sketchSearchIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginBottom: 6,
  },
  sketchSearchLine: {
    width: 16,
    height: 2,
    borderRadius: 1,
  },
  recentFilesList: {
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  recentFileCard: {
    width: 110,
    height: 120,
    borderRadius: 12,
    marginRight: 10,
    padding: 10,
    backgroundColor: '#f7f7fa',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  recentFileThumbImg: {
    width: 36,
    height: 36,
    marginBottom: 6,
    borderRadius: 7,
  },
  recentFileName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
    textAlign: 'center',
  },
  recentFileMeta: {
    fontSize: 10,
    color: '#888',
    textAlign: 'center',
  },
  menuButton: {
    padding: 6,
    borderRadius: 20,
    position: 'absolute',
    top: 8,
    right: 8,
  },
  foldersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginHorizontal: 10,
    marginBottom: 10,
  },
  folderCardGrid: {
    alignItems: 'center',
    borderRadius: 12,
    margin: 8,
    padding: 12,
    width: 110,
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  folderIconImgGrid: {
    width: 48,
    height: 48,
    marginBottom: 6,
  },
  folderNameGrid: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 20,
    width: screenWidth * 0.95,
    height: screenHeight * 0.9,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 16,
  },
  modalCloseButton: {
    padding: 8,
    borderRadius: 20,
  },
  modalBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  previewScrollView: {
    flex: 1,
    width: '100%',
  },
  previewScrollContent: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100%',
  },
  previewImage: {
    width: screenWidth * 0.9,
    height: screenHeight * 0.6,
    borderRadius: 12,
  },
  previewVideoContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewVideo: {
    width: screenWidth * 0.9,
    height: screenHeight * 0.6,
    borderRadius: 12,
  },
  previewAudioContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  audioVisualizer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  audioTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewWebView: {
    flex: 1,
    width: '100%',
    borderRadius: 12,
  },
  previewText: {
    fontSize: 16,
    padding: 20,
    lineHeight: 24,
  },
  previewUnsupported: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  previewUnsupportedText: {
    fontSize: 18,
    marginBottom: 24,
    textAlign: 'center',
  },
  openFileButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  openFileButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  filePreviewContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginBottom: 6,
    overflow: 'hidden',
  },
  filePreviewImage: {
    width: '100%',
    height: '100%',
  },
  videoPreviewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioPreviewContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pdfPreviewContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textPreviewContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustrationSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  sketchContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    height: 60,
  },
  illustrationText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },

  popularBadge: {
    backgroundColor: '#ff6b35',
    borderRadius: 12,
    padding: 4,
    position: 'absolute',
    top: 8,
    right: 8,
  },
  illustrationImage: {
    width: '100%',
    height: 120,
    marginBottom: 12,
    borderRadius: 12,
  },
  featureCard: {
    width: '100%',
    borderRadius: 18,
    marginBottom: 16,
    overflow: 'hidden',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  featureImage: {
    width: '100%',
    height: 200,
  },
  featureContent: {
    padding: 20,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  featureCardDropbox: {
    width: '100%',
    marginBottom: 24,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
  },
  featureContentDropbox: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 10,
  },
  featureTitleDropbox: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'left',
  },
  featureDescriptionDropbox: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 0,
    textAlign: 'left',
  },
  featureImageDropbox: {
    width: '100%',
    height: 180,
    marginTop: 0,
    borderRadius: 0,
  },
  featureBannerDropbox: {
    width: '100%',
    marginBottom: 24,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
  },
  featureBannerImageWrapDropbox: {
    width: '100%',
    aspectRatio: 1.7,
    position: 'relative',
    overflow: 'hidden',
  },
  featureBannerImageDropbox: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
  },
  featureBannerTextOverlayDropboxHome: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: 'transparent',
    alignItems: 'flex-end',
  },
  featureBannerTitleDropboxHome: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'right',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginTop: 10,
    marginBottom: 16,
    paddingVertical: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  bellButton: {
    marginLeft: 12,
    position: 'relative',
    padding: 6,
  },
  bellBlueTick: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2563eb',
    borderWidth: 2,
    borderColor: '#fff',
  },
  bellBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#2563eb',
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    zIndex: 10,
  },
  bellBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingHorizontal: 1,
  },
  featureCard: {
    width: 160,
    marginHorizontal: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  featureCardBlur: {
    backgroundColor: 'rgba(20,40,80,0.32)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    minHeight: 140,
    justifyContent: 'center',
  },
  featureIconContainer: {
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: '#fff',
    marginBottom: 6,
    textAlign: 'center',
  },
  featureDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 16,
  },
  featureListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  featureListIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureListContent: {
    flex: 1,
  },
  featureListTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: '#fff',
    marginBottom: 2,
  },
  featureListDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  glassySearchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20, // reduced from 32
    marginHorizontal: 0,
    marginBottom: 16,
    paddingHorizontal: 14, // slightly reduced
    paddingVertical: 8, // reduced from 14
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
    backgroundColor: 'rgba(20,40,80,0.32)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.10)',
    width: '95%',
    alignSelf: 'center',
  },
  filePadGlass: {
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(20,40,80,0.32)',
    marginRight: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    overflow: 'hidden',
    alignItems: 'center',
    padding: 16,
  },
  filePadTouchable: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 110,
    height: 120,
  },
  outerPadGlass: {
    backgroundColor: 'rgba(20,40,80,0.32)',
    borderRadius: 36,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    padding: 32,
    marginHorizontal: 12,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  bellNumber: {
    position: 'absolute',
    top: 2,
    right: 2,
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: '#fff',
    fontWeight: 'bold',
    zIndex: 10,
  },
  bellNumberCircle: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  bellNumberText: {
    color: '#fff',
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingHorizontal: 2,
  },
}); 