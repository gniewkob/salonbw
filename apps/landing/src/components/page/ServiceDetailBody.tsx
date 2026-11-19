import ResponsiveImage from '@/components/ResponsiveImage';
import Link from 'next/link';
import { ArrowLongRightIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '@/contexts/LanguageContext';
import type {
    ServiceDetailEntry,
    ServiceDetailLocale,
} from '@/i18n/serviceDetail';
import styles from './ServiceDetailBody.module.css';

type Work = { src: string; alt: string };

interface ServiceDetailBodyProps {
    entry: ServiceDetailEntry;
    labels: ServiceDetailLocale;
    /** Three chosen black & white photos of the salon's work (public/images/work). */
    works: readonly Work[];
    onBook: () => void;
}

/**
 * Editorial body for the treatment pages (coloring, balayage, highlights):
 * a numbered "what's included" list, three chosen black & white photos of
 * the salon's work (from its own Instagram, stored in the repo — the latest
 * posts are often graphics, see DESIGN.md), and one closing booking band. Copy comes from the
 * existing page content only.
 */
export default function ServiceDetailBody({
    entry,
    labels,
    works,
    onBook,
}: ServiceDetailBodyProps) {
    const { T } = useLanguage();
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
                    {works.map((w) => (
                        <li key={w.src} className={`${styles.tile} bw-reveal`}>
                            <ResponsiveImage
                                src={w.src}
                                alt={w.alt}
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
