import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { Role } from '@/types';
import MobileNavDrawer from './MobileNavDrawer';
import { resolveSalonModule, visibleSalonModules } from './navigation';
import { useAuth } from '@/contexts/AuthContext';
import { buildTopbarViewModel } from '@/lib/topbar/topbarModel';
import { useNotifications } from '@/hooks/useNotifications';
import SalonIcon from './SalonIcon';

interface SalonShellMobileProps {
    role: Role | null;
    children: ReactNode;
}

export default function SalonShellMobile({
    role,
    children,
}: SalonShellMobileProps) {
    const router = useRouter();
    const { user } = useAuth();
    const routeForModuleResolution = router.asPath || router.pathname;
    const activeModule = resolveSalonModule(routeForModuleResolution, role);
    const modules = visibleSalonModules(role);
    const topbar = buildTopbarViewModel(user);
    const isStaff = role !== null && role !== 'client';
    const notifications = useNotifications(isStaff);
    const notificationCount = notifications.data?.length ?? 0;

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
                <div className="salonbw-mobile-shell__actions">
                    {isStaff ? (
                        <Link
                            href="/notifications"
                            className="salonbw-mobile-shell__icon-button"
                            aria-label="Powiadomienia"
                        >
                            <SalonIcon
                                id="svg-notifications"
                                className="salonbw-mobile-shell__icon"
                            />
                            {notificationCount > 0 ? (
                                <span className="salonbw-mobile-shell__badge">
                                    {notificationCount}
                                </span>
                            ) : null}
                        </Link>
                    ) : null}
                    <Link
                        href="/account"
                        className="salonbw-mobile-shell__avatar"
                        aria-label="Moje konto"
                    >
                        {topbar.user.avatarUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img alt="" src={topbar.user.avatarUrl} />
                        ) : (
                            <span>{topbar.user.initials}</span>
                        )}
                    </Link>
                </div>
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
