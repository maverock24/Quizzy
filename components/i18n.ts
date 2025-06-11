import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { Platform } from 'react-native';
import * as RNLocalize from 'react-native-localize';
import de from './locales/de.json';
import en from './locales/en.json';
import fi from './locales/fi.json';

function getInitialLanguage() {
  // SSR-safe: if typeof window === 'undefined', we're on the server
  if (typeof window === 'undefined') {
    return 'en';
  }
  if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
    const lang =
      navigator.language ||
      (navigator.languages && navigator.languages[0]) ||
      'en';
    if (lang.startsWith('de')) return 'de';
    if (lang.startsWith('fi')) return 'fi';
    return 'en';
  } else {
    const locales = RNLocalize.getLocales();
    if (locales && locales.length > 0) {
      const lang = locales[0].languageCode;
      if (lang.startsWith('de')) return 'de';
      if (lang.startsWith('fi')) return 'fi';
      return 'en';
    }
    return 'en';
  }
}

i18n.use(initReactI18next).init({
  lng: getInitialLanguage(),
  fallbackLng: 'en',
  resources: {
    en: { translation: en },
    de: { translation: de },
    fi: { translation: fi },
  },
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
