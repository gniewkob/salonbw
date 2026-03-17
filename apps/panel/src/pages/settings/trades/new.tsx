import Link from 'next/link';
import { useState } from 'react';
import { useSetSecondaryNav } from '@/contexts/SecondaryNavContext';

const NAV = (
    <div className="sidenav secondarynav" id="sidenav">
        <div className="column_row tree other_settings">
            <h4>Ustawienia usług</h4>
            <ul>
                <li>
                    <Link href="/settings/trades/new" className="active">
                        <div className="icon_box">
                            <span className="icon sprite-settings_services_nav" />
                        </div>
                        Branże
                    </Link>
                </li>
            </ul>
        </div>
    </div>
);

export default function SettingsTradesNewPage() {
    useSetSecondaryNav(NAV);

    const [name, setName] = useState('');

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
                            Ustawienia usług
                        </li>
                        <li>
                            <span> / </span>
                            Branże
                        </li>
                        <li>
                            <span> / </span>
                            Nowa branża
                        </li>
                    </ul>
                </div>
                <div className="inner edit_branch_form">
                    <div className="alert alert-info">
                        Trasa została zachowana dla parity IA względem Versum,
                        ale moduł branż nie ma jeszcze osobnego backendu w
                        salonbw. Ten ekran jest sklasyfikowany jako invented, a
                        zapis pozostaje poza zakresem aktualnego wdrożenia.
                    </div>
                    <form>
                        <h2>Dodaj branżę</h2>
                        <div className="form-group">
                            <label htmlFor="name" className="control-label">
                                Nazwa
                            </label>
                            <input
                                id="name"
                                type="text"
                                className="form-control"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <button
                                type="button"
                                className="btn button-blue"
                                disabled
                                title="Backend branż nie jest jeszcze dostępny."
                            >
                                Zapis niedostępny
                            </button>
                            <Link
                                href="/settings"
                                className="btn btn-default"
                                style={{ marginLeft: 8 }}
                            >
                                Anuluj
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
