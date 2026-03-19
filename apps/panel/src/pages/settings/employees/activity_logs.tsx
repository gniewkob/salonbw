import ActivityLogRoute from '@/components/settings/ActivityLogRoute';
import EmployeesNav from '@/components/versum/navs/EmployeesNav';

export default function EmployeeActivityLogsPage() {
    return (
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
    );
}
