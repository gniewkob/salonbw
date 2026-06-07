import Link from 'next/link';
import SalonIcon from './SalonIcon';
import type { SalonModule } from './navigation';

interface SalonMainNavProps {
    modules: SalonModule[];
    activeModule: SalonModule;
}

const MODULE_BADGES: Record<string, string> = {};

export default function SalonMainNav({
    modules,
    activeModule,
}: SalonMainNavProps) {
    return (
        <div className="mainnav" id="mainnav">
            <ul className="nav" e2e-main-nav="">
                {modules.map((item) => {
                    const isActive = item.key === activeModule.key;
                    const badge = MODULE_BADGES[item.key];

                    return (
                        <li
                            key={item.key}
                            className={`${item.shell.mainNavClass} ${isActive ? 'active' : ''} ${item.pinBottom ? 'mt-auto' : ''}`}
                        >
                            <Link
                                href={item.href}
                                data-testid={`mainnav-${item.key}`}
                                title={item.label}
                                aria-current={isActive ? 'page' : undefined}
                            >
                                <div className="nav-icon-wrapper">
                                    <SalonIcon
                                        id={item.iconId}
                                        className={item.iconId}
                                    />
                                </div>
                                <span className="nav-label">
                                    {badge && (
                                        <span className="nav-badge">
                                            {badge}{' '}
                                        </span>
                                    )}
                                    {item.label}
                                </span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
