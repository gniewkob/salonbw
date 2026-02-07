import RouteGuard from '@/components/RouteGuard';
import VersumShell from '@/components/versum/VersumShell';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

interface MovementStats {
    totalMovements: number;
    byType: Array<{
        type: string;
        count: number;
        quantityChange: number;
    }>;
    recentMovements: Array<{
        id: number;
        productName: string;
        type: string;
        quantity: number;
        quantityBefore: number;
        quantityAfter: number;
        createdAt: string;
        createdByName: string | null;
    }>;
}

const DATE_RANGES = [
    { id: 'this_month', label: 'Ten miesiąc' },
    { id: 'last_month', label: 'Poprzedni miesiąc' },
    { id: 'this_year', label: 'Ten rok' },
];

const TYPE_LABELS: Record<string, string> = {
    delivery: 'Dostawa',
    sale: 'Sprzedaż',
    usage: 'Zużycie',
    adjustment: 'Korekta',
    stocktaking: 'Inwentaryzacja',
    return: 'Zwrot',
    loss: 'Ubytek',
};

const TYPE_COLORS: Record<string, string> = {
    delivery: '#5cb85c',
    sale: '#008bb4',
    usage: '#f0ad4e',
    adjustment: '#6f42c1',
    stocktaking: '#6c757d',
    return: '#20c997',
    loss: '#d9534f',
};

export default function WarehouseChangesPage() {
    const { role, apiFetch } = useAuth();
    const [dateRange, setDateRange] = useState('this_month');
    const [stats, setStats] = useState<MovementStats | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, [dateRange]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const data = await apiFetch<MovementStats>(
                `/statistics/warehouse/movements?range=${dateRange}`,
            );
            setStats(data);
        } catch (error) {
            console.error('Failed to fetch movement stats:', error);
        }
        setIsLoading(false);
    };

    if (!role) return null;

    const chartData =
        stats?.byType.map((t) => ({
            name: TYPE_LABELS[t.type] || t.type,
            count: t.count,
            quantity: Math.abs(t.quantityChange),
            type: t.type,
        })) || [];

    return (
        <RouteGuard roles={['admin']} permission="nav:statistics">
            <VersumShell role={role}>
                <div className="statistics-page">
                    {/* Header */}
                    <div className="flex-between mb-20">
                        <h1 className="text-2xl font-semibold">
                            Raport zmian magazynowych
                        </h1>
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="form-control"
                        >
                            {DATE_RANGES.map((r) => (
                                <option key={r.id} value={r.id}>
                                    {r.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {isLoading ? (
                        <div className="text-center py-40">Ładowanie...</div>
                    ) : stats ? (
                        <>
                            {/* KPI */}
                            <div className="row mb-20">
                                <div className="col-sm-4">
                                    <div className="versum-tile">
                                        <div className="versum-tile__label">
                                            Wszystkie ruchy
                                        </div>
                                        <div className="versum-tile__value">
                                            {stats.totalMovements}
                                        </div>
                                    </div>
                                </div>
                                <div className="col-sm-4">
                                    <div className="versum-tile">
                                        <div className="versum-tile__label">
                                            Typów operacji
                                        </div>
                                        <div className="versum-tile__value text-accent">
                                            {stats.byType.length}
                                        </div>
                                    </div>
                                </div>
                                <div className="col-sm-4">
                                    <div className="versum-tile">
                                        <div className="versum-tile__label">
                                            Najczęstszy typ
                                        </div>
                                        <div className="versum-tile__value text-success">
                                            {stats.byType[0]
                                                ? TYPE_LABELS[
                                                      stats.byType[0].type
                                                  ] || stats.byType[0].type
                                                : '-'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Chart */}
                            <div className="versum-widget mb-20">
                                <div className="versum-widget__header">
                                    Ruchy magazynowe wg typu
                                </div>
                                <div
                                    className="versum-widget__content"
                                    style={{ height: 300 }}
                                >
                                    <ResponsiveContainer>
                                        <BarChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip />
                                            <Bar
                                                dataKey="count"
                                                name="Liczba operacji"
                                                fill="#008bb4"
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Recent Movements Table */}
                            <div className="versum-widget">
                                <div className="versum-widget__header">
                                    Ostatnie ruchy (50 najnowszych)
                                </div>
                                <div className="versum-widget__content">
                                    <table className="versum-table">
                                        <thead>
                                            <tr>
                                                <th>Data</th>
                                                <th>Produkt</th>
                                                <th>Typ</th>
                                                <th className="text-right">
                                                    Zmiana
                                                </th>
                                                <th className="text-right">
                                                    Stan przed
                                                </th>
                                                <th className="text-right">
                                                    Stan po
                                                </th>
                                                <th>Użytkownik</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stats.recentMovements.map((m) => (
                                                <tr key={m.id}>
                                                    <td>
                                                        {new Date(
                                                            m.createdAt,
                                                        ).toLocaleDateString(
                                                            'pl-PL',
                                                        )}
                                                    </td>
                                                    <td>{m.productName}</td>
                                                    <td>
                                                        <span
                                                            className="badge"
                                                            style={{
                                                                backgroundColor:
                                                                    TYPE_COLORS[
                                                                        m.type
                                                                    ] || '#999',
                                                            }}
                                                        >
                                                            {TYPE_LABELS[
                                                                m.type
                                                            ] || m.type}
                                                        </span>
                                                    </td>
                                                    <td
                                                        className={`text-right ${
                                                            m.quantity > 0
                                                                ? 'text-success'
                                                                : 'text-danger'
                                                        }`}
                                                    >
                                                        {m.quantity > 0
                                                            ? `+${m.quantity}`
                                                            : m.quantity}
                                                    </td>
                                                    <td className="text-right">
                                                        {m.quantityBefore}
                                                    </td>
                                                    <td className="text-right">
                                                        {m.quantityAfter}
                                                    </td>
                                                    <td>
                                                        {m.createdByName || '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    ) : null}
                </div>
            </VersumShell>
        </RouteGuard>
    );
}
