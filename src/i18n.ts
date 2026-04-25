import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "app_name": "Kandahar University WMS",
      "dashboard": "Dashboard",
      "inventory": "Inventory",
      "procurement": "Procurement",
      "requests": "Requests",
      "receiving": "Receiving",
      "distribution": "Distribution",
      "reports": "Reports",
      "settings": "Settings",
      "logout": "Logout",
      "welcome": "Welcome",
      "search_placeholder": "Search by items, employees, or departments...",
      "stock_summary": "Stock Summary",
      "low_stock": "Low Stock Items",
      "recent_requests": "Recent Requests",
      "lang_en": "English",
      "lang_ps": "Pashto (پښتو)"
    }
  },
  ps: {
    translation: {
      "app_name": "د کندهار پوهنتون ګدام سیستم",
      "dashboard": "داشبورډ",
      "inventory": "موجودي",
      "procurement": "تدارکات",
      "requests": "غوښتنلیکونه",
      "receiving": "ورودات",
      "distribution": "وېش",
      "reports": "راپورونه",
      "settings": "تنظیمات",
      "logout": "وتل",
      "welcome": "ښه راغلاست",
      "search_placeholder": "د توکو، کارکوونکو، یا ډیپارتمنټونو لټون...",
      "stock_summary": "د سټاک خلاصه",
      "low_stock": "کم شوي توکي",
      "recent_requests": "وروستي غوښتنلیکونه",
      "lang_en": "انګلیسي",
      "lang_ps": "پښتو"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
