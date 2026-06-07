import Head from 'next/head';
import ActivityLogRoute from '@/components/settings/ActivityLogRoute';
import EmployeesNav from '@/components/salon/navs/EmployeesNav';

export default function EmployeeActivityLogsPage() {
    return (
        <>
            <Head>
                <title>
                    Logi aktywności pracowników — Salon Black &amp; White
                </title>
            </Head>
            <ActivityLogRoute
                secondaryNav={<EmployeesNav />}
                clearHref="/settings/employees/activity-logs"
                summaryFallback="Wszystkie akcje"
                breadcrumbs={[
                    {
                        href: '/settings',
                        label: 'Ustawienia',
                        iconClass: 'sprite-breadcrumbs_settings',
                    },
                    {
                        href: '/settings/employees',
                        label: 'Pracownicy',
                    },
                    {
                        label: 'Rejestr aktywności',
                    },
                ]}
            />
        </>
    );
}
