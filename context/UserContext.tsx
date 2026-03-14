import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { T } from '@/i18n/translations';

const STORAGE_KEY = 'user_first_name';
const ONBOARDING_KEY = 'onboarding_complete';

interface UserContextValue {
  firstName: string;
  setFirstName: (name: string) => void;
  isLoading: boolean;
  onboardingComplete: boolean;
  completeOnboarding: () => void;
}

const UserContext = createContext<UserContextValue>({
  firstName: '',
  setFirstName: () => {},
  isLoading: true,
  onboardingComplete: false,
  completeOnboarding: () => {},
});

export function useUser() {
  return useContext(UserContext);
}

const NO_QUOTES = [
  'Ull er kjærlighet på pinner',
  'Ett maskefall om gangen',
  'Strikk mer, bekymre deg mindre',
  'Livet er for kort til dårlig garn',
  'Garn healer alt',
  'Masker teller – og det gjør du også',
  'Ull og rolig',
  'Strikk på, livet er kort',
  'God strikking tar tid – og det er verdt det',
  'Hvert maskefall med kjærlighet',
];

const EN_QUOTES = [
  'Wool is love on needles',
  'One stitch at a time',
  'Knit more, worry less',
  'Life is too short for bad yarn',
  'Yarn heals everything',
  'Stitches count — and so do you',
  'Keep calm and knit on',
  'Knit on, life is short',
  'Good knitting takes time — worth every stitch',
  'Every stitch with love',
];

export function getGreeting(firstName: string, t: T): string {
  const isNorwegian = t.greeting.morning === 'God morgen';
  const quotes = isNorwegian ? NO_QUOTES : EN_QUOTES;
  const now = new Date();
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
  return quotes[dayOfYear % quotes.length];
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [firstName, setFirstNameState] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(val => {
      if (val) setFirstNameState(val);
      setIsLoading(false);
    });
    AsyncStorage.getItem(ONBOARDING_KEY).then(val => {
      if (val === 'true') setOnboardingComplete(true);
    });
  }, []);

  const setFirstName = (name: string) => {
    setFirstNameState(name);
    AsyncStorage.setItem(STORAGE_KEY, name);
  };

  const completeOnboarding = () => {
    setOnboardingComplete(true);
    AsyncStorage.setItem(ONBOARDING_KEY, 'true');
  };

  return (
    <UserContext.Provider value={{ firstName, setFirstName, isLoading, onboardingComplete, completeOnboarding }}>
      {children}
    </UserContext.Provider>
  );
}
