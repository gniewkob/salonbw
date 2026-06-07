import Head from 'next/head';
import ActivityLogRoute from '@/components/settings/ActivityLogRoute';

export default function DataProtectionLogsPage() {
    return (
        <>
            <Head>
                <title>Logi ochrony danych — Salon Black &amp; White</title>
            </Head>
            <ActivityLogRoute
                secondaryNav={null}
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
                        href: '/settings/privacy?tab=protection',
                        label: 'Ochrona danych',
                    },
                    {
                        label: 'Rejestr aktywności pracowników',
                    },
                ]}
            />
        </>
    );
}
