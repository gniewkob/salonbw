import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { GetServerSideProps } from 'next';
import { useMemo } from 'react';
import {
    ArrowLeftIcon,
    ArrowRightIcon,
    CalendarDaysIcon,
    ChartBarIcon,
    ClockIcon,
    CubeIcon,
    ExclamationTriangleIcon,
    HomeIcon,
    PlusIcon,
    UsersIcon,
} from '@heroicons/react/24/outline';
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
} from 'recharts';
import RouteGuard from '@/components/RouteGuard';
import { useDashboard } from '@/hooks/useDashboard';
import { useDashboardStats } from '@/hooks/useStatistics';
import { useStockSummary } from '@/hooks/useStockAlerts';
import styles from '@/styles/StudioPreview.module.css';

type Variant = 'light' | 'atelier';

const numberFormatter = new Intl.NumberFormat('pl-PL');
const moneyFormatter = new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    maximumFractionDigits: 0,
});

function displayNumber(value: number | null | undefined): string {
    return value == null ? '—' : numberFormatter.format(value);
}

function displayMoney(value: number | null | undefined): string {
    return value == null ? '—' : moneyFormatter.format(value);
}

function displayTime(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? '—'
        : date.toLocaleTimeString('pl-PL', {
              hour: '2-digit',
              minute: '2-digit',
          });
}

const navigation = [
    { href: '/dashboard', label: 'Pulpit', Icon: HomeIcon },
    { href: '/calendar', label: 'Kalendarz', Icon: CalendarDaysIcon },
    { href: '/customers', label: 'Klienci', Icon: UsersIcon },
    { href: '/statistics', label: 'Statystyki', Icon: ChartBarIcon },
    { href: '/products', label: 'Magazyn', Icon: CubeIcon },
];

