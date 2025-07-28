import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';
import Feather from 'react-native-vector-icons/Feather';

export default function OpenSourceScreen({ navigation }) {
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
              <Feather name="code" size={32} color={constants.accent} />
            </View>
            <Text style={{
              fontFamily: 'Inter_700Bold',
              fontSize: 26,
              color: constants.primaryText,
              letterSpacing: 0.2,
              textAlign: 'center'
            }}>
              Open Source
            </Text>
            <Text style={{
              fontFamily: 'Inter_400Regular',
              fontSize: 15,
              color: constants.secondaryText,
              marginTop: 6,
              textAlign: 'center',
              maxWidth: 320
            }}>
              Third-party software and open source components.
            </Text>
          </View>

          {/* Introduction Card */}
          <View style={{
            backgroundColor: constants.glassBg,
            borderRadius: 16,
            padding: 20,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: constants.glassBorder,
            flexDirection: 'row',
            alignItems: 'flex-start',
          }}>
            <View style={{
              backgroundColor: constants.accent + '20',
              borderRadius: 12,
              padding: 12,
              marginRight: 16,
              marginTop: 2,
            }}>
              <Feather name="heart" size={18} color={constants.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontFamily: 'Inter_700Bold',
                fontSize: 17,
                color: constants.primaryText,
                marginBottom: 8
              }}>
                Built with Open Source
              </Text>
              <Text style={{
                fontFamily: 'Inter_400Regular',
                fontSize: 15,
                color: constants.secondaryText,
                lineHeight: 22
              }}>
                CloudStore is built with the help of open source and third-party software. We are grateful to the open source community!
              </Text>
            </View>
          </View>

          {/* Key Components Card */}
          <View style={{
            backgroundColor: constants.glassBg,
            borderRadius: 16,
            padding: 20,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: constants.glassBorder,
            flexDirection: 'row',
            alignItems: 'flex-start',
          }}>
            <View style={{
              backgroundColor: constants.accent + '20',
              borderRadius: 12,
              padding: 12,
              marginRight: 16,
              marginTop: 2,
            }}>
              <Feather name="package" size={18} color={constants.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontFamily: 'Inter_700Bold',
                fontSize: 17,
                color: constants.primaryText,
                marginBottom: 12
              }}>
                Key Open Source Components
              </Text>
              {[
                'React Native (MIT License)',
                'Expo (MIT License)',
                'react-navigation (MIT License)',
                'react-native-svg (MIT License)',
                'react-native-vector-icons (MIT License)',
                'And many more...'
              ].map((component, idx) => (
                <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <View style={{
                    width: 4,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: constants.accent,
                    marginRight: 12
                  }} />
                  <Text style={{
                    fontFamily: 'Inter_400Regular',
                    fontSize: 14,
                    color: constants.secondaryText
                  }}>
                    {component}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Licenses Card */}
          <View style={{
            backgroundColor: constants.glassBg,
            borderRadius: 16,
            padding: 20,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: constants.glassBorder,
            flexDirection: 'row',
            alignItems: 'flex-start',
          }}>
            <View style={{
              backgroundColor: constants.accent + '20',
              borderRadius: 12,
              padding: 12,
              marginRight: 16,
              marginTop: 2,
            }}>
              <Feather name="file-text" size={18} color={constants.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontFamily: 'Inter_700Bold',
                fontSize: 17,
                color: constants.primaryText,
                marginBottom: 8
              }}>
                Licenses & Attribution
              </Text>
              <Text style={{
                fontFamily: 'Inter_400Regular',
                fontSize: 15,
                color: constants.secondaryText,
                lineHeight: 22
              }}>
                For a full list of dependencies and their licenses, please visit our GitHub repository or contact us at opensource@cloudstore.com.
              </Text>
            </View>
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
