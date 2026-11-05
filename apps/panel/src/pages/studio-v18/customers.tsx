import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { useEffect, useMemo, useReducer, useState } from 'react';
import {
    ArrowLeftIcon,
    BeakerIcon,
    Squares2X2Icon,
    UsersIcon,
} from '@heroicons/react/24/outline';
import RouteGuard from '@/components/RouteGuard';
import NewCustomerModal from '@/components/customers/NewCustomerModal';
import EditCustomerModal from '@/components/customers/EditCustomerModal';
import V18CustomerTable from '@/components/v18/V18CustomerTable';
import V18CustomerToolbar from '@/components/v18/V18CustomerToolbar';
import { useCustomerGroups, useCustomers } from '@/hooks/useCustomers';
import {
    initialV18CustomerQuery,
    reduceV18CustomerQuery,
    toV18CustomerFilters,
} from '@/utils/v18CustomerQuery';
import foundation from '@/styles/V18Foundation.module.css';
import list from '@/styles/V18CustomersList.module.css';
import styles from '@/styles/V18CustomersPilot.module.css';

/**
 * DEV-only pilot backed by the existing authenticated Customers API.
 * Advanced CRM operations remain in /customers until feature-parity UAT.
 * The API and the existing create/edit modals remain the source of truth.
 */
