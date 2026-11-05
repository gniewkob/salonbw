import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { useMemo, useReducer, useState } from 'react';
import {
    ArrowLeftIcon,
    BeakerIcon,
    Squares2X2Icon,
    UsersIcon,
} from '@heroicons/react/24/outline';
import RouteGuard from '@/components/RouteGuard';
import V18CustomerTable from '@/components/v18/V18CustomerTable';
import V18CustomerToolbar from '@/components/v18/V18CustomerToolbar';
import type { Customer, PaginatedCustomers } from '@/types';
import {
    initialV18CustomerQuery,
    reduceV18CustomerQuery,
} from '@/utils/v18CustomerQuery';
import foundation from '@/styles/V18Foundation.module.css';
import styles from '@/styles/V18CustomersList.module.css';

// This entire route is a synthetic UI fixture. The production Customers pilot
// must use useCustomers(filters), keeping sort, search and pagination server-side.
const syntheticCustomers: Customer[] = Array.from({ length: 63 }, (_, index) => {
    const position = index + 1;
    const ordinal = String(position).padStart(2, '0');
    return {
        id: 90000 + position,
        name: 'Klient testowy ' + ordinal,
        email: 'demo' + ordinal + '@example.invalid',
        smsConsent: false,
        emailConsent: false,
        gdprConsent: false,
        createdAt: new Date(Date.UTC(2026, 0, position)).toISOString(),
        updatedAt: new Date(Date.UTC(2026, 0, position)).toISOString(),
        lastVisitDate: position % 3 === 0
            ? null
            : new Date(Date.UTC(2026, 1, position)).toISOString(),
    };
});

export function V18CustomerListLab() {
    const [query, dispatch] = useReducer(
        reduceV18CustomerQuery,
        initialV18CustomerQuery,
    );
    const [notice, setNotice] = useState('');

    const data: PaginatedCustomers = useMemo(() => {
        const search = query.search.trim().toLocaleLowerCase('pl-PL');
        const matching = syntheticCustomers
            .filter((customer) =>
                (customer.name + ' ' + customer.email)
                    .toLocaleLowerCase('pl-PL')
                    .includes(search),
            )
            // Sort the complete synthetic fixture before taking one page.
            // V18CustomerTable itself never sorts a partial server response.
            .sort((left, right) => {
                const a = left[query.sortBy] ?? '';
                const b = right[query.sortBy] ?? '';
                const comparison = String(a).localeCompare(
                    String(b),
                    'pl-PL',
                );
                return query.sortOrder === 'ASC' ? comparison : -comparison;
            });
        const total = matching.length;
        const start = (query.page - 1) * query.pageSize;
        return {
            items: matching.slice(start, start + query.pageSize),
            total,
            page: query.page,
            limit: query.pageSize,
            totalPages: Math.ceil(total / query.pageSize),
        };
    }, [query]);

    return (
        <div className={foundation.foundation} data-testid="v18-customer-list-lab">
            <div className={foundation.layout}>
                <nav className={foundation.rail} aria-label="Nawigacja Studio V18">
                    <Link href="/studio-v18" className={foundation.railBrand} aria-label="Dashboard V18">
                        B<span>/</span>W
                    </Link>
                    <Link href="/studio-v18" className={foundation.railLink} aria-label="Dashboard">
                        <Squares2X2Icon width={23} height={23} aria-hidden="true" />
                    </Link>
                    <Link href="/studio-v18/components" className={foundation.railLink} aria-label="Biblioteka komponentów">
                        <BeakerIcon width={23} height={23} aria-hidden="true" />
                    </Link>
                    <Link
                        href="/studio-v18/customer-list-lab"
                        className={[foundation.railLink, foundation.railActive].join(' ')}
                        aria-label="Lista klientów — demonstracja"
                        aria-current="page"
                    >
                        <UsersIcon width={23} height={23} aria-hidden="true" />
                    </Link>
                </nav>
                <main className={foundation.surface} id="main-content">
                    <div className={foundation.breadcrumbs}>
                        <Link href="/studio-v18">Studio V18</Link>
                        <span aria-hidden="true">/</span>
                        <Link href="/studio-v18/components">Biblioteka komponentów</Link>
                        <span aria-hidden="true">/</span>
                        <span>Klienci — demonstracja</span>
                    </div>
                    <header className={foundation.hero}>
                        <div className={foundation.heroText}>
                            <span className={foundation.eyebrow}>
                                Salon Black &amp; White · Design System
                            </span>
                            <h1>Lista klientów V18</h1>
                            <p>
                                Interaktywny prototyp tabeli, sortowania i paginacji.
                                Wyłącznie dane syntetyczne. Nie pobiera klientów
                                z API i nie pozwala na modyfikację danych.
                            </p>
                        </div>
                        <span className={foundation.heroTag}>Laboratorium · DEV</span>
                    </header>
                    <div className={foundation.topbar}>
                        <div>
                            <h2>Komponenty listy klientów</h2>
                            <p>
                                Operacje na demonstracyjnych 63 rekordach.
                                Docelowa lista użyje sortowania i filtrowania API.
                            </p>
                        </div>
                        <Link href="/studio-v18/components" className={styles.back}>
                            <ArrowLeftIcon width={18} height={18} aria-hidden="true" />
                            Powrót do katalogu
                        </Link>
                    </div>
                    <section className={styles.labPanel} aria-label="Interaktywny przykład klientów">
                        <V18CustomerToolbar query={query} onAction={dispatch} />
                        <V18CustomerTable
                            query={query}
                            data={data}
                            demoMode
                            onSort={(field) => dispatch({ type: 'sort', field })}
                            onPageChange={(value, totalPages) =>
                                dispatch({ type: 'page', value, totalPages })
                            }
                            onEdit={() =>
                                setNotice('Edycja jest dostępna w rzeczywistym module Klienci.')
                            }
                        />
                        {notice ? <p role="status" className={styles.labNotice}>{notice}</p> : null}
                    </section>
                    <p className={styles.labFootnote}>
                        <strong>Ważne:</strong> to demonstracja interfejsu, nie alternatywny CRM.
                        Wszystkie operacje na prawdziwych klientach pozostają w{' '}
                        <Link href="/customers">obecnym module Klienci</Link>.
                    </p>
                </main>
            </div>
        </div>
    );
}

export default function StudioV18CustomerListLabPage() {
    return (
        <RouteGuard roles={['admin']}>
            <Head>
                <title>Lista klientów V18 — laboratorium SalonBW</title>
                <meta name="robots" content="noindex,nofollow" />
            </Head>
            <V18CustomerListLab />
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
