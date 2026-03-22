import Link from 'next/link';
import { useRouter } from 'next/router';
import { Fragment, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import RouteGuard from '@/components/RouteGuard';
import SalonBWShell from '@/components/salonbw/SalonBWShell';
import VersumBreadcrumbs from '@/components/salonbw/VersumBreadcrumbs';
import { useAuth } from '@/contexts/AuthContext';
import { useSetSecondaryNav } from '@/contexts/SecondaryNavContext';
import { useActivityLogs } from '@/hooks/useActivityLogs';
import { useStaffOptions } from '@/hooks/useEmployees';

const ACTIVITY_OPTIONS = [
    { label: 'Komentarze', options: [] },
    {
        label: 'Kalendarz',
        options: [
            { value: 'event_destroy', label: 'Usunięcie wizyty' },
            { value: 'event_beginning_change', label: 'Zmiana terminu wizyty' },
        ],
    },
    { label: 'Klienci', options: [] },
    { label: 'Dodatki', options: [] },
    {
        label: 'Magazyn',
        options: [
            { value: 'delivery_destroy', label: 'Ręczne usunięcie dostawy' },
            { value: 'product_destroy', label: 'Usunięcie produktu' },
        ],
    },
    {
        label: 'Pracownicy',
        options: [
            { value: 'employee_create', label: 'Dodanie pracownika' },
            { value: 'employee_update', label: 'Edycja pracownika' },
            { value: 'employee_destroy', label: 'Usunięcie pracownika' },
            {
                value: 'timetable_employee_update',
                label: 'Zmiana grafiku pracownika',
            },
        ],
    },
    {
        label: 'Prowizje',
        options: [{ value: 'commission_create', label: 'Dodanie prowizji' }],
    },
    {
        label: 'Usługi',
        options: [
            { value: 'service_destroy', label: 'Usunięcie usługi' },
            {
                value: 'service_settings_change',
                label: 'Zmiana parametrów usługi',
            },
        ],
    },
    {
        label: 'Salon',
        options: [
            {
                value: 'timetable_branch_update',
                label: 'Zmiana godzin otwarcia salonu',
            },
            {
                value: 'branch_update',
                label: 'Zmiana danych kontaktowych salonu',
            },
        ],
    },
    {
        label: 'SalonBW',
        options: [
            { value: 'signin', label: 'Zalogowanie do systemu' },
            {
                value: 'failed_login_attempts',
                label: 'Nieudane logowanie (3 razy)',
            },
            { value: 'limit_update', label: 'Błąd autoryzacji' },
        ],
    },
] as const;

type BreadcrumbItem = {
    href?: string;
    label: string;
    iconClass?: string;
};

type ActivityLogRouteProps = {
    breadcrumbs: BreadcrumbItem[];
    clearHref: string;
    emptyLabel?: string;
    secondaryNav: ReactNode;
    summaryFallback: string;
};

function toDateInput(value: string | string[] | undefined) {
    const raw = Array.isArray(value) ? value[0] : value;
    return raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : '';
}

function formatDetails(details: Record<string, unknown> | string | null) {
    if (!details) return '';
    if (typeof details === 'string') return details;

    return Object.entries(details)
        .filter(([, value]) => value !== null && value !== '')
        .map(([key, value]) => `${key}: ${String(value)}`)
        .join('\n');
}

export default function ActivityLogRoute({
    breadcrumbs,
    clearHref,
    emptyLabel = 'Brak aktywności dla wybranych filtrów.',
    secondaryNav,
    summaryFallback,
}: ActivityLogRouteProps) {
    const router = useRouter();
    const { role } = useAuth();
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [pageInput, setPageInput] = useState(
        String(Number(router.query.page ?? 1) || 1),
    );

    useSetSecondaryNav(secondaryNav);

    const filtersOpen =
        router.query.filters === '1' ||
        Boolean(router.query.activity) ||
        Boolean(router.query.userId) ||
        Boolean(router.query.from) ||
        Boolean(router.query.to);

    const page = Number(router.query.page ?? 1) || 1;
    const limit = Number(router.query.limit ?? 20) || 20;
    const activity = Array.isArray(router.query.activity)
        ? router.query.activity[0]
        : router.query.activity;
    const userId = Number(router.query.userId ?? 0) || undefined;
    const from = toDateInput(router.query.from);
    const to = toDateInput(router.query.to);

    const staff = useStaffOptions();
    const activityLogs = useActivityLogs({
        activity,
        userId,
        from: from || undefined,
        to: to || undefined,
        page,
        limit,
    });

    const total = activityLogs.data?.total ?? 0;
    const items = activityLogs.data?.items ?? [];
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const fromItem = total === 0 ? 0 : (page - 1) * limit + 1;
    const toItem = Math.min(page * limit, total);
    const selectedActivityLabel = useMemo(() => {
        for (const group of ACTIVITY_OPTIONS) {
            const found = group.options.find(
                (option) => option.value === activity,
            );
            if (found) return found.label;
        }
        return '';
    }, [activity]);

    useEffect(() => {
        setPageInput(String(page));
    }, [page]);

    if (!role) return null;

    return (
        <RouteGuard roles={['admin']} permission="nav:employees">
            <SalonBWShell role={role}>
                <VersumBreadcrumbs
                    iconClass={
                        breadcrumbs[0]?.iconClass ??
                        'sprite-breadcrumbs_settings'
                    }
                    items={breadcrumbs.map((item) => ({
                        href: item.href,
                        label: item.label,
                    }))}
                />

                <div className="settings-employee-activity-page">
                    <div>
                        <button
                            className="button"
                            id="filters_toggle"
                            type="button"
                            onClick={() => {
                                const nextQuery = { ...router.query };
                                if (filtersOpen) {
                                    delete nextQuery.filters;
                                    delete nextQuery.activity;
                                    delete nextQuery.userId;
                                    delete nextQuery.from;
                                    delete nextQuery.to;
                                } else {
                                    nextQuery.filters = '1';
                                }
                                void router.push({
                                    pathname: router.pathname,
                                    query: nextQuery,
                                });
                            }}
                        >
                            <i className="icon sprite-filter mr-xs" />
                            filtruj
                        </button>

                        <div
                            id="filters"
                            style={{ display: filtersOpen ? 'block' : 'none' }}
                        >
                            <div className="rows" id="filter_rows">
                                <Link className="close" href={clearHref}>
                                    ×
                                </Link>
                                <div className="row" id="first_filter_row">
                                    <form
                                        id="filter_form"
                                        onSubmit={(event) => {
                                            event.preventDefault();
                                            const formData = new FormData(
                                                event.currentTarget,
                                            );
                                            const nextQuery: Record<
                                                string,
                                                string
                                            > = {};

                                            for (const [
                                                key,
                                                value,
                                            ] of formData) {
                                                const stringValue =
                                                    String(value);
                                                if (stringValue) {
                                                    nextQuery[key] =
                                                        stringValue;
                                                }
                                            }
                                            nextQuery.page = '1';
                                            nextQuery.limit = String(limit);
                                            delete nextQuery.filters;
                                            void router.push({
                                                pathname: router.pathname,
                                                query: nextQuery,
                                            });
                                        }}
                                    >
                                        <div className="col-sm-6 filter">
                                            <div className="lbl">
                                                Dział i akcja
                                            </div>
                                            <select
                                                className="settings-employee-activity-page__select"
                                                defaultValue={activity ?? ''}
                                                name="activity"
                                            >
                                                <option value="">
                                                    Wybierz dział / akcję
                                                </option>
                                                {ACTIVITY_OPTIONS.map(
                                                    (group) => (
                                                        <optgroup
                                                            key={group.label}
                                                            label={group.label}
                                                        >
                                                            {group.options.map(
                                                                (option) => (
                                                                    <option
                                                                        key={
                                                                            option.value
                                                                        }
                                                                        value={
                                                                            option.value
                                                                        }
                                                                    >
                                                                        {
                                                                            option.label
                                                                        }
                                                                    </option>
                                                                ),
                                                            )}
                                                        </optgroup>
                                                    ),
                                                )}
                                            </select>
                                        </div>
                                        <div className="col-sm-3 filter">
                                            <div className="lbl">Pracownik</div>
                                            <select
                                                className="settings-employee-activity-page__select"
                                                defaultValue={
                                                    userId ? String(userId) : ''
                                                }
                                                name="userId"
                                            >
                                                <option value="">
                                                    Nic nie wybrano
                                                </option>
                                                {staff.data?.map((member) => (
                                                    <option
                                                        key={member.id}
                                                        value={member.id}
                                                    >
                                                        {member.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div
                                            className="col-sm-3 filter"
                                            id="date_range_filter"
                                        >
                                            <div className="lbl">
                                                Zakres dat
                                            </div>
                                            <div className="settings-employee-activity-page__date-range">
                                                <input
                                                    name="from"
                                                    type="date"
                                                    defaultValue={from}
                                                />
                                                <span>-</span>
                                                <input
                                                    name="to"
                                                    type="date"
                                                    defaultValue={to}
                                                />
                                            </div>
                                        </div>
                                        <div className="col-sm-12 filter settings-employee-activity-page__filter-actions">
                                            <button
                                                className="button button-blue"
                                                type="submit"
                                            >
                                                zastosuj
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>

                        <div className="filters_summary">
                            {selectedActivityLabel ? (
                                <span>{selectedActivityLabel}</span>
                            ) : (
                                <span>{summaryFallback}</span>
                            )}
                        </div>

                        <div className="inner activity-table">
                            <div className="column_row data_table">
                                {activityLogs.isLoading ? (
                                    <div className="settings-detail-state">
                                        Ładowanie rejestru aktywności...
                                    </div>
                                ) : activityLogs.isError ? (
                                    <div className="settings-detail-state settings-detail-state--error">
                                        <div>
                                            Nie udało się pobrać aktywności.
                                        </div>
                                        <button
                                            type="button"
                                            className="btn btn-default"
                                            onClick={() =>
                                                void activityLogs.refetch()
                                            }
                                        >
                                            odśwież
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <table className="table data_table no_hover table-bordered">
                                            <thead>
                                                <tr>
                                                    <th>Data</th>
                                                    <th>Pracownik</th>
                                                    <th>Adres IP</th>
                                                    <th>Dział i akcja</th>
                                                    <th>Dział</th>
                                                    <th>Szczegóły</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {items.length === 0 ? (
                                                    <tr className="no_hover">
                                                        <td
                                                            colSpan={6}
                                                            className="settings-employee-activity-page__empty"
                                                        >
                                                            {emptyLabel}
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    items.map((item, index) => (
                                                        <Fragment key={item.id}>
                                                            <tr
                                                                className={`${index % 2 === 0 ? 'odd' : 'even'} no_hover row`}
                                                            >
                                                                <td>
                                                                    {format(
                                                                        new Date(
                                                                            item.timestamp,
                                                                        ),
                                                                        'dd.MM.yyyy HH:mm',
                                                                        {
                                                                            locale: pl,
                                                                        },
                                                                    )}
                                                                </td>
                                                                <td>
                                                                    {
                                                                        item.employeeName
                                                                    }
                                                                </td>
                                                                <td>
                                                                    {item.ipAddress ??
                                                                        '—'}
                                                                </td>
                                                                <td>
                                                                    {
                                                                        item.actionLabel
                                                                    }
                                                                </td>
                                                                <td>
                                                                    {
                                                                        item.categoryLabel
                                                                    }
                                                                </td>
                                                                <td>
                                                                    {item.expandable ? (
                                                                        <button
                                                                            type="button"
                                                                            className="settings-employee-activity-page__details-link"
                                                                            onClick={() =>
                                                                                setExpandedId(
                                                                                    (
                                                                                        current,
                                                                                    ) =>
                                                                                        current ===
                                                                                        item.id
                                                                                            ? null
                                                                                            : item.id,
                                                                                )
                                                                            }
                                                                        >
                                                                            więcej
                                                                        </button>
                                                                    ) : null}
                                                                </td>
                                                            </tr>
                                                            {expandedId ===
                                                            item.id ? (
                                                                <tr className="no_hover">
                                                                    <td
                                                                        className="description"
                                                                        colSpan={
                                                                            6
                                                                        }
                                                                    >
                                                                        <pre className="settings-employee-activity-page__details">
                                                                            {formatDetails(
                                                                                item.details,
                                                                            )}
                                                                        </pre>
                                                                    </td>
                                                                </tr>
                                                            ) : null}
                                                        </Fragment>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>

                                        <form className="pagination_container">
                                            <div className="row">
                                                <div className="info col-md-6">
                                                    Pozycje od {fromItem} do{' '}
                                                    {toItem} z {total} | na
                                                    stronie{' '}
                                                    <select
                                                        className="ml-s"
                                                        name="size"
                                                        value={limit}
                                                        onChange={(event) => {
                                                            void router.push({
                                                                pathname:
                                                                    router.pathname,
                                                                query: {
                                                                    ...router.query,
                                                                    page: '1',
                                                                    limit: event
                                                                        .target
                                                                        .value,
                                                                },
                                                            });
                                                        }}
                                                    >
                                                        {[10, 20, 50, 100].map(
                                                            (size) => (
                                                                <option
                                                                    key={size}
                                                                    value={size}
                                                                >
                                                                    {size}{' '}
                                                                    wyników
                                                                </option>
                                                            ),
                                                        )}
                                                    </select>
                                                </div>
                                                <div className="col-md-6">
                                                    <div className="pagination">
                                                        <button
                                                            type="button"
                                                            className="prev_page"
                                                            onClick={() => {
                                                                if (page <= 1)
                                                                    return;
                                                                void router.push(
                                                                    {
                                                                        pathname:
                                                                            router.pathname,
                                                                        query: {
                                                                            ...router.query,
                                                                            page: String(
                                                                                page -
                                                                                    1,
                                                                            ),
                                                                        },
                                                                    },
                                                                );
                                                            }}
                                                            disabled={page <= 1}
                                                        >
                                                            &lt;
                                                        </button>
                                                        <input
                                                            type="text"
                                                            className="page current_page"
                                                            value={pageInput}
                                                            onChange={(event) =>
                                                                setPageInput(
                                                                    event.target
                                                                        .value,
                                                                )
                                                            }
                                                            onBlur={() => {
                                                                const nextPage =
                                                                    Number(
                                                                        pageInput,
                                                                    );
                                                                if (
                                                                    !Number.isFinite(
                                                                        nextPage,
                                                                    ) ||
                                                                    nextPage <
                                                                        1 ||
                                                                    nextPage >
                                                                        totalPages
                                                                ) {
                                                                    setPageInput(
                                                                        String(
                                                                            page,
                                                                        ),
                                                                    );
                                                                    return;
                                                                }
                                                                if (
                                                                    nextPage !==
                                                                    page
                                                                ) {
                                                                    void router.push(
                                                                        {
                                                                            pathname:
                                                                                router.pathname,
                                                                            query: {
                                                                                ...router.query,
                                                                                page: String(
                                                                                    nextPage,
                                                                                ),
                                                                            },
                                                                        },
                                                                    );
                                                                }
                                                            }}
                                                        />
                                                        <span className="total_pages">
                                                            z {totalPages}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            className="next_page"
                                                            onClick={() => {
                                                                if (
                                                                    page >=
                                                                    totalPages
                                                                )
                                                                    return;
                                                                void router.push(
                                                                    {
                                                                        pathname:
                                                                            router.pathname,
                                                                        query: {
                                                                            ...router.query,
                                                                            page: String(
                                                                                page +
                                                                                    1,
                                                                            ),
                                                                        },
                                                                    },
                                                                );
                                                            }}
                                                            disabled={
                                                                page >=
                                                                totalPages
                                                            }
                                                        >
                                                            &gt;
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </form>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </SalonBWShell>
        </RouteGuard>
    );
}
