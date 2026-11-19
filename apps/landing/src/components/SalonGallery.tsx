import ResponsiveImage from '@/components/ResponsiveImage';
import Link from 'next/link';
import SectionHeader from './SectionHeader';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Home teaser for the gallery: four chosen photos of the salon's work, from
 * the salon's own Instagram (@salon_bw), stored in the repo in black & white
 * to keep the salon's convention — colour stays in the full gallery.
 * A fixed, curated set on purpose: the latest posts often are text graphics
 * or seasonal decorations (see DESIGN.md, 2026-11-19).
 */
const WORK = [
    {
        src: '/images/work/airtouch-warkocz.jpg',
        alt: 'Fale z warkoczem po koloryzacji AirTouch',
    },
    { src: '/images/work/fale-blond.jpg', alt: 'Długie fale w odcieniu blond' },
    {
        src: '/images/work/prosty-ciemny.jpg',
        alt: 'Proste, gładkie ciemne włosy po regeneracji',
    },
    {
        src: '/images/work/upiecie-slubne.jpg',
        alt: 'Upięcie ślubne z ozdobą we włosach',
    },
] as const;

export default function SalonGallery() {
    const { T } = useLanguage();
    const g = T.salonGallery;

    return (
        <section className="home-gallery" aria-labelledby="home-gallery-title">
            <div className="bw-container">
                <SectionHeader
                    eyebrow={g.workEyebrow}
                    title={g.workTitle}
                    subtitle={g.workSubtitle}
                    dark
                    align="left"
                    id="home-gallery-title"
                />
                <ul className="home-gallery__grid">
                    {WORK.map((item) => (
                        <li
                            key={item.src}
                            className="home-gallery__tile bw-reveal"
                        >
                            <ResponsiveImage
                                src={item.src}
                                alt={item.alt}
                                sizes="(max-width: 768px) 50vw, 25vw"
                                className="home-gallery__img"
                            />
                        </li>
                    ))}
                </ul>
                <div className="home-gallery__more">
                    <Link href="/gallery" className="bw-btn bw-btn--on-dark">
                        {g.viewAll}
                    </Link>
                </div>
            </div>
        </section>
    );
}
