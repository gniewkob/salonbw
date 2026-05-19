'use client';
import { getPanelUrl } from '@/utils/panelUrl';
import { BUSINESS_INFO } from '@/config/content';

export interface BookingService {
    id: number;
    name: string;
    priceLabel: string;
    duration: string;
}

interface BookingModalProps {
    open: boolean;
    onClose: () => void;
    service?: BookingService;
}

export default function BookingModal({ open, onClose, service }: BookingModalProps) {
    if (!open) return null;

    const redirect = service
        ? `/calendar?newService=${service.id}`
        : '/appointments';
    const href = getPanelUrl(`/auth/login?redirect=${encodeURIComponent(redirect)}`);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)' }}
            onClick={onClose}
        >
            <div
                className="w-full max-w-sm rounded p-8"
                style={{ background: '#0d0d0d', border: '1px solid rgba(197,168,128,0.25)' }}
                onClick={e => e.stopPropagation()}
            >
                <p className="text-xs uppercase mb-1" style={{ color: '#c5a880', letterSpacing: '0.12em' }}>
                    {service ? 'Rezerwacja' : BUSINESS_INFO.name}
                </p>
                <h2 className="text-xl font-semibold mb-1" style={{ color: '#ffffff', fontFamily: "var(--font-playfair), serif" }}>
                    {service ? service.name : 'Umów wizytę'}
                </h2>
                {service ? (
                    <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.45)' }}>
                        {service.priceLabel} · {service.duration}
                    </p>
                ) : (
                    <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.45)' }}>
                        {BUSINESS_INFO.address.city} · {BUSINESS_INFO.hours.mondayFriday}
                    </p>
                )}
                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => {
                            window.open(href, 'salonbw_booking', 'width=480,height=680,scrollbars=yes,resizable=yes');
                            onClose();
                        }}
                        className="block w-full text-center text-xs font-semibold uppercase py-3.5 px-6 transition hover:opacity-90 cursor-pointer"
                        style={{ background: '#c5a880', color: '#0d0d0d', letterSpacing: '0.12em', borderRadius: '2px' }}
                    >
                        Umów wizytę
                    </button>
                    <button
                        onClick={onClose}
                        className="text-xs uppercase text-center py-2 transition hover:opacity-70"
                        style={{ color: 'rgba(255,255,255,0.35)', letterSpacing: '0.10em' }}
                    >
                        Anuluj
                    </button>
                </div>
            </div>
        </div>
    );
}
