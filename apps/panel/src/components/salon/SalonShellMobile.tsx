import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/router';
import type { Role } from '@/types';
import MobileNavDrawer from './MobileNavDrawer';
import { resolveSalonModule, visibleSalonModules } from './navigation';

interface SalonShellMobileProps {
    role: Role | null;
    children: ReactNode;
}

export default function SalonShellMobile({
    role,
    children,
}: SalonShellMobileProps) {
    const router = useRouter();
    const routeForModuleResolution = router.asPath || router.pathname;
    const activeModule = resolveSalonModule(routeForModuleResolution, role);
    const modules = visibleSalonModules(role);

    const [drawerOpen, setDrawerOpen] = useState(false);

    // Close drawer on navigation completion (covers programmatic navigation
    // and edge cases where Link onClick handler may not run).
    useEffect(() => {
        const handler = () => setDrawerOpen(false);
        router.events.on('routeChangeComplete', handler);
        return () => router.events.off('routeChangeComplete', handler);
    }, [router.events]);

    return (
        <div id="salonbw-shell-root-mobile">
            <a href="#main-content-mobile" className="salonbw-skip-link">
                Przejdź do treści
            </a>
            <header className="salonbw-mobile-shell__topbar">
                <button
                    type="button"
                    aria-label="Otwórz menu"
                    aria-expanded={drawerOpen}
                    onClick={() => setDrawerOpen(true)}
                    className="salonbw-mobile-shell__menu-button"
                >
                    <span
                        className="salonbw-mobile-shell__hamburger"
                        aria-hidden
                    >
                        <span />
                        <span />
                        <span />
                    </span>
                </button>
                <span className="salonbw-mobile-shell__title">
                    {activeModule.label}
                </span>
                <span className="salonbw-mobile-shell__spacer" aria-hidden />
            </header>

            <MobileNavDrawer
                open={drawerOpen}
                modules={modules}
                activeKey={activeModule.key}
                onClose={() => setDrawerOpen(false)}
            />

            <main
                id="main-content-mobile"
                role="main"
                className="salonbw-mobile-shell__main"
            >
                {children}
            </main>
        </div>
    );
}
