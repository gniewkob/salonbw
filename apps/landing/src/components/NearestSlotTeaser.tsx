import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || 'https://api.salon-bw.pl';

const LOCALE_MAP: Record<string, string> = {
    pl: 'pl-PL',
    en: 'en-GB',
    de: 'de-DE',
};

/**
 * "Najbliższy wolny termin: czw., 14:30" — friction-reducing teaser fed
 * by the public, anonymized /calendar/nearest-slot endpoint. Renders
 * nothing (not even reserved space inside its own span) on error or
 * when the salon is fully booked, so the hero never shows a broken state.
 */
export default function NearestSlotTeaser() {
    const [slot, setSlot] = useState<Date | null>(null);
    const { T, lang } = useLanguage();

    useEffect(() => {
        let cancelled = false;
        const controller = new AbortController();
        fetch(`${API_BASE_URL}/calendar/nearest-slot`, {
            signal: controller.signal,
        })
            .then((res) => (res.ok ? res.json() : null))
            .then((data: { slot?: string | null } | null) => {
                if (cancelled || !data?.slot) return;
                const parsed = new Date(data.slot);
                if (!Number.isNaN(parsed.getTime())) {
                    setSlot(parsed);
                }
            })
            .catch(() => {
                // teaser is decoration — stay silent
            });
        return () => {
            cancelled = true;
            controller.abort();
        };
    }, []);

    if (!slot) return null;

    const formatted = new Intl.DateTimeFormat(LOCALE_MAP[lang] ?? 'pl-PL', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    }).format(slot);

    return (
        <span>
            {' '}
            · {T.hero.nearestSlot} <strong>{formatted}</strong>
        </span>
    );
}
