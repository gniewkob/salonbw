import type { ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import type { Role } from '@/types';
import SalonMainNav from './SalonMainNav';
import SalonSecondaryNav from './SalonSecondaryNav';
import SalonTopbar from './SalonTopbar';
import FloatingHelpButton from './FloatingHelpButton';
import PajaxLoader from './PajaxLoader';
import { resolveSalonModule, visibleSalonModules } from './navigation';
import { useSecondaryNavContext } from '@/contexts/SecondaryNavContext';

interface SalonShellProps {
    role: Role;
    children: ReactNode;
}

export default function SalonShell({ role, children }: SalonShellProps) {
    const router = useRouter();
    const secondaryNavContext = useSecondaryNavContext();
    const routeForModuleResolution = router.asPath || router.pathname;
    const activeModule = resolveSalonModule(routeForModuleResolution);
    const modules = visibleSalonModules(role);
    const secondNavRenderKey = `${activeModule.key}:${router.pathname}:${router.asPath}`;
    const resolvedSecondaryNav = secondaryNavContext?.secondaryNav ?? null;
    const shellProfile = activeModule.shell;

    useEffect(() => {
        if (typeof document === 'undefined') return;
        const body = document.body;
        const previousId = body.id;
        const hadE2eBodyClass = body.classList.contains('e2e-body');
        const previousShellClasses = (
            body.getAttribute('data-salonbw-shell-classes') ?? ''
        )
            .split(' ')
            .filter(Boolean);
        const previousModuleClass = body.getAttribute(
            'data-salonbw-module-class',
        );
        const nextModuleClass = `e2e-${activeModule.key}`;
        const nextShellClasses = shellProfile.bodyClasses ?? [];

        body.classList.add('e2e-body');
        body.id = shellProfile.bodyId;
        body.classList.add(nextModuleClass);
        body.classList.add(...nextShellClasses);
        body.setAttribute('data-salonbw-module-class', nextModuleClass);
        body.setAttribute(
            'data-salonbw-shell-classes',
            nextShellClasses.join(' '),
        );

        if (previousModuleClass && previousModuleClass !== nextModuleClass) {
            body.classList.remove(previousModuleClass);
        }
        for (const className of previousShellClasses) {
            if (!nextShellClasses.includes(className)) {
                body.classList.remove(className);
            }
        }

        return () => {
            body.classList.remove(nextModuleClass);
            body.classList.remove(...nextShellClasses);
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
            if (previousShellClasses.length > 0) {
                body.classList.add(...previousShellClasses);
                body.setAttribute(
                    'data-salonbw-shell-classes',
                    previousShellClasses.join(' '),
                );
            } else {
                body.removeAttribute('data-salonbw-shell-classes');
            }
            body.id = previousId;
        };
    }, [activeModule.key, shellProfile.bodyClasses, shellProfile.bodyId]);

    return (
        <div id="salonbw-shell-root">
            <PajaxLoader />
            <SalonTopbar />
            <div className="main-container" id="main-container">
                <div className="sidebar hidden-print" id="sidebar">
                    <SalonMainNav
                        role={role}
                        modules={modules}
                        activeModule={activeModule}
                    />
                    {resolvedSecondaryNav ? (
                        <div key={secondNavRenderKey}>
                            {resolvedSecondaryNav}
                        </div>
                    ) : (
                        <SalonSecondaryNav
                            key={secondNavRenderKey}
                            module={activeModule}
                        />
                    )}
                </div>
                <div
                    className={`main-content ${shellProfile.mainContentClass} main-content--${shellProfile.contentFrameVariant}`}
                    id="main-content"
                    role="main"
                >
                    <div className="inner">{children}</div>
                </div>
            </div>
            <FloatingHelpButton />
        </div>
    );
}
