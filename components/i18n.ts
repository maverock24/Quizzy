import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import de from './locales/de.json';

// Add more languages as needed

i18n.use(initReactI18next).init({
  lng: 'en', // default language
  fallbackLng: 'en',
  resources: {
    en: { translation: en },
    de: { translation: de },
  },
  interpolation: {
    escapeValue: false, // react already safes from xss
  },
});

export default i18n;
