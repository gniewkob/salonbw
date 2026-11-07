import { useState } from 'react';
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import Modal from '@/components/Modal';
import { useAuth } from '@/contexts/AuthContext';
import CustomerPersonalDataTab from '@/components/customers/CustomerPersonalDataTab';
import {
    useCustomer,
    useDeleteCustomer,
    useUpdateCustomer,
} from '@/hooks/useCustomers';
import type { Customer } from '@/types';
import styles from '@/styles/V18EditCustomerModal.module.css';

type Props = {
    open: boolean;
    customerId: number | null;
    onClose: () => void;
    onSuccess: () => void;
    onDeleted: () => void;
};

/**
 * V18 visual layer around the existing CRM personal-data editor.
 *
 * Reusing CustomerPersonalDataTab preserves field mapping, validation
 * behavior, reset semantics and the payload supported by the existing API.
 * No parallel, potentially divergent customer editor is introduced.
 */
export default function V18EditCustomerModal({
    open,
    customerId,
    onClose,
    onSuccess,
    onDeleted,
}: Props) {
    const { role } = useAuth();
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const {
        data: customer,
        isLoading,
        isError,
        refetch,
    } = useCustomer(open ? customerId : null);
    const update = useUpdateCustomer();
    const remove = useDeleteCustomer();
    const busy = saving || update.isPending || remove.isPending;

    const close = () => {
        if (busy) return;
        setConfirmDelete(false);
        setError(null);
        onClose();
    };

    const save = async (data: Partial<Customer>) => {
        if (customerId === null || busy) return;
        setError(null);
        setSaving(true);
        try {
            if (
                data.discountPercent != null &&
                (!Number.isFinite(data.discountPercent) ||
                    data.discountPercent < 0 ||
                    data.discountPercent > 100)
            ) {
                throw new Error(
                    'Stały rabat musi mieścić się w zakresie 0–100%.',
                );
            }
            await update.mutateAsync({ id: customerId, data });
            setConfirmDelete(false);
            onSuccess();
        } catch (cause) {
            const message =
                cause instanceof Error
                    ? cause.message
                    : 'Nie udało się zapisać danych klienta.';
            setError(message);
            // The reused form must keep its draft dirty on a failed request.
            throw cause;
        } finally {
            setSaving(false);
        }
    };

    const deleteCustomer = async () => {
        if (role !== 'admin' || customerId === null || busy || !confirmDelete)
            return;
        setError(null);
        try {
            await remove.mutateAsync(customerId);
            setConfirmDelete(false);
            onDeleted();
        } catch (cause) {
            setError(
                cause instanceof Error
                    ? cause.message
                    : 'Nie udało się usunąć klienta.',
            );
        }
    };

    return (
        <Modal open={open} onClose={close} size="xl">
            <section
                className={styles.editor}
                aria-label="Edycja klienta V18"
                data-testid="v18-customer-editor"
            >
                <header className={styles.header}>
                    <div className={styles.headerIdentity}>
                        <span className={styles.eyebrow}>
                            Salon Black &amp; White · CRM V18
                        </span>
                        <h2>
                            <PencilSquareIcon
                                width={23}
                                height={23}
                                aria-hidden="true"
                            />
                            Edycja klienta
                        </h2>
                        <p className={styles.subtitle}>
                            {customer?.fullName ||
                                customer?.name ||
                                'Dane osobowe i ustawienia klienta'}
                        </p>
                    </div>
                    <button
                        type="button"
                        className={styles.close}
                        onClick={close}
                        disabled={busy}
                        aria-label="Zamknij edycję klienta"
                    >
                        Zamknij
                    </button>
                </header>

                {error ? (
                    <p className={styles.error} role="alert">
                        {error}
                    </p>
                ) : null}

                {isLoading ? (
                    <p className={styles.state} role="status">
                        Ładowanie danych klienta…
                    </p>
                ) : isError ? (
                    <div className={styles.state} role="alert">
                        Nie udało się pobrać danych klienta.
                        <button
                            type="button"
                            className={styles.secondary}
                            onClick={() => void refetch()}
                        >
                            Ponów pobieranie
                        </button>
                    </div>
                ) : customer ? (
                    <>
                        <div className={styles.formScope}>
                            <CustomerPersonalDataTab
                                key={customer.id}
                                customer={customer}
                                onUpdate={save}
                                supportedOnly
                            />
                        </div>
                        <footer className={styles.footer}>
                            <p className={styles.note}>
                                Edytować można pola obsługiwane przez API CRM.
                                Grupy i tagi zarządzane są osobno, bez zmiany
                                przypisań podczas zapisu tego formularza.
                            </p>
                            {role === 'admin' && confirmDelete ? (
                                <div className={styles.deleteConfirm}>
                                    <strong>
                                        Usunąć klienta „
                                        {customer.fullName || customer.name}”?
                                    </strong>
                                    <p>
                                        Usunięcie klienta może mieć wpływ na
                                        powiązane dane. Tej operacji nie można
                                        cofnąć.
                                    </p>
                                    <div className={styles.deleteActions}>
                                        <button
                                            type="button"
                                            className={styles.danger}
                                            onClick={() =>
                                                void deleteCustomer()
                                            }
                                            disabled={busy}
                                        >
                                            {remove.isPending
                                                ? 'Usuwanie…'
                                                : 'Potwierdź usunięcie'}
                                        </button>
                                        <button
                                            type="button"
                                            className={styles.secondary}
                                            onClick={() =>
                                                setConfirmDelete(false)
                                            }
                                            disabled={busy}
                                        >
                                            Anuluj usuwanie
                                        </button>
                                    </div>
                                </div>
                            ) : role === 'admin' ? (
                                <button
                                    type="button"
                                    className={styles.dangerOutline}
                                    onClick={() => setConfirmDelete(true)}
                                    disabled={busy}
                                >
                                    <TrashIcon
                                        width={16}
                                        height={16}
                                        aria-hidden="true"
                                    />
                                    Usuń klienta
                                </button>
                            ) : null}
                        </footer>
                    </>
                ) : (
                    <p className={styles.state} role="alert">
                        Nie znaleziono klienta.
                    </p>
                )}
            </section>
        </Modal>
    );
}
