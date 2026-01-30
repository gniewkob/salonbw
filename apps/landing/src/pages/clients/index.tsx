'use client';

import { useState } from 'react';
import RouteGuard from '@/components/RouteGuard';
import DashboardLayout from '@/components/DashboardLayout';
import { CustomerSidebar, CustomerCard } from '@/components/customers';
import {
    useCustomers,
    useCustomer,
    useCustomerGroups,
    useCustomerTags,
    useTagsForCustomer,
    useUpdateCustomer,
    useCreateCustomer,
} from '@/hooks/useCustomers';
import { Customer, CustomerFilterParams } from '@/types';

export default function ClientsPage() {
    const [filters, setFilters] = useState<CustomerFilterParams>({
        page: 1,
        limit: 20,
    });
    const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(
        null,
    );
    const [showCreateModal, setShowCreateModal] = useState(false);

    const { data: customersData, isLoading: customersLoading } =
        useCustomers(filters);
    const { data: groups } = useCustomerGroups();
    const { data: tags } = useCustomerTags();
    const { data: selectedCustomer } = useCustomer(selectedCustomerId);
    const { data: customerTags } = useTagsForCustomer(selectedCustomerId);

    const updateCustomer = useUpdateCustomer();
    const createCustomer = useCreateCustomer();

    const handleFilterChange = (newFilters: CustomerFilterParams) => {
        setFilters(newFilters);
    };

    const handleSelectCustomer = (customer: Customer) => {
        setSelectedCustomerId(customer.id);
    };

    const handleCloseCard = () => {
        setSelectedCustomerId(null);
    };

    const handleUpdateCustomer = async (data: Partial<Customer>) => {
        if (selectedCustomerId) {
            await updateCustomer.mutateAsync({ id: selectedCustomerId, data });
        }
    };

    const handleCreateCustomer = async (data: Partial<Customer>) => {
        await createCustomer.mutateAsync(data);
        setShowCreateModal(false);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pl-PL');
    };

    return (
        <RouteGuard roles={['admin', 'employee', 'receptionist']} permission="nav:clients">
            <DashboardLayout>
                <div className="flex h-[calc(100vh-4rem)]">
                    {/* Sidebar */}
                    <CustomerSidebar
                        groups={groups || []}
                        tags={tags || []}
                        filters={filters}
                        onFilterChange={handleFilterChange}
                    />

                    {/* Main Content */}
                    <div className="flex flex-1 overflow-hidden">
                        {/* Customer List */}
                        <div
                            className={`flex-1 overflow-y-auto bg-gray-50 p-4 ${
                                selectedCustomerId ? 'hidden md:block md:w-1/2' : ''
                            }`}
                        >
                            {/* Header */}
                            <div className="mb-4 flex items-center justify-between">
                                <h1 className="text-xl font-semibold text-gray-800">
                                    Klienci
                                    {customersData && (
                                        <span className="ml-2 text-sm font-normal text-gray-500">
                                            ({customersData.total})
                                        </span>
                                    )}
                                </h1>
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="rounded bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700"
                                >
                                    + Dodaj klienta
                                </button>
                            </div>

                            {/* Customer List */}
                            {customersLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="text-gray-500">
                                        Ładowanie klientów...
                                    </div>
                                </div>
                            ) : customersData?.items.length === 0 ? (
                                <div className="rounded-lg border bg-white p-8 text-center text-gray-500">
                                    Nie znaleziono klientów
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-2">
                                        {customersData?.items.map((customer) => (
                                            <button
                                                type="button"
                                                key={customer.id}
                                                onClick={() => handleSelectCustomer(customer)}
                                                className={`w-full rounded-lg border bg-white p-4 text-left shadow-sm transition-shadow hover:shadow-md ${
                                                    selectedCustomerId === customer.id
                                                        ? 'ring-2 ring-cyan-500'
                                                        : ''
                                                }`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-100 text-sm font-semibold text-cyan-700">
                                                        {customer.name
                                                            .split(' ')
                                                            .map((n) => n[0])
                                                            .join('')
                                                            .toUpperCase()
                                                            .slice(0, 2)}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="font-medium text-gray-900">
                                                            {customer.name}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {customer.phone || customer.email || '-'}
                                                        </div>
                                                    </div>
                                                    <div className="text-right text-xs text-gray-400">
                                                        {customer.createdAt &&
                                                            formatDate(customer.createdAt)}
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Pagination */}
                                    {customersData && customersData.totalPages > 1 && (
                                        <div className="mt-4 flex items-center justify-between border-t pt-4">
                                            <div className="text-sm text-gray-500">
                                                Strona {customersData.page} z{' '}
                                                {customersData.totalPages}
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setFilters((f) => ({
                                                            ...f,
                                                            page: Math.max(1, (f.page || 1) - 1),
                                                        }))
                                                    }
                                                    disabled={filters.page === 1}
                                                    className="rounded border px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    Poprzednia
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setFilters((f) => ({
                                                            ...f,
                                                            page: Math.min(
                                                                customersData.totalPages,
                                                                (f.page || 1) + 1,
                                                            ),
                                                        }))
                                                    }
                                                    disabled={
                                                        filters.page ===
                                                        customersData.totalPages
                                                    }
                                                    className="rounded border px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    Następna
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Customer Detail Card */}
                        {selectedCustomer && (
                            <div className="w-full border-l md:w-1/2">
                                <CustomerCard
                                    customer={selectedCustomer}
                                    tags={customerTags || []}
                                    onClose={handleCloseCard}
                                    onUpdate={handleUpdateCustomer}
                                />
                            </div>
                        )}
                    </div>

                    {/* Create Customer Modal */}
                    {showCreateModal && (
                        <CreateCustomerModal
                            onClose={() => setShowCreateModal(false)}
                            onCreate={handleCreateCustomer}
                            isLoading={createCustomer.isPending}
                        />
                    )}
                </div>
            </DashboardLayout>
        </RouteGuard>
    );
}

function CreateCustomerModal({
    onClose,
    onCreate,
    isLoading,
}: {
    onClose: () => void;
    onCreate: (data: Partial<Customer>) => void;
    isLoading: boolean;
}) {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onCreate(formData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-800">
                        Nowy klient
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Zamknij"
                        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    >
                        <svg
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label htmlFor="firstName" className="mb-1 block text-sm font-medium text-gray-700">
                                Imię
                            </label>
                            <input
                                id="firstName"
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                required
                                placeholder="Wprowadź imię"
                                className="w-full rounded border px-3 py-2"
                            />
                        </div>
                        <div>
                            <label htmlFor="lastName" className="mb-1 block text-sm font-medium text-gray-700">
                                Nazwisko
                            </label>
                            <input
                                id="lastName"
                                type="text"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                placeholder="Wprowadź nazwisko"
                                className="w-full rounded border px-3 py-2"
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="phone" className="mb-1 block text-sm font-medium text-gray-700">
                            Telefon
                        </label>
                        <input
                            id="phone"
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="Wprowadź numer telefonu"
                            className="w-full rounded border px-3 py-2"
                        />
                    </div>
                    <div>
                        <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                            E-mail
                        </label>
                        <input
                            id="email"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Wprowadź adres e-mail"
                            className="w-full rounded border px-3 py-2"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                        >
                            Anuluj
                        </button>
                        <button
                            type="submit"
                            disabled={!formData.firstName || isLoading}
                            className="rounded bg-cyan-600 px-4 py-2 text-sm text-white hover:bg-cyan-700 disabled:opacity-50"
                        >
                            {isLoading ? 'Zapisywanie...' : 'Dodaj klienta'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
