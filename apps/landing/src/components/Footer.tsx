'use client';
import Link from 'next/link';
import Image from 'next/image';
import type { Route } from 'next';
import { BUSINESS_INFO, FOOTER_LINKS, COPYRIGHT } from '@/config/content';
import { getPanelUrl } from '@/utils/panelUrl';

export default function Footer() {
    const bookingUrl = getPanelUrl(`/auth/login?redirect=${encodeURIComponent('/appointments')}`);

    return (
        <footer style={{ background: 'var(--brand-black)', color: 'rgba(255,255,255,0.75)' }}>
            {/* Top border line */}
            <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, var(--brand-gold), transparent)' }} />

            <div className="container mx-auto px-4 md:px-8" style={{ paddingTop: '4rem', paddingBottom: '2.5rem' }}>
                {/* Logo + tagline row */}
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10 mb-14">
                    <div className="max-w-xs">
                        <Link href={'/' as Route} className="inline-block mb-4 focus:outline-none focus:ring-2 focus:ring-[#c5a880]" aria-label="Black & White — strona główna">
                            <Image
                                src="/images/logo.svg"
                                alt="Black & White"
                                width={80}
                                height={43}
                                unoptimized
                                style={{ filter: 'brightness(0) invert(1)', height: '43px', width: 'auto' }}
                            />
                        </Link>
                        <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.8, letterSpacing: '0.04em' }}>
                            Akademia Zdrowych Włosów<br />
                            {BUSINESS_INFO.address.street}, {BUSINESS_INFO.address.city}
                        </p>
                        <a
                            href={bookingUrl}
                            className="inline-block mt-5 text-xs font-semibold uppercase"
                            style={{
                                background: 'var(--brand-gold)',
                                color: '#fff',
                                padding: '0.7rem 1.6rem',
                                letterSpacing: '0.14em',
                                transition: 'background 0.2s',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--brand-gold-dark)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'var(--brand-gold)')}
                        >
                            {BUSINESS_INFO.booking.text}
                        </a>
                    </div>

                    {/* Links grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                        <div>
                            <p className="text-xs uppercase mb-4" style={{ color: 'var(--brand-gold)', letterSpacing: '0.18em' }}>Nawigacja</p>
                            <ul className="space-y-2.5">
                                {FOOTER_LINKS.navigation.map(link => (
                                    <li key={link.href}>
                                        <Link
                                            href={link.href as Route}
                                            className="text-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#c5a880]"
                                            style={{ color: 'rgba(255,255,255,0.55)' }}
                                            onMouseEnter={e => (e.currentTarget.style.color = 'var(--brand-gold)')}
                                            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <p className="text-xs uppercase mb-4" style={{ color: 'var(--brand-gold)', letterSpacing: '0.18em' }}>Godziny</p>
                            <div className="space-y-2 text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
                                <p>Pn–Pt <span style={{ color: 'rgba(255,255,255,0.85)' }}>{BUSINESS_INFO.hours.mondayFriday}</span></p>
                                <p>Sob <span style={{ color: 'rgba(255,255,255,0.85)' }}>{BUSINESS_INFO.hours.saturday}</span></p>
                                <p>Ndz <span style={{ color: 'rgba(255,255,255,0.35)' }}>{BUSINESS_INFO.hours.sunday}</span></p>
                            </div>
                        </div>

                        <div>
                            <p className="text-xs uppercase mb-4" style={{ color: 'var(--brand-gold)', letterSpacing: '0.18em' }}>Kontakt</p>
                            <div className="space-y-2.5 text-sm">
                                {BUSINESS_INFO.contact.phone && (
                                    <a href={`tel:${BUSINESS_INFO.contact.phone.replace(/\s/g, '')}`}
                                        className="block"
                                        style={{ color: 'rgba(255,255,255,0.55)' }}
                                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--brand-gold)')}
                                        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
                                    >
                                        {BUSINESS_INFO.contact.phone}
                                    </a>
                                )}
                                {BUSINESS_INFO.contact.email && (
                                    <a href={`mailto:${BUSINESS_INFO.contact.email}`}
                                        className="block"
                                        style={{ color: 'rgba(255,255,255,0.55)' }}
                                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--brand-gold)')}
                                        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
                                    >
                                        {BUSINESS_INFO.contact.email}
                                    </a>
                                )}
                                <div className="flex gap-3 pt-1">
                                    <a href={BUSINESS_INFO.social.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook"
                                        style={{ color: 'rgba(255,255,255,0.4)', transition: 'color 0.15s' }}
                                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--brand-gold)')}
                                        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                        </svg>
                                    </a>
                                    <a href={BUSINESS_INFO.social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram"
                                        style={{ color: 'rgba(255,255,255,0.4)', transition: 'color 0.15s' }}
                                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--brand-gold)')}
                                        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                        </svg>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-3 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                    <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.04em' }}>{COPYRIGHT}</p>
                    <div className="flex gap-5">
                        {[{ href: '/privacy', label: 'Polityka prywatności' }, { href: '/policy', label: 'Regulamin' }].map(l => (
                            <Link key={l.href} href={l.href as Route}
                                className="text-xs focus:outline-none focus:ring-2 focus:ring-[#c5a880]"
                                style={{ color: 'rgba(255,255,255,0.3)' }}
                                onMouseEnter={e => (e.currentTarget.style.color = 'var(--brand-gold)')}
                                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
                            >
                                {l.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
}
