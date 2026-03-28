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
                    <h1 className="text-2xl font-semibold mb-20">
                        Komentarze Booksy
                    </h1>

                    <div className="salonbw-widget">
                        <div className="salonbw-widget__header">
                            Integracja z Booksy
                        </div>
                        <div className="salonbw-widget__content text-center py-40">
                            <div className="text-6xl mb-20">🔗</div>
                            <h3 className="text-xl mb-10">
                                Wymagana integracja z API Booksy
                            </h3>
                            <p className="text-muted max-w-lg mx-auto mb-20">
                                Ten widok wymaga połączenia z API Booksy aby
                                pobierać komentarze i opinie klientów.
                                Skontaktuj się z administratorem aby
                                skonfigurować integrację.
                            </p>
                            <div className="bg-gray-50 p-16 rounded text-left max-w-lg mx-auto">
                                <h4 className="font-medium mb-10">
                                    Wymagane kroki:
                                </h4>
                                <ol className="list-decimal list-inside space-y-8 text-sm text-muted">
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
