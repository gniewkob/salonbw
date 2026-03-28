import Link from 'next/link';

export interface SalonBreadcrumbItem {
    label: string;
    href?: string;
}

interface SalonBreadcrumbsProps {
    iconClass: string;
    items: SalonBreadcrumbItem[];
}

export default function SalonBreadcrumbs({
    iconClass,
    items,
}: SalonBreadcrumbsProps) {
    if (!items.length) return null;

    return (
        <div className="breadcrumbs" e2e-breadcrumbs="">
            <ul>
                {items.map((item, index) => {
                    const isLast = index === items.length - 1;

                    return (
                        <li key={`${item.label}:${item.href ?? index}`}>
                            {index === 0 ? (
                                <div className={`icon ${iconClass}`} />
                            ) : null}
                            {index > 0 ? <span> / </span> : null}
                            {isLast || !item.href ? (
                                item.label
                            ) : (
                                <Link href={item.href}>{item.label}</Link>
                            )}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
