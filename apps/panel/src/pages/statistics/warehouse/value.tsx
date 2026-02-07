import RouteGuard from '@/components/RouteGuard';
import VersumShell from '@/components/versum/VersumShell';
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

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const data = await apiFetch<ValueStats>(
                '/statistics/warehouse/value',
            );
            setStats(data);
        } catch (error) {
            console.error('Failed to fetch value stats:', error);
        }
        setIsLoading(false);
    };

    if (!role) return null;

    const pieData =
        stats?.byCategory.map((c, index) => ({
            name: c.category,
            value: c.totalValue,
            color: COLORS[index % COLORS.length],
        })) || [];

    return (
        <RouteGuard roles={['admin']} permission="nav:statistics">
            <VersumShell role={role}>
                <div className="statistics-page">
                    {/* Header */}
                    <div className="flex-between mb-20">
                        <h1 className="text-2xl font-semibold">
                            Raport wartości produktów
                        </h1>
                        <button
                            onClick={fetchData}
                            className="versum-btn versum-btn--default"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Ładowanie...' : 'Odśwież'}
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="text-center py-40">Ładowanie...</div>
                    ) : stats ? (
                        <>
                            {/* KPI */}
                            <div className="row mb-20">
                                <div className="col-sm-3">
                                    <div className="versum-tile">
                                        <div className="versum-tile__label">
                                            Produkty
                                        </div>
                                        <div className="versum-tile__value">
                                            {stats.totalProducts}
                                        </div>
                                    </div>
                                </div>
                                <div className="col-sm-3">
                                    <div className="versum-tile">
                                        <div className="versum-tile__label">
                                            Wartość magazynu
                                        </div>
                                        <div className="versum-tile__value text-accent">
                                            {formatCurrency(stats.totalValue)}
                                        </div>
                                    </div>
                                </div>
                                <div className="col-sm-3">
                                    <div className="versum-tile">
                                        <div className="versum-tile__label">
                                            Sztuk w magazynie
                                        </div>
                                        <div className="versum-tile__value text-success">
                                            {stats.totalQuantity}
                                        </div>
                                    </div>
                                </div>
                                <div className="col-sm-3">
                                    <div className="versum-tile">
                                        <div className="versum-tile__label">
                                            Niski stan
                                        </div>
                                        <div
                                            className={`versum-tile__value ${
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
                            <div className="row mb-20">
                                <div className="col-sm-6">
                                    <div className="versum-widget">
                                        <div className="versum-widget__header">
                                            Wartość wg kategorii
                                        </div>
                                        <div
                                            className="versum-widget__content"
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
                                                            value: number,
                                                        ) =>
                                                            formatCurrency(
                                                                value,
                                                            )
                                                        }
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-sm-6">
                                    <div className="versum-widget">
                                        <div className="versum-widget__header">
                                            Ilość produktów wg kategorii
                                        </div>
                                        <div
                                            className="versum-widget__content"
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
                            <div className="versum-widget mb-20">
                                <div className="versum-widget__header">
                                    Szczegóły wg kategorii
                                </div>
                                <div className="versum-widget__content">
                                    <table className="versum-table">
                                        <thead>
                                            <tr>
                                                <th>Kategoria</th>
                                                <th className="text-right">
                                                    Produkty
                                                </th>
                                                <th className="text-right">
                                                    Ilość sztuk
                                                </th>
                                                <th className="text-right">
                                                    Wartość
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stats.byCategory.map((cat) => (
                                                <tr key={cat.category}>
                                                    <td>{cat.category}</td>
                                                    <td className="text-right">
                                                        {cat.productCount}
                                                    </td>
                                                    <td className="text-right">
                                                        {cat.totalQuantity}
                                                    </td>
                                                    <td className="text-right font-medium">
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
                                <div className="versum-widget">
                                    <div className="versum-widget__header text-danger">
                                        ⚠️ Produkty z niskim stanem
                                    </div>
                                    <div className="versum-widget__content">
                                        <table className="versum-table">
                                            <thead>
                                                <tr>
                                                    <th>Produkt</th>
                                                    <th className="text-right">
                                                        Stan aktualny
                                                    </th>
                                                    <th className="text-right">
                                                        Min. stan
                                                    </th>
                                                    <th className="text-right">
                                                        Cena
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {stats.lowStockProducts.map(
                                                    (p) => (
                                                        <tr key={p.id}>
                                                            <td>{p.name}</td>
                                                            <td className="text-right text-danger font-bold">
                                                                {p.quantity}
                                                            </td>
                                                            <td className="text-right">
                                                                {p.minQuantity}
                                                            </td>
                                                            <td className="text-right">
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
            </VersumShell>
        </RouteGuard>
    );
}
