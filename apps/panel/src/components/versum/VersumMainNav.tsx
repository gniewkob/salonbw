import Link from 'next/link';
import type { Role } from '@/types';
import VersumIcon from './VersumIcon';
import type { VersumModule } from './navigation';

interface VersumMainNavProps {
    modules: VersumModule[];
    activeModule: VersumModule;
    role: Role;
}

// Badge counts for each module (in real app, these would come from API)
const MODULE_BADGES: Record<string, string> = {
    communication: '140',
};

export default function VersumMainNav({
    modules,
    activeModule,
}: VersumMainNavProps) {
    return (
        <div className="mainnav" id="mainnav">
            <ul className="nav" e2e-main-nav="">
                {modules.map((item) => {
                    const isActive = item.key === activeModule.key;
                    const badge = MODULE_BADGES[item.key];
                    
                    return (
                        <li
                            key={item.key}
                            className={`${item.key} ${isActive ? 'active' : ''} ${item.pinBottom ? 'mt-auto' : ''}`}
                            data-tooltip={item.label}
                        >
                            <Link
                                href={item.href}
                                data-testid={`mainnav-${item.key}`}
                                title={item.label}
                            >
                                <div className="nav-icon-wrapper">
                                    <VersumIcon
                                        id={item.iconId}
                                        className={item.iconId}
                                    />
                                    {isActive && (
                                        <div className="active-indicator"></div>
                                    )}
                                </div>
                                <span className="nav-label">
                                    {badge && (
                                        <span className="nav-badge">{badge} </span>
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
