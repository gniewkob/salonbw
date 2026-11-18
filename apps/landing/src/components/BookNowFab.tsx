import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { trackEvent } from '@/utils/analytics';
import BookingModal from '@/components/BookingModal';
import { useLanguage } from '@/contexts/LanguageContext';

export default function BookNowFab() {
    const router = useRouter();
    const { T } = useLanguage();
    const path = router.pathname || '/';
    const isLegalDocument = [
        '/policy',
        '/privacy',
        '/data-deletion',
    ].includes(path);
    const hidden =
        path.startsWith('/dashboard') ||
        path.startsWith('/auth') ||
        path.startsWith('/appointments') ||
        isLegalDocument;

    const [modalOpen, setModalOpen] = useState(false);
    // Hide the FAB once the footer scrolls into view so it never overlaps the
    // footer links (legal/nav). Re-attach the observer on every route change
    // because the footer element is recreated per page.
    const [footerVisible, setFooterVisible] = useState(false);
    // Also hide while the page's own booking CTA (data-booking-cta) is on
    // screen, so the same action never shows twice (e.g. over the hero).
    const [pageCtaVisible, setPageCtaVisible] = useState(false);

    useEffect(() => {
        if (hidden || typeof IntersectionObserver === 'undefined') return;
        // Target the site footer specifically — NOT any <footer> (blockquote
        // cites use <footer> too and appear earlier in the DOM).
        const footers = document.querySelectorAll('footer');
        const footer =
            document.getElementById('site-footer') ??
            footers[footers.length - 1];
        if (!footer) return;
        const observer = new IntersectionObserver(
            ([entry]) => setFooterVisible(entry?.isIntersecting ?? false),
            { threshold: 0 },
        );
        observer.observe(footer);
        return () => observer.disconnect();
    }, [path, hidden]);

    useEffect(() => {
        setPageCtaVisible(false);
        if (hidden || typeof IntersectionObserver === 'undefined') return;
        const ctas = document.querySelectorAll('[data-booking-cta]');
        if (!ctas.length) return;
        const onScreen = new Set<Element>();
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) onScreen.add(entry.target);
                    else onScreen.delete(entry.target);
                }
                setPageCtaVisible(onScreen.size > 0);
            },
            { threshold: 0 },
        );
        ctas.forEach((cta) => observer.observe(cta));
        return () => observer.disconnect();
    }, [path, hidden]);

    if (hidden) return null;
    const concealed = footerVisible || pageCtaVisible;

    return (
        <>
            <div
                className="fixed right-4 z-50 md:hidden"
                style={{
                    bottom: 'max(1rem, env(safe-area-inset-bottom))',
                    opacity: concealed ? 0 : 1,
                    transform: concealed
                        ? 'translateY(0.75rem)'
                        : 'translateY(0)',
                    pointerEvents: concealed ? 'none' : 'auto',
                    transition: 'opacity 0.25s ease, transform 0.25s ease',
                }}
                aria-hidden={concealed}
            >
                <button
                    type="button"
                    onClick={() => {
                        trackEvent('begin_checkout', { cta: 'fab' });
                        setModalOpen(true);
                    }}
                    className="bw-btn bw-btn--primary shadow-lg"
                    aria-label={T.nav.booking}
                    tabIndex={concealed ? -1 : 0}
                >
                    {T.nav.booking}
                </button>
            </div>
            <BookingModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
            />
        </>
    );
}
