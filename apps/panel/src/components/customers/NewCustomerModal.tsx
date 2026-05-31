import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import Modal from '@/components/Modal';
import { useCreateCustomer, useCustomers } from '@/hooks/useCustomers';
import CustomerFormFields, {
    type CustomerFormDraft,
    type CustomerFormOnChange,
} from '@/components/customers/CustomerFormFields';

const EMPTY_FORM: CustomerFormDraft = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthDate: '',
    gender: '',
    address: '',
    buildingNo: '',
    apartmentNo: '',
    city: '',
    postalCode: '',
    country: '',
    nameDay: '',
    origin: '',
    pesel: '',
    nip: '',
    cardNumber: '',
    groups: '',
    description: '',
    emailConsent: false,
    smsConsent: false,
};

interface Props {
    open: boolean;
    onClose: () => void;
    onSuccess: (customerId: number) => void;
}

export default function NewCustomerModal({ open, onClose, onSuccess }: Props) {
    const create = useCreateCustomer();
    const [form, setForm] = useState<CustomerFormDraft>(EMPTY_FORM);
    const [error, setError] = useState<string | null>(null);

    const [dupSearch, setDupSearch] = useState('');
    useEffect(() => {
        if (!open) return;
        const phone = form.phone.trim();
        const email = form.email.trim();
        const query = phone || email;
        if (!query) {
            setDupSearch('');
            return;
        }
        const tid = setTimeout(() => setDupSearch(query), 600);
        return () => clearTimeout(tid);
    }, [form.phone, form.email, open]);

    const { data: dupData } = useCustomers(
        dupSearch ? { search: dupSearch, limit: 5 } : {},
    );
    const duplicates = dupSearch ? (dupData?.items ?? []) : [];

    const handleChange: CustomerFormOnChange = (key, value) =>
        setForm((p) => ({ ...p, [key]: value }));

    const handleClose = () => {
        setForm(EMPTY_FORM);
        setError(null);
        setDupSearch('');
        onClose();
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            const created = await create.mutateAsync({
                firstName: form.firstName.trim() || undefined,
                lastName: form.lastName.trim() || undefined,
                email: form.email.trim() || undefined,
                phone: form.phone.trim() || undefined,
                birthDate: form.birthDate || undefined,
                gender: form.gender || undefined,
                address: form.address.trim() || undefined,
                city: form.city.trim() || undefined,
                postalCode: form.postalCode.trim() || undefined,
                description: form.description.trim() || undefined,
                emailConsent: form.emailConsent,
                smsConsent: form.smsConsent,
            });
            setForm(EMPTY_FORM);
            setDupSearch('');
            onSuccess(created.id);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Nie udało się zapisać klienta.',
            );
        }
    };

    const canSubmit =
        !create.isPending &&
        (form.firstName.trim() ||
            form.lastName.trim() ||
            form.email.trim() ||
            form.phone.trim());

    return (
        <Modal open={open} onClose={handleClose} size="lg">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0 fw-semibold">Nowy klient</h5>
                <button
                    type="button"
                    className="btn-close"
                    aria-label="Zamknij"
                    onClick={handleClose}
                />
            </div>

            {duplicates.length > 0 ? (
                <div
                    className="alert alert-warning d-flex align-items-start gap-2 py-2 small"
                    role="alert"
                >
                    <span>⚠️</span>
                    <div>
                        <strong>Możliwy duplikat</strong> — klienci z podobnym
                        telefonem lub emailem:
                        <ul className="mb-0 mt-1">
                            {duplicates.map((d) => (
                                <li key={d.id}>
                                    <Link
                                        href={`/customers/${d.id}` as Route}
                                        className="alert-link"
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        {d.fullName || d.name}
                                    </Link>
                                    {d.phone ? ` — ${d.phone}` : ''}
                                    {d.email ? ` — ${d.email}` : ''}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            ) : null}

            {error ? (
                <div className="alert alert-danger py-2 small">{error}</div>
            ) : null}

            <form onSubmit={(e) => void handleSubmit(e)}>
                <CustomerFormFields
                    values={form}
                    onChange={handleChange}
                    disabled={create.isPending}
                    fieldIdPrefix="modal-customer"
                    autoFocusFirstName
                />

                <div className="d-flex gap-2 justify-content-end pt-3 border-top mt-3">
                    <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={handleClose}
                        disabled={create.isPending}
                    >
                        anuluj
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary btn-sm"
                        disabled={!canSubmit}
                    >
                        {create.isPending ? 'zapisywanie...' : 'dodaj klienta'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
