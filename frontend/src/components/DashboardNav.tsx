import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

type Role = 'client' | 'employee' | 'admin';

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
    const { logout } = useAuth();
    const [role, setRole] = useState<Role>('client');

    useEffect(() => {
        const stored = localStorage.getItem('role');
        if (
            stored === 'client' ||
            stored === 'employee' ||
            stored === 'admin'
        ) {
            setRole(stored);
        }
    }, []);

    return (
        <aside className="w-48 bg-gray-200 p-4 space-y-2">
            <h2 className="font-bold mb-2">Menu</h2>
            <nav className="space-y-1">
                {navLinks[role].map((l) => (
                    <Link key={l.href} href={l.href} className="block">
                        {l.label}
                    </Link>
                ))}
                <button className="block text-left" onClick={logout}>
                    Logout
                </button>
            </nav>
        </aside>
    );
}
