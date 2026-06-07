import { useState, useEffect, useRef } from 'react';

type Props = {
    title: string;
    items: Array<{ id: number; name: string }>;
    onSelect: (id: number) => void;
    onClose: () => void;
};

export default function SelectorModal({
    title,
    items,
    onSelect,
    onClose,
}: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const dialogRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<Element | null>(null);

    const filteredItems = items.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    useEffect(() => {
        triggerRef.current = document.activeElement;
        return () => {
            (triggerRef.current as HTMLElement | null)?.focus();
        };
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
                return;
            }
            if (e.key !== 'Tab' || !dialogRef.current) return;
            const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
                'button, input, [tabindex]:not([tabindex="-1"])',
            );
            if (focusables.length === 0) return;
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            if (e.shiftKey) {
                if (document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                }
            } else {
                if (document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const titleId = 'selector-modal-title';

    return (
        <div className="modal-backdrop fade in">
            <div
                ref={dialogRef}
                className="modal-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
            >
                <div className="modal-content">
                    <div className="modal-header">
                        <button
                            type="button"
                            className="close"
                            onClick={onClose}
                            aria-label="Zamknij"
                        >
                            <span aria-hidden="true">&times;</span>
                        </button>
                        <h4 className="modal-title" id={titleId}>
                            {title}
                        </h4>
                        <div className="mt-2">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Szukaj..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                aria-label="Szukaj"
                                // eslint-disable-next-line jsx-a11y/no-autofocus
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="modal-body modal-body-scroll">
                        {filteredItems.length === 0 ? (
                            <div className="text-center p-3 text-muted">
                                Brak wyników
                            </div>
                        ) : (
                            <ul className="nav nav-list">
                                {filteredItems.map((item) => (
                                    <li key={item.id}>
                                        <button
                                            type="button"
                                            onClick={() => onSelect(item.id)}
                                        >
                                            {item.name}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={onClose}
                        >
                            Anuluj
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
