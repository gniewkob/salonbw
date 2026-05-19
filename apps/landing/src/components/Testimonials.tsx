'use client';
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
                    <div className="mb-6" style={{ fontFamily: "var(--font-playfair), serif", fontSize: '5rem', color: '#c5a880', lineHeight: 0.8, opacity: 0.6 }}>&ldquo;</div>

                    <p className="text-base md:text-lg leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.82)', fontFamily: "var(--font-playfair), serif", fontStyle: 'italic', minHeight: '5rem' }}>
                        {testimonials[active]?.text}
                    </p>

                    <div
                        className="flex justify-center gap-1 mb-4"
                        role="img"
                        aria-label={T.testimonials.starsLabel.replace('{n}', String(stars))}
                    >
                        {Array.from({ length: stars }).map((_, i) => (
                            <svg key={i} className="w-4 h-4" aria-hidden="true" fill="#c5a880" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                        ))}
                    </div>

                    <p className="font-semibold text-sm" style={{ color: '#ffffff', fontFamily: "var(--font-open-sans), sans-serif" }}>
                        {testimonials[active]?.name}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        {T.testimonials.clientSince.replace('{year}', String(testimonials[active]?.sinceYear ?? ''))}
                    </p>
                </div>

                <div className="flex justify-center gap-3">
                    {testimonials.map((t, i) => (
                        <button
                            key={t.name}
                            type="button"
                            onClick={() => { if (i !== active) setActive(i); }}
                            className="transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#c5a880]"
                            style={{ width: i === active ? '28px' : '8px', height: '8px', borderRadius: '4px', background: i === active ? '#c5a880' : 'rgba(255,255,255,0.25)' }}
                            aria-label={T.testimonials.reviewLabel.replace('{name}', t.name)}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
