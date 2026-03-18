import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSetSecondaryNav } from '@/contexts/SecondaryNavContext';
import { useEmployee } from '@/hooks/useEmployees';
import PanelSection from '@/components/ui/PanelSection';

const NAV = (
    <div className="sidenav secondarynav" id="sidenav">
        <div className="column_row tree other_settings">
            <h4>Grafiki pracy</h4>
            <ul>
                <li>
                    <Link
                        href="/settings/timetable/employees"
                        className="active"
                    >
                        <div className="icon_box">
                            <span className="icon sprite-settings_timetable_nav" />
                        </div>
                        Pracownicy
                    </Link>
                </li>
                <li>
                    <Link href="/settings/timetable/branch">
                        <div className="icon_box">
                            <span className="icon sprite-settings_timetable_nav" />
                        </div>
                        Salon
                    </Link>
                </li>
                <li>
                    <Link href="/settings/timetable/templates">
                        <div className="icon_box">
                            <span className="icon sprite-settings_timetable_nav" />
                        </div>
                        Szablony
                    </Link>
                </li>
            </ul>
        </div>
    </div>
);

export default function SettingsTimetableEmployeeDetailPage() {
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
                            <Link href="/settings/timetable/employees">
                                Grafiki pracy
                            </Link>
                        </li>
                        <li>
                            <span> / </span>
                            {employee?.name ?? '...'}
                        </li>
                    </ul>
                </div>
                <PanelSection>
                    {isLoading ? (
                        <p>Ładowanie...</p>
                    ) : (
                        <>
                            <div className="actions">
                                <button
                                    type="button"
                                    className="btn button-blue pull-right"
                                    disabled
                                >
                                    edytuj grafik
                                </button>
                            </div>
                            <h2>Grafik pracy — {employee?.name ?? '...'}</h2>
                            <p className="text-muted">
                                Grafik pracy pracownika. Kliknij &quot;edytuj
                                grafik&quot;, aby zmienić godziny pracy.
                            </p>
                        </>
                    )}
                </PanelSection>
            </div>
        </div>
    );
}
