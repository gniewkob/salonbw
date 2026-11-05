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
    onRetry?: () => void;
    demoMode?: boolean;
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
    onRetry,
    demoMode = false,
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
                    <div className={styles.tableScroll}>
                        <table className={styles.table}>
                            <caption>Klienci — tabela z sortowaniem serwerowym</caption>
                            <thead>
                                <tr>
                                    <th scope="col" aria-sort={sortDirection('name', query)}>
                                        <button type="button" onClick={() => onSort('name')}>
                                            Klient
                                        </button>
                                    </th>
                                    <th scope="col" aria-sort={sortDirection('email', query)}>
                                        <button type="button" onClick={() => onSort('email')}>
                                            E-mail
                                        </button>
                                    </th>
                                    <th scope="col" aria-sort={sortDirection('createdAt', query)}>
                                        <button type="button" onClick={() => onSort('createdAt')}>
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
                                        <td colSpan={5}>
                                            <p className={styles.empty}>
                                                Brak klientów spełniających kryteria.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    rows.map((customer) => (
                                        <tr key={customer.id}>
                                            <td>
                                                {demoMode ? (
                                                    <span className={styles.demoName}>
                                                        {customer.fullName || customer.name}
                                                    </span>
                                                ) : (
                                                    <Link href={'/customers/' + customer.id}>
                                                        {customer.fullName || customer.name}
                                                    </Link>
                                                )}
                                                {customer.phone ? (
                                                    demoMode ? (
                                                        <span className={styles.phone}>
                                                            {customer.phone}
                                                        </span>
                                                    ) : (
                                                        <a href={'tel:' + customer.phone} className={styles.phone}>
                                                            {customer.phone}
                                                        </a>
                                                    )
                                                ) : null}
                                            </td>
                                            <td>{customer.email || '—'}</td>
                                            <td>{formatDate(customer.createdAt)}</td>
                                            <td>{formatDate(customer.lastVisitDate)}</td>
                                            <td>
                                                <div className={styles.actions}>
                                                    {demoMode ? (
                                                        <span className={styles.demoAction}>
                                                            Rezerwacja · demo
                                                        </span>
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
                                                    {onEdit ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => onEdit(customer.id)}
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
                    <nav className={styles.pagination} aria-label="Paginacja klientów">
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
                                onClick={() => onPageChange(page - 1, totalPages)}
                            >
                                Poprzednia
                            </button>
                            <button
                                type="button"
                                disabled={page >= totalPages || loading}
                                onClick={() => onPageChange(page + 1, totalPages)}
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
