'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { trackEvent } from '@/utils/analytics';
import type { Route } from 'next';
import { useAuth } from '@/contexts/AuthContext';
import { getPanelUrl } from '@/utils/panelUrl';
import { BUSINESS_INFO } from '@/config/content';

export default function Navbar() {
    const { role, initialized, logout } = useAuth();
    const router = useRouter();
    const isHomePage = router.pathname === '/';
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    const panelDashboard = getPanelUrl('/dashboard');
    const panelLogin = getPanelUrl('/auth/login');
    const bookingUrl = getPanelUrl(`/auth/login?redirect=${encodeURIComponent('/appointments')}`);
    const effectiveRole = initialized ? role : null;
    const dashboardRoute = effectiveRole ? panelDashboard : undefined;

    // On non-home pages, always show solid white navbar
    const transparent = isHomePage && !scrolled;

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
        transparent ? 'text-white/90 hover:text-[#c5a880]' : 'text-gray-800 hover:text-[#c5a880]'
    }`;

    return (
        <nav
            aria-label="Nawigacja główna"
            className="sticky top-0 z-50 transition-all duration-400"
            style={{
                background: transparent ? 'transparent' : 'rgba(255,255,255,0.97)',
                backdropFilter: transparent ? 'none' : 'blur(12px)',
                boxShadow: transparent ? 'none' : '0 1px 24px rgba(0,0,0,0.10)',
                borderBottom: transparent ? '1px solid transparent' : '1px solid rgba(0,0,0,0.06)',
            }}
        >
            <div className="container mx-auto px-4 md:px-8">
                <div className="flex justify-between items-center py-4 md:py-5">
                    {/* Logo */}
                    <Link
                        href={'/' as Route}
                        className="flex items-center focus:outline-none focus:ring-2 focus:ring-[#c5a880]"
                        onClick={() => setMobileMenuOpen(false)}
                        aria-label="Black & White — strona główna"
                    >
                        <Image
                            src="/images/logo.svg"
                            alt="Black & White Akademia Zdrowych Włosów"
                            width={90}
                            height={48}
                            unoptimized
                            style={{
                                height: '48px',
                                width: 'auto',
                                filter: transparent ? 'brightness(0) invert(1)' : 'none',
                                transition: 'filter 0.3s',
                            }}
                        />
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
                            className="btn-gold px-6 py-2.5 text-xs font-semibold uppercase focus:outline-none focus:ring-2 focus:ring-[#c5a880] focus:ring-offset-2"
                            style={{ color: '#fff', borderRadius: '2px', letterSpacing: '0.14em' }}
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
                        <svg className="w-6 h-6" style={{ color: transparent ? '#ffffff' : '#0d0d0d' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                className="btn-gold block w-full text-center py-3.5 text-xs font-semibold uppercase focus:outline-none focus:ring-2 focus:ring-[#c5a880]"
                                style={{ color: '#fff', borderRadius: '2px', letterSpacing: '0.14em' }}
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
