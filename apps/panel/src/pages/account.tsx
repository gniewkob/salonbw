import Head from 'next/head';
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import PanelSection from '@/components/ui/PanelSection';
import { useAuth } from '@/contexts/AuthContext';
import type { Gender } from '@/types';

const ROLE_LABELS: Record<string, string> = {
    admin: 'Administrator',
    employee: 'Pracownik',
    receptionist: 'Recepcja',
    client: 'Klient',
};

type ProfileDraft = {
    firstName: string;
    lastName: string;
    phone: string;
    birthDate: string;
    gender: '' | Gender;
    address: string;
    city: string;
    postalCode: string;
    description: string;
};

const emptyProfileDraft: ProfileDraft = {
    firstName: '',
    lastName: '',
    phone: '',
    birthDate: '',
    gender: '',
    address: '',
    city: '',
    postalCode: '',
    description: '',
};

function splitName(name?: string | null) {
    const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
    return {
        firstName: parts[0] ?? '',
        lastName: parts.slice(1).join(' '),
    };
}

export default function AccountPage() {
    const { role, user, apiFetch, refreshProfile } = useAuth();
    const [current, setCurrent] = useState('');
    const [next, setNext] = useState('');
    const [confirm, setConfirm] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const [profile, setProfile] = useState<ProfileDraft>(emptyProfileDraft);
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileSaved, setProfileSaved] = useState(false);
    const [profileError, setProfileError] = useState('');
    const [avatarSaving, setAvatarSaving] = useState(false);
    const [avatarError, setAvatarError] = useState('');

    const [notifyPanel, setNotifyPanel] = useState(true);
    const [smsConsent, setSmsConsent] = useState(false);
    const [whatsappConsent, setWhatsappConsent] = useState(false);
    const [emailConsent, setEmailConsent] = useState(false);
    const [consentSaving, setConsentSaving] = useState(false);
    const [consentSaved, setConsentSaved] = useState(false);
    const [consentError, setConsentError] = useState('');

    useEffect(() => {
        if (!user) return;
        const fallbackName = splitName(user.name);
        setProfile({
            firstName: user.firstName ?? fallbackName.firstName,
            lastName: user.lastName ?? fallbackName.lastName,
            phone: user.phone ?? '',
            birthDate: user.birthDate?.slice(0, 10) ?? '',
            gender: user.gender ?? '',
            address: user.address ?? '',
            city: user.city ?? '',
            postalCode: user.postalCode ?? '',
            description: user.description ?? '',
        });
        setNotifyPanel(user.notifyPanel ?? true);
        setSmsConsent(Boolean(user.smsConsent));
        setWhatsappConsent(Boolean(user.whatsappConsent));
        setEmailConsent(Boolean(user.emailConsent));
    }, [user]);

    const displayName = useMemo(() => {
        const fullName = `${profile.firstName} ${profile.lastName}`.trim();
        return fullName || user?.name || 'Użytkownik';
    }, [profile.firstName, profile.lastName, user?.name]);

    const initials = useMemo(() => {
        const [first = '', second = ''] = displayName.split(/\s+/, 2);
        return `${first[0] ?? ''}${second[0] ?? ''}`.toUpperCase() || 'SB';
    }, [displayName]);

    const updateProfileField = <K extends keyof ProfileDraft>(
        field: K,
        value: ProfileDraft[K],
    ) => {
        setProfile((prev) => ({ ...prev, [field]: value }));
        setProfileSaved(false);
    };

    const handleProfileSave = async () => {
        const firstName = profile.firstName.trim();
        const lastName = profile.lastName.trim();
        const fullName = `${firstName} ${lastName}`.trim();
        if (!fullName) {
            setProfileError('Podaj imię lub nazwisko.');
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
                    name: fullName,
                    firstName: firstName || null,
                    lastName: lastName || null,
                    phone: profile.phone.trim() || null,
                    birthDate: profile.birthDate || null,
                    gender: profile.gender || null,
                    address: profile.address.trim() || null,
                    city: profile.city.trim() || null,
                    postalCode: profile.postalCode.trim() || null,
                    description: profile.description.trim() || null,
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

    const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setAvatarError('Wybierz plik graficzny.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setAvatarError('Zdjęcie może mieć maksymalnie 5 MB.');
            return;
        }
        setAvatarSaving(true);
        setAvatarError('');
        setProfileSaved(false);
        const formData = new FormData();
        formData.append('avatar', file);
        try {
            await apiFetch('/users/profile/avatar', {
                method: 'POST',
                body: formData,
            });
            await refreshProfile();
            setProfileSaved(true);
        } catch {
            setAvatarError('Nie udało się zapisać zdjęcia profilowego.');
        } finally {
            setAvatarSaving(false);
        }
    };

    const handleAvatarRemove = async () => {
        setAvatarSaving(true);
        setAvatarError('');
        setProfileSaved(false);
        try {
            await apiFetch('/users/profile/avatar', { method: 'DELETE' });
            await refreshProfile();
            setProfileSaved(true);
        } catch {
            setAvatarError('Nie udało się usunąć zdjęcia profilowego.');
        } finally {
            setAvatarSaving(false);
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
                            <div className="account-profile">
                                <aside className="account-profile__photo">
                                    <div className="account-profile__avatar">
                                        {user.avatarUrl ? (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img
                                                alt=""
                                                src={user.avatarUrl}
                                                className="account-profile__avatar-img"
                                            />
                                        ) : (
                                            <span>{initials}</span>
                                        )}
                                    </div>
                                    <div className="account-profile__identity">
                                        <strong>{displayName}</strong>
                                        <span>
                                            {ROLE_LABELS[user.role] ??
                                                user.role}
                                        </span>
                                    </div>
                                    <label className="btn btn-outline-secondary account-profile__upload">
                                        {avatarSaving
                                            ? 'Zapisywanie...'
                                            : 'Zmień zdjęcie'}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            disabled={avatarSaving}
                                            onChange={(event) =>
                                                void handleAvatarChange(event)
                                            }
                                        />
                                    </label>
                                    {user.avatarUrl && (
                                        <button
                                            type="button"
                                            className="btn btn-link account-profile__remove"
                                            disabled={avatarSaving}
                                            onClick={() =>
                                                void handleAvatarRemove()
                                            }
                                        >
                                            Usuń zdjęcie
                                        </button>
                                    )}
                                    {avatarError && (
                                        <div
                                            role="alert"
                                            className="account-profile__error"
                                        >
                                            {avatarError}
                                        </div>
                                    )}
                                </aside>

                                <div className="account-profile__form">
                                    <div className="account-profile__grid">
                                        <div className="account-profile__field">
                                            <label htmlFor="acc-first-name">
                                                Imię
                                            </label>
                                            <input
                                                id="acc-first-name"
                                                type="text"
                                                className="form-control"
                                                value={profile.firstName}
                                                maxLength={120}
                                                disabled={profileSaving}
                                                autoComplete="given-name"
                                                onChange={(e) =>
                                                    updateProfileField(
                                                        'firstName',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                        <div className="account-profile__field">
                                            <label htmlFor="acc-last-name">
                                                Nazwisko
                                            </label>
                                            <input
                                                id="acc-last-name"
                                                type="text"
                                                className="form-control"
                                                value={profile.lastName}
                                                maxLength={120}
                                                disabled={profileSaving}
                                                autoComplete="family-name"
                                                onChange={(e) =>
                                                    updateProfileField(
                                                        'lastName',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                        <div className="account-profile__field">
                                            <label htmlFor="acc-phone">
                                                Numer telefonu
                                            </label>
                                            <input
                                                id="acc-phone"
                                                type="tel"
                                                className="form-control"
                                                value={profile.phone}
                                                maxLength={20}
                                                disabled={profileSaving}
                                                autoComplete="tel"
                                                onChange={(e) =>
                                                    updateProfileField(
                                                        'phone',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                        <div className="account-profile__field">
                                            <label htmlFor="acc-email">
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
                                        </div>
                                        <div className="account-profile__field">
                                            <label htmlFor="acc-birth-date">
                                                Data urodzenia
                                            </label>
                                            <input
                                                id="acc-birth-date"
                                                type="date"
                                                className="form-control"
                                                value={profile.birthDate}
                                                disabled={profileSaving}
                                                onChange={(e) =>
                                                    updateProfileField(
                                                        'birthDate',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                        <div className="account-profile__field">
                                            <label htmlFor="acc-gender">
                                                Płeć
                                            </label>
                                            <select
                                                id="acc-gender"
                                                className="form-control"
                                                value={profile.gender}
                                                disabled={profileSaving}
                                                onChange={(e) =>
                                                    updateProfileField(
                                                        'gender',
                                                        (e.target.value ||
                                                            '') as ProfileDraft['gender'],
                                                    )
                                                }
                                            >
                                                <option value="">
                                                    Nie podano
                                                </option>
                                                <option value="female">
                                                    Kobieta
                                                </option>
                                                <option value="male">
                                                    Mężczyzna
                                                </option>
                                                <option value="other">
                                                    Inna
                                                </option>
                                            </select>
                                        </div>
                                        <div className="account-profile__field account-profile__field--wide">
                                            <label htmlFor="acc-address">
                                                Adres
                                            </label>
                                            <input
                                                id="acc-address"
                                                type="text"
                                                className="form-control"
                                                value={profile.address}
                                                maxLength={255}
                                                disabled={profileSaving}
                                                autoComplete="street-address"
                                                onChange={(e) =>
                                                    updateProfileField(
                                                        'address',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                        <div className="account-profile__field">
                                            <label htmlFor="acc-postal-code">
                                                Kod pocztowy
                                            </label>
                                            <input
                                                id="acc-postal-code"
                                                type="text"
                                                className="form-control"
                                                value={profile.postalCode}
                                                maxLength={20}
                                                disabled={profileSaving}
                                                autoComplete="postal-code"
                                                onChange={(e) =>
                                                    updateProfileField(
                                                        'postalCode',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                        <div className="account-profile__field">
                                            <label htmlFor="acc-city">
                                                Miasto
                                            </label>
                                            <input
                                                id="acc-city"
                                                type="text"
                                                className="form-control"
                                                value={profile.city}
                                                maxLength={120}
                                                disabled={profileSaving}
                                                autoComplete="address-level2"
                                                onChange={(e) =>
                                                    updateProfileField(
                                                        'city',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                        <div className="account-profile__field account-profile__field--wide">
                                            <label htmlFor="acc-description">
                                                Informacje dla salonu
                                            </label>
                                            <textarea
                                                id="acc-description"
                                                className="form-control"
                                                value={profile.description}
                                                maxLength={1000}
                                                disabled={profileSaving}
                                                rows={4}
                                                onChange={(e) =>
                                                    updateProfileField(
                                                        'description',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div className="account-profile__meta">
                                        Email i rola konta są zarządzane przez
                                        administratora.
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
                                        disabled={
                                            profileSaving || !displayName.trim()
                                        }
                                        onClick={() => void handleProfileSave()}
                                    >
                                        {profileSaving
                                            ? 'Zapisywanie...'
                                            : 'Zapisz dane'}
                                    </button>
                                </div>
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
