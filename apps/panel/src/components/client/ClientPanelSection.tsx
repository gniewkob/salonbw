import Link from 'next/link';
import type { ReactNode } from 'react';

interface ClientPanelSectionProps {
    children: ReactNode;
    className?: string;
    count?: number;
    footerHref?: string;
    footerLabel?: string;
    title: string;
}

export default function ClientPanelSection({
    children,
    className,
    count,
    footerHref,
    footerLabel,
    title,
}: ClientPanelSectionProps) {
    return (
        <section
            className={['salonbw-dashboard__section', className]
                .filter(Boolean)
                .join(' ')}
        >
            <div className="salonbw-dashboard__section-header">
                <h2>
                    {title}
                    {typeof count === 'number' && count > 0 ? (
                        <span className="text-muted fw-normal"> ({count})</span>
                    ) : null}
                </h2>
            </div>
            {children}
            {footerHref && footerLabel ? (
                <Link
                    href={footerHref}
                    className="salonbw-dashboard__section-footer"
                >
                    {footerLabel}
                </Link>
            ) : null}
        </section>
    );
}
