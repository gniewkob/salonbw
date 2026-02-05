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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white shadow-xl">
                <div className="border-b border-gray-200 p-4">
                    <h2 className="text-lg font-semibold text-gray-800">
                        {title}
                    </h2>
                    <input
                        type="text"
                        className="mt-2 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        placeholder="Szukaj..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        aria-label="Szukaj"
                    />
                </div>
                <div className="max-h-64 overflow-y-auto p-2">
                    {filteredItems.length === 0 ? (
                        <p className="p-4 text-center text-sm text-gray-500">
                            Brak wyników
                        </p>
                    ) : (
                        <ul className="space-y-1">
                            {filteredItems.map((item) => (
                                <li key={item.id}>
                                    <button
                                        type="button"
                                        onClick={() => onSelect(item.id)}
                                        className="w-full rounded px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        {item.name}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="border-t border-gray-200 p-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Anuluj
                    </button>
                </div>
            </div>
        </div>
    );
}
