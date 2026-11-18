import SectionHeader from './SectionHeader';
import { useLanguage } from '@/contexts/LanguageContext';

const STARS = 5;

/**
 * All reviews visible at once (no carousel): they back the page's
 * aggregateRating, so every one of them stays on the page, and nobody has to
 * tap through dots to read them. Editorial, left-aligned like the chapters.
 */
export default function Testimonials() {
    const { T } = useLanguage();
    const t = T.testimonials;
    return (
        <section className="reviews" aria-labelledby="reviews-title">
            <div className="bw-container">
                <SectionHeader
                    eyebrow={t.eyebrow}
                    title={t.title}
                    align="left"
                    id="reviews-title"
                />
                <ul className="reviews__grid">
                    {t.items.map((item) => (
                        <li key={item.name} className="reviews__item">
                            <figure>
                                <div
                                    className="reviews__stars"
                                    role="img"
                                    aria-label={t.starsLabel.replace(
                                        '{n}',
                                        String(STARS),
                                    )}
                                >
                                    {Array.from({ length: STARS }).map(
                                        (_, i) => (
                                            <svg
                                                key={i}
                                                aria-hidden="true"
                                                viewBox="0 0 20 20"
                                            >
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                        ),
                                    )}
                                </div>
                                <blockquote className="reviews__quote">
                                    {item.text}
                                </blockquote>
                                <figcaption className="reviews__who">
                                    <strong>{item.name}</strong>
                                    <span>
                                        {t.clientSince.replace(
                                            '{year}',
                                            String(item.sinceYear),
                                        )}
                                    </span>
                                </figcaption>
                            </figure>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
