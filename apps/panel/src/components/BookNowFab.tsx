'use client';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { Route } from 'next';
import { trackEvent } from '@/utils/analytics';

export default function BookNowFab() {
    const router = useRouter();
    const path = router.pathname || '/';
    const hidden =
        path.startsWith('/dashboard') ||
        path.startsWith('/auth') ||
        path.startsWith('/appointments');

    if (hidden) return null;

    return (
        <div className="position-fixed bottom-4 right-4">
            <Link
                href={'/appointments' as Route}
                prefetch={false}
                onClick={() => trackEvent('begin_checkout', { cta: 'fab' })}
                className="px-3 py-2 rounded-circle shadow-lg bg-primary bg-opacity-10 text-white fw-semibold"
                aria-label="Book an appointment"
            >
                Book Now
            </Link>
        </div>
    );
}
