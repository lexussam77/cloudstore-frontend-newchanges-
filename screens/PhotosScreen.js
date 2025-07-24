import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, Dimensions, SafeAreaView, ScrollView } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';

const PHOTO_SIZE = (Dimensions.get('window').width - 64) / 3;
const photos = [
  { id: '1', uri: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb' }, // family in field
  { id: '2', uri: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308' }, // group selfie
  { id: '3', uri: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91' }, // father and son
  { id: '4', uri: 'https://images.unsplash.com/photo-1517841905240-472988babdf9' }, // family group
  { id: '5', uri: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca' }, // kids on beach
  { id: '6', uri: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e' }, // family at home
  { id: '7', uri: 'https://images.unsplash.com/photo-1504196606672-aef5c9cefc92' }, // family at beach
  { id: '8', uri: 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d' }, // mom and daughter
  { id: '9', uri: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2' }, // polaroid collage
];

const DEEP_BLUE_GRADIENT = ['#0a0f1c', '#12203a', '#1a2a4f'];
const GLASS_BG_DEEP = 'rgba(20,40,80,0.32)';
const GLASS_BORDER = 'rgba(255,255,255,0.10)';
const WHITE = '#fff';
const LIGHT_TEXT = '#e0e6f0';
const BLUE_ACCENT = '#2979FF';

export default function PhotosScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  // let [fontsLoaded] = useFonts({ Inter_400Regular, Inter_700Bold });
  // if (!fontsLoaded) return null;

  const [isPickingDocument, setIsPickingDocument] = useState(false);

  const pickAndUploadFile = async () => {
    if (isPickingDocument) return;
    setIsPickingDocument(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({});
      if (result.type === 'success') {
        const formData = new FormData();
        formData.append('files', {
          uri: result.uri,
          name: result.name,
          type: result.mimeType || 'application/octet-stream',
        });
        // Replace with your backend URL and add auth headers if needed
        await axios.post('http://192.168.62.13:8080/api/files/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        // Optionally show a success prompt or refresh
      }
    } finally {
      setIsPickingDocument(false);
    }
  };

  return (
    <LinearGradient colors={DEEP_BLUE_GRADIENT} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        <BlurView intensity={80} tint="dark" style={{ backgroundColor: GLASS_BG_DEEP, borderRadius: 22, borderWidth: 1, borderColor: GLASS_BORDER, marginTop: 18, marginBottom: 18, marginHorizontal: 12, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4, paddingTop: 16, paddingBottom: 12 }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 24, color: WHITE, alignSelf: 'flex-start', marginLeft: 16, marginBottom: 2 }}>Photos</Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 16, color: LIGHT_TEXT, alignSelf: 'flex-start', marginLeft: 16, marginBottom: 6 }}>Today</Text>
          <FlatList
            data={photos}
            keyExtractor={item => item.id}
            numColumns={3}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <Image source={{ uri: item.uri }} style={styles.photo} />
            )}
            contentContainerStyle={styles.grid}
          />
        </BlurView>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 28, color: WHITE, marginBottom: 4, alignSelf: 'flex-start', marginLeft: 16 }}>Photos</Text>
        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 16, color: LIGHT_TEXT, marginBottom: 10, alignSelf: 'flex-start', marginLeft: 16, marginRight: 16 }}>
          Come here to view and edit photos and videos, and manage camera uploads.
        </Text>
        <TouchableOpacity style={{ borderRadius: 24, paddingVertical: 18, paddingHorizontal: 24, alignItems: 'center', width: '80%', marginBottom: 16, alignSelf: 'center', backgroundColor: BLUE_ACCENT, shadowOpacity: 0.10, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 }} activeOpacity={0.85} onPress={() => navigation.navigate('BackupLoading')}>
          <Text style={{ color: WHITE, fontFamily: 'Inter_700Bold', fontSize: 18 }}>Back up photos</Text>
        </TouchableOpacity>
        <BlurView intensity={60} tint="dark" style={{ borderRadius: 24, overflow: 'hidden', width: '80%', alignSelf: 'center', marginBottom: 8, borderWidth: 1.5, borderColor: BLUE_ACCENT }}>
          <TouchableOpacity style={{ borderRadius: 24, paddingVertical: 18, paddingHorizontal: 24, alignItems: 'center', width: '100%' }} activeOpacity={0.85} onPress={pickAndUploadFile} disabled={isPickingDocument}>
            <Text style={{ color: BLUE_ACCENT, fontFamily: 'Inter_700Bold', fontSize: 18 }}>Upload photos</Text>
          </TouchableOpacity>
        </BlurView>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 0,
    alignItems: 'stretch',
    paddingBottom: 10,
    minHeight: undefined,
  },
  card: {
    width: '100%',
    borderRadius: 18,
    marginTop: 10,
    marginBottom: 10,
    alignItems: 'center',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    paddingTop: 12,
    paddingBottom: 10,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
    marginLeft: 16,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 16,
    alignSelf: 'flex-start',
    marginLeft: 16,
    marginBottom: 6,
    fontWeight: '500',
  },
  grid: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: 8,
    margin: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
    alignSelf: 'flex-start',
    marginLeft: 16,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 10,
    alignSelf: 'flex-start',
    marginLeft: 16,
    marginRight: 16,
  },
  primaryBtn: {
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    width: '80%',
    marginBottom: 16,
    alignSelf: 'center',
  },
  primaryBtnText: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  secondaryBtn: {
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    width: '80%',
    borderWidth: 1.5,
    marginBottom: 8,
    alignSelf: 'center',
  },
  secondaryBtnText: {
    fontWeight: 'bold',
    fontSize: 18,
  },
}); 