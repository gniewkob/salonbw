import { useState } from 'react';

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

    const filteredItems = items.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    return (
        <div className="modal-backdrop fade in">
            <div className="modal-dialog">
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
                        <h4 className="modal-title">{title}</h4>
                        <div className="mt-2">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Szukaj..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                aria-label="Szukaj"
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="modal-body modal-body-scroll">
                        {filteredItems.length === 0 ? (
                            <div className="text-center p-3 versum-muted">
                                Brak wyników
                            </div>
                        ) : (
                            <ul className="nav nav-list">
                                {filteredItems.map((item) => (
                                    <li key={item.id}>
                                        <a
                                            href="javascript:;"
                                            onClick={() => onSelect(item.id)}
                                        >
                                            {item.name}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-default"
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
