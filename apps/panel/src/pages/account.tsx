import { FormEvent, useState } from 'react';
import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import PanelSection from '@/components/ui/PanelSection';
import { useAuth } from '@/contexts/AuthContext';

const ROLE_LABELS: Record<string, string> = {
    admin: 'Administrator',
    employee: 'Pracownik',
    receptionist: 'Recepcja',
    client: 'Klient',
};

export default function AccountPage() {
    const { role, user, apiFetch } = useAuth();
    const [current, setCurrent] = useState('');
    const [next, setNext] = useState('');
    const [confirm, setConfirm] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (next.length < 6) {
            setError('Nowe hasło musi mieć co najmniej 6 znaków');
            return;
        }
        if (next !== confirm) {
            setError('Hasła nie są zgodne');
            return;
        }
        setError('');
        setSuccess(false);
        setSubmitting(true);
        try {
            await apiFetch('/users/profile/password', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword: current,
                    newPassword: next,
                }),
            });
            setSuccess(true);
            setCurrent('');
            setNext('');
            setConfirm('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Błąd zmiany hasła');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <RouteGuard
            roles={['admin', 'employee', 'receptionist', 'client']}
            permission="nav:calendar"
        >
            <SalonShell role={role}>
                <div className="salonbw-page">
                    <SalonBreadcrumbs
                        iconClass="sprite-breadcrumbs_settings"
                        items={[{ label: 'Moje konto' }]}
                    />

                    <PanelSection title="Informacje o koncie">
                        {user ? (
                            <dl className="dl-horizontal">
                                <dt>Imię i nazwisko</dt>
                                <dd>{user.name}</dd>
                                <dt>Adres email</dt>
                                <dd>{user.email}</dd>
                                <dt>Rola</dt>
                                <dd>
                                    {ROLE_LABELS[user.role] ?? user.role}
                                </dd>
                            </dl>
                        ) : (
                            <p className="text-muted">Ładowanie...</p>
                        )}
                    </PanelSection>

                    <PanelSection title="Zmień hasło">
                        <form
                            onSubmit={(e) => void handleSubmit(e)}
                            style={{ maxWidth: 400 }}
                            noValidate
                        >
                            <div className="mb-3">
                                <label
                                    htmlFor="acc-current"
                                    className="form-label"
                                >
                                    Aktualne hasło
                                </label>
                                <input
                                    id="acc-current"
                                    type="password"
                                    className="form-control"
                                    value={current}
                                    onChange={(e) => setCurrent(e.target.value)}
                                    autoComplete="current-password"
                                    disabled={submitting}
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="acc-new" className="form-label">
                                    Nowe hasło
                                </label>
                                <input
                                    id="acc-new"
                                    type="password"
                                    className="form-control"
                                    value={next}
                                    onChange={(e) => setNext(e.target.value)}
                                    autoComplete="new-password"
                                    disabled={submitting}
                                    required
                                    minLength={6}
                                />
                                <div className="form-text">
                                    Minimum 6 znaków
                                </div>
                            </div>
                            <div className="mb-3">
                                <label
                                    htmlFor="acc-confirm"
                                    className="form-label"
                                >
                                    Potwierdź nowe hasło
                                </label>
                                <input
                                    id="acc-confirm"
                                    type="password"
                                    className="form-control"
                                    value={confirm}
                                    onChange={(e) => setConfirm(e.target.value)}
                                    autoComplete="new-password"
                                    disabled={submitting}
                                    required
                                />
                            </div>
                            {error && (
                                <div
                                    role="alert"
                                    className="alert alert-danger py-2 small mb-3"
                                >
                                    {error}
                                </div>
                            )}
                            {success && (
                                <div
                                    role="status"
                                    className="alert alert-success py-2 small mb-3"
                                >
                                    Hasło zostało zmienione.
                                </div>
                            )}
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={
                                    submitting || !current || !next || !confirm
                                }
                            >
                                {submitting ? 'Zapisywanie…' : 'Zmień hasło'}
                            </button>
                        </form>
                    </PanelSection>
                </div>
            </SalonShell>
        </RouteGuard>
    );
}
