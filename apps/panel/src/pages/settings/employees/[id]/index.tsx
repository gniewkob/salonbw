import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import { useSetSecondaryNav } from '@/contexts/SecondaryNavContext';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployee } from '@/hooks/useEmployees';
import PanelSection from '@/components/ui/PanelSection';
import Modal from '@/components/Modal';

const ROLE_LABELS: Record<string, string> = {
    admin: 'Administrator',
    employee: 'Pracownik',
    receptionist: 'Recepcja',
};

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
    const { role, apiFetch } = useAuth();
    const id = router.query.id ? Number(router.query.id) : null;
    useSetSecondaryNav(NAV);

    const { data: employee, isLoading } = useEmployee(id);
    const [resetOpen, setResetOpen] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [resetError, setResetError] = useState('');
    const [resetSuccess, setResetSuccess] = useState(false);
    const [resetting, setResetting] = useState(false);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword.length < 6) {
            setResetError('Hasło musi mieć co najmniej 6 znaków');
            return;
        }
        if (newPassword !== confirmPassword) {
            setResetError('Hasła nie są zgodne');
            return;
        }
        setResetError('');
        setResetting(true);
        try {
            await apiFetch(`/employees/${id}/password`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newPassword }),
            });
            setResetSuccess(true);
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            setResetError(
                err instanceof Error ? err.message : 'Błąd resetu hasła',
            );
        } finally {
            setResetting(false);
        }
    };

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
                            ]}
                        />
                        <PanelSection
                            action={
                                <Link
                                    href={
                                        id
                                            ? `/settings/employees/${id}/edit`
                                            : '#'
                                    }
                                    className="btn btn-primary float-end"
                                >
                                    Edytuj
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
                                        <dt>Email</dt>
                                        <dd>{employee.email ?? '—'}</dd>
                                        <dt>Rola</dt>
                                        <dd>
                                            {ROLE_LABELS[employee.role ?? ''] ??
                                                employee.role ??
                                                '—'}
                                        </dd>
                                    </dl>
                                    <div
                                        className="d-flex gap-2"
                                        style={{ marginTop: 16 }}
                                    >
                                        <Link
                                            href={
                                                id
                                                    ? `/settings/employees/${id}/events-history`
                                                    : '#'
                                            }
                                            className="btn btn-outline-secondary"
                                        >
                                            Historia wizyt
                                        </Link>
                                        <button
                                            type="button"
                                            className="btn btn-outline-warning"
                                            onClick={() => {
                                                setResetSuccess(false);
                                                setResetError('');
                                                setNewPassword('');
                                                setConfirmPassword('');
                                                setResetOpen(true);
                                            }}
                                        >
                                            Resetuj hasło
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <p>Nie znaleziono pracownika.</p>
                            )}
                        </PanelSection>
                    </div>
                </div>

                <Modal
                    open={resetOpen}
                    onClose={() => setResetOpen(false)}
                    size="sm"
                >
                    <h5 className="fw-bold mb-4">
                        Resetuj hasło — {employee?.name}
                    </h5>
                    {resetSuccess ? (
                        <div
                            role="status"
                            className="alert alert-success py-2 small"
                        >
                            Hasło zostało zmienione.
                        </div>
                    ) : (
                        <form
                            onSubmit={(e) => void handleResetPassword(e)}
                            noValidate
                        >
                            <div className="mb-3">
                                <label
                                    htmlFor="rp-new"
                                    className="form-label fw-medium"
                                >
                                    Nowe hasło
                                </label>
                                <input
                                    id="rp-new"
                                    type="password"
                                    className="form-control"
                                    value={newPassword}
                                    onChange={(e) =>
                                        setNewPassword(e.target.value)
                                    }
                                    autoComplete="new-password"
                                    disabled={resetting}
                                    minLength={6}
                                    required
                                />
                                <div className="form-text">
                                    Minimum 6 znaków
                                </div>
                            </div>
                            <div className="mb-3">
                                <label
                                    htmlFor="rp-confirm"
                                    className="form-label fw-medium"
                                >
                                    Potwierdź hasło
                                </label>
                                <input
                                    id="rp-confirm"
                                    type="password"
                                    className="form-control"
                                    value={confirmPassword}
                                    onChange={(e) =>
                                        setConfirmPassword(e.target.value)
                                    }
                                    autoComplete="new-password"
                                    disabled={resetting}
                                    required
                                />
                            </div>
                            {resetError && (
                                <div
                                    role="alert"
                                    className="alert alert-danger py-2 small mb-3"
                                >
                                    {resetError}
                                </div>
                            )}
                            <div className="d-flex gap-2 justify-content-end">
                                <button
                                    type="button"
                                    className="btn btn-light"
                                    onClick={() => setResetOpen(false)}
                                    disabled={resetting}
                                >
                                    Anuluj
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-warning"
                                    disabled={
                                        resetting ||
                                        !newPassword ||
                                        !confirmPassword
                                    }
                                >
                                    {resetting ? 'Zapisywanie…' : 'Ustaw hasło'}
                                </button>
                            </div>
                        </form>
                    )}
                </Modal>
            </SalonShell>
        </RouteGuard>
    );
}
