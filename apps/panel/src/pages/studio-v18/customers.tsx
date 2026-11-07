import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useReducer, useState } from 'react';
import type { V18CustomerQueryAction } from '@/utils/v18CustomerQuery';
import {
    ArrowLeftIcon,
    BeakerIcon,
    Squares2X2Icon,
    UsersIcon,
} from '@heroicons/react/24/outline';
import RouteGuard from '@/components/RouteGuard';
import V18EditCustomerModal from '@/components/v18/V18EditCustomerModal';
import V18CustomerTable from '@/components/v18/V18CustomerTable';
import V18CustomerTagManager from '@/components/v18/V18CustomerTagManager';
import V18CustomerBooking from '@/components/v18/V18CustomerBooking';
import V18CustomerTagCatalog from '@/components/v18/V18CustomerTagCatalog';
import V18CustomerGroupsManager from '@/components/v18/V18CustomerGroupsManager';
import V18CustomerToolbar from '@/components/v18/V18CustomerToolbar';
import V18CustomerQuickFilters from '@/components/v18/V18CustomerQuickFilters';
import V18CustomerAdvancedFilters from '@/components/v18/V18CustomerAdvancedFilters';
import V18Select from '@/components/ui/V18Select';
import {
    useAddGroupMembers,
    useCustomerGroups,
    useCustomerTags,
    useCustomers,
} from '@/hooks/useCustomers';
import { buildV18CustomerCsv } from '@/utils/v18CustomerExport';
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
    const router = useRouter();
    const [query, dispatch] = useReducer(
        reduceV18CustomerQuery,
        initialV18CustomerQuery,
    );
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [groupManagerOpen, setGroupManagerOpen] = useState(false);
    const [tagCatalogOpen, setTagCatalogOpen] = useState(false);
    const [editCustomerId, setEditCustomerId] = useState<number | null>(null);
    const [bookingCustomer, setBookingCustomer] = useState<{
        id: number;
        name: string;
    } | null>(null);
    const [tagCustomer, setTagCustomer] = useState<{
        id: number;
        name: string;
    } | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [bulkGroupId, setBulkGroupId] = useState('');
    const addToGroup = useAddGroupMembers();

    // Any server query change invalidates page-only selection immediately.
    const updateQuery = (action: V18CustomerQueryAction) => {
        setSelectedIds(new Set());
        setBulkGroupId('');
        dispatch(action);
    };

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
    const { data, isLoading, isFetching, isError, isPlaceholderData, refetch } =
        useCustomers(filters);
    const {
        data: groups,
        isLoading: groupsLoading,
        isError: groupsError,
    } = useCustomerGroups();
    const {
        data: tags,
        isLoading: tagsLoading,
        isError: tagsError,
    } = useCustomerTags();

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
    const currentPage = visibleData?.items ?? [];
    const currentIds = currentPage.map((customer) => customer.id);
    const selectedOnPage = currentIds.filter((id) => selectedIds.has(id));
    const canAct = !loading && !isError && !isPlaceholderData;
    const validBulkGroup = groups?.some(
        (group) => String(group.id) === bulkGroupId,
    );

    const exportCurrentPage = () => {
        if (!canAct || currentPage.length === 0) return;
        const csv = buildV18CustomerCsv(currentPage);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'klienci-v18-strona-' + query.page + '.csv';
        link.click();
        // Safari needs time to begin the download before releasing its blob.
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    const assignSelectedToGroup = async () => {
        if (!canAct || !validBulkGroup || selectedOnPage.length === 0) return;
        try {
            await addToGroup.mutateAsync({
                groupId: Number(bulkGroupId),
                customerIds: selectedOnPage,
            });
            setSelectedIds(new Set());
            setBulkGroupId('');
        } catch {
            // The existing mutation hook presents the error toast.
        }
    };

    const newsletterForSelected = () => {
        if (!canAct || selectedOnPage.length === 0) return;
        void router.push(
            '/newsletters/new?customerIds=' + selectedOnPage.join(','),
        );
    };

    return (
        <div
            className={foundation.foundation}
            data-testid="v18-customers-pilot"
        >
            <div className={foundation.layout}>
                <nav
                    className={foundation.rail}
                    aria-label="Nawigacja Studio V18"
                >
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
                        <Squares2X2Icon
                            width={23}
                            height={23}
                            aria-hidden="true"
                        />
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
                        className={[
                            foundation.railLink,
                            foundation.railActive,
                        ].join(' ')}
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
                        <span className={foundation.heroTag}>
                            Pilotaż · DEV
                        </span>
                    </header>

                    <div className={styles.headerRow}>
                        <div>
                            <h2>Lista klientów</h2>
                            <p>
                                Dane z istniejącego CRM. Wszelkie zmiany
                                zapisują się w bazie środowiska DEV.
                            </p>
                        </div>
                        <div className={styles.headerActions}>
                            <button
                                type="button"
                                className={styles.secondaryLink}
                                onClick={() => setGroupManagerOpen(true)}
                            >
                                Zarządzaj grupami
                            </button>
                            <button
                                type="button"
                                className={styles.secondaryLink}
                                onClick={() => setTagCatalogOpen(true)}
                            >
                                Zarządzaj tagami
                            </button>
                            <Link
                                href="/studio-v18/customers/new"
                                className={styles.primaryButton}
                            >
                                Dodaj klienta
                            </Link>
                        </div>
                    </div>

                    <section
                        className={styles.panel}
                        aria-label="Klienci w CRM"
                    >
                        <div className={styles.filters}>
                            <V18CustomerToolbar
                                query={query}
                                onAction={updateQuery}
                            />
                            <label className={list.field}>
                                <span>Grupa klientów</span>
                                <V18Select
                                    ariaLabel="Grupa klientów"
                                    value={String(query.groupId ?? '')}
                                    disabled={groupsLoading || groupsError}
                                    onChange={(value) => {
                                        const groupId = Number(value);
                                        updateQuery({
                                            type: 'group',
                                            groupId:
                                                groupId > 0
                                                    ? groupId
                                                    : undefined,
                                        });
                                    }}
                                    options={[
                                        {
                                            value: '',
                                            label: 'Wszystkie grupy',
                                        },
                                        ...(groups?.map((group) => ({
                                            value: String(group.id),
                                            label: group.name,
                                        })) ?? []),
                                    ]}
                                />
                            </label>
                            <label className={list.field}>
                                <span>Tag klienta</span>
                                <V18Select
                                    ariaLabel="Tag klienta"
                                    value={String(query.tagId ?? '')}
                                    disabled={tagsLoading || tagsError}
                                    onChange={(value) => {
                                        const tagId = Number(value);
                                        updateQuery({
                                            type: 'tag',
                                            tagId:
                                                tagId > 0 ? tagId : undefined,
                                        });
                                    }}
                                    options={[
                                        { value: '', label: 'Wszystkie tagi' },
                                        ...(tags?.map((tag) => ({
                                            value: String(tag.id),
                                            label: tag.name,
                                        })) ?? []),
                                    ]}
                                />
                            </label>
                        </div>
                        <V18CustomerQuickFilters
                            active={query.quickFilter}
                            onAction={updateQuery}
                        />
                        <V18CustomerAdvancedFilters
                            query={query}
                            onAction={updateQuery}
                        />
                        {tagsError ? (
                            <p role="status" className={styles.groupError}>
                                Nie udało się pobrać tagów. Możesz nadal
                                korzystać z pozostałych filtrów.
                            </p>
                        ) : null}
                        {groupsError ? (
                            <p role="status" className={styles.groupError}>
                                Nie udało się pobrać grup. Lista klientów nadal
                                może być używana bez filtrowania grupowego.
                            </p>
                        ) : null}
                        <div className={styles.selectionActions}>
                            <span>
                                Eksport obejmuje tylko aktualną stronę wyników (
                                {currentPage.length} rekordów).
                            </span>
                            <button
                                type="button"
                                className={styles.secondaryLink}
                                disabled={!canAct || currentPage.length === 0}
                                onClick={exportCurrentPage}
                            >
                                Eksportuj stronę CSV
                            </button>
                        </div>
                        {selectedOnPage.length > 0 ? (
                            <div
                                className={styles.bulkBar}
                                aria-label="Operacje grupowe na bieżącej stronie"
                            >
                                <strong>
                                    Zaznaczono: {selectedOnPage.length} z{' '}
                                    {currentPage.length} na stronie
                                </strong>
                                <div className={styles.bulkActions}>
                                    <div className={styles.bulkSelectContainer}>
                                        <V18Select
                                            ariaLabel="Wybierz grupę do przypisania"
                                            value={bulkGroupId}
                                            disabled={
                                                !canAct ||
                                                groupsLoading ||
                                                groupsError ||
                                                addToGroup.isPending
                                            }
                                            onChange={setBulkGroupId}
                                            options={[
                                                {
                                                    value: '',
                                                    label: 'Dodaj do grupy…',
                                                },
                                                ...(groups?.map((group) => ({
                                                    value: String(group.id),
                                                    label: group.name,
                                                })) ?? []),
                                            ]}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        className={styles.secondaryLink}
                                        disabled={
                                            !canAct ||
                                            !validBulkGroup ||
                                            addToGroup.isPending
                                        }
                                        onClick={() =>
                                            void assignSelectedToGroup()
                                        }
                                    >
                                        {addToGroup.isPending
                                            ? 'Przypisywanie…'
                                            : 'Dodaj do grupy'}
                                    </button>
                                    <button
                                        type="button"
                                        className={styles.secondaryLink}
                                        disabled={!canAct}
                                        onClick={() =>
                                            setGroupManagerOpen(true)
                                        }
                                    >
                                        Nowa grupa z zaznaczonych
                                    </button>
                                    <button
                                        type="button"
                                        className={styles.secondaryLink}
                                        disabled={!canAct}
                                        onClick={newsletterForSelected}
                                    >
                                        Newsletter
                                    </button>
                                    <button
                                        type="button"
                                        className={styles.secondaryLink}
                                        onClick={() => {
                                            setSelectedIds(new Set());
                                            setBulkGroupId('');
                                        }}
                                    >
                                        Odznacz wszystkich
                                    </button>
                                </div>
                            </div>
                        ) : null}
                        <V18CustomerTable
                            query={query}
                            data={visibleData}
                            loading={loading}
                            error={isError}
                            onRetry={() => void refetch()}
                            onSort={(field) =>
                                updateQuery({ type: 'sort', field })
                            }
                            onPageChange={(value, totalPages) =>
                                updateQuery({ type: 'page', value, totalPages })
                            }
                            selectedIds={selectedIds}
                            onToggleSelect={(id) => {
                                if (!canAct || !currentIds.includes(id)) return;
                                setSelectedIds((previous) => {
                                    const next = new Set(previous);
                                    if (next.has(id)) next.delete(id);
                                    else next.add(id);
                                    return next;
                                });
                            }}
                            onToggleSelectPage={(ids) => {
                                if (!canAct) return;
                                const checkedIds = ids.filter((id) =>
                                    currentIds.includes(id),
                                );
                                const allSelected = checkedIds.every((id) =>
                                    selectedIds.has(id),
                                );
                                setSelectedIds(
                                    new Set(allSelected ? [] : checkedIds),
                                );
                            }}
                            onEdit={(id) => setEditCustomerId(id)}
                            onBook={(id, name) =>
                                setBookingCustomer({ id, name })
                            }
                            onManageTags={(id, name) =>
                                setTagCustomer({ id, name })
                            }
                        />
                    </section>

                </main>
            </div>
            {groupManagerOpen ? (
                <V18CustomerGroupsManager
                    selectedCustomerIds={canAct ? selectedOnPage : []}
                    onClose={() => setGroupManagerOpen(false)}
                    onGroupDeleted={(id) => {
                        if (query.groupId === id) {
                            updateQuery({
                                type: 'group',
                                groupId: undefined,
                            });
                        }
                    }}
                    onChanged={() => {
                        setSelectedIds(new Set());
                        setBulkGroupId('');
                        void refetch();
                    }}
                />
            ) : null}
            {tagCatalogOpen ? (
                <V18CustomerTagCatalog
                    onClose={() => setTagCatalogOpen(false)}
                />
            ) : null}
            {bookingCustomer ? (
                <V18CustomerBooking
                    key={bookingCustomer.id}
                    customerId={bookingCustomer.id}
                    customerName={bookingCustomer.name}
                    onClose={() => setBookingCustomer(null)}
                    onSaved={() => void refetch()}
                />
            ) : null}
            {tagCustomer ? (
                <V18CustomerTagManager
                    key={tagCustomer.id}
                    customerId={tagCustomer.id}
                    customerName={tagCustomer.name}
                    onClose={() => setTagCustomer(null)}
                    onChanged={() => {
                        setSelectedIds(new Set());
                        void refetch();
                    }}
                />
            ) : null}
            <V18EditCustomerModal
                open={editCustomerId !== null}
                customerId={editCustomerId}
                onClose={() => setEditCustomerId(null)}
                onSuccess={() => setEditCustomerId(null)}
                onDeleted={() => {
                    setEditCustomerId(null);
                    setSelectedIds(new Set());
                }}
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
