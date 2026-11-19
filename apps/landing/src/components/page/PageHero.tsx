import Head from 'next/head';
import ResponsiveImage, { webpSrcSet } from '@/components/ResponsiveImage';
import { useId, type CSSProperties, type ReactNode } from 'react';
import { useHeroPullBack } from '@/hooks/useHeroPullBack';
import styles from './PageHero.module.css';

interface PageHeroProps {
    eyebrow: string;
    title: string;
    /** Optional italic second line, as on the homepage ("Piękny kolor."). */
    titleEm?: string;
    lead?: ReactNode;
    /** Photo variant when set; otherwise the text variant (legal pages, 404). */
    image?: { src: string; alt: string; position?: string; mobileSrc?: string };
    actions?: ReactNode;
    /** Large decorative word behind the text variant (e.g. "404"). */
    decor?: string;
    /** Fill the first screen (404). */
    fill?: boolean;
    /** Colour around the receding photo card: that of the next section. */
    stageBackground?: string;
    children?: ReactNode;
}

/**
 * The homepage Cinematic hero as the opening of every subpage, so moving
 * between pages keeps one frame, one left edge and one type scale.
 */
export default function PageHero({
    eyebrow,
    title,
    titleEm,
    lead,
    image,
    actions,
    decor,
    fill,
    stageBackground,
    children,
}: PageHeroProps) {
    const id = useId();
    const ref = useHeroPullBack<HTMLDivElement>();
    const variant = image ? styles.photo : styles.text;
    // Preload the hero photo the visitor will actually get (phone crop or
    // full image); <picture> is otherwise discovered only while parsing.
    const preload = image ? (
        <Head>
            {image.mobileSrc && (
                <link
                    key="hero-preload-m"
                    rel="preload"
                    as="image"
                    type="image/webp"
                    imageSrcSet={webpSrcSet(image.mobileSrc)}
                    imageSizes="100vw"
                    media="(max-width: 768px)"
                    fetchPriority="high"
                />
            )}
            <link
                key="hero-preload"
                rel="preload"
                as="image"
                type="image/webp"
                imageSrcSet={webpSrcSet(image.src)}
                imageSizes="100vw"
                media={image.mobileSrc ? '(min-width: 769px)' : undefined}
                fetchPriority="high"
            />
        </Head>
    ) : null;
    const hero = (
        <section
            className={[styles.hero, variant, fill ? styles.fill : '']
                .filter(Boolean)
                .join(' ')}
            aria-labelledby={id}
        >
            {image && (
                <div className={styles.frame}>
                    {/* <picture>: optional portrait crop for phones (images are
                        served unoptimised, so this is the size saving). */}
                    <ResponsiveImage
                        src={image.src}
                        mobileSrc={image.mobileSrc}
                        alt={image.alt}
                        sizes="100vw"
                        priority
                        className={`${styles.image} hero-fill`}
                        style={{ objectPosition: image.position ?? '50% 40%' }}
                    />
                    <div className={styles.scrim} />
                </div>
            )}
            {decor && (
                <span className={styles.decor} aria-hidden="true">
                    {decor}
                </span>
            )}
            <div className={styles.story}>
                <p className={styles.eyebrow}>{eyebrow}</p>
                <h1 id={id} className={styles.title}>
                    {title}
                    {titleEm && <em>{titleEm}</em>}
                </h1>
                {lead && <p className={styles.lead}>{lead}</p>}
                {actions && <div className={styles.actions}>{actions}</div>}
                {children}
            </div>
        </section>
    );
    // Photo variant: a stage gives the pinned pull-back its scroll distance.
    return image ? (
        <>
            {preload}
            <div
                ref={ref}
                className={styles.stage}
                style={
                    stageBackground
                        ? ({ '--stage-bg': stageBackground } as CSSProperties)
                        : undefined
                }
            >
                {hero}
            </div>
        </>
    ) : (
        hero
    );
}
