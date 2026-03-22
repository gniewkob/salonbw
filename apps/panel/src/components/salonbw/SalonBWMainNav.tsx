import Link from 'next/link';
import type { Role } from '@/types';
import SalonBWIcon from './SalonBWIcon';
import type { SalonBWModule } from './navigation';

interface SalonBWMainNavProps {
    modules: SalonBWModule[];
    activeModule: SalonBWModule;
    role: Role;
}

// Badge counts for each module (in real app, these would come from API)
const MODULE_BADGES: Record<string, string> = {
    communication: '140',
};

export default function SalonBWMainNav({
    modules,
    activeModule,
}: SalonBWMainNavProps) {
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
                            >
                                <div className="nav-icon-wrapper">
                                    <SalonBWIcon
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
