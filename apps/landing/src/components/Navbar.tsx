import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { trackEvent } from '@/utils/analytics';
import type { Route } from 'next';
import { useAuth } from '@/contexts/AuthContext';
import { getPanelUrl } from '@/utils/panelUrl';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOpeningHours } from '@/hooks/useOpeningHours';
import { LANGUAGES } from '@/i18n/translations';
import BookingModal from '@/components/BookingModal';

export default function Navbar() {
    const { role, initialized, logout } = useAuth();
    const { lang, setLang, T } = useLanguage();
    const { lines: openingHours } = useOpeningHours();
    const router = useRouter();
    const isHomePage = router.pathname === '/';
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [bookingModalOpen, setBookingModalOpen] = useState(false);

    const panelDashboard = getPanelUrl('/dashboard');
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

    const navLinkClass =
        'transition duration-200 text-sm tracking-wide font-medium text-gray-800 hover:text-[var(--brand-silver)]';

    return (
        <>
            <nav
                aria-label="Nawigacja główna"
                className="sticky top-0 z-50 transition-all duration-400"
                style={{
                    background: transparent
                        ? 'rgba(255,255,255,0.55)'
                        : 'rgba(255,255,255,0.97)',
                    backdropFilter: 'blur(12px)',
                    boxShadow: transparent
                        ? 'none'
                        : '0 1px 24px rgba(0,0,0,0.10)',
                    borderBottom: transparent
                        ? '1px solid rgba(255,255,255,0.3)'
                        : '1px solid rgba(0,0,0,0.06)',
                }}
            >
                <div className="bw-container">
                    <div className="flex justify-between items-center py-4 md:py-5">
                        {/* Logo */}
                        <Link
                            href={'/' as Route}
                            className="flex items-center"
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
                                    { label: T.nav.about, href: '/#about' },
                                    {
                                        label: T.nav.services,
                                        href: '/services',
                                    },
                                    { label: T.nav.gallery, href: '/gallery' },
                                    { label: T.nav.contact, href: '/contact' },
                                ].map(({ label, href }) => {
                                    const pathname = router.pathname ?? '';
                                    const active =
                                        pathname === href ||
                                        (href !== '/' &&
                                            pathname.startsWith(href));
                                    return (
                                        <li key={href}>
                                            <Link
                                                href={href as Route}
                                                className={navLinkClass}
                                                style={
                                                    active
                                                        ? {
                                                              color: 'var(--brand-silver-ink)',
                                                              borderBottom:
                                                                  '1px solid var(--brand-silver)',
                                                              paddingBottom:
                                                                  '2px',
                                                          }
                                                        : undefined
                                                }
                                                aria-current={
                                                    active ? 'page' : undefined
                                                }
                                            >
                                                {label}
                                            </Link>
                                        </li>
                                    );
                                })}
                                {dashboardRoute ? (
                                    <>
                                        <li>
                                            <a
                                                href={dashboardRoute}
                                                className={navLinkClass}
                                            >
                                                {T.nav.panel}
                                            </a>
                                        </li>
                                        <li>
                                            <button
                                                onClick={() => {
                                                    void handleLogout();
                                                }}
                                                className={navLinkClass}
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
                                            onClick={() =>
                                                setBookingModalOpen(true)
                                            }
                                            className={navLinkClass}
                                        >
                                            {T.nav.login}
                                        </button>
                                    </li>
                                )}
                            </ul>

                            {/* Language switcher */}
                            <div
                                className="flex items-center gap-1"
                                aria-label="Wybór języka"
                            >
                                {LANGUAGES.map(({ code, label }) => (
                                    <button
                                        key={code}
                                        type="button"
                                        onClick={() => setLang(code)}
                                        className="nav-lang text-xs font-semibold tracking-wider transition-colors duration-150"
                                        style={{
                                            color:
                                                lang === code
                                                    ? 'var(--brand-silver-ink)'
                                                    : 'var(--brand-warm-muted)',
                                            borderBottom:
                                                lang === code
                                                    ? '1px solid var(--brand-silver)'
                                                    : '1px solid transparent',
                                        }}
                                        aria-pressed={lang === code}
                                        aria-label={`Język: ${label}`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>

                            <button
                                type="button"
                                className="bw-btn bw-btn--primary bw-btn--compact"
                                onClick={() => {
                                    trackEvent('begin_checkout', {
                                        cta: 'navbar',
                                    });
                                    setBookingModalOpen(true);
                                }}
                            >
                                {T.nav.booking}
                            </button>
                        </div>

                        {/* Mobile Hamburger */}
                        <button
                            type="button"
                            className="md:hidden p-2 rounded"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-label="Otwórz menu"
                            aria-expanded={mobileMenuOpen}
                            aria-controls="mobile-menu"
                        >
                            <svg
                                aria-hidden="true"
                                className="w-6 h-6 text-gray-800"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                {mobileMenuOpen ? (
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                ) : (
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                )}
                            </svg>
                        </button>
                    </div>

                    {/* Mobile Menu */}
                    {mobileMenuOpen && (
                        <div id="mobile-menu" className="mnav md:hidden">
                            <ul className="mnav__list">
                                {[
                                    { label: T.nav.home, href: '/' },
                                    { label: T.nav.about, href: '/#about' },
                                    {
                                        label: T.nav.services,
                                        href: '/services',
                                    },
                                    { label: T.nav.gallery, href: '/gallery' },
                                    { label: T.nav.contact, href: '/contact' },
                                ].map(({ label, href }) => {
                                    const pathname = router.pathname ?? '';
                                    const active =
                                        pathname === href ||
                                        (href !== '/' &&
                                            pathname.startsWith(href));
                                    return (
                                        <li key={href}>
                                            <Link
                                                href={href as Route}
                                                className="mnav__link"
                                                onClick={() =>
                                                    setMobileMenuOpen(false)
                                                }
                                                aria-current={
                                                    active ? 'page' : undefined
                                                }
                                            >
                                                {label}
                                            </Link>
                                        </li>
                                    );
                                })}
                                {dashboardRoute ? (
                                    <>
                                        <li>
                                            <a
                                                href={dashboardRoute}
                                                className="mnav__link mnav__link--quiet"
                                            >
                                                {T.nav.panel}
                                            </a>
                                        </li>
                                        <li>
                                            <button
                                                onClick={() => {
                                                    void handleLogout();
                                                    setMobileMenuOpen(false);
                                                }}
                                                className="mnav__link mnav__link--quiet"
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
                                            onClick={() => {
                                                setBookingModalOpen(true);
                                                setMobileMenuOpen(false);
                                            }}
                                            className="mnav__link mnav__link--quiet"
                                        >
                                            {T.nav.login}
                                        </button>
                                    </li>
                                )}
                            </ul>

                            <div className="mnav__cta">
                                <button
                                    type="button"
                                    className="bw-btn bw-btn--primary w-full"
                                    data-booking-cta
                                    onClick={() => {
                                        setMobileMenuOpen(false);
                                        trackEvent('begin_checkout', {
                                            cta: 'mobile_menu',
                                        });
                                        setBookingModalOpen(true);
                                    }}
                                >
                                    {T.nav.booking}
                                </button>
                            </div>
                            {/* Mobile language switcher */}
                            <div
                                className="mnav__langs"
                                role="group"
                                aria-label="Wybór języka"
                            >
                                {LANGUAGES.map(({ code, label }) => (
                                    <button
                                        key={code}
                                        type="button"
                                        onClick={() => {
                                            setLang(code);
                                        }}
                                        className="mnav__lang"
                                        aria-pressed={lang === code}
                                        aria-label={`Język: ${label}`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>

                            <div className="mnav__hours">
                                <p className="mnav__label">
                                    {T.hero.hoursLabel}
                                </p>
                                {openingHours.map((line) => (
                                    <div
                                        key={line.label}
                                        className="mnav__hour"
                                    >
                                        <span>{line.label}</span>
                                        <span>{line.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </nav>
            <BookingModal
                open={bookingModalOpen}
                onClose={() => setBookingModalOpen(false)}
            />
        </>
    );
}
