import { useRouter } from 'next/router';
import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import { useAuth } from '@/contexts/AuthContext';

// ─── Tab: Booksy ──────────────────────────────────────────────────────────────

function BooksyTab() {
    return (
        <div className="salonbw-widget">
            <div className="salonbw-widget__header">Integracja z Booksy</div>
            <div className="salonbw-widget__content text-center py-5">
                <div className="fs-1 mb-4">🔗</div>
                <h3 className="fs-4 mb-3">Wymagana integracja z API Booksy</h3>
                <p className="text-muted mx-auto mb-4">
                    Ten widok wymaga połączenia z API Booksy aby pobierać komentarze i opinie
                    klientów. Skontaktuj się z administratorem aby skonfigurować integrację.
                </p>
                <div className="bg-light p-4 rounded text-start mx-auto" style={{ maxWidth: 400 }}>
                    <h4 className="fw-medium mb-3">Wymagane kroki:</h4>
                    <ol className="small text-muted mb-0">
                        <li>Uzyskaj dostęp do API Booksy</li>
                        <li>Skonfiguruj klucze API w ustawieniach</li>
                        <li>Włącz synchronizację komentarzy</li>
                        <li>Uruchom import historycznych opinii</li>
                    </ol>
                </div>
            </div>
        </div>
    );
}

// ─── Tab: Moment ──────────────────────────────────────────────────────────────

function MomentTab() {
    return (
        <div className="salonbw-widget">
            <div className="salonbw-widget__header">Integracja z Moment</div>
            <div className="salonbw-widget__content text-center py-5">
                <div className="fs-1 mb-4">🔗</div>
                <h3 className="fs-4 mb-3">Wymagana integracja z API Moment</h3>
                <p className="text-muted mx-auto mb-4">
                    Ten widok wymaga połączenia z API Moment (Google) aby pobierać komentarze i
                    opinie klientów. Skontaktuj się z administratorem aby skonfigurować integrację.
                </p>
                <div className="bg-light p-4 rounded text-start mx-auto" style={{ maxWidth: 400 }}>
                    <h4 className="fw-medium mb-3">Wymagane kroki:</h4>
                    <ol className="small text-muted mb-0">
                        <li>Uzyskaj dostęp do Google Business API</li>
                        <li>Skonfiguruj OAuth 2.0 credentials</li>
                        <li>Autoryzuj dostęp do lokalizacji salonu</li>
                        <li>Włącz synchronizację recenzji</li>
                    </ol>
                </div>
            </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CommentsStatisticsPage() {
    const router = useRouter();
    const { role } = useAuth();
    const activeTab = (router.query.tab as string) || 'booksy';

    const setTab = (tab: string) =>
        router.push(`/statistics/comments?tab=${tab}`, undefined, { shallow: true });

    return (
        <RouteGuard roles={['admin']} permission="nav:statistics">
            <SalonShell role={role}>
                <div className="salonbw-page">
                    <SalonBreadcrumbs
                        iconClass="sprite-breadcrumbs_statistics"
                        items={[
                            { label: 'Statystyki', href: '/statistics' },
                            { label: 'Komentarze' },
                        ]}
                    />

                    <ul className="nav nav-tabs mb-4">
                        <li className="nav-item">
                            <button
                                type="button"
                                className={`nav-link${activeTab === 'booksy' ? ' active' : ''}`}
                                onClick={() => setTab('booksy')}
                            >
                                Booksy
                            </button>
                        </li>
                        <li className="nav-item">
                            <button
                                type="button"
                                className={`nav-link${activeTab === 'moment' ? ' active' : ''}`}
                                onClick={() => setTab('moment')}
                            >
                                Moment
                            </button>
                        </li>
                    </ul>

                    {activeTab === 'booksy' && <BooksyTab />}
                    {activeTab === 'moment' && <MomentTab />}
                </div>
            </SalonShell>
        </RouteGuard>
    );
}
