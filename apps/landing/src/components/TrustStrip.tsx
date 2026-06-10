import type { CSSProperties } from 'react';
import { PARTNER_BRANDS } from '@/config/content';
import { useLanguage } from '@/contexts/LanguageContext';

const BRAND_STYLES: Record<string, CSSProperties> = {
    'Olaplex':            { fontFamily: "var(--font-open-sans), sans-serif", fontWeight: 700, letterSpacing: '0.08em', fontSize: '0.82rem' },
    'Nioxin':             { fontFamily: "var(--font-open-sans), sans-serif", fontWeight: 600, letterSpacing: '0.14em', fontSize: '0.78rem' },
    'Wella':              { fontFamily: "var(--font-playfair), serif",       fontWeight: 700, letterSpacing: '0.06em', fontSize: '0.9rem' },
    'System Professional':{ fontFamily: "var(--font-open-sans), sans-serif", fontWeight: 400, letterSpacing: '0.10em', fontSize: '0.72rem' },
    'Kerastase':          { fontFamily: "var(--font-playfair), serif",       fontStyle: 'italic', fontWeight: 400, letterSpacing: '0.04em', fontSize: '0.92rem' },
};

const DISPLAY_NAMES: Record<string, string> = {
    'Kerastase': 'Kérastase',
};

const STAT_NUMBERS = ['15', '3 000', '4.9', '30'];

/**
 * Single social-proof band: salon stats + partner brands.
 * Consolidates the former StatsBar + TrustStrip + GoldTickerStrip trio
 * (2026-06 UX audit: one credibility strip, content visible without JS).
 */
export default function TrustStrip() {
    const { T } = useLanguage();

    return (
        <section
            aria-label="Marki partnerskie i statystyki salonu"
            style={{ background: 'var(--brand-warm-bg-2)', borderTop: '1px solid var(--brand-warm-border)', borderBottom: '1px solid var(--brand-warm-border)' }}
        >
            <div className="container mx-auto px-4 md:px-8 py-10 md:py-12">
                <dl className="flex flex-wrap justify-center gap-x-12 gap-y-6 md:gap-x-20 mb-9">
                    {T.stats.map((stat, i) => (
                        <div key={stat.label} className="text-center">
                            <dt className="sr-only">{stat.label}</dt>
                            <dd style={{ margin: 0 }}>
                                <span
                                    className="block"
                                    style={{
                                        fontFamily: 'var(--font-playfair), serif',
                                        fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
                                        fontWeight: 700,
                                        color: 'var(--brand-warm-ink)',
                                        lineHeight: 1.1,
                                    }}
                                >
                                    {STAT_NUMBERS[i]}{stat.suffix}
                                </span>
                                <span
                                    className="block text-xs uppercase mt-1"
                                    style={{
                                        color: 'var(--brand-warm-label)',
                                        letterSpacing: '0.12em',
                                        fontFamily: 'var(--font-open-sans), sans-serif',
                                    }}
                                >
                                    {stat.label}
                                </span>
                            </dd>
                        </div>
                    ))}
                </dl>

                <div
                    className="mx-auto mb-7"
                    style={{ width: '40px', height: '1px', background: 'var(--brand-warm-border)' }}
                />

                <p
                    className="text-center text-xs uppercase mb-6"
                    style={{ color: 'var(--brand-warm-label)', letterSpacing: '0.12em', fontFamily: "var(--font-open-sans), sans-serif" }}
                >
                    {T.trust.label}
                </p>
                <div className="flex flex-wrap justify-center items-center gap-8 md:gap-14">
                    {PARTNER_BRANDS.map(brand => (
                        <span
                            key={brand}
                            style={{ color: 'var(--brand-warm-secondary)', textTransform: 'uppercase', ...BRAND_STYLES[brand] }}
                        >
                            {DISPLAY_NAMES[brand] ?? brand}
                        </span>
                    ))}
                </div>
            </div>
        </section>
    );
}
