import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Dimensions, Modal, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeContext';
import { usePremium } from './PremiumContext';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';
import { Text as RNText, TextInput as RNTextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { purchaseStorage } from './api';

// Set Inter font as default for all Text and TextInput
RNText.defaultProps = RNText.defaultProps || {};
RNText.defaultProps.style = [{ fontFamily: 'Inter_400Regular' }];
RNTextInput.defaultProps = RNTextInput.defaultProps || {};
RNTextInput.defaultProps.style = [{ fontFamily: 'Inter_400Regular' }];

const plans = [
  {
    key: 'plus',
    name: 'Plus',
    price: 'GH₵60.00 per month',
    storage: '5GB',
    features: [
      'Use 5GB of encrypted cloud storage',
      'Send big files with Dropbox Transfer',
      'Automatically back up your files',
    ],
  },
  {
    key: 'family',
    name: 'Family',
    price: 'GH₵120.00 per month',
    storage: '10GB',
    features: [
      '10GB of encrypted cloud storage',
      'Up to 6 individual accounts',
      'No matter whose files, everything is private',
    ],
  },
  {
    key: 'professional',
    name: 'Professional',
    price: 'GH₵130.00 per month',
    storage: '20GB',
    features: [
      'Use 20GB of encrypted cloud storage',
      'Access all Plus plan benefits and features',
      'Send big files with Dropbox Transfer',
    ],
  },
];

const { width } = Dimensions.get('window');

const DEEP_BLUE_GRADIENT = ['#0a0f1c', '#12203a', '#1a2a4f'];
const GLASS_BG_DEEP = 'rgba(20,40,80,0.32)';
const GLASS_BORDER = 'rgba(255,255,255,0.10)';

export default function ManagePlanScreen({ navigation, route }) {
  const { theme } = useTheme();
  const [selectedTab, setSelectedTab] = useState(0);
  const flatListRef = useRef();
  const { isPremium, premiumPlan, upgradeToPremium } = usePremium();
  const userEmail = route?.params?.userEmail || '';
  // Do not use refetchProfile from params to avoid non-serializable warning

  // Remove mobile money modal and purchaseStorage logic
  // Keep only the simulated payment modal and logic

  // Simulated payment modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [network, setNetwork] = useState('MTN');
  const [phone, setPhone] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleTryPlan = (plan) => {
    setSelectedPlan(plan);
    setShowModal(true);
    setNetwork('MTN');
    setPhone('');
  };

  const handleSimulatePayment = async () => {
    if (!phone.match(/^[0-9]{10}$/)) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit phone number.');
      return;
    }
    setProcessing(true);
    setTimeout(async () => {
      await upgradeToPremium(selectedPlan, network, phone);
      setProcessing(false);
      setShowModal(false);
      Alert.alert('Success', 'You are now a premium user!');
    }, 1500);
  };

  // Remove all mobile money modal and handleMobilePay logic

  // Add handleScroll function for FlatList
  const handleScroll = (event) => {
    const idx = Math.round(event.nativeEvent.contentOffset.x / (width * 0.85));
    setSelectedTab(idx);
  };

  // Add handleTabPress function for plan tab switching
  const handleTabPress = (idx) => {
    setSelectedTab(idx);
    if (flatListRef.current) {
      flatListRef.current.scrollToIndex({ index: idx });
    }
  };

  let [fontsLoaded] = useFonts({ Inter_400Regular, Inter_700Bold });
  if (!fontsLoaded) return null;

  return (
    <LinearGradient colors={DEEP_BLUE_GRADIENT} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 24, color: theme.primary, textAlign: 'center', marginBottom: 10, marginTop: 32, letterSpacing: 0.2 }}>Choose Your CloudStore Plan</Text>
        <BlurView intensity={70} tint="dark" style={{ borderRadius: 18, marginHorizontal: 18, marginBottom: 12, marginTop: 8, overflow: 'hidden' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
            {plans.map((plan, idx) => (
              <TouchableOpacity
                key={plan.key}
                style={{ flex: 1, paddingVertical: 10, borderBottomWidth: 3, borderBottomColor: selectedTab === idx ? theme.primary : 'transparent', alignItems: 'center', borderRadius: 0 }}
                onPress={() => handleTabPress(idx)}
              >
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: selectedTab === idx ? theme.primary : theme.textSecondary }}>{plan.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </BlurView>
        <FlatList
          ref={flatListRef}
          data={plans}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          keyExtractor={item => item.key}
          contentContainerStyle={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 24, minHeight: 300, paddingHorizontal: (width * 0.075) }}
          snapToInterval={width * 0.85 + 20}
          decelerationRate="fast"
          renderItem={({ item }) => (
            <BlurView intensity={90} tint="dark" style={{ backgroundColor: GLASS_BG_DEEP, borderRadius: 28, borderWidth: 1.5, borderColor: theme.primary, marginHorizontal: 10, padding: 28, shadowColor: theme.shadow, shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 10, width: width * 0.85, overflow: 'hidden' }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 22, color: theme.text, marginBottom: 4 }}>{item.name}</Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 16, color: theme.text, marginBottom: 14 }}>{item.storage} {item.price}</Text>
              <View style={{ marginBottom: 14, width: '100%' }}>
                {item.features.map((f, idx) => (
                  <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={{ fontSize: 16, marginRight: 8, color: theme.primary }}>✔</Text>
                    <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 15, color: theme.text }}>{f}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity style={{ borderRadius: 16, paddingVertical: 14, paddingHorizontal: 32, marginTop: 10, alignItems: 'center', width: '100%', backgroundColor: theme.primary, shadowColor: theme.shadow, shadowOpacity: 0.10, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 }} onPress={() => handleTryPlan(item)}>
                <Text style={{ fontFamily: 'Inter_700Bold', color: theme.textInverse, fontSize: 16, textAlign: 'center', letterSpacing: 0.1 }}>Try free for 30 days</Text>
              </TouchableOpacity>
            </BlurView>
          )}
        />
        {/* Simulated Payment Modal */}
        <Modal visible={showModal} transparent animationType="fade">
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,10,20,0.55)', zIndex: 1 }} />
            <View style={{ backgroundColor: theme.card, borderRadius: 18, padding: 28, maxWidth: '90%', marginHorizontal: 16, alignItems:'center', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 12, elevation: 8, zIndex: 2 }}>
              <View style={{ alignItems: 'center', marginBottom: 10 }}>
                <Text style={{ fontSize: 32, marginBottom: 2 }}>🎁</Text>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 22, color: theme.primary, marginBottom: 2 }}>Try Free for 30 Days</Text>
              </View>
              <Text style={{ marginBottom: 8, color: theme.text, fontFamily: 'Inter_400Regular', fontSize: 15, textAlign: 'center' }}>Enjoy all premium features for 30 days. No charge until your trial ends. You can cancel anytime.</Text>
              {/* Mobile Money Number Input */}
              <TextInput
                style={{ width: '100%', borderWidth: 1.5, borderColor: theme.primary, borderRadius: 10, padding: 14, marginBottom: 8, color: theme.text, backgroundColor: theme.input, fontSize: 16, fontFamily: 'Inter_400Regular', letterSpacing: 1 }}
                placeholder="0551234567"
                placeholderTextColor={theme.textSecondary}
                keyboardType="number-pad"
                value={phone}
                onChangeText={setPhone}
                maxLength={10}
              />
              <TouchableOpacity style={{ backgroundColor: theme.primary, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 40, marginBottom: 10, width: '100%', alignItems:'center', shadowColor: theme.shadow, shadowOpacity: 0.10, shadowRadius: 8, elevation: 2 }} onPress={handleSimulatePayment} disabled={processing}>
                {processing ? <ActivityIndicator color={theme.textInverse} /> : <Text style={{ fontFamily: 'Inter_700Bold', color: theme.textInverse, fontSize: 16, letterSpacing: 0.5 }}>Pay Now</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={{ color: theme.primary, marginTop: 8, fontFamily: 'Inter_700Bold', fontSize: 15 }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        <BlurView intensity={60} tint="dark" style={{ borderRadius: 14, marginHorizontal: 32, marginTop: 10, marginBottom: 18, overflow: 'hidden' }}>
          <TouchableOpacity style={{ paddingVertical: 14, alignItems: 'center', width: '100%' }} onPress={() => navigation.goBack()}>
            <Text style={{ fontFamily: 'Inter_700Bold', color: theme.primary, fontSize: 16 }}>Continue with Free Plan</Text>
          </TouchableOpacity>
        </BlurView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginTop: 10,
    marginBottom: 16,
    paddingVertical: 8,
  },
  backArrow: {
    fontSize: 28,
    marginRight: 16,
    fontWeight: 'bold',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginRight: 44, // Compensate for back arrow width to center the title
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    marginTop: 32,
    letterSpacing: 0.2,
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderBottomWidth: 2,
    marginHorizontal: 6,
  },
  tabSelected: {
    borderBottomColor: '#0061FF',
  },
  tabText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  tabTextSelected: {
    color: '#0061FF',
  },
  cardsScroll: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    minHeight: 300,
  },
  card: {
    borderRadius: 22,
    marginHorizontal: 10,
    padding: 22,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 15,
    marginBottom: 14,
  },
  featuresList: {
    marginBottom: 14,
    width: '100%',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  check: {
    fontSize: 16,
    marginRight: 8,
  },
  featureText: {
    fontSize: 15,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bell: {
    fontSize: 18,
    marginRight: 6,
  },
  reminderText: {
    fontSize: 15,
    fontWeight: '500',
  },
  ctaButton: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 10,
    alignItems: 'center',
    width: '100%',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  ctaButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  freePlanButton: {
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignSelf: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 18,
    width: '80%',
    borderWidth: 1,
  },
  freePlanText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 