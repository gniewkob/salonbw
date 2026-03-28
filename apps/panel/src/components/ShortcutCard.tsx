import Link from 'next/link';
import type { Route } from 'next';
import { ReactNode } from 'react';

interface Props {
    href: Route;
    icon: ReactNode;
    label: string;
}

export default function ShortcutCard({ href, icon, label }: Props) {
    return (
        <Link
            href={href}
            className="d-flex flex-column align-items-center justify-content-center p-3 bg-white rounded shadow"
        >
            <div className="fs-2">{icon}</div>
            <div className="mt-2 small fw-medium text-center">{label}</div>
        </Link>
    );
}
