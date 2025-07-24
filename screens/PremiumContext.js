import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PremiumContext = createContext();

export function PremiumProvider({ children }) {
  const [isPremium, setIsPremium] = useState(false);
  const [premiumPlan, setPremiumPlan] = useState(null);

  useEffect(() => {
    // Load premium status from AsyncStorage on mount
    (async () => {
      const stored = await AsyncStorage.getItem('premiumStatus');
      if (stored) {
        const { isPremium, premiumPlan } = JSON.parse(stored);
        setIsPremium(isPremium);
        setPremiumPlan(premiumPlan);
      }
    })();
  }, []);

  const upgradeToPremium = async (plan, network, phone) => {
    setIsPremium(true);
    setPremiumPlan({ ...plan, network, phone });
    await AsyncStorage.setItem('premiumStatus', JSON.stringify({ isPremium: true, premiumPlan: { ...plan, network, phone } }));
  };

  const resetPremium = async () => {
    setIsPremium(false);
    setPremiumPlan(null);
    await AsyncStorage.removeItem('premiumStatus');
  };

  return (
    <PremiumContext.Provider value={{ isPremium, premiumPlan, upgradeToPremium, resetPremium }}>
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium() {
  return useContext(PremiumContext);
} 