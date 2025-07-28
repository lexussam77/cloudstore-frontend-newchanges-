import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';
import Feather from 'react-native-vector-icons/Feather';



export default function PrivacyPolicyScreen({ navigation }) {
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
          contentContainerStyle={{ paddingBottom: 80, paddingTop: 8, paddingHorizontal: 16 }}
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
              <Feather name="shield" size={32} color={constants.accent} />
            </View>
            <Text style={{
              fontFamily: 'Inter_700Bold',
              fontSize: 26,
              color: constants.primaryText,
              letterSpacing: 0.2,
              textAlign: 'center'
            }}>
              Privacy Policy
            </Text>
            <Text style={{
              fontFamily: 'Inter_400Regular',
              fontSize: 15,
              color: constants.secondaryText,
              marginTop: 6,
              textAlign: 'center',
              maxWidth: 320
            }}>
              Your privacy and data protection are our priority.
            </Text>
          </View>
          {/* Privacy Policy Sections */}
          {[{
            header: null,
            text: 'Your privacy is important to us. This Privacy Policy explains how CloudStore collects, uses, and protects your information.',
            icon: 'info'
          },
          {
            header: '1. What We Collect',
            text: 'We collect your name, email, and files you upload. We may also collect usage data to improve our service.',
            icon: 'database'
          },
          {
            header: '2. How We Use Your Data',
            text: 'We use your data to provide and improve CloudStore, communicate with you, and keep your account secure. We do not sell your personal information.',
            icon: 'settings'
          },
          {
            header: '3. Your Rights',
            text: 'You can access, update, or delete your data at any time. Contact us to exercise your rights.',
            icon: 'user-check'
          },
          {
            header: '4. Security',
            text: 'We use industry-standard security to protect your data. However, no system is 100% secure.',
            icon: 'lock'
          },
          {
            header: '5. Contact',
            text: 'If you have questions, contact us at privacy@cloudstore.com.',
            icon: 'mail'
          }
          ].map((section, idx) => (
            <View
              key={idx}
              style={{
                backgroundColor: constants.glassBg,
                borderRadius: 16,
                padding: 20,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: constants.glassBorder,
                flexDirection: 'row',
                alignItems: 'flex-start',
              }}
            >
              <View style={{
                backgroundColor: constants.accent + '20',
                borderRadius: 12,
                padding: 12,
                marginRight: 16,
                marginTop: 2,
              }}>
                <Feather name={section.icon} size={18} color={constants.accent} />
              </View>
              <View style={{ flex: 1 }}>
                {section.header && (
                  <Text style={{
                    fontFamily: 'Inter_700Bold',
                    fontSize: 17,
                    color: constants.primaryText,
                    marginBottom: 8
                  }}>
                    {section.header}
                  </Text>
                )}
                <Text style={{
                  fontFamily: 'Inter_400Regular',
                  fontSize: 15,
                  color: constants.secondaryText,
                  lineHeight: 22
                }}>
                  {section.text}
                </Text>
              </View>
            </View>
          ))}
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