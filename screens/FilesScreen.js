import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SectionList, Modal, TouchableWithoutFeedback, Alert, SafeAreaView, FlatList, ScrollView, Image, ActivityIndicator, Animated, RefreshControl, Platform, Linking } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import * as DocumentPicker from 'expo-document-picker';
import { uploadFiles, searchFiles, createFolder, listFiles, listFolders, API_BASE_URL, renameFile, favoriteFile, deleteFile, downloadFile, getDownloadUrl, deleteFolder, renameFolder } from './api';
import { useNavigation } from '@react-navigation/native';
import MyFilesSVG from '../assets/images/undraw_my-files_1xwx.svg';
import UploadSVG from '../assets/images/undraw_upload_cucu.svg';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FileItem from './FileItem';
import FolderItem from './FolderItem';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { useTheme } from '../theme/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Text as RNText, TextInput as RNTextInput } from 'react-native';

RNText.defaultProps = RNText.defaultProps || {};
RNText.defaultProps.style = [{ fontFamily: 'Inter' }];
RNTextInput.defaultProps = RNTextInput.defaultProps || {};
RNTextInput.defaultProps.style = [{ fontFamily: 'Inter' }];

const folders = [];
const categories = [
  { key: 'all', label: 'All' },
  { key: 'favourites', label: 'Favourites' },
  { key: 'folders', label: 'Folders' },
  { key: 'scanned', label: 'Scanned Documents' },
  { key: 'compressed', label: 'Compressed Files' },
];
const files = [];
const recentlyDeleted = [];
const scannedDocuments = [];

const sections = [
  {
    title: 'Folders',
    data: folders.length ? folders : [{}],
    key: 'folders',
  },
  {
    title: 'Files',
    data: files.length ? files : [{}],
    key: 'files',
  },
  {
    title: 'Scanned Documents',
    data: scannedDocuments.length ? scannedDocuments : [{}],
    key: 'scanned',
  },
  {
    title: 'Compressed Files',
    data: recentlyDeleted.length ? recentlyDeleted : [{}],
    key: 'compressed',
  },
];

// Helper for breadcrumbs - now uses actual folder path
const getBreadcrumbs = (folderPath) => {
  // Only show folder path, not 'All Files'
  return folderPath.map(folder => folder.name);
};

// Skeleton Loader Component
function SkeletonLoader({ type = 'file' }) {
  const { theme } = useTheme();
  return (
    <View style={[
      type === 'file' ? styles.skeletonFile : styles.skeletonFolder,
      { backgroundColor: theme.secondaryLight }
    ]}>
      <View style={[styles.skeletonIcon, { backgroundColor: theme.secondaryDark }]} />
      <View style={[styles.skeletonTextBlock, { backgroundColor: theme.secondaryDark }]} />
      {type === 'file' && <View style={[styles.skeletonTextBlockSmall, { backgroundColor: theme.secondaryDark }]} />}
    </View>
  );
}

const DEEP_BLUE_GRADIENT = ['#0a0f1c', '#12203a', '#1a2a4f'];

