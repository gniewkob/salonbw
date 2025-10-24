'use client';
import Link from 'next/link';
import type { Route } from 'next';
import { useAuth } from '@/contexts/AuthContext';
import type { Role } from '@/types';

export default function Navbar() {
    const { role } = useAuth();
    const linkClass = 'transition duration-150 hover:text-blue-700';

    const dashboardLinks: Record<Role, Route> = {
        client: '/dashboard/client' as Route,
        employee: '/dashboard/employee' as Route,
        receptionist: '/dashboard/receptionist' as Route,
        admin: '/dashboard/admin' as Route,
    };
    const dashboardRoute =
        role && role in dashboardLinks
            ? dashboardLinks[role as Role]
            : undefined;

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
                    <Link
                        href={'/appointments' as Route}
                        className={linkClass}
                    >
                        Book Now
                    </Link>
                </li>
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
