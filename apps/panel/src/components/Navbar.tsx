'use client';
import Link from 'next/link';
import type { Route } from 'next';
import { useAuth } from '@/contexts/AuthContext';

export default function Navbar() {
    const { role, initialized } = useAuth();
    const linkClass = 'transition duration-150 hover:text-blue-700';

    // During SSR and initial hydration, treat role as null to avoid mismatch
    const effectiveRole = initialized ? role : null;
    const dashboardRoute = effectiveRole ? ('/dashboard' as Route) : undefined;

    return (
        <nav
            aria-label="Main navigation"
            className="flex justify-between items-center p-4 bg-gray-100 shadow-md"
        >
            <Link
                href={'/' as Route}
                className={`font-bold text-xl mr-4 ${linkClass}`}
            >
                SalonBW Panel
            </Link>
            <ul className="flex space-x-4">
                {dashboardRoute ? (
                    <li>
                        <Link href={dashboardRoute} className={linkClass}>
                            Dashboard
                        </Link>
                    </li>
                ) : (
                    <>
                        <li>
                            <Link
                                href={'/auth/login' as Route}
                                className={linkClass}
                            >
                                Login
                            </Link>
                        </li>
                        <li>
                            <Link
                                href={'/auth/register' as Route}
                                className={linkClass}
                            >
                                Register
                            </Link>
                        </li>
                    </>
                )}
            </ul>
        </nav>
    );
}
