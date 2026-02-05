'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/DashboardLayout';
import ServicesNav from '@/components/versum/navs/ServicesNav';
import { RevenueChart } from '@/components/statistics';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployees } from '@/hooks/useEmployees';
import {
    useServiceSummary,
    useServiceStats,
    useServiceHistory,
    useServiceEmployeesDetails,
    useServiceComments,
    useServiceCommissions,
    useServiceVariants,
    useServiceCategories,
    useUpdateService,
} from '@/hooks/useServicesAdmin';
import ServiceFormModal, {
    ServiceFormData,
} from '@/components/services/ServiceFormModal';
import ServiceVariantsModal from '@/components/services/ServiceVariantsModal';

type TabKey =
    | 'summary'
    | 'stats'
    | 'history'
    | 'employees'
    | 'comments'
    | 'commissions';

const tabs: Array<{ key: TabKey; label: string; icon: JSX.Element }> = [
    {
        key: 'summary',
        label: 'podsumowanie',
        icon: (
            <svg
                className="w-4 h-4 text-gray-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M4 6h16M4 12h16M4 18h10"
                />
            </svg>
        ),
    },
    {
        key: 'stats',
        label: 'statystyki',
        icon: (
            <svg
                className="w-4 h-4 text-gray-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M4 20h16M7 16V8m5 8V4m5 12v-6"
                />
            </svg>
        ),
    },
    {
        key: 'history',
        label: 'historia usługi',
        icon: (
            <svg
                className="w-4 h-4 text-gray-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M12 8v5l3 2m6-3a9 9 0 11-6-8"
                />
            </svg>
        ),
    },
    {
        key: 'employees',
        label: 'przypisani pracownicy',
        icon: (
            <svg
                className="w-4 h-4 text-gray-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M16 11c1.66 0 3-1.34 3-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zM8 11c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zM16 13c-2.67 0-8 1.34-8 4v2h12v-2c0-2.66-2.67-4-4-4z"
                />
            </svg>
        ),
    },
    {
        key: 'comments',
        label: 'komentarze',
        icon: (
            <svg
                className="w-4 h-4 text-gray-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M7 8h10M7 12h6m-8 8l4-4h10a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12l4-4z"
                />
            </svg>
        ),
    },
    {
        key: 'commissions',
        label: 'prowizje',
        icon: (
            <svg
                className="w-4 h-4 text-gray-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M8 7h.01M16 17h.01M7 17l10-10"
                />
            </svg>
        ),
    },
];

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pl-PL', {
        style: 'currency',
        currency: 'PLN',
    }).format(value);

const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} minut`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours} godz. ${mins} minut` : `${hours} godz.`;
};

const StatCard = ({ title, value }: { title: string; value: string }) => (
    <div className="flex-1">
        <div className="text-xs text-gray-500 uppercase tracking-wide">
            {title}
        </div>
        <div className="text-lg font-semibold text-gray-900 mt-1">{value}</div>
    </div>
);

