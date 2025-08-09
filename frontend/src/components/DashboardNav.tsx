'use client';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import type { Role } from '@/types';

const navLinks: Record<Role, { href: string; label: string }[]> = {
    client: [
        { href: '/dashboard/client', label: 'Home' },
        { href: '/appointments', label: 'Appointments' },
        { href: '/invoices', label: 'Invoices' },
        { href: '/reviews', label: 'Reviews' },
    ],
    employee: [
        { href: '/dashboard/employee', label: 'Home' },
        { href: '/appointments', label: 'Appointments' },
        { href: '/clients', label: 'Clients' },
    ],
    receptionist: [
        { href: '/dashboard/receptionist', label: 'Home' },
        { href: '/appointments', label: 'Appointments' },
    ],
    admin: [
        { href: '/dashboard/admin', label: 'Home' },
        { href: '/appointments', label: 'Appointments' },
        { href: '/clients', label: 'Clients' },
        { href: '/employees', label: 'Employees' },
        { href: '/products', label: 'Products' },
        { href: '/emails', label: 'Emails' },
    ],
};

export default function DashboardNav() {
    const { logout, role } = useAuth();
    const router = useRouter();
    const currentRole: Role =
        role === 'client' ||
        role === 'employee' ||
        role === 'receptionist' ||
        role === 'admin'
            ? role
            : 'client';

    return (
        <aside className="w-48 bg-gray-200 p-4 space-y-2 border-r-2 border-gray-300">
            <h2 className="font-bold mb-2">Menu</h2>
            <nav className="space-y-1">
                {navLinks[currentRole].map((l) => {
                    const isActive = router.pathname.startsWith(l.href);
                    return (
                        <Link
                            key={l.href}
                            href={l.href}
                            aria-current={isActive ? 'page' : undefined}
                            className={`block px-2 py-1 transition duration-150 hover:text-blue-700 ${isActive ? 'font-bold text-blue-600 border-l-4 border-blue-500 pl-2 bg-white' : ''}`}
                        >
                            {l.label}
                        </Link>
                    );
                })}
                <button
                    className="block text-left px-2 py-1 hover:underline"
                    onClick={logout}
                >
                    Logout
                </button>
            </nav>
        </aside>
    );
}
