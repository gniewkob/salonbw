'use client';
import { useRouter } from 'next/router';
import { trackEvent } from '@/utils/analytics';
import { getPanelUrl } from '@/utils/panelUrl';

export default function BookNowFab() {
    const router = useRouter();
    const path = router.pathname || '/';
    const hidden =
        path.startsWith('/dashboard') ||
        path.startsWith('/auth') ||
        path.startsWith('/appointments');

    if (hidden) return null;

    // Booking requires login - redirect to panel with return URL
    const bookingUrl = getPanelUrl(
        `/auth/login?redirect=${encodeURIComponent('/appointments')}`
    );

    return (
        <div className="fixed bottom-4 right-4 z-50 md:hidden">
            <a
                href={bookingUrl}
                onClick={() => trackEvent('begin_checkout', { cta: 'fab' })}
                className="btn-gold px-5 py-3.5 text-xs font-semibold uppercase shadow-lg"
                style={{ color: '#fff', borderRadius: '2px', letterSpacing: '0.14em' }}
                aria-label="Umów wizytę"
            >
                Umów wizytę
            </a>
        </div>
    );
}
