import RouteGuard from '@/components/RouteGuard';
import SalonBWShell from '@/components/salonbw/SalonBWShell';
import { useAuth } from '@/contexts/AuthContext';

export default function MomentCommentsPage() {
    const { role } = useAuth();

    if (!role) return null;

    return (
        <RouteGuard roles={['admin']} permission="nav:statistics">
            <SalonBWShell role={role}>
                <div className="statistics-page">
                    <h1 className="text-2xl font-semibold mb-20">
                        Komentarze Moment
                    </h1>

                    <div className="salonbw-widget">
                        <div className="salonbw-widget__header">
                            Integracja z Moment
                        </div>
                        <div className="salonbw-widget__content text-center py-40">
                            <div className="text-6xl mb-20">🔗</div>
                            <h3 className="text-xl mb-10">
                                Wymagana integracja z API Moment
                            </h3>
                            <p className="text-muted max-w-lg mx-auto mb-20">
                                Ten widok wymaga połączenia z API Moment
                                (Google) aby pobierać komentarze i opinie
                                klientów. Skontaktuj się z administratorem aby
                                skonfigurować integrację.
                            </p>
                            <div className="bg-gray-50 p-16 rounded text-left max-w-lg mx-auto">
                                <h4 className="font-medium mb-10">
                                    Wymagane kroki:
                                </h4>
                                <ol className="list-decimal list-inside space-y-8 text-sm text-muted">
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
            </SalonBWShell>
        </RouteGuard>
    );
}
