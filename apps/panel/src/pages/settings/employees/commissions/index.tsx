import Link from 'next/link';
import RouteGuard from '@/components/RouteGuard';
import SalonBWShell from '@/components/salonbw/SalonBWShell';
import VersumBreadcrumbs from '@/components/salonbw/VersumBreadcrumbs';
import { useSetSecondaryNav } from '@/contexts/SecondaryNavContext';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployees } from '@/hooks/useEmployees';
import PanelSection from '@/components/ui/PanelSection';
import PanelTable from '@/components/ui/PanelTable';

const NAV = (
    <div className="sidenav" id="sidenav">
        <div className="column_row tree other_settings">
            <h4>Pracownicy</h4>
            <ul>
                <li>
                    <Link href="/settings/employees">
                        <div className="icon_box">
                            <span className="icon sprite-settings_employees_nav" />
                        </div>
                        Lista pracowników
                    </Link>
                </li>
                <li>
                    <Link
                        href="/settings/employees/commissions"
                        className="active"
                    >
                        <div className="icon_box">
                            <span className="icon sprite-settings_commissions_nav" />
                        </div>
                        Prowizje
                    </Link>
                </li>
                <li>
                    <Link href="/settings/employees/activity-logs">
                        <div className="icon_box">
                            <span className="icon sprite-settings_activity_log_nav" />
                        </div>
                        Dziennik aktywności
                    </Link>
                </li>
            </ul>
        </div>
    </div>
);

export default function SettingsEmployeeCommissionsPage() {
    const { role } = useAuth();
    useSetSecondaryNav(NAV);

    const { data: employeesRaw, loading: isLoading } = useEmployees();
    const employees = employeesRaw ?? [];

    if (!role) return null;

    return (
        <RouteGuard roles={['admin']} permission="nav:settings">
            <SalonBWShell role={role}>
                <div
                    className="settings-detail-layout"
                    data-testid="settings-detail"
                >
                    <aside className="settings-detail-layout__sidebar">
                        {NAV}
                    </aside>
                    <div className="settings-detail-layout__main">
                        <VersumBreadcrumbs
                            iconClass="sprite-breadcrumbs_settings"
                            items={[
                                { label: 'Ustawienia', href: '/settings' },
                                { label: 'Pracownicy' },
                                { label: 'Prowizje' },
                            ]}
                        />
                        <PanelSection title="Prowizje pracowników">
                            {isLoading ? (
                                <p>Ładowanie...</p>
                            ) : (
                                <PanelTable
                                    columns={[
                                        { label: 'Pracownik' },
                                        { label: 'Prowizja (usługi)' },
                                        { label: 'Prowizja (produkty)' },
                                        { label: 'Akcje' },
                                    ]}
                                    isEmpty={employees.length === 0}
                                    emptyMessage="Brak pracowników"
                                >
                                    {employees.map((emp, i) => (
                                        <tr
                                            key={emp.id}
                                            className={
                                                i % 2 === 0 ? 'even' : 'odd'
                                            }
                                        >
                                            <td>{emp.name}</td>
                                            <td>—</td>
                                            <td>—</td>
                                            <td style={{ textAlign: 'right' }}>
                                                <Link
                                                    href={`/settings/employees/commissions/${emp.id}`}
                                                    className="btn btn-xs btn-default"
                                                >
                                                    edytuj
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </PanelTable>
                            )}
                        </PanelSection>
                    </div>
                </div>
            </SalonBWShell>
        </RouteGuard>
    );
}
