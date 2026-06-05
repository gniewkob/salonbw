import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BUSINESS_INFO } from '@/config/content';
import { useLanguage } from '@/contexts/LanguageContext';
import BookingModal from '@/components/BookingModal';

export default function SplitHero() {
    const { T } = useLanguage();
    const [modalOpen, setModalOpen] = useState(false);

    return (
        <section className="split-hero" aria-label="Hero">
            {/* Left — black panel */}
            <div className="split-hero__left">
                <div className="grain-overlay" aria-hidden="true" />
                <span className="split-hero__bw-mark" aria-hidden="true">B&W</span>

                <div className="split-hero__left-content">
                    <p className="split-hero__eyebrow">{T.hero.eyebrow}</p>

                    <h1 className="split-hero__heading">
                        <span className="split-hero__heading-line1">Black</span>
                        <span className="split-hero__heading-ampersand">&amp;</span>
                        <span className="split-hero__heading-line2">White</span>
                    </h1>

                    <p className="split-hero__tagline">
                        {T.hero.tagline1}<br />
                        {T.hero.tagline2}
                    </p>

                    <div className="split-hero__cta-group">
                        <button onClick={() => setModalOpen(true)} className="split-hero__cta-primary">
                            {T.nav.booking}
                        </button>
                        <Link href="/services" className="split-hero__cta-secondary">
                            {T.hero.ctaSecondary}
                        </Link>
                    </div>

                    <div className="split-hero__meta">
                        <span className="split-hero__meta-dot" />
                        <span>{T.hero.trustPill}</span>
                    </div>
                </div>

                <div className="split-hero__diagonal" aria-hidden="true" />
            </div>

            {/* Right — photo panel */}
            <div className="split-hero__right">
                <Image
                    src="/images/hero/slider1.jpg"
                    alt={T.hero.imageAlt}
                    fill
                    priority
                    className="hero-img-zoom"
                    style={{ objectFit: 'cover', objectPosition: 'center 30%' }}
                    sizes="50vw"
                />
                <div className="split-hero__gold-tint" aria-hidden="true" />
                <div className="split-hero__right-overlay" aria-hidden="true" />

                <div className="split-hero__float-card">
                    <p className="split-hero__float-label">{T.hero.hoursLabel}</p>
                    <p className="split-hero__float-hours">{T.hours.mondayFriday} <strong>{BUSINESS_INFO.hours.mondayFriday}</strong></p>
                    <p className="split-hero__float-hours">{T.hours.saturday} <strong>{BUSINESS_INFO.hours.saturday}</strong></p>
                    <a href={`tel:${BUSINESS_INFO.contact.phone.replace(/\s/g, '')}`} className="split-hero__float-phone">
                        {BUSINESS_INFO.contact.phone}
                    </a>
                </div>
            </div>

            <div className="split-hero__scroll-hint" aria-hidden="true">
                <span>{T.hero.scroll}</span>
                <div className="split-hero__scroll-line" />
            </div>

            <BookingModal open={modalOpen} onClose={() => setModalOpen(false)} />
        </section>
    );
}
