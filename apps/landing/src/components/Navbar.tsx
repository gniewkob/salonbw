import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { trackEvent } from '@/utils/analytics';
import type { Route } from 'next';
import { useAuth } from '@/contexts/AuthContext';
import { getPanelUrl } from '@/utils/panelUrl';
import { BUSINESS_INFO } from '@/config/content';
import { useLanguage } from '@/contexts/LanguageContext';
import { LANGUAGES } from '@/i18n/translations';
import BookingModal from '@/components/BookingModal';

export default function Navbar() {
    const { role, initialized, logout } = useAuth();
    const { lang, setLang, T } = useLanguage();
    const router = useRouter();
    const isHomePage = router.pathname === '/';
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [bookingModalOpen, setBookingModalOpen] = useState(false);

    const panelDashboard = getPanelUrl('/dashboard');
    const panelLogin = getPanelUrl('/auth/login');
    const effectiveRole = initialized ? role : null;
    const dashboardRoute = effectiveRole ? panelDashboard : undefined;

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

    const navLinkClass = 'transition duration-200 text-sm tracking-wide font-medium text-gray-800 hover:text-[#b4b8be] focus:outline-none focus:ring-2 focus:ring-offset-2';

    return (
        <>
        <nav
            aria-label="Nawigacja główna"
            className="sticky top-0 z-50 transition-all duration-400"
            style={{
                background: transparent ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.97)',
                backdropFilter: 'blur(12px)',
                boxShadow: transparent ? 'none' : '0 1px 24px rgba(0,0,0,0.10)',
                borderBottom: transparent ? '1px solid rgba(255,255,255,0.3)' : '1px solid rgba(0,0,0,0.06)',
            }}
        >
            <div className="container mx-auto px-4 md:px-8">
                <div className="flex justify-between items-center py-4 md:py-5">
                    {/* Logo */}
                    <Link
                        href={'/' as Route}
                        className="flex items-center focus:outline-none focus:ring-2 focus:ring-[#b4b8be]"
                        onClick={() => setMobileMenuOpen(false)}
                        aria-label="Black & White — strona główna"
                    >
                        <Image
                            src="/images/logo.svg"
                            alt="Black & White Akademia Zdrowych Włosów"
                            width={90}
                            height={48}
                            unoptimized
                            style={{ height: '48px', width: 'auto' }}
                        />
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8">
                        <ul className="flex items-center gap-7">
                            {[
                                { label: T.nav.home, href: '/' },
                                { label: T.nav.about, href: '/about' },
                                { label: T.nav.services, href: '/services' },
                                { label: T.nav.gallery, href: '/gallery' },
                                { label: T.nav.contact, href: '/contact' },
                            ].map(({ label, href }) => {
                                const pathname = router.pathname ?? '';
                                const active = pathname === href || (href !== '/' && pathname.startsWith(href));
                                return (
                                    <li key={href}>
                                        <Link
                                            href={href as Route}
                                            className={navLinkClass}
                                            style={active ? { color: '#b4b8be', borderBottom: '1px solid #b4b8be', paddingBottom: '2px' } : undefined}
                                            aria-current={active ? 'page' : undefined}
                                        >
                                            {label}
                                        </Link>
                                    </li>
                                );
                            })}
                            {dashboardRoute ? (
                                <>
                                    <li><a href={dashboardRoute} className={navLinkClass}>{T.nav.panel}</a></li>
                                    <li>
                                        <button onClick={() => { void handleLogout(); }} className={navLinkClass} type="button">
                                            {T.nav.logout}
                                        </button>
                                    </li>
                                </>
                            ) : (
                                <li>
                                    <button
                                        type="button"
                                        onClick={() => setBookingModalOpen(true)}
                                        className={navLinkClass}
                                    >
                                        {T.nav.login}
                                    </button>
                                </li>
                            )}
                        </ul>

                        {/* Language switcher */}
                        <div className="flex items-center gap-1" aria-label="Wybór języka">
                            {LANGUAGES.map(({ code, label }) => (
                                <button
                                    key={code}
                                    type="button"
                                    onClick={() => setLang(code)}
                                    className="text-xs font-semibold tracking-wider transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#b4b8be] px-1 py-0.5"
                                    style={{
                                        color: lang === code ? '#b4b8be' : 'var(--brand-warm-muted)',
                                        borderBottom: lang === code ? '1px solid #b4b8be' : '1px solid transparent',
                                    }}
                                    aria-pressed={lang === code}
                                    aria-label={`Język: ${label}`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        <button
                            className="btn-silver px-6 py-2.5 text-xs font-semibold uppercase focus:outline-none focus:ring-2 focus:ring-[#b4b8be] focus:ring-offset-2"
                            style={{ borderRadius: '2px', letterSpacing: '0.14em' }}
                            onClick={() => { trackEvent('begin_checkout', { cta: 'navbar' }); setBookingModalOpen(true); }}
                        >
                            {T.nav.booking}
                        </button>
                    </div>

                    {/* Mobile Hamburger */}
                    <button
                        className="md:hidden p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#b4b8be]"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Toggle menu"
                        aria-expanded={mobileMenuOpen}
                        aria-controls="mobile-menu"
                    >
                        <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                            <div>{T.hours.mondayFriday}: {BUSINESS_INFO.hours.mondayFriday}</div>
                            <div>{T.hours.saturday}: {BUSINESS_INFO.hours.saturday}</div>
                        </div>

                        <ul className="space-y-1">
                            {[
                                { label: T.nav.home, href: '/' },
                                { label: T.nav.about, href: '/about' },
                                { label: T.nav.services, href: '/services' },
                                { label: T.nav.gallery, href: '/gallery' },
                                { label: T.nav.contact, href: '/contact' },
                            ].map(({ label, href }) => {
                                const pathname = router.pathname ?? '';
                                const active = pathname === href || (href !== '/' && pathname.startsWith(href));
                                return (
                                    <li key={href}>
                                        <Link
                                            href={href as Route}
                                            className="block py-2.5 px-4 text-sm font-medium transition"
                                            style={{ color: active ? '#b4b8be' : undefined }}
                                            onClick={() => setMobileMenuOpen(false)}
                                            aria-current={active ? 'page' : undefined}
                                        >
                                            {label}
                                        </Link>
                                    </li>
                                );
                            })}
                            {dashboardRoute ? (
                                <>
                                    <li><a href={dashboardRoute} className="block py-2.5 px-4 text-gray-800 hover:text-[#b4b8be] text-sm font-medium transition">{T.nav.panel}</a></li>
                                    <li>
                                        <button
                                            onClick={() => { void handleLogout(); setMobileMenuOpen(false); }}
                                            className="block w-full text-left py-2.5 px-4 text-gray-800 hover:text-[#b4b8be] text-sm font-medium transition"
                                            type="button"
                                        >
                                            {T.nav.logout}
                                        </button>
                                    </li>
                                </>
                            ) : (
                                <li>
                                    <button
                                        type="button"
                                        onClick={() => { setBookingModalOpen(true); setMobileMenuOpen(false); }}
                                        className="block w-full text-left py-2.5 px-4 text-gray-800 hover:text-[#b4b8be] text-sm font-medium transition"
                                    >
                                        {T.nav.login}
                                    </button>
                                </li>
                            )}
                        </ul>

                        {/* Mobile language switcher */}
                        <div className="flex items-center gap-3 px-4 mt-3 mb-2">
                            {LANGUAGES.map(({ code, label }) => (
                                <button
                                    key={code}
                                    type="button"
                                    onClick={() => { setLang(code); }}
                                    className="text-xs font-semibold tracking-wider transition-colors duration-150 focus:outline-none"
                                    style={{ color: lang === code ? '#b4b8be' : 'var(--brand-warm-muted)', borderBottom: lang === code ? '1px solid #b4b8be' : '1px solid transparent' }}
                                    aria-pressed={lang === code}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        <div className="px-4 mt-4">
                            <button
                                className="btn-silver block w-full text-center py-3.5 text-xs font-semibold uppercase focus:outline-none focus:ring-2 focus:ring-[#b4b8be]"
                                style={{ borderRadius: '2px', letterSpacing: '0.14em' }}
                                onClick={() => { setMobileMenuOpen(false); trackEvent('begin_checkout', { cta: 'mobile_menu' }); setBookingModalOpen(true); }}
                            >
                                {T.nav.booking}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </nav>
        <BookingModal open={bookingModalOpen} onClose={() => setBookingModalOpen(false)} />
        </>
    );
}
