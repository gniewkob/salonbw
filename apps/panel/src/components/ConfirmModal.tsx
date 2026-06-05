import { useEffect } from 'react';

interface Props {
    open: boolean;
    title: string;
    message?: string;
    confirmLabel?: string;
    confirmVariant?: 'danger' | 'warning' | 'primary';
    onConfirm: () => void;
    onCancel: () => void;
}

const VARIANT_CLASS: Record<NonNullable<Props['confirmVariant']>, string> = {
    danger: 'btn btn-danger',
    warning: 'btn btn-warning',
    primary: 'btn btn-primary',
};

export default function ConfirmModal({
    open,
    title,
    message,
    confirmLabel = 'Potwierdź',
    confirmVariant = 'primary',
    onConfirm,
    onCancel,
}: Props) {
    useEffect(() => {
        if (typeof document === 'undefined') return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCancel();
        };
        if (open) {
            document.addEventListener('keydown', onKey);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [open, onCancel]);

    if (!open) return null;

    return (
        <div
            className="position-fixed top-0 start-0 bottom-0 end-0 d-flex align-items-center justify-content-center p-3"
            style={{
                zIndex: 2100,
                background: 'rgba(0,0,0,0.55)',
                backdropFilter: 'blur(4px)',
            }}
            onClick={onCancel}
        >
            <div
                role="dialog"
                aria-modal="true"
                className="bg-white rounded-4 overflow-hidden"
                style={{
                    width: 'min(400px, 100%)',
                    boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
                    border: '1px solid rgba(0,0,0,0.08)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-4 pt-4 pb-3">
                    <h6 className="fw-semibold mb-2">{title}</h6>
                    {message && (
                        <p className="text-muted small mb-0">{message}</p>
                    )}
                </div>
                <div className="px-4 pb-4 d-flex justify-content-end gap-2">
                    <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={onCancel}
                    >
                        Anuluj
                    </button>
                    <button
                        type="button"
                        className={`${VARIANT_CLASS[confirmVariant]} btn-sm`}
                        onClick={onConfirm}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
