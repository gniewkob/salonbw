import { useState } from 'react';
import { useRouter } from 'next/router';
import { MagnifyingGlassIcon, PhoneIcon } from '@heroicons/react/24/outline';
import type { Customer } from '@/types';
import { useCustomerGroups } from '@/hooks/useCustomers';

interface ClientsListProps {
    customers: Customer[];
    loading?: boolean;
}

export default function ClientsList({ customers, loading }: ClientsListProps) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const { data: groups } = useCustomerGroups();

    const filteredCustomers = customers.filter(
        (c) =>
            c.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.phone?.includes(searchTerm),
    );

    // Pobierz aktywny filtr grupy
    const currentGroupId = router.query.groupId
        ? Number(router.query.groupId)
        : undefined;
    const activeGroup = groups?.find((g) => g.id === currentGroupId);

    // Funkcja do czyszczenia filtra
    const clearGroupFilter = () => {
        const restQuery = { ...router.query };
        delete restQuery.groupId;
        void router.push(
            { pathname: router.pathname, query: restQuery },
            undefined,
            { shallow: true },
        );
    };

    return (
        <div className="d-flex flex-column h-100 bg-white">
            {/* Aktywne filtry - jak w source UI */}
            {activeGroup && (
                <div className="px-3 py-2 bg-light border-bottom border-secondary border-opacity-25">
                    <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-2">
                            <span className="small text-muted">
                                wybrane kryteria wyszukiwania:
                            </span>
                        </div>
                        <button
                            onClick={clearGroupFilter}
                            className="text-secondary"
                            title="Wyczyść filtry"
                        >
                            ✕
                        </button>
                    </div>
                    <div className="mt-2 d-flex align-items-center gap-2">
                        <span className="inline-d-flex align-items-center px-3 py-1 rounded-circle small bg-white border border-secondary border-opacity-25 text-body">
                            należą do grup ({filteredCustomers.length})
                            <span className="ms-2 fw-medium">
                                {activeGroup.name}
                            </span>
                            <button
                                onClick={clearGroupFilter}
                                className="ms-2 text-secondary"
                            >
                                ✕
                            </button>
                        </span>
                    </div>
                    <div className="mt-2 small">
                        <span className="text-muted">
                            Klientów spełniających kryteria:
                        </span>
                        <span className="ms-1 fw-semibold text-dark">
                            {filteredCustomers.length}
                        </span>
                        <button className="ms-2 text-sky-600 small">
                            utwórz grupę
                        </button>
                    </div>
                </div>
            )}

            {/* Toolbar */}
            <div className="d-flex align-items-center justify-content-between p-3 border-bottom border-secondary border-opacity-25 bg-white">
                <div className="position-relative w-100">
                    <div className="position-absolute inset-y-0 start-0 ps-3 d-flex align-items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-5 w-5 text-secondary" />
                    </div>
                    <input
                        type="text"
                        placeholder="Szukaj klienta (imię, nazwisko, telefon)..."
                        className="d-block w-100 pl-10 pe-3 py-2 border border-secondary border-opacity-50 rounded-2 leading-5 bg-white placeholder-gray-500 focus:outline- focus:"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="d-flex align-items-center gap-2 small text-muted">
                    <span>{filteredCustomers.length} klientów</span>
                </div>
            </div>

            {/* List */}
            <div className="flex-fill overflow-auto">
                {loading ? (
                    <div className="d-flex justify-content-center p-4">
                        <div className="rounded-circle h-8 w-8 border-bottom-2 border-sky-600"></div>
                    </div>
                ) : (
                    <table className="min-w-100">
                        <thead className="bg-light">
                            <tr>
                                <th
                                    scope="col"
                                    className="px-4 py-2 text-start small fw-medium text-muted text-uppercase"
                                >
                                    Klient
                                </th>
                                <th
                                    scope="col"
                                    className="px-4 py-2 text-start small fw-medium text-muted text-uppercase"
                                >
                                    Kontakt
                                </th>
                                <th
                                    scope="col"
                                    className="px-4 py-2 text-start small fw-medium text-muted text-uppercase"
                                >
                                    Ostatnia wizyta
                                </th>
                                <th
                                    scope="col"
                                    className="position-relative px-4 py-2"
                                >
                                    <span className="visually-hidden">
                                        Akcje
                                    </span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {filteredCustomers.map((customer) => (
                                <tr key={customer.id} className="">
                                    <td className="px-4 py-3 text-nowrap">
                                        <div className="d-flex align-items-center">
                                            <div className="flex-flex-shrink-0 h-10 w-10">
                                                <div className="h-10 w-10 rounded-circle bg-sky-100 d-flex align-items-center justify-content-center text-sky-700 fw-semibold">
                                                    {customer.firstName?.[0]}
                                                    {customer.lastName?.[0]}
                                                </div>
                                            </div>
                                            <div className="ms-3">
                                                <div className="small fw-medium text-dark">
                                                    {customer.fullName}
                                                </div>
                                                <div className="small text-muted">
                                                    Dodano: 2024-01-01
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-nowrap">
                                        <div className="d-flex align-items-center small text-dark">
                                            <PhoneIcon className="h-4 w-4 text-secondary me-2" />
                                            {customer.phone || '-'}
                                        </div>
                                        <div className="small text-muted">
                                            {customer.email}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-nowrap">
                                        <span className="px-2 inline-d-flex small leading-5 fw-semibold rounded-circle bg-success bg-opacity-10 text-success">
                                            3 dni temu
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-nowrap text-end small fw-medium">
                                        <a
                                            href={`/customers/${customer.id}`}
                                            className="text-sky-600"
                                        >
                                            Edytuj
                                        </a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
