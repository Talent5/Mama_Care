import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import nd from './locales/nd.json';
import sn from './locales/sn.json';

const LANGUAGE_DETECTOR = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lng: string) => void) => {
    try {
      const savedLanguage = await AsyncStorage.getItem('userLanguage');
      callback(savedLanguage || 'en');
    } catch {
      callback('en');
    }
  },
  init: () => {},
  cacheUserLanguage: async (lng: string) => {
    try {
      await AsyncStorage.setItem('userLanguage', lng);
    } catch (error) {
      console.log('Error saving language', error);
    }
  },
};

i18n
  .use(LANGUAGE_DETECTOR)
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v4',
    fallbackLng: 'en',
    debug: false,
    resources: {
      en: { translation: en },
      sn: { translation: sn },
      nd: { translation: nd },
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
