import { PARTNER_BRANDS } from '@/config/content';

export default function PartnerBrands() {
    const doubled = [...PARTNER_BRANDS, ...PARTNER_BRANDS];

    return (
        <>
            <style>{`
                @keyframes marquee {
                    from { transform: translateX(0); }
                    to   { transform: translateX(-50%); }
                }
                .marquee-track {
                    animation: marquee 18s linear infinite;
                    display: flex;
                    width: max-content;
                }
                .marquee-track:hover { animation-play-state: paused; }
            `}</style>

            <section
                className="py-10 overflow-hidden"
                style={{ borderTop: '1px solid #f0ece6', borderBottom: '1px solid #f0ece6', background: '#faf9f7' }}
                aria-label="Marki partnerskie"
            >
                <p className="text-center text-xs tracking-widest uppercase mb-6" style={{ color: '#b0a090', letterSpacing: '0.22em' }}>
                    Pracujemy z najlepszymi markami
                </p>
                <div className="relative overflow-hidden" style={{ maskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)' }}>
                    <div className="marquee-track">
                        {doubled.map((brand, i) => (
                            <div
                                key={i}
                                className="flex items-center justify-center mx-10 md:mx-14"
                                style={{ minWidth: '120px' }}
                            >
                                <span
                                    className="font-semibold tracking-widest uppercase whitespace-nowrap"
                                    style={{
                                        fontFamily: "'Playfair Display', serif",
                                        fontSize: '0.95rem',
                                        color: '#8a7060',
                                        letterSpacing: '0.18em',
                                    }}
                                >
                                    {brand}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </>
    );
}
