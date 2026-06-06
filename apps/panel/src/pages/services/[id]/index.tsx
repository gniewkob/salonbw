import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import { RevenueChart } from '@/components/statistics';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
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
    useServicePhotos,
    useServiceCommissions,
    useUpdateServiceCommissions,
    useServiceRecipe,
    useUpdateServiceRecipe,
} from '@/hooks/useServicesAdmin';
import ServiceFormModal, {
    ServiceFormData,
} from '@/components/services/ServiceFormModal';
import ServiceVariantsModal from '@/components/services/ServiceVariantsModal';
import { useEmployees } from '@/hooks/useEmployees';
import { useWarehouseProducts } from '@/hooks/useWarehouseViews';
import { getBrowserApiBase } from '@/hooks/useCustomerMedia';
import type { EmployeeService } from '@/types';

interface RecipeDraft {
    key: number;
    productId: number | null;
    productName: string;
    unit: string;
    quantity: string;
}

function createRecipeDraft(key: number): RecipeDraft {
    return { key, productId: null, productName: '', unit: 'op.', quantity: '' };
}

type TabKey =
    | 'summary'
    | 'stats'
    | 'history'
    | 'employees'
    | 'comments'
    | 'commissions'
    | 'recipe';

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
    const toast = useToast();
    const router = useRouter();
    const serviceId = Number(router.query.id);
    const tabParam = Array.isArray(router.query.tab)
        ? router.query.tab[0]
        : router.query.tab;
    const activeTab: TabKey =
        tabParam === 'stats' ||
        tabParam === 'history' ||
        tabParam === 'employees' ||
        tabParam === 'comments' ||
        tabParam === 'commissions' ||
        tabParam === 'recipe'
            ? tabParam
            : 'summary';
    const [historyPage] = useState(1);
    const [commentText, setCommentText] = useState('');
    const [commentRating, setCommentRating] = useState(5);
    const [commentAuthor, setCommentAuthor] = useState('');
    const [commissionDraft, setCommissionDraft] = useState<
        Record<number, number>
    >({});

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isVariantsModalOpen, setIsVariantsModalOpen] = useState(false);

    const [recipeDrafts, setRecipeDrafts] = useState<RecipeDraft[]>([
        createRecipeDraft(1),
    ]);
    const [nextRecipeKey, setNextRecipeKey] = useState(2);
    const [activeRecipeRowKey, setActiveRecipeRowKey] = useState<number | null>(
        null,
    );
    const [recipeProductSearch, setRecipeProductSearch] = useState('');
    const [recipeSaving, setRecipeSaving] = useState(false);

    const summary = useServiceSummary(serviceId);
    const variants = useServiceVariants(serviceId);
    const stats = useServiceStats(serviceId, { groupBy: 'month' });
    const history = useServiceHistory(serviceId, {
        page: historyPage,
        limit: 20,
    });
    const employees = useServiceEmployeesDetails(serviceId);
    const comments = useServiceComments(serviceId);
    const photos = useServicePhotos(serviceId);
    const commissions = useServiceCommissions(serviceId);
    const recipe = useServiceRecipe(serviceId);
    const allEmployees = useEmployees();
    const { data: categories = [] } = useServiceCategories();
    const { data: recipeProducts = [] } = useWarehouseProducts({
        search: activeRecipeRowKey !== null ? recipeProductSearch : undefined,
    });

    const updateService = useUpdateService();
    const addComment = useAddServiceComment();
    const deleteComment = useDeleteServiceComment();
    const updateCommissions = useUpdateServiceCommissions();
    const updateServiceRecipe = useUpdateServiceRecipe();

    const summaryData = summary.data;
    const variantsData = variants.data ?? summaryData?.variants ?? [];
    const apiBase = getBrowserApiBase();

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

    useEffect(() => {
        if (!recipe.data) return;
        const items = recipe.data;
        if (items.length === 0) {
            setRecipeDrafts([createRecipeDraft(1)]);
            setNextRecipeKey(2);
        } else {
            const drafts = items.map((item, i) => ({
                key: i + 1,
                productId: item.productId ?? null,
                productName: item.product?.name ?? '',
                unit: item.unit ?? 'op.',
                quantity: item.quantity != null ? String(item.quantity) : '',
            }));
            setRecipeDrafts(drafts);
            setNextRecipeKey(items.length + 1);
        }
    }, [recipe.data]);

    const recipeSuggestions = useMemo(() => {
        if (activeRecipeRowKey === null || !recipeProductSearch.trim())
            return [];
        return recipeProducts.slice(0, 8);
    }, [activeRecipeRowKey, recipeProductSearch, recipeProducts]);

    const updateRecipeDraft = (
        key: number,
        field: keyof Omit<RecipeDraft, 'key'>,
        value: string | number | null,
    ) => {
        setRecipeDrafts((prev) =>
            prev.map((item) =>
                item.key === key ? { ...item, [field]: value } : item,
            ),
        );
    };

    const addRecipeDraft = () => {
        setRecipeDrafts((prev) => [...prev, createRecipeDraft(nextRecipeKey)]);
        setNextRecipeKey((k) => k + 1);
    };

    const removeRecipeDraft = (key: number) => {
        setRecipeDrafts((prev) => {
            if (prev.length <= 1) return [createRecipeDraft(key)];
            return prev.filter((item) => item.key !== key);
        });
        if (activeRecipeRowKey === key) {
            setActiveRecipeRowKey(null);
            setRecipeProductSearch('');
        }
    };

    const handleSaveRecipe = async () => {
        const items = recipeDrafts
            .filter((item) => item.productId && Number(item.quantity) > 0)
            .map((item) => ({
                productId: item.productId as number,
                quantity: Number(item.quantity),
                unit: item.unit.trim() || null,
            }));
        setRecipeSaving(true);
        try {
            await updateServiceRecipe.mutateAsync({ serviceId, items });
            toast.success('Receptura zapisana');
        } catch {
            toast.error('Nie udało się zapisać receptury');
        } finally {
            setRecipeSaving(false);
        }
    };

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
        } catch {
            toast.error('Nie udało się zaktualizować usługi');
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
        } catch {
            toast.error('Nie udało się dodać komentarza');
        }
    };

    const handleDeleteComment = async (commentId: number) => {
        const shouldDelete = window.confirm(
            'Czy na pewno chcesz usunąć ten komentarz?',
        );
        if (!shouldDelete) return;

        try {
            await deleteComment.mutateAsync({ serviceId, commentId });
        } catch {
            toast.error('Nie udało się usunąć komentarza');
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
        } catch {
            toast.error('Nie udało się zapisać prowizji');
        }
    };

    return (
        <RouteGuard roles={['admin']} permission="nav:services">
            <SalonShell role={role || 'admin'}>
                <div
                    className="salonbw-page service-details-page"
                    data-testid="service-details-page"
                >
                    <SalonBreadcrumbs
                        iconClass="sprite-breadcrumbs_services"
                        items={[
                            { label: 'Usługi', href: '/services' },
                            { label: summaryData?.name ?? 'Usługa' },
                        ]}
                    />

                    <div className="column_row row buttons-row">
                        <div className="col-sm-6" />
                        <div className="right-buttons col-sm-6">
                            <button
                                type="button"
                                onClick={() => setIsEditModalOpen(true)}
                                className="btn btn-outline-secondary"
                                disabled={
                                    !summaryData || user?.role !== 'admin'
                                }
                            >
                                edytuj
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsVariantsModalOpen(true)}
                                className="btn btn-primary ml-s"
                                disabled={
                                    !summaryData || user?.role !== 'admin'
                                }
                            >
                                zarządzaj wariantami
                            </button>
                        </div>
                    </div>

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
                                        <h2 className="column_row">
                                            {summaryData.name}
                                            {variantsData.length > 0 && (
                                                <small>
                                                    {variantsData.length}{' '}
                                                    {variantsData.length === 1
                                                        ? 'wariant'
                                                        : 'warianty'}
                                                </small>
                                            )}
                                        </h2>

                                        {variantsData.length > 0 ? (
                                            <ul className="list-group no-radius no-hover">
                                                {variantsData.map((variant) => (
                                                    <li
                                                        key={variant.id}
                                                        className="list-group-item"
                                                    >
                                                        <div className="row">
                                                            <div className="col-6">
                                                                <span className="h4">
                                                                    {
                                                                        variant.name
                                                                    }
                                                                </span>
                                                            </div>
                                                            <div className="col-3">
                                                                {formatDuration(
                                                                    variant.duration,
                                                                )}
                                                            </div>
                                                            <div className="col-3 text-end">
                                                                {formatCurrency(
                                                                    variant.price,
                                                                )}
                                                            </div>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="service-empty">
                                                Brak wariantów
                                            </p>
                                        )}

                                        <dl className="dl-horizontal">
                                            <dt className="lbl">Kategoria</dt>
                                            <dd>
                                                {summaryData.categoryRelation
                                                    ?.name ??
                                                    summaryData.category ??
                                                    'Bez kategorii'}
                                            </dd>
                                            <dt className="lbl">VAT</dt>
                                            <dd>
                                                {summaryData.vatRate ?? 23}%
                                            </dd>
                                            <dt className="lbl">
                                                Rezerwacja online
                                            </dt>
                                            <dd>
                                                {summaryData.onlineBooking
                                                    ? 'Usługę można rezerwować online'
                                                    : 'Usługa niedostępna online'}
                                            </dd>
                                            <dt className="lbl">
                                                Opis publiczny
                                            </dt>
                                            <dd>
                                                {summaryData.publicDescription ??
                                                    'Brak opisu'}
                                            </dd>
                                            <dt className="lbl">
                                                Opis prywatny
                                            </dt>
                                            <dd>
                                                {summaryData.privateDescription ??
                                                    'Brak opisu'}
                                            </dd>
                                            <dt className="lbl">Zdjęcia</dt>
                                            <dd>
                                                {(photos.data ?? []).length ===
                                                0 ? (
                                                    'Brak zdjęć'
                                                ) : (
                                                    <div className="service-photo-grid">
                                                        {(
                                                            photos.data ?? []
                                                        ).map((photo) => (
                                                            <a
                                                                key={photo.id}
                                                                href={`${apiBase}${photo.url}`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="service-photo-thumb"
                                                                title={
                                                                    photo.caption ||
                                                                    'Zdjęcie usługi'
                                                                }
                                                            >
                                                                {/* eslint-disable-next-line @next/next/no-img-element -- Service photos come from API file endpoints, not Next static assets. */}
                                                                <img
                                                                    src={`${apiBase}${photo.url}`}
                                                                    alt={
                                                                        photo.caption ||
                                                                        'Zdjęcie usługi'
                                                                    }
                                                                />
                                                            </a>
                                                        ))}
                                                    </div>
                                                )}
                                            </dd>
                                        </dl>
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
                                                        stats.data
                                                            ?.totalRevenue ?? 0,
                                                    )}
                                                </div>
                                            </div>
                                            <div className="service-stats-card">
                                                <div className="service-stats-card__label">
                                                    Usługa sprzedana
                                                </div>
                                                <div className="service-stats-card__value">
                                                    {stats.data?.totalCount ??
                                                        0}{' '}
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
                                    <div className="salonbw-table-wrap">
                                        <table className="salonbw-table">
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
                                                            Brak historii wizyt
                                                            dla tej usługi
                                                        </td>
                                                    </tr>
                                                )}
                                                {history.data?.items?.map(
                                                    (item) => (
                                                        <tr key={item.id}>
                                                            <td>
                                                                {new Date(
                                                                    item.startTime,
                                                                ).toLocaleString(
                                                                    'pl-PL',
                                                                )}
                                                            </td>
                                                            <td>
                                                                {item
                                                                    .serviceVariant
                                                                    ?.name ??
                                                                    '—'}
                                                            </td>
                                                            <td>
                                                                {item.client
                                                                    ?.name ??
                                                                    '—'}
                                                            </td>
                                                            <td>
                                                                {item.employee
                                                                    ?.name ??
                                                                    '—'}
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
                                    <div className="salonbw-table-wrap">
                                        <table className="salonbw-table">
                                            <thead>
                                                <tr>
                                                    <th className="service-employees-variant-col">
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
                                                                    {
                                                                        variant.name
                                                                    }
                                                                </div>
                                                                <div className="text-muted fz-11">
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
                                                                    <div className="text-muted">
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
                                                                                    <span className="text-muted">
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
                                            <h3 className="service-comments-form__title">
                                                Dodaj komentarz
                                            </h3>
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
                                                    title="Ocena"
                                                    aria-label="Wybierz ocenę"
                                                    className="form-control"
                                                    value={commentRating}
                                                    onChange={(e) =>
                                                        setCommentRating(
                                                            Number(
                                                                e.target.value,
                                                            ),
                                                        )
                                                    }
                                                >
                                                    <option value={5}>
                                                        5 / 5
                                                    </option>
                                                    <option value={4}>
                                                        4 / 5
                                                    </option>
                                                    <option value={3}>
                                                        3 / 5
                                                    </option>
                                                    <option value={2}>
                                                        2 / 5
                                                    </option>
                                                    <option value={1}>
                                                        1 / 5
                                                    </option>
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
                                                    setCommentText(
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>

                                        <div className="salonbw-table-wrap">
                                            <table className="salonbw-table">
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
                                                                Brak komentarzy
                                                                dla tej usługi
                                                            </td>
                                                        </tr>
                                                    )}
                                                    {(comments.data ?? []).map(
                                                        (comment) => (
                                                            <tr
                                                                key={comment.id}
                                                            >
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
                                                                    {
                                                                        comment.source
                                                                    }
                                                                </td>
                                                                <td>
                                                                    {comment.authorName ||
                                                                        '—'}
                                                                </td>
                                                                <td>
                                                                    {
                                                                        comment.rating
                                                                    }
                                                                    /5
                                                                </td>
                                                                <td>
                                                                    {comment.comment ||
                                                                        '—'}
                                                                </td>
                                                                <td>
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-outline-secondary btn-sm"
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
                                        <div className="salonbw-table-wrap">
                                            <table className="salonbw-table">
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
                                                                Brak reguł
                                                                prowizji dla tej
                                                                usługi
                                                            </td>
                                                        </tr>
                                                    )}
                                                    {commissionRows.map(
                                                        (row) => (
                                                            <tr
                                                                key={
                                                                    row.employeeId
                                                                }
                                                            >
                                                                <td>
                                                                    {
                                                                        row.employeeName
                                                                    }
                                                                </td>
                                                                <td>
                                                                    <input
                                                                        type="number"
                                                                        title="Wartość prowizji"
                                                                        placeholder="Wartość prowizji"
                                                                        className="form-control"
                                                                        min={0}
                                                                        max={
                                                                            100
                                                                        }
                                                                        step={
                                                                            0.1
                                                                        }
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
                                                        ),
                                                    )}
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

                                {activeTab === 'recipe' && (
                                    <div>
                                        <h2>Receptura usługi</h2>
                                        <p className="text-muted mb-3">
                                            Materiały zużywane podczas
                                            wykonywania usługi. Receptura jest
                                            automatycznie podpowiadana podczas
                                            finalizacji wizyty.
                                        </p>
                                        <div className="services-create-recipe">
                                            <table className="salonbw-table services-create-recipe-table">
                                                <thead>
                                                    <tr>
                                                        <th>materiał</th>
                                                        <th>jednostka</th>
                                                        <th>ilość</th>
                                                        <th>usuń</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {recipeDrafts.map(
                                                        (item) => (
                                                            <tr key={item.key}>
                                                                <td className="services-create-recipe-cell">
                                                                    <input
                                                                        type="text"
                                                                        className="form-control"
                                                                        placeholder="wpisz nazwę, kod kreskowy, itp."
                                                                        value={
                                                                            item.productName
                                                                        }
                                                                        onFocus={() => {
                                                                            setActiveRecipeRowKey(
                                                                                item.key,
                                                                            );
                                                                            setRecipeProductSearch(
                                                                                item.productName,
                                                                            );
                                                                        }}
                                                                        onChange={(
                                                                            e,
                                                                        ) => {
                                                                            updateRecipeDraft(
                                                                                item.key,
                                                                                'productId',
                                                                                null,
                                                                            );
                                                                            updateRecipeDraft(
                                                                                item.key,
                                                                                'productName',
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            );
                                                                            setActiveRecipeRowKey(
                                                                                item.key,
                                                                            );
                                                                            setRecipeProductSearch(
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            );
                                                                        }}
                                                                    />
                                                                    {activeRecipeRowKey ===
                                                                        item.key &&
                                                                    recipeSuggestions.length >
                                                                        0 ? (
                                                                        <div className="services-create-recipe-suggestions">
                                                                            {recipeSuggestions.map(
                                                                                (
                                                                                    product,
                                                                                ) => (
                                                                                    <button
                                                                                        key={
                                                                                            product.id
                                                                                        }
                                                                                        type="button"
                                                                                        className="services-create-recipe-option"
                                                                                        onClick={() => {
                                                                                            updateRecipeDraft(
                                                                                                item.key,
                                                                                                'productId',
                                                                                                product.id,
                                                                                            );
                                                                                            updateRecipeDraft(
                                                                                                item.key,
                                                                                                'productName',
                                                                                                product.name,
                                                                                            );
                                                                                            updateRecipeDraft(
                                                                                                item.key,
                                                                                                'unit',
                                                                                                product.unit ||
                                                                                                    product.packageUnit ||
                                                                                                    'op.',
                                                                                            );
                                                                                            setActiveRecipeRowKey(
                                                                                                null,
                                                                                            );
                                                                                            setRecipeProductSearch(
                                                                                                '',
                                                                                            );
                                                                                        }}
                                                                                    >
                                                                                        <span>
                                                                                            {
                                                                                                product.name
                                                                                            }
                                                                                        </span>
                                                                                        <span className="services-create-muted">
                                                                                            {product.unit ||
                                                                                                product.packageUnit ||
                                                                                                'op.'}
                                                                                        </span>
                                                                                    </button>
                                                                                ),
                                                                            )}
                                                                        </div>
                                                                    ) : null}
                                                                </td>
                                                                <td>
                                                                    <input
                                                                        type="text"
                                                                        className="form-control"
                                                                        value={
                                                                            item.unit
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            updateRecipeDraft(
                                                                                item.key,
                                                                                'unit',
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            )
                                                                        }
                                                                    />
                                                                </td>
                                                                <td>
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        step="0.01"
                                                                        className="form-control services-create-number"
                                                                        value={
                                                                            item.quantity
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            updateRecipeDraft(
                                                                                item.key,
                                                                                'quantity',
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            )
                                                                        }
                                                                    />
                                                                </td>
                                                                <td className="text-center">
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-link services-create-delete"
                                                                        onClick={() =>
                                                                            removeRecipeDraft(
                                                                                item.key,
                                                                            )
                                                                        }
                                                                    >
                                                                        usuń
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ),
                                                    )}
                                                </tbody>
                                            </table>
                                            <div className="d-flex gap-2 mt-2">
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-secondary"
                                                    onClick={addRecipeDraft}
                                                >
                                                    dodaj kolejną pozycję
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-primary"
                                                    disabled={recipeSaving}
                                                    onClick={() => {
                                                        void handleSaveRecipe();
                                                    }}
                                                >
                                                    {recipeSaving
                                                        ? 'Zapisywanie...'
                                                        : 'zapisz recepturę'}
                                                </button>
                                            </div>
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
            </SalonShell>
        </RouteGuard>
    );
}
