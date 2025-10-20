'use client';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { can } from '@/utils/access';
import type { Permission } from '@/utils/access';
import type { Role } from '@/types';

const homeLink: Record<
    Role,
    { href: string; label: string; permission: Permission }
> = {
    client: {
        href: '/dashboard/client',
        label: 'Home',
        permission: 'dashboard:client',
    },
    employee: {
        href: '/dashboard/employee',
        label: 'Home',
        permission: 'dashboard:employee',
    },
    receptionist: {
        href: '/dashboard/receptionist',
        label: 'Home',
        permission: 'dashboard:receptionist',
    },
    admin: {
        href: '/dashboard/admin',
        label: 'Home',
        permission: 'dashboard:admin',
    },
};

const navItems: { href: string; label: string; permission: Permission }[] = [
    {
        href: '/appointments',
        label: 'Appointments',
        permission: 'nav:appointments',
    },
    { href: '/invoices', label: 'Invoices', permission: 'nav:invoices' },
    { href: '/reviews', label: 'Reviews', permission: 'nav:reviews' },
    { href: '/clients', label: 'Clients', permission: 'nav:clients' },
    { href: '/employees', label: 'Employees', permission: 'nav:employees' },
    { href: '/products', label: 'Products', permission: 'nav:products' },
    { href: '/emails', label: 'Emails', permission: 'nav:emails' },
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
                    onClick={logout}
                >
                    Logout
                </button>
            </nav>
        </aside>
    );
}
