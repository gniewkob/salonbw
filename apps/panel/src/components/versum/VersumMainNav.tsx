import Link from 'next/link';
import type { Role } from '@/types';
import VersumIcon from './VersumIcon';
import type { VersumModule } from './navigation';

interface VersumMainNavProps {
    modules: VersumModule[];
    activeModule: VersumModule;
    role: Role;
}

export default function VersumMainNav({
    modules,
    activeModule,
}: VersumMainNavProps) {
    return (
        <div className="mainnav" id="mainnav">
            <ul className="nav" e2e-main-nav="">
                {modules.map((item) => {
                    const isActive = item.key === activeModule.key;
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
                                <div>
                                    <VersumIcon
                                        id={item.iconId}
                                        className={item.iconId}
                                    />
                                </div>
                                <span>{item.label}</span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
