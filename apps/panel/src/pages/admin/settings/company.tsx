import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminCompanySettingsPage() {
    const { role } = useAuth();
    return (
        <RouteGuard roles={['admin']} permission="nav:settings">
            <SalonShell role={role}>
                <div className="salonbw-page">
                    <SalonBreadcrumbs
                        iconClass="sprite-breadcrumbs_settings"
                        items={[
                            { label: 'Ustawienia', href: '/settings' },
                            { label: 'Ustawienia firmy' },
                        ]}
                    />
                    <div className="alert alert-info mt-4">
                        Ustawienia firmy nie są jeszcze dostępne w tej wersji
                        aplikacji.
                    </div>
                </div>
            </SalonShell>
        </RouteGuard>
    );
}
