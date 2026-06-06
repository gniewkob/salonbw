import { useLayoutEffect, useState } from 'react';
import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import { useAuth } from '@/contexts/AuthContext';
import { useSetSecondaryNav } from '@/contexts/SecondaryNavContext';
import CustomerSettingsNav from '@/components/settings/CustomerSettingsNav';
import {
    useCustomerOrigins,
    useCreateCustomerOrigin,
    useUpdateCustomerOrigin,
    useDeleteCustomerOrigin,
} from '@/hooks/useCustomers';
import type { CustomerOrigin } from '@/types';

const CUSTOMER_SETTINGS_NAV = <CustomerSettingsNav />;

export default function CustomerOriginsPage() {
    const { role } = useAuth();
    const {
        data: origins = [],
        isLoading,
        error,
        refetch,
    } = useCustomerOrigins();
    const create = useCreateCustomerOrigin();
    const update = useUpdateCustomerOrigin();
    const del = useDeleteCustomerOrigin();

    const [showForm, setShowForm] = useState(false);
    const [newName, setNewName] = useState('');
    const [editingOrigin, setEditingOrigin] = useState<CustomerOrigin | null>(
        null,
    );
    const [editName, setEditName] = useState('');
    const [submitError, setSubmitError] = useState<string | null>(null);

    useLayoutEffect(() => {}, []);
    useSetSecondaryNav(CUSTOMER_SETTINGS_NAV);

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError(null);
        void create
            .mutateAsync(newName.trim())
            .then(() => {
                setNewName('');
                setShowForm(false);
            })
            .catch(() => setSubmitError('Nie udało się dodać źródła.'));
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingOrigin) return;
        void update
            .mutateAsync({ id: editingOrigin.id, name: editName.trim() })
            .then(() => setEditingOrigin(null));
    };

    return (
        <RouteGuard roles={['admin']} permission="nav:settings">
            <SalonShell role={role}>
                <div
                    className="salonbw-page"
                    data-testid="customer-origins-page"
                >
                    <SalonBreadcrumbs
                        iconClass="sprite-breadcrumbs_settings"
                        items={[
                            { label: 'Ustawienia', href: '/settings' },
                            {
                                label: 'Klienci',
                                href: '/settings/extra-fields',
                            },
                            { label: 'Pochodzenie klientów' },
                        ]}
                    />

                    <div className="salonbw-page__toolbar mb-4">
                        <div />
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => {
                                setNewName('');
                                setShowForm(true);
                            }}
                        >
                            + Dodaj źródło
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="text-muted p-3">Ładowanie...</div>
                    ) : error ? (
                        <div className="d-flex flex-column gap-2 p-3">
                            <div className="text-danger">
                                Nie udało się pobrać źródeł klientów.
                            </div>
                            <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={() => void refetch()}
                            >
                                Odśwież
                            </button>
                        </div>
                    ) : (
                        <div className="salonbw-table-wrap">
                            <table className="salonbw-table">
                                <thead>
                                    <tr>
                                        <th>Nazwa źródła</th>
                                        <th>Systemowe</th>
                                        <th />
                                    </tr>
                                </thead>
                                <tbody>
                                    {origins.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={3}
                                                className="text-muted text-center py-4"
                                            >
                                                Brak zdefiniowanych źródeł
                                                klientów.
                                            </td>
                                        </tr>
                                    ) : (
                                        origins.map((origin) => (
                                            <tr key={origin.id}>
                                                <td className="fw-medium">
                                                    {origin.name}
                                                </td>
                                                <td>
                                                    {origin.isSystem ? (
                                                        <span className="badge bg-secondary">
                                                            Systemowe
                                                        </span>
                                                    ) : null}
                                                </td>
                                                <td className="text-end">
                                                    {!origin.isSystem && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-outline-secondary me-1"
                                                                onClick={() => {
                                                                    setEditingOrigin(
                                                                        origin,
                                                                    );
                                                                    setEditName(
                                                                        origin.name,
                                                                    );
                                                                }}
                                                            >
                                                                Edytuj
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-outline-danger"
                                                                onClick={() => {
                                                                    if (
                                                                        window.confirm(
                                                                            `Usunąć źródło "${origin.name}"?`,
                                                                        )
                                                                    ) {
                                                                        void del.mutateAsync(
                                                                            origin.id,
                                                                        );
                                                                    }
                                                                }}
                                                            >
                                                                Usuń
                                                            </button>
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Add modal */}
                    {showForm && (
                        <div
                            className="modal d-block"
                            style={{ background: 'rgba(0,0,0,.5)' }}
                        >
                            <div className="modal-dialog">
                                <form
                                    className="modal-content"
                                    onSubmit={handleCreate}
                                >
                                    <div className="modal-header">
                                        <h5 className="modal-title">
                                            Dodaj źródło klienta
                                        </h5>
                                        <button
                                            type="button"
                                            className="btn-close"
                                            onClick={() => setShowForm(false)}
                                        />
                                    </div>
                                    <div className="modal-body">
                                        <div className="mb-3">
                                            <label
                                                className="form-label"
                                                htmlFor="origin-name"
                                            >
                                                Nazwa{' '}
                                                <span className="text-danger">
                                                    *
                                                </span>
                                            </label>
                                            <input
                                                id="origin-name"
                                                className="form-control"
                                                value={newName}
                                                onChange={(e) =>
                                                    setNewName(e.target.value)
                                                }
                                                required
                                            />
                                        </div>
                                        {submitError && (
                                            <div className="alert alert-danger">
                                                {submitError}
                                            </div>
                                        )}
                                    </div>
                                    <div className="modal-footer">
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary"
                                            onClick={() => setShowForm(false)}
                                        >
                                            Anuluj
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={
                                                create.isPending ||
                                                !newName.trim()
                                            }
                                        >
                                            {create.isPending
                                                ? 'Dodawanie...'
                                                : 'Dodaj'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Edit modal */}
                    {editingOrigin && (
                        <div
                            className="modal d-block"
                            style={{ background: 'rgba(0,0,0,.5)' }}
                        >
                            <div className="modal-dialog">
                                <form
                                    className="modal-content"
                                    onSubmit={handleUpdate}
                                >
                                    <div className="modal-header">
                                        <h5 className="modal-title">
                                            Edytuj źródło
                                        </h5>
                                        <button
                                            type="button"
                                            className="btn-close"
                                            onClick={() =>
                                                setEditingOrigin(null)
                                            }
                                        />
                                    </div>
                                    <div className="modal-body">
                                        <div className="mb-3">
                                            <label
                                                className="form-label"
                                                htmlFor="origin-edit-name"
                                            >
                                                Nazwa
                                            </label>
                                            <input
                                                id="origin-edit-name"
                                                className="form-control"
                                                value={editName}
                                                onChange={(e) =>
                                                    setEditName(e.target.value)
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary"
                                            onClick={() =>
                                                setEditingOrigin(null)
                                            }
                                        >
                                            Anuluj
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={
                                                update.isPending ||
                                                !editName.trim()
                                            }
                                        >
                                            {update.isPending
                                                ? 'Zapisywanie...'
                                                : 'Zapisz'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </SalonShell>
        </RouteGuard>
    );
}
