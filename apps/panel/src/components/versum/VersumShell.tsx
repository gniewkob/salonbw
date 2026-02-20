import type { ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import type { Role } from '@/types';
import VersumMainNav from './VersumMainNav';
import VersumSecondaryNav from './VersumSecondaryNav';
import VersumTopbar from './VersumTopbar';
import FloatingHelpButton from './FloatingHelpButton';
import PajaxLoader from './PajaxLoader';
import { resolveVersumModule, visibleVersumModules } from './navigation';
import { useSecondaryNavContext } from '@/contexts/SecondaryNavContext';

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
    const parentCtx = useSecondaryNavContext();

    // All hooks must be called unconditionally (Rules of Hooks).
    const router = useRouter();
    const routeForModuleResolution = router.asPath || router.pathname;
    const activeModule = resolveVersumModule(routeForModuleResolution);
    const modules = visibleVersumModules(role);
    const secondNavRenderKey = `${activeModule.key}:${router.pathname}:${router.asPath}`;

    // Versum vendor CSS uses module-scoped selectors like `.main-content.customers`.
    const mainContentClass = activeModule.key;

    useEffect(() => {
        // Nested shell: outer shell owns body classes; skip.
        if (parentCtx !== null) return;
        if (typeof document === 'undefined') return;
        const body = document.body;
        const previousId = body.id;
        const hadE2eBodyClass = body.classList.contains('e2e-body');
        const previousModuleClass = body.getAttribute(
            'data-versum-module-class',
        );
        const nextModuleClass = `e2e-${activeModule.key}`;

        body.classList.add('e2e-body');
        body.id = activeModule.key;
        body.classList.add(nextModuleClass);
        body.setAttribute('data-versum-module-class', nextModuleClass);

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
                    'data-versum-module-class',
                    previousModuleClass,
                );
            } else {
                body.removeAttribute('data-versum-module-class');
            }
            body.id = previousId;
        };
    }, [activeModule.key, parentCtx]);

    // Nested call: a persistent outer shell already owns the chrome.
    // Become a transparent pass-through — no duplicate DOM.
    if (parentCtx !== null) {
        return <>{children}</>;
    }

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
                    {secondaryNav ? (
                        <div key={secondNavRenderKey}>{secondaryNav}</div>
                    ) : (
                        <VersumSecondaryNav
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
