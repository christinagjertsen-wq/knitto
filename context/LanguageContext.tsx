import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations, Language, T } from '@/i18n/translations';

const STORAGE_KEY = 'app_language';

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: T;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: 'no',
  setLanguage: () => {},
  t: translations.no,
});

export function useLanguage() {
  return useContext(LanguageContext);
}

export function useT(): T {
  return useContext(LanguageContext).t;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('no');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(val => {
      if (val === 'no' || val === 'en') setLanguageState(val);
    });
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    AsyncStorage.setItem(STORAGE_KEY, lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translations[language] }}>
      {children}
    </LanguageContext.Provider>
  );
}
