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
    '#fd7e14',
    '#6c757d',
];

export default function ClientOriginsPage() {
    const { role, apiFetch } = useAuth();
    const [dateRange, setDateRange] = useState('this_month');
    const [stats, setStats] = useState<OriginStats | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, [dateRange]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const data = await apiFetch<OriginStats>(
                `/statistics/clients/origins?range=${dateRange}`,
            );
            setStats(data);
        } catch (error) {
            console.error('Failed to fetch origin stats:', error);
        }
        setIsLoading(false);
    };

    if (!role) return null;

    const pieData =
        stats?.origins.map((o, index) => ({
            name: o.origin,
            value: o.count,
            color: COLORS[index % COLORS.length],
        })) || [];

    return (
        <RouteGuard roles={['admin']} permission="nav:statistics">
            <VersumShell role={role}>
                <div className="statistics-page">
                    {/* Header */}
                    <div className="flex-between mb-20">
                        <h1 className="text-2xl font-semibold">
                            Pochodzenie klientów
                        </h1>
                        <div className="flex gap-8">
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
                                            Nowi klienci
                                        </div>
                                        <div className="versum-tile__value">
                                            {stats.totalClients}
                                        </div>
                                    </div>
                                </div>
                                <div className="col-sm-4">
                                    <div className="versum-tile">
                                        <div className="versum-tile__label">
                                            Źródeł
                                        </div>
                                        <div className="versum-tile__value text-accent">
                                            {stats.origins.length}
                                        </div>
                                    </div>
                                </div>
                                <div className="col-sm-4">
                                    <div className="versum-tile">
                                        <div className="versum-tile__label">
                                            Najpopularniejsze
                                        </div>
                                        <div className="versum-tile__value text-success">
                                            {stats.origins[0]?.origin || '-'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Charts */}
                            <div className="row">
                                <div className="col-sm-6">
                                    <div className="versum-widget">
                                        <div className="versum-widget__header">
                                            Podział według źródła
                                        </div>
                                        <div
                                            className="versum-widget__content"
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
                                                            value: number,
                                                        ) => [
                                                            `${value} klientów`,
                                                        ]}
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-sm-6">
                                    <div className="versum-widget">
                                        <div className="versum-widget__header">
                                            Szczegóły
                                        </div>
                                        <div
                                            className="versum-widget__content"
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
                                                            value: number,
                                                        ) => [
                                                            `${value} klientów`,
                                                        ]}
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
                            <div className="versum-widget mt-20">
                                <div className="versum-widget__header">
                                    Szczegółowy podział
                                </div>
                                <div className="versum-widget__content">
                                    <table className="versum-table">
                                        <thead>
                                            <tr>
                                                <th>Źródło</th>
                                                <th className="text-right">
                                                    Liczba klientów
                                                </th>
                                                <th className="text-right">
                                                    Udział
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stats.origins.map((origin) => (
                                                <tr key={origin.origin}>
                                                    <td>{origin.origin}</td>
                                                    <td className="text-right">
                                                        {origin.count}
                                                    </td>
                                                    <td className="text-right">
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
            </VersumShell>
        </RouteGuard>
    );
}
