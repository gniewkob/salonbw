'use client';
import Link from 'next/link';
import { trackEvent } from '@/utils/analytics';
import type { Route } from 'next';
import { useAuth } from '@/contexts/AuthContext';
import { getPanelUrl } from '@/utils/panelUrl';

export default function Navbar() {
    const { role, initialized } = useAuth();
    const linkClass = 'transition duration-150 hover:text-blue-700';

    const panelAppointments = getPanelUrl('/appointments');
    const panelDashboard = getPanelUrl('/dashboard');
    const panelLogin = getPanelUrl('/auth/login');
    const panelRegister = getPanelUrl('/auth/register');

    // During SSR and initial hydration, treat role as null to avoid mismatch
    const effectiveRole = initialized ? role : null;
    const dashboardRoute =
        effectiveRole ? panelDashboard : undefined;

    return (
        <nav
            aria-label="Main navigation"
            className="flex justify-between items-center p-4 bg-gray-100 shadow-md"
        >
            <Link
                href={'/' as Route}
                className={`font-bold text-xl mr-4 ${linkClass}`}
            >
                Salon Black & White
            </Link>
            <ul className="flex space-x-4">
                <li>
                    <Link href={'/' as Route} className={linkClass}>
                        Home
                    </Link>
                </li>
                <li>
                    <Link href={'/services' as Route} className={linkClass}>
                        Services
                    </Link>
                </li>
                <li>
                    <Link href={'/gallery' as Route} className={linkClass}>
                        Gallery
                    </Link>
                </li>
                <li>
                    <Link href={'/faq' as Route} className={linkClass}>
                        FAQ
                    </Link>
                </li>
                <li>
                    <Link href={'/contact' as Route} className={linkClass}>
                        Contact
                    </Link>
                </li>
                <li>
                    <a
                        href={panelAppointments}
                        className={linkClass}
                        onClick={() =>
                            trackEvent('begin_checkout', { cta: 'navbar' })
                        }
                    >
                        Book Now
                    </a>
                </li>
                {dashboardRoute ? (
                    <li>
                        <a href={dashboardRoute} className={linkClass}>
                            Dashboard
                        </a>
                    </li>
                ) : (
                    <>
                        <li>
                            <a href={panelLogin} className={linkClass}>
                                Login
                            </a>
                        </li>
                        <li>
                            <a href={panelRegister} className={linkClass}>
                                Register
                            </a>
                        </li>
                    </>
                )}
                <li>
                    <Link href={'/policy' as Route} className={linkClass}>
                        Policy
                    </Link>
                </li>
                <li>
                    <Link href={'/privacy' as Route} className={linkClass}>
                        Privacy
                    </Link>
                </li>
            </ul>
        </nav>
    );
}
