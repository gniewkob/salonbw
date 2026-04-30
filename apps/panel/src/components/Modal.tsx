'use client';
import { ReactNode, useEffect } from 'react';

interface Props {
    open: boolean;
    onClose: () => void;
    children: ReactNode;
}

export default function Modal({ open, onClose, children }: Props) {
    useEffect(() => {
        if (typeof document === 'undefined') return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (open) document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div
            className="position-fixed top-0 start-0 bottom-0 end-0 d-flex align-items-center justify-content-center"
            style={{
                zIndex: 2000,
                background: 'rgba(0, 0, 0, 0.4)',
            }}
        >
            <div
                role="dialog"
                className="bg-white p-3 rounded shadow"
                style={{ zIndex: 2001, minWidth: '300px' }}
            >
                {children}
            </div>
        </div>
    );
}
