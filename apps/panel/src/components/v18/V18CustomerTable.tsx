import Link from 'next/link';
import type { Customer, PaginatedCustomers } from '@/types';
import type {
    V18CustomerQuery,
    V18CustomerSortField,
} from '@/utils/v18CustomerQuery';
import { v18CustomerPageInfo } from '@/utils/v18CustomerQuery';
import styles from '@/styles/V18CustomersList.module.css';

type Props = {
    data?: PaginatedCustomers;
    query: V18CustomerQuery;
    loading?: boolean;
    error?: boolean;
    onSort: (field: V18CustomerSortField) => void;
    onPageChange: (page: number, totalPages: number) => void;
    onEdit?: (id: number) => void;
    onManageTags?: (id: number, customerName: string) => void;
    /** Optional V18 direct booking action; fallback links to the calendar. */
    onBook?: (id: number, customerName: string) => void;
    onRetry?: () => void;
    demoMode?: boolean;
    selectedIds?: ReadonlySet<number>;
    onToggleSelect?: (id: number) => void;
    onToggleSelectPage?: (ids: number[]) => void;
};

function formatDate(date?: string | null) {
    if (!date) return '—';
    const value = new Date(date);
    return Number.isNaN(value.getTime())
        ? '—'
        : new Intl.DateTimeFormat('pl-PL', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
          }).format(value);
}

function sortDirection(
    field: V18CustomerSortField,
    query: V18CustomerQuery,
): 'ascending' | 'descending' | 'none' {
    if (query.sortBy !== field) return 'none';
    return query.sortOrder === 'ASC' ? 'ascending' : 'descending';
}

