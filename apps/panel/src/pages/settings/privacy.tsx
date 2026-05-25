import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import { useAuth } from '@/contexts/AuthContext';
import type { User } from '@/types';

export default function PrivacySettingsPage() {
    const { role, apiFetch } = useAuth();

    const [profile, setProfile] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [saveSuccess, setSaveSuccess] = useState(false);

    const [smsConsent, setSmsConsent] = useState(false);
    const [emailConsent, setEmailConsent] = useState(false);

    const loadProfile = useCallback(() => {
        setLoading(true);
        setLoadError('');
        apiFetch<User>('/users/profile')
            .then((data) => {
                setProfile(data);
                setSmsConsent(data.smsConsent ?? false);
                setEmailConsent(data.emailConsent ?? false);
            })
            .catch(() => {
                setLoadError(
                    'Nie udało się załadować aktualnych zgód. Spróbuj ponownie.',
                );
            })
            .finally(() => setLoading(false));
    }, [apiFetch]);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    const handleSave = async () => {
        if (loadError) return;
        setSaving(true);
        setSaveError('');
        setSaveSuccess(false);
        try {
            await apiFetch('/users/profile/consent', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ smsConsent, emailConsent }),
            });
            setSaveSuccess(true);
        } catch {
            setSaveError('Nie udało się zapisać ustawień. Spróbuj ponownie.');
        } finally {
            setSaving(false);
        }
    };


    return (
        <RouteGuard roles={['client', 'employee', 'receptionist', 'admin']}>
            <SalonShell role={role}>
                <Head>
                    <title>Zgody i prywatność — Salon Black &amp; White</title>
                </Head>
                <div className="salon-section">
                    <div className="salon-column-row">
                        <div className="salon-column">
                            <h2>Zgody i prywatność (RODO)</h2>

                            {loading ? (
                                <p className="text-muted">
                                    Ładowanie ustawień...
                                </p>
                            ) : loadError ? (
                                <div className="border rounded p-3 mb-4">
                                    <p className="text-danger small mb-3">
                                        {loadError}
                                    </p>
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary btn-sm"
                                        onClick={loadProfile}
                                    >
                                        Spróbuj ponownie
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {profile && (
                                        <div className="border rounded p-3 mb-4">
                                            <h3 className="h6 mb-3">
                                                Twoje zgody
                                            </h3>

                                            <dl className="row mb-0 small">
                                                <dt className="col-sm-5 text-muted fw-normal">
                                                    Przetwarzanie danych
                                                </dt>
                                                <dd className="col-sm-7">
                                                    {profile.gdprConsent ? (
                                                        <span className="text-success">
                                                            ✓ Wyrażono{' '}
                                                            {profile.gdprConsentDate
                                                                ? new Date(
                                                                      profile.gdprConsentDate,
                                                                  ).toLocaleDateString(
                                                                      'pl-PL',
                                                                  )
                                                                : ''}
                                                        </span>
                                                    ) : (
                                                        <span className="text-danger">
                                                            ✗ Brak zgody
                                                        </span>
                                                    )}
                                                </dd>
                                            </dl>
                                        </div>
                                    )}

                                    <div className="border rounded p-3 mb-4">
                                        <h3 className="h6 mb-3">
                                            Zgody marketingowe
                                        </h3>
                                        <p className="text-muted small mb-3">
                                            Możesz w dowolnym momencie zmienić
                                            lub wycofać poniższe zgody
                                            marketingowe. Wycofanie zgody nie
                                            wpływa na zgodność z prawem
                                            przetwarzania dokonanego przed
                                            wycofaniem.
                                        </p>

                                        <div className="d-flex flex-column gap-3">
                                            <label className="d-flex gap-2 align-items-start">
                                                <input
                                                    type="checkbox"
                                                    className="form-check-input mt-1"
                                                    checked={smsConsent}
                                                    onChange={(e) =>
                                                        setSmsConsent(
                                                            e.target.checked,
                                                        )
                                                    }
                                                />
                                                <span className="small">
                                                    <strong className="d-block">
                                                        SMS / WhatsApp
                                                    </strong>
                                                    Wyrażam zgodę na
                                                    otrzymywanie informacji
                                                    marketingowych oraz
                                                    przypomnień o wizytach drogą
                                                    SMS i WhatsApp.
                                                </span>
                                            </label>

                                            <label className="d-flex gap-2 align-items-start">
                                                <input
                                                    type="checkbox"
                                                    className="form-check-input mt-1"
                                                    checked={emailConsent}
                                                    onChange={(e) =>
                                                        setEmailConsent(
                                                            e.target.checked,
                                                        )
                                                    }
                                                />
                                                <span className="small">
                                                    <strong className="d-block">
                                                        E-mail
                                                    </strong>
                                                    Wyrażam zgodę na
                                                    otrzymywanie informacji
                                                    marketingowych drogą e-mail.
                                                </span>
                                            </label>
                                        </div>

                                        {saveError && (
                                            <p className="text-danger small mt-3 mb-0">
                                                {saveError}
                                            </p>
                                        )}
                                        {saveSuccess && (
                                            <p className="text-success small mt-3 mb-0">
                                                Ustawienia zostały zapisane.
                                            </p>
                                        )}

                                        <button
                                            type="button"
                                            className="btn btn-salon btn-sm mt-3"
                                            onClick={() => void handleSave()}
                                            disabled={saving}
                                        >
                                            {saving
                                                ? 'Zapisywanie...'
                                                : 'Zapisz ustawienia'}
                                        </button>
                                    </div>

                                    <div className="border rounded p-3 text-muted small">
                                        <h3 className="h6 mb-2">
                                            Twoje prawa (RODO / GDPR)
                                        </h3>
                                        <ul className="mb-0 ps-3">
                                            <li>
                                                <strong>Prawo dostępu</strong> —
                                                możesz zażądać kopii swoich
                                                danych osobowych.
                                            </li>
                                            <li>
                                                <strong>
                                                    Prawo do sprostowania
                                                </strong>{' '}
                                                — możesz poprosić o korektę
                                                nieprawidłowych danych.
                                            </li>
                                            <li>
                                                <strong>
                                                    Prawo do usunięcia
                                                </strong>{' '}
                                                — możesz zażądać usunięcia
                                                swoich danych (prawo do bycia
                                                zapomnianym).
                                            </li>
                                            <li>
                                                <strong>
                                                    Prawo do przenoszenia danych
                                                </strong>{' '}
                                                — możesz zażądać przekazania
                                                danych w formacie
                                                maszynoczytnym.
                                            </li>
                                        </ul>
                                        <p className="mt-2 mb-0">
                                            W celu realizacji powyższych praw
                                            skontaktuj się z nami:{' '}
                                            <a
                                                href="mailto:salon@example.pl"
                                                className="text-decoration-underline"
                                            >
                                                salon@example.pl
                                            </a>
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </SalonShell>
        </RouteGuard>
    );
}
