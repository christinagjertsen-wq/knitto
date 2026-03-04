import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'user_first_name';

interface UserContextValue {
  firstName: string;
  setFirstName: (name: string) => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextValue>({
  firstName: '',
  setFirstName: () => {},
  isLoading: true,
});

export function useUser() {
  return useContext(UserContext);
}

export function getGreeting(firstName: string): string {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  const name = firstName.trim();
  const suffix = name ? `, ${name}` : '';

  if (day === 0 || day === 6) return `God helg${suffix}`;
  if (hour >= 5 && hour < 12) return `God morgen${suffix}`;
  if (hour >= 12 && hour < 18) return `God ettermiddag${suffix}`;
  return `God kveld${suffix}`;
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [firstName, setFirstNameState] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(val => {
      if (val) setFirstNameState(val);
      setIsLoading(false);
    });
  }, []);

  const setFirstName = (name: string) => {
    setFirstNameState(name);
    AsyncStorage.setItem(STORAGE_KEY, name);
  };

  return (
    <UserContext.Provider value={{ firstName, setFirstName, isLoading }}>
      {children}
    </UserContext.Provider>
  );
}
