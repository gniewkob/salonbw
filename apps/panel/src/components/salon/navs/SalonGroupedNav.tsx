import Link from 'next/link';

interface ListNavItem {
    id: string;
    label: string;
    href: string;
    active: boolean;
}

interface NavGroup {
    id: string;
    heading: string;
    items: ListNavItem[];
}

interface SalonGroupedNavProps {
    heading: string;
    groups: NavGroup[];
}

export default function SalonGroupedNav({
    heading,
    groups,
}: SalonGroupedNavProps) {
    return (
        <div className="column_row">
            <div className="nav-header">{heading}</div>
            {groups.map((group) => (
                <div key={group.id} className="nav-group">
                    <div className="nav-group-heading">{group.heading}</div>
                    <ul className="nav nav-list">
                        {group.items.map((item) => (
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
            ))}
        </div>
    );
}
