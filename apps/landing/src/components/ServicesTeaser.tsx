import Link from 'next/link';
import { Scissors, Sparkles, Wand2, type LucideIcon } from 'lucide-react';
import SectionHeader from './SectionHeader';

const services: Array<{
    icon: LucideIcon;
    title: string;
    subtitle: string;
    description: string;
    href: string;
    featured?: boolean;
}> = [
    {
        icon: Scissors,
        title: 'Fryzjerstwo',
        subtitle: 'Strzyżenie & Koloryzacja',
        description: 'Cięcia damskie i męskie, koloryzacja, balayage, ombre — tworzone z pasją przez doświadczonych stylistów.',
        href: '/services',
    },
    {
        icon: Sparkles,
        title: 'Akademia Pielęgnacji',
        subtitle: 'Botox • Złote Proteiny • SPA',
        description: 'Zabiegi regeneracyjne Kérastase i Nioxin, botox na włosy oraz luksusowe SPA dla zniszczonych lub cienkich włosów.',
        href: '/services',
        featured: true,
    },
    {
        icon: Wand2,
        title: 'Przedłużanie Włosów',
        subtitle: 'Metoda HairTalk',
        description: 'Naturalne przedłużanie i zagęszczanie włosów metodą HairTalk — dyskretne, trwałe, dopasowane do Ciebie.',
        href: '/services',
    },
];

export default function ServicesTeaser() {
    return (
        <section className="py-20 md:py-28" style={{ background: '#ffffff' }}>
            <div className="container mx-auto px-4 md:px-8">
                <SectionHeader eyebrow="Czym możemy służyć" title="Nasze usługi" />

                {/* Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                    {services.map(({ icon: Icon, title, subtitle, description, href, featured }) => (
                        <Link
                            key={title}
                            href={href}
                            className="group relative flex flex-col p-8 md:p-10 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#c5a880] focus:ring-offset-4"
                            style={{
                                background: featured ? '#0d0d0d' : '#faf9f7',
                                border: featured ? 'none' : '1px solid #ede9e3',
                                borderRadius: '3px',
                                textDecoration: 'none',
                            }}
                        >
                            {featured && (
                                <span className="absolute top-4 right-4 text-xs tracking-widest uppercase px-2 py-1" style={{ color: '#c5a880', border: '1px solid #c5a880', fontSize: '9px', letterSpacing: '0.2em' }}>
                                    Polecane
                                </span>
                            )}

                            <div className="mb-6 w-11 h-11 flex items-center justify-center" style={{ background: featured ? 'rgba(197,168,128,0.15)' : 'rgba(197,168,128,0.1)', borderRadius: '2px' }}>
                                <Icon size={22} style={{ color: '#c5a880', strokeWidth: 1.5 }} />
                            </div>

                            <h3 className="text-xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: featured ? '#ffffff' : '#0d0d0d' }}>
                                {title}
                            </h3>
                            <p className="text-xs tracking-wider uppercase mb-4" style={{ color: '#c5a880', letterSpacing: '0.14em' }}>
                                {subtitle}
                            </p>
                            <p className="text-sm leading-relaxed flex-grow" style={{ color: featured ? 'rgba(255,255,255,0.65)' : '#6b5f52' }}>
                                {description}
                            </p>

                            <span
                                className="mt-8 inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase transition-all duration-200"
                                style={{ color: '#c5a880', letterSpacing: '0.16em' }}
                            >
                                Dowiedz się więcej
                                <svg className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </span>
                        </Link>
                    ))}
                </div>

                <div className="text-center mt-12">
                    <Link
                        href="/services"
                        className="btn-outline-dark inline-block px-8 py-3.5 text-xs font-semibold uppercase focus:outline-none focus:ring-2 focus:ring-[#c5a880] focus:ring-offset-2"
                        style={{ borderRadius: '2px', letterSpacing: '0.16em' }}
                    >
                        Pełna oferta usług
                    </Link>
                </div>
            </div>
        </section>
    );
}
