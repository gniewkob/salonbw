import { ReactNode, useEffect } from 'react';

interface Props {
    open: boolean;
    onClose: () => void;
    children: ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

const SIZE_WIDTH: Record<NonNullable<Props['size']>, string> = {
    sm: '420px',
    md: '560px',
    lg: '720px',
    xl: '900px',
};

export default function Modal({ open, onClose, children, size = 'md' }: Props) {
    useEffect(() => {
        if (typeof document === 'undefined') return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (open) {
            document.addEventListener('keydown', onKey);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div
            className="position-fixed top-0 start-0 bottom-0 end-0 d-flex align-items-center justify-content-center p-3"
            style={{
                zIndex: 2000,
                background: 'rgba(0,0,0,0.55)',
                backdropFilter: 'blur(4px)',
            }}
            onClick={onClose}
        >
            <div
                role="dialog"
                aria-modal="true"
                className="bg-white rounded-4 overflow-hidden d-flex flex-column"
                style={{
                    width: `min(${SIZE_WIDTH[size]}, 100%)`,
                    maxHeight: '90vh',
                    boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
                    border: '1px solid rgba(0,0,0,0.08)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="overflow-y-auto p-4" style={{ flex: 1 }}>
                    {children}
                </div>
            </div>
        </div>
    );
}
