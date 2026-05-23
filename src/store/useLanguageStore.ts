import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Lang, translations, Translations } from "@/translations";

interface LanguageState {
  language: Lang;
  setLanguage: (lang: Lang) => void;
  t: Translations;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: "es" as Lang,
      t: translations["es"],
      setLanguage: (language: Lang) => {
        set({ language, t: translations[language] });
      },
    }),
    {
      name: "meeple-station-lang",
      partialize: (state) => ({ language: state.language }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.t = translations[state.language];
        }
      },
    }
  )
);
