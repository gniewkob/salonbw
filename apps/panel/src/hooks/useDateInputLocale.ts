import { useEffect, useState } from 'react';
import {
    dateInputLocales,
    normalizeDateInputLanguage,
    type DateInputLanguage,
} from '@/utils/dateInputLocale';

/**
 * The panel currently renders with <html lang="pl">.
 * A future language switch can update that attribute without replacing
 * picker components. Explicit `language` always wins when provided.
 * Browser language is used only if the app has not declared its language.
 */
export function useDateInputLocale(language?: string | null) {
    const [resolvedLanguage, setResolvedLanguage] = useState<DateInputLanguage>(
        () => normalizeDateInputLanguage(language),
    );

    useEffect(() => {
        const syncLanguage = () => {
            const declared = document.documentElement.lang.trim();
            const requested =
                language || declared || navigator.language || 'pl';
            setResolvedLanguage(normalizeDateInputLanguage(requested));
        };

        syncLanguage();
        const observer = new MutationObserver(syncLanguage);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['lang'],
        });
        return () => observer.disconnect();
    }, [language]);

    return {
        language: resolvedLanguage,
        locale: dateInputLocales[resolvedLanguage],
    };
}
