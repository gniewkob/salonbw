'use client';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { Route } from 'next';
import { useAuth } from '@/contexts/AuthContext';
import { can } from '@/utils/access';
import type { Permission } from '@/utils/access';
import type { Role } from '@/types';

type NavLink = { href: Route; label: string; permission: Permission };

const homeLink: Record<Role, NavLink> = {
    client: {
        href: '/appointments' as Route,
        label: 'Home',
        permission: 'nav:appointments',
    },
    employee: {
        href: '/appointments' as Route,
        label: 'Home',
        permission: 'nav:appointments',
    },
    receptionist: {
        href: '/appointments' as Route,
        label: 'Home',
        permission: 'nav:appointments',
    },
    admin: {
        href: '/appointments' as Route,
        label: 'Home',
        permission: 'nav:appointments',
    },
} as const;

const navItems: NavLink[] = [
    {
        href: '/appointments' as Route,
        label: 'Appointments',
        permission: 'nav:appointments',
    },
    {
        href: '/invoices' as Route,
        label: 'Invoices',
        permission: 'nav:invoices',
    },
    {
        href: '/reviews' as Route,
        label: 'Reviews',
        permission: 'nav:reviews',
    },
    {
        href: '/clients' as Route,
        label: 'Clients',
        permission: 'nav:clients',
    },
    {
        href: '/employees' as Route,
        label: 'Employees',
        permission: 'nav:employees',
    },
    {
        href: '/products' as Route,
        label: 'Products',
        permission: 'nav:products',
    },
    {
        href: '/emails' as Route,
        label: 'Emails',
        permission: 'nav:emails',
    },
];

export default function DashboardNav() {
    const { logout, role } = useAuth();
    const router = useRouter();
    const fallbackRole: Role = 'client';
    const currentRole =
        role === 'client' ||
        role === 'employee' ||
        role === 'receptionist' ||
        role === 'admin'
            ? role
            : fallbackRole;
    const resolvedHome = homeLink[currentRole];
    const links = [
        resolvedHome,
        ...navItems.filter((item) => can(currentRole, item.permission)),
    ];

    return (
        <aside className="w-48 bg-gray-200 p-4 space-y-2 border-r-2 border-gray-300">
            <h2 className="font-bold mb-2">Menu</h2>
            <nav className="space-y-1">
                {links.map((l) => {
                    const isActive = router.pathname.startsWith(l.href);
                    return (
                        <Link
                            key={l.href}
                            href={l.href}
                            aria-current={isActive ? 'page' : undefined}
                            className={`block px-2 py-1 transition duration-150 hover:text-blue-700 ${isActive ? 'font-bold text-blue-600 border-l-4 border-blue-500 pl-2 bg-white' : ''}`}
                            data-testid={`nav-${l.label.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                            {l.label}
                        </Link>
                    );
                })}
                <button
                    className="block text-left px-2 py-1 hover:underline"
                    onClick={() => {
                        void logout();
                    }}
                >
                    Logout
                </button>
            </nav>
        </aside>
    );
}
