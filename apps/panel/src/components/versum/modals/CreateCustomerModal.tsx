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
                        <h4 className="modal-title">Dodaj klienta</h4>
                    </div>
                    <div className="modal-body">
                        <div className="form-group">
                            <label className="control-label">Imię</label>
                            <input
                                className="form-control"
                                value={form.firstName}
                                onChange={(event) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        firstName: event.target.value,
                                    }))
                                }
                                required
                                aria-label="Imię"
                                autoFocus
                            />
                        </div>
                        <div className="form-group">
                            <label className="control-label">Nazwisko</label>
                            <input
                                className="form-control"
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
                        <div className="form-group">
                            <label className="control-label">Email</label>
                            <input
                                className="form-control"
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
                        <div className="form-group">
                            <label className="control-label">Telefon</label>
                            <input
                                className="form-control"
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
                            disabled={submitting}
                        >
                            {submitting ? 'Zapisywanie...' : 'Zapisz'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
