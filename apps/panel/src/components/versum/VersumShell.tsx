import type { ReactNode } from 'react';
import { useRouter } from 'next/router';
import type { Role } from '@/types';
import VersumMainNav from './VersumMainNav';
import VersumSecondaryNav from './VersumSecondaryNav';
import VersumTopbar from './VersumTopbar';
import FloatingHelpButton from './FloatingHelpButton';
import PajaxLoader from './PajaxLoader';
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
        <div id="versum-shell-root">
            <PajaxLoader />
            <VersumTopbar />
            <div className="main-container" id="main-container">
                <div className="sidebar hidden-print" id="sidebar">
                    <VersumMainNav
                        role={role}
                        modules={modules}
                        activeModule={activeModule}
                    />
                    <VersumSecondaryNav module={activeModule} />
                </div>
                <div className="main-content" id="main-content" role="main">
                    <div
                        className={`inner ${activeModule.wideContent ? 'inner--wide' : ''}`}
                    >
                        {children}
                    </div>
                </div>
            </div>
            <FloatingHelpButton />
        </div>
    );
}
