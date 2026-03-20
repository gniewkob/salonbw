import RouteGuard from '@/components/RouteGuard';
import BranchIdentityForm from '@/components/settings/BranchIdentityForm';
import SettingsDetailLayout from '@/components/settings/SettingsDetailLayout';
import SalonBWShell from '@/components/salonbw/SalonBWShell';
import { useAuth } from '@/contexts/AuthContext';

const branchNavItems = [
    {
        label: 'Dane salonu',
        iconClass: 'sprite-settings_branch',
        href: '/settings/branch',
        active: true,
    },
    {
        label: 'Adres i język',
        iconClass: 'sprite-settings_i18n',
    },
    {
        label: 'Zgody',
        iconClass: 'sprite-stock_stocktaking',
    },
] as const;

export default function BranchSettingsPage() {
    const { role } = useAuth();

    if (!role) return null;

    return (
        <RouteGuard roles={['admin']} permission="nav:settings">
            <SalonBWShell role={role}>
                <SettingsDetailLayout
                    sectionTitle="Dane salonu"
                    breadcrumbLabel="Dane salonu"
                    navItems={[...branchNavItems]}
                >
                    <BranchIdentityForm />
                </SettingsDetailLayout>
            </SalonBWShell>
        </RouteGuard>
    );
}
