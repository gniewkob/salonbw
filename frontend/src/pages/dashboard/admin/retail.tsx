import type { Route } from 'next';
import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import type { ComponentProps } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import RouteGuard from '@/components/RouteGuard';
import DashboardLayout from '@/components/DashboardLayout';
import StatsWidget from '@/components/StatsWidget';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import {
    useInventory,
    useRetailApi,
    useSalesSummary,
    type AdjustInventoryData,
    type CreateSaleData,
} from '@/hooks/useRetail';
import { useProducts } from '@/hooks/useProducts';
import { useEmployees } from '@/hooks/useEmployees';
import { useAppointments } from '@/hooks/useAppointments';

import type SaleFormComponent from '@/components/SaleForm';
import type InventoryAdjustmentFormComponent from '@/components/InventoryAdjustmentForm';

type SaleFormProps = ComponentProps<typeof SaleFormComponent>;
type InventoryAdjustmentFormProps = ComponentProps<
    typeof InventoryAdjustmentFormComponent
>;

const LazySaleForm = dynamic<SaleFormProps>(
    () => import('@/components/SaleForm'),
    {
        ssr: false,
        loading: () => (
            <div className="p-4 text-sm text-gray-500">Loading sale form…</div>
        ),
    },
);

const LazyInventoryAdjustmentForm = dynamic<InventoryAdjustmentFormProps>(
    () => import('@/components/InventoryAdjustmentForm'),
    {
        ssr: false,
        loading: () => (
            <div className="p-4 text-sm text-gray-500">
                Loading inventory form…
            </div>
        ),
    },
);

export default function RetailDashboard() {
    const [threshold, setThreshold] = useState(5);
    const [showSaleForm, setShowSaleForm] = useState(false);
    const [showAdjustForm, setShowAdjustForm] = useState(false);
    const { items, lowStock, loading: invLoading } = useInventory(threshold);
    const { summary, loading: sumLoading } = useSalesSummary();
    const api = useRetailApi();
    const { data: products } = useProducts();
    const { data: employees } = useEmployees();
    const { data: appointments } = useAppointments();
    const queryClient = useQueryClient();

    const columns = useMemo(
        () => [
            { header: 'Name', accessor: 'name' as const },
            { header: 'Brand', accessor: 'brand' as const },
            { header: 'Price', accessor: 'unitPrice' as const },
            { header: 'Stock', accessor: 'stock' as const },
        ],
        [],
    );

    const handleCreateSale = async (data: CreateSaleData) => {
        await api.createSale(data);
        await queryClient.invalidateQueries({
            queryKey: ['api', '/inventory'],
        });
        await queryClient.invalidateQueries({
            queryKey: ['api', '/sales/summary'],
        });
        setShowSaleForm(false);
    };

    const handleAdjustInventory = async (data: AdjustInventoryData) => {
        await api.adjustInventory(data);
        await queryClient.invalidateQueries({
            queryKey: ['api', '/inventory'],
        });
        setShowAdjustForm(false);
    };

    return (
        <RouteGuard roles={['admin']} permission="dashboard:admin">
            <DashboardLayout>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                    <StatsWidget
                        title="Units (24h)"
                        value={summary?.units ?? null}
                        loading={sumLoading}
                    />
                    <StatsWidget
                        title="Revenue (24h)"
                        value={summary?.revenue ?? null}
                        loading={sumLoading}
                    />
                    <div className="w-full p-4 sm:p-6 bg-white rounded shadow">
                        <label className="text-xs sm:text-sm text-gray-500">
                            Low-stock threshold
                        </label>
                        <input
                            type="number"
                            min={0}
                            value={threshold}
                            onChange={(e) =>
                                setThreshold(Number(e.target.value))
                            }
                            className="border p-1 ml-2 w-20"
                        />
                    </div>
                </div>

                <div className="mt-4 flex gap-2">
                    <button
                        className="border px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        onClick={() => setShowSaleForm(true)}
                    >
                        Record Sale
                    </button>
                    <button
                        className="border px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        onClick={() => setShowAdjustForm(true)}
                    >
                        Adjust Inventory
                    </button>
                </div>

                <div className="mt-6 grid gap-6 grid-cols-1 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <h2 className="text-lg font-semibold mb-2">
                            Inventory
                        </h2>
                        <div className="bg-white rounded shadow p-2">
                            <DataTable
                                data={items}
                                columns={columns}
                                initialSort={
                                    'name' as keyof (typeof items)[number]
                                }
                                pageSize={10}
                            />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold mb-2">
                            Low stock
                        </h2>
                        <ul className="bg-white rounded shadow divide-y">
                            {invLoading && (
                                <li className="p-3 text-sm text-gray-500">
                                    Loading…
                                </li>
                            )}
                            {!invLoading && lowStock.length === 0 && (
                                <li className="p-3 text-sm text-gray-500">
                                    All good — no low stock items.
                                </li>
                            )}
                            {lowStock.map((p) => (
                                <li
                                    key={p.id}
                                    className="p-3 flex justify-between"
                                >
                                    <span>
                                        {p.name}
                                        {p.brand ? (
                                            <span className="text-gray-500">
                                                {' '}
                                                · {p.brand}
                                            </span>
                                        ) : null}
                                    </span>
                                    <span className="font-semibold">
                                        {p.stock}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="mt-6">
                    <a
                        href={'/dashboard' as Route}
                        className="text-sm text-blue-600 hover:underline"
                    >
                        ← Back to dashboard
                    </a>
                </div>

                {showSaleForm ? (
                    <Modal open onClose={() => setShowSaleForm(false)}>
                        <h2 className="text-lg font-semibold mb-4">
                            Record Product Sale
                        </h2>
                        <LazySaleForm
                            products={products ?? []}
                            employees={employees ?? []}
                            appointments={appointments ?? []}
                            onSubmit={handleCreateSale}
                            onCancel={() => setShowSaleForm(false)}
                        />
                    </Modal>
                ) : null}

                {showAdjustForm ? (
                    <Modal open onClose={() => setShowAdjustForm(false)}>
                        <h2 className="text-lg font-semibold mb-4">
                            Adjust Inventory
                        </h2>
                        <LazyInventoryAdjustmentForm
                            products={products ?? []}
                            onSubmit={handleAdjustInventory}
                            onCancel={() => setShowAdjustForm(false)}
                        />
                    </Modal>
                ) : null}
            </DashboardLayout>
        </RouteGuard>
    );
}
