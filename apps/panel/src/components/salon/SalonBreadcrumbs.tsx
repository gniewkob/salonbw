import Link from 'next/link';

export interface VersumBreadcrumbItem {
    label: string;
    href?: string;
}

interface VersumBreadcrumbsProps {
    iconClass: string;
    items: VersumBreadcrumbItem[];
}

export default function VersumBreadcrumbs({
    iconClass,
    items,
}: VersumBreadcrumbsProps) {
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
