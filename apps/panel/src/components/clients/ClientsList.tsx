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
        const { groupId, ...restQuery } = router.query;
        void router.push(
            { pathname: router.pathname, query: restQuery },
            undefined,
            { shallow: true },
        );
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Aktywne filtry - jak w Versum */}
            {activeGroup && (
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">
                                wybrane kryteria wyszukiwania:
                            </span>
                        </div>
                        <button
                            onClick={clearGroupFilter}
                            className="text-gray-400 hover:text-gray-600"
                            title="Wyczyść filtry"
                        >
                            ✕
                        </button>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-white border border-gray-200 text-gray-700">
                            należą do grup ({filteredCustomers.length})
                            <span className="ml-2 font-medium">
                                {activeGroup.name}
                            </span>
                            <button
                                onClick={clearGroupFilter}
                                className="ml-2 text-gray-400 hover:text-red-500"
                            >
                                ✕
                            </button>
                        </span>
                    </div>
                    <div className="mt-2 text-sm">
                        <span className="text-gray-600">
                            Klientów spełniających kryteria:
                        </span>
                        <span className="ml-1 font-semibold text-gray-900">
                            {filteredCustomers.length}
                        </span>
                        <button className="ml-3 text-sky-600 hover:text-sky-800 text-xs">
                            utwórz grupę
                        </button>
                    </div>
                </div>
            )}

            {/* Toolbar */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
                <div className="relative max-w-md w-full">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Szukaj klienta (imię, nazwisko, telefon)..."
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>{filteredCustomers.length} klientów</span>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-auto">
                {loading ? (
                    <div className="flex justify-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
                    </div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Klient
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Kontakt
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Ostatnia wizyta
                                </th>
                                <th scope="col" className="relative px-6 py-3">
                                    <span className="sr-only">Akcje</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredCustomers.map((customer) => (
                                <tr
                                    key={customer.id}
                                    className="hover:bg-gray-50 transition-colors"
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <div className="h-10 w-10 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 font-semibold">
                                                    {customer.firstName?.[0]}
                                                    {customer.lastName?.[0]}
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {customer.fullName}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    Dodano: 2024-01-01
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center text-sm text-gray-900">
                                            <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                                            {customer.phone || '-'}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {customer.email}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                            3 dni temu
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <a
                                            href={`/clients/${customer.id}`}
                                            className="text-sky-600 hover:text-sky-900"
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
