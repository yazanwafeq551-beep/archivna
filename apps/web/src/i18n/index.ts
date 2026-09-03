import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ar from "./ar";
import en from "./en";

const savedLang = typeof window !== "undefined" ? localStorage.getItem("archivna-lang") || "ar" : "ar";

i18n.use(initReactI18next).init({
  resources: {
    ar: { translation: ar },
    en: { translation: en },
  },
  lng: savedLang,
  fallbackLng: "ar",
  interpolation: {
    escapeValue: false,
  },
});

if (typeof document !== "undefined") {
  document.documentElement.dir = savedLang === "ar" ? "rtl" : "ltr";
  document.documentElement.lang = savedLang;
}

export default i18n;

export function changeLanguage(lang: string) {
  i18n.changeLanguage(lang);
  localStorage.setItem("archivna-lang", lang);
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  document.documentElement.lang = lang;
}
