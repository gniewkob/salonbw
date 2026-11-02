import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import BookingModal from '@/components/BookingModal';
import NearestSlotTeaser from '@/components/NearestSlotTeaser';
import { useCreativeDirection } from '@/components/CreativeDirectionStudio';
import { useLanguage } from '@/contexts/LanguageContext';

const PHOTOS = {
    fashion: '/images/hero/DSC_9576.jpg',
    cinematic: '/images/hero/DSC_9583.jpg',
    atelier: '/images/hero/DSC_9584.jpg',
} as const;

export default function CreativeHero() {
    const direction = useCreativeDirection();
    const { T } = useLanguage();
    const [bookingOpen, setBookingOpen] = useState(false);

    return (
        <section
            className={`split-hero creative-hero creative-hero--${direction}`}
            aria-labelledby="salon-home-heading"
        >
            <div className="creative-hero__photo">
                <Image
                    key={direction}
                    src={PHOTOS[direction]}
                    alt={T.hero.imageAlt}
                    fill
                    priority
                    sizes="100vw"
                    className="creative-hero__image"
                    style={{ objectFit: 'cover' }}
                />
            </div>
            {direction === 'atelier' && (
                <div className="creative-hero__photo-secondary" aria-hidden="true">
                    <Image
                        src="/images/hero/DSC_9576.jpg"
                        alt=""
                        fill
                        sizes="(max-width: 760px) 45vw, 24vw"
                        style={{ objectFit: 'cover' }}
                    />
                </div>
            )}
            <div className="creative-hero__content">
                <div className="creative-hero__topline">
                    <span>{T.hero.eyebrow}</span>
                    <span>BYTOM / POLSKA</span>
                </div>
                <h1 id="salon-home-heading" className="creative-hero__title">
                    <span>Black</span>
                    <em>&amp;</em>
                    <span>White</span>
                </h1>
                <div className="creative-hero__bottom">
                    <p>{T.hero.tagline1} {T.hero.tagline2}</p>
                    <div className="creative-hero__actions">
                        <button type="button" onClick={() => setBookingOpen(true)} className="creative-hero__book">
                            {T.nav.booking}<span aria-hidden="true">↗</span>
                        </button>
                        <Link href="/services" className="creative-hero__discover">
                            {T.hero.ctaSecondary}<span aria-hidden="true">→</span>
                        </Link>
                    </div>
                </div>
            </div>
            <div className="creative-hero__index" aria-hidden="true">
                <span>01</span><span>—</span><span>03</span>
            </div>
            <div className="creative-hero__availability">
                <span>{T.hero.trustPill}</span>
                <NearestSlotTeaser />
            </div>
            <BookingModal open={bookingOpen} onClose={() => setBookingOpen(false)} />
        </section>
    );
}
