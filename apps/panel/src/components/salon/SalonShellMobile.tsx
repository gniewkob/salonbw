import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/router';
import type { Role } from '@/types';
import MobileNavDrawer from './MobileNavDrawer';
import { resolveSalonModule, visibleSalonModules } from './navigation';

interface SalonShellMobileProps {
    role: Role | null;
    children: ReactNode;
}

const TOPBAR_HEIGHT = 56;

export default function SalonShellMobile({
    role,
    children,
}: SalonShellMobileProps) {
    const router = useRouter();
    const routeForModuleResolution = router.asPath || router.pathname;
    const activeModule = resolveSalonModule(routeForModuleResolution);
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
            <header
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: TOPBAR_HEIGHT,
                    background: '#0d0d0d',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 0.5rem 0 0',
                    zIndex: 1040,
                    paddingTop: 'env(safe-area-inset-top)',
                    boxShadow: '0 1px 0 rgba(255,255,255,0.06)',
                }}
            >
                <button
                    type="button"
                    aria-label="Otwórz menu"
                    aria-expanded={drawerOpen}
                    onClick={() => setDrawerOpen(true)}
                    style={{
                        width: 56,
                        height: TOPBAR_HEIGHT,
                        background: 'transparent',
                        border: 'none',
                        color: '#ffffff',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <span
                        aria-hidden
                        style={{
                            display: 'inline-block',
                            width: 20,
                            height: 14,
                            position: 'relative',
                        }}
                    >
                        <span
                            style={{
                                position: 'absolute',
                                left: 0,
                                right: 0,
                                top: 0,
                                height: 2,
                                background: '#ffffff',
                            }}
                        />
                        <span
                            style={{
                                position: 'absolute',
                                left: 0,
                                right: 0,
                                top: 6,
                                height: 2,
                                background: '#ffffff',
                            }}
                        />
                        <span
                            style={{
                                position: 'absolute',
                                left: 0,
                                right: 0,
                                top: 12,
                                height: 2,
                                background: '#ffffff',
                            }}
                        />
                    </span>
                </button>
                <span
                    style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: '1rem',
                        letterSpacing: '0.04em',
                        flex: 1,
                        textAlign: 'center',
                    }}
                >
                    {activeModule.label}
                </span>
                <span style={{ width: 56 }} aria-hidden />
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
                style={{
                    paddingTop: `calc(${TOPBAR_HEIGHT}px + env(safe-area-inset-top))`,
                    minHeight: '100dvh',
                    background: '#ffffff',
                }}
            >
                {children}
            </main>
        </div>
    );
}