export default function ServiceDetailsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const serviceId = Number(router.query.id);
    const [activeTab, setActiveTab] = useState<TabKey>('summary');
    const [historyPage, setHistoryPage] = useState(1);

    // Modals
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isVariantsModalOpen, setIsVariantsModalOpen] = useState(false);

    const summary = useServiceSummary(serviceId);
    const variants = useServiceVariants(serviceId);
    const stats = useServiceStats(serviceId, { groupBy: 'month' });
    const history = useServiceHistory(serviceId, {
        page: historyPage,
        limit: 20,
    });
    const employees = useServiceEmployeesDetails(serviceId);
    const { data: categories = [] } = useServiceCategories();

    const updateService = useUpdateService();

    const summaryData = summary.data;
    const variantsData = variants.data ?? summaryData?.variants ?? [];

    const chartData = useMemo(() => {
        if (!stats.data) return [];
        return stats.data.data.map((point) => ({
            date: point.date,
            label: point.label,
            revenue: point.revenue,
            appointments: point.appointments,
            tips: 0,
            products: 0,
        }));
    }, [stats.data]);

    const groupedAssignments = useMemo(() => {
        const map = new Map<number | null, typeof employees.data>();
        if (!employees.data) return map;
        for (const assignment of employees.data) {
            const key = assignment.serviceVariantId ?? null;
            const list = map.get(key) ?? [];
            list.push(assignment);
            map.set(key, list);
        }
        return map;
    }, [employees]);

    const handleUpdateService = async (data: ServiceFormData) => {
        try {
            await updateService.mutateAsync({
                id: serviceId,
                data,
            });
            setIsEditModalOpen(false);
            summary.refetch();
        } catch (error) {
            console.error('Failed to update service:', error);
        }
    };

    if (!user || user.role !== 'admin') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">
                        Brak dostępu
                    </h1>
                    <p className="text-gray-600">
                        Ta strona jest dostępna tylko dla administratorów.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <DashboardLayout
            pageTitle={summaryData?.name ?? 'Usługa'}
            secondaryNav={<ServicesNav />}
        >
            <div className="versum-page">
                <div className="text-sm text-gray-500 mb-3 flex items-center gap-2">
                    {/* Breadcrumbs fallback if needed, currently header handled by Layout but we can keep inline nav */}
                </div>

                <div className="flex items-center justify-between mb-4">
                    <div className="text-lg font-semibold text-gray-800">
                        {summaryData?.name ?? 'Usługa'}
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setIsEditModalOpen(true)}
                            className="px-3 py-1.5 text-sm border border-blue-200 text-blue-600 rounded bg-white hover:bg-blue-50"
                        >
                            edytuj
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsVariantsModalOpen(true)}
                            className="px-3 py-1.5 text-sm border border-blue-200 text-blue-600 rounded bg-white hover:bg-blue-50"
                        >
                            zarządzaj wariantami
                        </button>
                    </div>
                </div>

                <div className="flex gap-4">
                    <aside className="w-56 bg-white border border-gray-200 rounded shrink-0">
                        <div className="px-4 py-3 text-sm font-semibold text-gray-700 border-b">
                            {summaryData?.name ?? 'Usługa'}
                        </div>
                        <div className="py-2">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`w-full flex items-center gap-2 px-4 py-2 text-sm text-left ${
                                        activeTab === tab.key
                                            ? 'bg-blue-50 text-blue-600 font-medium border-l-2 border-blue-500'
                                            : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    {tab.icon}
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </aside>

                    <section className="flex-1 bg-white border border-gray-200 rounded p-6 min-w-0">
                        {activeTab === 'summary' && (
                            <div>
                                <div className="flex items-baseline gap-2 mb-4">
                                    <div className="text-lg font-semibold text-gray-800">
                                        {summaryData?.name ?? 'Usługa'}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        {variantsData.length} warianty
                                    </div>
                                </div>

                                <div className="border border-gray-200 rounded mb-4">
                                    {variantsData.length === 0 && (
                                        <div className="px-4 py-3 text-sm text-gray-500">
                                            Brak wariantów
                                        </div>
                                    )}
                                    {variantsData.map((variant) => (
                                        <div
                                            key={variant.id}
                                            className="flex items-center justify-between px-4 py-3 border-b last:border-b-0 text-sm"
                                        >
                                            <div className="font-medium text-gray-800">
                                                {variant.name}
                                            </div>
                                            <div className="flex items-center gap-6 text-gray-500">
                                                <div className="flex items-center gap-2">
                                                    <svg
                                                        className="w-4 h-4"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={1.6}
                                                            d="M12 6v6l4 2"
                                                        />
                                                    </svg>
                                                    {formatDuration(
                                                        variant.duration,
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-700">
                                                    <svg
                                                        className="w-4 h-4"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={1.6}
                                                            d="M12 2v20M6 6h8a4 4 0 010 8H6"
                                                        />
                                                    </svg>
                                                    {formatCurrency(
                                                        variant.price,
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                                    <div className="flex items-start gap-2">
                                        <svg
                                            className="w-4 h-4"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={1.6}
                                                d="M4 6h16M4 12h8"
                                            />
                                        </svg>
                                        <div>
                                            <div className="text-gray-500">
                                                Kategoria
                                            </div>
                                            <div className="text-blue-500">
                                                {summaryData?.categoryRelation
                                                    ?.name ??
                                                    summaryData?.category ??
                                                    'Bez kategorii'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <svg
                                            className="w-4 h-4"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={1.6}
                                                d="M4 12h16M12 4v16"
                                            />
                                        </svg>
                                        <div>
                                            <div className="text-gray-500">
                                                VAT
                                            </div>
                                            <div>
                                                {summaryData?.vatRate ?? 23}%
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <svg
                                            className="w-4 h-4"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={1.6}
                                                d="M5 12h14M12 5l7 7-7 7"
                                            />
                                        </svg>
                                        <div>
                                            <div className="text-gray-500">
                                                Rezerwacja online
                                            </div>
                                            <div>
                                                {summaryData?.onlineBooking
                                                    ? 'Usługę można rezerwować online'
                                                    : 'Usługa niedostępna online'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <svg
                                            className="w-4 h-4"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={1.6}
                                                d="M4 6h16M4 10h16M4 14h10"
                                            />
                                        </svg>
                                        <div>
                                            <div className="text-gray-500">
                                                Opis publiczny
                                            </div>
                                            <div className="text-blue-500">
                                                {summaryData?.publicDescription ??
                                                    'Brak opisu'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <svg
                                            className="w-4 h-4"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={1.6}
                                                d="M4 7h16M4 11h8"
                                            />
                                        </svg>
                                        <div>
                                            <div className="text-gray-500">
                                                Opis prywatny
                                            </div>
                                            <div className="text-blue-500">
                                                {summaryData?.privateDescription ??
                                                    'Brak opisu'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <svg
                                            className="w-4 h-4"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={1.6}
                                                d="M4 7h16M4 11h10M4 15h6"
                                            />
                                        </svg>
                                        <div>
                                            <div className="text-gray-500">
                                                Zdjęcia
                                            </div>
                                            <div className="text-blue-500">
                                                Brak zdjęć
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'stats' && (
                            <div>
                                <div className="flex gap-10 mb-6">
                                    <StatCard
                                        title="Łączne obroty na usłudze"
                                        value={formatCurrency(
                                            stats.data?.totalRevenue ?? 0,
                                        )}
                                    />
                                    <StatCard
                                        title="Usługa sprzedana"
                                        value={`${stats.data?.totalCount ?? 0} razy`}
                                    />
                                </div>
                                <div className="border border-gray-200 rounded p-4">
                                    <RevenueChart
                                        data={chartData}
                                        loading={stats.isLoading}
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === 'history' && (
                            <div>
                                <div className="border border-gray-200 rounded">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 text-gray-600">
                                            <tr>
                                                <th className="text-left px-3 py-2">
                                                    data
                                                </th>
                                                <th className="text-left px-3 py-2">
                                                    wariant
                                                </th>
                                                <th className="text-left px-3 py-2">
                                                    klient
                                                </th>
                                                <th className="text-left px-3 py-2">
                                                    pracownik
                                                </th>
                                                <th className="text-left px-3 py-2">
                                                    czas trwania
                                                </th>
                                                <th className="text-left px-3 py-2">
                                                    cena
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {history.data?.items?.map(
                                                (item, idx) => (
                                                    <tr
                                                        key={item.id}
                                                        className={`border-t ${
                                                            idx === 0
                                                                ? 'bg-blue-50'
                                                                : ''
                                                        }`}
                                                    >
                                                        <td className="px-3 py-2 text-blue-600">
                                                            {new Date(
                                                                item.startTime,
                                                            ).toLocaleString(
                                                                'pl-PL',
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            {item.serviceVariant
                                                                ?.name ?? '—'}
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            {item.client
                                                                ?.name ?? '—'}
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            {item.employee
                                                                ?.name ?? '—'}
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            {item.endTime
                                                                ? formatDuration(
                                                                      Math.round(
                                                                          (new Date(
                                                                              item.endTime,
                                                                          ).getTime() -
                                                                              new Date(
                                                                                  item.startTime,
                                                                              ).getTime()) /
                                                                              60000,
                                                                      ),
                                                                  )
                                                                : '—'}
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            {formatCurrency(
                                                                item.paidAmount ??
                                                                    item
                                                                        .serviceVariant
                                                                        ?.price ??
                                                                    0,
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

                        {activeTab === 'employees' && (
                            <div>
                                <div className="border border-gray-200 rounded">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 text-gray-600">
                                            <tr>
                                                <th className="text-left px-3 py-2 w-80">
                                                    Nazwa
                                                </th>
                                                <th className="text-left px-3 py-2">
                                                    Pracownicy i czas
                                                    wykonywania
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {variantsData.map((variant) => {
                                                const assigned =
                                                    groupedAssignments.get(
                                                        variant.id,
                                                    ) ?? [];
                                                return (
                                                    <tr
                                                        key={variant.id}
                                                        className="border-t"
                                                    >
                                                        <td className="px-3 py-3 align-top">
                                                            <div className="font-semibold">
                                                                {
                                                                    summaryData?.name
                                                                }{' '}
                                                                - {variant.name}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {formatDuration(
                                                                    variant.duration,
                                                                )}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {formatCurrency(
                                                                    variant.price,
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-3 align-top">
                                                            {assigned.length ===
                                                            0 ? (
                                                                <div className="text-gray-500 text-sm">
                                                                    Brak
                                                                    przypisań
                                                                </div>
                                                            ) : (
                                                                assigned.map(
                                                                    (
                                                                        assignment,
                                                                    ) => (
                                                                        <div
                                                                            key={
                                                                                assignment.id
                                                                            }
                                                                            className="flex items-center justify-between py-2 border-b last:border-b-0"
                                                                        >
                                                                            <div>
                                                                                {
                                                                                    assignment
                                                                                        .employee
                                                                                        ?.name
                                                                                }
                                                                            </div>
                                                                            <div className="text-gray-500">
                                                                                {formatDuration(
                                                                                    assignment.customDuration ??
                                                                                        variant.duration,
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    ),
                                                                )
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </section>
                </div>

                {summaryData && (
                    <ServiceFormModal
                        isOpen={isEditModalOpen}
                        service={summaryData}
                        categories={categories}
                        onClose={() => setIsEditModalOpen(false)}
                        onSave={handleUpdateService}
                    />
                )}

                {summaryData && (
                    <ServiceVariantsModal
                        isOpen={isVariantsModalOpen}
                        service={summaryData}
                        onClose={() => setIsVariantsModalOpen(false)}
                    />
                )}
            </div>
        </DashboardLayout>
    );
}
