'use client';
import { useState } from 'react';
import Image from 'next/image';
import BookingModal from '@/components/BookingModal';
import { BUSINESS_INFO } from '@/config/content';

export default function BookingCta() {
    const [open, setOpen] = useState(false);

    return (
        <section className="booking-cta-section" aria-label="Umów wizytę">
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
                <span className="booking-cta-section__eyebrow">Umów się już dziś</span>
                <h2 className="booking-cta-section__heading">
                    Twoje włosy<br />
                    zasługują na to,<br />
                    co <em>najlepsze.</em>
                </h2>
                <p className="booking-cta-section__sub">
                    {BUSINESS_INFO.address.city} · {BUSINESS_INFO.address.street} · od 2011 roku
                </p>
                <button
                    onClick={() => setOpen(true)}
                    className="split-hero__cta-primary"
                    aria-label="Umów wizytę"
                >
                    {BUSINESS_INFO.booking.text}
                </button>
            </div>

            <BookingModal open={open} onClose={() => setOpen(false)} />
        </section>
    );
}
