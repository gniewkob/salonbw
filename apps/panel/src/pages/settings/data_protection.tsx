import Link from 'next/link';
import { useState } from 'react';
import { useSetSecondaryNav } from '@/contexts/SecondaryNavContext';
import CustomerSettingsNav from '@/components/settings/CustomerSettingsNav';

const NAV = <CustomerSettingsNav />;

export default function SettingsDataProtectionPage() {
    useSetSecondaryNav(NAV);

    const [enabled, setEnabled] = useState(false);

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
                <div className="inner edit_branch_form">
                    <h2>Tryb ochrony danych</h2>
                    <p className="text-muted">
                        Tryb ochrony danych (RODO) ukrywa wrażliwe dane klientów
                        przed nieautoryzowanym dostępem.
                    </p>
                    <div className="form-group">
                        <label className="control-label">
                            Status trybu ochrony danych
                        </label>
                        <div>
                            <label className="radio-inline">
                                <input
                                    type="radio"
                                    name="data_protection"
                                    checked={!enabled}
                                    onChange={() => setEnabled(false)}
                                />{' '}
                                Wyłączony
                            </label>
                            <label className="radio-inline">
                                <input
                                    type="radio"
                                    name="data_protection"
                                    checked={enabled}
                                    onChange={() => setEnabled(true)}
                                />{' '}
                                Włączony
                            </label>
                        </div>
                    </div>
                    {enabled && (
                        <div className="alert alert-warning">
                            Tryb ochrony danych jest włączony. Dane osobowe
                            klientów są ukryte.
                        </div>
                    )}
                    <div className="form-group">
                        <button
                            type="button"
                            className="btn button-blue"
                            disabled
                        >
                            Zapisz
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
