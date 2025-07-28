import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Modal, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { listFiles, compressFile, extractFile, deleteFile } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Feather from 'react-native-vector-icons/Feather';
import FileItem from './FileItem';
import { useTheme } from '../theme/ThemeContext';
import { useNavigation } from '@react-navigation/native';

import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

// Helper to upload compressed file to Cloudinary and register with backend
async function uploadCompressedToCloudinaryAndRegister(token, compressedFile, folderId) {
  const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/ds5gugfv0/raw/upload';
  const UPLOAD_PRESET = 'EXPO_UPLOAD';
  const API_BASE_URL = 'http://10.162.93.13:8080/api'; // Use your actual API base URL

  // 1. Download compressed file from backend
  const downloadUrl = `${API_BASE_URL}/files/${compressedFile.id}/download`;
  const localUri = FileSystem.cacheDirectory + compressedFile.name;
  const downloadRes = await FileSystem.downloadAsync(downloadUrl, localUri, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  // 2. Upload to Cloudinary
  const formData = new FormData();
  formData.append('file', {
    uri: downloadRes.uri,
    type: compressedFile.format || 'application/octet-stream',
    name: compressedFile.name,
  });
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('resource_type', 'raw');
  const cloudinaryRes = await fetch(CLOUDINARY_URL, { method: 'POST', body: formData });
  const cloudinaryData = await cloudinaryRes.json();
  if (!cloudinaryData.secure_url) throw new Error('Cloudinary upload failed');

  // 3. Register with backend
  const registerData = {
    name: compressedFile.name,
    url: cloudinaryData.secure_url,
    type: compressedFile.format || 'application/octet-stream',
    size: cloudinaryData.bytes || compressedFile.compressedSize || 0,
    folderId: folderId,
  };
  const registerRes = await fetch(`${API_BASE_URL}/files/register`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(registerData),
  });
  return registerRes.ok;
}

