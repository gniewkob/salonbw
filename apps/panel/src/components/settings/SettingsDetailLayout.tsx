import Link from 'next/link';
import type { ReactNode } from 'react';

type SettingsDetailNavItem = {
    label: string;
    iconClass: string;
    href?: string;
    active?: boolean;
};

type SettingsDetailLayoutProps = {
    sectionTitle: string;
    breadcrumbLabel: string;
    navItems: SettingsDetailNavItem[];
    children: ReactNode;
};

export default function SettingsDetailLayout({
    sectionTitle,
    breadcrumbLabel,
    navItems,
    children,
}: SettingsDetailLayoutProps) {
    return (
        <div className="settings-detail-layout" data-testid="settings-detail">
            <aside className="settings-detail-layout__sidebar">
                <div className="column_row tree other_settings">
                    <h4>{sectionTitle}</h4>
                    <ul>
                        {navItems.map((item) => (
                            <li key={item.label}>
                                {item.href ? (
                                    <Link
                                        href={item.href}
                                        className={item.active ? 'active' : ''}
                                        aria-current={
                                            item.active ? 'page' : undefined
                                        }
                                    >
                                        <div className="icon_box">
                                            <span
                                                className={`icon ${item.iconClass}`}
                                                aria-hidden="true"
                                            />
                                        </div>
                                        {item.label}
                                    </Link>
                                ) : (
                                    <div className="settings-detail-layout__nav-disabled">
                                        <div className="icon_box">
                                            <span
                                                className={`icon ${item.iconClass}`}
                                                aria-hidden="true"
                                            />
                                        </div>
                                        {item.label}
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            </aside>

            <div className="settings-detail-layout__main">
                <div className="breadcrumbs" e2e-breadcrumbs="">
                    <ul>
                        <li>
                            <div className="icon sprite-breadcrumbs_settings" />
                            <Link href="/settings">Ustawienia</Link>
                        </li>
                        <li>
                            <span> / </span>
                            {breadcrumbLabel}
                        </li>
                    </ul>
                </div>

                <div className="inner edit_branch_form">{children}</div>
            </div>
        </div>
    );
}
