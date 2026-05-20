import Head from 'next/head';
import Link from 'next/link';
import PublicLayout from '@/components/PublicLayout';
import { getPanelUrl } from '@/utils/panelUrl';
import { useLanguage } from '@/contexts/LanguageContext';

export default function NotFound() {
    const { T } = useLanguage();
    const bookingUrl = getPanelUrl(`/auth/login?redirect=${encodeURIComponent('/appointments')}`);
    return (
        <PublicLayout>
            <Head>
                <title>404 — Nie znaleziono strony | Black & White</title>
                <meta name="robots" content="noindex" />
            </Head>
            <section style={{ minHeight: '100svh', background: 'var(--brand-black)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                <div className="grain-overlay" aria-hidden="true" />
                <span aria-hidden="true" style={{
                    position: 'absolute', fontFamily: 'var(--font-playfair), serif',
                    fontSize: 'clamp(12rem, 30vw, 26rem)', fontWeight: 700,
                    color: 'rgba(255,255,255,0.03)', userSelect: 'none',
                    lineHeight: 1, letterSpacing: '-0.05em',
                }}>404</span>

                <div className="text-center px-6" style={{ position: 'relative', zIndex: 1 }}>
                    <p className="text-xs uppercase mb-6" style={{ color: 'var(--brand-gold)', letterSpacing: '0.28em' }}>Strona nie istnieje</p>
                    <h1 style={{ fontFamily: 'var(--font-playfair), serif', fontSize: 'clamp(2.5rem, 6vw, 5rem)', color: '#fff', lineHeight: 1.1, marginBottom: '1.5rem' }}>
                        Zgubiłaś się?
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.5)', maxWidth: '360px', margin: '0 auto 2.5rem', lineHeight: 1.8 }}>
                        Ta strona nie istnieje, ale nasz salon jest zawsze na miejscu.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link href="/" className="split-hero__cta-primary" style={{ display: 'inline-block', padding: '0.85rem 2rem', fontSize: '0.75rem', letterSpacing: '0.14em', fontWeight: 600, textTransform: 'uppercase' }}>
                            Wróć na stronę główną
                        </Link>
                        <a href={bookingUrl} className="split-hero__cta-secondary" style={{ display: 'inline-block', padding: '0.85rem 2rem', fontSize: '0.75rem', letterSpacing: '0.14em', fontWeight: 600, textTransform: 'uppercase' }}>
                            {T.nav.booking}
                        </a>
                    </div>
                </div>
            </section>
        </PublicLayout>
    );
}
