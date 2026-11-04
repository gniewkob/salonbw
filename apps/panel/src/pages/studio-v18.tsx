import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { useMemo, useState } from 'react';
import {
    ArrowRightIcon,
    ArrowUpRightIcon,
    BookmarkIcon,
    CalendarDaysIcon,
    ChartBarIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ClockIcon,
    Cog6ToothIcon,
    CubeIcon,
    ExclamationTriangleIcon,
    HomeIcon,
    PlusIcon,
    Squares2X2Icon,
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
import { useEmployees } from '@/hooks/useEmployees';
import { useStockSummary } from '@/hooks/useStockAlerts';
import styles from '@/styles/StudioV18.module.css';

const formatNumber = new Intl.NumberFormat('pl-PL');
const formatCurrency = new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    maximumFractionDigits: 0,
});
const weekdayNames = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'];
const railLinks = [
    { href: '/dashboard', label: 'Pulpit', Icon: HomeIcon },
    { href: '/calendar', label: 'Kalendarz', Icon: CalendarDaysIcon },
    { href: '/customers', label: 'Klienci', Icon: UsersIcon },
    { href: '/statistics', label: 'Statystyki', Icon: ChartBarIcon },
    { href: '/products', label: 'Magazyn', Icon: CubeIcon },
];

const shortcuts = [
    {
        title: 'Kalendarz wizyt',
        description: 'Terminy i harmonogram pracy salonu',
        category: 'operacje',
        href: '/calendar',
        Icon: CalendarDaysIcon,
        color: 'violet',
    },
    {
        title: 'Baza klientów',
        description: 'Kontakty i historia wizyt',
        category: 'operacje',
        href: '/customers',
        Icon: UsersIcon,
        color: 'pink',
    },
    {
        title: 'Wyniki salonu',
        description: 'Przychody i raporty',
        category: 'analiza',
        href: '/statistics',
        Icon: ChartBarIcon,
        color: 'blue',
    },
    {
        title: 'Zespół',
        description: 'Pracownicy i ich grafiki',
        category: 'operacje',
        href: '/settings/employees',
        Icon: UsersIcon,
        color: 'rose',
    },
    {
        title: 'Produkty',
        description: 'Stany magazynowe i asortyment',
        category: 'operacje',
        href: '/products',
        Icon: CubeIcon,
        color: 'mint',
    },
    {
        title: 'Ustawienia',
        description: 'Konfiguracja salonu i usług',
        category: 'analiza',
        href: '/settings',
        Icon: Cog6ToothIcon,
        color: 'ice',
    },
] as const;

function numberOrDash(value: number | null | undefined): string {
    return value == null ? '—' : formatNumber.format(value);
}

function currencyOrDash(value: number | null | undefined): string {
    return value == null ? '—' : formatCurrency.format(value);
}

function getMonthCells(date: Date): Array<number | null> {
    const year = date.getFullYear();
    const month = date.getMonth();
    const offset = (new Date(year, month, 1).getDay() + 6) % 7;
    const days = new Date(year, month + 1, 0).getDate();
    return [
        ...Array.from({ length: offset }, () => null),
        ...Array.from({ length: days }, (_, index) => index + 1),
    ];
}

