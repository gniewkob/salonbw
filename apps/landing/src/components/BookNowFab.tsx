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

    const panelAppointments = getPanelUrl('/appointments');

    return (
        <div className="fixed bottom-4 right-4 z-50 md:hidden">
            <a
                href={panelAppointments}
                onClick={() => trackEvent('begin_checkout', { cta: 'fab' })}
                className="px-4 py-3 rounded-full shadow-lg bg-blue-600 text-white font-semibold"
                aria-label="Book an appointment"
            >
                Book Now
            </a>
        </div>
    );
}
