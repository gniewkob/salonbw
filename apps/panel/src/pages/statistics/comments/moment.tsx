import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import { useAuth } from '@/contexts/AuthContext';

export default function MomentCommentsPage() {
    const { role } = useAuth();

    if (!role) return null;

    return (
        <RouteGuard roles={['admin']} permission="nav:statistics">
            <SalonShell role={role}>
                <div className="statistics-page">
                    <h1 className="fs-3 fw-semibold mb-5">Komentarze Moment</h1>

                    <div className="salonbw-widget">
                        <div className="salonbw-widget__header">
                            Integracja z Moment
                        </div>
                        <div className="salonbw-widget__content text-center py-40">
                            <div className="fs-1 mb-5">🔗</div>
                            <h3 className="fs-4 mb-4">
                                Wymagana integracja z API Moment
                            </h3>
                            <p className="text-muted mx-auto mb-5">
                                Ten widok wymaga połączenia z API Moment
                                (Google) aby pobierać komentarze i opinie
                                klientów. Skontaktuj się z administratorem aby
                                skonfigurować integrację.
                            </p>
                            <div className="bg-light p-5 rounded text-start mx-auto">
                                <h4 className="fw-medium mb-4">
                                    Wymagane kroki:
                                </h4>
                                <ol className="  small text-muted">
                                    <li>
                                        Uzyskaj dostęp do Google Business API
                                    </li>
                                    <li>Skonfiguruj OAuth 2.0 credentials</li>
                                    <li>
                                        Autoryzuj dostęp do lokalizacji salonu
                                    </li>
                                    <li>Włącz synchronizację recenzji</li>
                                </ol>
                            </div>
                        </div>
                    </div>
                </div>
            </SalonShell>
        </RouteGuard>
    );
}
