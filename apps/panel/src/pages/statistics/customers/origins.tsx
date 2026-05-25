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

interface OriginStats {
    totalClients: number;
    origins: Array<{
        origin: string;
        count: number;
        percentage: number;
    }>;
}

const DATE_RANGES = [
    { id: 'this_month', label: 'Ten miesiąc' },
    { id: 'last_month', label: 'Poprzedni miesiąc' },
    { id: 'this_year', label: 'Ten rok' },
    { id: 'last_year', label: 'Poprzedni rok' },
];

const COLORS = [
    '#008bb4',
    '#5cb85c',
    '#f0ad4e',
    '#d9534f',
    '#6f42c1',
    '#20c997',
    { name: 'Portal', color: '#f3c200' },
];

export default function ClientOriginsPage() {
    const { role, apiFetch } = useAuth();
    const [dateRange, setDateRange] = useState('this_month');
    const [stats, setStats] = useState<OriginStats | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setIsLoading(true);
        setError(false);
        apiFetch<OriginStats>(
            `/statistics/customers/origins?range=${encodeURIComponent(dateRange)}`,
        )
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
    }, [apiFetch, dateRange]);

    const pieData =
        stats?.origins.map((o, index) => ({
            name: o.origin,
            value: o.count,
            color:
                typeof COLORS[index % COLORS.length] === 'string'
                    ? (COLORS[index % COLORS.length] as string)
                    : (COLORS[index % COLORS.length] as { color: string })
                          .color,
        })) || [];

    return (
        <RouteGuard roles={['admin']} permission="nav:statistics">
            <SalonShell role={role}>
                <div className="statistics-page">
                    {/* Header */}
                    <div className="flex-between mb-5">
                        <h1 className="fs-3 fw-semibold">
                            Pochodzenie klientów
                        </h1>
                        <div className="d-flex gap-5">
                            <select
                                title="Okres statystyk"
                                aria-label="Wybierz okres"
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
                    </div>

                    {isLoading ? (
                        <div className="text-center py-40">Ładowanie...</div>
                    ) : error ? (
                        <div className="alert alert-warning">
                            Statystyki pochodzenia chwilowo niedostępne.
                        </div>
                    ) : stats ? (
                        <>
                            {/* KPI */}
                            <div className="row mb-5">
                                <div className="col-sm-4">
                                    <div className="salonbw-tile">
                                        <div className="salonbw-tile__label">
                                            Nowi klienci
                                        </div>
                                        <div className="salonbw-tile__value">
                                            {stats.totalClients}
                                        </div>
                                    </div>
                                </div>
                                <div className="col-sm-4">
                                    <div className="salonbw-tile">
                                        <div className="salonbw-tile__label">
                                            Źródeł
                                        </div>
                                        <div className="salonbw-tile__value text-accent">
                                            {stats.origins.length}
                                        </div>
                                    </div>
                                </div>
                                <div className="col-sm-4">
                                    <div className="salonbw-tile">
                                        <div className="salonbw-tile__label">
                                            Najpopularniejsze
                                        </div>
                                        <div className="salonbw-tile__value text-success">
                                            {stats.origins[0]?.origin || '-'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Charts */}
                            <div className="row">
                                <div className="col-sm-6">
                                    <div className="salonbw-widget">
                                        <div className="salonbw-widget__header">
                                            Podział według źródła
                                        </div>
                                        <div
                                            className="salonbw-widget__content"
                                            style={{ height: 350 }}
                                        >
                                            <ResponsiveContainer>
                                                <PieChart>
                                                    <Pie
                                                        data={pieData}
                                                        cx="50%"
                                                        cy="50%"
                                                        outerRadius={120}
                                                        dataKey="value"
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
                                                            return `${amount} klientów`;
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
                                            Szczegóły
                                        </div>
                                        <div
                                            className="salonbw-widget__content"
                                            style={{ height: 350 }}
                                        >
                                            <ResponsiveContainer>
                                                <BarChart
                                                    data={stats.origins}
                                                    layout="vertical"
                                                    margin={{
                                                        top: 20,
                                                        right: 30,
                                                        left: 80,
                                                        bottom: 5,
                                                    }}
                                                >
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis type="number" />
                                                    <YAxis
                                                        dataKey="origin"
                                                        type="category"
                                                        width={70}
                                                    />
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
                                                            return `${amount} klientów`;
                                                        }}
                                                    />
                                                    <Bar
                                                        dataKey="count"
                                                        name="Liczba"
                                                        fill="#008bb4"
                                                    />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="salonbw-widget mt-20">
                                <div className="salonbw-widget__header">
                                    Szczegółowy podział
                                </div>
                                <div className="salonbw-widget__content">
                                    <table className="salonbw-table">
                                        <thead>
                                            <tr>
                                                <th>Źródło</th>
                                                <th className="text-end">
                                                    Liczba klientów
                                                </th>
                                                <th className="text-end">
                                                    Udział
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stats.origins.map((origin) => (
                                                <tr key={origin.origin}>
                                                    <td>{origin.origin}</td>
                                                    <td className="text-end">
                                                        {origin.count}
                                                    </td>
                                                    <td className="text-end">
                                                        {origin.percentage}%
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
            </SalonShell>
        </RouteGuard>
    );
}
