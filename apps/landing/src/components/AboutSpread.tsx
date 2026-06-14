import Image from 'next/image';
import { FOUNDER_MESSAGE } from '@/config/content';
import { useLanguage } from '@/contexts/LanguageContext';

type FounderData = { name: string; quote: string; photo?: string };

export default function AboutSpread({ founder }: { founder?: FounderData }) {
    const { T } = useLanguage();
    const data = founder ?? (FOUNDER_MESSAGE as FounderData);

    return (
        <section className="py-20 md:py-28" style={{ background: 'var(--brand-warm-bg)' }}>
            <div className="container mx-auto px-4 md:px-8">
                <div className="max-w-5xl mx-auto">

                    {/* Founder — short note: quote + photo */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
                        <div>
                            <p
                                className="text-xs uppercase mb-4"
                                style={{ color: '#b4b8be', letterSpacing: '0.12em', fontFamily: "var(--font-open-sans), sans-serif" }}
                            >
                                {T.founder.eyebrow}
                            </p>

                            <div
                                aria-hidden="true"
                                style={{
                                    fontFamily: "var(--font-playfair), serif",
                                    fontSize: 'clamp(5rem, 10vw, 9rem)',
                                    color: '#b4b8be',
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
                                        color: 'var(--brand-warm-ink)',
                                        fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
                                    }}
                                >
                                    {T.founder.quote}
                                </p>
                                <footer>
                                    <cite
                                        className="not-italic block"
                                        style={{ fontFamily: "var(--font-playfair), serif", fontStyle: 'italic', fontSize: '1.5rem', color: '#b4b8be', lineHeight: 1.1 }}
                                    >
                                        {data.name}
                                    </cite>
                                    <span className="text-xs mt-1 block" style={{ color: 'var(--brand-warm-muted)', letterSpacing: '0.12em', fontFamily: "var(--font-open-sans), sans-serif" }}>
                                        {T.founder.role}
                                    </span>
                                </footer>
                            </blockquote>

                            <div className="mt-6 flex items-center gap-3">
                                <div style={{ width: '32px', height: '1px', background: '#b4b8be' }} />
                                <span className="text-xs" style={{ color: '#b4b8be', letterSpacing: '0.12em', fontFamily: "var(--font-open-sans), sans-serif" }}>
                                    {T.founder.since}
                                </span>
                            </div>

                            {/* Mini timeline */}
                            <div className="mt-8">
                                {T.history.items.slice(0, 2).map(item => (
                                    <div key={item.id} className="timeline-item">
                                        <span
                                            className="text-xs font-bold block mb-0.5"
                                            style={{ color: '#b4b8be', fontFamily: "var(--font-open-sans), sans-serif", letterSpacing: '0.1em' }}
                                        >
                                            {T.history.yearMap[item.id as keyof typeof T.history.yearMap]}
                                        </span>
                                        <p className="text-sm leading-relaxed" style={{ color: 'var(--brand-warm-muted)' }}>
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
                                    style={{ top: '-12px', right: '-12px', left: '12px', bottom: '12px', border: '1px solid #b4b8be', borderRadius: '3px', zIndex: 0 }}
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
                                        <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--brand-warm-bg-3)' }}>
                                            <span style={{ fontFamily: "var(--font-playfair), serif", fontSize: '3rem', color: '#b4b8be' }}>A</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
