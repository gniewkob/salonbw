import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import { useAuth } from '@/contexts/AuthContext';
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

// ─── Shared constants ─────────────────────────────────────────────────────────

const CHANGES_DATE_RANGES = [
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

const VALUE_COLORS = [
    '#008bb4', '#5cb85c', '#f0ad4e', '#d9534f', '#6f42c1', '#20c997', '#fd7e14', '#6c757d',
];

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('pl-PL', {
        style: 'currency',
        currency: 'PLN',
        maximumFractionDigits: 0,
    }).format(amount);

// ─── Tab: Zmiany magazynowe ───────────────────────────────────────────────────

function ChangesTab() {
    const { apiFetch } = useAuth();
    const [dateRange, setDateRange] = useState('this_month');
    const [stats, setStats] = useState<MovementStats | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setIsLoading(true);
        setError(false);
        apiFetch<MovementStats>(
            `/statistics/warehouse/movements?range=${encodeURIComponent(dateRange)}`,
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

    const chartData =
        stats?.byType.map((t) => ({
            name: TYPE_LABELS[t.type] || t.type,
            count: t.count,
            quantity: Math.abs(t.quantityChange),
            type: t.type,
        })) || [];

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fs-4 fw-semibold mb-0">Raport zmian magazynowych</h2>
                <select
                    title="Zakres dat"
                    aria-label="Wybierz zakres dat"
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="form-control"
                    style={{ width: 'auto' }}
                >
                    {CHANGES_DATE_RANGES.map((r) => (
                        <option key={r.id} value={r.id}>{r.label}</option>
                    ))}
                </select>
            </div>

            {isLoading ? (
                <div className="text-center py-5">Ładowanie...</div>
            ) : error ? (
                <div className="alert alert-warning">
                    Statystyki magazynowe chwilowo niedostępne.
                </div>
            ) : stats ? (
                <>
                    <div className="row mb-5">
                        <div className="col-sm-4">
                            <div className="salonbw-tile">
                                <div className="salonbw-tile__label">Wszystkie ruchy</div>
                                <div className="salonbw-tile__value">{stats.totalMovements}</div>
                            </div>
                        </div>
                        <div className="col-sm-4">
                            <div className="salonbw-tile">
                                <div className="salonbw-tile__label">Typów operacji</div>
                                <div className="salonbw-tile__value text-accent">
                                    {stats.byType.length}
                                </div>
                            </div>
                        </div>
                        <div className="col-sm-4">
                            <div className="salonbw-tile">
                                <div className="salonbw-tile__label">Najczęstszy typ</div>
                                <div className="salonbw-tile__value text-success">
                                    {stats.byType[0]
                                        ? TYPE_LABELS[stats.byType[0].type] || stats.byType[0].type
                                        : '-'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="salonbw-widget mb-5">
                        <div className="salonbw-widget__header">Ruchy magazynowe wg typu</div>
                        <div className="salonbw-widget__content" style={{ height: 300 }}>
                            <ResponsiveContainer>
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="count" name="Liczba operacji" fill="#008bb4" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="salonbw-widget">
                        <div className="salonbw-widget__header">Ostatnie ruchy (50 najnowszych)</div>
                        <div className="salonbw-widget__content">
                            <table className="salonbw-table">
                                <thead>
                                    <tr>
                                        <th>Data</th>
                                        <th>Produkt</th>
                                        <th>Typ</th>
                                        <th className="text-end">Zmiana</th>
                                        <th className="text-end">Stan przed</th>
                                        <th className="text-end">Stan po</th>
                                        <th>Użytkownik</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.recentMovements.map((m) => (
                                        <tr key={m.id}>
                                            <td>
                                                {new Date(m.createdAt).toLocaleDateString('pl-PL')}
                                            </td>
                                            <td>{m.productName}</td>
                                            <td>
                                                <span
                                                    className="badge"
                                                    style={{
                                                        backgroundColor: TYPE_COLORS[m.type] || '#999',
                                                    }}
                                                >
                                                    {TYPE_LABELS[m.type] || m.type}
                                                </span>
                                            </td>
                                            <td
                                                className={`text-end ${m.quantity > 0 ? 'text-success' : 'text-danger'}`}
                                            >
                                                {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                                            </td>
                                            <td className="text-end">{m.quantityBefore}</td>
                                            <td className="text-end">{m.quantityAfter}</td>
                                            <td>{m.createdByName || '-'}</td>
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

// ─── Tab: Wartość produktów ───────────────────────────────────────────────────

function ValueTab() {
    const { apiFetch } = useAuth();
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
            color: VALUE_COLORS[index % VALUE_COLORS.length],
        })) || [];

    const tooltipFormatter = (value: unknown) => {
        const first = Array.isArray(value) ? value[0] : value;
        const amount = typeof first === 'number' ? first : Number(first ?? 0) || 0;
        return formatCurrency(amount);
    };

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fs-4 fw-semibold mb-0">Raport wartości produktów</h2>
                <button
                    onClick={() => setRefreshToken((v) => v + 1)}
                    className="btn btn-outline-secondary"
                    disabled={isLoading}
                >
                    {isLoading ? 'Ładowanie...' : 'Odśwież'}
                </button>
            </div>

            {isLoading ? (
                <div className="text-center py-5">Ładowanie...</div>
            ) : error ? (
                <div className="alert alert-warning">
                    Raport wartości chwilowo niedostępny.
                </div>
            ) : stats ? (
                <>
                    <div className="row mb-5">
                        <div className="col-sm-3">
                            <div className="salonbw-tile">
                                <div className="salonbw-tile__label">Produkty</div>
                                <div className="salonbw-tile__value">{stats.totalProducts}</div>
                            </div>
                        </div>
                        <div className="col-sm-3">
                            <div className="salonbw-tile">
                                <div className="salonbw-tile__label">Wartość magazynu</div>
                                <div className="salonbw-tile__value text-accent">
                                    {formatCurrency(stats.totalValue)}
                                </div>
                            </div>
                        </div>
                        <div className="col-sm-3">
                            <div className="salonbw-tile">
                                <div className="salonbw-tile__label">Sztuk w magazynie</div>
                                <div className="salonbw-tile__value text-success">
                                    {stats.totalQuantity}
                                </div>
                            </div>
                        </div>
                        <div className="col-sm-3">
                            <div className="salonbw-tile">
                                <div className="salonbw-tile__label">Niski stan</div>
                                <div
                                    className={`salonbw-tile__value ${stats.lowStockProducts.length > 0 ? 'text-danger' : ''}`}
                                >
                                    {stats.lowStockProducts.length}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row mb-5">
                        <div className="col-sm-6">
                            <div className="salonbw-widget">
                                <div className="salonbw-widget__header">Wartość wg kategorii</div>
                                <div className="salonbw-widget__content" style={{ height: 300 }}>
                                    <ResponsiveContainer>
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={100}
                                                dataKey="value"
                                                nameKey="name"
                                                label={({ name }) => name}
                                            >
                                                {pieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={tooltipFormatter} />
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
                                <div className="salonbw-widget__content" style={{ height: 300 }}>
                                    <ResponsiveContainer>
                                        <BarChart
                                            data={stats.byCategory}
                                            layout="vertical"
                                            margin={{ left: 100 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis type="number" />
                                            <YAxis dataKey="category" type="category" width={90} />
                                            <Tooltip />
                                            <Bar dataKey="productCount" name="Produkty" fill="#008bb4" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="salonbw-widget mb-5">
                        <div className="salonbw-widget__header">Szczegóły wg kategorii</div>
                        <div className="salonbw-widget__content">
                            <table className="salonbw-table">
                                <thead>
                                    <tr>
                                        <th>Kategoria</th>
                                        <th className="text-end">Produkty</th>
                                        <th className="text-end">Ilość sztuk</th>
                                        <th className="text-end">Wartość</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.byCategory.map((cat) => (
                                        <tr key={cat.category}>
                                            <td>{cat.category}</td>
                                            <td className="text-end">{cat.productCount}</td>
                                            <td className="text-end">{cat.totalQuantity}</td>
                                            <td className="text-end fw-medium">
                                                {formatCurrency(cat.totalValue)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {stats.lowStockProducts.length > 0 && (
                        <div className="salonbw-widget">
                            <div className="salonbw-widget__header text-danger">
                                Produkty z niskim stanem
                            </div>
                            <div className="salonbw-widget__content">
                                <table className="salonbw-table">
                                    <thead>
                                        <tr>
                                            <th>Produkt</th>
                                            <th className="text-end">Stan aktualny</th>
                                            <th className="text-end">Min. stan</th>
                                            <th className="text-end">Cena</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats.lowStockProducts.map((p) => (
                                            <tr key={p.id}>
                                                <td>{p.name}</td>
                                                <td className="text-end text-danger fw-bold">
                                                    {p.quantity}
                                                </td>
                                                <td className="text-end">{p.minQuantity}</td>
                                                <td className="text-end">
                                                    {formatCurrency(p.price)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            ) : null}
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WarehouseStatisticsPage() {
    const router = useRouter();
    const { role } = useAuth();
    const activeTab = (router.query.tab as string) || 'changes';

    const setTab = (tab: string) =>
        router.push(`/statistics/warehouse?tab=${tab}`, undefined, { shallow: true });

    return (
        <RouteGuard roles={['admin']} permission="nav:statistics">
            <SalonShell role={role}>
                <div className="salonbw-page">
                    <SalonBreadcrumbs
                        iconClass="sprite-breadcrumbs_statistics"
                        items={[
                            { label: 'Statystyki', href: '/statistics' },
                            { label: 'Magazyn' },
                        ]}
                    />

                    <ul className="nav nav-tabs mb-4">
                        <li className="nav-item">
                            <button
                                type="button"
                                className={`nav-link${activeTab === 'changes' ? ' active' : ''}`}
                                onClick={() => setTab('changes')}
                            >
                                Zmiany magazynowe
                            </button>
                        </li>
                        <li className="nav-item">
                            <button
                                type="button"
                                className={`nav-link${activeTab === 'value' ? ' active' : ''}`}
                                onClick={() => setTab('value')}
                            >
                                Wartość produktów
                            </button>
                        </li>
                    </ul>

                    {activeTab === 'changes' && <ChangesTab />}
                    {activeTab === 'value' && <ValueTab />}
                </div>
            </SalonShell>
        </RouteGuard>
    );
}
