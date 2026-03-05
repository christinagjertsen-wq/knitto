import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import Colors from '@/constants/colors';

export type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  themePreference: ThemePreference;
  setThemePreference: (pref: ThemePreference) => void;
  isDark: boolean;
  colors: typeof Colors.light;
}

const ThemeContext = createContext<ThemeContextValue>({
  themePreference: 'light',
  setThemePreference: () => {},
  isDark: false,
  colors: Colors.light,
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function useColors() {
  return useContext(ThemeContext).colors;
}

export function useIsDark() {
  return useContext(ThemeContext).isDark;
}

const STORAGE_KEY = 'app_theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useSystemColorScheme();
  const [themePreference, setThemeState] = useState<ThemePreference>('light');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(val => {
      if (val === 'light' || val === 'dark' || val === 'system') {
        setThemeState(val);
      }
    });
  }, []);

  const setThemePreference = (pref: ThemePreference) => {
    setThemeState(pref);
    AsyncStorage.setItem(STORAGE_KEY, pref);
  };

  const isDark =
    themePreference === 'dark' ? true :
    themePreference === 'light' ? false :
    systemScheme === 'dark';

  const colors = isDark ? Colors.dark : Colors.light;

  return (
    <ThemeContext.Provider value={{ themePreference, setThemePreference, isDark, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}
