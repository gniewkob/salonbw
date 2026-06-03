import { useEffect } from 'react';
import Link from 'next/link';
import type { SalonModule } from './navigation';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface MobileNavDrawerProps {
    open: boolean;
    modules: SalonModule[];
    activeKey: string;
    onClose: () => void;
}

export default function MobileNavDrawer({
    open,
    modules,
    activeKey,
    onClose,
}: MobileNavDrawerProps) {
    const reducedMotion = useReducedMotion();
    const backdropTransition = reducedMotion
        ? 'none'
        : 'opacity 200ms ease-out';
    const drawerTransition = reducedMotion
        ? 'none'
        : 'transform 240ms ease-out';

    useEffect(() => {
        if (!open) return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const handler = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [open, onClose]);

    return (
        <>
            <div
                role="presentation"
                aria-hidden={!open}
                onClick={onClose}
                style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.4)',
                    opacity: open ? 1 : 0,
                    pointerEvents: open ? 'auto' : 'none',
                    transition: backdropTransition,
                    zIndex: 1050,
                }}
            />
            <nav
                aria-label="Nawigacja główna"
                aria-hidden={!open}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: 'min(280px, 80vw)',
                    background: '#0d0d0d',
                    color: '#ffffff',
                    transform: open ? 'translateX(0)' : 'translateX(-100%)',
                    transition: drawerTransition,
                    zIndex: 1060,
                    display: 'flex',
                    flexDirection: 'column',
                    paddingTop: 'env(safe-area-inset-top)',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.875rem 1.25rem',
                        borderBottom: '1px solid rgba(255,255,255,0.08)',
                    }}
                >
                    <span
                        style={{
                            fontFamily: "'Playfair Display', serif",
                            fontSize: '1.125rem',
                            letterSpacing: '0.02em',
                        }}
                    >
                        Salon B&amp;W
                    </span>
                    <button
                        type="button"
                        aria-label="Zamknij menu"
                        onClick={onClose}
                        style={{
                            width: 44,
                            height: 44,
                            background: 'transparent',
                            border: 'none',
                            color: '#ffffff',
                            fontSize: 24,
                            lineHeight: 1,
                            cursor: 'pointer',
                            padding: 0,
                        }}
                    >
                        ×
                    </button>
                </div>
                <ul
                    style={{
                        listStyle: 'none',
                        margin: 0,
                        padding: '0.5rem 0',
                        flex: 1,
                        overflowY: 'auto',
                    }}
                >
                    {modules.map((module) => {
                        const isActive = module.key === activeKey;
                        return (
                            <li key={module.key}>
                                <Link
                                    href={module.href}
                                    onClick={onClose}
                                    aria-current={isActive ? 'page' : undefined}
                                    style={{
                                        display: 'block',
                                        padding: '0.875rem 1.25rem',
                                        minHeight: 44,
                                        fontSize: '0.95rem',
                                        letterSpacing: '0.02em',
                                        textTransform: 'capitalize',
                                        textDecoration: 'none',
                                        color: isActive ? '#b4b8be' : '#ffffff',
                                        fontWeight: isActive ? 600 : 400,
                                        background: isActive
                                            ? 'rgba(180, 184, 190, 0.08)'
                                            : 'transparent',
                                        borderLeft: `3px solid ${
                                            isActive ? '#b4b8be' : 'transparent'
                                        }`,
                                    }}
                                >
                                    {module.label}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
                <div
                    style={{
                        padding: '0.75rem 1.25rem',
                        borderTop: '1px solid rgba(255,255,255,0.08)',
                        fontSize: '0.7rem',
                        color: 'rgba(255,255,255,0.4)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.14em',
                        paddingBottom:
                            'calc(0.75rem + env(safe-area-inset-bottom))',
                    }}
                >
                    Salon Black &amp; White · Bytom
                </div>
            </nav>
        </>
    );
}
