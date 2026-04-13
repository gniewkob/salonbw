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
        href: '/dashboard' as Route,
        label: 'Home',
        permission: 'dashboard:client',
    },
    employee: {
        href: '/dashboard' as Route,
        label: 'Home',
        permission: 'dashboard:employee',
    },
    receptionist: {
        href: '/dashboard' as Route,
        label: 'Home',
        permission: 'dashboard:receptionist',
    },
    admin: {
        href: '/dashboard' as Route,
        label: 'Home',
        permission: 'dashboard:admin',
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
        href: '/customers' as Route,
        label: 'Clients',
        permission: 'nav:customers',
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
        <aside className="w-48 bg-secondary bg-opacity-25 p-3 gap-2 border-end-2 border-secondary border-opacity-50">
            <h2 className="fw-bold mb-2">Menu</h2>
            <nav className="gap-1">
                {links.map((l) => {
                    const isActive = router.pathname.startsWith(l.href);
                    return (
                        <Link
                            key={l.href}
                            href={l.href}
                            prefetch={false}
                            aria-current={isActive ? 'page' : undefined}
                            className={`d-block px-2 py-1 duration-150 ${isActive ? 'fw-bold text-primary border-start-4 border-primary ps-2 bg-white' : ''}`}
                            data-testid={`nav-${l.label.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                            {l.label}
                        </Link>
                    );
                })}
                <button
                    className="d-block text-start px-2 py-1"
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
