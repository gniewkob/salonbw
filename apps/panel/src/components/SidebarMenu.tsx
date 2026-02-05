'use client';
import Link from 'next/link';
import type { Route } from 'next';

interface LinkItem {
    href: Route;
    label: string;
    testId: string;
}

interface Props {
    open?: boolean;
    onClose?: () => void;
    links: LinkItem[];
    onLogout: () => Promise<void> | void;
}

export default function SidebarMenu({ open, onClose, links, onLogout }: Props) {
    return (
        <aside
            className={`${
                open ? 'block' : 'hidden'
            } md:block w-60 bg-gray-800 text-white md:relative fixed inset-y-0 left-0 z-20 overflow-y-auto`}
            onClick={onClose}
        >
            <div className="p-4 text-xl font-bold">Dashboard</div>
            <nav className="space-y-1 px-4">
                {links.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        prefetch={false}
                        className="block rounded px-2 py-1 hover:bg-gray-700"
                        data-testid={link.testId}
                    >
                        {link.label}
                    </Link>
                ))}
                <button
                    className="block w-full text-left rounded px-2 py-1 hover:bg-gray-700"
                    onClick={() => {
                        void onLogout();
                    }}
                >
                    Logout
                </button>
            </nav>
        </aside>
    );
}
