import { FormEvent, useState } from 'react';
import { Employee } from '@/types';

interface Props {
    initial?: Partial<Employee>;
    onSubmit: (data: {
        firstName: string;
        lastName: string;
        email?: string;
    }) => Promise<void>;
    onCancel: () => void;
}

export default function EmployeeForm({ initial, onSubmit, onCancel }: Props) {
    const isEditing = Boolean(initial?.id);
    const [firstName, setFirstName] = useState(initial?.firstName ?? '');
    const [lastName, setLastName] = useState(initial?.lastName ?? '');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const trimmedFirst = firstName.trim();
        const trimmedLast = lastName.trim();
        if (!trimmedFirst) {
            setError('Imię jest wymagane');
            return;
        }
        if (!trimmedLast) {
            setError('Nazwisko jest wymagane');
            return;
        }

        setError('');
        setSubmitting(true);
        try {
            await onSubmit({
                firstName: trimmedFirst,
                lastName: trimmedLast,
                ...(!isEditing && email.trim() ? { email: email.trim() } : {}),
            });
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message || 'Błąd zapisu'
                    : 'Błąd zapisu',
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={(e) => void handleSubmit(e)} noValidate>
            <div className="mb-3">
                <label htmlFor="ef-firstName" className="form-label fw-medium">
                    Imię <span className="text-danger">*</span>
                </label>
                <input
                    id="ef-firstName"
                    type="text"
                    className="form-control"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    autoFocus
                    disabled={submitting}
                />
            </div>
            <div className="mb-3">
                <label htmlFor="ef-lastName" className="form-label fw-medium">
                    Nazwisko <span className="text-danger">*</span>
                </label>
                <input
                    id="ef-lastName"
                    type="text"
                    className="form-control"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={submitting}
                />
            </div>
            {!isEditing && (
                <div className="mb-3">
                    <label htmlFor="ef-email" className="form-label fw-medium">
                        Email{' '}
                        <span className="text-muted fw-normal small">
                            (opcjonalnie)
                        </span>
                    </label>
                    <input
                        id="ef-email"
                        type="email"
                        className="form-control"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="pracownik@salon.pl"
                        disabled={submitting}
                    />
                    <div className="form-text">
                        Jeśli nie podano, zostanie wygenerowany automatycznie.
                    </div>
                </div>
            )}
            {error && (
                <div
                    role="alert"
                    className="alert alert-danger py-2 small mb-3"
                >
                    {error}
                </div>
            )}
            <div className="d-flex gap-2 justify-content-end">
                <button
                    type="button"
                    className="btn btn-light"
                    onClick={onCancel}
                    disabled={submitting}
                >
                    Anuluj
                </button>
                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                >
                    {submitting ? 'Zapisywanie…' : 'Zapisz'}
                </button>
            </div>
        </form>
    );
}