export function V18CustomersPilot() {
    const [query, dispatch] = useReducer(
        reduceV18CustomerQuery,
        initialV18CustomerQuery,
    );
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [newCustomerOpen, setNewCustomerOpen] = useState(false);
    const [editCustomerId, setEditCustomerId] = useState<number | null>(null);

    useEffect(() => {
        const timer = setTimeout(
            () => setDebouncedSearch(query.search.trim()),
            250,
        );
        return () => clearTimeout(timer);
    }, [query.search]);

    const filters = useMemo(
        () => ({
            ...toV18CustomerFilters(query),
            search: debouncedSearch || undefined,
        }),
        [query, debouncedSearch],
    );
    const {
        data,
        isLoading,
        isFetching,
        isError,
        isPlaceholderData,
        refetch,
    } = useCustomers(filters);
    const {
        data: groups,
        isLoading: groupsLoading,
        isError: groupsError,
    } = useCustomerGroups();

    // A deletion or filter change may invalidate the last page.
    // Clamp against the returned server total rather than an older page.
    useEffect(() => {
        if (!data || isFetching || isPlaceholderData) return;
        const lastPage = Math.max(1, data.totalPages);
        if (query.page > lastPage) {
            dispatch({
                type: 'page',
                value: lastPage,
                totalPages: lastPage,
            });
        }
    }, [data, isFetching, isPlaceholderData, query.page]);

    const loading = isLoading || isFetching;
    const visibleData = isError || isPlaceholderData ? undefined : data;

    return (
        <div className={foundation.foundation} data-testid="v18-customers-pilot">
            <div className={foundation.layout}>
                <nav className={foundation.rail} aria-label="Nawigacja Studio V18">
                    <Link
                        href="/studio-v18"
                        className={foundation.railBrand}
                        aria-label="Dashboard V18"
                    >
                        B<span>/</span>W
                    </Link>
                    <Link
                        href="/studio-v18"
                        className={foundation.railLink}
                        aria-label="Dashboard"
                    >
                        <Squares2X2Icon width={23} height={23} aria-hidden="true" />
                    </Link>
                    <Link
                        href="/studio-v18/components"
                        className={foundation.railLink}
                        aria-label="Biblioteka komponentów"
                    >
                        <BeakerIcon width={23} height={23} aria-hidden="true" />
                    </Link>
                    <Link
                        href="/studio-v18/customers"
                        className={[foundation.railLink, foundation.railActive].join(' ')}
                        aria-current="page"
                        aria-label="Klienci V18"
                    >
                        <UsersIcon width={23} height={23} aria-hidden="true" />
                    </Link>
                </nav>
                <main className={foundation.surface} id="main-content">
                    <div className={foundation.breadcrumbs}>
                        <Link href="/studio-v18">Studio V18</Link>
                        <span aria-hidden="true">/</span>
                        <span>Klienci</span>
                    </div>
                    <header className={foundation.hero}>
                        <div className={foundation.heroText}>
                            <span className={foundation.eyebrow}>
                                Salon Black &amp; White · CRM
                            </span>
                            <h1>Klienci V18</h1>
                            <p>
                                Rzeczywista lista klientów z API DEV. Wyszukuj,
                                sortuj, umawiaj wizyty i edytuj dane przy użyciu
                                dotychczasowych formularzy oraz uprawnień.
                            </p>
                        </div>
                        <span className={foundation.heroTag}>Pilotaż · DEV</span>
                    </header>

                    <div className={styles.headerRow}>
                        <div>
                            <h2>Lista klientów</h2>
                            <p>
                                Dane z istniejącego CRM. Wszelkie zmiany zapisują
                                się w bazie środowiska DEV.
                            </p>
                        </div>
                        <div className={styles.headerActions}>
                            <Link href="/customers" className={styles.secondaryLink}>
                                <ArrowLeftIcon width={17} height={17} aria-hidden="true" />
                                Pełny moduł Klienci
                            </Link>
                            <button
                                type="button"
                                className={styles.primaryButton}
                                onClick={() => setNewCustomerOpen(true)}
                            >
                                Dodaj klienta
                            </button>
                        </div>
                    </div>

                    <section className={styles.panel} aria-label="Klienci w CRM">
                        <div className={styles.filters}>
                            <V18CustomerToolbar query={query} onAction={dispatch} />
                            <label className={list.field}>
                                <span>Grupa klientów</span>
                                <select
                                    value={query.groupId ?? ''}
                                    disabled={groupsLoading || groupsError}
                                    onChange={(event) => {
                                        const groupId = Number(event.target.value);
                                        dispatch({
                                            type: 'group',
                                            groupId: groupId > 0 ? groupId : undefined,
                                        });
                                    }}
                                >
                                    <option value="">Wszystkie grupy</option>
                                    {groups?.map((group) => (
                                        <option key={group.id} value={group.id}>
                                            {group.name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>
                        {groupsError ? (
                            <p role="status" className={styles.groupError}>
                                Nie udało się pobrać grup. Lista klientów nadal
                                może być używana bez filtrowania grupowego.
                            </p>
                        ) : null}
                        <V18CustomerTable
                            query={query}
                            data={visibleData}
                            loading={loading}
                            error={isError}
                            onRetry={() => void refetch()}
                            onSort={(field) => dispatch({ type: 'sort', field })}
                            onPageChange={(value, totalPages) =>
                                dispatch({ type: 'page', value, totalPages })
                            }
                            onEdit={(id) => setEditCustomerId(id)}
                        />
                    </section>

                    <p className={styles.featureNote}>
                        <strong>Pełna zgodność funkcjonalna:</strong> eksport CSV,
                        działania masowe, zarządzanie tagami, drag &amp; drop i
                        rozbudowane filtry są nadal dostępne w{' '}
                        <Link href="/customers">dotychczasowym module Klienci</Link>.
                        Nie zastępujemy go, dopóki wszystkie operacje nie
                        przejdą testów porównawczych.
                    </p>
                </main>
            </div>
            <NewCustomerModal
                open={newCustomerOpen}
                onClose={() => setNewCustomerOpen(false)}
                onSuccess={() => setNewCustomerOpen(false)}
            />
            <EditCustomerModal
                open={editCustomerId !== null}
                customerId={editCustomerId}
                onClose={() => setEditCustomerId(null)}
                onSuccess={() => setEditCustomerId(null)}
                onDeleted={() => setEditCustomerId(null)}
            />
        </div>
    );
}

export default function StudioV18CustomersPage() {
    return (
        <RouteGuard roles={['admin']} permission="nav:customers">
            <Head>
                <title>Klienci V18 — Salon Black &amp; White</title>
                <meta name="robots" content="noindex,nofollow" />
            </Head>
            <V18CustomersPilot />
        </RouteGuard>
    );
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
    const host = (req.headers.host ?? '').split(':')[0].toLowerCase();
    const dev =
        process.env.NEXT_PUBLIC_DEPLOYMENT_ENV === 'development' ||
        process.env.NODE_ENV === 'development';

    if (
        !dev ||
        !['dev-panel.salon-bw.pl', 'localhost', '127.0.0.1'].includes(host)
    ) {
        return { notFound: true };
    }
    return { props: {} };
};
