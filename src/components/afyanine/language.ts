"use client";
import { useEffect, useSyncExternalStore } from "react";
import { languageSnapshot, languageServerSnapshot, setLanguage, subscribeLanguage, type Language } from "./language-store";
import { EN, SW } from "./translations";

export function translate(text: string, language: Language) {
  return language === "SW" ? SW[text] ?? EN[text] ?? text : EN[text] ?? text;
}
export function useLanguage() {
  const language = useSyncExternalStore(subscribeLanguage, languageSnapshot, languageServerSnapshot);
  useEffect(() => { document.documentElement.lang = language === "SW" ? "sw" : "en"; }, [language]);
  return { language, setLanguage, t: (text: string) => translate(text, language), locale: language === "SW" ? "sw-KE" : "en-KE" };
}
