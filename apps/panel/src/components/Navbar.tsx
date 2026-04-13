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
            aria-label="Nawigacja główna"
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
                            Pulpit
                        </Link>
                    </li>
                ) : (
                    <>
                        <li>
                            <Link
                                href={'/auth/login' as Route}
                                className={linkClass}
                            >
                                Zaloguj się
                            </Link>
                        </li>
                        <li>
                            <Link
                                href={'/auth/register' as Route}
                                className={linkClass}
                            >
                                Zarejestruj się
                            </Link>
                        </li>
                    </>
                )}
            </ul>
        </nav>
    );
}
