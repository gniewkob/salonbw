import type { Route } from 'next';
import RouteGuard from '@/components/RouteGuard';
import DashboardLayout from '@/components/DashboardLayout';
import StatsWidget from '@/components/StatsWidget';
import DataTable from '@/components/DataTable';
import { useInventory, useSalesSummary } from '@/hooks/useRetail';
import { useMemo, useState } from 'react';

export default function RetailDashboard() {
    const [threshold, setThreshold] = useState(5);
    const { items, lowStock, loading: invLoading } = useInventory(threshold);
    const { summary, loading: sumLoading } = useSalesSummary();

    const columns = useMemo(
        () => [
            { header: 'Name', accessor: 'name' as const },
            { header: 'Brand', accessor: 'brand' as const },
            { header: 'Price', accessor: 'unitPrice' as const },
            { header: 'Stock', accessor: 'stock' as const },
        ],
        [],
    );

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
            </DashboardLayout>
        </RouteGuard>
    );
}
