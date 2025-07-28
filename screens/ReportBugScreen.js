import React from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';

export default function ReportBugScreen({ navigation }) {

  const handleEmail = (type) => {
    let subject = type === 'bug' ? 'Bug Report' : 'Other Complaint';
    let body = type === 'bug' ? 'Describe the bug you encountered:' : 'Describe your complaint:';
    Linking.openURL(`mailto:akombea77@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };
  let [fontsLoaded] = useFonts({ Inter_400Regular, Inter_700Bold });
  if (!fontsLoaded) return null;
  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <View style={{ backgroundColor: '#000000', borderRadius: 20, borderWidth: 1, borderColor: '#333333', padding: 32, alignItems: 'center', width: '100%', maxWidth: 380, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 20 }}>
          <View style={{ backgroundColor: '#1D9BF0', borderRadius: 50, padding: 16, marginBottom: 24 }}>
            <Text style={{ fontSize: 24, color: '#FFFFFF' }}>🐛</Text>
          </View>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 24, color: '#FFFFFF', marginBottom: 8, textAlign: 'center' }}>Report a Bug</Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 16, color: '#8B98A5', marginBottom: 32, textAlign: 'center', lineHeight: 22 }}>Help us improve CloudStore! Choose an option below to send us an email directly.</Text>

          <TouchableOpacity
            style={{ backgroundColor: '#1D9BF0', borderRadius: 20, paddingVertical: 14, paddingHorizontal: 32, marginBottom: 12, width: '100%', alignItems: 'center' }}
            onPress={() => handleEmail('bug')}
            activeOpacity={0.8}
          >
            <Text style={{ color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 16 }}>Report a Bug</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ backgroundColor: '#F91880', borderRadius: 20, paddingVertical: 14, paddingHorizontal: 32, marginBottom: 20, width: '100%', alignItems: 'center' }}
            onPress={() => handleEmail('complaint')}
            activeOpacity={0.8}
          >
            <Text style={{ color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 16 }}>Other Complaint</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ backgroundColor: 'transparent', borderRadius: 20, paddingVertical: 14, paddingHorizontal: 32, alignItems: 'center', borderWidth: 1, borderColor: '#333333' }}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={{ color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 16 }}>Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fafd',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 18,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#444',
    marginBottom: 32,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginBottom: 18,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  backBtn: {
    marginTop: 18,
    alignSelf: 'center',
  },
  backBtnText: {
    color: '#2563eb',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 