import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import zhTW from './locales/zh-TW.json'
import en from './locales/en.json'
import ja from './locales/ja.json'

i18n.use(initReactI18next).init({
  resources: {
    'zh-TW': { translation: zhTW },
    en: { translation: en },
    ja: { translation: ja },
  },
  lng: localStorage.getItem('offerlift-storage')
    ? JSON.parse(localStorage.getItem('offerlift-storage'))?.state?.language || 'zh-TW'
    : 'zh-TW',
  fallbackLng: 'zh-TW',
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
