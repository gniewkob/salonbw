import Head from 'next/head';
import { FormEvent, useEffect, useState } from 'react';
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
    const { role, user, apiFetch, refreshProfile } = useAuth();
    const [current, setCurrent] = useState('');
    const [next, setNext] = useState('');
    const [confirm, setConfirm] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileSaved, setProfileSaved] = useState(false);
    const [profileError, setProfileError] = useState('');

    const [notifyPanel, setNotifyPanel] = useState(true);
    const [smsConsent, setSmsConsent] = useState(false);
    const [whatsappConsent, setWhatsappConsent] = useState(false);
    const [emailConsent, setEmailConsent] = useState(false);
    const [consentSaving, setConsentSaving] = useState(false);
    const [consentSaved, setConsentSaved] = useState(false);
    const [consentError, setConsentError] = useState('');

    useEffect(() => {
        if (!user) return;
        setName(user.name ?? '');
        setPhone(user.phone ?? '');
        setNotifyPanel(user.notifyPanel ?? true);
        setSmsConsent(Boolean(user.smsConsent));
        setWhatsappConsent(Boolean(user.whatsappConsent));
        setEmailConsent(Boolean(user.emailConsent));
    }, [user]);

    const handleProfileSave = async () => {
        if (!name.trim()) {
            setProfileError('Imię i nazwisko nie może być puste.');
            return;
        }
        setProfileSaving(true);
        setProfileError('');
        setProfileSaved(false);
        try {
            await apiFetch('/users/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name.trim(),
                    phone: phone.trim(),
                }),
            });
            await refreshProfile();
            setProfileSaved(true);
        } catch {
            setProfileError('Nie udało się zapisać profilu. Spróbuj ponownie.');
        } finally {
            setProfileSaving(false);
        }
    };

    const handleConsentSave = async () => {
        setConsentSaving(true);
        setConsentError('');
        setConsentSaved(false);
        try {
            await apiFetch('/users/profile/consent', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    notifyPanel,
                    smsConsent,
                    whatsappConsent,
                    emailConsent,
                }),
            });
            await refreshProfile();
            setConsentSaved(true);
        } catch {
            setConsentError('Nie udało się zapisać zgód. Spróbuj ponownie.');
        } finally {
            setConsentSaving(false);
        }
    };

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
        <RouteGuard roles={['admin', 'employee', 'receptionist', 'client']}>
            <Head>
                <title>Moje konto — Salon Black &amp; White</title>
            </Head>
            <SalonShell role={role}>
                <div className="salonbw-page">
                    <SalonBreadcrumbs
                        iconClass="sprite-breadcrumbs_settings"
                        items={[{ label: 'Moje konto' }]}
                    />

                    <PanelSection title="Dane profilu">
                        {user ? (
                            <div style={{ maxWidth: 480 }}>
                                <div className="mb-3">
                                    <label
                                        htmlFor="acc-name"
                                        className="form-label"
                                    >
                                        Imię i nazwisko
                                    </label>
                                    <input
                                        id="acc-name"
                                        type="text"
                                        className="form-control"
                                        value={name}
                                        maxLength={255}
                                        disabled={profileSaving}
                                        autoComplete="name"
                                        onChange={(e) => {
                                            setName(e.target.value);
                                            setProfileSaved(false);
                                        }}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label
                                        htmlFor="acc-phone"
                                        className="form-label"
                                    >
                                        Numer telefonu
                                    </label>
                                    <input
                                        id="acc-phone"
                                        type="tel"
                                        className="form-control"
                                        value={phone}
                                        maxLength={20}
                                        disabled={profileSaving}
                                        autoComplete="tel"
                                        onChange={(e) => {
                                            setPhone(e.target.value);
                                            setProfileSaved(false);
                                        }}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label
                                        htmlFor="acc-email"
                                        className="form-label"
                                    >
                                        Adres email
                                    </label>
                                    <input
                                        id="acc-email"
                                        type="email"
                                        className="form-control"
                                        value={user.email}
                                        readOnly
                                        disabled
                                    />
                                    <div className="form-text">
                                        Adres email i rola (
                                        {ROLE_LABELS[user.role] ?? user.role})
                                        zmienia administrator.
                                    </div>
                                </div>
                                {profileError && (
                                    <div
                                        role="alert"
                                        className="alert alert-danger py-2 small mb-3"
                                    >
                                        {profileError}
                                    </div>
                                )}
                                {profileSaved && (
                                    <div
                                        role="status"
                                        className="alert alert-success py-2 small mb-3"
                                    >
                                        Dane profilu zostały zapisane.
                                    </div>
                                )}
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    disabled={profileSaving || !name.trim()}
                                    onClick={() => void handleProfileSave()}
                                >
                                    {profileSaving
                                        ? 'Zapisywanie…'
                                        : 'Zapisz dane'}
                                </button>
                            </div>
                        ) : (
                            <p className="text-muted">Ładowanie...</p>
                        )}
                    </PanelSection>

                    <PanelSection title="Powiadomienia i zgody kontaktowe">
                        <p className="text-muted" style={{ marginTop: -4 }}>
                            Wybierz, którymi kanałami salon ma Cię powiadamiać o
                            wizytach (potwierdzenia, przypomnienia, zmiany
                            terminu, wiadomości). Możesz to zmienić w każdej
                            chwili.
                        </p>
                        <div style={{ maxWidth: 480 }}>
                            <div className="form-check mb-2">
                                <input
                                    id="acc-notify-panel"
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={notifyPanel}
                                    disabled={consentSaving}
                                    onChange={(e) => {
                                        setNotifyPanel(e.target.checked);
                                        setConsentSaved(false);
                                    }}
                                />
                                <label
                                    htmlFor="acc-notify-panel"
                                    className="form-check-label"
                                >
                                    Panel (w aplikacji) — powiadomienia na
                                    pulpicie po zalogowaniu
                                </label>
                            </div>
                            <div className="form-check mb-2">
                                <input
                                    id="acc-consent-sms"
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={smsConsent}
                                    disabled={consentSaving}
                                    onChange={(e) => {
                                        setSmsConsent(e.target.checked);
                                        setConsentSaved(false);
                                    }}
                                />
                                <label
                                    htmlFor="acc-consent-sms"
                                    className="form-check-label"
                                >
                                    SMS (na telefon)
                                </label>
                            </div>
                            <div className="form-check mb-2">
                                <input
                                    id="acc-consent-whatsapp"
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={whatsappConsent}
                                    disabled={consentSaving}
                                    onChange={(e) => {
                                        setWhatsappConsent(e.target.checked);
                                        setConsentSaved(false);
                                    }}
                                />
                                <label
                                    htmlFor="acc-consent-whatsapp"
                                    className="form-check-label"
                                >
                                    WhatsApp
                                </label>
                            </div>
                            <div className="form-check mb-3">
                                <input
                                    id="acc-consent-email"
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={emailConsent}
                                    disabled={consentSaving}
                                    onChange={(e) => {
                                        setEmailConsent(e.target.checked);
                                        setConsentSaved(false);
                                    }}
                                />
                                <label
                                    htmlFor="acc-consent-email"
                                    className="form-check-label"
                                >
                                    E-mail (potwierdzenia, przypomnienia,
                                    informacje)
                                </label>
                            </div>
                            {consentError && (
                                <div
                                    role="alert"
                                    className="alert alert-danger py-2 small mb-3"
                                >
                                    {consentError}
                                </div>
                            )}
                            {consentSaved && (
                                <div
                                    role="status"
                                    className="alert alert-success py-2 small mb-3"
                                >
                                    Zgody zostały zapisane.
                                </div>
                            )}
                            <button
                                type="button"
                                className="btn btn-primary"
                                disabled={consentSaving}
                                onClick={() => void handleConsentSave()}
                            >
                                {consentSaving
                                    ? 'Zapisywanie…'
                                    : 'Zapisz zgody'}
                            </button>
                        </div>
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
