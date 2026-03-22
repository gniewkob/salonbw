import type { ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import type { Role } from '@/types';
import SalonBWMainNav from './SalonBWMainNav';
import SalonBWSecondaryNav from './SalonBWSecondaryNav';
import SalonBWTopbar from './SalonBWTopbar';
import FloatingHelpButton from './FloatingHelpButton';
import PajaxLoader from './PajaxLoader';
import { resolveSalonBWModule, visibleSalonBWModules } from './navigation';
import { useSecondaryNavContext } from '@/contexts/SecondaryNavContext';

interface SalonBWShellProps {
    role: Role;
    children: ReactNode;
}

export default function SalonBWShell({ role, children }: SalonBWShellProps) {
    const router = useRouter();
    const secondaryNavContext = useSecondaryNavContext();
    const routeForModuleResolution = router.asPath || router.pathname;
    const activeModule = resolveSalonBWModule(routeForModuleResolution);
    const modules = visibleSalonBWModules(role);
    const secondNavRenderKey = `${activeModule.key}:${router.pathname}:${router.asPath}`;
    const resolvedSecondaryNav = secondaryNavContext?.secondaryNav ?? null;

    // source vendor CSS uses module-scoped selectors like `.main-content.customers`.
    const mainContentClass =
        activeModule.key === 'extension' ? 'extensions' : activeModule.key;

    useEffect(() => {
        if (typeof document === 'undefined') return;
        const body = document.body;
        const previousId = body.id;
        const hadE2eBodyClass = body.classList.contains('e2e-body');
        const previousModuleClass = body.getAttribute(
            'data-salonbw-module-class',
        );
        const nextModuleClass = `e2e-${activeModule.key}`;

        body.classList.add('e2e-body');
        body.id = activeModule.key;
        body.classList.add(nextModuleClass);
        body.setAttribute('data-salonbw-module-class', nextModuleClass);

        if (previousModuleClass && previousModuleClass !== nextModuleClass) {
            body.classList.remove(previousModuleClass);
        }

        return () => {
            body.classList.remove(nextModuleClass);
            if (!hadE2eBodyClass) {
                body.classList.remove('e2e-body');
            }
            if (previousModuleClass) {
                body.classList.add(previousModuleClass);
                body.setAttribute(
                    'data-salonbw-module-class',
                    previousModuleClass,
                );
            } else {
                body.removeAttribute('data-salonbw-module-class');
            }
            body.id = previousId;
        };
    }, [activeModule.key]);

    return (
        <div id="salonbw-shell-root">
            <PajaxLoader />
            <SalonBWTopbar />
            <div className="main-container" id="main-container">
                <div className="sidebar hidden-print" id="sidebar">
                    <SalonBWMainNav
                        role={role}
                        modules={modules}
                        activeModule={activeModule}
                    />
                    {resolvedSecondaryNav ? (
                        <div key={secondNavRenderKey}>
                            {resolvedSecondaryNav}
                        </div>
                    ) : (
                        <SalonBWSecondaryNav
                            key={secondNavRenderKey}
                            module={activeModule}
                        />
                    )}
                </div>
                <div
                    className={`main-content ${mainContentClass}`}
                    id="main-content"
                    role="main"
                >
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
