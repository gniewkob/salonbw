import { type FormEvent, useState } from 'react';

export type GroupDraft = {
    name: string;
    description: string;
    color: string;
};

type Props = {
    onClose: () => void;
    onCreate: (payload: GroupDraft) => Promise<void>;
    submitting: boolean;
};

export default function CreateCustomerGroupModal({
    onClose,
    onCreate,
    submitting,
}: Props) {
    const [form, setForm] = useState<GroupDraft>({
        name: '',
        description: '',
        color: '#06b6d4',
    });

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        await onCreate(form);
    };

    const colorOptions = [
        '#06b6d4', // cyan
        '#10b981', // green
        '#f59e0b', // amber
        '#ef4444', // red
        '#8b5cf6', // purple
        '#ec4899', // pink
        '#6366f1', // indigo
        '#64748b', // slate
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <form
                className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-xl"
                onSubmit={(event) => {
                    void handleSubmit(event);
                }}
            >
                <h2 className="mb-4 text-lg font-semibold text-gray-800">
                    Nowa grupa klientów
                </h2>
                <div className="grid gap-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Nazwa grupy
                        </label>
                        <input
                            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                            value={form.name}
                            onChange={(event) =>
                                setForm((prev) => ({
                                    ...prev,
                                    name: event.target.value,
                                }))
                            }
                            placeholder="np. VIP, Stali klienci"
                            required
                            aria-label="Nazwa grupy"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Opis (opcjonalnie)
                        </label>
                        <textarea
                            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                            value={form.description}
                            onChange={(event) =>
                                setForm((prev) => ({
                                    ...prev,
                                    description: event.target.value,
                                }))
                            }
                            placeholder="Krótki opis grupy"
                            rows={2}
                            aria-label="Opis grupy"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Kolor
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {colorOptions.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() =>
                                        setForm((prev) => ({ ...prev, color }))
                                    }
                                    className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${
                                        form.color === color
                                            ? 'border-gray-800 ring-2 ring-gray-300'
                                            : 'border-transparent'
                                    }`}
                                    style={{ backgroundColor: color }}
                                    title={color}
                                />
                            ))}
                        </div>
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                    <button
                        type="button"
                        className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        onClick={onClose}
                    >
                        Anuluj
                    </button>
                    <button
                        type="submit"
                        className="rounded bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700 disabled:opacity-50"
                        disabled={submitting || !form.name.trim()}
                    >
                        {submitting ? 'Zapisywanie...' : 'Utwórz grupę'}
                    </button>
                </div>
            </form>
        </div>
    );
}
