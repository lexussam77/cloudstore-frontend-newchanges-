import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from '../theme/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';

const helpTopics = [
  { title: 'How to upload files', description: 'Learn how to upload and manage your files', icon: 'upload-cloud' },
  { title: 'How to create folders', description: 'Organize your files with folders', icon: 'folder-plus' },
  { title: 'How to scan documents', description: 'Use the built-in document scanner', icon: 'camera' },
  { title: 'Managing your storage', description: 'Monitor and optimize your storage usage', icon: 'hard-drive' },
  { title: 'Contact support', description: 'Get help from our support team', icon: 'help-circle' },
];



export default function HelpScreen({ navigation }) {
  const { theme, constants } = useTheme();
  let [fontsLoaded] = useFonts({ Inter_400Regular, Inter_700Bold });
  if (!fontsLoaded) return null;

  return (
    <LinearGradient colors={constants.gradient} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <TouchableOpacity
          style={{
            position: 'absolute',
            top: 38,
            left: 18,
            zIndex: 10,
            backgroundColor: constants.glassBg,
            borderRadius: 18,
            padding: 8
          }}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Feather name="arrow-left" size={22} color={constants.primaryText} />
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={{ paddingBottom: 80, paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={{ alignItems: 'center', marginTop: 24, marginBottom: 32 }}>
            <View style={{
              backgroundColor: constants.glassBg,
              borderRadius: 20,
              padding: 16,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: constants.glassBorder
            }}>
              <Feather name="help-circle" size={32} color={constants.accent} />
            </View>
            <Text style={{
              fontFamily: 'Inter_700Bold',
              fontSize: 26,
              color: constants.primaryText,
              letterSpacing: 0.2,
              textAlign: 'center'
            }}>
              CloudStore Help
            </Text>
            <Text style={{
              fontFamily: 'Inter_400Regular',
              fontSize: 15,
              color: constants.secondaryText,
              marginTop: 6,
              textAlign: 'center',
              maxWidth: 320
            }}>
              Find answers to common questions and get support.
            </Text>
          </View>

          {/* Help Topics */}
          <View style={{ paddingHorizontal: 16 }}>
            {helpTopics.map((topic, idx) => (
              <TouchableOpacity
                key={idx}
                style={{
                  backgroundColor: constants.glassBg,
                  borderRadius: 16,
                  padding: 20,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: constants.glassBorder,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
                activeOpacity={0.85}
                onPress={() => {
                  // Handle navigation to specific help topics
                  console.log(`Help topic: ${topic.title}`);
                }}
              >
                <View style={{
                  backgroundColor: constants.accent + '20',
                  borderRadius: 12,
                  padding: 12,
                  marginRight: 16,
                }}>
                  <Feather name={topic.icon} size={20} color={constants.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontFamily: 'Inter_700Bold',
                    fontSize: 16,
                    color: constants.primaryText,
                    marginBottom: 4
                  }}>
                    {topic.title}
                  </Text>
                  <Text style={{
                    fontFamily: 'Inter_400Regular',
                    fontSize: 14,
                    color: constants.secondaryText,
                    lineHeight: 18
                  }}>
                    {topic.description}
                  </Text>
                </View>
                <Feather name="chevron-right" size={16} color={constants.secondaryText} />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});