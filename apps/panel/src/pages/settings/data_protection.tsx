import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useSetSecondaryNav } from '@/contexts/SecondaryNavContext';
import CustomerSettingsNav from '@/components/settings/CustomerSettingsNav';
import PanelActionBar from '@/components/ui/PanelActionBar';
import {
    useDataProtectionSettings,
    useSettingsMutations,
} from '@/hooks/useSettings';

const NAV = <CustomerSettingsNav />;

export default function SettingsDataProtectionPage() {
    useSetSecondaryNav(NAV);

    const { data, isLoading, isError } = useDataProtectionSettings();
    const { updateDataProtection } = useSettingsMutations();

    const [paranoiaMode, setParanoiaMode] = useState(false);
    const [paranoiaLimit, setParanoiaLimit] = useState(20);
    const [paranoiaEmail, setParanoiaEmail] = useState('');
    const [saved, setSaved] = useState(false);

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
                            Klienci
                        </li>
                        <li>
                            <span> / </span>
                            Tryb ochrony danych
                        </li>
                    </ul>
                </div>

                {isLoading && (
                    <div className="inner edit_branch_form">
                        <p>Ładowanie...</p>
                    </div>
                )}

                {isError && (
                    <div className="inner edit_branch_form">
                        <div className="alert alert-danger">
                            Nie udało się załadować ustawień.
                        </div>
                    </div>
                )}

                {!isLoading && !isError && (
                    <form
                        className="inner edit_branch_form"
                        onSubmit={handleSubmit}
                    >
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

                        <div className="form-group">
                            <label className="control-label">
                                Tryb ochrony danych
                            </label>
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
                                <div className="form-group">
                                    <label className="control-label">
                                        Limit kontaktów
                                    </label>
                                    <div className="input-group input-group--narrow">
                                        <input
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
                                        <span className="input-group-addon">
                                            kontakty
                                        </span>
                                    </div>
                                    <p className="help-block">
                                        Pracownik może wyświetlić dane
                                        kontaktowe maksymalnie tylu klientów
                                        dziennie.
                                    </p>
                                </div>

                                <div className="form-group">
                                    <label className="control-label">
                                        E-mail powiadomień
                                    </label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        value={paranoiaEmail}
                                        onChange={(e) =>
                                            setParanoiaEmail(e.target.value)
                                        }
                                        placeholder="np. admin@salon.pl"
                                    />
                                    <p className="help-block">
                                        Na ten adres będą wysyłane powiadomienia
                                        o przekroczeniu limitu.
                                    </p>
                                </div>

                                <div className="form-group">
                                    <h2>Indywidualne limity dla pracowników</h2>
                                    <p className="help-block">
                                        Konfiguracja indywidualnych limitów dla
                                        poszczególnych pracowników jest dostępna
                                        w ustawieniach pracownika.
                                    </p>
                                </div>
                            </>
                        )}

                        <PanelActionBar
                            primary={
                                <button
                                    type="submit"
                                    className="btn button-blue"
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
            </div>
        </div>
    );
}
