import { useState } from 'react';
import SectionHeader from './SectionHeader';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Testimonials() {
    const { T } = useLanguage();
    const testimonials = T.testimonials.items;
    const [active, setActive] = useState(0);
    const stars = 5;

    return (
        <section className="py-20 md:py-28" style={{ background: '#0d0d0d' }}>
            <div className="container mx-auto px-4 md:px-8">
                <SectionHeader eyebrow={T.testimonials.eyebrow} title={T.testimonials.title} dark />

                <div className="max-w-2xl mx-auto text-center mb-10">
                    <div
                        aria-hidden="true"
                        style={{
                            fontFamily: "var(--font-playfair), serif",
                            fontSize: 'clamp(8rem, 18vw, 14rem)',
                            color: '#b4b8be',
                            lineHeight: 0.75,
                            opacity: 0.22,
                            marginBottom: '-0.15em',
                            userSelect: 'none',
                        }}
                    >
                        &ldquo;
                    </div>

                    <p
                        key={active}
                        className="testimonial-text text-lg md:text-xl leading-relaxed mb-8"
                        style={{
                            color: '#ffffff',
                            fontFamily: "var(--font-playfair), serif",
                            fontStyle: 'italic',
                            minHeight: '6rem',
                        }}
                    >
                        {testimonials[active]?.text}
                    </p>

                    <div
                        className="flex justify-center gap-1 mb-5"
                        role="img"
                        aria-label={T.testimonials.starsLabel.replace('{n}', String(stars))}
                    >
                        {Array.from({ length: stars }).map((_, i) => (
                            <svg key={i} className="w-4 h-4" aria-hidden="true" fill="#b4b8be" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                        ))}
                    </div>

                    <p key={`name-${active}`} className="testimonial-text font-semibold text-sm" style={{ color: '#ffffff', fontFamily: "var(--font-open-sans), sans-serif" }}>
                        {testimonials[active]?.name}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
                        {T.testimonials.clientSince.replace('{year}', String(testimonials[active]?.sinceYear ?? ''))}
                    </p>
                </div>

                <div className="flex justify-center gap-2">
                    {testimonials.map((t, i) => (
                        <button
                            key={t.name}
                            type="button"
                            onClick={() => { if (i !== active) setActive(i); }}
                            className="focus:outline-none focus:ring-2 focus:ring-[#b4b8be]"
                            style={{
                                width: i === active ? '36px' : '8px',
                                height: '6px',
                                borderRadius: '3px',
                                background: i === active ? '#b4b8be' : 'rgba(255,255,255,0.45)',
                                transition: 'width 0.45s cubic-bezier(0.34,1.56,0.64,1), background 0.3s',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 0,
                            }}
                            aria-label={T.testimonials.reviewLabel.replace('{name}', t.name)}
                            aria-pressed={i === active}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
