import { useEffect, useState } from 'react';
import ResponsiveImage from '@/components/ResponsiveImage';
import Link from 'next/link';
import { ArrowLongRightIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '@/contexts/LanguageContext';
import { SALON_GALLERY } from '@/config/content';
import type {
    ServiceDetailEntry,
    ServiceDetailLocale,
} from '@/i18n/serviceDetail';
import styles from './ServiceDetailBody.module.css';

type WorkItem = { id: string; type: string; imageUrl?: string };
type GalleryImage = { id: number; image: string; alt: string };

interface ServiceDetailBodyProps {
    entry: ServiceDetailEntry;
    labels: ServiceDetailLocale;
    /** Interior photos to show when the Instagram gallery is unavailable. */
    fallbackImages: string[];
    onBook: () => void;
}

const WORKS = 3;

/**
 * Editorial body for the treatment pages (coloring, balayage, highlights):
 * a numbered "what's included" list, three black & white photos of recent
 * work (Instagram via the gallery API; interior photos when it is not
 * available, e.g. on dev), and one closing booking band. Copy comes from the
 * existing page content only.
 */
export default function ServiceDetailBody({
    entry,
    labels,
    fallbackImages,
    onBook,
}: ServiceDetailBodyProps) {
    const { T } = useLanguage();
    const [works, setWorks] = useState<WorkItem[]>([]);

    useEffect(() => {
        let cancelled = false;
        fetch(`/api/gallery?limit=${WORKS + 4}`)
            .then((r) => (r.ok ? r.json() : null))
            .then((d: { items?: WorkItem[]; fallback?: boolean } | null) => {
                if (cancelled || !d || d.fallback) return;
                const pics = (d.items ?? []).filter(
                    (i) => i.type !== 'VIDEO' && i.imageUrl,
                );
                if (pics.length >= WORKS) setWorks(pics.slice(0, WORKS));
            })
            .catch(() => undefined);
        return () => {
            cancelled = true;
        };
    }, []);

    const interior = fallbackImages
        .map((src) =>
            (SALON_GALLERY as unknown as GalleryImage[]).find(
                (g) => g.image === src,
            ),
        )
        .filter((g): g is GalleryImage => Boolean(g))
        .slice(0, WORKS);

    return (
        <>
            <section
                className={styles.included}
                aria-labelledby="included-title"
            >
                <div className={styles.includedHead}>
                    <p className={styles.eyebrow}>{labels.includedEyebrow}</p>
                    <h2 id="included-title" className={styles.title}>
                        {labels.includedTitle}{' '}
                        <em>{entry.h1.toLocaleLowerCase()}</em>
                    </h2>
                </div>
                <ol className={styles.list}>
                    {entry.items.map((item, index) => (
                        <li key={item} className={`${styles.item} bw-reveal`}>
                            <span className={styles.num} aria-hidden="true">
                                {String(index + 1).padStart(2, '0')}
                            </span>
                            <span className={styles.itemText}>{item}</span>
                        </li>
                    ))}
                </ol>
            </section>

            <section className={styles.works} aria-labelledby="works-title">
                <div className={styles.worksHead}>
                    <p className={styles.eyebrowDark}>{labels.worksEyebrow}</p>
                    <h2 id="works-title" className={styles.titleDark}>
                        {labels.worksTitle}
                    </h2>
                </div>
                <ul className={styles.worksGrid}>
                    {works.length === WORKS
                        ? works.map((w) => (
                              <li
                                  key={w.id}
                                  className={`${styles.tile} bw-reveal`}
                              >
                                  {/* eslint-disable-next-line @next/next/no-img-element -- Instagram CDN, not in next/image remotePatterns */}
                                  <img
                                      src={w.imageUrl}
                                      alt={T.salonGallery.workAlt}
                                      loading="lazy"
                                      decoding="async"
                                      className={styles.tileImg}
                                  />
                              </li>
                          ))
                        : interior.map((g) => (
                              <li
                                  key={g.id}
                                  className={`${styles.tile} bw-reveal`}
                              >
                                  <ResponsiveImage
                                      src={g.image}
                                      alt={g.alt}
                                      sizes="(max-width: 768px) 100vw, 33vw"
                                      className={styles.tileImg}
                                  />
                              </li>
                          ))}
                </ul>
                <Link href="/gallery" className={styles.galleryLink}>
                    {T.salonGallery.viewAll}
                    <ArrowLongRightIcon aria-hidden="true" />
                </Link>
            </section>

            <section className={styles.band} aria-labelledby="book-title">
                <h2 id="book-title" className={styles.bandTitle}>
                    {T.services.ctaHeading}
                </h2>
                <p className={styles.bandText}>{T.services.ctaSub}</p>
                <div className={styles.bandActions}>
                    <button
                        type="button"
                        className="bw-btn bw-btn--dark"
                        onClick={onBook}
                        data-booking-cta
                    >
                        {T.nav.booking}
                    </button>
                    <Link
                        href="/services?offer=hairdressing"
                        className="bw-btn bw-btn--on-light"
                    >
                        {T.services.variantsLabel}
                    </Link>
                </div>
                <Link href="/services" className={styles.back}>
                    {labels.backToOffer}
                </Link>
            </section>
        </>
    );
}
