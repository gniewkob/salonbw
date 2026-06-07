import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Language } from '@/i18n/translations';
import t, { type Translations } from '@/i18n/translations';

interface LanguageContextValue {
    lang: Language;
    setLang: (l: Language) => void;
    T: Translations;
}

const LanguageContext = createContext<LanguageContextValue>({
    lang: 'pl',
    setLang: () => {},
    T: t.pl as unknown as Translations,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [lang, setLangState] = useState<Language>('pl');

    useEffect(() => {
        const stored = localStorage.getItem('lang') as Language | null;
        if (stored && (stored === 'pl' || stored === 'en' || stored === 'de')) {
            setLangState(stored);
        }
    }, []);

    const setLang = (l: Language) => {
        setLangState(l);
        localStorage.setItem('lang', l);
    };

    return (
        <LanguageContext.Provider value={{ lang, setLang, T: t[lang] as unknown as Translations }}>
            {children}
        </LanguageContext.Provider>
    );
}

export const useLanguage = () => useContext(LanguageContext);
