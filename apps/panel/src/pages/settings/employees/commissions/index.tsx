import Link from 'next/link';
import { useSetSecondaryNav } from '@/contexts/SecondaryNavContext';
import { useEmployees } from '@/hooks/useEmployees';

const NAV = (
    <div className="sidenav secondarynav" id="sidenav">
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
    useSetSecondaryNav(NAV);

    const { data: employeesRaw, loading: isLoading } = useEmployees();
    const employees = employeesRaw ?? [];

    return (
        <div className="settings-detail-layout" data-testid="settings-detail">
            <aside className="settings-detail-layout__sidebar">{NAV}</aside>
            <div className="settings-detail-layout__main">
                <div className="breadcrumbs" e2e-breadcrumbs="">
                    <ul>
                        <li>
                            <div className="icon sprite-breadcrumbs_settings" />
                            <Link href="/settings">Ustawienia</Link>
                        </li>
                        <li>
                            <span> / </span>
                            Pracownicy
                        </li>
                        <li>
                            <span> / </span>
                            Prowizje
                        </li>
                    </ul>
                </div>
                <div className="inner edit_branch_form">
                    <h2>Prowizje pracowników</h2>
                    {isLoading ? (
                        <p>Ładowanie...</p>
                    ) : (
                        <table className="table table-bordered">
                            <thead>
                                <tr>
                                    <th>
                                        <div>Pracownik</div>
                                    </th>
                                    <th>
                                        <div>Prowizja (usługi)</div>
                                    </th>
                                    <th>
                                        <div>Prowizja (produkty)</div>
                                    </th>
                                    <th>
                                        <div>Akcje</div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {employees.length === 0 ? (
                                    <tr>
                                        <td colSpan={4}>Brak pracowników</td>
                                    </tr>
                                ) : (
                                    employees.map((emp, i) => (
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
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
