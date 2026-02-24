'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import VersumShell from '@/components/versum/VersumShell';
import { RevenueChart } from '@/components/statistics';
import { useAuth } from '@/contexts/AuthContext';
import {
    useServiceSummary,
    useServiceStats,
    useServiceHistory,
    useServiceEmployeesDetails,
    useServiceVariants,
    useServiceCategories,
    useUpdateService,
    useServiceComments,
    useAddServiceComment,
    useDeleteServiceComment,
    useServiceCommissions,
    useUpdateServiceCommissions,
} from '@/hooks/useServicesAdmin';
import ServiceFormModal, {
    ServiceFormData,
} from '@/components/services/ServiceFormModal';
import ServiceVariantsModal from '@/components/services/ServiceVariantsModal';
import { useEmployees } from '@/hooks/useEmployees';
import type { EmployeeService } from '@/types';

type TabKey =
    | 'summary'
    | 'stats'
    | 'history'
    | 'employees'
    | 'comments'
    | 'commissions';

const tabs: Array<{ key: TabKey; label: string }> = [
    { key: 'summary', label: 'podsumowanie' },
    { key: 'stats', label: 'statystyki' },
    { key: 'history', label: 'historia usługi' },
    { key: 'employees', label: 'przypisani pracownicy' },
    { key: 'comments', label: 'komentarze' },
    { key: 'commissions', label: 'prowizje' },
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

export default function ServiceDetailsPage() {
    const { user, role } = useAuth();
    const router = useRouter();
    const serviceId = Number(router.query.id);
    const [activeTab, setActiveTab] = useState<TabKey>('summary');
    const [historyPage] = useState(1);
    const [commentText, setCommentText] = useState('');
    const [commentRating, setCommentRating] = useState(5);
    const [commentAuthor, setCommentAuthor] = useState('');
    const [commissionDraft, setCommissionDraft] = useState<
        Record<number, number>
    >({});

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
    const comments = useServiceComments(serviceId);
    const commissions = useServiceCommissions(serviceId);
    const allEmployees = useEmployees();
    const { data: categories = [] } = useServiceCategories();

    const updateService = useUpdateService();
    const addComment = useAddServiceComment();
    const deleteComment = useDeleteServiceComment();
    const updateCommissions = useUpdateServiceCommissions();

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
        const map = new Map<number | null, EmployeeService[]>();

        for (const assignment of employees.data ?? []) {
            const key = assignment.serviceVariantId ?? null;
            const list = map.get(key) ?? [];
            list.push(assignment);
            map.set(key, list);
        }

        return map;
    }, [employees.data]);

    const employeeNameById = useMemo(() => {
        const map = new Map<number, string>();
        for (const employee of allEmployees.data ?? []) {
            map.set(
                employee.id,
                employee.name.trim() || `Pracownik #${employee.id}`,
            );
        }
        return map;
    }, [allEmployees.data]);

    const commissionRows = useMemo(() => {
        const rules = commissions.data ?? [];
        const rows = rules.map((rule) => ({
            employeeId: rule.employeeId,
            employeeName:
                employeeNameById.get(rule.employeeId) ??
                `Pracownik #${rule.employeeId}`,
            value:
                commissionDraft[rule.employeeId] ?? rule.commissionPercent ?? 0,
        }));
        rows.sort((a, b) => a.employeeName.localeCompare(b.employeeName));
        return rows;
    }, [commissions.data, commissionDraft, employeeNameById]);

    const handleUpdateService = async (data: ServiceFormData) => {
        try {
            await updateService.mutateAsync({ id: serviceId, data });
            setIsEditModalOpen(false);
            void summary.refetch();
        } catch (error) {
            console.error('Failed to update service:', error);
        }
    };

    const handleAddComment = async () => {
        if (!commentText.trim()) return;
        try {
            await addComment.mutateAsync({
                serviceId,
                data: {
                    source: 'internal',
                    rating: Math.max(1, Math.min(5, commentRating)),
                    comment: commentText.trim(),
                    authorName: commentAuthor.trim() || undefined,
                },
            });
            setCommentText('');
            setCommentAuthor('');
            setCommentRating(5);
        } catch (error) {
            console.error('Failed to add service comment:', error);
        }
    };

    const handleDeleteComment = async (commentId: number) => {
        const shouldDelete = window.confirm(
            'Czy na pewno chcesz usunąć ten komentarz?',
        );
        if (!shouldDelete) return;

        try {
            await deleteComment.mutateAsync({ serviceId, commentId });
        } catch (error) {
            console.error('Failed to delete service comment:', error);
        }
    };

    const handleSaveCommissions = async () => {
        const rules = (commissions.data ?? []).map((rule) => ({
            id: rule.id,
            employeeId: rule.employeeId,
            commissionPercent:
                commissionDraft[rule.employeeId] ?? rule.commissionPercent ?? 0,
        }));

        try {
            await updateCommissions.mutateAsync({ serviceId, rules });
        } catch (error) {
            console.error('Failed to save commissions:', error);
        }
    };

    if (!role) return null;

    return (
        <VersumShell role={role || 'admin'}>
            <div
                className="versum-page service-details-page"
                data-testid="service-details-page"
            >
                <ul className="breadcrumb">
                    <li>
                        <i
                            className="icon sprite-breadcrumbs_services"
                            aria-hidden="true"
                        />{' '}
                        <Link href="/services">Usługi</Link> /{' '}
                        {summaryData?.name ?? 'Usługa'}
                    </li>
                </ul>

                <div className="customer-actions-bar">
                    <div className="customer-actions-bar__spacer" />
                    <div className="btn-group customer-actions-group">
                        <button
                            type="button"
                            onClick={() => setIsEditModalOpen(true)}
                            className="button button-light-blue button-small"
                            disabled={!summaryData || user?.role !== 'admin'}
                        >
                            edytuj
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsVariantsModalOpen(true)}
                            className="button button-light-blue button-small"
                            disabled={!summaryData || user?.role !== 'admin'}
                        >
                            zarządzaj wariantami
                        </button>
                    </div>
                </div>

                <ul className="nav nav-tabs service-details-tabs">
                    {tabs.map((tab) => (
                        <li
                            key={tab.key}
                            className={activeTab === tab.key ? 'active' : ''}
                        >
                            <a
                                href="javascript:;"
                                onClick={() => setActiveTab(tab.key)}
                            >
                                {tab.label}
                            </a>
                        </li>
                    ))}
                </ul>

                {!summaryData && summary.isLoading ? (
                    <div className="service-empty mt-15">
                        Ładowanie danych usługi...
                    </div>
                ) : !summaryData ? (
                    <div className="service-empty mt-15">
                        Nie udało się załadować danych usługi
                    </div>
                ) : (
                    <div className="service-details-content mt-15">
                        <section className="service-details-card">
                            {activeTab === 'summary' && (
                                <div>
                                    <div className="service-summary-head">
                                        <div className="service-summary-head__title">
                                            {summaryData.name}
                                        </div>
                                        <div className="service-summary-head__meta">
                                            {variantsData.length} warianty
                                        </div>
                                    </div>

                                    <div className="versum-table-wrap">
                                        <table className="versum-table">
                                            <thead>
                                                <tr>
                                                    <th>Wariant</th>
                                                    <th>Czas trwania</th>
                                                    <th>Cena</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {variantsData.length === 0 && (
                                                    <tr>
                                                        <td
                                                            colSpan={3}
                                                            className="service-empty-cell"
                                                        >
                                                            Brak wariantów
                                                        </td>
                                                    </tr>
                                                )}
                                                {variantsData.map((variant) => (
                                                    <tr key={variant.id}>
                                                        <td>{variant.name}</td>
                                                        <td>
                                                            {formatDuration(
                                                                variant.duration,
                                                            )}
                                                        </td>
                                                        <td>
                                                            {formatCurrency(
                                                                variant.price,
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <table className="service-details-meta">
                                        <tbody>
                                            <tr>
                                                <th>Kategoria</th>
                                                <td>
                                                    {summaryData
                                                        .categoryRelation
                                                        ?.name ??
                                                        summaryData.category ??
                                                        'Bez kategorii'}
                                                </td>
                                            </tr>
                                            <tr>
                                                <th>VAT</th>
                                                <td>
                                                    {summaryData.vatRate ?? 23}%
                                                </td>
                                            </tr>
                                            <tr>
                                                <th>Rezerwacja online</th>
                                                <td>
                                                    {summaryData.onlineBooking
                                                        ? 'Usługę można rezerwować online'
                                                        : 'Usługa niedostępna online'}
                                                </td>
                                            </tr>
                                            <tr>
                                                <th>Opis publiczny</th>
                                                <td>
                                                    {summaryData.publicDescription ??
                                                        'Brak opisu'}
                                                </td>
                                            </tr>
                                            <tr>
                                                <th>Opis prywatny</th>
                                                <td>
                                                    {summaryData.privateDescription ??
                                                        'Brak opisu'}
                                                </td>
                                            </tr>
                                            <tr>
                                                <th>Zdjęcia</th>
                                                <td>Brak zdjęć</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {activeTab === 'stats' && (
                                <div>
                                    <div className="service-stats-cards">
                                        <div className="service-stats-card">
                                            <div className="service-stats-card__label">
                                                Łączne obroty na usłudze
                                            </div>
                                            <div className="service-stats-card__value">
                                                {formatCurrency(
                                                    stats.data?.totalRevenue ??
                                                        0,
                                                )}
                                            </div>
                                        </div>
                                        <div className="service-stats-card">
                                            <div className="service-stats-card__label">
                                                Usługa sprzedana
                                            </div>
                                            <div className="service-stats-card__value">
                                                {stats.data?.totalCount ?? 0}{' '}
                                                razy
                                            </div>
                                        </div>
                                    </div>
                                    <div className="service-chart-wrap">
                                        <RevenueChart
                                            data={chartData}
                                            loading={stats.isLoading}
                                        />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'history' && (
                                <div className="versum-table-wrap">
                                    <table className="versum-table">
                                        <thead>
                                            <tr>
                                                <th>Data</th>
                                                <th>Wariant</th>
                                                <th>Klient</th>
                                                <th>Pracownik</th>
                                                <th>Czas trwania</th>
                                                <th>Cena</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {history.data?.items?.length ===
                                                0 && (
                                                <tr>
                                                    <td
                                                        colSpan={6}
                                                        className="service-empty-cell"
                                                    >
                                                        Brak historii wizyt dla
                                                        tej usługi
                                                    </td>
                                                </tr>
                                            )}
                                            {history.data?.items?.map(
                                                (item) => (
                                                    <tr key={item.id}>
                                                        <td className="versum-link">
                                                            {new Date(
                                                                item.startTime,
                                                            ).toLocaleString(
                                                                'pl-PL',
                                                            )}
                                                        </td>
                                                        <td>
                                                            {item.serviceVariant
                                                                ?.name ?? '—'}
                                                        </td>
                                                        <td>
                                                            {item.client
                                                                ?.name ?? '—'}
                                                        </td>
                                                        <td>
                                                            {item.employee
                                                                ?.name ?? '—'}
                                                        </td>
                                                        <td>
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
                                                        <td>
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
                            )}

                            {activeTab === 'employees' && (
                                <div className="versum-table-wrap">
                                    <table className="versum-table">
                                        <thead>
                                            <tr>
                                                <th style={{ width: 300 }}>
                                                    Nazwa wariantu
                                                </th>
                                                <th>
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
                                                    <tr key={variant.id}>
                                                        <td className="align-top">
                                                            <div className="service-variant-name">
                                                                {variant.name}
                                                            </div>
                                                            <div className="versum-muted fz-11">
                                                                {formatDuration(
                                                                    variant.duration,
                                                                )}
                                                                ,{' '}
                                                                {formatCurrency(
                                                                    variant.price,
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="align-top">
                                                            {assigned.length ===
                                                            0 ? (
                                                                <div className="versum-muted">
                                                                    Brak
                                                                    przypisań
                                                                </div>
                                                            ) : (
                                                                <ul className="simple-list">
                                                                    {assigned.map(
                                                                        (
                                                                            assignment,
                                                                        ) => (
                                                                            <li
                                                                                key={
                                                                                    assignment.id
                                                                                }
                                                                                className="service-assignment-row"
                                                                            >
                                                                                <span>
                                                                                    {
                                                                                        assignment
                                                                                            .employee
                                                                                            ?.name
                                                                                    }
                                                                                </span>
                                                                                <span className="versum-muted">
                                                                                    {formatDuration(
                                                                                        assignment.customDuration ??
                                                                                            variant.duration,
                                                                                    )}
                                                                                </span>
                                                                            </li>
                                                                        ),
                                                                    )}
                                                                </ul>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {activeTab === 'comments' && (
                                <div>
                                    <div className="service-comments-form">
                                        <div className="service-comments-form__title">
                                            Dodaj komentarz
                                        </div>
                                        <div className="service-comments-form__row">
                                            <input
                                                className="form-control"
                                                placeholder="Autor (opcjonalnie)"
                                                value={commentAuthor}
                                                onChange={(e) =>
                                                    setCommentAuthor(
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            <select
                                                className="form-control"
                                                value={commentRating}
                                                onChange={(e) =>
                                                    setCommentRating(
                                                        Number(e.target.value),
                                                    )
                                                }
                                            >
                                                <option value={5}>5 / 5</option>
                                                <option value={4}>4 / 5</option>
                                                <option value={3}>3 / 5</option>
                                                <option value={2}>2 / 5</option>
                                                <option value={1}>1 / 5</option>
                                            </select>
                                            <button
                                                type="button"
                                                className="btn btn-primary"
                                                disabled={
                                                    addComment.isPending ||
                                                    !commentText.trim()
                                                }
                                                onClick={() => {
                                                    void handleAddComment();
                                                }}
                                            >
                                                dodaj komentarz
                                            </button>
                                        </div>
                                        <textarea
                                            className="form-control"
                                            rows={4}
                                            placeholder="Treść komentarza"
                                            value={commentText}
                                            onChange={(e) =>
                                                setCommentText(e.target.value)
                                            }
                                        />
                                    </div>

                                    <div className="versum-table-wrap">
                                        <table className="versum-table">
                                            <thead>
                                                <tr>
                                                    <th>Data</th>
                                                    <th>Źródło</th>
                                                    <th>Autor</th>
                                                    <th>Ocena</th>
                                                    <th>Komentarz</th>
                                                    <th>Akcje</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(comments.data ?? [])
                                                    .length === 0 && (
                                                    <tr>
                                                        <td
                                                            colSpan={6}
                                                            className="service-empty-cell"
                                                        >
                                                            Brak komentarzy dla
                                                            tej usługi
                                                        </td>
                                                    </tr>
                                                )}
                                                {(comments.data ?? []).map(
                                                    (comment) => (
                                                        <tr key={comment.id}>
                                                            <td>
                                                                {comment.createdAt
                                                                    ? new Date(
                                                                          comment.createdAt,
                                                                      ).toLocaleString(
                                                                          'pl-PL',
                                                                      )
                                                                    : '—'}
                                                            </td>
                                                            <td>
                                                                {comment.source}
                                                            </td>
                                                            <td>
                                                                {comment.authorName ||
                                                                    '—'}
                                                            </td>
                                                            <td>
                                                                {comment.rating}
                                                                /5
                                                            </td>
                                                            <td>
                                                                {comment.comment ||
                                                                    '—'}
                                                            </td>
                                                            <td>
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-default btn-sm"
                                                                    disabled={
                                                                        deleteComment.isPending
                                                                    }
                                                                    onClick={() => {
                                                                        void handleDeleteComment(
                                                                            comment.id,
                                                                        );
                                                                    }}
                                                                >
                                                                    usuń
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ),
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'commissions' && (
                                <div>
                                    <div className="service-commissions-intro">
                                        Ustaw procent prowizji przypisany do
                                        pracownika dla tej usługi.
                                    </div>
                                    <div className="versum-table-wrap">
                                        <table className="versum-table">
                                            <thead>
                                                <tr>
                                                    <th>Pracownik</th>
                                                    <th>Prowizja (%)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {commissionRows.length ===
                                                    0 && (
                                                    <tr>
                                                        <td
                                                            colSpan={2}
                                                            className="service-empty-cell"
                                                        >
                                                            Brak reguł prowizji
                                                            dla tej usługi
                                                        </td>
                                                    </tr>
                                                )}
                                                {commissionRows.map((row) => (
                                                    <tr key={row.employeeId}>
                                                        <td>
                                                            {row.employeeName}
                                                        </td>
                                                        <td>
                                                            <input
                                                                type="number"
                                                                className="form-control"
                                                                min={0}
                                                                max={100}
                                                                step={0.1}
                                                                value={
                                                                    row.value
                                                                }
                                                                onChange={(
                                                                    e,
                                                                ) => {
                                                                    const value =
                                                                        Number(
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        );
                                                                    setCommissionDraft(
                                                                        (
                                                                            prev,
                                                                        ) => ({
                                                                            ...prev,
                                                                            [row.employeeId]:
                                                                                Number.isFinite(
                                                                                    value,
                                                                                )
                                                                                    ? value
                                                                                    : 0,
                                                                        }),
                                                                    );
                                                                }}
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="service-commissions-actions">
                                        <button
                                            type="button"
                                            className="btn btn-primary"
                                            disabled={
                                                updateCommissions.isPending ||
                                                commissionRows.length === 0
                                            }
                                            onClick={() => {
                                                void handleSaveCommissions();
                                            }}
                                        >
                                            zapisz prowizje
                                        </button>
                                    </div>
                                </div>
                            )}
                        </section>
                    </div>
                )}

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
        </VersumShell>
    );
}
