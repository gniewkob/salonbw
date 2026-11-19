import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
    ReactNode,
} from 'react';
import type { Language } from '@/i18n/translations';
import { pl, type Translations } from '@/i18n/translations';

interface LanguageContextValue {
    lang: Language;
    setLang: (l: Language) => void;
    T: Translations;
}

const PL = pl as unknown as Translations;

/**
 * Polish ships in the first bundle; English and German are separate chunks
 * fetched only when a visitor picks them (or has picked them before), so a
 * first visit does not download and parse two unused dictionaries.
 */
function loadDictionary(l: Language): Promise<Translations> {
    if (l === 'en') return import('@/i18n/translations.en').then((m) => m.default);
    if (l === 'de') return import('@/i18n/translations.de').then((m) => m.default);
    return Promise.resolve(PL);
}

const LanguageContext = createContext<LanguageContextValue>({
    lang: 'pl',
    setLang: () => {},
    T: PL,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<{ lang: Language; T: Translations }>({
        lang: 'pl',
        T: PL,
    });

    const apply = useCallback((l: Language) => {
        loadDictionary(l)
            .then((T) => setState({ lang: l, T }))
            .catch(() => undefined);
    }, []);

    useEffect(() => {
        const stored = localStorage.getItem('lang') as Language | null;
        if (stored === 'en' || stored === 'de') apply(stored);
    }, [apply]);

    useEffect(() => {
        document.documentElement.lang = state.lang;
    }, [state.lang]);

    const setLang = useCallback(
        (l: Language) => {
            localStorage.setItem('lang', l);
            apply(l);
        },
        [apply],
    );

    return (
        <LanguageContext.Provider value={{ ...state, setLang }}>
            {children}
        </LanguageContext.Provider>
    );
}

export const useLanguage = () => useContext(LanguageContext);
