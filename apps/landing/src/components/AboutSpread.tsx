'use client';
import Image from 'next/image';
import { FOUNDER_MESSAGE } from '@/config/content';
import { useLanguage } from '@/contexts/LanguageContext';
import { Palette, Star, User, type LucideIcon } from 'lucide-react';

const PRINCIPLE_ICONS: LucideIcon[] = [Palette, Star, User];

type FounderData = { name: string; quote: string; photo?: string };

export default function AboutSpread({ founder }: { founder?: FounderData }) {
    const { T } = useLanguage();
    const data = founder ?? (FOUNDER_MESSAGE as FounderData);
    const principles = (T.values.items as unknown as { id: string; title: string; description: string }[]).slice(0, 3);

    return (
        <section className="py-20 md:py-28" style={{ background: '#faf9f7' }}>
            <div className="container mx-auto px-4 md:px-8">
                <div className="max-w-5xl mx-auto">

                    {/* Founder — quote + photo */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center mb-16 md:mb-20">
                        <div>
                            <p
                                className="text-xs uppercase mb-4"
                                style={{ color: '#c5a880', letterSpacing: '0.12em', fontFamily: "var(--font-open-sans), sans-serif" }}
                            >
                                {T.founder.eyebrow}
                            </p>

                            <div
                                aria-hidden="true"
                                style={{
                                    fontFamily: "var(--font-playfair), serif",
                                    fontSize: 'clamp(5rem, 10vw, 9rem)',
                                    color: '#c5a880',
                                    lineHeight: 0.75,
                                    opacity: 0.25,
                                    marginBottom: '-0.25rem',
                                    userSelect: 'none',
                                }}
                            >
                                &ldquo;
                            </div>

                            <blockquote>
                                <p
                                    className="leading-relaxed mb-6"
                                    style={{
                                        fontFamily: "var(--font-playfair), serif",
                                        fontStyle: 'italic',
                                        color: '#3a3028',
                                        fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
                                    }}
                                >
                                    {data.quote}
                                </p>
                                <footer>
                                    <cite
                                        className="not-italic block"
                                        style={{ fontFamily: "var(--font-playfair), serif", fontStyle: 'italic', fontSize: '1.5rem', color: '#c5a880', lineHeight: 1.1 }}
                                    >
                                        {data.name}
                                    </cite>
                                    <span className="text-xs mt-1 block" style={{ color: '#8a7060', letterSpacing: '0.12em', fontFamily: "var(--font-open-sans), sans-serif" }}>
                                        {T.founder.role}
                                    </span>
                                </footer>
                            </blockquote>

                            <div className="mt-6 flex items-center gap-3">
                                <div style={{ width: '32px', height: '1px', background: '#c5a880' }} />
                                <span className="text-xs" style={{ color: '#c5a880', letterSpacing: '0.12em', fontFamily: "var(--font-open-sans), sans-serif" }}>
                                    {T.founder.since}
                                </span>
                            </div>

                            {/* Mini timeline */}
                            <div className="mt-8">
                                {T.history.items.slice(0, 2).map(item => (
                                    <div key={item.id} className="timeline-item">
                                        <span
                                            className="text-xs font-bold block mb-0.5"
                                            style={{ color: '#c5a880', fontFamily: "var(--font-open-sans), sans-serif", letterSpacing: '0.1em' }}
                                        >
                                            {T.history.yearMap[item.id as keyof typeof T.history.yearMap]}
                                        </span>
                                        <p className="text-sm leading-relaxed" style={{ color: '#8a7060' }}>
                                            {item.content.split('. ')[0]}.
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Photo */}
                        <div className="flex justify-center md:justify-start order-first md:order-last">
                            <div className="relative">
                                <div
                                    className="absolute"
                                    style={{ top: '-12px', right: '-12px', left: '12px', bottom: '12px', border: '1px solid #c5a880', borderRadius: '3px', zIndex: 0 }}
                                />
                                <div
                                    className="relative overflow-hidden"
                                    style={{ width: '300px', height: '400px', borderRadius: '3px', zIndex: 1, boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}
                                >
                                    {data.photo ? (
                                        <Image
                                            src={data.photo}
                                            alt={`Zdjęcie ${data.name}`}
                                            fill
                                            style={{ objectFit: 'cover', objectPosition: 'center top' }}
                                            sizes="280px"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center" style={{ background: '#e8e2da' }}>
                                            <span style={{ fontFamily: "var(--font-playfair), serif", fontSize: '3rem', color: '#c5a880' }}>A</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 3 Principles */}
                    <div
                        className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10 md:pt-14"
                        style={{ borderTop: '1px solid #ede9e3' }}
                    >
                        {principles.map((p, idx) => {
                            const Icon = PRINCIPLE_ICONS[idx]!;
                            return (
                                <div key={p.id} className="flex gap-4">
                                    <div
                                        className="shrink-0 w-9 h-9 flex items-center justify-center mt-1"
                                        style={{ background: 'rgba(197,168,128,0.1)', borderRadius: '2px' }}
                                    >
                                        <Icon size={18} strokeWidth={1.5} style={{ color: '#c5a880' }} />
                                    </div>
                                    <div>
                                        <h3
                                            className="font-semibold mb-2"
                                            style={{ fontFamily: "var(--font-playfair), serif", color: '#0d0d0d', fontSize: '1rem' }}
                                        >
                                            {p.title}
                                        </h3>
                                        <p className="text-sm leading-relaxed" style={{ color: '#6b5f52' }}>
                                            {p.description.split('. ')[0]}.
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
