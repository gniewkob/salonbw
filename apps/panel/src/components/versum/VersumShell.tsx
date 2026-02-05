import type { ReactNode } from 'react';
import { useRouter } from 'next/router';
import type { Role } from '@/types';
import VersumMainNav from './VersumMainNav';
import VersumSecondaryNav from './VersumSecondaryNav';
import VersumTopbar from './VersumTopbar';
import FloatingHelpButton from './FloatingHelpButton';
import { resolveVersumModule, visibleVersumModules } from './navigation';

interface VersumShellProps {
    role: Role;
    children: ReactNode;
    secondaryNav?: ReactNode;
}

export default function VersumShell({
    role,
    children,
    secondaryNav,
}: VersumShellProps) {
    const router = useRouter();
    const activeModule = resolveVersumModule(router.pathname);
    const modules = visibleVersumModules(role);
    const showSecondary = activeModule.secondaryNav || !!secondaryNav;

    return (
        <div className="versum-shell">
            <VersumTopbar />
            <div className="versum-shell__body">
                <VersumMainNav
                    role={role}
                    modules={modules}
                    activeModule={activeModule}
                />
                {secondaryNav ? (
                    <aside className="versum-secondarynav">
                        {secondaryNav}
                    </aside>
                ) : showSecondary ? (
                    <VersumSecondaryNav module={activeModule} />
                ) : null}
                <main
                    className={`versum-shell__content ${activeModule.wideContent ? 'versum-shell__content--wide' : ''}`}
                >
                    <div className="versum-shell__content-inner">
                        {children}
                    </div>
                </main>
            </div>
            <FloatingHelpButton />
        </div>
    );
}
