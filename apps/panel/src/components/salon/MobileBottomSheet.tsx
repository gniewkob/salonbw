import { useEffect, useRef, type ReactNode } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface MobileBottomSheetProps {
    open: boolean;
    title?: string;
    onClose: () => void;
    children: ReactNode;
    /**
     * Optional `aria-labelledby` ID. If omitted and `title` is provided, the
     * component generates one internally.
     */
    titleId?: string;
}

let sheetIdCounter = 0;

export default function MobileBottomSheet({
    open,
    title,
    onClose,
    children,
    titleId,
}: MobileBottomSheetProps) {
    const generatedIdRef = useRef<string | null>(null);
    if (generatedIdRef.current === null && title) {
        sheetIdCounter += 1;
        generatedIdRef.current = `mobile-bottom-sheet-${sheetIdCounter}`;
    }
    const labelledById = titleId ?? generatedIdRef.current ?? undefined;
    const reducedMotion = useReducedMotion();
    const backdropTransition = reducedMotion
        ? 'none'
        : 'opacity 200ms ease-out';
    const sheetTransition = reducedMotion ? 'none' : 'transform 240ms ease-out';

    useEffect(() => {
        if (!open) return;
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previous;
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
                    background: 'rgba(0, 0, 0, 0.45)',
                    opacity: open ? 1 : 0,
                    pointerEvents: open ? 'auto' : 'none',
                    transition: backdropTransition,
                    zIndex: 1070,
                }}
            />
            <div
                role="dialog"
                aria-modal={open}
                aria-hidden={!open}
                aria-labelledby={labelledById}
                style={{
                    position: 'fixed',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: '#ffffff',
                    borderTopLeftRadius: 16,
                    borderTopRightRadius: 16,
                    transform: open ? 'translateY(0)' : 'translateY(100%)',
                    transition: sheetTransition,
                    zIndex: 1080,
                    maxHeight: '85dvh',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 -8px 24px rgba(0, 0, 0, 0.15)',
                    paddingBottom: 'env(safe-area-inset-bottom)',
                }}
            >
                <div
                    aria-hidden
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        padding: '0.75rem 0 0.25rem',
                    }}
                >
                    <span
                        style={{
                            display: 'inline-block',
                            width: 40,
                            height: 4,
                            borderRadius: 2,
                            background: '#d1d5db',
                        }}
                    />
                </div>
                {title ? (
                    <div
                        style={{
                            padding: '0.5rem 1.25rem 0.75rem',
                            borderBottom: '1px solid #f1f3f5',
                        }}
                    >
                        <h2
                            id={labelledById}
                            style={{
                                margin: 0,
                                fontSize: '1rem',
                                fontWeight: 600,
                                color: '#0d0d0d',
                            }}
                        >
                            {title}
                        </h2>
                    </div>
                ) : null}
                <div
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '0.5rem 1rem 1rem',
                    }}
                >
                    {children}
                </div>
            </div>
        </>
    );
}
