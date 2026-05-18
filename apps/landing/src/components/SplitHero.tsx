'use client';
import Image from 'next/image';
import Link from 'next/link';
import { BUSINESS_INFO } from '@/config/content';
import { getPanelUrl } from '@/utils/panelUrl';

export default function SplitHero() {
    const bookingUrl = getPanelUrl(`/auth/login?redirect=${encodeURIComponent('/appointments')}`);

    return (
        <section className="split-hero" aria-label="Hero">
            {/* Left — black panel */}
            <div className="split-hero__left">
                {/* Film grain overlay */}
                <div className="grain-overlay" aria-hidden="true" />

                {/* Oversized B&W watermark */}
                <span className="split-hero__bw-mark" aria-hidden="true">B&W</span>

                {/* Content */}
                <div className="split-hero__left-content">
                    <p className="split-hero__eyebrow">Akademia Zdrowych Włosów</p>

                    <h1 className="split-hero__heading">
                        <span className="split-hero__heading-line1">Black</span>
                        <span className="split-hero__heading-ampersand">&amp;</span>
                        <span className="split-hero__heading-line2">White</span>
                    </h1>

                    <p className="split-hero__tagline">
                        Salon, gdzie każdy detal ma znaczenie.<br />
                        Włosy to Twoja korona.
                    </p>

                    <div className="split-hero__cta-group">
                        <a href={bookingUrl} className="split-hero__cta-primary">
                            {BUSINESS_INFO.booking.text}
                        </a>
                        <Link href="/services" className="split-hero__cta-secondary">
                            Odkryj usługi
                        </Link>
                    </div>

                    {/* Location pill */}
                    <div className="split-hero__meta">
                        <span className="split-hero__meta-dot" />
                        <span>{BUSINESS_INFO.address.city} · od {new Date().getFullYear() - 2011} lat</span>
                    </div>
                </div>

                {/* Diagonal clip */}
                <div className="split-hero__diagonal" aria-hidden="true" />
            </div>

            {/* Right — photo panel */}
            <div className="split-hero__right">
                <Image
                    src="/images/hero/slider1.jpg"
                    alt="Wnętrze salonu Black & White"
                    fill
                    priority
                    style={{ objectFit: 'cover', objectPosition: 'center' }}
                    sizes="50vw"
                />
                {/* Gradient to blend with diagonal */}
                <div className="split-hero__right-overlay" aria-hidden="true" />

                {/* Floating card */}
                <div className="split-hero__float-card">
                    <p className="split-hero__float-label">Godziny otwarcia</p>
                    <p className="split-hero__float-hours">Pn–Pt <strong>{BUSINESS_INFO.hours.mondayFriday}</strong></p>
                    <p className="split-hero__float-hours">Sob <strong>{BUSINESS_INFO.hours.saturday}</strong></p>
                    <a href={`tel:${BUSINESS_INFO.contact.phone.replace(/\s/g, '')}`} className="split-hero__float-phone">
                        {BUSINESS_INFO.contact.phone}
                    </a>
                </div>
            </div>

            {/* Scroll indicator */}
            <div className="split-hero__scroll-hint" aria-hidden="true">
                <span>Scroll</span>
                <div className="split-hero__scroll-line" />
            </div>
        </section>
    );
}
