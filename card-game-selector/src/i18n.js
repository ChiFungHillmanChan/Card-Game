import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enTranslation from './locales/en/translation.json';
import frTranslation from './locales/fr/translation.json';
import zhTranslation from './locales/zh/translation.json';
import zhHantTranslation from './locales/zh-Hant/translation.json';

const resources = {
  en: {
    translation: enTranslation
  },
  fr: {
    translation: frTranslation
  },
  zh: {
    translation: zhTranslation
  },
  'zh-Hant': {
    translation: zhHantTranslation
  }
};

i18n
  // detect user language
  .use(LanguageDetector)
  // pass the i18n instance to react-i18next
  .use(initReactI18next)
  // init i18next
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,

    // language detection options
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },

    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },

    // supported languages
    supportedLngs: ['en', 'fr', 'zh', 'zh-Hant'],
    
    // clean code on production
    cleanCode: true,
  });

export default i18n;