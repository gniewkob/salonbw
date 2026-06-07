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

export default function TrustStrip() {
    const { T } = useLanguage();

    return (
        <section
            aria-label="Marki partnerskie"
            style={{ background: 'var(--brand-warm-bg-2)', borderTop: '1px solid var(--brand-warm-border)', borderBottom: '1px solid var(--brand-warm-border)' }}
        >
            <div className="container mx-auto px-4 md:px-8 py-8 md:py-10">
                <p
                    className="text-center text-xs uppercase mb-7"
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
