import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { useMemo, useState } from 'react';
import {
    ArrowLeftIcon,
    BeakerIcon,
    Squares2X2Icon,
} from '@heroicons/react/24/outline';
import RouteGuard from '@/components/RouteGuard';
import PanelButton from '@/components/ui/PanelButton';
import PanelTable from '@/components/ui/PanelTable';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';
import styles from '@/styles/V18Foundation.module.css';

type DemoCustomer = {
    id: string;
    name: string;
    service: string;
    visits: number;
    status: 'active' | 'pending';
};

const demoCustomers: DemoCustomer[] = [
    {
        id: 'demo-1',
        name: 'Anna Przykład',
        service: 'Strzyżenie i stylizacja',
        visits: 8,
        status: 'active',
    },
    {
        id: 'demo-2',
        name: 'Ola Demo',
        service: 'Koloryzacja',
        visits: 3,
        status: 'pending',
    },
    {
        id: 'demo-3',
        name: 'Maja Testowa',
        service: 'Pielęgnacja włosów',
        visits: 12,
        status: 'active',
    },
];

export function V18ComponentsCatalog() {
    const [actionDone, setActionDone] = useState(false);
    const [query, setQuery] = useState('');
    const visibleCustomers = useMemo(
        () =>
            demoCustomers.filter((customer) =>
                (customer.name + ' ' + customer.service)
                    .toLocaleLowerCase('pl-PL')
                    .includes(query.trim().toLocaleLowerCase('pl-PL')),
            ),
        [query],
    );

    return (
        <div className={styles.foundation} data-testid="v18-component-catalog">
            <div className={styles.layout}>
                <nav className={styles.rail} aria-label="Nawigacja Studio V18">
                    <Link
                        href="/studio-v18"
                        className={styles.railBrand}
                        aria-label="Wróć do Studio V18"
                    >
                        B<span>/</span>W
                    </Link>
                    <Link
                        href="/studio-v18"
                        className={styles.railLink}
                        aria-label="Dashboard V18"
                        title="Dashboard V18"
                    >
                        <Squares2X2Icon
                            width={23}
                            height={23}
                            aria-hidden="true"
                        />
                    </Link>
                    <Link
                        href="/studio-v18/components"
                        className={[styles.railLink, styles.railActive].join(
                            ' ',
                        )}
                        aria-label="Biblioteka komponentów"
                        title="Biblioteka komponentów"
                        aria-current="page"
                    >
                        <BeakerIcon width={23} height={23} aria-hidden="true" />
                    </Link>
                </nav>

                <main className={styles.surface} id="main-content">
                    <div className={styles.breadcrumbs}>
                        <Link href="/studio-v18">Studio V18</Link>
                        <span aria-hidden="true">/</span>
                        <span>Biblioteka komponentów</span>
                    </div>

                    <header className={styles.hero}>
                        <div className={styles.heroText}>
                            <span className={styles.eyebrow}>
                                Salon Black &amp; White · Design System
                            </span>
                            <h1>Biblioteka komponentów V18</h1>
                            <p>
                                Pierwsze, rzeczywiste elementy wspólnego
                                interfejsu SalonBW. Testujemy funkcjonalność,
                                dostępność i wygląd przed migracją ekranów
                                operacyjnych.
                            </p>
                        </div>
                        <span className={styles.heroTag}>
                            Foundation · wersja robocza
                        </span>
                    </header>

                    <div className={styles.topbar}>
                        <div>
                            <h2>Elementy interfejsu</h2>
                            <p>
                                Korzystamy z istniejących komponentów panelu.
                                Bez danych klientów i bez zapisu do API.
                            </p>
                        </div>
                        <PanelButton
                            href="/studio-v18/customer-list-lab"
                            variant="primary"
                        >
                            Lista klientów V18 · demo
                        </PanelButton>
                        <PanelButton
                            href="/studio-v18"
                            variant="secondary"
                            icon={
                                <ArrowLeftIcon
                                    width={16}
                                    height={16}
                                    aria-hidden="true"
                                />
                            }
                        >
                            Powrót do V18
                        </PanelButton>
                    </div>

                    <div className={styles.grid}>
                        <section
                            className={styles.card}
                            aria-labelledby="v18-buttons-title"
                        >
                            <div className={styles.cardHeader}>
                                <h3 id="v18-buttons-title">
                                    Akcje i przyciski
                                </h3>
                                <small>PanelButton</small>
                            </div>
                            <div className={styles.stack}>
                                <PanelButton
                                    variant="primary"
                                    onClick={() => setActionDone(true)}
                                >
                                    Przetestuj działanie
                                </PanelButton>
                                <PanelButton
                                    variant="secondary"
                                    onClick={() => {
                                        setActionDone(false);
                                        setQuery('');
                                    }}
                                >
                                    Zresetuj przykład
                                </PanelButton>
                                <PanelButton
                                    variant="danger"
                                    onClick={() => setActionDone(false)}
                                >
                                    Cofnij stan
                                </PanelButton>
                                <PanelButton variant="ghost" disabled>
                                    Nieaktywne
                                </PanelButton>
                            </div>
                            {actionDone ? (
                                <p className={styles.feedback} role="status">
                                    Przykładowa akcja wykonana
                                </p>
                            ) : (
                                <p className={styles.sectionNote}>
                                    Kliknięcie uruchamia wyłącznie lokalną
                                    interakcję demonstracyjną.
                                </p>
                            )}
                        </section>

                        <section
                            className={styles.card}
                            aria-labelledby="v18-badges-title"
                        >
                            <div className={styles.cardHeader}>
                                <h3 id="v18-badges-title">
                                    Statusy i komunikaty
                                </h3>
                                <small>StatusBadge</small>
                            </div>
                            <div className={styles.stack}>
                                <StatusBadge tone="success">
                                    Potwierdzone
                                </StatusBadge>
                                <StatusBadge tone="info">
                                    W realizacji
                                </StatusBadge>
                                <StatusBadge tone="attention">
                                    Wymaga uwagi
                                </StatusBadge>
                                <StatusBadge tone="danger">Problem</StatusBadge>
                                <StatusBadge tone="neutral">
                                    Neutralne
                                </StatusBadge>
                            </div>
                            <p className={styles.sectionNote}>
                                Kolor jest wskazówką, ale status zawsze ma
                                również etykietę tekstową.
                            </p>
                        </section>

                        <section
                            className={[styles.card, styles.wide].join(' ')}
                            aria-labelledby="v18-table-title"
                        >
                            <div className={styles.cardHeader}>
                                <div>
                                    <h3 id="v18-table-title">
                                        Tabela i filtrowanie
                                    </h3>
                                    <small>
                                        PanelTable · dane demonstracyjne
                                    </small>
                                </div>
                                <div className={styles.search}>
                                    <label htmlFor="v18-demo-search">
                                        Filtruj przykładowe rekordy
                                    </label>
                                    <input
                                        id="v18-demo-search"
                                        type="search"
                                        value={query}
                                        placeholder="Nazwisko lub usługa"
                                        onChange={(event) =>
                                            setQuery(event.target.value)
                                        }
                                    />
                                </div>
                            </div>
                            <div className={styles.tableScroll}>
                                <PanelTable
                                    caption="Demonstracyjna tabela klientów"
                                    columns={[
                                        { label: 'Klient' },
                                        { label: 'Ostatnia usługa' },
                                        { label: 'Wizyty' },
                                        { label: 'Status' },
                                    ]}
                                    isEmpty={visibleCustomers.length === 0}
                                    emptyMessage="Brak danych testowych"
                                >
                                    {visibleCustomers.map((customer) => (
                                        <tr key={customer.id}>
                                            <td>
                                                <span
                                                    className={
                                                        styles.cellStrong
                                                    }
                                                >
                                                    {customer.name}
                                                </span>
                                                <span
                                                    className={styles.cellSub}
                                                >
                                                    Przykładowy profil
                                                </span>
                                            </td>
                                            <td>{customer.service}</td>
                                            <td>{customer.visits}</td>
                                            <td>
                                                <StatusBadge
                                                    tone={
                                                        customer.status ===
                                                        'active'
                                                            ? 'success'
                                                            : 'attention'
                                                    }
                                                >
                                                    {customer.status ===
                                                    'active'
                                                        ? 'Aktywny'
                                                        : 'Do potwierdzenia'}
                                                </StatusBadge>
                                            </td>
                                        </tr>
                                    ))}
                                </PanelTable>
                            </div>
                            <p className={styles.sectionNote}>
                                Dane wyłącznie demonstracyjne
                            </p>
                        </section>

                        <section
                            className={[styles.card, styles.narrow].join(' ')}
                            aria-labelledby="v18-empty-title"
                        >
                            <div className={styles.cardHeader}>
                                <h3 id="v18-empty-title">Pusty widok</h3>
                                <small>EmptyState</small>
                            </div>
                            <EmptyState
                                compact
                                title="Brak wyników"
                                description="W rzeczywistym module pokażemy możliwość zmiany filtrów."
                                action={
                                    <PanelButton
                                        variant="secondary"
                                        onClick={() => setQuery('')}
                                    >
                                        Wyczyść filtr
                                    </PanelButton>
                                }
                            />
                        </section>

                        <section
                            className={styles.card}
                            aria-labelledby="v18-loading-title"
                        >
                            <div className={styles.cardHeader}>
                                <h3 id="v18-loading-title">
                                    Ładowanie i błędy
                                </h3>
                                <small>Skeleton · komunikaty</small>
                            </div>
                            <div className={styles.stateGrid}>
                                <div className={styles.stateBox}>
                                    <strong>Przykład ładowania</strong>
                                    <div className={styles.loadingBars}>
                                        <Skeleton height={15} width="84%" />
                                        <Skeleton height={15} width="66%" />
                                        <Skeleton height={15} width="92%" />
                                    </div>
                                </div>
                                <div className={styles.stateBox}>
                                    <strong>Przykład błędu</strong>
                                    <StatusBadge tone="danger">
                                        Nie udało się pobrać danych
                                    </StatusBadge>
                                    <p className={styles.stateHint}>
                                        Rzeczywiste ekrany otrzymają przycisk
                                        ponowienia żądania.
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section
                            className={styles.card}
                            aria-labelledby="v18-fields-title"
                        >
                            <div className={styles.cardHeader}>
                                <h3 id="v18-fields-title">Pola formularzy</h3>
                                <small>Native input · lokalny stan</small>
                            </div>
                            <div className={styles.fieldSample}>
                                <div className={styles.search}>
                                    <label htmlFor="v18-name-sample">
                                        Przykładowa nazwa
                                    </label>
                                    <input
                                        id="v18-name-sample"
                                        type="text"
                                        placeholder="Wpisz wartość"
                                    />
                                </div>
                                <PanelButton
                                    variant="secondary"
                                    onClick={() =>
                                        document
                                            .getElementById('v18-name-sample')
                                            ?.focus()
                                    }
                                >
                                    Ustaw fokus
                                </PanelButton>
                            </div>
                            <p className={styles.sectionNote}>
                                To demonstracja pola, bez wysyłania formularza.
                            </p>
                        </section>
                    </div>

                    <footer className={styles.smallPrint}>
                        Studio V18 · katalog roboczy na DEV · istniejące
                        funkcjonalności SalonBW pozostają bez zmian.
                    </footer>
                </main>
            </div>
        </div>
    );
}

export default function StudioV18ComponentsPage() {
    return (
        <RouteGuard roles={['admin']}>
            <Head>
                <title>Komponenty V18 — Salon Black &amp; White</title>
                <meta name="robots" content="noindex,nofollow" />
            </Head>
            <V18ComponentsCatalog />
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
