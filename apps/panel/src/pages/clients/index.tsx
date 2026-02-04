'use client';

import { FormEvent, useMemo, useState } from 'react';
import RouteGuard from '@/components/RouteGuard';
import DashboardLayout from '@/components/DashboardLayout';
import { useCreateCustomer, useCustomers } from '@/hooks/useCustomers';

type CustomerDraft = {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
};

function formatDate(value: string) {
    try {
        return new Date(value).toLocaleString('pl-PL', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return '-';
    }
}

export default function ClientsPage() {
    return <ClientsPageContent />;
}

function ClientsPageContent() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const createCustomer = useCreateCustomer();

    const { data, isLoading } = useCustomers({
        page,
        limit: 20,
        search: search || undefined,
        sortBy: 'name',
        sortOrder: 'ASC',
    });

    const customerRows = useMemo(() => data?.items ?? [], [data?.items]);

    const totalPages = data?.totalPages ?? 1;

    return (
        <RouteGuard
            roles={['admin', 'employee', 'receptionist']}
            permission="nav:clients"
        >
            <DashboardLayout>
                <div className="versum-page" data-testid="clients-page">
                    <header className="versum-page__header">
                        <h1 className="versum-page__title">
                            Klienci / Lista klientów
                        </h1>
                    </header>

                    <div className="versum-page__toolbar">
                        <input
                            className="versum-input w-[240px]"
                            value={search}
                            onChange={(event) => {
                                setSearch(event.target.value);
                                setPage(1);
                            }}
                            placeholder="wyszukaj klienta"
                        />
                        <select className="versum-select" defaultValue="asc">
                            <option value="asc">nazwisko: od A do Z</option>
                            <option value="desc">nazwisko: od Z do A</option>
                        </select>
                        <button
                            type="button"
                            className="versum-button ml-auto"
                            onClick={() => setShowCreateModal(true)}
                        >
                            Dodaj klienta
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="p-4 text-sm versum-muted">
                            Ładowanie klientów...
                        </div>
                    ) : (
                        <>
                            <div className="versum-table-wrap">
                                <table className="versum-table">
                                    <thead>
                                        <tr>
                                            <th></th>
                                            <th>Klient</th>
                                            <th>Telefon</th>
                                            <th>Email</th>
                                            <th>Data dodania</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {customerRows.map((customer) => (
                                            <tr key={customer.id}>
                                                <td>
                                                    <input
                                                        type="checkbox"
                                                        aria-label={`Wybierz ${customer.name}`}
                                                    />
                                                </td>
                                                <td>{customer.name}</td>
                                                <td>{customer.phone || '-'}</td>
                                                <td>{customer.email || '-'}</td>
                                                <td>
                                                    {formatDate(
                                                        customer.createdAt,
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="flex items-center justify-between border-t border-gray-300 bg-white px-3 py-2 text-xs text-gray-600">
                                <span>
                                    Pozycje od{' '}
                                    {Math.min(
                                        (page - 1) * 20 + 1,
                                        data?.total ?? 0,
                                    )}{' '}
                                    do {Math.min(page * 20, data?.total ?? 0)}{' '}
                                    na stronie
                                    <select
                                        className="ml-1 rounded border border-gray-300 p-1"
                                        defaultValue="20"
                                    >
                                        <option value="20">20</option>
                                    </select>
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        className="versum-button versum-button--light"
                                        disabled={page <= 1}
                                        onClick={() =>
                                            setPage((current) =>
                                                Math.max(current - 1, 1),
                                            )
                                        }
                                    >
                                        poprzednia
                                    </button>
                                    <span>
                                        {page} z {totalPages}
                                    </span>
                                    <button
                                        type="button"
                                        className="versum-button versum-button--light"
                                        disabled={page >= totalPages}
                                        onClick={() =>
                                            setPage((current) =>
                                                Math.min(
                                                    current + 1,
                                                    totalPages,
                                                ),
                                            )
                                        }
                                    >
                                        następna
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {showCreateModal ? (
                    <CreateCustomerModal
                        onClose={() => setShowCreateModal(false)}
                        onCreate={async (payload) => {
                            const name =
                                `${payload.firstName} ${payload.lastName}`.trim();
                            await createCustomer.mutateAsync({
                                ...payload,
                                name,
                                smsConsent: true,
                                emailConsent: true,
                                gdprConsent: true,
                            });
                            setShowCreateModal(false);
                        }}
                        submitting={createCustomer.isPending}
                    />
                ) : null}
            </DashboardLayout>
        </RouteGuard>
    );
}

function CreateCustomerModal({
    onClose,
    onCreate,
    submitting,
}: {
    onClose: () => void;
    onCreate: (payload: CustomerDraft) => Promise<void>;
    submitting: boolean;
}) {
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
                className="w-full max-w-md rounded border border-gray-300 bg-white p-4"
                onSubmit={(event) => {
                    void handleSubmit(event);
                }}
            >
                <h2 className="mb-3 text-lg font-semibold text-gray-800">
                    Dodaj klienta
                </h2>
                <div className="grid gap-3">
                    <input
                        className="versum-input"
                        placeholder="Imię"
                        value={form.firstName}
                        onChange={(event) =>
                            setForm((prev) => ({
                                ...prev,
                                firstName: event.target.value,
                            }))
                        }
                        required
                    />
                    <input
                        className="versum-input"
                        placeholder="Nazwisko"
                        value={form.lastName}
                        onChange={(event) =>
                            setForm((prev) => ({
                                ...prev,
                                lastName: event.target.value,
                            }))
                        }
                        required
                    />
                    <input
                        className="versum-input"
                        placeholder="Email"
                        type="email"
                        value={form.email}
                        onChange={(event) =>
                            setForm((prev) => ({
                                ...prev,
                                email: event.target.value,
                            }))
                        }
                        required
                    />
                    <input
                        className="versum-input"
                        placeholder="Telefon"
                        value={form.phone}
                        onChange={(event) =>
                            setForm((prev) => ({
                                ...prev,
                                phone: event.target.value,
                            }))
                        }
                    />
                </div>
                <div className="mt-4 flex justify-end gap-2">
                    <button
                        type="button"
                        className="versum-button versum-button--light"
                        onClick={onClose}
                    >
                        anuluj
                    </button>
                    <button
                        type="submit"
                        className="versum-button"
                        disabled={submitting}
                    >
                        {submitting ? 'zapisywanie...' : 'zapisz'}
                    </button>
                </div>
            </form>
        </div>
    );
}
