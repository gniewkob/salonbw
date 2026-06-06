import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import { useAuth } from '@/contexts/AuthContext';
import { useClientStats } from '@/hooks/useStatistics';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReturningStats {
    totalClients: number;
    returningClients: number;
    returningPercentage: number;
    newClients: number;
    newPercentage: number;
    byMonth: Array<{
        month: string;
        newClients: number;
        returningClients: number;
    }>;
}

interface OriginStats {
    totalClients: number;
    origins: Array<{
        origin: string;
        count: number;
        percentage: number;
    }>;
}

// ─── Shared constants ─────────────────────────────────────────────────────────

const DATE_RANGES = [
    { id: 'this_month', label: 'Ten miesiąc' },
    { id: 'last_month', label: 'Poprzedni miesiąc' },
    { id: 'this_year', label: 'Ten rok' },
    { id: 'last_year', label: 'Poprzedni rok' },
];

const RETURNING_COLORS = { new: '#008bb4', returning: '#11ce44' };

const ORIGINS_COLORS = [
    '#008bb4',
    '#5cb85c',
    '#f0ad4e',
    '#d9534f',
    '#6f42c1',
    '#20c997',
    '#f3c200',
];

// ─── Tab: Przegląd ────────────────────────────────────────────────────────────

function OverviewTab() {
    const [range, setRange] = useState<'month' | 'quarter' | 'year'>('month');
    const { data, isLoading } = useClientStats({
        range: 'this_month',
    });

    const formatMoney = (value: number) =>
        value.toFixed(2).replace('.', ',') + ' zł';

    return (
        <div>
            <div className="salonbw-page__toolbar mb-4">
                <div className="d-flex align-items-center gap-2">
                    <select
                        className="form-control salonbw-select"
                        aria-label="Zakres czasu"
                        value={range}
                        onChange={(e) => {
                            const next = e.target.value;
                            if (
                                next === 'month' ||
                                next === 'quarter' ||
                                next === 'year'
                            ) {
                                setRange(next);
                            }
                        }}
                    >
                        <option value="month">ostatni miesiąc</option>
                        <option value="quarter">ostatnie 3 miesiące</option>
                        <option value="year">ostatni rok</option>
                    </select>
                </div>
                <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => window.print()}
                >
                    🖨️
                </button>
            </div>

            {isLoading ? (
                <div className="text-muted p-3">Ładowanie...</div>
            ) : (
                <div>
                    {data && (
                        <div className="row g-4 mb-5">
                            <div className="col-3">
                                <div className="border rounded p-4 text-center bg-primary bg-opacity-10">
                                    <div className="small text-muted mb-2">
                                        Nowi klienci
                                    </div>
                                    <div className="fs-3 fw-bold text-primary">
                                        {data.newClients}
                                    </div>
                                </div>
                            </div>
                            <div className="col-3">
                                <div className="border rounded p-4 text-center bg-success bg-opacity-10">
                                    <div className="small text-muted mb-2">
                                        Powracający
                                    </div>
                                    <div className="fs-3 fw-bold text-success">
                                        {data.returningClients}
                                    </div>
                                </div>
                            </div>
                            <div className="col-3">
                                <div className="border rounded p-4 text-center">
                                    <div className="small text-muted mb-2">
                                        Łącznie wizyt
                                    </div>
                                    <div className="fs-3 fw-bold">
                                        {data.totalVisits}
                                    </div>
                                </div>
                            </div>
                            <div className="col-3">
                                <div className="border rounded p-4 text-center">
                                    <div className="small text-muted mb-2">
                                        Średnio wizyt/klient
                                    </div>
                                    <div className="fs-3 fw-bold">
                                        {data.averageVisitsPerClient.toFixed(1)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {data && data.topClients && data.topClients.length > 0 && (
                        <div className="mb-5">
                            <h3 className="fs-5 fw-semibold mb-3">
                                Najlepsi klienci
                            </h3>
                            <div className="salonbw-table-wrap">
                                <table className="salonbw-table">
                                    <thead>
                                        <tr>
                                            <th>Klient</th>
                                            <th className="text-end">
                                                Liczba wizyt
                                            </th>
                                            <th className="text-end">
                                                Łącznie wydane
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.topClients.map((client) => (
                                            <tr key={client.clientId}>
                                                <td>
                                                    <Link
                                                        href={`/customers/${client.clientId}`}
                                                        className="btn btn-link"
                                                    >
                                                        {client.clientName}
                                                    </Link>
                                                </td>
                                                <td className="text-end">
                                                    {client.visits}
                                                </td>
                                                <td className="text-end fw-semibold">
                                                    {formatMoney(
                                                        client.totalSpent,
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Tab: Powracalność ────────────────────────────────────────────────────────

function ReturningTab() {
    const { apiFetch } = useAuth();
    const [dateRange, setDateRange] = useState('this_month');
    const [stats, setStats] = useState<ReturningStats | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setIsLoading(true);
        setError(false);
        apiFetch<ReturningStats>(
            `/statistics/customers/returning?range=${encodeURIComponent(dateRange)}`,
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

    const pieData = stats
        ? [
              {
                  name: 'Nowi',
                  value: stats.newClients,
                  color: RETURNING_COLORS.new,
              },
              {
                  name: 'Powracający',
                  value: stats.returningClients,
                  color: RETURNING_COLORS.returning,
              },
          ]
        : [];

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fs-4 fw-semibold mb-0">Powracalność klientów</h2>
                <select
                    title="Okres statystyk"
                    aria-label="Wybierz okres"
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="form-control"
                    style={{ width: 'auto' }}
                >
                    {DATE_RANGES.map((r) => (
                        <option key={r.id} value={r.id}>
                            {r.label}
                        </option>
                    ))}
                </select>
            </div>

            {isLoading ? (
                <div className="text-center py-5">Ładowanie...</div>
            ) : error ? (
                <div className="alert alert-warning">
                    Statystyki powracalności chwilowo niedostępne.
                </div>
            ) : stats ? (
                <>
                    <div className="row mb-5">
                        <div className="col-sm-3">
                            <div className="salonbw-tile">
                                <div className="salonbw-tile__label">
                                    Wszyscy klienci
                                </div>
                                <div className="salonbw-tile__value">
                                    {stats.totalClients}
                                </div>
                            </div>
                        </div>
                        <div className="col-sm-3">
                            <div className="salonbw-tile">
                                <div className="salonbw-tile__label">
                                    Nowi klienci
                                </div>
                                <div className="salonbw-tile__value text-accent">
                                    {stats.newClients}
                                    <span className="small ms-2">
                                        ({stats.newPercentage}%)
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="col-sm-3">
                            <div className="salonbw-tile">
                                <div className="salonbw-tile__label">
                                    Powracający
                                </div>
                                <div
                                    className="salonbw-tile__value"
                                    style={{ color: '#11ce44' }}
                                >
                                    {stats.returningClients}
                                    <span className="small ms-2">
                                        ({stats.returningPercentage}%)
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="col-sm-3">
                            <div className="salonbw-tile">
                                <div className="salonbw-tile__label">
                                    Współczynnik retencji
                                </div>
                                <div className="salonbw-tile__value text-success">
                                    {stats.returningPercentage}%
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-sm-8">
                            <div className="salonbw-widget">
                                <div className="salonbw-widget__header">
                                    Nowi vs powracający (miesięcznie)
                                </div>
                                <div
                                    className="salonbw-widget__content"
                                    style={{ height: 300 }}
                                >
                                    <ResponsiveContainer>
                                        <BarChart
                                            data={stats.byMonth}
                                            margin={{
                                                top: 20,
                                                right: 30,
                                                left: 20,
                                                bottom: 5,
                                            }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis
                                                dataKey="month"
                                                tickFormatter={(value) => {
                                                    const [year, month] =
                                                        value.split('-');
                                                    return `${month}.${year}`;
                                                }}
                                            />
                                            <YAxis />
                                            <Tooltip />
                                            <Bar
                                                dataKey="newClients"
                                                name="Nowi"
                                                fill={RETURNING_COLORS.new}
                                            />
                                            <Bar
                                                dataKey="returningClients"
                                                name="Powracający"
                                                fill={
                                                    RETURNING_COLORS.returning
                                                }
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                        <div className="col-sm-4">
                            <div className="salonbw-widget">
                                <div className="salonbw-widget__header">
                                    Podział klientów
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
                                                innerRadius={60}
                                                outerRadius={100}
                                                dataKey="value"
                                                label={({ name, percent }) =>
                                                    `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`
                                                }
                                            >
                                                {pieData.map((entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={entry.color}
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            ) : null}
        </div>
    );
}

// ─── Tab: Pochodzenie ─────────────────────────────────────────────────────────

function OriginsTab() {
    const { apiFetch } = useAuth();
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
            color: ORIGINS_COLORS[index % ORIGINS_COLORS.length],
        })) || [];

    const tooltipFormatter = (value: unknown) => {
        const first = Array.isArray(value) ? value[0] : value;
        const amount =
            typeof first === 'number' ? first : Number(first ?? 0) || 0;
        return `${amount} klientów`;
    };

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fs-4 fw-semibold mb-0">Pochodzenie klientów</h2>
                <select
                    title="Okres statystyk"
                    aria-label="Wybierz okres"
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="form-control"
                    style={{ width: 'auto' }}
                >
                    {DATE_RANGES.map((r) => (
                        <option key={r.id} value={r.id}>
                            {r.label}
                        </option>
                    ))}
                </select>
            </div>

            {isLoading ? (
                <div className="text-center py-5">Ładowanie...</div>
            ) : error ? (
                <div className="alert alert-warning">
                    Statystyki pochodzenia chwilowo niedostępne.
                </div>
            ) : stats ? (
                <>
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

                    <div className="row mb-5">
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
                                                label={({ name }) => name}
                                            >
                                                {pieData.map((entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={entry.color}
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={tooltipFormatter}
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
                                                formatter={tooltipFormatter}
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

                    <div className="salonbw-widget">
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
                                        <th className="text-end">Udział</th>
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
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClientsStatisticsPage() {
    const router = useRouter();
    const { role } = useAuth();
    const activeTab = (router.query.tab as string) || 'overview';

    const setTab = (tab: string) =>
        router.push(`/statistics/customers?tab=${tab}`, undefined, {
            shallow: true,
        });

    return (
        <RouteGuard roles={['admin']} permission="nav:statistics">
            <SalonShell role={role}>
                <div
                    className="salonbw-page"
                    data-testid="clients-statistics-page"
                >
                    <SalonBreadcrumbs
                        iconClass="sprite-breadcrumbs_statistics"
                        items={[
                            { label: 'Statystyki', href: '/statistics' },
                            { label: 'Klienci' },
                        ]}
                    />

                    <ul className="nav nav-tabs mb-4">
                        <li className="nav-item">
                            <button
                                type="button"
                                className={`nav-link${activeTab === 'overview' ? ' active' : ''}`}
                                onClick={() => void setTab('overview')}
                            >
                                Przegląd
                            </button>
                        </li>
                        <li className="nav-item">
                            <button
                                type="button"
                                className={`nav-link${activeTab === 'returning' ? ' active' : ''}`}
                                onClick={() => void setTab('returning')}
                            >
                                Powracalność
                            </button>
                        </li>
                        <li className="nav-item">
                            <button
                                type="button"
                                className={`nav-link${activeTab === 'origins' ? ' active' : ''}`}
                                onClick={() => void setTab('origins')}
                            >
                                Pochodzenie
                            </button>
                        </li>
                    </ul>

                    {activeTab === 'overview' && <OverviewTab />}
                    {activeTab === 'returning' && <ReturningTab />}
                    {activeTab === 'origins' && <OriginsTab />}
                </div>
            </SalonShell>
        </RouteGuard>
    );
}