export default function FilesScreen() {
  const { theme } = useTheme();
  const [menuFileId, setMenuFileId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const menuButtonRefs = useRef({});
  const [folders, setFolders] = useState([]);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [fileList, setFileList] = useState(files);
  const [scannedDocuments, setScannedDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [folderPath, setFolderPath] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [sortOption, setSortOption] = useState('date');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [menuType, setMenuType] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameItem, setRenameItem] = useState(null);
  const [newName, setNewName] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadItem, setDownloadItem] = useState(null);
  const [showCompressModal, setShowCompressModal] = useState(false);
  const [compressItem, setCompressItem] = useState(null);
  const [compressionSettings, setCompressionSettings] = useState({
    quality: 'medium',
    format: 'zip',
    level: 'balanced'
  });
  const [compressing, setCompressing] = useState(false);
  const [showUploadSuccess, setShowUploadSuccess] = useState(false);
  const [uploadSuccessType, setUploadSuccessType] = useState('');
  const uploadSuccessScale = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation();
  const [showPropertiesModal, setShowPropertiesModal] = useState(false);
  const [propertiesItem, setPropertiesItem] = useState(null);
  // Add state for document picking
  const [isPickingDocument, setIsPickingDocument] = useState(false);

  const handleMenuPress = (item, type) => {
    if (menuButtonRefs.current[item.id]) {
      menuButtonRefs.current[item.id].measureInWindow((x, y, width, height) => {
        setMenuPosition({ x, y: y + height });
        setMenuFileId(item.id);
        setMenuType(type);
        setSelectedItem(item);
      });
    } else {
      setMenuFileId(item.id);
      setMenuType(type);
      setSelectedItem(item);
    }
  };
  const closeMenu = () => {
    setMenuFileId(null);
    setMenuType(null);
    setSelectedItem(null);
  };

  const handleMenuAction = async (action, item, type) => {
    closeMenu();
    let token = null;
    try {
      token = await AsyncStorage.getItem('jwt');
    } catch {}
    
    if (!token) {
      Alert.alert('Error', 'Authentication required');
      return;
    }

    try {
    if (type === 'file') {
        if (action === 'open') {
          handleFilePress(item);
        } else if (action === 'rename') {
          setRenameItem(item);
          setNewName(item.name);
          setShowRenameModal(true);
        } else if (action === 'download') {
          try {
            Alert.alert('Download', 'Getting download URL...');
            const res = await getDownloadUrl(token, item.id);
            if (res.success) {
              // Get the file URL from the response
              const fileUrl = res.data.url;
              if (!fileUrl) {
                Alert.alert('Error', 'No download URL available');
                return;
              }

              // Ask user where they want to save the file
              Alert.alert(
                'Save File',
                'Where would you like to save this file?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Downloads Folder', 
                    onPress: () => downloadToDownloads(fileUrl, item.name)
                  },
                  { 
                    text: 'Choose Location', 
                    onPress: () => downloadToCustomLocation(fileUrl, item.name)
                  }
                ]
              );
            } else {
              Alert.alert('Error', res.error || 'Failed to download file');
            }
          } catch (err) {
            console.error('Download error:', err);
            Alert.alert('Error', 'Failed to download file: ' + err.message);
          }
        } else if (action === 'share') {
          try {
            // Use the file's URL directly since files are stored on Cloudinary
            const fileUrl = item.url;
            
            console.log('Item object:', item);
            console.log('File URL for sharing:', fileUrl);
            
            if (!fileUrl) {
              Alert.alert('Error', 'No shareable URL available');
              return;
            }
            
            if (await Sharing.isAvailableAsync()) {
              try {
                // Always download the file to cache first since expo-sharing only supports local files
                const fileName = item.name;
                const fileExtension = fileName.includes('.') ? fileName.split('.').pop() : '';
                const baseName = fileName.includes('.') ? fileName.substring(0, fileName.lastIndexOf('.')) : fileName;
                const uniqueFileName = `${baseName}_${Date.now()}${fileExtension ? '.' + fileExtension : ''}`;
                
                const cacheDir = FileSystem.cacheDirectory + 'Shares/';
                const cacheFileUri = cacheDir + uniqueFileName;
                
                console.log('Cache directory:', cacheDir);
                console.log('Cache file URI:', cacheFileUri);
                console.log('File name:', fileName);
                console.log('Unique file name:', uniqueFileName);
                
                const dirInfo = await FileSystem.getInfoAsync(cacheDir);
                console.log('Directory exists:', dirInfo.exists);
                
                if (!dirInfo.exists) {
                  console.log('Creating directory...');
                  await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
                  console.log('Directory created successfully');
                }
                
                console.log('Starting download from:', fileUrl);
                console.log('Downloading to:', cacheFileUri);
                
                const downloadResult = await FileSystem.downloadAsync(fileUrl, cacheFileUri);
                
                console.log('Download result:', downloadResult);
                console.log('Download status code:', downloadResult.statusCode);
                console.log('Download status:', downloadResult.status);
                
                if (downloadResult.statusCode === 200 || downloadResult.status === 200) {
                  console.log('File downloaded successfully, sharing:', cacheFileUri);
                  await Sharing.shareAsync(cacheFileUri, {
                    dialogTitle: `Share ${item.name}`,
                  });
                } else {
                  console.error('Download failed with status:', downloadResult.statusCode || downloadResult.status);
                  Alert.alert('Error', `Failed to download file for sharing. Status: ${downloadResult.statusCode || downloadResult.status}`);
                }
              } catch (downloadError) {
                console.error('Download error for sharing:', downloadError);
                console.error('Error message:', downloadError.message);
                console.error('Error stack:', downloadError.stack);
                Alert.alert('Error', 'Failed to prepare file for sharing: ' + downloadError.message);
              }
            } else {
              Alert.alert('Sharing not available', 'Sharing is not available on this device');
            }
          } catch (err) {
            console.error('Share error:', err);
            console.error('Error message:', err.message);
            console.error('Error stack:', err.stack);
            Alert.alert('Error', 'Failed to share file: ' + err.message);
          }
        } else if (action === 'delete') {
          Alert.alert(
            'Delete File',
            `Are you sure you want to permanently delete "${item.name}"?`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                  const res = await deleteFile(token, item.id);
                  if (res.success) {
                    Alert.alert('Success', 'File deleted successfully!');
                    await refreshFiles();
                  } else {
                    Alert.alert('Error', res.error || 'Failed to delete file');
                  }
                }
              }
            ]
          );
        } else if (action === 'properties') {
          setPropertiesItem(item);
          setShowPropertiesModal(true);
          return;
        }
    } else if (type === 'folder') {
      if (action === 'open') {
        handleFolderPress(item);
      } else if (action === 'rename') {
        setRenameItem(item);
        setNewName(item.name);
        setShowRenameModal(true);
      } else if (action === 'delete') {
        Alert.alert(
          'Delete Folder',
          `Are you sure you want to delete "${item.name}" and all its contents?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: async () => {
                const res = await deleteFolder(token, item.id);
                if (res.success) {
                  Alert.alert('Success', 'Folder deleted successfully!');
                  await refreshFiles();
                } else {
                  Alert.alert('Error', res.error || 'Failed to delete folder');
                }
              }
            }
          ]
        );
      }
    }
    } catch (err) {
      Alert.alert('Error', err.message || 'Something went wrong');
    }
  };

  const handleUpload = async () => {
    if (isPickingDocument) return; // Prevent double-picking
    setIsPickingDocument(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const files = result.assets || (result.type === 'success' ? [result] : []);
      if (!files.length) return;
      setUploading(true);
      setUploadProgress(0);
      
      console.log('Selected files:', files);
      
      // Get JWT token
      let token = null;
      try {
        token = await AsyncStorage.getItem('jwt');
      } catch {}
      if (!token) {
        Alert.alert('Error', 'Authentication required');
      setUploading(false);
        return;
      }
      
      console.log('JWT token obtained:', token ? 'present' : 'missing');
      
      // Use XMLHttpRequest for progress
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${CLOUDINARY_URL}/raw/upload`);
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          setUploadProgress(Math.round((event.loaded / event.total) * 100));
        }
      };
      xhr.onload = async () => {
        setUploading(false);
        setUploadProgress(0);
        const data = JSON.parse(xhr.responseText);
        console.log('Cloudinary response:', data);
        
        if (data.secure_url) {
          console.log('File uploaded to Cloudinary, registering in backend...');
          // Register file in backend
          try {
            const registerData = {
              name: files[0].name || files[0].fileName || 'upload',
              url: data.secure_url,
              folderId: currentFolderId,
              type: files[0].mimeType || files[0].type,
              size: files[0].size,
            };
            console.log('Registering file with data:', registerData);
            
            const registerResponse = await fetch(`${API_BASE_URL}/files/register`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(registerData),
            });
            
            console.log('Backend register response status:', registerResponse.status);
            const registerResult = await registerResponse.json();
            console.log('Backend register response:', registerResult);
            
            if (registerResponse.ok) {
              console.log('File registered successfully, refreshing files...');
              // Refresh files after successful upload
              await refreshFiles();
              // Show upload success animation
              setUploadSuccessType('file');
              setShowUploadSuccess(true);
              Animated.spring(uploadSuccessScale, {
                toValue: 1,
                useNativeDriver: true,
                tension: 100,
                friction: 8,
              }).start();
              setTimeout(() => {
                Animated.timing(uploadSuccessScale, {
                  toValue: 0,
                  duration: 200,
                  useNativeDriver: true,
                }).start(() => setShowUploadSuccess(false));
              }, 2000);
              setSuccessMessage('File uploaded successfully!');
              setShowSuccessModal(true);
      } else {
              console.log('Backend registration failed');
              Alert.alert('Error', 'Failed to register file in backend');
      }
    } catch (err) {
            console.log('Error registering file:', err);
            Alert.alert('Error', 'Failed to register file in backend');
          }
        } else {
          console.log('Cloudinary upload failed:', data);
          Alert.alert('Error', data.error?.message || 'Upload failed');
        }
      };
      xhr.onerror = () => {
      setUploading(false);
        setUploadProgress(0);
        console.log('XHR error occurred');
        Alert.alert('Upload error', 'Unknown error');
      };
      const formData = new FormData();
      formData.append('file', {
        uri: files[0].uri,
        type: files[0].mimeType || files[0].type || 'application/octet-stream',
        name: files[0].name || files[0].fileName || 'upload',
      });
      formData.append('upload_preset', UPLOAD_PRESET);
      formData.append('resource_type', 'raw'); // Ensure it's treated as a raw file
      console.log('Sending to Cloudinary...');
      xhr.send(formData);
    } catch (err) {
      setUploading(false);
      setUploadProgress(0);
      console.log('Upload error:', err);
      Alert.alert('Upload error', err.message || 'Unknown error');
    } finally {
      setIsPickingDocument(false);
    }
  };

  const handleScan = () => {
    navigation.navigate('DocumentScanner');
  };
  const handleCreateFolder = () => {
    setShowFolderModal(true);
  };
  const handleAddFolder = async () => {
    if (!newFolderName || newFolderName.trim() === '') {
      Alert.alert('Error', 'Please enter a folder name');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('jwt');
      if (!token) {
        Alert.alert('Error', 'Authentication required');
        return;
      }

      const res = await createFolder(token, newFolderName.trim());
      if (res.success) {
        setShowFolderModal(false);
        setNewFolderName('');
        // Show folder creation success animation
        setUploadSuccessType('folder');
        setShowUploadSuccess(true);
        Animated.spring(uploadSuccessScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start();
        setTimeout(() => {
          Animated.timing(uploadSuccessScale, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start(() => setShowUploadSuccess(false));
        }, 2000);
        setSuccessMessage('Folder created successfully!');
        setShowSuccessModal(true);
        // Refresh files to show the new folder
        await refreshFiles();
      } else {
        Alert.alert('Error', res.error || 'Failed to create folder');
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to create folder');
    }
  };

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

  const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/ds5gugfv0';
  const UPLOAD_PRESET = 'EXPO_UPLOAD';

  // Helper function to download file to Downloads folder
  const downloadToDownloads = async (fileUrl, fileName) => {
    try {
      // Request permissions for media library
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to save files to your device.');
        return;
      }

      // Create a unique filename for the download
      const fileExtension = fileName.includes('.') ? fileName.split('.').pop() : '';
      const baseName = fileName.includes('.') ? fileName.substring(0, fileName.lastIndexOf('.')) : fileName;
      const uniqueFileName = `${baseName}_${Date.now()}${fileExtension ? '.' + fileExtension : ''}`;
      
      // First download to cache directory
      const cacheDir = FileSystem.cacheDirectory + 'Downloads/';
      const cacheFileUri = cacheDir + uniqueFileName;
      
      // Create cache directory if it doesn't exist
      const dirInfo = await FileSystem.getInfoAsync(cacheDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
      }
      
      // Download the file to cache first
      const downloadResult = await FileSystem.downloadAsync(fileUrl, cacheFileUri, {
        onProgress: (progress) => {
          const percent = Math.round((progress.totalBytesWritten / progress.totalBytesExpectedToWrite) * 100);
          console.log(`Download progress: ${percent}%`);
        }
      });
      
      if (downloadResult.statusCode === 200 || downloadResult.status === 200) {
        // Save to device's Downloads folder using MediaLibrary
        try {
          const asset = await MediaLibrary.createAssetAsync(cacheFileUri);
          await MediaLibrary.createAlbumAsync('Downloads', asset, false);
          
          Alert.alert(
            'Download Complete', 
            `File saved to your device's Downloads folder\n\nFile: "${uniqueFileName}"`,
            [
              { text: 'OK', style: 'default' },
              { 
                text: 'Open File', 
                onPress: async () => {
                  try {
                    if (await Sharing.isAvailableAsync()) {
                      await Sharing.shareAsync(cacheFileUri);
                    } else {
                      Alert.alert('Sharing not available', 'File has been saved to your device');
                    }
                  } catch (err) {
                    Alert.alert('Error', 'Could not open file');
                  }
                }
              },
              {
                text: 'Show in Gallery',
                onPress: async () => {
                  try {
                    await MediaLibrary.openAssetAsync(asset);
                  } catch (err) {
                    Alert.alert('Error', 'Could not open file in gallery');
                  }
                }
              }
            ]
          );
        } catch (mediaError) {
          console.error('MediaLibrary error:', mediaError);
          // Fallback to cache directory if MediaLibrary fails
          Alert.alert(
            'Download Complete', 
            `File saved to app cache folder\n\nFile: "${uniqueFileName}"`,
            [
              { text: 'OK', style: 'default' },
              { 
                text: 'Open File', 
                onPress: async () => {
                  try {
                    if (await Sharing.isAvailableAsync()) {
                      await Sharing.shareAsync(cacheFileUri);
                    } else {
                      Alert.alert('Sharing not available', 'File has been saved to your device');
                    }
                  } catch (err) {
                    Alert.alert('Error', 'Could not open file');
                  }
                }
              }
            ]
          );
        }
      } else {
        Alert.alert('Error', 'Failed to download file to device');
      }
    } catch (err) {
      console.error('Download error:', err);
      Alert.alert('Error', 'Failed to download file: ' + err.message);
    }
  };

  // Helper function to download file to custom location
  const downloadToCustomLocation = async (fileUrl, fileName) => {
    try {
      // Let user choose where to save the file
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: false,
        multiple: false,
        mode: 'import'
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedFile = result.assets[0];
        const targetUri = selectedFile.uri;
        
        // Download the file to the selected location
        const downloadResult = await FileSystem.downloadAsync(fileUrl, targetUri, {
          onProgress: (progress) => {
            const percent = Math.round((progress.totalBytesWritten / progress.totalBytesExpectedToWrite) * 100);
            console.log(`Download progress: ${percent}%`);
          }
        });
        
        if (downloadResult.statusCode === 200 || downloadResult.status === 200) {
          Alert.alert(
            'Download Complete', 
            `File saved to your selected location`,
            [
              { text: 'OK', style: 'default' },
              { 
                text: 'Open File', 
                onPress: async () => {
                  try {
                    if (await Sharing.isAvailableAsync()) {
                      await Sharing.shareAsync(targetUri);
                    } else {
                      Alert.alert('Sharing not available', 'File has been saved to your device');
                    }
                  } catch (err) {
                    Alert.alert('Error', 'Could not open file');
                  }
                }
              }
            ]
          );
        } else {
          Alert.alert('Error', 'Failed to download file to selected location');
        }
      }
    } catch (err) {
      console.error('Download error:', err);
      Alert.alert('Error', 'Failed to download file: ' + err.message);
    }
  };

  const handleOptionPress = async (option) => {
    setShowUploadModal(false);
    let token = null;
    try {
      token = await AsyncStorage.getItem('jwt');
    } catch {}
    try {
      if (option === 'Create Folder') {
        setShowFolderModal(true);
        return;
      }
      if (option === 'Scan Document') {
        handleScan();
        return;
      }
      setUploading(true);
      let fileAsset = null;
      let formData = new FormData();
      if (option === 'Take Photo') {
        const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 1 });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          fileAsset = result.assets[0];
          const name = fileAsset.fileName || fileAsset.name || `photo_${Date.now()}.jpg`;
          const type = fileAsset.mimeType || fileAsset.type || 'image/jpeg';
          formData.append('file', {
            uri: fileAsset.uri,
            type,
            name,
          });
        } else {
          setUploading(false);
          return;
        }
      } else {
        const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          fileAsset = result.assets[0];
          formData.append('file', {
            uri: fileAsset.uri,
            type: fileAsset.mimeType || fileAsset.type || 'application/octet-stream',
            name: fileAsset.name || fileAsset.fileName || 'upload',
          });
        } else {
          setUploading(false);
          return;
        }
      }
      formData.append('upload_preset', UPLOAD_PRESET);
      formData.append('resource_type', 'raw'); // Ensure it's treated as a raw file
      try {
        const res = await fetch(`${CLOUDINARY_URL}/raw/upload`, {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        console.log('Cloudinary response in handleOptionPress:', data);
        if (data.secure_url) {
          console.log('File uploaded to Cloudinary via handleOptionPress, registering in backend...');
          // Register file in backend
          try {
            const registerData = {
                name: fileAsset.name || fileAsset.fileName || 'upload',
                url: data.secure_url,
                folderId: currentFolderId,
                type: fileAsset.mimeType || fileAsset.type,
                size: fileAsset.size,
            };
            console.log('Registering file with data:', registerData);
            
            const registerResponse = await fetch(`${API_BASE_URL}/files/register`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(registerData),
            });
            
            console.log('Backend register response status:', registerResponse.status);
            
            if (registerResponse.ok) {
              console.log('File registered successfully, refreshing files...');
              // Refresh files after successful upload
              await refreshFiles();
              setSuccessMessage('File uploaded successfully!');
              setShowSuccessModal(true);
            } else {
              console.log('Backend registration failed');
              Alert.alert('Error', 'Failed to register file in backend');
            }
          } catch (err) {
            console.log('Error registering file:', err);
            Alert.alert('Error', 'Failed to register file in backend');
          }
        } else {
          console.log('Cloudinary upload failed:', data);
          Alert.alert('Error', data.error?.message || 'Upload failed');
        }
      } catch (err) {
        Alert.alert('Error', 'Upload failed');
      }
      setUploading(false);
    } catch (err) {
      setUploading(false);
      Alert.alert('Error', err.message || 'Unknown error');
    }
  };

  // Filtering logic for categories and search
  let filteredFiles = searchResults || fileList;
  let showFolders = selectedCategory === 'all' || selectedCategory === 'folders';
  
  console.log('Current fileList:', fileList);
  console.log('Current scannedDocuments:', scannedDocuments);
  console.log('Current folders:', folders);
  console.log('Selected category:', selectedCategory);
  console.log('Show folders:', showFolders);
  console.log('Search results:', searchResults);
  console.log('Search query:', searchQuery);
  
  // If there's a search query, use search results and skip category filtering
  if (searchQuery && searchResults) {
    // Search results are already filtered, just apply sorting
  } else {
    // Apply category filtering only when not searching
    if (selectedCategory === 'favourites') {
      const allFiles = [...fileList, ...scannedDocuments];
      filteredFiles = allFiles.filter(f => f.favourite || f.favorites);
    } else if (selectedCategory === 'folders') {
      // For folders tab, we don't need to filter files since we show folders separately
      filteredFiles = [];
    } else if (selectedCategory === 'scanned') {
      // Show scanned documents (PDFs)
      filteredFiles = scannedDocuments;
    } else if (selectedCategory === 'compressed') {
      // Show all files with '_compressed' in the name, including images/videos
      const allFiles = [...fileList, ...scannedDocuments];
      filteredFiles = allFiles.filter(f => f.name && f.name.includes('_compressed'));
    } else if (selectedCategory === 'all') {
      // Show both regular files and scanned documents
      filteredFiles = [...fileList, ...scannedDocuments];
    }
  }
  
  console.log('Filtered files:', filteredFiles);
  
  // Sorting logic
  if (sortOption === 'type') {
    filteredFiles = [...filteredFiles].sort((a, b) => {
      const extA = a.name?.split('.').pop().toLowerCase() || '';
      const extB = b.name?.split('.').pop().toLowerCase() || '';
      return extA.localeCompare(extB);
    });
  } else if (sortOption === 'date') {
    filteredFiles = [...filteredFiles].sort((a, b) => {
      // Assuming you have a 'modified' or 'createdAt' field as a date string or timestamp
      return (b.modifiedAt || 0) - (a.modifiedAt || 0);
    });
  } else if (sortOption === 'size') {
    filteredFiles = [...filteredFiles].sort((a, b) => (b.size || 0) - (a.size || 0));
  }

  const menuOptions = [
    { label: 'Upload Picture', icon: 'image' },
    { label: 'Take Photo', icon: 'camera' },
    { label: 'Scan Document', icon: 'file-plus' },
    { label: 'Upload Document', icon: 'file-text' },
    { label: 'Upload Audio', icon: 'music' },
    { label: 'Upload Video', icon: 'video' },
    { label: 'Create Folder', icon: 'folder-plus' },
  ];

  function RadialMenu({ onPress }) {
    const RADIUS = 110;
    const CENTER = 130;
    const angleStep = (2 * Math.PI) / menuOptions.length;
    const BUTTON_SIZE = 64; // Reduced from 76
    return (
      <View style={[styles.overlay, { backgroundColor: 'rgba(0, 0, 0, 0.4)' }]} pointerEvents="box-none">
        <LinearGradient
          colors={DEEP_BLUE_GRADIENT}
          style={[
            styles.wheel,
            {
              shadowColor: '#000',
              shadowOpacity: 0.3,
              shadowRadius: 20,
              shadowOffset: { width: 0, height: 10 },
              elevation: 15,
            },
          ]}
        >
          {menuOptions.map((opt, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const x = CENTER + RADIUS * Math.cos(angle) - BUTTON_SIZE / 2;
            const y = CENTER + RADIUS * Math.sin(angle) - BUTTON_SIZE / 2;
            return (
              <TouchableOpacity
                key={opt.label}
                style={[
                  styles.iconButton,
                  {
                    left: x,
                    top: y,
                    width: BUTTON_SIZE,
                    height: BUTTON_SIZE,
                    borderRadius: BUTTON_SIZE / 2,
                    backgroundColor: 'rgba(255,255,255,0.10)',
                    shadowColor: '#000',
                    shadowOpacity: 0.2,
                    shadowRadius: 12,
                    shadowOffset: { width: 0, height: 6 },
                    elevation: 8,
                    borderWidth: 1,
                    borderColor: '#4a4a4a',
                  },
                ]}
                onPress={() => onPress(opt.label)}
                activeOpacity={0.7}
              >
                <Feather name={opt.icon} size={28} color="#fff" />
              </TouchableOpacity>
            );
          })}
        </LinearGradient>
      </View>
    );
  }

    const fetchFiles = async () => {
      let token = null;
      try {
      token = await AsyncStorage.getItem('jwt');
      } catch {}
      if (!token) return;
    setLoading(true);
    console.log('Fetching files with token:', token ? 'present' : 'missing');
    console.log('Current folder ID:', currentFolderId);
      
      // Fetch both files and folders
      const [filesRes, foldersRes] = await Promise.all([
        listFiles(token, currentFolderId),
        listFolders(token, currentFolderId)
      ]);
      
      console.log('Files API response:', filesRes);
      console.log('Folders API response:', foldersRes);
      
      if (filesRes && filesRes.success && Array.isArray(filesRes.data)) {
        console.log('Setting fileList to:', filesRes.data);
        
        // Separate scanned documents (PDFs) from regular files
        const scannedDocs = filesRes.data.filter(file => 
          file.name && file.name.toLowerCase().endsWith('.pdf')
        );
        const regularFiles = filesRes.data.filter(file => 
          !file.name || !file.name.toLowerCase().endsWith('.pdf')
        );
        
        console.log('Scanned documents found:', scannedDocs.length);
        console.log('Regular files found:', regularFiles.length);
        
        setFileList(regularFiles);
        setScannedDocuments(scannedDocs);
      } else {
        console.log('Files API response was not successful or data is not an array');
        setFileList([]);
        setScannedDocuments([]);
      }
      
      if (foldersRes && foldersRes.success && Array.isArray(foldersRes.data)) {
        console.log('Setting folders to:', foldersRes.data);
        setFolders(foldersRes.data);
      } else {
        console.log('Folders API response was not successful or data is not an array');
        setFolders([]);
      }
      
    setLoading(false);
  };

  const refreshFiles = async () => {
    setRefreshing(true);
    await fetchFiles();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchFiles();
  }, [currentFolderId]);

  const handleRename = async () => {
    if (!newName || newName.trim() === '') return;
    
    let token = null;
    try {
      token = await AsyncStorage.getItem('jwt');
    } catch {}
    
    if (!token) {
      Alert.alert('Error', 'Authentication required');
      return;
    }

    try {
      console.log('Rename item:', renameItem);
      console.log('Item properties:', {
        id: renameItem.id,
        name: renameItem.name,
        url: renameItem.url,
        size: renameItem.size,
        type: renameItem.type
      });
      
      let res;
      // Check if it's a folder by looking for file-specific properties
      const isFolder = !renameItem.url && !renameItem.size && !renameItem.type;
      console.log('Is folder:', isFolder);
      
      if (isFolder) {
        // Rename folder
        console.log('Renaming folder with ID:', renameItem.id);
        res = await renameFolder(token, renameItem.id, newName.trim());
      } else {
        // Rename file
        console.log('Renaming file with ID:', renameItem.id);
        res = await renameFile(token, renameItem.id, newName.trim());
      }
      
      if (res.success) {
        setShowRenameModal(false);
        const itemType = isFolder ? 'Folder' : 'File';
        setSuccessMessage(`${itemType} renamed successfully!`);
        setShowSuccessModal(true);
        await refreshFiles();
      } else {
        Alert.alert('Error', res.error || 'Failed to rename item');
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to rename item');
    }
  };

  const handleStarPress = async (item) => {
    let token = null;
    try {
      token = await AsyncStorage.getItem('jwt');
    } catch {}
    
    if (!token) {
      Alert.alert('Error', 'Authentication required');
      return;
    }

    try {
      const res = await favoriteFile(token, item.id);
      if (res.success) {
        // Update the local state immediately for better UX
        setFileList(prevFiles => 
          prevFiles.map(file => 
            file.id === item.id 
              ? { ...file, favourite: !file.favourite, favorites: !file.favorites }
              : file
          )
        );
        
        // Also update scanned documents if the item is a scanned document
        setScannedDocuments(prevScanned => 
          prevScanned.map(file => 
            file.id === item.id 
              ? { ...file, favourite: !file.favourite, favorites: !file.favorites }
              : file
          )
        );
        
        // Show success message
        const action = item.favourite || item.favorites ? 'removed from' : 'added to';
        setSuccessMessage(`File ${action} favorites!`);
        setShowSuccessModal(true);
        
        // Refresh files to sync with backend
        await refreshFiles();
      } else {
        Alert.alert('Error', res.error || 'Failed to update favorite status');
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to update favorite status');
    }
  };

  const handleFolderPress = (folder) => {
    console.log('Opening folder:', folder.name, 'ID:', folder.id);
    
    // Update current folder ID
    setCurrentFolderId(folder.id);
    
    // Update folder path
    setFolderPath(prevPath => [...prevPath, {
      id: folder.id,
      name: folder.name
    }]);
    
    // Refresh files and folders for this folder
    refreshFiles();
  };

  const handleBreadcrumbPress = (index) => {
    if (index === 0) {
      // Go to root (All Files)
      setCurrentFolderId(null);
      setFolderPath([]);
    } else {
      // Go to specific folder in path (subtract 1 because index 0 is "All Files")
      const folderIndex = index - 1;
      const newPath = folderPath.slice(0, folderIndex + 1);
      const targetFolder = newPath[newPath.length - 1];
      setCurrentFolderId(targetFolder.id);
      setFolderPath(newPath);
    }
    
    // Refresh files and folders
    refreshFiles();
  };

  const handleFilePress = async (file) => {
    if (file.isCompressed) {
      if (file.url) {
        try {
          // Download the file to cache first
          const fileName = file.name || 'compressed_file';
          const cacheUri = FileSystem.cacheDirectory + fileName;
          const downloadRes = await FileSystem.downloadAsync(file.url, cacheUri);
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(downloadRes.uri);
          } else {
            await Linking.openURL(downloadRes.uri);
          }
        } catch (err) {
          Alert.alert('Error', 'Could not open file in external app.');
        }
      } else {
        Alert.alert('Error', 'No URL available for this file.');
      }
      return;
    }
    const extension = file.name.split('.').pop().toLowerCase();
    if (extension === 'pdf') {
      try {
        let localUri = file.url;
        if (!file.url.startsWith('file://')) {
          const fileName = file.name || 'temp.pdf';
          const downloadRes = await FileSystem.downloadAsync(file.url, FileSystem.cacheDirectory + fileName);
          localUri = downloadRes.uri;
        }
        await Sharing.shareAsync(localUri, { mimeType: 'application/pdf' });
      } catch (err) {
        Alert.alert('Error', 'Could not open PDF in device app.');
      }
      return;
    }
    // For other file types, use the in-app viewer
    // Determine the current list of files being shown
    let currentFiles = filteredFiles;
    const index = currentFiles.findIndex(f => f.id === file.id);
    navigation.navigate('FileViewer', { files: currentFiles, initialIndex: index });
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        {/* Top half gradient background up to sort bar */}
        <LinearGradient
          colors={DEEP_BLUE_GRADIENT}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 320, // Adjust this value to match the sort bar's bottom
            zIndex: 0,
          }}
        />
        {/* Header Row with All Files and Trash Icon */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, marginBottom: 10, marginHorizontal: 24 }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 28, color: '#fff', letterSpacing: 0.2 }}>Files</Text>
        </View>
        {/* Bottom half solid or faded gradient */}
        <View
          style={{
            position: 'absolute',
            top: 320, // Same as above
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#10182b', // Deep blue solid or faded gradient
            zIndex: 0,
          }}
        />
        {/* Main content, ensure zIndex: 1 so it's above gradients */}
        <View style={{ flex: 1, zIndex: 1 }}>
      {/* Spinner overlay when uploading */}
      {uploading && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.overlay }}>
          <ActivityIndicator size="large" color={theme.primary} />
          {uploadProgress > 0 && (
            <View style={styles.uploadProgressWrap}>
              <View style={[styles.uploadProgressBar, { width: `${uploadProgress}%`, backgroundColor: theme.primary }]} />
              <Text style={[styles.uploadProgressText, { color: theme.text }]}>{uploadProgress}%</Text>
            </View>
          )}
        </View>
      )}

      {/* Upload Success Animation */}
      {showUploadSuccess && (
        <View style={styles.uploadSuccessOverlay}>
          <Animated.View 
            style={[
              styles.uploadSuccessCard,
              {
                transform: [{ scale: uploadSuccessScale }]
              }
            ]}
          >
            <View style={styles.uploadSuccessIcon}>
              <Feather 
                name={uploadSuccessType === 'folder' ? 'folder-plus' : 'upload-cloud'} 
                size={32} 
                color="#10b981" 
              />
            </View>
          </Animated.View>
        </View>
      )}

        {/* Breadcrumb Navigation */}
        <View style={styles.breadcrumbWrap}>
          {getBreadcrumbs(folderPath).map((crumb, idx, arr) => (
            <View key={idx} style={styles.breadcrumbItem}>
              <TouchableOpacity disabled={idx === arr.length - 1} onPress={() => handleBreadcrumbPress(idx)}>
                <Text style={[styles.breadcrumbText, { color: theme.textSecondary }, idx === arr.length - 1 && { color: theme.text }]}>{crumb}</Text>
              </TouchableOpacity>
              {idx < arr.length - 1 && <Text style={[styles.breadcrumbSeparator, { color: theme.textSecondary }]}>/</Text>}
            </View>
          ))}
        </View>
        
        {/* Current Folder Indicator */}
        {currentFolderId && (
          <View style={styles.currentFolderIndicator}>
            <Feather name="folder" size={16} color={theme.primary} />
            <Text style={[styles.currentFolderText, { color: theme.textSecondary }]}>
              Inside: {folderPath[folderPath.length - 1]?.name || 'Folder'}
            </Text>
          </View>
        )}
        <ScrollView 
            contentContainerStyle={{ paddingBottom: 120, paddingTop: 0 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refreshFiles}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
        >
            {/* Glassy Search Bar */}
            <BlurView intensity={60} tint="dark" style={[styles.glassySearchBarWrap, { overflow: 'hidden' }]}> 
              <Feather name="search" size={20} color={theme.textSecondary} style={styles.searchIcon} />
            <TextInput
                style={[styles.glassSearchInput, { color: theme.searchText, fontFamily: 'Inter_400Regular' }]}
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
                        onMenuPress={() => handleMenuPress(item, 'file')}
                        onStarPress={() => handleStarPress(item)}
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
            {/* Category Bar - Modern, Inter font, recreated from scratch */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.segmentBarModern}
              contentContainerStyle={{ alignItems: 'center', paddingLeft: 18, paddingRight: 8 }}
            >
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.key}
                  style={{
                    borderRadius: 999,
                    borderWidth: selectedCategory === cat.key ? 0 : 0.5,
                    borderColor: selectedCategory === cat.key ? 'transparent' : '#2979FF',
                    backgroundColor: selectedCategory === cat.key ? '#fff' : 'transparent',
                    paddingVertical: 8,
                    paddingHorizontal: 22,
                    marginRight: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 60,
                  }}
                  onPress={() => setSelectedCategory(cat.key)}
                >
                  <Text
                    style={{
                      fontFamily: 'Inter_700Bold',
                      fontSize: 16,
                      color: selectedCategory === cat.key ? '#0a0f1c' : '#2979FF',
                      letterSpacing: 0.1,
                    }}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
          </ScrollView>
          {/* Sort Bar */}
          <View style={styles.sortBar}>
            <View style={{ flex: 1, height: 2, backgroundColor: theme.border, borderRadius: 1 }} />
            <TouchableOpacity style={[styles.sortIconBtn, { backgroundColor: 'rgba(41,121,255,0.08)', borderColor: theme.primary }]} onPress={() => setSortModalVisible(true)}>
              <Feather name="sliders" size={22} color={theme.primary} />
            </TouchableOpacity>
          </View>
          {/* Sort Modal - refined to match SettingsScreen confirmation modal */}
          <Modal
            visible={sortModalVisible}
            transparent
            animationType="slide"
            onRequestClose={() => setSortModalVisible(false)}
          >
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              {/* Fullscreen BlurView for background blur */}
              <BlurView intensity={120} tint="dark" style={{ ...StyleSheet.absoluteFillObject, zIndex: 1 }}>
                <View style={{ flex: 1, backgroundColor: 'rgba(10,10,20,0.55)' }} />
              </BlurView>
              {/* Glassy card, more rounded, centered, modern */}
              <BlurView intensity={90} tint="dark" style={{ backgroundColor: 'rgba(20,40,80,0.32)', borderRadius: 28, padding: 32, alignItems: 'center', width: 320, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.10)', zIndex: 2, shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 16 }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: theme.text, marginBottom: 18, textAlign: 'center' }}>Sort by</Text>
                {['type', 'date', 'size'].map(opt => (
                  <TouchableOpacity
                    key={opt}
                    style={{
                      width: '100%',
                      paddingVertical: 16,
                      borderRadius: 16,
                      marginBottom: 12,
                      alignItems: 'center',
                      backgroundColor: sortOption === opt ? theme.primary : 'rgba(255,255,255,0.08)',
                      borderWidth: sortOption === opt ? 2 : 0,
                      borderColor: sortOption === opt ? theme.primary : 'transparent',
                    }}
                    onPress={() => {
                      setSortOption(opt);
                      setSortModalVisible(false);
                    }}
                  >
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: sortOption === opt ? theme.textInverse : theme.text, textAlign: 'center' }}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={{ marginTop: 8, alignItems: 'center', width: '100%', borderRadius: 16, paddingVertical: 16, backgroundColor: 'rgba(255,255,255,0.08)' }} onPress={() => setSortModalVisible(false)}>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 17, color: theme.primary, textAlign: 'center' }}>Cancel</Text>
                </TouchableOpacity>
              </BlurView>
            </View>
          </Modal>
          {/* Enhanced Empty State - Only show when no files and no folders and not in folders tab */}
          {selectedCategory === 'all' && filteredFiles.length === 0 && folders.length === 0 && !loading && (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 64 }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: theme.text, textAlign: 'center' }}>Upload to get started</Text>
            </View>
          )}
          {/* Folders Grid - Only show in 'all' and 'folders' tabs */}
          {showFolders && (
            <>
              {loading ? (
                <View style={styles.foldersGrid}>
                  {[...Array(2)].map((_, i) => <SkeletonLoader key={i} type="folder" />)}
                </View>
              ) : (
                <View style={styles.foldersGrid}>
                  {folders.length > 0 ? (
                    folders.map(folder => (
                      <FolderItem
                        key={folder.id}
                        item={folder}
                        onPress={() => handleFolderPress(folder)}
                        onMenuPress={() => handleMenuPress(folder, 'folder')}
                        textStyle={{ fontFamily: 'Inter_400Regular' }}
                      />
                    ))
                  ) : filteredFiles.length === 0 && !loading && selectedCategory === 'folders' ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 64 }}>
                      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: theme.text, textAlign: 'center' }}>Upload folder to get started</Text>
                    </View>
                  ) : null}
                </View>
              )}
            </>
          )}
          {/* Files List */}
          {loading ? (
            <View>
              {[...Array(4)].map((_, i) => <SkeletonLoader key={i} type="file" />)}
            </View>
          ) : filteredFiles.length === 0 && selectedCategory === 'favourites' ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 64 }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: theme.text, textAlign: 'center' }}>No favourited files yet</Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 15, color: theme.textSecondary, textAlign: 'center', marginTop: 8 }}>
                Tap the star icon on any file to add it to your favourites.
              </Text>
            </View>
          ) : filteredFiles.length === 0 && selectedCategory === 'scanned' ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 64 }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: theme.text, textAlign: 'center' }}>No scanned documents yet</Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 15, color: theme.textSecondary, textAlign: 'center', marginTop: 8 }}>
                Use the scanner to add your first document.
              </Text>
            </View>
          ) : (
            filteredFiles.map((item, idx) => (
              <FileItem
                key={item.id || idx}
                item={item}
                onPress={() => handleFilePress(item)}
                onMenuPress={() => handleMenuPress(item, 'file')}
                onStarPress={() => handleStarPress(item)}
              />
            ))
          )}
        </ScrollView>
        {/* Centered File Menu Modal */}
        <Modal
          visible={menuFileId !== null}
          transparent
          animationType="fade"
          onRequestClose={closeMenu}
        >
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            {/* Overlay to close menu when clicking outside */}
            <TouchableOpacity style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2 }} activeOpacity={1} onPress={closeMenu} />
              {/* Fullscreen BlurView for background blur */}
              <BlurView intensity={120} tint="dark" style={{ ...StyleSheet.absoluteFillObject, zIndex: 1 }}>
                <View style={{ flex: 1, backgroundColor: 'rgba(10,10,20,0.55)' }} />
              </BlurView>
              {/* Glassy card, more rounded, centered, modern */}
            <BlurView intensity={90} tint="dark" style={{ backgroundColor: 'rgba(20,40,80,0.32)', borderRadius: 28, padding: 32, alignItems: 'center', width: 320, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.10)', zIndex: 3, shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 16 }}>
              {menuType === 'file' ? (
                <>
                    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 16, marginBottom: 12, width: '100%', backgroundColor: 'rgba(255,255,255,0.04)' }} onPress={() => handleMenuAction('open', selectedItem, 'file')}>
                      <Feather name="eye" size={24} color={theme.primary} />
                      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 17, color: theme.text, marginLeft: 16, textAlignVertical: 'center', textAlign: 'center' }}>Open</Text>
                  </TouchableOpacity>
                    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 16, marginBottom: 12, width: '100%', backgroundColor: 'rgba(255,255,255,0.04)' }} onPress={() => handleMenuAction('rename', selectedItem, 'file')}>
                      <Feather name="edit-3" size={24} color={theme.primary} />
                      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 17, color: theme.text, marginLeft: 16, textAlignVertical: 'center', textAlign: 'center' }}>Rename</Text>
                  </TouchableOpacity>
                    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 16, marginBottom: 12, width: '100%', backgroundColor: 'rgba(255,255,255,0.04)' }} onPress={() => handleMenuAction('download', selectedItem, 'file')}>
                      <Feather name="download" size={24} color={theme.primary} />
                      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 17, color: theme.text, marginLeft: 16, textAlignVertical: 'center', textAlign: 'center' }}>Download</Text>
                  </TouchableOpacity>
                    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 16, marginBottom: 12, width: '100%', backgroundColor: 'rgba(255,255,255,0.04)' }} onPress={() => handleMenuAction('share', selectedItem, 'file')}>
                      <Feather name="share-2" size={24} color={theme.primary} />
                      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 17, color: theme.text, marginLeft: 16, textAlignVertical: 'center', textAlign: 'center' }}>Share</Text>
                  </TouchableOpacity>
                    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 16, marginBottom: 12, width: '100%', backgroundColor: 'rgba(255,255,255,0.04)' }} onPress={() => handleMenuAction('delete', selectedItem, 'file')}>
                      <Feather name="trash" size={24} color="#ff4b5c" />
                      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 17, color: '#ff4b5c', marginLeft: 16, textAlignVertical: 'center', textAlign: 'center' }}>Delete</Text>
                  </TouchableOpacity>
                    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 16, marginBottom: 0, width: '100%', backgroundColor: 'rgba(255,255,255,0.04)' }} onPress={() => handleMenuAction('properties', selectedItem, 'file')}>
                      <Feather name="info" size={24} color={theme.primary} />
                      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 17, color: theme.text, marginLeft: 16, textAlignVertical: 'center', textAlign: 'center' }}>Properties</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 16, marginBottom: 12, width: '100%', backgroundColor: 'rgba(255,255,255,0.04)' }} onPress={() => handleMenuAction('open', selectedItem, 'folder')}>
                      <Feather name="folder-open" size={24} color={theme.primary} />
                      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 17, color: theme.text, marginLeft: 16, textAlignVertical: 'center', textAlign: 'center' }}>Open</Text>
                  </TouchableOpacity>
                    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 16, marginBottom: 12, width: '100%', backgroundColor: 'rgba(255,255,255,0.04)' }} onPress={() => handleMenuAction('rename', selectedItem, 'folder')}>
                      <Feather name="edit-3" size={24} color={theme.primary} />
                      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 17, color: theme.text, marginLeft: 16, textAlignVertical: 'center', textAlign: 'center' }}>Rename</Text>
                  </TouchableOpacity>
                    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 16, marginBottom: 0, width: '100%', backgroundColor: 'rgba(255,255,255,0.04)' }} onPress={() => handleMenuAction('delete', selectedItem, 'folder')}>
                      <Feather name="trash" size={24} color="#ff4b5c" />
                      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 17, color: '#ff4b5c', marginLeft: 16, textAlignVertical: 'center', textAlign: 'center' }}>Delete</Text>
                  </TouchableOpacity>
                </>
              )}
              </BlurView>
            </View>
        </Modal>
        {/* Plus Button and Upload Modal */}
        <TouchableOpacity
            style={[styles.plusButton, { bottom: 120 }]} // Move up from bottom: 64 to 120
          onPress={() => setShowUploadModal(true)}
          activeOpacity={0.85}
        >
          <Feather name="plus" size={28} color="#fff" />
        </TouchableOpacity>
        <Modal
          visible={showUploadModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowUploadModal(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowUploadModal(false)}>
            <BlurView intensity={120} tint="dark" style={[styles.overlay, { backgroundColor: 'rgba(0, 0, 0, 0.4)' }]} pointerEvents="box-none">
              <RadialMenu onPress={handleOptionPress} />
            </BlurView>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Rename Modal */}
        <Modal
          visible={showRenameModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowRenameModal(false)}
        >
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <BlurView intensity={120} tint="dark" style={{ ...StyleSheet.absoluteFillObject, zIndex: 1 }}>
              <View style={{ flex: 1, backgroundColor: 'rgba(10,10,20,0.55)' }} />
            </BlurView>
            <BlurView intensity={90} tint="dark" style={{ backgroundColor: 'rgba(20,40,80,0.32)', borderRadius: 28, padding: 32, alignItems: 'center', width: 340, borderWidth: 1.5, borderColor: theme.primary, zIndex: 2, shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <Feather name="edit-3" size={24} color={theme.primary} />
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: theme.text, marginLeft: 12 }}>Rename {(!renameItem?.url && !renameItem?.size && !renameItem?.type) ? 'Folder' : 'File'}</Text>
                  </View>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 16, color: theme.textSecondary, marginBottom: 20, lineHeight: 22, textAlign: 'center' }}>
                    Enter a new name for "{renameItem?.name}"
                  </Text>
                  <TextInput
                style={{ borderWidth: 1, borderColor: theme.border, borderRadius: 12, padding: 16, fontSize: 16, color: theme.text, backgroundColor: theme.inputBackground, marginBottom: 24, width: '100%', fontFamily: 'Inter_400Regular' }}
                    value={newName}
                    onChangeText={setNewName}
                    placeholder="Enter new name"
                placeholderTextColor={theme.textSecondary}
                    autoFocus={true}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, width: '100%' }}>
                    <TouchableOpacity
                  style={{ flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: theme.secondary, borderColor: theme.border, borderWidth: 1 }}
                      onPress={() => setShowRenameModal(false)}
                    >
                  <Text style={{ fontSize: 16, fontWeight: '600', color: theme.textSecondary, fontFamily: 'Inter_700Bold' }}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                  style={{ flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: theme.primary }}
                      onPress={handleRename}
                    >
                  <Text style={{ fontSize: 16, fontWeight: '600', color: theme.textInverse, fontFamily: 'Inter_700Bold' }}>Rename</Text>
                    </TouchableOpacity>
                  </View>
            </BlurView>
                </View>
        </Modal>

        {/* Create Folder Modal */}
        <Modal
          visible={showFolderModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowFolderModal(false)}
        >
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <BlurView intensity={120} tint="dark" style={{ ...StyleSheet.absoluteFillObject, zIndex: 1 }}>
              <View style={{ flex: 1, backgroundColor: 'rgba(10,10,20,0.55)' }} />
            </BlurView>
            <TouchableWithoutFeedback onPress={() => setShowFolderModal(false)}>
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2 }} />
            </TouchableWithoutFeedback>
            <BlurView intensity={90} tint="dark" style={{ backgroundColor: 'rgba(20,40,80,0.32)', borderRadius: 28, padding: 32, alignItems: 'center', width: 340, borderWidth: 1.5, borderColor: theme.primary, zIndex: 3, shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <Feather name="folder-plus" size={24} color={theme.primary} />
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: theme.text, marginLeft: 12 }}>Create New Folder</Text>
              </View>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 16, color: theme.textSecondary, marginBottom: 20, lineHeight: 22, textAlign: 'center' }}>
                Enter a name for your new folder
              </Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: theme.border, borderRadius: 12, padding: 16, fontSize: 16, color: theme.text, backgroundColor: theme.inputBackground, marginBottom: 24, width: '100%', fontFamily: 'Inter_400Regular' }}
                value={newFolderName}
                onChangeText={setNewFolderName}
                placeholder="Folder name..."
                placeholderTextColor={theme.textSecondary}
                autoFocus={true}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={50}
              />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, width: '100%' }}>
                <TouchableOpacity
                  style={{ flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: theme.secondary, borderColor: theme.border, borderWidth: 1 }}
                  onPress={() => {
                    setShowFolderModal(false);
                    setNewFolderName('');
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: '600', color: theme.textSecondary, fontFamily: 'Inter_700Bold' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: theme.primary }}
                  onPress={handleAddFolder}
                >
                  <Text style={{ fontSize: 16, fontWeight: '600', color: theme.textInverse, fontFamily: 'Inter_700Bold' }}>Create Folder</Text>
                </TouchableOpacity>
              </View>
            </BlurView>
          </View>
        </Modal>

        {/* Success Modal */}
        <Modal
          visible={showSuccessModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowSuccessModal(false)}
        >
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <BlurView intensity={120} tint="dark" style={{ ...StyleSheet.absoluteFillObject, zIndex: 1 }}>
              <View style={{ flex: 1, backgroundColor: 'rgba(10,10,20,0.55)' }} />
            </BlurView>
            <BlurView intensity={90} tint="dark" style={{ backgroundColor: 'rgba(20,40,80,0.32)', borderRadius: 28, padding: 32, alignItems: 'center', width: 320, borderWidth: 1.5, borderColor: theme.successLight, zIndex: 2, shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 16 }}>
              <View style={{ width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 20, backgroundColor: theme.successLight }}>
                    <Feather name="check-circle" size={48} color="#10b981" />
                  </View>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 24, color: theme.text, marginBottom: 8, textAlign: 'center' }}>Success!</Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 16, color: theme.textSecondary, textAlign: 'center', marginBottom: 24, lineHeight: 22 }}>{successMessage}</Text>
                  <TouchableOpacity
                style={{ paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12, minWidth: 100, alignItems: 'center', backgroundColor: '#10b981' }}
                    onPress={() => setShowSuccessModal(false)}
                  >
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: theme.textInverse }}>OK</Text>
                  </TouchableOpacity>
            </BlurView>
                </View>
        </Modal>

        {/* Properties Modal */}
        <Modal
          visible={showPropertiesModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowPropertiesModal(false)}
        >
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <BlurView intensity={120} tint="dark" style={{ ...StyleSheet.absoluteFillObject, zIndex: 1 }}>
              <View style={{ flex: 1, backgroundColor: 'rgba(10,10,20,0.55)' }} />
            </BlurView>
            <BlurView intensity={90} tint="dark" style={{ backgroundColor: 'rgba(20,40,80,0.32)', borderRadius: 28, padding: 32, alignItems: 'center', width: 340, borderWidth: 1.5, borderColor: theme.primary, zIndex: 2, shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 16 }}>
              <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 18, marginBottom: 12, textAlign: 'center', fontFamily: 'Inter_700Bold' }}>File Properties</Text>
              {propertiesItem && (
                <>
                  <Text style={{ color: theme.textSecondary, marginBottom: 4, fontFamily: 'Inter_400Regular' }}><Text style={{ fontWeight: 'bold', color: theme.text }}>Name:</Text> {propertiesItem.name}</Text>
                  <Text style={{ color: theme.textSecondary, marginBottom: 4, fontFamily: 'Inter_400Regular' }}><Text style={{ fontWeight: 'bold', color: theme.text }}>Size:</Text> {propertiesItem.size ? `${(propertiesItem.size/1024).toFixed(2)} KB` : 'Unknown'}</Text>
                  <Text style={{ color: theme.textSecondary, marginBottom: 4, fontFamily: 'Inter_400Regular' }}><Text style={{ fontWeight: 'bold', color: theme.text }}>Type:</Text> {propertiesItem.name.split('.').pop().toUpperCase()}</Text>
                  <Text style={{ color: theme.textSecondary, marginBottom: 4, fontFamily: 'Inter_400Regular' }}><Text style={{ fontWeight: 'bold', color: theme.text }}>Created:</Text> {propertiesItem.createdAt ? new Date(propertiesItem.createdAt).toLocaleString() : 'Unknown'}</Text>
                  <Text style={{ color: theme.textSecondary, marginBottom: 4, fontFamily: 'Inter_400Regular' }}><Text style={{ fontWeight: 'bold', color: theme.text }}>Updated:</Text> {propertiesItem.updatedAt ? new Date(propertiesItem.updatedAt).toLocaleString() : 'Unknown'}</Text>
                  {propertiesItem.url && <Text style={{ color: theme.textSecondary, marginBottom: 4, fontFamily: 'Inter_400Regular' }} numberOfLines={1}><Text style={{ fontWeight: 'bold', color: theme.text }}>URL:</Text> {propertiesItem.url}</Text>}
                </>
              )}
              <TouchableOpacity style={{ marginTop: 18, alignSelf: 'center', backgroundColor: theme.primary, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 32 }} onPress={() => setShowPropertiesModal(false)}>
                <Text style={{ color: theme.textInverse, fontWeight: 'bold', fontSize: 16, fontFamily: 'Inter_700Bold' }}>Close</Text>
              </TouchableOpacity>
            </BlurView>
            </View>
        </Modal>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    marginTop: 10,
    marginBottom: 8,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconBtn: {
    marginLeft: 18,
    padding: 6,
    borderRadius: 20,
  },
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    marginHorizontal: 18,
    marginBottom: 20,
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
  searchInputModern: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'System',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 18,
    marginBottom: 8,
    marginTop: 8,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    letterSpacing: 0.1,
  },
  seeAll: {
    color: '#0061FF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  fileCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    marginHorizontal: 18,
    marginBottom: 16,
    padding: 18,
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  fileThumbWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0061FF',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  fileCardName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#222',
    fontFamily: 'System',
    marginBottom: 2,
  },
  fileCardMeta: {
    fontSize: 13,
    color: '#aaa',
    fontWeight: '400',
    fontFamily: 'System',
  },
  menuButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 18,
  },
  emptyIllustration: {
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#bbb',
    fontWeight: 'bold',
    fontFamily: 'System',
    textAlign: 'center',
    marginHorizontal: 24,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createFolderModal: {
    borderRadius: 24,
    padding: 32,
    minWidth: 280,
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
    alignItems: 'stretch',
  },
  createFolderTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 14,
    fontFamily: 'System',
  },
  createFolderInput: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    fontFamily: 'System',
    color: '#222',
    backgroundColor: '#faf9f7',
  },
  categoryBar: {
    marginBottom: 18,
    marginLeft: 16,
    flexDirection: 'row',
    paddingVertical: 8,
  },
  categoryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    marginRight: 14,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryButtonSelected: {
    backgroundColor: '#0061FF',
    shadowColor: '#0061FF',
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  categoryButtonText: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'System',
    letterSpacing: 0.2,
  },
  categoryButtonTextSelected: {
    color: '#fff',
  },
  uploadIllustrationWrap: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  scrollContent: {
    paddingBottom: 60,
    paddingTop: 10,
  },
  fileMenuModal: {
    position: 'absolute',
    right: 0,
    top: 48,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    shadowColor: '#003366',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    zIndex: 99,
  },
  fileMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  fileMenuText: {
    fontSize: 16,
    color: '#222',
    fontWeight: 'bold',
  },
  fileMenuClose: {
    marginTop: 8,
    alignItems: 'center',
  },
  fileMenuCloseText: {
    color: '#0061FF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  sortBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 18,
    marginBottom: 8,
    marginTop: 2,
  },
  sortIconBtn: {
    marginLeft: 10,
    backgroundColor: '#f6f8fc',
    borderRadius: 16,
    padding: 8,
    borderWidth: 1.5,
    borderColor: '#e0e7ef',
  },
  sortModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortModalCard: {
    borderRadius: 28,
    paddingVertical: 36,
    paddingHorizontal: 32,
    minWidth: 240,
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  sortModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  sortModalDivider: {
    width: '100%',
    height: 1.5,
    marginBottom: 18,
    borderRadius: 1,
  },
  sortOptionBtn: {
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 16,
    marginBottom: 10,
    width: 160,
    alignItems: 'center',
    borderWidth: 0,
  },
  sortOptionBtnSelected: {
    borderColor: '#2563eb',
    borderWidth: 2,
    shadowColor: '#2563eb',
    shadowOpacity: 0.10,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sortOptionText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  sortOptionTextSelected: {
    color: '#2563eb',
  },
  sortModalCloseBtn: {
    marginTop: 16,
    alignItems: 'center',
  },
  sortModalCloseText: {
    fontWeight: 'bold',
    fontSize: 17,
    letterSpacing: 0.2,
  },
  plusButton: {
    position: 'absolute',
    bottom: 120,
    right: 24,
    backgroundColor: '#0061FF',
    borderRadius: 30,
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  wheel: {
    width: 260,
    height: 260,
    borderRadius: 130,
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -130,
    marginTop: -130,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
  },
  iconButton: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  foldersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 18,
    marginBottom: 12,
  },
  folderCardGrid: {
    backgroundColor: '#fff',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    marginBottom: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    shadowColor: '#003366',
    shadowOpacity: 0.22,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    minWidth: 110,
    maxWidth: 140,
  },
  folderIconImgGrid: {
    width: 40,
    height: 40,
    marginBottom: 6,
  },
  folderNameGrid: {
    fontSize: 15,
    color: '#222',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  breadcrumbWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 8,
  },
  breadcrumbItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breadcrumbText: {
    color: '#888',
    fontSize: 15,
    fontWeight: '500',
    marginRight: 2,
  },
  breadcrumbTextActive: {
    color: '#2563eb',
    fontWeight: 'bold',
  },
  breadcrumbSeparator: {
    color: '#bbb',
    marginHorizontal: 2,
    fontSize: 15,
  },
  skeletonFile: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginHorizontal: 12,
    marginVertical: 4,
    padding: 12,
  },
  skeletonFolder: {
    alignItems: 'center',
    borderRadius: 12,
    margin: 8,
    padding: 12,
    width: 110,
  },
  skeletonIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
  },
  skeletonTextBlock: {
    height: 14,
    borderRadius: 6,
    flex: 1,
    marginBottom: 6,
  },
  skeletonTextBlockSmall: {
    height: 10,
    width: 60,
    borderRadius: 5,
    marginTop: 2,
  },
  uploadProgressWrap: {
    width: 220,
    height: 18,
    backgroundColor: '#e0e7ef',
    borderRadius: 9,
    marginTop: 18,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  uploadProgressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#2563eb',
    borderRadius: 9,
    height: 18,
    zIndex: 1,
  },
  uploadProgressText: {
    color: '#2563eb',
    fontWeight: 'bold',
    fontSize: 13,
    textAlign: 'center',
    zIndex: 2,
  },
  centeredMenuCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  centeredMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    width: '100%',
    justifyContent: 'center',
  },
  centeredMenuText: {
    fontSize: 16,
    color: '#222',
    fontWeight: '600',
    marginLeft: 12,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    marginLeft: 12,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    lineHeight: 22,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e0e7ef',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#222',
    backgroundColor: '#f8fafc',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#f1f5f9',
  },
  modalButtonConfirm: {
    backgroundColor: '#2563eb',
  },
  modalButtonCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  modalButtonConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  // Success Modal Styles
  successModalContent: {
    borderRadius: 24,
    padding: 32,
    width: '85%',
    maxWidth: 300,
    alignItems: 'center',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  successButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  successButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Current Folder Indicator Styles
  currentFolderIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#0061FF',
  },
  currentFolderText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0061FF',
    marginLeft: 8,
  },
  // Upload Success Animation Styles
  uploadSuccessOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  uploadSuccessCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  uploadSuccessIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  uploadSuccessText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10b981',
    textAlign: 'center',
  },
  // Enhanced Empty State Styles
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 20,
  },
  emptyStateIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  emptyStateButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Empty State Styles (Legacy - keeping for compatibility)
  emptyFolderState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyFileState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  glassSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    marginHorizontal: 18,
    marginBottom: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: 'transparent', // fully transparent
    borderWidth: 0, // remove border
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  glassSearchInput: {
    flex: 1,
    backgroundColor: 'transparent', // fully transparent
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 17,
    fontWeight: '500',
    color: '#fff',
    fontFamily: 'Inter',
    borderWidth: 0, // remove border
    shadowOpacity: 0, // remove shadow
  },
  searchIcon: {
    marginRight: 10,
  },
  searchRefreshBtn: {
    padding: 8,
    marginLeft: 4,
    borderRadius: 16,
    backgroundColor: 'rgba(41,121,255,0.08)',
  },
  categoryBar: {
    marginBottom: 18,
    marginLeft: 16,
    flexDirection: 'row',
    paddingVertical: 8,
  },
  categoryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    marginRight: 14,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryButtonSelected: {
    backgroundColor: '#0061FF',
    shadowColor: '#0061FF',
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  categoryButtonText: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'System',
    letterSpacing: 0.2,
  },
  categoryButtonTextSelected: {
    color: '#fff',
  },
  segmentBarModern: {
    flexDirection: 'row',
    paddingVertical: 0,
    marginHorizontal: 0,
    marginBottom: 18,
    backgroundColor: 'transparent',
  },
  segmentModernButton: {
    paddingVertical: 8,
    paddingHorizontal: 22,
    borderRadius: 18,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
    borderWidth: 0,
  },
  segmentModernButtonSelected: {
    backgroundColor: '#fff',
  },
  segmentModernButtonUnselected: {
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  segmentModernText: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  segmentModernTextSelected: {
    color: '#1a2340',
    fontWeight: '700',
    fontFamily: 'Inter',
  },
  segmentModernTextUnselected: {
    color: '#e0e6f3',
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  emptyGlassCard: {
    alignItems: 'center',
    borderRadius: 28,
    padding: 32,
    marginHorizontal: 24,
    marginVertical: 32,
    backgroundColor: 'rgba(20,40,80,0.32)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.10)',
    shadowOpacity: 0.10,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  emptyGlassIconWrap: {
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 18,
    padding: 18,
  },
  emptyGlassTitle: {
    fontFamily: 'Inter',
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyGlassSubtitle: {
    fontFamily: 'Inter',
    fontSize: 15,
    color: '#e0e6f3',
    marginBottom: 18,
    textAlign: 'center',
  },
  emptyGlassButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 22,
    marginTop: 8,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  emptyGlassButtonText: {
    fontFamily: 'Inter',
    fontWeight: '700',
    color: '#2979FF',
    fontSize: 16,
  },
  glassModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(10,16,32,0.32)',
  },
  glassModalCard: {
    borderRadius: 28,
    paddingVertical: 36,
    paddingHorizontal: 32,
    minWidth: 260,
    backgroundColor: 'rgba(20,40,80,0.32)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    shadowOpacity: 0.10,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  glassModalTitle: {
    fontFamily: 'Inter',
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  glassModalDivider: {
    width: '100%',
    height: 1.5,
    marginBottom: 18,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  glassModalOptionBtn: {
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 16,
    marginBottom: 10,
    width: 160,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  glassModalOptionBtnSelected: {
    backgroundColor: '#2979FF',
  },
  glassModalOptionText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    color: '#e0e6f3',
  },
  glassModalOptionTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  glassModalCloseBtn: {
    marginTop: 16,
    alignItems: 'center',
  },
  glassModalCloseText: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 17,
    color: '#2979FF',
    letterSpacing: 0.2,
  },
  glassMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 16,
    marginBottom: 2,
    width: 180,
    justifyContent: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  glassMenuText: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 14,
  },
  fullModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  fullModalBlur: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  fullModalDarkOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10,10,20,0.55)',
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  solidModalCard: {
    borderRadius: 28,
    paddingVertical: 36,
    paddingHorizontal: 32,
    minWidth: 260,
    backgroundColor: 'rgba(20,40,80,0.32)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    elevation: 12,
  },
  glassMenuCard: {
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 0,
    minWidth: 220,
    backgroundColor: 'rgba(20,40,80,0.32)',
    borderWidth: 1.2,
    borderColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    elevation: 8,
  },
  glassMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 18,
    marginBottom: 2,
    width: 220,
    justifyContent: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  glassMenuText: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 14,
  },
  settingsMenuCard: {
    borderRadius: 28,
    paddingVertical: 24,
    paddingHorizontal: 0,
    minWidth: 260,
    backgroundColor: 'rgba(20,40,80,0.32)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    elevation: 12,
  },
  settingsMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 18,
    marginBottom: 2,
    width: 240,
    justifyContent: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  settingsMenuText: {
    fontFamily: 'Inter',
    fontSize: 17,
    color: '#fff',
    fontWeight: '700',
    marginLeft: 18,
  },
  segmentTab: {
    paddingVertical: 8,
    paddingHorizontal: 22,
    borderRadius: 18,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
    borderWidth: 0,
  },
  segmentTabSelected: {
    borderBottomWidth: 2,
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
}); 