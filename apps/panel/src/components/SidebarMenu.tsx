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
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 h-16 flex items-center justify-between shadow-sm">
            {/* Brand Logo */}
            <div className="flex items-center gap-2">
                <div className="text-brand text-xl font-bold flex items-center gap-2">
                    {/* Placeholder for Logo SVG */}
                    <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                        <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.75 9.5 9.75 12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z" />
                    </svg>
                    Versum
                </div>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-1">
                {links.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className="px-3 py-2 rounded text-gray-600 hover:bg-gray-50 hover:text-brand transition-colors text-sm font-medium flex items-center gap-2"
                        data-testid={link.testId}
                    >
                        {/* Simple icon placeholder based on label */}
                        {link.label}
                    </Link>
                ))}
            </div>

            {/* User Actions */}
            <div className="flex items-center gap-4">
                <button
                    className="text-sm font-medium text-gray-600 hover:text-red-600 px-3 py-2"
                    onClick={() => {
                        void onLogout();
                    }}
                >
                    Wyloguj
                </button>
            </div>

            {/* Mobile Menu Toggle (Simplified) */}
            <button
                className="md:hidden p-2 text-gray-600"
                onClick={onClose}
                aria-label="Toggle menu"
            >
                <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                    />
                </svg>
            </button>
        </nav>
    );
}
