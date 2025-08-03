'use client';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import type { Role } from '@/types';

const links: Record<Role, { href: string; label: string }[]> = {
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

interface Props {
    open?: boolean;
    onClose?: () => void;
}

export default function SidebarMenu({ open, onClose }: Props) {
    const { logout, role } = useAuth();
    const currentRole: Role =
        role === 'client' ||
        role === 'employee' ||
        role === 'receptionist' ||
        role === 'admin'
            ? role
            : 'client';

    const content = (
        <nav className="space-y-1 px-4">
            {links[currentRole].map((l) => (
                <Link
                    key={l.href}
                    href={l.href}
                    className="block rounded px-2 py-1 hover:bg-gray-700"
                >
                    {l.label}
                </Link>
            ))}
            <button
                className="block w-full text-left rounded px-2 py-1 hover:bg-gray-700"
                onClick={logout}
            >
                Logout
            </button>
        </nav>
    );

    return (
        <aside
            className={`${
                open ? 'block' : 'hidden'
            } md:block w-60 bg-gray-800 text-white md:relative fixed inset-y-0 left-0 z-20 overflow-y-auto`}
            onClick={onClose}
        >
            <div className="p-4 text-xl font-bold">Dashboard</div>
            {content}
        </aside>
    );
}
