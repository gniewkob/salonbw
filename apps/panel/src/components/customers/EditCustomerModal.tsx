import { useState } from 'react';
import Modal from '@/components/Modal';
import {
    useCustomer,
    useUpdateCustomer,
    useDeleteCustomer,
} from '@/hooks/useCustomers';
import CustomerPersonalDataTab from './CustomerPersonalDataTab';
import type { Customer } from '@/types';

interface Props {
    open: boolean;
    customerId: number | null;
    onClose: () => void;
    onSuccess: () => void;
    onDeleted: () => void;
}

export default function EditCustomerModal({
    open,
    customerId,
    onClose,
    onSuccess,
    onDeleted,
}: Props) {
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { data: customer, isLoading } = useCustomer(open ? customerId : null);
    const updateCustomer = useUpdateCustomer();
    const deleteCustomer = useDeleteCustomer();

    const handleUpdate = async (data: Partial<Customer>) => {
        if (!customerId) return;
        setError(null);
        try {
            await updateCustomer.mutateAsync({ id: customerId, data });
            onSuccess();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Nie udało się zapisać zmian.',
            );
        }
    };

    const handleDelete = async () => {
        if (!customerId) return;
        setError(null);
        try {
            await deleteCustomer.mutateAsync(customerId);
            onDeleted();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Nie udało się usunąć klienta.',
            );
            setConfirmDelete(false);
        }
    };

    const handleClose = () => {
        setConfirmDelete(false);
        setError(null);
        onClose();
    };

    return (
        <Modal open={open} onClose={handleClose} size="lg">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0 fw-semibold">
                    {customer?.name || customer?.fullName
                        ? `Edytuj: ${customer.name || customer.fullName}`
                        : 'Edytuj klienta'}
                </h5>
                <button
                    type="button"
                    className="btn-close"
                    aria-label="Zamknij"
                    onClick={handleClose}
                />
            </div>

            {error ? (
                <div className="alert alert-danger py-2 small" role="alert">
                    {error}
                </div>
            ) : null}

            {isLoading ? (
                <p className="text-muted small">Ładowanie klienta...</p>
            ) : customer ? (
                <>
                    <CustomerPersonalDataTab
                        customer={customer}
                        onUpdate={handleUpdate}
                    />

                    <div className="pt-3 border-top mt-3">
                        {confirmDelete ? (
                            <div className="d-flex gap-2 align-items-center">
                                <span className="small text-danger">
                                    Usunąć klienta? Tej operacji nie można
                                    cofnąć.
                                </span>
                                <button
                                    type="button"
                                    className="btn btn-danger btn-sm"
                                    onClick={() => void handleDelete()}
                                    disabled={deleteCustomer.isPending}
                                >
                                    {deleteCustomer.isPending
                                        ? 'usuwanie...'
                                        : 'tak, usuń'}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary btn-sm"
                                    onClick={() => setConfirmDelete(false)}
                                    disabled={deleteCustomer.isPending}
                                >
                                    anuluj
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                className="btn btn-outline-danger btn-sm"
                                onClick={() => setConfirmDelete(true)}
                            >
                                usuń klienta
                            </button>
                        )}
                    </div>
                </>
            ) : (
                <p className="text-muted small">Nie znaleziono klienta.</p>
            )}
        </Modal>
    );
}
