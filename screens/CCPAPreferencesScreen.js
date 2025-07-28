import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';
import Feather from 'react-native-vector-icons/Feather';



export default function CCPAPreferencesScreen({ navigation }) {
  const { theme, constants } = useTheme();
  let [fontsLoaded] = useFonts({ Inter_400Regular, Inter_700Bold });
  if (!fontsLoaded) return null;

  const ccpaActions = [
    {
      title: 'Request My Data',
      description: 'Get a copy of all personal information we have about you',
      icon: 'download',
      action: () => console.log('Request data')
    },
    {
      title: 'Delete My Data',
      description: 'Request permanent deletion of your personal information',
      icon: 'trash-2',
      action: () => console.log('Delete data')
    },
    {
      title: 'Do Not Sell My Info',
      description: 'Opt out of the sale of your personal information',
      icon: 'shield-off',
      action: () => console.log('Opt out')
    }
  ];

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
              backgroundColor: GLASS_BG_DEEP,
              borderRadius: 20,
              padding: 16,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: GLASS_BORDER
            }}>
              <Feather name="shield" size={32} color={BLUE_ACCENT} />
            </View>
            <Text style={{
              fontFamily: 'Inter_700Bold',
              fontSize: 26,
              color: WHITE,
              letterSpacing: 0.2,
              textAlign: 'center'
            }}>
              CCPA Preferences
            </Text>
            <Text style={{
              fontFamily: 'Inter_400Regular',
              fontSize: 15,
              color: LIGHT_TEXT,
              marginTop: 6,
              textAlign: 'center',
              maxWidth: 320
            }}>
              California Consumer Privacy Act rights and preferences.
            </Text>
          </View>

          {/* Information Card */}
          <View style={{
            backgroundColor: GLASS_BG_DEEP,
            borderRadius: 16,
            padding: 20,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: GLASS_BORDER,
          }}>
            <Text style={{
              fontFamily: 'Inter_700Bold',
              fontSize: 17,
              color: WHITE,
              marginBottom: 12
            }}>
              Your California Privacy Rights
            </Text>
            <Text style={{
              fontFamily: 'Inter_400Regular',
              fontSize: 15,
              color: LIGHT_TEXT,
              lineHeight: 22
            }}>
              As a California resident, you have rights under the California Consumer Privacy Act (CCPA). You can request access to your data, request deletion, or opt out of the sale of your personal information.
            </Text>
          </View>

          {/* Action Cards */}
          {ccpaActions.map((action, idx) => (
            <TouchableOpacity
              key={idx}
              style={{
                backgroundColor: GLASS_BG_DEEP,
                borderRadius: 16,
                padding: 20,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: GLASS_BORDER,
                flexDirection: 'row',
                alignItems: 'center',
              }}
              activeOpacity={0.85}
              onPress={action.action}
            >
              <View style={{
                backgroundColor: BLUE_ACCENT + '20',
                borderRadius: 12,
                padding: 12,
                marginRight: 16,
              }}>
                <Feather name={action.icon} size={20} color={BLUE_ACCENT} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontFamily: 'Inter_700Bold',
                  fontSize: 16,
                  color: WHITE,
                  marginBottom: 4
                }}>
                  {action.title}
                </Text>
                <Text style={{
                  fontFamily: 'Inter_400Regular',
                  fontSize: 14,
                  color: LIGHT_TEXT,
                  lineHeight: 18
                }}>
                  {action.description}
                </Text>
              </View>
              <Feather name="chevron-right" size={16} color={LIGHT_TEXT} />
            </TouchableOpacity>
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