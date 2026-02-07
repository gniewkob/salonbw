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
    PieChart,
    Pie,
    Cell,
} from 'recharts';

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

const DATE_RANGES = [
    { id: 'this_month', label: 'Ten miesiąc' },
    { id: 'last_month', label: 'Poprzedni miesiąc' },
    { id: 'this_year', label: 'Ten rok' },
    { id: 'last_year', label: 'Poprzedni rok' },
];

const COLORS = {
    new: '#008bb4',
    returning: '#5cb85c',
};

export default function ClientReturningPage() {
    const { role, apiFetch } = useAuth();
    const [dateRange, setDateRange] = useState('this_month');
    const [stats, setStats] = useState<ReturningStats | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, [dateRange]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const data = await apiFetch<ReturningStats>(
                `/statistics/clients/returning?range=${dateRange}`,
            );
            setStats(data);
        } catch (error) {
            console.error('Failed to fetch returning stats:', error);
        }
        setIsLoading(false);
    };

    if (!role) return null;

    const pieData = stats
        ? [
              { name: 'Nowi', value: stats.newClients, color: COLORS.new },
              {
                  name: 'Powracający',
                  value: stats.returningClients,
                  color: COLORS.returning,
              },
          ]
        : [];

    return (
        <RouteGuard roles={['admin']} permission="nav:statistics">
            <VersumShell role={role}>
                <div className="statistics-page">
                    {/* Header */}
                    <div className="flex-between mb-20">
                        <h1 className="text-2xl font-semibold">
                            Powracalność klientów
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
                            {/* KPI Cards */}
                            <div className="row mb-20">
                                <div className="col-sm-3">
                                    <div className="versum-tile">
                                        <div className="versum-tile__label">
                                            Wszyscy klienci
                                        </div>
                                        <div className="versum-tile__value">
                                            {stats.totalClients}
                                        </div>
                                    </div>
                                </div>
                                <div className="col-sm-3">
                                    <div className="versum-tile">
                                        <div className="versum-tile__label">
                                            Nowi klienci
                                        </div>
                                        <div className="versum-tile__value text-accent">
                                            {stats.newClients}
                                            <span className="text-sm ml-8">
                                                ({stats.newPercentage}%)
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-sm-3">
                                    <div className="versum-tile">
                                        <div className="versum-tile__label">
                                            Powracający
                                        </div>
                                        <div
                                            className="versum-tile__value"
                                            style={{ color: COLORS.returning }}
                                        >
                                            {stats.returningClients}
                                            <span className="text-sm ml-8">
                                                ({stats.returningPercentage}%)
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-sm-3">
                                    <div className="versum-tile">
                                        <div className="versum-tile__label">
                                            Współczynnik retencji
                                        </div>
                                        <div className="versum-tile__value text-success">
                                            {stats.returningPercentage}%
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Charts */}
                            <div className="row">
                                <div className="col-sm-8">
                                    <div className="versum-widget">
                                        <div className="versum-widget__header">
                                            Nowi vs powracający (miesięcznie)
                                        </div>
                                        <div
                                            className="versum-widget__content"
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
                                                        tickFormatter={(
                                                            value,
                                                        ) => {
                                                            const [
                                                                year,
                                                                month,
                                                            ] =
                                                                value.split(
                                                                    '-',
                                                                );
                                                            return `${month}.${year}`;
                                                        }}
                                                    />
                                                    <YAxis />
                                                    <Tooltip />
                                                    <Bar
                                                        dataKey="newClients"
                                                        name="Nowi"
                                                        fill={COLORS.new}
                                                    />
                                                    <Bar
                                                        dataKey="returningClients"
                                                        name="Powracający"
                                                        fill={COLORS.returning}
                                                    />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-sm-4">
                                    <div className="versum-widget">
                                        <div className="versum-widget__header">
                                            Podział klientów
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
                                                        innerRadius={60}
                                                        outerRadius={100}
                                                        dataKey="value"
                                                        label={({
                                                            name,
                                                            percent,
                                                        }) =>
                                                            `${name}: ${(
                                                                percent * 100
                                                            ).toFixed(0)}%`
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
            </VersumShell>
        </RouteGuard>
    );
}
