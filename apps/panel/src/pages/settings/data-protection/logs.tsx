import ActivityLogRoute from '@/components/settings/ActivityLogRoute';
import CustomerSettingsNav from '@/components/settings/CustomerSettingsNav';

export default function DataProtectionLogsPage() {
    return (
        <ActivityLogRoute
            secondaryNav={<CustomerSettingsNav />}
            clearHref="/settings/data-protection/logs"
            summaryFallback="Rejestr aktywności pracowników"
            emptyLabel="Brak aktywności pracowników dla wybranych filtrów."
            breadcrumbs={[
                {
                    href: '/settings',
                    label: 'Ustawienia',
                    iconClass: 'sprite-breadcrumbs_settings',
                },
                {
                    label: 'Klienci',
                },
                {
                    href: '/settings/data-protection',
                    label: 'Tryb ochrony danych',
                },
                {
                    label: 'Rejestr aktywności pracowników',
                },
            ]}
        />
    );
}