export default function V18CustomerTable({
    data,
    query,
    loading = false,
    error = false,
    onSort,
    onPageChange,
    onEdit,
    onManageTags,
    onBook,
    onRetry,
    demoMode = false,
    selectedIds,
    onToggleSelect,
    onToggleSelectPage,
}: Props) {
    const { total, page, totalPages, start, end } = v18CustomerPageInfo(
        data,
        query.page,
    );

    if (error) {
        return (
            <div role="alert" className={styles.error}>
                Nie udało się pobrać listy klientów.
                {onRetry ? (
                    <button type="button" onClick={onRetry}>
                        Spróbuj ponownie
                    </button>
                ) : null}
            </div>
        );
    }

    const rows: Customer[] = data?.items ?? [];
    const isInitialLoading = loading && !data;
    const canSelect =
        !demoMode && !!selectedIds && !!onToggleSelect && !!onToggleSelectPage;
    const pageIds = rows.map((customer) => customer.id);
    const allChecked =
        pageIds.length > 0 &&
        pageIds.every((id) => selectedIds?.has(id) ?? false);
    const someChecked = pageIds.some((id) => selectedIds?.has(id) ?? false);
    const canManageTags = !demoMode && !!onManageTags;

    return (
        <section aria-label="Lista klientów" aria-busy={loading}>
            {loading && data ? (
                <p role="status" className={styles.update}>
                    Aktualizowanie wyników…
                </p>
            ) : null}
            {isInitialLoading ? (
                <p role="status" className={styles.update}>
                    Ładowanie klientów…
                </p>
            ) : (
                <>
                    <div className={styles.mobileSort} aria-label="Mobilne sortowanie klientów">
                        {(
                            [
                                { field: 'name', label: 'Nazwa' },
                                { field: 'email', label: 'E-mail' },
                                { field: 'createdAt', label: 'Dodano' },
                            ] as const
                        ).map(({ field, label }) => (
                            <button
                                type="button"
                                key={field}
                                aria-pressed={query.sortBy === field}
                                className={
                                    query.sortBy === field
                                        ? styles.mobileSortActive
                                        : styles.mobileSortButton
                                }
                                onClick={() => onSort(field)}
                            >
                                {label}
                                {query.sortBy === field
                                    ? query.sortOrder === 'ASC'
                                        ? ' ↑'
                                        : ' ↓'
                                    : ''}
                            </button>
                        ))}
                        {canSelect && (
                            <label className={styles.mobileSelectAll}>
                                <input
                                    type="checkbox"
                                    className={styles.selectCheckbox}
                                    aria-label="Zaznacz klientów na stronie"
                                    checked={allChecked}
                                    disabled={loading || pageIds.length === 0}
                                    ref={(node) => {
                                        if (node) {
                                            node.indeterminate = someChecked && !allChecked;
                                        }
                                    }}
                                    onChange={() => onToggleSelectPage?.(pageIds)}
                                />
                                <span>Wybierz stronę</span>
                            </label>
                        )}
                    </div>
                    <div className={styles.tableScroll}>
                        <table className={styles.table}>
                            <caption>
                                Klienci — tabela z sortowaniem serwerowym
                            </caption>
                            <thead>
                                <tr>
                                    {canSelect ? (
                                        <th
                                            scope="col"
                                            className={styles.selectCell}
                                        >
                                            <input
                                                type="checkbox"
                                                className={
                                                    styles.selectCheckbox
                                                }
                                                aria-label="Zaznacz klientów na stronie"
                                                checked={allChecked}
                                                disabled={
                                                    loading ||
                                                    pageIds.length === 0
                                                }
                                                ref={(node) => {
                                                    if (node) {
                                                        node.indeterminate =
                                                            someChecked &&
                                                            !allChecked;
                                                    }
                                                }}
                                                onChange={() =>
                                                    onToggleSelectPage?.(
                                                        pageIds,
                                                    )
                                                }
                                            />
                                        </th>
                                    ) : null}
                                    <th
                                        scope="col"
                                        aria-sort={sortDirection('name', query)}
                                    >
                                        <button
                                            type="button"
                                            aria-label="Sortuj po nazwie klienta"
                                            onClick={() => onSort('name')}
                                        >
                                            Klient
                                        </button>
                                    </th>
                                    <th
                                        scope="col"
                                        aria-sort={sortDirection(
                                            'email',
                                            query,
                                        )}
                                    >
                                        <button
                                            type="button"
                                            aria-label="Sortuj po e-mailu"
                                            onClick={() => onSort('email')}
                                        >
                                            E-mail
                                        </button>
                                    </th>
                                    <th
                                        scope="col"
                                        aria-sort={sortDirection(
                                            'createdAt',
                                            query,
                                        )}
                                    >
                                        <button
                                            type="button"
                                            aria-label="Sortuj po dacie dodania"
                                            onClick={() => onSort('createdAt')}
                                        >
                                            Dodano
                                        </button>
                                    </th>
                                    <th scope="col">Ostatnia wizyta</th>
                                    <th scope="col">Akcje</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.length === 0 ? (
                                    <tr>
                                        <td
                                            className={styles.emptyCell}
                                            colSpan={canSelect ? 6 : 5}
                                        >
                                            <p className={styles.empty}>
                                                Brak klientów spełniających
                                                kryteria.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    rows.map((customer) => (
                                        <tr
                                            key={customer.id}
                                            className={`${styles.customerRow} ${!canSelect ? styles.customerRowNoSelect : ''}`}
                                        >
                                            {canSelect ? (
                                                <td
                                                    className={
                                                        styles.selectCell
                                                    }
                                                >
                                                    <input
                                                        type="checkbox"
                                                        className={
                                                            styles.selectCheckbox
                                                        }
                                                        aria-label={
                                                            'Zaznacz klienta: ' +
                                                            (customer.fullName ||
                                                                customer.name)
                                                        }
                                                        checked={
                                                            selectedIds?.has(
                                                                customer.id,
                                                            ) ?? false
                                                        }
                                                        disabled={loading}
                                                        onChange={() =>
                                                            onToggleSelect?.(
                                                                customer.id,
                                                            )
                                                        }
                                                    />
                                                </td>
                                            ) : null}
                                            <td className={styles.nameCell}>
                                                {demoMode ? (
                                                    <span
                                                        className={
                                                            styles.demoName
                                                        }
                                                    >
                                                        {customer.fullName ||
                                                            customer.name}
                                                    </span>
                                                ) : (
                                                    <Link
                                                        href={
                                                            '/studio-v18/customers/' +
                                                            customer.id
                                                        }
                                                    >
                                                        {customer.fullName ||
                                                            customer.name}
                                                    </Link>
                                                )}
                                                {customer.phone ? (
                                                    demoMode ? (
                                                        <span
                                                            className={
                                                                styles.phone
                                                            }
                                                        >
                                                            {customer.phone}
                                                        </span>
                                                    ) : (
                                                        <a
                                                            href={
                                                                'tel:' +
                                                                customer.phone
                                                            }
                                                            className={
                                                                styles.phone
                                                            }
                                                        >
                                                            {customer.phone}
                                                        </a>
                                                    )
                                                ) : null}
                                            </td>
                                            <td
                                                className={styles.metaCell}
                                                data-label="E-mail"
                                                aria-label={`E-mail: ${customer.email || 'brak'}`}
                                            >
                                                {customer.email || '—'}
                                            </td>
                                            <td
                                                className={styles.metaCell}
                                                data-label="Dodano"
                                            >
                                                {formatDate(customer.createdAt)}
                                            </td>
                                            <td
                                                className={styles.metaCell}
                                                data-label="Ostatnia wizyta"
                                            >
                                                {formatDate(
                                                    customer.lastVisitDate,
                                                )}
                                            </td>
                                            <td className={styles.actionsCell}>
                                                <div className={styles.actions}>
                                                    {demoMode ? (
                                                        <span
                                                            className={
                                                                styles.demoAction
                                                            }
                                                        >
                                                            Rezerwacja · demo
                                                        </span>
                                                    ) : onBook ? (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                onBook(
                                                                    customer.id,
                                                                    customer.fullName ||
                                                                        customer.name,
                                                                )
                                                            }
                                                            aria-label={
                                                                'Umów wizytę klienta: ' +
                                                                (customer.fullName ||
                                                                    customer.name)
                                                            }
                                                        >
                                                            Umów
                                                        </button>
                                                    ) : (
                                                        <Link
                                                            href={
                                                                '/calendar?newClient=' +
                                                                customer.id +
                                                                '&clientName=' +
                                                                encodeURIComponent(
                                                                    customer.fullName ||
                                                                        customer.name,
                                                                )
                                                            }
                                                        >
                                                            Umów
                                                        </Link>
                                                    )}
                                                    {canManageTags ? (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                onManageTags?.(
                                                                    customer.id,
                                                                    customer.fullName ||
                                                                        customer.name,
                                                                )
                                                            }
                                                            aria-label={
                                                                'Zarządzaj tagami klienta: ' +
                                                                (customer.fullName ||
                                                                    customer.name)
                                                            }
                                                        >
                                                            Tagi
                                                        </button>
                                                    ) : null}
                                                    {onEdit ? (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                onEdit(
                                                                    customer.id,
                                                                )
                                                            }
                                                            aria-label={
                                                                'Edytuj klienta: ' +
                                                                (customer.fullName ||
                                                                    customer.name)
                                                            }
                                                        >
                                                            Edytuj
                                                        </button>
                                                    ) : null}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <nav
                        className={styles.pagination}
                        aria-label="Paginacja klientów"
                    >
                        <span aria-live="polite">
                            {total === 0
                                ? 'Brak wyników'
                                : 'Wyniki ' + start + '–' + end + ' z ' + total}
                            {' · Strona ' + page + ' z ' + totalPages}
                        </span>
                        <div className={styles.pageActions}>
                            <button
                                type="button"
                                disabled={page <= 1 || loading}
                                onClick={() =>
                                    onPageChange(page - 1, totalPages)
                                }
                            >
                                Poprzednia
                            </button>
                            <button
                                type="button"
                                disabled={page >= totalPages || loading}
                                onClick={() =>
                                    onPageChange(page + 1, totalPages)
                                }
                            >
                                Następna
                            </button>
                        </div>
                    </nav>
                </>
            )}
        </section>
    );
}
