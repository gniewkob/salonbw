import { de, enGB, pl } from 'date-fns/locale';

export type DateInputLanguage = 'pl' | 'de' | 'en';

/**
 * Datepicker language follows the active interface language, not the format
 * stored in the API. Unsupported languages fall back to today's Polish UI.
 */
export function normalizeDateInputLanguage(
    language?: string | null,
): DateInputLanguage {
    const prefix = language
        ?.trim()
        .replace(/_/g, '-')
        .split('-')[0]
        .toLowerCase();
    return prefix === 'de' || prefix === 'en' ? prefix : 'pl';
}

export const dateInputLocales = { pl, de, en: enGB } as const;

export const dateInputPlaceholder = {
    pl: { date: 'Wybierz datę', datetime: 'Wybierz datę i godzinę' },
    de: { date: 'Datum wählen', datetime: 'Datum und Uhrzeit wählen' },
    en: { date: 'Choose a date', datetime: 'Choose date and time' },
} as const;