export default function CompressionScreen() {
  const { theme, constants } = useTheme();
  const [files, setFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [compressionSettings, setCompressionSettings] = useState({
    quality: 'medium', // for images/videos
    format: 'jpeg',    // for images, or 'mp4' for videos, or 'zip' for others
    bitrate: 'medium', // for videos
    archiveFormat: 'zip', // for others
  });
  const [compressing, setCompressing] = useState(false);
  const [compressionResults, setCompressionResults] = useState([]);
  const navigation = useNavigation();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Constants moved to theme system

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const token = await AsyncStorage.getItem('jwt');
      if (!token) return;

      const res = await listFiles(token);
      if (res.success) {
        setFiles(res.data);
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

  const toggleFileSelection = (fileId) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleStarPress = async (item) => {
    // This would handle favoriting files
    console.log('Star pressed for:', item.name);
  };

  const handleMenuPress = (item) => {
    // This would show individual file menu
    console.log('Menu pressed for:', item.name);
  };

  // Helper to check if a file is image or video
  const isImageOrVideo = (file) => {
    if (!file || !file.name) return false;
    const ext = file.name.split('.').pop().toLowerCase();
    return [
      'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', // images
      'mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv' // videos
    ].includes(ext);
  };

  // Helper to check file type
  const getFileType = (file) => {
    if (!file || !file.name) return 'other';
    const ext = file.name.split('.').pop().toLowerCase();
    if ([ 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp' ].includes(ext)) return 'image';
    if ([ 'mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv' ].includes(ext)) return 'video';
    return 'other';
  };

  // Filtering for compressed files: only show files with '_compressed' in the name
  const compressedFiles = files.filter(f => f.name && f.name.includes('_compressed'));
  // Filtering for non-compressed files: only show files without '_compressed' in the name
  const nonCompressedFiles = files.filter(f => !f.name || !f.name.includes('_compressed'));

  // Determine selected file types
  const selectedFileObjs = files.filter(f => selectedFiles.includes(f.id));
  const selectedTypes = Array.from(new Set(selectedFileObjs.map(getFileType)));
  const isMixed = selectedTypes.length > 1;
  const onlyImages = selectedTypes.length === 1 && selectedTypes[0] === 'image';
  const onlyVideos = selectedTypes.length === 1 && selectedTypes[0] === 'video';
  const onlyOthers = selectedTypes.length === 1 && selectedTypes[0] === 'other';

  // Compression options UI
  const renderCompressionOptions = () => {
    if (isMixed) {
      // Only allow archiving for mixed types
      return (
        <View style={styles.settingGroup}>
          <Text style={[styles.settingLabel, { color: theme.text }]}>Archive Format</Text>
          <View style={styles.settingOptions}>
            {['zip', 'rar', '7z'].map(fmt => (
              <TouchableOpacity
                key={fmt}
                style={[styles.settingOption, compressionSettings.archiveFormat === fmt && [styles.settingOptionSelected, { borderColor: theme.primary, backgroundColor: theme.primaryLight }]]}
                onPress={() => setCompressionSettings(s => ({ ...s, archiveFormat: fmt }))}
              >
                <Text style={[styles.settingOptionText, compressionSettings.archiveFormat === fmt && [styles.settingOptionTextSelected, { color: theme.primary }]]}>{fmt.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    }
    if (onlyImages) {
      return (
        <>
          <View style={styles.settingGroup}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>Image Quality</Text>
            <View style={styles.settingOptions}>
              {['low', 'medium', 'high'].map(q => (
                <TouchableOpacity
                  key={q}
                  style={[
                    {
                      borderRadius: 13,
                      paddingVertical: 7,
                      paddingHorizontal: 12,
                      marginHorizontal: 3,
                      marginBottom: 2,
                      backgroundColor: compressionSettings.quality === q ? constants.accent : 'rgba(255,255,255,0.10)',
                      borderWidth: 1.2,
                      borderColor: compressionSettings.quality === q ? '#fff' : 'rgba(255,255,255,0.18)',
                      shadowColor: compressionSettings.quality === q ? '#2979FF' : 'transparent',
                      shadowOpacity: compressionSettings.quality === q ? 0.10 : 0,
                      shadowRadius: compressionSettings.quality === q ? 3 : 0,
                      shadowOffset: { width: 0, height: 1 },
                      elevation: compressionSettings.quality === q ? 1 : 0,
                      alignItems: 'center',
                      justifyContent: 'center',
                    },
                  ]}
                  onPress={() => setCompressionSettings(s => ({ ...s, quality: q }))}
                >
                  <Text style={{ color: '#fff', fontFamily: compressionSettings.quality === q ? 'Inter_700Bold' : 'Inter_400Regular', fontSize: 13.5, letterSpacing: 0.08 }}>{q.charAt(0).toUpperCase() + q.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.settingGroup}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>Format</Text>
            <View style={styles.settingOptions}>
              {['jpeg', 'png', 'webp'].map(fmt => (
                <TouchableOpacity
                  key={fmt}
                  style={[
                    {
                      borderRadius: 13,
                      paddingVertical: 7,
                      paddingHorizontal: 12,
                      marginHorizontal: 3,
                      marginBottom: 2,
                      backgroundColor: compressionSettings.format === fmt ? constants.accent : 'rgba(255,255,255,0.10)',
                      borderWidth: 1.2,
                      borderColor: compressionSettings.format === fmt ? '#fff' : 'rgba(255,255,255,0.18)',
                      shadowColor: compressionSettings.format === fmt ? '#2979FF' : 'transparent',
                      shadowOpacity: compressionSettings.format === fmt ? 0.10 : 0,
                      shadowRadius: compressionSettings.format === fmt ? 3 : 0,
                      shadowOffset: { width: 0, height: 1 },
                      elevation: compressionSettings.format === fmt ? 1 : 0,
                      alignItems: 'center',
                      justifyContent: 'center',
                    },
                  ]}
                  onPress={() => setCompressionSettings(s => ({ ...s, format: fmt }))}
                >
                  <Text style={{ color: '#fff', fontFamily: compressionSettings.format === fmt ? 'Inter_700Bold' : 'Inter_400Regular', fontSize: 13.5, letterSpacing: 0.08 }}>{fmt.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </>
      );
    }
    if (onlyVideos) {
      return (
        <>
          <View style={styles.settingGroup}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>Video Quality</Text>
            <View style={styles.settingOptions}>
              {['low', 'medium', 'high'].map(q => (
                <TouchableOpacity
                  key={q}
                  style={[styles.settingOption, compressionSettings.quality === q && [styles.settingOptionSelected, { borderColor: theme.primary, backgroundColor: theme.primaryLight }]]}
                  onPress={() => setCompressionSettings(s => ({ ...s, quality: q }))}
                >
                  <Text style={[styles.settingOptionText, compressionSettings.quality === q && [styles.settingOptionTextSelected, { color: theme.primary }]]}>{q.charAt(0).toUpperCase() + q.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.settingGroup}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>Format</Text>
            <View style={styles.settingOptions}>
              {['mp4', 'webm'].map(fmt => (
                <TouchableOpacity
                  key={fmt}
                  style={[styles.settingOption, compressionSettings.format === fmt && [styles.settingOptionSelected, { borderColor: theme.primary, backgroundColor: theme.primaryLight }]]}
                  onPress={() => setCompressionSettings(s => ({ ...s, format: fmt }))}
                >
                  <Text style={[styles.settingOptionText, compressionSettings.format === fmt && [styles.settingOptionTextSelected, { color: theme.primary }]]}>{fmt.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </>
      );
    }
    if (onlyOthers) {
      return (
        <View style={styles.settingGroup}>
          <Text style={[styles.settingLabel, { color: theme.text }]}>Archive Format</Text>
          <View style={styles.settingOptions}>
            {['zip', 'rar', '7z'].map(fmt => (
              <TouchableOpacity
                key={fmt}
                style={[styles.settingOption, compressionSettings.archiveFormat === fmt && [styles.settingOptionSelected, { borderColor: theme.primary, backgroundColor: theme.primaryLight }]]}
                onPress={() => setCompressionSettings(s => ({ ...s, archiveFormat: fmt }))}
              >
                <Text style={[styles.settingOptionText, compressionSettings.archiveFormat === fmt && [styles.settingOptionTextSelected, { color: theme.primary }]]}>{fmt.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    }
    return null;
  };

  // Handle compress action
  const handleCompress = async () => {
    setCompressing(true);
    setCompressionResults([]);
    const token = await AsyncStorage.getItem('jwt');
    const results = [];
    let anySuccess = false;
    const qualityMap = { low: 0.3, medium: 0.6, high: 0.9 };
    for (const file of selectedFileObjs) {
      let dto = {};
      const type = getFileType(file);
      if (type === 'image') {
        dto = { type: 'image', quality: qualityMap[compressionSettings.quality], format: compressionSettings.format };
      } else if (type === 'video') {
        dto = { type: 'video', bitrate: 1000, format: compressionSettings.format };
      } else {
        dto = { type: 'archive', format: compressionSettings.archiveFormat };
      }
      try {
        const res = await compressFile(token, file.id, dto);
        results.push({ file, success: res.success, error: res.error });
        if (res.success && res.data) {
          anySuccess = true;
          // Delete the original file after successful compression
          await deleteFile(token, file.id);
        }
      } catch (err) {
        results.push({ file, success: false, error: err.message });
        // Do not show any Alert or error to the user
      }
    }
    console.log('Compression results:', results);
    setCompressionResults(results);
    setCompressing(false);
    setShowOptionsModal(false);
    await fetchFiles();
    if (anySuccess) {
      setSuccessMessage('File(s) compressed and uploaded!');
      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
        if (navigation.canGoBack()) {
          navigation.goBack();
        }
      }, 1500);
    } else {
      // setErrorMessage('Compression failed for all selected files.');
      // setShowErrorModal(true);
      // Do not show any error modal if all fail
    }
  };

  // --- Analytics/Stats ---
  // Calculate stats
  const totalFiles = files.length;
  const compressedFilesCount = compressedFiles.length;
  const totalSize = files.reduce((sum, f) => sum + (f.size || 0), 0);
  const compressedSize = compressedFiles.reduce((sum, f) => sum + (f.size || 0), 0);
  const estimatedOriginalSize = compressedFilesCount > 0 ? compressedSize * 1.5 : 0; // crude estimate
  const spaceSaved = estimatedOriginalSize > 0 ? estimatedOriginalSize - compressedSize : 0;

  // Format bytes
  function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading files...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Bold, Inter_700Bold description */}
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: constants.primaryText, marginBottom: 18, textAlign: 'center' }}>
          Compress files to save space and upload faster.
        </Text>

        {/* Enhanced Storage Analytics */}
        <View style={{
          backgroundColor: constants.glassBg,
          borderRadius: 24,
          borderWidth: 1,
          borderColor: constants.glassBorder,
          padding: 20,
          marginBottom: 20,
          shadowColor: '#000',
          shadowOpacity: 0.1,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 4
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
            <View style={{
              backgroundColor: constants.accent + '20',
              borderRadius: 12,
              padding: 10,
              marginRight: 12,
            }}>
              <Feather name="bar-chart-2" size={24} color={constants.accent} />
            </View>
            <Text style={{
              fontFamily: 'Inter_700Bold',
              fontSize: 20,
              color: constants.primaryText,
              letterSpacing: -0.3
            }}>
              Storage Analytics
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
            <View style={{
              flex: 1,
              backgroundColor: constants.glassBg,
              borderRadius: 16,
              padding: 16,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: constants.glassBorder
            }}>
              <View style={{
                backgroundColor: '#3b82f6' + '20',
                borderRadius: 10,
                padding: 8,
                marginBottom: 8,
              }}>
                <Feather name="file" size={20} color="#3b82f6" />
              </View>
              <Text style={{
                fontFamily: 'Inter_700Bold',
                fontSize: 18,
                color: constants.primaryText,
                marginBottom: 4
              }}>
                {totalFiles}
              </Text>
              <Text style={{
                fontFamily: 'Inter_400Regular',
                fontSize: 12,
                color: constants.secondaryText,
                textAlign: 'center'
              }}>
                Total Files
              </Text>
            </View>

            <View style={{
              flex: 1,
              backgroundColor: constants.glassBg,
              borderRadius: 16,
              padding: 16,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: constants.glassBorder
            }}>
              <View style={{
                backgroundColor: '#22c55e' + '20',
                borderRadius: 10,
                padding: 8,
                marginBottom: 8,
              }}>
                <Feather name="archive" size={20} color="#22c55e" />
              </View>
              <Text style={{
                fontFamily: 'Inter_700Bold',
                fontSize: 18,
                color: constants.primaryText,
                marginBottom: 4
              }}>
                {compressedFilesCount}
              </Text>
              <Text style={{
                fontFamily: 'Inter_400Regular',
                fontSize: 12,
                color: constants.secondaryText,
                textAlign: 'center'
              }}>
                Compressed
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{
              flex: 1,
              backgroundColor: constants.glassBg,
              borderRadius: 16,
              padding: 16,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: constants.glassBorder
            }}>
              <View style={{
                backgroundColor: '#a21caf' + '20',
                borderRadius: 10,
                padding: 8,
                marginBottom: 8,
              }}>
                <Feather name="database" size={20} color="#a21caf" />
              </View>
              <Text style={{
                fontFamily: 'Inter_700Bold',
                fontSize: 18,
                color: constants.primaryText,
                marginBottom: 4
              }}>
                {formatBytes(totalSize)}
              </Text>
              <Text style={{
                fontFamily: 'Inter_400Regular',
                fontSize: 12,
                color: constants.secondaryText,
                textAlign: 'center'
              }}>
                Total Storage
              </Text>
            </View>

            <View style={{
              flex: 1,
              backgroundColor: constants.glassBg,
              borderRadius: 16,
              padding: 16,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: constants.glassBorder
            }}>
              <View style={{
                backgroundColor: '#f59e42' + '20',
                borderRadius: 10,
                padding: 8,
                marginBottom: 8,
              }}>
                <Feather name="trending-down" size={20} color="#f59e42" />
              </View>
              <Text style={{
                fontFamily: 'Inter_700Bold',
                fontSize: 18,
                color: constants.primaryText,
                marginBottom: 4
              }}>
                {formatBytes(spaceSaved)}
              </Text>
              <Text style={{
                fontFamily: 'Inter_400Regular',
                fontSize: 12,
                color: constants.secondaryText,
                textAlign: 'center'
              }}>
                Space Saved
              </Text>
            </View>
          </View>
        </View>
        {/* Files List with Section Headers */}
        <View style={{ marginBottom: 20 }}>
          {/* Compressed Files Section Header */}
          {compressedFiles.length > 0 && (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 12,
              marginBottom: 8
            }}>
              <View style={{
                backgroundColor: '#22c55e' + '20',
                borderRadius: 8,
                padding: 6,
                marginRight: 10,
              }}>
                <Feather name="archive" size={16} color="#22c55e" />
              </View>
              <Text style={{
                fontFamily: 'Inter_700Bold',
                fontSize: 16,
                color: constants.primaryText,
                letterSpacing: -0.2
              }}>
                Compressed Files ({compressedFiles.length})
              </Text>
            </View>
          )}

          {/* Compressed Files List */}
          {compressedFiles.map((file, index) => (
            <View key={`compressed-${file.id || index}`} style={{ marginBottom: 6 }}>
              <FileItem
                item={file}
                onPress={() => {}}
                hideActions={true}
                showCompressedBadge={true}
              />
            </View>
          ))}

          {/* Section Divider */}
          {compressedFiles.length > 0 && nonCompressedFiles.length > 0 && (
            <View style={{
              height: 1,
              backgroundColor: constants.glassBorder,
              marginHorizontal: 16,
              marginVertical: 16,
              opacity: 0.5
            }} />
          )}

          {/* All Files Section Header */}
          {nonCompressedFiles.length > 0 && (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 12,
              marginBottom: 8
            }}>
              <View style={{
                backgroundColor: constants.accent + '20',
                borderRadius: 8,
                padding: 6,
                marginRight: 10,
              }}>
                <Feather name="file" size={16} color={constants.accent} />
              </View>
              <Text style={{
                fontFamily: 'Inter_700Bold',
                fontSize: 16,
                color: constants.primaryText,
                letterSpacing: -0.2
              }}>
                All Files ({nonCompressedFiles.length})
              </Text>
            </View>
          )}

          {/* All Files List */}
          {nonCompressedFiles.map((file, index) => (
            <TouchableOpacity
              key={`uncompressed-${file.id || index}`}
              style={{ marginBottom: 6 }}
              onPress={() => toggleFileSelection(file.id)}
              onLongPress={() => { setShowOptionsModal(true); }}
              activeOpacity={0.8}
            >
              <View style={{ position: 'relative' }}>
                <FileItem
                  item={file}
                  onPress={() => toggleFileSelection(file.id)}
                  hideActions={true}
                />
                {/* Selection Indicator */}
                {selectedFiles.includes(file.id) && (
                  <View style={{
                    position: 'absolute',
                    top: 8,
                    right: 20,
                    backgroundColor: constants.accent,
                    borderRadius: 10,
                    padding: 5,
                  }}>
                    <Feather name="check" size={14} color={constants.primaryText} />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}

          {/* Empty State */}
          {compressedFiles.length === 0 && nonCompressedFiles.length === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: 60 }}>
              <View style={{
                backgroundColor: constants.glassBg,
                borderRadius: 20,
                padding: 20,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: constants.glassBorder,
              }}>
                <Feather name="file" size={48} color={constants.secondaryText} />
              </View>
              <Text style={{
                fontFamily: 'Inter_400Regular',
                fontSize: 16,
                color: constants.secondaryText,
                textAlign: 'center'
              }}>
                No files available
              </Text>
            </View>
          )}

          {/* Compress Button */}
          {nonCompressedFiles.length > 0 && (
            <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
              <TouchableOpacity
                style={{
                  backgroundColor: constants.accent,
                  borderRadius: 16,
                  paddingVertical: 16,
                  paddingHorizontal: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#000',
                  shadowOpacity: 0.15,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 6,
                  opacity: selectedFiles.length === 0 ? 0.5 : 1,
                }}
                onPress={() => setShowOptionsModal(true)}
                disabled={compressing || selectedFiles.length === 0}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Feather name="archive" size={20} color={constants.primaryText} style={{ marginRight: 10 }} />
                  <Text style={{
                    color: constants.primaryText,
                    fontFamily: 'Inter_700Bold',
                    fontSize: 16,
                    letterSpacing: -0.2
                  }}>
                    {selectedFiles.length === 0
                      ? 'Select Files to Compress'
                      : `Compress ${selectedFiles.length} File${selectedFiles.length !== 1 ? 's' : ''}`
                    }
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
      {/* Modals and overlays remain outside the ScrollView */}
      <Modal
        visible={showSuccessModal || showErrorModal}
        transparent
        animationType="fade"
        onRequestClose={() => { setShowSuccessModal(false); setShowErrorModal(false); }}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.8)' }}>
          <View style={{ backgroundColor: '#000000', borderRadius: 16, padding: 24, alignItems: 'center', width: 320, borderWidth: 1, borderColor: '#333333', shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 20 }}>
            <Feather name={showSuccessModal ? 'check-circle' : 'alert-circle'} size={48} color={showSuccessModal ? '#1D9BF0' : '#F4212E'} style={{ marginBottom: 18 }} />
            <Text style={{ fontSize: 18, fontFamily: 'Inter_700Bold', color: '#FFFFFF', marginBottom: 16, textAlign: 'center' }}>{showSuccessModal ? successMessage : errorMessage}</Text>
            <TouchableOpacity style={{ backgroundColor: '#1D9BF0', borderRadius: 20, paddingVertical: 12, paddingHorizontal: 24, alignItems: 'center', width: '100%' }} onPress={() => { setShowSuccessModal(false); setShowErrorModal(false); }} activeOpacity={0.8}>
              <Text style={{ color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 15 }}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Compression Options Modal */}
      {showOptionsModal && (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={() => setShowOptionsModal(false)}
        >
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.8)' }}>
            {/* Twitter X Style Modal Card */}
            <View style={{
              backgroundColor: '#000000',
              borderRadius: 16,
              padding: 24,
              alignItems: 'center',
              width: '90%',
              maxWidth: 400,
              borderWidth: 1,
              borderColor: '#333333',
              shadowColor: '#000',
              shadowOpacity: 0.5,
              shadowRadius: 20,
              shadowOffset: { width: 0, height: 10 },
              elevation: 20
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <Feather name="settings" size={24} color="#1D9BF0" />
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: '#FFFFFF', marginLeft: 12 }}>Compression Options</Text>
              </View>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: '#8B98A5', marginBottom: 24, lineHeight: 20, textAlign: 'center' }}>Choose compression settings for selected file(s).</Text>
              {/* Refined options UI */}
              <View style={{ width: '100%', marginBottom: 18 }}>{renderCompressionOptions()}</View>
              <View style={{ flexDirection: 'row', justifyContent: 'center', width: '100%', gap: 12 }}>
                <TouchableOpacity
                  style={{ backgroundColor: 'transparent', borderRadius: 20, paddingVertical: 12, paddingHorizontal: 24, flex: 1, alignItems: 'center', borderWidth: 1, borderColor: '#333333' }}
                  onPress={() => setShowOptionsModal(false)}
                  disabled={compressing}
                  activeOpacity={0.8}
                >
                  <Text style={{ color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 15 }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ backgroundColor: '#1D9BF0', borderRadius: 20, paddingVertical: 12, paddingHorizontal: 24, flex: 1, alignItems: 'center' }}
                  onPress={handleCompress}
                  disabled={compressing}
                  activeOpacity={0.8}
                >
                  {compressing ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={{ color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 15 }}>Compress</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  statsContainer: {
    margin: 12,
    borderRadius: 14,
    padding: 10,
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    // backgroundColor: '#fff', // use theme.card in render
  },
  statsTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    minWidth: 60,
    alignItems: 'center',
    padding: 8,
    borderRadius: 10,
    // backgroundColor: '#f8fafc', // use theme.secondaryLight in render
    marginHorizontal: 2,
    marginBottom: 6,
    shadowOpacity: 0.04,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2,
    // color: '#222', // use theme.text in render
  },
  statLabel: {
    fontSize: 10,
    marginTop: 1,
    // color: '#666', // use theme.textSecondary in render
  },
  statsDivider: {
    height: 1,
    // backgroundColor: '#e5e7eb', // use theme.border in render
    marginVertical: 6,
    borderRadius: 1,
    opacity: 0.5,
  },
  section: {
    margin: 16,
    marginTop: 0,
    borderRadius: 16,
    padding: 20,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  batchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  batchButtonActive: {
    // backgroundColor applied dynamically
  },
  batchButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  fileItem: {
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  fileItemSelected: {
    // borderColor and backgroundColor applied dynamically
  },
  fileItemContent: {
    position: 'relative',
  },
  selectionIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 10,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
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
    marginLeft: 12,
  },
  modalSubtitle: {
    fontSize: 16,
    marginBottom: 20,
    lineHeight: 22,
  },
  settingGroup: {
    marginBottom: 20,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  settingOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  settingOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  settingOptionSelected: {
    // backgroundColor and borderColor applied dynamically
  },
  settingOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  settingOptionTextSelected: {
    // color applied dynamically
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    // backgroundColor applied dynamically
  },
  modalButtonConfirm: {
    // backgroundColor applied dynamically
  },
  modalButtonCancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonConfirmText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
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
  featureBannerTextOverlayDropbox: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 18,
    backgroundColor: 'transparent',
    alignItems: 'flex-start',
  },
  featureBannerTitleDropbox: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'left',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
}); 