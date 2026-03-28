import Link from 'next/link';
import { useRouter } from 'next/router';
import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import { useSetSecondaryNav } from '@/contexts/SecondaryNavContext';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployee } from '@/hooks/useEmployees';
import { useActivityLogs } from '@/hooks/useActivityLogs';
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

export default function SettingsEmployeeEventsHistoryPage() {
    const router = useRouter();
    const { role } = useAuth();
    const id = router.query.id ? Number(router.query.id) : null;
    useSetSecondaryNav(NAV);

    const { data: employee } = useEmployee(id);
    const { data: logs, isLoading } = useActivityLogs({
        userId: id ?? undefined,
        limit: 50,
    });

    if (!role) return null;

    return (
        <RouteGuard roles={['admin']} permission="nav:settings">
            <SalonShell role={role}>
                <div
                    className="settings-detail-layout"
                    data-testid="settings-detail"
                >
                    <aside className="settings-detail-layout__sidebar">
                        {NAV}
                    </aside>
                    <div className="settings-detail-layout__main">
                        <SalonBreadcrumbs
                            iconClass="sprite-breadcrumbs_settings"
                            items={[
                                { label: 'Ustawienia', href: '/settings' },
                                {
                                    label: 'Pracownicy',
                                    href: '/settings/employees',
                                },
                                { label: employee?.name ?? '...' },
                                { label: 'Historia wydarzeń' },
                            ]}
                        />
                        <PanelSection
                            title={`Historia wydarzeń — ${employee?.name ?? '...'}`}
                        >
                            {isLoading ? (
                                <p>Ładowanie...</p>
                            ) : (
                                <PanelTable
                                    columns={[
                                        { label: 'Data' },
                                        { label: 'Akcja' },
                                        { label: 'Szczegóły' },
                                    ]}
                                    isEmpty={!logs?.items?.length}
                                    emptyMessage="Brak historii wydarzeń"
                                >
                                    {(logs?.items ?? []).map((log, i) => (
                                        <tr
                                            key={log.id}
                                            className={
                                                i % 2 === 0 ? 'even' : 'odd'
                                            }
                                        >
                                            <td>
                                                {new Date(
                                                    log.timestamp,
                                                ).toLocaleString('pl-PL')}
                                            </td>
                                            <td>{log.actionLabel}</td>
                                            <td>
                                                {log.details
                                                    ? JSON.stringify(
                                                          log.details,
                                                      )
                                                    : '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </PanelTable>
                            )}
                        </PanelSection>
                    </div>
                </div>
            </SalonShell>
        </RouteGuard>
    );
}
