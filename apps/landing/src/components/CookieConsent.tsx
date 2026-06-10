import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getStoredConsent, setConsent } from '@/utils/consent';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Bottom-anchored cookie banner (Consent Mode v2, basic mode).
 * Non-modal: it must not trap focus or block reading the page —
 * the visitor can scroll and decide whenever they want. Until they
 * do, no analytics script loads.
 */
export default function CookieConsent({ onDecision }: { onDecision: (granted: boolean) => void }) {
    const [visible, setVisible] = useState(false);
    const { T } = useLanguage();

    useEffect(() => {
        // Read after mount — localStorage is browser-only and reading it
        // during render would desync SSR markup.
        setVisible(getStoredConsent() === null);
    }, []);

    if (!visible) return null;

    const decide = (granted: boolean) => {
        setConsent(granted ? 'granted' : 'denied');
        setVisible(false);
        onDecision(granted);
    };

    return (
        <section
            aria-label={T.cookies.ariaLabel}
            // z-[60]: must sit above the booking FAB (z-50) — the consent
            // buttons have to stay clickable
            className="fixed bottom-0 left-0 right-0 z-[60] px-4 pb-4"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}
        >
            <div
                className="mx-auto flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-4"
                style={{
                    maxWidth: '720px',
                    background: '#0d0d0d',
                    color: '#ffffff',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '6px',
                    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.18)',
                }}
            >
                <p
                    className="flex-1 text-sm"
                    style={{
                        margin: 0,
                        lineHeight: 1.6,
                        color: 'rgba(255,255,255,0.75)',
                        fontFamily: 'var(--font-open-sans), sans-serif',
                    }}
                >
                    {T.cookies.message}{' '}
                    <Link
                        href="/privacy"
                        style={{
                            color: '#ffffff',
                            textDecoration: 'underline',
                            textUnderlineOffset: '3px',
                        }}
                    >
                        {T.cookies.policyLink}
                    </Link>
                </p>
                <div className="flex gap-3 flex-shrink-0">
                    <button
                        type="button"
                        onClick={() => decide(false)}
                        className="text-xs font-semibold uppercase px-4 focus:outline-none focus:ring-2 focus:ring-[#b4b8be] focus:ring-offset-2 focus:ring-offset-[#0d0d0d]"
                        style={{
                            minHeight: '44px',
                            letterSpacing: '0.12em',
                            background: 'transparent',
                            color: 'rgba(255,255,255,0.75)',
                            border: '1px solid rgba(255,255,255,0.3)',
                            borderRadius: '2px',
                            cursor: 'pointer',
                        }}
                    >
                        {T.cookies.decline}
                    </button>
                    <button
                        type="button"
                        onClick={() => decide(true)}
                        className="btn-silver text-xs font-semibold uppercase px-5 focus:outline-none focus:ring-2 focus:ring-[#b4b8be] focus:ring-offset-2 focus:ring-offset-[#0d0d0d]"
                        style={{
                            minHeight: '44px',
                            letterSpacing: '0.12em',
                            border: 'none',
                            borderRadius: '2px',
                            cursor: 'pointer',
                        }}
                    >
                        {T.cookies.accept}
                    </button>
                </div>
            </div>
        </section>
    );
}
