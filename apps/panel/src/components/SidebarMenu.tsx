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
                open ? 'block' : 'd-none'
            } w-60 bg-dark text-white position-fixed inset-y-0 start-0 overflow-y-auto`}
            onClick={onClose}
        >
            <div className="p-3 fs-5 fw-bold">Pulpit</div>
            <nav className="gap-1 px-3">
                {links.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        prefetch={false}
                        className="d-block rounded px-2 py-1"
                        data-testid={link.testId}
                    >
                        {link.label}
                    </Link>
                ))}
                <button
                    className="d-block w-100 text-start rounded px-2 py-1"
                    onClick={() => {
                        void onLogout();
                    }}
                >
                    Wyloguj się
                </button>
            </nav>
        </aside>
    );
}
