'use client';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { trackEvent } from '@/utils/analytics';
import BookingModal from '@/components/BookingModal';

export default function BookNowFab() {
    const router = useRouter();
    const path = router.pathname || '/';
    const hidden =
        path.startsWith('/dashboard') ||
        path.startsWith('/auth') ||
        path.startsWith('/appointments');

    const [modalOpen, setModalOpen] = useState(false);

    if (hidden) return null;

    return (
        <>
            <div className="fixed bottom-4 right-4 z-50 md:hidden">
                <button
                    onClick={() => { trackEvent('begin_checkout', { cta: 'fab' }); setModalOpen(true); }}
                    className="btn-gold px-5 py-3.5 text-xs font-semibold uppercase shadow-lg"
                    style={{ color: '#fff', borderRadius: '2px', letterSpacing: '0.14em' }}
                    aria-label="Umów wizytę"
                >
                    Umów wizytę
                </button>
            </div>
            <BookingModal open={modalOpen} onClose={() => setModalOpen(false)} />
        </>
    );
}
