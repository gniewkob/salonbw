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
        <div className="modal-backdrop fade in">
            <div className="modal-dialog">
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
                    <div className="modal-body modal-body-scroll py-20">
                        <div className="form-group">
                            <label
                                className="control-label"
                                htmlFor="group_name"
                            >
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
                        <div className="form-group">
                            <label
                                className="control-label"
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
                        <div className="form-group">
                            <label className="control-label">Kolor</label>
                            <div className="versum-color-picker">
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
                                        title={color}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-default"
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
