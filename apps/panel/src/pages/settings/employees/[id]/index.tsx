import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSetSecondaryNav } from '@/contexts/SecondaryNavContext';
import { useEmployee } from '@/hooks/useEmployees';
import PanelSection from '@/components/ui/PanelSection';

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
                    <Link href="/settings/employees/commissions">
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

export default function SettingsEmployeeDetailPage() {
    const router = useRouter();
    const id = router.query.id ? Number(router.query.id) : null;
    useSetSecondaryNav(NAV);

    const { data: employee, isLoading } = useEmployee(id);

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
                            <Link href="/settings/employees">Pracownicy</Link>
                        </li>
                        <li>
                            <span> / </span>
                            {employee?.name ?? '...'}
                        </li>
                    </ul>
                </div>
                <PanelSection
                    action={
                        <Link
                            href={id ? `/settings/employees/${id}/edit` : '#'}
                            className="btn button-blue pull-right"
                        >
                            edytuj
                        </Link>
                    }
                >
                    {isLoading ? (
                        <p>Ładowanie...</p>
                    ) : employee ? (
                        <>
                            <h2>{employee.name}</h2>
                            <dl className="dl-horizontal">
                                <dt>Imię i nazwisko</dt>
                                <dd>{employee.name}</dd>
                                <dt>Rola</dt>
                                <dd>{employee.role}</dd>
                                <dt>Rola systemowa</dt>
                                <dd>{employee.role ?? '—'}</dd>
                            </dl>
                            <div className="actions" style={{ marginTop: 16 }}>
                                <Link
                                    href={
                                        id
                                            ? `/settings/employees/${id}/events-history`
                                            : '#'
                                    }
                                    className="btn btn-default"
                                >
                                    Historia wizyt
                                </Link>
                            </div>
                        </>
                    ) : (
                        <p>Nie znaleziono pracownika.</p>
                    )}
                </PanelSection>
            </div>
        </div>
    );
}
