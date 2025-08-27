import { ReactNode, useEffect } from 'react';

interface Props {
    open: boolean;
    onClose: () => void;
    children: ReactNode;
}

export default function Modal({ open, onClose, children }: Props) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (open) document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
            <div
                role="dialog"
                className="bg-white p-4 rounded shadow min-w-[300px]"
            >
                {children}
            </div>
        </div>
    );
}
