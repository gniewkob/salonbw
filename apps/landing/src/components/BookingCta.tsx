'use client';
import { useState } from 'react';
import Image from 'next/image';
import BookingModal from '@/components/BookingModal';
import { BUSINESS_INFO } from '@/config/content';
import { useLanguage } from '@/contexts/LanguageContext';

export default function BookingCta() {
    const [open, setOpen] = useState(false);
    const { T } = useLanguage();
    const b = T.bookingCta;

    return (
        <section className="booking-cta-section" aria-label={T.nav.booking}>
            <Image
                src="/images/hero/DSC_9583.jpg"
                alt=""
                aria-hidden
                fill
                priority={false}
                style={{ objectFit: 'cover', objectPosition: 'center 40%' }}
                sizes="100vw"
            />
            <div className="grain-overlay" aria-hidden="true" />
            <div className="booking-cta-section__overlay" aria-hidden="true" />

            <div className="booking-cta-section__content">
                <span className="booking-cta-section__eyebrow">{b.eyebrow}</span>
                <h2 className="booking-cta-section__heading">
                    {b.headingLine1}<br />
                    {b.headingLine2}<br />
                    <em>{b.headingLine3}</em>
                </h2>
                <p className="booking-cta-section__sub">
                    {BUSINESS_INFO.address.city} · {BUSINESS_INFO.address.street} · {b.since}
                </p>
                <button
                    onClick={() => setOpen(true)}
                    className="split-hero__cta-primary"
                    aria-label={T.nav.booking}
                >
                    {T.nav.booking}
                </button>
            </div>

            <BookingModal open={open} onClose={() => setOpen(false)} />
        </section>
    );
}
