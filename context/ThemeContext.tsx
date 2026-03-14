import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme as useSystemColorScheme, Platform } from 'react-native';
import Colors from '@/constants/colors';

export type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  themePreference: ThemePreference;
  setThemePreference: (pref: ThemePreference) => void;
  isDark: boolean;
  colors: typeof Colors.light;
}

const ThemeContext = createContext<ThemeContextValue>({
  themePreference: 'system',
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

function useWebDarkMode(): boolean {
  const [webDark, setWebDark] = useState<boolean>(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
    return window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ?? false;
  });

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setWebDark(e.matches);
    mq.addEventListener('change', handler);
    setWebDark(mq.matches);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return webDark;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useSystemColorScheme();
  const webDark = useWebDarkMode();
  const [themePreference, setThemeState] = useState<ThemePreference>('system');

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

  const systemIsDark = Platform.OS === 'web' ? webDark : systemScheme === 'dark';

  const isDark =
    themePreference === 'dark' ? true :
    themePreference === 'light' ? false :
    systemIsDark;

  const colors = isDark ? Colors.dark : Colors.light;

  return (
    <ThemeContext.Provider value={{ themePreference, setThemePreference, isDark, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}
