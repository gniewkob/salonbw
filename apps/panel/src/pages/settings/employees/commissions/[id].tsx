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
            </ul>
        </div>
    </div>
);

export default function SettingsEmployeeCommissionDetailPage() {
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
                            <Link href="/settings/employees/commissions">
                                Prowizje
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
                                    zapisz
                                </button>
                            </div>
                            <h2>Prowizje — {employee?.name ?? '...'}</h2>
                            <div className="form-group">
                                <label
                                    htmlFor="serviceCommission"
                                    className="control-label"
                                >
                                    Prowizja za usługi (%)
                                </label>
                                <input
                                    id="serviceCommission"
                                    type="number"
                                    className="form-control"
                                    min={0}
                                    max={100}
                                    defaultValue={0}
                                    disabled
                                />
                            </div>
                            <div className="form-group">
                                <label
                                    htmlFor="productCommission"
                                    className="control-label"
                                >
                                    Prowizja za produkty (%)
                                </label>
                                <input
                                    id="productCommission"
                                    type="number"
                                    className="form-control"
                                    min={0}
                                    max={100}
                                    defaultValue={0}
                                    disabled
                                />
                            </div>
                        </>
                    )}
                </PanelSection>
            </div>
        </div>
    );
}
