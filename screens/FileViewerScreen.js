import React, { useState, useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  ScrollView,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
  StatusBar,
  Platform,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Audio } from 'expo-av';
import Feather from 'react-native-vector-icons/Feather';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { WebView } from 'react-native-webview';
import { getDownloadUrl } from './api';
import { PanResponder } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function FileViewerScreen({ route, navigation }) {
  const { files = [], initialIndex = 0 } = route.params;
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [prevIndex, setPrevIndex] = useState(initialIndex);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const file = files[currentIndex] || {};
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [videoRef, setVideoRef] = useState(null);
  const [audioRef, setAudioRef] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [pdfCache, setPdfCache] = useState(new Map()); // Cache for PDF data
  const [pdfProgress, setPdfProgress] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    determineFileType();
    navigation.setOptions({
      title: file.name,
      headerRight: () => (
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity
            style={{ marginRight: 15 }}
            onPress={handleShare}
          >
            <Feather name="share-2" size={24} color="#0061FF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={{ marginRight: 15 }}
            onPress={handleDownload}
          >
            <Feather name="download" size={24} color="#0061FF" />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [file]);

  // Animate slide when index changes
  useEffect(() => {
    if (currentIndex !== prevIndex) {
      const direction = currentIndex > prevIndex ? 1 : -1;
      slideAnim.setValue(direction * 400); // Start off-screen
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
      setPrevIndex(currentIndex);
    }
  }, [currentIndex]);

  const determineFileType = () => {
    if (!file.name) {
      setError('Invalid file');
      setLoading(false);
      return;
    }

    const extension = file.name.split('.').pop().toLowerCase();
    console.log('=== FILE TYPE DETECTION ===');
    console.log('File name:', file.name);
    console.log('Extension:', extension);
    
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension)) {
      console.log('Detected as: image');
      setFileType('image');
    } else if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(extension)) {
      console.log('Detected as: video');
      setFileType('video');
    } else if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'].includes(extension)) {
      console.log('Detected as: audio');
      setFileType('audio');
    } else if (extension === 'pdf') {
      console.log('Detected as: PDF - Using enhanced PDF viewer');
      setFileType('pdf');
    } else if (['txt', 'md', 'json', 'xml', 'html', 'css', 'js', 'py', 'java', 'cpp', 'c', 'php'].includes(extension)) {
      console.log('Detected as: text');
      setFileType('text');
    } else {
      console.log('Detected as: unsupported');
      setFileType('unsupported');
    }
    
    setLoading(false);
  };

  useEffect(() => {
    if (fileType === 'text') {
      loadTextContent();
    }
  }, [fileType]);

  const handleShare = async () => {
    try {
      // Use the file's URL directly since files are stored on Cloudinary
      const publicUrl = file.url;
      
      console.log('File object:', file);
      console.log('Public URL for sharing:', publicUrl);
      
      if (!publicUrl) {
        Alert.alert('Error', 'No shareable URL available for this file');
        return;
      }

      if (await Sharing.isAvailableAsync()) {
        try {
          // Always download the file to cache first since expo-sharing only supports local files
          const fileName = file.name;
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
          
          console.log('Starting download from:', publicUrl);
          console.log('Downloading to:', cacheFileUri);
          
          const downloadResult = await FileSystem.downloadAsync(publicUrl, cacheFileUri);
          
          console.log('Download result:', downloadResult);
          console.log('Download status code:', downloadResult.statusCode);
          console.log('Download status:', downloadResult.status);
          
          if (downloadResult.statusCode === 200 || downloadResult.status === 200) {
            console.log('File downloaded successfully, sharing:', cacheFileUri);
            await Sharing.shareAsync(cacheFileUri, {
              mimeType: file.type || 'application/octet-stream',
              dialogTitle: `Share ${file.name}`,
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
    } catch (error) {
      console.error('Share error:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      Alert.alert('Error', 'Failed to share file: ' + error.message);
    }
  };

  const handleDownload = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to save files to your device.');
        return;
      }

      const fileName = file.name;
      const fileExtension = fileName.includes('.') ? fileName.split('.').pop() : '';
      const baseName = fileName.includes('.') ? fileName.substring(0, fileName.lastIndexOf('.')) : fileName;
      const uniqueFileName = `${baseName}_${Date.now()}${fileExtension ? '.' + fileExtension : ''}`;
      
      const cacheDir = FileSystem.cacheDirectory + 'Downloads/';
      const cacheFileUri = cacheDir + uniqueFileName;
      
      const dirInfo = await FileSystem.getInfoAsync(cacheDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
      }
      
      const downloadResult = await FileSystem.downloadAsync(file.url, cacheFileUri);
      
      if (downloadResult.statusCode === 200) {
        const asset = await MediaLibrary.createAssetAsync(cacheFileUri);
        await MediaLibrary.createAlbumAsync('Downloads', asset, false);
        Alert.alert('Success', 'File downloaded successfully!');
      } else {
        Alert.alert('Error', 'Failed to download file');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to download file: ' + error.message);
    }
  };

  // Test PDF functionality
  const testPdfFunctionality = async () => {
    try {
      console.log('=== PDF FUNCTIONALITY TEST ===');
      console.log('File URL:', file.url);
      console.log('File name:', file.name);
      console.log('File type:', fileType);
      
      // Test 1: Check if URL is accessible
      const response = await fetch(file.url, {
        method: 'HEAD',
        headers: {
          'Accept': 'application/pdf, */*'
        }
      });
      
      console.log('URL accessibility test:', {
        status: response.status,
        contentType: response.headers.get('content-type'),
        contentLength: response.headers.get('content-length')
      });
      
      // Test 2: Try to get actual PDF content
      const pdfResponse = await fetch(file.url);
      const arrayBuffer = await pdfResponse.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      console.log('PDF content test:', {
        size: uint8Array.length,
        header: String.fromCharCode(...uint8Array.slice(0, 4)),
        isPdf: String.fromCharCode(...uint8Array.slice(0, 4)) === '%PDF'
      });
      
      Alert.alert(
        'PDF Test Results', 
        `✅ URL Access: ${response.status === 200 ? 'OK' : 'Failed'}\n` +
        `📄 File Size: ${uint8Array.length} bytes\n` +
        `🔍 PDF Header: ${String.fromCharCode(...uint8Array.slice(0, 4))}\n` +
        `✅ Is PDF: ${String.fromCharCode(...uint8Array.slice(0, 4)) === '%PDF' ? 'Yes' : 'No'}`
      );
      
    } catch (error) {
      console.error('PDF test error:', error);
      Alert.alert('PDF Test Error', error.message);
    }
  };

  const handleVideoLoad = (data) => {
    setDuration(data.durationMillis);
    setLoading(false);
  };

  const handleAudioLoad = (data) => {
    setDuration(data.durationMillis);
    setLoading(false);
  };

  const togglePlayPause = async () => {
    if (fileType === 'video' && videoRef) {
      if (isPlaying) {
        await videoRef.pauseAsync();
      } else {
        await videoRef.playAsync();
      }
      setIsPlaying(!isPlaying);
    } else if (fileType === 'audio' && audioRef) {
      if (isPlaying) {
        await audioRef.pauseAsync();
      } else {
        await audioRef.playAsync();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const onPlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      setIsPlaying(status.isPlaying);
      setPosition(status.positionMillis);
      if (status.didJustFinish) {
        setIsPlaying(false);
        setPosition(0);
      }
    }
  };

  const seekTo = (time) => {
    if (fileType === 'video' && videoRef) {
      videoRef.setPositionAsync(time);
    } else if (fileType === 'audio' && audioRef) {
      audioRef.setPositionAsync(time);
    }
  };

  const formatTime = (millis) => {
    const minutes = Math.floor(millis / 60000);
    const seconds = ((millis % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const renderImage = () => (
    <ScrollView 
      style={styles.imageContainer}
      contentContainerStyle={styles.imageContentContainer}
      maximumZoomScale={3}
      minimumZoomScale={1}
    >
      <Image
        source={{ uri: file.url }}
        style={styles.image}
        resizeMode="contain"
        onLoad={() => setLoading(false)}
        onError={() => {
          setError('Failed to load image');
          setLoading(false);
        }}
      />
    </ScrollView>
  );

  const renderVideo = () => (
    <View style={styles.videoContainer}>
      <Video
        ref={setVideoRef}
        source={{ uri: file.url }}
        style={styles.video}
        useNativeControls={false}
        resizeMode={ResizeMode.CONTAIN}
        isLooping={false}
        onLoad={handleVideoLoad}
        onPlaybackStatusUpdate={onPlaybackStatusUpdate}
        onError={() => {
          setError('Failed to load video');
          setLoading(false);
        }}
      />
      {showControls && (
        <View style={styles.videoControls}>
          <TouchableOpacity onPress={togglePlayPause} style={styles.playButton}>
            <Feather name={isPlaying ? 'pause' : 'play'} size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.progressContainer}>
            <Text style={styles.timeText}>{formatTime(position)}</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${(position / duration) * 100}%` }]} />
            </View>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>
        </View>
      )}
    </View>
  );

  const renderAudio = () => (
    <View style={styles.audioContainer}>
      <View style={styles.audioVisualizer}>
        <Feather name="music" size={80} color="#0061FF" />
      </View>
      <Text style={styles.audioTitle}>{file.name}</Text>
      <View style={styles.audioControls}>
        <TouchableOpacity onPress={togglePlayPause} style={styles.audioPlayButton}>
          <Feather name={isPlaying ? 'pause' : 'play'} size={32} color="#fff" />
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <Text style={styles.timeText}>{formatTime(position)}</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(position / duration) * 100}%` }]} />
          </View>
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>
      </View>
    </View>
  );

  const renderPDF = () => {
    console.log('=== ENHANCED PDF RENDERER ===');
    console.log('PDF URL:', file.url);
    console.log('File name:', file.name);
    
    // Enhanced HTML with PDF.js for better PDF viewing
    const enhancedPdfHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
          <style>
            body { margin: 0; padding: 0; background-color: #f5f5f5; font-family: Arial, sans-serif; overflow: hidden; }
            .pdf-container { width: 100%; height: 100vh; display: flex; flex-direction: column; }
            .pdf-header { background-color: #fff; padding: 15px; border-bottom: 1px solid #e0e0e0; text-align: center; font-weight: bold; color: #333; box-shadow: 0 2px 4px rgba(0,0,0,0.1); z-index: 1000; }
            .pdf-controls { background-color: #fff; padding: 10px; border-bottom: 1px solid #e0e0e0; display: flex; justify-content: center; align-items: center; gap: 10px; z-index: 999; }
            .control-btn { background-color: #0061FF; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 14px; margin: 0 5px; }
            .control-btn:disabled { background-color: #ccc; cursor: not-allowed; }
            .page-info { font-size: 14px; color: #666; margin: 0 15px; }
            .pdf-viewer { flex: 1; width: 100%; background-color: #f5f5f5; overflow: auto; position: relative; }
            .pdf-canvas { display: block; margin: 20px auto; box-shadow: 0 4px 8px rgba(0,0,0,0.1); background-color: white; }
            .loading-container { display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%; color: #666; }
            .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #0061FF; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin-bottom: 20px; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            .error-container { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 20px; text-align: center; }
            .error-message { color: #ef4444; margin: 20px 0; font-size: 16px; }
            .fallback-button { background-color: #0061FF; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 10px; display: inline-block; border: none; cursor: pointer; font-size: 16px; }
            .zoom-controls { display: flex; align-items: center; gap: 10px; }
            .zoom-btn { background-color: #f0f0f0; border: 1px solid #ddd; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 16px; font-weight: bold; }
            .zoom-btn:hover { background-color: #e0e0e0; }
          </style>
        </head>
        <body>
          <div class="pdf-container">
            <div class="pdf-header">${file.name}</div>
            <div class="pdf-controls">
              <button class="control-btn" onclick="previousPage()" id="prevBtn">Previous</button>
              <span class="page-info" id="pageInfo">Page 1 of 1</span>
              <button class="control-btn" onclick="nextPage()" id="nextBtn">Next</button>
              <div class="zoom-controls">
                <button class="zoom-btn" onclick="zoomOut()">-</button>
                <span id="zoomLevel">100%</span>
                <button class="zoom-btn" onclick="zoomIn()">+</button>
              </div>
            </div>
            <div class="pdf-viewer" id="pdfViewer">
              <div class="loading-container" id="loadingContainer">
                <div class="spinner"></div>
                <div>Loading PDF...</div>
              </div>
            </div>
          </div>
          <script>
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            let pdfDoc = null;
            let pageNum = 1;
            let pageRendering = false;
            let pageNumPending = null;
            let scale = 1.0;
            const scaleDelta = 0.25;
            async function loadPDF() {
              try {
                const loadingTask = pdfjsLib.getDocument('${file.url}');
                pdfDoc = await loadingTask.promise;
                document.getElementById('pageInfo').textContent = \`Page 1 of \${'${pdfDoc.numPages}'}\`;
                document.getElementById('prevBtn').disabled = true;
                document.getElementById('nextBtn').disabled = pdfDoc.numPages <= 1;
                renderPage(pageNum);
                window.ReactNativeWebView.postMessage('pdfLoaded:' + pdfDoc.numPages);
              } catch (error) {
                showError('Failed to load PDF: ' + error.message);
                window.ReactNativeWebView.postMessage('pdfError:' + error.message);
              }
            }
            function renderPage(num) {
              pageRendering = true;
              pdfDoc.getPage(num).then(function(page) {
                const viewport = page.getViewport({scale: scale});
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                canvas.className = 'pdf-canvas';
                const renderContext = { canvasContext: ctx, viewport: viewport };
                const renderTask = page.render(renderContext);
                renderTask.promise.then(function() {
                  pageRendering = false;
                  const viewer = document.getElementById('pdfViewer');
                  viewer.innerHTML = '';
                  viewer.appendChild(canvas);
                  document.getElementById('zoomLevel').textContent = Math.round(scale * 100) + '%';
                  if (pageNumPending !== null) {
                    renderPage(pageNumPending);
                    pageNumPending = null;
                  }
                });
              });
            }
            function queueRenderPage(num) {
              if (pageRendering) {
                pageNumPending = num;
              } else {
                renderPage(num);
              }
            }
            function previousPage() {
              if (pageNum <= 1) { return; }
              pageNum--;
              queueRenderPage(pageNum);
              updatePageInfo();
            }
            function nextPage() {
              if (pageNum >= pdfDoc.numPages) { return; }
              pageNum++;
              queueRenderPage(pageNum);
              updatePageInfo();
            }
            function updatePageInfo() {
              document.getElementById('pageInfo').textContent = \`Page \${'${pageNum}'} of \${'${pdfDoc.numPages}'}\`;
              document.getElementById('prevBtn').disabled = pageNum <= 1;
              document.getElementById('nextBtn').disabled = pageNum >= pdfDoc.numPages;
            }
            function zoomIn() { scale += scaleDelta; queueRenderPage(pageNum); }
            function zoomOut() { if (scale > scaleDelta) { scale -= scaleDelta; queueRenderPage(pageNum); } }
            function showError(message) {
              const viewer = document.getElementById('pdfViewer');
              viewer.innerHTML = \`<div class='error-container'><h2>PDF Viewer Error</h2><p class='error-message'>\${'${message}'}</p><p><strong>File:</strong> \${file.name}</p><p><strong>URL:</strong> \${file.url}</p><div style='margin-top: 20px;'><a href='\${file.url}' target='_blank' class='fallback-button'>Open in Browser</a><a href='\${file.url}' download='\${file.name}' class='fallback-button'>Download PDF</a></div></div>\`;
            }
            loadPDF();
          </script>
        </body>
      </html>
    `;
    return (
      <View style={styles.pdfContainer}>
        <WebView
          source={{ html: enhancedPdfHtml }}
          style={styles.pdfViewer}
          onLoadStart={() => {
            setLoading(true);
          }}
          onLoadEnd={() => {
            setLoading(false);
          }}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            setError('Failed to load PDF viewer');
            setLoading(false);
          }}
          onMessage={(event) => {
            const { data } = event.nativeEvent;
            if (data.startsWith('pdfLoaded:')) {
              const pageCount = parseInt(data.split(':')[1]);
              setLoading(false);
              setPdfProgress(100);
              setTotalPages(pageCount);
            } else if (data.startsWith('pdfError:')) {
              const errorMsg = data.split(':')[1];
              setError('PDF cannot be displayed: ' + errorMsg);
              setLoading(false);
            }
          }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0061FF" />
              <Text style={styles.loadingText}>Loading PDF...</Text>
            </View>
          )}
        />
      </View>
    );
  };

  const [textContent, setTextContent] = useState('');
  const [textLoading, setTextLoading] = useState(false);

  const loadTextContent = async () => {
    setTextLoading(true);
    try {
      const response = await fetch(file.url);
      const text = await response.text();
      setTextContent(text);
      setTextLoading(false);
    } catch (error) {
      setError('Failed to load text file');
      setTextLoading(false);
    }
  };

  const renderText = () => {
    if (textLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0061FF" />
          <Text style={styles.loadingText}>Loading text file...</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.textContainer}>
        <Text style={styles.textContent}>{textContent}</Text>
      </ScrollView>
    );
  };

  const renderUnsupported = () => (
    <View style={styles.unsupportedContainer}>
      <Feather name="file" size={80} color="#ccc" />
      <Text style={styles.unsupportedTitle}>File Type Not Supported</Text>
      <Text style={styles.unsupportedText}>
        This file type cannot be previewed. You can download it to view on your device.
      </Text>
      <TouchableOpacity style={styles.downloadButton} onPress={handleDownload}>
        <Feather name="download" size={20} color="#fff" />
        <Text style={styles.downloadButtonText}>Download File</Text>
      </TouchableOpacity>
    </View>
  );

  // Helper to check if file is compressed
  const isCompressed = file.name && file.name.includes('_compressed');

  // Custom compressed file viewers
  const renderCompressedImage = () => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
      <Text style={{ color: '#0061FF', fontWeight: 'bold', marginBottom: 8 }}>Compressed Image</Text>
      {renderImage()}
    </View>
  );
  const renderCompressedVideo = () => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
      <Text style={{ color: '#0061FF', fontWeight: 'bold', marginBottom: 8 }}>Compressed Video</Text>
      {renderVideo()}
    </View>
  );

  // Remove custom compressed viewers and use regular viewers for compressed files
  const renderContent = () => {
    const extension = file.name.split('.').pop().toLowerCase();
    if (file.name && file.name.includes('_compressed')) {
      if (["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(extension)) {
        return renderImage();
      } else if (["mp4", "avi", "mov", "wmv", "flv", "webm", "mkv"].includes(extension)) {
        return renderVideo();
      }
      // fallback for unsupported compressed types
      return renderUnsupported();
    }
    // fallback to regular logic
    switch (fileType) {
      case 'image':
        return renderImage();
      case 'video':
        return renderVideo();
      case 'audio':
        return renderAudio();
      case 'pdf':
        return renderPDF();
      case 'text':
        return renderText();
      case 'unsupported':
        return renderUnsupported();
      default:
        return null;
    }
  };

  // PanResponder for swipe navigation
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only respond to horizontal swipes
        return Math.abs(gestureState.dx) > 20 && Math.abs(gestureState.dy) < 20;
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx < -50 && currentIndex < files.length - 1) {
          setCurrentIndex(currentIndex + 1);
        } else if (gestureState.dx > 50 && currentIndex > 0) {
          setCurrentIndex(currentIndex - 1);
        }
      },
    })
  ).current;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0061FF" />
        <Text style={styles.loadingText}>
          {fileType === 'pdf' && totalPages > 0 
            ? `Loading PDF... ${Math.round(pdfProgress)}% (Page ${Math.ceil(pdfProgress * totalPages / 100)} of ${totalPages})`
            : 'Loading file...'
          }
        </Text>
        {fileType === 'pdf' && totalPages > 0 && (
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${pdfProgress}%` }]} />
            </View>
          </View>
        )}
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Feather name="alert-circle" size={80} color="#ef4444" />
        <Text style={styles.errorTitle}>Error Loading File</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.downloadButton} 
          onPress={testPdfFunctionality}
        >
          <Feather name="refresh-cw" size={20} color="#fff" />
          <Text style={styles.downloadButtonText}>Test PDF Access</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} {...panResponder.panHandlers}>
      <StatusBar barStyle="dark-content" />
      {/* Temporary debug button for PDF testing */}
      {file.name && file.name.toLowerCase().includes('.pdf') && (
        <TouchableOpacity 
          style={{
            position: 'absolute',
            top: 50,
            right: 20,
            backgroundColor: '#0061FF',
            padding: 10,
            borderRadius: 5,
            zIndex: 1000,
          }}
          onPress={() => {
            console.log('Force PDF viewer button pressed');
            setFileType('pdf');
            setLoading(false);
            setError(null);
          }}
        >
          <Text style={{ color: 'white', fontSize: 12 }}>Force PDF</Text>
        </TouchableOpacity>
      )}
      {/* Left/Right navigation buttons */}
      {files.length > 1 && currentIndex > 0 && (
        <TouchableOpacity
          style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 48, justifyContent: 'center', alignItems: 'flex-start', zIndex: 20, backgroundColor: 'transparent' }}
          activeOpacity={0.3}
          onPress={() => setCurrentIndex(currentIndex - 1)}
        >
          <View style={{ width: 36, height: 64, borderRadius: 32, backgroundColor: 'rgba(0,0,0,0.12)', justifyContent: 'center', alignItems: 'center', marginLeft: 4 }}>
            <Feather name="chevron-left" size={32} color="#fff" />
          </View>
        </TouchableOpacity>
      )}
      {files.length > 1 && currentIndex < files.length - 1 && (
        <TouchableOpacity
          style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 48, justifyContent: 'center', alignItems: 'flex-end', zIndex: 20, backgroundColor: 'transparent' }}
          activeOpacity={0.3}
          onPress={() => setCurrentIndex(currentIndex + 1)}
        >
          <View style={{ width: 36, height: 64, borderRadius: 32, backgroundColor: 'rgba(0,0,0,0.12)', justifyContent: 'center', alignItems: 'center', marginRight: 4 }}>
            <Feather name="chevron-right" size={32} color="#fff" />
          </View>
        </TouchableOpacity>
      )}
      <Animated.View style={{ flex: 1, transform: [{ translateX: slideAnim }] }}>
        {renderContent()}
      </Animated.View>
      {/* Optional: Show file index indicator */}
      {files.length > 1 && (
        <View style={{ position: 'absolute', bottom: 24, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4 }}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>{currentIndex + 1} / {files.length}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ef4444',
    marginTop: 20,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#0061FF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  imageContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  imageContentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: screenWidth,
    height: screenHeight,
  },
  videoContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  video: {
    flex: 1,
  },
  videoControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  playButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    color: '#fff',
    fontSize: 14,
    marginHorizontal: 10,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginHorizontal: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0061FF',
    borderRadius: 2,
  },
  audioContainer: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  audioVisualizer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#f0f4fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  audioTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 30,
    textAlign: 'center',
  },
  audioControls: {
    width: '100%',
    alignItems: 'center',
  },
  audioPlayButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0061FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  pdfContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  pdfViewer: {
    flex: 1,
  },
  textContainer: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  textContent: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  unsupportedContainer: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  unsupportedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  unsupportedText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  downloadButton: {
    backgroundColor: '#0061FF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  progressBarContainer: {
    width: '80%',
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginTop: 10,
  },
  progressBar: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0061FF',
    borderRadius: 4,
  },
}); 