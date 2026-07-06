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
        color: '#6e7278',
    });

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        await onCreate(form);
    };

    const colorOptions = [
        '#0d0d0d',
        '#23252a',
        '#5f6369',
        '#6e7278',
        '#8e9298',
        '#b4b8be',
        '#d1d5db',
        '#f6f6f7',
    ];

    return (
        <div className="modal-backdrop fade in">
            <div
                className="modal-dialog"
                role="dialog"
                aria-modal="true"
                aria-label="Nowa grupa klientów"
            >
                <form
                    className="modal-content"
                    onSubmit={(event) => {
                        void handleSubmit(event);
                    }}
                >
                    <div className="modal-header">
                        <button
                            type="button"
                            className="close"
                            onClick={onClose}
                            aria-label="Zamknij"
                        >
                            <span aria-hidden="true">&times;</span>
                        </button>
                        <h4 className="modal-title">Nowa grupa klientów</h4>
                    </div>
                    <div className="modal-body modal-body-scroll">
                        <div className="mb-3">
                            <label className="form-label" htmlFor="group_name">
                                Nazwa grupy
                            </label>
                            <input
                                id="group_name"
                                className="form-control"
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
                                autoFocus
                            />
                        </div>
                        <div className="mb-3">
                            <label
                                className="form-label"
                                htmlFor="group_description"
                            >
                                Opis (opcjonalnie)
                            </label>
                            <textarea
                                id="group_description"
                                className="form-control"
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
                        <div className="mb-3">
                            <label className="form-label">Kolor</label>
                            <div className="salonbw-color-picker">
                                {colorOptions.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() =>
                                            setForm((prev) => ({
                                                ...prev,
                                                color,
                                            }))
                                        }
                                        data-color={color}
                                        style={{ backgroundColor: color }}
                                        title={color}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={onClose}
                        >
                            Anuluj
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={submitting || !form.name.trim()}
                        >
                            {submitting ? 'Zapisywanie...' : 'Utwórz grupę'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
