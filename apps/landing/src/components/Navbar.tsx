'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { trackEvent } from '@/utils/analytics';
import type { Route } from 'next';
import { useAuth } from '@/contexts/AuthContext';
import { getPanelUrl } from '@/utils/panelUrl';
import { BUSINESS_INFO } from '@/config/content';

export default function Navbar() {
    const { role, initialized, logout } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    const panelDashboard = getPanelUrl('/dashboard');
    const panelLogin = getPanelUrl('/auth/login');
    const bookingUrl = getPanelUrl(`/auth/login?redirect=${encodeURIComponent('/appointments')}`);
    const effectiveRole = initialized ? role : null;
    const dashboardRoute = effectiveRole ? panelDashboard : undefined;

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 60);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const handleLogout = async () => {
        await logout();
        if (typeof window !== 'undefined') window.location.href = '/';
    };

    useEffect(() => {
        const handleRouteChange = () => setMobileMenuOpen(false);
        window.addEventListener('popstate', handleRouteChange);
        return () => window.removeEventListener('popstate', handleRouteChange);
    }, []);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setMobileMenuOpen(false);
        };
        if (mobileMenuOpen) {
            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [mobileMenuOpen]);

    const navLinkClass = `transition duration-200 text-sm tracking-wide font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
        scrolled ? 'text-gray-800 hover:text-[#c5a880]' : 'text-white/90 hover:text-[#c5a880]'
    }`;

    const logoTextColor = scrolled ? '#0d0d0d' : '#ffffff';

    return (
        <nav
            aria-label="Nawigacja główna"
            className="sticky top-0 z-50 transition-all duration-400"
            style={{
                background: scrolled ? 'rgba(255,255,255,0.97)' : 'transparent',
                backdropFilter: scrolled ? 'blur(12px)' : 'none',
                boxShadow: scrolled ? '0 1px 24px rgba(0,0,0,0.10)' : 'none',
                borderBottom: scrolled ? '1px solid rgba(0,0,0,0.06)' : '1px solid transparent',
            }}
        >
            <div className="container mx-auto px-4 md:px-8">
                <div className="flex justify-between items-center py-4 md:py-5">
                    {/* Logo */}
                    <Link
                        href={'/' as Route}
                        className="flex flex-col leading-none focus:outline-none focus:ring-2 focus:ring-[#c5a880]"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        <span
                            className="font-bold tracking-widest uppercase text-xs"
                            style={{ color: logoTextColor, letterSpacing: '0.22em', fontFamily: "'Open Sans', sans-serif", transition: 'color 0.3s' }}
                        >
                            Black &amp; White
                        </span>
                        <span
                            style={{ fontFamily: "'Tangerine', cursive", fontSize: '1.6rem', color: '#c5a880', lineHeight: 1, transition: 'color 0.3s' }}
                        >
                            Akademia Zdrowych Włosów
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8">
                        <ul className="flex items-center gap-7">
                            {[
                                { label: 'Start', href: '/' },
                                { label: 'Usługi', href: '/services' },
                                { label: 'Galeria', href: '/gallery' },
                                { label: 'Kontakt', href: '/contact' },
                            ].map(({ label, href }) => (
                                <li key={href}>
                                    <Link href={href as Route} className={navLinkClass}>{label}</Link>
                                </li>
                            ))}
                            {dashboardRoute ? (
                                <>
                                    <li><a href={dashboardRoute} className={navLinkClass}>Panel</a></li>
                                    <li>
                                        <button
                                            onClick={() => { void handleLogout(); }}
                                            className={navLinkClass}
                                            type="button"
                                        >
                                            Wyloguj
                                        </button>
                                    </li>
                                </>
                            ) : (
                                <li><a href={panelLogin} className={navLinkClass}>Zaloguj</a></li>
                            )}
                        </ul>

                        <a
                            href={bookingUrl}
                            className="px-6 py-2.5 text-xs font-semibold tracking-widest uppercase transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#c5a880] focus:ring-offset-2"
                            style={{
                                background: 'var(--brand-gold, #c5a880)',
                                color: '#fff',
                                borderRadius: '2px',
                                letterSpacing: '0.14em',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#a8895f')}
                            onMouseLeave={e => (e.currentTarget.style.background = '#c5a880')}
                            onClick={() => trackEvent('begin_checkout', { cta: 'navbar' })}
                        >
                            {BUSINESS_INFO.booking.text}
                        </a>
                    </div>

                    {/* Mobile Hamburger */}
                    <button
                        className="md:hidden p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#c5a880]"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Toggle menu"
                        aria-expanded={mobileMenuOpen}
                        aria-controls="mobile-menu"
                    >
                        <svg className="w-6 h-6" style={{ color: scrolled ? '#0d0d0d' : '#ffffff' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {mobileMenuOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div
                        id="mobile-menu"
                        className="md:hidden border-t py-4"
                        style={{ background: 'rgba(255,255,255,0.98)', borderColor: 'rgba(0,0,0,0.08)' }}
                    >
                        <div className="px-4 py-2 text-xs text-gray-500 border-b mb-3" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                            <div>Pn–Pt: {BUSINESS_INFO.hours.mondayFriday}</div>
                            <div>Sob: {BUSINESS_INFO.hours.saturday}</div>
                        </div>

                        <ul className="space-y-1">
                            {[
                                { label: 'Start', href: '/' },
                                { label: 'Usługi', href: '/services' },
                                { label: 'Galeria', href: '/gallery' },
                                { label: 'Kontakt', href: '/contact' },
                            ].map(({ label, href }) => (
                                <li key={href}>
                                    <Link
                                        href={href as Route}
                                        className="block py-2.5 px-4 text-gray-800 hover:text-[#c5a880] text-sm font-medium transition"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        {label}
                                    </Link>
                                </li>
                            ))}
                            {dashboardRoute ? (
                                <>
                                    <li><a href={dashboardRoute} className="block py-2.5 px-4 text-gray-800 hover:text-[#c5a880] text-sm font-medium transition">Panel</a></li>
                                    <li>
                                        <button
                                            onClick={() => { void handleLogout(); setMobileMenuOpen(false); }}
                                            className="block w-full text-left py-2.5 px-4 text-gray-800 hover:text-[#c5a880] text-sm font-medium transition"
                                            type="button"
                                        >
                                            Wyloguj
                                        </button>
                                    </li>
                                </>
                            ) : (
                                <li><a href={panelLogin} className="block py-2.5 px-4 text-gray-800 hover:text-[#c5a880] text-sm font-medium transition">Zaloguj</a></li>
                            )}
                        </ul>

                        <div className="px-4 mt-4">
                            <a
                                href={bookingUrl}
                                className="block w-full text-center py-3.5 text-xs font-semibold tracking-widest uppercase transition focus:outline-none focus:ring-2 focus:ring-[#c5a880]"
                                style={{ background: '#c5a880', color: '#fff', borderRadius: '2px', letterSpacing: '0.14em' }}
                                onClick={() => { setMobileMenuOpen(false); trackEvent('begin_checkout', { cta: 'mobile_menu' }); }}
                            >
                                {BUSINESS_INFO.booking.text}
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}
