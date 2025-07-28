import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  Modal,
  Dimensions,
  ActivityIndicator,
  TextInput,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import * as DocumentPicker from 'expo-document-picker';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import Feather from 'react-native-vector-icons/Feather';
import { uploadScannedDocument } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';
import { Text as RNText, TextInput as RNTextInput } from 'react-native';

// Set Inter font as default for all Text and TextInput
RNText.defaultProps = RNText.defaultProps || {};
RNText.defaultProps.style = [{ fontFamily: 'Inter' }];
RNTextInput.defaultProps = RNTextInput.defaultProps || {};
RNTextInput.defaultProps.style = [{ fontFamily: 'Inter' }];

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function DocumentScannerScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [hasPermission, setHasPermission] = useState(null);
  const [capturedImages, setCapturedImages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [documentName, setDocumentName] = useState('');
  const [quality, setQuality] = useState('high'); // draft, normal, high
  const [showNameModal, setShowNameModal] = useState(false);
  const [tempDocumentName, setTempDocumentName] = useState('');
  const [lastGeneratedPdf, setLastGeneratedPdf] = useState(null);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [currentPdfUri, setCurrentPdfUri] = useState(null);

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted' && cameraStatus.status === 'granted');
    })();
  }, []);

  const takePicture = async () => {
    // Use ImagePicker by default to avoid camera type issues
    await takePictureWithImagePicker();
  };

  const takePictureWithImagePicker = async () => {
    try {
      setIsProcessing(true);
      
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const photo = result.assets[0];
        console.log('Photo captured:', photo);
        
        // Process the image for document scanning
        const processedImage = await processDocumentImage(photo.uri);
        
        setCapturedImages(prev => [...prev, {
          uri: processedImage.uri,
          originalUri: photo.uri,
          timestamp: new Date().toISOString(),
        }]);
        
        console.log('Image added to captured images');
      } else {
        console.log('Camera capture was canceled');
      }
      
      setIsProcessing(false);
    } catch (error) {
      console.error('Error taking picture:', error);
      setIsProcessing(false);
      Alert.alert('Error', 'Failed to capture image: ' + error.message);
    }
  };

  const pickFromGallery = async () => {
    try {
      setIsProcessing(true);
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const photo = result.assets[0];
        console.log('Photo selected from gallery:', photo);
        
        // Process the image for document scanning
        const processedImage = await processDocumentImage(photo.uri);
        
        setCapturedImages(prev => [...prev, {
          uri: processedImage.uri,
          originalUri: photo.uri,
          timestamp: new Date().toISOString(),
        }]);
        
        console.log('Image added to captured images');
        
        // Auto-generate PDF if we have images
        const updatedImages = [...capturedImages, {
          uri: processedImage.uri,
          originalUri: photo.uri,
          timestamp: new Date().toISOString(),
        }];
        
        if (updatedImages.length > 0) {
          // Prompt for document name and save options
          Alert.prompt(
            'Document Name',
            'Enter a name for your document:',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Save to Cloud', 
                onPress: (documentName) => {
                  if (documentName && documentName.trim()) {
                    setDocumentName(documentName.trim());
                    saveToCloudWithName(documentName.trim(), updatedImages);
                  }
                }
              },
              { 
                text: 'Save to Device', 
                onPress: (documentName) => {
                  if (documentName && documentName.trim()) {
                    setDocumentName(documentName.trim());
                    saveToDeviceWithName(documentName.trim(), updatedImages);
                  }
                }
              }
            ],
            'plain-text',
            documentName || ''
          );
        }
      } else {
        console.log('Gallery selection was canceled');
      }
      
      setIsProcessing(false);
    } catch (error) {
      console.error('Error picking image:', error);
      setIsProcessing(false);
      Alert.alert('Error', 'Failed to pick image: ' + error.message);
    }
  };

  // Simple image processing for documents
  const processDocumentImage = async (imageUri) => {
    try {
      console.log('=== SIMPLE IMAGE PROCESSING ===');
      console.log('Processing image:', imageUri);
      
      // Get image info
      const imageInfo = await ImageManipulator.manipulateAsync(
        imageUri,
        [],
        { format: ImageManipulator.SaveFormat.JPEG }
      );
      console.log('Image dimensions:', imageInfo.width, 'x', imageInfo.height);
      
      // Simple processing: resize and optimize
      const processed = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          // Resize to reasonable size for better performance
          { resize: { width: 1200 } }
        ],
        {
          compress: 0.8, // Good quality with reasonable file size
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );
      
      console.log('Image processed successfully:', processed.uri);
      return processed;
      
    } catch (error) {
      console.error('Image processing error:', error);
      // Return original if processing fails
      return { uri: imageUri };
    }
  };

  const retakePicture = (index) => {
    setCapturedImages(prev => prev.filter((_, i) => i !== index));
  };

  // Simple PDF generation from images
  const generatePdfFromImages = async (images, documentName) => {
    try {
      console.log('=== SIMPLE PDF GENERATION ===');
      console.log('Images to process:', images.length);
      console.log('Document name:', documentName);
      
      // Optimize images for PDF (resize to reasonable size)
      const optimizedImages = await Promise.all(
        images.map(async (img, index) => {
          console.log(`Optimizing image ${index + 1}...`);
          const optimized = await ImageManipulator.manipulateAsync(
            img.uri,
            [{ resize: { width: 800 } }], // Reasonable size for PDF
            {
              compress: 0.8,
              format: ImageManipulator.SaveFormat.JPEG,
            }
          );
          console.log(`Image ${index + 1} optimized:`, optimized.uri);
          return optimized.uri;
        })
      );

      console.log('Creating PDF HTML...');
      
      // Simple HTML for PDF generation
      const html = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { 
                margin: 0; 
                padding: 20px; 
                font-family: Arial, sans-serif;
                background-color: white;
              }
              .page { 
                page-break-after: always; 
                width: 100%; 
                min-height: 100vh; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                padding: 20px;
                box-sizing: border-box;
              }
              img { 
                max-width: 100%; 
                max-height: 90vh; 
                object-fit: contain;
                display: block;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              }
              .page:last-child {
                page-break-after: auto;
              }
            </style>
          </head>
          <body>
            ${optimizedImages.map((img, index) => 
              `<div class='page'><img src='${img}' alt='Page ${index + 1}' /></div>`
            ).join('')}
          </body>
        </html>
      `;
      
      console.log('Generating PDF...');
      const { uri } = await Print.printToFileAsync({ 
        html, 
        base64: false,
        width: 612,  // Standard US Letter width
        height: 792  // Standard US Letter height
      });
      
      console.log('PDF generated successfully:', uri);
      
      // Verify PDF was created
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists || fileInfo.size === 0) {
        throw new Error('Generated PDF file is invalid');
      }
      
      console.log('PDF file verified, size:', fileInfo.size, 'bytes');
      return uri;
      
    } catch (error) {
      console.error('PDF generation error:', error);
      throw new Error('Failed to generate PDF: ' + error.message);
    }
  };

  // Helper function to save to cloud with specific name and images
  const saveToCloudWithName = async (documentName, images) => {
    try {
      setIsProcessing(true);
      console.log('=== SIMPLE DOCUMENT SAVE FLOW ===');
      console.log('Document name:', documentName);
      console.log('Number of images:', images.length);
      // Step 1: Generate PDF from images
      console.log('Step 1: Generating PDF...');
      const pdfUri = await generatePdfFromImages(images, documentName);
      console.log('PDF generated successfully:', pdfUri);
      setLastGeneratedPdf(pdfUri);
      // Validate PDF file before upload
      const fileInfo = await FileSystem.getInfoAsync(pdfUri);
      if (!fileInfo.exists || fileInfo.size === 0) {
        throw new Error('Generated PDF file is invalid or empty');
      }
      console.log('PDF file validated, size:', fileInfo.size, 'bytes');
      // Step 2: Upload PDF to Cloudinary
      console.log('Step 2: Uploading to Cloudinary...');
      const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/ds5gugfv0';
      const UPLOAD_PRESET = 'EXPO_UPLOAD';
      const formData = new FormData();
      formData.append('file', {
        uri: pdfUri,
        type: 'application/pdf',
        name: `${documentName}.pdf`,
      });
      formData.append('upload_preset', UPLOAD_PRESET);
      formData.append('resource_type', 'raw');
      console.log('Uploading with parameters:', {
        uri: pdfUri,
        type: 'application/pdf',
        name: `${documentName}.pdf`,
        upload_preset: UPLOAD_PRESET,
        resource_type: 'raw'
      });
      const cloudinaryResponse = await fetch(`${CLOUDINARY_URL}/raw/upload`, {
        method: 'POST',
        body: formData,
      });
      if (!cloudinaryResponse.ok) {
        const errorText = await cloudinaryResponse.text();
        console.error('Cloudinary error response:', errorText);
        throw new Error(`Cloudinary PDF upload failed: ${cloudinaryResponse.status} - ${errorText}`);
      }
      const cloudinaryData = await cloudinaryResponse.json();
      console.log('PDF uploaded successfully:', cloudinaryData.secure_url);
      // Step 3: Register in backend
      console.log('Step 3: Registering in backend...');
      const token = await AsyncStorage.getItem('jwt');
      if (!token) {
        throw new Error('Authentication required');
      }
      const fileName = `${documentName}.pdf`;
      const fileType = 'application/pdf';
      const registerData = {
        name: fileName,
        url: cloudinaryData.secure_url,
        type: fileType,
        size: cloudinaryData.bytes || 0,
      };
      console.log('Registering file:', registerData);
      const API_BASE_URL = 'http://10.162.93.13:8080/api';
      const registerResponse = await fetch(`${API_BASE_URL}/files/register`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData),
      });
      if (!registerResponse.ok) {
        throw new Error('Failed to register file in backend');
      }
      setIsProcessing(false);
      console.log('✅ Document saved successfully!');
      Alert.alert(
        'Success! 📄', 
        `"${fileName}" saved successfully!\n\nType: PDF (${images.length} page${images.length > 1 ? 's' : ''})\nSize: ${Math.round((cloudinaryData.bytes || 0) / 1024)}KB`, 
        [
          { 
            text: 'View Files 📁', 
            onPress: () => {
              navigation.navigate('Files');
              navigation.goBack();
            }
          },
          { 
            text: 'Scan More 📷', 
            onPress: () => {
              setCapturedImages([]);
              setDocumentName('');
              setLastGeneratedPdf(null);
            }
          },
          {
            text: 'View PDF 📄',
            onPress: () => openPdfViewer(lastGeneratedPdf)
          }
        ]
      );
    } catch (error) {
      console.error('Save to cloud error:', error);
      setIsProcessing(false);
      Alert.alert('Error ❌', 'Failed to save document: ' + error.message);
    }
  };

  // Helper function to save to device with specific name and images
  const saveToDeviceWithName = async (documentName, images) => {
    try {
      setIsProcessing(true);
      
      console.log('Generating PDF for device...');
      
      // Always generate PDF (even for single page)
      const pdfUri = await generatePdfFromImages(images, documentName);
      console.log('PDF generated for device:', pdfUri);
      
      // Store the generated PDF for viewing
      setLastGeneratedPdf(pdfUri);
      
      // Save PDF to device
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(pdfUri, {
          mimeType: 'application/pdf',
          dialogTitle: `Save ${documentName}.pdf`,
        });
      } else {
        Alert.alert('Sharing not available', 'PDF generated but sharing is not available on this device');
      }
      
      setIsProcessing(false);
      Alert.alert(
        'Success', 
        `Document "${documentName}.pdf" saved to device successfully!\n\nFile type: PDF (${images.length} page${images.length > 1 ? 's' : ''})`, 
        [
          { 
            text: 'View PDF 📄', 
            onPress: () => openPdfViewer(lastGeneratedPdf)
          },
          { 
            text: 'Scan More', 
            onPress: () => {
              setCapturedImages([]);
              setDocumentName('');
              setLastGeneratedPdf(null);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Save to device error:', error);
      setIsProcessing(false);
      Alert.alert('Error', 'Failed to save document to device: ' + error.message);
    }
  };

  // Simple save to cloud function
  const saveToCloud = async () => {
    if (capturedImages.length === 0) {
      Alert.alert('No Images', 'Please capture at least one image first');
      return;
    }

    if (!documentName.trim()) {
      // Show modal to enter document name
      setTempDocumentName('');
      setShowNameModal(true);
      return;
    }

    console.log('=== SAVE TO CLOUD ===');
    console.log('Document name:', documentName);
    console.log('Images:', capturedImages.length);
    
    // Simple flow: process images → save to cloud
    try {
      // Process all images
      const processedImages = await Promise.all(
        capturedImages.map(img => processDocumentImage(img.uri))
      );
      
      console.log('All images processed, saving to cloud...');
      
      // Save to cloud with processed images
      await saveToCloudWithName(documentName, processedImages);
      
    } catch (error) {
      console.error('Save to cloud error:', error);
      Alert.alert('Error ❌', 'Failed to save document: ' + error.message);
    }
  };

  const handleSaveWithName = async () => {
    if (!tempDocumentName.trim()) {
      Alert.alert('Invalid Name', 'Please enter a valid document name');
      return;
    }

    setShowNameModal(false);
    setDocumentName(tempDocumentName.trim());
    
    // Process and save with the new name
    try {
      const processedImages = await Promise.all(
        capturedImages.map(img => processDocumentImage(img.uri))
      );
      
      await saveToCloudWithName(tempDocumentName.trim(), processedImages);
    } catch (error) {
      console.error('Save to cloud error:', error);
      Alert.alert('Error ❌', 'Failed to save document: ' + error.message);
    }
  };

  const saveToDevice = async () => {
    try {
      setIsProcessing(true);
      
      for (const image of capturedImages) {
        await MediaLibrary.saveToLibraryAsync(image.uri);
      }
      
      setIsProcessing(false);
      Alert.alert('Success', 'Images saved to your device gallery');
    } catch (error) {
      setIsProcessing(false);
      Alert.alert('Error', 'Failed to save to device');
    }
  };

  // Simple PDF viewing function
  const viewPdf = async (pdfUri) => {
    try {
      console.log('=== SIMPLE PDF VIEWING ===');
      console.log('PDF URI:', pdfUri);
      
      if (!pdfUri) {
        Alert.alert('No PDF', 'No PDF file available to view');
        return;
      }

      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(pdfUri);
      if (!fileInfo.exists) {
        Alert.alert('File Not Found', 'The PDF file could not be found');
        return;
      }

      console.log('PDF file found, size:', fileInfo.size, 'bytes');

      // Simple approach: Use device's native PDF viewer
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(pdfUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'View PDF Document',
        });
      } else {
        // Fallback: Open with device's default app
        await Linking.openURL(`file://${pdfUri}`);
      }
      
    } catch (error) {
      console.error('PDF viewing error:', error);
      Alert.alert('Error', 'Failed to view PDF: ' + error.message);
    }
  };

  // Simple PDF viewer modal
  const openPdfViewer = (pdfUri) => {
    if (!pdfUri) {
      Alert.alert('No PDF', 'No PDF file available to view');
      return;
    }
    
    setCurrentPdfUri(pdfUri);
    setShowPdfViewer(true);
  };

  // Generate and view PDF for preview
  const generateAndViewPdf = async () => {
    try {
      if (capturedImages.length === 0) {
        Alert.alert('No Images', 'Please capture at least one image first');
        return;
      }

      setIsProcessing(true);
      
      // Generate temporary PDF for preview
      const tempPdfUri = await generatePdfFromImages(capturedImages, 'preview');
      console.log('Preview PDF generated:', tempPdfUri);
      
      // View the generated PDF using simple approach
      await viewPdf(tempPdfUri);
      
      setIsProcessing(false);
    } catch (error) {
      console.error('Preview PDF generation error:', error);
      setIsProcessing(false);
      Alert.alert('Error', 'Failed to generate preview PDF: ' + error.message);
    }
  };

  let [fontsLoaded] = useFonts({ Inter_400Regular, Inter_700Bold });
  if (!fontsLoaded) return null;

  if (hasPermission === null) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.text, { color: theme.text }]}>Requesting camera permission...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.centerContainer}>
          <Feather name="camera-off" size={64} color={theme.text} />
          <Text style={[styles.text, { color: theme.text }]}>Camera access is required</Text>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.buttonText, { color: theme.textInverse }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}> 
      {/* Glassy Header */}
      <BlurView intensity={70} tint="dark" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.1)', marginBottom: 8 }}> 
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: theme.text }}>Document Scanner</Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: theme.textSecondary }}>
            {capturedImages.length > 0 ? `${capturedImages.length} page${capturedImages.length > 1 ? 's' : ''} captured` : 'Ready to scan'}
          </Text>
        </View>
        <TouchableOpacity 
          style={[styles.headerButton, capturedImages.length > 0 && styles.previewButton]}
          onPress={() => setShowPreview(true)}
          disabled={capturedImages.length === 0}
        >
          <Feather name="image" size={24} color={capturedImages.length > 0 ? theme.primary : theme.textSecondary} />
          {capturedImages.length > 0 && (
            <View style={[styles.badge, { backgroundColor: theme.primary }]}> 
              <Text style={[styles.badgeText, { color: theme.textInverse }]}> {capturedImages.length} </Text>
            </View>
          )}
        </TouchableOpacity>
      </BlurView>

      {/* Glassy Scanner Area */}
      <View style={{ alignItems: 'center', marginTop: 18, marginBottom: 18 }}>
        <BlurView intensity={60} tint="dark" style={{ borderRadius: 28, overflow: 'hidden', width: screenWidth - 40, height: screenHeight * 0.5, justifyContent: 'center', alignItems: 'center' }}>
          <View style={[styles.scannerFrame, { borderColor: theme.primary, backgroundColor: 'rgba(20,40,80,0.18)' }]}> 
            {/* Animated Corner Guides */}
            <View style={styles.documentGuide}>
              <View style={[styles.corner, styles.topLeft, { borderColor: theme.primary }]} />
              <View style={[styles.corner, styles.topRight, { borderColor: theme.primary }]} />
              <View style={[styles.corner, styles.bottomLeft, { borderColor: theme.primary }]} />
              <View style={[styles.corner, styles.bottomRight, { borderColor: theme.primary }]} />
              <View style={[styles.documentOutline, { borderColor: theme.primary }]} />
              <View style={[styles.scanArea, { backgroundColor: theme.primary + '15' }]} />
              <View style={[styles.scanLine, { backgroundColor: theme.primary }]} />
            </View>
            <View style={styles.instructionsContainer}>
              <View style={[styles.iconContainer, { backgroundColor: theme.primary + '20' }]}> 
                <Feather name="file-text" size={32} color={theme.primary} />
              </View>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: theme.text, marginBottom: 8, textAlign: 'center' }}>Position Document</Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: theme.textSecondary, textAlign: 'center', lineHeight: 20 }}>Align within the frame for best results</Text>
            </View>
          </View>
        </BlurView>
      </View>

      {/* Glassy Controls Section */}
      <BlurView intensity={60} tint="dark" style={{ borderRadius: 24, marginHorizontal: 18, marginBottom: 18, padding: 18, backgroundColor: 'rgba(20,40,80,0.18)' }}>
        {/* Quality Selector with Icons */}
        <View style={styles.qualityContainer}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: theme.text, marginBottom: 12 }}>Scan Quality:</Text>
          <View style={styles.qualityButtons}>
            {[
              { key: 'draft', label: 'Draft', icon: 'zap' },
              { key: 'normal', label: 'Normal', icon: 'check' },
              { key: 'high', label: 'High', icon: 'star' }
            ].map((q) => (
              <TouchableOpacity
                key={q.key}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderRadius: 12,
                  borderWidth: 1,
                  gap: 6,
                  backgroundColor: quality === q.key ? theme.primary : 'rgba(255,255,255,0.08)',
                  borderColor: quality === q.key ? theme.primary : theme.border
                }}
                onPress={() => setQuality(q.key)}
              >
                <Feather 
                  name={q.icon} 
                  size={14} 
                  color={quality === q.key ? theme.textInverse : theme.text} 
                />
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: quality === q.key ? theme.textInverse : theme.text }}>{q.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </BlurView>

      {/* Glassy Action Buttons */}
      <BlurView intensity={60} tint="dark" style={{ borderRadius: 24, marginHorizontal: 18, marginBottom: 18, padding: 18, backgroundColor: 'rgba(20,40,80,0.18)' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
          <TouchableOpacity
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 12, gap: 8, backgroundColor: theme.secondary, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}
            onPress={pickFromGallery}
            disabled={isProcessing}
          >
            <Feather name="image" size={20} color={theme.text} />
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: theme.text }}>Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 16, borderRadius: 12, gap: 10, backgroundColor: theme.primary, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 }}
            onPress={takePicture}
            disabled={isProcessing}
          >
            <Feather name="camera" size={22} color={theme.textInverse} />
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: theme.textInverse }}>Scan</Text>
          </TouchableOpacity>
        </View>
      </BlurView>

      {/* Save Buttons */}
      {capturedImages.length > 0 && (
        <BlurView intensity={60} tint="dark" style={{ borderRadius: 24, marginHorizontal: 18, marginBottom: 18, padding: 18, backgroundColor: 'rgba(20,40,80,0.18)' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
            <TouchableOpacity
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 12, gap: 8, backgroundColor: theme.secondaryLight, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}
              onPress={saveToDevice}
              disabled={isProcessing}
            >
              <Feather name="download" size={20} color={theme.text} />
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: theme.text }}>Save to Device</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 12, gap: 8, backgroundColor: theme.primary, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}
              onPress={saveToCloud}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color={theme.textInverse} />
              ) : (
                <>
                  <Feather name="cloud" size={20} color={theme.textInverse} />
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: theme.textInverse }}>Save to Cloud</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </BlurView>
      )}

      {/* Preview Modal */}
      <Modal
        visible={showPreview}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPreview(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <BlurView intensity={120} tint="dark" style={{ ...StyleSheet.absoluteFillObject, zIndex: 1 }}>
            <View style={{ flex: 1, backgroundColor: 'rgba(10,10,20,0.55)' }} />
          </BlurView>
          <TouchableOpacity style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2 }} activeOpacity={1} onPress={() => setShowPreview(false)} />
          <BlurView intensity={90} tint="dark" style={{ backgroundColor: 'rgba(20,40,80,0.32)', borderRadius: 28, padding: 0, alignItems: 'center', width: 360, maxHeight: '90%', borderWidth: 1.5, borderColor: theme.primary, zIndex: 3, shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 16 }}>
            <SafeAreaView style={{ width: '100%', borderRadius: 28, overflow: 'hidden' }}>
              <View style={[styles.header, { backgroundColor: 'transparent', borderBottomWidth: 0, borderRadius: 28, paddingTop: 18 }]}> 
                <TouchableOpacity onPress={() => setShowPreview(false)}>
                  <Feather name="x" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: theme.text, textAlign: 'center', flex: 1 }}>Preview ({capturedImages.length})</Text>
                <TouchableOpacity 
                  style={[styles.headerButton, capturedImages.length > 0 && styles.previewButton]}
                  onPress={generateAndViewPdf}
                  disabled={capturedImages.length === 0 || isProcessing}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="small" color={theme.primary} />
                  ) : (
                    <Feather name="file-text" size={24} color={capturedImages.length > 0 ? theme.primary : theme.textSecondary} />
                  )}
                </TouchableOpacity>
              </View>
              <ScrollView style={{ padding: 24, maxHeight: 420 }}>
                {capturedImages.length === 0 ? (
                  <View style={styles.centerContainer}>
                    <Feather name="image" size={64} color={theme.text} />
                    <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 16, color: theme.text, marginTop: 10 }}>No images captured yet</Text>
                  </View>
                ) : (
                  <>
                    <View style={{ marginBottom: 20 }}>
                      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: theme.text, marginBottom: 8 }}>Document Name:</Text>
                      <TextInput
                        style={{ borderWidth: 1, borderColor: theme.border, borderRadius: 12, padding: 16, fontSize: 16, color: theme.text, backgroundColor: theme.inputBackground, marginBottom: 8, width: '100%', fontFamily: 'Inter_400Regular' }}
                        value={documentName}
                        onChangeText={setDocumentName}
                        placeholder="Enter document name"
                        placeholderTextColor={theme.textSecondary}
                      />
                      <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: theme.textSecondary }}>
                        {capturedImages.length === 1 
                          ? 'Will be saved as: JPEG image' 
                          : `Will be saved as: PDF (${capturedImages.length} pages)`
                        }
                      </Text>
                    </View>
                    {capturedImages.map((image, index) => (
                      <View key={index} style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, marginBottom: 18, overflow: 'hidden' }}>
                        <Image source={{ uri: image.uri }} style={{ width: '100%', height: 220, borderRadius: 16 }} />
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 }}>
                          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: theme.text }}>Page {index + 1}</Text>
                          <TouchableOpacity
                            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.error, borderRadius: 12, paddingVertical: 6, paddingHorizontal: 14 }}
                            onPress={() => retakePicture(index)}
                          >
                            <Feather name="refresh-cw" size={16} color={theme.textInverse} />
                            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: theme.textInverse, marginLeft: 6 }}>Retake</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </>
                )}
              </ScrollView>
            </SafeAreaView>
          </BlurView>
        </View>
      </Modal>

      {/* Document Name Modal */}
      <Modal
        visible={showNameModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowNameModal(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <BlurView intensity={120} tint="dark" style={{ ...StyleSheet.absoluteFillObject, zIndex: 1 }}>
            <View style={{ flex: 1, backgroundColor: 'rgba(10,10,20,0.55)' }} />
          </BlurView>
          <TouchableOpacity style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2 }} activeOpacity={1} onPress={() => setShowNameModal(false)} />
          <BlurView intensity={90} tint="dark" style={{ backgroundColor: 'rgba(20,40,80,0.32)', borderRadius: 28, padding: 32, alignItems: 'center', width: 340, borderWidth: 1.5, borderColor: theme.primary, zIndex: 3, shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 16 }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: theme.text, marginBottom: 18 }}>Enter Document Name</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: theme.border, borderRadius: 12, padding: 16, fontSize: 16, color: theme.text, backgroundColor: theme.inputBackground, marginBottom: 18, width: '100%', fontFamily: 'Inter_400Regular' }}
              value={tempDocumentName}
              onChangeText={setTempDocumentName}
              placeholder="Enter document name"
              placeholderTextColor={theme.textSecondary}
            />
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: theme.textSecondary, marginBottom: 18 }}>
              {capturedImages.length === 1 
                ? 'Will be saved as: JPEG image' 
                : `Will be saved as: PDF (${capturedImages.length} pages)`
              }
            </Text>
            <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
              <TouchableOpacity
                style={{ flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: theme.secondary, borderColor: theme.border, borderWidth: 1 }}
                onPress={() => setShowNameModal(false)}
              >
                <Text style={{ fontSize: 16, fontWeight: '600', color: theme.textSecondary, fontFamily: 'Inter_700Bold' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: theme.primary }}
                onPress={handleSaveWithName}
              >
                <Text style={{ fontSize: 16, fontWeight: '600', color: theme.textInverse, fontFamily: 'Inter_700Bold' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      </Modal>

      {/* PDF Viewer Modal */}
      <Modal
        visible={showPdfViewer}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPdfViewer(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <BlurView intensity={120} tint="dark" style={{ ...StyleSheet.absoluteFillObject, zIndex: 1 }}>
            <View style={{ flex: 1, backgroundColor: 'rgba(10,10,20,0.55)' }} />
          </BlurView>
          <TouchableOpacity style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2 }} activeOpacity={1} onPress={() => setShowPdfViewer(false)} />
          <BlurView intensity={90} tint="dark" style={{ backgroundColor: 'rgba(20,40,80,0.32)', borderRadius: 28, padding: 32, alignItems: 'center', width: 340, borderWidth: 1.5, borderColor: theme.primary, zIndex: 3, shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 16 }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 20, backgroundColor: theme.primary }}>
              <Feather name="file-text" size={48} color="#fff" />
            </View>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 24, color: theme.text, marginBottom: 8, textAlign: 'center' }}>PDF Ready to View</Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 16, color: theme.textSecondary, textAlign: 'center', marginBottom: 24, lineHeight: 22 }}>
              Open this PDF with your device's default PDF viewer
            </Text>
            <TouchableOpacity
              style={{ paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12, minWidth: 100, alignItems: 'center', backgroundColor: theme.primary, marginBottom: 12 }}
              onPress={() => viewPdf(currentPdfUri)}
            >
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: theme.textInverse }}>Open with Device Viewer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12, minWidth: 100, alignItems: 'center', backgroundColor: theme.secondaryLight }}
              onPress={() => {
                setShowPdfViewer(false);
                setCurrentPdfUri(null);
              }}
            >
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: theme.text }}>Close</Text>
            </TouchableOpacity>
          </BlurView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 4,
  },
  previewButton: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  scannerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scannerFrame: {
    width: screenWidth - 40,
    height: screenHeight * 0.5,
    borderWidth: 2,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  cornerGuide: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderWidth: 3,
  },
  topLeft: {
    top: 20,
    left: 20,
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  topRight: {
    top: 20,
    right: 20,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  bottomLeft: {
    bottom: 20,
    left: 20,
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  bottomRight: {
    bottom: 20,
    right: 20,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  documentGuide: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentOutline: {
    position: 'absolute',
    width: screenWidth * 0.7,
    height: screenHeight * 0.35,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
  },
  scanArea: {
    position: 'absolute',
    width: screenWidth * 0.7,
    height: screenHeight * 0.35,
    borderRadius: 12,
    opacity: 0.1,
  },
  scanLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: 3,
    borderRadius: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  instructionsContainer: {
    alignItems: 'center',
    padding: 30,
    zIndex: 1,
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructions: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  instructionsSub: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  instructionsTip: {
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
  },
  controls: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  qualityContainer: {
    marginBottom: 20,
  },
  qualityLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  qualityButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  qualityButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  qualityButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tipsContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  tipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    gap: 6,
  },
  tipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  captureButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  captureButtonInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  captureButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  saveButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    fontSize: 16,
    marginTop: 10,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 20,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  previewContainer: {
    flex: 1,
    padding: 20,
  },
  documentNameContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 16,
  },
  previewItem: {
    marginBottom: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 300,
    resizeMode: 'contain',
  },
  previewActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
  },
  previewText: {
    fontSize: 16,
    fontWeight: '500',
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    gap: 5,
  },
  retakeButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  tipsDetail: {
    fontSize: 12,
    marginLeft: 24,
    marginTop: 2,
  },
  fileTypeInfo: {
    fontSize: 12,
    marginTop: 10,
    textAlign: 'center',
  },
  // Document Name Modal Styles
  documentNameContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 15,
    padding: 20,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  viewPdfContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  viewPdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  viewPdfButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  pdfViewerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pdfViewerFallback: {
    alignItems: 'center',
    padding: 20,
  },
}); 