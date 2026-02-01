'use client';

import { useState } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import {
    useDashboardStats,
    useRevenueChart,
    useEmployeeRanking,
    useServiceRanking,
    useCashRegister,
} from '@/hooks/useStatistics';
import {
    KpiCard,
    RevenueChart,
    EmployeeRanking,
    ServiceRanking,
    DateRangeSelector,
    CashRegister,
} from '@/components/statistics';
import { DateRange, GroupBy } from '@/types';

type Tab = 'dashboard' | 'employees' | 'services' | 'register';

export default function StatisticsPage() {
    const [activeTab, setActiveTab] = useState<Tab>('dashboard');
    const [dateRange, setDateRange] = useState<DateRange>(DateRange.ThisMonth);
    const [customFrom, setCustomFrom] = useState<string>(
        format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    );
    const [customTo, setCustomTo] = useState<string>(
        format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    );
    const [registerDate, setRegisterDate] = useState<string>(
        format(new Date(), 'yyyy-MM-dd'),
    );

    const { data: dashboard, loading: dashboardLoading } = useDashboardStats();
    const { data: revenueData, loading: revenueLoading } = useRevenueChart({
        range: dateRange,
        groupBy: GroupBy.Day,
        from: customFrom,
        to: customTo,
    });
    const { data: employees, loading: employeesLoading } = useEmployeeRanking({
        range: dateRange,
        from: customFrom,
        to: customTo,
    });
    const { data: services, loading: servicesLoading } = useServiceRanking({
        range: dateRange,
        from: customFrom,
        to: customTo,
    });
    const { data: cashRegister, loading: registerLoading } =
        useCashRegister(registerDate);

    const handleDateRangeChange = (
        range: DateRange,
        from?: string,
        to?: string,
    ) => {
        setDateRange(range);
        if (from) setCustomFrom(from);
        if (to) setCustomTo(to);
    };

    const tabs: { id: Tab; label: string }[] = [
        { id: 'dashboard', label: 'Dashboard' },
        { id: 'employees', label: 'Pracownicy' },
        { id: 'services', label: 'Usługi' },
        { id: 'register', label: 'Kasa' },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Statystyki</h1>
                <p className="text-gray-600">
                    Analizuj wyniki salonu i efektywność pracowników
                </p>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex gap-6">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === tab.id
                                    ? 'border-primary-500 text-primary-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
                <div className="space-y-6">
                    {/* KPI Cards */}
                    {dashboardLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                            <span className="ml-3 text-gray-600">
                                Ładowanie statystyk...
                            </span>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <KpiCard
                                    title="Przychód dziś"
                                    value={`${(dashboard?.todayRevenue ?? 0).toLocaleString('pl-PL')} PLN`}
                                    subtitle={`${dashboard?.todayCompletedAppointments ?? 0} wizyt`}
                                    color="success"
                                    icon={
                                        <svg
                                            className="w-6 h-6"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                        </svg>
                                    }
                                />
                                <KpiCard
                                    title="Przychód ten tydzień"
                                    value={`${(dashboard?.weekRevenue ?? 0).toLocaleString('pl-PL')} PLN`}
                                    subtitle={`${dashboard?.weekAppointments ?? 0} wizyt`}
                                    color="primary"
                                    icon={
                                        <svg
                                            className="w-6 h-6"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                            />
                                        </svg>
                                    }
                                />
                                <KpiCard
                                    title="Przychód ten miesiąc"
                                    value={`${(dashboard?.monthRevenue ?? 0).toLocaleString('pl-PL')} PLN`}
                                    subtitle={`${dashboard?.monthAppointments ?? 0} wizyt`}
                                    color="primary"
                                    icon={
                                        <svg
                                            className="w-6 h-6"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                            />
                                        </svg>
                                    }
                                />
                                <KpiCard
                                    title="Oczekujące wizyty"
                                    value={dashboard?.pendingAppointments ?? 0}
                                    subtitle="zaplanowanych"
                                    color="warning"
                                    icon={
                                        <svg
                                            className="w-6 h-6"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                        </svg>
                                    }
                                />
                            </div>

                            {/* Secondary KPIs */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <KpiCard
                                    title="Nowi klienci dziś"
                                    value={dashboard?.todayNewClients ?? 0}
                                    color="default"
                                />
                                <KpiCard
                                    title="Wizyty dziś"
                                    value={dashboard?.todayAppointments ?? 0}
                                    subtitle={`${dashboard?.todayCompletedAppointments ?? 0} zakończonych`}
                                    color="default"
                                />
                                <KpiCard
                                    title="Średnia ocena"
                                    value={(
                                        dashboard?.averageRating ?? 0
                                    ).toFixed(1)}
                                    subtitle="wszystkich opinii"
                                    color="default"
                                    icon={
                                        <svg
                                            className="w-6 h-6 text-yellow-400"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    }
                                />
                            </div>
                        </>
                    )}

                    {/* Revenue Chart */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Przychody
                            </h2>
                            <DateRangeSelector
                                value={dateRange}
                                onChange={handleDateRangeChange}
                                customFrom={customFrom}
                                customTo={customTo}
                            />
                        </div>
                        <RevenueChart
                            data={revenueData ?? []}
                            loading={revenueLoading}
                            showTips
                        />
                    </div>
                </div>
            )}

            {/* Employees Tab */}
            {activeTab === 'employees' && (
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Ranking pracowników
                        </h2>
                        <DateRangeSelector
                            value={dateRange}
                            onChange={handleDateRangeChange}
                            customFrom={customFrom}
                            customTo={customTo}
                        />
                    </div>
                    <div className="bg-white rounded-lg border border-gray-200">
                        <EmployeeRanking
                            data={employees ?? []}
                            loading={employeesLoading}
                        />
                    </div>
                </div>
            )}

            {/* Services Tab */}
            {activeTab === 'services' && (
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Ranking usług
                        </h2>
                        <DateRangeSelector
                            value={dateRange}
                            onChange={handleDateRangeChange}
                            customFrom={customFrom}
                            customTo={customTo}
                        />
                    </div>
                    <div className="bg-white rounded-lg border border-gray-200">
                        <ServiceRanking
                            data={services ?? []}
                            loading={servicesLoading}
                        />
                    </div>
                </div>
            )}

            {/* Cash Register Tab */}
            {activeTab === 'register' && (
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Raport kasowy
                        </h2>
                        <div className="flex items-center gap-2">
                            <label
                                htmlFor="register-date"
                                className="text-sm text-gray-600"
                            >
                                Data:
                            </label>
                            <input
                                id="register-date"
                                type="date"
                                value={registerDate}
                                onChange={(e) =>
                                    setRegisterDate(e.target.value)
                                }
                                aria-label="Wybierz datę raportu"
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <CashRegister
                            data={cashRegister ?? null}
                            loading={registerLoading}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