function StudioDashboard() {
    const router = useRouter();
    const variant: Variant =
        router.query.variant === 'atelier' ? 'atelier' : 'light';
    const {
        data: stats,
        isLoading: statsLoading,
        isError: statsError,
    } = useDashboardStats();
    const { data: dashboard, loading: dashboardLoading } = useDashboard();
    const { data: stock, isError: stockError } = useStockSummary();

    const revenueSeries = useMemo(
        () =>
            (stats?.monthDailyRevenue ?? []).map((point) => ({
                day: point.date.slice(8),
                amount: point.totalRevenue,
            })),
        [stats?.monthDailyRevenue],
    );

    const upcoming = useMemo(
        () =>
            (dashboard?.upcomingAppointments ?? [])
                .filter((appointment) => {
                    const date = new Date(appointment.startTime).getTime();
                    return Number.isFinite(date) && date >= Date.now();
                })
                .sort(
                    (a, b) =>
                        new Date(a.startTime).getTime() -
                        new Date(b.startTime).getTime(),
                )
                .slice(0, 5),
        [dashboard?.upcomingAppointments],
    );

    const stockProblems = stock
        ? (stock.lowStockCount ?? 0) + (stock.outOfStockCount ?? 0)
        : null;
    const loading = statsLoading || dashboardLoading;
    const chartColor = variant === 'light' ? '#6478d8' : '#b38c61';
    const today = new Date().toLocaleDateString('pl-PL', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    });

    const cards = [
        {
            title: 'Dzisiejsze wizyty',
            value: displayNumber(stats?.todayAppointments),
            caption: 'Wizyty zaplanowane na dziś',
            Icon: CalendarDaysIcon,
        },
        {
            title: 'Dzisiejszy przychód',
            value: displayMoney(stats?.todayRevenue),
            caption: 'Według statystyk salonu',
            Icon: ChartBarIcon,
        },
        {
            title: 'Nowi klienci',
            value: displayNumber(stats?.todayNewClients),
            caption: 'Pozyskani dzisiaj',
            Icon: UsersIcon,
        },
    ];

    return (
        <div
            className={
                styles.app +
                ' ' +
                (variant === 'light' ? styles.light : styles.atelier)
            }
            data-testid="studio-preview"
            data-variant={variant}
        >
            <Head>
                <title>Studio Design Lab — Salon Black &amp; White</title>
                <meta name="robots" content="noindex,nofollow" />
            </Head>

            <aside className={styles.rail} aria-label="Nawigacja aplikacji">
                <div className={styles.monogram} aria-label="Black and White">
                    B<span>&amp;</span>W
                </div>
                <nav className={styles.railNav} aria-label="Główne moduły">
                    {navigation.map(({ href, label, Icon }) => (
                        <Link
                            key={href}
                            href={href}
                            title={label}
                            aria-label={label}
                            className={styles.railLink}
                        >
                            <Icon width={21} height={21} aria-hidden="true" />
                            <span>{label}</span>
                        </Link>
                    ))}
                </nav>
                <div className={styles.railBottom}>
                    <span className={styles.railEnvironment}>DEV</span>
                </div>
            </aside>

            <div className={styles.workspace}>
                <header className={styles.topbar}>
                    <div className={styles.breadcrumb}>
                        <strong>SALON BLACK &amp; WHITE</strong>
                        <span> / </span>
                        <span>Studio Design Lab</span>
                    </div>
                    <div className={styles.topActions}>
                        <span className={styles.devFlag}>Podgląd · DEV</span>
                        <Link href="/dashboard" className={styles.backLink}>
                            <ArrowLeftIcon
                                width={16}
                                height={16}
                                aria-hidden="true"
                            />
                            Obecny pulpit
                        </Link>
                    </div>
                </header>

                <main className={styles.content} id="main-content">
                    <section
                        className={styles.switcher}
                        aria-label="Warianty projektowe"
                    >
                        <div>
                            <span className={styles.overline}>
                                SalonBW / Panel 2.0
                            </span>
                            <p>
                                Porównaj dwa kierunki interfejsu. Dane pochodzą
                                z istniejącego API.
                            </p>
                        </div>
                        <div className={styles.switchButtons}>
                            <Link
                                href="/studio-preview?variant=light"
                                className={
                                    styles.switchButton +
                                    (variant === 'light'
                                        ? ' ' + styles.switchActive
                                        : '')
                                }
                                aria-current={
                                    variant === 'light' ? 'page' : undefined
                                }
                            >
                                01 · Light Concept
                            </Link>
                            <Link
                                href="/studio-preview?variant=atelier"
                                className={
                                    styles.switchButton +
                                    (variant === 'atelier'
                                        ? ' ' + styles.switchActive
                                        : '')
                                }
                                aria-current={
                                    variant === 'atelier' ? 'page' : undefined
                                }
                            >
                                02 · BW Atelier
                            </Link>
                            <Link
                                href="/studio-v18"
                                className={styles.switchButton}
                            >
                                03 · V18 Reference
                            </Link>
                        </div>
                    </section>

                    {variant === 'light' ? (
                        <section className={styles.heroLight}>
                            <div>
                                <span className={styles.heroOverline}>
                                    PULPIT OPERACYJNY
                                </span>
                                <h1>Dzień dobry w Black &amp; White.</h1>
                                <p>
                                    Wizyty, klienci i wyniki w jednym spokojnym
                                    miejscu.
                                </p>
                                <div className={styles.heroActions}>
                                    <Link
                                        href="/calendar?new=1"
                                        className={styles.primaryAction}
                                    >
                                        <PlusIcon
                                            width={18}
                                            height={18}
                                            aria-hidden="true"
                                        />
                                        Nowa wizyta
                                    </Link>
                                    <Link
                                        href="/calendar"
                                        className={styles.secondaryAction}
                                    >
                                        Otwórz kalendarz
                                        <ArrowRightIcon
                                            width={16}
                                            height={16}
                                            aria-hidden="true"
                                        />
                                    </Link>
                                </div>
                            </div>
                            <div className={styles.heroDate}>
                                <span>Dzisiaj</span>
                                <strong>{today}</strong>
                                <span>
                                    {loading
                                        ? 'Trwa synchronizacja danych…'
                                        : statsError
                                          ? 'Nie można wczytać statystyk'
                                          : 'Przegląd działalności salonu'}
                                </span>
                            </div>
                        </section>
                    ) : (
                        <section className={styles.heroAtelier}>
                            <div>
                                <span className={styles.heroOverline}>
                                    BLACK &amp; WHITE · MANAGEMENT STUDIO
                                </span>
                                <h1>Przestrzeń do prowadzenia salonu.</h1>
                                <p>
                                    Najważniejsze informacje, bez zbędnego
                                    szumu.
                                </p>
                                <Link
                                    href="/calendar?new=1"
                                    className={styles.primaryAction}
                                >
                                    <PlusIcon
                                        width={18}
                                        height={18}
                                        aria-hidden="true"
                                    />
                                    Zaplanuj wizytę
                                </Link>
                            </div>
                            <div className={styles.heroDate}>
                                <span>Plan na dziś</span>
                                <strong>
                                    {displayNumber(stats?.todayAppointments)}
                                </strong>
                                <span>wizyt · {today}</span>
                            </div>
                        </section>
                    )}

                    <div className={styles.sectionHeading}>
                        <div>
                            <span className={styles.overline}>
                                01 / Puls salonu
                            </span>
                            <h2>Przegląd dnia</h2>
                        </div>
                        <span className={styles.dataStatus} role="status">
                            {statsError
                                ? 'Błąd pobierania statystyk'
                                : statsLoading
                                  ? 'Ładowanie danych…'
                                  : 'Dane z API'}
                        </span>
                    </div>

                    <section
                        className={styles.kpiGrid}
                        aria-label="Kluczowe wskaźniki"
                    >
                        {cards.map(({ title, value, caption, Icon }, index) => (
                            <article key={title} className={styles.kpiCard}>
                                <div className={styles.kpiTop}>
                                    <span>{title}</span>
                                    <span className={styles.kpiIcon}>
                                        <Icon
                                            width={19}
                                            height={19}
                                            aria-hidden="true"
                                        />
                                    </span>
                                </div>
                                <strong
                                    className={styles.kpiValue}
                                    data-testid={'studio-kpi-' + index}
                                >
                                    {value}
                                </strong>
                                <span className={styles.kpiCaption}>
                                    {caption}
                                </span>
                            </article>
                        ))}
                    </section>

                    <section
                        className={styles.dashboardGrid}
                        aria-label="Informacje operacyjne"
                    >
                        <article className={styles.chartPanel}>
                            <div className={styles.panelHeading}>
                                <div>
                                    <span className={styles.overline}>
                                        02 / Analiza
                                    </span>
                                    <h2>Przychód w tym miesiącu</h2>
                                </div>
                                <Link
                                    href="/statistics"
                                    className={styles.inlineLink}
                                >
                                    Statystyki
                                    <ArrowRightIcon
                                        width={15}
                                        height={15}
                                        aria-hidden="true"
                                    />
                                </Link>
                            </div>
                            {revenueSeries.length > 0 ? (
                                <div
                                    className={styles.chart}
                                    role="img"
                                    aria-label="Wykres dziennego przychodu w bieżącym miesiącu"
                                >
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <AreaChart
                                            data={revenueSeries}
                                            margin={{
                                                top: 18,
                                                right: 4,
                                                bottom: 0,
                                                left: 4,
                                            }}
                                        >
                                            <defs>
                                                <linearGradient
                                                    id={
                                                        'studioRevenue-' +
                                                        variant
                                                    }
                                                    x1="0"
                                                    y1="0"
                                                    x2="0"
                                                    y2="1"
                                                >
                                                    <stop
                                                        offset="0%"
                                                        stopColor={chartColor}
                                                        stopOpacity={0.24}
                                                    />
                                                    <stop
                                                        offset="100%"
                                                        stopColor={chartColor}
                                                        stopOpacity={0.01}
                                                    />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid
                                                strokeDasharray="3 7"
                                                vertical={false}
                                                stroke="#dedee2"
                                            />
                                            <XAxis
                                                dataKey="day"
                                                tickLine={false}
                                                axisLine={false}
                                                tick={{
                                                    fontSize: 11,
                                                    fill: '#85858a',
                                                }}
                                            />
                                            <Tooltip
                                                formatter={(value) =>
                                                    displayMoney(
                                                        typeof value ===
                                                            'number'
                                                            ? value
                                                            : Number(value),
                                                    )
                                                }
                                                labelFormatter={(label) =>
                                                    'Dzień miesiąca: ' +
                                                    String(label)
                                                }
                                            />
                                            <Area
                                                dataKey="amount"
                                                type="monotone"
                                                fill={
                                                    'url(#studioRevenue-' +
                                                    variant +
                                                    ')'
                                                }
                                                stroke={chartColor}
                                                strokeWidth={2.5}
                                                isAnimationActive={false}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div
                                    className={styles.chartEmpty}
                                    role="status"
                                >
                                    {statsLoading
                                        ? 'Ładowanie wykresu…'
                                        : 'Brak danych o przychodzie za ten miesiąc.'}
                                </div>
                            )}
                        </article>

                        <article className={styles.visitsPanel}>
                            <div className={styles.panelHeading}>
                                <div>
                                    <span className={styles.overline}>
                                        03 / Kalendarz
                                    </span>
                                    <h2>Najbliższe wizyty</h2>
                                </div>
                                <Link
                                    href="/calendar"
                                    className={styles.inlineLink}
                                >
                                    Wszystkie
                                    <ArrowRightIcon
                                        width={15}
                                        height={15}
                                        aria-hidden="true"
                                    />
                                </Link>
                            </div>
                            {upcoming.length === 0 ? (
                                <div className={styles.emptyVisits}>
                                    <ClockIcon
                                        width={25}
                                        height={25}
                                        aria-hidden="true"
                                    />
                                    <p>
                                        {dashboardLoading
                                            ? 'Ładowanie wizyt…'
                                            : 'Brak nadchodzących wizyt w dostępnych danych.'}
                                    </p>
                                </div>
                            ) : (
                                <div className={styles.visitsList}>
                                    {upcoming.map((appointment) => (
                                        <div
                                            className={styles.visit}
                                            key={appointment.id}
                                        >
                                            <time
                                                dateTime={appointment.startTime}
                                                className={styles.visitTime}
                                            >
                                                {displayTime(
                                                    appointment.startTime,
                                                )}
                                            </time>
                                            <div className={styles.visitDetail}>
                                                <strong>
                                                    {appointment.clientName ||
                                                        'Klient'}
                                                </strong>
                                                <span>
                                                    {appointment.serviceName}
                                                </span>
                                            </div>
                                            <span
                                                className={styles.visitStatus}
                                            >
                                                {appointment.status ===
                                                'online_pending'
                                                    ? 'Do potwierdzenia'
                                                    : appointment.status ===
                                                        'in_progress'
                                                      ? 'W trakcie'
                                                      : 'Wizyta'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </article>
                    </section>

                    <section
                        className={styles.footerStrip}
                        aria-label="Powiadomienia i szybkie akcje"
                    >
                        <div className={styles.stockInfo}>
                            <span className={styles.stockIcon}>
                                <ExclamationTriangleIcon
                                    width={19}
                                    height={19}
                                    aria-hidden="true"
                                />
                            </span>
                            <div>
                                <strong>Kontrola magazynu</strong>
                                <span>
                                    {stockError
                                        ? 'Nie można pobrać stanów magazynowych'
                                        : stockProblems == null
                                          ? 'Ładowanie stanów magazynowych…'
                                          : stockProblems > 0
                                            ? displayNumber(stockProblems) +
                                              ' pozycji wymaga uwagi'
                                            : 'Brak alarmów magazynowych'}
                                </span>
                            </div>
                        </div>
                        <div className={styles.footerActions}>
                            <Link href="/customers/new">Dodaj klienta</Link>
                            <Link href="/calendar">
                                Zarządzaj wizytami{' '}
                                <ArrowRightIcon
                                    width={15}
                                    height={15}
                                    aria-hidden="true"
                                />
                            </Link>
                        </div>
                    </section>
                    <p className={styles.disclaimer}>
                        Podgląd stylistyczny na środowisku DEV. Nie zastępuje
                        obecnego panelu ani nie zmienia danych. Wartości
                        pochodzą wyłącznie z istniejących endpointów SalonBW.
                    </p>
                </main>
            </div>
        </div>
    );
}

export default function StudioPreviewPage() {
    return (
        <RouteGuard roles={['admin']}>
            <StudioDashboard />
        </RouteGuard>
    );
}

// A second server-side barrier: this concept is not routable from production,
// even if the route is included in the production bundle.
export const getServerSideProps: GetServerSideProps = async ({ req }) => {
    const host = (req.headers.host ?? '').split(':')[0].toLowerCase();
    const developmentMode =
        process.env.NEXT_PUBLIC_DEPLOYMENT_ENV === 'development' ||
        process.env.NODE_ENV === 'development';
    const allowedHost = [
        'dev-panel.salon-bw.pl',
        'localhost',
        '127.0.0.1',
    ].includes(host);

    if (!developmentMode || !allowedHost) {
        return { notFound: true };
    }
    return { props: {} };
};
