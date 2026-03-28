import Link from 'next/link';

interface ListNavItem {
    id: string;
    label: string;
    href: string;
    active: boolean;
}

interface SalonBWListNavProps {
    heading: string;
    items: ListNavItem[];
}

export default function SalonBWListNav({
    heading,
    items,
}: SalonBWListNavProps) {
    return (
        <div className="column_row">
            <div className="nav-header">{heading}</div>
            <ul className="nav nav-list">
                {items.map((item) => (
                    <li key={item.id}>
                        <Link
                            href={item.href}
                            className={item.active ? 'active' : ''}
                            title={item.label}
                        >
                            {item.label}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}