function StudioV18() {
    const [section, setSection] = useState<'overview' | 'library'>('overview');
    const [filter, setFilter] = useState<'all' | 'operacje' | 'analiza'>('all');
    const [monthShift, setMonthShift] = useState(0);
    const { data: stats, isLoading: loadingStats } = useDashboardStats();
    const { data: dashboard, loading: loadingDashboard } = useDashboard();
    const { data: employees, loading: loadingEmployees } = useEmployees();
    const { data: stock, isError: stockError } = useStockSummary();

    const now = new Date();
    const viewedMonth = new Date(now.getFullYear(), now.getMonth() + monthShift, 1);
    const monthCells = getMonthCells(viewedMonth);
    const monthLabel = viewedMonth.toLocaleDateString('pl-PL', {
        month: 'long',
        year: 'numeric',
    });
    const todayLabel = now.toLocaleDateString('pl-PL', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    });

    const monthRevenue = useMemo(
        () =>
            (stats?.monthDailyRevenue ?? []).map((point) => ({
                day: point.date.slice(8),
                value: point.totalRevenue,
            })),
        [stats?.monthDailyRevenue],
    );
    const upcoming = useMemo(
        () =>
            (dashboard?.upcomingAppointments ?? [])
                .filter((item) => new Date(item.startTime).getTime() >= Date.now())
                .sort(
                    (a, b) =>
                        new Date(a.startTime).getTime() -
                        new Date(b.startTime).getTime(),
                )
                .slice(0, 4),
        [dashboard?.upcomingAppointments],
    );
    const team = (employees ?? []).slice(0, 4);
    const filteredShortcuts = shortcuts.filter(
        (item) => filter === 'all' || item.category === filter,
    );
    const stockAlerts =
        stock == null
            ? null
            : (stock.lowStockCount ?? 0) + (stock.outOfStockCount ?? 0);

    return (
        <div className={styles.shell} data-testid="studio-v18-reference">
            <Head>
                <title>Studio V18 · Salon Black &amp; White</title>
                <meta name="robots" content="noindex,nofollow,noarchive" />
            </Head>

            <aside className={styles.iconRail} aria-label="Nawigacja panelu">
                <Link href="/studio-v18" className={styles.brand} aria-label="Salon Black and White Studio">
                    <span>B</span><span className={styles.brandSlash}>/</span><span>W</span>
                </Link>
                <nav className={styles.railLinks} aria-label="Główne moduły">
                    {railLinks.map(({ href, label, Icon }) => (
                        <Link
                            key={href}
                            href={href}
                            className={styles.railLink}
                            title={label}
                            aria-label={label}
                        >
                            <Icon width={19} height={19} aria-hidden="true" />
                        </Link>
                    ))}
                </nav>
                <div className={styles.railBottom}>
                    <span className={styles.railDot} title="Podgląd DEV" />
                    <Link href="/studio-preview?variant=light" title="Poprzednia wersja projektu" aria-label="Poprzedni projekt" className={styles.railLink}>
                        <Squares2X2Icon width={19} height={19} aria-hidden="true" />
                    </Link>
                </div>
            </aside>

            <div className={styles.surface}>
                <header className={styles.header}>
                    <div>
                        <span className={styles.eyebrow}>SALON BLACK &amp; WHITE / STUDIO V18</span>
                        <h1>{section === 'overview' ? 'Dzień dobry!' : 'Twoja przestrzeń'}</h1>
                    </div>
                    <div className={styles.headerRight}>
                        <span className={styles.todayChip}>{todayLabel}</span>
                        <Link href="/studio-preview?variant=light" className={styles.compareLink}>
                            Poprzedni projekt
                            <ArrowUpRightIcon width={15} height={15} aria-hidden="true" />
                        </Link>
                    </div>
                </header>

                <div className={styles.tabs} role="tablist" aria-label="Widok V18">
                    <button
                        type="button"
                        className={section === 'overview' ? styles.tabActive : styles.tab}
                        onClick={() => setSection('overview')}
                        role="tab"
                        aria-selected={section === 'overview'}
                    >
                        Przegląd
                    </button>
                    <button
                        type="button"
                        className={section === 'library' ? styles.tabActive : styles.tab}
                        onClick={() => setSection('library')}
                        role="tab"
                        aria-selected={section === 'library'}
                    >
                        Moje moduły
                    </button>
                </div>

                {section === 'overview' ? (
                    <div className={styles.overviewGrid} role="tabpanel">
                        <div className={styles.mainColumn}>
                            <section className={styles.lavenderHero} aria-label="Szybkie działania">
                                <div className={styles.heroCopy}>
                                    <span className={styles.heroKicker}>TWOJE STUDIO PRACY</span>
                                    <h2>Razem tworzymy piękne rzeczy.</h2>
                                    <p>Wszystko, co ważne dzisiaj w salonie, w jednym miejscu.</p>
                                    <Link href="/calendar" className={styles.heroButton}>
                                        Otwórz kalendarz
                                        <ArrowUpRightIcon width={15} height={15} aria-hidden="true" />
                                    </Link>
                                </div>
                                <div className={styles.heroSculpture} aria-hidden="true">
                                    <span className={styles.sculptureOne} />
                                    <span className={styles.sculptureTwo} />
                                    <span className={styles.sculptureThree} />
                                </div>
                            </section>

                            <section className={styles.trio} aria-label="Dzisiejsze informacje">
                                <article className={styles.teamCard}>
                                    <div className={styles.cardHeader}>
                                        <h2>Zespół</h2>
                                        <Link href="/settings/employees" aria-label="Otwórz zespół">
                                            <ArrowUpRightIcon width={16} height={16} aria-hidden="true" />
                                        </Link>
                                    </div>
                                    <div className={styles.avatars}>
                                        {team.length > 0 ? team.map((employee, index) => (
                                            <div className={styles.person} key={employee.id}>
                                                <span className={styles.avatar} data-tone={index % 4}>
                                                    {(employee.firstName || employee.name || '?')
                                                        .trim()
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </span>
                                                <span className={styles.personName}>{employee.firstName || employee.name}</span>
                                            </div>
                                        )) : (
                                            <span className={styles.cardPlaceholder}>
                                                {loadingEmployees ? 'Ładowanie zespołu…' : 'Brak danych zespołu'}
                                            </span>
                                        )}
                                    </div>
                                    <span className={styles.cardFootnote}>
                                        {employees ? numberOrDash(employees.length) + ' osób w systemie' : 'Zespół salonu'}
                                    </span>
                                </article>

                                <article className={styles.metricCard}>
                                    <div className={styles.cardHeader}>
                                        <h2>Wizyty dziś</h2>
                                        <CalendarDaysIcon width={17} height={17} aria-hidden="true" />
                                    </div>
                                    <strong>{loadingStats ? '…' : numberOrDash(stats?.todayAppointments)}</strong>
                                    <p>Zaplanowane spotkania</p>
                                    <Link href="/calendar" className={styles.tinyLink}>
                                        Zobacz plan <ArrowRightIcon width={13} height={13} aria-hidden="true" />
                                    </Link>
                                </article>

                                <article className={styles.metricCard}>
                                    <div className={styles.cardHeader}>
                                        <h2>Przychód dziś</h2>
                                        <ChartBarIcon width={17} height={17} aria-hidden="true" />
                                    </div>
                                    <strong className={styles.metricMoney}>
                                        {loadingStats ? '…' : currencyOrDash(stats?.todayRevenue)}
                                    </strong>
                                    <p>Według danych SalonBW</p>
                                    <Link href="/statistics" className={styles.tinyLink}>
                                        Analiza <ArrowRightIcon width={13} height={13} aria-hidden="true" />
                                    </Link>
                                </article>
                            </section>

                            <section className={styles.bottomGrid} aria-label="Analiza i zadania">
                                <article className={styles.graphCard}>
                                    <div className={styles.cardHeader}>
                                        <div>
                                            <span className={styles.cardEyebrow}>ANALITYKA</span>
                                            <h2>Wyniki miesiąca</h2>
                                        </div>
                                        <Link href="/statistics" aria-label="Statystyki szczegółowe">
                                            <ArrowUpRightIcon width={17} height={17} aria-hidden="true" />
                                        </Link>
                                    </div>
                                    <p className={styles.graphTotal}>
                                        {loadingStats ? '…' : currencyOrDash(stats?.monthRevenue)}
                                    </p>
                                    {monthRevenue.length > 0 ? (
                                        <div className={styles.graph} aria-label="Dzienne przychody w miesiącu" role="img">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={monthRevenue}>
                                                    <defs>
                                                        <linearGradient id="studioV18Area" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="0%" stopColor="#9f8be9" stopOpacity={0.21} />
                                                            <stop offset="100%" stopColor="#9f8be9" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid vertical={false} stroke="#eeeaf4" strokeDasharray="3 6" />
                                                    <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: '#9a97a4', fontSize: 10 }} />
                                                    <Tooltip formatter={(value) => currencyOrDash(Number(value))} />
                                                    <Area dataKey="value" type="monotone" stroke="#9782e4" strokeWidth={2.5} fill="url(#studioV18Area)" isAnimationActive={false} />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    ) : (
                                        <div className={styles.graphEmpty}>
                                            {loadingStats ? 'Wczytywanie wykresu…' : 'Brak danych o przychodzie w tym miesiącu'}
                                        </div>
                                    )}
                                </article>
                                <div className={styles.sideStack}>
                                    <Link href="/calendar" className={styles.darkCard}>
                                        <div>
                                            <span>DO POTWIERDZENIA</span>
                                            <strong>{numberOrDash(dashboard?.onlinePendingCount ?? stats?.pendingAppointments)}</strong>
                                            <small>Oczekujące wizyty</small>
                                        </div>
                                        <ArrowUpRightIcon width={20} height={20} aria-hidden="true" />
                                    </Link>
                                    <div className={styles.attentionCard}>
                                        <div className={styles.cardHeader}>
                                            <h2>Magazyn</h2>
                                            <CubeIcon width={16} height={16} aria-hidden="true" />
                                        </div>
                                        <strong>{stockError ? '—' : numberOrDash(stockAlerts)}</strong>
                                        <p>{stockError ? 'Nie można odczytać stanów' : 'Pozycji wymagających uwagi'}</p>
                                        <Link href="/products" className={styles.tinyLink}>
                                            Otwórz magazyn <ArrowRightIcon width={13} height={13} aria-hidden="true" />
                                        </Link>
                                    </div>
                                </div>
                            </section>
                        </div>

                        <aside className={styles.rightColumn} aria-label="Kalendarz i wizyty">
                            <section className={styles.calendarSection}>
                                <div className={styles.calendarHeader}>
                                    <h2>{monthLabel}</h2>
                                    <div className={styles.calendarActions}>
                                        <button type="button" onClick={() => setMonthShift((value) => value - 1)} aria-label="Poprzedni miesiąc"><ChevronLeftIcon width={16} height={16} /></button>
                                        <button type="button" onClick={() => setMonthShift((value) => value + 1)} aria-label="Następny miesiąc"><ChevronRightIcon width={16} height={16} /></button>
                                    </div>
                                </div>
                                <div className={styles.calendarGrid}>
                                    {weekdayNames.map((day) => <span className={styles.weekday} key={day}>{day}</span>)}
                                    {monthCells.map((day, index) => {
                                        const isToday = day === now.getDate() && viewedMonth.getMonth() === now.getMonth() && viewedMonth.getFullYear() === now.getFullYear();
                                        return day == null ? <span key={'empty-' + index} /> : (
                                            <Link
                                                key={day}
                                                href="/calendar"
                                                className={isToday ? styles.calendarToday : styles.calendarDay}
                                                aria-label={'Kalendarz, dzień ' + day + ' ' + monthLabel}
                                                aria-current={isToday ? 'date' : undefined}
                                            >
                                                {day}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </section>

                            <section className={styles.upcomingSection}>
                                <div className={styles.cardHeader}>
                                    <h2>Najbliższe wizyty</h2>
                                    <Link href="/calendar" aria-label="Wszystkie wizyty">
                                        <ArrowUpRightIcon width={16} height={16} aria-hidden="true" />
                                    </Link>
                                </div>
                                {upcoming.length > 0 ? (
                                    <div className={styles.upcomingList}>
                                        {upcoming.map((visit, index) => (
                                            <article className={styles.visitCard} key={visit.id} data-tone={index % 3}>
                                                <div className={styles.visitSymbol}>
                                                    <ClockIcon width={19} height={19} aria-hidden="true" />
                                                </div>
                                                <div>
                                                    <strong>{visit.clientName || 'Klient'}</strong>
                                                    <p>{visit.serviceName}</p>
                                                    <span>{new Date(visit.startTime).toLocaleString('pl-PL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                ) : (
                                    <p className={styles.emptyVisits}>
                                        {loadingDashboard ? 'Pobieranie terminów…' : 'Brak najbliższych wizyt w dostępnych danych.'}
                                    </p>
                                )}
                            </section>

                            <Link href="/calendar" className={styles.addVisit}>
                                <PlusIcon width={17} height={17} aria-hidden="true" />
                                Przejdź do kalendarza
                            </Link>
                        </aside>
                    </div>
                ) : (
                    <section className={styles.library} role="tabpanel">
                        <div className={styles.libraryHeader}>
                            <div>
                                <span className={styles.cardEyebrow}>TWOJE NARZĘDZIA</span>
                                <h2>Zapisane na później</h2>
                                <p>Najczęściej wykorzystywane moduły salonu — pod ręką.</p>
                            </div>
                            <div className={styles.filterTabs} aria-label="Filtruj moduły">
                                {([
                                    ['all', 'Wszystko'],
                                    ['operacje', 'Operacje'],
                                    ['analiza', 'Analiza'],
                                ] as const).map(([value, label]) => (
                                    <button
                                        type="button"
                                        key={value}
                                        className={filter === value ? styles.filterActive : styles.filterButton}
                                        onClick={() => setFilter(value)}
                                        aria-pressed={filter === value}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className={styles.libraryGrid}>
                            <div className={styles.shortcutGrid}>
                                {filteredShortcuts.map(({ title, description, href, Icon, color }) => (
                                    <Link key={href} href={href} className={styles.shortcutCard}>
                                        <span className={styles.shortcutArt} data-color={color}>
                                            <Icon width={34} height={34} aria-hidden="true" />
                                            <span className={styles.artOrb} />
                                        </span>
                                        <strong>{title}</strong>
                                        <span className={styles.shortcutDescription}>{description}</span>
                                        <span className={styles.shortcutFooter}>
                                            Otwórz moduł
                                            <ArrowUpRightIcon width={15} height={15} aria-hidden="true" />
                                        </span>
                                    </Link>
                                ))}
                            </div>
                            <aside className={styles.collections}>
                                <div className={styles.cardHeader}>
                                    <h3>Kolekcje</h3>
                                    <BookmarkIcon width={18} height={18} aria-hidden="true" />
                                </div>
                                <Link href="/calendar"><span className={styles.collectionIcon} data-color="violet"><CalendarDaysIcon width={17} height={17} /></span><span>Obsługa wizyt<small>Kalendarz i terminy</small></span><ArrowUpRightIcon width={14} height={14} /></Link>
                                <Link href="/customers"><span className={styles.collectionIcon} data-color="pink"><UsersIcon width={17} height={17} /></span><span>Relacje z klientami<small>Klienci i historia</small></span><ArrowUpRightIcon width={14} height={14} /></Link>
                                <Link href="/statistics"><span className={styles.collectionIcon} data-color="mint"><ChartBarIcon width={17} height={17} /></span><span>Wyniki biznesowe<small>Statystyki salonu</small></span><ArrowUpRightIcon width={14} height={14} /></Link>
                                <div className={styles.collectionsHint}>
                                    <ExclamationTriangleIcon width={16} height={16} aria-hidden="true" />
                                    Podgląd UI na środowisku DEV. Dane i uprawnienia pozostają bez zmian.
                                </div>
                            </aside>
                        </div>
                    </section>
                )}
                <footer className={styles.previewFoot}>
                    <span>Studio V18 · koncepcja wzorowana na kompozycji Dashboard V18</span>
                    <span>DEV · tylko administrator</span>
                </footer>
            </div>
        </div>
    );
}

export default function StudioV18Page() {
    return (
        <RouteGuard roles={['admin']}>
            <StudioV18 />
        </RouteGuard>
    );
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
    const host = (req.headers.host ?? '').split(':')[0].toLowerCase();
    const dev =
        process.env.NEXT_PUBLIC_DEPLOYMENT_ENV === 'development' ||
        process.env.NODE_ENV === 'development';
    if (!dev || !['dev-panel.salon-bw.pl', 'localhost', '127.0.0.1'].includes(host)) {
        return { notFound: true };
    }
    return { props: {} };
};
