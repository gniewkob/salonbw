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
        <div className="position-fixed top-0 start-0 bottom-0 end-0 bg-dark/40 d-flex align-items-center justify-content-center">
            <div
                role="dialog"
                className="bg-white p-3 rounded shadow min-w-[300px]"
            >
                {children}
            </div>
        </div>
    );
}
