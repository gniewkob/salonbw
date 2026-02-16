'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { trackEvent } from '@/utils/analytics';
import type { Route } from 'next';
import { getPanelUrl } from '@/utils/panelUrl';
import { BUSINESS_INFO } from '@/config/content';

export default function Navbar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const linkClass =
        'transition duration-150 hover:text-brand-gold focus:outline-none focus:ring-2 focus:ring-brand-gold focus:ring-offset-2';
    const mobileLinkClass = 'block py-2 px-4 hover:bg-gray-100';

    // Booking requires login - redirect to panel with return URL
    const bookingUrl = getPanelUrl(
        `/auth/login?redirect=${encodeURIComponent('/appointments')}`
    );

    // Close mobile menu on route change
    useEffect(() => {
        const handleRouteChange = () => setMobileMenuOpen(false);
        window.addEventListener('popstate', handleRouteChange);
        return () => window.removeEventListener('popstate', handleRouteChange);
    }, []);

    // Close mobile menu on Escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setMobileMenuOpen(false);
        };
        if (mobileMenuOpen) {
            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [mobileMenuOpen]);

    return (
        <nav
            aria-label="Nawigacja główna"
            className="bg-white shadow-md sticky top-0 z-50"
        >
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center py-4">
                    {/* Logo */}
                    <Link
                        href={'/' as Route}
                        className={`font-bold text-xl text-black ${linkClass}`}
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        Salon Black & White
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-6">
                        <ul className="flex items-center space-x-6">
                            <li>
                                <Link
                                    href={'/' as Route}
                                    className={linkClass}
                                >
                                    Start
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href={'/services' as Route}
                                    className={linkClass}
                                >
                                    Usługi
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href={'/gallery' as Route}
                                    className={linkClass}
                                >
                                    Galeria
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href={'/contact' as Route}
                                    className={linkClass}
                                >
                                    Kontakt
                                </Link>
                            </li>
                        </ul>

                        {/* Book Appointment Button - requires login */}
                        <a
                            href={bookingUrl}
                            className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition focus:outline-none focus:ring-2 focus:ring-brand-gold"
                            onClick={() =>
                                trackEvent('begin_checkout', { cta: 'navbar' })
                            }
                        >
                            {BUSINESS_INFO.booking.text}
                        </a>
                    </div>

                    {/* Mobile Hamburger Button */}
                    <button
                        className="md:hidden p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-gold"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Toggle menu"
                        aria-expanded={mobileMenuOpen}
                        aria-controls="mobile-menu"
                    >
                        <svg
                            className="w-6 h-6"
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
                    <div
                        id="mobile-menu"
                        className="md:hidden border-t border-gray-200 py-4"
                    >
                        <ul className="space-y-2">
                            <li>
                                <Link
                                    href={'/' as Route}
                                    className={mobileLinkClass}
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Start
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href={'/services' as Route}
                                    className={mobileLinkClass}
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Usługi
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href={'/gallery' as Route}
                                    className={mobileLinkClass}
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Galeria
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href={'/contact' as Route}
                                    className={mobileLinkClass}
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Kontakt
                                </Link>
                            </li>
                        </ul>

                        {/* Book Appointment Button - Mobile (requires login) */}
                        <div className="px-4 mt-4">
                            <a
                                href={bookingUrl}
                                className="block w-full text-center bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 transition focus:outline-none focus:ring-2 focus:ring-brand-gold"
                                onClick={() => {
                                    setMobileMenuOpen(false);
                                    trackEvent('begin_checkout', {
                                        cta: 'mobile_menu',
                                    });
                                }}
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
