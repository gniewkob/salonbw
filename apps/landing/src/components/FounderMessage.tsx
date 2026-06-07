import Image from 'next/image';
import { FOUNDER_MESSAGE } from '@/config/content';
import { useLanguage } from '@/contexts/LanguageContext';

type FounderData = { name: string; quote: string; photo?: string };
interface FounderMessageProps { founder?: FounderData; }

export default function FounderMessage({ founder }: FounderMessageProps) {
    const { T } = useLanguage();
    const data = founder ?? (FOUNDER_MESSAGE as FounderData);

    return (
        <section className="py-20 md:py-28" style={{ background: 'var(--brand-warm-bg)' }}>
            <div className="container mx-auto px-4 md:px-8">
                <div className="max-w-5xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">

                        {/* Photo */}
                        <div className="flex justify-center md:justify-end order-1 md:order-none">
                            <div className="relative">
                                <div
                                    className="absolute"
                                    style={{ top: '-12px', left: '-12px', right: '12px', bottom: '12px', border: '1px solid #b4b8be', borderRadius: '3px', zIndex: 0 }}
                                />
                                <div className="relative overflow-hidden" style={{ width: '280px', height: '340px', borderRadius: '3px', zIndex: 1 }}>
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

                        {/* Text */}
                        <div>
                            <p className="text-xs tracking-widest uppercase mb-4" style={{ color: '#b4b8be', letterSpacing: '0.22em', fontFamily: "var(--font-open-sans), sans-serif" }}>
                                {T.founder.eyebrow}
                            </p>

                            <div className="mb-2" style={{ fontFamily: "var(--font-playfair), serif", fontSize: '3.5rem', color: '#b4b8be', lineHeight: 0.8, opacity: 0.5 }}>&ldquo;</div>

                            <blockquote>
                                <p className="text-lg leading-relaxed mb-8" style={{ fontFamily: "var(--font-playfair), serif", fontStyle: 'italic', color: 'var(--brand-warm-ink)' }}>
                                    {data.quote}
                                </p>
                                <footer>
                                    <cite className="not-italic block" style={{ fontFamily: "var(--font-tangerine), cursive", fontSize: '2.4rem', color: '#b4b8be', lineHeight: 1.1 }}>
                                        {data.name}
                                    </cite>
                                    <span className="text-xs mt-1 block tracking-wider" style={{ color: 'var(--brand-warm-muted)', letterSpacing: '0.12em' }}>
                                        {T.founder.role}
                                    </span>
                                </footer>
                            </blockquote>

                            <div className="mt-8 flex items-center gap-3">
                                <div style={{ width: '32px', height: '1px', background: '#b4b8be' }} />
                                <span className="text-xs tracking-widest" style={{ color: '#b4b8be', letterSpacing: '0.2em' }}>
                                    {T.founder.since}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
