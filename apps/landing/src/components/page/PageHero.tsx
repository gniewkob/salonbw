import { useId, type ReactNode } from 'react';
import Image from 'next/image';
import { useHeroPullBack } from '@/hooks/useHeroPullBack';
import styles from './PageHero.module.css';

interface PageHeroProps {
    eyebrow: string;
    title: string;
    /** Optional italic second line, as on the homepage ("Twoje włosy."). */
    titleEm?: string;
    lead?: ReactNode;
    /** Photo variant when set; otherwise the text variant (legal pages, 404). */
    image?: { src: string; alt: string; position?: string };
    actions?: ReactNode;
    /** Large decorative word behind the text variant (e.g. "404"). */
    decor?: string;
    /** Fill the first screen (404). */
    fill?: boolean;
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
    children,
}: PageHeroProps) {
    const id = useId();
    const ref = useHeroPullBack<HTMLElement>();
    const variant = image ? styles.photo : styles.text;
    return (
        <section
            ref={image ? ref : undefined}
            className={[styles.hero, variant, fill ? styles.fill : '']
                .filter(Boolean)
                .join(' ')}
            aria-labelledby={id}
        >
            {image && (
                <div className={styles.frame}>
                    <Image
                        src={image.src}
                        alt={image.alt}
                        fill
                        priority
                        sizes="100vw"
                        className={styles.image}
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
}
