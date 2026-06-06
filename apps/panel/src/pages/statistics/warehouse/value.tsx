import Head from 'next/head';
import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
} from 'recharts';

interface ValueStats {
    totalProducts: number;
    totalValue: number;
    totalQuantity: number;
    byCategory: Array<{
        category: string;
        productCount: number;
        totalValue: number;
        totalQuantity: number;
    }>;
    lowStockProducts: Array<{
        id: number;
        name: string;
        quantity: number;
        minQuantity: number;
        price: number;
    }>;
}

const COLORS = [
    '#008bb4',
    '#5cb85c',
    '#f0ad4e',
    '#d9534f',
    '#6f42c1',
    '#20c997',
    '#fd7e14',
    '#6c757d',
];

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pl-PL', {
        style: 'currency',
        currency: 'PLN',
        maximumFractionDigits: 0,
    }).format(amount);
};

export default function WarehouseValuePage() {
    const { role, apiFetch } = useAuth();
    const [stats, setStats] = useState<ValueStats | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(false);
    const [refreshToken, setRefreshToken] = useState(0);

    useEffect(() => {
        let cancelled = false;
        setIsLoading(true);
        setError(false);
        apiFetch<ValueStats>('/statistics/warehouse/value')
            .then((data) => {
                if (cancelled) return;
                setStats(data);
            })
            .catch(() => {
                if (cancelled) return;
                setStats(null);
                setError(true);
            })
            .finally(() => {
                if (cancelled) return;
                setIsLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [apiFetch, refreshToken]);

    const pieData =
        stats?.byCategory.map((c, index) => ({
            name: c.category,
            value: c.totalValue,
            color: COLORS[index % COLORS.length],
        })) || [];

    return (
        <RouteGuard roles={['admin']} permission="nav:statistics">
            <Head>
                <title>
                    Statystyki — wartość magazynu — Salon Black &amp; White
                </title>
            </Head>
            <SalonShell role={role}>
                <div className="statistics-page">
                    {/* Header */}
                    <div className="flex-between mb-5">
                        <h1 className="fs-3 fw-semibold">
                            Raport wartości produktów
                        </h1>
                        <button
                            type="button"
                            onClick={() =>
                                setRefreshToken((value) => value + 1)
                            }
                            className="btn btn-outline-secondary"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Ładowanie...' : 'Odśwież'}
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="text-center py-40">Ładowanie...</div>
                    ) : error ? (
                        <div className="alert alert-warning">
                            Raport wartości chwilowo niedostępny.
                        </div>
                    ) : stats ? (
                        <>
                            {/* KPI */}
                            <div className="row mb-5">
                                <div className="col-sm-3">
                                    <div className="salonbw-tile">
                                        <div className="salonbw-tile__label">
                                            Produkty
                                        </div>
                                        <div className="salonbw-tile__value">
                                            {stats.totalProducts}
                                        </div>
                                    </div>
                                </div>
                                <div className="col-sm-3">
                                    <div className="salonbw-tile">
                                        <div className="salonbw-tile__label">
                                            Wartość magazynu
                                        </div>
                                        <div className="salonbw-tile__value text-accent">
                                            {formatCurrency(stats.totalValue)}
                                        </div>
                                    </div>
                                </div>
                                <div className="col-sm-3">
                                    <div className="salonbw-tile">
                                        <div className="salonbw-tile__label">
                                            Sztuk w magazynie
                                        </div>
                                        <div className="salonbw-tile__value text-success">
                                            {stats.totalQuantity}
                                        </div>
                                    </div>
                                </div>
                                <div className="col-sm-3">
                                    <div className="salonbw-tile">
                                        <div className="salonbw-tile__label">
                                            Niski stan
                                        </div>
                                        <div
                                            className={`salonbw-tile__value ${
                                                stats.lowStockProducts.length >
                                                0
                                                    ? 'text-danger'
                                                    : ''
                                            }`}
                                        >
                                            {stats.lowStockProducts.length}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Charts */}
                            <div className="row mb-5">
                                <div className="col-sm-6">
                                    <div className="salonbw-widget">
                                        <div className="salonbw-widget__header">
                                            Wartość wg kategorii
                                        </div>
                                        <div
                                            className="salonbw-widget__content"
                                            style={{ height: 300 }}
                                        >
                                            <ResponsiveContainer>
                                                <PieChart>
                                                    <Pie
                                                        data={pieData}
                                                        cx="50%"
                                                        cy="50%"
                                                        outerRadius={100}
                                                        dataKey="value"
                                                        nameKey="name"
                                                        label={({ name }) =>
                                                            name
                                                        }
                                                    >
                                                        {pieData.map(
                                                            (entry, index) => (
                                                                <Cell
                                                                    key={`cell-${index}`}
                                                                    fill={
                                                                        entry.color
                                                                    }
                                                                />
                                                            ),
                                                        )}
                                                    </Pie>
                                                    <Tooltip
                                                        formatter={(
                                                            value: unknown,
                                                        ) => {
                                                            const first =
                                                                Array.isArray(
                                                                    value,
                                                                )
                                                                    ? value[0]
                                                                    : value;
                                                            const amount =
                                                                typeof first ===
                                                                'number'
                                                                    ? first
                                                                    : Number(
                                                                          first ??
                                                                              0,
                                                                      ) || 0;
                                                            return formatCurrency(
                                                                amount,
                                                            );
                                                        }}
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-sm-6">
                                    <div className="salonbw-widget">
                                        <div className="salonbw-widget__header">
                                            Ilość produktów wg kategorii
                                        </div>
                                        <div
                                            className="salonbw-widget__content"
                                            style={{ height: 300 }}
                                        >
                                            <ResponsiveContainer>
                                                <BarChart
                                                    data={stats.byCategory}
                                                    layout="vertical"
                                                    margin={{
                                                        left: 100,
                                                    }}
                                                >
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis type="number" />
                                                    <YAxis
                                                        dataKey="category"
                                                        type="category"
                                                        width={90}
                                                    />
                                                    <Tooltip />
                                                    <Bar
                                                        dataKey="productCount"
                                                        name="Produkty"
                                                        fill="#008bb4"
                                                    />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Categories Table */}
                            <div className="salonbw-widget mb-5">
                                <div className="salonbw-widget__header">
                                    Szczegóły wg kategorii
                                </div>
                                <div className="salonbw-widget__content">
                                    <table className="salonbw-table">
                                        <thead>
                                            <tr>
                                                <th>Kategoria</th>
                                                <th className="text-end">
                                                    Produkty
                                                </th>
                                                <th className="text-end">
                                                    Ilość sztuk
                                                </th>
                                                <th className="text-end">
                                                    Wartość
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stats.byCategory.map((cat) => (
                                                <tr key={cat.category}>
                                                    <td>{cat.category}</td>
                                                    <td className="text-end">
                                                        {cat.productCount}
                                                    </td>
                                                    <td className="text-end">
                                                        {cat.totalQuantity}
                                                    </td>
                                                    <td className="text-end fw-medium">
                                                        {formatCurrency(
                                                            cat.totalValue,
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Low Stock Alert */}
                            {stats.lowStockProducts.length > 0 && (
                                <div className="salonbw-widget">
                                    <div className="salonbw-widget__header text-danger">
                                        ⚠️ Produkty z niskim stanem
                                    </div>
                                    <div className="salonbw-widget__content">
                                        <table className="salonbw-table">
                                            <thead>
                                                <tr>
                                                    <th>Produkt</th>
                                                    <th className="text-end">
                                                        Stan aktualny
                                                    </th>
                                                    <th className="text-end">
                                                        Min. stan
                                                    </th>
                                                    <th className="text-end">
                                                        Cena
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {stats.lowStockProducts.map(
                                                    (p) => (
                                                        <tr key={p.id}>
                                                            <td>{p.name}</td>
                                                            <td className="text-end text-danger fw-bold">
                                                                {p.quantity}
                                                            </td>
                                                            <td className="text-end">
                                                                {p.minQuantity}
                                                            </td>
                                                            <td className="text-end">
                                                                {formatCurrency(
                                                                    p.price,
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ),
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : null}
                </div>
            </SalonShell>
        </RouteGuard>
    );
}
