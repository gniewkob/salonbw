import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import PanelActionBar from '@/components/ui/PanelActionBar';
import { useAuth } from '@/contexts/AuthContext';
import type { User } from '@/types';
import {
    useDataProtectionEmployeeLimits,
    useDataProtectionSettings,
    useSettingsMutations,
} from '@/hooks/useSettings';

type Tab = 'consent' | 'protection';

// --- ConsentTab ---

function ConsentTab() {
    const { apiFetch } = useAuth();
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
        <div className="salon-section">
            <div className="salon-column-row">
                <div className="salon-column">
                    <h2>Zgody i prywatność (RODO)</h2>

                    {loading ? (
                        <p className="text-muted">Ładowanie ustawień...</p>
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
                                    <h3 className="h6 mb-3">Twoje zgody</h3>
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
                                <h3 className="h6 mb-3">Zgody marketingowe</h3>
                                <p className="text-muted small mb-3">
                                    Możesz w dowolnym momencie zmienić lub
                                    wycofać poniższe zgody marketingowe.
                                    Wycofanie zgody nie wpływa na zgodność z
                                    prawem przetwarzania dokonanego przed
                                    wycofaniem.
                                </p>
                                <div className="d-flex flex-column gap-3">
                                    <label className="d-flex gap-2 align-items-start">
                                        <input
                                            type="checkbox"
                                            className="form-check-input mt-1"
                                            checked={smsConsent}
                                            onChange={(e) =>
                                                setSmsConsent(e.target.checked)
                                            }
                                        />
                                        <span className="small">
                                            <strong className="d-block">
                                                SMS / WhatsApp
                                            </strong>
                                            Wyrażam zgodę na otrzymywanie
                                            informacji marketingowych oraz
                                            przypomnień o wizytach drogą SMS i
                                            WhatsApp.
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
                                            Wyrażam zgodę na otrzymywanie
                                            informacji marketingowych drogą
                                            e-mail.
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
                                        <strong>Prawo dostępu</strong> — możesz
                                        zażądać kopii swoich danych osobowych.
                                    </li>
                                    <li>
                                        <strong>Prawo do sprostowania</strong> —
                                        możesz poprosić o korektę
                                        nieprawidłowych danych.
                                    </li>
                                    <li>
                                        <strong>Prawo do usunięcia</strong> —
                                        możesz zażądać usunięcia swoich danych
                                        (prawo do bycia zapomnianym).
                                    </li>
                                    <li>
                                        <strong>
                                            Prawo do przenoszenia danych
                                        </strong>{' '}
                                        — możesz zażądać przekazania danych w
                                        formacie maszynoczytnym.
                                    </li>
                                </ul>
                                <p className="mt-2 mb-0">
                                    W celu realizacji powyższych praw skontaktuj
                                    się z nami:{' '}
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
    );
}

// --- ProtectionTab (admin only) ---

function ProtectionTab() {
    const { data, isLoading, isError } = useDataProtectionSettings();
    const employeeLimits = useDataProtectionEmployeeLimits();
    const { updateDataProtection, updateDataProtectionEmployeeLimit } =
        useSettingsMutations();

    const [paranoiaMode, setParanoiaMode] = useState(false);
    const [paranoiaLimit, setParanoiaLimit] = useState(20);
    const [paranoiaEmail, setParanoiaEmail] = useState('');
    const [saved, setSaved] = useState(false);
    const [editingEmployeeId, setEditingEmployeeId] = useState<number | null>(
        null,
    );
    const [employeeLimitDraft, setEmployeeLimitDraft] = useState('');

    useEffect(() => {
        if (data) {
            setParanoiaMode(data.paranoiaMode);
            setParanoiaLimit(data.paranoiaLimit);
            setParanoiaEmail(data.paranoiaEmail ?? '');
        }
    }, [data]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateDataProtection.mutate(
            {
                paranoiaMode,
                paranoiaLimit,
                paranoiaEmail: paranoiaEmail || undefined,
            },
            {
                onSuccess: () => {
                    setSaved(true);
                    setTimeout(() => setSaved(false), 3000);
                },
            },
        );
    };

    const startEmployeeLimitEdit = (id: number, limit: number) => {
        setEditingEmployeeId(id);
        setEmployeeLimitDraft(String(limit));
    };

    const cancelEmployeeLimitEdit = () => {
        setEditingEmployeeId(null);
        setEmployeeLimitDraft('');
    };

    const saveEmployeeLimit = (id: number) => {
        const nextLimit = Number(employeeLimitDraft);
        if (!Number.isFinite(nextLimit) || nextLimit < 1) return;
        updateDataProtectionEmployeeLimit.mutate(
            { id, data: { paranoiaLimit: nextLimit } },
            { onSuccess: () => cancelEmployeeLimitEdit() },
        );
    };

    const clearEmployeeLimit = (id: number) => {
        updateDataProtectionEmployeeLimit.mutate(
            { id, data: { paranoiaLimit: null } },
            {
                onSuccess: () => {
                    if (editingEmployeeId === id) cancelEmployeeLimitEdit();
                },
            },
        );
    };

    const formatEmployeeRole = (r: string) => {
        if (r === 'admin') return 'Administrator';
        if (r === 'receptionist') return 'Recepcjonista';
        if (r === 'employee') return 'Pracownik';
        return r;
    };

    return (
        <>
            {isLoading && (
                <div className="edit_branch_form">
                    <p>Ładowanie...</p>
                </div>
            )}
            {isError && (
                <div className="edit_branch_form">
                    <div className="alert alert-danger">
                        Nie udało się załadować ustawień.
                    </div>
                </div>
            )}
            {!isLoading && !isError && (
                <form className="edit_branch_form" onSubmit={handleSubmit}>
                    <div className="actions">
                        <Link
                            className="btn btn-outline-secondary"
                            href="/settings/data-protection/logs"
                        >
                            Rejestr aktywności pracowników
                        </Link>
                    </div>

                    <h2>Tryb ochrony danych</h2>

                    {saved && (
                        <div className="alert alert-success">
                            Ustawienia zostały zapisane.
                        </div>
                    )}
                    {updateDataProtection.isError && (
                        <div className="alert alert-danger">
                            Wystąpił błąd podczas zapisywania ustawień.
                        </div>
                    )}

                    <div className="mb-3">
                        <span className="form-label d-block">
                            Tryb ochrony danych
                        </span>
                        <div>
                            <label className="checkbox-inline">
                                <input
                                    type="checkbox"
                                    checked={paranoiaMode}
                                    onChange={(e) =>
                                        setParanoiaMode(e.target.checked)
                                    }
                                />{' '}
                                Włącz tryb ochrony danych
                            </label>
                        </div>
                    </div>

                    {paranoiaMode && (
                        <>
                            <div className="mb-3">
                                <label
                                    htmlFor="privacy-paranoia-limit"
                                    className="form-label"
                                >
                                    Limit kontaktów
                                </label>
                                <div className="input-group input-group--narrow">
                                    <input
                                        id="privacy-paranoia-limit"
                                        type="number"
                                        className="form-control"
                                        min={1}
                                        title="Limit kontaktów"
                                        placeholder="20"
                                        value={paranoiaLimit}
                                        onChange={(e) =>
                                            setParanoiaLimit(
                                                Number(e.target.value),
                                            )
                                        }
                                    />
                                    <span className="input-group-text">
                                        kontakty
                                    </span>
                                </div>
                                <p className="form-text text-muted">
                                    Pracownik może wyświetlić dane kontaktowe
                                    maksymalnie tylu klientów dziennie.
                                </p>
                            </div>

                            <div className="mb-3">
                                <label
                                    htmlFor="privacy-paranoia-email"
                                    className="form-label"
                                >
                                    E-mail powiadomień
                                </label>
                                <input
                                    id="privacy-paranoia-email"
                                    type="email"
                                    className="form-control"
                                    value={paranoiaEmail}
                                    onChange={(e) =>
                                        setParanoiaEmail(e.target.value)
                                    }
                                    placeholder="np. admin@salon.pl"
                                />
                                <p className="form-text text-muted">
                                    Na ten adres będą wysyłane powiadomienia o
                                    przekroczeniu limitu.
                                </p>
                            </div>

                            <div className="mb-3">
                                <h2>Indywidualne limity dla pracowników</h2>
                                <p className="form-text text-muted">
                                    Ustal indywidualnie liczbę klientów, których
                                    dane kontaktowe mogą przeglądać poszczególni
                                    pracownicy w ciągu jednego dnia.
                                </p>
                                {employeeLimits.isLoading && (
                                    <p className="form-text text-muted">
                                        Ładowanie listy pracowników...
                                    </p>
                                )}
                                {employeeLimits.isError && (
                                    <div className="alert alert-danger">
                                        Nie udało się załadować limitów
                                        pracowników.
                                    </div>
                                )}
                                {updateDataProtectionEmployeeLimit.isError && (
                                    <div className="alert alert-danger">
                                        Nie udało się zapisać limitu pracownika.
                                    </div>
                                )}
                                {!employeeLimits.isLoading &&
                                    !employeeLimits.isError && (
                                        <ul className="data-protection-limits">
                                            {(employeeLimits.data ?? []).map(
                                                (employee) => {
                                                    const effectiveLimit =
                                                        employee.paranoiaLimitOverride ??
                                                        paranoiaLimit;
                                                    const isAdmin =
                                                        employee.role ===
                                                        'admin';
                                                    const isEditing =
                                                        editingEmployeeId ===
                                                        employee.id;
                                                    const isSavingThisRow =
                                                        updateDataProtectionEmployeeLimit.isPending &&
                                                        updateDataProtectionEmployeeLimit
                                                            .variables?.id ===
                                                            employee.id;
                                                    return (
                                                        <li key={employee.id}>
                                                            <span>
                                                                {employee.name}{' '}
                                                                <span className="data-protection-limits__role">
                                                                    (
                                                                    {formatEmployeeRole(
                                                                        employee.role,
                                                                    )}
                                                                    )
                                                                </span>
                                                            </span>
                                                            <br className="c" />
                                                            {isAdmin ? (
                                                                <span>
                                                                    Tryb ochrony
                                                                    danych
                                                                    kontaktowych
                                                                    klientów nie
                                                                    dotyczy
                                                                    administratorów
                                                                    konta w
                                                                    systemie.
                                                                    Moga oni
                                                                    przegladac
                                                                    karty
                                                                    klientow bez
                                                                    ograniczen.
                                                                </span>
                                                            ) : isEditing ? (
                                                                <div className="data-protection-limits__editor">
                                                                    <span>
                                                                        Limit
                                                                    </span>
                                                                    <input
                                                                        className="form-control data-protection-limits__input"
                                                                        min={1}
                                                                        type="number"
                                                                        value={
                                                                            employeeLimitDraft
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            setEmployeeLimitDraft(
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            )
                                                                        }
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-primary btn-sm"
                                                                        disabled={
                                                                            isSavingThisRow
                                                                        }
                                                                        onClick={() =>
                                                                            saveEmployeeLimit(
                                                                                employee.id,
                                                                            )
                                                                        }
                                                                    >
                                                                        zapisz
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-link p-0"
                                                                        disabled={
                                                                            isSavingThisRow
                                                                        }
                                                                        onClick={
                                                                            cancelEmployeeLimitEdit
                                                                        }
                                                                    >
                                                                        anuluj
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div className="data-protection-limits__summary">
                                                                    <span>
                                                                        Limit:{' '}
                                                                        <strong>
                                                                            {
                                                                                effectiveLimit
                                                                            }
                                                                        </strong>{' '}
                                                                        klientow
                                                                    </span>
                                                                    <button
                                                                        className="btn btn-link p-0"
                                                                        type="button"
                                                                        onClick={() =>
                                                                            startEmployeeLimitEdit(
                                                                                employee.id,
                                                                                effectiveLimit,
                                                                            )
                                                                        }
                                                                    >
                                                                        Zmien
                                                                        limit
                                                                    </button>
                                                                    {employee.paranoiaLimitOverride !==
                                                                        null && (
                                                                        <button
                                                                            type="button"
                                                                            className="btn btn-link p-0"
                                                                            disabled={
                                                                                isSavingThisRow
                                                                            }
                                                                            onClick={() =>
                                                                                clearEmployeeLimit(
                                                                                    employee.id,
                                                                                )
                                                                            }
                                                                        >
                                                                            Uzyj
                                                                            limitu
                                                                            domyslnego
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </li>
                                                    );
                                                },
                                            )}
                                        </ul>
                                    )}
                            </div>
                        </>
                    )}

                    <PanelActionBar
                        primary={
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={updateDataProtection.isPending}
                            >
                                {updateDataProtection.isPending
                                    ? 'Zapisywanie...'
                                    : 'Zapisz ustawienia'}
                            </button>
                        }
                    />
                </form>
            )}
        </>
    );
}

// --- Page ---

export default function PrivacySettingsPage() {
    const router = useRouter();
    const { role } = useAuth();
    const tab: Tab = (router.query.tab as Tab) ?? 'consent';
    const isAdmin = role === 'admin';

    return (
        <RouteGuard roles={['client', 'employee', 'receptionist', 'admin']}>
            <SalonShell role={role}>
                <Head>
                    <title>Prywatność i RODO — Salon Black &amp; White</title>
                </Head>
                <SalonBreadcrumbs
                    iconClass="sprite-breadcrumbs_settings"
                    items={[
                        { label: 'Ustawienia', href: '/settings' },
                        { label: 'Prywatność i RODO' },
                    ]}
                />

                <ul className="nav nav-tabs mb-3">
                    <li className="nav-item">
                        <Link
                            href="/settings/privacy"
                            className={`nav-link${tab === 'consent' ? ' active' : ''}`}
                        >
                            Zgody
                        </Link>
                    </li>
                    {isAdmin && (
                        <li className="nav-item">
                            <Link
                                href="/settings/privacy?tab=protection"
                                className={`nav-link${tab === 'protection' ? ' active' : ''}`}
                            >
                                Ochrona danych
                            </Link>
                        </li>
                    )}
                </ul>

                {tab === 'consent' && <ConsentTab />}
                {tab === 'protection' && isAdmin && <ProtectionTab />}
            </SalonShell>
        </RouteGuard>
    );
}
