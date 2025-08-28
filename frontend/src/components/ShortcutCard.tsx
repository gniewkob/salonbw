import Link from 'next/link';
import { ReactNode } from 'react';

interface Props {
    href: string;
    icon: ReactNode;
    label: string;
}

export default function ShortcutCard({ href, icon, label }: Props) {
    return (
        <Link
            href={href}
            className="flex flex-col items-center justify-center p-4 bg-white rounded shadow hover:bg-gray-50"
        >
            <div className="text-3xl">{icon}</div>
            <div className="mt-2 text-sm font-medium text-center">{label}</div>
        </Link>
    );
}
