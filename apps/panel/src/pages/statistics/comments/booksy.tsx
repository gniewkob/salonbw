import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import { useAuth } from '@/contexts/AuthContext';

export default function BooksyCommentsPage() {
    const { role } = useAuth();

    if (!role) return null;

    return (
        <RouteGuard roles={['admin']} permission="nav:statistics">
            <SalonShell role={role}>
                <div className="statistics-page">
                    <h1 className="fs-3 fw-semibold mb-5">Komentarze Booksy</h1>

                    <div className="salonbw-widget">
                        <div className="salonbw-widget__header">
                            Integracja z Booksy
                        </div>
                        <div className="salonbw-widget__content text-center py-40">
                            <div className="fs-1 mb-5">🔗</div>
                            <h3 className="fs-4 mb-4">
                                Wymagana integracja z API Booksy
                            </h3>
                            <p className="text-muted mx-auto mb-5">
                                Ten widok wymaga połączenia z API Booksy aby
                                pobierać komentarze i opinie klientów.
                                Skontaktuj się z administratorem aby
                                skonfigurować integrację.
                            </p>
                            <div className="bg-light p-5 rounded text-start mx-auto">
                                <h4 className="fw-medium mb-4">
                                    Wymagane kroki:
                                </h4>
                                <ol className="  small text-muted">
                                    <li>Uzyskaj dostęp do API Booksy</li>
                                    <li>
                                        Skonfiguruj klucze API w ustawieniach
                                    </li>
                                    <li>Włącz synchronizację komentarzy</li>
                                    <li>Uruchom import historycznych opinii</li>
                                </ol>
                            </div>
                        </div>
                    </div>
                </div>
            </SalonShell>
        </RouteGuard>
    );
}
