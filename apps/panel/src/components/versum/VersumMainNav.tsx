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
    role,
}: VersumMainNavProps) {
    return (
        <aside className="versum-mainnav" aria-label="Główna nawigacja">
            <ul className="versum-mainnav__list" data-role={role}>
                {modules.map((item) => {
                    const isActive = item.key === activeModule.key;
                    return (
                        <li
                            key={item.key}
                            className={`versum-mainnav__item ${item.pinBottom ? 'versum-mainnav__item--bottom' : ''} ${isActive ? 'is-active' : ''}`}
                        >
                            <Link
                                href={item.href}
                                className="versum-mainnav__link"
                                aria-current={isActive ? 'page' : undefined}
                                data-testid={`mainnav-${item.key}`}
                            >
                                <VersumIcon
                                    id={item.iconId}
                                    className="versum-icon versum-mainnav__icon"
                                />
                                <span className="versum-mainnav__label">
                                    {item.label}
                                </span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </aside>
    );
}
