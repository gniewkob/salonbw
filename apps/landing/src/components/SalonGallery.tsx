import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { SALON_GALLERY } from '@/config/content';
import SectionHeader from './SectionHeader';
import { useLanguage } from '@/contexts/LanguageContext';
import { translateGalleryCaption } from '@/i18n/catalogNames';

type GalleryImage = { id: number; image: string; caption: string; alt: string };
interface SalonGalleryProps {
    images?: GalleryImage[];
}
type WorkItem = {
    id: string;
    type: string;
    imageUrl?: string;
    caption?: string;
};

const TILES = 4;

/**
 * Home teaser for the gallery: four tiles, not the whole set.
 * Shows the latest work from the salon's Instagram when the gallery API has
 * it (production), rendered in black & white to keep the salon's convention
 * — colour stays in the full gallery. Falls back to four interior photos
 * (e.g. on dev, where the gallery has no Instagram token).
 */
export default function SalonGallery({ images }: SalonGalleryProps) {
    const interior = (
        images ?? (SALON_GALLERY as unknown as GalleryImage[])
    ).slice(0, TILES);
    const { T, lang } = useLanguage();
    const g = T.salonGallery;
    const [work, setWork] = useState<WorkItem[]>([]);

    useEffect(() => {
        let cancelled = false;
        fetch(`/api/gallery?limit=${TILES + 4}`)
            .then((r) => (r.ok ? r.json() : null))
            .then((d: { items?: WorkItem[]; fallback?: boolean } | null) => {
                if (cancelled || !d || d.fallback) return;
                const pics = (d.items ?? []).filter(
                    (i) => i.type !== 'VIDEO' && i.imageUrl,
                );
                if (pics.length >= TILES) setWork(pics.slice(0, TILES));
            })
            .catch(() => undefined);
        return () => {
            cancelled = true;
        };
    }, []);

    const showWork = work.length === TILES;

    return (
        <section className="home-gallery" aria-labelledby="home-gallery-title">
            <div className="bw-container">
                <SectionHeader
                    eyebrow={showWork ? g.workEyebrow : g.eyebrow}
                    title={showWork ? g.workTitle : g.title}
                    subtitle={showWork ? g.workSubtitle : g.subtitle}
                    dark
                    align="left"
                    id="home-gallery-title"
                />
                <ul className="home-gallery__grid">
                    {showWork
                        ? work.map((item) => (
                              <li key={item.id} className="home-gallery__tile">
                                  {/* eslint-disable-next-line @next/next/no-img-element -- Instagram CDN, not in next/image remotePatterns */}
                                  <img
                                      src={item.imageUrl}
                                      alt={g.workAlt}
                                      loading="lazy"
                                      decoding="async"
                                      className="home-gallery__img"
                                  />
                              </li>
                          ))
                        : interior.map((image) => (
                              <li key={image.id} className="home-gallery__tile">
                                  <Image
                                      src={image.image}
                                      alt={
                                          image.alt ||
                                          translateGalleryCaption(
                                              image.caption,
                                              lang,
                                          )
                                      }
                                      fill
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
