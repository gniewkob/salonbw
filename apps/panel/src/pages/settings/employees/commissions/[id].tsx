import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import { useSetSecondaryNav } from '@/contexts/SecondaryNavContext';
import { useAuth } from '@/contexts/AuthContext';
import {
    useEmployee,
    useEmployeeCommissionBase,
    useUpdateEmployeeCommissionBase,
} from '@/hooks/useEmployees';
import PanelSection from '@/components/ui/PanelSection';

const NAV = (
    <div className="sidenav" id="sidenav">
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
    const { role } = useAuth();
    const id = router.query.id ? Number(router.query.id) : null;
    useSetSecondaryNav(NAV);

    const { data: employee, isLoading } = useEmployee(id);
    const { data: commissionData, isLoading: commissionLoading } =
        useEmployeeCommissionBase(id);
    const updateCommission = useUpdateEmployeeCommissionBase();

    const [serviceCommission, setServiceCommission] = useState('0');
    const [saved, setSaved] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    useEffect(() => {
        if (commissionData) {
            setServiceCommission(String(commissionData.commissionBase ?? 0));
        }
    }, [commissionData]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;
        setSaved(false);
        setSaveError(null);
        try {
            await updateCommission.mutateAsync({
                id,
                commissionBase: Number(serviceCommission),
            });
            setSaved(true);
        } catch {
            setSaveError('Nie udało się zapisać prowizji. Spróbuj ponownie.');
        }
    };

    const isPageLoading = isLoading || commissionLoading;

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
                                    label: 'Prowizje',
                                    href: '/settings/employees/commissions',
                                },
                                { label: employee?.name ?? '...' },
                            ]}
                        />
                        <PanelSection>
                            {isPageLoading ? (
                                <p>Ładowanie...</p>
                            ) : (
                                <form onSubmit={(e) => void handleSave(e)}>
                                    <h2>
                                        Prowizje — {employee?.name ?? '...'}
                                    </h2>
                                    <p className="text-muted mb-3">
                                        Bazowa stawka prowizji za usługi. Może
                                        być nadpisana przez prowizję ustawioną
                                        na poziomie konkretnej usługi.
                                    </p>
                                    <div className="mb-3">
                                        <label
                                            htmlFor="serviceCommission"
                                            className="form-label"
                                        >
                                            Bazowa prowizja za usługi (%)
                                        </label>
                                        <input
                                            id="serviceCommission"
                                            type="number"
                                            className="form-control"
                                            style={{ maxWidth: 120 }}
                                            min={0}
                                            max={100}
                                            step={0.1}
                                            value={serviceCommission}
                                            onChange={(e) => {
                                                setServiceCommission(
                                                    e.target.value,
                                                );
                                                setSaved(false);
                                            }}
                                        />
                                        <div className="form-text">
                                            0–100%. Wartość 0 oznacza brak
                                            prowizji.
                                        </div>
                                    </div>
                                    {saved && (
                                        <div className="alert alert-success mb-3">
                                            Prowizja została zapisana.
                                        </div>
                                    )}
                                    {saveError && (
                                        <div className="alert alert-danger mb-3">
                                            {saveError}
                                        </div>
                                    )}
                                    <div className="actions">
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={
                                                updateCommission.isPending
                                            }
                                        >
                                            {updateCommission.isPending
                                                ? 'Zapisywanie...'
                                                : 'zapisz'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </PanelSection>
                    </div>
                </div>
            </SalonShell>
        </RouteGuard>
    );
}
