'use client';
import Link from 'next/link';
import type { Route } from 'next';
import { useAuth } from '@/contexts/AuthContext';

export default function Navbar() {
    const { role, initialized } = useAuth();
    const linkClass = ' ';

    // During SSR and initial hydration, treat role as null to avoid mismatch
    const effectiveRole = initialized ? role : null;
    const dashboardRoute = effectiveRole ? ('/dashboard' as Route) : undefined;

    return (
        <nav
            aria-label="Main navigation"
            className="d-flex justify-content-between align-items-center p-3 bg-light shadow"
        >
            <Link
                href={'/' as Route}
                className={`fw-bold fs-5 me-3 ${linkClass}`}
            >
                SalonBW Panel
            </Link>
            <ul className="d-flex gap-2">
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
