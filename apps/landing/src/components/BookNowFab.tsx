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

    if (hidden) return null;

    return (
        <>
            <div
                className="fixed right-4 z-50 md:hidden"
                style={{
                    bottom: 'max(1rem, env(safe-area-inset-bottom))',
                    opacity: footerVisible ? 0 : 1,
                    transform: footerVisible
                        ? 'translateY(0.75rem)'
                        : 'translateY(0)',
                    pointerEvents: footerVisible ? 'none' : 'auto',
                    transition: 'opacity 0.25s ease, transform 0.25s ease',
                }}
                aria-hidden={footerVisible}
            >
                <button
                    type="button"
                    onClick={() => {
                        trackEvent('begin_checkout', { cta: 'fab' });
                        setModalOpen(true);
                    }}
                    className="btn-silver px-5 py-3.5 text-xs font-semibold uppercase shadow-lg"
                    style={{ borderRadius: '2px', letterSpacing: '0.14em' }}
                    aria-label={T.nav.booking}
                    tabIndex={footerVisible ? -1 : 0}
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
