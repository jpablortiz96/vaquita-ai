"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { dictionaries, type Locale, type TranslationKey } from "./dictionaries";

interface I18nContextValue {
    locale: Locale;
    setLocale: (l: Locale) => void;
    t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = "vaquita-locale";

function detectInitialLocale(): Locale {
    if (typeof window === "undefined") return "es";
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored === "es" || stored === "en") return stored;
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith("en")) return "en";
    return "es";
}

export function I18nProvider({ children }: { children: ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>("es");

    useEffect(() => {
        setLocaleState(detectInitialLocale());
    }, []);

    const setLocale = (l: Locale) => {
        setLocaleState(l);
        if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_KEY, l);
        }
    };

    const t = (key: TranslationKey): string => {
        const dict = dictionaries[locale];
        const fallback = dictionaries.es;
        return dict[key] ?? fallback[key] ?? key;
    };

    return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>;
}

export function useT() {
    const ctx = useContext(I18nContext);
    if (!ctx) {
        // Fallback during SSR or before provider mounts
        return {
            locale: "es" as Locale,
            setLocale: () => {},
            t: (key: TranslationKey) => dictionaries.es[key] ?? key,
        };
    }
    return ctx;
}
