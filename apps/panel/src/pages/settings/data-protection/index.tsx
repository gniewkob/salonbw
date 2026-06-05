import Link from 'next/link';
import { useState, useLayoutEffect } from 'react';
import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import { useAuth } from '@/contexts/AuthContext';
import { useSetSecondaryNav } from '@/contexts/SecondaryNavContext';
import CustomerSettingsNav from '@/components/settings/CustomerSettingsNav';
import {
    useDataProtectionSettings,
    useSettingsMutations,
} from '@/hooks/useSettings';

const CUSTOMER_SETTINGS_NAV = <CustomerSettingsNav />;

export default function DataProtectionPage() {
    const { role } = useAuth();
    const { data: settings, isLoading, error } = useDataProtectionSettings();
    const { updateDataProtection } = useSettingsMutations();

    const [paranoiaMode, setParanoiaMode] = useState(false);
    const [paranoiaLimit, setParanoiaLimit] = useState(30);
    const [paranoiaEmail, setParanoiaEmail] = useState('');
    const [saved, setSaved] = useState(false);

    useLayoutEffect(() => {
        if (settings) {
            setParanoiaMode(settings.paranoiaMode);
            setParanoiaLimit(settings.paranoiaLimit);
            setParanoiaEmail(settings.paranoiaEmail ?? '');
        }
    }, [settings]);

    useSetSecondaryNav(CUSTOMER_SETTINGS_NAV);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setSaved(false);
        void updateDataProtection
            .mutateAsync({
                paranoiaMode,
                paranoiaLimit,
                paranoiaEmail: paranoiaEmail || undefined,
            })
            .then(() => setSaved(true));
    };

    return (
        <RouteGuard roles={['admin']} permission="nav:settings">
            <SalonShell role={role}>
                <div className="salonbw-page" data-testid="data-protection-page">
                    <SalonBreadcrumbs
                        iconClass="sprite-breadcrumbs_settings"
                        items={[
                            { label: 'Ustawienia', href: '/settings' },
                            { label: 'Tryb ochrony danych' },
                        ]}
                    />

                    {isLoading ? (
                        <div className="text-muted p-3">Ładowanie...</div>
                    ) : error ? (
                        <div className="alert alert-danger">
                            Nie udało się pobrać ustawień ochrony danych.
                        </div>
                    ) : (
                        <form onSubmit={handleSave}>
                            <div className="mb-4">
                                <h3 className="fs-5 fw-semibold mb-3">
                                    Tryb ochrony danych (Paranoia Mode)
                                </h3>
                                <div className="form-check mb-3">
                                    <input
                                        id="paranoia-mode"
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={paranoiaMode}
                                        onChange={(e) =>
                                            setParanoiaMode(e.target.checked)
                                        }
                                    />
                                    <label
                                        className="form-check-label"
                                        htmlFor="paranoia-mode"
                                    >
                                        Włącz tryb ochrony danych
                                    </label>
                                    <div className="form-text text-muted">
                                        Ogranicza dostęp do danych osobowych klientów dla
                                        pracowników na podstawie ostatniej wizyty.
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label
                                        className="form-label"
                                        htmlFor="paranoia-limit"
                                    >
                                        Limit dni bez wizyty (domyślny)
                                    </label>
                                    <input
                                        id="paranoia-limit"
                                        type="number"
                                        className="form-control"
                                        style={{ maxWidth: 120 }}
                                        value={paranoiaLimit}
                                        min={1}
                                        max={3650}
                                        onChange={(e) =>
                                            setParanoiaLimit(Number(e.target.value))
                                        }
                                        disabled={!paranoiaMode}
                                    />
                                    <div className="form-text text-muted">
                                        Po ilu dniach bez wizyty dane klienta stają się
                                        niedostępne.
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label
                                        className="form-label"
                                        htmlFor="paranoia-email"
                                    >
                                        E-mail do powiadomień
                                    </label>
                                    <input
                                        id="paranoia-email"
                                        type="email"
                                        className="form-control"
                                        style={{ maxWidth: 340 }}
                                        value={paranoiaEmail}
                                        onChange={(e) =>
                                            setParanoiaEmail(e.target.value)
                                        }
                                        disabled={!paranoiaMode}
                                        placeholder="np. admin@salon.pl"
                                    />
                                </div>
                            </div>

                            {saved && (
                                <div className="alert alert-success mb-3">
                                    Ustawienia zostały zapisane.
                                </div>
                            )}

                            <div className="d-flex gap-2 mb-4">
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={updateDataProtection.isPending}
                                >
                                    {updateDataProtection.isPending
                                        ? 'Zapisywanie...'
                                        : 'Zapisz ustawienia'}
                                </button>
                            </div>
                        </form>
                    )}

                    <div className="border-top pt-4 mt-2">
                        <h3 className="fs-5 fw-semibold mb-3">Logi i audyt</h3>
                        <p className="text-muted mb-3">
                            Historia dostępów i operacji na danych osobowych klientów.
                        </p>
                        <Link
                            href="/settings/data-protection/logs"
                            className="btn btn-outline-secondary"
                        >
                            Otwórz logi RODO →
                        </Link>
                    </div>
                </div>
            </SalonShell>
        </RouteGuard>
    );
}
