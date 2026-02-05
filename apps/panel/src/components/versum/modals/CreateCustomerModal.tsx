import { type FormEvent, useState } from 'react';

export type CustomerDraft = {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
};

type Props = {
    onClose: () => void;
    onCreate: (payload: CustomerDraft) => Promise<void>;
    submitting: boolean;
};

export default function CreateCustomerModal({
    onClose,
    onCreate,
    submitting,
}: Props) {
    const [form, setForm] = useState<CustomerDraft>({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
    });

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        await onCreate(form);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <form
                className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-xl"
                onSubmit={(event) => {
                    void handleSubmit(event);
                }}
            >
                <h2 className="mb-4 text-lg font-semibold text-gray-800">
                    👤 Dodaj klienta
                </h2>
                <div className="grid gap-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Imię
                        </label>
                        <input
                            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                            value={form.firstName}
                            onChange={(event) =>
                                setForm((prev) => ({
                                    ...prev,
                                    firstName: event.target.value,
                                }))
                            }
                            required
                            aria-label="Imię"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Nazwisko
                        </label>
                        <input
                            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                            value={form.lastName}
                            onChange={(event) =>
                                setForm((prev) => ({
                                    ...prev,
                                    lastName: event.target.value,
                                }))
                            }
                            required
                            aria-label="Nazwisko"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Email
                        </label>
                        <input
                            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                            type="email"
                            value={form.email}
                            onChange={(event) =>
                                setForm((prev) => ({
                                    ...prev,
                                    email: event.target.value,
                                }))
                            }
                            aria-label="Email"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Telefon
                        </label>
                        <input
                            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                            value={form.phone}
                            onChange={(event) =>
                                setForm((prev) => ({
                                    ...prev,
                                    phone: event.target.value,
                                }))
                            }
                            aria-label="Telefon"
                        />
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
                        disabled={submitting}
                    >
                        {submitting ? 'Zapisywanie...' : 'Zapisz'}
                    </button>
                </div>
            </form>
        </div>
    );
}
