'use client';
import { useLanguage } from '@/contexts/LanguageContext';

const testimonials = [
    { name: 'Monika W.', sinceYear: 2015, stars: 5, text: 'Chodzę do Aleksandry od ponad 8 lat. Nigdy żaden inny salon nie dał mi tak dobrego efektu koloryzacji. Moje włosy są zdrowe, lśniące i dokładnie takie, jak sobie wymarzyłam.' },
    { name: 'Karolina P.', sinceYear: 2019, stars: 5, text: 'Botox na włosy w Black&White to zupełnie inne doświadczenie niż gdzie indziej. Konsultacja przed zabiegiem, wyjaśnienie każdego kroku — czuć, że to naprawdę akademia, nie zwykły salon.' },
    { name: 'Anna S.', sinceYear: 2021, stars: 5, text: 'Przedłużanie metodą HairTalk — wykonane perfekcyjnie, nie widać żadnych przejść. Mogę czesać, upinać i nosić kucyk bez żadnego strachu. Polecam z całego serca!' },
];

const StarRow = ({ count, label }: { count: number; label: string }) => (
    <div className="flex gap-0.5" aria-label={label}>
        {Array.from({ length: count }).map((_, i) => (
            <svg key={i} className="w-3.5 h-3.5" aria-hidden="true" fill="#c5a880" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
        ))}
    </div>
);

export default function Testimonials() {
    const { T } = useLanguage();

    return (
        <section className="py-20 md:py-28" style={{ background: '#0d0d0d' }}>
            <div className="container mx-auto px-4 md:px-8">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-14 gap-4">
                    <div>
                        <p
                            className="text-xs uppercase mb-3"
                            style={{ color: '#c5a880', letterSpacing: '0.12em', fontFamily: "var(--font-open-sans), sans-serif" }}
                        >
                            {T.testimonials.eyebrow}
                        </p>
                        <h2
                            className="text-3xl md:text-4xl font-bold"
                            style={{ fontFamily: "var(--font-playfair), serif", color: '#ffffff' }}
                        >
                            {T.testimonials.title}
                        </h2>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <StarRow count={5} label="Google rating 4.9" />
                        <span
                            className="text-sm"
                            style={{ color: 'rgba(255,255,255,0.55)', fontFamily: "var(--font-open-sans), sans-serif" }}
                        >
                            {T.testimonials.googleLabel}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {testimonials.map(t => (
                        <article
                            key={t.name}
                            className="flex flex-col p-7 md:p-8"
                            style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '3px' }}
                        >
                            <div className="mb-5">
                                <StarRow count={t.stars} label={T.testimonials.starsLabel.replace('{n}', String(t.stars))} />
                            </div>
                            <p
                                className="flex-grow text-sm leading-relaxed mb-6"
                                style={{ color: 'rgba(255,255,255,0.72)', fontFamily: "var(--font-playfair), serif", fontStyle: 'italic' }}
                            >
                                {t.text}
                            </p>
                            <div>
                                <p className="text-sm font-semibold" style={{ color: '#ffffff', fontFamily: "var(--font-open-sans), sans-serif" }}>
                                    {t.name}
                                </p>
                                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: "var(--font-open-sans), sans-serif" }}>
                                    {T.testimonials.clientSince.replace('{year}', String(t.sinceYear))}
                                </p>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
