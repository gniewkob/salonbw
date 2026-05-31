import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import { useNotifications } from '@/hooks/useNotifications';

export default function NotificationList() {
    const { data, error } = useNotifications();

    return (
        <div className="customers_index" id="customers_main">
            <SalonBreadcrumbs
                iconClass="sprite-breadcrumbs_communication"
                items={[{ label: 'Powiadomienia' }]}
            />

            {error ? (
                <div className="alert alert-danger py-2 small">
                    Nie udało się załadować powiadomień.
                </div>
            ) : data.length === 0 ? (
                <p className="products-empty">Brak powiadomień.</p>
            ) : (
                <div className="d-flex flex-column gap-2">
                    {data.map((n) => (
                        <div key={n.id} className="border rounded p-3 bg-light">
                            <div>{n.message}</div>
                            <div className="small text-muted mt-1">
                                {new Date(n.createdAt).toLocaleString('pl-PL')}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
