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

export function getGreeting(firstName: string, t: T): string {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  const name = firstName.trim();
  const suffix = name ? ` ${name}` : '';

  if (day === 6) return `${t.greeting.saturday}${suffix}`;
  if (day === 0) return `${t.greeting.sunday}${suffix}`;
  if (hour >= 5 && hour < 11) return `${t.greeting.morning}${suffix}`;
  if (hour >= 11 && hour < 13) return `${t.greeting.midday}${suffix}`;
  if (hour >= 13 && hour < 18) return `${t.greeting.afternoon}${suffix}`;
  if (hour >= 18 && hour < 23) return `${t.greeting.evening}${suffix}`;
  return `${t.greeting.night}${suffix}`;
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
